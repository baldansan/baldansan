import sys,json,os,subprocess
from faster_whisper import WhisperModel
import numpy as np
m=WhisperModel("small",device="cpu",compute_type="int8",cpu_threads=2)
for f in sorted(os.listdir('audio')):
    if not f.endswith('.mp3'): continue
    out=f'audio/{f[:-4]}.json'
    if os.path.exists(out): continue
    wav=f'/tmp/{f[:-4]}.wav'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'audio/{f}','-ac','1','-ar','16000',wav])
    raw=subprocess.run(['ffmpeg','-loglevel','error','-i',wav,'-f','s16le','-ac','1','-ar','16000','-'],capture_output=True).stdout
    arr=np.frombuffer(raw,np.int16).astype(np.float32)/32768.0
    segs,_=m.transcribe(arr,language='zh',word_timestamps=True,vad_filter=True,beam_size=1,condition_on_previous_text=False)
    res=[]
    for s in segs:
        res.append({'s':round(s.start,2),'e':round(s.end,2),'t':s.text,'w':[{'s':round(w.start,2),'e':round(w.end,2),'w':w.word} for w in (s.words or [])]})
    json.dump(res,open(out,'w'),ensure_ascii=False)
    os.remove(wav); print('done',f,len(res),flush=True)
print('ALLDONE')
