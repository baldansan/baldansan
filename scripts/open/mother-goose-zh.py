#!/usr/bin/env python3
"""Chinese Mother Goose Rhymes (I. T. Headland, 1900; Project Gutenberg #40425)
-> content/open/mother-goose-zh/data.json

Raw: https://www.gutenberg.org/cache/epub/40425/pg40425.txt
     (cached at /home/claude/open-media/raw/mother-goose-zh/pg40425.txt, override RAW=...)
The Gutenberg edition contains NO Chinese characters (0 Han chars in txt and html; the 1900 print
shows the Chinese only as calligraphy inside the illustrations). So each item has the English verse
only; `zh`/`pinyin` are null until a teacher supplies the matching Chinese folk rhyme.
Usage: python3 scripts/open/mother-goose-zh.py
"""
import os
import re
import sys

import requests

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import REPO, write_json  # noqa: E402

RAW = os.environ.get("RAW", "/home/claude/open-media/raw/mother-goose-zh")
URL = "https://www.gutenberg.org/cache/epub/40425/pg40425.txt"
OUT = os.path.join(REPO, "content/open/mother-goose-zh")
ATTR = ("“Chinese Mother Goose Rhymes”, translated and illustrated by Isaac Taylor Headland "
        "(Fleming H. Revell, 1900). Public domain; text via Project Gutenberg eBook #40425 "
        "(https://www.gutenberg.org/ebooks/40425).")


def main():
    path = os.path.join(RAW, "pg40425.txt")
    if not os.path.exists(path):
        os.makedirs(RAW, exist_ok=True)
        r = requests.get(URL, timeout=60)
        r.raise_for_status()
        open(path, "wb").write(r.content)
    t = open(path, encoding="utf-8").read().replace("\r\n", "\n")
    han = len(re.findall(r"[一-鿿]", t))
    body = t[t.index("OCTOBER, 1900") + len("OCTOBER, 1900"):t.index("_Printed in the United States")]
    body = re.sub(r"^\s*\[Illustration:[^\]]*\]\s*$", "", body, flags=re.M)
    lines = body.split("\n")
    items, cur = [], None
    for ln in lines:
        if ln and not ln.startswith(" ") and re.fullmatch(r"[A-Z0-9][A-Z0-9 ,.'’?!\"“”:;()-]*", ln.strip()):
            if cur:
                items.append(cur)
            cur = {"title": ln.strip(), "lines": []}
        elif cur is not None:
            cur["lines"].append(ln)
    if cur:
        items.append(cur)
    rhymes = []
    for i, it in enumerate(items, 1):
        ls = it["lines"]
        while ls and not ls[0].strip():
            ls.pop(0)
        while ls and not ls[-1].strip():
            ls.pop()
        # dedent 4 spaces, keep stanza breaks; riddle answers like "_A duck_." kept as `answer`
        text = [re.sub(r"^ {4}", "", x).rstrip() for x in ls]
        answer = None
        if text and re.fullmatch(r"\s*_[^_]+_\.?", text[-1]):
            answer = text.pop().strip().strip("_").rstrip("._").strip("_")
        en = re.sub(r"\n{3,}", "\n\n", "\n".join(text)).strip()
        slug = re.sub(r"[^a-z0-9]+", "-", it["title"].lower()).strip("-")
        r = {"id": f"cmg-{i:03d}-{slug}", "n": i, "title_en": " ".join(w[:1].upper() + w[1:].lower() for w in it["title"].split()),
             "title_en_original": it["title"],
             "en": en, "zh": None, "pinyin": None, "level": "kids",
             "source": "Chinese Mother Goose Rhymes (Headland 1900), Project Gutenberg #40425",
             "license": "Public domain", "attribution": ATTR}
        if answer:
            r["riddle_answer_en"] = answer
        rhymes.append(r)
    write_json(os.path.join(OUT, "data.json"), {
        "source": "Chinese Mother Goose Rhymes — Isaac Taylor Headland (1900)",
        "source_url": "https://www.gutenberg.org/ebooks/40425",
        "scan_url": "https://archive.org/details/chinesemothergoo00head",
        "license": "Public domain",
        "han_chars_in_ebook": han,
        "note": "English verse translations only; the ebook has no Chinese text. zh/pinyin are null.",
        "count": len(rhymes), "rhymes": rhymes})
    print("rhymes", len(rhymes), "han chars in ebook", han)


if __name__ == "__main__":
    main()
