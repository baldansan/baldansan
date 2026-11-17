# -*- coding: utf-8 -*-
"""N5-01: аудио угсрах + SQL үүсгэх. Ажиллуулах: python3 n5/make.py (hsk30 хавтсаас)."""
import json,subprocess,numpy as np,importlib.util,wave,os
SR=24000
sp=importlib.util.spec_from_file_location('n','n5_01.py'); n=importlib.util.module_from_spec(sp); sp.loader.exec_module(n)
clips=json.load(open('n5/clips.json')); idx={c['id']:i for i,c in enumerate(clips)}
def path(cid):
    if cid in idx: return f"n5/clips/{idx[cid]}.wav"
    k=int(cid[1:]); assert cid.startswith('n') and 1<=k<=32
    return f"clips/{k+2}.wav" if k<=30 else f"n4/clips/{k-29}.wav"   # N3-ын «第N题» клипүүд
TEMPO={'m':0.79,'f':0.71,'n':0.68}
def load(cid):
    v=clips[idx[cid]]['v'] if cid in idx else 'n'
    raw=subprocess.run(['ffmpeg','-v','error','-i',path(cid),'-ac','1','-ar',str(SR),'-af',f"rubberband=tempo={TEMPO[v]}:formant=preserved",'-f','s16le','-'],capture_output=True).stdout
    x=np.frombuffer(raw,dtype=np.int16).astype(np.float32)
    nz=np.where(np.abs(x)>300)[0]
    if len(nz): x=x[max(0,nz[0]-int(.05*SR)):nz[-1]+int(.12*SR)]
    act=x[np.abs(x)>300]; rms=np.sqrt((act**2).mean()) if len(act) else 1
    return np.clip(x*(3500/rms),-30000,30000)
buf=[]; t=0.0
def sil(s):
    global t; buf.append(np.zeros(int(s*SR),np.float32)); t+=int(s*SR)/SR
def play(cid):
    global t; x=load(cid); buf.append(x); t+=len(x)/SR
times={}; GAP=15
sil(1); play('p1'); sil(1.5)
for q,turns,*r in n.L1A:
    st=t; play(f'n{q}'); sil(.6)
    for k in range(len(turns)): play(f'q{q}_{k}'); sil(.4)
    sil(.6); play(f'q{q}_q'); times[q]=(round(st,1),round(t+.4,1)); sil(GAP)
def group(q0,parts,qs):
    st=t; play(f'n{q0}'); sil(.6)
    for p in parts: play(p); sil(.4)
    sil(.6)
    for j,(q,*r) in enumerate(qs):
        if j: play(f'n{q}'); sil(.5)
        play(f'q{q}_q'); times[q]=(round(st,1),round(t+.4,1)); sil(GAP)
