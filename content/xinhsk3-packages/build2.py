# -*- coding: utf-8 -*-
"""lNN_src.py → FLAT lesson package (hsk3-l01-тэй ижил бүтэц). v2: номын яриа/дасгал, дасгалын дэвтэр ерөнхий бүтэцтэй."""
import json, os, sys, importlib, zipfile, re

src = importlib.import_module(sys.argv[1])
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PUNCT = set("，。？！：、；（）“”《》…—")
SRC_NOTE = "新HSK教程3 (外研社, HSK 3.0) — %d-р хичээл: үг, 课文, дүрэм, дасгал сурах бичиг + 学练手册 + PPT-ээс; монгол орчуулга, тайлбар «Бөөндөө Сурцгаая»" % src.N
SPEAKERS = {"王一雪": "Ван Исюэ", "刘明": "Лю Мин", "刘小雪": "Лю Сяосюэ", "刘小明": "Лю Сяомин", "杨同乐": "Ян Тунлэ", "王一飞": "Ван Ифэй", "白家月": "Бай Цзяюэ", "李文": "Ли Вэнь", "陈天中": "Чэнь Тяньчжун", "安妮": "Анни", "小语": "Сяо Юй", "服务员": "Ажилтан", "医生": "Эмч", "售货员": "Худалдагч", "老师": "Багш"}
SPEAKERS.update(getattr(src, "SPEAKERS", {}))


def toks(spec):
    out = []
    for t in spec.split():
        if "/" in t:
            zh, py = t.split("/", 1)
            out.append({"zh": zh, "py": py.replace("_", " ")})
        else:
            out.append({"zh": t, "py": ""})
    return out


def sent_pinyin(tokens, speaker_py=None):
    s = ""
    for t in tokens:
        if t["py"]:
            s += (" " if s and not s.endswith(("“",)) else "") + t["py"]
        else:
            p = {"，": ",", "。": ".", "？": "?", "！": "!", "：": ":", "、": ",", "；": ";"}.get(t["zh"], t["zh"])
            s += p
    s = s.strip()
    # өгүүлбэрийн эхний үсгийг томруулна
    def cap(m):
        return m.group(1) + m.group(2).upper()
    s = s[0].upper() + s[1:]
    s = re.sub(r"([.?!]\s+)([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])", cap, s)
    if speaker_py:
        s = speaker_py[0].upper() + speaker_py[1:] + ": " + s
    return s


def build_text(i, T):
    sentences = []
    chars = 0
    for sp, sp_py, spec, mn, note in T["lines"]:
        tk = toks(spec)
        body = "".join(t["zh"] for t in tk)
        chars += sum(1 for c in body if "一" <= c <= "鿿")
        if sp:
            zh = sp + "：" + body
            tokens = [{"zh": sp, "py": sp_py}, {"zh": "：", "py": ""}] + tk
            mn_full = SPEAKERS.get(sp, sp) + ": " + mn
        else:
            zh, tokens, mn_full = body, tk, mn
        s = {"zh": zh, "pinyin": sent_pinyin(tk, sp_py), "mn": mn_full, "tokens": tokens}
        if note:
            s["note"] = note
        sentences.append(s)
    return {
        "id": i,
        "title": T["title"],
        "mongolianTitle": T["mn"],
        "title_mn": "课文%d · %s (%s)" % (i, T["title"], T["mn"]),
        "scene_mn": T["scene"],
        "charCount": chars,
        "source": SRC_NOTE,
        "sentences": sentences,
        "paragraph_summaries": [{"paragraph": 1, "mn": T["summary"]}],
        "reflection": {"questions_mn": T["reflect"]},
        "exercises": [
            {"type": "choice", "question": q, "options": o, "answer": str(a),
             "explanation_correct_mn": "Зөв. " + ok, "explanation_wrong_mn": bad}
            for q, o, a, ok, bad in T["qs"]
        ],
    }


def dump(name, obj):
    json.dump(obj, open(os.path.join(OUT, name), "w"), ensure_ascii=False, indent=1)


AUDIO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "xinhsk3-audio", "l%02d" % src.N)
AUDIO_BASE = "https://surtsgaay.buunduu.mn/xinhsk3-audio/l%02d/" % src.N
HAS_AUDIO = os.path.isdir(AUDIO_DIR)
IMG_MANIFEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "xinhsk3-images", "l%02d" % src.N, "media.json")
HAS_IMAGES = os.path.exists(IMG_MANIFEST)
MEDIA = json.load(open(IMG_MANIFEST)) if HAS_IMAGES else None


