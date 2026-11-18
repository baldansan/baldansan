import sys,json,subprocess
from make_ad import *
tag,name=sys.argv[1],sys.argv[2]; pillA=sys.argv[3]
rows=json.loads(sys.argv[4])  # [[zh,[[syl,tone],...],meaning],...]
CJK=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc',150,index=2)
TC={1:(229,72,77),2:(217,137,10),3:(31,157,85),4:(47,111,224)}
im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
d.ellipse((-200,-300,700,600),fill=SOFT); d.ellipse((600,1300,1400,2100),fill=PKS)
fp=font(F9,120); fm=font(F8,60)
def row(y,zh,syls,mean):
    wz=d.textlength(zh,font=CJK); wp=sum(d.textlength(s,font=fp) for s,_ in syls); gap=50
    x=(W-(wz+gap+wp))/2
    d.text((x,y-30),zh,font=CJK,fill=INK); x+=wz+gap
    for s,t in syls:
        d.text((x,y+18),s,font=fp,fill=TC[t]); x+=d.textlength(s,font=fp)
    center(d,y+190,mean,fm,(101,92,124))
row(250,*rows[0]); row(560,*rows[1])
center(d,900,'Ялгаж сонсож\nчаддаг уу?',font(F9,104),INK)
c=camel('wow',520); im.paste(c,((W-520)//2,1240),c); im.save(f'{tag}_s1.png')
overlay(pillA,'Утга нь шал өөр болно','wow',f'{tag}_ova.png')
overlay('Андуурагддаг хос үгс','Сонсоод ялгаж сур','listen',f'{tag}_ovb.png')
endcard('Хөгөө зөв\nдуудаж сур','thumbsup',f'{tag}_s3.png')
SP=1.15
def clipc(lst,ov,out,speed=1):
    run(['-f','concat','-safe','0','-i',lst,'-i',ov,'-filter_complex',f"[0:v]setpts=PTS/{speed},fps=30,scale=702:1440[v];color=c=0xF6F1FF:s=1080x1920:r=30[bg];[bg][v]overlay=189:330:shortest=1[t];[t][1:v]overlay=0:0,format=yuv420p"]+ENC+[out])
P=[f'{tag}_1.mp4',f'{tag}_2.mp4',f'{tag}_3.mp4',f'{tag}_4.mp4']
still(f'{tag}_s1.png',3.0,P[0]); clipc(f'{tag}_A.txt',f'{tag}_ova.png',P[1],1.0); clipc(f'{tag}_B.txt',f'{tag}_ovb.png',P[2],1.4); still(f'{tag}_s3.png',3.2,P[3])
open('list.txt','w').write(''.join(f"file {p}\n" for p in P))
run(['-f','concat','-i','list.txt','-c','copy','silent.mp4'])
dur=lambda f: float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
D=dur('silent.mp4'); d1=dur(P[0]); d2=dur(P[1]); d3=dur(P[2])
log=json.load(open(f'{tag}_log.json'))
ins=['-i','silent.mp4','-i','music.mp3']; fc=[]; labs=[]
tempo=max(0.5,16.0/(D+0.1))
fc.append(f"[1:a]atempo={tempo:.4f},volume='if(lt(t,{d1-0.2}),0.8,if(lt(t,{d1+d2+d3}),0.25,0.8))':eval=frame,afade=t=in:d=0.3,afade=t=out:st={D-1.3}:d=1.2[m]")
k=0
for l in log:
    if not l.get('audio'): continue
    ins+=['-i',f"{tag}_w{l['q']}.mp3"]
    off=(d1+l['t'] if l['seg']==0 else d1+d2+l['t']/1.4)+0.2
    fc.append(f"[{k+2}:a]volume=1.7,adelay={int(off*1000)}|{int(off*1000)}[w{k}]"); labs.append(f"[w{k}]"); k+=1
fc.append(f"[m]{''.join(labs)}amix=inputs={len(labs)+1}:normalize=0:duration=first[a]")
run(ins+['-filter_complex',';'.join(fc),'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','160k','-t',str(D),name])
run(['-i',name,'-vf',f"select='eq(n,40)+eq(n,130)+eq(n,215)+eq(n,300)+eq(n,385)+eq(n,{int(D*30)-20})',scale=270:480,tile=6x1",'-frames:v','1','check.png'])
print(name,dur(name))
