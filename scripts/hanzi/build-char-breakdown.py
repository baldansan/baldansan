#!/usr/bin/env python3
"""
Ханзны задаргааны сан (public/data/char_breakdown_full.json) — makemeahanzi dictionary.txt-ээс.

Эх сурвалж: https://github.com/skishore/makemeahanzi (dictionary.txt: IDS задаргаа, язгуур,
象形/会意/形声 төрөл, 形声-ийн утга/дуудлага заагч). Монгол/хятад нэр: batches/parts.out.json
(бүрдэл хэсгийн нэр), batches/hints*.out.json (гарлын тайлбар) — агентын орчуулга.

Хэрэглээ: python3 scripts/hanzi/build-char-breakdown.py <makemeahanzi_dir_with_dictionary.txt_and_batches>
"""
import json, sys, os, glob, collections

SRC = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/hanzi"
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

D = {}
for line in open(os.path.join(SRC, "dictionary.txt"), encoding="utf8"):
    d = json.loads(line)
    D[d["character"]] = d

OPS2 = set("⿰⿱⿴⿵⿶⿷⿸⿹⿺⿻")
OPS3 = set("⿲⿳")
STRUCT_MN = {
    "⿰": "зүүн–баруун", "⿲": "зүүн–дунд–баруун", "⿱": "дээд–доод", "⿳": "дээд–дунд–доод",
    "⿴": "бүтэн хүрээ", "⿵": "дээрээс хүрээлсэн", "⿶": "доороос хүрээлсэн", "⿷": "зүүнээс хүрээлсэн",
    "⿸": "зүүн дээрээс хүрээлсэн", "⿹": "баруун дээрээс хүрээлсэн", "⿺": "зүүн доороос хүрээлсэн", "⿻": "давхар",
}
STRUCT_ZH = {
    "⿰": "左右结构", "⿲": "左中右结构", "⿱": "上下结构", "⿳": "上中下结构", "⿴": "全包围结构",
    "⿵": "上三包围", "⿶": "下三包围", "⿷": "左三包围", "⿸": "左上包围", "⿹": "右上包围", "⿺": "左下包围", "⿻": "镶嵌结构",
}
TYPE = {"pictophonetic": "形声", "ideographic": "会意", "pictographic": "象形"}
STROKES = set("一丨丿丶乀乁乙乚乛亅") | {chr(x) for x in range(0x31C0, 0x31F0)}


def parse(s):
    if not s:
        return None, ""
    c = s[0]
    if c in OPS2:
        a, r = parse(s[1:]); b, r = parse(r)
        return ("op", c, [a, b]), r
    if c in OPS3:
        a, r = parse(s[1:]); b, r = parse(r); d, r = parse(r)
        return ("op", c, [a, b, d]), r
    return ("ch", c), s[1:]


def flatten(t):
    if t is None:
        return []
    if t[0] == "ch":
        return [t[1]]
    out = []
    for x in t[2]:
        out += flatten(x)
    return out


# --- нэрс ---
parts_named = {}
for row in json.load(open(os.path.join(SRC, "batches/parts.out.json"), encoding="utf8")):
    parts_named[row["part"]] = row
old_mn = json.load(open(os.path.join(REPO, "public/data/component_meanings_mn.json"), encoding="utf8"))
old_full = json.load(open(os.path.join(REPO, "public/data/char_breakdown_full.json"), encoding="utf8"))
legacy_names = {}
for k, v in old_mn.items():
    if v.get("mn"):
        legacy_names[k] = v["mn"]
for ch, e in old_full.items():
    for c in e.get("c", []):
        if c.get("mn") and c["ch"] not in legacy_names:
            legacy_names[c["ch"]] = c["mn"]
    if e.get("r") and e.get("rmn") and e["r"] not in legacy_names:
        legacy_names[e["r"]] = e["rmn"]

hints = {}
for f in glob.glob(os.path.join(SRC, "batches/hints*.out.json")):
    for row in json.load(open(f, encoding="utf8")):
        hints[row["char"]] = row


def name_mn(p):
    if p in parts_named:
        return parts_named[p]["mn"]
    return legacy_names.get(p, "")


def name_zh(p):
    if p in parts_named:
        return parts_named[p]["zh"]
    d = D.get(p)
    if d and d.get("definition"):
        return ""
    return ""


def kind(p):
    if p in parts_named:
        return parts_named[p]["kind"]
    if p in STROKES:
        return "stroke"
    return "char" if p in D else "other"


def py(p):
    d = D.get(p)
    return (d.get("pinyin") or [""])[0] if d else ""


HSK_CHAR_MN = {}
for w in json.load(open(os.path.join(REPO, "data/hsk_words.json"), encoding="utf8")):
    if len(w["simplified"]) == 1 and w["simplified"] not in HSK_CHAR_MN and w.get("meaning_mn"):
        HSK_CHAR_MN[w["simplified"]] = w["meaning_mn"].split(";")[0].strip()[:40]
