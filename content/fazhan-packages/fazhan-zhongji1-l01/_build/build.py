import json, os, re, hashlib, sys
sys.path.insert(0, ".")
from pypinyin import pinyin, Style, load_phrases_dict
from vocab import VOCAB, PROPER
from text import TEXT, SOURCE_NOTE
from grammar import GRAMMAR
from extra import *
from workbook_quiz import WB_READING, QUIZ, SHIYISHI

OUT = ".."; os.makedirs(OUT, exist_ok=True)
COURSE, LID, N = "fazhan-zhongji1", "fazhan-zhongji1-l01", 1
AUDIO_TEXT, AUDIO_WORDS = "audio/fazhan-zhongji1-01-text.mp3", "audio/fazhan-zhongji1-01-words.mp3"

load_phrases_dict({"住得": [["zhù"], ["de"]], "吹得": [["chuī"], ["de"]], "洗得": [["xǐ"], ["de"]], "变得": [["biàn"], ["de"]],
                   "擦得": [["cā"], ["de"]], "办得": [["bàn"], ["de"]], "解释得": [["jiě"], ["shì"], ["de"]], "弄得": [["nòng"], ["de"]],
                   "一夜": [["yí"], ["yè"]], "一阵": [["yí"], ["zhèn"]], "一半": [["yí"], ["bàn"]], "一样": [["yí"], ["yàng"]],
                   "一圈": [["yì"], ["quān"]], "一条": [["yì"], ["tiáo"]], "一杯": [["yì"], ["bēi"]], "一本": [["yì"], ["běn"]],
                   "一路上": [["yí"], ["lù"], ["shàng"]], "一面": [["yí"], ["miàn"]], "一种": [["yì"], ["zhǒng"]], "一眼": [["yì"], ["yǎn"]],
                   "不怕": [["bú"], ["pà"]], "不成样子": [["bù"], ["chéng"], ["yàng"], ["zi"]], "心儿里美": [["xīn"], ["r"], ["lǐ"], ["měi"]],
                   "红心儿": [["hóng"], ["xīn"], ["r"]], "花儿": [["huā"], ["r"]], "馋嘴": [["chán"], ["zuǐ"]], "少女": [["shào"], ["nǚ"]],
                   "哪儿": [["nǎr"]], "这儿": [["zhèr"]], "那儿": [["nàr"]], "一会儿": [["yí"], ["huì"], ["r"]], "心儿": [["xīn"], ["r"]], "着": [["zhe"]], "等着": [["děng"], ["zhe"]], "听着": [["tīng"], ["zhe"]], "争着": [["zhēng"], ["zhe"]], "吃着": [["chī"], ["zhe"]],
                   "写着": [["xiě"], ["zhe"]], "下着": [["xià"], ["zhe"]], "了": [["le"]], "得": [["de"]]})

PUNCT = set("，。！？：；、“”\"（）——……·《》 ")
PMAP = {"，": ", ", "。": ". ", "！": "! ", "？": "? ", "：": ": ", "；": "; ", "、": ", ", "“": ' "', "”": '" ', "\"": '"', "（": " (", "）": ") ", "——": " — ", "……": "… ", "《": " «", "》": "» "}
def _fix(s):
    for k, v in PMAP.items(): s = s.replace(k, v)
    return re.sub(r"\s+", " ", s).replace(" ,", ",").replace(" .", ".").replace(" !", "!").replace(" ?", "?").replace('( ', '(').replace(' )', ')').strip()
PROPER_PY = {"北京": "Běijīng", "北平": "Běipíng", "西山": "Xīshān", "北海": "Běihǎi", "北海公园": "Běihǎi Gōngyuán", "文津街": "Wénjīn Jiē", "西来顺": "Xīláishùn",
             "西单": "Xīdān", "协和医院": "Xiéhé Yīyuàn", "林海音": "Lín Hǎiyīn", "中国": "Zhōngguó", "上海": "Shànghǎi", "蒙古": "Měnggǔ", "乌兰巴托": "Wūlánbātuō",
             "香山": "Xiāngshān", "太平洋": "Tàipíngyáng", "桂林": "Guìlín", "河北省": "Héběi Shěng", "马克": "Mǎkè", "小王": "Xiǎo Wáng", "北京人": "Běijīngrén", "北京城": "Běijīngchéng", "中国人": "Zhōngguórén"}
