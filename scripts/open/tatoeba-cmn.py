#!/usr/bin/env python3
"""Ingest Tatoeba Mandarin (cmn) sentences with English translations and cmn<->mon pairs.

License: CC BY 2.0 FR (https://creativecommons.org/licenses/by/2.0/fr/); a handful of
sentences are CC0 (listed in cmn_sentences_CC0.tsv). Attribution per sentence = the
sentence page https://tatoeba.org/sentences/show/<id> + the contributor username.

Raw input : /home/claude/open-media/raw/tatoeba  (per-language weekly exports; downloaded if missing)
  cmn_sentences_detailed.tsv  id, lang, text, username, added, modified
  cmn_transcriptions.tsv      id, lang, script(Hans|Hant|Latn), username(\\N = auto), text
  cmn-eng_links.tsv, cmn-mon_links.tsv   cmn_id, other_id
  eng_sentences_detailed.tsv, mon_sentences_detailed.tsv
  cmn_sentences_CC0.tsv
Outputs   : content/open/tatoeba-cmn/sentences.json, content/open/tatoeba-cmn/zh-mn.json

Filter: <= 20 Han characters, no Latin letters/digits, >= 90 % of Han characters inside the
HSK 1-4 character set of data/hsk_words.json, at least one English translation; dedupe on
simplified text; keep up to 20,000 (lowest level first, then shortest).

Run from the repo root:  python3 scripts/open/tatoeba-cmn.py
"""
import bz2
import collections
import json
import os
import re
import sys
import urllib.request

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.environ.get("TATOEBA_RAW", "/home/claude/open-media/raw/tatoeba")
OUT = os.path.join(REPO, "content", "open", "tatoeba-cmn")
HSK_WORDS = os.path.join(REPO, "data", "hsk_words.json")
BASE = "https://downloads.tatoeba.org/exports/per_language"
FILES = {
    "cmn_sentences_detailed.tsv": "cmn/cmn_sentences_detailed.tsv.bz2",
    "cmn_transcriptions.tsv": "cmn/cmn_transcriptions.tsv.bz2",
    "cmn-eng_links.tsv": "cmn/cmn-eng_links.tsv.bz2",
    "cmn-mon_links.tsv": "cmn/cmn-mon_links.tsv.bz2",
    "cmn_sentences_CC0.tsv": "cmn/cmn_sentences_CC0.tsv.bz2",
    "eng_sentences_detailed.tsv": "eng/eng_sentences_detailed.tsv.bz2",
    "mon_sentences_detailed.tsv": "mon/mon_sentences_detailed.tsv.bz2",
}
MAX_KEEP = 20000
MAX_HAN = 20
MIN_RATIO = 0.9

SOURCE = "Tatoeba"
LICENSE = "CC BY 2.0 FR"
HAN = re.compile(r"[㐀-鿿\U00020000-\U0002ffff]")
LATIN_DIGIT = re.compile(r"[A-Za-z0-9Ａ-Ｚａ-ｚ０-９]")


def ensure_raw():
    os.makedirs(RAW, exist_ok=True)
    for name, rel in FILES.items():
        p = os.path.join(RAW, name)
        if not os.path.exists(p):
            print("download", rel)
            req = urllib.request.Request(f"{BASE}/{rel}", headers={"User-Agent": "buunduu-open-ingest/1.0"})
            data = urllib.request.urlopen(req).read()
            open(p, "wb").write(bz2.decompress(data))


def tsv(name):
    with open(os.path.join(RAW, name), encoding="utf-8") as f:
        for line in f:
            yield line.rstrip("\n").split("\t")


def user(u):
    return None if u in ("\\N", "") else u


# ---------- numbered pinyin -> tone marks ----------
TONES = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}
SYL = re.compile(r"([A-Za-züÜv:]+?)([1-5])")


def mark_syllable(s, tone):
    s = s.replace("u:", "ü").replace("U:", "Ü").replace("v", "ü").replace("V", "Ü")
    if tone == 5:
        return s
    low = s.lower()
    if "a" in low:
        i = low.index("a")
    elif "e" in low:
        i = low.index("e")
    elif "ou" in low:
        i = low.index("o")
    else:
        i = max(low.rfind(v) for v in "iouü")
        if i < 0:  # syllabic nasal (m, n, ng) - leave unmarked
            return s
    ch = low[i]
    m = TONES[ch][tone - 1]
    if s[i].isupper():
        m = m.upper()
    return s[:i] + m + s[i + 1:]


def numbered_to_marks(text):
    out = []
    for tok in text.split():
        out.append(SYL.sub(lambda m: mark_syllable(m.group(1), int(m.group(2))), tok))
    s = " ".join(out)
    s = re.sub(r"(\w) r\b", r"\1r", s)  # erhua written as a separate "r5" token
    s = re.sub(r"\s+([,.!?;:)\]»”’])", r"\1", s)
    s = re.sub(r"([(\[«“‘])\s+", r"\1", s)
    return s.strip()


# ---------- HSK level (app's data/hsk_words.json) ----------
def lvl_num(v):
    s = str(v)
    return 7 if s.startswith("7") else int(s)


