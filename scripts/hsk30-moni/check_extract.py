#!/usr/bin/env python3
"""check_extract.py <TID> — validate out/<TID>/extract.json. Prints ERR lines; 'OK' when clean."""
import json, os, re, sys
tid = sys.argv[1]
d = f"out/{tid}"
p = f"{d}/extract.json"
errs, warns = [], []
try:
    x = json.load(open(p, encoding="utf-8"))
except Exception as e:
    print("ERR cannot parse", p, e); sys.exit(1)
if x.get("test_id") != tid: errs.append(f"test_id {x.get('test_id')} != {tid}")
if not re.fullmatch(r"M\d26\d\d", tid): errs.append("bad TID format")
lvl = x.get("hsk_level")
if lvl != int(tid[1]): errs.append("hsk_level != TID digit")
qs = x.get("questions") or []
n = x.get("total_questions")
nos = [q.get("q_no") for q in qs]
if nos != list(range(1, len(qs) + 1)): errs.append(f"q_no not 1..N contiguous: {nos[:5]}… len {len(qs)}")
if n != len(qs): errs.append(f"total_questions {n} != {len(qs)}")
ALLOWED = {"choice", "match", "judge", "fill_word", "fill_char", "complete", "order", "picture_sentence", "essay", "essay_picture", "fill_match"}
secs = x.get("sections") or []
cover = {}
for s in secs:
    if s.get("skill") not in ("listening", "reading", "writing"): errs.append(f"bad skill {s.get('skill')}")
    if not isinstance(s.get("time_min"), (int, float)) or s["time_min"] <= 0: errs.append(f"section {s.get('skill')} time_min missing")
    for pt in s.get("parts") or []:
        a, b = pt.get("range", [0, 0])
        if pt.get("q_type") not in ALLOWED: errs.append(f"section part q_type {pt.get('q_type')} not allowed")
        for i in range(a, b + 1):
            if i in cover: errs.append(f"q{i} covered twice by parts")
            cover[i] = (s["skill"], pt.get("part"), pt.get("q_type"))
for i in range(1, len(qs) + 1):
    if i not in cover: errs.append(f"q{i} not covered by any section part")
bad_chars = re.compile(r"[\]\[|{}<>]|[A-Za-z]{4,}")
for q in qs:
    no = q.get("q_no")
    qt = q.get("q_type")
    if qt not in ALLOWED: errs.append(f"q{no}: q_type {qt}")
    c = cover.get(no)
    if c and (c[0] != q.get("skill") or c[1] != q.get("part")): errs.append(f"q{no}: skill/part {q.get('skill')}/{q.get('part')} != section {c[0]}/{c[1]}")
    if c and c[2] != qt: warns.append(f"q{no}: q_type {qt} != part q_type {c[2]}")
    opts = q.get("options")
    ans = q.get("correct_answer")
    ag = q.get("autograde", "auto")
    if ag not in ("auto", "strict", "manual"): errs.append(f"q{no}: autograde {ag}")
    if qt in ("choice", "match", "fill_word", "fill_match"):
        if not opts or len(opts) < 2: errs.append(f"q{no}: options missing")
        else:
            keys = [o.get("key") for o in opts]
            if ans not in keys: errs.append(f"q{no}: answer {ans!r} not in options {keys}")
            for o in opts:
                if not o.get("text") and not o.get("image"): errs.append(f"q{no}: option {o.get('key')} has no text/image")
                if o.get("image") and not os.path.exists(f"{d}/{o['image']}"): errs.append(f"q{no}: image {o['image']} missing")
    elif qt == "judge":
        if ans not in ("√", "×"): errs.append(f"q{no}: judge answer {ans!r}")
    elif qt == "order":
        keys = [o["key"] for o in (opts or [])]
        if q.get("position"):
            if q.get("position_answer") not in keys: errs.append(f"q{no}: order position_answer {q.get('position_answer')!r} not in options {keys}")
        elif not opts or not ans or sorted(ans) != sorted(keys): errs.append(f"q{no}: order answer {ans!r} vs options")
    elif qt in ("fill_char", "complete"):
        if not ans: errs.append(f"q{no}: {qt} needs correct_answer")
        if ag != "strict": warns.append(f"q{no}: {qt} autograde should be strict")
    else:
        if ag != "manual": warns.append(f"q{no}: {qt} autograde should be manual")
    if q.get("image") and not os.path.exists(f"{d}/{q['image']}"): errs.append(f"q{no}: image {q['image']} missing")
    st = q.get("stem")
    if st is None: errs.append(f"q{no}: stem null (use \"\")")
    elif bad_chars.search(st.replace("Сонсоод", "").replace("Пиньинь", "")) and qt not in ("essay", "essay_picture"):
        warns.append(f"q{no}: stem has suspicious chars: {st[:60]!r}")
    if q.get("skill") == "listening":
        sc = q.get("script")
        if not sc or not isinstance(sc, list) or not all(isinstance(l, dict) and l.get("zh") for l in sc): errs.append(f"q{no}: listening needs script lines")
    for o in opts or []:
        t = o.get("text") or ""
        if re.search(r"[A-Za-z]{5,}", t): warns.append(f"q{no}: option {o.get('key')} text looks like OCR garbage: {t[:40]!r}")
for e in errs: print("ERR", e)
for w in warns: print("WARN", w)
print("OK" if not errs else f"{len(errs)} errors")
