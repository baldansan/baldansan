import re,glob,colorsys,sys
files=sorted(glob.glob('app/**/*.css',recursive=True)+glob.glob('components/**/*.css',recursive=True))
files=[f for f in files if 'dark-auto' not in f and '/admin' not in f]
HEX=re.compile(r'^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$')
def parse(c):
    c=c.strip().lower().replace('!important','').strip()
    if c=='white': c='#ffffff'
    if c=='black': c='#000000'
    m=HEX.match(c)
    if not m: return None
    h=m.group(1)
    if len(h)==3: h=''.join(x*2 for x in h)
    return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
def hls(rgb):
    h,l,s=colorsys.rgb_to_hls(*rgb); return h*360,l,s
def bg_map(rgb):
    h,l,s=hls(rgb)
    if l<0.88: return None
    if s<0.25 or l>0.985: return 'var(--bs-card)' if l>0.985 else '#241F33'
    if 20<=h<70: return 'var(--bs-amber-50)'
    if 70<=h<170: return '#15301f'
    if h>=330 or h<20: return '#3a1a1e'
    if 300<=h<330: return 'var(--bs-pink-50)'
    if 170<=h<230: return '#172a3d'
    return 'var(--bs-green-50)'
def fg_map(rgb):
    h,l,s=hls(rgb)
    if l>0.45: return None
    if s<0.3: return 'var(--bs-ink)' if l<0.2 else ('var(--bs-ink-2)' if l<0.33 else 'var(--bs-muted)')
    if 20<=h<70: return '#f5c877'
    if 70<=h<170: return '#5fd68f' if s>0.35 else 'var(--bs-ink-2)'
    if h>=330 or h<20: return '#ff8a8a'
    if 300<=h<330: return 'var(--bs-pink-800)'
    if 170<=h<230: return '#8fc7ff'
    return 'var(--bs-green-700)' if l<0.42 else None
def bd_map(rgb):
    h,l,s=hls(rgb)
    if l<0.8: return None
    if s<0.3: return 'var(--bs-line)'
    if 20<=h<70: return 'var(--bs-amber-100)'
    if 70<=h<170: return '#245a3a'
    if h>=330 or h<20: return '#6b2a30'
    return 'var(--bs-green-100)'
SKIP=re.compile(r'dark|print|thumb|knob|::?-webkit|qr|certificate|poster|bs-admin|::selection|hanzi-writer|bs-wr-grid|tian')
def blocks(s):
    # yield (prelude, body, is_nested)
    i=0;n=len(s)
    while i<n:
        j=s.find('{',i)
        if j<0: break
        pre=s[i:j].strip()
        depth=1;k=j+1
        while k<n and depth:
            if s[k]=='{':depth+=1
            elif s[k]=='}':depth-=1
            k+=1
        yield pre,s[j+1:k-1]
        i=k
def conv(sel,body):
    if SKIP.search(sel): return None
    decls=[]
    for d in body.split(';'):
        if ':' not in d: continue
        p,v=d.split(':',1); p=p.strip().lower(); v=v.strip()
        imp=' !important' if '!important' in v else ''
        vv=v.replace('!important','').strip()
        if p in('background','background-color'):
            rgb=parse(vv)
            if rgb:
                m=bg_map(rgb)
                if m: decls.append(f'background-color:{m}{imp}')
        elif p=='color':
            rgb=parse(vv)
            if rgb:
                m=fg_map(rgb)
                if m: decls.append(f'color:{m}{imp}')
        elif p=='border-color' or re.match(r'border-(top|bottom|left|right)-color$',p):
            rgb=parse(vv)
            if rgb:
                m=bd_map(rgb)
                if m: decls.append(f'{p}:{m}{imp}')
        elif p in('border','border-top','border-bottom','border-left','border-right'):
            toks=vv.split()
            if toks:
                rgb=parse(toks[-1])
                if rgb:
                    m=bd_map(rgb)
                    if m: decls.append(f'{p}-color:{m}{imp}')
    if not decls: return None
    parts=[x.strip() for x in sel.split(',') if x.strip()]
    out=[]
    for x in parts:
        if x.startswith('html') or x.startswith(':root') or x.startswith('body'): 
            continue
        out.append('html[data-theme="dark"] '+x)
    if not out: return None
    return ',\n'.join(out)+'{'+';'.join(decls)+'}'
def walk(s,out,stats):
    for pre,body in blocks(s):
        if pre.startswith('@'):
            if pre.startswith('@media'):
                if 'print' in pre or 'prefers-color-scheme' in pre: continue
                sub=[]; walk(body,sub,stats)
                if sub: out.append(pre+'{\n'+'\n'.join(sub)+'\n}')
            continue
        r=conv(pre,body)
        if r: out.append(r); stats[0]+=1
res=['/* АВТОМАТААР ҮҮСГЭСЭН (scripts/gen-dark-auto.py) — гараар бүү зас.\n   Харанхуй горимд тогтмол цайвар дэвсгэр / бараан бичвэртэй бүх дүрмийг харанхуй өнгө рүү хөрвүүлнэ. */']
for f in files:
    s=re.sub(r'/\*.*?\*/','',open(f).read(),flags=re.S)
    out=[];st=[0]; walk(s,out,st)
    if out: res.append(f'\n/* {f} ({st[0]}) */\n'+'\n'.join(out)); print(st[0],f,file=sys.stderr)
open('app/dark-auto.css','w').write('\n'.join(res)+'\n')
