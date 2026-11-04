#!/usr/bin/env python3
"""YCT 标准教程 2 · 第3课 你的铅笔呢？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
OUT = "/home/claude/work/yct2/l03/pkg"
CID, LID, N = "yct-2", "yct-2-l03", 3
os.makedirs(f"{OUT}/images", exist_ok=True)

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

# Тестийн зургийг номын х.17 (hi-19.png)-аас хайчлах
from PIL import Image
_pg = Image.open("/home/claude/work/yct2/l03/pages/hi-19.png").convert("RGB")
from PIL import ImageDraw as _ID
_ID.Draw(_pg).rectangle((485,405,517,450),fill=(255,255,255))  # стерж «B» үсэг
_BOX = {"t1a":(300,305,420,445),"t1b":(512,310,680,450),"t1c":(790,315,910,450),"t1d":(990,330,1175,440),
        "t5":(370,1005,580,1165),"t6":(810,1015,1060,1170),"t7":(360,1290,590,1445),"t8":(860,1285,1010,1445)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS)
    _c.save(f"{OUT}/images/{_k}.png")
_st = Image.open("/home/claude/work/yct2/l03/pages/hi-18.png").convert("RGB")
_st.crop((190,300,1215,1530)).save(f"{OUT}/images/story.png")

# audio: яриа (03-02) + chant (03-03)
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-2-03-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-2-03-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-2-03-02.mp3'\nfile '{A}/yct-2-03-03.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
# (zh, py, mn, notes, ex_zh, ex_py, ex_mn, key)
VOCAB = [
 ("房间","fángjiān","өрөө","нэр үг · гол үг","房间里面没有电视。","Fángjiān lǐmian méiyǒu diànshì.","Өрөөнд зурагт байхгүй.",True),
 ("床","chuáng","ор","нэр үг · нэмэлт үг","小床","Xiǎo chuáng","Жижиг ор",False),
 ("电视","diànshì","зурагт","нэр үг · гол үг","电视在哪儿呢？","Diànshì zài nǎr ne?","Зурагт хаана байна вэ?",True),
 ("桌子","zhuōzi","ширээ","нэр үг · гол үг","在桌子上。","Zài zhuōzi shang.","Ширээн дээр байна.",True),
 ("椅子","yǐzi","сандал","нэр үг · гол үг","在椅子上。","Zài yǐzi shang.","Сандал дээр байна.",True),
 ("铅笔","qiānbǐ","харандаа","нэр үг · гол үг","姐姐，你的铅笔呢？","Jiějie, nǐ de qiānbǐ ne?","Эгч ээ, чиний харандаа хаана байна?",True),
 ("书包","shūbāo","цүнх (сургуулийн)","нэр үг · гол үг","在我的书包里。","Zài wǒ de shūbāo lǐ.","Миний цүнхэнд байна.",True),
 ("里面","lǐmian","дотор","байршил · гол үг","房间里面","Fángjiān lǐmian","Өрөөний дотор",True),
 ("上边","shàngbian","дээр","байршил · гол үг","在上边","Zài shàngbian","Дээр байна",True),
 ("矮","ǎi","намхан","шинж үг · нэмэлт үг","小矮人","Xiǎo ǎi rén","Одой хүн",False),
 ("在","zài","байна (хаана байгааг хэлнэ)","үйл үг · гол үг","我的书包在桌子上。","Wǒ de shūbāo zài zhuōzi shang.","Миний цүнх ширээн дээр байна.",True),
 ("哪儿","nǎr","хаана","асуух үг · гол үг","你的书包在哪儿？","Nǐ de shūbāo zài nǎr?","Чиний цүнх хаана байна вэ?",True),
 ("下边","xiàbian","доор","байршил · гол үг","在下边","Zài xiàbian","Доор байна",True),
 ("左边","zuǒbian","зүүн тал","байршил · нэмэлт үг","在左边","Zài zuǒbian","Зүүн талд байна",False),
 ("右边","yòubian","баруун тал","байршил · нэмэлт үг","在右边","Zài yòubian","Баруун талд байна",False),
 ("钱包","qiánbāo","түрийвч","нэр үг · нэмэлт үг","我的钱包呢？","Wǒ de qiánbāo ne?","Миний түрийвч хаана байна?",False),
 ("眼镜","yǎnjìng","нүдний шил","нэр үг · нэмэлт үг","我的眼镜呢？","Wǒ de yǎnjìng ne?","Миний нүдний шил хаана байна?",False),
 ("鼻子","bízi","хамар","нэр үг · нэмэлт үг","在你的鼻子上。","Zài nǐ de bízi shang.","Чиний хамар дээр байна.",False),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 2","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TOKENS ----------------
LEX = {"姐姐":"jiějie","你":"nǐ","的":"de","铅笔":"qiānbǐ","呢":"ne","在":"zài","我":"wǒ","书包":"shūbāo","里":"lǐ","里面":"lǐmian",
 "哪儿":"nǎr","桌子":"zhuōzi","上":"shàng","上边":"shàngbian","下":"xià","下边":"xiàbian","左":"zuǒ","左边":"zuǒbian","右":"yòu","右边":"yòubian",
 "你们":"nǐmen","看":"kàn","这":"zhè","是":"shì","七":"qī","个":"ge","小矮人":"xiǎo ǎi rén","小":"xiǎo","房间":"fángjiān","有":"yǒu","床":"chuáng",
 "和":"hé","椅子":"yǐzi","电视":"diànshì","没有":"méiyǒu","向":"xiàng","妈妈":"māma","爸爸":"bàba","钱包":"qiánbāo","眼镜":"yǎnjìng",
 "鼻子":"bízi","弟弟":"dìdi","什么":"shénme","她":"tā","找":"zhǎo","东西":"dōngxi"}
PUNCT = "，。？！、"
def tok(zh):
    out=[]
    for i in range(len(zh)):
        pass
    # speaker
    if "：" in zh:
        sp,zh = zh.split("：",1); out.append({"zh":sp+"：","py":""})
    i=0; keys=sorted(LEX,key=len,reverse=True)
    while i<len(zh):
        c=zh[i]
        if c in PUNCT: out.append({"zh":c,"py":""}); i+=1; continue
        for k in keys:
            if zh.startswith(k,i):
                out.append({"zh":k,"py":LEX[k]}); i+=len(k); break
        else: raise SystemExit(f"unknown {zh[i:]}")
    return out

# ---------------- TEXTS ----------------
dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Ширээний ард хоёулаа зурж байна","scene_mn":"Хүү эгчтэйгээ ширээний ард зурж сууна. Хүү эгчээсээ харандаа, цүнхийг нь хаана байгааг асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"弟弟","zh":"姐姐，你的铅笔呢？","pinyin":"Jiějie, nǐ de qiānbǐ ne?","mn":"Эгч ээ, чиний харандаа хаана байна?"},
           {"speaker":"姐姐","zh":"在我的书包里。","pinyin":"Zài wǒ de shūbāo lǐ.","mn":"Миний цүнхэнд байна."},
           {"speaker":"弟弟","zh":"你的书包在哪儿？","pinyin":"Nǐ de shūbāo zài nǎr?","mn":"Чиний цүнх хаана байна вэ?"},
           {"speaker":"姐姐","zh":"在桌子上。","pinyin":"Zài zhuōzi shang.","mn":"Ширээн дээр байна."}]},
 {"id":2,"title_mn":"Яриа 2 · Долоон одойн өрөө","scene_mn":"Цасан цагаан гүнж хоёр хүүхдэд долоон одойн өрөөг үзүүлж байна. Өрөөнд жижиг ор, ширээ, сандал бий. Зурагтыг хүүхэд хайна.","audio":AUD_TEXT,
  "lines":[{"speaker":"白雪公主","zh":"你们看，这是七个小矮人的房间，里面有小床、小桌子和小椅子。","pinyin":"Nǐmen kàn, zhè shì qī ge xiǎo ǎi rén de fángjiān, lǐmian yǒu xiǎo chuáng, xiǎo zhuōzi hé xiǎo yǐzi.","mn":"Хараарай, энэ бол долоон одойн өрөө. Дотор нь жижиг ор, жижиг ширээ, жижиг сандал бий."},
           {"speaker":"小明","zh":"电视在哪儿呢？","pinyin":"Diànshì zài nǎr ne?","mn":"Зурагт хаана байна вэ?"},
           {"speaker":"白雪公主","zh":"房间里面没有电视。","pinyin":"Fángjiān lǐmian méiyǒu diànshì.","mn":"Өрөөнд зурагт байхгүй."}]},
]
sentences=[]
def add(para, zh, py, mn, note=None, ks=None):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(zh)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
add(1,"弟弟：姐姐，你的铅笔呢？","Dìdi: Jiějie, nǐ de qiānbǐ ne?","Дүү: Эгч ээ, чиний харандаа хаана байна?","«…呢？» нь «… хаана байна?» гэж асуудаг. 你的铅笔呢？ = Чиний харандаа хаана вэ?",["你的铅笔呢？"])
add(1,"姐姐：在我的书包里。","Jiějie: Zài wǒ de shūbāo lǐ.","Эгч: Миний цүнхэнд байна.","在……里 = «…дотор байна».")
add(1,"弟弟：你的书包在哪儿？","Dìdi: Nǐ de shūbāo zài nǎr?","Дүү: Чиний цүнх хаана байна вэ?","哪儿 = хаана.")
add(1,"姐姐：在桌子上。","Jiějie: Zài zhuōzi shang.","Эгч: Ширээн дээр байна.","在……上 = «…дээр байна».")
add(2,"白雪公主：你们看，这是七个小矮人的房间，里面有小床、小桌子和小椅子。","Báixuě Gōngzhǔ: Nǐmen kàn, zhè shì qī ge xiǎo ǎi rén de fángjiān, lǐmian yǒu xiǎo chuáng, xiǎo zhuōzi hé xiǎo yǐzi.","Цасан цагаан гүнж: Хараарай, энэ бол долоон одойн өрөө. Дотор нь жижиг ор, жижиг ширээ, жижиг сандал бий.","里面有…… = «дотор нь … бий».")
add(2,"小明：电视在哪儿呢？","Xiǎo Míng: Diànshì zài nǎr ne?","Сяо Мин: Зурагт хаана байна вэ?")
add(2,"白雪公主：房间里面没有电视。","Báixuě Gōngzhǔ: Fángjiān lǐmian méiyǒu diànshì.","Цасан цагаан гүнж: Өрөөнд зурагт байхгүй.","没有 = байхгүй.")
story = [
 ("小明：妈妈，我的铅笔呢？","Xiǎo Míng: Māma, wǒ de qiānbǐ ne?","Сяо Мин: Ээж ээ, миний харандаа хаана байна?"),
 ("妈妈：在书包里。","Māma: Zài shūbāo lǐ.","Ээж: Цүнхэнд байна."),
 ("小明：我的书包呢？","Xiǎo Míng: Wǒ de shūbāo ne?","Сяо Мин: Миний цүнх хаана байна?"),
 ("妈妈：在椅子上。","Māma: Zài yǐzi shang.","Ээж: Сандал дээр байна."),
 ("爸爸：我的钱包呢？","Bàba: Wǒ de qiánbāo ne?","Аав: Миний түрийвч хаана байна?"),
 ("妈妈：在房间里。","Māma: Zài fángjiān lǐ.","Ээж: Өрөөнд байна."),
 ("爸爸：我的眼镜呢？","Bàba: Wǒ de yǎnjìng ne?","Аав: Миний нүдний шил хаана байна?"),
 ("妈妈：在你的鼻子上。","Māma: Zài nǐ de bízi shang.","Ээж: Чиний хамар дээр байна."),
]
for i,(zh,py,mn) in enumerate(story):
    add(3,zh,py,mn,"Mini story «找东西» — юмаа хайдаг дөрвөн зураг. 找东西 = юм хайх." if i==0 else ("Аав нүдний шилээ хамар дээрээ зүүчихсэн байж мартсан байна!" if i==7 else None))
chant = [
 ("上，下，左，右，","Shàng, xià, zuǒ, yòu,","Дээш, доош, зүүн, баруун,"),
 ("上，下，左，右，","Shàng, xià, zuǒ, yòu,","Дээш, доош, зүүн, баруун,"),
 ("在上边，在下边，","Zài shàngbian, zài xiàbian,","Дээр байна, доор байна,"),
 ("在左边，在右边，","Zài zuǒbian, zài yòubian,","Зүүн талд, баруун талд,"),
 ("向上看，向下看，","Xiàng shàng kàn, xiàng xià kàn,","Дээшээ хар, доошоо хар,"),
 ("向左看，向右看。","Xiàng zuǒ kàn, xiàng yòu kàn.","Зүүн тийш хар, баруун тийш хар."),
]
for i,(zh,py,mn) in enumerate(chant):
    add(4,zh,py,mn,"Chant «上下左右» — мөр бүрд заасан тийшээ гараа сунгаж, толгойгоо эргүүлж хэл. 向……看 = …тийш хар." if i==0 else None)

texts = {
 "unit":{"number":"3","title":"你的铅笔呢？","mongolianTitle":"Чиний харандаа хаана байна вэ? — юм хаана байгааг хэлэх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ, би Тэмээ багш! Өмнөх номд чи гэр бүл, тоо, амьтдаа хятадаар хэлж сурсан. Харандаагаа олохгүй бол «Миний харандаа хаана байна?» гэж асууна биз дээ! Өнөөдөр «你的铅笔呢？» гэж асууж, «在桌子上» гэж хариулж сурна. Мөн ширээ, сандал, ор, цүнх, зурагт гэх мэт өрөөний юмсыг нэрлэнэ. Дараа нь дээш, доош, зүүн, баруун гэж гараараа заж дуулна. Эхэлцгээе!",
  "warmup_mn":"Чиний цүнх одоо хаана байна вэ? Гараараа заагаад үз. Өрөөнд чинь зурагт байдаг уу?",
  "theme_zh":"房间 · 在哪儿 · 上边 / 里面","theme_mn":"Өрөө · Хаана байна · Дээр / дотор"},
 "warmup":{"mongolian":"Чиний цүнх хаана байна вэ? Өрөөнд чинь ор, ширээ, сандал байдаг уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"3","title":"你的铅笔呢？","mongolianTitle":"Чиний харандаа хаана байна вэ? — яриа, үлгэр, дуу","title_mn":"Let's read · 2 яриа + Mini story + Let's chant · 上下左右","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第3课 Let's read / Mini story / Let's chant（CD 03-02, 03-03, 03-04）","author_zh":"",
  "intro_zh":"两段小对话：你的铅笔呢？电视在哪儿呢？然后读小故事《找东西》，一起唱“上下左右”。",
  "intro_mn":"Эхлээд хоёр яриа: «你的铅笔呢？» гэж харандаагаа хайна. Дараа нь одойн өрөөнд зурагт хайна. Тэгээд «找东西» үлгэрийг уншина. Хамгийн сүүлд «上下左右» дууг гараа заж хэлнэ. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Дүү эгчээсээ харандаа, цүнхийг нь асууна. Харандаа нь цүнхэнд, цүнх нь ширээн дээр байна."},
   {"paragraph":2,"mn":"Яриа 2 — Цасан цагаан гүнж долоон одойн өрөөг үзүүлнэ. Жижиг ор, ширээ, сандал бий, харин зурагт байхгүй."},
   {"paragraph":3,"mn":"Үлгэр «找东西» — хүү харандаа, цүнхээ хайна. Аав түрийвч, нүдний шилээ хайна. Нүдний шил нь аавын хамар дээр байжээ! Аудио: 03-04."},
   {"paragraph":4,"mn":"Chant «上下左右» — дээш, доош, зүүн, баруун гэж заагаад заасан тийшээ хараад дуулна. Аудио: 03-03."}],
  "reflection":{"questions_mn":["Чиний харандаа, цүнх хаана байна? Хятадаар хэлж үз.","Өрөөндөө юу байдаг вэ? Юу байдаггүй вэ?","Гэрийнхэн чинь юмаа хайж байхыг харсан уу?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Юмаа хаана байгааг хэл","zh":"我的书包在桌子上。","pinyin":"Wǒ de shūbāo zài zhuōzi shang.","mn":"Миний цүнх ширээн дээр байна."},
  "writingPrompt_mn":"Өрөөгөө зураад хятадаар хэл: 书包在桌子上。 铅笔在书包里。"},
 "properNouns":[{"zh":"白雪公主","pinyin":"Báixuě Gōngzhǔ","mn":"Цасан цагаан гүнж"},{"zh":"小明","pinyin":"Xiǎo Míng","mn":"Сяо Мин (хүүгийн нэр)"}],
 "wordExplanation":[
  {"word":"在……上 / 里","gloss":"zài … shang / lǐ — дээр / дотор байна","explanation":"Юм хаана байгааг хэлэхдээ «юм + 在 + газар» гэж хэлнэ. Ширээн дээр бол «在桌子上», цүнхэнд бол «在书包里». «上» нь дээр, «里» нь дотор гэсэн үг. Гараараа дээр, дотор гэж зааж хэлээд үз!",
   "structure":"我的书包在桌子上。 → юм + 在 + газар + 上 / 里。","teacher_notes":"Дүрмийн нэр томьёо хэрэглэхгүй. Бодит юмаар үзүүл: харандааг цүнхэнд хий («里»), цүнхийг ширээн дээр тавь («上»). Хүүхэд өөрөө хөдөлгөж хэлэг.",
   "examples":[{"chinese":"我的书包在桌子上。","pinyin":"Wǒ de shūbāo zài zhuōzi shang.","mongolian":"Миний цүнх ширээн дээр байна."},{"chinese":"在我的书包里。","pinyin":"Zài wǒ de shūbāo lǐ.","mongolian":"Миний цүнхэнд байна."},{"chinese":"在椅子上。","pinyin":"Zài yǐzi shang.","mongolian":"Сандал дээр байна."}],
   "common_mistakes":[{"wrong":"书包在上桌子。","right":"书包在桌子上。","why":"«上» нь газрын нэрийн ард орно: 桌子上."}],
   "check":{"question":"«Цүнх ширээн дээр байна» хятадаар:","options":["书包在桌子上。","书包在桌子里。","桌子在书包上。"],"answer":"0"},
   "practice":[{"n":1,"question":"铅笔在书包 ________ 。(дотор)","answer":"里","explanation_mn":"Дотор байвал 里."}]},
  {"word":"你的……呢？ / 哪儿","gloss":"nǐ de … ne? / nǎr — чиний … хаана вэ?","explanation":"Юмаа хайхдаа «你的铅笔呢？» гэж асууна. Хэлний төгсгөлд «呢» нэмбэл «хаана байна вэ?» гэсэн утгатай болно. «哪儿» бол «хаана». Тэгэхээр «你的书包在哪儿？» гэж бас асууж болно.",
   "structure":"你的 + юм + 呢？ / 你的 + юм + 在哪儿？","teacher_notes":"Хүүхдүүд хос болж нэг нь юмаа нууна, нөгөө нь «…呢？» гэж хайна. Хариулахдаа «在……上/里» гэнэ.",
   "examples":[{"chinese":"你的铅笔呢？","pinyin":"Nǐ de qiānbǐ ne?","mongolian":"Чиний харандаа хаана байна?"},{"chinese":"你的书包在哪儿？","pinyin":"Nǐ de shūbāo zài nǎr?","mongolian":"Чиний цүнх хаана байна вэ?"},{"chinese":"电视在哪儿呢？","pinyin":"Diànshì zài nǎr ne?","mongolian":"Зурагт хаана байна вэ?"}],
   "common_mistakes":[{"wrong":"你的书包在什么？","right":"你的书包在哪儿？","why":"Хаана гэж асуухад 哪儿."}],
   "check":{"question":"«Чиний харандаа хаана байна?» хятадаар:","options":["你的铅笔呢？","我的铅笔在桌子上。","房间里面没有电视。"],"answer":"0"},
   "practice":[{"n":1,"question":"你的书包在 ________ ？(хаана)","answer":"哪儿","explanation_mn":"Хаана = 哪儿."}]},
 ],
 "collocations":[{"type":"在 + газар — хаана байна","rows":[
   {"head":"在","with":"桌子上","mn":"ширээн дээр","usage_mn":"Дээр байвал 上","example":{"zh":"在桌子上。","pinyin":"Zài zhuōzi shang.","mn":"Ширээн дээр байна."}},
   {"head":"在","with":"书包里","mn":"цүнхэнд","usage_mn":"Дотор байвал 里","example":{"zh":"在我的书包里。","pinyin":"Zài wǒ de shūbāo lǐ.","mn":"Миний цүнхэнд байна."}},
   {"head":"没有","with":"电视","mn":"зурагт байхгүй","usage_mn":"Байхгүй бол 没有","example":{"zh":"房间里面没有电视。","pinyin":"Fángjiān lǐmian méiyǒu diànshì.","mn":"Өрөөнд зурагт байхгүй."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["哪儿","在","里","上"],"items":[
     {"n":1,"question":"你的书包 ________ 哪儿？","answer":"在","explanation_mn":"«…байна» гэж хаана байгааг хэлэхэд 在."},
     {"n":2,"question":"你的铅笔在 ________ ？","answer":"哪儿","explanation_mn":"«Хаана» гэж асуухад 哪儿."},
     {"n":3,"question":"书包在桌子 ________ 。(дээр)","answer":"上","explanation_mn":"Ширээн дээр — 上."},
     {"n":4,"question":"铅笔在书包 ________ 。(дотор)","answer":"里","explanation_mn":"Цүнхэн дотор — 里."}]}],
   "answer_source":"agent-authored (YCT 2 · 3-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"她的铅笔在哪儿？","answer":"在她的书包里。","explanation_mn":"Яриа 1 — эгч «在我的书包里» гэв."},
     {"n":2,"question_zh":"她的书包呢？","answer":"在桌子上。","explanation_mn":"Яриа 1 — цүнх нь ширээн дээр."},
     {"n":3,"question_zh":"房间里有什么？","answer":"有小床、小桌子和小椅子。","explanation_mn":"Яриа 2 — жижиг ор, ширээ, сандал бий."},
     {"n":4,"question_zh":"没有什么？","answer":"没有电视。","explanation_mn":"Яриа 2 — зурагт байхгүй."}],
   "answer_source":"textbook_verified (Let's read, х.14 Questions)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Үгийн карт — эстафет","start_zh":"铅笔，铅笔，桌子。","instruction_mn":"Таван найзаараа тойрч суугаад тус бүр нэг үгийн карт барь (铅笔, 桌子, 椅子, 书包…). Нэг нь «铅笔，铅笔，桌子» гэж хэлнэ. Тэгвэл «桌子» карт барьсан хүн үргэлжлүүлж, өөр хоёр үгийг хэлнэ. Хурдан байгаарай, алдахгүй!"},
     {"label":"Юмаа хайя","start_zh":"你的铅笔呢？","instruction_mn":"Нэг нь харандаагаа цүнхэнд, ширээн дээр, сандал дээр нууна. Нөгөө нь «你的铅笔呢？» гэж асууна. Нууж буй нь «在……上» эсвэл «在……里» гэж хариулна. Олсон бол хоёулаа ялна!"},
     {"label":"Өрөөгөө зураад танилцуул","start_zh":"书包在桌子上。","instruction_mn":"Цаасан дээр өрөөгөө зур: ор, ширээ, сандал, цүнх. Дараа нь найздаа «书包在桌子上» гэж юм бүрийн байрыг хэлж өг. Найз нь зөв эсэхийг шалгана."},
     {"label":"Үлгэр жүжигчилье","start_zh":"找东西","instruction_mn":"«找东西» үлгэрийг жүжигчилье. Нэг нь юмаа хайгч хүү, нэг нь ээж, нэг нь аав болно. Гараараа толгойгоо маажаад «Хаана билээ?» гэж хайгаарай. Нүдний шилийг хамар дээр нь олохдоо хамтдаа инээ!"}]}},
 "grammarNotes":[],
 "culture":{"title":"桌子 · 椅子 · 床","title_mn":"Хятад хүүхдийн өрөө, монгол хүүхдийн өрөө","text_mn":"Хятадын сургуульд сурагч бүр өөрийн ширээ, сандалтай сууж хичээллэдэг. Номоо, харандаагаа 书包 буюу цүнхэндээ хийж авч явдаг. Монгол гэрт ор, сандал нь хана дагуу байрлаж, голд нь зуух байдаг. Харин Цасан цагаан гүнжийн үлгэрт долоон одой жижигхэн ор, ширээ, сандалтайгаар амьдардаг.","note_mn":"Чиний цүнх хаана байдаг вэ? Ширээн дээр үү, сандал дээр үү, шалан дээр үү?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — өрөөний юмс, хаана байгааг хэлэх.","topic":"Өрөөгөө хятадаар танилцуул","discussion":["Хосоороо: «你的书包在哪儿？» гэж асууж, «在……上/里» гэж хариул.","Бүгдээрээ «上下左右» дууг заасан тийшээ хараад хэл."],
   "writing":{"promptChinese":"我的书包在……。","promptMongolian":"Гэрийн даалгавар: өрөөгөө зураад «书包在桌子上» гэх мэтээр гурван юмны байрыг ээж аавдаа хятадаар хэлж өг.","minChars":"0","requiredWords":["在","上","里"],"sampleChinese":"我的书包在桌子上，铅笔在书包里。","sampleMongolian":"Миний цүнх ширээн дээр, харандаа цүнхэнд байна.","gradingRubric":"在 + газар + 上/里 бүтцийг зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers (х.68/70): L3 1B 2C 3A 4D 5✗ 6✓ 7✗ 8✓","parts":[]},
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
 {"point":"你的铅笔呢？ — хаана байна вэ","gloss_mn":"«Чиний харандаа хаана байна?» — юмаа хайж асуух",
  "structure":"你的 + юм + 呢？ → 在 + газар。",
  "teacher_mn":"Юмаа олохгүй байвал «你的铅笔呢？» гэж асууна. Төгсгөлд нь «呢» гэвэл «хаана вэ?» гэсэн үг. Хариулахдаа «在桌子上» гэх мэтээр хаана байгааг хэлнэ. Гараараа заагаад хэлээд үз!",
  "teacher_notes":"Номын яриа: 姐姐，你的铅笔呢？ 在我的书包里。 Хүүхэд «呢» гэж өгүүлбэрийг төгсгөх нь «хаана вэ» гэж асуудгийг дуурайж сурна.",
  "examples":[ex("你的铅笔呢？","Nǐ de qiānbǐ ne?","Чиний харандаа хаана байна?"),ex("我的书包呢？","Wǒ de shūbāo ne?","Миний цүнх хаана байна?"),ex("我的眼镜呢？","Wǒ de yǎnjìng ne?","Миний нүдний шил хаана байна?"),ex("你的书包在哪儿？","Nǐ de shūbāo zài nǎr?","Чиний цүнх хаана байна вэ?")],
  "common_mistakes":[{"wrong":"铅笔你的呢？","right":"你的铅笔呢？","why":"Дараалал: 你的 → юм → 呢."}],
  "check":chk("Найзаасаа «Чиний харандаа хаана байна?» гэж асуу:",["你的铅笔呢？","我的书包在桌子上。","房间里面没有电视。"],"你的铅笔呢？","g1c"),
  "exercises":[
   choice("你的书包在 ________ ？",["哪儿","里","上"],"哪儿","Зөв! 哪儿 = хаана.","哪儿 = хаана, 里 = дотор, 上 = дээр.","g1e1"),
   choice("我的眼镜 ________ ？",["呢","和","有"],"呢","Зөв! «…呢？» = хаана байна вэ?","Хайж асуухад төгсгөлд 呢.","g1e2"),
   judge("«你的书包在哪儿？» гэдэг нь «Чиний цүнх хаана байна вэ?» гэсэн үг.",True,"Зөв! 哪儿 = хаана.","哪儿 = хаана.")]},
 {"point":"在……上 / 里 — дээр, дотор","gloss_mn":"«дээр байна», «дотор байна»",
  "structure":"юм + 在 + газар + 上 / 里。",
  "teacher_mn":"Юм хаана байгааг хэлэхдээ 在-ийг хэрэглэнэ. Ширээн дээр бол «在桌子上», цүнхэнд бол «在书包里». «上» нь дээр, «里» нь дотор. Харандаагаа цүнхэндээ хийгээд «里» гэж хэл, ширээн дээр тавиад «上» гэж хэл!",
  "teacher_notes":"Номын жишээ: 我的书包在桌子上。 在椅子上。 在房间里。 Бодит юмаар жишээ үзүүл.",
  "examples":[ex("我的书包在桌子上。","Wǒ de shūbāo zài zhuōzi shang.","Миний цүнх ширээн дээр байна."),ex("在我的书包里。","Zài wǒ de shūbāo lǐ.","Миний цүнхэнд байна."),ex("在椅子上。","Zài yǐzi shang.","Сандал дээр байна."),ex("在你的鼻子上。","Zài nǐ de bízi shang.","Чиний хамар дээр байна.")],
  "common_mistakes":[{"wrong":"在上桌子。","right":"在桌子上。","why":"«上» газрын нэрийн ард орно."},{"wrong":"铅笔在书包上。(дотор байхад)","right":"铅笔在书包里。","why":"Дотор байвал 里, дээр байвал 上."}],
  "check":chk("«Харандаа цүнхэнд байна» хятадаар:",["铅笔在书包里。","铅笔在书包上。","书包在铅笔里。"],"铅笔在书包里。","g2c"),
  "exercises":[
   choice("书包在桌子 ________ 。(дээр)",["上","里","哪儿"],"上","Зөв! Ширээн дээр — 上.","Дээр бол 上.","g2e1"),
   choice("铅笔在书包 ________ 。(дотор)",["里","上","呢"],"里","Зөв! Цүнхэнд — 里.","Дотор бол 里.","g2e2"),
   judge("«在椅子上» гэдэг нь «сандал дээр байна» гэсэн үг.",True,"Зөв! 椅子 = сандал, 上 = дээр.","椅子上 = сандал дээр.")]},
 {"point":"没有 — байхгүй","gloss_mn":"«…байхгүй», «里面有…»",
  "structure":"газар + 里面 + 有 / 没有 + юм。",
  "teacher_mn":"Өрөөнд юу байгааг хэлэхдээ «里面有……» гэнэ. Байхгүй бол «没有» гэнэ. «房间里面没有电视» — өрөөнд зурагт байхгүй. Өрөөндөө юу байна, юу байхгүйг хэлээд үз!",
  "teacher_notes":"Номын Questions: 房间里有什么？没有什么？ Хариу: 有小床、小桌子和小椅子，没有电视。",
  "examples":[ex("里面有小床、小桌子和小椅子。","Lǐmian yǒu xiǎo chuáng, xiǎo zhuōzi hé xiǎo yǐzi.","Дотор нь жижиг ор, ширээ, сандал бий."),ex("房间里面没有电视。","Fángjiān lǐmian méiyǒu diànshì.","Өрөөнд зурагт байхгүй."),ex("这里面没有苹果。","Zhè lǐmian méiyǒu píngguǒ.","Энэ дотор алим байхгүй.")],
  "common_mistakes":[{"wrong":"房间里面不有电视。","right":"房间里面没有电视。","why":"«Байхгүй» гэхдээ 没有 гэж хэлнэ."}],
  "check":chk("«Өрөөнд зурагт байхгүй» хятадаар:",["房间里面没有电视。","房间里面有电视。","电视在房间上。"],"房间里面没有电视。","g3c"),
  "exercises":[
   choice("房间里面 ________ 电视。(байхгүй)",["没有","在","哪儿"],"没有","Зөв! 没有 = байхгүй.","Байхгүй бол 没有.","g3e1"),
   choice("里面 ________ 小床。(бий)",["有","呢","上"],"有","Зөв! 有 = бий.","Байгаа бол 有.","g3e2"),
   judge("«没有» гэдэг нь «байхгүй» гэсэн үг.",True,"Зөв! 没有 = байхгүй.","没有 = байхгүй.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Өрөө» хятадаар аль нь вэ?",["房间","桌子","椅子","床"],"房间","房间 (fángjiān) = өрөө.","easy",["vocabulary"],"b1")
q("choice","«Ширээ» хятадаар аль нь вэ?",["桌子","椅子","电视","铅笔"],"桌子","桌子 (zhuōzi) = ширээ.","easy",["vocabulary"],"b2")
q("choice","«Сандал» хятадаар аль нь вэ?",["椅子","桌子","床","书包"],"椅子","椅子 (yǐzi) = сандал.","easy",["vocabulary"],"b3")
q("choice","«Харандаа» хятадаар аль нь вэ?",["铅笔","书包","钱包","眼镜"],"铅笔","铅笔 (qiānbǐ) = харандаа.","easy",["vocabulary"],"b4")
q("choice","«Цүнх (сургуулийн)» хятадаар аль нь вэ?",["书包","钱包","房间","床"],"书包","书包 (shūbāo) = сургуулийн цүнх.","easy",["vocabulary"],"b5")
q("choice","«Зурагт» хятадаар аль нь вэ?",["电视","桌子","房间","眼镜"],"电视","电视 (diànshì) = зурагт.","easy",["vocabulary"],"b6")
q("choice","«Ор» хятадаар аль нь вэ?",["床","椅子","桌子","鼻子"],"床","床 (chuáng) = ор.","medium",["vocabulary"],"b7")
q("choice","«Түрийвч» хятадаар аль нь вэ?",["钱包","书包","铅笔","眼镜"],"钱包","钱包 (qiánbāo) = түрийвч.","medium",["vocabulary"],"b8")
q("choice","«Нүдний шил» хятадаар аль нь вэ?",["眼镜","钱包","鼻子","电视"],"眼镜","眼镜 (yǎnjìng) = нүдний шил.","medium",["vocabulary"],"b9")
q("choice","«哪儿» гэдэг үг ямар утгатай вэ?",["хаана","дээр","дотор","байхгүй"],"хаана","哪儿 (nǎr) = хаана.","easy",["vocabulary"],"b10")
q("choice","«里面» гэдэг үг ямар утгатай вэ?",["дотор","дээр","доор","зүүн тал"],"дотор","里面 (lǐmian) = дотор.","easy",["vocabulary"],"b11")
q("choice","«上边» гэдэг үг ямар утгатай вэ?",["дээр","дотор","доор","баруун тал"],"дээр","上边 (shàngbian) = дээр.","easy",["vocabulary"],"b12")
q("choice","«下边» гэдэг үг ямар утгатай вэ?",["доор","дээр","дотор","зүүн тал"],"доор","下边 (xiàbian) = доор.","medium",["vocabulary"],"b13")
q("choice","«左边» гэдэг үг ямар утгатай вэ?",["зүүн тал","баруун тал","дээр","доор"],"зүүн тал","左边 (zuǒbian) = зүүн тал.","medium",["vocabulary"],"b14")
q("choice","«Чиний харандаа хаана байна?» хятадаар:",["你的铅笔呢？","我的书包在桌子上。","房间里面没有电视。","在椅子上。"],"你的铅笔呢？","«…呢？» = хаана байна вэ?","easy",["dialogue"],"b15")
q("choice","«你的书包在哪儿？» гэж асуувал юу гэж хариулах вэ?",["在桌子上。","你的铅笔呢？","没有。","再见。"],"在桌子上。","Хаана байгааг хэлнэ: 在桌子上.","easy",["dialogue"],"b16")
q("choice","Яриа 1-д эгчийн харандаа хаана байсан бэ?",["书包里","桌子上","椅子上","房间里"],"书包里","在我的书包里 — цүнхэнд.","medium",["dialogue"],"b17")
q("choice","Яриа 2-т өрөөнд юу байхгүй байсан бэ?",["电视","小床","小桌子","小椅子"],"电视","房间里面没有电视 — зурагт байхгүй.","medium",["dialogue"],"b18")
q("cloze","我的书包在桌子（ ）。(дээр)",["上","里","哪儿","呢"],"上","Дээр байвал 上.","easy",["usage"],"b19")
q("cloze","铅笔在书包（ ）。(дотор)",["里","上","哪儿","没有"],"里","Дотор байвал 里.","easy",["usage"],"b20")
q("cloze","你的书包在（ ）？",["哪儿","里","上","有"],"哪儿","Хаана — 哪儿.","easy",["usage"],"b21")
q("cloze","房间里面（ ）电视。(байхгүй)",["没有","在","哪儿","上"],"没有","Байхгүй — 没有.","medium",["usage"],"b22")
q("choice","Mini story-д хүүний цүнх хаана байсан бэ?",["椅子上","书包里","房间里","鼻子上"],"椅子上","在椅子上 — сандал дээр.","medium",["dialogue"],"b23")
q("choice","Mini story-д аавын нүдний шил хаана байсан бэ?",["鼻子上","房间里","桌子上","书包里"],"鼻子上","在你的鼻子上 — хамар дээр!","medium",["dialogue"],"b24")
q("choice","Пиньинь «shūbāo» гэж уншдаг үг:",["书包","铅笔","电视","房间"],"书包","书包 = shūbāo = цүнх.","medium",["pronunciation"],"b25")
q("choice","Пиньинь «qiānbǐ» гэж уншдаг үг:",["铅笔","钱包","桌子","椅子"],"铅笔","铅笔 = qiānbǐ = харандаа.","medium",["pronunciation"],"b26")
q("choice","Пиньинь «diànshì» гэж уншдаг үг:",["电视","房间","眼镜","鼻子"],"电视","电视 = diànshì = зурагт.","medium",["pronunciation"],"b27")
q("choice","Тавилга биш нь аль нь вэ? (ор, ширээ, сандал, ...)",["猫","床","桌子","椅子"],"猫","猫 = муур, амьтан. Бусад нь тавилга.","easy",["vocabulary"],"b28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (03-05) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）这里面没有苹果。","script_zh":"这里面没有苹果。","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"Аудионд «Энэ дотор алим байхгүй». B зураг дээр хоосон хайрцаг байна → B. A-д олон харандаа, C-д цүнх, D-д ширээн дээр муур байна."},
    {"n":2,"question_zh":"（听录音）我的书在书包里。","script_zh":"我的书在书包里。","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"Аудионд «Миний ном цүнхэнд байна». C зураг дээр цүнх байна → C. A харандаа, B хоосон хайрцаг, D муур."},
    {"n":3,"question_zh":"（听录音）我弟弟有很多铅笔。","script_zh":"我弟弟有很多铅笔。","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"Аудионд «Миний дүүд олон харандаа бий». A зураг дээр аяганд олон харандаа байна → A."},
    {"n":4,"question_zh":"（听录音）猫在桌子上。","script_zh":"猫在桌子上。","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"Аудионд «Муур ширээн дээр байна». D зураг дээр ширээн дээр муур сүү уух гэж байна → D."}],
   "answer_source":"Test Answers х.68/70: 1B 2C 3A 4D; Listening script"},
  {"part":2,"type":"judge","instruction_mn":"Унших — зураг өгүүлбэртэй таарч байвал ✓, таарахгүй бол ✗.","items":[
    {"n":5,"question_zh":"看电视","image":img("t5"),"answer":"✗","explanation_mn":"Зураг дээр эмэгтэй сонин уншиж байна, зурагт үзэхгүй байна → ✗. 看电视 = зурагт үзэх."},
    {"n":6,"question_zh":"桌子和椅子","image":img("t6"),"answer":"✓","explanation_mn":"Зураг дээр ширээ ба сандлууд байна → ✓."},
    {"n":7,"question_zh":"在上边","image":img("t7"),"answer":"✗","explanation_mn":"Зураг дээр хуруу доош заасан байна. 上边 = дээр тул ✗."},
    {"n":8,"question_zh":"在里面","image":img("t8"),"answer":"✓","explanation_mn":"Зураг дээр охин хайрцагны дотор сууж байна → ✓. 里面 = дотор."}],
   "answer_source":"Test Answers х.68/70: 5✗ 6✓ 7✗ 8✓"},
  {"part":3,"type":"match","instruction_mn":"Асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"你的铅笔呢？","answer":"在我的书包里。","explanation_mn":"Харандаа хаана байгааг асуусан тул хаана байгааг хэлнэ."},
    {"n":2,"question_zh":"你的书包在哪儿？","answer":"在桌子上。","explanation_mn":"哪儿 = хаана. Цүнх ширээн дээр байна."},
    {"n":3,"question_zh":"电视在哪儿呢？","answer":"房间里面没有电视。","explanation_mn":"Зурагт байхгүй тул «没有» гэж хариулна."}],
   "answer_source":"textbook х.14 (Let's read)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «找东西» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"我的铅笔呢？ — 在书包里。","answer":"1","explanation_mn":"1-р зураг дээр хүү шалан дээр хэвтэж харандаагаа хайж байна."},
    {"n":2,"question_zh":"我的书包呢？ — 在椅子上。","answer":"2","explanation_mn":"2-р зураг дээр цүнх сандал дээр байна."},
    {"n":3,"question_zh":"我的钱包呢？ — 在房间里。","answer":"3","explanation_mn":"3-р зураг дээр шилтэй эр түрийвчээ хайж байна."},
    {"n":4,"question_zh":"我的眼镜呢？ — 在你的鼻子上。","answer":"4","explanation_mn":"4-р зураг дээр эр нүдний шилээ хайж байна."}],
   "answer_source":"textbook х.16 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Let's draw — өрөөгөө зураад юмсын байрыг хятадаар хэл.","question_zh":"书包在桌子上。","answer":"书包在桌子上。","explanation_mn":"Зурсан юм бүрээ «在……上/里» гэж хэл."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа харандааг нь асуу.","question_zh":"你的铅笔呢？","answer":"你的铅笔呢？","explanation_mn":"Хосоороо ээлжлэн асуу, хариул."},
   {"n":2,"prompt_mn":"Өрөөндөө юу байдгийг хэл.","question_zh":"房间里面有……","answer":"房间里面有……","explanation_mn":"Ор, ширээ, сандал гэх мэт нэрлэ."},
   {"n":3,"prompt_mn":"«上下左右» дууг заасан тийшээ хараад хэл.","question_zh":"上，下，左，右","answer":"(нээлттэй)","explanation_mn":"Аудио 03-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 2 · Test Listening Scripts, Test Answers (Lesson 3)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("fangjian","房间"),("chuang","床"),("dianshi","电视"),("zhuozi","桌子"),("yizi","椅子"),("qianbi","铅笔"),("shubao","书包"),("limian","里面"),("shangbian","上边"),("ai","矮"),("zai","在"),("nar","哪儿"),("xiabian","下边"),("zuobian","左边"),("youbian","右边"),("qianbao","钱包"),("yanjing","眼镜"),("bizi","鼻子")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"你的铅笔呢？","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"姐姐，你的铅笔呢？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"房间里面没有电视。","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"上下左右","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.jpg","title":"找东西","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d","5","6","7","8"]] \
  + [{"id":"story-panels","file":"images/story.png","title":"找东西 · Mini story (ном)","role":"illustration","section":"story"}]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 3-р хичээл — Чиний харандаа хаана байна вэ?","chineseTitle":"你的铅笔呢？","targetTitle":"你的铅笔呢？","mongolianTitle":"Чиний харандаа хаана байна вэ?",
 "subtitle":"房间 · 桌子 · 椅子 · 铅笔 · 书包 · 在上边 / 里面 · «上下左右» chant",
 "description":f"Өрөөний юмс (房间 床 桌子 椅子 铅笔 书包 电视), хаана байгааг асуух ба хэлэх (在……上/里, 哪儿, 没有). {len(vocab)} үг, 2 зурагт яриа, Mini story, 1 chant, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"✏️","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第3课《你的铅笔呢？》 [hskLevel=1] [lessonNumber=3]; эх: сурах бичиг х.13–17, х.68/70 (сонсголын текст, хариу); аудио CD 03-01…03-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你的铅笔呢？","mongolianTitle":"Чиний харандаа хаана байна вэ?",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第3课 (сурах бичиг + CD аудио 03-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
