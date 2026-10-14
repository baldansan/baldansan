"""发展汉语 中级综合 I — ерөнхий build. Usage: build.py LESSON_DIR
LESSON_DIR-д: meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py, media_images.json (optional),
subtitles.json (align.py гаргана, optional), vocab_audio_map.json (align.py, optional), pkg/audio/*.mp3, pkg/images/*.
Гаралт: LESSON_DIR/pkg/{lesson,manifest,vocabulary,texts,grammar,quiz,workbook,subtitles}.json
"""
import json, os, re, hashlib, sys, random
D = os.path.abspath(sys.argv[1]); sys.path.insert(0, D)
from pypinyin import pinyin, Style, load_phrases_dict
from meta import META
from vocab import VOCAB, PROPER
from text import TEXT, SOURCE_NOTE
from grammar import GRAMMAR
import extra as X
from workbook_quiz import WB_READING, QUIZ, SHIYISHI

OUT = f"{D}/pkg"; os.makedirs(OUT, exist_ok=True)
N = META["n"]; COURSE = "fazhan-zhongji1"; LID = f"fazhan-zhongji1-l{N:02d}"
AUDIO_TEXT, AUDIO_WORDS = f"audio/fazhan-zhongji1-{N:02d}-text.mp3", f"audio/fazhan-zhongji1-{N:02d}-words.mp3"
TITLE_ZH, TITLE_MN = META["title_zh"], META["title_mn"]

COMMON_PHRASES = {"一样": [["yí"], ["yàng"]], "一半": [["yí"], ["bàn"]], "一阵": [["yí"], ["zhèn"]], "一夜": [["yí"], ["yè"]], "一会儿": [["yí"], ["huì"], ["r"]],
                  "一种": [["yì"], ["zhǒng"]], "一条": [["yì"], ["tiáo"]], "一杯": [["yì"], ["bēi"]], "一本": [["yì"], ["běn"]], "一面": [["yí"], ["miàn"]], "一眼": [["yì"], ["yǎn"]],
                  "一边": [["yì"], ["biān"]], "一起": [["yì"], ["qǐ"]], "一直": [["yì"], ["zhí"]], "一定": [["yí"], ["dìng"]], "一切": [["yí"], ["qiè"]], "一下": [["yí"], ["xià"]],
                  "一点儿": [["yì"], ["diǎn"], ["r"]], "一些": [["yì"], ["xiē"]], "一次": [["yí"], ["cì"]], "一个": [["yí"], ["gè"]], "一天": [["yì"], ["tiān"]], "一年": [["yì"], ["nián"]],
                  "不怕": [["bú"], ["pà"]], "不是": [["bú"], ["shì"]], "不要": [["bú"], ["yào"]], "不对": [["bú"], ["duì"]], "不过": [["bú"], ["guò"]], "不但": [["bú"], ["dàn"]], "不太": [["bú"], ["tài"]], "不会": [["bú"], ["huì"]], "不用": [["bú"], ["yòng"]], "不到": [["bú"], ["dào"]],
                  "哪儿": [["nǎr"]], "这儿": [["zhèr"]], "那儿": [["nàr"]], "花儿": [["huā"], ["r"]], "了": [["le"]], "得": [["de"]], "着": [["zhe"]], "地": [["de"]], "的": [["de"]]}
load_phrases_dict({**COMMON_PHRASES, **META.get("phrases", {})})

PUNCT = set("，。！？：；、“”\"（）——……·《》 ")
PMAP = {"，": ", ", "。": ". ", "！": "! ", "？": "? ", "：": ": ", "；": "; ", "、": ", ", "“": ' "', "”": '" ', "\"": '"', "（": " (", "）": ") ", "——": " — ", "……": "… ", "《": " «", "》": "» "}
def _fix(s):
    for k, v in PMAP.items(): s = s.replace(k, v)
    return re.sub(r"\s+", " ", s).replace(" ,", ",").replace(" .", ".").replace(" !", "!").replace(" ?", "?").replace('( ', '(').replace(' )', ')').strip()
