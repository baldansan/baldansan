#!/usr/bin/env python3
"""Ingest chinese-poetry/chinese-poetry (MIT; texts public domain) -> content/open/chinese-poetry/.

Raw download (outside the repo):
  git clone --depth 1 --filter=blob:none --sparse https://github.com/chinese-poetry/chinese-poetry.git
  cd chinese-poetry && git sparse-checkout set 蒙学 全唐诗 宋词

Usage:
  python3 scripts/open/chinese-poetry.py [RAW_DIR]   (default /home/claude/open-raw/chinese-poetry)

Outputs:
  content/open/chinese-poetry/mengxue.json     蒙学 classics (三字经 百家姓 千字文 弟子规 千家诗 声律启蒙 幼学琼林 增广贤文 朱子家训)
  content/open/chinese-poetry/tangshi300.json  唐诗三百首 (from 全唐诗/唐诗三百首.json)
  content/open/chinese-poetry/songci300.json   宋词三百首 (from 宋词/宋词三百首.json)

Every line: {id, zh (simplified, OpenCC t2s), pinyin (tone marks, one syllable per Han character,
space-separated, punctuation attached; pypinyin Style.TONE with whole-line phrase context)}.
"""
import json
import os
import re
import subprocess
import sys
from datetime import date

from pypinyin import Style, lazy_pinyin

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import REPO, to_simplified, write_json  # noqa: E402

RAW = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/open-raw/chinese-poetry"
OUT = os.path.join(REPO, "content", "open", "chinese-poetry")

SOURCE = "chinese-poetry (github.com/chinese-poetry/chinese-poetry)"
LICENSE = "Texts: public domain. Dataset: MIT License (https://github.com/chinese-poetry/chinese-poetry/blob/master/LICENSE)"
ATTRIB = ("Classical texts (public domain) from the chinese-poetry dataset, © chinese-poetry contributors, MIT License; "
          "converted to Simplified Chinese with OpenCC and annotated with pypinyin.")

HAN = re.compile(r"[㐀-鿿豈-﫿𠀀-𮯯]")
PUNCT_MAP = {"，": ",", "。": ".", "？": "?", "！": "!", "；": ";", "：": ":", "、": ",",
             "“": "\"", "”": "\"", "‘": "'", "’": "'", "（": "(", "）": ")", "《": "\"", "》": "\"",
             "「": "\"", "」": "\"", "『": "\"", "』": "\"", "·": "·", "・": "·", "…": "…", "—": "—"}
OPEN_P = set("(\"'")

# OpenCC t2s maps these surname characters to a different simplified surname; the
# 通用规范汉字表 keeps them distinct in surnames (於 Yū ≠ 于 Yú).
BAIJIAXING_FIX = {"於": "於"}


def syl_pinyin(text):
    """One tone-marked syllable per Han char, space separated; punctuation attached."""
    syl = lazy_pinyin(text, style=Style.TONE, errors=lambda s: list(s))
    if len(syl) != len(text):
        syl = [lazy_pinyin(c, style=Style.TONE, errors=lambda s: list(s))[0] for c in text]
    out = ""
    for ch, p in zip(text, syl):
        if HAN.match(ch):
            if out and not out.endswith(" ") and out[-1] not in OPEN_P:
                out += " "
            out += p
        elif ch.isspace():
            if out and not out.endswith(" "):
                out += " "
        else:
            q = PUNCT_MAP.get(ch, ch)
            if q in OPEN_P and out and not out.endswith(" "):
                out += " "
            out += q
    return re.sub(r"\s+", " ", out).strip()


def line(i, zh, pinyin=None):
    return {"id": i, "zh": zh, "pinyin": pinyin or syl_pinyin(zh)}


def s(t):
    return to_simplified(t) if t else t


def split_phrases(zh):
    return [p for p in re.split(r"[，。？！；、\s]+", zh) if p]


def dyn_author(a):
    """'（唐）孟浩然' -> ('唐', '孟浩然')"""
    m = re.match(r"^[（(]([^）)]+)[）)](.+)$", a.strip())
    return (m.group(1), m.group(2).strip()) if m else (None, a.strip())


def base(work_id, title, title_trad, author, dynasty):
    return {"id": work_id, "title": title, "title_trad": title_trad, "author": author, "dynasty": dynasty,
            "level": "kids", "source": SOURCE, "license": LICENSE, "attribution": ATTRIB}


def load(rel):
    return json.load(open(os.path.join(RAW, rel), encoding="utf-8"))