def audio_url(name):
    return AUDIO_BASE + name if HAS_AUDIO and os.path.exists(os.path.join(AUDIO_DIR, name)) else None


texts = [build_text(i + 1, T) for i, T in enumerate(src.TEXTS)]
for i, t in enumerate(texts, 1):
    u = audio_url("text%d.mp3" % i)
    if u:
        t["audioFile"] = u
main = texts[0]
main["writingSample"] = {"title_mn": src.WRITING["title"], "zh": src.WRITING["zh"], "pinyin": src.WRITING["py"], "mn": src.WRITING["mn"]}
main["writingPrompt_mn"] = src.WRITING["prompt"]

AS = "textbook (新HSK教程3 学练手册 · 模拟测练; хариу PPT/хариултын түлхүүр, сонсголын бичвэр аудионоос)"
S_ = src.SAYING
SAY = {"zh": S_["zh"], "pinyin": S_["pinyin"], "en": S_["en"], "meaning_mn": S_["meaning"], "usage_mn": S_["usage"], "example": {"zh": S_["ex"][0], "pinyin": S_["ex"][1], "mn": S_["ex"][2]}}
def _parts(lst, start_n):
    out = []; n = start_n
    for pi, p in enumerate(lst, 1):
        items = []
        for it in p["items"]:
            n += 1
            d = dict(it); d["n"] = n; items.append(d)
        out.append({"part": pi, "type": p["type"], "instruction": p["instruction"], "bank": p.get("bank"), "items": items})
    return out, n
WB_LISTEN, _n = _parts(getattr(src, "WB_LISTEN", []), 0)
WB_READ, _n = _parts(src.WB_READ, _n)
WB_WRITE, _n = _parts(src.WB_WRITE, _n)

n = 0
banks = []
sections = []
for words, items in src.SELECT:
    its = []
    for q, a, ex in items:
        n += 1
        its.append({"n": n, "q": q, "answer": a, "explanation_mn": ex})
    banks.append({"words": words, "items": [{"n": x["n"], "q": x["q"], "answer": x["answer"]} for x in its]})
    sections.append({"title_mn": "选词填空 — Зөв үгийг сонгож нөх", "word_bank": words, "items": its})

colloc_lesson = [{"zh": w, "mn": mn.split(" / ")[0], "usage_mn": usage,
                  "example": {"zh": e[0], "pinyin": e[1], "mn": e[2]}}
                 for typ, head, w0, mn, usage, e in src.COLLOC for w in [w0.split(" / ")[0]]]
colloc_texts = [{"type": typ, "rows": [{"head": head, "with": w, "mn": mn, "usage_mn": usage,
                 "example": {"chinese": e[0], "pinyin": e[1], "mongolian": e[2]}}]}
                for typ, head, w, mn, usage, e in src.COLLOC]

