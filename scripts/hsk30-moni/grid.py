#!/usr/bin/env python3
"""grid.py <png> → <png>.grid.png with coordinate rulers every 50px (labels every 100)."""
import sys
from PIL import Image,ImageDraw
f=sys.argv[1]; im=Image.open(f).convert('RGB'); W,H=im.size
d=ImageDraw.Draw(im)
for x in range(0,W,50):
    d.line([(x,0),(x,H)],fill=(255,0,0) if x%100==0 else (255,170,170),width=1)
    if x%100==0: d.text((x+2,2),str(x),fill=(255,0,0)); d.text((x+2,H-12),str(x),fill=(255,0,0))
for y in range(0,H,50):
    d.line([(0,y),(W,y)],fill=(0,0,255) if y%100==0 else (170,170,255),width=1)
    if y%100==0: d.text((2,y+2),str(y),fill=(0,0,255)); d.text((W-30,y+2),str(y),fill=(0,0,255))
im.save(f.replace('.png','.grid.png')); print(f.replace('.png','.grid.png'),W,H)
