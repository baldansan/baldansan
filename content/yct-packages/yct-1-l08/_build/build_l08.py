#!/usr/bin/env python3
"""YCT 标准教程 1 · 第8课 我去商店。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib
OUT = "/home/claude/work/yct1/l08/pkg"
CID, LID, N = "yct-1", "yct-1-l08", 8
os.makedirs(OUT, exist_ok=True)

def dump(name, obj):
    with open(f"{OUT}/{name}", "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

def shuffle(options, correct, seed):
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    opts = list(options)
    for i in range(len(opts) - 1, 0, -1):
        j = h % (i + 1); h //= (i + 1)
        opts[i], opts[j] = opts[j], opts[i]
    return opts, opts.index(correct)

# ---------------- VOCAB ----------------
VOCAB = [
 ("在","zài","байна, -д (хаана байгаа)","үйл үг / угтвар · гол үг","我们在家。","Wǒmen zài jiā.","Бид гэртээ байна.",True),
 ("谢谢","xièxie","баярлалаа","хэллэг · гол үг","谢谢你们。","Xièxie nǐmen.","Та нарт баярлалаа.",True),
 ("去","qù","явах","үйл үг · гол үг","我去学校。","Wǒ qù xuéxiào.","Би сургууль руу явна.",True),
 ("你们","nǐmen","та нар, чи нар","төлөөний үг · гол үг","你们去吗？","Nǐmen qù ma?","Та нар явах уу?",True),
 ("我们","wǒmen","бид","төлөөний үг · гол үг","我们在家。","Wǒmen zài jiā.","Бид гэртээ байна.",True),
 ("哪儿","nǎr","хаана, хаашаа","асуух үг · гол үг","你去哪儿？","Nǐ qù nǎr?","Чи хаашаа явах вэ?",True),
 ("学校","xuéxiào","сургууль","нэр үг","她在学校。","Tā zài xuéxiào.","Тэр сургууль дээр байна.",False),
 ("商店","shāngdiàn","дэлгүүр","нэр үг","我去商店。","Wǒ qù shāngdiàn.","Би дэлгүүр явна.",False),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,
          "exampleMongolian":em,"hskLevel":"YCT 1","keyWord":key,"orderIndex":i+1}
         for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = ("audio/yct-1-08-words.mp3","audio/yct-1-08-text.mp3","audio/yct-1-08-song.mp3","audio/yct-1-08-story.mp3","audio/yct-1-08-test.mp3")
AUD_MAIN = "audio/yct-1-08-text-song.mp3"
def tok(s):
    out=[]
    for t in s.split(" "):
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
    return out
def L(sp,zh,py,mn): return {"speaker":sp,"zh":zh,"pinyin":py,"mn":mn}

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Найзынхаа үүдэнд","scene_mn":"Охин найзынхаа гэрт ирж, түүний эгчийг асууна.","audio":AUD_TEXT,
  "lines":[L("小红","你姐姐在家吗？","Nǐ jiějie zài jiā ma?","Чиний эгч гэртээ байна уу?"),
           L("小明","不在，她在学校。","Bù zài, tā zài xuéxiào.","Үгүй, тэр сургууль дээр байна."),
           L("小红","谢谢，再见！","Xièxie, zàijiàn!","Баярлалаа, баяртай!"),
           L("小明","再见！","Zàijiàn!","Баяртай!")]},
 {"id":2,"title_mn":"Яриа 2 · Гэрийнхэн дэлгүүр явна","scene_mn":"Ээж дэлгүүр явах гэж байна. Аав гэртээ үлдэнэ, хүү ээжтэйгээ явна.","audio":AUD_TEXT,
  "lines":[L("妈妈","我去商店，你们去吗？","Wǒ qù shāngdiàn, nǐmen qù ma?","Би дэлгүүр явна, та нар явах уу?"),
           L("爸爸","不去。我们在家。","Bú qù. Wǒmen zài jiā.","Үгүй, явахгүй. Бид гэртээ байна."),
           L("小刚","妈妈，我去。","Māma, wǒ qù.","Ээж ээ, би явна.")]},
 {"id":3,"title_mn":"Mini story · 你们去哪儿？","scene_mn":"Амьтдын уралдаанд яст мэлхий унаж, найзууд нь эмнэлэгт хүргэнэ. Дараа нь хаашаа явахаа ярина.","audio":AUD_STORY,
  "lines":[L("小猫","加油！","Jiāyóu!","Тэмцээрэй!"),L("熊猫","加油！","Jiāyóu!","Тэмцээрэй!"),
           L("熊猫","医院到了。","Yīyuàn dào le.","Эмнэлэгт ирлээ."),L("乌龟","谢谢你们。","Xièxie nǐmen.","Та нарт баярлалаа."),
           L("医生","你们去哪儿？","Nǐmen qù nǎr?","Та нар хаашаа явах вэ?"),L("小猫","我去学校。","Wǒ qù xuéxiào.","Би сургууль руу явна."),
           L("熊猫","我去商店。","Wǒ qù shāngdiàn.","Би дэлгүүр явна."),L("小狗","我回家。","Wǒ huí jiā.","Би гэртээ харина.")]},
]
song_lines = [
 ("鼻子，鼻子，鼻子在这儿。","Bízi, bízi, bízi zài zhèr.","Хамар, хамар, хамар энд байна.","鼻子|bízi ，| 鼻子|bízi ，| 鼻子|bízi 在|zài 这儿|zhèr 。|"),
 ("耳朵，耳朵，耳朵在这儿。","Ěrduo, ěrduo, ěrduo zài zhèr.","Чих, чих, чих энд байна.","耳朵|ěrduo ，| 耳朵|ěrduo ，| 耳朵|ěrduo 在|zài 这儿|zhèr 。|"),
 ("眼睛，眼睛，眼睛在这儿。","Yǎnjing, yǎnjing, yǎnjing zài zhèr.","Нүд, нүд, нүд энд байна.","眼睛|yǎnjing ，| 眼睛|yǎnjing ，| 眼睛|yǎnjing 在|zài 这儿|zhèr 。|"),
 ("头发，头发，头发在这儿。","Tóufa, tóufa, tóufa zài zhèr.","Үс, үс, үс энд байна.","头发|tóufa ，| 头发|tóufa ，| 头发|tóufa 在|zài 这儿|zhèr 。|"),
 ("小手，小手，小手在那儿。","Xiǎo shǒu, xiǎo shǒu, xiǎo shǒu zài nàr.","Бяцхан гар, бяцхан гар, бяцхан гар тэнд байна.","小手|xiǎo shǒu ，| 小手|xiǎo shǒu ，| 小手|xiǎo shǒu 在|zài 那儿|nàr 。|"),
]
dlg_lines=[
 (1,"小红：你姐姐在家吗？","Xiǎohóng: Nǐ jiějie zài jiā ma?","Сяо Хун: Чиний эгч гэртээ байна уу?","小红：| 你|nǐ 姐姐|jiějie 在|zài 家|jiā 吗|ma ？|","在家 — «гэртээ байна». 在 + газар гэж хэлнэ. Асуулт болгохын тулд төгсгөлд нь 吗 нэмнэ.",["你姐姐在家吗？"]),
 (1,"小明：不在，她在学校。","Xiǎomíng: Bù zài, tā zài xuéxiào.","Сяо Мин: Үгүй, тэр сургууль дээр байна.","小明：| 不|bù 在|zài ，| 她|tā 在|zài 学校|xuéxiào 。|","不在 — «байхгүй». Хаана байгааг 在-ийн ард хэлнэ.",[]),
 (1,"小红：谢谢，再见！","Xiǎohóng: Xièxie, zàijiàn!","Сяо Хун: Баярлалаа, баяртай!","小红：| 谢谢|xièxie ，| 再见|zàijiàn ！|",None,[]),
 (1,"小明：再见！","Xiǎomíng: Zàijiàn!","Сяо Мин: Баяртай!","小明：| 再见|zàijiàn ！|",None,[]),
 (2,"妈妈：我去商店，你们去吗？","Māma: Wǒ qù shāngdiàn, nǐmen qù ma?","Ээж: Би дэлгүүр явна, та нар явах уу?","妈妈：| 我|wǒ 去|qù 商店|shāngdiàn ，| 你们|nǐmen 去|qù 吗|ma ？|","我去商店 — «Би дэлгүүр явна». 去 + газар. 你们 = «та нар», нэгээс олон хүнд хэлнэ.",["我去商店。"]),
 (2,"爸爸：不去。我们在家。","Bàba: Bú qù. Wǒmen zài jiā.","Аав: Үгүй, явахгүй. Бид гэртээ байна.","爸爸：| 不|bú 去|qù 。| 我们|wǒmen 在|zài 家|jiā 。|","我们 = «бид». 不去 — «явахгүй».",[]),
 (2,"小刚：妈妈，我去。","Xiǎogāng: Māma, wǒ qù.","Сяо Ган: Ээж ээ, би явна.","小刚：| 妈妈|māma ，| 我|wǒ 去|qù 。|",None,[]),
]
sentences=[]
for para,zh,py,mn,tk,note,ks in dlg_lines:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note; s["key_structures"]=ks
    sentences.append(s)
for i,(zh,py,mn,tk) in enumerate(song_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="在这儿 — «энд байна». Мөр бүрт хамар, чих гэх мэт биеийн хэсгээ зааж дуул!"
    if i==4: s["note"]="那儿 — «тэнд» (холоос заана). Гараа хол сунган заагаарай!"
    sentences.append(s)

texts = {
 "unit":{"number":"8","title":"我去商店。","mongolianTitle":"Би дэлгүүр явна — хаана байгааг, хаашаа явахыг хэлэх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи өнөөдөр хаашаа явах вэ? Сургууль уу, дэлгүүр үү? Хятадаар «явах»-ыг «去 (qù)» гэдэг. Харин «хаана байна» гэхдээ «在 (zài)» гэнэ. Жишээ нь «我去商店» — «Би дэлгүүр явна», «我在家» — «Би гэртээ байна». Мөн «哪儿 (nǎr)» гэвэл «хаана, хаашаа» гэсэн асуулт болно. Өнөөдөр бид ээж, аавтайгаа хаашаа явахаа ярилцаж, «鼻子在这儿» дууг дуулж, биеийнхээ хэсгийг зааж тоглоно. Эхэлцгээе!",
  "warmup_mn":"Чи өнөөдөр сургуулиасаа хойш хаашаа явсан бэ? Гэрт чинь одоо хэн байна, хэн байхгүй байна?",
  "theme_zh":"去哪儿 · 在哪儿","theme_mn":"Хаашаа явах · Хаана байх"},
 "warmup":{"mongolian":"Чи өнөөдөр хаашаа явсан бэ? Гэрт чинь хэн байна?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"8","title":"我去商店。","mongolianTitle":"Би дэлгүүр явна — яриа ба дуу","title_mn":"Let's read · 2 яриа + Let's read and point · 鼻子在这儿 (дуу)","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第8课 Let's read / Let's read and point（CD 08-02, 08-03）","author_zh":"",
  "intro_zh":"两段对话：你姐姐在家吗？我去商店。然后一起唱《鼻子在这儿》。","intro_mn":"Эхлээд хоёр яриа: найзынхаа үүдэнд «你姐姐在家吗？», гэртээ «我去商店». Дараа нь «鼻子在这儿» дууг дуулна. Дуулахдаа хамар, чих, нүд, үс, гараа ээлжлэн заагаарай!",
  "sentences":sentences,
  "paragraph_summaries":[{"paragraph":1,"mn":"Яриа 1 — Охин найзаасаа эгчийг нь асууж, эгч нь сургууль дээр байгааг мэдээд баярлалаа гэж хэлээд баяртай гэнэ."},{"paragraph":2,"mn":"Яриа 2 — Ээж дэлгүүр явахаар болж «Та нар явах уу?» гэж асууна. Аав гэртээ үлдэнэ, хүү ээжтэйгээ явна."},{"paragraph":3,"mn":"Дуу «鼻子在这儿». Хамар, чих, нүд, үс энд байна, харин бяцхан гар тэнд байна гэж заана. «这儿» ойр, «那儿» хол заахад хэрэглэнэ."}],
  "reflection":{"questions_mn":["Найзынхаа гэрт очоод найз нь байхгүй бол хятадаар юу гэж асуух вэ?","Чи өнөөдөр хаашаа явах вэ? Хятадаар хэлж үз.","Ээж аав чинь одоо хаана байна? 在-аар хэлж үзээрэй."]},
  "writingSample":{"title_mn":"Ярих дасгал · Хаашаа явах вэ","zh":"我去商店。我们在家。","pinyin":"Wǒ qù shāngdiàn. Wǒmen zài jiā.","mn":"Би дэлгүүр явна. Бид гэртээ байна."},
  "writingPrompt_mn":"Гэрийнхэндээ хятадаар хэл: «我去学校» эсвэл «我去商店». Тэд «你去哪儿？» гэж асууж, чи хариулна!"},
 "properNouns":[],
 "wordExplanation":[
  {"word":"在","gloss":"zài — байна, -д","explanation":"Хэн нэгэн хаана байгааг хэлэхдээ 在 гэж хэлнэ. 她在学校 — «тэр сургууль дээр байна». «Байхгүй» гэхдээ 不在 гэнэ.",
   "structure":"хэн + 在 + газар  ·  хэн + 不在","teacher_notes":"在-г «байна» гэж хүүхдэд ойлгуул, хүүхдүүдийн мэддэг газар (家, 学校, 商店)-аар давтуул. Дуунд мөн «在这儿» (энд байна) гарна.",
   "examples":[{"chinese":"她在学校。","pinyin":"Tā zài xuéxiào.","mongolian":"Тэр сургууль дээр байна."},{"chinese":"我们在家。","pinyin":"Wǒmen zài jiā.","mongolian":"Бид гэртээ байна."},{"chinese":"鼻子在这儿。","pinyin":"Bízi zài zhèr.","mongolian":"Хамар энд байна."}],
   "common_mistakes":[{"wrong":"我在去学校。","right":"我去学校。","why":"Явах гэж хэлэхэд 去 л хэрэгтэй. 在 нь «байна» гэсэн үг."}],
   "check":{"question":"«Тэр гэртээ байна» хятадаар?","options":["她在家","她去家","她哪儿家"],"answer":"0"},
   "practice":[{"n":1,"question":"我们________家。（Бид гэртээ байна）","answer":"在","explanation_mn":"Байна гэхэд 在."}]},
  {"word":"去","gloss":"qù — явах","explanation":"Хаа нэг газар руу явахыг 去 гэнэ. 去 + газар: 去学校, 去商店. «Явахгүй» гэхдээ 不去.",
   "structure":"хэн + 去 + газар  ·  你去哪儿？","teacher_notes":"不 ард нь 4-р аялгуутай үг ирвэл bú гэж дуудагдана (不去 = bú qù). Хүүхдэд тайлбарлахгүй, аудиог давтуул.",
   "examples":[{"chinese":"我去商店。","pinyin":"Wǒ qù shāngdiàn.","mongolian":"Би дэлгүүр явна."},{"chinese":"我不去学校。","pinyin":"Wǒ bú qù xuéxiào.","mongolian":"Би сургууль руу явахгүй."},{"chinese":"你们去吗？","pinyin":"Nǐmen qù ma?","mongolian":"Та нар явах уу?"}],
   "common_mistakes":[{"wrong":"我去在商店。","right":"我去商店。","why":"去-ийн ард газраа шууд хэлнэ."}],
   "check":{"question":"«Би сургууль руу явна» хятадаар?","options":["我去学校","我在学校吗","我哪儿学校"],"answer":"0"},
   "practice":[{"n":1,"question":"你________哪儿？（Чи хаашаа явах вэ）","answer":"去","explanation_mn":"Явах = 去."}]},
  {"word":"哪儿","gloss":"nǎr — хаана, хаашаа","explanation":"Хаана, хаашаа гэж асуухдаа 哪儿 гэж хэлнэ. Хариулахдаа 哪儿-ийн оронд газраа тавина: 你去哪儿？— 我去商店。",
   "structure":"你去哪儿？ → 我去 + газар","teacher_notes":"哪儿 нь асуух үг тул 吗 хэрэггүй. 你去哪儿吗 гэж хэлэхгүй.",
   "examples":[{"chinese":"你去哪儿？","pinyin":"Nǐ qù nǎr?","mongolian":"Чи хаашаа явах вэ?"},{"chinese":"你们去哪儿？","pinyin":"Nǐmen qù nǎr?","mongolian":"Та нар хаашаа явах вэ?"},{"chinese":"妈妈去哪儿？","pinyin":"Māma qù nǎr?","mongolian":"Ээж хаашаа явах вэ?"}],
   "common_mistakes":[{"wrong":"你去哪儿吗？","right":"你去哪儿？","why":"哪儿 өөрөө асуулт тул 吗 нэмэхгүй."}],
   "check":{"question":"«Чи хаашаа явах вэ?» хятадаар?","options":["你去哪儿？","你去吗？","你在家吗？"],"answer":"0"},
   "practice":[{"n":1,"question":"你去________？—我去商店。","answer":"哪儿","explanation_mn":"Хаашаа гэж асуухад 哪儿."}]},
 ],
 "collocations":[{"type":"在 / 去 + газар","rows":[
   {"head":"在","with":"家","mn":"гэртээ байх","usage_mn":"Хаана байгааг хэлэхэд","example":{"zh":"我们在家。","pinyin":"Wǒmen zài jiā.","mn":"Бид гэртээ байна."}},
   {"head":"在","with":"学校","mn":"сургууль дээр байх","usage_mn":"Хаана байгааг хэлэхэд","example":{"zh":"她在学校。","pinyin":"Tā zài xuéxiào.","mn":"Тэр сургууль дээр байна."}},
   {"head":"去","with":"商店","mn":"дэлгүүр явах","usage_mn":"Хаашаа явахыг хэлэхэд","example":{"zh":"我去商店。","pinyin":"Wǒ qù shāngdiàn.","mn":"Би дэлгүүр явна."}}]}],
 "wordComparison":[{"words":["你","你们"],"diff_mn":"你 = чи (нэг хүн), 你们 = та нар (хоёроос олон). 我 = би, 我们 = бид. 们 нь «олон» гэсэн утга нэмдэг."}],
 "textExercises":{
  "selectWord":{"instruction_mn":"Let's match — асуултад таарах хариултыг ол.","banks":[{"words":["她不在。","我去商店。","我不去学校。"],"items":[
     {"n":1,"question":"你姐姐在家吗？→ ________","answer":"她不在。","explanation_mn":"Эгч байгаа эсэхийг асуулаа. «Тэр байхгүй» гэж хариулна."},
     {"n":2,"question":"你去哪儿？→ ________","answer":"我去商店。","explanation_mn":"Хаашаа гэж асуусан тул газраа хэлнэ."},
     {"n":3,"question":"你去学校吗？→ ________","answer":"我不去学校。","explanation_mn":"Явах уу гэж асуусан. «Явахгүй» гэж хариулна."}]}],
   "answer_source":"textbook (Let's match, х.36; номд хариу байхгүй, утгаар нь тааруулсан)"},
  "comprehension":{"instruction_mn":"Let's read — яриаг сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"他姐姐在家吗？","answer":"不在，她在学校。","explanation_mn":"Хүү «不在，她在学校» гэж хэлсэн."},
     {"n":2,"question_zh":"妈妈去哪儿？","answer":"去商店。","explanation_mn":"Ээж «我去商店» гэсэн."}],
   "answer_source":"textbook_verified"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тогло.","prompts":[
     {"label":"Хаашаа явах вэ? — Нэг нь «你去哪儿？» гэж асууна, нөгөө нь хаа нэг газар (学校, 商店, 家) сонгоод «我去…» гэж хариулна. Дараа нь солино.","start_zh":"你去哪儿？我去……"},
     {"label":"Хаана байна? — Тоглоомоо нууна. Найз «…在哪儿？» гэж асууна. Чи «在这儿» эсвэл «在那儿» гэж заана.","start_zh":"……在这儿！"},
     {"label":"Дуу заах — «鼻子在这儿» дууг дуулж, хамар, чих, нүд, үсээ ээлжлэн зааж бүжиглэ.","start_zh":"鼻子，鼻子，鼻子在这儿。"},
     {"label":"Mini story жүжиглэх — 4 хүн амьтан болж «你们去哪儿？» гэж асууж, «我去学校», «我去商店», «我回家» гэж хариул.","start_zh":"你们去哪儿？"}]}},
 "grammarNotes":[],
 "culture":{"title":"你去哪儿啊？","title_mn":"Хятадуудын мэндчилгээ — «Хаашаа явж байна?»","text_mn":"Хятадад хөршүүд бие биетэйгээ уулзахдаа заримдаа «你去哪儿啊？» гэж асуудаг. Энэ нь «Чи хаашаа явж байна?» гэсэн асуулт боловч бусдын ажилд хутгалдсан хэрэг биш, зүгээр л найрсаг мэндчилгээ. Хариулахдаа «我去商店» гэхэд л хангалттай.","note_mn":"Манайд «Сайн байна уу? Хаачив?» гэж уулзахдаа гэнэт асуудаг шиг."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — хаана байгаа, хаашаа явахаа хэлэх.","topic":"Өнөөдөр хаашаа явах вэ?","discussion":["Хосоороо: нэг нь «你去哪儿？» гэж асууж, нөгөө нь 学校, 商店, 家-ийн аль нэгийг сонгож хариул.","Гэрийн хүмүүсийн хаана байгааг 在-аар хэл: «妈妈在家», «爸爸在学校»."],
   "writing":{"promptChinese":"我去商店。我们在家。","promptMongolian":"Гэрийн даалгавар: ээж, аавтайгаа «你去哪儿？» тоглоом тогло. Маргааш ангидаа ярьж өг.","minChars":"0","requiredWords":["去","在"],"sampleChinese":"我去学校。妈妈在家。","sampleMongolian":"Би сургууль руу явна. Ээж гэртээ байна.","gradingRubric":"Зөв дуудлага, 去/在-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L8 1✗ 2✓ 3✗ 4✓ 5D 6C 7A 8B","parts":[]},
}
dump("texts.json", texts)

# ---------------- GRAMMAR ----------------
def ex(zh,py,mn): return {"chinese":zh,"pinyin":py,"mongolian":mn}
def choice(q,opts,ans,ok,wrong,seed):
    o,i = shuffle(opts,ans,seed); return {"type":"choice","question":q,"options":o,"answer":str(i),"explanation_correct_mn":ok,"explanation_wrong_mn":wrong}
def judge(q,ans,ok,wrong): return {"type":"judge","question":q,"options":["Зөв","Буруу"],"answer":"true" if ans else "false","explanation_correct_mn":ok,"explanation_wrong_mn":wrong}
def chk(q,opts,ans,seed):
    o,i=shuffle(opts,ans,seed); return {"question":q,"options":o,"answer":str(i)}

grammar = [
 {"point":"你姐姐在家吗？ — хаана байна","gloss_mn":"«Чиний эгч гэртээ байна уу?» — хэн нэгэн хаана байгааг асуух, хэлэх",
  "structure":"хэн + 在 + газар + 吗？  ·  不在",
  "teacher_mn":"Найзынхаа гэрт очоод «你姐姐在家吗？» гэж асууж болно. 在 нь «байна» гэсэн үг. Байхгүй бол «不在» гэнэ. Дараа нь хаана байгааг хэлнэ: «她在学校». Жижиг ч гэсэн хэрэгтэй хэллэг шүү!",
  "teacher_notes":"在 + газар бүтцийг гэр, сургууль, дэлгүүрээр давтуул. 吗 асуулт болгоно, 哪儿 өөрөө асуулт тул хамт хэрэглэхгүй.",
  "examples":[ex("你姐姐在家吗？","Nǐ jiějie zài jiā ma?","Чиний эгч гэртээ байна уу?"),ex("不在，她在学校。","Bù zài, tā zài xuéxiào.","Үгүй, тэр сургууль дээр байна."),ex("我们在家。","Wǒmen zài jiā.","Бид гэртээ байна."),ex("鼻子在这儿。","Bízi zài zhèr.","Хамар энд байна. (дуунаас)")],
  "common_mistakes":[{"wrong":"她学校在。","right":"她在学校。","why":"在 нь газрынхаа өмнө орно."},{"wrong":"她不在学校吗？ гэж хариулах","right":"不在，她在学校。","why":"Хариулахдаа асуулт биш, мэдээ хэл."}],
  "check":chk("«Эгч чинь гэртээ байна уу?» хятадаар?",["你姐姐在家吗？","你姐姐去家吗？","你姐姐哪儿？"],"你姐姐在家吗？","g1c"),
  "exercises":[
   choice("A：你姐姐在家吗？ B：不在，她（ ）学校。",["在","去哪儿","谢谢"],"在","Зөв! 她在学校 — тэр сургууль дээр байна.","在 = байна. 去 бол явах.","g1e1"),
   judge("«不在» гэдэг нь «байхгүй» гэсэн үг.",True,"Зөв! 不 = үгүй, 在 = байна.","不在 = байхгүй."),
   choice("«Бид гэртээ байна» хятадаар?",["我们在家","你们去家","我们哪儿家"],"我们在家","Зөв! 我们 = бид, 在 = байна, 家 = гэр.","我们 = бид, 在 = байна.","g1e3")]},
 {"point":"我去商店。 — хаашаа явах","gloss_mn":"«Би дэлгүүр явна» — хаашаа явахаа хэлэх, асуух",
  "structure":"хэн + 去 + газар  ·  你去哪儿？  ·  不去",
  "teacher_mn":"Хаашаа явахаа хэлэхдээ 去 гэнэ. «我去商店» — би дэлгүүр явна. Асуухдаа «你去哪儿？» — чи хаашаа явах вэ? Явахгүй бол «不去» гэнэ. Нэг нь асуу, нөгөө нь хариул!",
  "teacher_notes":"去 + газар гэж шууд хэлнэ, 到/在 хэрэггүй. 哪儿 нь газрын оронд ордог.",
  "examples":[ex("我去商店。","Wǒ qù shāngdiàn.","Би дэлгүүр явна."),ex("你去哪儿？","Nǐ qù nǎr?","Чи хаашаа явах вэ?"),ex("我不去学校。","Wǒ bú qù xuéxiào.","Би сургууль руу явахгүй."),ex("妈妈，我去。","Māma, wǒ qù.","Ээж ээ, би явна.")],
  "common_mistakes":[{"wrong":"我去在商店。","right":"我去商店。","why":"去-ийн ард газраа шууд хэл."}],
  "check":chk("«Чи хаашаа явах вэ?» хятадаар?",["你去哪儿？","你在家吗？","你们去吗？"],"你去哪儿？","g2c"),
  "exercises":[
   choice("A：你去哪儿？ B：我（ ）商店。",["去","在家","谢谢"],"去","Зөв! 我去商店.","Явна гэхэд 去.","g2e1"),
   judge("«你去哪儿？» гэдэг нь «Чи хаана байна?» гэсэн үг.",False,"Зөв! 你去哪儿 = чи хаашаа явах вэ.","你去哪儿 нь явах газрыг асууж байна.")  ,
   choice("«Би сургууль руу явахгүй» хятадаар?",["我不去学校","我去不学校","我不在去学校"],"我不去学校","Зөв! 不去 = явахгүй.","不 нь 去-ийн өмнө орно.","g2e3")]},
 {"point":"你们 · 我们 — «та нар», «бид»","gloss_mn":"们 нэмбэл «олон хүн» болно",
  "structure":"你 → 你们  ·  我 → 我们",
  "teacher_mn":"Нэг хүнд «你» (чи), хоёр ба түүнээс олон хүнд «你们» (та нар) гэнэ. Мөн «我» бол би, «我们» бол бид. «们» гэсэн жижиг хэсгийг нэмбэл олон болдог. Гэр бүлээрээ «我们在家» гэж хэлээд үз!",
  "teacher_notes":"们 нь хүнд л хэрэглэгдэнэ. Хүүхдүүдэд найзуудаа заагаад «你们» гэж давтуул.",
  "examples":[ex("你们去吗？","Nǐmen qù ma?","Та нар явах уу?"),ex("我们在家。","Wǒmen zài jiā.","Бид гэртээ байна."),ex("谢谢你们。","Xièxie nǐmen.","Та нарт баярлалаа."),ex("你们去哪儿？","Nǐmen qù nǎr?","Та нар хаашаа явах вэ?")],
  "common_mistakes":[{"wrong":"我们 гэж ганцаараа хэлэх","right":"Ганцаараа бол 我","why":"我们 = бид, олон хүн."}],
  "check":chk("«Бид» хятадаар?",["我们","你们","我"],"我们","g3c"),
  "exercises":[
   choice("Хоёр найздаа «Та нар явах уу?» гэж хэлэх:",["你们去吗？","你去吗？","我们去吗？"],"你们去吗？","Зөв! 你们 = та нар.","你 = нэг хүн, 我们 = бид.","g3e1"),
   judge("«你们» гэдэг нь нэг хүнд хэлэх үг.",False,"Зөв! 你们 = олон хүн.","你们 = та нар, олон хүнд хэлнэ."),
   choice("«谢谢你们» гэж хэнд хэлэх вэ?",["Хоёр найздаа","Ганц найздаа","Өөртөө"],"Хоёр найздаа","Зөв!","你们 = та нар.","g3e3")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«在» гэж юу вэ?",["байна, -д","явах","хаана","бид"],"байна, -д","在 (zài) = байна — хаана байгааг хэлнэ.","easy",["vocabulary"],"q1")
q("choice","«去» гэж юу вэ?",["явах","байна","баярлалаа","сургууль"],"явах","去 (qù) = явах.","easy",["vocabulary"],"q2")
q("choice","«谢谢» гэж юу вэ?",["баярлалаа","баяртай","сайн уу","та нар"],"баярлалаа","谢谢 (xièxie) = баярлалаа.","easy",["vocabulary"],"q3")
q("choice","«你们» гэж юу вэ?",["та нар","бид","чи","тэд"],"та нар","你们 = та нар.","easy",["vocabulary"],"q4")
q("choice","«我们» гэж юу вэ?",["бид","та нар","би","чи"],"бид","我们 = бид.","easy",["vocabulary"],"q5")
q("choice","«哪儿» гэж юу вэ?",["хаана, хаашаа","энд","тэнд","хэн"],"хаана, хаашаа","哪儿 (nǎr) = хаана, хаашаа.","easy",["vocabulary"],"q6")
q("choice","«学校» гэж юу вэ?",["сургууль","дэлгүүр","гэр","эмнэлэг"],"сургууль","学校 (xuéxiào) = сургууль.","easy",["vocabulary"],"q7")
q("choice","«商店» гэж юу вэ?",["дэлгүүр","сургууль","гэр","багш"],"дэлгүүр","商店 (shāngdiàn) = дэлгүүр.","easy",["vocabulary"],"q8")
q("choice","«Баярлалаа» хятадаар аль нь вэ?",["谢谢","再见","你好","学校"],"谢谢","谢谢 = баярлалаа. 再见 = баяртай.","easy",["vocabulary"],"q9")
q("choice","«Дэлгүүр» хятадаар аль нь вэ?",["商店","学校","老师","鼻子"],"商店","商店 = дэлгүүр. 学校 = сургууль.","easy",["vocabulary"],"q10")
q("choice","«Бид» хятадаар аль нь вэ?",["我们","你们","她","我"],"我们","我们 = бид.","easy",["vocabulary"],"q11")
q("choice","Пиньинь «nǎr» гэж уншдаг үг:",["哪儿","这儿","那儿","在"],"哪儿","哪儿 = nǎr = хаана. 这儿 = zhèr = энд.","medium",["pronunciation"],"q12")
q("choice","Пиньинь «xuéxiào» гэж уншдаг үг:",["学校","商店","谢谢","我们"],"学校","学校 = xuéxiào = сургууль.","medium",["pronunciation"],"q13")
q("choice","Пиньинь «xièxie» гэж уншдаг үг:",["谢谢","学校","再见","商店"],"谢谢","谢谢 = xièxie = баярлалаа.","medium",["pronunciation"],"q14")
q("cloze","小红：你姐姐在家（ ）？",["吗","哪儿","们","去"],"吗","Асуулт болгохын тулд төгсгөлд 吗 нэмнэ.","medium",["dialogue"],"q15")
q("cloze","小明：不在，她（ ）学校。",["在","去哪儿","吗","们"],"在","她在学校 — тэр сургууль дээр байна.","easy",["dialogue"],"q16")
q("cloze","妈妈：我去商店，你们去（ ）？",["吗","哪儿","在","谢谢"],"吗","你们去吗？ — та нар явах уу?","easy",["dialogue"],"q17")
q("cloze","爸爸：不去。我们（ ）家。",["在","去","谢谢","哪儿"],"在","我们在家 — бид гэртээ байна.","easy",["dialogue"],"q18")
q("choice","你姐姐在家吗？ — Зөв хариулт аль нь вэ?",["不在，她在学校。","我去商店。","谢谢你们。","鼻子在这儿。"],"不在，她在学校。","Эгч байгаа эсэхийг асуулаа. «Байхгүй, сургууль дээр байна» гэж хариулна.","medium",["dialogue"],"q19")
q("choice","你去哪儿？ — Зөв хариулт аль нь вэ?",["我去商店。","不在。","谢谢。","她在家。"],"我去商店。","Хаашаа гэж асуусан тул «Би дэлгүүр явна» гэж хариулна.","easy",["usage"],"q20")
q("choice","«Ээж хаашаа явах вэ?» хятадаар:",["妈妈去哪儿？","妈妈在家吗？","妈妈谢谢？","妈妈你们？"],"妈妈去哪儿？","去哪儿 = хаашаа явах вэ.","medium",["usage"],"q21")
q("choice","Дэлгүүр явахаа хэлэх өгүүлбэр аль нь вэ?",["我去商店。","我在商店吗？","我哪儿商店。","我们谢谢。"],"我去商店。","去 + газар.","easy",["usage"],"q22")
q("usage","Найз чинь танд ном өглөө. Юу гэж хэлэх вэ?",["谢谢！","再见！","你去哪儿？","不在。"],"谢谢！","Өгсөнд баярлалаа гэнэ.","easy",["usage"],"q23")
q("usage","Хоёр найздаа хандаж «Та нар явах уу?» гэж асуу:",["你们去吗？","你去吗？","我们去吗？","你们在吗？"],"你们去吗？","你们 = та нар.","medium",["usage"],"q24")
q("choice","«Би дэлгүүр явахгүй» хятадаар:",["我不去商店","我去不商店","我不在商店去","我们不商店"],"我不去商店","不 нь 去-ийн өмнө орно.","medium",["usage"],"q25")
q("choice","Дуунд «鼻子在这儿» гэж юу заадаг вэ?",["Хамар энд байна","Хамар тэнд байна","Хамар явна","Хамар байхгүй"],"Хамар энд байна","鼻子 = хамар, 在这儿 = энд байна.","medium",["song"],"q26")
q("choice","«小手在那儿» гэж юу вэ?",["Бяцхан гар тэнд байна","Бяцхан гар энд байна","Бяцхан гар явна","Бяцхан гар байхгүй"],"Бяцхан гар тэнд байна","那儿 = тэнд (холоос заана).","medium",["song"],"q27")
q("choice","Mini story-д панда «我去商店» гэхэд хаашаа явах вэ?",["Дэлгүүр","Сургууль","Гэр","Эмнэлэг"],"Дэлгүүр","商店 = дэлгүүр. Муур сургууль, нохой гэр рүү явна.","medium",["dialogue"],"q28")
q("choice","Mini story-д нохой «我回家» гэжээ. Тэр хаашаа явах вэ?",["Гэртээ","Сургууль","Дэлгүүр","Эмнэлэг"],"Гэртээ","回家 = гэртээ харих.","medium",["dialogue"],"q29")
q("choice","«耳朵» гэж юу вэ?",["чих","нүд","хамар","үс"],"чих","耳朵 = чих (өмнөх хичээл).","easy",["vocabulary"],"q30")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (08-05) сонсоод зурагтай таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）我去商店。","image":img("t1"),"answer":"✗","script_zh":"我去商店。","explanation_mn":"Аудионд «Би дэлгүүр явна» гэнэ. Зураг дээр хоёр охин сургуулийн ширээнд бичиж байна, дэлгүүр биш. ✗."},
    {"n":2,"question_zh":"（听录音）我在学校。","image":img("t2"),"answer":"✓","script_zh":"我在学校。","explanation_mn":"«Би сургууль дээр байна». Зураг дээр багш болон сурагчид ангид байна. ✓."},
    {"n":3,"question_zh":"（听录音）你的耳朵在这儿。","image":img("t3"),"answer":"✗","script_zh":"你的耳朵在这儿。","explanation_mn":"«Чиний чих энд байна». Зураг дээр эмэгтэй охины хамарт хүрч байна, чихэнд биш. ✗."},
    {"n":4,"question_zh":"（听录音）我去学校，再见。","image":img("t4"),"answer":"✓","script_zh":"我去学校，再见。","explanation_mn":"«Би сургууль руу явна, баяртай». Зураг дээр охин гараа даллаж салах ёс хийж байна. ✓."}],
   "answer_source":"Test Answers х.63: 1✗ 2✓ 3✗ 4✓; Listening script х.61"},
  {"part":2,"type":"choice","instruction_mn":"Унших — өгүүлбэрт таарах зургийг сонго (A/B/C/D).","items":[
    {"n":5,"question_zh":"小鸟在那儿。","options":["A","B","C","D"],"optionImages":[img("tA"),img("tB"),img("tC"),img("tD")],"answer":"D","explanation_mn":"«Шувуу тэнд байна». D зураг дээр охин дээш заагаад байна. A — аав, ээж хүүхдээ савлуулж байна. B — хүү багшдаа юм заав. C — багш, сурагчид ширээнд сууж байна."},
    {"n":6,"question_zh":"你去哪儿？学校？","options":["A","B","C","D"],"optionImages":[img("tA"),img("tB"),img("tC"),img("tD")],"answer":"C","explanation_mn":"«Чи хаашаа явах вэ? Сургууль уу?» C зураг дээр багш, сурагчид ангид байна. A дэлгүүр явж байгаа гэр бүл. B, D өөр юм хийж байна."},
    {"n":7,"question_zh":"她和爸爸妈妈去商店。","options":["A","B","C","D"],"optionImages":[img("tA"),img("tB"),img("tC"),img("tD")],"answer":"A","explanation_mn":"«Тэр аав, ээжтэйгээ дэлгүүр явна». A зураг дээр охин аав, ээжийнхээ гарыг бариад алхаж байна."},
    {"n":8,"question_zh":"老师，中国在这儿。","options":["A","B","C","D"],"optionImages":[img("tA"),img("tB"),img("tC"),img("tD")],"answer":"B","explanation_mn":"«Багш аа, Хятад энд байна». B зураг дээр хүү багшдаа юм зааж өгч байна."}],
   "answer_source":"Test Answers х.63: 5D 6C 7A 8B"},
  {"part":3,"type":"match","instruction_mn":"Let's match — асуулт ба хариултыг холбо.","items":[
    {"n":1,"question_zh":"你姐姐在家吗？","answer":"她不在。","explanation_mn":"Эгч байгаа эсэхийг асуулаа. «Тэр байхгүй» гэж хариулна."},
    {"n":2,"question_zh":"你去哪儿？","answer":"我去商店。","explanation_mn":"Хаашаа гэсэн асуултад газраа хэлнэ."},
    {"n":3,"question_zh":"你去学校吗？","answer":"我不去学校。","explanation_mn":"Явах уу гэж асуусан. «Явахгүй» гэж хариулна."}],
   "answer_source":"textbook х.36 (номд хариу байхгүй, утгаар нь тааруулсан)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Өөрийнхөө дуртай газрыг сонгоод хятадаар бич: «我去…»","question_zh":"我去商店。","answer":"我去商店。","explanation_mn":"去 + газар."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа хаашаа явахыг асуу.","question_zh":"你去哪儿？","answer":"你去哪儿？","explanation_mn":"哪儿 = хаашаа."},
   {"n":2,"prompt_mn":"«我去商店» гэж хариул.","question_zh":"我去商店。","answer":"我去商店。","explanation_mn":"去 + газар."},
   {"n":3,"prompt_mn":"«鼻子在这儿» дууг дуулж биеийнхээ хэсгийг зааж үз.","question_zh":"鼻子，鼻子，鼻子在这儿。","answer":"(нээлттэй)","explanation_mn":"Аудио 08-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 1 · х.61 Test Listening Scripts, х.63 Test Answers (Lesson 8)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WIMG = [("zai","在"),("xiexie","谢谢"),("qu","去"),("nimen","你们"),("women","我们"),("nar","哪儿"),("xuexiao","学校"),("shangdian","商店")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"我去商店。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你姐姐在家吗？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"我去商店，你们去吗？","role":"illustration","section":"dialogue"},
 {"id":"d3","file":"images/d3.jpg","title":"你们去哪儿？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"鼻子在这儿","role":"illustration","section":"song"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WIMG] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1","2","3","4","A","B","C","D"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 8-р хичээл — Би дэлгүүр явна","chineseTitle":"我去商店。","targetTitle":"我去商店。","mongolianTitle":"Би дэлгүүр явна",
 "subtitle":"在 · 去 · 哪儿 · 你们 · 我们 · «鼻子在这儿» дуу · mini story",
 "description":"Хаана байгааг (在), хаашаа явахыг (去) хэлэх, асуух (哪儿). 8 үг, 2 яриа + mini story, 1 дуу, 3 түлхүүр өгүүлбэр, 30 шалгалтын асуулт, номын тест (сонсох 4 + унших 4) — АЛБАН АУДИО, ЗУРАГТАЙ.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🏪","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第8课《我去商店。》 [hskLevel=1] [lessonNumber=8]; эх: YCT1标准教程.pdf х.34–38, х.61 (сонсголын текст), х.63 (хариу); аудио CD 08-01…08-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"我去商店。","mongolianTitle":"Би дэлгүүр явна",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第8课 (сурах бичиг + CD аудио 08-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers х.63)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"song lines",len(song_lines),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
