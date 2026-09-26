#!/usr/bin/env python3
"""Ingest Chinese 成语 / 谚语 / 歇后语 from English Wiktionary via kaikki.org (wiktextract)
-> content/open/wiktionary-zh/{idioms,proverbs,xiehouyu}.json

License of the data: CC BY-SA 4.0 (and GFDL) — Wiktionary contributors.

Raw download (outside the repo, 1.2 GB):
  curl -L -o /home/claude/open-raw/kaikki-Chinese.jsonl \
       https://kaikki.org/dictionary/Chinese/kaikki.org-dictionary-Chinese.jsonl

Usage:
  python3 scripts/open/wiktionary-zh.py [KAIKKI_JSONL]

Selection
  - xiehouyu: sense category "Chinese xiehouyu"                      -> all kept
  - proverbs: category "Chinese proverbs" or pos == "proverb"        -> all kept
  - idioms:   category "Chinese chengyu"; kept if the simplified form is in data/hsk_words.json
              OR it is one of the CURATED 寓言/成语故事 titles
              OR every Han character is an HSK 1–6 character (appears in an HSK 1–6 word).
              Ranked (HSK list / curated first, then entries with usage examples and etymology,
              then lowest max-character level) and capped at MAX_IDIOMS.
Examples: only editor-written usage examples (type "example"); literary quotations are dropped
(copyright of modern quoted works/translations). Etymology source quotes (etymology_examples) are
kept only for pre-1900 works (BCE/century/year < 1900 in the ref) and their English only when the ref
does not cite a published translation.
"""
import json
import os
import re
import sys
from collections import OrderedDict
from datetime import date

from pypinyin import Style, lazy_pinyin

sys.path.insert(0, os.path.dirname(__file__))
from _kids_zh import REPO, to_simplified, write_json  # noqa: E402

SRC = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/open-raw/kaikki-Chinese.jsonl"
OUT = os.path.join(REPO, "content", "open", "wiktionary-zh")
MAX_IDIOMS = 3000
MAX_EXAMPLES = 3
MAX_ETYM = 400
MAX_QUOTE = 400

LICENSE = "CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/); also GFDL"
ATTRIB = ("From English Wiktionary (https://en.wiktionary.org), © Wiktionary contributors, CC BY-SA 4.0; "
          "extracted with wiktextract via kaikki.org (https://kaikki.org/dictionary/Chinese/). "
          "Changes: filtered, simplified-script fields selected, per-syllable pinyin and HSK level added.")
SOURCE = "Wiktionary (via kaikki.org)"
HAN = re.compile(r"[㐀-鿿豈-﫿𠀀-𮯯]")
# Famous 寓言/成语故事 titles (same list as the fables-classical ingest) — always kept if present.
CURATED = set("守株待兔 刻舟求剑 拔苗助长 揠苗助长 亡羊补牢 掩耳盗铃 画蛇添足 井底之蛙 狐假虎威 自相矛盾 郑人买履 "
              "塞翁失马 叶公好龙 对牛弹琴 杯弓蛇影 滥竽充数 买椟还珠 邯郸学步 东施效颦 愚公移山 精卫填海".split())
QUICK = ("chengyu", "Chinese proverbs", "xiehouyu", '"proverb"')


def load_hsk():
    words = {}
    for w in json.load(open(os.path.join(REPO, "data", "hsk_words.json"), encoding="utf-8")):
        lv = 7 if w["hsk_level"] == "7-9" else int(w["hsk_level"])
        s = w["simplified"]
        words[s] = min(lv, words.get(s, 99))
    chars = {}
    for w, lv in words.items():
        for c in w:
            chars[c] = min(lv, chars.get(c, 99))
    return words, chars


def cats_of(d):
    cats = set()
    for c in d.get("categories", []):
        cats.add(c.get("name") if isinstance(c, dict) else c)
    for s in d.get("senses", []):
        for c in s.get("categories", []):
            cats.add(c.get("name") if isinstance(c, dict) else c)
    return cats


