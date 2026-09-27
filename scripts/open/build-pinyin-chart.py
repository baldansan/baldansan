#!/usr/bin/env python3
"""Build the pinyin chart + two-syllable tone-pair lists for the «Дуудлага / 发音» section.

Input : content/open/audio-cmn/manifest.json  (human syllable recordings, CC BY-SA)
        data/hsk_words.json                    (HSK 1-3 two-syllable words)
Output: public/data/pinyin_chart.json  { initials, finals, cells: { "<syllable>": { initial, final, tones: {"1": "/open/…mp3", …} } } }
        public/data/tone_pairs.json    { "11": [{zh, pinyin, mn, level}], "12": …, "10": … }   (0 = neutral tone)

Run from the repo root:  python3 scripts/open/build-pinyin-chart.py
"""
import json
import os
import re
import unicodedata

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MANIFEST = os.path.join(REPO, "content", "open", "audio-cmn", "manifest.json")
HSK_WORDS = os.path.join(REPO, "data", "hsk_words.json")
OUT_CHART = os.path.join(REPO, "public", "data", "pinyin_chart.json")
OUT_PAIRS = os.path.join(REPO, "public", "data", "tone_pairs.json")

# 21 standard initials + zero initial ("∅"); order = the standard chart order.
INITIALS = ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h",
            "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s", "∅"]

# Standard finals in chart order (simple, i-group, u-group, ü-group).
FINALS = ["a", "o", "e", "i", "u", "ü", "er",
          "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong",
          "ia", "ie", "iao", "iu", "ian", "in", "iang", "ing", "iong",
          "ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng",
          "üe", "üan", "ün"]

# Zero-initial spelled forms → underlying final (the column they sit in).
ZERO_FORMS = {
    "a": "a", "o": "o", "e": "e", "er": "er", "ai": "ai", "ei": "ei", "ao": "ao", "ou": "ou",
    "an": "an", "en": "en", "ang": "ang", "eng": "eng",
    "yi": "i", "ya": "ia", "ye": "ie", "yao": "iao", "you": "iu", "yan": "ian", "yin": "in",
    "yang": "iang", "ying": "ing", "yong": "iong",
    "wu": "u", "wa": "ua", "wo": "uo", "wai": "uai", "wei": "ui", "wan": "uan", "wen": "un",
    "wang": "uang", "weng": "ueng",
    "yu": "ü", "yue": "üe", "yuan": "üan", "yun": "ün",
}

# Non-marginal upstream syllables that are NOT in the standard table (dialect / duplicates).
DROP = {"jü", "fe", "fiao", "yai"}

# j/q/x + u… is the ü column (ju = jü).
U_TO_UMLAUT = {"u": "ü", "ue": "üe", "uan": "üan", "un": "ün"}


def split_syllable(syl):
    """'zhuang' -> ('zh','uang'); 'yi' -> ('∅','i'); 'ju' -> ('j','ü'). None if not standard."""
    if syl in ZERO_FORMS:
        return "∅", ZERO_FORMS[syl]
    for ini in ("zh", "ch", "sh"):
        if syl.startswith(ini):
            fin = syl[len(ini):]
            return (ini, fin) if fin in FINALS else None
    ini, fin = syl[0], syl[1:]
    if ini not in INITIALS or ini == "∅":
        return None
    if ini in ("j", "q", "x") and fin in U_TO_UMLAUT:
        fin = U_TO_UMLAUT[fin]
    return (ini, fin) if fin in FINALS else None


def build_chart(manifest):
    cells = {}
    dropped = []
    for s in manifest["syllables"]:
        base = re.sub(r"[1-5]$", "", s["pinyin_num"])
        if s["marginal"] and base not in ZERO_FORMS and split_syllable(base) is None:
            continue  # marginal and not in the standard table
        if base in DROP:
            dropped.append(base)
            continue
        parts = split_syllable(base)
        if parts is None:
            dropped.append(base)
            continue
        ini, fin = parts
        cell = cells.setdefault(base, {"initial": ini, "final": fin, "tones": {}})
        cell["tones"][str(s["tone"])] = s["file"]
    used_finals = {c["final"] for c in cells.values()}
    used_initials = {c["initial"] for c in cells.values()}
    return {
        "source": "audio-cmn syllables (Chen Wang), CC BY-SA — see content/open/audio-cmn/README.md",
        "initials": [i for i in INITIALS if i in used_initials],
        "finals": [f for f in FINALS if f in used_finals],
        "cells": dict(sorted(cells.items())),
    }, sorted(set(dropped))


# ---- tone pairs -------------------------------------------------------------

TONE_OF_MARK = {}
for base, marks in {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}.items():
    for t, m in enumerate(marks, start=1):
        TONE_OF_MARK[m] = t
for m, t in {"ḿ": 2, "ń": 2, "ň": 3, "ǹ": 4}.items():
    TONE_OF_MARK[m] = t


def syllable_tone(part):
    """Same rule as lib/speech/pinyin-tones.ts parsePinyinSyllables: 'ma3' -> 3, 'mǎ' -> 3, 'ma' -> 0."""
    part = unicodedata.normalize("NFC", part)
    m = re.search(r"([1-5])$", part)
    if m:
        n = int(m.group(1))
        return 0 if n == 5 else n
    for ch in part:
        if ch in TONE_OF_MARK:
            return TONE_OF_MARK[ch]
    return 0


def parse_pinyin(pinyin):
    parts = [p.strip() for p in re.split(r"[\s'’·,，]+", unicodedata.normalize("NFC", pinyin)) if p.strip()]
    return [(p, syllable_tone(p)) for p in parts]


def build_tone_pairs(words, limit=25):
    groups = {}
    for w in words:
        lvl = str(w.get("hsk_level", ""))
        if lvl not in ("1", "2", "3"):
            continue
        zh = w["simplified"]
        if len(zh) != 2 or not w.get("pinyin"):
            continue
        syls = parse_pinyin(w["pinyin"])
        if len(syls) != 2:
            continue
        if syls[0][1] == 0:
            continue  # a neutral first syllable (的话) is not a tone pattern
        key = f"{syls[0][1]}{syls[1][1]}"
        groups.setdefault(key, []).append({
            "zh": zh,
            "pinyin": " ".join(s for s, _ in syls),
            "mn": w.get("meaning_mn") or "",
            "level": int(lvl),
        })
    out = {}
    for key in sorted(groups):
        seen, items = set(), []
        for it in sorted(groups[key], key=lambda x: (x["level"], x["zh"])):
            if it["zh"] in seen:
                continue
            seen.add(it["zh"])
            items.append(it)
            if len(items) >= limit:
                break
        out[key] = items
    return out


def main():
    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    chart, dropped = build_chart(manifest)
    os.makedirs(os.path.dirname(OUT_CHART), exist_ok=True)
    json.dump(chart, open(OUT_CHART, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    n_tones = sum(len(c["tones"]) for c in chart["cells"].values())
    print(f"pinyin_chart: {len(chart['cells'])} syllables, {n_tones} tone files, "
          f"{len(chart['initials'])} initials × {len(chart['finals'])} finals; dropped non-standard: {dropped}")

    words = json.load(open(HSK_WORDS, encoding="utf-8"))
    pairs = build_tone_pairs(words)
    json.dump(pairs, open(OUT_PAIRS, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("tone_pairs:", {k: len(v) for k, v in pairs.items()})


if __name__ == "__main__":
    main()
