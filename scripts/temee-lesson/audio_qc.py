#!/usr/bin/env python3
"""
Үеийн бичлэгүүдийн чанарын шалгалт (public/open/audio-cmn/syllables).
Зарим файл нэртэйгээ таардаггүй (жнь «pa1» хийгүй, «ba» шиг сонсогддог) — сурагчид буруу заана.
Энэ скрипт файл бүрийн (1) хий гарсан хугацаа (эхлэлээс дуу хоолой эхлэх хүртэл), (2) хөгийн хэлбэрийг хэмжиж,
нэртэйгээ зөрсөн файлуудыг scripts/temee-lesson/audio-bad.json-д бичнэ. `npm run temee:check` тэр жагсаалтын
файл хэрэглэсэн хичээлийг зогсооно.
Ажиллуулах: python3 scripts/temee-lesson/audio_qc.py   (ffmpeg, numpy хэрэгтэй)
"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DIR = os.path.join(ROOT, "public/open/audio-cmn/syllables")
OUT = os.path.join(ROOT, "scripts/temee-lesson/audio-bad.json")
SR = 16000
ASPIRATED = ("p", "t", "k", "c", "ch", "q")
PLAIN = ("b", "d", "g")

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(float) / 32768

def analyse(x):
    """Хий гарсан хугацаа (мс) ба хөгийн хэлбэр. Босгыг файлын өөрийн чангаралтай харьцуулж авна."""
    hop, win = 80, 640
    en = np.array([np.sqrt((x[i:i + hop] ** 2).mean()) for i in range(0, len(x) - hop, hop)])
    if len(en) < 20:
        return None
    pk = np.percentile(en, 95)
    if pk < 0.01:
        return None
    onset = int(np.argmax(en > 0.02 * pk))
    f0, voice = [], None
    for i in range(onset * hop, len(x) - win, hop):
        w = x[i:i + win] * np.hanning(win)
        ac = np.correlate(w, w, "full")[win - 1:]
        lo, hi = SR // 400, SR // 70
        k = lo + int(np.argmax(ac[lo:hi]))
        voiced = ac[0] > 0 and ac[k] / ac[0] > 0.5 and np.sqrt((w ** 2).mean()) > 0.1 * pk
        if voiced:
            if voice is None: voice = i // hop
            f0.append(SR / k)
    if voice is None or len(f0) < 12:
        return None
    v = np.array(f0)
    med = np.median(v); v = v[(v > med * 0.6) & (v < med * 1.6)]  # октавын үсрэлтийг хасна
    if len(v) < 12:
        return None
    q = max(len(v) // 5, 1)
    return {"vot": (voice - onset) * 5, "start": float(v[:q].mean()), "end": float(v[-q:].mean()),
            "min": float(v.min()), "max": float(v.max()),
            "argmin": float(np.argmin(v) / len(v)), "argmax": float(np.argmax(v) / len(v))}

def initial_of(syl):
    for ini in ("zh", "ch", "sh"):
        if syl.startswith(ini): return ini
    return syl[0] if syl[0] in "bpmfdtnlgkhjqxrzcsyw" else ""

def judge(syl, tone, a):
    """Зөвхөн найдвартай хэмжигдэх зүйлийг шүүнэ. Хийгүй авиа (b d g)-ны өмнөх чимээг хий гэж
    андуурч болох тул «хий гарсан» гэж шүүхгүй — хий ялгах асуултад 4-р хөгийн бичлэг хэрэглэ (STANDARD §6)."""
    bad = []
    ini = initial_of(syl)
    if ini in ASPIRATED and a["vot"] < 30:
        bad.append(f"хий алга ({a['vot']}мс) — «{ini}» биш, хийгүй хос шигээ сонсогдоно")
    st = lambda f: 12 * np.log2(f)  # хагас тон
    rise = st(a["end"]) - st(a["start"]); span = st(a["max"]) - st(a["min"])
    if tone == 1 and span > 5: bad.append(f"1-р хөг тэгш биш ({span:.1f} хагас тон хэлбэлзэнэ)")
    if tone == 2 and (rise < 3 or st(a["start"]) - st(a["min"]) > 2.5):
        bad.append(f"2-р хөг цэвэр өгсөөгүй (өсөлт {rise:.1f})")
    if tone == 3 and not (st(a["start"]) - st(a["min"]) > 1.5 or st(a["max"]) - st(a["min"]) > 3):
        bad.append("3-р хөгийн нам хонхор тод биш")
    if tone == 4 and st(a["max"]) - st(a["end"]) < 4: bad.append("4-р хөг унаагүй")
    return bad

def main():
    bad, n = {}, 0
    for f in sorted(os.listdir(DIR)):
        m = re.match(r"cmn-([a-zü]+?)([1-5])\.mp3$", f)
        if not m: continue
        syl, tone = m.group(1), int(m.group(2)); n += 1
        a = analyse(load(os.path.join(DIR, f)))
        if a is None:
            bad[f"{syl}{tone}"] = ["хэмжиж чадсангүй"]; continue
        if tone == 5: continue
        b = judge(syl, tone, a)
        if b: bad[f"{syl}{tone}"] = b
    json.dump({"_note": "audio_qc.py-ээр автоматаар үүссэн. Эдгээр бичлэгийг Тэмээ багшийн хичээлд хэрэглэхгүй.",
               "bad": bad}, open(OUT, "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(f"{n} файл шалгав, {len(bad)} нь сэжигтэй → {os.path.relpath(OUT, ROOT)}")

if __name__ == "__main__":
    main()