PROPER_PY = {"北京": "Běijīng", "中国": "Zhōngguó", "上海": "Shànghǎi", "蒙古": "Měnggǔ", "乌兰巴托": "Wūlánbātuō", "中国人": "Zhōngguórén", "北京人": "Běijīngrén",
             "汉语": "Hànyǔ", "英语": "Yīngyǔ", "美国": "Měiguó", "日本": "Rìběn", "韩国": "Hánguó", "法国": "Fǎguó", "德国": "Déguó", "俄罗斯": "Éluósī", "英国": "Yīngguó",
             "小王": "Xiǎo Wáng", "小李": "Xiǎo Lǐ", "小张": "Xiǎo Zhāng", "老王": "Lǎo Wáng", "老李": "Lǎo Lǐ", "老张": "Lǎo Zhāng", "春节": "Chūnjié", "圣诞节": "Shèngdànjié"}
PROPER_PY.update({z: p for z, p, *_ in PROPER}); PROPER_PY.update(META.get("proper_py", {}))
EXTRA_WORDS = ["我们","你们","他们","她们","大家","什么","怎么","怎么样","为什么","因为","所以","但是","可是","虽然","如果","要是","已经","还是","现在","今天","明天","昨天","去年","今年","明年","每天","时候","地方","这里","那里","这儿","那儿","哪儿","东西","朋友","老师","学生","同学","孩子","父母","妻子","丈夫","工作","学习","生活","时间","手机","电脑","电话","普通话","饭馆","学校","银行","附近","方便","喜欢","知道","觉得","认真","努力","完成","作业","留学","留学生","国外","父亲","母亲","儿子","女儿","妹妹","哥哥","姐姐","弟弟","外国人","老外","认识","爱人","意思","房间","屋子","衣服","自行车","新年","打扫","干干净净","清清楚楚","漂亮","极了","河流","太阳","散步","关系","同屋","毕业","离开","家乡","故乡","情况","一切","风景","高兴","生气","迟到","满意","回来","以后","以前","可能","肯定","非常","特别","小时","半个","着急","出生","一直","照片","机会","有关","熟悉","蔬菜","水果","礼物","生日","从此","农村","城市","市场","南方","北方","星期","季节","春天","夏天","秋天","冬天","草原","温度","方法","更好","报名","参加","活动","考试","旅行","国家","原来","这些","那些","了解","睡觉","身边","多么","不知道","多少","然后","开始","最后","终于","突然","马上","刚才","后来","当时","其实","当然","一般","应该","需要","可以","能够","希望","打算","决定","感觉","发现","问题","办法","经验","经济","文化","社会","历史","公司","医院","商店","公园","饭店","宾馆","机场","火车站","汽车","飞机","火车","出租车","电视","电影","音乐","运动","健康","身体","感冒","医生","护士","警察","司机","服务员","经理","老板","同事","邻居","客人","网上","网络","电子邮件","信息","新闻","报纸","杂志","小说","故事","节目","比赛","冠军","成绩","分数","水平","能力","态度","性格","脾气","习惯","爱好","兴趣","环境","空气","污染","交通","地铁","公共汽车","大学","中学","小学","年级","班级","教室","图书馆","食堂","宿舍","超市","厨房","卫生间","客厅","卧室","冰箱","空调","洗衣机","礼拜","周末","假期","暑假","寒假","春节","中秋节"]
_dict = set(EXTRA_WORDS) | set(PROPER_PY) | {z.split("（")[0] for z, *_ in VOCAB} | {z for z, *_ in PROPER} | set(META.get("extra_words", []))
for _p, _ss in TEXT:
    for _t, *_ in _ss: _dict |= {x for x in _t.split("|") if len(x) > 1}
