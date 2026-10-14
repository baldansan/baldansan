"""faster-whisper (small, int8) → asr JSON. Usage: asr.py in.mp3 out.json [initial_prompt]
Output: [{start,end,text,words:[{w,s,e}]}]. PCM decoded via ffmpeg (PyAV metadata bug workaround)."""
import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
prompt = sys.argv[3] if len(sys.argv) > 3 else "以下是普通话的句子。"
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
model = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = model.transcribe(audio, language="zh", word_timestamps=True, initial_prompt=prompt, vad_filter=True,
                           vad_parameters=dict(min_silence_duration_ms=300))
rows = []
for s in segs:
    rows.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                 "words": [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])]})
json.dump(rows, open(out, "w"), ensure_ascii=False, indent=1)
print(out, len(rows), "segments", round(rows[-1]["end"] if rows else 0, 1), "s")
