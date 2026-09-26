#!/usr/bin/env python3
"""Classical (文言) originals of famous 寓言 / 成语故事 from zh.wikisource (public domain)
-> content/open/fables-classical/data.json

Only the pre-modern source passage is taken (韩非子, 庄子, 列子, 战国策, 吕氏春秋, 孟子, 淮南子, 新序,
山海经, 风俗通义, 牟子理惑论). NO modern retellings. Inline commentary ({{*|…}} notes of the 鲍彪/姚宏
editions etc.) is removed.

Raw pages are fetched with index.php?action=raw (User-Agent set, 2 s between requests) and cached in
/home/claude/open-raw/wikisource/. Re-running uses the cache.

Usage: python3 scripts/open/fables-classical.py [CACHE_DIR]
"""
import os
import re
import sys
import time
from datetime import date

import requests
from pypinyin import Style, lazy_pinyin

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import REPO, to_simplified, write_json  # noqa: E402

CACHE = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/open-raw/wikisource"
OUT = os.path.join(REPO, "content", "open", "fables-classical", "data.json")
UA = {"User-Agent": "BuunduuOpenIngest/1.0 (educational Chinese-learning app; one-off public-domain text ingest; python-requests)"}
ZS = "戰國策 (士禮居叢書本)"

# key, idiom, book (simplified), chapter, wikisource page, start anchor, end anchor (anchors in SIMPLIFIED text)
FABLES = [
    ("shouzhudaitu", "守株待兔", "韩非子", "五蠹", "韓非子/五蠹", "宋人有耕田者", "皆守株之类也"),
    ("kezhouqiujian", "刻舟求剑", "吕氏春秋", "慎大览·察今", "呂氏春秋/卷十五", "楚人有涉江者", "不亦惑乎"),
    ("bamiaozhuzhang", "拔苗助长（揠苗助长）", "孟子", "公孙丑上", "孟子/公孫丑上", "宋人有闵其苗之不长而揠之者", "而又害之"),
    ("wangyangbulao", "亡羊补牢", "战国策", "楚策四·庄辛谓楚襄王", ZS + "/楚/四", "臣闻鄙语曰", "未为迟也"),
    ("yanerdaoling", "掩耳盗铃", "吕氏春秋", "不苟论·自知", "呂氏春秋/卷二十四", "范氏之亡也", "悖矣"),
    ("huashetianzu", "画蛇添足", "战国策", "齐策二", ZS + "/齊/二", "楚有祠者", "终亡其酒"),
    ("jingdizhiwa", "井底之蛙", "庄子", "秋水", "莊子/秋水", "子独不闻夫埳井之", "规规然自失也"),
    ("hujiahuwei", "狐假虎威", "战国策", "楚策一", ZS + "/楚/一", "虎求百兽而食之", "以为畏狐也"),
    ("zixiangmaodun", "自相矛盾", "韩非子", "难一", "韓非子/難一", "楚人有鬻楯与矛者", "不可同世而立"),
    ("zhengrenmaili", "郑人买履", "韩非子", "外储说左上", "韓非子/外儲說左上", "郑人有且置履者", "无自信也"),
    ("saiwengshima", "塞翁失马", "淮南子", "人间训", "淮南子/人間訓", "近塞上之人有善术者", "深不可测也"),
    ("yegonghaolong", "叶公好龙", "新序", "杂事第五", "新序/雜事/卷五", "叶公子高好龙", "似龙而非龙者也"),
    ("duiniutanqin", "对牛弹琴", "牟子理惑论", "载《弘明集》卷一", "弘明集/01", "公明仪为牛弹清角之操", "蹀躞而听"),
    ("beigongsheying", "杯弓蛇影", "风俗通义", "怪神·世间多有见怪惊怖以自伤者", "風俗通義/9", "予之祖父郴为汲令", "有威名焉"),
    ("lanyuchongshu", "滥竽充数", "韩非子", "内储说上七术", "韓非子/內儲說上七術", "齐宣王使人吹竽", "处士逃"),
    ("maiduhuanzhu", "买椟还珠", "韩非子", "外储说左上", "韓非子/外儲說左上", "楚人有卖其珠于郑者", "未可谓善鬻珠也"),
    ("handanxuebu", "邯郸学步", "庄子", "秋水", "莊子/秋水", "且子独不闻夫寿陵余子之学于邯郸与", "直匍匐而归耳"),
    ("dongshixiaopin", "东施效颦", "庄子", "天运", "莊子/天運", "故西施病心而", "所以美"),
    ("yugongyishan", "愚公移山", "列子", "汤问", "列子/湯問篇", "太行、王屋二山", "无陇断焉"),
    ("jingweitianhai", "精卫填海", "山海经", "北山经·北次三经", "山海經/北山經", "又北二百里，曰发鸠之山", "以堙于东海"),
    ("yubangxiangzheng", "鹬蚌相争", "战国策", "燕策二", ZS + "/燕/二", "赵且伐燕", "愿王之熟计之也"),
    ("jinggongzhiniao", "惊弓之鸟", "战国策", "楚策四", ZS + "/楚/四", "更羸与魏王处京台之下", "不可为拒秦之将也"),
    ("nanyuanbeizhe", "南辕北辙", "战国策", "魏策四", ZS + "/魏/四", "今者臣来，见人于大行", "犹至楚而北行也"),
    ("zhaosanmusi", "朝三暮四", "列子", "黄帝", "列子/黃帝篇", "宋有狙公者", "皆伏而喜"),
    ("qirenyoutian", "杞人忧天", "列子", "天瑞", "列子/天瑞篇", "杞国有人忧天地崩坠", "舍然大喜"),
    ("yilindaofu", "疑邻盗斧", "列子", "说符", "列子/說符篇", "人有亡𫓧者", "无似窃𫓧者"),
    ("liangxiaoerbianri", "两小儿辩日", "列子", "汤问", "列子/湯問篇", "孔子东游", "孰为汝多知乎"),
    ("paodingjieniu", "庖丁解牛", "庄子", "养生主", "莊子/養生主", "庖丁为文惠君解牛", "得养生焉"),
    ("kuafuzhuri", "夸父逐日", "山海经", "海外北经", "山海經/海外北經", "夸父与日逐走", "化为邓林"),
]