class AppLevel:
    def __init__(self, path):
        self.lv = {}
        for w in json.load(open(path, encoding="utf-8")):
            s, l = w["simplified"], lvl_num(w["hsk_level"])
            self.lv[s] = min(l, self.lv.get(s, 99))
        self.maxlen = max(len(k) for k in self.lv)
        self.char_lv = {}
        for s, l in self.lv.items():
            for c in s:
                self.char_lv[c] = min(l, self.char_lv.get(c, 99))
        self.chars_1_4 = {c for c, l in self.char_lv.items() if l <= 4}

    def level(self, text):
        i, best = 0, 0
        while i < len(text):
            if not HAN.match(text[i]):
                i += 1
                continue
            for n in range(min(self.maxlen, len(text) - i), 0, -1):
                if text[i:i + n] in self.lv:
                    best = max(best, self.lv[text[i:i + n]])
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

    cc0 = {r[0] for r in tsv("cmn_sentences_CC0.tsv") if r and r[0]}
    cmn = {}
    for r in tsv("cmn_sentences_detailed.tsv"):
        cmn[r[0]] = {"text": r[2], "user": user(r[3])}
    hans, latn = {}, {}
    for r in tsv("cmn_transcriptions.tsv"):
        sid, script, u, text = r[0], r[2], user(r[3]), r[4]
        if script == "Hans":
            hans[sid] = text
        elif script == "Latn":
            latn[sid] = (text, u)

    def simplified(sid):
        # A Hans transcription exists only when the original is written in traditional script.
        return hans.get(sid, cmn[sid]["text"])

    eng_links = collections.defaultdict(list)
    for a, b in tsv("cmn-eng_links.tsv"):
        eng_links[a].append(b)
    need_eng = {b for v in eng_links.values() for b in v}
    eng = {}
    for r in tsv("eng_sentences_detailed.tsv"):
        if r[0] in need_eng:
            eng[r[0]] = {"text": r[2], "user": user(r[3])}

    def pinyin_for(sid):
        if sid in latn:
            text, u = latn[sid]
            return numbered_to_marks(text), ("tatoeba-reviewed" if u else "tatoeba-auto")
        from pypinyin import Style, lazy_pinyin  # fallback, syllable-spaced
        return " ".join(lazy_pinyin(simplified(sid), style=Style.TONE)), "pypinyin"

    def lic(sid):
        return "CC0 1.0" if sid in cc0 else LICENSE

    def attribution(sid, u):
        return f"Tatoeba #{sid} by {u or 'unknown'} (https://tatoeba.org/sentences/show/{sid}), {lic(sid)}"

    # ---------- zh -> en ----------
    stats = collections.Counter()
    cands, seen = [], set()
    for sid in sorted(cmn, key=int):
        stats["cmn_total"] += 1
        links = [e for e in eng_links.get(sid, []) if e in eng]
        if not links:
            stats["skip_no_english"] += 1
            continue
        zh = simplified(sid).strip()
        han = HAN.findall(zh)
        if not han:
            stats["skip_no_han"] += 1
            continue
        if len(han) > MAX_HAN:
            stats["skip_over_20_chars"] += 1
            continue
        if LATIN_DIGIT.search(zh):
            stats["skip_latin_or_digits"] += 1
            continue
        ratio = sum(1 for c in han if c in app.chars_1_4) / len(han)
        if ratio < MIN_RATIO:
            stats["skip_below_90pct_hsk1_4_chars"] += 1
            continue
        if zh in seen:
            stats["skip_duplicate_text"] += 1
            continue
        seen.add(zh)
        eid = min(links, key=int)
        py, pysrc = pinyin_for(sid)
        cands.append({
            "id": int(sid),
            "zh": zh,
            "pinyin": py,
            "pinyin_src": pysrc,
            "en": eng[eid]["text"],
            "en_id": int(eid),
            "level": app.level(zh),
            "hsk14_ratio": round(ratio, 2),
            "trad_original": sid in hans,
            "author": cmn[sid]["user"],
            "en_author": eng[eid]["user"],
            "source": SOURCE,
            "license": lic(sid),
            "attribution": attribution(sid, cmn[sid]["user"]),
        })
    stats["candidates"] = len(cands)
    cands.sort(key=lambda s: (s["level"] or 9, len(s["zh"]), s["id"]))
    keep = cands[:MAX_KEEP]
    stats["kept"] = len(keep)
    stats["dropped_over_cap"] = len(cands) - len(keep)
    keep.sort(key=lambda s: s["id"])
    json.dump(keep, open(os.path.join(OUT, "sentences.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    # ---------- zh <-> mn ----------
    mon = {r[0]: {"text": r[2], "user": user(r[3])} for r in tsv("mon_sentences_detailed.tsv")}
    pairs = []
    for a, b in tsv("cmn-mon_links.tsv"):
        if a not in cmn or b not in mon:
            stats["zh_mn_missing_side"] += 1
            continue
        zh = simplified(a)
        py, pysrc = pinyin_for(a)
        pairs.append({
            "id": int(a),
            "zh": zh,
            "pinyin": py,
            "pinyin_src": pysrc,
            "mn": mon[b]["text"],
            "mn_id": int(b),
            "level": app.level(zh),
            "author": cmn[a]["user"],
            "mn_author": mon[b]["user"],
            "source": SOURCE,
            "license": lic(a),
            "attribution": attribution(a, cmn[a]["user"]) + f"; mn #{b} by {mon[b]['user'] or 'unknown'}",
        })
    pairs.sort(key=lambda p: p["id"])
    json.dump(pairs, open(os.path.join(OUT, "zh-mn.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    stats["zh_mn_pairs"] = len(pairs)

    print(dict(stats))
    print("level dist", dict(sorted(collections.Counter(s["level"] for s in keep).items())))
    print("pinyin src", dict(collections.Counter(s["pinyin_src"] for s in keep)))
    print("trad originals converted", sum(s["trad_original"] for s in keep))


if __name__ == "__main__":
    sys.exit(main())