_maxlen = max(len(w) for w in _dict)
def segment(zh):
    i, out = 0, []
    while i < len(zh):
        for L in range(min(_maxlen, len(zh) - i), 1, -1):
            if zh[i:i+L] in _dict: out.append(zh[i:i+L]); i += L; break
        else: out.append(zh[i]); i += 1
    return out
def py_token(zh):
    if zh in PROPER_PY: return PROPER_PY[zh]
    if all(c in PUNCT or not re.match(r"[一-鿿]", c) for c in zh): return ""
    return "".join(x[0] for x in pinyin(zh, style=Style.TONE))
def py_sent(zh, tokens=None):
    toks = tokens or segment(zh)
    return _fix(" ".join(py_token(t) or t for t in toks))
def cap(s): return s[:1].upper() + s[1:]
def shuffle(options, correct_idx, seed):
    idx = list(range(len(options))); random.Random(hashlib.md5(seed.encode()).hexdigest()).shuffle(idx)
    new = [options[i] for i in idx]; return new, idx.index(correct_idx)
def ex_json(e, seed):
    if e["type"] == "judge":
        return {"type": "judge", "question": e["question"], "options": ["Зөв", "Буруу"], "answer": "true" if e["answer"] else "false",
                "explanation_correct_mn": e["ok"], "explanation_wrong_mn": e["wrong"]}
    opts, ans = shuffle(e["options"], e["answer"], seed)
    return {"type": "choice", "question": e["question"], "options": opts, "answer": str(ans),
            "explanation_correct_mn": e["ok"], "explanation_wrong_mn": e["wrong"]}
def check_json(c, seed):
    q, opts, a = c; opts, ans = shuffle(opts, a, seed)
    return {"question": q, "options": opts, "answer": str(ans)}
def load_opt(name, default):
    p = f"{D}/{name}"
    return json.load(open(p)) if os.path.exists(p) else default

# ---------- vocabulary.json ----------
vocab = []
for i, (zh, py, pos, mn, key, ezh, emn) in enumerate(VOCAB, 1):
    vocab.append({"chinese": zh, "pinyin": py, "mongolian": mn, "notes": pos + (" · гол үг" if key else ""),
                  "exampleChinese": ezh, "examplePinyin": cap(py_sent(ezh)), "exampleMongolian": emn,
                  "hskLevel": "发展汉语 中级I", "keyWord": key, "orderIndex": i})
json.dump(vocab, open(f"{OUT}/vocabulary.json", "w"), ensure_ascii=False, indent=1)

# ---------- grammar.json ----------
grammar = []
for gi, g in enumerate(GRAMMAR, 1):
    grammar.append({
        "point": g["point"], "mongolian": g["gloss_mn"], "gloss_mn": g["gloss_mn"],
        "explanation": g["teacher_mn"], "teacher_mn": g["teacher_mn"], "structure": g["structure"], "teacher_notes": g["teacher_notes"],
        "examples": [{"chinese": z, "pinyin": cap(py_sent(z)), "mongolian": m} for z, m in g["examples"]],
        "common_mistakes": [{"wrong": w, "right": r, "why": y} for w, r, y in g["common_mistakes"]],
        "check": check_json(g["check"], f"{LID}-g{gi}-check"),
        "exercises": [ex_json(e, f"{LID}-g{gi}-e{ei}") for ei, e in enumerate(g["exercises"], 1)],
    })
json.dump(grammar, open(f"{OUT}/grammar.json", "w"), ensure_ascii=False, indent=1)

# ---------- texts.json ----------
sentences, para_summ = [], []
for pno, sents in TEXT:
    for toks, mn, note, ks in sents:
        parts = toks.split("|"); zh = "".join(parts)
        s = {"zh": zh, "pinyin": cap(py_sent(zh, parts)), "mn": mn, "paragraph": pno,
             "tokens": [{"zh": p, "py": py_token(p)} for p in parts]}
        if note: s["note"] = note
        if ks: s["key_structures"] = ks
        sentences.append(s)
    para_summ.append({"paragraph": pno, "mn": META["para_mn"][pno]})