HAN = re.compile(r"[㐀-鿿豈-﫿𠀀-𮯯]")
PUNCT = {"，": ",", "。": ".", "？": "?", "！": "!", "；": ";", "：": ":", "、": ",", "“": "\"", "”": "\"",
         "‘": "'", "’": "'", "「": "\"", "」": "\"", "『": "'", "』": "'", "（": "(", "）": ")", "《": "\"", "》": "\""}
OPEN_P = set("(\"'")


def fetch(title):
    fn = os.path.join(CACHE, title.replace("/", "__") + ".wiki")
    if os.path.exists(fn):
        return open(fn, encoding="utf-8").read()
    os.makedirs(CACHE, exist_ok=True)
    for i in range(5):
        r = requests.get("https://zh.wikisource.org/w/index.php", params={"title": title, "action": "raw"},
                         headers=UA, timeout=30)
        time.sleep(2)
        if r.status_code == 200:
            open(fn, "w", encoding="utf-8").write(r.text)
            return r.text
        if r.status_code == 404:
            return None
        time.sleep(10 * (i + 1))
    return None


KEEP_FIRST = {"ProperNoun", "PN", "YL", "另", "參", "gap", "僻字", "lang"}


def clean(wiki):
    t = re.sub(r"<!--.*?-->", "", wiki, flags=re.S)
    t = re.sub(r"<ref[^>]*/>|<ref[^>]*>.*?</ref>", "", t, flags=re.S)
    # resolve templates innermost-first
    pat = re.compile(r"\{\{([^{}]*)\}\}")
    for _ in range(20):
        new = pat.sub(lambda m: (lambda parts: parts[1] if parts[0].strip() in KEEP_FIRST and len(parts) > 1 else "")(
            m.group(1).split("|")), t)
        if new == t:
            break
        t = new
    t = re.sub(r"-\{(.*?)\}-", r"\1", t)
    t = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = re.sub(r"'''?", "", t)
    lines = []
    for ln in t.split("\n"):
        s = ln.strip()
        if not s or s.startswith(("=", "Category:", "{|", "|", "!", "__")):
            continue
        lines.append(s.lstrip(":*# "))
    return "\n".join(lines)


