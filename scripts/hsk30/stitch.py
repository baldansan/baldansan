import json,subprocess,numpy as np,importlib.util,wave
SR=24000
sp=importlib.util.spec_from_file_location('n','n3_01.py'); n=importlib.util.module_from_spec(sp); sp.loader.exec_module(n)
clips=json.load(open('clips.json')); idx={c['id']:i for i,c in enumerate(clips)}
def load(cid):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f"clips/{idx[cid]}.wav",'-ac','1','-ar',str(SR),'-f','s16le','-'],capture_output=True).stdout
    x=np.frombuffer(raw,dtype=np.int16).astype(np.float32)
    # trim silence
    nz=np.where(np.abs(x)>300)[0]
    if len(nz): x=x[max(0,nz[0]-int(.05*SR)):nz[-1]+int(.12*SR)]
    act=x[np.abs(x)>300]; rms=np.sqrt((act**2).mean()) if len(act) else 1
    x=x*(3500/rms); return np.clip(x,-30000,30000)
buf=[]; t=0.0
def sil(s):
    global t; buf.append(np.zeros(int(s*SR),np.float32)); t+=int(s*SR)/SR
def play(cid):
    global t; x=load(cid); buf.append(x); t+=len(x)/SR
times={}
def item(q,lines,question,gap):
    global t
    st=t; play(f'n{q}'); sil(.7)
    for rep in range(2):
        for k,l in enumerate(lines):
            play(l); sil(.45)
        sil(1.3 if rep==0 else .5)
    if question: play(question); 
    times[q]=(round(st,1),round(t+.4,1)); sil(gap)
sil(1); play('p1'); sil(1.5)
for q,g,a,turns,e in n.L1: item(q,[f'q{q}_{k}' for k in range(len(turns))],None,5)
sil(1); play('p2'); sil(1.5)
for q,turns,*r in n.L2: item(q,[f'q{q}_{k}' for k in range(len(turns))],f'q{q}_q',8)
sil(1); play('p3'); sil(1.5)
for q,*r in n.L3: item(q,[f'q{q}_0'],f'q{q}_q',9)
sil(1)
x=np.concatenate(buf).astype(np.int16)
w=wave.open('listening.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes()); w.close()
subprocess.run(['ffmpeg','-v','error','-y','-i','listening.wav','-ac','1','-b:a','56k','listening.mp3'])
json.dump(times,open('times.json','w'))
print('total %.1fs = %.1f min'%(t,t/60)); print(times)
