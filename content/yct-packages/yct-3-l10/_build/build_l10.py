#!/usr/bin/env python3
"""YCT 标准教程 3 · 第10课 谁跑得快？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re
OUT = "/home/claude/work/yct3/l10/pkg"
CID, LID, N = "yct-3", "yct-3-l10", 10
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

# Тестийн зураг (hi-54.png) + story (hi-53.png)
from PIL import Image
_pg = Image.open("/home/claude/work/yct3/l10/pages/hi-54.png").convert("RGB")
_BOX = {"t2a":(285,725,425,975),"t2b":(500,820,710,965),"t2c":(750,745,875,970),"t2d":(955,815,1155,960)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct3/l10/pages/hi-53.png").convert("RGB").crop((165,305,1175,1486)).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-3-10-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-3-10-text-song.mp3"   # яриа (02) + chant (03)

# ---------------- VOCAB ----------------
VOCAB = [
 ("老虎","lǎohǔ","бар","нэр үг · гол үг","老虎跑得快。","Lǎohǔ pǎo de kuài.","Бар хурдан гүйдэг.",True),
 ("第一","dì yī","нэгдүгээр, тэргүүн","тоо · гол үг","胖的第一。","Pàngde dì yī.","Тарган нь нэгдүгээр.",True),
 ("胖","pàng","тарган","тэмдэг нэр · нэмэлт үг","这只老虎很胖。","Zhè zhī lǎohǔ hěn pàng.","Энэ бар тарган байна.",False),
 ("瘦","shòu","туранхай","тэмдэг нэр · нэмэлт үг","那只老虎很瘦。","Nà zhī lǎohǔ hěn shòu.","Тэр бар туранхай байна.",False),
 ("些","xiē","хэдэн, зарим","хэмжигдэхүүн · гол үг","这些老虎谁跑得快？","Zhèxiē lǎohǔ shéi pǎo de kuài?","Эдгээр бар дотроос хэн хурдан гүйх вэ?",True),
 ("得","de","(хэрхэн хийдгийг холбодог үг)","туслах үг · гол үг","他吃得很多。","Tā chī de hěn duō.","Тэр маш их иддэг.",True),
 ("快","kuài","хурдан","тэмдэг нэр · гол үг","你跑得快吗？","Nǐ pǎo de kuài ma?","Чи хурдан гүйдэг үү?",True),
 ("知道","zhīdào","мэдэх","үйл үг · гол үг","我不知道。","Wǒ bù zhīdào.","Би мэдэхгүй.",True),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 3","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
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
 {"id":1,"title_mn":"Яриа 1 · Хэн хурдан гүйх вэ?","scene_mn":"Гүйлтийн талбай дээр дөрвөн бар гүйхээр зогсч байна. Арслан шүүгч, туулай, панда, сармагчин хэн нь түрүүлэхийг таамаглаж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"狮子","zh":"这些老虎谁跑得快？","pinyin":"Zhèxiē lǎohǔ shéi pǎo de kuài?","mn":"Эдгээр бар дотроос хэн хурдан гүйх вэ?"},
           {"speaker":"兔子","zh":"不知道。你觉得谁能跑第一？","pinyin":"Bù zhīdào. Nǐ juéde shéi néng pǎo dì yī?","mn":"Мэдэхгүй ээ. Чи хэн түрүүлнэ гэж бодож байна?"},
           {"speaker":"猴子","zh":"瘦的那只。","pinyin":"Shòude nà zhī.","mn":"Тэр туранхай нь байх аа."}]},
 {"id":2,"title_mn":"Яриа 2 · Тэмцээний дүн","scene_mn":"Барууд гүйж дууслаа. Хүн бүр гайхаад байна: хэн нэгдүгээрт орсон бэ?","audio":AUD_TEXT,
  "lines":[{"speaker":"兔子","zh":"那只瘦老虎是第一吗？","pinyin":"Nà zhī shòu lǎohǔ shì dì yī ma?","mn":"Тэр туранхай бар нэгдүгээр байсан юм уу?"},
           {"speaker":"狮子","zh":"瘦的第三，胖的第一。","pinyin":"Shòude dì sān, pàngde dì yī.","mn":"Туранхай нь гуравдугаар, тарган нь нэгдүгээр."},
           {"speaker":"熊猫","zh":"真的吗？","pinyin":"Zhēnde ma?","mn":"Үнэн үү?"},
           {"speaker":"猴子","zh":"那只老虎最胖，但是跑得最快。","pinyin":"Nà zhī lǎohǔ zuì pàng, dànshì pǎo de zuì kuài.","mn":"Тэр бар хамгийн тарган боловч хамгийн хурдан гүйсэн."}]},
]
sentences=[]
dlg = [
 (1,"狮子：这些老虎谁跑得快？","Shīzi: Zhèxiē lǎohǔ shéi pǎo de kuài?","Арслан: Эдгээр бар дотроос хэн хурдан гүйх вэ?","狮子：| 这些|zhèxiē 老虎|lǎohǔ 谁|shéi 跑|pǎo 得|de 快|kuài ？|","谁跑得快？ — «хэн хурдан гүйдэг вэ?» гэж асууна. 得 нь «яаж гүйдэг вэ» гэдгийг хэлдэг үг.",["谁跑得快？"]),
 (1,"兔子：不知道。你觉得谁能跑第一？","Tùzi: Bù zhīdào. Nǐ juéde shéi néng pǎo dì yī?","Туулай: Мэдэхгүй ээ. Чи хэн түрүүлнэ гэж бодож байна?","兔子：| 不|bù 知道|zhīdào 。| 你|nǐ 觉得|juéde 谁|shéi 能|néng 跑|pǎo 第一|dì yī ？|","不知道 = «мэдэхгүй». 第一 = нэгдүгээр.",[]),
 (1,"猴子：瘦的那只。","Hóuzi: Shòude nà zhī.","Сармагчин: Тэр туранхай нь байх аа.","猴子：| 瘦的|shòude 那只|nà zhī 。|","瘦的 = «туранхай нь». 的-ээр «аль нь» гэдгээ хэлдэг.",[]),
 (2,"兔子：那只瘦老虎是第一吗？","Tùzi: Nà zhī shòu lǎohǔ shì dì yī ma?","Туулай: Тэр туранхай бар нэгдүгээр байсан юм уу?","兔子：| 那只|nà zhī 瘦|shòu 老虎|lǎohǔ 是|shì 第一|dì yī 吗|ma ？|","",[]),
 (2,"狮子：瘦的第三，胖的第一。","Shīzi: Shòude dì sān, pàngde dì yī.","Арслан: Туранхай нь гуравдугаар, тарган нь нэгдүгээр.","狮子：| 瘦的|shòude 第三|dì sān ，| 胖的|pàngde 第一|dì yī 。|","胖的第一 — энэ хичээлийн гол өгүүлбэр!",["胖的第一。"]),
 (2,"熊猫：真的吗？","Xióngmāo: Zhēnde ma?","Панда: Үнэн үү?","熊猫：| 真的|zhēnde 吗|ma ？|","",[]),
 (2,"猴子：那只老虎最胖，但是跑得最快。","Hóuzi: Nà zhī lǎohǔ zuì pàng, dànshì pǎo de zuì kuài.","Сармагчин: Тэр бар хамгийн тарган боловч хамгийн хурдан гүйсэн.","猴子：| 那只|nà zhī 老虎|lǎohǔ 最|zuì 胖|pàng ，| 但是|dànshì 跑|pǎo 得|de 最|zuì 快|kuài 。|","最 = «хамгийн». 但是 = «харин, гэвч».",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
chant = [
 ("两只老虎，两只老虎，","Liǎng zhī lǎohǔ, liǎng zhī lǎohǔ,","Хоёр бар, хоёр бар,","两|liǎng 只|zhī 老虎|lǎohǔ ，| 两|liǎng 只|zhī 老虎|lǎohǔ ，|"),
 ("跑得快，跑得快，","Pǎo de kuài, pǎo de kuài,","Хурдан гүйнэ, хурдан гүйнэ,","跑|pǎo 得|de 快|kuài ，| 跑|pǎo 得|de 快|kuài ，|"),
 ("一只没有耳朵，","Yì zhī méiyǒu ěrduo,","Нэг нь чихгүй,","一|yì 只|zhī 没有|méiyǒu 耳朵|ěrduo ，|"),
 ("一只没有尾巴，","Yì zhī méiyǒu wěiba,","Нэг нь сүүлгүй,","一|yì 只|zhī 没有|méiyǒu 尾巴|wěiba ，|"),
 ("真奇怪，真奇怪。","Zhēn qíguài, zhēn qíguài.","Ямар сонин вэ, ямар сонин вэ!","真|zhēn 奇怪|qíguài ，| 真|zhēn 奇怪|qíguài 。|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Let's chant «两只老虎» — аль хэдийн мэдэх хоёр барын дуу! Дуулж, гараа даллаж, хөлөө дэвслээрэй."
    if i==4: s["note"]="奇怪 = сонин, хачин. Нэг бар чихгүй, нөгөө нь сүүлгүй!"
    sentences.append(s)
story = [
 ("二虎：我们三个谁跑得最快？","Èr Hǔ: Wǒmen sān ge shéi pǎo de zuì kuài?","Эр Ху: Бид гурвын хэн нь хамгийн хурдан гүйдэг вэ?","二虎：| 我们|wǒmen 三|sān 个|ge 谁|shéi 跑|pǎo 得|de 最|zuì 快|kuài ？|"),
 ("大虎：当然是我。","Dà Hǔ: Dāngrán shì wǒ.","Дэ Ху: Мэдээж би.","大虎：| 当然|dāngrán 是|shì 我|wǒ 。|"),
 ("二虎：为什么？","Èr Hǔ: Wèi shénme?","Эр Ху: Яагаад?","二虎：| 为什么|wèi shénme ？|"),
 ("大虎：我穿了运动鞋。","Dà Hǔ: Wǒ chuān le yùndòngxié.","Дэ Ху: Би спортын гутал өмссөн.","大虎：| 我|wǒ 穿|chuān 了|le 运动鞋|yùndòngxié 。|"),
 ("三虎：我也穿了运动鞋。","Sān Hǔ: Wǒ yě chuān le yùndòngxié.","Сан Ху: Би ч гэсэн спортын гутал өмссөн.","三虎：| 我|wǒ 也|yě 穿|chuān 了|le 运动鞋|yùndòngxié 。|"),
 ("二虎：我的鞋上有“飞机”。","Èr Hǔ: Wǒ de xié shàng yǒu “fēijī”.","Эр Ху: Миний гутал дээр «нисэх онгоц» байна.","二虎：| 我|wǒ 的|de 鞋|xié 上|shàng 有|yǒu “| 飞机|fēijī ”。|"),
 ("二虎：飞机飞得最快，当然我是第一。","Èr Hǔ: Fēijī fēi de zuì kuài, dāngrán wǒ shì dì yī.","Эр Ху: Онгоц хамгийн хурдан нисдэг. Мэдээж би нэгдүгээр!","二虎：| 飞机|fēijī 飞|fēi 得|de 最|zuì 快|kuài ，| 当然|dāngrán 我|wǒ 是|shì 第一|dì yī 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «谁跑得最快？» — гурван барын хошин үлгэр (аудио 10-04). Номд барууд нэргүй тул бид Дэ Ху, Эр Ху, Сан Ху гэж нэрлэв."
    if i==5: s["note"]="Гутал дээрх «飞机» (онгоц) зураг нь хурдан гэсэн хошин санаа!"
    sentences.append(s)

texts = {
 "unit":{"number":"10","title":"谁跑得快？","mongolianTitle":"Хэн хурдан гүйдэг вэ? — хурдан, тарган, туранхайг хэлэх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх номд чи амьтан, хоол, гэр бүлээ хэлж сурсан даа. Одоо хэн нь хурдан гүйдгийг хэлж сурна. Бар бүгдээрээ гүйх гэж байна, тэмцээн эхэллээ! Тарган бар хурдан гүйх үү, туранхай бар хурдан гүйх үү? Чи юу гэж бодож байна? Өнөөдөр «谁跑得快？» гэж асууж, «胖的第一» гэж хариулна. Мөн «快» (хурдан), «胖» (тарган), «瘦» (туранхай) гэсэн үгс сурна. Дараа нь «两只老虎» дууг дуулж, гурван барын хошин үлгэр уншина. Эхэлцгээе!",
  "warmup_mn":"Чи ангидаа хамгийн хурдан гүйдэг хүүхдийг мэдэх үү? Чи өөрөө хэд дэх нь гүйх вэ?",
  "theme_zh":"谁跑得快 · 胖 · 瘦 · 第一","theme_mn":"Хэн хурдан вэ · тарган · туранхай · нэгдүгээр"},
 "warmup":{"mongolian":"Чи ангидаа хамгийн хурдан гүйдэг хүүхдийг мэдэх үү? Хамгийн дуртай амьтан чинь юу вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"10","title":"谁跑得快？","mongolianTitle":"Хэн хурдан гүйдэг вэ? — яриа, дуу, үлгэр","title_mn":"Let's read · 2 яриа + Let's chant · 两只老虎 + Mini story · 谁跑得最快？","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 3 · 第10课 Let's read / Let's chant / Mini story（CD 10-02, 10-03, 10-04）","author_zh":"",
  "intro_zh":"这些老虎谁跑得快？胖的第一！先读两段对话，再唱《两只老虎》，最后读小故事。",
  "intro_mn":"Эхлээд хоёр яриа уншина: «这些老虎谁跑得快？» гэж асуугаад «胖的第一» гэж хариулна. Дараа нь «两只老虎» дууг дуулна. Хамгийн сүүлд гурван барын үлгэр. Аудиог сонсоод, хамт чанга хэлээрэй. Дууг дуулахдаа хоёр гараа даллаж, байгаа газраа гүйж байгаа юм шиг хийж үз!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Гүйлтийн өмнө арслан «хэн хурдан гүйх вэ?» гэж асууна. Сармагчин туранхай бар хурдан гэж бодно."},
   {"paragraph":2,"mn":"Яриа 2 — Тэмцээн дууссан. Гэтэл тарган бар нэгдүгээрт, туранхай бар гуравдугаарт орсон байна! Хамгийн тарган бар хамгийн хурдан гүйсэн."},
   {"paragraph":3,"mn":"Дуу «两只老虎» — Хоёр бар хурдан гүйнэ. Нэг нь чихгүй, нөгөө нь сүүлгүй, ямар сонин юм бэ! Аудио: 10-03."},
   {"paragraph":4,"mn":"Үлгэр «谁跑得最快？» — Гурван бар хэн хамгийн хурдан гэж маргана. Нэг нь спортын гутал өмссөн гэнэ. Нөгөө нь гутал дээрээ «онгоц» байна, онгоц хамгийн хурдан тул би нэгдүгээр гэнэ. Аудио: 10-04."}],
  "reflection":{"questions_mn":["Чи хурдан гүйдэг үү? «我跑得快» гэж хэлж үз.","Дуртай амьтан чинь юу вэ? Тэр хурдан үү?","Гурван баранд ямар дүн гарна гэж чи бодож байна?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Хэн хурдан бэ","zh":"谁跑得快？","pinyin":"Shéi pǎo de kuài?","mn":"Хэн хурдан гүйдэг вэ?"},
  "writingPrompt_mn":"Найзтайгаа «谁跑得快？» гэж асуугаад «我跑得快» эсвэл «他跑得快» гэж хариул."},
 "properNouns":[{"zh":"二虎","pinyin":"Èr Hǔ","mn":"Эр Ху (үлгэрийн бар)"},{"zh":"大虎","pinyin":"Dà Hǔ","mn":"Дэ Ху (үлгэрийн бар)"},{"zh":"三虎","pinyin":"Sān Hǔ","mn":"Сан Ху (үлгэрийн бар)"}],
 "wordExplanation":[
  {"word":"跑得快","gloss":"pǎo de kuài — хурдан гүйдэг","explanation":"Хэн нэгэн ямар хурдаар, хэр их хийж байгааг хэлэхдээ «юу хийх + 得 + ямар» гэж хэлнэ. 跑 = гүйх, 快 = хурдан, тиймээс 跑得快 = хурдан гүйдэг. 吃得多 бол «их иддэг». Асуухдаа «谁跑得快？» гэнэ.",
   "structure":"хэн + юу хийх + 得 + ямар？ → 他跑得快。","teacher_notes":"Хүүхдүүдэд бодит байдлаар үзүүл: «хурдан гүй!», «удаан гүй!». Дүрмийн нэр томьёо хэрэглэхгүй.",
   "examples":[{"chinese":"谁跑得快？","pinyin":"Shéi pǎo de kuài?","mongolian":"Хэн хурдан гүйдэг вэ?"},{"chinese":"他吃得很多。","pinyin":"Tā chī de hěn duō.","mongolian":"Тэр маш их иддэг."},{"chinese":"飞机飞得最快。","pinyin":"Fēijī fēi de zuì kuài.","mongolian":"Онгоц хамгийн хурдан нисдэг."}],
   "common_mistakes":[{"wrong":"谁跑快？","right":"谁跑得快？","why":"跑 ба 快-ийн дунд 得 заавал орно."}],
   "check":{"question":"«Хэн хурдан гүйдэг вэ?» хятадаар:","options":["谁跑得快？","这些老虎很胖。","我不知道。"],"answer":"0"},
   "practice":[{"n":1,"question":"他跑 ________ 快。(...)","answer":"得","explanation_mn":"Хурдан гүйдэг гэхэд 跑得快."}]},
  {"word":"胖的 · 瘦的","gloss":"pàngde · shòude — тарган нь · туранхай нь","explanation":"«胖的» бол «тарган нь», «瘦的» бол «туранхай нь». Хэд хэдэн зүйлээс аль нэгийг заахдаа үгийн ард 的 нэмнэ. «胖的第一» — тарган нь нэгдүгээр.",
   "structure":"胖/瘦 + 的 + 第一 → 胖的第一。","teacher_notes":"Хоёр хүүхдийг (өндөр, намхан гэх мэт) тавьж «高的 …» гэж асуу.",
   "examples":[{"chinese":"胖的第一。","pinyin":"Pàngde dì yī.","mongolian":"Тарган нь нэгдүгээр."},{"chinese":"瘦的第三。","pinyin":"Shòude dì sān.","mongolian":"Туранхай нь гуравдугаар."},{"chinese":"瘦的那只。","pinyin":"Shòude nà zhī.","mongolian":"Туранхай нь."}],
   "common_mistakes":[{"wrong":"胖第一。","right":"胖的第一。","why":"Аль нь гэдгийг заахдаа 胖 ард 的 нэмнэ."}],
   "check":{"question":"«Туранхай нь гуравдугаар» хятадаар:","options":["瘦的第三。","胖的第一。","老虎很胖。"],"answer":"0"},
   "practice":[{"n":1,"question":"胖 ________ 第一。","answer":"的","explanation_mn":"«Тарган нь» — 胖的."}]},
  {"word":"最 · 但是","gloss":"zuì · dànshì — хамгийн · гэвч","explanation":"最 = «хамгийн». 最胖 = хамгийн тарган, 最快 = хамгийн хурдан. 但是 = «гэвч, харин». «那只老虎最胖，但是跑得最快» — Тэр бар хамгийн тарган боловч хамгийн хурдан гүйдэг.",
   "structure":"最 + ямар (快/胖) · …，但是……","teacher_notes":"Let's match: 这些老虎很胖，但是吃得很多。 Хоёр хэсгийг «гэвч»-ээр холбож тоглуул.",
   "examples":[{"chinese":"那只老虎最胖。","pinyin":"Nà zhī lǎohǔ zuì pàng.","mongolian":"Тэр бар хамгийн тарган."},{"chinese":"他很瘦，但是跑得最快。","pinyin":"Tā hěn shòu, dànshì pǎo de zuì kuài.","mongolian":"Тэр туранхай ч хамгийн хурдан гүйдэг."},{"chinese":"飞机飞得最快。","pinyin":"Fēijī fēi de zuì kuài.","mongolian":"Онгоц хамгийн хурдан нисдэг."}],
   "common_mistakes":[{"wrong":"跑得快最。","right":"跑得最快。","why":"最 нь 快-ийн өмнө орно."}],
   "check":{"question":"«Хамгийн хурдан» хятадаар:","options":["最快","很胖","第一"],"answer":"0"},
   "practice":[{"n":1,"question":"老虎跑得 ________ 快。(хамгийн)","answer":"最","explanation_mn":"Хамгийн хурдан — 最快."}]},
 ],
 "collocations":[{"type":"得 — хэрхэн хийдгийг хэлэх","rows":[
   {"head":"跑得","with":"快","mn":"хурдан гүйдэг","usage_mn":"Гүйх хурдыг хэлэх","example":{"zh":"谁跑得快？","pinyin":"Shéi pǎo de kuài?","mn":"Хэн хурдан гүйдэг вэ?"}},
   {"head":"吃得","with":"很多","mn":"их иддэг","usage_mn":"Хэдий хэр иддэгийг хэлэх","example":{"zh":"但是吃得很多。","pinyin":"Dànshì chī de hěn duō.","mn":"Гэвч их иддэг."}},
   {"head":"飞得","with":"最快","mn":"хамгийн хурдан нисдэг","usage_mn":"Тэмцээн, харьцуулалт","example":{"zh":"飞机飞得最快。","pinyin":"Fēijī fēi de zuì kuài.","mn":"Онгоц хамгийн хурдан нисдэг."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["得","快","胖","知道"],"items":[
     {"n":1,"question":"谁跑 ________ 快？","answer":"得","explanation_mn":"«跑得快» — 跑 ба 快-ийн дунд 得."},
     {"n":2,"question":"那只老虎跑得很 ________ 。","answer":"快","explanation_mn":"Хурдан гүйдэг — 快."},
     {"n":3,"question":"他吃得很多，所以很 ________ 。","answer":"胖","explanation_mn":"Их идвэл тарган болно — 胖."},
     {"n":4,"question":"我不 ________ 。","answer":"知道","explanation_mn":"Мэдэхгүй — 不知道."}]}],
   "answer_source":"agent-authored (YCT 3 · 10-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"谁是第一？","answer":"胖的是第一。","explanation_mn":"Яриа 2 — «瘦的第三，胖的第一» гэсэн."},
     {"n":2,"question_zh":"那只瘦老虎跑得快吗？","answer":"不快，是第三。","explanation_mn":"Туранхай бар гуравдугаар орсон тул хурдан биш."}],
   "answer_source":"textbook_verified (Let's read, х.49 Questions)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Таа даа (Guesswork)","start_zh":"老虎！","instruction_mn":"2–3 багт хуваагд. Нэг нь «老虎, 胖, 瘦, 快, 知道» гэсэн үгсийн нэгийг хөдөлгөөнөөр үзүүлнэ (үг хэлэхгүй!). Бусад нь юу гэсэн үг болохыг таана. Хамгийн олныг таасан баг хожно."},
     {"label":"Хурдан гүйе","start_zh":"谁跑得快？","instruction_mn":"Найзтайгаа гүйлтийн тэмцээн хий. Дууссаны дараа «谁跑得快？» гэж асуугаад «我跑得快！» эсвэл «他跑得快！» гэж хариул. Хэн нэгдүгээр байв?"},
     {"label":"Тарган, туранхай","start_zh":"胖的第一。","instruction_mn":"Зургаар хоёр бар зур. Нэгийг нь тарган, нөгөөг нь туранхай болго. Найздаа «胖的第一？» гэж асуугаарай, тэр «瘦的第一！» гэж хариулаарай."},
     {"label":"Хамгийн ямар вэ?","start_zh":"我最……","instruction_mn":"Ангийн найзуудаасаа «你觉得谁跑得最快？» гэж асууж судалгаа ав. Хэн нь хамгийн олон санал авсан бэ? Дараа нь тэр хүн «当然是我！» гэж хэлээрэй."},
     {"label":"三只老虎 жүжиг","start_zh":"谁跑得最快？","instruction_mn":"Гурван хүн гурван бар болж үлгэрийг жүжигчил. Нэг нь «我穿了运动鞋» гэнэ, нөгөө нь «我的鞋上有飞机» гэнэ. Хэн хожих вэ? Өөрөөр төгсгөл бодоод үз!"}]}},
 "grammarNotes":[],
 "culture":{"title":"两只老虎","title_mn":"Хятад хүүхдийн дуртай дуу — 两只老虎","text_mn":"«两只老虎» бол Хятадын бүх хүүхэд мэддэг дуу. Хөгжим нь Францын «Frère Jacques» дуутай адил. Хятад хүүхдүүд нэг, хоёрдугаар ангидаа ийм дууг хөдөлгөөнтэй дуулдаг. Хятадад бар бол хүч чадал, зориг гэсэн утгатай, шинэ жилийн зураг дээр ч олон тохиолддог.","note_mn":"Чи хамгийн дуртай хүүхдийн дуугаа гэртээ дуулж өгөөч. Хятад найздаа сургаж болох уу?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — хурдан гүйдгээ, тарган, туранхайг хэлэх.","topic":"Хэн хурдан гүйдэг вэ?","discussion":["Хосоороо: «谁跑得快？» гэж асууж, найзаа заагаад «他跑得快» гэж хариул.","Бүгдээрээ «胖的第一» гэж дуугаар хэлж, яагаад тарган бар нэгдүгээрт орсныг ярилц."],
   "writing":{"promptChinese":"我跑得快。他跑得慢。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «你跑得快不快？» гэж хятадаар асуугаад хариултыг нь сонс.","minChars":"0","requiredWords":["快","跑"],"sampleChinese":"胖的第一。","sampleMongolian":"Тарган нь нэгдүгээр.","gradingRubric":"跑得快 бүтцийг зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 3 · Test Answers: L10 1.B 2.B 3.B 4.C 5.B 6.C 7.A 8.D","parts":[]},
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
 {"point":"谁跑得快？ — хэн хурдан вэ","gloss_mn":"«Хэн хурдан гүйдэг вэ?» — хэн нэгний чадварыг асууна",
  "structure":"谁 + юу хийх + 得 + 快？ → 他跑得快。",
  "teacher_mn":"Хэн хурдан гүйдгийг асуумаар байвал «谁跑得快？» гэнэ. 跑 = гүйх, 快 = хурдан. Дундаа 得 гэсэн жижиг үг орно. Хариулахдаа «他跑得快» гэнэ. Хөл дээрээ гүйж байгаа юм шиг хийгээд хэлж үз!",
  "teacher_notes":"Номын яриа: 这些老虎谁跑得快？ 瘦的那只。 得 нь үйлдлийг хэрхэн хийдгийг холбоно.",
  "examples":[ex("这些老虎谁跑得快？","Zhèxiē lǎohǔ shéi pǎo de kuài?","Эдгээр бар дотроос хэн хурдан гүйх вэ?"),ex("谁跑得最快？","Shéi pǎo de zuì kuài?","Хэн хамгийн хурдан гүйдэг вэ?"),ex("飞机飞得最快。","Fēijī fēi de zuì kuài.","Онгоц хамгийн хурдан нисдэг.")],
  "common_mistakes":[{"wrong":"谁跑快？","right":"谁跑得快？","why":"跑 ба 快-ийн дунд 得 орно."}],
  "check":chk("«Хэн хурдан гүйдэг вэ?» гэж асуу:",["谁跑得快？","这些老虎很胖。","我不知道。"],"谁跑得快？","g1c"),
  "exercises":[
   choice("谁跑 ________ 快？",["得","的","了"],"得","Зөв! 跑得快.","Үйл үг ба «хэрхэн»-ийн дунд 得 орно.","g1e1"),
   choice("«Онгоц хамгийн хурдан нисдэг» хятадаар:",["飞机飞得最快。","飞机很胖。","飞机不知道。"],"飞机飞得最快。","Зөв!","最快 = хамгийн хурдан.","g1e2"),
   judge("«快» гэдэг нь «хурдан» гэсэн үг.",True,"Зөв! 快 = хурдан.","快 = хурдан.")]},
 {"point":"胖的第一 — тарган нь нэгдүгээр","gloss_mn":"«…нь» — олноос аль нэгийг заана",
  "structure":"胖/瘦 + 的 + 第一/第三 → 胖的第一。",
  "teacher_mn":"Олон барын дундаас аль нэгийг заахдаа үгийн ард 的 нэмнэ. 胖的 = тарган нь. 瘦的 = туранхай нь. 第一 = нэгдүгээр, 第三 = гуравдугаар. Хоёр найзаа «高的 …» гэж заагаад үз!",
  "teacher_notes":"Номын яриа 2: 瘦的第三，胖的第一。",
  "examples":[ex("胖的第一。","Pàngde dì yī.","Тарган нь нэгдүгээр."),ex("瘦的第三。","Shòude dì sān.","Туранхай нь гуравдугаар."),ex("瘦的那只。","Shòude nà zhī.","Тэр туранхай нь байх аа.")],
  "common_mistakes":[{"wrong":"胖第一。","right":"胖的第一。","why":"Аль нь гэдгийг заахад 的 хэрэгтэй."}],
  "check":chk("«Тарган нь нэгдүгээр» хятадаар:",["胖的第一。","瘦的第三。","老虎跑得快。"],"胖的第一。","g2c"),
  "exercises":[
   choice("瘦 ________ 第三。",["的","得","吗"],"的","Зөв! 瘦的 = туранхай нь.","Аль нь гэдгийг заахад 的.","g2e1"),
   choice("«Туранхай» хятадаар:",["瘦","胖","快"],"瘦","Зөв! 瘦 = туранхай.","胖 = тарган, 瘦 = туранхай, 快 = хурдан.","g2e2"),
   judge("«第一» гэдэг нь «нэгдүгээр» гэсэн үг.",True,"Зөв! 第一 = нэгдүгээр.","第一 = нэгдүгээр.")]},
 {"point":"最 · 但是 — хамгийн, гэвч","gloss_mn":"«Тэр хамгийн тарган, гэвч хамгийн хурдан»",
  "structure":"最 + ямар (快/胖) · ……，但是……",
  "teacher_mn":"Хамгийн ихийг хэлэхдээ 最 гэнэ. 最快 = хамгийн хурдан. Хоёр өөр зүйлийг холбохдоо 但是 = «гэвч» гэнэ. Тарган бар хамгийн хурдан гүйсэн нь гайхалтай биш үү!",
  "teacher_notes":"Let's match: 这些老虎很胖，但是吃得很多。",
  "examples":[ex("那只老虎最胖，但是跑得最快。","Nà zhī lǎohǔ zuì pàng, dànshì pǎo de zuì kuài.","Тэр бар хамгийн тарган боловч хамгийн хурдан гүйсэн."),ex("那些熊猫很瘦，但是跑得最快。","Nàxiē xióngmāo hěn shòu, dànshì pǎo de zuì kuài.","Тэр пандууд туранхай ч хамгийн хурдан гүйдэг."),ex("这些老虎很胖，但是吃得很多。","Zhèxiē lǎohǔ hěn pàng, dànshì chī de hěn duō.","Эдгээр бар тарган, гэвч их иддэг.")],
  "common_mistakes":[{"wrong":"跑得快最。","right":"跑得最快。","why":"最 нь 快-ийн өмнө орно."}],
  "check":chk("«Хамгийн хурдан» хятадаар:",["最快","很胖","第一"],"最快","g3c"),
  "exercises":[
   choice("那只老虎 ________ 胖。",["最","得","的"],"最","Зөв! 最胖 = хамгийн тарган.","最 = хамгийн.","g3e1"),
   choice("她很瘦，________ 跑得很快。",["但是","第一","知道"],"但是","Зөв! 但是 = гэвч.","Эсрэг утгатай хоёр хэсгийг 但是 (гэвч)-ээр холбоно.","g3e2"),
   judge("«但是» гэдэг нь «гэвч» гэсэн үг.",True,"Зөв! 但是 = гэвч.","但是 = гэвч, харин.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Бар» хятадаар аль нь вэ?",["老虎","医生","包子","妈妈"],"老虎","老虎 (lǎohǔ) = бар.","easy",["vocabulary"],"a1")
q("choice","«Тарган» хятадаар аль нь вэ?",["胖","瘦","快","第一"],"胖","胖 (pàng) = тарган.","easy",["vocabulary"],"a2")
q("choice","«Туранхай» хятадаар аль нь вэ?",["瘦","胖","快","老虎"],"瘦","瘦 (shòu) = туранхай.","easy",["vocabulary"],"a3")
q("choice","«快» гэдэг үг ямар утгатай вэ?",["хурдан","тарган","мэдэх","бар"],"хурдан","快 (kuài) = хурдан.","easy",["vocabulary"],"a4")
q("choice","«知道» гэдэг үг ямар утгатай вэ?",["мэдэх","хурдан","туранхай","нэгдүгээр"],"мэдэх","知道 (zhīdào) = мэдэх.","easy",["vocabulary"],"a5")
q("choice","«第一» гэдэг үг ямар утгатай вэ?",["нэгдүгээр","гуравдугаар","хамгийн","хурдан"],"нэгдүгээр","第一 (dì yī) = нэгдүгээр.","easy",["vocabulary"],"a6")
q("choice","«这些» гэдэг үг ямар утгатай вэ?",["эдгээр","тэр","энэ нэг","хэн"],"эдгээр","这些 (zhèxiē) = эдгээр.","medium",["vocabulary"],"a7")
q("choice","«最» гэдэг үг ямар утгатай вэ?",["хамгийн","гэвч","мэдэх","нэгдүгээр"],"хамгийн","最 (zuì) = хамгийн.","medium",["vocabulary"],"a8")
q("choice","«Хэн хурдан гүйдэг вэ?» хятадаар:",["谁跑得快？","谁是医生？","你知道吗？","老虎很胖。"],"谁跑得快？","跑得快 = хурдан гүйдэг.","easy",["dialogue"],"a9")
q("choice","«Тарган нь нэгдүгээр» хятадаар:",["胖的第一。","瘦的第一。","胖的第三。","老虎第一。"],"胖的第一。","胖的 = тарган нь, 第一 = нэгдүгээр.","medium",["dialogue"],"a10")
q("choice","Арслан «瘦的第三，胖的第一» гэвэл юу гэсэн үг вэ?",["Туранхай нь гуравдугаар, тарган нь нэгдүгээр","Туранхай нь нэгдүгээр","Хоёулаа тарган","Бүгд хурдан"],"Туранхай нь гуравдугаар, тарган нь нэгдүгээр","瘦的第三，胖的第一.","medium",["dialogue"],"a11")
q("choice","Яриа 2-т хамгийн хурдан гүйсэн бар ямар байсан бэ?",["Хамгийн тарган","Хамгийн туранхай","Хамгийн жижиг","Хамгийн өндөр"],"Хамгийн тарган","那只老虎最胖，但是跑得最快。","medium",["dialogue"],"a12")
q("cloze","谁跑（ ）快？",["得","的","了","吗"],"得","跑得快 — 得 заавал орно.","easy",["structure"],"a13")
q("cloze","胖（ ）第一。",["的","得","最","吗"],"的","胖的 = тарган нь.","easy",["structure"],"a14")
q("cloze","那只老虎（ ）胖。",["最","得","的","吗"],"最","最胖 = хамгийн тарган.","easy",["structure"],"a15")
q("cloze","他很瘦，（ ）跑得很快。",["但是","第一","知道","老虎"],"但是","但是 = гэвч.","medium",["structure"],"a16")
q("choice","«不知道» гэж хэлвэл юу гэсэн үг вэ?",["Мэдэхгүй","Хурдан","Тарган","Нэгдүгээр"],"Мэдэхгүй","不知道 = мэдэхгүй.","easy",["dialogue"],"a17")
q("choice","«最快» гэж хэлвэл:",["хамгийн хурдан","хамгийн тарган","нэгдүгээр","туранхай"],"хамгийн хурдан","最快 = хамгийн хурдан.","easy",["structure"],"a18")
q("choice","«飞机飞得最快» гэвэл юу гэсэн үг вэ?",["Онгоц хамгийн хурдан нисдэг","Онгоц тарган","Онгоц мэдэхгүй","Онгоц нэгдүгээр байсангүй"],"Онгоц хамгийн хурдан нисдэг","飞机 = онгоц.","medium",["structure"],"a19")
q("choice","«Мэдэхгүй» гэж хэлэхдээ:",["我不知道。","我很胖。","我是第一。","我跑得快。"],"我不知道。","不知道 = мэдэхгүй.","easy",["usage"],"a20")
q("choice","Пиньинь «lǎohǔ» гэж уншдаг үг:",["老虎","胖","知道","第一"],"老虎","老虎 = lǎohǔ = бар.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «kuài» гэж уншдаг үг:",["快","瘦","胖","些"],"快","快 = kuài = хурдан.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «zhīdào» гэж уншдаг үг:",["知道","第一","老虎","这些"],"知道","知道 = zhīdào = мэдэх.","medium",["pronunciation"],"a23")
q("usage","Гүйлтийн дараа «хэн хурдан байсан бэ?» гэж асуух:",["谁跑得快？","我不知道。","胖的第一。","你是医生。"],"谁跑得快？","Хэн хурдан гэж асуухдаа 谁跑得快.","medium",["usage"],"a24")
q("usage","Тарган бар нэгдүгээрт орсныг сонсоод туулай «Үнэн үү?» гэж асуувал:",["真的吗？","我不知道。","胖的第一。","瘦的第三。"],"真的吗？","真的吗 = үнэн үү.","medium",["usage"],"a25")
q("usage","Сан Ху «我也穿了运动鞋» гэвэл тэр юу хэлэв?",["Би ч гэсэн спортын гутал өмссөн","Би тарган","Би мэдэхгүй","Би нэгдүгээр"],"Би ч гэсэн спортын гутал өмссөн","也 = ч гэсэн, 运动鞋 = спортын гутал.","medium",["usage"],"a26")
q("usage","Mini story-д Эр Ху яагаад нэгдүгээр гэж бодсон бэ?",["Гутал дээр нь онгоц байгаа тул","Тэр хамгийн туранхай тул","Тэр хамгийн жижиг тул","Тэр мэддэг тул"],"Гутал дээр нь онгоц байгаа тул","我的鞋上有“飞机” — онгоц хамгийн хурдан!","hard",["usage"],"a27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t2a"),img("t2b"),img("t2c"),img("t2d")]
LBANK = ["A","B","C"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (10-05) сонсоод зөв хариултыг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）女的怎么样？","script_zh":"男：你能跑慢一些吗？ 女：好的，对不起。 问：女的怎么样？","options":LBANK,"optionTexts":["跑得慢","跑得快","不知道"],"answer":"B","explanation_mn":"Эрэгтэй «арай удаан гүйж чадах уу?» гэж гуйсан. Тэгэхээр эмэгтэй хурдан гүйж байсан — B «跑得快». A «удаан» биш, C «мэдэхгүй» биш."},
    {"n":2,"question_zh":"（听录音）男的怎么了？","script_zh":"男：我中午吃得太多，晚上不吃了。 女：那我们出去走走？ 问：男的怎么了？","options":LBANK,"optionTexts":["饿了","吃多了","觉得冷"],"answer":"B","explanation_mn":"«Үдэд хэтэрхий их идсэн» гэсэн тул B «吃多了» (хэтэрхий их идсэн). A «өлссөн» биш, C «даарсан» биш."},
    {"n":3,"question_zh":"（听录音）女的昨晚做什么了？","script_zh":"男：九点了，你怎么还不起床？ 女：我昨晚看电视看得太晚了。 问：女的昨晚做什么了？","options":LBANK,"optionTexts":["跳舞","看电视","画画儿"],"answer":"B","explanation_mn":"Эмэгтэй «өчигдөр орой зурагт үзээд хэт оройтсон» гэсэн — B «看电视»."},
    {"n":4,"question_zh":"（听录音）女的怎么不吃蛋糕？","script_zh":"男：来，吃块儿蛋糕吧。 女：不，我太胖了，我不能再吃蛋糕了。 问：女的怎么不吃蛋糕？","options":LBANK,"optionTexts":["想喝水","吃饱了","太胖了"],"answer":"C","explanation_mn":"Эмэгтэй «Би хэтэрхий тарган болсон, дахиж бялуу идэж болохгүй» гэсэн — C «太胖了»."}],
   "answer_source":"YCT 3 Test Answers L10: 1.B 2.B 3.B 4.C"},
  {"part":2,"type":"choice","instruction_mn":"Унших — яриа бүрд тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"A：你哥哥游泳游得怎么样？ B：在我们学校是第一。","question_mn":"Чиний ах сэлэлтэнд хэр вэ? — Манай сургуульд нэгдүгээр.","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"Сэлэлтийн тухай ярьж байна. B зураг дээр хүн усанд сэлж байна. A дээр хоёр охины нэг нь жин дээр, C өндөр намхан хоёр хүүхэд, D бар гөлөг."},
    {"n":6,"question_zh":"A：姐姐比弟弟个子高。 B：但是弟弟比姐姐跑得快。","question_mn":"Эгч дүүгээсээ өндөр. — Гэвч дүү эгчээсээ хурдан гүйдэг.","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"Хэн өндөр, хэн намхан гэж ярьж байна. C зураг дээр өндөр охин, намхан хөвгүүн зэрэгцэж зогсож байна. A жин, B сэлэлт, D бар."},
    {"n":7,"question_zh":"A：姐姐，你胖了吗？ B：没有，我瘦了一些。","question_mn":"Эгч ээ, чи таргалсан уу? — Үгүй, би бага зэрэг туранхайрсан.","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"Таргалсан эсэхийг ярьж байна. A зураг дээр охин жин дээр зогсож жингээ шалгаж байна. B сэлэлт, C өндөр, D бар."},
    {"n":8,"question_zh":"A：那只小老虎在看什么呢？ B：我也不知道。","question_mn":"Тэр бяцхан бар юу харж байна вэ? — Би ч мэдэхгүй.","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"Бар гөлөг гэсэн үг яриад байна (小老虎). D зураг дээр бяцхан бар гөлөг байна. Бусад зурагт бар байхгүй."}],
   "answer_source":"YCT 3 Test Answers L10: 5.B 6.C 7.A 8.D"},
  {"part":3,"type":"match","instruction_mn":"Let's match — өгүүлбэрийн эхэнд тохирох төгсгөлийг сонго.","items":[
    {"n":1,"question_zh":"这些老虎很胖，____","answer":"但是吃得很多。","explanation_mn":"Бар тарган бол их иддэг."},
    {"n":2,"question_zh":"这些天都在下雪，____","answer":"但是下得不大。","explanation_mn":"Сүүлийн хэд хоногт байнга цас орж байгаа ч их биш."},
    {"n":3,"question_zh":"那些熊猫很瘦，____","answer":"但是跑得最快。","explanation_mn":"Панда туранхай ч хамгийн хурдан гүйдэг."}],
   "answer_source":"Let's match х.50 (хариу агент тааруулсан)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «谁跑得最快？» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"当然是我。","answer":"1","explanation_mn":"1-р зураг дээр нэг бар «Мэдээж би!» гэж хариулна."},
    {"n":2,"question_zh":"我穿了运动鞋。","answer":"2","explanation_mn":"2-р зураг дээр «Яагаад?» гэхэд спортын гутал өмссөнөө хэлнэ."},
    {"n":3,"question_zh":"我的鞋上有“飞机”。","answer":"3","explanation_mn":"3-р зураг дээр бар гутлаа зааж «онгоц» байна гэнэ."},
    {"n":4,"question_zh":"当然我是第一。","answer":"4","explanation_mn":"4-р зураг дээр бар «Онгоц хурдан тул би нэгдүгээр!» гэнэ."}],
   "answer_source":"textbook х.51 (Mini story)"},
  {"part":5,"type":"match","instruction_mn":"Guesswork — багаар хөдөлгөөнөөр үг таа.","items":[
    {"n":1,"question_zh":"胖 — хөдөлгөөнөөр үзүүл","answer":"胖","explanation_mn":"Хоёр гараараа том гэдэс харуулж болно."}],
   "answer_source":"Guesswork х.48"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «老虎» гэсэн ханзыг дахин бичиж хуул.","question_zh":"老虎","answer":"老虎","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа хэн хурдан гүйхийг асуу.","question_zh":"谁跑得快？","answer":"谁跑得快？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":2,"prompt_mn":"Дуугаа хөдөлгөөнтэй дуул.","question_zh":"两只老虎","answer":"两只老虎，两只老虎，跑得快，跑得快……","explanation_mn":"Аудио 10-03-ын хамт."},
   {"n":3,"prompt_mn":"三只老虎 үлгэрийг жүжигчил.","question_zh":"谁跑得最快？","answer":"(нээлттэй)","explanation_mn":"Аудио 10-04-ийн хамт."}]},
 "answerSource":"YCT 标准教程 3 · Test Listening Scripts, Test Answers (Lesson 10)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("laohu","老虎"),("diyi","第一"),("pang","胖"),("shou","瘦"),("xie","些"),("de","得"),("kuai","快"),("zhidao","知道")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"谁跑得快？","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"这些老虎谁跑得快？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"那只瘦老虎是第一吗？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"两只老虎","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"谁跑得最快？ · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["2a","2b","2c","2d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 3 · 10-р хичээл — Хэн хурдан гүйдэг вэ?","chineseTitle":"谁跑得快？","targetTitle":"谁跑得快？","mongolianTitle":"Хэн хурдан гүйдэг вэ?",
 "subtitle":"老虎 · 胖 · 瘦 · 第一 · 跑得快 · «两只老虎» дуу",
 "description":f"Хэн хурдан гүйдгийг (跑得快), тарган туранхайг, нэгдүгээрийг хэлж сурна. {len(vocab)} үг, 2 зурагт яриа, «两只老虎» дуу, Mini story, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🐯","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 3",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 3 — 第10课《谁跑得快？》 [hskLevel=2] [lessonNumber=10]; эх: сурах бичиг х.48–52; аудио CD 10-01…10-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"谁跑得快？","mongolianTitle":"Хэн хурдан гүйдэг вэ?",
 "series":"YCT 标准教程 3","seriesLabel_mn":"YCT 3 — Хүүхдийн хятад хэл (≈HSK2)",
 "source":"YCT 标准教程 3 · 第10课 (сурах бичиг + CD аудио 10-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L10)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
