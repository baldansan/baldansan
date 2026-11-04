#!/usr/bin/env python3
"""YCT 标准教程 1 · 第6课 你的个子真高！ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, shutil, subprocess
BASE = "/home/claude/work/yct1/l06"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-1", "yct-1-l06", 6
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

# ---------------- AUDIO ----------------
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-1-06-{k}.mp3" for k in ("words","text","song","story","test")]
AUD_MAIN = "audio/yct-1-06-text-song.mp3"
for i,k in enumerate(("words","text","song","story","test")):
    if os.path.exists(f"{A}/yct-1-06-0{i+1}.mp3") and not os.path.exists(f"{A}/yct-1-06-{k}.mp3"): shutil.copyfile(f"{A}/yct-1-06-0{i+1}.mp3", f"{A}/yct-1-06-{k}.mp3")
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"{A}/yct-1-06-text.mp3","-i",f"{A}/yct-1-06-song.mp3",
        "-filter_complex","[0:a][1:a]concat=n=2:v=0:a=1[a]","-map","[a]","-b:a","128k",f"{OUT}/{AUD_MAIN}"],check=True)

# ---------------- VOCAB ----------------
VOCAB = [
 ("头发","tóufa","үс","нэр үг · бие","她的头发很长。","Tā de tóufa hěn cháng.","Түүний үс урт байна.",False),
 ("鼻子","bízi","хамар","нэр үг · бие","你的鼻子真长！","Nǐ de bízi zhēn cháng!","Чиний хамар үнэхээр урт юм!",True),
 ("眼睛","yǎnjing","нүд","нэр үг · бие","妹妹的眼睛很小。","Mèimei de yǎnjing hěn xiǎo.","Дүүгийн нүд жижигхэн байна.",True),
 ("手","shǒu","гар","нэр үг · бие","手不大。","Shǒu bú dà.","Гар нь том биш.",False),
 ("耳朵","ěrduo","чих","нэр үг · бие","耳朵很小。","Ěrduo hěn xiǎo.","Чих нь жижигхэн.",False),
 ("的","de","-ын/-ийн (эзэмшил заана)","бүтэц үг · гол үг","妹妹的眼睛","Mèimei de yǎnjing","дүүгийн нүд",True),
 ("小","xiǎo","жижиг","тэмдэг нэр","眼睛很小。","Yǎnjing hěn xiǎo.","Нүд нь жижигхэн.",False),
 ("大","dà","том","тэмдэг нэр","眼睛很大。","Yǎnjing hěn dà.","Нүд нь том.",False),
 ("长","cháng","урт","тэмдэг нэр","你的鼻子真长！","Nǐ de bízi zhēn cháng!","Чиний хамар үнэхээр урт юм!",False),
 ("个子","gèzi","биеийн өндөр","нэр үг · гол үг","你的个子真高！","Nǐ de gèzi zhēn gāo!","Чи үнэхээр өндөр юм аа!",True),
 ("真","zhēn","үнэхээр","дайвар үг","你的个子真高！","Nǐ de gèzi zhēn gāo!","Чи үнэхээр өндөр юм аа!",False),
 ("高","gāo","өндөр","тэмдэг нэр","个子很高。","Gèzi hěn gāo.","Өндөр биетэй.",False),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,
          "exampleMongolian":em,"hskLevel":"YCT 1","keyWord":key,"orderIndex":i+1}
         for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    out=[]
    for t in s.split(" "):
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
    return out
def L(sp,zh,py,mn): return {"speaker":sp,"zh":zh,"pinyin":py,"mn":mn}

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Нялх дүү","scene_mn":"Ах нь шалан дээр хэвтэж, нялх дүүгээ харж байна.","audio":AUD_TEXT,
  "lines":[L("哥哥","妹妹的眼睛很小，耳朵很小，手不大，头发不长。","Mèimei de yǎnjing hěn xiǎo, ěrduo hěn xiǎo, shǒu bú dà, tóufa bù cháng.","Дүү минь нүд нь жижигхэн, чих нь жижигхэн, гар нь том биш, үс нь урт биш.")]},
 {"id":2,"title_mn":"Яриа 2 · Заан ба анааш","scene_mn":"Заан ба анааш нуга дээр уулзаж, бие биеийнхээ тухай ярина.","audio":AUD_TEXT,
  "lines":[L("大象","你的个子真高！","Nǐ de gèzi zhēn gāo!","Чи үнэхээр өндөр юм аа!"),
           L("长颈鹿","你的鼻子真长！","Nǐ de bízi zhēn cháng!","Чиний хамар үнэхээр урт юм аа!")]},
 {"id":3,"title_mn":"Яриа 3 · Мэлхийн төлүүд ээжээ хайна","scene_mn":"Бяцхан мэлхийн төлүүд ээжээ хайж, нугас, загас, яст мэлхийгээс асууна.","audio":AUD_STORY,
  "lines":[L("蝌蚪们","你是我们的妈妈吗？","Nǐ shì wǒmen de māma ma?","Чи манай ээж мөн үү?"),
           L("鸭子","我不是。你们的妈妈眼睛很大。","Wǒ bú shì. Nǐmen de māma yǎnjing hěn dà.","Үгүй ээ. Та нарын ээж нүд нь том."),
           L("蝌蚪们","你是我们的妈妈吗？","Nǐ shì wǒmen de māma ma?","Чи манай ээж мөн үү?"),
           L("鱼","我不是。你们的妈妈有四条腿。","Wǒ bú shì. Nǐmen de māma yǒu sì tiáo tuǐ.","Үгүй ээ. Та нарын ээж дөрвөн хөлтэй."),
           L("蝌蚪们","你是我们的妈妈吗？","Nǐ shì wǒmen de māma ma?","Чи манай ээж мөн үү?"),
           L("乌龟","我不是。你们的妈妈没有尾巴。","Wǒ bú shì. Nǐmen de māma méiyǒu wěiba.","Үгүй ээ. Та нарын ээж сүүлгүй."),
           L("蝌蚪们","你是我们的妈妈吗？","Nǐ shì wǒmen de māma ma?","Чи манай ээж мөн үү?"),
           L("青蛙","我是你们的妈妈。我爱你们。","Wǒ shì nǐmen de māma. Wǒ ài nǐmen.","Би бол та нарын ээж. Би та нарыг хайрлана."),
           L("蝌蚪们","妈妈！妈妈！","Māma! Māma!","Ээж ээ! Ээж ээ!")]},
]

song_lines = [
 ("头、肩膀、膝盖、脚、膝盖、脚，","Tóu, jiānbǎng, xīgài, jiǎo, xīgài, jiǎo,","Толгой, мөр, өвдөг, хөл, өвдөг, хөл,","头|tóu 、| 肩膀|jiānbǎng 、| 膝盖|xīgài 、| 脚|jiǎo 、| 膝盖|xīgài 、| 脚|jiǎo ，|"),
 ("头、肩膀、膝盖、脚、膝盖、脚。","Tóu, jiānbǎng, xīgài, jiǎo, xīgài, jiǎo.","Толгой, мөр, өвдөг, хөл, өвдөг, хөл.","头|tóu 、| 肩膀|jiānbǎng 、| 膝盖|xīgài 、| 脚|jiǎo 、| 膝盖|xīgài 、| 脚|jiǎo 。|"),
 ("眼睛、耳朵、嘴巴和鼻子，","Yǎnjing, ěrduo, zuǐba hé bízi,","Нүд, чих, ам, хамар,","眼睛|yǎnjing 、| 耳朵|ěrduo 、| 嘴巴|zuǐba 和|hé 鼻子|bízi ，|"),
 ("头、肩膀、膝盖、脚、膝盖、脚。","Tóu, jiānbǎng, xīgài, jiǎo, xīgài, jiǎo.","Толгой, мөр, өвдөг, хөл, өвдөг, хөл.","头|tóu 、| 肩膀|jiānbǎng 、| 膝盖|xīgài 、| 脚|jiǎo 、| 膝盖|xīgài 、| 脚|jiǎo 。|"),
]
sentences=[]
dlg_lines=[
 (1,"哥哥：妹妹的眼睛很小，耳朵很小，手不大，头发不长。","Gēge: Mèimei de yǎnjing hěn xiǎo, ěrduo hěn xiǎo, shǒu bú dà, tóufa bù cháng.","Ах: Дүү минь нүд нь жижигхэн, чих нь жижигхэн, гар нь том биш, үс нь урт биш.",
  "哥哥：| 妹妹|mèimei 的|de 眼睛|yǎnjing 很|hěn 小|xiǎo ，| 耳朵|ěrduo 很|hěn 小|xiǎo ，| 手|shǒu 不|bú 大|dà ，| 头发|tóufa 不|bù 长|cháng 。|",
  "妹妹的眼睛很小 — «дүүгийн нүд жижигхэн». «Хэний + юу» гэж хэлэхдээ дундуур нь 的 тавьдаг.",["妹妹的眼睛很小"]),
 (2,"大象：你的个子真高！","Dàxiàng: Nǐ de gèzi zhēn gāo!","Заан: Чи үнэхээр өндөр юм аа!","大象：| 你|nǐ 的|de 个子|gèzi 真|zhēn 高|gāo ！|",
  "真 — «үнэхээр». Гайхахдаа, баярлахдаа хэлнэ. Заан өндөр анаашийг хараад гайхаж байна!",["你的个子真高"]),
 (2,"长颈鹿：你的鼻子真长！","Chángjǐnglù: Nǐ de bízi zhēn cháng!","Анааш: Чиний хамар үнэхээр урт юм аа!","长颈鹿：| 你|nǐ 的|de 鼻子|bízi 真|zhēn 长|cháng ！|",None,[]),
]
for para,zh,py,mn,tk,note,ks in dlg_lines:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note; s["key_structures"]=ks
    sentences.append(s)
for i,(zh,py,mn,tk) in enumerate(song_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Дууны үгэнд бие махбодын хэсгүүд байна: толгой, мөр, өвдөг, хөл. Нэг үг хэлэх бүртээ тэр хэсгээ гараараа барь!"
    sentences.append(s)

texts = {
 "unit":{"number":"6","title":"你的个子真高！","mongolianTitle":"Чи үнэхээр өндөр юм аа! — бие махбодын хэсэг, «хэний юу нь ямар»"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи толгойгоо, нүдээ, чихээ, хамраа хараад үзсэн үү? Өнөөдөр бид өөрийнхөө биеийн хэсгүүдийг хятадаар хэлж сурна: 头发, 眼睛, 鼻子, 耳朵, 手. Дараа нь тэдгээр нь том үү, жижиг үү, урт уу гэдгийг ярина. Заан «你的个子真高!» гэж анаашийг гайхан хэлдэг — чи ч найздаа ингэж хэлж чадна! Бас мэлхийн төлүүд ээжээ хайдаг хөгжилтэй үлгэр сонсоно. Толгой, мөр, өвдөг, хөл дууг хөдөлгөөнтэй дуулъя. Эхэлцгээе!",
  "warmup_mn":"Чиний хамгийн урт зүйл юу вэ — үс үү, хөл үү? Чи найзаасаа өндөр үү, намхан уу? Хоёулаа нуруугаа наалдуулж хэмжээд үз!",
  "theme_zh":"身体部位 · 大小长短 · 个子高","theme_mn":"Бие махбодын хэсэг · том/жижиг/урт · өндөр"},
 "warmup":{"mongolian":"Чи найзаасаа өндөр үү, намхан уу? Хоёулаа нуруугаа наалдуулж хэмжээд үз!"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"6","title":"你的个子真高！","mongolianTitle":"Чи үнэхээр өндөр юм аа! — яриа ба дуу","title_mn":"Let's read · 2 яриа + Let's sing · 身体部位 (дуу)","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第6课 Let's read, Let's sing（CD 06-02, 06-03）","author_zh":"",
  "intro_zh":"哥哥说妹妹。大象和长颈鹿说话。然后唱歌“身体部位”。","intro_mn":"Эхлээд ах нь нялх дүүгийнхээ тухай ярина. Дараа нь заан, анааш хоёр бие биеийнхээ тухай ярина. Эцэст нь «身体部位» дууг гараараа хөдөлгөөн хийж дуулна. Эхлээд аудиог сонс, дараа нь хамт дуул!",
  "sentences":sentences,
  "paragraph_summaries":[{"paragraph":1,"mn":"Яриа 1 — Ах нь шалан дээр хэвтэж нялх дүүгээ хараад «нүд нь жижиг, чих нь жижиг, гар нь том биш, үс нь урт биш» гэж ярьж байна."},{"paragraph":2,"mn":"Яриа 2 — Заан «чи үнэхээр өндөр юм аа» гэхэд анааш «чиний хамар үнэхээр урт юм аа» гэж хариулна."},{"paragraph":3,"mn":"Дуу «身体部位» — толгой, мөр, өвдөг, хөл, нүд, чих, ам, хамар. Үг бүр дээр тэр хэсгээ гараараа барь. Дууг аажмаас хурдан руу дуул!"}],
  "reflection":{"questions_mn":["Дүүгийн нүд том уу, жижиг үү? Үс нь урт уу?","Хэн өндөр бэ — заан уу, анааш уу? Хэний хамар урт вэ?","Мэлхийн төлүүд хэнээс ээжийнхээ тухай асуусан бэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Найзаа тодорхойл","zh":"你的个子真高！你的眼睛很大。","pinyin":"Nǐ de gèzi zhēn gāo! Nǐ de yǎnjing hěn dà.","mn":"Чи үнэхээр өндөр юм аа! Чиний нүд том."},
  "writingPrompt_mn":"Найзаа хараад «很» болон «真» ашиглан хамгийн багадаа хоёр өгүүлбэр хэл. Жишээ нь: «你的眼睛很大。你的个子真高！»"},
 "properNouns":[],
 "wordExplanation":[
  {"word":"的","gloss":"de — «-ын/-ийн» (эзэмшил)","explanation":"«Хэний юу» гэж хэлэхэд хоёр үгийн дунд 的 тавина. 妹妹的眼睛 — дүүгийн нүд. 你的个子 — чиний өндөр. Монголоор «-ын, -ийн» гэдэгтэй төстэй, харин хятадаар үгийн ДУНД орно.",
   "structure":"хэн + 的 + юу","teacher_notes":"的 нь хөнгөн, богино дуудагдана. Хүүхдүүдэд бие махбодын хэсгээ заалгаж «你的……» гэж тоглуулна.",
   "examples":[{"chinese":"妹妹的眼睛很小。","pinyin":"Mèimei de yǎnjing hěn xiǎo.","mongolian":"Дүүгийн нүд жижигхэн."},{"chinese":"你的鼻子真长！","pinyin":"Nǐ de bízi zhēn cháng!","mongolian":"Чиний хамар үнэхээр урт юм аа!"},{"chinese":"你的个子真高！","pinyin":"Nǐ de gèzi zhēn gāo!","mongolian":"Чи үнэхээр өндөр юм аа!"}],
   "common_mistakes":[{"wrong":"的你鼻子","right":"你的鼻子","why":"的 нь хоёр үгийн дунд орно: хэн + 的 + юу."}],
   "check":{"question":"«Чиний чих» хятадаар?","options":["你的耳朵","耳朵你的","的你耳朵"],"answer":"0"},
   "practice":[{"n":1,"question":"Дүүгийн гар: 妹妹________手","answer":"的","explanation_mn":"хэн + 的 + юу."}]},
  {"word":"个子","gloss":"gèzi — биеийн өндөр","explanation":"个子 гэдэг нь хүний биеийн өндөр, нуруу гэсэн үг. 个子很高 — өндөр хүн, 个子不高 — намхан хүн. Заан ч, анааш ч хоёулаа 个子-тай!",
   "structure":"你的个子真高！ · 他的个子不高。","teacher_notes":"Хүнд хэрэглэнэ. Ширээ, байшингийн өндрийг 高 гэж ганцаар хэлдэг.",
   "examples":[{"chinese":"你的个子真高！","pinyin":"Nǐ de gèzi zhēn gāo!","mongolian":"Чи үнэхээр өндөр юм аа!"},{"chinese":"他的个子不高。","pinyin":"Tā de gèzi bù gāo.","mongolian":"Тэр өндөр биш."},{"chinese":"个子很高。","pinyin":"Gèzi hěn gāo.","mongolian":"Өндөр биетэй."}],
   "common_mistakes":[{"wrong":"Байшингийн 个子","right":"Байшин = 高","why":"个子 бол хүний өндөр."}],
   "check":{"question":"Найзынхаа өндрийг магтъя:","options":["你的个子真高！","你的耳朵真高！","你的手真高！"],"answer":"0"},
   "practice":[{"n":1,"question":"Заан анаашид: 你的________真高！","answer":"个子","explanation_mn":"Өндөр = 个子 + 高."}]},
 ],
 "collocations":[{"type":"бие хэсэг + ямар вэ","rows":[
   {"head":"眼睛","with":"大 / 小","mn":"нүд том / жижиг","usage_mn":"Нүдийг тодорхойлно","example":{"zh":"眼睛很大。","pinyin":"Yǎnjing hěn dà.","mn":"Нүд нь том."}},
   {"head":"头发","with":"长","mn":"үс урт","usage_mn":"Үсийг тодорхойлно","example":{"zh":"头发不长。","pinyin":"Tóufa bù cháng.","mn":"Үс нь урт биш."}},
   {"head":"鼻子","with":"长","mn":"хамар урт","usage_mn":"Заан шиг!","example":{"zh":"你的鼻子真长！","pinyin":"Nǐ de bízi zhēn cháng!","mn":"Чиний хамар үнэхээр урт юм аа!"}},
   {"head":"个子","with":"高","mn":"өндөр","usage_mn":"Хүний өндөр","example":{"zh":"个子很高。","pinyin":"Gèzi hěn gāo.","mn":"Өндөр биетэй."}}]}],
 "wordComparison":[{"words":["很","真"],"explanation_mn":"很 — зүгээр л хэлнэ («нүд нь жижиг»). 真 — гайхан, баярлан хэлнэ («үнэхээр өндөр юм аа!»). 高, 长, 大 зэрэг үгийн өмнө тавина."}],
 "textExercises":{
  "selectWord":{"instruction_mn":"Зөв үгийг ол.","banks":[{"words":["的","很","真","不"],"items":[
     {"n":1,"question":"妹妹________眼睛很小。","answer":"的","explanation_mn":"«Дүүгийн нүд» — хоёр үгийн дунд 的."},
     {"n":2,"question":"手________大。(гар том биш)","answer":"不","explanation_mn":"Биш гэхэд 不 тавина."},
     {"n":3,"question":"你的个子________高！(үнэхээр өндөр юм аа!)","answer":"真","explanation_mn":"Гайхахдаа 真."},
     {"n":4,"question":"眼睛________大。(нүд том)","answer":"很","explanation_mn":"Энгийн тодорхойлолтод 很."}]}],
   "answer_source":"agent-authored from textbook sentences"},
  "comprehension":{"instruction_mn":"Зургийг хараад асуултад хариул.","items":[
     {"n":1,"question_zh":"妹妹的眼睛大吗？","answer":"妹妹的眼睛不大，很小。","explanation_mn":"Ах «妹妹的眼睛很小» гэж хэлсэн."},
     {"n":2,"question_zh":"头发长吗？","answer":"头发不长。","explanation_mn":"«头发不长» — үс нь урт биш."},
     {"n":3,"question_zh":"谁的个子高？","answer":"长颈鹿的个子高。","explanation_mn":"Заан «你的个子真高» гэж анаашид хэлсэн."},
     {"n":4,"question_zh":"谁的鼻子长？","answer":"大象的鼻子长。","explanation_mn":"Анааш «你的鼻子真长» гэж заанд хэлсэн."}],
   "answer_source":"textbook questions х.25 (хариуг бид зургаар бичсэн)"},
  "retell":{"instruction_mn":"Тоглоомын заавар","prompts":[
     {"label":"Бие заах (Let's learn)","start_zh":"头发！鼻子！眼睛！手！耳朵！","guide_mn":"Найзтайгаа хос болно. Нэг нь «鼻子!» гэж хэлнэ, нөгөө нь өөрийнхөө хамрыг зааж харуулна. Дараа нь солино. Хурдан хурдан!"},
     {"label":"Найзаа тодорхойл (Pair work)","start_zh":"你的眼睛很大！你的个子真高！","guide_mn":"Найзаа хараад «很» болон «真» ашиглаж хамгийн багадаа хоёр өгүүлбэр хэл. Жишээ нь: «你的眼睛很大。»"},
     {"label":"Зураг зур (Let's draw)","start_zh":"我的朋友的耳朵很大。","guide_mn":"Найз эсвэл амьтны зураг зур. Дараа нь бүх ангид тэр нь том нүдтэй юу, урт хамартай юу гэдгийг хятадаар хэлж танилцуул."},
     {"label":"Ээжээ хайх үлгэр (Mini story)","start_zh":"你是我们的妈妈吗？","guide_mn":"4 хүүхэд болж үлгэрээ жүжигл: мэлхийн төлүүд, нугас, загас, яст мэлхий, мэлхий. Төлүүд «你是我们的妈妈吗？» гэж асууна, бусад нь «我不是。» гэнэ. Эцэст нь мэлхий «我是你们的妈妈。» гэхэд бүгд «妈妈！妈妈！» гэж хашгирна."}]}},
 "grammarNotes":[],
 "culture":{"title":"中国孩子的“量身高”","title_mn":"Хятад хүүхдүүд өндрөө хэмждэг","text_mn":"Хятад гэр бүлүүд хүүхдийнхээ өндрийг хананд эсвэл хаалганы хүрээнд тэмдэглэж хэмждэг! Жил бүр хүүхэд хэр өссөн нь харагддаг. Хятадын сургуулиудад хүүхдүүд өндрөөрөө эгнээд зогсдог бөгөөд намхан хүүхэд урд зогсдог. Чи ч гэртээ хананд өндрөө тэмдэглээд үзээрэй!","note_mn":"Чи ч өөрийнхөө өндрийг хэмжээд, хэр өссөнөө тэмдэглээд үз!"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — бие махбодын хэсэг, том/жижиг/урт/өндөр.","topic":"Найзаа хятадаар тодорхойл!","discussion":["Хосоороо: нэг нь «头发!» гэхэд нөгөө нь үсээ барина, дараа нь «你的头发很长。» гэнэ.","Дуугаа гараараа хөдөлгөөн хийж дуул."],
   "writing":{"promptChinese":"你的个子真高！","promptMongolian":"Гэрийн даалгавар: гэр бүлийнхээ хүнийг хараад «你的……很……» гэж 2 өгүүлбэр хэл.","minChars":"0","requiredWords":["的","很","真"],"sampleChinese":"妈妈的眼睛很大。","sampleMongolian":"Ээжийн нүд том.","gradingRubric":"Зөв дуудлага, 的 ба 很/真-ийг зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L6 1.✓ 2.✗ 3.✓ 4.✗; 5–8 зургаар тодорхойлсон","parts":[]},
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
 {"point":"妹妹的眼睛很小。— хэний юу нь ямар","gloss_mn":"«Дүүгийн нүд жижиг» — хэн + 的 + юу + 很 + ямар",
  "structure":"хэн + 的 + юу + 很 + ямар вэ",
  "teacher_mn":"Хэний ямар зүйл ямар болохыг хэлж сурцгаая. Эхлээд хэний зүйл вэ гэдгийг хэл: 妹妹的眼睛 — дүүгийн нүд. Дараа нь тэр нь ямар вэ гэдгийг нэм: 很小 — жижигхэн. Дундаа 的-г мартуузай!",
  "teacher_notes":"高, 长, 大 зэрэг үгийн өмнө 很 тавина; 很 заавал «маш» гэсэн утгагүй, зүгээр л «нүд нь жижиг». Хүүхдүүдэд найзынхаа биеийн хэсгийг заалгаж хэлүүл.",
  "examples":[ex("妹妹的眼睛很小。","Mèimei de yǎnjing hěn xiǎo.","Дүүгийн нүд жижигхэн."),ex("妹妹的耳朵很小。","Mèimei de ěrduo hěn xiǎo.","Дүүгийн чих жижигхэн."),ex("你们的妈妈眼睛很大。","Nǐmen de māma yǎnjing hěn dà.","Та нарын ээж нүд нь том.")],
  "common_mistakes":[{"wrong":"妹妹眼睛的很小","right":"妹妹的眼睛很小","why":"的 нь хэн ба юу гэсэн хоёр үгийн дунд орно."}],
  "check":chk("«Дүүгийн чих» хятадаар:",["妹妹的耳朵","耳朵妹妹","妹妹耳朵的"],"妹妹的耳朵","g1c"),
  "exercises":[
   choice("你________鼻子很长。",["的","真","不"],"的","Зөв! Чиний хамар — 你的鼻子.","Хэний юу гэхэд 的.","g1e1"),
   judge("«妹妹的头发很长» гэдэг нь «дүүгийн үс урт».",True,"Зөв!","妹妹 = дүү, 头发 = үс, 长 = урт."),
   choice("«Нүд том» хятадаар?",["眼睛很大","眼睛很小","耳朵很大"],"眼睛很大","Зөв!","大 = том, 小 = жижиг, 眼睛 = нүд.","g1e3")]},
 {"point":"你的个子真高！— 真 (үнэхээр)","gloss_mn":"«Чи үнэхээр өндөр юм аа!» — гайхан магтах",
  "structure":"хэн + 的 + юу + 真 + ямар вэ！",
  "teacher_mn":"Ямар нэг зүйлд гайхахдаа 真 гэж хэлдэг. 你的个子真高! — Чи үнэхээр өндөр юм аа! Заан анаашийг хараад ингэж хэлсэн. Чи ч найзаа магтахдаа хэлээрэй!",
  "teacher_notes":"真 ба 很 хоёр 高, 长, 大 зэрэгийн өмнө орно. 真-ийг гайхсан, баярласан өнгөөр хэл.",
  "examples":[ex("你的个子真高！","Nǐ de gèzi zhēn gāo!","Чи үнэхээр өндөр юм аа!"),ex("你的鼻子真长！","Nǐ de bízi zhēn cháng!","Чиний хамар үнэхээр урт юм аа!"),ex("你的耳朵真大！","Nǐ de ěrduo zhēn dà!","Чиний чих үнэхээр том юм аа!")],
  "common_mistakes":[{"wrong":"你的个子高真","right":"你的个子真高","why":"真 нь 高, 长 зэрэг үгийн ӨМНӨ орно."}],
  "check":chk("Заан анаашийг хараад гайхаж хэлнэ:",["你的个子真高！","你的个子不高。","你的手很小。"],"你的个子真高！","g2c"),
  "exercises":[
   choice("你的鼻子________长！(үнэхээр)",["真","的","和"],"真","Зөв! 真 = үнэхээр.","的 = эзэмшил, 和 = ба.","g2e1"),
   judge("«真» гэдэг нь «биш» гэсэн үг.",False,"Зөв — 真 = үнэхээр, 不 = биш.","真 = үнэхээр."),
   choice("«Чи үнэхээр өндөр юм аа!»",["你的个子真高！","你的个子不高。","你的鼻子真长！"],"你的个子真高！","Зөв!","个子 = өндөр, 鼻子 = хамар.","g2e3")]},
 {"point":"不 + ямар вэ — «биш»","gloss_mn":"手不大 — гар том биш; 头发不长 — үс урт биш",
  "structure":"юу + 不 + ямар вэ",
  "teacher_mn":"Ямар нэг зүйл тийм биш гэж хэлэхдээ 高, 长, 大 зэрэг үгийн өмнө 不 тавина. 手不大 — гар том биш. 头发不长 — үс урт биш. Дүүгийн үс богино байна, тэгэхээр 头发不长!",
  "teacher_notes":"不 нь 很-ийн оронд орно: 很大 → 不大 (хоёулаа зэрэг тавихгүй). Асуулт: 大吗？— том уу?",
  "examples":[ex("手不大。","Shǒu bú dà.","Гар том биш."),ex("头发不长。","Tóufa bù cháng.","Үс урт биш."),ex("他的个子不高。","Tā de gèzi bù gāo.","Тэр өндөр биш.")],
  "common_mistakes":[{"wrong":"头发很不长","right":"头发不长","why":"不 ба 很-г хамт тавихгүй."}],
  "check":chk("«Үс урт биш» хятадаар:",["头发不长","头发很长","头发长不"],"头发不长","g3c"),
  "exercises":[
   choice("手________大。(том биш)",["不","真","的"],"不","Зөв!","Биш = 不.","g3e1"),
   judge("«他的个子不高» гэдэг нь «тэр өндөр биш».",True,"Зөв!","不 = биш, 高 = өндөр."),
   choice("«Чих жижиг» хятадаар?",["耳朵很小","耳朵很大","耳朵不小"],"耳朵很小","Зөв!","小 = жижиг.","g3e3")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
for z,py,m,wrong in [("头发","tóufa","үс",["хамар","чих","гар"]),("鼻子","bízi","хамар",["үс","нүд","чих"]),("眼睛","yǎnjing","нүд",["чих","гар","хамар"]),
                     ("手","shǒu","гар",["чих","нүд","үс"]),("耳朵","ěrduo","чих",["гар","хамар","үс"])]:
    q("choice",f"«{z}» ({py}) гэж юу вэ?",[m]+wrong,m,f"{z} = {m}.","easy",["vocabulary"],"qa"+z)
for z,m,wrong in [("小","жижиг",["том","урт","өндөр"]),("大","том",["жижиг","урт","өндөр"]),("长","урт",["жижиг","том","өндөр"]),("高","өндөр",["урт","жижиг","том"]),("真","үнэхээр",["биш","бас","сайн"]),("个子","биеийн өндөр",["хамар","үс","нүд"])]:
    q("choice",f"«{z}» гэдэг үг ямар утгатай вэ?",[m]+wrong,m,f"{z} = {m}.","easy",["vocabulary"],"qb"+z)
q("choice","«Хамар» хятадаар аль нь вэ?",["鼻子","耳朵","眼睛","头发"],"鼻子","鼻子 = хамар.","easy",["vocabulary"],"q15")
q("choice","«Чих» хятадаар аль нь вэ?",["耳朵","手","鼻子","眼睛"],"耳朵","耳朵 = чих.","easy",["vocabulary"],"q16")
q("cloze","妹妹（ ）眼睛很小。",["的","真","不","吗"],"的","Хэний юу гэхэд 的 тавина.","easy",["structure"],"q17")
q("cloze","你的个子（ ）高！(үнэхээр өндөр юм аа!)",["真","不","的","和"],"真","Гайхахдаа 真.","easy",["structure"],"q18")
q("cloze","手（ ）大。(гар том биш)",["不","真","的","吗"],"不","Биш гэхэд 不.","easy",["structure"],"q19")
q("choice","Заан анаашийг хараад юу гэсэн бэ?",["你的个子真高！","你的鼻子真长！","你是我们的妈妈吗？","我爱你们。"],"你的个子真高！","Заан «你的个子真高!» гэж анаашийн өндрийг магтсан.","medium",["dialogue"],"q20")
q("choice","Анааш заанд юу гэсэн бэ?",["你的鼻子真长！","你的个子真高！","我不是。","头发不长。"],"你的鼻子真长！","Анааш заны урт хамрыг магтсан.","medium",["dialogue"],"q21")
q("choice","«妹妹的头发不长。» гэдэг нь:",["Дүүгийн үс урт биш","Дүүгийн үс урт","Дүүгийн нүд том","Дүүгийн чих том"],"Дүүгийн үс урт биш","不长 = урт биш.","medium",["dialogue"],"q22")
q("choice","Мэлхийн төлүүдийн ээжийн нүд ямар вэ? (нугас хэлсэн)",["大","小","长","高"],"大","Нугас «你们的妈妈眼睛很大» гэсэн.","medium",["story"],"q23")
q("choice","Яст мэлхий мэлхийн төлүүдэд ээжийнх нь тухай юу гэж хэлсэн бэ?",["Ээж чинь сүүлгүй (没有尾巴)","Ээж чинь нүд том","Ээж чинь дөрвөн хөлтэй","Ээж чинь өндөр"],"Ээж чинь сүүлгүй (没有尾巴)","乌龟 «你们的妈妈没有尾巴» гэсэн.","hard",["story"],"q24")
q("choice","Мэлхийн төлүүдийн жинхэнэ ээж хэн бэ?",["青蛙 (мэлхий)","鸭子 (нугас)","鱼 (загас)","乌龟 (яст мэлхий)"],"青蛙 (мэлхий)","青蛙 «我是你们的妈妈。我爱你们。» гэсэн.","medium",["story"],"q25")
q("choice","Пиньинь «gèzi» гэж уншдаг үг:",["个子","鼻子","耳朵","眼睛"],"个子","个子 = gèzi.","medium",["pronunciation"],"q26")
q("choice","Пиньинь «yǎnjing» гэж уншдаг үг:",["眼睛","耳朵","头发","手"],"眼睛","眼睛 = yǎnjing = нүд.","medium",["pronunciation"],"q27")
q("usage","Найзынхаа хамар урт байхыг хараад юу гэх вэ?",["你的鼻子真长！","你的鼻子不大。","再见！","你好！"],"你的鼻子真长！","Гайхахдаа 真 + тэмдэг нэр.","medium",["usage"],"q28")
q("usage","Аль хоёр үгийн дунд 的 тавьдаг вэ?",["Хэн + юу (妹妹的眼睛)","Тоо + тоо","Мэндчилгээ","Салах ёс"],"Хэн + юу (妹妹的眼睛)","的 нь эзэмшил заана.","medium",["usage"],"q29")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
SC={"1":"眼睛","2":"头发","3":"手","4":"鼻子"}
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"listening","instruction_mn":"Сонсох — Аудио (06-05) сонсоод, зураг нь сонссон үгтэй таарвал ✓, таарахгүй бол ✗ сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）眼睛","question_mn":"1-р асуулт","options":["✓","✗"],"image":img("t1"),"answer":"✓","script_zh":"眼睛","explanation_mn":"Аудионд «眼睛 — нүд» гэнэ. Зурагт нүд байна → таарч байна ✓."},
    {"n":2,"question_zh":"（听录音）头发","question_mn":"2-р асуулт","options":["✓","✗"],"image":img("t2"),"answer":"✗","script_zh":"头发","explanation_mn":"Аудионд «头发 — үс» гэнэ. Зурагт толгой нь халзан эр байна, үс байхгүй → таарахгүй ✗."},
    {"n":3,"question_zh":"（听录音）手","question_mn":"3-р асуулт","options":["✓","✗"],"image":img("t3"),"answer":"✓","script_zh":"手","explanation_mn":"Аудионд «手 — гар» гэнэ. Зурагт хоёр гар байна → ✓."},
    {"n":4,"question_zh":"（听录音）鼻子","question_mn":"4-р асуулт","options":["✓","✗"],"image":img("t4"),"answer":"✗","script_zh":"鼻子","explanation_mn":"Аудионд «鼻子 — хамар» гэнэ. Зурагт туулайн чих байна (хамар биш) → ✗."}],
   "answer_source":"Test Answers х.63: 1.✓ 2.✗ 3.✓ 4.✗; скрипт 1.眼睛 2.头发 3.手 4.鼻子"},
  {"part":2,"type":"choice","instruction_mn":"Унших — өгүүлбэрийг уншаад тохирох зургийг сонго (A, B, C, D).","items":[
    {"n":5,"question_zh":"我的鼻子很长。","options":["A","B","C","D"],"optionImages":[img("tpa"),img("tpb"),img("tpc"),img("tpd")],"answer":"A","explanation_mn":"«Миний хамар урт» — урт хамартай заан (A). B хүү чихээ таглаж байна, C нь жижиг хүүхэд, D нь урт үстэй охин."},
    {"n":6,"question_zh":"她的头发很长。","options":["A","B","C","D"],"optionImages":[img("tpa"),img("tpb"),img("tpc"),img("tpd")],"answer":"D","explanation_mn":"«Түүний үс урт» — урт үстэй охин (D). Заан, хүү, жижиг хүүхэд биш."},
    {"n":7,"question_zh":"他的个子不高。","options":["A","B","C","D"],"optionImages":[img("tpa"),img("tpb"),img("tpc"),img("tpd")],"answer":"C","explanation_mn":"«Тэр өндөр биш» — том шуудангийн хайрцагны дэргэд жижигхэн хүүхэд (C)."},
    {"n":8,"question_zh":"这是我的耳朵。","options":["A","B","C","D"],"optionImages":[img("tpa"),img("tpb"),img("tpc"),img("tpd")],"answer":"B","explanation_mn":"«Энэ бол миний чих» — хүү хоёр чихээ барьж байна (B)."}],
   "answer_source":"Номд 5–8-ийн албан хариу байхгүй (зургаар тодорхойлсон): 5A 6D 7C 8B"},
  {"part":3,"type":"match","instruction_mn":"Mini story — хэн юу гэснийг холбо.","items":[
    {"n":1,"question_zh":"你们的妈妈眼睛很大。","answer":"鸭子","explanation_mn":"Нугас: «та нарын ээж нүд нь том»."},
    {"n":2,"question_zh":"你们的妈妈有四条腿。","answer":"鱼","explanation_mn":"Загас: «та нарын ээж дөрвөн хөлтэй»."},
    {"n":3,"question_zh":"你们的妈妈没有尾巴。","answer":"乌龟","explanation_mn":"Яст мэлхий: «та нарын ээж сүүлгүй»."},
    {"n":4,"question_zh":"我是你们的妈妈。","answer":"青蛙","explanation_mn":"Мэлхий өөрөө ээж нь."}],
   "answer_source":"textbook х.27 Mini story","image":"images/story.png"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Let's draw — найз эсвэл амьтны зураг зураад, ямар нүдтэй, чихтэй, өндөр уу гэдгийг хятадаар тодорхойл.","question_zh":"他的眼睛很大。","answer":"(нээлттэй)","explanation_mn":"«很» ба «真» ашигла."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзынхаа тухай «很» ба «真» ашиглаж 2 өгүүлбэр хэл.","question_zh":"你的眼睛很大。你的个子真高！","answer":"(нээлттэй)","explanation_mn":"Pair work."},
   {"n":2,"prompt_mn":"Mini story-г 4 хүүхэд болж жүжигл.","question_zh":"你是我们的妈妈吗？","answer":"(нээлттэй)","explanation_mn":"Аудио 06-04."},
   {"n":3,"prompt_mn":"«身体部位» дууг дуул.","question_zh":"头、肩膀、膝盖、脚","answer":"(нээлттэй)","explanation_mn":"Аудио 06-03."}]},
 "answerSource":"YCT 标准教程 1 · х.28 Test, Test Answers (Lesson 6)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
images = [
 {"id":"hero","file":"images/hero.jpg","title":"你的个子真高！","role":"hero","section":"teacher-intro"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in
     [("toufa","头发"),("bizi","鼻子"),("yanjing","眼睛"),("shou","手"),("erduo","耳朵"),("de","的"),("xiao","小"),("da","大"),("chang","长"),("gezi","个子"),("zhen","真"),("gao","高")]] + [
 {"id":"d1","file":"images/d1.jpg","title":"妹妹的眼睛很小","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"你的个子真高","role":"illustration","section":"dialogue"},
 {"id":"d3","file":"images/d3.jpg","title":"小蝌蚪找妈妈","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"身体部位","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"Mini story 小蝌蚪找妈妈","role":"illustration","section":"workbook"},
] + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1","2","3","4","pa","pb","pc","pd"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 6-р хичээл — Чи үнэхээр өндөр юм аа!","chineseTitle":"你的个子真高！","targetTitle":"你的个子真高！","mongolianTitle":"Чи үнэхээр өндөр юм аа!",
 "subtitle":"头发 · 眼睛 · 鼻子 · 耳朵 · 手 · 大小长高 · 身体部位 дуу · мэлхийн төлүүд ээжээ хайна",
 "description":f"Бие махбодын хэсэг, том/жижиг/урт/өндөр. {len(vocab)} үг, {len(dialogues)} яриа, 1 дуу, 3 бүтэц, {len(Q)} шалгалтын асуулт, номын тест (сонсох 4 + унших 4) — албан аудио, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"👀","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第6课《你的个子真高！》 [hskLevel=1] [lessonNumber=6]; х.24–28; аудио CD 06-01…06-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你的个子真高！","mongolianTitle":"Чи үнэхээр өндөр юм аа!",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第6课 (сурах бичиг + CD аудио 06-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"Test 1–4 official (х.63); 5–8 зургаар тодорхойлсон","textStatus":"source_verified (хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулгыг чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"song lines",len(song_lines),"grammar",len(grammar),"quiz",len(Q),"images",len(images))
