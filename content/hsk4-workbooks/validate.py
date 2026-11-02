import json,sys,re
cyr=re.compile('[А-Яа-яӨөҮү]')
RU=['студент','класс',' час ','телефон','проблем','магазин','газет','доктор ']
def walk(w):
    for p in w['listening']['parts']:
        for it in p['items']: yield ('L',it)
    r=w.get('reading',{})
    for g in r.get('select_word',[]):
        for it in g['items']: yield ('S',it)
    for it in r.get('ordering',[]): yield ('O',it)
    for it in r.get('comprehension',[]): yield ('C',it)
    for it in w.get('writing',{}).get('items',[]): yield ('W',it)
ok=True
for lid in sys.argv[1:]:
    try: w=json.load(open(f'workbook-{lid}.json')); sk=json.load(open(f'skeleton-{lid}.json'))
    except Exception as e: print(lid,'LOAD FAIL',e); ok=False; continue
    items=list(walk(w)); skel=list(walk(sk))
    probs=[]
    if len(items)!=len(skel): probs.append(f'count {len(items)} vs {len(skel)}')
    for (k,it),(k2,s2) in zip(items,skel):
        e=it.get('explanation_mn','')
        if not e or not cyr.search(e): probs.append(f'{k}{it.get("n")} empty')
        for ru in RU:
            if ru in e.lower(): probs.append(f'{k}{it.get("n")} RU:{ru.strip()}')
        for f in ('answer','script_zh','statement_zh','question_zh','q','parts','options','words','passage_zh','q_zh'):
            if f in s2 and s2[f]!=it.get(f): probs.append(f'{k}{it.get("n")} changed {f}')
    print(lid, 'items',len(items), 'OK' if not probs else 'PROBLEMS: '+'; '.join(probs[:8]))
    ok=ok and not probs
sys.exit(0 if ok else 1)
