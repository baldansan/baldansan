#!/usr/bin/env python3
"""align.py <TID> <audio-key e.g. L1-1> → out/<TID>/times.json {q_no: [start, end]}
Matches each listening question's script text (from extract.json) against the whisper transcript (audio/<key>.json)
sequentially; start = number announcement just before the first play (if any) else first matched word; end = next question start.
Also writes out/<TID>/align_report.txt with scores for review. Manual fix: out/<TID>/align_fix.json {"q": [s, e]}.
"""
import json, re, sys, os
from rapidfuzz import fuzz
tid, key = sys.argv[1], sys.argv[2]
d = f"out/{tid}"
x = json.load(open(f"{d}/extract.json", encoding="utf-8"))
seg = json.load(open(f"audio/{key}.json", encoding="utf-8"))
PUNCT = re.compile(r"[\s，。！？、：；“”‘’（）()《》—…,.!?:;\"'\-·~～\[\]]")
def clean(t): return PUNCT.sub("", t)
# flatten words with times
words = []  # (char, start, end, segidx)
for si, s in enumerate(seg):
    if s.get("w"):
        for w in s["w"]:
            for ch in clean(w["w"]):
                words.append((ch, w["s"], w["e"], si))
    else:
        t = clean(s["t"])
        for i, ch in enumerate(t):
            words.append((ch, s["s"], s["e"], si))
text = "".join(w[0] for w in words)
NUM = re.compile(r"^(第?[一二三四五六七八九十百零〇\d]{1,4}[题道]?|[一二三四五六七八九十]{1,3})$")
ls = [q for q in x["questions"] if q["skill"] == "listening"]
res, report = {}, []
pos = 0
starts = []
caps = []
prev_script = None
for q in ls:
    if prev_script is not None and q.get("script") == prev_script and starts and starts[-1] is not None:
        starts.append(starts[-1]); caps.append(caps[-1]); report.append(f"q{q['q_no']}: shares passage with previous"); continue
    prev_script = q.get("script")
    tgt = clean("".join(l["zh"] for l in q.get("script", [])) + (q.get("question_zh") or ""))
    if len(tgt) < 2:
        starts.append(None); caps.append(None); report.append(f"q{q['q_no']}: no script"); continue
    # search window: from pos; find best partial alignment
    best = None
    L = len(tgt)
    # candidate windows: slide over text in steps; use fuzz.partial_ratio_alignment on a chunk
    chunk_from = pos
    chunk_to = min(len(text), pos + max(4000, L * 40))
    sub = text[chunk_from:chunk_to]
    al = fuzz.partial_ratio_alignment(tgt, sub)
    if al is None:
        starts.append(None); caps.append(None); report.append(f"q{q['q_no']}: no align"); continue
    score = al.score
    s_idx = chunk_from + al.dest_start
    e_idx = chunk_from + al.dest_end
    # refine: use only the first 12 chars of target to pin the start more precisely
    head = tgt[:12]
    al2 = fuzz.partial_ratio_alignment(head, text[max(chunk_from, s_idx - 30): min(len(text), s_idx + 60)])
    if al2 and al2.score >= 70:
        s_idx = max(chunk_from, s_idx - 30) + al2.dest_start
    s_idx = min(s_idx, len(words) - 1); e_idx = min(e_idx, len(words) - 1)
    st = words[s_idx][1]
    # look back for a number announcement segment within 6 s before
    si = words[s_idx][3]
    ann = None
    for j in range(si - 1, max(-1, si - 4), -1):
        t = clean(seg[j]["t"])
        if NUM.match(t) and st - seg[j]["s"] < 8:
            ann = seg[j]["s"]; break
        if len(t) > 6: break
    q_start = ann if ann is not None else max(0.0, st - 0.6)
    # end cap: next part intro ("第X部分") or end-of-test announcement after this question's match
    cap = None
    for j in range(words[min(e_idx, len(words)-1)][3] + 1, min(len(seg), words[min(e_idx, len(words)-1)][3] + 12)):
        t = clean(seg[j]["t"])
        if re.search(r"第[一二三四五六七八九十]+部分|听力考试现在结束|考试结束", t):
            cap = seg[j]["s"]; break
    caps.append(cap)
    starts.append(q_start)
    pos = e_idx
    report.append(f"q{q['q_no']}: score {score:.0f} start {q_start:.1f} ({'ann' if ann is not None else 'word'}) text≈{text[s_idx:s_idx+20]}")
# ends
for i, q in enumerate(ls):
    s = starts[i]
    if s is None: continue
    nxt = next((starts[j] for j in range(i + 1, len(ls)) if starts[j] is not None), None)
    if nxt is not None: e = nxt - 0.3
    else:
        ends = [sg["s"] for sg in seg if sg["s"] > s and re.search(r"考试现在结束|听力考试结束|到此结束", sg["t"])]
        e = (ends[0] - 0.2) if ends else seg[-1]["e"]
    if caps[i] is not None and s < caps[i] < e: e = caps[i] - 0.3
    # cap absurdly long windows (e.g. missing next); listening items rarely exceed 4.5 min incl. two plays
    if e - s > 300: e = s + 300
    res[str(q["q_no"])] = [round(s, 2), round(e, 2)]
# shared passage groups: identical script lines → same window (start of first, end of last)
i = 0
while i < len(ls):
    j = i
    while j + 1 < len(ls) and ls[j + 1].get("script") == ls[i].get("script") and str(ls[j + 1]["q_no"]) in res and str(ls[i]["q_no"]) in res: j += 1
    if j > i:
        st = res[str(ls[i]["q_no"])][0]; en = res[str(ls[j]["q_no"])][1]
        for k in range(i, j + 1): res[str(ls[k]["q_no"])] = [st, en]
    i = j + 1
fixp = f"{d}/align_fix.json"
if os.path.exists(fixp):
    for k, v in json.load(open(fixp)).items():
        if v is None: res.pop(str(k), None)
        else: res[str(k)] = v
json.dump(res, open(f"{d}/times.json", "w"), ensure_ascii=False, indent=0)
open(f"{d}/align_report.txt", "w").write("\n".join(report))
low = [r for r in report if "score" in r and float(r.split("score ")[1].split()[0]) < 60]
print(f"{tid}: {len(res)}/{len(ls)} aligned; low-score: {len(low)}")
for r in low: print("  ", r)