EXTRA_WORDS = ["我们","你们","他们","大家","什么","怎么","为什么","因为","所以","但是","可是","虽然","如果","要是","已经","还是","现在","今天","明天","昨天","去年","今年","每天","时候","地方","这里","那里","这儿","那儿","哪儿","东西","朋友","老师","学生","同学","孩子","父母","妻子","丈夫","工作","学习","生活","时间","手机","电脑","电话","汉语","普通话","中国菜","饭馆","学校","银行","交通","地铁站","公共汽车站","附近","方便","喜欢","知道","觉得","认真","努力","完成","作业","留学","留学生","国外","父亲","儿子","妹妹","妹夫","师母","老爸老妈","老公","岳父","计算机","电脑","外国人","老外","网友","网络","认识","爱人","情人","意思","房间","屋子","衣服","自行车","新年","打扫","干干净净","清清楚楚","乱七八糟","亮亮的","漂亮","极了","不成样子","圣诞节","河流","乘船","游泳","太阳","落山","散步","关系","同屋","姐妹","树叶","树干","毕业","离开","怀念","家乡","故乡","情况","一切","风景","想家","高兴","生气","迟到","约会","换","满意","回来","以后","可能","肯定","非常","特别","连续","小时","电影院","半个","着急","出生","上大学","一直","住","照片","夹","书里","亚洲","机会","有关","电子词典","荧光笔","中国通","熟悉","蔬菜","水果","西红柿","礼物","生日","从此","粮食","农村","城市","市场","南方","香蕉","芒果","荔枝","熟透","湿透","红透","西瓜","苹果","星期","下星期","季节","春天","夏天","秋天","冬天","春季","夏季","秋季","冬季","草原","骑马","温度","零下","干冷","哪种","方法","更好","试一试","比一比","报名","参加","活动","排好队","上车","发言","课堂","活跃","狗粮","小狗","考试","旅行","国家","工作","接","原来","这些","新来","了解","睡觉","身边","四声","说不对","多么","仿佛","度过","然而","短暂","格外","经过","属于","假如","郊游","寻找","大部分","来不及","来得及","不知道","不知","多少"]
_dict = set(EXTRA_WORDS) | set(PROPER_PY) | {z.split("（")[0] for z, *_ in VOCAB} | {z for z, *_ in PROPER}
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
    if all(c in PUNCT or not re.match(r"[\u4e00-\u9fff]", c) for c in zh): return ""
    return "".join(x[0] for x in pinyin(zh, style=Style.TONE))
def py_sent(zh, tokens=None):
    toks = tokens or segment(zh)
    return _fix(" ".join(py_token(t) or t for t in toks))