def build_mengxue():
    works = []
    notes = []

    # 三字经 — 传统版 (清代通行本). Each printed line = 4 three-character phrases.
    d = load("蒙学/sanzijing-traditional.json")
    w = base("sanzijing", "三字经", d["title"], s(d["author"]), "宋")
    w["edition"] = "传统版 (清代通行本, per chinese-poetry README)"
    lines = []
    for n, p in enumerate(d["paragraphs"], 1):
        zh = s(p)
        ln = line(f"sanzijing-{n:03d}", zh)
        ln["phrases"] = split_phrases(zh)
        lines.append(ln)
    w["sections"] = [{"chapter": None, "lines": lines}]
    works.append(w)

    # 百家姓 — printed as 8-char lines "赵钱孙李，周吴郑王。"
    d = load("蒙学/baijiaxing.json")
    w = base("baijiaxing", "百家姓", d["title"], s(d["author"]), "北宋")
    lines = []
    for n, p in enumerate(d["paragraphs"], 1):
        zh = "".join(BAIJIAXING_FIX.get(c) or s(c) for c in p)
        ln = line(f"baijiaxing-{n:03d}", zh)
        ln["phrases"] = split_phrases(zh)
        lines.append(ln)
    w["sections"] = [{"chapter": None, "lines": lines}]
    # 郡望 (ancestral seat) per surname, as given in the source
    w["origin"] = [{"surname": "".join(BAIJIAXING_FIX.get(c) or s(c) for c in o.get("surname", "")),
                    "place": s(o.get("place", ""))} for o in d.get("origin", [])]
    works.append(w)

    # 千字文 — source lists 4-char phrases; printed as 8-char couplet lines "天地玄黄，宇宙洪荒。"
    d = load("蒙学/qianziwen.json")
    w = base("qianziwen", "千字文", d["title"], s(d["author"]), "南北朝·梁")
    ph = [s(p) for p in d["paragraphs"]]
    sp = d.get("spells") or []
    use_src_py = len(sp) == len(ph) and all(len(a.split()) == len(b) for a, b in zip(sp, ph))
    lines = []
    for k in range(0, len(ph), 2):
        pair = ph[k:k + 2]
        zh = "，".join(pair) + "。"
        if use_src_py:
            py = ", ".join(sp[k:k + 2]) + "."
        else:
            py = None
        ln = line(f"qianziwen-{k // 2 + 1:03d}", zh, py)
        ln["phrases"] = pair
        lines.append(ln)
    w["sections"] = [{"chapter": None, "lines": lines}]
    w["pinyin_note"] = ("pinyin taken from the source dataset's `spells` field" if use_src_py
                        else "pinyin generated by pypinyin")
    if not use_src_py:
        notes.append("千字文: source `spells` not aligned, used pypinyin")
    works.append(w)

    # 弟子规 — chapters; printed lines of 4 three-char phrases separated by spaces
    d = load("蒙学/dizigui.json")
    w = base("dizigui", "弟子规", d["title"], s(d["author"]), "清")
    secs = []
    n = 0
    for c in d["content"]:
        lines = []
        for p in c["paragraphs"]:
            n += 1
            zh = s(p)
            ln = line(f"dizigui-{n:03d}", zh)
            ln["phrases"] = split_phrases(zh)
            lines.append(ln)
        secs.append({"chapter": s(c["chapter"]), "lines": lines})
    w["sections"] = secs
    works.append(w)

    # 千家诗 — grouped by form; each poem = section
    d = load("蒙学/qianjiashi.json")
    w = base("qianjiashi", "千家诗", d["title"], s(d["author"]), "南宋/明")
    w["poems"] = []
    n = 0
    for grp in d["content"]:
        form = s(grp["type"])
        for poem in grp["content"]:
            dy, au = dyn_author(poem.get("author", ""))
            # multi-part poems (其一/其二…) come as [{subchapter, paragraphs}]
            parts = ([(None, poem["paragraphs"])] if all(isinstance(x, str) for x in poem["paragraphs"])
                     else [(x.get("subchapter"), x["paragraphs"]) for x in poem["paragraphs"]])
            for sub, paras in parts:
                n += 1
                pid = f"qianjiashi-{n:03d}"
                w["poems"].append({
                    "id": pid, "title": s(poem["chapter"]), "subtitle": s(sub) if sub else None,
                    "author": s(au), "dynasty": s(dy) if dy else None, "form": form,
                    "paragraphs": [line(f"{pid}-{j}", s(p)) for j, p in enumerate(paras, 1)],
                })
    works.append(w)

    # 声律启蒙 / 幼学琼林 — 卷 -> chapter -> paragraphs
    for key, fn, dyn in (("shenglvqimeng", "shenglvqimeng.json", "清"), ("youxueqionglin", "youxueqionglin.json", "明/清")):
        d = load("蒙学/" + fn)
        w = base(key, s(d["title"]), d["title"], s(d["author"]), dyn)
        secs = []
        n = 0
        for vol in d["content"]:
            for c in vol["content"]:
                lines = []
                for p in c["paragraphs"]:
                    n += 1
                    lines.append(line(f"{key}-{n:03d}", s(p)))
                secs.append({"volume": s(vol["title"]), "chapter": s(c["chapter"]), "lines": lines})
        w["sections"] = secs
        works.append(w)

    # 增广贤文 (chapters) / 朱子家训 (flat)
    d = load("蒙学/zengguangxianwen.json")
    w = base("zengguangxianwen", "增广贤文", d["title"], s(d["author"]), "明/清")
    secs, n = [], 0
    for c in d["content"]:
        lines = []
        for p in c["paragraphs"]:
            n += 1
            lines.append(line(f"zengguangxianwen-{n:03d}", s(p)))
        secs.append({"chapter": s(c["chapter"]), "lines": lines})
    w["sections"] = secs
    works.append(w)

    d = load("蒙学/zhuzijiaxun.json")
    w = base("zhuzijiaxun", "朱子家训", d["title"], s(d["author"]), "明/清")
    w["sections"] = [{"chapter": None, "lines": [line(f"zhuzijiaxun-{n:03d}", s(p))
                                                  for n, p in enumerate(d["paragraphs"], 1)]}]
    works.append(w)
    return works, notes


