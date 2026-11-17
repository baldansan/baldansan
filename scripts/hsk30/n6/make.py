# -*- coding: utf-8 -*-
"""N6-01: аудио угсрах + SQL үүсгэх. Ажиллуулах: python3 n6/make.py (hsk30 хавтсаас)."""
import json,subprocess,numpy as np,importlib.util,wave,os
SR=24000
sp=importlib.util.spec_from_file_location('n','n6_01.py'); n=importlib.util.module_from_spec(sp); sp.loader.exec_module(n)
clips=json.load(open('n6/clips.json')); idx={c['id']:i for i,c in enumerate(clips)}
def path(cid):
    if cid in idx: return f"n6/clips/{idx[cid]}.wav"
    k=int(cid[1:]); assert cid.startswith('n') and 1<=k<=35
    return f"clips/{k+2}.wav" if k<=30 else (f"n4/clips/{k-29}.wav" if k<=32 else f"n5/clips/{k-31}.wav")   # N3-ын «第N题» клипүүд
TEMPO={'m':1.0,'f':1.0,'n':0.85}
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
times={}; GAP=14
def group(q0,parts,qs):
    st=t; play(f'n{q0}'); sil(.6)
    for p in parts: play(p); sil(.4)
    sil(.6)
    for j,(q,*r) in enumerate(qs):
        if j: play(f'n{q}'); sil(.5)
        play(f'q{q}_q'); times[q]=(round(st,1),round(t+.4,1)); sil(GAP)
sil(1); play('p1'); sil(1.5)
for q,*r in n.L1:
    st=t; play(f'n{q}'); sil(.6); play(f'q{q}_0'); times[q]=(round(st,1),round(t+.4,1)); sil(GAP)
