import json,importlib.util,os,subprocess
from PIL import Image
sp=importlib.util.spec_from_file_location('n','n3_01.py'); n=importlib.util.module_from_spec(sp); sp.loader.exec_module(n)
REPO='/home/claude/baldansan'; BASE='/mock-tests/n3-01'
os.makedirs(f'{REPO}/public{BASE}/img',exist_ok=True)
for f in os.listdir('img'):
    if f.endswith('.png') :
        im=Image.open(f'img/{f}').convert('RGB'); im.thumbnail((720,720)); im.save(f'{REPO}/public{BASE}/img/{f[:-4]}.webp','WEBP',quality=80)
subprocess.run(['cp','listening.mp3',f'{REPO}/public{BASE}/listening.mp3'])
AUDIO=f'{BASE}/listening.mp3?v=2'
times={int(k):v for k,v in json.load(open('times.json')).items()}
LMIN=int(max(v[1] for v in times.values())/60)+2
rows=[]
def q(skill,part,no,qt,stem,options,ans,expl,tags,autograde='auto',**kw):
    r=dict(skill=skill,part=part,q_no=no,q_type=qt,stem=stem,options=options,correct_answer=ans,autograde=autograde,points=1,
           audio_url=None,image_url=None,needs_image=False,tags=tags,explanation_mn=expl,audio_start_sec=None,audio_end_sec=None,audio_transcript=None,tutor_note=None)
    r.update(kw); rows.append(r)
SPK={'m':'男','f':'女'}
def listen(no,lines,question=None):
    tr=[f'{SPK[s]}：{t}' for s,t in lines]+([f'问：{question}'] if question else [])
    return dict(audio_url=AUDIO,audio_start_sec=times[no][0],audio_end_sec=times[no][1],audio_transcript='\n'.join(tr))
def tn(lines,expl,question=None):
    return {'transcript':[{'zh':f'{SPK[s]}：{t}'} for s,t in lines]+([{'zh':f'问：{question}'}] if question else []),'why':expl}
for no,g,a,turns,e in n.L1:
    pics=n.PICS_G1 if g=='G1' else n.PICS_G2
    opts=[{'key':k,'text':'','image_url':f'{BASE}/img/{v}.webp'} for k,v in pics.items()]
    q('listening',1,no,'match','Сонсоод тохирох зургийг сонго:',opts,a,e,['sk.listening.picture_match'],needs_image=True,tutor_note=tn(turns,e),**listen(no,turns))
for no,turns,ques,o,a,e in n.L2:
    q('listening',2,no,'choice','',[{'key':k,'text':t} for k,t in zip('ABC',o)],a,e,['sk.listening.dialogue'],tutor_note=tn(turns,e,ques),**listen(no,turns,ques))
for j,(no,p,ques,o,a,e) in enumerate(n.L3):
    turns=[('mf'[j%2],p)]
    q('listening',3,no,'choice','',[{'key':k,'text':t} for k,t in zip('ABC',o)],a,e,['sk.listening.passage'],tutor_note=tn(turns,e,ques),**listen(no,turns,ques))
for opts,items in ((n.R1_G1_OPTS,n.R1_G1),(n.R1_G2_OPTS,n.R1_G2)):
    for no,s,a,e in items: q('reading',1,no,'match',s,[{'key':k,'text':t} for k,t in opts.items()],a,e,['sk.reading.match'])
for opts,items in ((n.R2_G1_OPTS,n.R2_G1),(n.R2_G2_OPTS,n.R2_G2)):
    for no,s,a,e in items: q('reading',2,no,'fill_word',s,[{'key':k,'text':t} for k,t in opts.items()],a,e,['sk.reading.cloze','voc.hsk3'])
for no,p,ques,o,a,e in n.R3:
    q('reading',3,no,'choice',f'{p}\n★ {ques}',[{'key':k,'text':t} for k,t in zip('ABC',o)],a,e,['sk.reading.comprehension'])
for p,qs in n.R3_PAIRS:
    for no,ques,o,a,e in qs:
        q('reading',3,no,'choice',f'{p}\n★ {ques}',[{'key':k,'text':t} for k,t in zip('ABC',o)],a,e,['sk.reading.comprehension'])
for no,s,py,ch,e in n.W1:
    q('writing',1,no,'fill_char',f'Пиньинь [{py}] — тохирох ханзыг бич: '+s.replace('（     ）','___'),None,ch,e,['sk.writing.char','voc.hsk3'],autograde='strict')
for no,w,ref,e in n.W2:
    q('writing',2,no,'picture_sentence',f'Өгөгдсөн үгийг ашиглаж нэг өгүүлбэр бич: {w}',None,ref,e,['sk.writing.complete','voc.hsk3'],autograde='manual')
