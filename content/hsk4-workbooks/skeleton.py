import json,sys,re
lid=sys.argv[1]
src=json.load(open(f'/home/claude/work/hsk4wb/source-{lid}.json'))
S={s['n']:s for s in src['workbook_sections']}
def key(prefix):
    ks=[k for k in S if k.startswith(prefix)]
    return ks
def items(k): return [i for i in S[k]['items'] if isinstance(i['n'],int)]
def lis(k,tf=False):
    out=[]
    for i in items(k):
        if tf: out.append({"n":i['n'],"statement_zh":i['zh'],"answer":"true" if i['answer'] in ("✓","√") else "false","script_zh":i.get('transcript_zh',''),"explanation_mn":""})
        else:
            q=i['zh'] if str(i.get('zh','')).startswith('问') else "Сонсоод зөв хариуг сонго"
            out.append({"n":i['n'],"question_zh":q,"options":i['options'],"answer":i['answer'],"script_zh":i.get('transcript_zh',''),"explanation_mn":""})
    return out
k1=key("一、听力 第一部分")[0]; k2=key("一、听力 第二部分")[0]; k3=key("一、听力 第三部分")[0]
listening={"parts":[{"instruction_mn":"Сонсоод ★ өгүүлбэр зөв (Үнэн) эсэх","items":lis(k1,True)},{"instruction_mn":"Сонсоод зөв хариуг сонго","items":lis(k2)},{"instruction_mn":"Сонсоод зөв хариуг сонго","items":lis(k3)}]}
def sw(k):
    its=items(k); s=S[k]
    wb=s.get('word_bank')
    opts0=(S[k]['items'][0].get('options') if S[k]['items'] else None) or (its[0].get('options') if its else None)
    if isinstance(opts0,dict) and len(opts0)>=4:
        bank=dict(opts0)
    elif wb:
        bank={}
        for w in wb[0] if isinstance(wb[0],list) else wb:
            m=re.match(r'^([A-F])\s*[\.．、]?\s*(.+)$',str(w).strip())
            if m: bank[m.group(1)]=m.group(2).strip()
    else:
        bank=its[0].get('options') or S[k]['items'][0].get('options')
    return {"bank":bank,"items":[{"n":i['n'],"q":i['zh'],"answer":i['answer'],"explanation_mn":""} for i in its]}
select_word=[sw(k) for k in key("二、阅读 第一部分")]
ordering=[{"n":i['n'],"parts":i['options'],"answer":i['answer'],"explanation_mn":""} for k in key("二、阅读 第二部分") for i in items(k)]
comp=[]
for k in key("二、阅读 第三部分"):
    for i in items(k):
        z=i['zh']
        if '★' in z: p,q=z.split('★',1); q='★'+q.strip()
        else: p,q=z,'★ 根据这段话，可以知道什么？'
        comp.append({"n":i['n'],"passage_zh":p.strip(),"q_zh":q,"options":i['options'],"answer":i['answer'],"explanation_mn":""})
writing={"instruction_mn":"Үгсийг зөв дарааллаар эвлүүлж өгүүлбэр болго","items":[{"n":i['n'],"words":re.split(r'[\s　]+',i['zh'].strip()),"answer":i['answer'],"explanation_mn":""} for k in key("三、书写 第一部分") for i in items(k)]}
num=int(lid[1:])
out={"source":f"HSK标准教程4{'上' if num<=10 else '下'} 练习册 第{num}课 + 教师用书 答案","listening":listening,"reading":{"select_word":select_word,"ordering":ordering,"comprehension":comp},"writing":writing}
json.dump(out,open(f'/home/claude/work/hsk4wb/skeleton-{lid}.json','w'),ensure_ascii=False,indent=1)
c=[len(p['items']) for p in listening['parts']]; swn=sum(len(g['items']) for g in select_word)
print(lid,'listening',c,'sw',swn,'banks',[len(g['bank']) for g in select_word],'ord',len(ordering),'comp',len(comp),'wr',len(writing['items']),'total',sum(c)+swn+len(ordering)+len(comp)+len(writing['items']), 'missing_script',sum(1 for p in listening['parts'] for i in p['items'] if not i['script_zh']))
