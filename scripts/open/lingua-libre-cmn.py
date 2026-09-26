#!/usr/bin/env python3
"""Manifest of Lingua Libre Mandarin word recordings (Wikimedia Commons) for HSK 1-2 words.

Source   : https://commons.wikimedia.org/wiki/Category:Lingua_Libre_pronunciation-cmn
License  : per file (Lingua Libre default CC BY-SA 4.0) - read from Commons extmetadata.
Audio is NOT downloaded; the manifest stores the Commons file URL.

Target words = data/hsk_words.json levels 1-2  UNION  zhongdex HSK 3.0 (2026) bands 1-2
(content/open/zhongdex/words.json, if present). Titles look like
"File:LL-Q9192 (cmn)-<speaker>-<word>.wav"; the word is matched against the target set
(simplified, or traditional converted with OpenCC t2s). Capped at 2,000 files.

Raw cache: /home/claude/open-media/raw/lingua-libre/  (category titles + imageinfo)
Output   : content/open/lingua-libre-cmn/manifest.json

Run from the repo root:  python3 scripts/open/lingua-libre-cmn.py
"""
import collections
import html
import json
import os
import re
import sys
import time

import opencc
import requests

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.environ.get("LINGUA_LIBRE_RAW", "/home/claude/open-media/raw/lingua-libre")
OUT = os.path.join(REPO, "content", "open", "lingua-libre-cmn")
HSK_WORDS = os.path.join(REPO, "data", "hsk_words.json")
ZHONGDEX_WORDS = os.path.join(REPO, "content", "open", "zhongdex", "words.json")
API = "https://commons.wikimedia.org/w/api.php"
CATEGORY = "Category:Lingua_Libre_pronunciation-cmn"
UA = "BuunduuOpenIngest/1.0 (educational HSK app data ingest; https://github.com/baldansan/baldansan)"
MAX_FILES = 2000

S = requests.Session()
S.headers["User-Agent"] = UA
T2S = opencc.OpenCC("t2s")


def api(params):
    params = dict(params, format="json", maxlag=5)
    for attempt in range(8):
        r = S.get(API, params=params, timeout=60)
        if r.status_code == 429 or "maxlag" in r.text[:200]:
            wait = int(r.headers.get("Retry-After", "0") or 0) or 30 * (attempt + 1)
            print(f"  rate-limited, sleeping {wait}s", file=sys.stderr)
            time.sleep(wait)
            continue
        r.raise_for_status()
        time.sleep(0.3)
        return r.json()
    raise SystemExit("Commons API kept rate-limiting; try later")


def category_titles():
    cache = os.path.join(RAW, "cmn-category-titles.json")
    if os.path.exists(cache):
        return json.load(open(cache, encoding="utf-8"))
    titles = []
    p = {"action": "query", "list": "categorymembers", "cmtitle": CATEGORY, "cmtype": "file", "cmlimit": "500"}
    while True:
        r = api(p)
        titles += [m["title"] for m in r["query"]["categorymembers"]]
        if "continue" not in r:
            break
        p.update(r["continue"])
    json.dump(titles, open(cache, "w", encoding="utf-8"), ensure_ascii=False)
    return titles


def targets():
    t = {}
    for w in json.load(open(HSK_WORDS, encoding="utf-8")):
        if str(w["hsk_level"]) in ("1", "2"):
            t.setdefault(w["simplified"], {})["level_app"] = int(w["hsk_level"])
    if os.path.exists(ZHONGDEX_WORDS):
        for w in json.load(open(ZHONGDEX_WORDS, encoding="utf-8")):
            if w["level"] in (1, 2):
                d = t.setdefault(w["zh"], {})
                d["level_2026"] = min(w["level"], d.get("level_2026", 9))
    return t


TITLE = re.compile(r"^File:LL-Q\d+ \(cmn\)-(.+)\.(wav|ogg|flac|mp3|webm)$", re.I)


def parse(title, tset):
    """Return (speaker, word_as_written, simplified) or None."""
    m = TITLE.match(title)
    if not m:
        return None
    rest = m.group(1)
    for i, ch in enumerate(rest):
        if ch != "-":
            continue
        word = rest[i + 1:].strip()
        simp = T2S.convert(word)
        if simp in tset:
            return rest[:i], word, simp
    return None


