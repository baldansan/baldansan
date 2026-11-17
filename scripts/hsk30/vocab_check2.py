# -*- coding: utf-8 -*-
"""Үгийн шүүлтүүр: шалгалтын бүх хятад бичвэрийг албан ёсны HSK 3.0 жагсаалттай тулгана."""
import json,re,sys,importlib.util,collections
mod,maxlv=sys.argv[1],int(sys.argv[2])
spec=importlib.util.spec_from_file_location('t',mod); t=importlib.util.module_from_spec(spec); spec.loader.exec_module(t)
off=json.load(open('official_words.json',encoding='utf-8'))
lvl={}
L=lambda x: 8 if x.startswith('7') else int(x)
for seq,lv,w,rest in off:
    for v in re.split(r'[｜|/]',w):
        v=re.sub(r'（.*?）','',v)
        if v: lvl[v]=min(lvl.get(v,99),L(lv))
# задлагчийн мэдэгдэж буй алдаа (ижил бичлэгтэй үгийн дугаарлалт) +儿-тэй хэлбэр
lvl.update({'好':1,'像':3,'没':1,'话':2,'点儿':1,'玩儿':1,'画画儿':2,'有点儿':2,'一点儿':1,'早点儿':2,'分钟':1,'小时候':2,'什么样':2,'服务员':2,'穿着':1,'好点儿':2,'快一点儿':1,'简单点儿':3})
maxlen=max(len(w) for w in lvl)
NAMES={'小王','小李','小明','小白','小张','小林','上海','北京','云南','张老师','张教授','王阿姨','王老师'}
texts=[]
def walk(o,q=0):
    if isinstance(o,str):
        if not re.search(r'[\u0400-\u04ff]',o) and re.search(r'[一-鿿]',o): texts.append((q,o))
    elif isinstance(o,dict):
        for v in o.values(): walk(v,q)
    elif isinstance(o,(list,tuple)):
        qq=o[0] if o and isinstance(o[0],int) else q
        for v in o: walk(v,qq)
for k in dir(t):
    if k.startswith('_') or k in ('TITLE','TEST_ID'): continue
    walk(getattr(t,k))
def seg(s):
    out=[]; i=0
    while i<len(s):
        if not re.match(r'[一-鿿]',s[i]): i+=1; continue
        m=next((n for n in NAMES if s.startswith(n,i)),None)
        if m: out.append((m,0)); i+=len(m); continue
        for n in range(min(maxlen,len(s)-i),0,-1):
            if s[i:i+n] in lvl: m=s[i:i+n]; break
        if m: out.append((m,lvl[m])); i+=len(m)
        else: out.append((s[i],-1)); i+=1
    return out
over=collections.defaultdict(set); unk=collections.defaultdict(set); cnt=collections.Counter(); total=0
for q,s in texts:
    for w,l in seg(s):
        total+=1; cnt[l]+=1
        if l>maxlv: over[(w,l)].add(q)
        if l==-1: unk[w].add(q)
inlv=sum(v for k,v in cnt.items() if 0<=k<=maxlv)
print('tokens',total,'| within level %.1f%%'%(100*inlv/total),'| by level',sorted(cnt.items()))
print('ABOVE LEVEL:',[(w,'L%d'%l,sorted(q)) for (w,l),q in sorted(over.items(),key=lambda x:(-x[0][1],x[0][0]))])
print('NOT IN LIST:',[(w,sorted(q)) for w,q in sorted(unk.items())])
