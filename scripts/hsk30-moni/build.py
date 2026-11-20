#!/usr/bin/env python3
"""build.py <TID> <audio-key|-> → repo assets public/mock-tests/<tid>/ (listening.mp3 mono 48k + img/*.webp)
and out/<TID>/<TID>.sql (upsert mock_tests + mock_test_questions). Also out/<TID>/package.json (importer format)."""
import json, os, re, shutil, subprocess, sys
tid, akey = sys.argv[1], sys.argv[2]
REPO = "/home/claude/baldansan"
d = f"out/{tid}"
x = json.load(open(f"{d}/extract.json", encoding="utf-8"))
ex = json.load(open(f"{d}/explain.json", encoding="utf-8")) if os.path.exists(f"{d}/explain.json") else {}
times = json.load(open(f"{d}/times.json", encoding="utf-8")) if os.path.exists(f"{d}/times.json") else {}
slug = tid.lower()
BASE = f"/mock-tests/{slug}"
pub = f"{REPO}/public{BASE}"
os.makedirs(f"{pub}/img", exist_ok=True)
AUDIO = None
if akey != "-":
    mp3 = f"{pub}/listening.mp3"
    if not os.path.exists(mp3):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"audio/{akey}.mp3", "-ac", "1", "-ar", "22050", "-b:a", "48k", mp3], check=True)
    AUDIO = f"{BASE}/listening.mp3"
# images
for f in os.listdir(f"{d}/img") if os.path.isdir(f"{d}/img") else []:
    if f.endswith(".webp"): shutil.copy(f"{d}/img/{f}", f"{pub}/img/{f}")
def img_url(rel): return f"{BASE}/img/{os.path.basename(rel)}" if rel else None
LVL = x["hsk_level"]
TAGS = {"listening": "sk.listening", "reading": "sk.reading", "writing": "sk.writing"}
rows = []
# normalise paragraph-ordering groups → per-position choice (same as N5-01)
for q in x["questions"]:
    if q["q_type"] == "order" and q.get("position"):
        paras = "\n".join(f"{o['key']}．{o['text']}" for o in q["options"])
        gap = ""
        m = re.search(r"（\d+）→.*（\d+）", q.get("stem") or "")
        if m: gap = m.group(0) + "\n"
        n_gap = len(q.get("correct_answer") or "") or len(q["options"])
        hint = "" if n_gap == len(q["options"]) else f" (нэг хэсэг илүү, зурсан хэсэг байрандаа)"
        q["stem"] = f"{gap}{paras}\n★ Зөв дараалалд оруулбал {q['position']}-р хоосон зайд (（{q['q_no']}）) аль хэсэг орох вэ?{hint}" if gap else f"{paras}\n★ Дээрх {len(q['options'])} хэсгийг зөв дараалалд оруулбал {q['position']}-р байрт аль нь орох вэ?"
        q["options"] = [{"key": o["key"], "text": (o["text"][:9] + "…") if len(o["text"]) > 9 else o["text"]} for o in q["options"]]
        q["correct_answer"] = q["position_answer"]; q["q_type"] = "choice"
for s_ in x["sections"]:
    for p_ in s_["parts"]:
        if p_["q_type"] == "order": p_["q_type"] = "choice"
for q in x["questions"]:
    no = q["q_no"]; e = ex.get(str(no), {})
    opts = None
    if q.get("options"):
        opts = [{"key": o["key"], "text": o.get("text", "") or "", **({"image_url": img_url(o["image"])} if o.get("image") else {})} for o in q["options"]]
    tr = None
    if q["skill"] == "listening":
        lines = [(f"{l['spk']}：{l['zh']}" if l.get("spk") else l["zh"]) for l in q.get("script", [])]
        if q.get("question_zh"): lines.append(f"问：{q['question_zh']}")
        tr = "\n".join(lines)
    t = times.get(str(no))
    tn = e.get("tutor_note")
    if tn and q["skill"] == "listening" and not tn.get("transcript") and tr:
        tn["transcript"] = [{"zh": l} for l in tr.split("\n")]
    tags = [f"{TAGS[q['skill']]}.{q['q_type']}", f"voc.hsk{min(LVL,6)}", "hsk30"]
    rows.append(dict(skill=q["skill"], part=q["part"], q_no=no, q_type=q["q_type"], stem=q.get("stem") or "", options=opts,
        correct_answer=q.get("correct_answer"), autograde=q.get("autograde", "auto"), points=q.get("points", 1),
        audio_url=AUDIO if (q["skill"] == "listening" and (t is not None or not times)) else None, image_url=img_url(q.get("image")), needs_image=bool(q.get("image") or any(o.get("image") for o in (q.get("options") or []))),
        tags=tags, explanation_mn=e.get("explanation_mn"), audio_start_sec=t[0] if t else None, audio_end_sec=t[1] if t else None,
        audio_transcript=tr, tutor_note=tn))
