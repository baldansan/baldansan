#!/usr/bin/env python3
"""Ingest zhongdex (github.com/saymei/zhongdex) graded sentences + HSK 3.0 word canon.

Data license: CC BY-SA 4.0 (data/ directory of the upstream repo). Code MIT.

Raw input : /home/claude/open-media/raw/zhongdex  (git clone --depth 1; cloned if missing)
Outputs   : content/open/zhongdex/sentences.json
            content/open/zhongdex/words.json
            content/open/zhongdex/compare-hsk_words.json  (overlap report vs data/hsk_words.json)

Run from the repo root:  python3 scripts/open/zhongdex.py
"""
import collections
import json
import os
import re
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.environ.get("ZHONGDEX_RAW", "/home/claude/open-media/raw/zhongdex")
OUT = os.path.join(REPO, "content", "open", "zhongdex")
HSK_WORDS = os.path.join(REPO, "data", "hsk_words.json")

SOURCE = "zhongdex"
LICENSE = "CC BY-SA 4.0"
ATTRIBUTION = "Zhongdex by SayMei, CC BY-SA 4.0 (github.com/saymei/zhongdex)"

HAN = re.compile(r"[㐀-鿿\U00020000-\U0002ffff]")


def ensure_raw():
    if not os.path.exists(os.path.join(RAW, "data", "sentences.jsonl")):
        os.makedirs(os.path.dirname(RAW), exist_ok=True)
        subprocess.check_call(["git", "clone", "--depth", "1", "https://github.com/saymei/zhongdex", RAW])


def lvl_num(v):
    """'1'..'6' -> 1..6, '7-9' / 7 -> 7."""
    if v is None:
        return None
    s = str(v)
    return 7 if s.startswith("7") else int(s)


class AppLevel:
    """Estimate HSK level with the app's own data/hsk_words.json (forward max matching)."""

    def __init__(self, path):
        words = json.load(open(path, encoding="utf-8"))
        self.lv = {}
        for w in words:
            s, l = w["simplified"], lvl_num(w["hsk_level"])
            self.lv[s] = min(l, self.lv.get(s, 99))
        self.maxlen = max(len(k) for k in self.lv)
        self.char_lv = {}
        for s, l in self.lv.items():
            for c in s:
                self.char_lv[c] = min(l, self.char_lv.get(c, 99))

    def level(self, text):
        i, best = 0, 0
        while i < len(text):
            if not HAN.match(text[i]):
                i += 1
                continue
            for n in range(min(self.maxlen, len(text) - i), 0, -1):
                t = text[i:i + n]
                if t in self.lv:
                    best = max(best, self.lv[t])
                    i += n
                    break
            else:
                best = max(best, self.char_lv.get(text[i], 7))
                i += 1
        return best or None


def main():
    ensure_raw()
    os.makedirs(OUT, exist_ok=True)
    app = AppLevel(HSK_WORDS)
    commit = subprocess.run(["git", "-C", RAW, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()

    # ---- sentences ----
    sents = []
    skipped = collections.Counter()
    seen = set()
    for line in open(os.path.join(RAW, "data", "sentences.jsonl"), encoding="utf-8"):
        r = json.loads(line)
        zh = r["hanzi"].strip()
        if not zh or not HAN.search(zh):
            skipped["no-han"] += 1
            continue
        if zh in seen:
            skipped["duplicate-text"] += 1
            continue
        seen.add(zh)
        nwc = r.get("newWordCount") or {}
        sents.append({
            "id": "zhongdex:" + r["id"].split(":")[-1],
            "zh": zh,
            "pinyin": r["pinyin"],
            "en": r.get("english") or None,
            "level": r["zsg"],
            "level_app": app.level(zh),
            "new_words": [nwc.get(str(k)) for k in range(1, 8)],
            "words": r.get("words") or [],
            "headwords": [h["simplified"] for h in r.get("headwords") or []],
            "source": SOURCE,
            "license": LICENSE,
            "attribution": ATTRIBUTION,
        })
    for s in sents:
        if s["en"] is None:
            del s["en"]
    sents.sort(key=lambda s: (s["level"], s["new_words"][0] if s["new_words"][0] is not None else 99, len(s["zh"]), s["id"]))
    json.dump(sents, open(os.path.join(OUT, "sentences.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    # ---- words ----
    ours = collections.defaultdict(set)
    for w in json.load(open(HSK_WORDS, encoding="utf-8")):
        ours[w["simplified"]].add(lvl_num(w["hsk_level"]))
    words = []
    for r in json.load(open(os.path.join(RAW, "data", "hsk_bands.json"), encoding="utf-8")):
        h = r["hsk"]
        fr = r.get("frequency") or {}
        words.append({
            "id": r["id"],
            "zh": r["simplified"],
            "trad": r["traditional"],
            "pinyin": r["pinyin"]["marked"],
            "pinyin_num": r["pinyin"]["numbered"],
            "pos": r.get("pos") or [],
            "level": h["band2026"],
            "band2021": lvl_num(h.get("band2021")),
            "band2_0": h.get("band2_0"),
            "list_id": h.get("listId"),
            "freq_rank": fr.get("rank"),
            "zipf": fr.get("zipf"),
            "radical": r.get("radical"),
            "en": [d["text"] for d in r.get("definitions") or []],
            "in_hsk_words": r["simplified"] in ours,
            "hsk_words_level": min(ours[r["simplified"]]) if r["simplified"] in ours else None,
            "source": SOURCE,
            "license": LICENSE,
        })
    json.dump(words, open(os.path.join(OUT, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    # ---- overlap report ----
    zd = collections.defaultdict(set)
    for w in words:
        zd[w["zh"]].add(w["level"])
    A, B = set(zd), set(ours)
    both = A & B
    agree = sum(1 for k in both if zd[k] & ours[k])
    diff = collections.Counter()
    for k in both:
        if not zd[k] & ours[k]:
            diff[f"ours {min(ours[k])} -> zhongdex {min(zd[k])}"] += 1
    report = {
        "zhongdex_commit": commit,
        "zhongdex_records": len(words),
        "zhongdex_distinct_forms": len(A),
        "hsk_words_distinct_forms": len(B),
        "overlap_forms": len(both),
        "only_in_zhongdex": len(A - B),
        "only_in_hsk_words": len(B - A),
        "overlap_level_agree": agree,
        "overlap_level_disagree": len(both) - agree,
        "level_disagreements_top": dict(diff.most_common(20)),
        "only_in_zhongdex_by_level": dict(sorted(collections.Counter(min(zd[k]) for k in A - B).items())),
        "only_in_hsk_words_by_level": dict(sorted(collections.Counter(min(ours[k]) for k in B - A).items())),
        "only_in_zhongdex_levels_1_3": sorted(k for k in A - B if min(zd[k]) <= 3),
        "only_in_hsk_words": sorted(B - A),
        "level_scale": "1-6, 7 = HSK 3.0 band 7-9",
    }
    json.dump(report, open(os.path.join(OUT, "compare-hsk_words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print("commit", commit)
    print("sentences", len(sents), "skipped", dict(skipped))
    print("level dist", dict(sorted(collections.Counter(s["level"] for s in sents).items())))
    print("words", len(words))
    print({k: v for k, v in report.items() if not isinstance(v, list)})


if __name__ == "__main__":
    sys.exit(main())