def strip_html(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def main():
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    tset = targets()
    titles = category_titles()
    stats = collections.Counter(category_files=len(titles), target_words=len(tset))

    matched = []
    for t in titles:
        p = parse(t, tset)
        if p:
            matched.append((t,) + p)
        else:
            stats["not_hsk1_2_or_unparsed"] += 1
    # Prefer the lowest level, then spread over words (one per word first), then title
    def lv(simp):
        d = tset[simp]
        return min(d.get("level_app", 9), d.get("level_2026", 9))
    matched.sort(key=lambda x: (lv(x[3]), x[3], x[0]))
    by_word = collections.defaultdict(list)
    for m in matched:
        by_word[m[3]].append(m)
    ordered, rnd = [], 0
    while len(ordered) < len(matched):
        for w in sorted(by_word, key=lambda w: (lv(w), w)):
            if rnd < len(by_word[w]):
                ordered.append(by_word[w][rnd])
        rnd += 1
    stats["matched_files"] = len(matched)
    stats["matched_words"] = len(by_word)
    chosen = ordered[:MAX_FILES]

    info_cache = os.path.join(RAW, "imageinfo.json")
    info = json.load(open(info_cache, encoding="utf-8")) if os.path.exists(info_cache) else {}
    need = [c[0] for c in chosen if c[0] not in info]
    for i in range(0, len(need), 50):
        batch = need[i:i + 50]
        r = api({"action": "query", "prop": "imageinfo", "titles": "|".join(batch),
                 "iiprop": "url|user|size|extmetadata",
                 "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|Attribution"})
        norm = {n["to"]: n["from"] for n in r["query"].get("normalized", [])}
        for page in r["query"]["pages"].values():
            ii = (page.get("imageinfo") or [{}])[0]
            em = ii.get("extmetadata") or {}
            info[norm.get(page["title"], page["title"])] = {
                "url": ii.get("url"), "descriptionurl": ii.get("descriptionurl"), "user": ii.get("user"),
                "size": ii.get("size"),
                "license": (em.get("LicenseShortName") or {}).get("value"),
                "license_url": (em.get("LicenseUrl") or {}).get("value"),
                "artist": strip_html((em.get("Artist") or {}).get("value")),
            }
        json.dump(info, open(info_cache, "w", encoding="utf-8"), ensure_ascii=False)
        print(f"  imageinfo {min(i + 50, len(need))}/{len(need)}", file=sys.stderr)

    ok_lic = re.compile(r"^(CC BY(-SA)? [0-9.]+|CC0|Public domain)", re.I)
    items = []
    for title, speaker, written, simp in chosen:
        ii = info.get(title) or {}
        if not ii.get("url"):
            stats["skip_missing_imageinfo"] += 1
            continue
        lic = ii.get("license") or ""
        if not ok_lic.match(lic):
            stats[f"skip_license:{lic or 'none'}"] += 1
            continue
        d = tset[simp]
        artist = ii.get("artist") or ""
        m_sp = re.search(r"Speaker:\s*(.+)", artist)
        m_rec = re.search(r"Recorder:\s*(.+)", artist)
        spk = m_sp.group(1).strip() if m_sp else (artist or speaker)
        items.append({
            "zh": simp,
            "zh_written": written if written != simp else None,
            "file_url": ii["url"].split("?")[0],
            "page_url": ii.get("descriptionurl"),
            "speaker": spk,
            "recorder": m_rec.group(1).strip() if m_rec else None,
            "uploader": ii.get("user"),
            "size": ii.get("size"),
            "license": lic,
            "license_url": ii.get("license_url"),
            "level_app": d.get("level_app"),
            "level_2026": d.get("level_2026"),
            "source": "Lingua Libre / Wikimedia Commons",
            "attribution": f"{spk} (Lingua Libre), {lic}, via Wikimedia Commons ({ii.get('descriptionurl')})",
        })
    for it in items:
        if it["zh_written"] is None:
            del it["zh_written"]
    items.sort(key=lambda x: (min(x["level_app"] or 9, x["level_2026"] or 9), x["zh"], x["file_url"]))
    json.dump(items, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    stats["kept"] = len(items)
    stats["kept_words"] = len({i["zh"] for i in items})
    stats["kept_words_level_app_1_2"] = len({i["zh"] for i in items if i["level_app"]})
    print(dict(stats))
    print("licenses", dict(collections.Counter(i["license"] for i in items)))
    print("speakers", collections.Counter(i["speaker"] for i in items).most_common(10))


if __name__ == "__main__":
    sys.exit(main())