sil(1); play('p2'); sil(1.5)
for s_,p,qs in n.L2: group(qs[0][0],[f'q{qs[0][0]}_0'],qs)
sil(1); play('p3'); sil(1.5)
for turns,qs in n.L3: group(qs[0][0],[f'q{qs[0][0]}_{k}' for k in range(len(turns))],qs)
sil(1)
x=np.concatenate(buf).astype(np.int16)
w=wave.open('n6/listening.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes()); w.close()
subprocess.run(['ffmpeg','-v','error','-y','-i','n6/listening.wav','-ac','1','-b:a','56k','n6/listening.mp3'])
print('audio %.1f min'%(t/60))

REPO='/home/claude/baldansan'; BASE='/mock-tests/n6-01'; AUDIO=f'{BASE}/listening.mp3'
os.makedirs(f'{REPO}/public{BASE}',exist_ok=True); subprocess.run(['cp','n6/listening.mp3',f'{REPO}/public{BASE}/listening.mp3'])
rows=[]
def q(skill,part,no,qt,stem,options,ans,expl,tags,autograde='auto',**kw):
    r=dict(skill=skill,part=part,q_no=no,q_type=qt,stem=stem,options=options,correct_answer=ans,autograde=autograde,points=1,audio_url=None,image_url=None,needs_image=False,tags=tags,explanation_mn=expl,audio_start_sec=None,audio_end_sec=None,audio_transcript=None,tutor_note=None)
    r.update(kw); rows.append(r)
SPK={'m':'男','f':'女'}
O=lambda o:[{'key':k,'text':t} for k,t in zip('ABCDEF',o)]
def listen(no,lines,ques,expl):
    tr=[f'{SPK[s]}：{t}' for s,t in lines]+[f'问：{ques}']
    return dict(audio_url=AUDIO,audio_start_sec=times[no][0],audio_end_sec=times[no][1],audio_transcript='\n'.join(tr),tutor_note={'transcript':[{'zh':x} for x in tr],'why':expl})
for no,s_,p,o,a,e in n.L1:
    tr=[f'{SPK[s_]}：{p}']
    q('listening',1,no,'choice','Сонссон агуулгатай тохирох өгүүлбэрийг сонго.',O(o),a,e,['sk.listening.short_news'],audio_url=AUDIO,audio_start_sec=times[no][0],audio_end_sec=times[no][1],audio_transcript=tr[0],tutor_note={'transcript':[{'zh':tr[0]}],'why':e})
for s_,p,qs in n.L2:
    for no,ques,o,a,e in qs: q('listening',2,no,'choice','',O(o),a,e,['sk.listening.passage'],**listen(no,[(s_,p)],ques,e))
for turns,qs in n.L3:
    for no,ques,o,a,e in qs: q('listening',3,no,'choice','',O(o),a,e,['sk.listening.interview'],**listen(no,turns,ques,e))
for p,qs in n.R1:
    for no,o,a,e in qs: q('reading',1,no,'choice',f'{p}\n★ （{no}）-д тохирох үгийг сонго.',O(o),a,e,['sk.reading.cloze','voc.hsk6'])
for p,opts,qs in n.R2:
    for no,a,e in qs: q('reading',2,no,'choice',f'{p}\n★ （{no}）-д тохирох хэсгийг сонго.',[{'key':k,'text':v} for k,v in opts.items()],a,e,['sk.reading.sentence_cloze'])
for p,qs in n.R3:
    for no,ques,o,a,e in qs: q('reading',3,no,'choice',f'{p}\n★ {ques}',O(o),a,e,['sk.reading.comprehension'])
no,prompt,ref,e=n.W1
q('writing',1,no,'essay',f'{prompt}\n(150-аас доошгүй ханзтай хэрэглээний бичвэр бич.)',None,ref,e,['sk.writing.essay'],autograde='manual')
no,prompt,ref,e=n.W2
q('writing',2,no,'essay',f'{prompt}\n(300-аас доошгүй ханзтай зохион бичлэг бич.)',None,ref,e,['sk.writing.essay'],autograde='manual')
rows.sort(key=lambda r:r['q_no'])
assert [r['q_no'] for r in rows]==list(range(1,83))
for r in rows:
    if r['options']: assert r['correct_answer'] in [o['key'] for o in r['options']],r['q_no']
import collections
print('listening answers',collections.Counter(r['correct_answer'] for r in rows if r['skill']=='listening'))
lmin=int(t/60)+2
sections=[
 {'skill':'listening','audio_url':AUDIO,'time_min':lmin,'parts':[
   {'desc':'Богино мэдээ → агуулгад тохирох өгүүлбэр','part':1,'range':[1,8],'q_type':'choice'},
   {'desc':'Өгүүлэл сонсоод асуултад хариулах','part':2,'range':[9,28],'q_type':'choice'},
   {'desc':'Ярилцлага сонсоод асуултад хариулах','part':3,'range':[29,40],'q_type':'choice'}]},
 {'skill':'reading','audio_url':None,'time_min':40,'parts':[
   {'desc':'Эхийн хоосон зайд үг сонгох','part':1,'range':[41,50],'q_type':'choice'},
   {'desc':'Эхийн хоосон зайд өгүүлбэр сонгох','part':2,'range':[51,60],'q_type':'choice'},
   {'desc':'Урт эх унших → асуултын хариу','part':3,'range':[61,80],'q_type':'choice'}]},
 {'skill':'writing','audio_url':None,'time_min':45,'parts':[
   {'desc':'Хэрэглээний бичвэр (150+ ханз)','part':1,'range':[81,81],'q_type':'essay'},
   {'desc':'Үзэл бодлын зохион бичлэг (300+ ханз)','part':2,'range':[82,82],'q_type':'essay'}]}]
total=lmin+85
def S(v):
    if v is None: return 'null'
    if isinstance(v,bool): return 'true' if v else 'false'
    if isinstance(v,(int,float)): return str(v)
    return "'"+str(v).replace("'","''")+"'"
J=lambda v:'null' if v is None else S(json.dumps(v,ensure_ascii=False))+'::jsonb'
A=lambda v:'array['+','.join(S(x) for x in v)+']::text[]'
out=[f"""-- 101: {n.TITLE} — өөрсдийн зохиосон загвар шалгалт.
-- 82 асуулт: сонсгол 40, уншлага 40, бичих 2. Аудио апп дотроо ({BASE}/). Дахин ажиллуулахад аюулгүй.
begin;

insert into public.mock_tests (id, hsk_level, title, total_questions, time_limit_min, has_writing, sections, is_active)
values ({S(n.TEST_ID)}, 6, {S(n.TITLE)}, 82, {total}, true, {J(sections)}, true)
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
open(f'{REPO}/supabase/migrations/101_hsk6_new_format_mock_n6_01.sql','w').write('\n'.join(out))
json.dump({'test':{'id':n.TEST_ID,'hsk_level':6,'title':n.TITLE,'total_questions':82,'time_limit_min':total,'has_writing':True,'sections':sections,'is_active':True},'questions':rows},open('n6/rows.json','w'),ensure_ascii=False)
print('ok',len(rows),'listening min',lmin, {k:times[k] for k in (1,8,9,12,40)})