def cap(s): return s[:1].upper() + s[1:]
import random
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
PARA_MN = {1:"Зохиолч Бээжинд хэт удаан амьдарсан тул мод үндэслэсэн мэт; бага нас, охин, эхнэр хүний үе — амьдралынхаа тал нь тэнд.",
 2:"Хавар хүмүүс Си Шань уул руу ар араасаа ирж, хэн түрүүлж оргилд гарахаар уралдан авирдаг.",
 3:"Хавар цээнэ, дараа нь улаан цээнэ дэлгэрнэ — үзэсгэлэнтэй ч салхи цэцгийг сүйтгэж, хавар богинохон.",
 4:"Зуны үдэш: мэлрэг цэцгийн цай, дуртай ном, жиргээний дуу — нам гүмийг мэдрэх.",
 5:"Зуны аадар бороо тэнгэр, дэлхийг угааж, агаар цэнгэг болно; улаан хана ногоон дээвэр, Бэйхайн завь, түүхтэй Вэньжинь гудамж.",
 6:"Намар урт: навч шарлахаас ус хөлдөх хүртэл. Эхний мэдээ — жимс худалдаанд гарах (чавга, усан үзэм, лийр).",
 7:"Силайшуний «涮» «烤» самбар намар ирснийг зарлана; зам дагуу шарсан махны үнэр, өдөрт тоолшгүй олон хонь тээвэрлэгдэнэ.",
 8:"Намар бүр байгальд гарна: оюутнууд Си Шаний навч улайснаа мэдээлнэ, улаан навч номондоо хавчуулах нь зуршил.",
 9:"Намрын сүүлээр залуус тэшүүрээ гаргаж гялалзтал арчаад Бэйхай хөлдөхийг хүлээнэ.",
 10:"Одоо өвлийн эхэн: цас орж, дулаахан өрөөнд лийр шиг амтат «Синьэрлимэй» лууван идэх.",
 11:"Бээжингээс намрын улаан навчны үеэр явсан; онгоцноос Сехэ эмнэлгийн ногоон дээвэр — эхээс салах мэт мэдрэмж."}
for pno, sents in TEXT:
    for toks, mn, note, ks in sents:
        parts = toks.split("|"); zh = "".join(parts)
        s = {"zh": zh, "pinyin": cap(py_sent(zh, parts)), "mn": mn, "paragraph": pno,
             "tokens": [{"zh": p, "py": py_token(p)} for p in parts]}
        if note: s["note"] = note
        if ks: s["key_structures"] = ks
        sentences.append(s)
    para_summ.append({"paragraph": pno, "mn": PARA_MN[pno]})
main_text = {"id": 1, "title": "北京的四季", "mongolianTitle": "Бээжингийн дөрвөн улирал", "title_mn": "课文 · 北京的四季 (Бээжингийн дөрвөн улирал)",
    "audioFile": AUDIO_TEXT, "charCount": sum(len(re.findall(r"[一-鿿]", s["zh"])) for s in sentences),
    "source": "发展汉语（第二版）中级综合 I — 第1课 课文 " + SOURCE_NOTE, "author_zh": "林海音", "intro_zh": "本文是著名华文女作家林海音的作品，原名《苦念北平》。作者的童年是在老北京度过的，这段生活成了她许多作品的重要内容。代表作《城南旧事》。",
    "intro_mn": "Энэ бол Тайванийн нэрт эмэгтэй зохиолч Линь Хайины «苦念北平» (Бэйпинг санагалзахуй) бүтээлийн хэсэг. Зохиолч бага насаа хуучин Бээжинд өнгөрөөсөн бөгөөд энэ үе нь түүний олон бүтээлийн гол сэдэв болсон. Гол бүтээл: «城南旧事» (Хотын өмнөд хэсгийн хуучны явдал).",
    "sentences": sentences, "paragraph_summaries": para_summ,
    "reflection": {"questions_mn": ["Зохиолч Бээжингийн аль улирлыг хамгийн их санагалзаж байна гэж бодож байна? Яагаад?",
                                    "Чиний нутагт улирал ирснийг «зарладаг» ямар шинж тэмдэг байдаг вэ (Бээжингийн 涮/烤 самбар шиг)?",
                                    "«离开母亲的感觉» — зохиолч Бээжинг яагаад эхтэйгээ зүйрлэсэн бэ? Чи төрсөн нутгаасаа холдоход юу мэдэрдэг вэ?"]},
    "writingSample": {"title_mn": WRITING["title_mn"], "zh": WRITING["zh"], "pinyin": cap(py_sent(WRITING["zh"])), "mn": WRITING["mn"]},
    "writingPrompt_mn": WRITING["prompt_mn"]}

