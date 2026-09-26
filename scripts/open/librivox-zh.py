#!/usr/bin/env python3
"""LibriVox Chinese recordings (public domain) -> content/open/librivox-zh/manifest.json

Sources per item:
  - https://archive.org/metadata/<identifier>     (files: 64 kbps mp3 name, length, size; licenseurl)
  - LibriVox catalog page (linked from the archive.org description): section table with
    Chinese section titles, author, reader, time, language, etext link.
Raw responses cached under /home/claude/open-media/raw/librivox-zh/ (override RAW=...).
Nothing is downloaded (audio stays on archive.org); URLs point to the 64 kbps mp3s.
Usage: python3 scripts/open/librivox-zh.py [--offline]
"""
import html
import json
import os
import re
import sys
import time

import requests

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import REPO, to_pinyin, to_simplified, write_json  # noqa: E402

RAW = os.environ.get("RAW", "/home/claude/open-media/raw/librivox-zh")
OUT = os.path.join(REPO, "content/open/librivox-zh")
UA = {"User-Agent": "Mozilla/5.0 (BuunduuOpenIngest/1.0; educational)"}

ITEMS = [
    # identifier, group, short name
    ("three_chinese_classics_0907_librivox", "sanbaiqian", "三百千 (百家姓·千字文·三字经)"),
    ("di_zi_gui_0805_librivox", "dizigui", "弟子规"),
    ("300_tang_poems_vol_1_librivox", "tangshi", "唐诗三百首 卷一"),
    ("300_tang_poems_vol_2_librivox", "tangshi", "唐诗三百首 卷二"),
    ("300_tang_poems_vol_3_librivox", "tangshi", "唐诗三百首 卷三"),
    ("tangpoems4_1207_librivox", "tangshi", "唐诗三百首 卷四"),
    ("three_hundred_tang_poems_volume_5_1501_librivox", "tangshi", "唐诗三百首 卷五"),
    ("lun_yu_0801_librivox", "lunyu", "论语"),
]
DIALECTS = ["Mandarin", "Cantonese", "Hokkien", "Taiwanese", "Hakka", "Teochow", "Teochew", "Hainanese",
            "Shanghainese", "Wu", "Sichuanese", "Hunanese"]
HAN = re.compile(r"[㐀-鿿]")

sess = requests.Session()
sess.headers.update(UA)


def cached(url, path, offline, as_json=False):
    if os.path.exists(path):
        t = open(path, encoding="utf-8").read()
    else:
        if offline:
            return None
        err = None
        for attempt in range(5):  # librivox.org is behind Cloudflare and often answers 52x
            try:
                r = sess.get(url, timeout=40)
                r.raise_for_status()
                t = r.text
                break
            except Exception as e:  # noqa: BLE001
                err = e
                time.sleep(5 + 5 * attempt)
        else:
            raise err
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "w", encoding="utf-8").write(t)
        time.sleep(0.5)
    return json.loads(t) if as_json else t


def secs(s):
    if s is None:
        return None
    s = str(s).strip()
    if re.fullmatch(r"[\d.]+", s):
        return round(float(s))
    parts = [float(x) for x in re.split(r"[:.]", s) if x != ""][:3]
    v = 0
    for x in parts:
        v = v * 60 + x
    return round(v)


def strip(s):
    return html.unescape(re.sub(r"<[^>]+>", " ", s)).strip()


def parse_catalog(t):
    """Section table; column layout differs between books, so map cells by header name."""
    rows = []
    body = t[t.find('class="chapter-download"'):]
    body = body[:body.find("</table>")]
    heads = [strip(h).lower() for h in re.findall(r"<th>(.*?)</th>", body, re.S)]
    for tr in re.findall(r"<tr>(.*?)</tr>", body, re.S)[1:]:
        tds = re.findall(r"<td>(.*?)</td>", tr, re.S)
        if len(tds) != len(heads):
            continue
        c = dict(zip(heads, tds))
        mp3 = re.search(r'href="([^"]+_64kb\.mp3)"', c.get("section", ""))
        etext = re.search(r'href="([^"]+)"', c.get("source", ""))
        rows.append({
            "mp3": mp3.group(1) if mp3 else None,
            "title": re.sub(r"\s+", " ", strip(c.get("chapter", ""))),
            "author": re.sub(r"\s+", " ", strip(c.get("author", ""))) or None,
            "etext": etext.group(1) if etext and etext.group(1) else None,
            "reader": re.sub(r"\s+", " ", strip(c.get("reader", ""))) or None,
            "time": strip(c.get("time", "")) or None,
            "language": strip(c.get("language", "")) or None,
        })
    return rows


