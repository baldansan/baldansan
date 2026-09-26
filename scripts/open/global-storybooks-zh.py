#!/usr/bin/env python3
"""Global Storybooks 中文故事集 -> content/open/global-storybooks-zh/data.json

Raw input: git clone --depth 1 https://github.com/global-asp/storybooks-chinese.git
           (default location /home/claude/open-media/raw/storybooks-chinese, override with RAW=...)
Usage:
  python3 scripts/open/global-storybooks-zh.py              # parse -> data.json + covers
  python3 scripts/open/global-storybooks-zh.py --download   # also download page mp3/jpg + full mp3
                                                            # into /home/claude/open-media/global-storybooks-zh/
Only stories whose colophon license is CC BY (3.0/4.0) are kept; CC BY-NC stories are skipped.
"""
import html
import json
import os
import re
import sys
import time

import requests

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import REPO, hsk_level, hsk_profile, make_cover, to_pinyin, write_json  # noqa: E402

RAW = os.environ.get("RAW", "/home/claude/open-media/raw/storybooks-chinese")
MEDIA = "/home/claude/open-media/global-storybooks-zh"
OUT = os.path.join(REPO, "content/open/global-storybooks-zh")
COVERS = os.path.join(REPO, "public/open/global-storybooks-zh/covers")
SITE = "https://global-asp.github.io/storybooks-chinese/stories/zh/"
UA = {"User-Agent": "BuunduuOpenIngest/1.0 (educational; https://baldansan.vercel.app)"}

ROLE = {"作者": "author", "插图": "illustrator", "译文": "translator", "配音": "narrator"}
LIC = {
    "by/3.0": ("CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/"),
    "by/4.0": ("CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"),
    "by-sa/4.0": ("CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"),
}