def simp_of(d):
    for f in d.get("forms", []):
        if "Simplified-Chinese" in f.get("tags", []):
            return f["form"]
    return to_simplified(d["word"])


DIALECT_TAGS = ("Chengdu", "Xi'an", "Nanjing", "Sichuanese", "Dungan", "Yangzhou", "Wuhan", "Guilin", "Jilu")


def mandarin_pinyin(d, zh):
    """All Standard Mandarin Pinyin readings from Wiktionary 'sounds' (citation tones, no sandhi
    'phonetic' variants), in order. Multi-part sayings (A，B / A——B) list one reading per part."""
    std, other = [], []
    for s in d.get("sounds", []):
        t = s.get("tags", [])
        if "zh_pron" in s and "Mandarin" in t and "Pinyin" in t and not s.get("raw_tags") \
                and "phonetic" not in t and not any(x in t for x in DIALECT_TAGS):
            p = re.sub(r"\s*\[Phonetic:[^\]]*\]?", "", s["zh_pron"])
            p = re.sub(r"\s*\([^)]*\)\s*$", "", p).strip()
            lst = std if ("Standard-Chinese" in t or "Standard" in t) else other
            if p not in lst:
                lst.append(p)
    return std or other


def _nfc(x):
    return __import__("unicodedata").normalize("NFC", x)


def _strip_tone(x):
    import unicodedata
    return unicodedata.normalize("NFC", "".join(c for c in unicodedata.normalize("NFD", x)
                                                 if not unicodedata.combining(c)))


def align_syllables(zh, pinyin):
    """Split a Wiktionary pinyin string into one syllable per Han character, using pypinyin's
    heteronym readings (plus toneless/neutral and erhua 'r') as candidates. Returns list or None."""
    if not pinyin:
        return None
    from pypinyin import pinyin as _py
    han = [c for c in zh if HAN.match(c)]
    target = re.sub(r"[^a-zA-ZüÜ\u00C0-\u024F\u0300-\u036f]", "", _nfc(pinyin)).lower()
    cands = []
    for c in han:
        rs = set(_nfc(r) for r in _py(c, style=Style.TONE, heteronym=True)[0])
        rs |= {_strip_tone(r) for r in rs}
        if c == "儿":
            rs.add("r")
        cands.append(sorted(rs, key=len, reverse=True))
    import functools

    @functools.lru_cache(maxsize=None)
    def go(i, j):
        if i == len(han):
            return () if j == len(target) else None
        for r in cands[i]:
            if target.startswith(r, j):
                rest = go(i + 1, j + len(r))
                if rest is not None:
                    return (target[j:j + len(r)],) + rest
        return None
    res = go(0, 0)
    return list(res) if res else None


def syl_pinyin(zh):
    out = []
    for ch, p in zip(zh, lazy_pinyin(zh, style=Style.TONE, errors=lambda s: list(s))):
        if HAN.match(ch):
            out.append(p)
        elif ch in "，,":
            if out:
                out[-1] += ","
        elif ch in "—":
            if out and not out[-1].endswith("—"):
                out.append("—")
    return " ".join(out).replace(" —", " —")


def norm_py(p):
    return re.sub(r"[^a-zǜ-ͯ]", "", __import__("unicodedata").normalize("NFD", (p or "").lower()))


def old_ref(ref):
    if not ref:
        return False
    if "BCE" in ref:
        return True
    m = re.search(r"(\d{1,2})(?:st|nd|rd|th|ˢᵗ|ⁿᵈ|ʳᵈ|ᵗʰ)\s*centur", ref)
    if m:
        return int(m.group(1)) <= 19
    yrs = [int(y) for y in re.findall(r"(?<!\d)(\d{3,4})(?!\d)", ref)]
    return bool(yrs) and min(yrs) < 1900