for turns,qs in n.L1B: group(qs[0][0],[f'q{qs[0][0]}_{k}' for k in range(len(turns))],qs)
sil(1); play('p2'); sil(1.5)
for s_,p,qs in n.L2: group(qs[0][0],[f'q{qs[0][0]}_0'],qs)
sil(1)
x=np.concatenate(buf).astype(np.int16)
w=wave.open('n5/listening.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes()); w.close()
subprocess.run(['ffmpeg','-v','error','-y','-i','n5/listening.wav','-ac','1','-b:a','56k','n5/listening.mp3'])
print('audio %.1f min'%(t/60))

REPO='/home/claude/baldansan'; BASE='/mock-tests/n5-01'; AUDIO=f'{BASE}/listening.mp3'
os.makedirs(f'{REPO}/public{BASE}',exist_ok=True); subprocess.run(['cp','n5/listening.mp3',f'{REPO}/public{BASE}/listening.mp3'])
from PIL import Image
im=Image.open('n5/w1.png').convert('RGB'); im.thumbnail((900,900)); im.save(f'{REPO}/public{BASE}/w1.webp','WEBP',quality=82)
rows=[]
def q(skill,part,no,qt,stem,options,ans,expl,tags,autograde='auto',**kw):
    r=dict(skill=skill,part=part,q_no=no,q_type=qt,stem=stem,options=options,correct_answer=ans,autograde=autograde,points=1,audio_url=None,image_url=None,needs_image=False,tags=tags,explanation_mn=expl,audio_start_sec=None,audio_end_sec=None,audio_transcript=None,tutor_note=None)
    r.update(kw); rows.append(r)
SPK={'m':'男','f':'女'}
O=lambda o:[{'key':k,'text':t} for k,t in zip('ABCDE',o)]
def listen(no,lines,ques,expl):
    tr=[f'{SPK[s]}：{t}' for s,t in lines]+[f'问：{ques}']
    return dict(audio_url=AUDIO,audio_start_sec=times[no][0],audio_end_sec=times[no][1],audio_transcript='\n'.join(tr),tutor_note={'transcript':[{'zh':x} for x in tr],'why':expl})
for no,turns,ques,o,a,e in n.L1A: q('listening',1,no,'choice','',O(o),a,e,['sk.listening.dialogue'],**listen(no,turns,ques,e))
for turns,qs in n.L1B:
    for no,ques,o,a,e in qs: q('listening',1,no,'choice','',O(o),a,e,['sk.listening.interview'],**listen(no,turns,ques,e))
for s_,p,qs in n.L2:
    for no,ques,o,a,e in qs: q('listening',2,no,'choice','',O(o),a,e,['sk.listening.passage'],**listen(no,[(s_,p)],ques,e))
for p,qs in n.R1:
    for no,o,a,e in qs: q('reading',1,no,'choice',f'{p}\n★ （{no}）-д тохирохыг сонго.',O(o),a,e,['sk.reading.cloze','voc.hsk5'])
for gi,(opts,qs) in enumerate(n.R2):
    para='\n'.join(f'{k}．{v}' for k,v in opts.items())
    for no,a,e in qs:
        pos=no-qs[0][0]+1
        q('reading',2,no,'choice',f'{para}\n★ Дээрх таван хэсгийг зөв дараалалд оруулбал {pos}-р байрт аль нь орох вэ?',[{'key':k,'text':v[:9]+'…'} for k,v in opts.items()],a,e,['sk.reading.order'])
for p,qs in n.R3:
    for no,ques,o,a,e in qs: q('reading',3,no,'choice',f'{p}\n★ {ques}',O(o),a,e,['sk.reading.comprehension'])
no,prompt,ref,e=n.W1
q('writing',1,no,'essay_picture',f'{prompt}\n(Дөрвөн зургаар 100-аас доошгүй ханзтай түүх бич.)',None,ref,e,['sk.writing.essay_picture'],autograde='manual',image_url=f'{BASE}/w1.webp',needs_image=True)
no,prompt,ref,e=n.W2
q('writing',2,no,'essay',f'{prompt}\n(200-аас доошгүй ханзтай зохион бичлэг бич.)',None,ref,e,['sk.writing.essay'],autograde='manual')
rows.sort(key=lambda r:r['q_no'])
assert [r['q_no'] for r in rows]==list(range(1,73))
for r in rows:
    if r['options']: assert r['correct_answer'] in [o['key'] for o in r['options']],r['q_no']
import collections
print('listening answers',collections.Counter(r['correct_answer'] for r in rows if r['skill']=='listening'))
lmin=int(t/60)+2
sections=[
 {'skill':'listening','audio_url':AUDIO,'time_min':lmin,'parts':[
   {'desc':'Яриа сонсоод асуултад хариулах','part':1,'range':[1,19],'q_type':'choice'},
   {'desc':'Өгүүлэл сонсоод асуултад хариулах','part':2,'range':[20,35],'q_type':'choice'}]},
 {'skill':'reading','audio_url':None,'time_min':35,'parts':[
   {'desc':'Эхийн хоосон зайг нөхөх','part':1,'range':[36,45],'q_type':'choice'},
   {'desc':'Догол мөрүүдийг дараалалд оруулах','part':2,'range':[46,55],'q_type':'choice'},
   {'desc':'Урт эх унших → асуултын хариу','part':3,'range':[56,70],'q_type':'choice'}]},
 {'skill':'writing','audio_url':None,'time_min':40,'parts':[
   {'desc':'Дөрвөн зургаар түүх бичих (100+ ханз)','part':1,'range':[71,71],'q_type':'essay_picture'},
   {'desc':'Сэдэвт зохион бичлэг (200+ ханз)','part':2,'range':[72,72],'q_type':'essay'}]}]
total=lmin+75
def S(v):
    if v is None: return 'null'
    if isinstance(v,bool): return 'true' if v else 'false'
    if isinstance(v,(int,float)): return str(v)
    return "'"+str(v).replace("'","''")+"'"
J=lambda v:'null' if v is None else S(json.dumps(v,ensure_ascii=False))+'::jsonb'
A=lambda v:'array['+','.join(S(x) for x in v)+']::text[]'
out=[f"""-- 100: {n.TITLE} — өөрсдийн зохиосон загвар шалгалт.
-- 72 асуулт: сонсгол 35, уншлага 35, бичих 2. Аудио, зураг апп дотроо ({BASE}/). Дахин ажиллуулахад аюулгүй.
begin;

insert into public.mock_tests (id, hsk_level, title, total_questions, time_limit_min, has_writing, sections, is_active)
values ({S(n.TEST_ID)}, 5, {S(n.TITLE)}, 72, {total}, true, {J(sections)}, true)
on conflict (id) do update set hsk_level=excluded.hsk_level, title=excluded.title, total_questions=excluded.total_questions,
  time_limit_min=excluded.time_limit_min, has_writing=excluded.has_writing, sections=excluded.sections, is_active=excluded.is_active;

insert into public.mock_test_questions
  (test_id, skill, part, q_no, q_type, stem, options, correct_answer, autograde, points, audio_url, image_url, needs_image, tags, explanation_mn, audio_start_sec, audio_end_sec, audio_transcript, tutor_note)
values"""]
out.append(',\n'.join('  ('+', '.join([S(n.TEST_ID),S(r['skill']),S(r['part']),S(r['q_no']),S(r['q_type']),S(r['stem']),J(r['options']),S(r['correct_answer']),S(r['autograde']),S(r['points']),S(r['audio_url']),S(r['image_url']),S(r['needs_image']),A(r['tags']),S(r['explanation_mn']),S(r['audio_start_sec']),S(r['audio_end_sec']),S(r['audio_transcript']),J(r['tutor_note'])])+')' for r in rows)+'''
on conflict (test_id, q_no) do update set skill=excluded.skill, part=excluded.part, q_type=excluded.q_type, stem=excluded.stem,
  options=excluded.options, correct_answer=excluded.correct_answer, autograde=excluded.autograde, points=excluded.points,
  audio_url=excluded.audio_url, image_url=excluded.image_url, needs_image=excluded.needs_image, tags=excluded.tags,
  explanation_mn=excluded.explanation_mn, audio_start_sec=excluded.audio_start_sec, audio_end_sec=excluded.audio_end_sec,
  audio_transcript=excluded.audio_transcript, tutor_note=excluded.tutor_note;

commit;
''')
open(f'{REPO}/supabase/migrations/100_hsk5_new_format_mock_n5_01.sql','w').write('\n'.join(out))
json.dump({'test':{'id':n.TEST_ID,'hsk_level':5,'title':n.TITLE,'total_questions':72,'time_limit_min':total,'has_writing':True,'sections':sections,'is_active':True},'questions':rows},open('n5/rows.json','w'),ensure_ascii=False)
print('ok',len(rows),'listening min',lmin, {k:times[k] for k in (1,11,12,13,35)})
