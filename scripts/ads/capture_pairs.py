import os,time,json,re,subprocess,urllib.parse,sys,shutil
from playwright.sync_api import sync_playwright
words=sys.argv[1].split(','); tag=sys.argv[2]; wrong_first=True
PIN={'熊猫':'xióngmāo','睡觉':'shuìjiào','眼镜':'yǎnjìng','眼睛':'yǎnjing','买':'mǎi','实际':'shíjì','世纪':'shìjì','水饺':'shuǐjiǎo'}
TRAP={'熊猫':'xiōngmáo'}
np=lambda s: re.sub(r"[\s'’]+",'',s or '').lower()
fd=f'f_{tag}'; shutil.rmtree(fd,ignore_errors=True); os.makedirs(fd)
segs=[[],[]];n=[0];log=[]
with sync_playwright() as p:
    b=p.chromium.launch(proxy={'server':os.environ['HTTPS_PROXY']},args=['--mute-audio'])
    ctx=b.new_context(viewport={'width':390,'height':800},device_scale_factor=2)
    pg=ctx.new_page()
    pg.add_init_script("localStorage.setItem('buunduu-theme-v1','light');localStorage.setItem('bs.welcome.seen','1')")
    pg.goto('https://surtsgaay.buunduu.mn/games/learn?preset=tonepairs&words='+urllib.parse.quote(','.join(words)),timeout=60000); pg.wait_for_timeout(5000)
    try:
        pg.get_by_text('Ойлголоо, эхэлье!').click(timeout=1500); pg.wait_for_timeout(1500)
    except Exception: pass
    pg.wait_for_timeout(1500)
    pg.evaluate("""()=>{const d=document.createElement('div');d.id='fx';d.style.cssText='position:fixed;z-index:99999;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(214,51,108,.35);border:3px solid #D6336C;pointer-events:none;left:330px;top:740px;transition:transform .12s';document.body.appendChild(d);document.addEventListener('mousemove',e=>{d.style.left=e.clientX+'px';d.style.top=e.clientY+'px'},true);document.addEventListener('mousedown',()=>d.style.transform='scale(.65)',true);document.addEventListener('mouseup',()=>d.style.transform='scale(1)',true);
      document.querySelectorAll('button').forEach(x=>{if(x.innerText.trim()==='💬')x.style.display='none'})}""")
    def shot(lst,dur=None):
        s=time.time(); f=f'{fd}/f{n[0]:04d}.jpg'; pg.screenshot(path=f,type='jpeg',quality=92); n[0]+=1
        lst.append([f,dur if dur is not None else time.time()-s])
    cur=[330,740]; pg.mouse.move(*cur)
    def state():
        txt=pg.locator('main').first.inner_text()
        opts=[x for x in pg.locator('main button').all() if x.is_visible() and not re.search(r'[✕⚙🔊]',x.inner_text()) and x.inner_text().strip() not in ('← Буцах','')]
        return txt,opts
    for q in range(len(words)):
        lst=segs[0] if q<1 else segs[1]
        txt,opts=state(); lines=[l.strip() for l in txt.split('\n') if l.strip()]
        labels=[o.inner_text().strip() for o in opts]
        zh=next((l for l in lines if l in PIN),None)
        want=TRAP.get(zh) if (q==0 and wrong_first) else PIN.get(zh)
        pick=next((i for i,l in enumerate(labels) if want and np(l)==np(want)),None)
        log.append({'q':q,'seg':0 if q<1 else 1,'t':sum(d for _,d in lst),'zh':zh,'labels':labels,'pick':pick})
        if pick is None: pick=0
        t=time.time()
        while time.time()-t<1.5: shot(lst)
        bb=opts[pick].bounding_box(); tx,ty=bb['x']+bb['width']*0.7,bb['y']+bb['height']/2
        for i in range(1,15):
            k=i/14; k=k*k*(3-2*k); pg.mouse.move(cur[0]+(tx-cur[0])*k,cur[1]+(ty-cur[1])*k); shot(lst,1/30)
        cur=[tx,ty]
        pg.mouse.down(); shot(lst,3/30); pg.mouse.up()
        t=time.time(); first=txt
        while time.time()-t<4.5:
            shot(lst)
            now=pg.locator('main').first.inner_text()
            if time.time()-t>1.5 and 'Хөгийг андуурвал' not in now: break
    for i in range(3): shot(segs[1],0.2)
    b.close()
for i,name in enumerate([f'{tag}_A.txt',f'{tag}_B.txt']):
    with open(name,'w') as f:
        f.write('ffconcat version 1.0\n')
        for p_,d in segs[i]: f.write(f"file {p_}\nduration {d:.4f}\n")
        f.write(f"file {segs[i][-1][0]}\n")
    print(name,len(segs[i]),round(sum(d for _,d in segs[i]),2))
for l in log:
    q=urllib.parse.quote(l['zh'] or ''); ok=False
    for base in ["https://cdn.jsdelivr.net/gh/hugolpz/audio-cmn@master/64k/hsk/cmn-","https://cdn.jsdelivr.net/gh/krmanik/HSK-3.0@main/New%20HSK%20(2025)/Audio/cmn-"]:
        r=subprocess.run(['curl','-s','-o',f"{tag}_w{l['q']}.mp3",'-w','%{http_code}',base+q+'.mp3'],capture_output=True,text=True)
        if r.stdout.strip()=='200': ok=True; break
    l['audio']=ok; print(l['zh'],l['labels'],l['pick'],ok)
json.dump(log,open(f'{tag}_log.json','w'),ensure_ascii=False)