dump("texts.json", {
    "unit": {"number": src.N, "title": src.TITLE_ZH, "mongolianTitle": src.TITLE_MN},
    "warmup": {"mongolian": src.WARMUP},
    "lessonIntro": src.HOOK[0],
    "mainText": main,
    "shortTexts": texts[1:],
    "wordExplanation": [{"word": w, "gloss": g, "explanation": e,
                         "examples": [{"chinese": a, "pinyin": b, "mongolian": c} for a, b, c in ex]}
                        for w, g, e, ex in src.WORD_EXPL],
    "collocations": colloc_texts,
    "textExercises": {"selectWord": {"banks": banks}},
    "grammarNotes": [{"point": g["point"], "gloss": g["mongolian"], "explanation": g["explanation"], "structure": g["structure"],
                      "examples": [{"chinese": x, "pinyin": y, "mongolian": z} for x, y, z in g["examples"]]} for g in src.GRAMMAR],
    "commonSaying": SAY,
    "culture": {"title": src.CULTURE["title"], "title_mn": src.CULTURE["title_mn"], "text_mn": src.CULTURE["text"], "note_mn": src.CULTURE["note"]},
    "workbookListening": {"answer_source": AS, "parts": [
        {"part": p["part"], "type": p["type"], "instruction_mn": p["instruction"],
         "items": [{"n": it["n"], "q_zh": it.get("q", ""), "transcript_zh": it["transcript"], "options": it["options"], "answer": it["answer"], **({"audio": audio_url("wb%02d.mp3" % it["n"])} if audio_url("wb%02d.mp3" % it["n"]) else {})} for it in p["items"]]}
        for p in WB_LISTEN], **({} if HAS_AUDIO else {"audio_note_mn": "Аудио хараахан ороогүй — бичвэрийг нь уншуулж сонсоно."})},
    "workbookReading": {"answer_source": AS, "parts": [
        {"part": p["part"], "type": p["type"], "instruction_mn": p["instruction"], **({"bank": p["bank"]} if p.get("bank") else {}),
         "items": [{"n": it["n"], "q_zh": it["q"], **({"passage_zh": it["passage"]} if it.get("passage") else {}),
                    **({"options": it["options"]} if it.get("options") else {}), "answer": it["answer"]} for it in p["items"]]}
        for p in WB_READ]},
    "workbookWriting": {"answer_source": AS, "parts": [
        {"part": p["part"], "type": p["type"], "instruction_mn": p["instruction"],
         "items": [{"n": it["n"], **({"words": it["words"]} if it.get("words") else {}), **({"q_zh": it["q"]} if it.get("q") else {}), "answer": it["answer"]} for it in p["items"]]}
        for p in WB_WRITE]},
    "workbookReview": {"answer_source": AS, "type": "text_cloze", "instruction_mn": "根据课文内容填空 (Эх бичвэрийн дагуу хоосон зайг нөх).",
        "items": [{"n": i + 1, "q_zh": q, "answers": a} for i, (q, a, e) in enumerate(src.WB_REVIEW)]},
})
dump("workbook.json", {
    "listening": {"audio_available": HAS_AUDIO, "parts": [
        {"part": p["part"], "type": "mc", "instruction_mn": p["instruction"],
         "items": [{"n": it["n"], "question_zh": it.get("q", ""), "transcript_zh": it["transcript"], "options": it["options"], "answer": it["answer"], "explanation_mn": it["expl"], **({"audio": audio_url("wb%02d.mp3" % it["n"])} if audio_url("wb%02d.mp3" % it["n"]) else {})} for it in p["items"]]}
        for p in WB_LISTEN], **({} if HAS_AUDIO else {"audio_note_mn": "Аудио хараахан ороогүй — бичвэрийг нь уншуулж сонсоно."})},
    "reading": {"parts": [
        {"part": p["part"], "type": "mc", "instruction_mn": p["instruction"],
         "items": [{"n": it["n"], "question_zh": it["q"], **({"passage_zh": it["passage"]} if it.get("passage") else {}),
                    "options": it.get("options") or p.get("bank") or {}, "answer": it["answer"], "explanation_mn": it["expl"]} for it in p["items"]]}
        for p in WB_READ]},
    "writing": {"items": [
        {"n": it["n"], "prompt_mn": p["instruction"].split(" (")[0] + ((" — " + it["q"]) if it.get("q") else ""), "words": it.get("words", []), "answer": it["answer"], "explanation_mn": it["expl"]}
        for p in WB_WRITE for it in p["items"]]},
    "review": {"items": [{"n": i + 1, "prompt_mn": "根据课文内容填空 (Эх бичвэрийн дагуу хоосон зайг нөх).", "question_zh": q, "answer": " / ".join(a), "explanation_mn": e} for i, (q, a, e) in enumerate(src.WB_REVIEW)]},
    "answerSource": AS,
})

dump("vocabulary.json", [{"chinese": zh, "pinyin": py, "mongolian": mn, "hskLevel": "HSK3",
                          "exampleChinese": ez, "exampleMongolian": em, "pos": pos, "collocations_zh": col}
                         for zh, py, mn, pos, ez, em, col in src.VOCAB])

dump("grammar.json", [{
    "point": g["point"], "mongolian": g["mongolian"], "explanation": g["explanation"],
    "examples": [{"chinese": a, "pinyin": b, "mongolian": c} for a, b, c in g["examples"]],
    "structure": g["structure"],
    "common_mistakes": [{"wrong": a, "right": b, "why": c} for a, b, c in g["mistakes"]],
    "check": {"question": g["check"][0], "options": g["check"][1], "answer": str(g["check"][2])},
    "gloss_mn": g["gloss"], "teacher_mn": g["teacher"],
    "exercises": [{"type": "choice", "question": q, "options": o, "answer": str(a),
                   "explanation_correct_mn": ok, "explanation_wrong_mn": bad} for q, o, a, ok, bad in g["ex"]],
} for g in src.GRAMMAR])