def examples_of(senses):
    out, seen = [], set()
    for s in senses:
        for e in s.get("examples", []):
            if e.get("type") != "example":
                continue
            txt = e.get("text") or ""
            tags = e.get("tags", [])
            if "Traditional-Chinese" in tags and "Simplified-Chinese" not in tags:
                # use the simplified twin if present, otherwise convert
                zh = to_simplified(txt)
            else:
                zh = txt
            if not zh or zh in seen or not HAN.search(zh):
                continue
            seen.add(zh)
            ex = {"zh": zh}
            if e.get("roman"):
                ex["pinyin"] = e["roman"]
            en = e.get("english") or e.get("translation")
            if en:
                ex["en"] = en
            out.append(ex)
            if len(out) >= MAX_EXAMPLES:
                return out
    return out


def source_quotes(d):
    out, seen = [], set()
    for e in d.get("etymology_examples", []):
        ref = (e.get("ref") or "").strip()
        if not old_ref(ref):
            continue
        txt = e.get("text") or ""
        zh = to_simplified(txt)
        if not zh or zh in seen or len(zh) > MAX_QUOTE:
            continue
        seen.add(zh)
        q = {"zh": zh, "ref": ref}
        en = e.get("english") or e.get("translation")
        if en and not re.search(r"translat", ref, re.I):
            q["en"] = en
        out.append(q)
        if len(out) >= 2:
            break
    return out


def glosses_of(senses):
    g = []
    for s in senses:
        for x in s.get("glosses", []):
            tags = [t for t in s.get("tags", []) if t in ("figuratively", "literally", "derogatory", "humorous",
                                                          "literary", "colloquial", "dialectal")]
            item = {"gloss": x}
            if tags:
                item["tags"] = tags
            if item not in g:
                g.append(item)
    return g


