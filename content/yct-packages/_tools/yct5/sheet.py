import sys,glob; from PIL import Image
l=sys.argv[1]; fs=sorted(glob.glob(f'{l}/pkg/images/*.jpg')); W=256
sheet=Image.new('RGB',(W*4, W*((len(fs)+3)//4)),'white')
for i,f in enumerate(fs):
    im=Image.open(f); im.thumbnail((W,W)); sheet.paste(im,((i%4)*W,(i//4)*W))
sheet.save(f'/tmp/claude-0/-home-claude/423ec002-bfed-5c3f-9487-457e42ca1ebb/scratchpad/sheet_{l}.jpg',quality=80); print(len(fs), [f.split('/')[-1] for f in fs])