word_expl = []
for wi, w in enumerate(WORD_EXPL, 1):
    d = {"word": w["word"], "gloss": w["gloss"], "explanation": w["explanation"], "structure": w["structure"], "teacher_notes": w["teacher_notes"],
         "examples": [{"chinese": z, "pinyin": cap(py_sent(z)), "mongolian": m} for z, m in w["examples"]],
         "common_mistakes": [{"wrong": a, "right": b, "why": c} for a, b, c in w["mistakes"]],
         "check": check_json(w["check"], f"{LID}-w{wi}-check"),
         "practice": [ex_json(e, f"{LID}-w{wi}-p{pi}") for pi, e in enumerate(w["practice"], 1)]}
    word_expl.append(d)
colloc = [{"type": c["type"], "rows": [{"head": h, "with": wth, "mn": mn, "usage_mn": u, "example": {"chinese": ez, "pinyin": cap(py_sent(ez)), "mongolian": em}}
                                        for h, wth, mn, u, ez, em in c["rows"]]} for c in COLLOC]
word_cmp = [{"pair": c["pair"], "common": c["common"], "differences": c["differences"],
             "practice": [{"n": n, "question": q, "answer": a, "note": nt} for n, q, a, nt in c["practice"]]} for c in WORD_CMP]
fill_bank = PPT_FILL_BANK
text_ex = {
    "selectWord": {"instruction_mn": "教案/PPT(3) 用本课的词语填空 — Энэ хичээлийн үгсээр нөх (хариулт бүр ганц үг; зарим өгүүлбэрт нэг үг давтагдана).",
                   "banks": [{"words": fill_bank, "items": [{"n": i, "q": q, "answer": a} for i, (q, a) in enumerate(PPT_FILL, 1)]}],
                   "answer_source": "teacher_plan (教案 第一次课 二-3, PPT слайд 3) — үг бүр хичээлийн 词语学习-д"},
    "comprehension": {"instruction_mn": "课文理解 — сурах бичгийн хажуугийн 23 асуулт (хариулт эх бичвэрээс; 教案-ийн асуултуудтай тулгасан).",
                      "items": [{"n": i, "q_zh": q, "answer_zh": a} for i, (q, a) in enumerate(COMPREHENSION, 1)], "answer_source": "textbook_verified"},
    "retell": {"instruction_mn": "复述 — PPT/教案-ийн загвараар эх бичвэрийг өөрийн үгээр ярь, дараа нь өөрийн нутгаар сольж ярь.",
               "prompts": [{"label": l, "start_zh": s} for l, s in RETELL]},
}
texts = {"unit": {"number": N, "title": "北京的四季", "mongolianTitle": "Бээжингийн дөрвөн улирал — төрсөн нутгийн улирал, санагалзал"},
         "lessonIntro": INTRO, "warmup": {"mongolian": INTRO["warmup_mn"]},
         "mainText": main_text, "properNouns": [{"chinese": z, "pinyin": p, "mongolian": m} for z, p, m in PROPER], "wordExplanation": word_expl, "collocations": colloc, "wordComparison": word_cmp,
         "textExercises": text_ex, "grammarNotes": grammar, "culture": CULTURE,
         "applicationDiscussionOrWriting": {
             "background": "Хичээлийн сэдэв — төрсөн нутгийн дөрвөн улирал, тэндхийн зуршил, хоол, мартагдашгүй зүйлс. Зохиолчийн санагалзал.",
             "topic": "你的家乡四季怎么样？你最难忘的是哪个季节？ (Чиний нутгийн дөрвөн улирал ямар вэ? Хамгийн мартагдашгүй улирал?)",
             "discussion": ["双人活动 (хосоор): 综合练习 八 — 管A叫B бүтцээр 5 яриа: эргэн тойрны зүйлсийг «хятадаар юу гэж нэрлэдэг вэ?» гэж асууж хариул (电子词典, 荧光笔, 中国通…).",
                            "小组: Монголын дөрвөн улирлыг Бээжингийнхтэй харьцуул (春天短/长? 秋天? 冬天?) — 可是……却……, 跟……不一样 хэрэглэ."],
             "writing": {"promptChinese": "以《家乡的四季》为题写一篇作文，向大家介绍你的家乡。（150字以上）", "promptMongolian": WRITING["prompt_mn"], "minChars": 150,
                         "requiredWords": ["美丽", "安静", "清新", "热闹", "想念", "仿佛……一样", "（就）拿……来说（吧）", "最难忘的是……"],
                         "sampleChinese": WRITING["zh"], "sampleMongolian": WRITING["mn"],
                         "gradingRubric": "Шалгах: (1) 4 улирал бүгд орсон; (2) 把……V得+C, 拿……来说, 管A叫B-ээс дор хаяж 2 бүтэц зөв; (3) 150+ ханз; (4) 仿佛/格外/纷纷/短暂 зэрэг шинэ үгс ≥5; (5) 然而/可是……却 эсрэгцүүлэл нэг удаа."}},
         "workbookReading": {"answer_source": "答案本 (初级综合1参考答案.pdf → workbook/zhongji-zonghe-1-answers.md х.1–2) — 综合练习 一–七", "parts": []}}
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
parts.insert(0, {"part": 0, "type": "sentence", "instruction_mn": "综合注释 试一试 1–5 — дүрэм бүрийн номын дасгал БҮГД (21), хариулт 参考答案; grammar.json-д эдгээрээс 10-ыг интерактив болгосон.",
    "items": [{"n": f"{g[0]}-{n}", "question_zh": q, "answer": a, "explanation_mn": e, "grammar": g} for g, items in SHIYISHI for n, q, a, e in items]})
