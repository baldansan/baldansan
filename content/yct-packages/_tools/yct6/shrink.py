# shrink.py lNN : convert PNGs >300KB in pkg/images to JPG and fix JSON refs
import sys,os,glob,re
from PIL import Image
d=f"/home/claude/work/yct6/{sys.argv[1]}/pkg"
for p in glob.glob(f"{d}/images/*.png"):
    if os.path.getsize(p)<300000: continue
    im=Image.open(p).convert("RGB"); im.thumbnail((1400,1400))
    j=p[:-4]+".jpg"; im.save(j,quality=85); os.remove(p)
    old="images/"+os.path.basename(p); new="images/"+os.path.basename(j)
    for js in glob.glob(f"{d}/*.json"):
        s=open(js,encoding="utf-8").read()
        if old in s: open(js,"w",encoding="utf-8").write(s.replace(old,new))
    print("shrunk",old,"->",new,os.path.getsize(j))