def main():
    words, chars = load_hsk()
    entries = OrderedDict()
    for line in open(SRC, encoding="utf-8"):
        if not any(k in line for k in QUICK):
            continue
        d = json.loads(line)
        cats = cats_of(d)
        if "Chinese xiehouyu" in cats:
            kind = "xiehouyu"
        elif "Chinese proverbs" in cats or d.get("pos") == "proverb":
            kind = "proverb"
        elif "Chinese chengyu" in cats:
            kind = "idiom"
        else:
            continue
        zh = simp_of(d)
        key = (kind, zh)
        e = entries.get(key)
        if e is None:
            e = entries[key] = {"kind": kind, "zh": zh, "zh_trad": d["word"], "pinyin": [],
                                "literal": d.get("literal_meaning"), "glosses": [], "examples": [],
                                "etymology": None, "source_quotes": [], "wiktionary": d["word"],
                                "varieties": set()}
        for p in mandarin_pinyin(d, zh):
            if p not in e["pinyin"]:
                e["pinyin"].append(p)
        e["varieties"] |= {c.rsplit(" ", 1)[0] for c in cats if re.match(r".+ (proverbs|chengyu|xiehouyu)$", c)} - {"Chinese"}
        e["literal"] = e["literal"] or d.get("literal_meaning")
        for g in glosses_of(d.get("senses", [])):
            if g not in e["glosses"]:
                e["glosses"].append(g)
        for x in examples_of(d.get("senses", [])):
            if len(e["examples"]) < MAX_EXAMPLES and x["zh"] not in {y["zh"] for y in e["examples"]}:
                e["examples"].append(x)
        et = (d.get("etymology_text") or "").strip()
        if et and len(et) <= MAX_ETYM and not e["etymology"]:
            e["etymology"] = et
        if not e["source_quotes"]:
            e["source_quotes"] = source_quotes(d)

    def finalize(e, n):
        zh = e["zh"]
        han = [c for c in zh if HAN.match(c)]
        char_lv = max((chars.get(c, 7) for c in han), default=None)
        char_lv = min(char_lv, 7) if char_lv else None
        auto = syl_pinyin(zh)
        prons = e["pinyin"] or []
        parts = [x for x in re.split(r"——|—|[，,。；;！!？?、：:]", zh) if HAN.search(x)]
        sep = " — " if "—" in zh else ", "
        cands = ([sep.join(prons[:len(parts)])] if len(parts) > 1 and len(prons) >= len(parts) else []) + prons
        wk, al = (cands[0] if cands else None), None
        for c in cands:
            al = align_syllables(zh, c)
            if al:
                wk = c
                break
        syl = " ".join(al) if al else auto
        rec = {"id": f"{ {'idiom': 'cy', 'proverb': 'yy', 'xiehouyu': 'xhy'}[e['kind']] }-{n:04d}".replace(" ", ""),
               "zh": zh, "zh_trad": e["zh_trad"] if e["zh_trad"] != zh else None,
               "pinyin": wk or auto, "pinyin_syllables": syl}
        if not al:
            # no Wiktionary Mandarin reading, or it could not be aligned: syllables are pypinyin output
            rec["pinyin_check"] = True
        rec["mandarin"] = bool(e["pinyin"])
        v = sorted(e["varieties"])
        if v:
            rec["varieties"] = v
        rec["en"] = [g["gloss"] for g in e["glosses"]]
        tagged = [g for g in e["glosses"] if g.get("tags")]
        if tagged:
            rec["en_tags"] = {g["gloss"]: g["tags"] for g in tagged}
        if e["literal"]:
            rec["literal"] = e["literal"]
        if e["etymology"]:
            rec["etymology"] = e["etymology"]
        if e["source_quotes"]:
            rec["source_quotes"] = e["source_quotes"]
        if e["examples"]:
            rec["examples"] = e["examples"]
        rec["level"] = words.get(zh, char_lv)
        if rec["level"] == 99:
            rec["level"] = char_lv
        rec["in_hsk_list"] = zh in words
        rec["source_url"] = "https://en.wiktionary.org/wiki/" + e["wiktionary"].replace(" ", "_")
        return {k: v for k, v in rec.items() if v is not None}

    groups = {"idiom": [], "proverb": [], "xiehouyu": []}
    for e in entries.values():
        if not e["glosses"]:
            continue
        groups[e["kind"]].append(e)

    # idiom filter + ranking
    kept, dropped = [], 0
    for e in groups["idiom"]:
        han = [c for c in e["zh"] if HAN.match(c)]
        in_list = e["zh"] in words or e["zh"] in CURATED
        all16 = all(chars.get(c, 99) <= 6 for c in han)
        if not (in_list or all16):
            dropped += 1
            continue
        maxc = max((chars.get(c, 99) for c in han), default=99)
        rich = (1 if e["examples"] else 0) + (1 if e["etymology"] or e["source_quotes"] else 0)
        kept.append(((0 if in_list else 1), -rich, maxc, e["zh"], e))
    kept.sort(key=lambda t: t[:4])
    over = max(0, len(kept) - MAX_IDIOMS)
    idioms = [t[-1] for t in kept[:MAX_IDIOMS]]
    idioms.sort(key=lambda e: e["zh"])

    meta = {"source": SOURCE, "source_url": "https://kaikki.org/dictionary/Chinese/",
            "license": LICENSE, "attribution": ATTRIB, "generated": date.today().isoformat()}
    res = {}
    for name, items in (("idioms", idioms), ("proverbs", sorted(groups["proverb"], key=lambda e: e["zh"])),
                        ("xiehouyu", sorted(groups["xiehouyu"], key=lambda e: e["zh"]))):
        recs = [finalize(e, i) for i, e in enumerate(items, 1)]
        write_json(os.path.join(OUT, f"{name}.json"), {**meta, "count": len(recs), "items": recs})
        res[name] = recs
        print(name, len(recs), "non-Mandarin:", sum(1 for r in recs if not r["mandarin"]), "pinyin_check:", sum(1 for r in recs if r.get("pinyin_check")),
              "with examples:", sum(1 for r in recs if r.get("examples")),
              "with etymology:", sum(1 for r in recs if r.get("etymology")))
    print("idiom candidates total:", len(groups["idiom"]), "filtered out (chars beyond HSK1-6):", dropped,
          "cut by cap:", over)


if __name__ == "__main__":
    main()
