#!/usr/bin/env python3
"""StoryWeaver (Pratham Books) — Chinese (Simplified) -> content/open/storyweaver-zh/data.json

Fetching (cached under /home/claude/open-media/raw/storyweaver-zh/, override with RAW=...):
  1. GET https://storyweaver.org.in/api/v1/books-search?languages[]=Chinese (Simplified)&page=N&per_page=200
     -> list of books (id, slug, title, level, authors, illustrators, coverImage, isAudio ...)
  2. GET https://storyweaver.org.in/api/v1/stories/<slug>/read?embed=true
     -> public embed-reader JSON (no login needed): pages[] with HTML (text + illustration crops),
        and the BackInnerCoverPage with the official attribution + per-item license text.
     (The plain /read endpoint returns 401 without login; PDF/ePub download needs a login token.)
Usage:
  python3 scripts/open/storyweaver-zh.py            # fetch missing raw JSON (0.3 s between calls) + build
  python3 scripts/open/storyweaver-zh.py --offline  # build from cache only
Only stories whose attribution page lists exclusively CC BY / CC BY-SA / CC0 licenses are kept.
Images: URLs only (manifest.json); one small cover per story -> public/open/storyweaver-zh/covers/<id>.jpg
"""
import html
import json
import os
import re
import sys
import time

import requests

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import (REPO, hsk_level, hsk_profile, make_cover, to_pinyin,  # noqa: E402
                      to_simplified, write_json)

BASE = "https://storyweaver.org.in"
LANG = "Chinese (Simplified)"
RAW = os.environ.get("RAW", "/home/claude/open-media/raw/storyweaver-zh")
OUT = os.path.join(REPO, "content/open/storyweaver-zh")
COVERS = os.path.join(REPO, "public/open/storyweaver-zh/covers")
UA = {"User-Agent": "BuunduuOpenIngest/1.0 (educational use; CC BY attribution kept)"}
ALLOWED = {"CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
           "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
           "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
           "CC0": "https://creativecommons.org/publicdomain/zero/1.0/"}

DELAY = float(os.environ.get("DELAY", "1.0"))  # seconds between API calls (site returns 429 when faster)
sess = requests.Session()
sess.headers.update(UA)


def get_json(url, cache, offline):
    if os.path.exists(cache):
        return json.load(open(cache, encoding="utf-8"))
    if offline:
        return None
    for attempt in range(6):
        try:
            r = sess.get(url, timeout=60)
            if r.status_code == 200:
                d = r.json()
                os.makedirs(os.path.dirname(cache), exist_ok=True)
                json.dump(d, open(cache, "w", encoding="utf-8"), ensure_ascii=False)
                time.sleep(DELAY)
                return d
            print("HTTP", r.status_code, url, file=sys.stderr)
            if r.status_code == 429:
                time.sleep(int(r.headers.get("Retry-After") or 30))
                continue
            if r.status_code in (401, 403, 404):
                return {"ok": False, "status": r.status_code}
        except Exception as e:  # noqa: BLE001
            print("err", url, e, file=sys.stderr)
        time.sleep(2 + attempt * 3)
    return None


