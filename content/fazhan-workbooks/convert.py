import json,glob,hashlib,random,re,sys,os
OUT='/home/claude/work/fzwb'
def clean(a):
    a=str(a).strip()
    a=re.sub(r'\s*[（(][^)）]*[)）]\s*$','',a)  # trailing note
    return a.split('/')[0].strip()
def ok_answer(a):
    return a and not a.startswith('(') and 'нээлттэй' not in a and len(a)<=40
summary=[]
for f in sorted(glob.glob('/home/claude/baldansan/content/fazhan-packages/fazhan-chuji1-l*/workbook.json')):
    lid=f.split('/')[-2]; w=json.load(open(f))
    vocab=[v.get('chinese') for v in json.load(open(f.replace('workbook.json','vocabulary.json'))) if isinstance(v,dict)] if os.path.exists(f.replace('workbook.json','vocabulary.json')) else []
    conv=0; skipped=0
    for p in w.get('reading',{}).get('parts',[]):
        if p['type'] not in ('word','sentence'): continue
        answers=[clean(it.get('answer','')) for it in p['items']]
        pool=[a for a in answers if ok_answer(a)]
        for it,a in zip(p['items'],answers):
            if it.get('options') or not ok_answer(a): skipped+=1; continue
            cands=[x for x in dict.fromkeys(pool) if x!=a]
            if len(cands)<3:
                extra=[v for v in vocab if v and v!=a and v not in cands and len(v)<=6]
                rnd=random.Random(hashlib.md5((lid+a).encode()).hexdigest()); rnd.shuffle(extra); cands+=extra[:3-len(cands)]
            if len(cands)<2: skipped+=1; continue
            rnd=random.Random(hashlib.md5((lid+str(it.get('n'))+a).encode()).hexdigest())
            opts=[a]+rnd.sample(cands,min(3,len(cands))); rnd.shuffle(opts)
            it['options']=opts; it['answer']=a; conv+=1
    json.dump(w,open(f'{OUT}/{lid}.workbook.json','w'),ensure_ascii=False,indent=1)
    summary.append((lid,conv,skipped))
for s in summary: print(*s)
print('total converted',sum(s[1] for s in summary))
