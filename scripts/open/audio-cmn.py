#!/usr/bin/env python3
"""Ingest audio-cmn (github.com/hugolpz/audio-cmn) human Mandarin audio. License: CC BY-SA.

- 1,707 tone-marked syllables (speaker Chen Wang), 64 kbps mono mp3 -> copied into the repo at
  public/open/audio-cmn/syllables/ (about 17 MB, under the 25 MB budget, so no re-encoding).
- HSK 2000 word/character recordings (speaker Yue Tan, from Shtooka cmn-caen-tan), 64 kbps ->
  NOT in the repo; copied to /home/claude/open-media/audio-cmn/words/ and listed in the manifest.

Raw input : /home/claude/open-media/raw/audio-cmn  (partial clone, sparse checkout; created if missing)
Output    : content/open/audio-cmn/manifest.json

Run from the repo root:  python3 scripts/open/audio-cmn.py
"""
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.parse

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.environ.get("AUDIO_CMN_RAW", "/home/claude/open-media/raw/audio-cmn")
MEDIA = "/home/claude/open-media/audio-cmn"
OUT = os.path.join(REPO, "content", "open", "audio-cmn")
PUB = os.path.join(REPO, "public", "open", "audio-cmn", "syllables")
HSK_WORDS = os.path.join(REPO, "data", "hsk_words.json")
RAW_URL = "https://raw.githubusercontent.com/hugolpz/audio-cmn/master/"
SYL_DIR, WORD_DIR = "64k/syllabs", "64k/hsk"
BUDGET = 25 * 1024 * 1024

LICENSE = "CC BY-SA"
LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/"


def ensure_raw():
    if os.path.isdir(os.path.join(RAW, SYL_DIR)) and os.path.isdir(os.path.join(RAW, WORD_DIR)):
        return
    if not os.path.isdir(RAW):
        subprocess.check_call(["git", "clone", "--depth", "1", "--filter=blob:none", "--no-checkout",
                               "https://github.com/hugolpz/audio-cmn", RAW])
    subprocess.check_call(["git", "-C", RAW, "sparse-checkout", "init", "--no-cone"])
    with open(os.path.join(RAW, ".git", "info", "sparse-checkout"), "w") as f:
        f.write(f"README.md\nlists/\n{SYL_DIR}/\n{WORD_DIR}/\n")
    subprocess.check_call(["git", "-C", RAW, "checkout", "HEAD"])


TONES = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}


def mark(num):
    """'lv3' -> 'lǚ', 'ma5' -> 'ma'. Syllabic nasals (m, n, ng, hm, hng) stay unmarked."""
    m = re.fullmatch(r"([a-zü:v]+)([1-5])", num)
    if not m:
        return num
    s, tone = m.group(1).replace("u:", "ü").replace("v", "ü"), int(m.group(2))
    if tone == 5:
        return s
    if "a" in s:
        i = s.index("a")
    elif "e" in s:
        i = s.index("e")
    elif "ou" in s:
        i = s.index("o")
    else:
        i = max(s.rfind(v) for v in "iouü")
        if i < 0:
            return s
    return s[:i] + TONES[s[i]][tone - 1] + s[i + 1:]


NOT_ERHUA = {"女儿", "婴儿", "幼儿", "孤儿", "健儿", "胎儿", "儿"}


def py_word(part):
    """pypinyin for one word, with a trailing 儿 written as erhua (一会儿 -> yīhuìr)."""
    from pypinyin import Style, lazy_pinyin
    if len(part) > 1 and part.endswith("儿") and part not in NOT_ERHUA:
        return "".join(lazy_pinyin(part[:-1], style=Style.TONE)) + "r"
    return "".join(lazy_pinyin(part, style=Style.TONE))


def main():
    ensure_raw()
    os.makedirs(OUT, exist_ok=True)
    commit = subprocess.run(["git", "-C", RAW, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()

    # ---------- syllables ----------
    syl_files = sorted(f for f in os.listdir(os.path.join(RAW, SYL_DIR)) if f.endswith(".mp3"))
    total = sum(os.path.getsize(os.path.join(RAW, SYL_DIR, f)) for f in syl_files)
    if total > BUDGET:
        raise SystemExit(f"syllables {total} B exceed budget; re-encode with ffmpeg -ac 1 -b:a 48k first")
    os.makedirs(PUB, exist_ok=True)
    syllables = []
    for f in syl_files:
        src = os.path.join(RAW, SYL_DIR, f)
        shutil.copy2(src, os.path.join(PUB, f))
        key = f[4:-4]  # strip 'cmn-' and '.mp3'
        marginal = key.startswith("_")
        num = key.lstrip("_")
        tone = int(num[-1]) if num[-1].isdigit() else None
        syllables.append({
            "pinyin": mark(num),
            "pinyin_num": num.replace("v", "ü"),
            "tone": tone,
            "marginal": marginal,
            "file": f"/open/audio-cmn/syllables/{f}",
            "size": os.path.getsize(src),
        })

    # ---------- words ----------
    lv, app_py = {}, {}
    for w in json.load(open(HSK_WORDS, encoding="utf-8")):
        app_py.setdefault(w["simplified"], w["pinyin"].replace(" ", ""))
        l = 7 if str(w["hsk_level"]).startswith("7") else int(w["hsk_level"])
        lv[w["simplified"]] = min(l, lv.get(w["simplified"], 99))
    dst_dir = os.path.join(MEDIA, "words")
    os.makedirs(dst_dir, exist_ok=True)
    words = []
    for f in sorted(os.listdir(os.path.join(RAW, WORD_DIR))):
        if not f.endswith(".mp3"):
            continue
        src = os.path.join(RAW, WORD_DIR, f)
        dst = os.path.join(dst_dir, f)
        if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src):
            shutil.copy2(src, dst)
        key = f[4:-4]
        zh = key.replace("_", "…")  # '一_也_' is the pattern 一…也…
        han = key.replace("_", "")
        words.append({
            "zh": zh,
            "pinyin": app_py.get(han) or " … ".join(py_word(part) for part in key.split("_")).strip(),
            "pinyin_src": "hsk_words" if han in app_py else "pypinyin",
            "file": f"words/{f}",
            "url": RAW_URL + urllib.parse.quote(f"{WORD_DIR}/{f}"),
            "size": os.path.getsize(src),
            "level": lv.get(han),
        })

    manifest = {
        "source": "audio-cmn (https://github.com/hugolpz/audio-cmn)",
        "commit": commit,
        "license": LICENSE,
        "license_url": LICENSE_URL,
        "attribution": {
            "syllables": "Mandarin syllable recordings by Chen Wang, audio-cmn (Hugo Lopez, PLIDAM/INALCO), CC BY-SA",
            "words": "Mandarin word recordings by Yue Tan (Shtooka cmn-caen-tan), via audio-cmn (Hugo Lopez), CC BY-SA",
        },
        "syllables_base": "public/ (served at /open/audio-cmn/syllables/)",
        "words_base": MEDIA + "/ (not in repo; 'url' is the upstream raw file)",
        "counts": {"syllables": len(syllables), "syllables_bytes": total,
                   "words": len(words), "words_bytes": sum(w["size"] for w in words)},
        "syllables": syllables,
        "words": words,
    }
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump(manifest, open(os.path.join(MEDIA, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("commit", commit)
    print(manifest["counts"])
    print("words with app HSK level", sum(1 for w in words if w["level"]))
    print("marginal syllables", sum(s["marginal"] for s in syllables))


if __name__ == "__main__":
    sys.exit(main())
