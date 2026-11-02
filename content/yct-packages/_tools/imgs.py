#!/usr/bin/env python3
"""Higgsfield batch бэлтгэх / татах.
  python3 -I imgs.py req lNN [start_index]  → requests JSON (generate_image_batch-д хуулах), index map хадгална
  python3 -I imgs.py dl  lNN jobs.json      → jobs.json = [{"index":..,"result_url":..}] → pkg/images/<file> (jpg, ≤1024)
"""
import sys, json, os, urllib.request
from PIL import Image

REF = {
    "temee": "4a573910-2190-4f01-8b21-d2d072e79938",
    "huu": "21264a21-25bf-420c-a92c-5b4f5029b2e6",
    "ohin": "d517e32d-d705-402b-a9f7-6056ea34be87",
    "bor": "a42caa23-74a9-4a04-a8af-4f0ada45ea4b",
}
DESC = {
    "temee": "the camel TEACHER: tall yellow camel standing upright on two legs like a person, black rectangular glasses, green sweater over white shirt",
    "huu": "the baby camel BOY: small yellow camel calf, blue vest over white t-shirt, dark shorts, red backpack",
    "ohin": "the baby camel GIRL: small caramel camel calf, yellow dress with white collar, two hair tufts with pink bows, pink shoes",
    "bor": "the dark-brown baby camel BOY: green hoodie, orange shorts, green backwards cap",
}
STYLE = "Children's 2D cartoon illustration, flat clean vector style, bright colors, soft rounded shapes, big expressive eyes, suitable for 6-year-olds. No English text, no Latin letters anywhere. "

W = "/home/claude/work/yct1"

def req(lesson, start):
    d = f"{W}/{lesson}"
    items = json.load(open(f"{d}/image_prompts.json", encoding="utf-8"))
    out, idx = [], []
    for k, it in enumerate(items):
        chars = [c for c in it.get("chars", []) if c in REF]
        medias = [{"value": REF[c], "role": "image_references"} for c in chars]
        refdesc = ""
        if chars:
            refdesc = "Use the reference images exactly for the characters, in this order: " + "; ".join(f"reference {i+1} = {DESC[c]}" for i, c in enumerate(chars)) + ". "
        prompt = STYLE + refdesc + it["prompt"]
        i = start + k
        out.append({"index": i, "params": {"model": "gpt_image_2_5", "aspect_ratio": it.get("aspect", "1:1"), "quality": "medium", "resolution": "1k", "medias": medias, "prompt": prompt}})
        idx.append({"index": i, "file": it["file"]})
    json.dump(idx, open(f"{d}/image_index.json", "w"), indent=1)
    print(json.dumps(out, ensure_ascii=False))
    print(f"\n# {len(out)} requests, indices {start}..{start+len(out)-1}", file=sys.stderr)

def dl(lesson, jobs_file):
    d = f"{W}/{lesson}"
    idx = {x["index"]: x["file"] for x in json.load(open(f"{d}/image_index.json"))}
    jobs = json.load(open(jobs_file))
    for j in jobs:
        f = idx.get(j["index"])
        if not f or not j.get("result_url"):
            print("skip", j); continue
        tmp = f"/tmp/img_{j['index']}.png"
        urllib.request.urlretrieve(j["result_url"], tmp)
        im = Image.open(tmp).convert("RGB"); im.thumbnail((1024, 1024))
        out = f"{d}/pkg/{f}"
        os.makedirs(os.path.dirname(out), exist_ok=True)
        if out.endswith(".png"): out = out[:-4] + ".jpg"
        im.save(out, quality=86)
        print("saved", out)

if __name__ == "__main__":
    if sys.argv[1] == "req": req(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 0)
    else: dl(sys.argv[2], sys.argv[3])
