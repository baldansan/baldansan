"""PPT 课件-аас зураг гаргах. Usage: images.py LESSON_N LESSON_DIR
Гаралт: LESSON_DIR/images_candidates/sNN_K.jpg|png + index.json [{file, slide, w, h, slide_text}]
Дараа нь агент сонгож LESSON_DIR/pkg/images/<slug>.jpg болгон хуулж, media_images.json бичнэ."""
import sys, os, json, glob, io
from pptx import Presentation
from pptx.util import Emu
from PIL import Image
n, D = int(sys.argv[1]), os.path.abspath(sys.argv[2])
cands = glob.glob(f"/tmp/tmp2ewijvoq/中级综合（Ⅰ）第{n}课 课件.pptx") + glob.glob(f"/tmp/ppt*/中级综合（Ⅰ）第{n}课 课件.pptx")
assert cands, "pptx олдсонгүй"
prs = Presentation(cands[0]); out = f"{D}/images_candidates"; os.makedirs(out, exist_ok=True)
rows = []
for si, slide in enumerate(prs.slides, 1):
    texts = " / ".join(sh.text_frame.text.strip().replace("\n", " ")[:80] for sh in slide.shapes if sh.has_text_frame and sh.text_frame.text.strip())
    k = 0
    for sh in slide.shapes:
        if sh.shape_type != 13: continue
        try:
            img = sh.image
            im = Image.open(io.BytesIO(img.blob))
        except Exception: continue
        w, h = im.size
        if w < 180 or h < 120: continue
        k += 1; fn = f"s{si:02d}_{k}.jpg"
        im.convert("RGB").save(f"{out}/{fn}", quality=88)
        rows.append({"file": fn, "slide": si, "w": w, "h": h, "slide_text": texts[:160]})
json.dump(rows, open(f"{out}/index.json", "w"), ensure_ascii=False, indent=1)
print(len(rows), "images →", out)
for r in rows: print(r["file"], f'{r["w"]}x{r["h"]}', "slide", r["slide"], "|", r["slide_text"][:70])
