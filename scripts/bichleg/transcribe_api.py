#!/usr/bin/env python3
"""
Аудио → хятад хадмал (цагтай), Whisper API-аар. Гаралт нь build_series.py-ийн captions/epNN.json3 формат.

Шаардлага:  pip install openai      brew install ffmpeg (Mac) / winget install ffmpeg (Win)
Орчин:      OPENAI_API_KEY=sk-...   (platform.openai.com → API keys; $0.006/мин ≈ $0.36/цаг)

Аудио татах (цуврал бүхэлдээ, зөвхөн аудио):
  yt-dlp -x --audio-format m4a --audio-quality 5 -o "work/youfeng/audio/ep%(playlist_index)02d.%(ext)s" "PLAYLIST_LINK"
Хэрэглээ:
  python scripts/bichleg/transcribe_api.py work/youfeng            # audio/epNN.m4a бүгд → captions/epNN.json3
  python scripts/bichleg/transcribe_api.py work/youfeng --ep 1
  --prompt "去有风的地方 许红豆 谢之遥"   # нэр, нэр томьёог зөв бичүүлэх (заавал биш)
"""
import argparse, glob, json, os, subprocess, sys, tempfile

ap = argparse.ArgumentParser()
ap.add_argument("folder")
ap.add_argument("--ep", type=int)
ap.add_argument("--prompt", default="")
ap.add_argument("--model", default=os.environ.get("WHISPER_MODEL", "whisper-1"))
ap.add_argument("--chunk-min", type=int, default=10)
a = ap.parse_args()

try:
    from openai import OpenAI
except ImportError:
    sys.exit("pip install openai")
client = OpenAI()

def split_audio(path, minutes):
    """ffmpeg-ээр N минутын хэсгүүд болгоно (API 25MB хязгаартай)."""
    tmp = tempfile.mkdtemp()
    out = os.path.join(tmp, "part%03d.m4a")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", path, "-f", "segment", "-segment_time",
                    str(minutes * 60), "-c", "copy", out], check=True)
    return sorted(glob.glob(os.path.join(tmp, "part*.m4a")))

def transcribe(path, offset, prompt):
    with open(path, "rb") as f:
        r = client.audio.transcriptions.create(model=a.model, file=f, language="zh",
                                               response_format="verbose_json",
                                               timestamp_granularities=["segment"],
                                               prompt=prompt or None)
    segs = r.segments if hasattr(r, "segments") else r.get("segments", [])
    out = []
    for s in segs:
        st = (s.start if hasattr(s, "start") else s["start"]) + offset
        en = (s.end if hasattr(s, "end") else s["end"]) + offset
        t = (s.text if hasattr(s, "text") else s["text"]).strip()
        if t:
            out.append((st, en, t))
    return out

def do_episode(ep):
    src = next((p for p in glob.glob(os.path.join(a.folder, "audio", f"ep{ep:02d}.*"))), None)
    if not src:
        print(f"ep{ep:02d}: audio/ep{ep:02d}.* байхгүй"); return
    dst = os.path.join(a.folder, "captions", f"ep{ep:02d}.json3")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    parts = split_audio(src, a.chunk_min)
    lines, offset, prompt = [], 0.0, a.prompt
    for i, p in enumerate(parts):
        segs = transcribe(p, offset, prompt)
        lines += segs
        # дараагийн хэсэгт өмнөх текстийн төгсгөлийг prompt болгож өгвөл залгаас сайн
        prompt = (a.prompt + " " + " ".join(t for _, _, t in segs[-5:]))[-800:]
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                             "-of", "csv=p=0", p]).decode().strip())
        offset += dur
        print(f"  ep{ep:02d}: хэсэг {i + 1}/{len(parts)} · {len(lines)} мөр")
    events = [{"tStartMs": int(s * 1000), "dDurationMs": max(500, int((e - s) * 1000)), "segs": [{"utf8": t}]}
              for s, e, t in lines]
    json.dump({"events": events}, open(dst, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"ep{ep:02d}: {len(lines)} мөр → {dst}")

eps = [a.ep] if a.ep else sorted({int(os.path.basename(p)[2:4]) for p in glob.glob(os.path.join(a.folder, "audio", "ep??.*"))})
if not eps:
    sys.exit("audio/epNN.m4a олдсонгүй — эхлээд yt-dlp -x ... (дээрх заавар)")
for ep in eps:
    do_episode(ep)
print("\nДараагийн алхам: build_series.py --export-zh → translate_api.py → build_series.py")