WRITING = X.WRITING
main_text = {"id": 1, "title": TITLE_ZH, "mongolianTitle": TITLE_MN, "title_mn": f"课文 · {TITLE_ZH} ({TITLE_MN})",
    "audioFile": AUDIO_TEXT, "charCount": sum(len(re.findall(r"[一-鿿]", s["zh"])) for s in sentences),
    "source": f"发展汉语（第二版）中级综合 I — 第{N}课 课文 " + SOURCE_NOTE, "author_zh": META.get("author_zh", ""), "intro_zh": META.get("intro_zh", ""),
    "intro_mn": META.get("intro_mn", ""),
    "sentences": sentences, "paragraph_summaries": para_summ,
    "reflection": {"questions_mn": META["reflection_mn"]},
    "writingSample": {"title_mn": WRITING["title_mn"], "zh": WRITING["zh"], "pinyin": cap(py_sent(WRITING["zh"])), "mn": WRITING["mn"]},
    "writingPrompt_mn": WRITING["prompt_mn"]}

word_expl = []
for wi, w in enumerate(X.WORD_EXPL, 1):
    d = {"word": w["word"], "gloss": w["gloss"], "explanation": w["explanation"], "structure": w["structure"], "teacher_notes": w["teacher_notes"],
         "examples": [{"chinese": z, "pinyin": cap(py_sent(z)), "mongolian": m} for z, m in w["examples"]],
         "common_mistakes": [{"wrong": a, "right": b, "why": c} for a, b, c in w["mistakes"]],
         "check": check_json(w["check"], f"{LID}-w{wi}-check"),
         "practice": [ex_json(e, f"{LID}-w{wi}-p{pi}") for pi, e in enumerate(w["practice"], 1)]}
    word_expl.append(d)
colloc = [{"type": c["type"], "rows": [{"head": h, "with": wth, "mn": mn, "usage_mn": u, "example": {"chinese": ez, "pinyin": cap(py_sent(ez)), "mongolian": em}}
                                        for h, wth, mn, u, ez, em in c["rows"]]} for c in getattr(X, "COLLOC", [])]
word_cmp = [{"pair": c["pair"], "common": c["common"], "differences": c["differences"],
             "practice": [{"n": n, "question": q, "answer": a, "note": nt} for n, q, a, nt in c["practice"]]} for c in getattr(X, "WORD_CMP", [])]
text_ex = {
    "selectWord": {"instruction_mn": META["fill_instruction_mn"],
                   "banks": [{"words": X.PPT_FILL_BANK, "items": [{"n": i, "q": q, "answer": a} for i, (q, a) in enumerate(X.PPT_FILL, 1)]}],
                   "answer_source": META.get("fill_source", "teacher_plan (教案/PPT) — үг бүр хичээлийн 词语学习-д")},
    "comprehension": {"instruction_mn": META.get("comprehension_instruction_mn", "课文理解 — сурах бичгийн хажуугийн асуултууд (хариулт эх бичвэрээс; 教案-тай тулгасан)."),
                      "items": [{"n": i, "q_zh": q, "answer_zh": a} for i, (q, a) in enumerate(X.COMPREHENSION, 1)], "answer_source": "textbook_verified"},
    "retell": {"instruction_mn": META.get("retell_instruction_mn", "复述 — PPT/教案-ийн загвараар эх бичвэрийг өөрийн үгээр ярь."),
               "prompts": [{"label": l, "start_zh": s} for l, s in X.RETELL]},
}
texts = {"unit": {"number": N, "title": TITLE_ZH, "mongolianTitle": META.get("unit_title_mn", TITLE_MN)},
         "lessonIntro": X.INTRO, "warmup": {"mongolian": X.INTRO["warmup_mn"]},
         "vocabularyAudio": load_opt("vocab_audio_map.json", {}),
         "mainText": main_text, "properNouns": [{"chinese": z, "pinyin": p, "mongolian": m} for z, p, m in PROPER], "wordExplanation": word_expl, "collocations": colloc, "wordComparison": word_cmp,
         "textExercises": text_ex, "grammarNotes": grammar, "culture": X.CULTURE,
         "applicationDiscussionOrWriting": {
             "background": META["application"]["background"], "topic": META["application"]["topic"], "discussion": META["application"]["discussion"],
             "writing": {"promptChinese": WRITING["prompt_zh"], "promptMongolian": WRITING["prompt_mn"], "minChars": WRITING.get("min_chars", 150),
                         "requiredWords": WRITING.get("required_words", []), "sampleChinese": WRITING["zh"], "sampleMongolian": WRITING["mn"],
                         "gradingRubric": WRITING["rubric_mn"]}},
         "workbookReading": {"answer_source": META["answer_source"], "parts": []}}
