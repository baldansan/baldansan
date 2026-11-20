# -*- coding: utf-8 -*-
"""新HSK教程1/2 аудио → public/xinhsk{1,2}-audio/lNN/  (split-audio.py-ийн хувилбар)
  textN.mp3      — сурах бичгийн 课文 N (эх N-1/3/5/7.mp3, 48kbps mono)
  wbQQ.mp3       — 学练手册 模拟测练 сонсголын асуулт QQ (1–10), whisper цагаар хуваасан
Хэрэглээ: python3 scripts/xinhsk3/split-audio12.py xinhsk1 [N ...]
"""
import os, re, subprocess, sys, importlib.util, json
from opencc import OpenCC
_t2s = OpenCC("t2s")

COURSE = sys.argv[1]
LV = int(COURSE[-1])
UP = "/mnt/user-data/uploads/hsk 3.0"
if LV == 1:
    TB = os.path.join(UP, "HSK1--3.0", "新HSK教程1 配套音频")
    def WBF(n): return os.path.join(UP, "HSK1--3.0", "HSK 教程1--学练", "《新HSK教程1 学练手册》 音频", f"第{n}课", "模拟测练.mp3")
    def TSF(n): return f"{SRC}/L{n:02d}/workbook_audio_模拟测练.txt"
else:
    TB = os.path.join(UP, "HSK2-3.0", "新HSK教程2+配套音频")
    def WBF(n): return os.path.join(UP, "HSK2-3.0", "《新HSK教程2+学练手册》音频", f"第{n}课.mp3")
    def TSF(n): return f"{SRC}/L{n:02d}/workbook_audio.txt"
SRC = f"/home/claude/work/xinhsk12/src/h{LV}"
PKG = f"/home/claude/baldansan/content/{COURSE}-packages"
OUT = f"/home/claude/baldansan/public/{COURSE}-audio"
CJK = re.compile(r"[一-鿿]+")


def ff(args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def enc(src, dst, ss=None, to=None):
    a = ["-i", src]
    if ss is not None:
        a = ["-ss", f"{ss:.2f}", *a]
    if to is not None:
        a += ["-to", f"{to - ss:.2f}"] if ss is not None else ["-to", f"{to:.2f}"]
    ff([*a, "-ac", "1", "-ar", "32000", "-b:a", "48k", dst])


def parse_ts(path):
    rows = []
    for line in open(path, encoding="utf-8"):
        m = re.match(r"^(\d+):(\d\d)\t(.*)$", line.rstrip("\n"))
        if m:
            rows.append((int(m.group(1)) * 60 + int(m.group(2)), _t2s.convert(m.group(3).strip())))
    return rows


def cjk(s):
    return "".join(CJK.findall(s))


def find_start(rows, start_idx, transcript):
    """Эхний өгүүлбэрийн 4 ханзтай давхцах эхний мөр (start_idx-ээс хойш)."""
    first = cjk(_t2s.convert(transcript))[:12]
    if len(first) >= 4:
        keys = {first[i:i + 4] for i in range(0, len(first) - 3)}
    else:
        keys = {first} if len(first) >= 2 else set()
    for i in range(start_idx, len(rows)):
        t = cjk(rows[i][1])
        if any(k in t for k in keys):
            return i
    return None


def lesson(n):
    d = f"{OUT}/l{n:02d}"
    os.makedirs(d, exist_ok=True)
    spec = importlib.util.spec_from_file_location(f"l{n:02d}_src", f"{PKG}/l{n:02d}_src.py")
    mod = importlib.util.module_from_spec(spec)
    sys.path.insert(0, PKG)
    spec.loader.exec_module(mod)
    for ti in range(1, len(mod.TEXTS) + 1):
        f = os.path.join(TB, f"{n}-{2 * ti - 1}.mp3")
        if os.path.exists(f):
            enc(f, f"{d}/text{ti}.mp3")
    if not os.path.exists(WBF(n)) or not os.path.exists(TSF(n)):
        json.dump({"texts": len(mod.TEXTS), "wb": ["no workbook listening audio"]}, open(f"{d}/index.json", "w"), ensure_ascii=False, indent=1)
        print(f"L{n:02d} texts only"); return
    items = [it for p in mod.WB_LISTEN for it in p["items"]]
    rows = parse_ts(TSF(n))
    # хуваалцсан бичвэр: «第9道10题是根据下面一段话» → 9, 10 нэг клип
    shared = {}
    for i, (t, s) in enumerate(rows):
        if ("根据下面一段话" in s or "根据下面的一段话" in s) and not shared:
            m = re.search(r"第?([0-9一二三四五六七八九十]+)[道到和、，,]", s)
            num = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}
            a = int(m.group(1)) if m and m.group(1).isdigit() else num.get(m.group(1), 9) if m else 9
            for q in range(a, len(items) + 1):
                shared[q] = i
    starts = []
    idx = 0
    for q, it in enumerate(items, 1):
        if q in shared:
            starts.append(shared[q])
            idx = max(idx, shared[q] + 1)
            continue
        tr = it["transcript"]
        if q > 1 and starts[-1] is not None and (cjk(tr)[:10] == cjk(items[q - 2]["transcript"])[:10] or re.match(r"^[（(]?同上|^[（(]?上一题", tr.strip())):
            starts.append(starts[-1])
            continue
        i = find_start(rows, idx, it["transcript"])
        if i is None:
            starts.append(None)
            continue
        starts.append(i)
        idx = i + 1
    # хэсгийн толгой (第X部分) мөрүүд — хамгийн сүүлийн асуултын төгсгөл
    heads = [t for t, s in rows if re.match(r"^第[一二三四五0-9]部分", s)]
    total = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", WBF(n)]).decode().strip())
    report = []
    for q, (it, i) in enumerate(zip(items, starts), 1):
        if i is None:
            report.append(f"Q{q}: NOT FOUND ({it['transcript'][:20]})")
            continue
        t0 = max(0.0, rows[i][0] - 1.0)
        # дараагийн олдсон асуултын эхлэл, эсвэл дараагийн хэсгийн толгой, эсвэл төгсгөл
        nxt = [rows[j][0] for j in starts[q:] if j is not None and rows[j][0] > rows[i][0] and j != i]
        nh = [h for h in heads if h > rows[i][0] + 3]
        cands = [x - 1.0 for x in nxt[:1]] + [h - 0.5 for h in nh[:1]] + [total]
        t1 = min(cands)
        if t1 - t0 > 150:
            t1 = t0 + 150
        enc(WBF(n), f"{d}/wb{q:02d}.mp3", t0, t1)
        report.append(f"Q{q}: {t0:.0f}-{t1:.0f}s ({t1 - t0:.0f}s) {rows[i][1][:18]}")
    json.dump({"texts": 4, "wb": [r for r in report]}, open(f"{d}/index.json", "w"), ensure_ascii=False, indent=1)
    print(f"L{n:02d}", " | ".join(report))


if __name__ == "__main__":
    ns = [int(x) for x in sys.argv[2:]] or range(1, 16)
    for n in ns:
        lesson(n)