out = {}
stats = collections.Counter()
for ch, d in D.items():
    if not ("一" <= ch <= "鿿"):
        # зөвхөн CJK үндсэн блок (бүрдэл хэсгийн хувилбарууд нь тусдаа орохгүй)
        continue
    dec = d.get("decomposition") or "？"
    tree, _ = parse(dec)
    op = tree[1] if tree and tree[0] == "op" else None
    parts = flatten(tree)
    incomplete = "？" in parts
    parts = [p for p in parts if p != "？"]
    et = d.get("etymology") or {}
    t = TYPE.get(et.get("type"))
    sem, pho = et.get("semantic"), et.get("phonetic")
    comps = []
    for p in parts:
        c = {"ch": p}
        m = name_mn(p)
        if m:
            c["mn"] = m
        z = name_zh(p)
        if z:
            c["zh"] = z
        k = kind(p)
        if k != "char":
            c["k"] = k
        if t == "形声":
            if p == sem:
                c["role"] = "sem"
            elif p == pho:
                c["role"] = "pho"
                if py(p):
                    c["py"] = py(p)
        comps.append(c)
    entry = {"s": STRUCT_MN.get(op, "дан"), "sz": STRUCT_ZH.get(op, "独体结构"), "ids": dec if not incomplete else dec, "c": comps}
    if d.get("pinyin"):
        entry["p"] = d["pinyin"][0]
    if ch in HSK_CHAR_MN:
        entry["m"] = HSK_CHAR_MN[ch]
    if incomplete:
        entry["inc"] = True
    if t:
        entry["t"] = t
    r = d.get("radical")
    if r:
        entry["r"] = r
        if name_mn(r):
            entry["rmn"] = name_mn(r)
        if name_zh(r):
            entry["rz"] = name_zh(r)
    # тайлбар
    h = hints.get(ch)
    if t == "形声":
        sm = name_mn(sem) if sem else ""
        sz = name_zh(sem) if sem else ""
        pp = py(pho) if pho else ""
        e_mn = "形声字 — "
        e_zh = "形声字："
        if sem:
            e_mn += f"{sem} утга заагч" + (f" ({sm})" if sm else "")
            e_zh += f"{sem} 表义" + (f"（{sz}）" if sz else "")
        if pho:
            e_mn += (" + " if sem else "") + f"{pho} дуудлага заагч" + (f" ({pp})" if pp else "")
            e_zh += ("＋" if sem else "") + f"{pho} 表音" + (f"（{pp}）" if pp else "")
        entry["e"] = e_mn.rstrip(" —：") + "."
        entry["ez"] = e_zh.rstrip("：")
    elif t in ("会意", "象形"):
        if h:
            entry["e"] = f"{t}字 — {h['mn']}"
            entry["ez"] = f"{t}字：{h['zh']}"
        else:
            entry["e"] = f"{t}字"
            entry["ez"] = f"{t}字"
    else:
        named = [f"{c['ch']} {c['mn']}" for c in comps if c.get("mn")]
        if named:
            entry["e"] = " + ".join(named)
    # 2-р түвшин
    sub = {}
    for p in parts:
        if kind(p) == "stroke":
            continue
        dp = D.get(p)
        if not dp:
            continue
        tr, _ = parse(dp.get("decomposition") or "？")
        fl = [x for x in flatten(tr) if x != "？"]
        if len(fl) >= 2 and "？" not in flatten(tr):
            sub[p] = fl
    if sub:
        entry["sub"] = sub
    out[ch] = entry
    stats[t or "none"] += 1

# Клиентэд татагддаг тул зөвхөн HSK ханз + тэдгээрийн бүрдэл хэсгүүдийг үлдээнэ (~4k)
hw = json.load(open(os.path.join(REPO, "data/hsk_words.json"), encoding="utf8"))
keep = {c for w in hw for c in w["simplified"] if "\u4e00" <= c <= "\u9fff"}
try:
    def walk(o):
        if isinstance(o, str):
            for c in o:
                if "\u4e00" <= c <= "\u9fff":
                    keep.add(c)
        elif isinstance(o, dict):
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(json.load(open(os.path.join(REPO, "public/data/hsk30_hanzi.json"), encoding="utf8")))
except Exception:
    pass
for c in list(keep):
    e = out.get(c)
    if not e:
        continue
    for cc in e["c"]:
        keep.add(cc["ch"])
    for v in (e.get("sub") or {}).values():
        keep.update(v)
out = {c: e for c, e in out.items() if c in keep}
dst = os.path.join(REPO, "public/data/char_breakdown_full.json")
json.dump(out, open(dst, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print("chars", len(out), dict(stats), "size", os.path.getsize(dst))

# component_meanings_mn.json — mn + zh + kind
cm = {}
for k, v in old_mn.items():
    cm[k] = {"mn": v.get("mn", "")}
for p, row in parts_named.items():
    cm[p] = {"mn": row["mn"], "zh": row["zh"], "k": row["kind"]}
json.dump(cm, open(os.path.join(REPO, "public/data/component_meanings_mn.json"), "w", encoding="utf8"), ensure_ascii=False, indent=0)
print("components", len(cm))
for c in ["系", "谢", "妈", "河", "明", "休", "爱", "上", "日", "这"]:
    print(c, json.dumps(out[c], ensure_ascii=False))