def text_of(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"</p>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("\xa0", " ").replace("­", "")
    lines = [re.sub(r"[ \t]+", " ", x).strip() for x in s.splitlines()]
    return "\n".join(x for x in lines if x)


def page_text(h):
    """All text boxes of a page (classic layout: one content div; newer layout: several
    absolutely-positioned content divs after the page number), in document order."""
    parts = [text_of(x) for x in re.findall(r"<div class='[^']*\bcontent\b[^']*'[^>]*>(.*?)</div>", h, re.S)]
    return "\n".join(x for x in parts if x)


def page_image(h, size=4):
    m = re.search(r'data-size%d-src="([^"]+)"' % size, h)
    if not m:
        m = re.search(r'data-size\d-src="([^"]+)"', h)
    return m.group(1) if m else None


def fetch_list(offline):
    books, page = [], 1
    while True:
        url = f"{BASE}/api/v1/books-search?" + requests.compat.urlencode(
            {"languages[]": LANG, "page": page, "per_page": 200})
        d = get_json(url, os.path.join(RAW, f"list-{page}.json"), offline)
        if not d or not d.get("data"):
            break
        books += d["data"]
        if page >= d["metadata"]["totalPages"]:
            break
        page += 1
    return books


def main():
    offline = "--offline" in sys.argv
    books = fetch_list(offline)
    print("listed", len(books))
    stories, skipped, manifest = [], [], []
    for b in books:
        slug = b["slug"]
        rd = get_json(f"{BASE}/api/v1/stories/{slug}/read?embed=true",
                      os.path.join(RAW, "read", f"{b['id']}.json"), offline)
        if not rd or not rd.get("ok"):
            skipped.append({"id": b["id"], "slug": slug, "title": b["title"], "reason": "read JSON unavailable"})
            continue
        data = rd["data"]
        pages, attrib_html, level_help = [], "", None
        for p in data["pages"]:
            if p["pageType"] == "StoryPage":
                pages.append({"pos": p["pagePostion"], "text": page_text(p["html"]),
                              "image": page_image(p["html"])})
            elif p["pageType"] == "BackInnerCoverPage":
                attrib_html += p["html"]
            elif p["pageType"] == "BackCoverPage":
                m = re.search(r'reading_level_help">(.*?)</div>', p["html"], re.S)
                level_help = text_of(m.group(1)) if m else None
        blocks = re.findall(r'<div class="attribution-text">(.*?)(?:<div class="license_container">|$)', attrib_html, re.S)
        attribution = " ".join(text_of(b) for b in blocks)
        attribution = re.sub(r"\s*\n\s*", " ", attribution)
        attribution = re.sub(r"\s+([.,])", r"\1", attribution).strip()
        attribution = re.sub(r"(\s*Images Attributions:)+\s*$", "", attribution)
        lics = set(re.findall(r"Released under (CC[ A-Z0-9-]*?\d\.\d|CC0)[ \w]*? license", attribution))
        if not lics:
            lics = set(re.findall(r"(CC BY(?:-[A-Z]{2})*(?:-[A-Z]{2})? \d\.\d)", attribution))
        bad = [x for x in lics if x not in ALLOWED]
        if not lics or bad:
            skipped.append({"id": b["id"], "slug": slug, "title": b["title"],
                            "reason": f"license {sorted(lics) or 'not found'}"})
            continue
        lic = "CC BY-SA 4.0" if "CC BY-SA 4.0" in lics else ("CC BY 4.0" if "CC BY 4.0" in lics else sorted(lics)[0])
        out_pages, converted = [], 0
        for i, p in enumerate(pages, 1):
            zh = to_simplified(p["text"])
            converted += zh != p["text"]
            item = {"id": f"sw-zh-{b['id']}-p{i:02d}", "page": i, "reader_page": p["pos"], "zh": zh, "pinyin": to_pinyin(zh),
                    "hsk_max": hsk_level(zh), "image": p["image"]}
            if not zh:
                item["no_text"] = True
            out_pages.append(item)
            if p["image"]:
                manifest.append({"story": b["id"], "page": i, "kind": "image", "url": p["image"]})
        full = "".join(p["zh"] for p in out_pages)
        cover_sizes = (b.get("coverImage") or {}).get("sizes") or []
        cover_url = cover_sizes[0]["url"] if cover_sizes else None
        if cover_url:
            manifest.append({"story": b["id"], "page": 0, "kind": "cover", "url": cover_url})
        title = to_simplified(b["title"])
        orig = None
        st = None
        stories.append({
            "id": f"sw-zh-{b['id']}", "story_id": b["id"], "slug": slug,
            "url": f"{BASE}/stories/{slug}",
            "title": title, "title_pinyin": to_pinyin(title),
            "description": to_simplified(b.get("description") or "") or None,
            "level": int(b["level"]) if str(b.get("level", "")).isdigit() else b.get("level"),
            "level_help": level_help,
            "hsk_max": hsk_level(full), "hsk_p90": hsk_profile(full)[1],
            "authors": [a["name"] for a in b.get("authors") or []],
            "original_authors": b.get("original_authors") or [],
            "illustrators": [a["name"] for a in b.get("illustrators") or []],
            "publisher": (b.get("publisher") or {}).get("name"),
            "is_audio": bool(b.get("isAudio")),
            "orientation": data.get("orientation"),
            "cover": f"/open/storyweaver-zh/covers/{b['id']}.jpg" if cover_url else None,
            "cover_url": cover_url,
            "_cover_alts": [x["url"] for x in cover_sizes[1:3]] + [p["image"] for p in out_pages[:1] if p["image"]],
            "page_count": len(out_pages),
            "char_count": len(re.findall(r"[一-鿿]", full)),
            "t2s_pages_changed": converted,
            "flags": [f for f, ok in (
                ("wordless", not re.search(r"[\u4e00-\u9fff]", full)),
                ("inline_pinyin", len(re.findall(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", full.lower())) >= 5),
                ("latin_names_in_text", len(re.findall(r"[A-Za-z]{2,}", full)) >= 3),
            ) if ok],
            "pages": out_pages,
            "source": "StoryWeaver (Pratham Books)", "license": lic, "license_url": ALLOWED[lic],
            "licenses_all": sorted(lics),
            "attribution": attribution,
        })
        del orig, st

    # covers
    for s in stories:
        if not s["cover_url"]:
            continue
        dest = os.path.join(COVERS, f"{s['story_id']}.jpg")
        if os.path.exists(dest) or offline:
            continue
        urls = [s["cover_url"]] + [u for u in s.pop("_cover_alts", []) if u != s["cover_url"]]
        for u in urls:  # some size1 crops 404 -> try larger crops, then the first page illustration
            try:
                r = sess.get(u, timeout=60)
                r.raise_for_status()
                make_cover(r.content, dest, max_side=268)
                s["cover_url"] = u
                time.sleep(0.1)
                break
            except Exception as e:  # noqa: BLE001
                print("cover fail", s["story_id"], u, e, file=sys.stderr)
    for s in stories:
        s.pop("_cover_alts", None)
        if s["cover"] and not os.path.exists(os.path.join(COVERS, f"{s['story_id']}.jpg")):
            s["cover"] = None

    stories.sort(key=lambda s: (s["level"] if isinstance(s["level"], int) else 9, s["story_id"]))
    write_json(os.path.join(OUT, "data.json"), {
        "source": "StoryWeaver (Pratham Books)", "source_url": f"{BASE}/en/stories?language=Chinese%20(Simplified)",
        "language": LANG, "listed": len(books), "count": len(stories),
        "skipped": skipped, "stories": stories})
    write_json(os.path.join(OUT, "manifest.json"), {
        "note": "Image URLs only (not downloaded). data-size4 crops for pages, size1 for covers.",
        "count": len(manifest), "files": manifest})
    import collections
    print("kept", len(stories), "skipped", len(skipped),
          "levels", dict(collections.Counter(s["level"] for s in stories)),
          "pages", sum(s["page_count"] for s in stories),
          "empty-text pages", sum(1 for s in stories for p in s["pages"] if p.get("no_text")),
          "t2s changed", sum(s["t2s_pages_changed"] for s in stories))
    print("skip reasons", collections.Counter(x["reason"] for x in skipped))


if __name__ == "__main__":
    main()
