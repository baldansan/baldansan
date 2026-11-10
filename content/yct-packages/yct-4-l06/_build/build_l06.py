#!/usr/bin/env python3
"""YCT 标准教程 4 · 第6课 你去过我们的新教室吗？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
OUT = "/home/claude/work/yct4/l06/pkg"
CID, LID, N = "yct-4", "yct-4-l06", 6
os.makedirs(f"{OUT}/images", exist_ok=True)

def dump(name, obj, base=OUT):
    with open(f"{base}/{name}", "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

def shuffle(options, correct, seed):
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    opts = list(options)
    for i in range(len(opts) - 1, 0, -1):
        j = h % (i + 1); h //= (i + 1)
        opts[i], opts[j] = opts[j], opts[i]
    return opts, opts.index(correct)

from PIL import Image
_pg = Image.open("/home/claude/work/yct4/l06/pages/hi-39.png").convert("RGB")
_S = 1.5
_BOX = {"t1":(283,190,380,262),"t2":(283,265,380,336),"t3":(283,342,380,410),"t4":(283,413,380,482)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*3,_c.height*3), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct4/l06/pages/hi-38.png").convert("RGB").crop((int(30*_S),int(150*_S),int(790*_S),int(1050*_S))).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-4-06-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = AUD_TEXT

# ---------------- VOCAB ----------------
VOCAB = [
 ("教室","jiàoshì","анги танхим","анги · гол үг","你去过我们的新教室吗？","Nǐ qùguo wǒmen de xīn jiàoshì ma?","Чи манай шинэ ангид очиж үзсэн үү?",True),
 ("走","zǒu","явах, алхах","хөдөлгөөн · гол үг","好，走吧。","Hǎo, zǒu ba.","За, явцгаая.",True),
 ("过","guo","-сан, -ж үзсэн (урьд хийж үзсэнийг хэлнэ)","нэмэлт үг · гол үг","我还没去过。","Wǒ hái méi qùguo.","Би хараахан очиж үзээгүй.",True),
 ("前","qián","өмнө, урд","чиглэл · гол үг","前边都是新教室。","Qiánbian dōu shì xīn jiàoshì.","Урд талд бүгд шинэ ангиуд байна.",True),
 ("左","zuǒ","зүүн","чиглэл · гол үг","左边是一年级的教室。","Zuǒbian shì yī niánjí de jiàoshì.","Зүүн талд 1-р ангийн танхим байна.",True),
 ("右","yòu","баруун","чиглэл · гол үг","右边是二年级的教室。","Yòubian shì èr niánjí de jiàoshì.","Баруун талд 2-р ангийн танхим байна.",True),
 ("后","hòu","ард, хойно","чиглэл · гол үг","我们的教室在二年级的后边。","Wǒmen de jiàoshì zài èr niánjí de hòubian.","Манай танхим 2-р ангийн танхимын ард байна.",True),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 4","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    out=[]
    for t in s.split(" "):
        if not t: continue
        if "|" in t:
            z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
        elif out and not re.search(r"[一-鿿]", t):
            out[-1]["py"] = (out[-1]["py"] + " " + t).strip()
        else:
            out.append({"zh":t,"py":""})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Сургуулийн шинэ барилгын өмнө","scene_mn":"Сургуулийн том шар барилгын өмнө охин, хүү хоёр уулзав. Охин шинэ ангид хараахан очиж үзээгүй, тиймээс хүүгээс хамт явахыг гуйж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"你去过我们的新教室吗？","pinyin":"Nǐ qùguo wǒmen de xīn jiàoshì ma?","mn":"Чи манай шинэ ангид очиж үзсэн үү?"},
           {"speaker":"小明","zh":"去过，很大很漂亮。","pinyin":"Qùguo, hěn dà hěn piàoliang.","mn":"Очиж үзсэн. Том, гоё байсан."},
           {"speaker":"小红","zh":"我还没去过，你能和我一起去看看吗？","pinyin":"Wǒ hái méi qùguo, nǐ néng hé wǒ yìqǐ qù kànkan ma?","mn":"Би хараахан очиж үзээгүй. Чи надтай хамт очиж үзэхгүй юу?"},
           {"speaker":"小明","zh":"好，走吧。","pinyin":"Hǎo, zǒu ba.","mn":"За, явцгаая."}]},
 {"id":2,"title_mn":"Яриа 2 · Цонхоор шинэ ангиудыг харахад","scene_mn":"Хоёр хүүхэд өндөр цонхоор шинэ ангиудыг харж байна. Зүүн талд нэг нь, баруун талд нөгөө нь. Тэд өөрсдийн танхимыг хайж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"你看，前边都是新教室。","pinyin":"Nǐ kàn, qiánbian dōu shì xīn jiàoshì.","mn":"Хараач, урд талд бүгд шинэ ангиуд байна."},
           {"speaker":"小红","zh":"太漂亮了！还有很多花。","pinyin":"Tài piàoliang le! Hái yǒu hěn duō huā.","mn":"Ямар гоё юм! Бас олон цэцэг байна."},
           {"speaker":"小明","zh":"左边是一年级的教室，右边是二年级的教室。","pinyin":"Zuǒbian shì yī niánjí de jiàoshì, yòubian shì èr niánjí de jiàoshì.","mn":"Зүүн талд 1-р ангийн танхим, баруун талд 2-р ангийн танхим байна."},
           {"speaker":"小红","zh":"我们的教室在哪儿？","pinyin":"Wǒmen de jiàoshì zài nǎr?","mn":"Манай танхим хаана байна вэ?"},
           {"speaker":"小明","zh":"我们的教室在二年级的后边。","pinyin":"Wǒmen de jiàoshì zài èr niánjí de hòubian.","mn":"Манай танхим 2-р ангийн танхимын ард байна."}]},
]
sentences=[]
dlg = [
 (1,"小红：你去过我们的新教室吗？","Xiǎo Hóng: Nǐ qùguo wǒmen de xīn jiàoshì ma?","Сяо Хун: Чи манай шинэ ангид очиж үзсэн үү?","小红：| 你|nǐ 去过|qùguo 我们|wǒmen 的|de 新|xīn 教室|jiàoshì 吗|ma ？|","去过 = очиж үзсэн. «过» нь өмнө нь хийж үзсэнийг хэлдэг. Хариулахдаа «去过» эсвэл «没去过» гэнэ.",["你去过我们的新教室吗？"]),
 (1,"小明：去过，很大很漂亮。","Xiǎo Míng: Qùguo, hěn dà hěn piàoliang.","Сяо Мин: Очиж үзсэн. Том, гоё байсан.","小明：| 去过|qùguo ，| 很|hěn 大|dà 很|hěn 漂亮|piàoliang 。|","漂亮 = гоё, сайхан харагддаг.",[]),
 (1,"小红：我还没去过，你能和我一起去看看吗？","Xiǎo Hóng: Wǒ hái méi qùguo, nǐ néng hé wǒ yìqǐ qù kànkan ma?","Сяо Хун: Би хараахан очиж үзээгүй. Чи надтай хамт очиж үзэхгүй юу?","小红：| 我|wǒ 还|hái 没|méi 去过|qùguo ，| 你|nǐ 能|néng 和|hé 我|wǒ 一起|yìqǐ 去|qù 看看|kànkan 吗|ma ？|","还没去过 = хараахан очоогүй. 看看 = жаахан үзэх.",[]),
 (1,"小明：好，走吧。","Xiǎo Míng: Hǎo, zǒu ba.","Сяо Мин: За, явцгаая.","小明：| 好|hǎo ，| 走|zǒu 吧|ba 。|","走吧 = явцгаая. Найзаа дуудахад хэлнэ.",[]),
 (2,"小明：你看，前边都是新教室。","Xiǎo Míng: Nǐ kàn, qiánbian dōu shì xīn jiàoshì.","Сяо Мин: Хараач, урд талд бүгд шинэ ангиуд байна.","小明：| 你|nǐ 看|kàn ，| 前边|qiánbian 都|dōu 是|shì 新|xīn 教室|jiàoshì 。|","前边 = урд тал. 都是 = бүгд …. Нэг л зүйл биш, бүгд ийм гэж хэлнэ.",["前边都是新教室。"]),
 (2,"小红：太漂亮了！还有很多花。","Xiǎo Hóng: Tài piàoliang le! Hái yǒu hěn duō huā.","Сяо Хун: Ямар гоё юм! Бас олон цэцэг байна.","小红：| 太|tài 漂亮|piàoliang 了|le ！| 还|hái 有|yǒu 很多|hěn duō 花|huā 。|","",[]),
 (2,"小明：左边是一年级的教室，右边是二年级的教室。","Xiǎo Míng: Zuǒbian shì yī niánjí de jiàoshì, yòubian shì èr niánjí de jiàoshì.","Сяо Мин: Зүүн талд 1-р ангийн танхим, баруун талд 2-р ангийн танхим байна.","小明：| 左边|zuǒbian 是|shì 一|yī 年级|niánjí 的|de 教室|jiàoshì ，| 右边|yòubian 是|shì 二|èr 年级|niánjí 的|de 教室|jiàoshì 。|","年级 = ангийн түвшин. 一年级 = 1-р анги, 二年级 = 2-р анги.",[]),
 (2,"小红：我们的教室在哪儿？","Xiǎo Hóng: Wǒmen de jiàoshì zài nǎr?","Сяо Хун: Манай танхим хаана байна вэ?","小红：| 我们|wǒmen 的|de 教室|jiàoshì 在|zài 哪儿|nǎr ？|","",[]),
 (2,"小明：我们的教室在二年级的后边。","Xiǎo Míng: Wǒmen de jiàoshì zài èr niánjí de hòubian.","Сяо Мин: Манай танхим 2-р ангийн танхимын ард байна.","小明：| 我们|wǒmen 的|de 教室|jiàoshì 在|zài 二|èr 年级|niánjí 的|de 后边|hòubian 。|","在……的后边 = …-ийн ард байна.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("两个小朋友比一比，看谁穿衣服穿得快。","Liǎng ge xiǎo péngyou bǐ yi bǐ, kàn shéi chuān yīfu chuān de kuài.","Хоёр хүү хэн нь хувцсаа хурдан өмсөхийг уралдаж байна.","两个|liǎng ge 小朋友|xiǎo péngyou 比一比|bǐ yi bǐ ，| 看|kàn 谁|shéi 穿|chuān 衣服|yīfu 穿|chuān 得|de 快|kuài 。|"),
 ("大卫：先穿右边。","Dàwèi: Xiān chuān yòubian.","Дэвид: Би эхлээд баруун талыг нь өмсөнө.","大卫：| 先|xiān 穿|chuān 右边|yòubian 。|"),
 ("小明：先穿左边。","Xiǎo Míng: Xiān chuān zuǒbian.","Сяо Мин: Би эхлээд зүүн талыг нь өмсөнө.","小明：| 先|xiān 穿|chuān 左边|zuǒbian 。|"),
 ("小明：哪个是左边？哪个是右边？","Xiǎo Míng: Nǎge shì zuǒbian? Nǎge shì yòubian?","Сяо Мин: Аль нь зүүн вэ? Аль нь баруун вэ?","小明：| 哪个|nǎge 是|shì 左边|zuǒbian ？| 哪个|nǎge 是|shì 右边|yòubian ？|"),
 ("大卫很快分出了左边和右边。","Dàwèi hěn kuài fēn chū le zuǒbian hé yòubian.","Дэвид зүүн, баруун гутлаа хурдан ялгаж авлаа.","大卫|Dàwèi 很|hěn 快|kuài 分出|fēn chū 了|le 左边|zuǒbian 和|hé 右边|yòubian 。|"),
 ("大卫鞋下边的画儿帮他得了第一。","Dàwèi xié xiàbian de huàr bāng tā dé le dì-yī.","Дэвидийн гутлын ёроол дахь зураг түүнд нэгдүгээр байр авахад тусалсан.","大卫|Dàwèi 鞋|xié 下边|xiàbian 的|de 画儿|huàr 帮|bāng 他|tā 得了|dé le 第一|dì-yī 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «鞋下边的画儿» (Гутлын ёроол дахь зураг) — 5 зурагт үлгэр. 比一比 = уралдаж үзье."
    if i==3: s["note"]="Хоёр гутал адилхан харагддаг болохоор зүүн, баруунаа андуурах тохиолддог шүү."
    if i==5: s["note"]="第一 = нэгдүгээр. 帮他 = түүнд тусалсан."
    sentences.append(s)

texts = {
 "unit":{"number":"6","title":"你去过我们的新教室吗？","mongolianTitle":"Чи манай шинэ ангид очиж үзсэн үү? — чиглэл, байршил"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи YCT 1, 2, 3-ыг дуусгасан, одоо YCT 4-ийн 6-р хичээл дээр байна, баяр хүргэе! Өмнөх номд чи «在» гэж юу хаана байдгийг хэлж сурсан даа. Өнөөдөр бид зүүн, баруун, урд, ард талыг хэлж сурна. Чи сургуулийнхаа шинэ ангид очиж үзсэн үү? «你去过我们的新教室吗？» гэж найзаасаа асуугаад, «去过» эсвэл «没去过» гэж хариулж сураарай. Мөн «鞋下边的画儿» үлгэрээс хоёр хүү хувцсаа хэн хурдан өмсөхийг уралдахыг үзнэ. Зүүн, баруун гараа өргөөд бэлд, эхэлцгээе!",
  "warmup_mn":"Чи сургуулийнхаа шинэ ангид очиж үзсэн үү? Зүүн гараа өргөж үз, дараа нь баруун гараа өргө!",
  "theme_zh":"去过 · 前边 · 左边 · 右边 · 后边","theme_mn":"Очиж үзсэн · урд · зүүн · баруун · ард"},
 "warmup":{"mongolian":"Чи сургуулийнхаа шинэ ангид очиж үзсэн үү? Бидний анги зүүн талд уу, баруун талд уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"6","title":"你去过我们的新教室吗？","mongolianTitle":"Чи манай шинэ ангид очиж үзсэн үү? — яриа, үлгэр","title_mn":"Let's read · 2 яриа + Mini story · 鞋下边的画儿","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 4 · 第6课 Let's read / Mini story（CD 06-02, 06-03）","author_zh":"",
  "intro_zh":"两段小对话：你去过我们的新教室吗？我们的教室在哪儿？然后读小故事《鞋下边的画儿》。",
  "intro_mn":"Эхлээд хоёр яриа: «你去过我们的新教室吗？» гэж шинэ ангид очиж үзсэн эсэхийг асууна, «我们的教室在哪儿？» гэж байршлаа хайна. Дараа нь «鞋下边的画儿» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Охин шинэ ангид очиж үзсэн үү гэж асууна. Хүү очиж үзсэн, тэр том, гоё. Охин очиж үзээгүй тул хамт явахыг гуйна. Аудио: 06-02."},
   {"paragraph":2,"mn":"Яриа 2 — Хоёр хүүхэд шинэ ангиудыг харна. Урд талд бүгд шинэ анги, олон цэцэг. Зүүн талд 1-р ангийнх, баруун талд 2-р ангийнх, тэдний танхим 2-р ангийн ард байна. Аудио: 06-02."},
   {"paragraph":3,"mn":"Үлгэр «鞋下边的画儿» — Хоёр хүү хувцсаа хэн хурдан өмсөхийг уралдана. Нэг нь баруун талыг, нөгөө нь зүүн талыг эхэлж өмсөнө. Дэвид гутлынхаа ёроол дахь зургаар зүүн, баруунаа хурдан ялгаж, нэгдүгээр байр авна. Аудио: 06-03."}],
  "reflection":{"questions_mn":["Чи сургуулийнхаа шинэ ангид очиж үзсэн үү? «去过» эсвэл «没去过» гэж хэл.","Чиний анги хаана байдаг вэ? Зүүн, баруун, урд, ард гэж хэлж үз.","Гутлынхаа ёроолд зураг зурбал зүүн, баруунаа андуурахгүй гэж бодож байна уу?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Байршлаа асуу","zh":"我们的教室在哪儿？","pinyin":"Wǒmen de jiàoshì zài nǎr?","mn":"Манай танхим хаана байна вэ?"},
  "writingPrompt_mn":"Найзаасаа «你去过我们的新教室吗？» гэж асуугаад «去过» эсвэл «没去过» гэж хариул. Дараа нь «左边/右边/前边/后边» гэж хэлж ангиа заа."},
 "properNouns":[{"zh":"鞋下边的画儿","pinyin":"Xié xiàbian de huàr","mn":"Гутлын ёроол дахь зураг (үлгэрийн нэр)"},{"zh":"大卫","pinyin":"Dàwèi","mn":"Дэвид (хүүгийн нэр)"}],
 "wordExplanation":[
  {"word":"去过 · 没去过","gloss":"qùguo · méi qùguo — очиж үзсэн, очиж үзээгүй","explanation":"Өмнө нь хийж үзсэн зүйлээ хэлэхэд «去», «吃» шиг хийх үйлдлийн ард «过» нэм. 去过 = очиж үзсэн. Хийж үзээгүй бол «没» нэм: 没去过 = очиж үзээгүй. Асуухдаа төгсгөлд нь «吗» нэм: 你去过北京吗？",
   "structure":"去/吃 + 过 · 没 + 去/吃 + 过","teacher_notes":"Хүүхдүүдээс «Чи Бээжинд очиж үзсэн үү?» гэж хос хосоор асуулгаж, «去过» эсвэл «没去过» гэж хариулуул.",
   "examples":[{"chinese":"你去过我们的新教室吗？","pinyin":"Nǐ qùguo wǒmen de xīn jiàoshì ma?","mongolian":"Чи манай шинэ ангид очиж үзсэн үү?"},{"chinese":"去过，很大很漂亮。","pinyin":"Qùguo, hěn dà hěn piàoliang.","mongolian":"Очиж үзсэн. Том, гоё."},{"chinese":"我还没去过。","pinyin":"Wǒ hái méi qùguo.","mongolian":"Би хараахан очиж үзээгүй."}],
   "common_mistakes":[{"wrong":"我不去过。","right":"我没去过。","why":"Өмнө нь хийгээгүй зүйлд «不» биш «没» хэрэглэнэ."}],
   "check":{"question":"«Би очиж үзээгүй» хятадаар:","options":["我没去过。","我去过。","走吧。"],"answer":"0"},
   "practice":[{"n":1,"question":"我还没去 ________ 。(-ж үзсэн)","answer":"过","explanation_mn":"Хийж үзсэн туршлагыг «过» гэж хэлнэ."}]},
  {"word":"左边 · 右边 · 前边 · 后边","gloss":"zuǒbian · yòubian · qiánbian · hòubian — зүүн, баруун, урд, ард","explanation":"Чиглэлийн үгийн ард «边» нэмбэл тал болно: 左边 = зүүн тал, 右边 = баруун тал, 前边 = урд тал, 后边 = ард тал. Юу хаана байгааг хэлэхдээ «在» хэрэглэнэ: 我们的教室在二年级的后边。",
   "structure":"юу + 在 + …的 + 左边/右边/前边/后边","teacher_notes":"Хүүхдүүдийг босгож, «左！右！前！后！» гэж хэлэхэд нь тэр зүгт нь нэг алхам алхуул.",
   "examples":[{"chinese":"左边是一年级的教室。","pinyin":"Zuǒbian shì yī niánjí de jiàoshì.","mongolian":"Зүүн талд 1-р ангийн танхим байна."},{"chinese":"右边是二年级的教室。","pinyin":"Yòubian shì èr niánjí de jiàoshì.","mongolian":"Баруун талд 2-р ангийн танхим байна."},{"chinese":"我们的教室在二年级的后边。","pinyin":"Wǒmen de jiàoshì zài èr niánjí de hòubian.","mongolian":"Манай танхим 2-р ангийн танхимын ард байна."}],
   "common_mistakes":[{"wrong":"我们的教室在后边二年级。","right":"我们的教室在二年级的后边。","why":"Эхлээд юуны ард вэ гэдгээ (二年级的), дараа нь чиглэлээ (后边) хэлнэ."}],
   "check":{"question":"«Баруун тал» хятадаар:","options":["右边","左边","后边"],"answer":"0"},
   "practice":[{"n":1,"question":"________ 边是一年级的教室。(зүүн)","answer":"左","explanation_mn":"Зүүн = 左."}]},
  {"word":"前边都是…… · 走吧","gloss":"qiánbian dōu shì … · zǒu ba — урд талд бүгд…, явцгаая","explanation":"«都是» гэвэл «бүгд нь …» гэсэн үг: 前边都是新教室 = урд талд бүгд шинэ анги. Найзаа хамт явахыг урихдаа «走吧！» гэнэ. «吧» нь «явцгаая» гэсэн зөөлөн урилга болгодог.",
   "structure":"…都是…… · 走吧！","teacher_notes":"Хүүхдүүд хос хосоороо «走吧！» гэж хэлээд хамт алхаж үзэг.",
   "examples":[{"chinese":"前边都是新教室。","pinyin":"Qiánbian dōu shì xīn jiàoshì.","mongolian":"Урд талд бүгд шинэ ангиуд байна."},{"chinese":"好，走吧。","pinyin":"Hǎo, zǒu ba.","mongolian":"За, явцгаая."},{"chinese":"你能和我一起去看看吗？","pinyin":"Nǐ néng hé wǒ yìqǐ qù kànkan ma?","mongolian":"Чи надтай хамт очиж үзэхгүй юу?"}],
   "common_mistakes":[{"wrong":"前边是都新教室。","right":"前边都是新教室。","why":"«都» нь «是»-ийн өмнө орно."}],
   "check":{"question":"«За, явцгаая» хятадаар:","options":["好，走吧。","我还没去过。","太漂亮了！"],"answer":"0"},
   "practice":[{"n":1,"question":"好，________ 吧。(явах)","answer":"走","explanation_mn":"«Явцгаая» — 走吧."}]},
 ],
 "collocations":[{"type":"Байршил, чиглэл","rows":[
   {"head":"去","with":"过","mn":"очиж үзсэн","usage_mn":"Өмнө нь очиж үзсэнийг хэлнэ","example":{"zh":"去过，很大很漂亮。","pinyin":"Qùguo, hěn dà hěn piàoliang.","mn":"Очиж үзсэн, том, гоё."}},
   {"head":"在","with":"……的后边","mn":"…-ийн ард байна","usage_mn":"Юу хаана байгааг хэлнэ","example":{"zh":"我们的教室在二年级的后边。","pinyin":"Wǒmen de jiàoshì zài èr niánjí de hòubian.","mn":"Манай танхим 2-р ангийн ард байна."}},
   {"head":"左边","with":"是……","mn":"зүүн талд … байна","usage_mn":"Тал бүрт юу байгааг хэлнэ","example":{"zh":"左边是一年级的教室。","pinyin":"Zuǒbian shì yī niánjí de jiàoshì.","mn":"Зүүн талд 1-р ангийн танхим."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["教室","走","过","左","后"],"items":[
     {"n":1,"question":"你去 ________ 我们的新教室吗？","answer":"过","explanation_mn":"«Очиж үзсэн үү» — 去过."},
     {"n":2,"question":"好，________ 吧。","answer":"走","explanation_mn":"«Явцгаая» — 走吧."},
     {"n":3,"question":"我们的 ________ 在二年级的后边。","answer":"教室","explanation_mn":"«Анги танхим» — 教室."},
     {"n":4,"question":"________ 边是一年级的教室。","answer":"左","explanation_mn":"«Зүүн тал» — 左边."},
     {"n":5,"question":"我们的教室在二年级的 ________ 边。","answer":"后","explanation_mn":"«Ард тал» — 后边."}]}],
   "answer_source":"agent-authored (YCT 4 · 6-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"她去过新教室吗？","answer":"没有，她还没去过。","explanation_mn":"Яриа 1 — охин «我还没去过» гэж хэлээд хүүг хамт явахыг гуйсан."},
     {"n":2,"question_zh":"他们的教室在哪儿？","answer":"在二年级的后边。","explanation_mn":"Яриа 2 — «我们的教室在二年级的后边» гэж хүү хэлсэн."}],
   "answer_source":"textbook_verified (Let's read, х.29 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Эрдэнэ хайх (Treasure Hunt)","start_zh":"前边！左边！右边！后边！","instruction_mn":"Нэг нь гадуур гарч байхад бусад нь өрөөнд жижиг карт нууна. Тэр орж ирээд карт хайна. Бусад нь «前边！左边！右边！后边！» гэж чиглүүлнэ. Карт руу ойртох тусам чанга хашгир, холдвол аяархан хэл!"},
     {"label":"Миний анги хаана вэ","start_zh":"我们的教室在哪儿？","instruction_mn":"Сургуулийнхаа ангиудын энгийн зураг зур. Дараа нь найздаа «我们的教室在哪儿？» гэж асуулга. Тэр зургаар заагаад «在二年级的后边» гэх мэтээр хариулна."},
     {"label":"去过吗？","start_zh":"你去过北京吗？","instruction_mn":"Найзаасаа «你去过……吗？» гэж асуу. Тэр «去过» эсвэл «没去过» гэж хариулна. Хэдэн газар очиж үзснээ тоолоод, хэн илүү олон газар очсоныг хар."},
     {"label":"Зүүн, баруун шалгуур","start_zh":"先穿左边！","instruction_mn":"Нэг нь «左！» эсвэл «右！» гэж хашгирна, бусад нь тэр талын гараа хурдан өргөнө. Андуурсан нь гарна. Хамгийн сүүлд үлдсэн нь ялна!"},
     {"label":"鞋下边的画儿 жүжиг","start_zh":"两个小朋友比一比","instruction_mn":"Үлгэрийг найзтайгаа жүжигчил. Хоёулаа гутлаа тайлаад ээлжлэн хурдан өмс. Гутлынхаа ёроолд зүүн, баруун гэж жижиг зураг зурбал хэн ялах бол?"}]}},
 "grammarNotes":[],
 "culture":{"title":"一年级","title_mn":"Хятад хүүхдийн сургууль — ангийн нэр, түвшин","text_mn":"Хятадад бага сургуулийн хүүхдүүд ихэвчлэн 6 настайдаа 一年级 (1-р анги)-д орж, 六年级 (6-р анги) хүртэл суралцдаг. Анги бүрийг «一年级二班» гэх мэтээр нэрлэдэг, нэг түвшинд хэдэн анги байж болно. Хятад сургуулиудад ихэнхдээ нэг анги нэг өрөөнд суудаг, хичээл солигдоход багш нь өрөө солин ордог.","note_mn":"Чиний сургуульд нэг түвшинд хэдэн анги байдаг вэ? Чи хэддүгээр ангид сурдаг вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — очиж үзсэнээ хэлэх, байршил чиглэлийг хэлэх.","topic":"Чиний анги хаана байдаг вэ?","discussion":["Хосоороо: «你去过……吗？» гэж асууж, «去过» эсвэл «没去过» гэж хариул.","Ангиа тайлбарла: «我们的教室在……的左边/右边/前边/后边。»"],
   "writing":{"promptChinese":"我们的教室在……的……边。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «你去过我们的学校吗？» гэж хятадаар асуугаад хариултыг нь сонс.","minChars":"0","requiredWords":["教室","边"],"sampleChinese":"我们的教室在二年级的后边。","sampleMongolian":"Манай танхим 2-р ангийн танхимын ард байна.","gradingRubric":"左/右/前/后边-ийг зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 4 · Test Answers: L6 1✗ 2✓ 3✗ 4✓ 5.C 6.A 7.C 8.C","parts":[]},
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
 {"point":"你去过我们的新教室吗？ — 过","gloss_mn":"«Чи очиж үзсэн үү?» — өмнө нь хийж үзсэнийг хэлэх",
  "structure":"去/吃 + 过 · 没 + 去/吃 + 过",
  "teacher_mn":"Өмнө нь хийж үзсэн зүйлээ хэлэхдээ «去», «吃» шиг хийх үйлдлийн ард «过» нэм. 去过 = очиж үзсэн. Хийгээгүй бол «没去过» гэнэ. Асуухдаа төгсгөлд «吗» нэм. Чи хаа хаагүй очиж үзсэнээ хэлээд үз!",
  "teacher_notes":"Номын яриа 1: 你去过我们的新教室吗？ 去过，很大很漂亮。 我还没去过。",
  "examples":[ex("你去过我们的新教室吗？","Nǐ qùguo wǒmen de xīn jiàoshì ma?","Чи манай шинэ ангид очиж үзсэн үү?"),ex("去过，很大很漂亮。","Qùguo, hěn dà hěn piàoliang.","Очиж үзсэн. Том, гоё."),ex("我还没去过。","Wǒ hái méi qùguo.","Би хараахан очиж үзээгүй."),ex("你去过北京吗？","Nǐ qùguo Běijīng ma?","Чи Бээжинд очиж үзсэн үү?")],
  "common_mistakes":[{"wrong":"我不去过。","right":"我没去过。","why":"Өмнө нь хийгээгүй бол «没» хэрэглэнэ."}],
  "check":chk("«Би очиж үзсэн» хятадаар:",["我去过。","我没去过。","我走吧。"],"我去过。","g1c"),
  "exercises":[
   choice("你去 ________ 新教室吗？",["过","走","后"],"过","Зөв! 去过 = очиж үзсэн.","过 нь 去, 吃 шиг үгийн ард орж, хийж үзсэнийг хэлнэ.","g1e1"),
   choice("«Би хараахан очиж үзээгүй» хятадаар:",["我还没去过。","我去过了。","我还走吧。"],"我还没去过。","Зөв! 没去过 = очиж үзээгүй.","没 + 去 + 过 = хийж үзээгүй.","g1e2"),
   judge("«没去过» гэдэг нь «очиж үзээгүй» гэсэн үг.",True,"Зөв!","没去过 = очиж үзээгүй.")]},
 {"point":"左边 · 右边 · 前边 · 后边","gloss_mn":"«Зүүн, баруун, урд, ард» — юу хаана байгааг хэлэх",
  "structure":"юу + 在 + …的 + 左边/右边/前边/后边",
  "teacher_mn":"Чиглэлийн үгийн ард «边» нэм: 左边 зүүн тал, 右边 баруун тал, 前边 урд тал, 后边 ард тал. Юу хаана байгааг хэлэхдээ «在» ашигла. Жишээ нь «我们的教室在二年级的后边». Зүүн гараа өргөөд «左边!» гэж хэлж үз!",
  "teacher_notes":"Номын яриа 2: 左边是一年级的教室，右边是二年级的教室。 我们的教室在二年级的后边。",
  "examples":[ex("左边是一年级的教室。","Zuǒbian shì yī niánjí de jiàoshì.","Зүүн талд 1-р ангийн танхим байна."),ex("右边是二年级的教室。","Yòubian shì èr niánjí de jiàoshì.","Баруун талд 2-р ангийн танхим байна."),ex("我们的教室在二年级的后边。","Wǒmen de jiàoshì zài èr niánjí de hòubian.","Манай танхим 2-р ангийн ард байна."),ex("先穿左边。","Xiān chuān zuǒbian.","Эхлээд зүүн талыг нь өмс.")],
  "common_mistakes":[{"wrong":"我们的教室在后边二年级。","right":"我们的教室在二年级的后边。","why":"Эхлээд «юуны» гэдгээ, дараа нь чиглэлээ хэлнэ."}],
  "check":chk("«Ард тал» хятадаар:",["后边","前边","左边"],"后边","g2c"),
  "exercises":[
   choice("我们的教室在二年级的 ________ 边。(ард)",["后","前","走"],"后","Зөв! 后 = ард.","后 = ард, 前 = урд.","g2e1"),
   choice("«Зүүн талд» хятадаар:",["左边","右边","前边"],"左边","Зөв! 左 = зүүн.","左 = зүүн, 右 = баруун.","g2e2"),
   judge("«右» гэдэг нь «баруун» гэсэн үг.",True,"Зөв! 右 = баруун.","右 = баруун, 左 = зүүн.")]},
 {"point":"前边都是新教室 · 走吧","gloss_mn":"«Урд талд бүгд шинэ анги» · «явцгаая»",
  "structure":"…都是…… · 走吧！",
  "teacher_mn":"«都是» гэвэл «бүгд нь» гэсэн утгатай. 前边都是新教室 гэвэл урд талд бүгд шинэ анги байна гэсэн үг. Найзаа хамт явахыг урихдаа «走吧！» гэж хэл. «吧» нь «явцгаая» гэсэн зөөлөн дуудлага болгоно.",
  "teacher_notes":"Номын яриа: 前边都是新教室。 好，走吧。",
  "examples":[ex("前边都是新教室。","Qiánbian dōu shì xīn jiàoshì.","Урд талд бүгд шинэ ангиуд байна."),ex("好，走吧。","Hǎo, zǒu ba.","За, явцгаая."),ex("你能和我一起去看看吗？","Nǐ néng hé wǒ yìqǐ qù kànkan ma?","Чи надтай хамт очиж үзэхгүй юу?")],
  "common_mistakes":[{"wrong":"前边是都新教室。","right":"前边都是新教室。","why":"«都» нь «是»-ийн өмнө орно."}],
  "check":chk("«За, явцгаая» хятадаар:",["好，走吧。","我还没去过。","太漂亮了！"],"好，走吧。","g3c"),
  "exercises":[
   choice("前边 ________ 是新教室。(бүгд)",["都","没","过"],"都","Зөв! 都 = бүгд.","都 = бүгд, 没 = байхгүй.","g3e1"),
   choice("Найзаа хамт явахыг урихдаа хэлэх нь:",["走吧！","没去过。","右边。"],"走吧！","Зөв! 走吧 = явцгаая.","走吧 = явцгаая.","g3e2"),
   judge("«走» гэдэг нь «явах, алхах» гэсэн үг.",True,"Зөв! 走 = явах.","走 = явах, алхах.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Анги танхим» хятадаар аль нь вэ?",["教室","学校","老师","朋友"],"教室","教室 (jiàoshì) = анги танхим.","easy",["vocabulary"],"b1")
q("choice","«Явах, алхах» хятадаар аль нь вэ?",["走","过","左","后"],"走","走 (zǒu) = явах, алхах.","easy",["vocabulary"],"b2")
q("choice","«Зүүн» хятадаар аль нь вэ?",["左","右","前","后"],"左","左 (zuǒ) = зүүн.","easy",["vocabulary"],"b3")
q("choice","«Баруун» хятадаар аль нь вэ?",["右","左","前","后"],"右","右 (yòu) = баруун.","easy",["vocabulary"],"b4")
q("choice","«Урд, өмнө» хятадаар аль нь вэ?",["前","后","左","右"],"前","前 (qián) = урд, өмнө.","easy",["vocabulary"],"b5")
q("choice","«Ард, хойно» хятадаар аль нь вэ?",["后","前","左","右"],"后","后 (hòu) = ард, хойно.","easy",["vocabulary"],"b6")
q("choice","«去过» дахь «过» юуг хэлдэг вэ?",["Өмнө нь хийж үзсэнийг","Одоо хийж байгааг","Маргааш хийхийг","Хийхгүй гэснийг"],"Өмнө нь хийж үзсэнийг","过 нь 去, 吃 шиг үгийн ард орж, хийж үзсэн туршлагыг хэлнэ.","medium",["vocabulary"],"b7")
q("choice","Пиньинь «jiàoshì» гэж уншдаг үг:",["教室","学校","走","朋友"],"教室","教室 = jiàoshì = анги танхим.","easy",["pronunciation"],"b8")
q("choice","Пиньинь «zuǒbian» гэж уншдаг үг:",["左边","右边","前边","后边"],"左边","左边 = zuǒbian = зүүн тал.","medium",["pronunciation"],"b9")
q("choice","Пиньинь «hòubian» гэж уншдаг үг:",["后边","前边","右边","左边"],"后边","后边 = hòubian = ард тал.","medium",["pronunciation"],"b10")
q("choice","Пиньинь «qùguo» гэж уншдаг үг:",["去过","走吧","教室","右边"],"去过","去过 = qùguo = очиж үзсэн.","medium",["pronunciation"],"b11")
q("choice","«你去过我们的新教室吗？» гэж юу гэсэн үг вэ?",["Чи манай шинэ ангид очиж үзсэн үү?","Манай анги хаана байна вэ?","Бид хамт явцгаая.","Урд талд бүгд шинэ анги байна."],"Чи манай шинэ ангид очиж үзсэн үү?","去过 = очиж үзсэн, 吗 = асуулт.","easy",["dialogue"],"b12")
q("choice","«前边都是新教室。» гэж юу гэсэн үг вэ?",["Урд талд бүгд шинэ ангиуд байна.","Зүүн талд шинэ анги байна.","Би шинэ ангид очиж үзсэн.","Манай анги ард байна."],"Урд талд бүгд шинэ ангиуд байна.","前边 = урд тал, 都是 = бүгд.","medium",["dialogue"],"b13")
q("choice","Яриа 1-д хүү шинэ ангийг ямар гэж хэлсэн бэ?",["Том, гоё","Жижиг, хүйтэн","Хуучин, том","Олон хүнтэй"],"Том, гоё","去过，很大很漂亮。","medium",["dialogue"],"b14")
q("choice","Яриа 2-т зүүн талд хэний танхим байна вэ?",["1-р ангийнх","2-р ангийнх","Багшийнх","Манай танхим"],"1-р ангийнх","左边是一年级的教室。","medium",["dialogue"],"b15")
q("choice","Яриа 2-т тэдний танхим хаана байна вэ?",["2-р ангийн ард","2-р ангийн урд","1-р ангийн ард","Зүүн талд"],"2-р ангийн ард","我们的教室在二年级的后边。","medium",["dialogue"],"b16")
q("cloze","你去（ ）我们的新教室吗？",["过","走","后","左"],"过","去过 = очиж үзсэн.","easy",["structure"],"b17")
q("cloze","我还没去（ ），你能和我一起去看看吗？",["过","右","前","走"],"过","没去过 = очиж үзээгүй.","medium",["structure"],"b18")
q("cloze","好，（ ）吧。",["走","过","右","后"],"走","走吧 = явцгаая.","easy",["structure"],"b19")
q("cloze","（ ）边是一年级的教室。",["左","走","过","教"],"左","左边 = зүүн тал.","medium",["structure"],"b20")
q("cloze","我们的教室在二年级的（ ）边。(ард)",["后","走","过","左"],"后","后边 = ард тал.","medium",["structure"],"b21")
q("cloze","前边（ ）是新教室。",["都","过","走","左"],"都","都是 = бүгд.","medium",["structure"],"b22")
q("choice","«我没去过» гэж юу гэсэн үг вэ?",["Би очиж үзээгүй","Би очиж үзсэн","Би очно","Би очихгүй"],"Би очиж үзээгүй","没 + 去 + 过 = хийж үзээгүй.","medium",["structure"],"b23")
q("usage","Найз чинь «你去过北京吗？» гэж асууж байна. Чи очиж үзээгүй бол:",["我没去过。","走吧。","左边。","去过。"],"我没去过。","没去过 = очиж үзээгүй.","medium",["usage"],"b24")
q("usage","Шинэ анги руу найзаа хамт явахыг урихдаа:",["好，走吧。","我还没去过。","后边。","我去过。"],"好，走吧。","走吧 = явцгаая.","medium",["usage"],"b25")
q("usage","Найз «Манай анги хаана вэ?» гэж асуув. Анги чинь 2-р ангийн ард бол:",["在二年级的后边。","在二年级的前边。","我去过。","走吧。"],"在二年级的后边。","后边 = ард тал.","hard",["usage"],"b26")
q("usage","Үлгэрт Дэвид яагаад нэгдүгээр байр авсан бэ?",["Гутлынхаа ёроол дахь зургаар зүүн, баруунаа хурдан ялгасан","Хамгийн өндөр байсан","Хамгийн хүчтэй байсан","Гутлаа өмсөөгүй"],"Гутлынхаа ёроол дахь зургаар зүүн, баруунаа хурдан ялгасан","大卫鞋下边的画儿帮他得了第一。","hard",["usage"],"b27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (06-04) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）小猫在后边，我看过了。","image":img("t1"),"script_zh":"小猫在后边，我看过了。","answer":"✗","explanation_mn":"«Зулзага муур ард байна, би харсан» — зураг дээр нохой байна, муур алга → ✗."},
    {"n":2,"question_zh":"（听录音）走，我们去左边看小鱼。","image":img("t2"),"script_zh":"走，我们去左边看小鱼。","answer":"✓","explanation_mn":"«Яв, зүүн тийш жижиг загас үзэхээр явъя» — зураг дээр цөөрөмд загас сэлж байна → ✓."},
    {"n":3,"question_zh":"（听录音）教室里还有5个学生。","image":img("t3"),"script_zh":"教室里还有5个学生。","answer":"✗","explanation_mn":"«Ангид бас 5 сурагч байна» — зураг дээр 5 биш, ердөө 3–4 хүүхэд сууж байгаа тул тоо таарахгүй → ✗."},
    {"n":4,"question_zh":"（听录音）坐在最前边的那个是我的学生。","image":img("t4"),"script_zh":"坐在最前边的那个是我的学生。","answer":"✓","explanation_mn":"«Хамгийн урд суугаа хүүхэд бол миний сурагч» — зураг дээр ангид хамгийн урд хүүхэд сууж байна → ✓."}],
   "answer_source":"YCT 4 Test Answers L6: 1✗ 2✓ 3✗ 4✓"},
  {"part":2,"type":"choice","instruction_mn":"Унших — зөв хариултыг A, B, C-ээс сонго.","items":[
    {"n":5,"question_zh":"女：我中午吃多了，晚上不吃了。 男：那我们出去（　）。","question_mn":"— Би үдэд их идчихлээ, оройдоо идэхгүй. — Тэгвэл бид гараад ... .","options":BANK,"optionTexts":["吃饭","吃中国菜","走走"],"answer":"C","explanation_mn":"Охин орой идэхгүй гэсэн тул хоол идэхээр гарахгүй. «Гараад жаахан алхъя» — C «走走». A «хоол идэх», B «хятад хоол идэх» бол идэхийг хэлж байгаа тул таарахгүй."},
    {"n":6,"question_zh":"男：哪个是你的房间？ 女：左边的是我的，（　）的是我姐姐的。","question_mn":"— Аль нь чиний өрөө вэ? — Зүүн талынх нь минийх, ... талынх нь миний эгчийнх.","options":BANK,"optionTexts":["右边","学校","商店"],"answer":"A","explanation_mn":"Зүүн талынх нь минийх бол нөгөө тал нь баруун → A «右边». B «сургууль», C «дэлгүүр» бол өрөөний тал биш."},
    {"n":7,"question_zh":"男：喂，白老师，我到学校了，你在哪儿？ 女：我在你的（　）边。","question_mn":"— Байна уу, Бай багш аа, би сургууль дээр ирлээ, та хаана байна? — Би чиний ... талд байна.","options":BANK,"optionTexts":["里","外","后"],"answer":"C","explanation_mn":"Багш «чиний ард байна» гэж хэлж байна — C «后边». Хичээлд сурсан «后边» (ард) тохирно. A «里边» дотор, B «外边» гадаа гэсэн өөр утгатай."},
    {"n":8,"question_zh":"男：前边有家新饭店，一起吃点儿吧？ 女：我吃（　），谢谢你。","question_mn":"— Урд талд шинэ хоолны газар байна, хамт жаахан идэх үү? — Би идчихсэн, баярлалаа.","options":BANK,"optionTexts":["没","过","了"],"answer":"C","explanation_mn":"Охин «аль хэдийн идчихсэн» гэж татгалзаж байна — C «我吃了». A «没» бол идээгүй, B «过» бол урьд нь идэж үзсэн гэсэн өөр утга тул таарахгүй."}],
   "answer_source":"YCT 4 Test Answers L6: 5.C 6.A 7.C 8.C"},
  {"part":3,"type":"match","instruction_mn":"Let's match — асуулт бүрд тохирох хариултыг сонго.","items":[
    {"n":1,"question_zh":"你去过北京吗？","answer":"去过，你呢？","explanation_mn":"Очиж үзсэн үү гэж асуусан тул «去过，你呢？» гэж хариулна."},
    {"n":2,"question_zh":"一年级在哪儿？","answer":"二年级的左边。","explanation_mn":"«Хаана» гэж асуусан тул байршлаар хариулна."},
    {"n":3,"question_zh":"新教室在哪儿？","answer":"看，前边都是新教室。","explanation_mn":"Шинэ ангиуд урд талд байна."}],
   "answer_source":"Let's match х.30 (хариу утгаар тааруулсан)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «鞋下边的画儿» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"两个小朋友比一比，看谁穿衣服穿得快。","answer":"1","explanation_mn":"1-р зураг дээр хоёр хүү дотуур хувцастай зогсож, хувцас нь хажууд байна."},
    {"n":2,"question_zh":"先穿右边。 先穿左边。","answer":"2","explanation_mn":"2-р зураг дээр хоёр хүү хувцсаа өмсөж эхэлж, «先穿右边», «先穿左边» гэж хэлж байна."},
    {"n":3,"question_zh":"哪个是左边？哪个是右边？","answer":"3","explanation_mn":"3-р зураг дээр буржгар үст хүү гутлаа барьж, аль нь зүүн, баруун гэж асууж байна."},
    {"n":4,"question_zh":"大卫很快分出了左边和右边。","answer":"4","explanation_mn":"4-р зураг дээр Дэвид аль хэдийн гутлаа өмсчихсөн зогсож байна, буржгар хүү гутлаа өмсөж чадахгүй өвдөглөж байна."},
    {"n":5,"question_zh":"大卫鞋下边的画儿帮他得了第一。","answer":"5","explanation_mn":"5-р зураг дээр Дэвид гутлынхаа ёроолыг үзүүлж байна, ёроолд хоёр жижиг хөлийн зураг байна."}],
   "answer_source":"textbook х.31 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «教室» гэсэн үгийг дахин бичиж хуул.","question_zh":"教室","answer":"教室","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа шинэ ангид очиж үзсэн эсэхийг асуугаад, хариулт нь «没去过» бол «走吧» гэж урь.","question_zh":"你去过我们的新教室吗？","answer":"你去过我们的新教室吗？","explanation_mn":"Хосоороо ээлжлэн. Хариулт: 去过 эсвэл 没去过."},
   {"n":2,"prompt_mn":"Let's color and say — Сяо Минийн 3 зургийн нарны байрлалыг улаанаар тэмдэглээд, «太阳在左边，影子在……» гэж найздаа тайлбарла.","question_zh":"太阳在左边，影子在______，是______午。","answer":"(нээлттэй)","explanation_mn":"左 = зүүн, 前 = урд, 右 = баруун. Нарны байрлалаас сүүдэр хаана унахыг бод."},
   {"n":3,"prompt_mn":"Treasure Hunt — карт нууж, найзаа «前边！左边！右边！后边！» гэж чиглүүл.","question_zh":"前边！左边！右边！后边！","answer":"(нээлттэй)","explanation_mn":"Карт руу ойртох тусам чанга хэл."}]},
 "answerSource":"YCT 标准教程 4 · Test Listening Scripts, Test Answers (Lesson 6)"}
dump("workbook.json", workbook)

# ---------------- IMAGE PROMPTS ----------------
NOTEXT = " No English text."
IP = [
 {"file":"images/hero.jpg","aspect":"4:3","title":"你去过我们的新教室吗？","section":"teacher-intro","role":"hero","prompt":"Teacher camel with glasses stands in front of a big yellow school building with a red roof and flowers, pointing left; the foal boy and foal girl look at it with excitement. Speech bubble with the Chinese text 你去过我们的新教室吗？ in large clear black font."+NOTEXT,"chars":["temee","huu","ohin"]},
]
for k,z,p in [("jiaoshi","教室","A bright school classroom with desks and a blackboard, the camel teacher standing at the door."),
              ("zou","走","The foal boy walking forward on a road with a backpack, footprints behind him."),
              ("guo","过","The foal girl holding a ticket and a map with a check mark and little pictures of places she has visited before."),
              ("qian","前","The foal boy standing on a road pointing straight ahead where a big red school building stands."),
              ("zuo","左","The foal girl raising her LEFT hoof, an arrow pointing to the left, with a tree on the left."),
              ("you","右","The brown foal boy raising his RIGHT hoof, an arrow pointing to the right, with a house on the right."),
              ("hou","后","The foal boy standing in front of a tree, with the foal girl hiding behind the tree peeking out.")]:
    IP.append({"file":f"images/w-{k}.jpg","aspect":"1:1","title":z,"section":"vocabulary","prompt":p+" Cute children's book illustration."+NOTEXT,"chars":["huu","ohin","temee","bor"]})
IP += [
 {"file":"images/d1.jpg","aspect":"4:3","title":"你去过我们的新教室吗？","section":"dialogue","prompt":"In front of a big yellow school building, the foal girl in the yellow dress asks the brown foal boy, who spreads his arms wide happily; speech bubble with the Chinese text 你去过我们的新教室吗？ in large clear black font."+NOTEXT,"chars":["ohin","bor"]},
 {"file":"images/d2.jpg","aspect":"4:3","title":"你看，前边都是新教室。","section":"dialogue","prompt":"The foal boy and foal girl look out of a tall window at a school campus with new buildings and many flowers; the boy points left and right; speech bubble with the Chinese text 你看，前边都是新教室。 in large clear black font."+NOTEXT,"chars":["huu","ohin"]},
 {"file":"images/story.jpg","aspect":"4:3","title":"鞋下边的画儿","section":"story","prompt":"Two foal boys race to put on clothes and shoes; one holds up a shoe with a small picture drawn on the bottom and smiles proudly, the other scratches his head. Speech bubble with the Chinese text 哪个是左边？ in large clear black font."+NOTEXT,"chars":["huu","bor"]},
]
dump("image_prompts.json", IP, "/home/claude/work/yct4/l06")

# ---------------- LESSON / MANIFEST ----------------
images = []
for e in IP:
    base = os.path.basename(e["file"]).rsplit(".",1)[0]
    images.append({"id":base,"file":e["file"],"title":e["title"],"role":e.get("role","illustration"),"section":e["section"]})
images += [{"id":"story","file":"images/story.png","title":"鞋下边的画儿 · Mini story","role":"illustration","section":"story"}]
images += [{"id":k,"file":f"images/{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["t1","t2","t3","t4"]]
# story.jpg (IP) and story.png (crop) share id -> fix ids
for im in images:
    if im["file"]=="images/story.jpg": im["id"]="story-art"

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 4 · 6-р хичээл — Чи манай шинэ ангид очиж үзсэн үү?","chineseTitle":"你去过我们的新教室吗？","targetTitle":"你去过我们的新教室吗？","mongolianTitle":"Чи манай шинэ ангид очиж үзсэн үү?",
 "subtitle":"教室 · 走 · 过 · 左 · 右 · 前 · 后 · «鞋下边的画儿» үлгэр",
 "description":f"Очиж үзсэнээ хэлэх, зүүн баруун урд ард чиглэлийг хэлж сурна. {len(vocab)} үг, 2 зурагт яриа, Mini story «鞋下边的画儿», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🏫","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 4",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 4 — 第6课《你去过我们的新教室吗？》 [hskLevel=2] [lessonNumber=6]; эх: сурах бичиг х.28–32; аудио CD 06-01…06-04 (бүгд байгаа)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你去过我们的新教室吗？","mongolianTitle":"Чи манай шинэ ангид очиж үзсэн үү?",
 "series":"YCT 标准教程 4","seriesLabel_mn":"YCT 4 — Хүүхдийн хятад хэл (≈HSK2–3)",
 "source":"YCT 标准教程 4 · 第6课 (сурах бичиг + CD аудио 06-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L6)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
