#!/usr/bin/env python3
"""YCT 标准教程 2 · 第6课 包子多少钱一个？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
OUT = "/home/claude/work/yct2/l06/pkg"
CID, LID, N = "yct-2", "yct-2-l06", 6
os.makedirs(OUT, exist_ok=True); os.makedirs(f"{OUT}/images", exist_ok=True)

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

# Тестийн зургийг номын х.32 (hi-34.png)-аас хайчлах (сонсголын A/B/C/D)
from PIL import Image
_pg = Image.open("/home/claude/work/yct2/l06/pages/hi-34.png").convert("RGB")
_BOX = {"t1a":(360,325,515,462),"t1b":(540,325,735,472),"t1c":(780,335,1010,455),"t1d":(1040,345,1240,455)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS)
    _c.save(f"{OUT}/images/{_k}.png")

# audio: яриа (06-02) + chant (06-03) нийлүүлэх
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-2-06-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-2-06-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-2-06-02.mp3'\nfile '{A}/yct-2-06-03.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("钱","qián","мөнгө","нэр үг · гол үг","包子多少钱一个？","Bāozi duōshao qián yí ge?","Баоз нэг нь хэдийн үнэтэй вэ?",True),
 ("茶","chá","цай","нэр үг · гол үг","有绿茶吗？","Yǒu lǜchá ma?","Ногоон цай байна уу?",True),
 ("买","mǎi","худалдаж авах","үйл үг · гол үг","你买什么？","Nǐ mǎi shénme?","Чи юу авах вэ?",True),
 ("多少","duōshao","хэд вэ, хэдэн (тоо, үнийг асуух)","асуух үг · гол үг","多少钱一杯？","Duōshao qián yì bēi?","Нэг аяга нь хэд вэ?",True),
 ("块","kuài","юань (хятад мөнгөний нэгж)","тоолох үг · гол үг","两块钱一个。","Liǎng kuài qián yí ge.","Нэг нь хоёр юань.",True),
 ("杯","bēi","аяга (ундааг тоолох үг)","тоолох үг · нэмэлт үг","一杯茶","Yì bēi chá","Нэг аяга цай",False),
 ("太贵了","tài guì le","үнэтэй байна шүү дээ!","хэллэг · нэмэлт үг","50块？！太贵了！","Wǔshí kuài?! Tài guì le!","50 юань гэнээ?! Үнэтэй байна шүү дээ!",False),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 2","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    out=[]
    for t in s.split(" "):
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Баозын газар","scene_mn":"Шаргал үстэй хүү баозын газарт ирэв. Худалдагч эгчээс баозын үнийг асуугаад, гурвыг нь авна.","audio":AUD_TEXT,
  "lines":[{"speaker":"店员","zh":"你买什么？","pinyin":"Nǐ mǎi shénme?","mn":"Чи юу авах вэ?"},
           {"speaker":"大卫","zh":"包子多少钱一个？","pinyin":"Bāozi duōshao qián yí ge?","mn":"Баоз нэг нь хэд вэ?"},
           {"speaker":"店员","zh":"两块钱一个，5块钱3个。","pinyin":"Liǎng kuài qián yí ge, wǔ kuài qián sān ge.","mn":"Нэг нь 2 юань, гуравтаа 5 юань."},
           {"speaker":"大卫","zh":"我要3个。谢谢！","pinyin":"Wǒ yào sān ge. Xièxie!","mn":"Надад 3 өгөөч. Баярлалаа!"}]},
 {"id":2,"title_mn":"Яриа 2 · Цайны газар","scene_mn":"Нэг ах цайны газарт орж ногоон цай захиалж байна. Үнийг нь сонсоод тэр гайхна.","audio":AUD_TEXT,
  "lines":[{"speaker":"客人","zh":"有绿茶吗？","pinyin":"Yǒu lǜchá ma?","mn":"Ногоон цай байна уу?"},
           {"speaker":"服务员","zh":"有。","pinyin":"Yǒu.","mn":"Байна."},
           {"speaker":"客人","zh":"多少钱一杯？","pinyin":"Duōshao qián yì bēi?","mn":"Нэг аяга нь хэд вэ?"},
           {"speaker":"服务员","zh":"50块。","pinyin":"Wǔshí kuài.","mn":"50 юань."},
           {"speaker":"客人","zh":"50块？！太贵了！","pinyin":"Wǔshí kuài?! Tài guì le!","mn":"50 юань гэнээ?! Үнэтэй байна шүү дээ!"}]},
]
sentences=[]
dlg = [
 (1,"店员：你买什么？","Diànyuán: Nǐ mǎi shénme?","Худалдагч: Чи юу авах вэ?","店员：|  你|nǐ 买|mǎi 什么|shénme ？|","买 = худалдаж авах. 你买什么？ — «Чи юу авах вэ?»",["你买什么？"]),
 (1,"大卫：包子多少钱一个？","Dàwèi: Bāozi duōshao qián yí ge?","Дэвид: Баоз нэг нь хэд вэ?","大卫：| 包子|bāozi 多少|duōshao 钱|qián 一|yí 个|ge ？|","多少钱 = «хэдийн үнэтэй вэ?». 一个 = нэг ширхэг.",["包子多少钱一个？"]),
 (1,"店员：两块钱一个，5块钱3个。","Diànyuán: Liǎng kuài qián yí ge, wǔ kuài qián sān ge.","Худалдагч: Нэг нь 2 юань, гуравтаа 5 юань.","店员：| 两|liǎng 块|kuài 钱|qián 一|yí 个|ge ，| 5| 块|kuài 钱|qián 3| 个|ge 。|","块 = юань. Үнийг «тоо + 块» гэж хэлнэ. 2 гэдгийг энд «两» гэнэ.",["两块钱一个。"]),
 (1,"大卫：我要3个。谢谢！","Dàwèi: Wǒ yào sān ge. Xièxie!","Дэвид: Надад 3 өгөөч. Баярлалаа!","大卫：| 我|wǒ 要|yào 3| 个|ge 。| 谢谢|xièxie ！|","我要…… = «Надад ... өгөөч».",[]),
 (2,"客人：有绿茶吗？","Kèrén: Yǒu lǜchá ma?","Зочин: Ногоон цай байна уу?","客人：| 有|yǒu 绿茶|lǜchá 吗|ma ？|","茶 = цай. 绿茶 = ногоон цай.",["有绿茶吗？"]),
 (2,"服务员：有。","Fúwùyuán: Yǒu.","Зөөгч: Байна.","服务员：| 有|yǒu 。|","",[]),
 (2,"客人：多少钱一杯？","Kèrén: Duōshao qián yì bēi?","Зочин: Нэг аяга нь хэд вэ?","客人：| 多少|duōshao 钱|qián 一|yì 杯|bēi ？|","杯 = аяга. Ундааны хувьд «一杯茶» гэнэ.",["多少钱一杯？"]),
 (2,"服务员：50块。","Fúwùyuán: Wǔshí kuài.","Зөөгч: 50 юань.","服务员：| 50| 块|kuài 。|","",[]),
 (2,"客人：50块？！太贵了！","Kèrén: Wǔshí kuài?! Tài guì le!","Зочин: 50 юань гэнээ?! Үнэтэй байна шүү дээ!","客人：| 50| 块|kuài ？！| 太贵了|tài guì le ！|","太贵了！ — үнэ хэтэрхий өндөр үед хэлдэг хэллэг.",["太贵了！"]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("店员：你好！你买什么？","Diànyuán: Nǐ hǎo! Nǐ mǎi shénme?","Худалдагч: Сайн байна уу! Чи юу авах вэ?","店员：| 你好|nǐ hǎo ！| 你|nǐ 买|mǎi 什么|shénme ？|"),
 ("小明：玫瑰花多少钱一枝？","Xiǎo Míng: Méigui huā duōshao qián yì zhī?","Сяо Мин: Сарнай нэг иш нь хэд вэ?","小明：| 玫瑰花|méigui huā 多少|duōshao 钱|qián 一|yì 枝|zhī ？|"),
 ("店员：10块。","Diànyuán: Shí kuài.","Худалдагч: 10 юань.","店员：| 10| 块|kuài 。|"),
 ("小明：太贵了！昨天5块吧？","Xiǎo Míng: Tài guì le! Zuótiān wǔ kuài ba?","Сяо Мин: Үнэтэй байна шүү дээ! Өчигдөр 5 юань байсан биз дээ?","小明：| 太贵了|tài guì le ！| 昨天|zuótiān 5| 块|kuài 吧|ba ？|"),
 ("店员：对，昨天2月13号，今天2月14号。","Diànyuán: Duì, zuótiān èr yuè shísān hào, jīntiān èr yuè shísì hào.","Худалдагч: Тийм ээ. Өчигдөр 2 сарын 13, өнөөдөр 2 сарын 14 байна.","店员：| 对|duì ，| 昨天|zuótiān 2| 月|yuè 13| 号|hào ，| 今天|jīntiān 2| 月|yuè 14| 号|hào 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «买花» — 3 зурагт богино үлгэр. 买花 = цэцэг авах."
    if i==4: s["note"]="2 сарын 14 — хайрлагчдын өдөр. Тэр өдөр сарнай үнэтэй болдог!"
    sentences.append(s)
chant = [
 ("你拍一，我拍一，一支铅笔一块一；","Nǐ pāi yī, wǒ pāi yī, yì zhī qiānbǐ yí kuài yī;","Чи нэгийг ольё, би нэгийг ольё, нэг харандаа нэг юань;","你|nǐ 拍|pāi 一|yī ，| 我|wǒ 拍|pāi 一|yī ，| 一|yì 支|zhī 铅笔|qiānbǐ 一|yí 块|kuài 一|yī ；|"),
 ("你拍二，我拍二，两支铅笔两块二；","Nǐ pāi èr, wǒ pāi èr, liǎng zhī qiānbǐ liǎng kuài èr;","Чи хоёрыг ольё, би хоёрыг ольё, хоёр харандаа хоёр юань хоёр;","你|nǐ 拍|pāi 二|èr ，| 我|wǒ 拍|pāi 二|èr ，| 两|liǎng 支|zhī 铅笔|qiānbǐ 两|liǎng 块|kuài 二|èr ；|"),
 ("你拍三，我拍三，三支铅笔三块三；","Nǐ pāi sān, wǒ pāi sān, sān zhī qiānbǐ sān kuài sān;","Чи гурвыг ольё, би гурвыг ольё, гурван харандаа гурван юань гуравны;","你|nǐ 拍|pāi 三|sān ，| 我|wǒ 拍|pāi 三|sān ，| 三|sān 支|zhī 铅笔|qiānbǐ 三|sān 块|kuài 三|sān ；|"),
 ("你拍四，我拍四，四支铅笔四块四；","Nǐ pāi sì, wǒ pāi sì, sì zhī qiānbǐ sì kuài sì;","Чи дөрвийг ольё, би дөрвийг ольё, дөрвөн харандаа дөрвөн юань дөрвийн;","你|nǐ 拍|pāi 四|sì ，| 我|wǒ 拍|pāi 四|sì ，| 四|sì 支|zhī 铅笔|qiānbǐ 四|sì 块|kuài 四|sì ；|"),
 ("你拍五，我拍五，五支铅笔五块五！","Nǐ pāi wǔ, wǒ pāi wǔ, wǔ zhī qiānbǐ wǔ kuài wǔ!","Чи тавыг ольё, би тавыг ольё, таван харандаа таван юань тавны!","你|nǐ 拍|pāi 五|wǔ ，| 我|wǒ 拍|pāi 五|wǔ ，| 五|wǔ 支|zhī 铅笔|qiānbǐ 五|wǔ 块|kuài 五|wǔ ！|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Chant «你拍一» — найзтайгаа хоёулаа алга ташиж, тоо бүрийг хэлнэ. 拍 = алгадах, алга таших. 支 = харандаа тоолох үг."
    sentences.append(s)

texts = {
 "unit":{"number":"6","title":"包子多少钱一个？","mongolianTitle":"Баоз нэг нь хэд вэ? — дэлгүүрт үнэ асуух"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, найзууд аа! Би Тэмээ багш. Чи YCT 1-д хоол, тоо, гэр бүлийн үгсийг сурсан. Одоо дэлгүүрт орж юм авахаа сурна! Өнөөдөр «包子多少钱一个？» гэж үнэ асууна. Хариулахдаа «两块钱一个» гэж хэлнэ. «块» гэдэг нь хятадын мөнгөний нэгж — юань. Сүүлд нь «太贵了！» гэж үнэтэй байвал гайхаж хэлнэ. Ээж аавтайгаа дэлгүүр орохдоо хятадаар үнэ асуугаад үз! Эхэлцгээе!",
  "warmup_mn":"Чи хамгийн сүүлд дэлгүүрт юу авсан бэ? Нэг боов хэдэн төгрөг байсан бэ?",
  "theme_zh":"买东西 · 多少钱 · 块","theme_mn":"Дэлгүүр · Хэд вэ · Юань"},
 "warmup":{"mongolian":"Чи дэлгүүрт юу авч байсан бэ? Үнийг нь хэлж чадах уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"6","title":"包子多少钱一个？","mongolianTitle":"Баоз нэг нь хэд вэ? — яриа, үлгэр, дуу","title_mn":"Let's read · 2 яриа + Mini story + Let's chant · 你拍一","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第6课 Let's read / Mini story / Let's chant（CD 06-02, 06-03, 06-04）","author_zh":"",
  "intro_zh":"两段对话：买包子，买茶。再读小故事《买花》，最后一起拍手唱“你拍一”。",
  "intro_mn":"Эхлээд хоёр яриа: баоз авна, цай авна. Үнийг нь асууж «太贵了！» гэж гайхна. Дараа нь «Цэцэг авсан нь» үлгэрийг уншина. Хамгийн сүүлд «你拍一» дууг найзтайгаа алга таших хэлбэрээр хэлнэ. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Баозын газарт хүү үнэ асууна. Нэг баоз 2 юань, гурав нь 5 юань. Хүү гурвыг нь авна."},
   {"paragraph":2,"mn":"Яриа 2 — Цайны газарт ногоон цай нэг аяга 50 юань гэнэ. Зочин «太贵了！» гэж гайхна."},
   {"paragraph":3,"mn":"Үлгэр «Цэцэг авсан нь» — Сяо Мин сарнай авах гэтэл 10 юань гэнэ. Өчигдөр 5 юань байсан. Өнөөдөр 2 сарын 14 учраас үнэтэй болсон. Аудио: 06-04."},
   {"paragraph":4,"mn":"Chant «你拍一» — найзтайгаа алга таашиж нэгээс тавын тоог хэлнэ. Нэг харандаа нэг юань, хоёр харандаа хоёр юань гэх мэт. Аудио: 06-03."}],
  "reflection":{"questions_mn":["Баоз нэг нь хэд вэ гэж хятадаар асууж үз.","Юу ч гэсэн үнэтэй санагдвал «太贵了！» гэж хэл.","Чи өөрийн цээжээр 1-ээс 5 хүртэл хятадаар тоолж чадах уу?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Үнэ асуу","zh":"包子多少钱一个？两块钱一个。","pinyin":"Bāozi duōshao qián yí ge? Liǎng kuài qián yí ge.","mn":"Баоз нэг нь хэд вэ? Нэг нь хоёр юань."},
  "writingPrompt_mn":"Гэртээ жижиг дэлгүүр нээгээд найзтайгаа тоглоорой: «……多少钱一个？ ……块钱一个。»"},
 "properNouns":[{"zh":"大卫","pinyin":"Dàwèi","mn":"Дэвид"},{"zh":"小明","pinyin":"Xiǎo Míng","mn":"Сяо Мин"}],
 "wordExplanation":[
  {"word":"多少钱","gloss":"duōshao qián — хэд вэ, хэдийн үнэтэй вэ","explanation":"Дэлгүүрт юмны үнийг асуухдаа «多少钱？» гэнэ. «包子多少钱一个？» гэвэл «Баоз нэг нь хэд вэ?» гэсэн үг. Хариулахдаа «两块钱一个» гэж хэлнэ. Тоо болон 块 гэдэг үгийг дэс дараатай нь хэлээрэй.",
   "structure":"…… 多少钱 一个/一杯？ → ……块钱一个。","teacher_notes":"Хүүхдэд «多少 = хэд, хэдэн» гэж л хэл. Жинхэнэ жижиг дэлгүүр тоглуулж мөнгөн дэвсгэрт (цаас) ашиглавал сайн.",
   "examples":[{"chinese":"包子多少钱一个？","pinyin":"Bāozi duōshao qián yí ge?","mongolian":"Баоз нэг нь хэд вэ?"},{"chinese":"多少钱一杯？","pinyin":"Duōshao qián yì bēi?","mongolian":"Нэг аяга нь хэд вэ?"},{"chinese":"两块钱一个。","pinyin":"Liǎng kuài qián yí ge.","mongolian":"Нэг нь хоёр юань."}],
   "common_mistakes":[{"wrong":"包子钱多少一个？","right":"包子多少钱一个？","why":"Дараалал: 多少 → 钱 → 一个."}],
   "check":{"question":"«Нэг аяга нь хэд вэ?» хятадаар:","options":["多少钱一杯？","你买什么？","太贵了！"],"answer":"0"},
   "practice":[{"n":1,"question":"包子 ________ 钱一个？(хэд)","answer":"多少","explanation_mn":"Үнийг асуухад 多少钱."}]},
  {"word":"块 · 两块","gloss":"kuài — юань","explanation":"Хятадад мөнгийг «юань» гэдэг, ярианд «块» гэнэ. 1 块, 5 块, 10 块, 50 块, 100 块 гэсэн мөнгөн дэвсгэртүүд байдаг. 2 юаниа «二块» гэлгүй «两块» гэж хэлнэ.",
   "structure":"тоо + 块 (钱)","teacher_notes":"Номын «Let's know RMB» хуудсанд 1, 5, 10, 20, 50, 100 块-ийн дэвсгэртийг үзүүл. 两 vs 二-г жишээгээр л хэл, дүрмийн нэр томьёогүй.",
   "examples":[{"chinese":"一块","pinyin":"yí kuài","mongolian":"1 юань"},{"chinese":"两块钱","pinyin":"liǎng kuài qián","mongolian":"2 юань"},{"chinese":"50块","pinyin":"wǔshí kuài","mongolian":"50 юань"}],
   "common_mistakes":[{"wrong":"二块钱一个","right":"两块钱一个","why":"2 юаниа «两块» гэж хэлдэг."}],
   "check":{"question":"«2 юань» хятадаар:","options":["两块","三块","五块"],"answer":"0"},
   "practice":[{"n":1,"question":"5 ________ 钱 3 个。(юань)","answer":"块","explanation_mn":"Мөнгөний нэгж 块."}]},
 ],
 "collocations":[{"type":"买 + юу — худалдаж авах","rows":[
   {"head":"买","with":"包子","mn":"баоз авах","usage_mn":"Юм авахад","example":{"zh":"你买什么？","pinyin":"Nǐ mǎi shénme?","mn":"Чи юу авах вэ?"}},
   {"head":"一杯","with":"茶","mn":"нэг аяга цай","usage_mn":"Ундааг тоолоход 杯","example":{"zh":"多少钱一杯？","pinyin":"Duōshao qián yì bēi?","mn":"Нэг аяга нь хэд вэ?"}},
   {"head":"太","with":"贵了","mn":"үнэтэй байна шүү дээ","usage_mn":"Үнэ өндөр үед гайхаж хэлнэ","example":{"zh":"50块？！太贵了！","pinyin":"Wǔshí kuài?! Tài guì le!","mn":"50 юань гэнээ?! Үнэтэй байна шүү дээ!"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["买","多少","块","茶"],"items":[
     {"n":1,"question":"你 ________ 什么？","answer":"买","explanation_mn":"«Юу авах вэ?» — 买."},
     {"n":2,"question":"包子 ________ 钱一个？","answer":"多少","explanation_mn":"Үнийг асуухад 多少."},
     {"n":3,"question":"两 ________ 钱一个。","answer":"块","explanation_mn":"Мөнгөний нэгж 块."},
     {"n":4,"question":"有绿 ________ 吗？","answer":"茶","explanation_mn":"绿茶 = ногоон цай."}]}],
   "answer_source":"Test х.32 (Reading 5–8): 5.B 6.A 7.C 8.D дээр тулгуурласан"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"3个包子多少钱？","answer":"5块钱。","explanation_mn":"Яриа 1 — «5块钱3个»: гурван баоз 5 юань."},
     {"n":2,"question_zh":"绿茶多少钱一杯？","answer":"50块。","explanation_mn":"Яриа 2 — зөөгч «50块» гэв."}],
   "answer_source":"textbook_verified (Let's read, х.29)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэр бүлтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Жижиг дэлгүүр тоглоё","start_zh":"包子多少钱一个？","instruction_mn":"Нэг нь худалдагч, нөгөө нь худалдан авагч. Цаасаар мөнгө, тоглоомоор бараа бэлд. «……多少钱一个？» гэж асуугаад «……块钱一个» гэж хариул. Сүүлд нь ээлжээ солиорой."},
     {"label":"Цайны газар тоглоё","start_zh":"有绿茶吗？","instruction_mn":"Нэг нь зочин, нөгөө нь зөөгч. «有绿茶吗？ 多少钱一杯？» гэж асуу. Үнийг нь сонсоод «太贵了！» гэж гайхаж хэлээрэй!"},
     {"label":"Цуурайн тоглоом","start_zh":"钱 茶 买 多少 块","instruction_mn":"Нэг нь үг хэлнэ. Бусад нь чанга дуугаар давтаад, дараа нь аажмаар сулдан сул дуугаар шивнэж давтана. Хамгийн сүүлд шинэ үг сонго."},
     {"label":"«你拍一» алга ташилт","start_zh":"你拍一，我拍一","instruction_mn":"Найзтайгаа нүүр тулж зогсоод «你拍一，我拍一» гэж хэлэхдээ алга ташаарай. 1-ээс 5 хүртэл дуулж үз!"}]}},
 "grammarNotes":[],
 "culture":{"title":"人民币 · 块","title_mn":"Хятадын мөнгө — юань","text_mn":"Хятадад мөнгийг «人民币» (юань) гэдэг. Ярианд хүмүүс «块» гэж хэлнэ. 1, 5, 10, 20, 50, 100 юаний дэвсгэрт байдаг. Бүх дэвсгэртийн урд талд Мао Зэдуны зураг байдаг. Манайд төгрөг байдаг шиг тэдэнд юань байдаг юм.","note_mn":"Чи төгрөгөө хэрхэн нэрлэдэг вэ? Монголд «мянга» гэж ярьдаг шиг, хятадад «块» гэж ярьдаг."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — дэлгүүрт үнэ асуух, мөнгөний тоо хэлэх.","topic":"Дэлгүүрт хятадаар үнэ асуу","discussion":["Хосоороо дэлгүүр тоглоорой: «多少钱一个？» гэж асуугаад «……块钱一个» гэж хариул.","Бүгдээрээ «你拍一，我拍一» дууг алга таашиж хэл."],
   "writing":{"promptChinese":"多少钱一个？","promptMongolian":"Гэрийн даалгавар: гэртээ 3 зүйлийн үнийг цаасан дээр бичээд «……多少钱一个？ ……块钱一个» гэж ээж аавтайгаа тоглоорой.","minChars":"0","requiredWords":["买","多少","块"],"sampleChinese":"包子多少钱一个？两块钱一个。","sampleMongolian":"Баоз нэг нь хэд вэ? Нэг нь хоёр юань.","gradingRubric":"多少钱 ба 块-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers (L6): 1.B 2.D 3.C 4.A 5.B 6.A 7.C 8.D","parts":[]},
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
 {"point":"包子多少钱一个？ — үнэ асуух","gloss_mn":"«Баоз нэг нь хэд вэ?» — юмны үнийг асууна",
  "structure":"……多少钱一个？ → ……块钱一个。",
  "teacher_mn":"Дэлгүүрт юмны үнийг мэдэхийг хүсвэл «多少钱？» гэж асууна. «包子多少钱一个？» — баоз нэг нь хэд вэ? Хариулахдаа «两块钱一个» гэнэ. Юмаа заагаад асуугаад үз!",
  "teacher_notes":"Номын Key sentences: 包子多少钱一个？两块钱一个。 Мөн 多少钱一杯？ (цай).",
  "examples":[ex("包子多少钱一个？","Bāozi duōshao qián yí ge?","Баоз нэг нь хэд вэ?"),ex("两块钱一个。","Liǎng kuài qián yí ge.","Нэг нь хоёр юань."),ex("多少钱一杯？","Duōshao qián yì bēi?","Нэг аяга нь хэд вэ?"),ex("玫瑰花多少钱一枝？","Méigui huā duōshao qián yì zhī?","Сарнай нэг иш нь хэд вэ?")],
  "common_mistakes":[{"wrong":"包子钱多少一个？","right":"包子多少钱一个？","why":"Дараалал: 多少 → 钱."}],
  "check":chk("«Баоз нэг нь хэд вэ?» гэж асуу:",["包子多少钱一个？","你买什么？","太贵了！"],"包子多少钱一个？","g1c"),
  "exercises":[
   choice("包子 ________ 钱一个？",["多少","买","茶"],"多少","Зөв! 多少 = хэд.","多少 = хэд, 买 = авах, 茶 = цай.","g1e1"),
   choice("«Нэг аяга нь хэд вэ?»",["多少钱一杯？","你买什么？","有绿茶吗？"],"多少钱一杯？","Зөв! 杯 = аяга.","Үнийг асуухдаа 多少钱.","g1e2"),
   judge("«多少钱？» гэдэг нь «Хэд вэ, үнэ нь хэд вэ?» гэсэн үг.",True,"Зөв! 钱 = мөнгө, 多少 = хэд.","多少钱 нь үнийг асууна.")]},
 {"point":"块 — юань, мөнгөний тоо","gloss_mn":"«юань» гэж хэлэх",
  "structure":"тоо + 块 (钱)",
  "teacher_mn":"Хятадад мөнгийг «块» гэж тоолно. 1 юань = «一块», 5 юань = «五块», 50 юань = «五十块». 2 юаниа «两块» гэж хэлдэг. Цаасан мөнгөөр тоолоод үз!",
  "teacher_notes":"Let's know RMB: 一块 五块 十块 二十块 五十块 一百块. 两 нь 2-ыг тоолох үед.",
  "examples":[ex("五块","wǔ kuài","5 юань"),ex("两块钱","liǎng kuài qián","2 юань"),ex("50块。","Wǔshí kuài.","50 юань."),ex("5块钱3个。","Wǔ kuài qián sān ge.","Гуравтаа 5 юань.")],
  "common_mistakes":[{"wrong":"二块钱","right":"两块钱","why":"2 юаниа 两块 гэж хэлнэ."}],
  "check":chk("«2 юань» хятадаар:",["两块钱","三块钱","五块钱"],"两块钱","g2c"),
  "exercises":[
   choice("五 ________ 钱三个。",["块","茶","买"],"块","Зөв! 块 = юань.","Мөнгөний нэгж 块.","g2e1"),
   choice("«50 юань» хятадаар:",["五十块","五块","十块"],"五十块","Зөв! 五十 = 50.","五十 = 50, 五 = 5, 十 = 10.","g2e2"),
   judge("«两块钱» гэдэг нь «2 юань» гэсэн үг.",True,"Зөв! 两 = 2.","两 = 2.")]},
 {"point":"你买什么？ · 太贵了！","gloss_mn":"«Чи юу авах вэ?» ба «Үнэтэй байна шүү дээ!»",
  "structure":"你买什么？ → 我要……  ·  太贵了！",
  "teacher_mn":"Худалдагч «你买什么？» гэж асууна. Чи «我要3个» гэж хариулна. Хэрвээ үнэ хэтэрхий өндөр бол «太贵了！» гэж хэлнэ. Нүдээ томруулж гайхаад хэлээрэй!",
  "teacher_notes":"买 = авах. 太贵了 — үнэ хэтэрхий өндөр. Яриа 2-т ашиглагдсан.",
  "examples":[ex("你买什么？","Nǐ mǎi shénme?","Чи юу авах вэ?"),ex("我要3个。","Wǒ yào sān ge.","Надад 3 өгөөч."),ex("太贵了！","Tài guì le!","Үнэтэй байна шүү дээ!"),ex("有绿茶吗？","Yǒu lǜchá ma?","Ногоон цай байна уу?")],
  "common_mistakes":[{"wrong":"你什么买？","right":"你买什么？","why":"Дараалал: 买 → 什么."}],
  "check":chk("Үнэ хэтэрхий өндөр байна. Юу гэх вэ?",["太贵了！","你买什么？","谢谢！"],"太贵了！","g3c"),
  "exercises":[
   choice("你 ________ 什么？",["买","块","杯"],"买","Зөв! 买 = авах.","买 = авах.","g3e1"),
   choice("«50 юань!» гайхаж хэлэх үг:",["太贵了！","谢谢！","再见！"],"太贵了！","Зөв! 太贵了 = үнэтэй байна.","太贵了 = үнэтэй байна шүү дээ.","g3e2"),
   judge("«我要3个» гэдэг нь «Надад 3 өгөөч» гэсэн үг.",True,"Зөв! 要 = хүсэх, авах.","我要3个 = Надад 3 өгөөч.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Мөнгө» хятадаар аль нь вэ?",["钱","茶","买","块"],"钱","钱 (qián) = мөнгө.","easy",["vocabulary"],"a1")
q("choice","«Цай» хятадаар аль нь вэ?",["茶","钱","杯","买"],"茶","茶 (chá) = цай.","easy",["vocabulary"],"a2")
q("choice","«Худалдаж авах» хятадаар аль нь вэ?",["买","块","钱","茶"],"买","买 (mǎi) = худалдаж авах.","easy",["vocabulary"],"a3")
q("choice","«Хэд вэ, хэдэн» хятадаар аль нь вэ?",["多少","块","杯","买"],"多少","多少 (duōshao) = хэд, хэдэн.","easy",["vocabulary"],"a4")
q("choice","«Юань» (хятад мөнгөний нэгж) хятадаар аль нь вэ?",["块","杯","茶","买"],"块","块 (kuài) = юань.","easy",["vocabulary"],"a5")
q("choice","«Аяга» (ундааг тоолох үг) хятадаар аль нь вэ?",["杯","块","钱","个"],"杯","杯 (bēi) = аяга.","medium",["vocabulary"],"a6")
q("choice","«太贵了！» гэдэг юу гэсэн үг вэ?",["Үнэтэй байна шүү дээ!","Баярлалаа!","Баяртай!","Сайн байна уу!"],"Үнэтэй байна шүү дээ!","太贵了 = үнэ хэтэрхий өндөр.","easy",["vocabulary"],"a7")
q("choice","«Чи юу авах вэ?» хятадаар:",["你买什么？","你叫什么？","你有什么？","你吃什么？"],"你买什么？","买 = авах.","easy",["dialogue"],"a8")
q("choice","«Баоз нэг нь хэд вэ?» хятадаар:",["包子多少钱一个？","你买什么？","太贵了！","有绿茶吗？"],"包子多少钱一个？","多少钱 = хэд вэ.","easy",["dialogue"],"a9")
q("choice","«两块钱一个。» гэж хэлбэл юу гэсэн үг вэ?",["Нэг нь 2 юань","Нэг нь 5 юань","Хоёр баоз","Хоёр аяга"],"Нэг нь 2 юань","两块 = 2 юань.","medium",["dialogue"],"a10")
q("choice","«有绿茶吗？» гэж юу асууж байна вэ?",["Ногоон цай байна уу?","Ногоон алим байна уу?","Цай уух уу?","Цай хэд вэ?"],"Ногоон цай байна уу?","绿茶 = ногоон цай.","medium",["dialogue"],"a11")
q("choice","Яриа 1-д 3 баоз хэдэн юань вэ?",["5块","2块","3块","10块"],"5块","5块钱3个 — гурав нь 5 юань.","medium",["dialogue"],"a12")
q("choice","Яриа 2-т нэг аяга ногоон цай хэд вэ?",["50块","5块","15块","500块"],"50块","зөөгч «50块» гэв.","medium",["dialogue"],"a13")
q("cloze","包子（ ）钱一个？",["多少","买","块","杯"],"多少","«Хэд» — 多少.","easy",["dialogue"],"a14")
q("cloze","两（ ）钱一个。",["块","买","茶","吗"],"块","Юань — 块.","easy",["dialogue"],"a15")
q("cloze","你（ ）什么？",["买","块","钱","杯"],"买","Авах — 买.","easy",["dialogue"],"a16")
q("cloze","多少钱一（ ）？(цай)",["杯","块","个","买"],"杯","Нэг аяга цай — 一杯.","medium",["dialogue"],"a17")
q("cloze","有绿（ ）吗？",["茶","钱","块","买"],"茶","绿茶 = ногоон цай.","medium",["dialogue"],"a18")
q("choice","«5 юань» хятадаар:",["五块","五个","五杯","五买"],"五块","五 = 5, 块 = юань.","easy",["number"],"a19")
q("choice","«50 юань» хятадаар:",["五十块","五块","十块","一百块"],"五十块","五十 = 50.","medium",["number"],"a20")
q("choice","«100 юань» хятадаар:",["一百块","十块","五十块","二十块"],"一百块","一百 = 100.","medium",["number"],"a21")
q("choice","Пиньинь «qián» гэж уншдаг үг:",["钱","茶","块","买"],"钱","钱 = qián = мөнгө.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «duōshao» гэж уншдаг үг:",["多少","买","块","杯"],"多少","多少 = duōshao = хэд.","medium",["pronunciation"],"a23")
q("choice","Пиньинь «mǎi» гэж уншдаг үг:",["买","钱","茶","块"],"买","买 = mǎi = авах.","medium",["pronunciation"],"a24")
q("usage","Баоз 50 юань гэнэ. Үнэ нь хэтэрхий их. Юу гэх вэ?",["太贵了！","谢谢！","再见！","你好！"],"太贵了！","Үнэтэй байвал 太贵了.","medium",["usage"],"a25")
q("usage","Дэлгүүрт юмны үнийг мэдэхийг хүсэв. Юу гэж асуух вэ?",["多少钱？","你好吗？","我叫什么？","谢谢！"],"多少钱？","Үнийг асуухад 多少钱.","medium",["usage"],"a26")
q("usage","Mini story-д Сяо Мин ямар цэцэг авах гэв?",["玫瑰花","苹果","包子","绿茶"],"玫瑰花","玫瑰花 — сарнай.","medium",["usage"],"a27")
q("usage","Mini story-д сарнай яагаад үнэтэй болсон бэ?",["Өнөөдөр 2 сарын 14","Өчигдөр 2 сарын 14","Баоз үнэтэй","Мөнгө байхгүй"],"Өнөөдөр 2 сарын 14","今天2月14号 — хайрлагчдын өдөр.","hard",["usage"],"a28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
LISTEN_IMGS = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (06-05) сонсоод A, B, C, D-ээс тохирох зургийг сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）","script_zh":"A：喝茶吗？ B：好的，谢谢你。","options":["A","B","C","D"],"optionImages":LISTEN_IMGS,"answer":"B","explanation_mn":"Яриа «Цай уух уу?» гэж асууж байна. Цай нь B зураг (аяга цай). A хүү ширээн дээр юм хайж сууж байна, C таван юаний мөнгө, D шүхэр."},
    {"n":2,"question_zh":"（听录音）","script_zh":"A：我要买那个绿的。 B：那个红的也很好。","options":["A","B","C","D"],"optionImages":LISTEN_IMGS,"answer":"D","explanation_mn":"«Ногоон нь авъя», «Улаан нь ч сайн» — өнгөт зүйл. D зураг дээр улаан, ногоон шүхэр байна."},
    {"n":3,"question_zh":"（听录音）","script_zh":"A：姐姐，我们有几块钱？ B：5块。","options":["A","B","C","D"],"optionImages":LISTEN_IMGS,"answer":"C","explanation_mn":"«Бид хэдэн юань байна?» — «5 юань». C зураг дээр 5 юаний дэвсгэрт байна."},
    {"n":4,"question_zh":"（听录音）","script_zh":"A：那是多少钱？ B：我看看，一块、两块……","options":["A","B","C","D"],"optionImages":LISTEN_IMGS,"answer":"A","explanation_mn":"«Тэр хэд вэ?» — «Харъя, нэг юань, хоёр юань...» гэж мөнгө тоолж байна. A зураг дээр хүү ширээн дээрх жижиг мөнгийг тоолж байна."}],
   "answer_source":"Test Answers: 1.B 2.D 3.C 4.A; Listening script (YCT2 х.68/70)"},
  {"part":2,"type":"choice","instruction_mn":"Унших — зай нөхөх үгийг A, B, C, D-ээс сонго. A 多少 · B 买 · C 块 · D 茶","items":[
    {"n":5,"question_zh":"A：你（　）什么？ B：我买苹果。","question_mn":"Чи юу ______ вэ? — Би алим авна.","options":["A","B","C","D"],"optionTexts":["多少","买","块","茶"],"answer":"B","explanation_mn":"«Чи юу авах вэ?» — 你买什么. 多少 нь тоо асуух, 块 юань, 茶 цай тул таарахгүй."},
    {"n":6,"question_zh":"小朋友，两个5是（　）？ B：是10。","question_mn":"Хүүхэд ээ, хоёр тав нь ______ вэ? — 10.","options":["A","B","C","D"],"optionTexts":["多少","买","块","茶"],"answer":"A","explanation_mn":"«Хоёр тав нь хэд вэ?» — 多少. Хариу нь 10."},
    {"n":7,"question_zh":"这个铅笔多少钱？ B：三（　）。","question_mn":"Энэ харандаа хэд вэ? — гурван ______.","options":["A","B","C","D"],"optionTexts":["多少","买","块","茶"],"answer":"C","explanation_mn":"Үнийн хариу «三块» — гурван юань."},
    {"n":8,"question_zh":"请坐，你喝什么？喝（　）？ B：我不喝了。","question_mn":"Суугаарай, юу уух вэ? ______ уух уу?","options":["A","B","C","D"],"optionTexts":["多少","买","块","茶"],"answer":"D","explanation_mn":"Ууж болох зүйл — 茶 (цай). «喝茶？» — цай уух уу?"}],
   "answer_source":"Test Answers: 5.B 6.A 7.C 8.D"},
  {"part":3,"type":"match","instruction_mn":"Асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"包子多少钱一个？","answer":"两块钱一个。","explanation_mn":"Үнэ асуусан тул «……块钱一个» гэж хариулна."},
    {"n":2,"question_zh":"你买什么？","answer":"我要3个。","explanation_mn":"Юу авахыг асуусан тул «Надад 3 өгөөч» гэж хариулна."},
    {"n":3,"question_zh":"有绿茶吗？","answer":"有。","explanation_mn":"Байгаа эсэхийг асуусан — «有» (байна)."}],
   "answer_source":"textbook х.29 (Let's read)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «买花» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"你好！你买什么？","answer":"1","explanation_mn":"1-р зураг дээр худалдагч эгч хүүд «Юу авах вэ?» гэж асууж байна."},
    {"n":2,"question_zh":"玫瑰花多少钱一枝？","answer":"2","explanation_mn":"2-р зураг дээр хүү сарнай барьж үнийг асууж байна."},
    {"n":3,"question_zh":"太贵了！昨天5块吧？","answer":"3","explanation_mn":"3-р зураг дээр хүү гараа эрүүндээ тулан үнэтэй гэж бодож байна."}],
   "answer_source":"textbook х.31 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханз бичих — «цай», «мөнгө» гэсэн ханзыг дахин бичиж хуулж үз.","question_zh":"茶 钱","answer":"茶 钱","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Дэлгүүрт баозын үнийг асуу.","question_zh":"包子多少钱一个？","answer":"包子多少钱一个？","explanation_mn":"Хосоороо худалдагч, худалдан авагч болж ээлжлэн."},
   {"n":2,"prompt_mn":"Үнэ хэтэрхий өндөр бол юу гэх вэ?","question_zh":"太贵了！","answer":"太贵了！","explanation_mn":"Гайхсан хоолойгоор хэл."},
   {"n":3,"prompt_mn":"«你拍一» дууг алга таших хэлбэрээр хэл.","question_zh":"你拍一，我拍一","answer":"(нээлттэй)","explanation_mn":"Аудио 06-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 2 · Test (х.32), Listening Scripts, Test Answers (Lesson 6)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("qian","钱"),("cha","茶"),("mai","买"),("duoshao","多少"),("kuai","块"),("bei","杯"),("taiguile","太贵了")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"包子多少钱一个？","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你买什么？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"有绿茶吗？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"你拍一","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.jpg","title":"买花 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 6-р хичээл — Баоз нэг нь хэд вэ?","chineseTitle":"包子多少钱一个？","targetTitle":"包子多少钱一个？","mongolianTitle":"Баоз нэг нь хэд вэ?",
 "subtitle":"钱 · 茶 · 买 · 多少 · 块 · 杯 · 太贵了 · «你拍一» chant",
 "description":f"Дэлгүүрт үнэ асуух (多少钱), 块 (юань), 买, 茶, 杯, 太贵了. {len(vocab)} үг, 2 зурагт яриа, Mini story, 1 chant, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🛍️","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第6课《包子多少钱一个？》 [hskLevel=1] [lessonNumber=6]; эх: сурах бичиг х.28–32, Test Answers; аудио CD 06-01…06-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"包子多少钱一个？","mongolianTitle":"Баоз нэг нь хэд вэ?",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第6课 (сурах бичиг + CD аудио 06-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers, L6)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
