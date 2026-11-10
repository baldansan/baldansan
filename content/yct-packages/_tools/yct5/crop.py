#!/usr/bin/env python3
"""Номын хуудаснаас зураг хайчлах туслах. Хэрэглээ:
  python3 -I /home/claude/work/yct1/crop.py <page.png> <out.png> x0 y0 x1 y1   # хувь (0..1)
  python3 -I /home/claude/work/yct1/crop.py --sheet <dir> <out.jpg>             # хавтасны бүх png-ийг contact sheet болгож шалгах
L1 жишээ (Test хуудас, 150dpi): сонсгол мөр y (0.20,0.30),(0.31,0.41),(0.42,0.52); багана x (0.30,0.49),(0.50,0.69),(0.70,0.89);
унших мөр y (0.595,0.69),(0.70,0.795),(0.80,0.90), зургийн багана x 0.29–0.50. Хуудас бүр өөр тул эхлээд p-*.png-ийг хараад хувийг тааруул.
"""
import sys, glob
from PIL import Image

if sys.argv[1] == "--sheet":
    fs = sorted(glob.glob(f"{sys.argv[2]}/*.png"))
    ims = [Image.open(f).convert("RGB") for f in fs]
    w, h = 300, 240
    cols = 5
    sheet = Image.new("RGB", (w * cols, h * ((len(ims) + cols - 1) // cols)), "white")
    for i, im in enumerate(ims):
        im.thumbnail((w - 10, h - 10))
        sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    sheet.save(sys.argv[3])
    print(len(ims), "images →", sys.argv[3])
else:
    src, out = sys.argv[1], sys.argv[2]
    x0, y0, x1, y1 = map(float, sys.argv[3:7])
    p = Image.open(src)
    W, H = p.size
    p.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))).save(out)
    print(out)
