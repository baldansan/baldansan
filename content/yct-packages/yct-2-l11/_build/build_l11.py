#!/usr/bin/env python3
"""YCT 标准教程 2 · 第11课 我来北京一年了。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib
OUT = "/home/claude/work/yct2/l11/pkg"
CID, LID, N, NN = "yct-2", "yct-2-l11", 11, "11"
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

# Тестийн зураг (t5a..t5d), story.png — номын хуудаснаас хайчилсан (pkg/images-д бэлэн); дахин хайчлах бол:
from PIL import Image
_pg = os.path.exists("/home/claude/work/yct2/l11/pages/hi-56.png")
if _pg:
    _p = Image.open("/home/claude/work/yct2/l11/pages/hi-56.png").convert("RGB")
    for _k,_b in {"t5a":(100,505,200,595),"t5b":(262,495,340,590),"t5c":(405,495,500,590),"t5d":(570,495,650,590)}.items():
        _c = _p.crop(tuple(int(v*1.5) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
    _s = Image.open("/home/claude/work/yct2/l11/pages/hi-55.png").convert("RGB"); _W,_H = _s.size
    _s.crop((int(.12*_W),int(.17*_H),int(.94*_W),int(.88*_H))).save(f"{OUT}/images/story.png")

# audio: яриа 11-02 (дуу байхгүй)
AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-2-11-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = AUD_TEXT

# ---------------- VOCAB ----------------
VOCAB = [
 ("现在","xiànzài","одоо","цаг үе · гол үг","现在几点了？","Xiànzài jǐ diǎn le?","Одоо хэдэн цаг болж байна?",True),
 ("点","diǎn","цаг (цагийн заагч)","тоолох үг · гол үг","三点零五了。","Sān diǎn líng wǔ le.","Гурван цаг тавын минут болжээ.",True),
 ("零","líng","тэг, нуль","тоо · гол үг","三点零五","Sān diǎn líng wǔ","3 цаг 05 минут",True),
 ("分钟","fēnzhōng","минут","цаг хугацаа · гол үг","玩十分钟","Wán shí fēnzhōng","Арван минут тоглох",True),
 ("小时","xiǎoshí","цаг (нэг цаг, хоёр цаг гэх урт хугацаа)","цаг хугацаа · нэмэлт үг","我睡一个小时。","Wǒ shuì yí ge xiǎoshí.","Би нэг цаг унтана.",False),
 ("年","nián","жил","цаг хугацаа · гол үг","我来北京一年了。","Wǒ lái Běijīng yì nián le.","Би Бээжинд ирээд нэг жил болжээ.",True),
 ("来","lái","ирэх","үйл үг · гол үг","我和爸爸妈妈来北京。","Wǒ hé bàba māma lái Běijīng.","Би аав ээжтэйгээ Бээжинд ирсэн.",True),
 ("北京","Běijīng","Бээжин (Хятадын нийслэл)","газар нэр · гол үг","我来北京一年了。","Wǒ lái Běijīng yì nián le.","Би Бээжинд ирээд нэг жил болжээ.",True),
 ("打电话","dǎ diànhuà","утсаар ярих","үйл үг · гол үг","我会用汉语打电话了。","Wǒ huì yòng Hànyǔ dǎ diànhuà le.","Би хятадаар утсаар ярьж чаддаг болсон.",True),
 ("会","huì","чаддаг, сурсан","үйл үг · гол үг","你会用汉语打电话吗？","Nǐ huì yòng Hànyǔ dǎ diànhuà ma?","Чи хятадаар утсаар ярьж чадах уу?",True),
 ("漂亮","piàoliang","хөөрхөн, үзэмжтэй","тэмдэг нэр · нэмэлт үг","我比以前漂亮了！","Wǒ bǐ yǐqián piàoliang le!","Би өмнөхөөсөө хөөрхөн болжээ!",False),
 ("早上","zǎoshang","өглөө","цаг хугацаа · нэмэлт үг","早上，我和爸爸运动。","Zǎoshang, wǒ hé bàba yùndòng.","Өглөө би аавтайгаа спортоор хичээллэнэ.",False),
 ("中午","zhōngwǔ","үд дунд","цаг хугацаа · нэмэлт үг","中午，我睡一个小时。","Zhōngwǔ, wǒ shuì yí ge xiǎoshí.","Үд дунд би нэг цаг унтана.",False),
 ("下午","xiàwǔ","үдээс хойш","цаг хугацаа · нэмэлт үг","下午，我看电视。","Xiàwǔ, wǒ kàn diànshì.","Үдээс хойш би зурагт үзнэ.",False),
 ("晚上","wǎnshang","орой","цаг хугацаа · нэмэлт үг","晚上，我看书。","Wǎnshang, wǒ kàn shū.","Орой би ном уншина.",False),
 ("运动","yùndòng","спортоор хичээллэх, хөдөлгөөн хийх","үйл үг · нэмэлт үг","我和爸爸运动。","Wǒ hé bàba yùndòng.","Би аавтайгаа хөдөлгөөн хийнэ.",False),
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
 {"id":1,"title_mn":"Яриа 1 · Хүү цаг асууж байна","scene_mn":"Шаталсан суудал дээр аав ээж нь сууж байна. Хүү ээжээсээ цаг хэд болсныг асуугаад, жаахан тоглохоор зөвшөөрөл гуйна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"妈妈，几点了？","pinyin":"Māma, jǐ diǎn le?","mn":"Ээж ээ, хэдэн цаг болж байна?"},
           {"speaker":"妈妈","zh":"三点零五了。","pinyin":"Sān diǎn líng wǔ le.","mn":"Гурван цаг тавын минут болжээ."},
           {"speaker":"小明","zh":"我可以去那儿玩十分钟吗？","pinyin":"Wǒ kěyǐ qù nàr wán shí fēnzhōng ma?","mn":"Би тэнд арван минут тоглож болох уу?"},
           {"speaker":"妈妈","zh":"可以。","pinyin":"Kěyǐ.","mn":"Болно."}]},
 {"id":2,"title_mn":"Яриа 2 · Бээжинд нэг жил","scene_mn":"Бээжинд ирээд нэг жил болсон охин өөрт нь юу өөрчлөгдсөнийг ярьж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"玛丽","zh":"我和爸爸妈妈来北京一年了。","pinyin":"Wǒ hé bàba māma lái Běijīng yì nián le.","mn":"Би аав ээжтэйгээ Бээжинд ирээд нэг жил болжээ."},
           {"speaker":"玛丽","zh":"我现在会用汉语打电话了。","pinyin":"Wǒ xiànzài huì yòng Hànyǔ dǎ diànhuà le.","mn":"Одоо би хятадаар утсаар ярьж чаддаг болсон."}]},
]
sentences=[]
dlg = [
 (1,"小明：妈妈，几点了？","Xiǎo Míng: Māma, jǐ diǎn le?","Сяо Мин: Ээж ээ, хэдэн цаг болж байна?","小明：| 妈妈|māma ，| 几|jǐ 点|diǎn 了|le ？|","几点了？ — «хэдэн цаг болов?» гэж асууна. 了 нь «одоо болчихлоо» гэсэн утга нэмнэ.",["几点了？"]),
 (1,"妈妈：三点零五了。","Māma: Sān diǎn líng wǔ le.","Ээж: Гурван цаг тавын минут болжээ.","妈妈：| 三|sān 点|diǎn 零|líng 五|wǔ 了|le 。|","三点零五 = 3:05. Минут нь нэг оронтой бол өмнө нь 零 хэлнэ.",["三点零五了。"]),
 (1,"小明：我可以去那儿玩十分钟吗？","Xiǎo Míng: Wǒ kěyǐ qù nàr wán shí fēnzhōng ma?","Сяо Мин: Би тэнд арван минут тоглож болох уу?","小明：| 我|wǒ 可以|kěyǐ 去|qù 那儿|nàr 玩|wán 十|shí 分钟|fēnzhōng 吗|ma ？|","可以……吗？ — зөвшөөрөл гуйх асуулт. 十分钟 = арван минут.",["我可以……吗？"]),
 (1,"妈妈：可以。","Māma: Kěyǐ.","Ээж: Болно.","妈妈：| 可以|kěyǐ 。|","Зөвшөөрөхдөө «可以» гэж богино хэлнэ.",[]),
 (2,"玛丽：我和爸爸妈妈来北京一年了。","Mǎlì: Wǒ hé bàba māma lái Běijīng yì nián le.","Мари: Би аав ээжтэйгээ Бээжинд ирээд нэг жил болжээ.","玛丽：| 我|wǒ 和|hé 爸爸|bàba 妈妈|māma 来|lái 北京|Běijīng 一|yì 年|nián 了|le 。|","来北京一年了 — Бээжинд ирээд нэг жил болсон. 了 нь «болчихсон» гэсэн утга.",["我来北京一年了。"]),
 (2,"玛丽：我喜欢学习汉语，现在会用汉语打电话了。","Mǎlì: Wǒ xǐhuan xuéxí Hànyǔ, xiànzài huì yòng Hànyǔ dǎ diànhuà le.","Мари: Би хятад хэл сурах дуртай. Одоо хятадаар утсаар ярьж чаддаг болсон.","玛丽：| 我|wǒ 喜欢|xǐhuan 学习|xuéxí 汉语|Hànyǔ ，| 现在|xiànzài 会|huì 用|yòng 汉语|Hànyǔ 打电话|dǎ diànhuà 了|le 。|","会 = сурсан учраас чаддаг. 现在……了 — «одоо болсон» гэж өөрчлөлтийг хэлнэ.",[]),
 (2,"玛丽：我的个子高了，头发长了，","Mǎlì: Wǒ de gèzi gāo le, tóufa cháng le,","Мари: Би өндөр болсон, үс минь урт болсон,","玛丽：| 我|wǒ 的|de 个子|gèzi 高|gāo 了|le ，| 头发|tóufa 长|cháng 了|le ，|","高了、长了 — «болсон» гэсэн өөрчлөлт. Өмнө нь тийм биш байсан гэсэн үг.",[]),
 (2,"玛丽：朋友们说我比以前漂亮了！","Mǎlì: Péngyoumen shuō wǒ bǐ yǐqián piàoliang le!","Мари: Найзууд маань «чи өмнөхөөсөө хөөрхөн болжээ» гэж хэлдэг!","玛丽：| 朋友们|péngyoumen 说|shuō 我|wǒ 比|bǐ 以前|yǐqián 漂亮|piàoliang 了|le ！|","比以前 = өмнөхөөс илүү. 朋友们 = найзууд.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("早上，我和爸爸运动两个小时。","Zǎoshang, wǒ hé bàba yùndòng liǎng ge xiǎoshí.","Өглөө би аавтайгаа хоёр цаг хөдөлгөөн хийнэ.","早上|zǎoshang ，| 我|wǒ 和|hé 爸爸|bàba 运动|yùndòng 两|liǎng 个|ge 小时|xiǎoshí 。|"),
 ("中午，我睡一个小时。","Zhōngwǔ, wǒ shuì yí ge xiǎoshí.","Үд дунд би нэг цаг унтана.","中午|zhōngwǔ ，| 我|wǒ 睡|shuì 一|yí 个|ge 小时|xiǎoshí 。|"),
 ("下午，我看一个小时电视。","Xiàwǔ, wǒ kàn yí ge xiǎoshí diànshì.","Үдээс хойш би нэг цаг зурагт үзнэ.","下午|xiàwǔ ，| 我|wǒ 看|kàn 一|yí 个|ge 小时|xiǎoshí 电视|diànshì 。|"),
 ("晚上，我看半个小时书。","Wǎnshang, wǒ kàn bàn ge xiǎoshí shū.","Орой би хагас цаг ном уншина.","晚上|wǎnshang ，| 我|wǒ 看|kàn 半|bàn 个|ge 小时|xiǎoshí 书|shū 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «我的星期天» — 4 зурагт «Миний ням гараг». 小时 = цаг (нэг цаг, хоёр цаг гэх урт хугацаа). 半 = хагас."
    sentences.append(s)

texts = {
 "unit":{"number":"11","title":"我来北京一年了。","mongolianTitle":"Би Бээжинд ирээд нэг жил болжээ — цаг хэд вэ, юу өөрчлөгдсөн бэ"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи YCT 1-ийг дуусгасан, одоо YCT 2-ын арав дахь хичээлээс цааш явж байна. Өмнөх хичээлд бид бие, эмнэлгийн тухай сурсан. Өнөөдөр цаг хэд болсныг хэлж сурна: «现在几点了？» Мөн Бээжинд ирээд нэг жил болсон охиныг сонсоно. Тэр хятад хэл сурсаар өндөр болж, утсаар ярьж чаддаг болжээ. Чи ч гэсэн өөрчлөгдөж байгаа шүү! Хөдөлгөөнтэй цагийн тоглоом хийж, «我的星期天» үлгэрийг уншъя. Эхэлцгээе!",
  "warmup_mn":"Одоо хэдэн цаг болж байна? Хуруугаараа тоолж хэлээд үз. Чи өнгөрсөн жилээс хойш юугаараа өөрчлөгдсөн бэ — өндөр болсон уу, шинэ юм сурсан уу?",
  "theme_zh":"几点了 · 来……了 · 会 / 可以","theme_mn":"Цаг хэд вэ · Болчихлоо · Чадна / болно"},
 "warmup":{"mongolian":"Одоо хэдэн цаг болж байна? Чи өнгөрсөн жилээс хойш юугаараа өөрчлөгдсөн бэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"11","title":"我来北京一年了。","mongolianTitle":"Цаг хэд вэ, Бээжинд нэг жил — яриа, өгүүллэг, үлгэр","title_mn":"Let's read · 2 яриа + Mini story · 我的星期天","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第11课 Let's read / Mini story（CD 11-02, 11-03）","author_zh":"",
  "intro_zh":"先听小对话：现在几点了？然后读玛丽的小故事，最后读《我的星期天》。",
  "intro_mn":"Эхлээд богино яриа: «几点了？» гэж цаг асууна. Дараа нь Бээжинд нэг жил болсон Мариг сонсоно. Хамгийн сүүлд «Миний ням гараг» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хүү ээжээсээ «几点了？» гэж асуугаад, «三点零五» гэсэн хариу авна. Дараа нь арван минут тоглож болох эсэхийг асууна."},
   {"paragraph":2,"mn":"Яриа 2 — Мари Бээжинд ирээд нэг жил болжээ. Хятад хэл сурсаар утсаар ярьж чаддаг болж, өндөр болж, үс нь урт болжээ."},
   {"paragraph":3,"mn":"Үлгэр «Миний ням гараг» — өглөө аавтайгаа хөдөлгөөн хийж, үд дунд унтаж, үдээс хойш зурагт үзэж, орой ном уншина. Аудио: 11-03."}],
  "reflection":{"questions_mn":["Одоо хэдэн цаг болж байна? Хятадаар хэлж үз.","Чи Бээжинд очвол юуг сурмаар байна?","Чиний ням гараг ямар байдаг вэ? Өглөө, үдээс хойш, орой юу хийдэг вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Би өөрчлөгдсөн","zh":"我的个子高了，我会打电话了。","pinyin":"Wǒ de gèzi gāo le, wǒ huì dǎ diànhuà le.","mn":"Би өндөр болсон, утсаар ярьж чаддаг болсон."},
  "writingPrompt_mn":"Өөрийнхөө өөрчлөлтийг хятадаар хэл: 我的……了。 Найздаа, дараа нь бүх ангид ярьж өг!"},
 "properNouns":[{"zh":"北京","pinyin":"Běijīng","mn":"Бээжин (Хятадын нийслэл)"},{"zh":"玛丽","pinyin":"Mǎlì","mn":"Мари (охины нэр)"}],
 "wordExplanation":[
  {"word":"几点了","gloss":"jǐ diǎn le — цаг хэд болов","explanation":"Цаг хэд болсныг асуухдаа «现在几点了？» гэнэ. Хариулахдаа цагаа 点-ийн өмнө, минутаа 点-ийн дараа хэлнэ. «三点零五» = 3 цаг 05 минут. Минут нэг оронтой тоо бол өмнө нь 零 хэлнэ.",
   "structure":"现在几点了？ → тоо + 点 + (零) + минут + 了。","teacher_notes":"Хүүхдэд ханан цаг эсвэл цаасан цаг үзүүлж, зүүгээр нь хэд хэдэн цаг тавиад хэлүүл. Дүрмийн нэр томьёо хэрэглэхгүй, жишээгээр давт.",
   "examples":[{"chinese":"现在几点了？","pinyin":"Xiànzài jǐ diǎn le?","mongolian":"Одоо хэдэн цаг болж байна?"},{"chinese":"三点零五了。","pinyin":"Sān diǎn líng wǔ le.","mongolian":"Гурван цаг тавын минут болжээ."},{"chinese":"九点。","pinyin":"Jiǔ diǎn.","mongolian":"Есөн цаг."}],
   "common_mistakes":[{"wrong":"三点五了。","right":"三点零五了。","why":"Минут нэг оронтой тоо бол 点-ийн дараа 零 хэлнэ."}],
   "check":{"question":"«Одоо хэдэн цаг болж байна?» хятадаар:","options":["现在几点了？","你会打电话吗？","我来北京一年了。"],"answer":"0"},
   "practice":[{"n":1,"question":"三点 ________ 五了。(тэг)","answer":"零","explanation_mn":"3:05 — 三点零五."}]},
  {"word":"……了","gloss":"le — болчихлоо","explanation":"了-г өгүүлбэрийн төгсгөлд хэлбэл «болчихсон, өөрчлөгдсөн» гэсэн утга өгнө. «头发长了» — үс урт болжээ. «我来北京一年了» — Бээжинд ирээд нэг жил болжээ. «现在会用汉语打电话了» — одоо хятадаар ярьж чаддаг болжээ.",
   "structure":"тэмдэг / үйл + 了 → өөрчлөлт болсон","teacher_notes":"Өөрчлөлтийг хүүхдийн амьдралаар ярь: өндөр болсон, шинэ үг сурсан, шүд ургасан. Мариг үлгэр болгож жүжигчил.",
   "examples":[{"chinese":"我的个子高了。","pinyin":"Wǒ de gèzi gāo le.","mongolian":"Би өндөр болсон."},{"chinese":"头发长了。","pinyin":"Tóufa cháng le.","mongolian":"Үс урт болсон."},{"chinese":"我来北京一年了。","pinyin":"Wǒ lái Běijīng yì nián le.","mongolian":"Би Бээжинд ирээд нэг жил болжээ."}],
   "common_mistakes":[{"wrong":"我的个子高。(өөрчлөлтийг хэлэхдээ)","right":"我的个子高了。","why":"«Өндөр болсон» гэж өөрчлөлтийг хэлэхэд 了 нэмнэ."}],
   "check":{"question":"«Үс урт болсон» хятадаар:","options":["头发长了。","头发长吗？","我的头发。"],"answer":"0"},
   "practice":[{"n":1,"question":"我的个子高 ________。(болсон)","answer":"了","explanation_mn":"Өөрчлөлт: 高了."}]},
  {"word":"会 / 可以","gloss":"huì / kěyǐ — чадна / болно","explanation":"会 нь сурсан учраас «чадна» гэсэн үг. «我会用汉语打电话» — Би хятадаар утсаар ярьж чадна. 可以 нь «болно, зөвшөөрнө» гэсэн үг. «我可以去玩吗？» гэж зөвшөөрөл гуйхад «可以» гэж хариулна.",
   "structure":"会 + юу хийхээ · 我可以……吗？ → 可以。","teacher_notes":"Хүүхдүүдийн дуртай тоглоом: «Би … чадна» гэж нэг үйлдэл үзүүлээд, найз нь «你会……吗？» гэж асуух.",
   "examples":[{"chinese":"你会用汉语打电话吗？","pinyin":"Nǐ huì yòng Hànyǔ dǎ diànhuà ma?","mongolian":"Чи хятадаар утсаар ярьж чадах уу?"},{"chinese":"我可以去那儿玩十分钟吗？","pinyin":"Wǒ kěyǐ qù nàr wán shí fēnzhōng ma?","mongolian":"Би тэнд арван минут тоглож болох уу?"},{"chinese":"可以。","pinyin":"Kěyǐ.","mongolian":"Болно."}],
   "common_mistakes":[{"wrong":"我会去玩十分钟吗？(зөвшөөрөл гуйхдаа)","right":"我可以去玩十分钟吗？","why":"Зөвшөөрөл гуйхдаа 可以, чадах чадвараа хэлэхдээ 会."}],
   "check":{"question":"Ээжээс «Би тоглож болох уу?» гэж зөвшөөрөл гуй:","options":["我可以玩吗？","我会玩。","我玩了。"],"answer":"0"},
   "practice":[{"n":1,"question":"我 ________ 用汉语打电话。(чадна)","answer":"会","explanation_mn":"Сурсан чадвар — 会."}]},
 ],
 "collocations":[{"type":"цаг хугацаа + юу хийх","rows":[
   {"head":"早上","with":"运动","mn":"өглөө хөдөлгөөн хийх","usage_mn":"Өдрийн цаг + үйлдэл","example":{"zh":"早上，我和爸爸运动。","pinyin":"Zǎoshang, wǒ hé bàba yùndòng.","mn":"Өглөө би аавтайгаа хөдөлгөөн хийнэ."}},
   {"head":"用汉语","with":"打电话","mn":"хятадаар утсаар ярих","usage_mn":"Юугаар хийхээ 用-аар хэлнэ","example":{"zh":"我会用汉语打电话。","pinyin":"Wǒ huì yòng Hànyǔ dǎ diànhuà.","mn":"Би хятадаар утсаар ярьж чадна."}},
   {"head":"一","with":"个小时","mn":"нэг цаг","usage_mn":"Урт хугацааг 小时-оор тоолно","example":{"zh":"我睡一个小时。","pinyin":"Wǒ shuì yí ge xiǎoshí.","mn":"Би нэг цаг унтана."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["点","分钟","会","了"],"items":[
     {"n":1,"question":"现在三 ________ 零五。","answer":"点","explanation_mn":"Цагийг 点-ээр хэлнэ."},
     {"n":2,"question":"我可以玩十 ________ 吗？","answer":"分钟","explanation_mn":"Минутыг 分钟-аар хэлнэ."},
     {"n":3,"question":"你 ________ 用汉语打电话吗？","answer":"会","explanation_mn":"Сурсан чадвар — 会."},
     {"n":4,"question":"头发长 ________。","answer":"了","explanation_mn":"Өөрчлөгдсөн — 了."}]}],
   "answer_source":"agent-authored (YCT 11 үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"现在几点了？","answer":"三点零五。","explanation_mn":"Яриа 1 — ээж «三点零五了» гэв."},
     {"n":2,"question_zh":"她现在会做什么了？","answer":"用汉语打电话。","explanation_mn":"Өгүүллэг — Мари одоо хятадаар утсаар ярьж чаддаг болжээ."}],
   "answer_source":"textbook_verified (Let's read, х.54 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Цаг хэд вэ?","start_zh":"现在几点了？","instruction_mn":"Цаасан цаг хийж зүүг нь эргүүл. Найз нь «现在几点了？» гэж асууна. Чи «三点零五了» гэх мэтээр цагаа хэл. Дараа нь солилцоорой!"},
     {"label":"Би өөрчлөгдсөн","start_zh":"我的个子高了。","instruction_mn":"Найздаа хэл: «Би хэдэн жилийн өмнө бага байсан, одоо өндөр болсон.» Хятадаар «我的个子高了» гэж хэлээд гараа дээшээ өргө. Ямар өөр юм өөрчлөгдсөн бэ?"},
     {"label":"Миний ням гараг","start_zh":"早上，我……","instruction_mn":"Ням гарагийн өглөө, үд, үдээс хойш, оройд юу хийдгээ хятадаар хэл. Хийж байгаа хөдөлгөөнөө үзүүл: ном унших, унтах, зурагт үзэх, бөмбөг тоглох."},
     {"label":"Утсаар ярья","start_zh":"你会打电话吗？","instruction_mn":"Тоглоомон утас барьж «喂！» гэж хэл. Найзтайгаа «你好！我是……» гэж хятадаар ярилц. Чадсан хүн алга ташуулъя!"}]}},
 "grammarNotes":[],
 "culture":{"title":"北京 · Бээжин","title_mn":"Хятадын нийслэл Бээжин","text_mn":"Бээжин бол Хятад улсын нийслэл. Тэнд олон хүүхэд хоёр хэл сурдаг, зарим нь гадаадаас ирсэн. Хятад хүүхдүүд «一年了» гэж жилээ тоолж, өөрчлөгдсөнөө ярих дуртай. Монголчууд бид хүүхдийг жилээр нь «хэдэн нас» гэж тоолдог шиг, хятадууд ч төрсөн өдрөө тэмдэглэнэ.","note_mn":"Чи хэдэн жил хятад хэл сурсан бэ? «Нэг жил» гэвэл «一年» гэж хэлж үз."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — цаг хэд вэ гэж асуух, өөрчлөлтөө ярих.","topic":"Миний өөрчлөлт, миний ням гараг","discussion":["Хосоороо: «现在几点了？» гэж асууж, цагаар хариул.","Өөрийн өөрчлөлтөө ярь: 我的……了。"],
   "writing":{"promptChinese":"我的个子高了。","promptMongolian":"Гэрийн даалгавар: «Миний ням гараг»-аа 4 зургаар зураад ээж аавдаа хятадаар хэлж өг.","minChars":"0","requiredWords":["点","会","了"],"sampleChinese":"早上，我和爸爸运动。晚上，我看书。","sampleMongolian":"Өглөө би аавтайгаа хөдөлгөөн хийнэ. Орой ном уншина.","gradingRubric":"Цаг хугацааны үгийг зөв ашигласан эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers: L11 1.C 2.C 3.B 4.A 5.A 6.D 7.B 8.C","parts":[]},
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
 {"point":"现在几点了？ — цаг хэд вэ","gloss_mn":"«Одоо хэдэн цаг болж байна?» — цаг асуух ба хэлэх",
  "structure":"现在几点了？ → тоо + 点 + (零) + минут",
  "teacher_mn":"Цаг хэд болсныг мэдэхийг хүсвэл «现在几点了？» гэж асууна. 点 нь цаг гэсэн үг. Хариулахдаа «九点» гэх мэтээр цагаа хэлнэ. Минут нэмж хэлбэл «三点零五» — гурван цаг тавын минут. Тавын өмнө 零 хэлэхээ бүү март!",
  "teacher_notes":"Номын яриа: 三点零五了。Test: 两点零七. Хүүхдэд цаасан цаг хийлгэж зүүгээр нь хэлүүл.",
  "examples":[ex("现在几点了？","Xiànzài jǐ diǎn le?","Одоо хэдэн цаг болж байна?"),ex("三点零五了。","Sān diǎn líng wǔ le.","Гурван цаг тавын минут болжээ."),ex("两点零七。","Liǎng diǎn líng qī.","Хоёр цаг долоон минут."),ex("九点。","Jiǔ diǎn.","Есөн цаг.")],
  "common_mistakes":[{"wrong":"三点五了。","right":"三点零五了。","why":"Минут нэг оронтой бол 零 хэлнэ."},{"wrong":"二点","right":"两点","why":"Цагийг хэлэхэд 2-ыг 两 гэж хэлдэг."}],
  "check":chk("«Одоо хэдэн цаг болж байна?» гэж асуу:",["现在几点了？","你会打电话吗？","我可以去玩吗？"],"现在几点了？","g1c"),
  "exercises":[
   choice("现在 ________ 点了？",["几","会","年"],"几","Зөв! 几点 = хэдэн цаг.","几 = хэдэн.","g1e1"),
   choice("3:05 хятадаар:",["三点零五","三点五","五点三"],"三点零五","Зөв! Минут нэг оронтой бол 零.","3:05 — 三点零五.","g1e2"),
   judge("«两点零七» нь 2 цаг 07 минут.",True,"Зөв! 两 = хоёр, 零七 = 07.","两点 = 2 цаг, 零七 = 07 минут.")]},
 {"point":"……了 — болчихлоо, өөрчлөгдлөө","gloss_mn":"«我来北京一年了。» — өөрчлөлт, хугацаа",
  "structure":"тэмдэг / үйл + 了 ·来……一年了",
  "teacher_mn":"Өөрчлөлтийг хэлэхдээ үгийн төгсгөлд 了 нэмнэ. «我的个子高了» — би өндөр болсон. «头发长了» — үс урт болсон. Хугацаа хэлэхдээ «来北京一年了» — Бээжинд ирээд нэг жил болсон. Алхаж, өөрчлөлтөө үзүүл!",
  "teacher_notes":"了-г механикаар орчуулахгүй: өмнө нь тийм биш байсан, одоо тийм болсон гэж хэл. Мариг жүжигчил.",
  "examples":[ex("我的个子高了。","Wǒ de gèzi gāo le.","Би өндөр болсон."),ex("头发长了。","Tóufa cháng le.","Үс урт болсон."),ex("我来北京一年了。","Wǒ lái Běijīng yì nián le.","Би Бээжинд ирээд нэг жил болжээ."),ex("我比以前漂亮了！","Wǒ bǐ yǐqián piàoliang le!","Би өмнөхөөсөө хөөрхөн болжээ!")],
  "common_mistakes":[{"wrong":"我来北京一年。","right":"我来北京一年了。","why":"Хугацааны төгсгөлд 了 хэлж «болчихсон» гэнэ."}],
  "check":chk("«Би өндөр болсон» хятадаар:",["我的个子高了。","我的个子高吗？","我有个子。"],"我的个子高了。","g2c"),
  "exercises":[
   choice("头发长 ________。",["了","吗","几"],"了","Зөв! 长了 = урт болсон.","өөрчлөлтөд 了.","g2e1"),
   choice("«Бээжинд ирээд нэг жил болсон»:",["来北京一年了","北京来一年","一年北京来吗"],"来北京一年了","Зөв!","Дараалал: 来北京 → 一年 → 了.","g2e2"),
   judge("«头发长了» нь «үс урт болсон» гэсэн үг.",True,"Зөв! 了 — өөрчлөлт.","长了 = урт болсон.")]},
 {"point":"会 ба 可以 — чадна, болно","gloss_mn":"«你会……吗？» ба «我可以……吗？»",
  "structure":"会 + үйл (чадна) · 可以 + үйл (болно)",
  "teacher_mn":"Сурсан зүйлээ чадна гэж хэлэхдээ 会 гэнэ: «我会打电话» — би утсаар ярьж чадна. Зөвшөөрөл гуйхдаа 可以 гэнэ: «我可以玩吗？» — би тоглож болох уу? Хариулахдаа «可以» гэвэл «болно». Хоёуланг нь жүжигчилж үз!",
  "teacher_notes":"会 = чадвар, 可以 = зөвшөөрөл. Test 2: 我可以玩十分钟吗？→ 可以。",
  "examples":[ex("你会用汉语打电话吗？","Nǐ huì yòng Hànyǔ dǎ diànhuà ma?","Чи хятадаар утсаар ярьж чадах уу?"),ex("会。","Huì.","Чадна."),ex("我可以去那儿玩十分钟吗？","Wǒ kěyǐ qù nàr wán shí fēnzhōng ma?","Би тэнд арван минут тоглож болох уу?"),ex("可以。","Kěyǐ.","Болно.")],
  "common_mistakes":[{"wrong":"我会玩十分钟吗？(зөвшөөрөл гуйхдаа)","right":"我可以玩十分钟吗？","why":"Зөвшөөрөл гуйхдаа 可以."}],
  "check":chk("Ээжээс «Би тоглож болох уу?» гэж асуу:",["我可以玩吗？","我会玩。","我来玩了。"],"我可以玩吗？","g3c"),
  "exercises":[
   choice("我 ________ 用汉语打电话。",["会","点","年"],"会","Зөв! 会 = чадна.","会 = чадна.","g3e1"),
   choice("«Би тоглож болох уу?» — аль нь вэ?",["我可以玩吗？","我玩十分钟。","我几点玩？"],"我可以玩吗？","Зөв!","Зөвшөөрөл — 可以……吗？","g3e2"),
   judge("«可以» гэж хариулбал «болно» гэсэн утга.",True,"Зөв! 可以 = болно.","可以 = болно.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Одоо» хятадаар аль нь вэ?",["现在","今天","明天","早上"],"现在","现在 (xiànzài) = одоо.","easy",["vocabulary"],"a1")
q("choice","«Цаг (3 цаг гэх)» хятадаар аль нь вэ?",["点","年","来","会"],"点","点 (diǎn) = цаг.","easy",["vocabulary"],"a2")
q("choice","«Минут» хятадаар аль нь вэ?",["分钟","小时","年","点"],"分钟","分钟 (fēnzhōng) = минут.","easy",["vocabulary"],"a3")
q("choice","«Жил» хятадаар аль нь вэ?",["年","月","点","号"],"年","年 (nián) = жил.","easy",["vocabulary"],"a4")
q("choice","«Ирэх» хятадаар аль нь вэ?",["来","去","看","吃"],"来","来 (lái) = ирэх. 去 = явах.","easy",["vocabulary"],"a5")
q("choice","«Бээжин» хятадаар аль нь вэ?",["北京","学校","医院","商店"],"北京","北京 (Běijīng) = Бээжин.","easy",["vocabulary"],"a6")
q("choice","«打电话» гэдэг нь:",["утсаар ярих","ном унших","унтах","зурагт үзэх"],"утсаар ярих","打电话 (dǎ diànhuà) = утсаар ярих.","easy",["vocabulary"],"a7")
q("choice","«会» гэдэг үг ямар утгатай вэ?",["чадна","явна","байна","хэдэн"],"чадна","会 (huì) = сурсан учраас чадна.","easy",["vocabulary"],"a8")
q("choice","«零» гэдэг нь:",["тэг","нэг","арав","хоёр"],"тэг","零 (líng) = тэг.","easy",["vocabulary"],"a9")
q("choice","«早上» гэдэг нь:",["өглөө","орой","үд дунд","өчигдөр"],"өглөө","早上 (zǎoshang) = өглөө. 晚上 = орой.","easy",["vocabulary"],"a10")
q("choice","«晚上» гэдэг нь:",["орой","өглөө","одоо","маргааш"],"орой","晚上 (wǎnshang) = орой.","easy",["vocabulary"],"a11")
q("choice","«漂亮» гэдэг нь:",["хөөрхөн","өндөр","урт","том"],"хөөрхөн","漂亮 (piàoliang) = хөөрхөн.","medium",["vocabulary"],"a12")
q("choice","«Одоо хэдэн цаг болж байна?» хятадаар:",["现在几点了？","你几岁了？","你叫什么？","你家在哪儿？"],"现在几点了？","几点 = хэдэн цаг.","easy",["dialogue"],"a13")
q("choice","«三点零五» гэдэг нь:",["3 цаг 05 минут","5 цаг 3 минут","3 цаг 50","35 минут"],"3 цаг 05 минут","三点 = 3 цаг, 零五 = 05 минут.","medium",["number"],"a14")
q("choice","«两点零七» гэдэг нь:",["2 цаг 07 минут","7 цаг 2 минут","2 цаг 70","12 цаг"],"2 цаг 07 минут","两点 = 2 цаг, 零七 = 07 минут.","medium",["number"],"a15")
q("choice","«Арван минут» хятадаар:",["十分钟","十点","十年","十个"],"十分钟","分钟 = минут.","medium",["number"],"a16")
q("cloze","现在几（ ）了？",["点","年","会","分钟"],"点","几点了 — хэдэн цаг болов.","easy",["dialogue"],"a17")
q("cloze","我可以玩十（ ）吗？",["分钟","点","来","零"],"分钟","十分钟 = арван минут.","medium",["dialogue"],"a18")
q("cloze","你（ ）用汉语打电话吗？",["会","来","点","年"],"会","会 = чадах.","easy",["dialogue"],"a19")
q("cloze","我来北京一年（ ）。",["了","吗","几","的"],"了","来北京一年了 — нэг жил болжээ.","medium",["dialogue"],"a20")
q("cloze","我的头发长（ ）。",["了","点","分钟","年"],"了","长了 = урт болсон.","medium",["dialogue"],"a21")
q("choice","Пиньинь «fēnzhōng» гэж уншдаг үг:",["分钟","北京","现在","打电话"],"分钟","分钟 = fēnzhōng = минут.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «Běijīng» гэж уншдаг үг:",["北京","学校","现在","晚上"],"北京","北京 = Běijīng.","easy",["pronunciation"],"a23")
q("choice","Пиньинь «dǎ diànhuà» гэж уншдаг үг:",["打电话","看电视","去学校","喝茶"],"打电话","打电话 = утсаар ярих.","medium",["pronunciation"],"a24")
q("usage","Ээжээс тоглох зөвшөөрөл гуйхдаа:",["我可以玩吗？","我会玩。","现在几点了？","我来了。"],"我可以玩吗？","Зөвшөөрөл гуйхад 可以……吗？","medium",["usage"],"a25")
q("usage","Ээж «可以» гэвэл:",["болно гэсэн үг","болохгүй гэсэн үг","баяртай гэсэн үг","хэдэн гэсэн үг"],"болно гэсэн үг","可以 = болно.","easy",["usage"],"a26")
q("usage","Мари Бээжинд ирээд хэдэн жил болсон бэ?",["нэг жил","хоёр жил","гурван жил","нэг сар"],"нэг жил","我来北京一年了 — нэг жил.","easy",["usage"],"a27")
q("usage","Mini story-д өглөө хүү хэнтэй хөдөлгөөн хийсэн бэ?",["аавтайгаа","ээжтэйгээ","найзтайгаа","ахтайгаа"],"аавтайгаа","早上，我和爸爸运动。","medium",["usage"],"a28")
q("usage","Mini story-д орой хүү юу хийсэн бэ?",["ном уншсан","зурагт үзсэн","унтсан","тоглосон"],"ном уншсан","晚上，我看半个小时书。","medium",["usage"],"a29")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t5a"),img("t5b"),img("t5c"),img("t5d")]
def lis(n,script,py,opts,optpy,ans,expl):
    return {"n":n,"question_zh":f"（听录音）{script}","question_mn":f"{n}-р асуулт: асуултыг сонсоод тохирох хариуг A, B, C-ээс сонго","script_zh":script,"pinyin":py,
            "options":["A","B","C"],"optionTexts":opts,"optionPinyin":optpy,"answer":ans,"explanation_mn":expl}
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (11-04) сонсоод асуултад тохирох хариуг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    lis(1,"现在几点了？","Xiànzài jǐ diǎn le?",["再见","星期一","两点零七"],["zàijiàn","Xīngqīyī","liǎng diǎn líng qī"],"C","Асуулт «Одоо хэдэн цаг болж байна?» — цагаар хариулна. C «两点零七» = 2 цаг 07 минут. A «баяртай», B «даваа гараг» — цаг биш."),
    lis(2,"我可以玩十分钟吗？","Wǒ kěyǐ wán shí fēnzhōng ma?",["几个椅子","不客气","可以"],["jǐ ge yǐzi","bú kèqi","kěyǐ"],"C","«Би арван минут тоглож болох уу?» — зөвшөөрч «可以 (болно)» гэж хариулна. A «хэдэн сандал», B «зүгээр» — таарахгүй."),
    lis(3,"你在做什么呢？","Nǐ zài zuò shénme ne?",["八分钟","打电话","来北京"],["bā fēnzhōng","dǎ diànhuà","lái Běijīng"],"B","«Чи юу хийж байна?» — үйлдлээр хариулна. B «打电话» = утсаар ярьж байна. A «8 минут» хугацаа, C «Бээжинд ирэх» — тохирохгүй."),
    lis(4,"你弟弟在哪个房间？","Nǐ dìdi zài nǎ ge fángjiān?",["他在六零七","他在房间里","他今年八岁了"],["tā zài liù líng qī","tā zài fángjiān li","tā jīnnián bā suì le"],"A","«Дүү чинь аль өрөөнд байна вэ?» — өрөөний дугаараар хариулна. A «607». B «өрөөнд байна» — аль өрөө гэдгийг хэлээгүй. C «8 настай» — нас.")],
   "answer_source":"Test Answers: 1.C 2.C 3.B 4.A; Listening script"},
  {"part":2,"type":"choice","instruction_mn":"Унших — яриа бүрд тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"A：现在几点了？ B：九点。","question_mn":"«Одоо хэдэн цаг?» — «Есөн цаг.»","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"«Есөн цаг» — A зураг дээр ханын цаг 9 цагийг заасан байна. B утсаар ярьж буй хүү, C хоёр хүүхэд, D урт үстэй эмэгтэй."},
    {"n":6,"question_zh":"A：我的头发长吗？ B：很长。","question_mn":"«Миний үс урт уу?» — «Урт.»","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"«Үс урт» — D зураг дээрх эмэгтэй урт үстэй. A цаг, B утсаар ярьж буй хүү, C хоёр хүүхэд — үс нь урт биш."},
    {"n":7,"question_zh":"A：你会用汉语打电话吗？ B：会。","question_mn":"«Чи хятадаар утсаар ярьж чадах уу?» — «Чадна.»","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"«Утсаар ярих» — B зураг дээр жижиг хүү утасны тавиур хамар дээр барьж ярьж байна. A цаг, C хоёр хүүхэд, D эмэгтэй."},
    {"n":8,"question_zh":"A：谁的个子高？ B：姐姐的个子比弟弟高。","question_mn":"«Хэн өндөр вэ?» — «Эгч дүүгээс өндөр.»","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"«Эгч дүүгээсээ өндөр» — C зураг дээр хоёр хүүхэд зэрэгцэж зогсож байна, охин нь хүүгээс өндөр. Бусад зураг дээр ганц хүн эсвэл цаг байна."}],
   "answer_source":"Test Answers: 5.A 6.D 7.B 8.C"},
  {"part":3,"type":"match","instruction_mn":"Үлгэр «Миний ням гараг» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"早上，我和爸爸运动两个小时。","answer":"1","explanation_mn":"1-р зураг дээр хүү аавтайгаа сагсан бөмбөг барьж байна."},
    {"n":2,"question_zh":"中午，我睡一个小时。","answer":"2","explanation_mn":"2-р зураг дээр хүү орон дээр унтаж байна."},
    {"n":3,"question_zh":"下午，我看一个小时电视。","answer":"3","explanation_mn":"3-р зураг дээр хүү буйдан дээр зурагт үзэж байна."},
    {"n":4,"question_zh":"晚上，我看半个小时书。","answer":"4","explanation_mn":"4-р зураг дээр хүү орон дээрээ ном уншиж байна."}],
   "answer_source":"textbook х.56 (Mini story)"},
  {"part":4,"type":"match","instruction_mn":"Асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"妈妈，几点了？","answer":"三点零五了。","explanation_mn":"Цаг асуусан тул цагаар хариулна."},
    {"n":2,"question_zh":"我可以去那儿玩十分钟吗？","answer":"可以。","explanation_mn":"Зөвшөөрөл гуйсан тул «болно» гэж хариулна."}],
   "answer_source":"textbook х.54 (Let's read)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханз бичих — «жил», «цаг» гэсэн ханзыг дахин бичиж хуулж үз.","question_zh":"年 点","answer":"年 点","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Цаг хэд болсныг асуу, хариул.","question_zh":"现在几点了？","answer":"现在……点。","explanation_mn":"Цаасан цагаа хараад хос болж ээлжлэн."},
   {"n":2,"prompt_mn":"Өөрийн өөрчлөлтөө хэл.","question_zh":"我的个子高了。","answer":"我的……了。","explanation_mn":"Найздаа, дараа нь бүх ангид хэл."},
   {"n":3,"prompt_mn":"Өөрийн ням гарагийг ярь.","question_zh":"早上，我……","answer":"(нээлттэй)","explanation_mn":"Өглөө, үд дунд, үдээс хойш, орой юу хийдгээ хэл."}]},
 "answerSource":"YCT 标准教程 2 · Test Listening Scripts, Test Answers (Lesson 11)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("xianzai","现在"),("dian","点"),("ling","零"),("fenzhong","分钟"),("xiaoshi","小时"),("nian","年"),("lai","来"),("beijing","北京"),("dadianhua","打电话"),("hui","会"),("piaoliang","漂亮"),("zaoshang","早上"),("zhongwu","中午"),("xiawu","下午"),("wanshang","晚上"),("yundong","运动")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"我来北京一年了。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"妈妈，几点了？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"我和爸爸妈妈来北京一年了。","role":"illustration","section":"dialogue"},
 {"id":"story","file":"images/story.png","title":"我的星期天 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["5a","5b","5c","5d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 11-р хичээл — Цаг хэд вэ, Бээжинд нэг жил","chineseTitle":"我来北京一年了。","targetTitle":"我来北京一年了。","mongolianTitle":"Цаг хэд вэ, Бээжинд нэг жил",
 "subtitle":"现在几点了 · 三点零五 · ……了 · 会 / 可以 · 我的星期天",
 "description":f"Цаг хэд вэ гэж асуух ба хэлэх, өөрчлөлтөө «了»-гаар ярих, 会 ба 可以. {len(vocab)} үг, 2 зурагт яриа, Mini story, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"⏰","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第11课《我来北京一年了。》 [hskLevel=1] [lessonNumber=11]; эх: сурах бичиг х.54–57 (х.53 Let's learn, х.55 хуудас PDF-д байхгүй); аудио CD 11-01…11-04"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"我来北京一年了。","mongolianTitle":"Цаг хэд вэ, Бээжинд нэг жил",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第11课 (сурах бичиг + CD аудио 11-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (brief; зурагтай тулгасан)","textStatus":"source_verified (х.54,56,57); Let's learn (х.53) байхгүй тул үгийн сан хуудас+Vocabulary list-ээс сонгосон","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