TAGS = {"v": ["vocabulary", src.LESSON_ID + "-words"], "g": ["grammar", src.LESSON_ID + "-grammar"], "r": ["reading", "text-comprehension"]}
quiz = []
for i, (typ, q, opts, ans, ex, tag, diff) in enumerate(src.QUIZ, 1):
    assert ans in opts, (i, ans)
    # зөв хариулт үргэлж эхний байранд байхгүй болгож эргүүлнэ
    k = i % len(opts)
    o = opts[k:] + opts[:k]
    quiz.append({"type": typ, "question": q, "options": o, "correct_answer": ans, "explanation": ex,
                 "order_index": i, "id": "%s-q%02d" % (src.LESSON_ID, i), "skillTags": TAGS[tag], "difficulty": diff})
dump("quiz.json", quiz)

dump("characters.json", {
    "characters": [{"hanzi": h, "pinyin": [p], "strokeCount": sc, "radical": r, "practice": "write",
                    "meaningMn": m, "etymology_mn": e, "exampleWords": w} for h, p, sc, r, m, e, w in src.CHARS],
    "confusables": [{"a": a, "b": b, "word_a": wa, "word_b": wb, "mn": mn, "tip_mn": tip} for a, b, wa, wb, mn, tip in src.CONFUS],
})

gram_names = " / ".join(g["point"] for g in src.GRAMMAR)
dump("lesson.json", {
    "courseId": src.COURSE_ID, "lessonId": src.LESSON_ID,
    "title": "新HSK 3 · %d-р хичээл — %s" % (src.N, src.TITLE_MN),
    "chineseTitle": src.TITLE_ZH, "targetTitle": src.TITLE_ZH, "mongolianTitle": src.TITLE_MN,
    "subtitle": " · ".join(g["mongolian"].split(" — ")[0] for g in src.GRAMMAR),
    "description": "%d текст + %d шинэ үг + %d дүрэм (%s) + ханз + %d асуулттай сорил" % (len(src.TEXTS), len(src.VOCAB), len(src.GRAMMAR), gram_names, len(src.QUIZ)),
    "duration": "40 min", "status": "draft", "orderIndex": src.N, "icon": getattr(src, "ICON", "📘"), "sourceNote": SRC_NOTE,
    "hook": {"teacher_mn": src.HOOK[0], "warmup_mn": src.HOOK[1]},
    "exercises_textbook": {"sections": sections},
    "collocations": colloc_lesson,
    "recap": {"teacher_mn": src.RECAP},
    "commonSaying": SAY,
})

if MEDIA:
    dump("media.json", MEDIA)

dump("manifest.json", {
    "packageVersion": "BUUNDUU_CHINESE_HSK_PACKAGE_V1", "courseType": "chinese-hsk",
    "courseId": src.COURSE_ID, "lessonId": src.LESSON_ID, "hskLevel": 3, "lessonNumber": src.N,
    "lessonProfile": "hsk3-dialogue-reading-writing-review", "lessonType": "hsk3-dialogue-reading-writing-review",
    "language": "zh-MN", "targetLanguage": "zh", "uiLanguage": "mn",
    "title": src.TITLE_ZH, "mongolianTitle": src.TITLE_MN, "source": SRC_NOTE,
    "hasAudio": HAS_AUDIO, "hasImages": HAS_IMAGES,
    "verification": {"answerStatus": "textbook+ppt (OCR; хүн шалгаагүй)", "textStatus": "textbook (新HSK教程3 课文, OCR)"},
})

# шалгалт: бүх шинэ үг яриануудад гарсан уу
alltext = "".join(s["zh"] for t in texts for s in t["sentences"])
miss = [v[0] for v in src.VOCAB if v[0] not in alltext]
print("vocab missing in texts:", miss)
for t in texts:
    for s in t["sentences"]:
        for tk in s["tokens"]:
            if any("一" <= c <= "鿿" for c in tk["zh"]) and not tk["py"]:
                print("NO PINYIN", tk)
            if tk["zh"] in PUNCT and tk["py"]:
                print("PUNCT PY", tk)

z = zipfile.ZipFile(OUT.rstrip("/") + ".zip", "w", zipfile.ZIP_DEFLATED)
for f in sorted(os.listdir(OUT)):
    z.write(os.path.join(OUT, f), f)
z.close()
print("ok", [(f, os.path.getsize(os.path.join(OUT, f))) for f in sorted(os.listdir(OUT))])