json.dump(texts, open(f"{OUT}/texts.json", "w"), ensure_ascii=False, indent=1)

# ---------- workbook.json (综合练习) ----------
parts = []
for p in WB_READING:
    items = []
    for it in p["items"]:
        n, q, a, expl = it
        d = {"n": n, "question_zh": q, "answer": a, "explanation_mn": expl}
        if p["answer_type"] == "category": d["options"] = {"A": p["bank"][0], "B": p["bank"][1]}; d["answer"] = "A" if a == p["bank"][0] else "B"; d["answer_text"] = a
        items.append(d)
    part = {"part": p["part"], "type": p["answer_type"], "instruction_mn": p["instruction_mn"], "items": items}
    if p.get("bank") and p["answer_type"] == "word": part["bank"] = p["bank"]
    parts.append(part)
n_shi = sum(len(items) for g, items in SHIYISHI)
parts.insert(0, {"part": 0, "type": "sentence", "instruction_mn": f"综合注释 试一试 — дүрэм бүрийн номын дасгал БҮГД ({n_shi}), хариулт 参考答案; grammar.json-д эдгээрээс заримыг интерактив болгосон.",
    "items": [{"n": f"{g[0]}-{n}", "question_zh": q, "answer": a, "explanation_mn": e, "grammar": g} for g, items in SHIYISHI for n, q, a, e in items]})
workbook = {"reading": {"parts": parts},
    "writing": {"items": [{"n": 1, "prompt_mn": WRITING["title_mn"], "question_zh": WRITING["prompt_zh"], "answer": WRITING["zh"],
                           "explanation_mn": "Загвар эссе (zh/mn) texts.json → mainText.writingSample-д. Нээлттэй даалгавар — автомат шалгахгүй."}]},
    "speaking": {"items": [{"n": i, **it} for i, it in enumerate(META.get("speaking", []), 1)]},
    "answerSource": META["answer_source"]}
json.dump(workbook, open(f"{OUT}/workbook.json", "w"), ensure_ascii=False, indent=1)

# ---------- quiz.json ----------
quiz = []
for i, (typ, q, opts, correct, expl, diff, tags) in enumerate(QUIZ, 1):
    o, ci = shuffle(opts, opts.index(correct), f"{LID}-q{i}")
    quiz.append({"type": typ, "question": q, "options": o, "correct_answer": correct, "explanation": expl,
                 "order_index": i, "id": f"{LID}-q{i:02d}", "skillTags": tags, "difficulty": diff})
json.dump(quiz, open(f"{OUT}/quiz.json", "w"), ensure_ascii=False, indent=1)