def syl_pinyin(text):
    syl = lazy_pinyin(text, style=Style.TONE, errors=lambda s: list(s))
    if len(syl) != len(text):
        syl = [lazy_pinyin(c, style=Style.TONE, errors=lambda s: list(s))[0] for c in text]
    out = ""
    for ch, p in zip(text, syl):
        if HAN.match(ch):
            if out and not out.endswith(" ") and out[-1] not in OPEN_P:
                out += " "
            out += p
        elif not ch.isspace():
            q = PUNCT.get(ch, ch)
            if q in OPEN_P and out and not out.endswith(" "):
                out += " "
            out += q
    return re.sub(r"\s+", " ", out).strip()


def sentences(zh):
    parts = re.findall(r".+?(?:[。！？]+[」』”’]*|$)", zh)
    return [p for p in (x.strip() for x in parts) if p]


def extract(text_s, start, end):
    i = text_s.find(start)
    if i < 0:
        return None, "start anchor not found"
    j = text_s.find(end, i)
    if j < 0:
        return None, "end anchor not found"
    j += len(end)
    m = re.match(r"[^。！？\n]*[。！？]+[」』”’]*", text_s[j:])  # finish the sentence
    if m and len(m.group(0)) <= 20:
        j += len(m.group(0))
    return text_s[i:j].replace("\n", ""), None


def main():
    items, problems = [], []
    for n, (key, idiom, book, chapter, page, a, b) in enumerate(FABLES, 1):
        wiki = fetch(page)
        if wiki is None:
            problems.append((idiom, page, "page not found"))
            continue
        trad = clean(wiki)
        simp = to_simplified(trad)
        zh, err = extract(simp, a, b)
        if err:
            problems.append((idiom, page, err))
            continue
        zh_trad = None
        if len(simp) == len(trad):  # OpenCC kept length -> same offsets in the traditional text
            k = simp.find(a)
            if k >= 0:
                zh_trad = trad[k:k + len(zh) + zh.count("\n")].replace("\n", "")
                if len(zh_trad) != len(zh):
                    zh_trad = None
        sents = sentences(zh)
        items.append({
            "id": f"fable-{n:02d}", "key": key, "idiom": idiom, "title": idiom,
            "book": book, "chapter": chapter,
            "zh": zh, "zh_trad": zh_trad,
            "pinyin": syl_pinyin(zh),
            "sentences": [{"zh": s, "pinyin": syl_pinyin(s)} for s in sents],
            "chars": len([c for c in zh if HAN.match(c)]),
            "level": "classic",
            "source": f"zh.wikisource — {page}", "source_url": "https://zh.wikisource.org/wiki/" + page.replace(" ", "_"),
            "license": "Public domain (pre-modern text; Wikisource {{PD-old}})",
            "attribution": f"《{book}·{chapter}》, text from 维基文库 zh.wikisource.org ({page}), public domain; converted to Simplified with OpenCC, pinyin by pypinyin.",
        })
    write_json(OUT, {"source": "zh.wikisource (维基文库)", "source_url": "https://zh.wikisource.org/",
                     "license": "Public domain", "generated": date.today().isoformat(),
                     "note": "Classical originals only (文言). Simplified via OpenCC t2s; pinyin via pypinyin (文言 多音字/通假字 need teacher check). Inline commentary removed.",
                     "count": len(items), "skipped": [{"idiom": p[0], "page": p[1], "reason": p[2]} for p in problems],
                     "items": items})
    print("fables:", len(items))
    for it in items:
        print(f"  {it['idiom']}: {it['chars']} chars | {it['zh'][:30]}… {it['zh'][-12:]}")
    for p in problems:
        print("SKIP", p)


if __name__ == "__main__":
    main()
