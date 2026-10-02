#!/usr/bin/env python3
"""
Бичлэгийн цувралын хадмал JSON угсрагч (apps /admin/import/bichleg формат).

Оролт — нэг хавтас, жишээ: work/feizhengshi/
  config.json          цуврал + ангиудын мэдээлэл (доор)
  captions/epNN.json3  yt-dlp-ийн хятад хадмал (--sub-format json3), эсвэл epNN.srt
  mn/epNN.txt          орчуулга: мөр бүр "N|монгол орчуулга" (N = хадмалын дугаар, 1-ээс)
  gloss.json           (заавал биш) нэмэлт үгийн толь {"хятад үг": "монгол утга"}

config.json:
{
  "series": {"id": "feizhengshi", "title_zh": "非正式会谈 第八季", "title_mn": "Албан бус хэлэлцүүлэг — 8-р бүлэг",
             "description_mn": "...", "hsk_level": 5},
  "episodes": [
    {"ep": 1, "youtube_id": "XXXX", "title_zh": "...", "title_mn": "...", "duration_sec": 4200},
    ...
  ]
}

Гаралт: out/<series>/series.json + <series>-epNN.json → admin импорт руу чирнэ.

Хэрэглээ:
  python3 scripts/bichleg/build_series.py work/feizhengshi            # угсрах
  python3 scripts/bichleg/build_series.py work/feizhengshi --export-zh # орчуулах мөрүүдийг mn/epNN.todo.txt болгож гаргана
                                                                      # (ChatGPT-д өгөх "N|хятад" формат)
Шаардлага: pip install pypinyin jieba
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts", "bichleg"))

def load_json(p, default=None):
    if not os.path.exists(p):
        return default
    with open(p, encoding="utf-8") as f:
        return json.load(f)

def parse_json3(path):
    d = load_json(path)
    out = []
    for e in d.get("events", []):
        if not e.get("segs"):
            continue
        t = "".join(s.get("utf8", "") for s in e["segs"]).replace("\\N", " ").strip()
        if not t or t == "\n":
            continue
        out.append((e["tStartMs"] / 1000, (e["tStartMs"] + e.get("dDurationMs", 2000)) / 1000, t))
    return out

def parse_srt(path):
    txt = open(path, encoding="utf-8-sig").read()
    out = []
    for block in re.split(r"\n\s*\n", txt.strip()):
        lines = block.strip().split("\n")
        if len(lines) < 2:
            continue
        m = re.search(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)", lines[1] if "-->" in lines[1] else lines[0])
        if not m:
            continue
        g = list(map(int, m.groups()))
        s = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        e = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        text = " ".join(l for l in lines[(2 if "-->" in lines[1] else 1):]).strip()
        text = re.sub(r"<[^>]+>", "", text)
        if text:
            out.append((s, e, text))
    return out

def load_captions(folder, ep):
    for ext, fn in (("json3", parse_json3), ("srt", parse_srt)):
        p = os.path.join(folder, "captions", f"ep{ep:02d}.{ext}")
        if os.path.exists(p):
            return fn(p)
    raise SystemExit(f"captions/ep{ep:02d}.json3 (эсвэл .srt) олдсонгүй")

def load_mn(folder, ep):
    p = os.path.join(folder, "mn", f"ep{ep:02d}.txt")
    if not os.path.exists(p):
        return None
    out = {}
    for line in open(p, encoding="utf-8-sig"):
        line = line.rstrip("\n")
        if "|" not in line:
            continue
        n, t = line.split("|", 1)
        n = n.strip()
        if n.isdigit() and t.strip():
            out[int(n)] = t.strip()
    return out

def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    folder = sys.argv[1]
    export_only = "--export-zh" in sys.argv
    cfg = load_json(os.path.join(folder, "config.json"))
    if not cfg:
        raise SystemExit("config.json байхгүй")

    if export_only:
        os.makedirs(os.path.join(folder, "mn"), exist_ok=True)
        for epc in cfg["episodes"]:
            caps = load_captions(folder, epc["ep"])
            p = os.path.join(folder, "mn", f"ep{epc['ep']:02d}.todo.txt")
            with open(p, "w", encoding="utf-8") as f:
                for i, (_, _, t) in enumerate(caps):
                    f.write(f"{i + 1}|{t}\n")
            print(f"ep{epc['ep']:02d}: {len(caps)} мөр → {p}")
        print("Эдгээрийг ChatGPT-ээр орчуулуулаад mn/epNN.txt нэрээр хадгал (формат: N|орчуулга).")
        return

    import jieba, logging
    jieba.setLogLevel(logging.ERROR)
    from pypinyin import pinyin, Style

    hsk = {w["simplified"]: w for w in load_json(os.path.join(ROOT, "data", "hsk_words.json"), [])}
    gloss = load_json(os.path.join(ROOT, "scripts", "bichleg", "gloss-mn.json"), {})
    gloss.update(load_json(os.path.join(folder, "gloss.json"), {}))
    for w in gloss:
        if re.search(r"[一-鿿]", w) and len(w) >= 2:
            jieba.add_word(w, freq=100000)

    def py(s):
        return " ".join(x[0] for x in pinyin(s, style=Style.TONE))

    missing = {}

    def seg(text):
        out, keys = [], 0
        for w in jieba.cut(text):
            w = w.strip()
            if not w or not re.search(r"[\w一-鿿%]", w):
                continue
            if not re.search(r"[一-鿿]", w):
                out.append({"zh": w, "pinyin": w, "mn": gloss.get(w, w)})
                continue
            d = {"zh": w, "pinyin": py(w)}
            if w in gloss:
                d["mn"] = gloss[w]
            elif w in hsk and hsk[w].get("meaning_mn"):
                d["mn"] = hsk[w]["meaning_mn"]
                try:
                    lv = int(str(hsk[w].get("hsk_level") or "0").split("-")[0])
                except ValueError:
                    lv = 0
                if len(w) >= 2 and lv >= 3 and keys < 2:
                    d["key"] = True
                    keys += 1
            else:
                d["mn"] = ""
                missing[w] = missing.get(w, 0) + 1
            out.append(d)
        return out

    s = cfg["series"]
    outdir = os.path.join(folder, "out", s["id"])
    os.makedirs(outdir, exist_ok=True)
    json.dump({"id": s["id"], "title_zh": s.get("title_zh"), "title_mn": s["title_mn"],
               "description_mn": s.get("description_mn", ""), "hsk_level": s.get("hsk_level", 4)},
              open(os.path.join(outdir, "series.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    total = 0
    for epc in cfg["episodes"]:
        ep = epc["ep"]
        caps = load_captions(folder, ep)
        mn = load_mn(folder, ep)
        if mn is None:
            print(f"ep{ep:02d}: mn/ep{ep:02d}.txt байхгүй — алгаслаа")
            continue
        subs, nomn = [], 0
        for i, (st, en, zh) in enumerate(caps):
            m = mn.get(i + 1, "")
            if not m:
                nomn += 1
            subs.append({"index": i + 1, "start": round(st, 2), "end": round(en, 2), "zh": zh,
                         "pinyin": py(zh), "mn": m, "words": seg(zh)})
        vid = f"{s['id']}-ep{ep:02d}"
        json.dump({"video_id": vid, "youtube_id": epc["youtube_id"], "series_id": s["id"], "episode_no": ep,
                   "title_zh": epc.get("title_zh") or f"{s.get('title_zh', '')} 第{ep}集",
                   "title_mn": epc.get("title_mn") or f"{ep}-р анги",
                   "source": epc.get("source", "YouTube"),
                   "source_url": f"https://www.youtube.com/watch?v={epc['youtube_id']}",
                   "hsk_level": s.get("hsk_level", 4), "duration_sec": epc.get("duration_sec"),
                   "subtitle_offset_sec": epc.get("subtitle_offset_sec", 0), "tags": s.get("tags", []),
                   "subtitles": subs},
                  open(os.path.join(outdir, f"{vid}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        total += len(subs)
        print(f"ep{ep:02d}: {len(subs)} мөр, орчуулга дутуу {nomn}")

    if missing:
        p = os.path.join(folder, "missing-words.txt")
        with open(p, "w", encoding="utf-8") as f:
            for w, c in sorted(missing.items(), key=lambda x: -x[1]):
                f.write(f"{w}|\n")
        print(f"\nУтгагүй {len(missing)} үг → {p}  (ChatGPT-ээр '|'-ийн ард утгыг нь бичүүлээд gloss.json-д {{\"үг\":\"утга\"}} болгож нэм, дахин ажиллуул)")
    print(f"\nНийт {total} мөр → {outdir}/  (admin импорт: series.json + анги бүрийн json)")

if __name__ == "__main__":
    main()
