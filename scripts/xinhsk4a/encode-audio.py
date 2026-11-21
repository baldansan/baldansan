# -*- coding: utf-8 -*-
"""新HSK教程4上 аудио → public/xinhsk4a-audio/lNN/
  textN.mp3  — 课文 N (эх N-1/3/5/7.mp3), wordsN.mp3 — 生词 N (эх N-2/4/6/8.mp3); 48kbps mono.
Эх: /mnt/user-data/uploads/hsk 3.0/【新HSK 4上】/2. 新HSK教程4上 音频/ (чат дотор staged). Хэрэглээ: python3 scripts/xinhsk4a/encode-audio.py [N ...]"""
import os, subprocess, sys
SRC = "/mnt/user-data/uploads/hsk 3.0/【新HSK 4上】/2. 新HSK教程4上 音频"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "xinhsk4a-audio")
def src(n, k):
    for c in (f"{n}-{k}.mp3", f"{n}--{k}.mp3"):
        p = os.path.join(SRC, c)
        if os.path.exists(p): return p
    raise FileNotFoundError((n, k))
for n in [int(a) for a in sys.argv[1:]] or range(1, 11):
    d = os.path.join(OUT, f"l{n:02d}"); os.makedirs(d, exist_ok=True)
    for k in range(1, 9):
        name = f"text{(k+1)//2}.mp3" if k % 2 else f"words{k//2}.mp3"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src(n, k), "-ac", "1", "-ar", "32000", "-b:a", "48k", os.path.join(d, name)], check=True)
    print(n, "ok")
