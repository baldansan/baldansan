# -*- coding: utf-8 -*-
"""l01_src.py → FLAT lesson package (hsk3-l01-тэй ижил бүтэц)."""
import json, os, sys, importlib, zipfile, re

src = importlib.import_module(sys.argv[1])
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PUNCT = set("，。？！：、；（）“”《》…—")
SRC_NOTE = "新HSK 3 (HSK 3.0) — %d-р хичээл: үг, дүрмийн дараалал сурах бичгийнхээр; яриа, жишээ, дасгал «Бөөндөө Сурцгаая»-ын зохиосон" % src.N


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
            mn_full = {"小林": "Сяо Линь", "巴图": "Бат", "娜拉": "Нараа", "服务员": "Ажилтан"}.get(sp, sp) + ": " + mn
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


texts = [build_text(i + 1, T) for i, T in enumerate(src.TEXTS)]
main = texts[0]
main["writingSample"] = {"title_mn": src.WRITING["title"], "zh": src.WRITING["zh"], "pinyin": src.WRITING["py"], "mn": src.WRITING["mn"]}
main["writingPrompt_mn"] = src.WRITING["prompt"]

AS = "authored (өөрсдийн зохиосон дасгал)"
S_ = src.SAYING
SAY = {"zh": S_["zh"], "pinyin": S_["pinyin"], "en": S_["en"], "meaning_mn": S_["meaning"], "usage_mn": S_["usage"], "example": {"zh": S_["ex"][0], "pinyin": S_["ex"][1], "mn": S_["ex"][2]}}
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
    "workbookListening": {"answer_source": AS, "parts": [], "audio_note_mn": "Энэ хичээлд сонсголын дасгал хараахан ороогүй."},
    "workbookReading": {"answer_source": AS, "parts": [{"part": 1, "type": "match", "instruction_mn": "选择合适的问答 (Ярианы хоёр хэсгийг тааруул). Сан A–F.",
        "bank": src.WB_MATCH_BANK, "items": [{"n": i + 1, "q_zh": q, "answer": a} for i, (q, a, e) in enumerate(src.WB_MATCH[:5])]}]},
    "workbookWriting": {"answer_source": AS, "parts": [
        {"part": 1, "type": "make_sentence", "instruction_mn": "连词成句 (Үгсийг эвлүүлж өгүүлбэр болго).",
         "items": [{"n": 6 + i, "words": w, "answer": a} for i, (w, a, e) in enumerate(src.WB_SENT)]},
        {"part": 2, "type": "pinyin_to_char", "instruction_mn": "看拼音，写汉字 (Пиньинийг хараад ханзыг бич).",
         "items": [{"n": 11 + i, "q_zh": q, "answer": a} for i, (q, a, e) in enumerate(src.WB_PINYIN)]}]},
    "workbookReview": {"answer_source": AS, "type": "text_cloze", "instruction_mn": "根据课文内容填空 (Эх бичвэрийн дагуу хоосон зайг нөх).",
        "items": [{"n": i + 1, "q_zh": q, "answers": a} for i, (q, a, e) in enumerate(src.WB_REVIEW)]},
})
dump("workbook.json", {
    "listening": {"audio_available": False, "parts": [], "audio_note_mn": "Энэ хичээлд сонсголын дасгал хараахан ороогүй."},
    "reading": {"parts": [{"part": 1, "type": "mc", "instruction_mn": "选择合适的问答 (Ярианы хоёр хэсгийг тааруул). Сан A–F.",
        "items": [{"n": i + 1, "options": src.WB_MATCH_BANK, "answer": a, "question_zh": q, "explanation_mn": e} for i, (q, a, e) in enumerate(src.WB_MATCH[:5])]}]},
    "writing": {"items": [{"n": 6 + i, "prompt_mn": "连词成句 — Үгсийг эвлүүлж өгүүлбэр болго", "words": w, "answer": a, "explanation_mn": e} for i, (w, a, e) in enumerate(src.WB_SENT)]
        + [{"n": 11 + i, "prompt_mn": "看拼音，写汉字 — Пиньинийг хараад ханзыг бич", "question_zh": q, "answer": a, "explanation_mn": e} for i, (q, a, e) in enumerate(src.WB_PINYIN)]},
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
    "description": "4 яриа + %d шинэ үг + %d дүрэм (%s) + ханз + %d асуулттай сорил" % (len(src.VOCAB), len(src.GRAMMAR), gram_names, len(src.QUIZ)),
    "duration": "40 min", "status": "draft", "orderIndex": src.N, "icon": "✈️", "sourceNote": SRC_NOTE,
    "hook": {"teacher_mn": src.HOOK[0], "warmup_mn": src.HOOK[1]},
    "exercises_textbook": {"sections": sections},
    "collocations": colloc_lesson,
    "recap": {"teacher_mn": src.RECAP},
    "commonSaying": SAY,
})

dump("manifest.json", {
    "packageVersion": "BUUNDUU_CHINESE_HSK_PACKAGE_V1", "courseType": "chinese-hsk",
    "courseId": src.COURSE_ID, "lessonId": src.LESSON_ID, "hskLevel": 3, "lessonNumber": src.N,
    "lessonProfile": "hsk3-dialogue-reading-writing-review", "lessonType": "hsk3-dialogue-reading-writing-review",
    "language": "zh-MN", "targetLanguage": "zh", "uiLanguage": "mn",
    "title": src.TITLE_ZH, "mongolianTitle": src.TITLE_MN, "source": SRC_NOTE,
    "hasAudio": False, "hasImages": False,
    "verification": {"answerStatus": "authored", "textStatus": "authored (өөрсдийн зохиосон яриа)"},
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
