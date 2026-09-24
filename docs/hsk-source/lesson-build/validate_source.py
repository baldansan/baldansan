"""Эх сурвалжийн JSON-ийг шалгана: python3 validate_source.py N"""
import json, re, sys
N = int(sys.argv[1]); NN = f"{N:02d}"
p = f"/home/claude/hsk3build/L{NN}/source.json"
d = json.load(open(p, encoding="utf-8"))
errs, warns = [], []
def req(obj, key, where):
    if key not in obj: errs.append(f"{where}: '{key}' байхгүй")
for k in ("level","lesson","book","title_zh","title_pinyin","textbook","unclear","verified_pages","schema_version"): req(d, k, "root")
if d.get("lesson") != N: errs.append(f"lesson={d.get('lesson')} ≠ {N}")
tone = re.compile(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]")
cyr = re.compile(r"[А-Яа-яӨөҮү]")
def no_cyr(s, where):
    if isinstance(s, str) and cyr.search(s): errs.append(f"{where}: монгол текст байна → {s[:40]}")
def walk(o, path="root"):
    if isinstance(o, dict):
        for k, v in o.items(): walk(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o): walk(v, f"{path}[{i}]")
    elif isinstance(o, str):
        if not path.endswith(".unclear") and "unclear" not in path: no_cyr(o, path)
        if re.search(r"[一-鿿]", o) and re.search(r"[一-鿿][,?!;:]", o): warns.append(f"{path}: хагас өргөнтэй цэг таслал → {o[:40]}")
walk(d)
tb = d.get("textbook", {})
texts = tb.get("texts", [])
if not texts: errs.append("textbook.texts хоосон")
nw = 0
for t in texts:
    for k in ("n","kind","lines","new_words"): req(t, k, f"text{t.get('n')}")
    if not t.get("lines"): errs.append(f"text{t.get('n')}: lines хоосон")
    for l in t.get("lines", []):
        if not l.get("zh"): errs.append(f"text{t.get('n')}: мөр zh хоосон")
        if l.get("pinyin") and not tone.search(l["pinyin"]): warns.append(f"text{t.get('n')}: пиньинь хөггүй → {l['pinyin'][:30]}")
    for w in t.get("new_words", []):
        nw += 1
        for k in ("n","zh","pinyin","en"): req(w, k, f"word {w.get('zh')}")
        if w.get("pinyin") and not tone.search(w["pinyin"]) and not re.fullmatch(r"[a-z]+", w["pinyin"]): warns.append(f"word {w.get('zh')}: пиньинь хөггүй → {w['pinyin']}")
nums = sorted(w["n"] for t in texts for w in t.get("new_words", []) if isinstance(w.get("n"), int))
if nums and nums != list(range(1, len(nums)+1)): warns.append(f"үгийн дугаар тасархай: {nums}")
gr = tb.get("grammar", [])
if not gr: errs.append("textbook.grammar хоосон")
for g in gr:
    for k in ("n","title_zh","explanation_zh","examples"): req(g, k, f"grammar{g.get('n')}")
    if not g.get("examples"): errs.append(f"grammar{g.get('n')}: жишээгүй")
ex = tb.get("exercises", [])
if len(ex) < 3: warns.append(f"textbook.exercises {len(ex)} — ихэвчлэн 4 (朗读/选词填空/描述图片/回答问题)")
for e in ex:
    for k in ("n","type_zh","instruction_zh","items"): req(e, k, f"exercise{e.get('n')}")
wb = d.get("workbook")
if not wb: errs.append("workbook байхгүй")
else:
    items = [it for s in wb.get("sections", []) for it in s.get("items", [])]
    nn = [it.get("n") for it in items if isinstance(it.get("n"), int)]
    if len([x for x in nn if 1 <= x <= 54]) < 50: errs.append(f"дасгалын номын асуулт {len(nn)} < 50")
    for it in items:
        if "answer" in it and "answer_ref" not in it and "answers_ref" not in wb: warns.append(f"wb item {it.get('n')}: answer байгаа ч answer_ref байхгүй")
    listening = [s for s in wb["sections"] if "听力" in s.get("type_zh","")+s.get("instruction_zh","")]
    for s in listening:
        for it in s.get("items", []):
            if not it.get("transcript_zh"): warns.append(f"сонсгол {it.get('n')}: transcript_zh байхгүй")
te = d.get("teacher")
if not te: warns.append("teacher байхгүй")
else:
    for k in ("ref","objectives_zh","steps","notes_zh"): req(te, k, "teacher")
    if len(te.get("steps", [])) < 3: warns.append("teacher.steps 3-аас бага")
if not d.get("verified_pages"): errs.append("verified_pages хоосон")
print(f"L{NN}: texts={len(texts)} lines={sum(len(t.get('lines',[])) for t in texts)} words={nw} grammar={len(gr)} ex={len(ex)} wb_items={len([it for s in (wb or {}).get('sections',[]) for it in s.get('items',[])])} teacher_steps={len((te or {}).get('steps',[]))} unclear={len(d.get('unclear',[]))}")
for e in errs: print("ERR ", e)
for w in warns[:40]: print("WARN", w)
if len(warns) > 40: print(f"... +{len(warns)-40} warn")
sys.exit(1 if errs else 0)
