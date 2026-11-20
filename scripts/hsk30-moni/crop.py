#!/usr/bin/env python3
"""crop.py <src/Lx/testN> <page> <x0> <y0> <x1> <y1> <out.webp>
Coordinates are in the 110-dpi page image (p-NN.png) space; crops from a 220-dpi render for quality."""
import sys,os,subprocess,glob
from PIL import Image
d,page,x0,y0,x1,y1,out=sys.argv[1],int(sys.argv[2]),*map(float,sys.argv[3:7]),sys.argv[7]
cache=f'{d}_pages/hi220-{page:02d}.png'
if not os.path.exists(cache):
    tmp=f'/tmp/crop_{os.getpid()}'
    subprocess.run(['pdftoppm','-r','220','-f',str(page),'-l',str(page),'-png',d+'.pdf',tmp],check=True)
    os.rename(glob.glob(tmp+'*.png')[0],cache)
im=Image.open(cache).convert('RGB'); s=220/110
box=tuple(int(round(v*s)) for v in (x0,y0,x1,y1))
c=im.crop(box); c.thumbnail((640,640))
os.makedirs(os.path.dirname(out) or '.',exist_ok=True); c.save(out,'WEBP',quality=82); print(out,c.size)