workbook = {"reading": {"parts": parts}, "writing": {"items": [
    {"n": 1, "prompt_mn": "综合练习 九 — 写一写: 《家乡的四季》 150+ ханз", "question_zh": "以《家乡的四季》为题写一篇作文，向大家介绍你的家乡。（150字以上）参考词语和格式：美丽 安静 清新 热闹 想念 / 好像/仿佛……一样 / 跟……一样/不一样 / A比B…… / （就）拿……来说（吧） / 最难忘的是……",
     "answer": WRITING["zh"], "explanation_mn": "Загвар эссе (zh/mn) texts.json → mainText.writingSample-д. Нээлттэй даалгавар — автомат шалгахгүй."}]},
    "speaking": {"items": [{"n": 1, "prompt_mn": "综合练习 八 — 表达练习: хостойгоо 管A叫B бүтцээр дор хаяж 5 яриа", "question_zh": "A：中国人管这个叫什么？ B：他们管这个叫\"电子词典\"。／ A：人们管熟悉中国情况的外国人叫什么？ B：人们管他们叫\"中国通\"。", "answer": "нээлттэй", "explanation_mn": "荧光笔, 中国通, 老外, 网友, 老公/老婆, 电脑 зэргийг ашигла."}]},
    "answerSource": "发展汉语 中级综合 I 参考答案 (答案本 х. 1–2) + 教案 PPT 22 (练习六 хүснэгт); нээлттэй даалгавар (七-2, 八, 九) — эх бичвэр/загвар хариулт."}
json.dump(workbook, open(f"{OUT}/workbook.json", "w"), ensure_ascii=False, indent=1)

# ---------- quiz.json ----------
quiz = []
for i, (typ, q, opts, correct, expl, diff, tags) in enumerate(QUIZ, 1):
    o, ci = shuffle(opts, opts.index(correct), f"{LID}-q{i}")
    quiz.append({"type": typ, "question": q, "options": o, "correct_answer": correct, "explanation": expl,
                 "order_index": i, "id": f"{LID}-q{i:02d}", "skillTags": tags, "difficulty": diff})
json.dump(quiz, open(f"{OUT}/quiz.json", "w"), ensure_ascii=False, indent=1)

