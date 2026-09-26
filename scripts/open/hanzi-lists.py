#!/usr/bin/env python3
"""Official Chinese character lists -> content/open/hanzi-lists/

  grade1-300.json      识字、写字教学基本字表 (300 chars) — 《义务教育语文课程标准（2022年版）》附录4
  changyong.json       义务教育语文课程常用字表 (3,500 = 字表一 2,500 + 字表二 1,000) — 同上 附录5
  tongyong-8105.json   《通用规范汉字表》(2013) 8,105 chars, 一级 3,500 / 二级 3,000 / 三级 1,605

Raw inputs (outside the repo):
  git clone --depth 1 https://github.com/jaywcjlove/table-of-general-standard-chinese-characters.git \
      /home/claude/open-raw/tgscc                 # MIT; 8105 list in official order + pinyin readings
  git clone --depth 1 https://github.com/zispace/hanzi-chars.git /home/claude/open-raw/hanzi-chars
      # machine-readable transcription of the 2022 curriculum appendices (repo has NO license file;
      # used only as a transcription of the official, non-copyrightable state document, and
      # verified against the official PDF — see README)
  Official PDF (scanned): http://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582344386456.pdf

Usage: python3 scripts/open/hanzi-lists.py [RAW_DIR]   (default /home/claude/open-raw)
"""
import json
import os
import re
import sys
from datetime import date

from pypinyin import Style, pinyin

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import REPO, write_json  # noqa: E402

RAW = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/open-raw"
OUT = os.path.join(REPO, "content", "open", "hanzi-lists")
ZS = os.path.join(RAW, "hanzi-chars", "data-charlist")

MOE_PDF = "http://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582344386456.pdf"
TONGYONG_URL = "http://www.moe.gov.cn/jyb_sjzl/ziliao/A19/201306/t20130601_186002.html"
LIC_OFFICIAL = ("Official state document — not subject to copyright (Copyright Law of the PRC, Art. 5: "
                "laws, regulations, resolutions, decisions and orders of state organs … are not protected)")


# pypinyin's default reading is a (rare) neutral-tone one for these; particles like 了/的/吗 keep le/de/ma.
PRIMARY_OVERRIDE = {"卜": "bǔ"}


def hsk_char_levels():
    words = json.load(open(os.path.join(REPO, "data", "hsk_words.json"), encoding="utf-8"))
    lv = {}
    for w in words:
        l = 7 if w["hsk_level"] == "7-9" else int(w["hsk_level"])
        for c in w["simplified"]:
            lv[c] = min(l, lv.get(c, 99))
    return lv


