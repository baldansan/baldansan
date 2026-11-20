#!/usr/bin/env python3
import json, re, sys
tid = sys.argv[1]
x = json.load(open(f"out/{tid}/extract.json", encoding="utf-8"))
try:
    e = json.load(open(f"out/{tid}/explain.json", encoding="utf-8"))
except Exception as ex:
    print("ERR parse", ex); sys.exit(1)
errs, warns = [], []
RUS = re.compile(r"\b(магазин|стол\b|телефон|больниц|аптек|вокзал|поезд|самолёт|документ|работ[аы]|учитель|студент)", re.I)
SUSP = re.compile(r"\b(огуулбэр|хуухэд|зовхон|оорийн|бурэн|хун|угс|унэн|суух|угуй)\b", re.I)
for q in x["questions"]:
    k = str(q["q_no"])
    if k not in e: errs.append(f"q{k} missing"); continue
    r = e[k]
    if not r.get("explanation_mn") or len(r["explanation_mn"]) < 15: errs.append(f"q{k} explanation_mn short")
    tn = r.get("tutor_note") or {}
    if not tn.get("why") or len(tn["why"]) < 15: errs.append(f"q{k} tutor_note.why missing")
    if q["skill"] == "listening":
        tr = tn.get("transcript")
        if not tr or not all(isinstance(l, dict) and l.get("zh") for l in tr): errs.append(f"q{k} listening transcript missing")
        elif not all(l.get("mn") for l in tr): warns.append(f"q{k} transcript lines without mn")
    for w in (tn.get("words") or []):
        if not (isinstance(w, dict) and w.get("zh") and w.get("pinyin") and w.get("mn")): errs.append(f"q{k} words item incomplete: {w}")
    for kk, vv in (tn.get("wrong") or {}).items():
        if not isinstance(vv, str): errs.append(f"q{k} wrong[{kk}] not string")
    for l in (tn.get("transcript") or []):
        if isinstance(l, dict) and re.search(r"[\u4e00-\u9fff]", l.get("mn") or "") : warns.append(f"q{k} transcript mn contains hanzi: {l.get('mn')[:30]}")
    blob = json.dumps(r, ensure_ascii=False)
    if RUS.search(blob): warns.append(f"q{k} possible Russian loanword: {RUS.search(blob).group(0)}")
    if SUSP.search(blob): warns.append(f"q{k} suspicious Cyrillic (ө/ү?): {SUSP.search(blob).group(0)}")
    if len(blob) > 2600: warns.append(f"q{k} too long ({len(blob)})")
    if r.get("flag"): print("FLAG", k, r["flag"])
for s in errs: print("ERR", s)
for s in warns: print("WARN", s)
print("OK" if not errs else f"{len(errs)} errors")