secs = []
for s in x["sections"]:
    secs.append({"skill": s["skill"], "audio_url": AUDIO if s["skill"] == "listening" else None, "time_min": s["time_min"],
                 "parts": [{"part": p["part"], "range": p["range"], "q_type": p["q_type"], "desc": p.get("desc", "")} for p in s["parts"]]})
total_min = sum(s["time_min"] for s in secs)
has_w = any(s["skill"] == "writing" for s in secs)
lvl_label = "7–9" if LVL >= 7 else str(LVL)
serial = int(tid[4:6])
title = f"HSK {lvl_label} · HSK 3.0 загвар шалгалт №{serial} (全真模拟)"
pkg = dict(test_id=tid, hsk_level=LVL, title=title, total_questions=len(rows), time_limit_min=total_min, has_writing=has_w, sections=secs, questions=rows)
json.dump(pkg, open(f"{d}/package.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
def S(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return str(v)
    return "'" + str(v).replace("'", "''") + "'"
def J(v): return "null" if v is None else S(json.dumps(v, ensure_ascii=False)) + "::jsonb"
def A(v): return "array[" + ",".join(S(x) for x in v) + "]::text[]"
out = [f"-- {tid}: {title} — 全真模拟 (BLCUP 2026), HSK 3.0 шинэ бүтэц. {len(rows)} асуулт, {total_min} мин. Аудио/зураг: public{BASE}/\n-- Дахин ажиллуулахад аюулгүй (upsert).\nbegin;"]
out.append(f"""insert into public.mock_tests (id, hsk_level, title, total_questions, time_limit_min, has_writing, sections, is_active)
values ({S(tid)}, {LVL}, {S(title)}, {len(rows)}, {total_min}, {S(has_w)}, {J(secs)}, true)
on conflict (id) do update set hsk_level=excluded.hsk_level, title=excluded.title, total_questions=excluded.total_questions,
  time_limit_min=excluded.time_limit_min, has_writing=excluded.has_writing, sections=excluded.sections, is_active=excluded.is_active;
delete from public.mock_test_questions where test_id = {S(tid)};""")
vals = []
for r in rows:
    vals.append("(" + ",".join([S(tid), S(r["skill"]), str(r["part"]), str(r["q_no"]), S(r["q_type"]), S(r["stem"]), J(r["options"]), S(r["correct_answer"]), S(r["autograde"]), str(r["points"]),
        S(r["audio_url"]), S(r["image_url"]), S(r["needs_image"]), A(r["tags"]), S(r["explanation_mn"]), S(r["audio_start_sec"]), S(r["audio_end_sec"]), S(r["audio_transcript"]), J(r["tutor_note"])]) + ")")
out.append("insert into public.mock_test_questions (test_id, skill, part, q_no, q_type, stem, options, correct_answer, autograde, points, audio_url, image_url, needs_image, tags, explanation_mn, audio_start_sec, audio_end_sec, audio_transcript, tutor_note) values\n" + ",\n".join(vals) + ";")
out.append("commit;")
open(f"{d}/{tid}.sql", "w", encoding="utf-8").write("\n".join(out) + "\n")
nt = sum(1 for r in rows if r["audio_start_sec"] is not None); nl = sum(1 for r in rows if r["skill"] == "listening"); ne = sum(1 for r in rows if r["explanation_mn"])
print(f"{tid}: {len(rows)} q, {total_min} min, audio {nt}/{nl}, explain {ne}/{len(rows)}, assets → public{BASE}")
# importer zip (json only; audio/images are absolute /mock-tests/... paths served from the repo's public/)
import zipfile
with zipfile.ZipFile(f"{d}/{tid}.zip", "w", zipfile.ZIP_DEFLATED) as z:
    z.write(f"{d}/package.json", f"{tid}.json")