rows.sort(key=lambda r:r['q_no'])
assert [r['q_no'] for r in rows]==list(range(1,71)),[r['q_no'] for r in rows]
for r in rows:
    if r['options'] and r['q_type']!='picture_sentence': assert r['correct_answer'] in [o['key'] for o in r['options']],r['q_no']
sections=[
 {'skill':'listening','audio_url':AUDIO,'time_min':LMIN,'parts':[
   {'desc':'Яриа ↔ зураг','part':1,'range':[1,10],'q_type':'match'},
   {'desc':'Яриа сонсоод асуултад хариулах','part':2,'range':[11,20],'q_type':'choice'},
   {'desc':'Богино өгүүлэл сонсоод асуултад хариулах','part':3,'range':[21,30],'q_type':'choice'}]},
 {'skill':'reading','audio_url':None,'time_min':30,'parts':[
   {'desc':'Өгүүлбэр ↔ хариу тааруулах','part':1,'range':[31,40],'q_type':'match'},
   {'desc':'选词填空 — өгөгдсөн үгнээс нөхөх','part':2,'range':[41,50],'q_type':'fill_word'},
   {'desc':'Унших → асуултын хариу','part':3,'range':[51,60],'q_type':'choice'}]},
 {'skill':'writing','audio_url':None,'time_min':20,'parts':[
   {'desc':'Пиньинээр ханз бичих','part':1,'range':[61,65],'q_type':'fill_char'},
   {'desc':'Өгөгдсөн үгээр өгүүлбэр бичих','part':2,'range':[66,70],'q_type':'picture_sentence'}]}]
def S(v):
    if v is None: return 'null'
    if isinstance(v,bool): return 'true' if v else 'false'
    if isinstance(v,(int,float)): return str(v)
    return "'"+str(v).replace("'","''")+"'"
def J(v): return 'null' if v is None else S(json.dumps(v,ensure_ascii=False))+'::jsonb'
def A(v): return 'array['+','.join(S(x) for x in v)+']::text[]'
out=[]
out.append("""-- 098: HSK 3 · шинэ хэлбэр (HSK 3.0) · Загвар №1 — манай өөрсдийн зохиосон загвар шалгалт.
-- 70 асуулт: сонсгол 30, уншлага 30, бичих 10. Аудио, зураг нь апп дотроо (/mock-tests/n3-01/).
-- Дахин ажиллуулахад аюулгүй.
begin;
""")
out.append(f"""insert into public.mock_tests (id, hsk_level, title, total_questions, time_limit_min, has_writing, sections, is_active)
values ({S(n.TEST_ID)}, 3, {S(n.TITLE)}, 70, {LMIN+50}, true, {J(sections)}, true)
on conflict (id) do update set hsk_level=excluded.hsk_level, title=excluded.title, total_questions=excluded.total_questions,
  time_limit_min=excluded.time_limit_min, has_writing=excluded.has_writing, sections=excluded.sections, is_active=excluded.is_active;

insert into public.mock_test_questions
  (test_id, skill, part, q_no, q_type, stem, options, correct_answer, autograde, points, audio_url, image_url, needs_image, tags, explanation_mn, audio_start_sec, audio_end_sec, audio_transcript, tutor_note)
values""")
vals=[]
for r in rows:
    vals.append('  ('+', '.join([S(n.TEST_ID),S(r['skill']),S(r['part']),S(r['q_no']),S(r['q_type']),S(r['stem']),J(r['options']),S(r['correct_answer']),S(r['autograde']),S(r['points']),S(r['audio_url']),S(r['image_url']),S(r['needs_image']),A(r['tags']),S(r['explanation_mn']),S(r['audio_start_sec']),S(r['audio_end_sec']),S(r['audio_transcript']),J(r['tutor_note'])])+')')
out.append(',\n'.join(vals)+'''
on conflict (test_id, q_no) do update set skill=excluded.skill, part=excluded.part, q_type=excluded.q_type, stem=excluded.stem,
  options=excluded.options, correct_answer=excluded.correct_answer, autograde=excluded.autograde, points=excluded.points,
  audio_url=excluded.audio_url, image_url=excluded.image_url, needs_image=excluded.needs_image, tags=excluded.tags,
  explanation_mn=excluded.explanation_mn, audio_start_sec=excluded.audio_start_sec, audio_end_sec=excluded.audio_end_sec,
  audio_transcript=excluded.audio_transcript, tutor_note=excluded.tutor_note;

commit;
''')
open(f'{REPO}/supabase/migrations/098_hsk3_new_format_mock_n3_01.sql','w').write('\n'.join(out))
json.dump({'test':{'id':n.TEST_ID,'hsk_level':3,'title':n.TITLE,'total_questions':70,'time_limit_min':LMIN+50,'has_writing':True,'sections':sections,'is_active':True},'questions':rows},open('n3_01_rows.json','w'),ensure_ascii=False)
print('ok',len(rows))
