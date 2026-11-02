import json,sys,re
lid=sys.argv[1]; num=int(lid[1:])
j=json.load(open(f'/home/claude/baldansan/content/hsk-source/hsk5/hsk5-{lid}.json'))
secs=j['workbook']['sections']
def items(s): return [i for i in s['items'] if isinstance(i['n'],int)]
def qline(tr):
    t=tr.strip()
    m=re.search(r'问[：:]\s*(.+)$',t) or re.search(r'\n\d+\.\s*(.+)$',t)
    return ('问：'+m.group(1).strip()) if m else 'Сонсоод зөв хариуг сонго'
listening={"parts":[]}; comp=[]; writing=[]
for s in secs:
    n=s['n']
    if n.startswith('一、听力'):
        listening['parts'].append({"instruction_mn":"Сонсоод зөв хариуг сонго","items":[{"n":i['n'],"question_zh":qline(i.get('transcript_zh','')),"options":i['options'],"answer":i['answer'],"script_zh":i.get('transcript_zh',''),"explanation_mn":""} for i in items(s)]})
    elif n.startswith('二、阅读 第一部分'):
        for i in items(s): comp.append({"n":i['n'],"passage_zh":i['zh'],"q_zh":f"__{i['n']}__ хоосон зайд тохирох үгийг сонго:","options":i['options'],"answer":i['answer'],"explanation_mn":""})
    elif n.startswith('二、阅读 第二部分'):
        for i in items(s): comp.append({"n":i['n'],"passage_zh":i['zh'],"q_zh":"Бичвэрийн утгатай нийцэх нь аль вэ?","options":i['options'],"answer":i['answer'],"explanation_mn":""})
    elif n.startswith('二、阅读 第三部分'):
        ins=s.get('instruction_zh','')
        passage=re.sub(r'^第\d+[–-]\d+题[：:].*?\n','',ins,count=1)
        passage=re.sub(r'^\d+[–-]\d+\.\s*\n?','',passage.strip()).strip()
        for i in items(s): comp.append({"n":i['n'],"passage_zh":passage,"q_zh":i['zh'],"options":i['options'],"answer":i['answer'],"explanation_mn":""})
    elif n.startswith('三、书写 第一部分'):
        for i in items(s):
            ans=str(i['answer']).split('/')[0].strip()
            writing.append({"n":i['n'],"words":re.split(r'[\s　]+',i['zh'].strip()),"answer":ans,"explanation_mn":""})
out={"source":f"HSK标准教程5{'上' if num<=18 else '下'} 练习册 第{num}课 + 答案","listening":listening,"reading":{"comprehension":comp},"writing":{"instruction_mn":"Үгсийг зөв дарааллаар эвлүүлж өгүүлбэр болго","items":writing}}
json.dump(out,open(f'/home/claude/work/hsk5wb/skeleton-{lid}.json','w'),ensure_ascii=False,indent=1)
lc=[len(p['items']) for p in listening['parts']]
print(lid,'listening',lc,'comp',len(comp),'writing',len(writing),'total',sum(lc)+len(comp)+len(writing),'empty_passage',sum(1 for c in comp if not c['passage_zh']),'no_q',sum(1 for p in listening['parts'] for i in p['items'] if not i['question_zh'].startswith('问')))
