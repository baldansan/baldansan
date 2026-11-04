#!/usr/bin/env python3
"""YCT 标准教程 2 · 第4课 书包里有两本书。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib
from PIL import Image
OUT = "/home/claude/work/yct2/l04/pkg"
CID, LID, N = "yct-2", "yct-2-l04", 4
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

# Тестийн зураг: х.22 (hi-24.png, 150dpi) — 4 асуулт × A/B/C, мөн Mini story (hi-23.png)
_pg = Image.open("/home/claude/work/yct2/l04/pages/hi-24.png").convert("RGB")
_COLS = {"a":(356,602),"b":(610,856),"c":(865,1111)}
_ROWS = {1:(328,450),2:(497,618),3:(667,790),4:(835,980)}
for r,(y0,y1) in _ROWS.items():
    for k,(x0,x1) in _COLS.items():
        _pg.crop((x0,y0,x1,y1)).save(f"{OUT}/images/t{r}{k}.png")
Image.open("/home/claude/work/yct2/l04/pages/hi-23.png").convert("RGB").crop((150,295,1165,1410)).save(f"{OUT}/images/story.png")

# audio: дуу байхгүй → mainText audio = яриа track 04-02
AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-2-04-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = AUD_TEXT

# ---------------- VOCAB ----------------
VOCAB = [
 ("红色","hóngsè","улаан өнгө","нэр үг · өнгө","我的书包是红色的。","Wǒ de shūbāo shì hóngsè de.","Миний цүнх улаан.",True),
 ("黄色","huángsè","шар өнгө","нэр үг · өнгө","一只是黄色的。","Yì zhī shì huángsè de.","Нэг нь шар.",True),
 ("绿色","lǜsè","ногоон өнгө","нэр үг · өнгө","一只是绿色的。","Yì zhī shì lǜsè de.","Нэг нь ногоон.",True),
 ("只","zhī","муур, шувуу, нүд зэрэг зарим амьтан, биеийн хэсгийг тоолдог үг","тоолдог үг","一只猫，一只眼睛","Yì zhī māo, yì zhī yǎnjing","Нэг муур, нэг нүд",True),
 ("名字","míngzi","нэр","нэр үг","我有一只猫，名字叫豆豆。","Wǒ yǒu yì zhī māo, míngzi jiào Dòudou.","Надад нэг муур бий. Нэр нь Доу-доу.",True),
 ("漂亮","piàoliang","хөөрхөн, гоё","тэмдэг нэр","豆豆的眼睛很漂亮。","Dòudou de yǎnjing hěn piàoliang.","Доу-доугийн нүд маш хөөрхөн.",True),
 ("颜色","yánsè","өнгө","нэр үг","你的书包是什么颜色的？","Nǐ de shūbāo shì shénme yánsè de?","Чиний цүнх ямар өнгөтэй вэ?",True),
 ("两","liǎng","хоёр (юм тоолохдоо)","тоо","两个苹果","Liǎng ge píngguǒ","Хоёр алим",True),
 ("本","běn","ном тоолдог үг","тоолдог үг · нэмэлт үг","书包里有两本书。","Shūbāo li yǒu liǎng běn shū.","Цүнхэнд хоёр ном байна.",False),
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
 {"id":1,"title_mn":"Яриа 1 · Миний муур Доу-доу","scene_mn":"Охин гэртээ улбар шар муураа танилцуулж байна. Муур загас идэхийг их хүсч сууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"我有一只猫，名字叫豆豆。","pinyin":"Wǒ yǒu yì zhī māo, míngzi jiào Dòudou.","mn":"Надад нэг муур бий. Нэр нь Доу-доу."},
           {"speaker":"小红","zh":"豆豆的眼睛很漂亮，一只是绿色的，一只是黄色的。","pinyin":"Dòudou de yǎnjing hěn piàoliang, yì zhī shì lǜsè de, yì zhī shì huángsè de.","mn":"Доу-доугийн нүд маш хөөрхөн. Нэг нүд нь ногоон, нөгөө нь шар."},
           {"speaker":"小红","zh":"豆豆很喜欢吃鱼。","pinyin":"Dòudou hěn xǐhuan chī yú.","mn":"Доу-доу загас идэх дуртай."}]},
 {"id":2,"title_mn":"Яриа 2 · Алдсан эд зүйлийн газар","scene_mn":"Багш хоёр хүүгээс цүнхийг нь асууж байна. Хүү өнгийг нь хэлээд, дотор нь юу байгааг хэлнэ.","audio":AUD_TEXT,
  "lines":[{"speaker":"老师","zh":"你的书包是什么颜色的？","pinyin":"Nǐ de shūbāo shì shénme yánsè de?","mn":"Чиний цүнх ямар өнгөтэй вэ?"},
           {"speaker":"小明","zh":"红色的。","pinyin":"Hóngsè de.","mn":"Улаан."},
           {"speaker":"老师","zh":"书包里有什么？","pinyin":"Shūbāo li yǒu shénme?","mn":"Цүнхэнд юу байна?"},
           {"speaker":"小明","zh":"有两本书。","pinyin":"Yǒu liǎng běn shū.","mn":"Хоёр ном байна."}]},
 {"id":3,"title_mn":"Үлгэр · 过马路 (Зам хөндлөн гарах)","scene_mn":"Нугас ээж таван дэгдээхийгээ дагуулан зам хөндлөн гарах гэж байна. Гэрлэн дохио ногоон, шар, улаан болох бүрт дэгдээхэйнүүд асуух нь.","audio":AUD_STORY,
  "lines":[{"speaker":"鸭妈妈","zh":"一二一，一二一。","pinyin":"Yī èr yī, yī èr yī.","mn":"Нэг хоёр нэг, нэг хоёр нэг."},
           {"speaker":"小鸭","zh":"妈妈，现在可以过马路吗？","pinyin":"Māma, xiànzài kěyǐ guò mǎlù ma?","mn":"Ээж ээ, одоо зам хөндлөн гарч болох уу?"},
           {"speaker":"鸭妈妈","zh":"现在是绿灯，可以过。","pinyin":"Xiànzài shì lǜ dēng, kěyǐ guò.","mn":"Одоо ногоон гэрэл. Гарч болно."},
           {"speaker":"小鸭","zh":"现在可以过马路吗？","pinyin":"Xiànzài kěyǐ guò mǎlù ma?","mn":"Одоо зам хөндлөн гарч болох уу?"},
           {"speaker":"鸭妈妈","zh":"现在是黄灯，快！快！","pinyin":"Xiànzài shì huáng dēng, kuài! Kuài!","mn":"Одоо шар гэрэл. Хурдан! Хурдан!"},
           {"speaker":"小鸭","zh":"现在可以过马路吗？","pinyin":"Xiànzài kěyǐ guò mǎlù ma?","mn":"Одоо зам хөндлөн гарч болох уу?"},
           {"speaker":"鸭妈妈","zh":"现在是红灯，不可以过。","pinyin":"Xiànzài shì hóng dēng, bù kěyǐ guò.","mn":"Одоо улаан гэрэл. Гарч болохгүй."}]},
]

sentences=[]
dlg = [
 (1,"小红：我有一只猫，名字叫豆豆。","Xiǎo Hóng: Wǒ yǒu yì zhī māo, míngzi jiào Dòudou.","Сяо Хун: Надад нэг муур бий. Нэр нь Доу-доу.","小红：| 我|wǒ 有|yǒu 一|yì 只|zhī 猫|māo ，| 名字|míngzi 叫|jiào 豆豆|Dòudou 。|","只 — муур, шувуу, нүд гэх мэтийг тоолдог үг. 一只猫 = нэг муур. 名字叫…… = нэр нь ……",["我有一只猫，名字叫豆豆。"]),
 (1,"豆豆的眼睛很漂亮，一只是绿色的，一只是黄色的。","Dòudou de yǎnjing hěn piàoliang, yì zhī shì lǜsè de, yì zhī shì huángsè de.","Доу-доугийн нүд маш хөөрхөн. Нэг нүд нь ногоон, нөгөө нь шар.","豆豆|Dòudou 的|de 眼睛|yǎnjing 很|hěn 漂亮|piàoliang ，| 一|yì 只|zhī 是|shì 绿色|lǜsè 的|de ，| 一|yì 只|zhī 是|shì 黄色|huángsè 的|de 。|","一只是绿色的 — «нэг нь ногоон». 眼睛 = нүд, тиймээс 只-ээр тоолно.",["一只是绿色的。"]),
 (1,"豆豆很喜欢吃鱼。","Dòudou hěn xǐhuan chī yú.","Доу-доу загас идэх дуртай.","豆豆|Dòudou 很|hěn 喜欢|xǐhuan 吃|chī 鱼|yú 。|","",[]),
 (2,"老师：你的书包是什么颜色的？","Lǎoshī: Nǐ de shūbāo shì shénme yánsè de?","Багш: Чиний цүнх ямар өнгөтэй вэ?","老师：| 你|nǐ 的|de 书包|shūbāo 是|shì 什么|shénme 颜色|yánsè 的|de ？|","什么颜色的 — «ямар өнгөтэй». Хариулахдаа өнгөө хэлээд 的 гэж төгсгөнө.",[]),
 (2,"小明：红色的。","Xiǎo Míng: Hóngsè de.","Сяо Мин: Улаан.","小明：| 红色|hóngsè 的|de 。|","",[]),
 (2,"老师：书包里有什么？","Lǎoshī: Shūbāo li yǒu shénme?","Багш: Цүнхэнд юу байна?","老师：| 书包|shūbāo 里|li 有|yǒu 什么|shénme ？|","",[]),
 (2,"小明：有两本书。","Xiǎo Míng: Yǒu liǎng běn shū.","Сяо Мин: Хоёр ном байна.","小明：| 有|yǒu 两|liǎng 本|běn 书|shū 。|","书包里有两本书 — «цүнхэнд хоёр ном байна». Ном бол 本-өөр тоологдоно.",["书包里有两本书。"]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("一二一，一二一。","Yī èr yī, yī èr yī.","Нэг хоёр нэг, нэг хоёр нэг.","一|yī 二|èr 一|yī ，| 一|yī 二|èr 一|yī 。|","Mini story «过马路» — 4 зурагтай. 一二一 — алхахдаа хэлдэг «нэг-хоёр».",0),
 ("妈妈，现在可以过马路吗？","Māma, xiànzài kěyǐ guò mǎlù ma?","Ээж ээ, одоо зам хөндлөн гарч болох уу?","妈妈|māma ，| 现在|xiànzài 可以|kěyǐ 过|guò 马路|mǎlù 吗|ma ？|","过马路 = зам хөндлөн гарах.",0),
 ("现在是绿灯，可以过。","Xiànzài shì lǜ dēng, kěyǐ guò.","Одоо ногоон гэрэл. Гарч болно.","现在|xiànzài 是|shì 绿灯|lǜdēng ，| 可以|kěyǐ 过|guò 。|","绿灯 = ногоон гэрэл. 灯 = гэрэл.",0),
 ("现在是黄灯，快！快！","Xiànzài shì huáng dēng, kuài! Kuài!","Одоо шар гэрэл. Хурдан! Хурдан!","现在|xiànzài 是|shì 黄灯|huángdēng ，| 快|kuài ！| 快|kuài ！|","快 = хурдан.",0),
 ("现在是红灯，不可以过。","Xiànzài shì hóng dēng, bù kěyǐ guò.","Одоо улаан гэрэл. Гарч болохгүй.","现在|xiànzài 是|shì 红灯|hóngdēng ，| 不|bù 可以|kěyǐ 过|guò 。|","不可以 = болохгүй. Улаан гэрэлд зогсоно!",0),
]
for zh,py,mn,tk,note,_ in story:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if note: s["note"]=note
    sentences.append(s)

texts = {
 "unit":{"number":"4","title":"书包里有两本书。","mongolianTitle":"Цүнхэнд хоёр ном байна — өнгө ба юу байгааг хэлэх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, найзууд аа! Би Тэмээ багш. Өмнөх номд чи цүнх, харандаа, «хаана байна» гэдгийг сурсан шүү. Өнөөдөр чи цүнхнийхээ өнгийг, дотор нь юу байгааг хятадаар хэлж сурна. «Чиний цүнх ямар өнгөтэй вэ?» гэж «你的书包是什么颜色的？» гэж асууна. «Цүнхэнд хоёр ном байна» гэж «书包里有两本书» гэж хэлнэ. Мөн улаан, шар, ногоон гэрлэн дохиотой нугас ээж, дэгдээхэйнүүдийн үлгэр сонсоно. Улаан гэрэлд зогсохоо битгий март! Эхэлцгээе!",
  "warmup_mn":"Чиний цүнх ямар өнгөтэй вэ? Цүнхэнд чинь юу байна, хуруугаараа тоолоод хэл.",
  "theme_zh":"颜色 · 书包里有…… · 红灯绿灯黄灯","theme_mn":"Өнгө · Цүнхэнд юу байна · Гэрлэн дохио"},
 "warmup":{"mongolian":"Чиний цүнх ямар өнгөтэй вэ? Цүнхэнд чинь хэдэн ном байна?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"4","title":"书包里有两本书。","mongolianTitle":"Цүнхэнд хоёр ном байна — яриа, үлгэр","title_mn":"Let's read · муур Доу-доу + Алдсан эд зүйлийн газар + Mini story · 过马路","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第4课 Let's read / Mini story（CD 04-02, 04-03）","author_zh":"",
  "intro_zh":"先读小猫豆豆的故事，再听老师问“你的书包是什么颜色的？”，最后读小鸭过马路的故事。",
  "intro_mn":"Эхлээд охины муур Доу-доугийн тухай сонс. Дараа нь багш хүүгээс цүнхийг нь асууна. Хамгийн сүүлд нугас ээж, дэгдээхэйнүүд замаа гарах үлгэрийг үзнэ. Эхлээд аудиог сонс, дараа нь хамт хэл! Үлгэрийн аудио нь 04-03.",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Охин муураа танилцуулна. Нэр нь Доу-доу, нэг нүд нь ногоон, нөгөө нь шар. Загас идэх дуртай."},
   {"paragraph":2,"mn":"Яриа 2 — Багш хүүгээс «Цүнх чинь ямар өнгөтэй вэ?» гэж асууна. «Улаан» гэж хариулаад, «Цүнхэнд юу байна?» гэхэд «Хоёр ном» гэнэ."},
   {"paragraph":3,"mn":"Үлгэр «Зам хөндлөн гарах» — дэгдээхэйнүүд ээжээсээ гэрлэн дохио ногоон, шар, улаан болох бүрт «Одоо гарч болох уу?» гэж асууна. Ногоон: гарна. Шар: хурдан! Улаан: болохгүй. Аудио: 04-03."}],
  "reflection":{"questions_mn":["Чиний цүнх ямар өнгөтэй вэ? Хятадаар хэл.","Цүнхэнд чинь хэдэн ном байна? 有两本书 гэж хэлж үз.","Гэрлэн дохио улаан болбол чи юу хийх вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Цүнхээ танилцуул","zh":"我的书包是红色的，书包里有两本书。","pinyin":"Wǒ de shūbāo shì hóngsè de, shūbāo li yǒu liǎng běn shū.","mn":"Миний цүнх улаан. Цүнхэнд хоёр ном байна."},
  "writingPrompt_mn":"Цүнхээ зураад хятадаар танилцуул: 我的书包是……色的，书包里有……。"},
 "properNouns":[{"zh":"豆豆","pinyin":"Dòudou","mn":"Доу-доу (муурны нэр)"},{"zh":"小红","pinyin":"Xiǎo Hóng","mn":"Сяо Хун (охины нэр)"},{"zh":"小明","pinyin":"Xiǎo Míng","mn":"Сяо Мин (хүүгийн нэр)"}],
 "wordExplanation":[
  {"word":"什么颜色的","gloss":"shénme yánsè de — ямар өнгөтэй","explanation":"Юу ямар өнгөтэй вэ гэж асуухдаа «……是什么颜色的？» гэнэ. Хариулахдаа өнгөө хэлээд төгсгөлд нь 的 нэмнэ: «红色的». 一只是绿色的 гэвэл «нэг нь ногоон» гэсэн үг.",
   "structure":"你的书包是什么颜色的？ → 红色的。 / 我的……是……色的。","teacher_notes":"Хүүхдэд 的 гэж хэлэх шаардлагагүй: «红色的» гэж бүтнээр нь цээжлүүл. Өнгөний картыг гараараа барьж «Өнгө хүр» тоглоом тоглуул.",
   "examples":[{"chinese":"你的书包是什么颜色的？","pinyin":"Nǐ de shūbāo shì shénme yánsè de?","mongolian":"Чиний цүнх ямар өнгөтэй вэ?"},{"chinese":"红色的。","pinyin":"Hóngsè de.","mongolian":"Улаан."},{"chinese":"一只是绿色的，一只是黄色的。","pinyin":"Yì zhī shì lǜsè de, yì zhī shì huángsè de.","mongolian":"Нэг нь ногоон, нөгөө нь шар."}],
   "common_mistakes":[{"wrong":"你的书包是什么颜色？(的 орхих)","right":"你的书包是什么颜色的？","why":"Өнгө асуухад төгсгөлд нь 的 хэлдэг."}],
   "check":{"question":"«Чиний цүнх ямар өнгөтэй вэ?» хятадаар:","options":["你的书包是什么颜色的？","书包里有什么？","豆豆很漂亮。"],"answer":"0"},
   "practice":[{"n":1,"question":"我的书包是 ________ 的。(ногоон өнгө)","answer":"绿色","explanation_mn":"绿色 = ногоон өнгө. Ногоон цүнх — 绿色的书包."}]},
  {"word":"有两本书","gloss":"yǒu liǎng běn shū — хоёр ном байна","explanation":"Дотор нь юу байгааг хэлэхдээ «хаана + 有 + тоо + тоолдог үг + юу» гэнэ: «书包里有两本书». Хоёрыг тоолохдоо 二 биш 两 гэж хэлдэг. Ном бол 本, муур, нүд бол 只-ээр тоологдоно.",
   "structure":"书包里有 + 两 + 本 + 书。","teacher_notes":"Цүнх, хайрцаг дотор юу байгааг хүүхдүүдээр ээлжлэн хэлүүл: 两本书, 两只猫 (тоглоомон). 个-ийг өмнө сурсан — 本, 只 нь түүнтэй адил тоолдог үг.",
   "examples":[{"chinese":"书包里有什么？","pinyin":"Shūbāo li yǒu shénme?","mongolian":"Цүнхэнд юу байна?"},{"chinese":"有两本书。","pinyin":"Yǒu liǎng běn shū.","mongolian":"Хоёр ном байна."},{"chinese":"我有一只猫。","pinyin":"Wǒ yǒu yì zhī māo.","mongolian":"Надад нэг муур бий."}],
   "common_mistakes":[{"wrong":"有二本书。","right":"有两本书。","why":"Юм тоолохдоо «хоёр» гэхийг 两 гэж хэлнэ."}],
   "check":{"question":"«Цүнхэнд хоёр ном байна» хятадаар:","options":["书包里有两本书。","我有一只猫。","现在是红灯。"],"answer":"0"},
   "practice":[{"n":1,"question":"我有一 ________ 猫。","answer":"只","explanation_mn":"Муурыг 只-ээр тоолно."}]},
  {"word":"红灯绿灯黄灯","gloss":"hóngdēng lǜdēng huángdēng — гэрлэн дохио","explanation":"Улаан гэрэлд (红灯) зогсоно: «不可以过». Ногоон гэрэлд (绿灯) гарч болно: «可以过». Шар гэрэлд (黄灯) хурдан хурдан «快！快！» гэнэ. 灯 гэдэг нь гэрэл.",
   "structure":"现在是 + 红灯 / 绿灯 / 黄灯。","teacher_notes":"Mini story-н тоглоомыг хий: 绿灯 — удаан алхана, 黄灯 — хурдан алхана, 红灯 — зогсоно.",
   "examples":[{"chinese":"现在是绿灯，可以过。","pinyin":"Xiànzài shì lǜ dēng, kěyǐ guò.","mongolian":"Одоо ногоон гэрэл. Гарч болно."},{"chinese":"现在是黄灯，快！快！","pinyin":"Xiànzài shì huáng dēng, kuài! Kuài!","mongolian":"Одоо шар гэрэл. Хурдан!"},{"chinese":"现在是红灯，不可以过。","pinyin":"Xiànzài shì hóng dēng, bù kěyǐ guò.","mongolian":"Одоо улаан гэрэл. Гарч болохгүй."}],
   "common_mistakes":[{"wrong":"红灯，可以过。","right":"红灯，不可以过。","why":"Улаан гэрэлд заавал зогсоно, тиймээс 不可以."}],
   "check":{"question":"Улаан гэрэл асахад юу гэх вэ?","options":["不可以过。","可以过。","快！快！"],"answer":"0"},
   "practice":[{"n":1,"question":"现在是绿灯，________ 过。(болно)","answer":"可以","explanation_mn":"Ногоон гэрэлд гарч болно — 可以过."}]},
 ],
 "collocations":[{"type":"тоолдог үг — 本 · 只","rows":[
   {"head":"两","with":"本书","mn":"хоёр ном","usage_mn":"Ном — 本","example":{"zh":"书包里有两本书。","pinyin":"Shūbāo li yǒu liǎng běn shū.","mn":"Цүнхэнд хоёр ном байна."}},
   {"head":"一","with":"只猫","mn":"нэг муур","usage_mn":"Муур, шувуу, нүд — 只","example":{"zh":"我有一只猫。","pinyin":"Wǒ yǒu yì zhī māo.","mn":"Надад нэг муур бий."}},
   {"head":"绿色","with":"的","mn":"ногоон (нь)","usage_mn":"Өнгө + 的","example":{"zh":"一只是绿色的。","pinyin":"Yì zhī shì lǜsè de.","mn":"Нэг нь ногоон."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["两","只","颜色","漂亮"],"items":[
     {"n":1,"question":"书包里有 ________ 本书。","answer":"两","explanation_mn":"Хоёр ном — 两本书."},
     {"n":2,"question":"我有一 ________ 猫。","answer":"只","explanation_mn":"Муурыг 只-ээр тоолно."},
     {"n":3,"question":"你的书包是什么 ________ 的？","answer":"颜色","explanation_mn":"«Ямар өнгөтэй» — 什么颜色的."},
     {"n":4,"question":"豆豆的眼睛很 ________。","answer":"漂亮","explanation_mn":"Хөөрхөн — 漂亮."}]}],
   "answer_source":"agent-authored (YCT2 L4 үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"豆豆的眼睛是什么颜色的？","answer":"一只是绿色的，一只是黄色的。","explanation_mn":"Яриа 1 — нэг нүд нь ногоон, нөгөө нь шар."},
     {"n":2,"question_zh":"书包里有什么？","answer":"有两本书。","explanation_mn":"Яриа 2 — цүнхэнд хоёр ном байна."}],
   "answer_source":"textbook_verified (Let's read, х.19)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэр бүлтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Өнгө хүр","start_zh":"红色！","instruction_mn":"Улаан, шар, ногоон өнгийн цаасыг газар тавь. Нэг нь «红色！», «黄色！» эсвэл «绿色！» гэж хэлнэ. Бусад нь тэр өнгө рүү хамгийн түрүүнд гүйж очиж хүр!"},
     {"label":"Будаж, асууцгаая","start_zh":"你的……是什么颜色的？","instruction_mn":"Муур, нохой, шувуу, загас зургийг дуртай өнгөөрөө бүд. Дараа нь найзаасаа «你的猫是什么颜色的？» гэж асуу. Тэр «我的猫是……色的» гэж хариулна."},
     {"label":"Хэний юм бэ?","start_zh":"这个铅笔是……的。","instruction_mn":"Хүн бүр харандаа, баллуур, захирагчаа ширээн дээр тавь. Нэг нэгээр нь аваад эзнийг нь хэл: «这个铅笔是小明的». Алдахгүй сайн санаарай!"},
     {"label":"红灯绿灯黄灯","start_zh":"绿灯！","instruction_mn":"Нэг нь «绿灯！» гэвэл бүгд удаан алхана. «黄灯！» гэвэл хурдан алхана. «红灯！» гэвэл шууд зогсоно. Хамгийн сүүлд зогссон нь ялагдана!"}]}},
 "grammarNotes":[],
 "culture":{"title":"红灯停，绿灯行","title_mn":"Хятад хүүхдүүд гэрлэн дохиог ингэж цээжилдэг","text_mn":"Монголд ч, Хятадад ч гэрлэн дохио адилхан: улаан гэрэлд зогсоно, ногоон гэрэлд явна. Хятад хүүхдүүд багаасаа «红灯停，绿灯行» гэж хэлдэг. Энэ нь «Улаанд зогс, ногоонд яв» гэсэн үг.","note_mn":"Чи замаа гарахдаа гэрлэн дохио, зебрагийн зураасыг хардаг уу? Гэртээ ээж аавдаа «红灯停，绿灯行» гэж заагаад өг!"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — өнгө асуух, цүнхэнд юу байгааг хэлэх.","topic":"Цүнхээ хятадаар танилцуул","discussion":["Хосоороо: «你的书包是什么颜色的？» гэж асууж, «书包里有什么？» гэж хариул.","Бүгдээрээ «红灯绿灯黄灯» тоглоом тоглоорой."],
   "writing":{"promptChinese":"书包里有……。","promptMongolian":"Гэрийн даалгавар: цүнхээ зураад «我的书包是……色的，书包里有……» гэж ээж аавдаа хэлж өг.","minChars":"0","requiredWords":["颜色","两","本"],"sampleChinese":"我的书包是红色的，书包里有两本书。","sampleMongolian":"Миний цүнх улаан. Цүнхэнд хоёр ном байна.","gradingRubric":"Өнгөө зөв хэлсэн, цүнхэнд юу байгааг нэрлэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers: L4 1.C 2.B 3.A 4.C 5.B 6.D 7.A 8.C","parts":[]},
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
 {"point":"书包里有两本书。 — цүнхэнд юу байна","gloss_mn":"«Цүнхэнд хоёр ном байна» — дотор нь юу байгааг хэлэх",
  "structure":"书包里有 + тоо + 本/只 + юу。",
  "teacher_mn":"Цүнх дотор юу байгааг хэлэхдээ «书包里有……» гэнэ. 里 гэж «дотор» гэсэн үг. Дараа нь тоогоо хэлээд «本», «只» гэсэн тоолдог үгийг нэмнэ. Хоёр ном бол «两本书». Цүнхээ нээгээд нэг нэгээр нь хэлж үз!",
  "teacher_notes":"Номын хоёр дахь яриа: 书包里有什么？ 有两本书。 «Хоёр» гэхдээ 两 гэж хэлдэг. 本 нь номын тоолуур, 只 нь муур, шувуу, нүдний тоолуур.",
  "examples":[ex("书包里有什么？","Shūbāo li yǒu shénme?","Цүнхэнд юу байна?"),ex("有两本书。","Yǒu liǎng běn shū.","Хоёр ном байна."),ex("我有一只猫。","Wǒ yǒu yì zhī māo.","Надад нэг муур бий."),ex("两个苹果","Liǎng ge píngguǒ","Хоёр алим")],
  "common_mistakes":[{"wrong":"书包里有二本书。","right":"书包里有两本书。","why":"Юм тоолохдоо «хоёр» гэхийг 两 гэж хэлнэ."},{"wrong":"我有一本猫。","right":"我有一只猫。","why":"Муурыг 只-ээр, номыг 本-өөр тоолно."}],
  "check":chk("«Цүнхэнд хоёр ном байна» хятадаар:",["书包里有两本书。","我有一只猫。","现在是红灯。"],"书包里有两本书。","g1c"),
  "exercises":[
   choice("书包里有两 ________ 书。",["本","只","个"],"本","Зөв! Ном — 本.","Номыг 本-өөр тоолно.","g1e1"),
   choice("我有一 ________ 猫。",["只","本","里"],"只","Зөв! Муур — 只.","Муурыг 只-ээр тоолно.","g1e2"),
   judge("«有两本书» гэдэг нь «хоёр ном байна» гэсэн үг.",True,"Зөв! 两 = хоёр, 本书 = ном.","两 = хоёр, 本书 = ном.")]},
 {"point":"什么颜色的？ — ямар өнгөтэй","gloss_mn":"«Ямар өнгөтэй вэ?» ба «Улаан»",
  "structure":"……是什么颜色的？ → 红色的。 / 一只是……的。",
  "teacher_mn":"Юу ямар өнгөтэй вэ гэж асуухдаа «……是什么颜色的？» гэнэ. Хариулахдаа «红色的» гэж өнгөө хэлнэ. Хоёр юм байвал «一只是绿色的，一只是黄色的» гэж хэлнэ. Эргэн тойрныхоо юмсаас асууж үз!",
  "teacher_notes":"颜色 = өнгө. Өнгөний нэрийн ард 色 орно: 红色, 黄色, 绿色. Хариултын төгсгөл 的.",
  "examples":[ex("你的书包是什么颜色的？","Nǐ de shūbāo shì shénme yánsè de?","Чиний цүнх ямар өнгөтэй вэ?"),ex("红色的。","Hóngsè de.","Улаан."),ex("一只是绿色的，一只是黄色的。","Yì zhī shì lǜsè de, yì zhī shì huángsè de.","Нэг нь ногоон, нөгөө нь шар.")],
  "common_mistakes":[{"wrong":"你的书包是什么颜色？","right":"你的书包是什么颜色的？","why":"Төгсгөлд нь 的 хэлнэ."}],
  "check":chk("«Улаан» хятадаар:",["红色的","绿色的","黄色的"],"红色的","g2c"),
  "exercises":[
   choice("你的书包是什么 ________ 的？",["颜色","名字","漂亮"],"颜色","Зөв! 颜色 = өнгө.","颜色 = өнгө, 名字 = нэр, 漂亮 = хөөрхөн.","g2e1"),
   choice("«Шар» хятадаар:",["黄色","红色","绿色"],"黄色","Зөв! 黄色 = шар.","黄色 = шар, 红色 = улаан, 绿色 = ногоон.","g2e2"),
   judge("«绿色的» гэдэг нь «ногоон» гэсэн үг.",True,"Зөв! 绿色 = ногоон.","绿色 = ногоон.")]},
 {"point":"红灯、绿灯、黄灯 — гэрлэн дохио","gloss_mn":"Улаан, ногоон, шар гэрэлд юу хийх вэ",
  "structure":"现在是 + 红灯/绿灯/黄灯，(不)可以过。",
  "teacher_mn":"Улаан гэрэл бол «红灯». Ногоон гэрэл бол «绿灯». Шар гэрэл бол «黄灯». Ногоондоо «可以过» — гарч болно. Улаанд «不可以过» — болохгүй, зогс! Шар гэрэлд «快！快！» — хурдан!",
  "teacher_notes":"Mini story: 现在是绿灯，可以过。/ 现在是黄灯，快！快！/ 现在是红灯，不可以过。 Тоглоомоор давтуул.",
  "examples":[ex("现在是绿灯，可以过。","Xiànzài shì lǜ dēng, kěyǐ guò.","Одоо ногоон гэрэл. Гарч болно."),ex("现在是黄灯，快！快！","Xiànzài shì huáng dēng, kuài! Kuài!","Одоо шар гэрэл. Хурдан!"),ex("现在是红灯，不可以过。","Xiànzài shì hóng dēng, bù kěyǐ guò.","Одоо улаан гэрэл. Гарч болохгүй.")],
  "common_mistakes":[{"wrong":"红灯，可以过。","right":"红灯，不可以过。","why":"Улаан гэрэлд зогсоно."}],
  "check":chk("Улаан гэрэл асахад юу гэх вэ?",["不可以过。","可以过。","快！快！"],"不可以过。","g3c"),
  "exercises":[
   choice("现在是红灯，________ 过。",["不可以","可以","快"],"不可以","Зөв! Улаан гэрэлд болохгүй.","Улаан гэрэлд 不可以.","g3e1"),
   choice("现在是 ________，可以过。",["绿灯","红灯","黄灯"],"绿灯","Зөв! Ногоон гэрэлд гарч болно.","Ногоон гэрэл — 绿灯.","g3e2"),
   judge("«黄灯，快！快！» гэдэг нь «шар гэрэл, хурдан!» гэсэн үг.",True,"Зөв! 快 = хурдан.","快 = хурдан.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Улаан өнгө» хятадаар аль нь вэ?",["红色","黄色","绿色","颜色"],"红色","红色 (hóngsè) = улаан.","easy",["vocabulary"],"a1")
q("choice","«Шар өнгө» хятадаар аль нь вэ?",["黄色","红色","绿色","名字"],"黄色","黄色 (huángsè) = шар.","easy",["vocabulary"],"a2")
q("choice","«Ногоон өнгө» хятадаар аль нь вэ?",["绿色","红色","黄色","漂亮"],"绿色","绿色 (lǜsè) = ногоон.","easy",["vocabulary"],"a3")
q("choice","«名字» гэдэг үг ямар утгатай вэ?",["нэр","өнгө","хөөрхөн","хоёр"],"нэр","名字 (míngzi) = нэр.","easy",["vocabulary"],"a4")
q("choice","«漂亮» гэдэг үг ямар утгатай вэ?",["хөөрхөн, гоё","нэр","өнгө","ном"],"хөөрхөн, гоё","漂亮 (piàoliang) = хөөрхөн.","easy",["vocabulary"],"a5")
q("choice","«颜色» гэдэг үг ямар утгатай вэ?",["өнгө","нэр","хөөрхөн","цүнх"],"өнгө","颜色 (yánsè) = өнгө.","easy",["vocabulary"],"a6")
q("choice","«两» гэдэг үг ямар утгатай вэ?",["хоёр","нэг","гурав","дөрөв"],"хоёр","两 (liǎng) = хоёр.","easy",["vocabulary"],"a7")
q("choice","Номыг тоолдог үг аль нь вэ?",["本","只","个","两"],"本","本 (běn) — 两本书.","medium",["vocabulary"],"a8")
q("choice","Муурыг тоолдог үг аль нь вэ?",["只","本","里","颜"],"只","只 (zhī) — 一只猫.","medium",["vocabulary"],"a9")
q("choice","«Чиний цүнх ямар өнгөтэй вэ?» хятадаар:",["你的书包是什么颜色的？","书包里有什么？","豆豆很漂亮。","现在是红灯。"],"你的书包是什么颜色的？","什么颜色的 = ямар өнгөтэй.","easy",["dialogue"],"a10")
q("choice","«Цүнхэнд юу байна?» хятадаар:",["书包里有什么？","你的书包是什么颜色的？","我有一只猫。","我喜欢吃鱼。"],"书包里有什么？","书包里 = цүнхэнд, 有什么 = юу байна.","easy",["dialogue"],"a11")
q("choice","«书包里有什么？» гэж асуувал юу гэж хариулах вэ?",["有两本书。","红色的。","再见。","我叫豆豆。"],"有两本书。","Юу байгааг хэлнэ.","easy",["dialogue"],"a12")
q("choice","«你的书包是什么颜色的？» гэж асуувал юу гэж хариулах вэ?",["红色的。","有两本书。","不可以过。","谢谢。"],"红色的。","Өнгөө хэлнэ.","easy",["dialogue"],"a13")
q("cloze","书包里有两（ ）书。",["本","只","个","里"],"本","Ном — 本.","medium",["dialogue"],"a14")
q("cloze","我有一（ ）猫。",["只","本","两","颜"],"只","Муур — 只.","medium",["dialogue"],"a15")
q("cloze","豆豆的眼睛很（ ）。",["漂亮","名字","颜色","两"],"漂亮","«Хөөрхөн» — 漂亮.","medium",["dialogue"],"a16")
q("cloze","我的猫（ ）豆豆。",["叫","在","有","喜欢"],"叫","名字叫豆豆 — нэр нь Доу-доу.","medium",["dialogue"],"a17")
q("choice","Доу-доугийн нүд ямар өнгөтэй вэ?",["Нэг нь ногоон, нэг нь шар","Хоёулаа улаан","Хоёулаа ногоон","Нэг нь улаан, нэг нь шар"],"Нэг нь ногоон, нэг нь шар","一只是绿色的，一只是黄色的。","medium",["dialogue"],"a18")
q("choice","Доу-доу юу идэх дуртай вэ?",["загас","алим","будаа","сүү"],"загас","豆豆很喜欢吃鱼 — загас идэх дуртай.","easy",["dialogue"],"a19")
q("choice","Хүүгийн цүнх ямар өнгөтэй вэ? (Яриа 2)",["红色","黄色","绿色","цэнхэр"],"红色","小明：红色的。","easy",["dialogue"],"a20")
q("choice","Пиньинь «hóngsè» гэж уншдаг үг:",["红色","黄色","绿色","颜色"],"红色","红色 = hóngsè = улаан.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «piàoliang» гэж уншдаг үг:",["漂亮","名字","颜色","两本"],"漂亮","漂亮 = piàoliang = хөөрхөн.","medium",["pronunciation"],"a22")
q("choice","Пиньинь «míngzi» гэж уншдаг үг:",["名字","颜色","绿色","黄色"],"名字","名字 = míngzi = нэр.","medium",["pronunciation"],"a23")
q("usage","Гэрлэн дохио улаан болбол юу гэх вэ?",["不可以过。","可以过。","快！快！","再见。"],"不可以过。","红灯 = улаан гэрэл — гарч болохгүй.","easy",["usage"],"a24")
q("usage","Гэрлэн дохио ногоон болбол юу гэх вэ?",["可以过。","不可以过。","名字叫豆豆。","红色的。"],"可以过。","绿灯 = ногоон гэрэл — гарч болно.","easy",["usage"],"a25")
q("usage","«现在是黄灯，快！快！» гэдэг нь:",["Одоо шар гэрэл, хурдан!","Одоо улаан гэрэл, зогс!","Одоо ногоон гэрэл, удаан яв","Цүнхэнд хоёр ном байна"],"Одоо шар гэрэл, хурдан!","黄灯 = шар гэрэл, 快 = хурдан.","medium",["usage"],"a26")
q("usage","«Хоёр алим» хятадаар:",["两个苹果","二个苹果","两本苹果","两只苹果"],"两个苹果","Хоёрыг тоолоход 两, алимыг 个-өөр тоолно.","medium",["usage"],"a27")
q("choice","«红灯、绿灯、黄灯» гурвын дундаас зогсох гэрэл нь:",["红灯","绿灯","黄灯","名字"],"红灯","Улаан гэрэлд зогсоно.","easy",["usage"],"a28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
LBL = ["A","B","C"]
def lopt(n): return [img(f"t{n}{k}") for k in "abc"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (04-04) сонсоод зөв зургийг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）","script_zh":"A：你有绿色的铅笔吗？ B：有，这儿有。","options":LBL,"optionImages":lopt(1),"answer":"C","explanation_mn":"«Ногоон харандаа байна уу?» — «Байна, энд байна». C дээр ногоон харандаа байна. A нь улаан, B нь шаргал харандаа."},
    {"n":2,"question_zh":"（听录音）","script_zh":"A：你喜欢哪个椅子？ B：我喜欢红色的那个。","options":LBL,"optionImages":lopt(2),"answer":"B","explanation_mn":"«Би улаан сандлыг дуртай» — B дээр улаан хуванцар сандал. A цэнхэр, C улбар шар."},
    {"n":3,"question_zh":"（听录音）","script_zh":"A：我的铅笔在这儿。 B：有绿色的吗？","options":LBL,"optionImages":lopt(3),"answer":"A","explanation_mn":"Харандаа ярьж байна, «ногоон нь байна уу?» — A дээр олон өнгийн харандаа, ногоон нь ч бий. B дээр гутал, C дээр нялхсын хувцас."},
    {"n":4,"question_zh":"（听录音）","script_zh":"A：你要什么颜色的？ B：我要黄色的那个。","options":LBL,"optionImages":lopt(4),"answer":"C","explanation_mn":"«Би шар хүрзийг авъя» — C дээр шар хүрз. A хар, B улаан хүрз."}],
   "answer_source":"Test Answers: 1.C 2.B 3.A 4.C; Listening scripts (брифийн дагуу)"},
  {"part":2,"type":"choice","instruction_mn":"Унших — үгийг сонгоод нөх. A 黄 · B 两 · C 漂亮 · D 名字","items":[
    {"n":5,"question_zh":"A：我有（ ）只鸟，喜欢吗？ B：喜欢，真好玩儿。","question_mn":"Надад ___ шувуу бий, таалагдаж байна уу?","options":["A 黄","B 两","C 漂亮","D 名字"],"answer":"B","explanation_mn":"«Надад хоёр шувуу бий» — 两只鸟. 黄 (шар), 漂亮 (хөөрхөн), 名字 (нэр) энд таарахгүй."},
    {"n":6,"question_zh":"A：那个人叫什么（ ）？ B：对不起，你说谁？","question_mn":"Тэр хүний ___ юу вэ?","options":["A 黄","B 两","C 漂亮","D 名字"],"answer":"D","explanation_mn":"«Нэр нь хэн бэ?» — 叫什么名字. Нэр асуухад 名字 хэрэглэнэ."},
    {"n":7,"question_zh":"A：你的小猫是什么颜色的？ B：我的小猫是（ ）色的。","question_mn":"Миний муур ___ өнгөтэй.","options":["A 黄","B 两","C 漂亮","D 名字"],"answer":"A","explanation_mn":"Өнгө асуусан тул өнгөөр хариулна: 黄色 = шар. 两, 漂亮, 名字 нь өнгө биш."},
    {"n":8,"question_zh":"A：你的眼睛真（ ）。 B：是吗？谢谢你！","question_mn":"Чиний нүд үнэхээр ___.","options":["A 黄","B 两","C 漂亮","D 名字"],"answer":"C","explanation_mn":"Магтаад «Нүд чинь үнэхээр хөөрхөн» — 漂亮. Сайхан юм хэлэхэд «баярлалаа» гэж хариулна."}],
   "answer_source":"Test Answers: 5.B 6.D 7.A 8.C"},
  {"part":3,"type":"match","instruction_mn":"Асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"你的书包是什么颜色的？","answer":"红色的。","explanation_mn":"Өнгө асуусан тул өнгөөр хариулна."},
    {"n":2,"question_zh":"书包里有什么？","answer":"有两本书。","explanation_mn":"Юу байгааг асуусан тул «хоёр ном байна» гэнэ."}],
   "answer_source":"textbook х.19 (Let's read)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"一二一，一二一。","answer":"1","explanation_mn":"1-р зураг дээр нугас ээж дэгдээхэйнүүдээ дагуулан алхаж байна."},
    {"n":2,"question_zh":"现在是绿灯，可以过。","answer":"2","explanation_mn":"2-р зураг дээр гэрлэн дохио ногоон."},
    {"n":3,"question_zh":"现在是黄灯，快！快！","answer":"3","explanation_mn":"3-р зураг дээр шар гэрэл, дэгдээхэйнүүд хурдан явж байна."},
    {"n":4,"question_zh":"现在是红灯，不可以过。","answer":"4","explanation_mn":"4-р зураг дээр улаан гэрэл, бүгд зогсож байна."}],
   "answer_source":"textbook х.21 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Будах дасгал — муур, нохой, шувуу, загасыг дуртай өнгөөрөө бүдээд найздаа хэл.","question_zh":"你的……是什么颜色的？ 我的……是……色的。","answer":"我的猫是黄色的。","explanation_mn":"Өөрийн бүдсэн өнгөөрөө хариул (Let's color)."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Цүнхээ хятадаар танилцуул.","question_zh":"我的书包是……色的，书包里有……。","answer":"我的书包是红色的，书包里有两本书。","explanation_mn":"Өөрийнхөө цүнхийг хэл."},
   {"n":2,"prompt_mn":"Найзаасаа цүнхний өнгийг асуу.","question_zh":"你的书包是什么颜色的？","answer":"你的书包是什么颜色的？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":3,"prompt_mn":"Бичгийн хэрэгслээ ширээн дээр тавиад эзнийг нь хэл (Let's play).","question_zh":"这个铅笔是……的。","answer":"这个铅笔是小明的。","explanation_mn":"Групп болж тогло."}]},
 "answerSource":"YCT 标准教程 2 · Test (х.22) Lesson 4 — Test Answers 1.C 2.B 3.A 4.C 5.B 6.D 7.A 8.C"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("hongse","红色"),("huangse","黄色"),("luse","绿色"),("zhi","只"),("mingzi","名字"),("piaoliang","漂亮"),("yanse","颜色"),("liang","两"),("ben","本")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"书包里有两本书。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"我有一只猫，名字叫豆豆。","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"你的书包是什么颜色的？","role":"illustration","section":"dialogue"},
 {"id":"story","file":"images/story.png","title":"过马路 · Mini story","role":"illustration","section":"story"},
 {"id":"story-cover","file":"images/story.jpg","title":"过马路","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{n}{k}","file":f"images/t{n}{k}.png","title":f"Test {n}{k.upper()}","role":"illustration","section":"workbook"} for n in (1,2,3,4) for k in "abc"]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 4-р хичээл — Цүнхэнд хоёр ном байна","chineseTitle":"书包里有两本书。","targetTitle":"书包里有两本书。","mongolianTitle":"Цүнхэнд хоёр ном байна",
 "subtitle":"红色 · 黄色 · 绿色 · 颜色 · 两本书 · 一只猫 · 红灯绿灯黄灯",
 "description":f"Өнгө (红色 黄色 绿色), 什么颜色的 гэж асуух, 书包里有…… гэж хэлэх. {len(vocab)} үг, 2 яриа, Mini story «过马路», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🎒","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第4课《书包里有两本书。》 [hskLevel=1] [lessonNumber=4]; эх: сурах бичиг х.18–22; аудио CD 04-01…04-04"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"书包里有两本书。","mongolianTitle":"Цүнхэнд хоёр ном байна",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第4课 (сурах бичиг + CD аудио 04-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L4)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