def split_title(title):
    """'001 - 感遇其 (Thoughts I) (Mandarin) by Zhang Jiuling 張九齡' / 'Poem 170 - 黄鹤楼 (Mandarin)' /
    '弟子规 – 广州话录音 – Cantonese' / '学而， 第一' -> (number, zh, en, dialect). Regex only, nothing invented."""
    num = re.match(r"^(?:Poem\s+)?(\d+)\s*[-–]?\s*", title)
    rest = title[num.end():] if num else title
    dialect = next((d for d in DIALECTS if re.search(r"\b" + d + r"\b", rest)), None)
    han = re.match(r"^([\u3400-\u9fff\u3000-\u303f\uff00-\uffef·．\s]+)", rest)
    zh_trad = han.group(1).strip(" ，,") if han and HAN.search(han.group(1)) else None
    en = None
    m = re.search(r"\(([^()]*[A-Za-z][^()]*)\)", rest)
    if m and not any(m.group(1).startswith(d) for d in DIALECTS):
        en = m.group(1)
    return (int(num.group(1)) if num else None), zh_trad, en, dialect


def main():
    offline = "--offline" in sys.argv
    books = []
    for ident, group, short in ITEMS:
        meta = cached(f"https://archive.org/metadata/{ident}", os.path.join(RAW, f"{ident}.json"), offline, True)
        md = meta["metadata"]
        files = {f["name"]: f for f in meta["files"]}
        cat_url = re.search(r'href="(https?://librivox\.org/[^"]+)"[^>]*>\s*(?:LibriVox catalog page|http://librivox\.org/[^<]+/)', md.get("description", ""))
        cat_url = cat_url.group(1) if cat_url else None
        if not cat_url:
            m = re.findall(r"https?://librivox\.org/[a-z0-9-]+/", md.get("description", ""))
            cat_url = m[0] if m else None
        rows = []
        if cat_url:
            try:
                page = cached(cat_url.replace("http://", "https://"), os.path.join(RAW, f"{ident}.catalog.html"), offline)
                rows = parse_catalog(page) if page else []
            except Exception as e:  # noqa: BLE001
                print("catalog fail", ident, e, file=sys.stderr)
        by_mp3 = {r["mp3"].rsplit("/", 1)[-1]: r for r in rows if r["mp3"]}
        sections = []
        mp3s = sorted(n for n in files if n.endswith("_64kb.mp3"))
        for n in mp3s:
            f = files[n]
            row = by_mp3.get(n, {})
            title = row.get("title") or (f.get("title") or "").replace("\\(", "(").replace("\\)", ")")
            num, zh_trad, en, dialect = split_title(title)
            if not dialect:
                dialect = next((d for d in DIALECTS if d.lower() in (title + " " + n).lower()), None)
            sec = {
                "id": f"lv-{ident.split('_librivox')[0]}-{os.path.splitext(n)[0].replace('_64kb', '')}",
                "file": n,
                "url": f"https://archive.org/download/{ident}/{n}",
                "url_vbr": f"https://archive.org/download/{ident}/{n.replace('_64kb', '')}" if n.replace("_64kb", "") in files else None,
                "title": title,
                "number": num,
                "dialect": dialect,
                "duration_s": secs(f.get("length")) or secs(row.get("time")),
                "bytes": int(f["size"]) if f.get("size") else None,
                "reader": row.get("reader") or None,
                "language": row.get("language") or None,
                "author": row.get("author") or f.get("creator"),
                "etext": row.get("etext"),
            }
            if zh_trad:
                zh = to_simplified(zh_trad)
                sec["zh"] = zh
                if zh != zh_trad:
                    sec["zh_trad"] = zh_trad
                sec["pinyin"] = to_pinyin(zh)
            if en:
                sec["en"] = en
            sections.append(sec)
        sections.sort(key=lambda s: (s["number"] if s["number"] is not None else 9999, s["file"]))
        total = sum(s["duration_s"] or 0 for s in sections)
        books.append({
            "id": f"lv-{ident}", "archive_id": ident, "group": group, "name_zh": short,
            "title": md.get("title"), "librivox_url": cat_url,
            "archive_url": f"https://archive.org/details/{ident}",
            "runtime": md.get("runtime"), "duration_s": total, "section_count": len(sections),
            "dialects": sorted({s["dialect"] for s in sections if s["dialect"]}),
            "license": "Public domain", "license_url": md.get("licenseurl"),
            "source": "LibriVox", "attribution": f"LibriVox recording “{md.get('title')}” (public domain), "
                                                 f"read by LibriVox volunteers; hosted at archive.org/details/{ident}.",
            "sections": sections,
        })
        print(ident, len(sections), "sections,", len(rows), "catalog rows,",
              sum(1 for s in sections if s.get("zh")), "with zh title,", round(total / 60), "min")
    write_json(os.path.join(OUT, "manifest.json"), {
        "source": "LibriVox (archive.org)", "license": "Public domain",
        "note": "Audio not downloaded; URLs are archive.org 64 kbps mp3s. Section Chinese titles come from the "
                "LibriVox catalog pages (Traditional -> Simplified with OpenCC, pinyin by pypinyin).",
        "count": len(books), "sections": sum(b["section_count"] for b in books), "books": books})


if __name__ == "__main__":
    main()