# ---------- lesson.json / manifest.json ----------
images = load_opt("media_images.json", [])
has_clips = os.path.isdir(f"{OUT}/audio/words") and len(os.listdir(f"{OUT}/audio/words")) > 0
lesson = {"courseId": COURSE, "lessonId": LID, "title": f"发展汉语 中级I {N}-р хичээл — {TITLE_MN}", "chineseTitle": TITLE_ZH, "targetTitle": TITLE_ZH,
          "mongolianTitle": TITLE_MN, "subtitle": " · ".join(g["point"] for g in GRAMMAR),
          "description": META["description"],
          "duration": META.get("duration", "3 × 90 мин (教案)"), "status": "draft", "orderIndex": N, "icon": META.get("icon", "📘"),
          **({"thumbnailFile": META["thumbnail"]} if META.get("thumbnail") else {}), "audioFile": AUDIO_TEXT,
          "level": "发展汉语 中级 I", "hook": {"teacher_mn": X.INTRO["teacher_mn"], "warmup_mn": X.INTRO["warmup_mn"]},
          "sourceNote": f"发展汉语（第二版）中级综合 I — 第{N}课《{TITLE_ZH}》 [hskLevel=4] [lessonNumber={N}]; эх: docs/fazhan/textbooks/zhongji-zonghe-1.md, teacher/zhongji-zonghe-1/l{N:02d}.md, courseware/zhongji-zonghe-1/l{N:02d}.md, workbook/zhongji-zonghe-1-answers.md"}
json.dump(lesson, open(f"{OUT}/lesson.json", "w"), ensure_ascii=False, indent=1)
manifest = {"packageVersion": "BUUNDUU_CHINESE_HSK_PACKAGE_V1", "courseType": "chinese-hsk", "courseId": COURSE, "lessonId": LID, "hskLevel": 4, "lessonNumber": N,
            "lessonProfile": "hsk4-dialogue-shorttext-exam-workbook", "lessonType": "hsk4-dialogue-shorttext-exam-workbook", "language": "zh-MN", "targetLanguage": "zh", "uiLanguage": "mn",
            "title": TITLE_ZH, "mongolianTitle": TITLE_MN, "series": "发展汉语（第二版）中级综合 I", "seriesLabel_mn": "发展汉语 дунд I (≈HSK4)",
            "source": f"发展汉语（第二版）中级综合 I · 第{N}课 (сурах бичиг, 教案, 课件, 参考答案, албан mp3)", "hasAudio": True, "hasImages": bool(images),
            "audio": {"text": AUDIO_TEXT, "words": AUDIO_WORDS, **({"vocabularyClips": f"audio/words/w01..w{len(VOCAB):02d}.mp3 (албан 生词 бичлэгээс хайчилсан)"} if has_clips else {})},
            **({"media": {"lessonId": LID, "images": images}} if images else {}),
            "verification": {"answerStatus": "official_answer_key_verified (参考答案)", "textStatus": "source_verified (сурах бичгийн хуудсыг зургаар уншсан)", "teacherLayer": "教案 + PPT 课件-д тулгуурласан"}}
json.dump(manifest, open(f"{OUT}/manifest.json", "w"), ensure_ascii=False, indent=1)
subs = load_opt("subtitles.json", None)
if subs:
    by_zh = {x["chinese"]: x for x in subs}
    rows = [{"start": by_zh[sn["zh"]]["start"], "end": by_zh[sn["zh"]]["end"], "chinese": sn["zh"], "pinyin": sn["pinyin"], "mongolian": sn["mn"]} for sn in sentences if sn["zh"] in by_zh]
    json.dump(rows, open(f"{OUT}/subtitles.json", "w"), ensure_ascii=False, indent=1); print("subtitles:", len(rows), "/", len(sentences))
print("built:", {f: os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT) if f.endswith(".json")})
print("sentences:", len(sentences), "chars:", main_text["charCount"], "vocab:", len(vocab), "grammar:", len(grammar), "wordExpl:", len(word_expl), "quiz:", len(quiz), "wb parts:", len(parts), "images:", len(images), "clips:", has_clips)
