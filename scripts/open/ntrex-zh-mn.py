#!/usr/bin/env python3
"""Ingest NTREX-128 (Microsoft, CC BY-SA 4.0) aligned zh-CN / Mongolian / English news sentences
-> content/open/ntrex-zh-mn/data.json

Raw download (outside the repo):
  git clone --depth 1 https://github.com/MicrosoftTranslator/NTREX.git /home/claude/open-raw/NTREX

Usage:
  python3 scripts/open/ntrex-zh-mn.py [NTREX_DIR]

Files used (line-aligned, 1,997 lines each):
  NTREX-128/newstest2019-src.eng.txt   English source (WMT19 news test)
  NTREX-128/newstest2019-ref.zho-CN.txt  Chinese (Simplified) human reference
  NTREX-128/newstest2019-ref.mon.txt     Mongolian (Khalkha, Cyrillic) human reference
  DOCUMENT_IDS.tsv                       document id per line
"""
import os
import subprocess
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import REPO, hsk_level, hsk_profile, to_pinyin, write_json  # noqa: E402

RAW = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/open-raw/NTREX"
OUT = os.path.join(REPO, "content", "open", "ntrex-zh-mn", "data.json")

SOURCE = "NTREX-128 (Microsoft Translator)"
LICENSE = "CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)"
ATTRIB = ("NTREX-128 — News Test References for MT Evaluation of 128 Languages, Federmann, Kocmi & Xin (2022), "
          "Microsoft, https://github.com/MicrosoftTranslator/NTREX, CC BY-SA 4.0; English source from WMT19 newstest. "
          "Changes: selected zho-CN/mon/eng lines, added pinyin (pypinyin) and HSK level estimate.")


def read(rel):
    with open(os.path.join(RAW, rel), encoding="utf-8") as f:
        return [l.rstrip("\n").rstrip("\r") for l in f]


def main():
    en = read("NTREX-128/newstest2019-src.eng.txt")
    zh = read("NTREX-128/newstest2019-ref.zho-CN.txt")
    mn = read("NTREX-128/newstest2019-ref.mon.txt")
    docs = read("DOCUMENT_IDS.tsv")
    assert len(en) == len(zh) == len(mn) == len(docs), (len(en), len(zh), len(mn), len(docs))
    try:
        rev = subprocess.check_output(["git", "-C", RAW, "rev-parse", "HEAD"], text=True).strip()
    except Exception:
        rev = None
    items, skipped = [], 0
    for i, (e, z, m, d) in enumerate(zip(en, zh, mn, docs), 1):
        z, m, e = z.strip(), m.strip(), e.strip()
        if not z or not m:
            skipped += 1
            continue
        mx, p90 = hsk_profile(z)
        items.append({
            "id": f"ntrex-{i:04d}", "line": i, "doc_id": d.split("\t")[0].strip(),
            "zh": z, "pinyin": to_pinyin(z), "mn": m, "en": e,
            "level": hsk_level(z), "level_p90": p90,
        })
    meta = {"source": SOURCE, "source_url": "https://github.com/MicrosoftTranslator/NTREX", "source_commit": rev,
            "license": LICENSE, "attribution": ATTRIB, "generated": date.today().isoformat(),
            "languages": {"zh": "zho-CN (Simplified)", "mn": "mon (Mongolian, Cyrillic)", "en": "eng (source)"},
            "level_note": "level = highest HSK level (1-7, 7 = HSK 7-9) of HSK words found; level_p90 = level covering 90% of HSK word tokens",
            "count": len(items), "items": items}
    write_json(OUT, meta)
    from collections import Counter
    print("items", len(items), "skipped(empty)", skipped, "docs", len({x["doc_id"] for x in items}))
    print("level", sorted(Counter(x["level"] for x in items).items(), key=lambda t: (t[0] is None, t[0] or 0)))
    print("level_p90", sorted(Counter(x["level_p90"] for x in items).items(), key=lambda t: (t[0] is None, t[0] or 0)))


if __name__ == "__main__":
    main()