def clean(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    return "\n".join(x.strip() for x in s.strip().splitlines() if x.strip())


def parse(path):
    t = open(path, encoding="utf-8").read()
    blocks = re.split(r'<div (?:class="columns" )?id="text(\d+)"', t)
    pages = []
    title = None
    for i in range(1, len(blocks), 2):
        num, body = blocks[i], blocks[i + 1]
        img = re.search(r'<img class="img-responsive" src="([^"]+)"', body)
        aud = re.search(r'<audio id="audio\d+"[^>]*src="([^"]+)"', body)
        if num == "01":
            m = re.search(r'<span class="def">(.*?)</span>', body, re.S)
            title = clean(m.group(1))
            text = title
        else:
            m = re.search(r'-txt def"><h3>(.*?)</h3>', body, re.S)
            text = clean(m.group(1)) if m else ""
        pages.append({"n": int(num), "text": text,
                      "image": img.group(1) if img else None,
                      "audio": aud.group(1) if aud else None})
    meta = {}
    col = t[t.find('id="colophon"'):]
    for zh, key in ROLE.items():
        m = re.search(r'colophon-heading">' + zh + r':</span>\s*(.*?)</h5>', col, re.S)
        if m:
            meta[key] = clean(m.group(1))
    lv = re.search(r'colophon-heading">级别:</span>.*?(\d)级', col, re.S)
    meta["level"] = int(lv.group(1)) if lv else None
    src = re.search(r'出处:</span>.*?<a href="(https://africanstorybook.org/reader.php\?id=\d+)"[^>]*>(.*?)</a>', col, re.S)
    if src:
        meta["origin_url"], meta["origin_title"] = src.group(1), clean(src.group(2))
    lic = re.search(r'licenses/([a-z-]+/[0-9.]+)', col)
    meta["license_code"] = lic.group(1) if lic else None
    full = re.search(r'<source src="([^"]+\.mp3)"', t)
    meta["audio_full"] = full.group(1) if full else None
    return title, pages, meta


def main():
    download = "--download" in sys.argv
    zhdir = os.path.join(RAW, "stories/zh")
    endir = os.path.join(RAW, "stories/en")
    ids = sorted(d for d in os.listdir(zhdir) if re.fullmatch(r"\d{4}", d))
    stories, skipped, manifest = [], [], []
    sess = requests.Session()
    sess.headers.update(UA)
    for sid in ids:
        title, pages, meta = parse(os.path.join(zhdir, sid, "index.html"))
        if meta["license_code"] not in LIC:
            skipped.append({"id": sid, "title": title, "license": meta["license_code"],
                            "reason": "non-commercial (NC) license"})
            continue
        lic_name, lic_url = LIC[meta["license_code"]]
        en_pages, en_title = {}, None
        enp = os.path.join(endir, sid, "index.html")
        if os.path.exists(enp):
            en_title, ep, _ = parse(enp)
            en_pages = {p["n"]: p["text"] for p in ep}
        attribution = (f"“{title}” by {meta.get('author')}, illustrated by {meta.get('illustrator')}, "
                       f"Chinese translation by {meta.get('translator')}, narrated by {meta.get('narrator')}; "
                       f"Global Storybooks 中文故事集 ({SITE}{sid}/), originally African Storybook "
                       f"“{meta.get('origin_title')}”. Licensed under {lic_name} ({lic_url}).")
        out_pages = []
        for p in pages:
            if p["n"] == 1:
                continue  # cover page: title only
            img_local = f"{sid}/{p['n']:02d}.jpg" if p["image"] else None
            aud_local = f"{sid}/{p['n']:02d}.mp3" if p["audio"] else None
            item = {"id": f"gsb-zh-{sid}-p{p['n']:02d}", "page": p["n"] - 1,
                    "zh": p["text"], "pinyin": to_pinyin(p["text"]),
                    "hsk_max": hsk_level(p["text"]),
                    "image": p["image"], "image_local": img_local,
                    "audio": p["audio"], "audio_local": aud_local}
            if en_pages.get(p["n"]):
                item["en"] = en_pages[p["n"]]
            out_pages.append(item)
            for kind, url, loc in (("image", p["image"], img_local), ("audio", p["audio"], aud_local)):
                if url:
                    manifest.append({"story": sid, "page": p["n"] - 1, "kind": kind, "url": url, "path": loc})
        cover = pages[0]["image"]
        if cover:
            manifest.append({"story": sid, "page": 0, "kind": "cover", "url": cover, "path": f"{sid}/01.jpg"})
        if meta["audio_full"]:
            manifest.append({"story": sid, "page": None, "kind": "audio_full", "url": meta["audio_full"],
                             "path": f"{sid}/full.mp3"})
        full_text = "".join(p["zh"] for p in out_pages)
        stories.append({
            "id": f"gsb-zh-{sid}", "story_id": sid, "url": f"{SITE}{sid}/",
            "title": title, "title_pinyin": to_pinyin(title), "title_en": en_title,
            "level": meta["level"], "hsk_max": hsk_level(full_text), "hsk_p90": hsk_profile(full_text)[1],
            "author": meta.get("author"), "illustrator": meta.get("illustrator"),
            "translator": meta.get("translator"), "narrator": meta.get("narrator"),
            "origin": {"title": meta.get("origin_title"), "url": meta.get("origin_url")},
            "cover": f"/open/global-storybooks-zh/covers/{sid}.jpg" if cover else None,
            "cover_url": cover, "audio_full": meta["audio_full"],
            "page_count": len(out_pages), "char_count": len(re.findall(r"[一-鿿]", full_text)),
            "pages": out_pages,
            "source": "Global Storybooks 中文故事集", "license": lic_name, "license_url": lic_url,
            "attribution": attribution,
        })

    # covers (from local media if downloaded, else fetch the cover image directly)
    for s in stories:
        if not s["cover_url"]:
            continue
        dest = os.path.join(COVERS, f"{s['story_id']}.jpg")
        local = os.path.join(MEDIA, s["story_id"], "01.jpg")
        if os.path.exists(dest) and "--force-covers" not in sys.argv:
            continue
        if os.path.exists(local):
            make_cover(local, dest)
        else:
            r = sess.get(s["cover_url"], timeout=60)
            r.raise_for_status()
            make_cover(r.content, dest)
            time.sleep(0.3)

    if download:
        for m in manifest:
            dest = os.path.join(MEDIA, m["path"])
            if not (os.path.exists(dest) and os.path.getsize(dest) > 0):
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                for attempt in range(3):
                    try:
                        r = sess.get(m["url"], timeout=120)
                        r.raise_for_status()
                        open(dest, "wb").write(r.content)
                        break
                    except Exception as e:  # noqa: BLE001
                        print("retry", m["url"], e, file=sys.stderr)
                        time.sleep(2)
                time.sleep(0.1)
    for m in manifest:
        dest = os.path.join(MEDIA, m["path"])
        m["bytes"] = os.path.getsize(dest) if os.path.exists(dest) else None

    write_json(os.path.join(OUT, "data.json"), {
        "source": "Global Storybooks 中文故事集", "source_url": "https://global-asp.github.io/storybooks-chinese/",
        "repo": "https://github.com/global-asp/storybooks-chinese",
        "count": len(stories), "skipped": skipped, "stories": stories})
    write_json(os.path.join(OUT, "manifest.json"), {
        "media_root": MEDIA, "count": len(manifest),
        "total_bytes": sum(m["bytes"] or 0 for m in manifest), "files": manifest})
    print(f"stories kept {len(stories)}, skipped {len(skipped)}, pages {sum(s['page_count'] for s in stories)}, "
          f"media {len(manifest)} missing {sum(1 for m in manifest if not m['bytes'])}")


if __name__ == "__main__":
    main()
