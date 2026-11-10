#!/usr/bin/env python3
"""YCT 标准教程 3 · 第4课 喂，您好！ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
BASE = "/home/claude/work/yct3/l04"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-3", "yct-3-l04", 4
os.makedirs(f"{OUT}/images", exist_ok=True)

def dump(name, obj, path=OUT):
    with open(f"{path}/{name}", "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

def shuffle(options, correct, seed):
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    opts = list(options)
    for i in range(len(opts) - 1, 0, -1):
        j = h % (i + 1); h //= (i + 1)
        opts[i], opts[j] = opts[j], opts[i]
    return opts, opts.index(correct)

# Тестийн зураг (hi-24.png, 150dpi) хайчлах
from PIL import Image
_pg = Image.open(f"{BASE}/pages/hi-24.png").convert("RGB")
_S = 1240/830
_BOX = {"t1":(377,203,452,287),"t2":(377,292,443,368),"t3":(377,378,452,457),"t4":(377,458,443,543),
        "t5a":(257,600,408,700),"t5b":(552,597,653,725),"t5c":(260,742,400,832),"t5d":(560,742,696,820)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
_pl = Image.open(f"{BASE}/pages/hi-23.png").convert("RGB")
_pl.crop(tuple(int(v*_S) for v in (105,400,785,1040))).save(f"{OUT}/images/play.png")

AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_TEST = [f"audio/yct-3-04-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = "audio/yct-3-04-text-song.mp3"
_lst = f"{BASE}/_concat.txt"
open(_lst,"w").write(f"file '{OUT}/{AUD_TEXT}'\nfile '{OUT}/{AUD_SONG}'\n")
subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",_lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
os.remove(_lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("喂","wèi","халло! (утсаар ярихад)","аялга үг · гол үг","喂，你好！","Wèi, nǐ hǎo!","Халло, сайн уу!",True),
 ("您","nín","та (хүндэтгэж хэлэх «чи»)","төлөөний үг · гол үг","老师，您好！","Lǎoshī, nín hǎo!","Багш аа, сайн байна уу!",True),
 ("找","zhǎo","хайх","үйл үг · гол үг","你找谁？","Nǐ zhǎo shéi?","Чи хэнийг хайж байна?",True),
 ("回","huí","буцах, харих","үйл үг · гол үг","下课了，回家了。","Xiàkè le, huí jiā le.","Хичээл тарлаа, гэртээ харилаа.",True),
 ("问题","wèntí","асуулт","нэр үг · гол үг","我有一个问题。","Wǒ yǒu yí ge wèntí.","Надад нэг асуулт байна.",True),
 ("问","wèn","асуух","үйл үг · гол үг","可以问您吗？","Kěyǐ wèn nín ma?","Танаас асууж болох уу?",True),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 3","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    """'汉字|pīnyīn 汉字|pīn yīn ，|' → tokens. '|'-гүй, ханзгүй хэсгийг өмнөх токений пиньиньд залгана."""
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
 {"id":1,"title_mn":"Яриа 1 · Эмнэлэг рүү утсаар","scene_mn":"Охин буйдан дээр суугаад утсаар ярьж байна. Тэр ээжийгээ хайж байгаа. Утасны нөгөө талд эмнэлгийн сувилагч байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"喂，您好！我找我妈妈。","pinyin":"Wèi, nín hǎo! Wǒ zhǎo wǒ māma.","mn":"Халло, сайн байна уу! Би ээжийгээ хайж байна."},
           {"speaker":"护士","zh":"你妈妈是谁？","pinyin":"Nǐ māma shì shéi?","mn":"Чиний ээж хэн бэ?"},
           {"speaker":"小红","zh":"我妈妈是黄医生。","pinyin":"Wǒ māma shì Huáng yīshēng.","mn":"Миний ээж Хуан эмч."},
           {"speaker":"护士","zh":"这儿有两个黄医生，你找哪个？","pinyin":"Zhèr yǒu liǎng ge Huáng yīshēng, nǐ zhǎo nǎ ge?","mn":"Энд Хуан эмч хоёр байна. Чи аль Хуан эмчийг хайж байна вэ?"}]},
 {"id":2,"title_mn":"Яриа 2 · Багшид утсаар","scene_mn":"Буржгар үстэй охин багшдаа утсаар залгаж байна. Багшийн ажлын өрөөнд өөр нэг багш утсаа авсан байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"玛丽","zh":"喂，您好！张老师在吗？","pinyin":"Wèi, nín hǎo! Zhāng lǎoshī zài ma?","mn":"Халло, сайн байна уу! Жан багш байна уу?"},
           {"speaker":"老师","zh":"张老师回家了。","pinyin":"Zhāng lǎoshī huí jiā le.","mn":"Жан багш гэртээ харьсан."},
           {"speaker":"玛丽","zh":"我有一个问题，可以问您吗？","pinyin":"Wǒ yǒu yí ge wèntí, kěyǐ wèn nín ma?","mn":"Надад нэг асуулт байна. Танаас асууж болох уу?"},
           {"speaker":"老师","zh":"可以，什么问题？","pinyin":"Kěyǐ, shénme wèntí?","mn":"Болно. Ямар асуулт вэ?"}]},
]
sentences=[]
dlg = [
 (1,"小红：喂，您好！我找我妈妈。","Xiǎo Hóng: Wèi, nín hǎo! Wǒ zhǎo wǒ māma.","Сяо Хун: Халло, сайн байна уу! Би ээжийгээ хайж байна.","小红：| 喂|wèi ，| 您好|nín hǎo ！| 我|wǒ 找|zhǎo 我|wǒ 妈妈|māma 。|","喂 — утсаар ярихад «халло» гэнэ. 您好 — том хүнд хүндэтгэж «сайн байна уу» гэнэ.",["喂，您好！","我找我妈妈。"]),
 (1,"护士：你妈妈是谁？","Hùshi: Nǐ māma shì shéi?","Сувилагч: Чиний ээж хэн бэ?","护士：| 你|nǐ 妈妈|māma 是|shì 谁|shéi ？|","",[]),
 (1,"小红：我妈妈是黄医生。","Xiǎo Hóng: Wǒ māma shì Huáng yīshēng.","Сяо Хун: Миний ээж Хуан эмч.","小红：| 我|wǒ 妈妈|māma 是|shì 黄|Huáng 医生|yīshēng 。|","黄 — хүний овог (Хуан). 黄医生 = Хуан эмч.",[]),
 (1,"护士：这儿有两个黄医生，你找哪个？","Hùshi: Zhèr yǒu liǎng ge Huáng yīshēng, nǐ zhǎo nǎ ge?","Сувилагч: Энд Хуан эмч хоёр байна. Чи аль Хуан эмчийг хайж байна вэ?","护士：| 这儿|zhèr 有|yǒu 两个|liǎng ge 黄|Huáng 医生|yīshēng ，| 你|nǐ 找|zhǎo 哪个|nǎ ge ？|","哪个 = «аль нь». 你找哪个？ — Чи аль нь хайж байна?",["你找哪个？"]),
 (2,"玛丽：喂，您好！张老师在吗？","Mǎlì: Wèi, nín hǎo! Zhāng lǎoshī zài ma?","Мари: Халло, сайн байна уу! Жан багш байна уу?","玛丽：| 喂|wèi ，| 您好|nín hǎo ！| 张|Zhāng 老师|lǎoshī 在|zài 吗|ma ？|","",[]),
 (2,"老师：张老师回家了。","Lǎoshī: Zhāng lǎoshī huí jiā le.","Багш: Жан багш гэртээ харьсан.","老师：| 张|Zhāng 老师|lǎoshī 回家|huí jiā 了|le 。|","回家 = гэртээ харих.",["张老师回家了。"]),
 (2,"玛丽：我有一个问题，可以问您吗？","Mǎlì: Wǒ yǒu yí ge wèntí, kěyǐ wèn nín ma?","Мари: Надад нэг асуулт байна. Танаас асууж болох уу?","玛丽：| 我|wǒ 有|yǒu 一个|yí ge 问题|wèntí ，| 可以|kěyǐ 问|wèn 您|nín 吗|ma ？|","可以……吗？ — «…болох уу?» гэж зөвшөөрөл асууна.",["可以问您吗？"]),
 (2,"老师：可以，什么问题？","Lǎoshī: Kěyǐ, shénme wèntí?","Багш: Болно. Ямар асуулт вэ?","老师：| 可以|kěyǐ ，| 什么|shénme 问题|wèntí ？|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
chant = [
 ("两个小娃娃呀，正在打电话呀。","Liǎng ge xiǎo wáwa ya, zhèngzài dǎ diànhuà ya.","Хоёр бяцхан хүүхэд утсаар ярьж байна даа.","两个|liǎng ge 小娃娃|xiǎo wáwa 呀|ya ，| 正在|zhèngzài 打电话|dǎ diànhuà 呀|ya 。|"),
 ("喂喂喂，你在哪里呀？","Wèi wèi wèi, nǐ zài nǎli ya?","Халло, халло, чи хаана байна даа?","喂喂喂|wèi wèi wèi ，| 你|nǐ 在|zài 哪里|nǎli 呀|ya ？|"),
 ("哎哎哎，我在我的家。","Āi āi āi, wǒ zài wǒ de jiā.","Аан, аан, би гэртээ байна.","哎哎哎|āi āi āi ，| 我|wǒ 在|zài 我的|wǒ de 家|jiā 。|"),
 ("两个小娃娃呀，正在打电话呀。","Liǎng ge xiǎo wáwa ya, zhèngzài dǎ diànhuà ya.","Хоёр бяцхан хүүхэд утсаар ярьж байна даа.","两个|liǎng ge 小娃娃|xiǎo wáwa 呀|ya ，| 正在|zhèngzài 打电话|dǎ diànhuà 呀|ya 。|"),
 ("喂喂喂，你在做什么？","Wèi wèi wèi, nǐ zài zuò shénme?","Халло, халло, чи юу хийж байна?","喂喂喂|wèi wèi wèi ，| 你|nǐ 在|zài 做|zuò 什么|shénme ？|"),
 ("哎哎哎，我在学画画儿。","Āi āi āi, wǒ zài xué huà huàr.","Аан, аан, би зураг зурж сурч байна.","哎哎哎|āi āi āi ，| 我|wǒ 在|zài 学|xué 画画儿|huà huàr 。|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Let's chant «两个小娃娃» — утсаар ярьдаг хоёр хүүхдийн дуу. Аудио 04-03."
    if i==2: s["note"]="«我的家» гэсэн хэсгийг өөрөө солиод дуул: 我在学校。 我在公园。"
    if i==5: s["note"]="«学画画儿» гэсэн хэсгийг солиод дуул: 我在吃饭。 我在看书。"
    sentences.append(s)

texts = {
 "unit":{"number":"4","title":"喂，您好！","mongolianTitle":"Халло, сайн байна уу! — утсаар ярих"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. YCT 1, YCT 2 номд чи гэр бүл, тоо, амьтан, хоол хүнсээ сурсан даа. Одоо чи утсаар ярьж чадах уу? Ээж аавдаа, багшдаа, найздаа утсаар залгахад «喂，您好！» гэж хэлдэг юм. Өнөөдөр «我找我妈妈» гэж хэнийг хайж байгаагаа хэлж, «可以问您吗？» гэж эелдэгээр асуухыг сурна. Мөн цаасан аяганы утсаар ярьдаг хоёр бяцхан хүүхдийн дууг хамт дуулъя. Утсаа авсан юм шиг гараа чихэндээ аваарай. Эхэлцгээе!",
  "warmup_mn":"Чи хамгийн сүүлд хэнд утсаар залгасан бэ? Утсаар ярихдаа эхлээд юу гэж хэлдэг вэ?",
  "theme_zh":"喂 · 您 · 找 · 问题","theme_mn":"Халло · та · хайх · асуулт"},
 "warmup":{"mongolian":"Чи хамгийн сүүлд хэнд утсаар залгасан бэ? Утсаар ярихдаа эхлээд юу гэж хэлдэг вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"4","title":"喂，您好！","mongolianTitle":"Халло, сайн байна уу! — 2 яриа, дуу","title_mn":"Let's read · 2 яриа + Let's chant · 两个小娃娃","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 3 · 第4课 Let's read / Let's chant（CD 04-02, 04-03）","author_zh":"",
  "intro_zh":"两段电话对话：我找我妈妈。张老师在吗？然后唱《两个小娃娃》。",
  "intro_mn":"Эхлээд утсаар хийсэн хоёр яриа: «我找我妈妈» гэж ээжийгээ хайна, «张老师在吗？» гэж багшаа хайна. Дараа нь «两个小娃娃» дууг дуулна. Аудиог сонсоод, утас барьсан дүр үзүүлж хамт хэлээрэй. Дуунд өөрийнхөө үгийг оруулж үз!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Охин утсаар ээжийгээ хайна. Ээж нь Хуан эмч. Гэтэл энд Хуан эмч хоёр байгаа тул «аль нь вэ?» гэж асууна."},
   {"paragraph":2,"mn":"Яриа 2 — Охин Жан багшийг хайна. Багш гэртээ харисан байна. Охин нэг асуулт асуух гэсэн юм. «Болно» гэж хариулна."},
   {"paragraph":3,"mn":"Дуу «两个小娃娃» — Хоёр бяцхан хүүхэд утсаар ярьж байна. Нэг нь «чи хаана байна?», «чи юу хийж байна?» гэж асууна. Нөгөө нь «гэртээ байна», «зураг зурж сурч байна» гэнэ. Аудио: 04-03."}],
  "reflection":{"questions_mn":["Чи утсаар залгахдаа «喂，您好！» гэж хэлж үз.","Багшаасаа ямар асуулт асуумаар байна вэ?","Дуунд «我在……» гэж өөрийнхөө юм хийж байгааг хэлж үз."]},
  "writingSample":{"title_mn":"Ярих дасгал · Утсаар ярь","zh":"喂，您好！我找我妈妈。","pinyin":"Wèi, nín hǎo! Wǒ zhǎo wǒ māma.","mn":"Халло, сайн байна уу! Би ээжийгээ хайж байна."},
  "writingPrompt_mn":"Найзтайгаа утсаар ярьж байгаа дүр үзүүлж «喂，您好！我找……» гэж хэл."},
 "properNouns":[{"zh":"黄","pinyin":"Huáng","mn":"Хуан (хүний овог)"},{"zh":"张","pinyin":"Zhāng","mn":"Жан (хүний овог)"}],
 "wordExplanation":[
  {"word":"喂 · 您","gloss":"wèi · nín — халло · та","explanation":"Утсаар ярихад эхлээд «喂» гэж хэлнэ. Монголоор «халло» гэсэн үг. 您 бол «чи» гэдгийн хүндэтгэсэн хэлбэр. Багш, өвөө эмээ, танихгүй том хүнд «您好» гэж хэлнэ. Найздаа «你好» гэнэ.",
   "structure":"喂，您好！ / 喂，你好！","teacher_notes":"Хүүхдээр хуурамч утас барьж эхлээд 喂 гэж хэлүүл. Багшид 您, найздаа 你 гэж ялгуулж дасгалжуул.",
   "examples":[{"chinese":"喂，您好！","pinyin":"Wèi, nín hǎo!","mongolian":"Халло, сайн байна уу!"},{"chinese":"老师，您好！","pinyin":"Lǎoshī, nín hǎo!","mongolian":"Багш аа, сайн байна уу!"},{"chinese":"喂，你好！","pinyin":"Wèi, nǐ hǎo!","mongolian":"Халло, сайн уу!"}],
   "common_mistakes":[{"wrong":"老师，你好！(хэт дотно)","right":"老师，您好！","why":"Багшид хүндэтгэж 您 гэж хэлнэ."}],
   "check":{"question":"Багшдаа утсаар «Сайн байна уу» гэхдээ:","options":["喂，您好！","再见！","谢谢！"],"answer":"0"},
   "practice":[{"n":1,"question":"老师，________ 好！(та)","answer":"您","explanation_mn":"Багшид хүндэтгэж 您 гэнэ."}]},
  {"word":"找","gloss":"zhǎo — хайх, олох","explanation":"找 нь «хайх» гэсэн үг. «Би ээжийгээ хайж байна» = «我找我妈妈». Утсаар ярихад «би … руу залгасан юм» гэсэн утгаар ч хэлнэ. «Чи хэнийг хайж байна?» гэж асуухдаа «你找谁？» гэнэ.",
   "structure":"我找 + хэн / юу。 你找谁？","teacher_notes":"Let's play: 你找什么？/ 你找谁？ 我找…… Нуугдсан зургуудыг хайхдаа ашигла.",
   "examples":[{"chinese":"我找我妈妈。","pinyin":"Wǒ zhǎo wǒ māma.","mongolian":"Би ээжийгээ хайж байна."},{"chinese":"你找谁？","pinyin":"Nǐ zhǎo shéi?","mongolian":"Чи хэнийг хайж байна?"},{"chinese":"这儿有两个黄医生，你找哪个？","pinyin":"Zhèr yǒu liǎng ge Huáng yīshēng, nǐ zhǎo nǎ ge?","mongolian":"Энд Хуан эмч хоёр байна. Чи аль Хуан эмчийг хайж байна вэ?"}],
   "common_mistakes":[{"wrong":"我找谁妈妈。","right":"我找我妈妈。","why":"谁 нь асуулт, хариулахдаа хүнийхээ нэрийг хэл."}],
   "check":{"question":"«Би ээжийгээ хайж байна» хятадаар:","options":["我找我妈妈。","我有一个问题。","张老师回家了。"],"answer":"0"},
   "practice":[{"n":1,"question":"你 ________ 谁？(хайх)","answer":"找","explanation_mn":"«Хайх» гэж 找 гэнэ."}]},
  {"word":"问 · 问题","gloss":"wèn · wèntí — асуух · асуулт","explanation":"问 нь «асуух». 问题 нь «асуулт». «Надад асуулт байна» гэж «我有一个问题» гэнэ. Асуухаасаа өмнө «可以问您吗？» гэж эелдэгээр зөвшөөрөл аваарай. Багш «可以，什么问题？» гэж хариулна.",
   "structure":"我有一个问题。 可以问您吗？","teacher_notes":"Хүүхдүүд багшаасаа зөвшөөрөл асууж дадуул: 老师，我有一个问题，可以问您吗？",
   "examples":[{"chinese":"我有一个问题。","pinyin":"Wǒ yǒu yí ge wèntí.","mongolian":"Надад нэг асуулт байна."},{"chinese":"可以问您吗？","pinyin":"Kěyǐ wèn nín ma?","mongolian":"Танаас асууж болох уу?"},{"chinese":"可以，什么问题？","pinyin":"Kěyǐ, shénme wèntí?","mongolian":"Болно. Ямар асуулт вэ?"}],
   "common_mistakes":[{"wrong":"我有问","right":"我有一个问题。","why":"«Асуулт» гэж хэлэхдээ 问题 гэнэ."}],
   "check":{"question":"«Надад нэг асуулт байна» хятадаар:","options":["我有一个问题。","你找谁？","喂，您好！"],"answer":"0"},
   "practice":[{"n":1,"question":"我有一个 ________ 。(асуулт)","answer":"问题","explanation_mn":"«Асуулт» = 问题."}]},
 ],
 "collocations":[{"type":"Утсаар ярихад хэрэгтэй хэллэг","rows":[
   {"head":"喂","with":"您好","mn":"халло, сайн байна уу","usage_mn":"Утсаа аваад хэлэх","example":{"zh":"喂，您好！","pinyin":"Wèi, nín hǎo!","mn":"Халло, сайн байна уу!"}},
   {"head":"找","with":"妈妈","mn":"ээжийг хайх","usage_mn":"Хэнийг хайж байгаагаа хэлэх","example":{"zh":"我找我妈妈。","pinyin":"Wǒ zhǎo wǒ māma.","mn":"Би ээжийгээ хайж байна."}},
   {"head":"回","with":"家","mn":"гэртээ харих","usage_mn":"Хаашаа явсныг хэлэх","example":{"zh":"张老师回家了。","pinyin":"Zhāng lǎoshī huí jiā le.","mn":"Жан багш гэртээ харьсан."}},
   {"head":"问","with":"问题","mn":"асуулт асуух","usage_mn":"Багшаас асуух","example":{"zh":"我有一个问题。","pinyin":"Wǒ yǒu yí ge wèntí.","mn":"Надад нэг асуулт байна."}}]}],
 "wordComparison":[{"words":["你","您"],"difference_mn":"你 — найз, нас ойролцоо хүнд. 您 — багш, том хүнд хүндэтгэж хэлнэ.","examples":[{"zh":"你好！","mn":"Сайн уу! (найздаа)"},{"zh":"您好！","mn":"Сайн байна уу! (багшдаа)"}]}],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["喂","您","找","问题"],"items":[
     {"n":1,"question":"________ ，您好！","answer":"喂","explanation_mn":"Утсаар ярихад эхлээд 喂."},
     {"n":2,"question":"老师，________ 好！","answer":"您","explanation_mn":"Багшид хүндэтгэж 您."},
     {"n":3,"question":"我 ________ 我妈妈。","answer":"找","explanation_mn":"Ээжийгээ хайна — 找."},
     {"n":4,"question":"我有一个 ________ 。","answer":"问题","explanation_mn":"«Асуулт» — 问题."}]}],
   "answer_source":"agent-authored (YCT 3 · 4-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"女孩在做什么？","answer":"她在打电话（找妈妈）。","explanation_mn":"Яриа 1 — охин утсаар ярьж, ээжийгээ хайж байна."},
     {"n":2,"question_zh":"张老师去哪儿了？","answer":"回家了。","explanation_mn":"Яриа 2 — «张老师回家了» гэсэн."}],
   "answer_source":"textbook (Let's read, х.19 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Утсаар ярилцъя","start_zh":"喂，您好！","instruction_mn":"Хоёр хүн гараа чихэндээ аваад утсаар ярьж байгаа дүр үзүүл. Нэг нь «喂，您好！我找我妈妈。» гэнэ. Нөгөө нь «你妈妈是谁？» гэж асууна. Ээлжээ солиорой."},
     {"label":"Нуугдсан зургуудыг ол","start_zh":"你找什么？","instruction_mn":"Номын 21-р хуудасны нуугдсан зургийг хамт хай. Нэг нь «你找什么？» гэж асууна. Нөгөө нь «我找电话。你呢？» гэж хариулаад олсон зургаа зааж харуулна. Утас, зурагт, бөмбөг, эмээ, өвөө, сар, нарыг хурдан ол!"},
     {"label":"Дугуйн гинж дуу","start_zh":"喂喂喂，你在哪里呀？","instruction_mn":"Олуулаа хоёр хоёроороо тойрог болж зогсоод «两个小娃娃» дууг дуул. Багш «солих!» гэхэд бүгд баруун тийш нэг алхаж дараагийн хүүхэд рүү дуулна. «我的家» гэдгийг «我在学校» гэх мэтээр өөрөө соль!"},
     {"label":"Багшаасаа асуу","start_zh":"我有一个问题，可以问您吗？","instruction_mn":"Нэг нь багш, нөгөө нь сурагч болно. Сурагч «我有一个问题，可以问您吗？» гэж хэлнэ. Багш «可以，什么问题？» гэж хариулна. Дараа нь ээлжээ соль."},
     {"label":"Хэн гэртээ харьсан бэ?","start_zh":"张老师在吗？","instruction_mn":"Нэг нь «××在吗？» гэж утсаар асууна. Нөгөө нь «回家了。» эсвэл «在。» гэж хариулна. Хэн алдаагүй хариулсан нь хожно."}]}},
 "grammarNotes":[],
 "culture":{"title":"喂","title_mn":"Хятадууд утсаар «халло» гэж яаж хэлдэг вэ?","text_mn":"Хятад хүүхдүүд утсаа аваад эхлээд «喂» (wèi) гэж хэлдэг. Монголд «халло» гэдэгтэй адил. Багш, өвөө эмээд залгахдаа «您好» гэж илүү эелдэг хэлнэ. Хятад хүүхэд багшаасаа асуухаасаа өмнө «可以问您吗？» гэж зөвшөөрөл асуудаг.","note_mn":"Чи монголоор утсаа аваад юу гэж хэлдэг вэ? Багшдаа залгахад яаж эелдэгээр ярих вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — утсаар ярих, хэнийг хайж байгаагаа хэлэх, эелдгээр асуух.","topic":"Утсаар яриарай","discussion":["Хосоороо: нэг нь «喂，您好！我找……» гэж залгана.","Бүгдээрээ «可以问您吗？» гэж эелдэгээр асуух дасгал хий."],
   "writing":{"promptChinese":"喂，您好！我找……。","promptMongolian":"Гэрийн даалгавар: гэрийнхэндээ «喂，您好！我找……» гэж утсаар ярьж байгаа дүр үзүүл.","minChars":"0","requiredWords":["喂","找"],"sampleChinese":"喂，您好！我找我妈妈。","sampleMongolian":"Халло, сайн байна уу! Би ээжийгээ хайж байна.","gradingRubric":"喂, 您, 找-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 3 · Test Answers: L4 1.✓ 2.✗ 3.✓ 4.✓ 5.B 6.C 7.A 8.D","parts":[]},
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
 {"point":"喂，您好！ — утсаар ярих","gloss_mn":"«Халло, сайн байна уу!» — утсаар ярихад эхлээд хэлнэ",
  "structure":"喂，您好！/ 喂，你好！",
  "teacher_mn":"Утсаа авбал эхлээд «喂» гэж хэлнэ. Дараа нь «您好» гэнэ. 您 бол «чи» гэдгийн хүндэтгэсэн нь. Багшид 您, найздаа 你 гэж хэл. Гараа чихэндээ аваад «喂，您好！» гэж хэлж үз.",
  "teacher_notes":"Номын яриа: 喂，您好！张老师在吗？",
  "examples":[ex("喂，您好！我找我妈妈。","Wèi, nín hǎo! Wǒ zhǎo wǒ māma.","Халло, сайн байна уу! Би ээжийгээ хайж байна."),ex("喂，您好！张老师在吗？","Wèi, nín hǎo! Zhāng lǎoshī zài ma?","Халло, сайн байна уу! Жан багш байна уу?"),ex("喂，你好！","Wèi, nǐ hǎo!","Халло, сайн уу!")],
  "common_mistakes":[{"wrong":"老师，你好！","right":"老师，您好！","why":"Багшид хүндэтгэж 您 гэж хэлнэ."}],
  "check":chk("Багшдаа утсаар залгаад хэлэх үг:",["喂，您好！","我有一个问题。","再见！"],"喂，您好！","g1c"),
  "exercises":[
   choice("老师，________ 好！",["您","找","问"],"您","Зөв! 您好 = сайн байна уу.","Багшид хүндэтгэж 您 гэнэ.","g1e1"),
   choice("«Халло!» гэж утсаар хэлэх:",["喂","问","回"],"喂","Зөв! 喂 = халло.","喂 нь утсаар ярихад хэлдэг үг.","g1e2"),
   judge("«您» гэдэг нь «чи» гэдгийн хүндэтгэсэн хэлбэр.",True,"Зөв! 您 = та.","您 = хүндэтгэж хэлэх «чи».")]},
 {"point":"我找我妈妈。 — хэнийг хайх","gloss_mn":"«Би ээжийгээ хайж байна» — 找 + хэн, юу",
  "structure":"我找 + хэн / юу。 你找谁？/ 你找什么？",
  "teacher_mn":"Хэн нэгнийг, ямар нэг юмыг хайхдаа «找» гэнэ. 我找我妈妈 — би ээжийгээ хайж байна. Асуухдаа «你找谁？» (хэнийг?) эсвэл «你找什么？» (юуг?) гэнэ. Хоёр хүн байвал «你找哪个？» гэж асууна.",
  "teacher_notes":"Номын яриа 1: 这儿有两个黄医生，你找哪个？ Let's play: 你找什么？我找……",
  "examples":[ex("我找我妈妈。","Wǒ zhǎo wǒ māma.","Би ээжийгээ хайж байна."),ex("你找谁？","Nǐ zhǎo shéi?","Чи хэнийг хайж байна?"),ex("你找什么？","Nǐ zhǎo shénme?","Чи юу хайж байна?"),ex("你找哪个？","Nǐ zhǎo nǎ ge?","Чи аль нь хайж байна?")],
  "common_mistakes":[{"wrong":"我找谁妈妈。","right":"我找我妈妈。","why":"Хариулахдаа хүнийхээ нэрийг хэл, 谁 гэж хэлэхгүй."}],
  "check":chk("«Чи хэнийг хайж байна?» хятадаар:",["你找谁？","你找什么？","你在家吗？"],"你找谁？","g2c"),
  "exercises":[
   choice("我 ________ 我妈妈。",["找","问","回"],"找","Зөв! 找 = хайх.","Хайх гэж 找.","g2e1"),
   choice("«Юу хайж байна?» гэж асуух:",["你找什么？","你找谁？","你回家吗？"],"你找什么？","Зөв! 什么 = юу.","谁 = хэн, 什么 = юу.","g2e2"),
   judge("«找» гэдэг нь «хайх» гэсэн үг.",True,"Зөв! 找 = хайх.","找 = хайх.")]},
 {"point":"我有一个问题，可以问您吗？ — эелдгээр асуух","gloss_mn":"«Надад нэг асуулт байна. Асууж болох уу?»",
  "structure":"我有一个问题。 可以问您吗？ → 可以，什么问题？",
  "teacher_mn":"Багшаас асуулт асуумаар байвал «我有一个问题» гэж эхэлнэ. Дараа нь «可以问您吗？» гэж зөвшөөрөл асууна. 问 = асуух, 问题 = асуулт. Багш «可以，什么问题？» гэвэл асуултаа асуу. Гэртээ харихыг «回家» гэнэ.",
  "teacher_notes":"Номын яриа 2: 我有一个问题，可以问您吗？ 可以，什么问题？ 张老师回家了。",
  "examples":[ex("我有一个问题。","Wǒ yǒu yí ge wèntí.","Надад нэг асуулт байна."),ex("可以问您吗？","Kěyǐ wèn nín ma?","Танаас асууж болох уу?"),ex("可以，什么问题？","Kěyǐ, shénme wèntí?","Болно. Ямар асуулт вэ?"),ex("张老师回家了。","Zhāng lǎoshī huí jiā le.","Жан багш гэртээ харьсан.")],
  "common_mistakes":[{"wrong":"可以问你吗？(багшид)","right":"可以问您吗？","why":"Багшид хүндэтгэж 您 гэнэ."}],
  "check":chk("«Надад нэг асуулт байна» хятадаар:",["我有一个问题。","我找我妈妈。","喂，您好！"],"我有一个问题。","g3c"),
  "exercises":[
   choice("我有一个 ________ 。",["问题","老师","妈妈"],"问题","Зөв! 问题 = асуулт.","Асуулт гэж 问题.","g3e1"),
   choice("«Гэртээ харих» хятадаар:",["回家","问题","找人"],"回家","Зөв! 回 = буцах, 回家 = гэртээ харих.","回家 = гэртээ харих.","g3e2"),
   judge("«问» гэдэг нь «асуух» гэсэн үг.",True,"Зөв! 问 = асуух.","问 = асуух.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Халло!» (утсаар) хятадаар аль нь вэ?",["喂","您","找","问"],"喂","喂 (wèi) = халло.","easy",["vocabulary"],"a1")
q("choice","«Та» (хүндэтгэж) хятадаар аль нь вэ?",["您","你","我","他"],"您","您 (nín) = та.","easy",["vocabulary"],"a2")
q("choice","«找» гэдэг үг ямар утгатай вэ?",["хайх","асуух","харих","халло"],"хайх","找 (zhǎo) = хайх.","easy",["vocabulary"],"a3")
q("choice","«回» гэдэг үг ямар утгатай вэ?",["буцах, харих","асуух","хайх","та"],"буцах, харих","回 (huí) = буцах.","easy",["vocabulary"],"a4")
q("choice","«问题» гэдэг үг ямар утгатай вэ?",["асуулт","халло","багш","ээж"],"асуулт","问题 (wèntí) = асуулт.","easy",["vocabulary"],"a5")
q("choice","«问» гэдэг үг ямар утгатай вэ?",["асуух","хайх","харих","сайн"],"асуух","问 (wèn) = асуух.","easy",["vocabulary"],"a6")
q("choice","«Гэртээ харих» хятадаар:",["回家","找家","问家","喂家"],"回家","回家 = гэртээ харих.","medium",["vocabulary"],"a7")
q("choice","Утсаар ярихад эхлээд юу гэж хэлдэг вэ?",["喂","谢谢","再见","对不起"],"喂","Утсаа аваад 喂 гэж хэлнэ.","easy",["dialogue"],"a8")
q("choice","«Би ээжийгээ хайж байна» хятадаар:",["我找我妈妈。","我有一个问题。","张老师回家了。","你找谁？"],"我找我妈妈。","找 = хайх.","easy",["dialogue"],"a9")
q("choice","«Чи хэнийг хайж байна?» хятадаар:",["你找谁？","你找什么？","你在家吗？","你妈妈是谁？"],"你找谁？","谁 = хэн.","medium",["dialogue"],"a10")
q("choice","«Чиний ээж хэн бэ?» хятадаар:",["你妈妈是谁？","你找哪个？","我妈妈是医生。","你好！"],"你妈妈是谁？","是谁 = хэн бэ.","medium",["dialogue"],"a11")
q("choice","Яриа 1-д охины ээж хэн бэ?",["黄医生","张老师","小红","护士"],"黄医生","我妈妈是黄医生 — ээж нь Хуан эмч.","medium",["dialogue"],"a12")
q("choice","«Жан багш гэртээ харьсан» хятадаар:",["张老师回家了。","张老师在吗？","我找张老师。","张老师好！"],"张老师回家了。","回家了 = гэртээ харьсан.","medium",["dialogue"],"a13")
q("choice","Яриа 2-т Жан багш хаана байна?",["Гэртээ харьсан","Сургууль дээр байна","Хичээл орж байна","Эмнэлэгт байна"],"Гэртээ харьсан","张老师回家了 — гэртээ харьсан.","medium",["dialogue"],"a14")
q("cloze","（ ），您好！",["喂","找","问","回"],"喂","Утсаар ярихад 喂.","easy",["dialogue"],"a15")
q("cloze","我（ ）我妈妈。",["找","喂","您","问题"],"找","Ээжийгээ хайна — 找.","easy",["dialogue"],"a16")
q("cloze","我有一个（ ）。",["问题","找","回家","喂"],"问题","Асуулт = 问题.","easy",["dialogue"],"a17")
q("cloze","可以（ ）您吗？",["问","喂","问题","您"],"问","可以问您吗 = танаас асууж болох уу.","medium",["dialogue"],"a18")
q("choice","Багшдаа хүндэтгэж «Сайн байна уу» гэхдээ:",["老师，您好！","老师，再见！","老师，谢谢！","老师，我找你！"],"老师，您好！","您好 = хүндэтгэсэн мэндчилгээ.","easy",["structure"],"a19")
q("choice","«你找什么？» гэж асуувал юу гэж асууж байна вэ?",["Чи юу хайж байна?","Чи хэнийг хайж байна?","Чи хаана байна?","Чи хэн бэ?"],"Чи юу хайж байна?","什么 = юу.","medium",["structure"],"a20")
q("choice","«可以问您吗？» гэдэг юу гэсэн үг вэ?",["Танаас асууж болох уу?","Танд асуулт байна уу?","Та хаана байна?","Та хэн бэ?"],"Танаас асууж болох уу?","可以……吗 = …болох уу.","medium",["structure"],"a21")
q("choice","«这儿有两个黄医生，你找哪个？» — «哪个» юу гэсэн үг вэ?",["аль нь","хэн","юу","хаана"],"аль нь","哪个 = аль нь.","hard",["structure"],"a22")
q("choice","Пиньинь «wèntí» гэж уншдаг үг:",["问题","找","回家","您好"],"问题","问题 = wèntí = асуулт.","easy",["pronunciation"],"a23")
q("choice","Пиньинь «zhǎo» гэж уншдаг үг:",["找","问","回","您"],"找","找 = zhǎo = хайх.","easy",["pronunciation"],"a24")
q("choice","Пиньинь «nín» гэж уншдаг үг:",["您","你","问","找"],"您","您 = nín = та.","medium",["pronunciation"],"a25")
q("usage","Утсаар найздаа залгаад «Чи хаана байна?» гэж асуух:",["你在哪里？","你找谁？","你是谁？","我有一个问题。"],"你在哪里？","在哪里 = хаана байна.","medium",["usage"],"a26")
q("usage","Багшаас асуулт асуух гэж байна. Эхлээд юу гэх вэ?",["我有一个问题，可以问您吗？","我找我妈妈。","喂，再见！","张老师回家了。"],"我有一个问题，可以问您吗？","Эелдгээр зөвшөөрөл асууна.","medium",["usage"],"a27")
q("usage","«两个小娃娃» дуунд «你在做什么？» гэж асуухад хариулсан мөр:",["我在学画画儿。","我在我的家。","我找我妈妈。","我有一个问题。"],"我在学画画儿。","Дууны сүүлийн мөр: 哎哎哎，我在学画画儿。","hard",["usage"],"a28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img(f"t5{c}") for c in "abcd"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (04-04) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"answer_source":"YCT 3 Test Answers L4: 1.✓ 2.✗ 3.✓ 4.✓","items":[
    {"n":1,"question_zh":"（听录音）下课了，回家了。","image":img("t1"),"script_zh":"下课了，回家了。","answer":"✓","explanation_mn":"«Хичээл тарлаа, гэртээ харилаа» — зураг дээр эмэгтэй ном, цүнхээ бэлдэж байна. Хичээл тарсан, харих гэж байгаа тул ✓."},
    {"n":2,"question_zh":"（听录音）他在打电话。","image":img("t2"),"script_zh":"他在打电话。","answer":"✗","explanation_mn":"«Тэр утсаар ярьж байна» гэсэн. Зураг дээр хоёр хөвгүүн сагсан бөмбөг тоглож байна, утас байхгүй тул ✗."},
    {"n":3,"question_zh":"（听录音）小朋友，你有什么问题？","image":img("t3"),"script_zh":"小朋友，你有什么问题？","answer":"✓","explanation_mn":"«Хүүхэд минь, чамд ямар асуулт байна?» — зураг дээр эмэгтэй суугаад жаахан охинтой ярьж, асуултыг нь сонсож байна. ✓."},
    {"n":4,"question_zh":"（听录音）你找谁？","image":img("t4"),"script_zh":"你找谁？","answer":"✓","explanation_mn":"«Чи хэнийг хайж байна?» — зураг дээр хаалганы цаанаас нэг эрэгтэй шагайж байна. Хэн нэгнийг хайж байгаа тул ✓."}]},
  {"part":2,"type":"choice","instruction_mn":"Унших — яриа бүрд тохирох зургийг A, B, C, D-ээс сонго.","answer_source":"YCT 3 Test Answers L4: 5.B 6.C 7.A 8.D","items":[
    {"n":5,"question_zh":"A：他在找什么呢？ B：让我看看。","question_mn":"— Тэр юу хайж байна вэ? — Надад харуулаач.","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"Хайж байгаа хүн — B зураг дээр нэг хүн шүүгээнд толгойгоо хийж, дотор нь юм хайж байна. A охин утсаар ярьж байна, C аав охиноо тэвэрсэн, D хоёр хүн зогсож байна."},
    {"n":6,"question_zh":"A：喜欢哪一个？ B：我要那个红色的。","question_mn":"— Аль нь таалагдаж байна? — Би тэр улаан өнгийхийг авна.","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"Сонгож байгаа дүр — C зураг дээр охин ямар нэг юмыг заагаад «тэрийг» гэж байна. Аав нь түүнийг тэвэрч байна. B юм хайж байна, A утсаар ярьж байна."},
    {"n":7,"question_zh":"A：喂，请问张老师在吗？ B：他去跑步了。","question_mn":"— Халло, Жан багш байна уу? — Тэр гүйхээр явсан.","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"«喂» гэж утсаар ярьж байна — A зураг дээр охин утсаа чихэндээ барьж ярьж байна."},
    {"n":8,"question_zh":"A：我可以坐这儿吗？ B：可以，请坐。","question_mn":"— Энд суувал болох уу? — Болно, суугаарай.","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"Суудлын тухай — D зураг дээр нисэх буудлын суудлууд байна: нэг эрэгтэй зогсож, жаахан охин улаан цүнхтэйгээ суудлын дэргэд байна. «Энд суувал болох уу?» гэж суудал асуух дүр тохирно. A охин утсаар ярьж байна, B юм хайж байна, C хаалга заасан."}],},
  {"part":3,"type":"match","instruction_mn":"Let's match — үг бүрд тохирох хэллэгийг холбо.","answer_source":"Let's match х.20 (хариу агент тааруулсан: 喂-您好, 问-问题, 你-找谁)","items":[
    {"n":1,"question_zh":"喂","answer":"您好","explanation_mn":"喂，您好！ — утсаар мэндэлнэ."},
    {"n":2,"question_zh":"问","answer":"问题","explanation_mn":"问 — асуух, 问题 — асуулт."},
    {"n":3,"question_zh":"你","answer":"找谁","explanation_mn":"你找谁？ — Чи хэнийг хайж байна?"}]},
  {"part":4,"type":"match","instruction_mn":"Let's chant — мөр бүрд зөв үгийг холбо.","answer_source":"Let's chant х.20","items":[
    {"n":1,"question_zh":"喂喂喂，你在哪里呀？ — 哎哎哎，我在……","answer":"我的家","explanation_mn":"«Чи хаана байна?» гэвэл «Би гэртээ байна»."},
    {"n":2,"question_zh":"喂喂喂，你在做什么？ — 哎哎哎，我在……","answer":"学画画儿","explanation_mn":"«Чи юу хийж байна?» гэвэл «Би зураг зурж сурч байна»."}]},
  {"part":5,"type":"match","instruction_mn":"Let's play — хосоороо нуугдсан зургуудыг хай.","image":img("play"),"answer_source":"Let's play х.21","items":[
    {"n":1,"question_zh":"你找什么？","answer":"我找电话。","explanation_mn":"Зураг дээр утас олон бий. «我找……» гэж хариулаад нуугдсан зургаа заана."}]}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «问题» гэсэн ханзыг дахин бичиж хуул.","question_zh":"问题","answer":"问题","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Утсаар ярьж байгаа дүр үзүүл.","question_zh":"喂，您好！我找……","answer":"喂，您好！我找我妈妈。","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":2,"prompt_mn":"Багшаасаа эелдгээр асуу.","question_zh":"我有一个问题，可以问您吗？","answer":"我有一个问题，可以问您吗？","explanation_mn":"Багш «可以，什么问题？» гэж хариулна."},
   {"n":3,"prompt_mn":"«两个小娃娃» дууг дуул.","question_zh":"喂喂喂，你在哪里呀？","answer":"(нээлттэй)","explanation_mn":"Аудио 04-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 3 · Test Listening Scripts, Test Answers (Lesson 4)"}
dump("workbook.json", workbook)

# ---------------- IMAGE PROMPTS ----------------
NOTXT = " No English text."
def P(file,aspect,title,section,prompt,chars,role=None):
    d={"file":file,"aspect":aspect,"title":title,"section":section}
    if role: d["role"]=role
    d["prompt"]=prompt+NOTXT; d["chars"]=chars; return d
WORDS=[("wei","喂","A yellow camel calf boy holding a red old-fashioned telephone receiver to his ear, smiling and waving; a speech bubble with the Chinese text 喂 in large clear black font.",["huu"]),
 ("nin","您","A camel calf girl in a yellow dress with a pink ribbon bowing politely to the teacher camel with glasses; a speech bubble with the Chinese text 您好 in large clear black font.",["ohin","temee"]),
 ("zhao","找","A brown camel calf boy in a green hat holding a magnifying glass, looking under a sofa for his lost toy ball.",["bor"]),
 ("hui","回","A yellow camel calf boy with a red backpack walking happily home along a path toward a cozy house with a smoking chimney.",["huu"]),
 ("wenti","问题","A camel calf girl raising her hand in the classroom with a big question mark above her head, teacher camel with glasses smiling at the blackboard.",["ohin","temee"]),
 ("wen","问","A brown camel calf boy in a green hat asking the teacher camel a question, hand cupped near his mouth, a small question mark above him.",["bor","temee"])]
IP=[P("images/hero.jpg","4:3","喂，您好！","teacher-intro","Teacher camel with glasses, a yellow camel calf boy and a camel calf girl each holding a big old red telephone receiver, smiling; a speech bubble with the Chinese text 喂，您好！ in large clear black font, bright classroom.",["temee","huu","ohin"],"hero")]
for k,z,pr,ch in WORDS: IP.append(P(f"images/w-{k}.jpg","1:1",z,"vocabulary",pr,ch))
IP += [
 P("images/d1.jpg","4:3","喂，您好！我找我妈妈。","dialogue","A camel calf girl in a yellow dress sits on a green sofa talking on a telephone; in a thought bubble a nurse camel in white at a hospital desk answers the phone; speech bubble with the Chinese text 喂，您好！我找我妈妈。 in large clear black font.",["ohin"]),
 P("images/d2.jpg","4:3","喂，您好！张老师在吗？","dialogue","A curly-haired camel calf girl in a pink dress phoning on a desk; in a bubble a female teacher camel in an office answers; speech bubble with the Chinese text 喂，您好！张老师在吗？ in large clear black font.",["ohin","temee"]),
 P("images/song.jpg","4:3","两个小娃娃","song","A yellow camel calf boy and a camel calf girl in a red dress talk through two paper cups connected by a long curly string, singing and smiling, happy meadow.",["huu","ohin"]),
]
dump("image_prompts.json", IP, BASE)

# ---------------- LESSON / MANIFEST ----------------
images = [{"id":p["file"].split("/")[-1].rsplit(".",1)[0],"file":p["file"],"title":p["title"],"role":p.get("role","illustration"),"section":p["section"]} for p in IP]
images += [{"id":"play","file":"images/play.png","title":"Let's play · нуугдсан зургууд","role":"illustration","section":"workbook"}]
images += [{"id":k,"file":f"images/{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["t1","t2","t3","t4","t5a","t5b","t5c","t5d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 3 · 4-р хичээл — Халло, сайн байна уу!","chineseTitle":"喂，您好！","targetTitle":"喂，您好！","mongolianTitle":"Халло, сайн байна уу!",
 "subtitle":"喂 · 您 · 找 · 回 · 问题 · 问 · «两个小娃娃» дуу",
 "description":f"Утсаар ярих, хэнийг хайж байгаагаа хэлэх, эелдгээр асуух (我找……, 可以问您吗？) сурна. {len(vocab)} үг, 2 зурагт яриа, дуу, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"📞","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 3",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 3 — 第4课《喂，您好！》 [hskLevel=2] [lessonNumber=4]; эх: сурах бичиг х.18–22; аудио CD 04-01…04-04"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"喂，您好！","mongolianTitle":"Халло, сайн байна уу!",
 "series":"YCT 标准教程 3","seriesLabel_mn":"YCT 3 — Хүүхдийн хятад хэл (≈HSK2)",
 "source":"YCT 标准教程 3 · 第4课 (сурах бичиг + CD аудио 04-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_SONG,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L4)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