# ---------- lesson.json / manifest.json ----------
lesson = {"courseId": COURSE, "lessonId": LID, "title": "发展汉语 中级I 1-р хичээл — Бээжингийн дөрвөн улирал", "chineseTitle": "北京的四季", "targetTitle": "北京的四季",
          "mongolianTitle": "Бээжингийн дөрвөн улирал", "subtitle": "把……V得+C · （就）拿……来说（吧） · 一+N · 不知道……多少 · 管A叫B",
          "description": "Линь Хайины «苦念北平»-ийн хэсэг (11 догол мөр) + 42 шинэ үг + 5 дүрэм (综合注释) + 10 гол үгийн задаргаа + 综合练习 9 даалгавар (参考答案-аар баталгаажсан) + албан аудио (生词/课文)",
          "duration": "3 × 90 мин (教案)", "status": "draft", "orderIndex": 1, "icon": "🍂", "thumbnailFile": "images/xishan.jpg", "audioFile": AUDIO_TEXT,
          "sourceNote": "发展汉语（第二版）中级综合 I — 第1课《北京的四季》 [hskLevel=4] [lessonNumber=1]; эх: docs/fazhan/textbooks/zhongji-zonghe-1.md (PDF х.15–27), teacher/zhongji-zonghe-1/l01.md, courseware/zhongji-zonghe-1/l01.md, workbook/zhongji-zonghe-1-answers.md"}
json.dump(lesson, open(f"{OUT}/lesson.json", "w"), ensure_ascii=False, indent=1)
manifest = {"packageVersion": "BUUNDUU_CHINESE_HSK_PACKAGE_V1", "courseType": "chinese-hsk", "courseId": COURSE, "lessonId": LID, "hskLevel": 4, "lessonNumber": 1,
            "lessonProfile": "hsk4-dialogue-shorttext-exam-workbook", "lessonType": "hsk4-dialogue-shorttext-exam-workbook", "language": "zh-MN", "targetLanguage": "zh", "uiLanguage": "mn",
            "title": "北京的四季", "mongolianTitle": "Бээжингийн дөрвөн улирал", "series": "发展汉语（第二版）中级综合 I", "seriesLabel_mn": "发展汉语 дунд I (≈HSK4)",
            "source": "发展汉语（第二版）中级综合 I · 第1课 (сурах бичиг, 教案, 课件, 参考答案, албан mp3)", "hasAudio": True, "hasImages": True,
            "audio": {"text": AUDIO_TEXT, "words": AUDIO_WORDS},
            "media": {"lessonId": LID, "images": json.load(open("./media_images.json"))},
            "verification": {"answerStatus": "official_answer_key_verified (参考答案)", "textStatus": "source_verified (сурах бичгийн хуудсыг зургаар уншсан, OCR биш)", "teacherLayer": "教案 (徐桂梅) + PPT 课件-д тулгуурласан"}}
json.dump(manifest, open(f"{OUT}/manifest.json", "w"), ensure_ascii=False, indent=1)
# subtitles.json (өгүүлбэр бүрийн цаг, whisper-ээр) — байвал
import os as _os
if _os.path.exists("./subtitles.json"):
    subs = json.load(open("./subtitles.json"))
    by_zh = {x["chinese"]: x for x in subs}
    rows = [{"start": by_zh[sn["zh"]]["start"], "end": by_zh[sn["zh"]]["end"], "chinese": sn["zh"], "pinyin": sn["pinyin"], "mongolian": sn["mn"]} for sn in sentences if sn["zh"] in by_zh]
    json.dump(rows, open(f"{OUT}/subtitles.json", "w"), ensure_ascii=False, indent=1); print("subtitles:", len(rows))
print("built:", {f: os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT) if f.endswith(".json")})
print("sentences:", len(sentences), "chars:", main_text["charCount"], "vocab:", len(vocab), "grammar:", len(grammar), "wordExpl:", len(word_expl), "quiz:", len(quiz), "wb parts:", len(parts))
