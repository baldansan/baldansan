import sys,json,subprocess
from PIL import Image, ImageDraw, ImageFont
W,H=1080,1920
F9='package/900Black/Nunito_900Black.ttf'; F8='package/800ExtraBold/Nunito_800ExtraBold.ttf'
BG=(246,241,255); P=(124,77,219); DEEP=(63,36,133); INK=(42,31,69); PK=(214,51,108); PKS=(255,222,234); SOFT=(235,225,255)
T='/home/claude/baldansan/public/temee/v2/'
PX,PY,PW,PH=189,330,702,1440
def font(p,s): return ImageFont.truetype(p,s)
def fit(d,text,p,size,maxw=980):
    while size>40:
        f=font(p,size)
        if max(d.textlength(l,font=f) for l in text.split('\n'))<=maxw: return f
        size-=4
    return font(p,size)
def camel(n,s): return Image.open(T+n+'.webp').convert('RGBA').resize((s,s),Image.LANCZOS)
def center(d,y,text,f,fill):
    for line in text.split('\n'):
        w=d.textlength(line,font=f); d.text(((W-w)/2,y),line,font=f,fill=fill); y+=int(f.size*1.18)
    return y
def pill(d,cx,y,text,f,bg,fg,padx=44,pady=22):
    w=d.textlength(text,font=f); h=f.size
    d.rounded_rectangle((cx-w/2-padx,y,cx+w/2+padx,y+h+2*pady),radius=(h+2*pady)//2,fill=bg)
    d.text((cx-w/2,y+pady-6),text,font=f,fill=fg)
def hook(text,cam,out):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    d.ellipse((-200,-300,700,600),fill=SOFT); d.ellipse((600,1300,1400,2100),fill=PKS)
    center(d,430,text,fit(d,text,F9,128),INK)
    c=camel(cam,620); im.paste(c,((W-620)//2,1010),c); im.save(out)
def overlay(step,title,cam,out):
    ov=Image.new('RGBA',(W,H),BG+(255,)); d=ImageDraw.Draw(ov)
    d.ellipse((-260,-360,560,460),fill=SOFT+(255,))
    pill(d,W//2,70,step,font(F8,44),PK,(255,255,255))
    center(d,180,title,fit(d,title,F9,84),INK)
    d.rounded_rectangle((PX-18,PY-18,PX+PW+18,PY+PH+18),radius=78,fill=DEEP+(255,))
    hole=Image.new('L',(W,H),255); ImageDraw.Draw(hole).rounded_rectangle((PX,PY,PX+PW,PY+PH),radius=60,fill=0)
    ov.putalpha(hole)
    c=camel(cam,330); ov.alpha_composite(c,(W-340,H-370)); ov.save(out)
def endcard(text,cam,out):
    im=Image.new('RGB',(W,H),P); d=ImageDraw.Draw(im)
    d.ellipse((-300,-300,600,600),fill=(139,95,227)); d.ellipse((560,1350,1400,2200),fill=(101,55,194))
    d.ellipse((W//2-330,330,W//2+330,990),fill=PKS)
    c=camel(cam,560); im.paste(c,((W-560)//2,390),c)
    y=center(d,1080,text,fit(d,text,F9,112),(255,255,255))
    y=center(d,y+40,'Бөөндөө Сурцгаая',font(F8,64),(235,225,255))
    pill(d,W//2,y+70,'Үнэгүй · surtsgaay.buunduu.mn',font(F8,50),(255,255,255),DEEP); im.save(out)
ENC='-c:v libx264 -crf 18 -preset veryfast -pix_fmt yuv420p -r 30'.split()
def run(a): subprocess.run(['ffmpeg','-y','-loglevel','error']+a,check=True)
def still(png,dur,out): run(['-framerate','30','-i',png,'-vf',f'format=yuv420p,loop=-1:1,trim=duration={dur},fade=in:0:8']+ENC+[out])
def clip(src,ss,to,speed,ov,out):
    run(['-ss',str(ss),'-to',str(to),'-i',src,'-i',ov,'-filter_complex',f"[0:v]setpts=PTS/{speed},fps=30,scale=702:1440[v];color=c=0xF6F1FF:s=1080x1920:r=30[bg];[bg][v]overlay=189:330:shortest=1[t];[t][1:v]overlay=0:0,format=yuv420p"]+ENC+[out])
def finish(parts,name):
    open('list.txt','w').write(''.join(f"file {p}\n" for p in parts))
    run(['-f','concat','-i','list.txt','-c','copy','silent.mp4'])
    D=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','silent.mp4']))
    run(['-i','silent.mp4','-i','music.mp3','-map','0:v','-map','1:a','-c:v','copy','-af',f'afade=t=in:d=0.3,afade=t=out:st={D-1.3}:d=1.2,volume=0.8','-c:a','aac','-b:a','160k','-t',str(D),name])
    run(['-i',name,'-vf',f"select='eq(n,40)+eq(n,110)+eq(n,200)+eq(n,260)+eq(n,330)+eq(n,{int(D*30)-20})',scale=270:480,tile=6x1",'-frames:v','1','check.png'])
    print(name,D)
