#!/usr/bin/env python3
"""
CC-CEDICT (MDBG) татаж → data/dictionary/lexicon.json (gitignored).
Эх: https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz  (CC BY-SA 4.0)
Хэрэглээ: python scripts/dictionary/build_lexicon.py [--src path/to/cedict.u8]
"""
import argparse, gzip, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
OUT = os.path.join(ROOT, "data", "dictionary", "lexicon.json")
ap = argparse.ArgumentParser(); ap.add_argument("--src"); a = ap.parse_args()

if a.src:
    text = open(a.src, encoding="utf-8").read()
else:
    text = gzip.decompress(urllib.request.urlopen(URL, timeout=120).read()).decode("utf-8")

TONE = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}

def syl(s):
    m = re.match(r"^([A-Za-z:]+?)([1-5])?$", s)
    if not m: return s, s
    base, t = m.group(1).replace("u:", "ü").replace("U:", "Ü"), m.group(2)
    plain = base.lower()
    if not t or t == "5": return base, plain
    t = int(t) - 1; low = base.lower()
    idx = None
    for v in ("a", "e"):
        if v in low: idx = low.index(v); break
    if idx is None:
        if "ou" in low: idx = low.index("o")
        else:
            for i in range(len(low) - 1, -1, -1):
                if low[i] in "aeiouü": idx = i; break
    if idx is None: return base, plain
    ch = low[idx]; mark = TONE[ch][t]
    if base[idx].isupper(): mark = mark.upper()
    return base[:idx] + mark + base[idx + 1:], plain

def conv(p):
    parts = [syl(x) for x in p.split()]
    return " ".join(x[0] for x in parts), "".join(x[1] for x in parts)

rows, seen = [], set()
for line in text.splitlines():
    if line.startswith("#"): continue
    m = re.match(r"^(\S+) (\S+) \[(.*?)\] /(.*)/$", line.strip())
    if not m: continue
    trad, simp, pnum, defs = m.groups()
    english = " / ".join(d for d in defs.split("/") if d)
    low = english.lower()
    kind = ("surname" if low.startswith("surname") else
            "variant" if re.match(r"^(old |archaic |erhua |japanese |Taiwanese )?variant of", english, re.I) else
            "abbr" if low.startswith("abbr. for") else
            "xref" if re.match(r"^see (also )?\S", low) and len(english) < 60 else "word")
    py, plain = conv(pnum)
    key = (simp, pnum, english)
    if key in seen: continue
    seen.add(key)
    rows.append({"simplified": simp, "traditional": trad if trad != simp else None, "pinyin": py,
                 "pinyin_plain": plain, "pinyin_num": pnum, "english": english, "kind": kind})
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(rows, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
from collections import Counter
print(len(rows), "бичилт →", OUT, dict(Counter(r["kind"] for r in rows)))