def build_tangshi():
    d = load("全唐诗/唐诗三百首.json")
    forms = {"五言绝句", "七言绝句", "五言律诗", "七言律诗", "五言古诗", "七言古诗", "乐府"}
    out = []
    for n, p in enumerate(d, 1):
        pid = f"ts300-{n:03d}"
        tags = [s(t) for t in p.get("tags", []) if t != "唐诗三百首"]
        out.append({
            "id": pid, "title": s(p["title"]), "author": s(p["author"]), "dynasty": "唐",
            "form": next((t for t in tags if t in forms), None),
            "tags": tags,
            "paragraphs": [line(f"{pid}-{j}", s(x)) for j, x in enumerate(p["paragraphs"], 1)],
            "level": "classic", "source_id": p.get("id"),
        })
    return out


def build_songci():
    d = load("宋词/宋词三百首.json")
    out = []
    for n, p in enumerate(d, 1):
        pid = f"sc300-{n:03d}"
        out.append({
            "id": pid, "title": s(p["rhythmic"]), "rhythmic": s(p["rhythmic"]), "author": s(p["author"]),
            "dynasty": "宋",
            "paragraphs": [line(f"{pid}-{j}", s(x)) for j, x in enumerate(p["paragraphs"], 1)],
            "level": "classic",
        })
    return out


def main():
    try:
        rev = subprocess.check_output(["git", "-C", RAW, "rev-parse", "HEAD"], text=True).strip()
    except Exception:
        rev = None
    meta = {"source": SOURCE, "source_url": "https://github.com/chinese-poetry/chinese-poetry",
            "source_commit": rev, "license": LICENSE, "attribution": ATTRIB,
            "generated": date.today().isoformat(),
            "pinyin_note": "pypinyin Style.TONE, 1 syllable per Han char; classical 多音字 need teacher check"}
    mx, notes = build_mengxue()
    write_json(os.path.join(OUT, "mengxue.json"), {**meta, "works": mx})
    ts = build_tangshi()
    write_json(os.path.join(OUT, "tangshi300.json"), {**meta, "level": "classic", "poems": ts})
    sc = build_songci()
    write_json(os.path.join(OUT, "songci300.json"), {**meta, "level": "classic", "poems": sc})

    def nlines(w):
        if "poems" in w:
            return sum(len(p["paragraphs"]) for p in w["poems"])
        return sum(len(x["lines"]) for x in w["sections"])
    for w in mx:
        print(f"mengxue {w['id']}: {len(w.get('poems', [])) or len(w['sections'])} units, {nlines(w)} lines")
    print("tangshi300:", len(ts), "poems,", sum(len(p["paragraphs"]) for p in ts), "lines")
    print("songci300:", len(sc), "poems,", sum(len(p["paragraphs"]) for p in sc), "lines")
    for n in notes:
        print("NOTE", n)


if __name__ == "__main__":
    main()