def read_zs(name):
    """zispace list file -> list of (entry, stroke_group or None)."""
    out, group = [], None
    for line in open(os.path.join(ZS, name), encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            m = re.match(r"#\s*(\d+)画", line)
            if m:
                group = int(m.group(1))
            continue
        out.append((line, group))
    return out


def main():
    tg_dir = os.path.join(RAW, "tgscc", "data")
    chars = json.load(open(os.path.join(tg_dir, "characters.json"), encoding="utf-8"))
    readings = json.load(open(os.path.join(tg_dir, "pinyin.json"), encoding="utf-8"))
    assert len(chars) == 8105 == len(readings)
    idx = {c: i + 1 for i, c in enumerate(chars)}
    rd = dict(zip(chars, readings))
    hsk = hsk_char_levels()

    def entry(c):
        main_py = pinyin(c, style=Style.TONE)[0][0]
        r = rd.get(c) or []
        r = [r] if isinstance(r, str) else list(r)
        toned = [x for x in r if re.search(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", x)]
        main_py = PRIMARY_OVERRIDE.get(c, main_py)
        if r and main_py not in r:
            main_py = (toned or r)[0]  # pypinyin default not among the table's readings (e.g. 框 kuāng) -> table wins
        return {"pinyin": main_py, "readings": r or [main_py],
                "level": hsk.get(c) if hsk.get(c, 99) <= 7 else None,
                "tongyong_index": idx.get(c)}

    today = date.today().isoformat()
    level_note = "level = lowest HSK 3.0 level (1–7, 7 = HSK 7–9) of any data/hsk_words.json word containing the character; null if none"
    py_note = ("pinyin = pypinyin default (most common) reading, unless it is not among the table readings — then the first toned table reading (plus override 卜 bǔ); readings = all readings listed in the "
               "jaywcjlove/togscc dataset (which took them from zh.wiktionary Appendix:通用规范汉字表)")

    # ---- 8105
    tiers = [(1, 3500, 1), (3501, 6500, 2), (6501, 8105, 3)]
    items = []
    for i, c in enumerate(chars, 1):
        tier = next(t for a, b, t in tiers if a <= i <= b)
        e = entry(c)
        items.append({"id": f"ty-{i:04d}", "zh": c, "tier": tier, **e})
    write_json(os.path.join(OUT, "tongyong-8105.json"), {
        "title": "通用规范汉字表 (2013)", "source": "《通用规范汉字表》, State Council / Ministry of Education, 2013-06",
        "source_url": TONGYONG_URL,
        "data_source": "https://github.com/jaywcjlove/table-of-general-standard-chinese-characters (MIT)",
        "license": LIC_OFFICIAL + "; machine-readable data: MIT License (© 小弟调调 jaywcjlove)",
        "attribution": "通用规范汉字表 (2013), official list; data from jaywcjlove/table-of-general-standard-chinese-characters, MIT License.",
        "generated": today, "tier_note": "tier 1 = 一级字 (1–3500, 常用字), 2 = 二级字 (3501–6500), 3 = 三级字 (6501–8105); index = official 字序",
        "level_note": level_note, "pinyin_note": py_note, "count": len(items), "items": items})

    lvl1 = set(chars[:3500])

    # ---- 常用字表 3500 (字表一 2500 + 字表二 1000)
    t1 = [e[0][0] for e in read_zs("《义务教育语文课程》（2022年版）常用字表一.txt")]
    t2 = [e[0][0] for e in read_zs("《义务教育语文课程》（2022年版）常用字表二.txt")]
    assert len(t1) == 2500 and len(t2) == 1000, (len(t1), len(t2))
    assert set(t1) | set(t2) == lvl1, "常用字表 must equal 通用规范汉字表 一级字"
    items = []
    for table, lst in ((1, t1), (2, t2)):
        for i, c in enumerate(lst, 1):
            items.append({"id": f"cy{table}-{i:04d}", "zh": c, "table": table, "table_index": i, **entry(c)})
    write_json(os.path.join(OUT, "changyong.json"), {
        "title": "义务教育语文课程常用字表 (3500字)",
        "source": "《义务教育语文课程标准（2022年版）》附录5, Ministry of Education of the PRC", "source_url": MOE_PDF,
        "license": LIC_OFFICIAL, "attribution": "义务教育语文课程标准（2022年版）附录5 常用字表, 中华人民共和国教育部.",
        "generated": today,
        "table_note": "table 1 = 字表一 (2500字, 阿～做, 按音序), table 2 = 字表二 (1000字, 蔼～佐, 按音序). Same set as 通用规范汉字表 一级字.",
        "level_note": level_note, "pinyin_note": py_note, "count": len(items), "items": items})

    # ---- 300 basic characters (by stroke count)
    b = read_zs("《义务教育语文课程》（2022年版）识字写字教学基本字表.txt")
    assert len(b) == 300, len(b)
    t1set = set(t1)
    items = []
    for i, (raw, strokes) in enumerate(b, 1):
        c = raw[0]
        m = re.search(r"（(.+)）", raw)
        assert c in lvl1, c
        it = {"id": f"g1-{i:03d}", "zh": c, "strokes": strokes, "changyong_table": 1 if c in t1set else 2}
        if m:
            it["component_form"] = m.group(1)  # 部首变体, e.g. 人（亻）
        it.update(entry(c))
        items.append(it)
    write_json(os.path.join(OUT, "grade1-300.json"), {
        "title": "识字、写字教学基本字表 (300字)",
        "source": "《义务教育语文课程标准（2022年版）》附录4, Ministry of Education of the PRC", "source_url": MOE_PDF,
        "license": LIC_OFFICIAL, "attribution": "义务教育语文课程标准（2022年版）附录4 识字、写字教学基本字表, 中华人民共和国教育部.",
        "generated": today,
        "note": "Order and stroke groups as printed (按笔画排列). 13 characters carry a radical variant form (component_form). changyong_table = which 常用字表 table the char is in (299 in 字表一; 禾 is in 字表二 #270 in the official PDF).",
        "level_note": level_note, "pinyin_note": py_note, "count": len(items), "items": items})

    from collections import Counter
    print("tongyong-8105: 8105")
    print("changyong:", len(t1) + len(t2), "(2500 + 1000)")
    print("grade1-300:", len(items), "component forms:", sum(1 for x in items if "component_form" in x),
          "not in 字表一:", [x["zh"] for x in items if x["changyong_table"] != 1])
    print("grade1-300 HSK levels:", sorted(Counter(x["level"] for x in items).items(), key=lambda t: (t[0] is None, t[0] or 0)))


if __name__ == "__main__":
    main()
