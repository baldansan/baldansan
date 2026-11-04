#!/usr/bin/env python3
"""YCT 标准教程 2 · 第10课 你怎么了？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess, shutil
ROOT = "/home/claude/work/yct2/l10"
OUT = f"{ROOT}/pkg"
CID, LID, N = "yct-2", "yct-2-l10", 10
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

# ---- Тестийн зураг + Let's match/Mini story зургийг номын хуудаснаас хайчлах
from PIL import Image
def crop(page, box, name, scale=2):
    im = Image.open(f"{ROOT}/pages/{page}").convert("RGB").crop(box)
    im = im.resize((im.width*scale, im.height*scale), Image.LANCZOS)
    im.save(f"{OUT}/images/{name}.png")
_ROWY = [(320,446),(490,616),(660,786),(830,955)]
_COLX = [(291,541),(545,796),(800,1050)]
for r,(y0,y1) in enumerate(_ROWY, 1):
    for c,(x0,x1) in zip("abc",_COLX):
        crop("hi-53.png",(x0,y0,x1,y1),f"t{r}{c}")
crop("hi-52.png",(100,300,1105,1498),"story",1)
crop("hi-51.png",(130,230,1160,690),"match",1)
crop("hi-51.png",(200,830,1160,1440),"imagine",1)

# ---- audio: яриа (10-02) + mini story (10-03) нийлүүлэх (дуу энэ хичээлд байхгүй)
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-2-10-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = "audio/yct-2-10-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-2-10-02.mp3'\nfile '{A}/yct-2-10-03.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("脚","jiǎo","хөл","нэр үг · гол үг","我脚疼！","Wǒ jiǎo téng!","Миний хөл өвдөж байна!",True),
 ("医院","yīyuàn","эмнэлэг","нэр үг · гол үг","我不去医院，我去学校。","Wǒ bú qù yīyuàn, wǒ qù xuéxiào.","Би эмнэлэг явахгүй, сургууль явна.",True),
 ("怎么了","zěnme le","юу болсон бэ, яасан бэ","асуух хэллэг · гол үг","你怎么了？","Nǐ zěnme le?","Чи яасан бэ?",True),
 ("疼","téng","өвдөх","үйл үг · нэмэлт үг","我脚疼！","Wǒ jiǎo téng!","Миний хөл өвдөж байна!",False),
 ("手","shǒu","гар","нэр үг · нэмэлт үг","现在我手不疼了。","Xiànzài wǒ shǒu bù téng le.","Одоо миний гар өвдөхгүй боллоо.",False),
 ("医生","yīshēng","эмч","нэр үг · нэмэлт үг","我们去看医生。","Wǒmen qù kàn yīshēng.","Бид эмчид үзүүлэхээр явъя.",False),
 ("起床","qǐchuáng","орноосоо босох","үйл үг · нэмэлт үг","明明，起床！","Míngming, qǐchuáng!","Мин-мин, босооч!",False),
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
 {"id":1,"title_mn":"Яриа 1 · Өглөө орон дээр","scene_mn":"Өглөө ээж Мин-минийг сэрээж байна. Мин-мин орондоо хэвтээд нүдээ дарсан хэвээр байна. Ээж «чи яасан бэ?» гэж асууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"妈妈","zh":"明明，起床！","pinyin":"Míngming, qǐchuáng!","mn":"Мин-мин, босооч!"},
           {"speaker":"明明","zh":"妈妈，我今天不去学校了，可以吗？","pinyin":"Māma, wǒ jīntiān bú qù xuéxiào le, kěyǐ ma?","mn":"Ээж ээ, би өнөөдөр сургууль явахгүй, болох уу?"},
           {"speaker":"妈妈","zh":"你怎么了？","pinyin":"Nǐ zěnme le?","mn":"Чи яасан бэ?"},
           {"speaker":"明明","zh":"我脚疼！","pinyin":"Wǒ jiǎo téng!","mn":"Миний хөл өвдөж байна!"}]},
 {"id":2,"title_mn":"Яриа 2 · Эмнэлэг явах уу, сургууль явах уу","scene_mn":"Ээж «эмчид үзүүлье» гэнэ. Харин Мин-мин сургуульд явж найзуудтайгаа тоглохыг бодож байна. Хөл нь өвдөхгүй болсон байж!","audio":AUD_TEXT,
  "lines":[{"speaker":"妈妈","zh":"我们去看医生。","pinyin":"Wǒmen qù kàn yīshēng.","mn":"Бид эмчид үзүүлэхээр явъя."},
           {"speaker":"明明","zh":"妈妈，我不去医院，我去学校。","pinyin":"Māma, wǒ bú qù yīyuàn, wǒ qù xuéxiào.","mn":"Ээж ээ, би эмнэлэг явахгүй, сургууль явна."},
           {"speaker":"妈妈","zh":"去学校？你脚不疼了？","pinyin":"Qù xuéxiào? Nǐ jiǎo bù téng le?","mn":"Сургууль явах гэнээ? Чиний хөл өвдөхгүй болсон юм уу?"},
           {"speaker":"明明","zh":"不疼了！","pinyin":"Bù téng le!","mn":"Өвдөхгүй боллоо!"}]},
]
sentences=[]
dlg = [
 (1,"妈妈：明明，起床！","Māma: Míngming, qǐchuáng!","Ээж: Мин-мин, босооч!","妈妈：| 明明|Míngming ，| 起床|qǐchuáng ！|","起床 = орноосоо босох. Өглөө ээж хүүгээ ингэж сэрээдэг.",[]),
 (1,"明明：妈妈，我今天不去学校了，可以吗？","Míngming: Māma, wǒ jīntiān bú qù xuéxiào le, kěyǐ ma?","Мин-мин: Ээж ээ, би өнөөдөр сургууль явахгүй, болох уу?","明明：| 妈妈|māma ，| 我|wǒ 今天|jīntiān 不|bú 去|qù 学校|xuéxiào 了|le ，| 可以|kěyǐ 吗|ma ？|","不去……了 = «явахгүй боллоо». 了 нь «өмнө өөр байсан, одоо өөрчлөгдсөн» гэсэн санааг өгдөг.",["我今天不去学校了。"]),
 (1,"妈妈：你怎么了？","Māma: Nǐ zěnme le?","Ээж: Чи яасан бэ?","妈妈：| 你|nǐ 怎么|zěnme 了|le ？|","你怎么了？ — хэн нэгэн тааламжгүй харагдахад «Чи яасан бэ?» гэж асууна.",["你怎么了？"]),
 (1,"明明：我脚疼！","Míngming: Wǒ jiǎo téng!","Мин-мин: Миний хөл өвдөж байна!","明明：| 我|wǒ 脚|jiǎo 疼|téng ！|","Хэсгээ нэрлээд 疼 гэж хэлнэ: 脚疼 — хөл өвдөнө.",[]),
 (2,"妈妈：我们去看医生。","Māma: Wǒmen qù kàn yīshēng.","Ээж: Бид эмчид үзүүлэхээр явъя.","妈妈：| 我们|wǒmen 去|qù 看|kàn 医生|yīshēng 。|","看医生 = эмчид үзүүлэх (эмчийг «харах»).",[]),
 (2,"明明：妈妈，我不去医院，我去学校。","Míngming: Māma, wǒ bú qù yīyuàn, wǒ qù xuéxiào.","Мин-мин: Ээж ээ, би эмнэлэг явахгүй, сургууль явна.","明明：| 妈妈|māma ，| 我|wǒ 不|bú 去|qù 医院|yīyuàn ，| 我|wǒ 去|qù 学校|xuéxiào 。|","不去 = явахгүй, 去 = явна.",[]),
 (2,"妈妈：去学校？你脚不疼了？","Māma: Qù xuéxiào? Nǐ jiǎo bù téng le?","Ээж: Сургууль явах гэнээ? Чиний хөл өвдөхгүй болсон юм уу?","妈妈：| 去|qù 学校|xuéxiào ？| 你|nǐ 脚|jiǎo 不|bù 疼|téng 了|le ？|","不疼了 = өвдөхгүй боллоо.",["你脚不疼了？"]),
 (2,"明明：不疼了！","Míngming: Bù téng le!","Мин-мин: Өвдөхгүй боллоо!","明明：| 不|bù 疼|téng 了|le ！|","Богино хариулт: 不疼了！",["现在我手不疼了。"]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("蝴蝶：你们好！","Húdié: Nǐmen hǎo!","Эрвээхэй: Сайн уу, та нар аа!","蝴蝶：| 你们|nǐmen 好|hǎo ！|"),
 ("蜜蜂：你是谁？我们不认识你！","Mìfēng: Nǐ shì shéi? Wǒmen bú rènshi nǐ!","Зөгий: Чи хэн бэ? Бид чамайг танихгүй шүү!","蜜蜂：| 你|nǐ 是|shì 谁|shéi ？| 我们|wǒmen 不|bú 认识|rènshi 你|nǐ ！|"),
 ("蝴蝶：我以前是毛毛虫，现在是小蝴蝶了！","Húdié: Wǒ yǐqián shì máomaochóng, xiànzài shì xiǎo húdié le!","Эрвээхэй: Би өмнө нь үслэг хорхой байсан, одоо жижиг эрвээхэй болсон!","蝴蝶：| 我|wǒ 以前|yǐqián 是|shì 毛毛虫|máomaochóng ，| 现在|xiànzài 是|shì 小|xiǎo 蝴蝶|húdié 了|le ！|"),
 ("蚂蚁：你会飞了！","Mǎyǐ: Nǐ huì fēi le!","Шоргоолж: Чи нисдэг боллоо!","蚂蚁：| 你|nǐ 会|huì 飞|fēi 了|le ！|"),
 ("蜜蜂：你比以前漂亮了！","Mìfēng: Nǐ bǐ yǐqián piàoliang le!","Зөгий: Чи өмнөхөөсөө хөөрхөн болжээ!","蜜蜂：| 你|nǐ 比|bǐ 以前|yǐqián 漂亮|piàoliang 了|le ！|"),
 ("蝴蝶：以前我们是好朋友，现在还是好朋友！","Húdié: Yǐqián wǒmen shì hǎo péngyou, xiànzài hái shì hǎo péngyou!","Эрвээхэй: Өмнө бид сайн найзууд байсан, одоо ч сайн найзууд хэвээрээ!","蝴蝶：| 以前|yǐqián 我们|wǒmen 是|shì 好|hǎo 朋友|péngyou ，| 现在|xiànzài 还是|háishi 好|hǎo 朋友|péngyou ！|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «好朋友» — 4 зурагтай үлгэр. Эрвээхэй үслэг хорхой байснаа найзууддаа хэлнэ."
    if i==2: s["note"]="以前 = өмнө, 现在 = одоо. «……了» нь өөрчлөгдсөнийг хэлнэ: 现在是小蝴蝶了 — одоо эрвээхэй боллоо."
    sentences.append(s)

texts = {
 "unit":{"number":"10","title":"你怎么了？","mongolianTitle":"Чи яасан бэ? — өвдөхийг хэлэх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, найзуудаа! Би Тэмээ багш. Өмнөх номд чи биеийн хэсэг, хоол, тоо хэлж сурсан шүү. Өнөөдөр илүү чухал юм сурна. Заримдаа хөл, гар өвдөх үе байдаг шүү дээ. Тэр үед найзаасаа «你怎么了？» — «Чи яасан бэ?» гэж асууна. Чи «我脚疼！» — «Миний хөл өвдөж байна!» гэж хариулна. Харин сайжирвал «不疼了！» гэнэ. Мин-минтэй хамт ээжийгээ ятгаж үзэцгээе. Эхэлцгээе!",
  "warmup_mn":"Хөлөө, гараа заагаад хятадаар хэлж үз: 脚, 手. Чи хамгийн сүүлд хаана өвдөж байсан бэ?",
  "theme_zh":"怎么了 · 疼 · 不……了","theme_mn":"Яасан бэ · Өвдөх · Одоо ……гүй боллоо"},
 "warmup":{"mongolian":"Хөлөө, гараа заагаад хятадаар хэлж үз: 脚, 手. Чи хамгийн сүүлд хаана өвдөж байсан бэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"10","title":"你怎么了？","mongolianTitle":"Чи яасан бэ? — яриа, үлгэр","title_mn":"Let's read · 2 яриа + Mini story · 好朋友","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第10课 Let's read / Mini story（CD 10-02, 10-03）","author_zh":"",
  "intro_zh":"明明脚疼，不想去学校。后来他的脚不疼了。再读小故事《好朋友》。",
  "intro_mn":"Мин-мин хөл өвдөнө гээд сургууль явахгүй гэж байна. Гэтэл дараа нь хөл нь өвдөхөө больжээ. Яагаад гэж ээж нь гайхна. Дараа нь «Сайн найзууд» үлгэрийг уншина: эрвээхэй үслэг хорхой байснаа найзууддаа хэлнэ. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Өглөө ээж Мин-минийг сэрээнэ. Мин-мин «хөл өвдөж байна» гээд сургууль явахгүй гэнэ."},
   {"paragraph":2,"mn":"Яриа 2 — Ээж эмнэлэг явъя гэхэд Мин-мин «хөл өвдөхгүй боллоо, сургууль явна» гэнэ. Найзуудтайгаа тоглохыг хүссэн бололтой."},
   {"paragraph":3,"mn":"Үлгэр «Сайн найзууд» — шоргоолж, зөгий хоёр эрвээхэйг танихгүй байв. Эрвээхэй «би өмнө нь үслэг хорхой байсан» гэхэд тэд баярлаж, хамт найзууд хэвээр үлдэнэ. Аудио: 10-03."}],
  "reflection":{"questions_mn":["Мин-мин яагаад эмнэлэг явахыг хүссэнгүй вэ?","Чи өвдөөд сургууль, цэцэрлэгээсээ чөлөө авч байсан уу?","Чи үслэг хорхой байснаа мартсан эрвээхэйн оронд байвал юу гэх вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Найздаа асуу","zh":"你怎么了？我脚疼。","pinyin":"Nǐ zěnme le? Wǒ jiǎo téng.","mn":"Чи яасан бэ? Миний хөл өвдөж байна."},
  "writingPrompt_mn":"Найздаа «你怎么了？» гэж асуугаад, тэр өвдсөн дүр үзүүлээд «我……疼» гэж хариул."},
 "properNouns":[{"zh":"明明","pinyin":"Míngming","mn":"Мин-мин (хүүгийн нэр)"}],
 "wordExplanation":[
  {"word":"怎么了","gloss":"zěnme le — яасан бэ","explanation":"Найз чинь гунигтай, өвдсөн, эсвэл ямар нэг юм болсон бол «你怎么了？» гэж асууна. Хэн нэгний тухай асуух бол нэрийг нь түрүүлж хэлнэ: «手怎么了？» — «Гар чинь яасан бэ?».",
   "structure":"你怎么了？ → 我 + хэсэг + 疼。","teacher_notes":"Хүүхдүүдтэй дүр үзүүлэх тоглоом хийнэ: нэг нь өвдсөн дүр үзүүлж, нөгөө нь «你怎么了？» гэж асууна. Дүрмийн нэр томьёо хэрэглэхгүй.",
   "examples":[{"chinese":"你怎么了？","pinyin":"Nǐ zěnme le?","mongolian":"Чи яасан бэ?"},{"chinese":"我脚疼！","pinyin":"Wǒ jiǎo téng!","mongolian":"Миний хөл өвдөж байна!"},{"chinese":"手怎么了？","pinyin":"Shǒu zěnme le?","mongolian":"Гар чинь яасан бэ?"}],
   "common_mistakes":[{"wrong":"你是怎么了？","right":"你怎么了？","why":"«是» нэмэхгүй, шууд «你怎么了？» гэнэ."}],
   "check":{"question":"«Чи яасан бэ?» хятадаар:","options":["你怎么了？","你去医院吗？","我脚疼。"],"answer":"0"},
   "practice":[{"n":1,"question":"你 ________ 了？(яасан бэ)","answer":"怎么","explanation_mn":"怎么了 = яасан бэ."}]},
  {"word":"不……了","gloss":"bù … le — …гүй боллоо","explanation":"«不疼了» гэвэл «өвдөхгүй боллоо». Өмнө нь өвдөж байсан, одоо өөр болсныг 了 хэлнэ. «我不去学校了» — «Би сургууль явахгүй боллоо».",
   "structure":"我 + 不 + үйл/байдал + 了。","teacher_notes":"了 нь «өөрчлөлт» гэсэн санааг өгдөг. Номын 4 жишээ: 脚不疼了, 不吃了, 不去学校了, 没有牛奶了.",
   "examples":[{"chinese":"我脚不疼了。","pinyin":"Wǒ jiǎo bù téng le.","mongolian":"Миний хөл өвдөхгүй боллоо."},{"chinese":"我不吃了。","pinyin":"Wǒ bù chī le.","mongolian":"Би идэхгүй, хангалттай."},{"chinese":"家里没有牛奶了。","pinyin":"Jiā li méi yǒu niúnǎi le.","mongolian":"Гэрт сүү дуусчээ."}],
   "common_mistakes":[{"wrong":"我脚不疼。 (өвдөж байсан бол)","right":"我脚不疼了。","why":"Өмнө өвдөж байсан, одоо өөр болсон бол 了 нэмнэ."}],
   "check":{"question":"«Миний хөл өвдөхгүй боллоо» хятадаар:","options":["我脚不疼了。","我脚疼。","我不去学校。"],"answer":"0"},
   "practice":[{"n":1,"question":"现在我手不疼 ________。(боллоо)","answer":"了","explanation_mn":"Өөрчлөлтийг 了 хэлнэ."}]},
 ],
 "collocations":[{"type":"хэсэг + 疼 — аль нь өвдөж байна","rows":[
   {"head":"脚","with":"疼","mn":"хөл өвдөх","usage_mn":"Хөл өвдөхөд","example":{"zh":"我脚疼！","pinyin":"Wǒ jiǎo téng!","mn":"Миний хөл өвдөж байна!"}},
   {"head":"不","with":"疼了","mn":"өвдөхгүй боллоо","usage_mn":"Сайжирсан үед","example":{"zh":"我脚不疼了。","pinyin":"Wǒ jiǎo bù téng le.","mn":"Миний хөл өвдөхгүй боллоо."}},
   {"head":"去","with":"医院","mn":"эмнэлэг явах","usage_mn":"Эмнэлэг явахдаа","example":{"zh":"我不去医院。","pinyin":"Wǒ bú qù yīyuàn.","mn":"Би эмнэлэг явахгүй."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["怎么","疼","医院","不"],"items":[
     {"n":1,"question":"你 ________ 了？","answer":"怎么","explanation_mn":"«Чи яасан бэ?» — 你怎么了."},
     {"n":2,"question":"我脚 ________。","answer":"疼","explanation_mn":"Хөл өвдөхийг 疼 гэнэ."},
     {"n":3,"question":"我们去 ________，看医生。","answer":"医院","explanation_mn":"Эмч эмнэлэгт байдаг."},
     {"n":4,"question":"我 ________ 去学校了。","answer":"不","explanation_mn":"«Явахгүй» — 不去."}]}],
   "answer_source":"agent-authored (YCT 2 · 10-р хичээлийн үгс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"明明怎么了？","answer":"脚疼。","explanation_mn":"Яриа 1 — Мин-мин «我脚疼！» гэв."},
     {"n":2,"question_zh":"明明为什么不去医院？","answer":"他的脚不疼了。","explanation_mn":"Яриа 2 — «不疼了！» гэв. Хөл нь өвдөхөө больсон тул эмнэлэг явах шаардлагагүй, сургууль явна."}],
   "answer_source":"textbook_verified (Let's read, х.49 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэр бүлтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Биеийн хэсгээ нэрлэе","start_zh":"脚 · 手","instruction_mn":"Ангиараа, эсвэл гэрийнхэнтэйгээ тойрч суугаад биеийн хэсгийг хятадаар ээлжлэн нэрлэ. Нэг нь гараа, нөгөө нь хөлөө зааж «手！ 脚！» гэж хэлнэ."},
     {"label":"Өвдсөн дүр үзүүл","start_zh":"你怎么了？","instruction_mn":"Хоёр хүн болж тоглоно. Нэг нь «你怎么了？» гэж асууна. Нөгөө нь хөлөө, гараа барьж өвдсөн дүр үзүүлээд «我脚疼！» гэх мэтээр хариулна. Дараа нь ээлжээ солино."},
     {"label":"Ээж ба хүү","start_zh":"我们去看医生。","instruction_mn":"Нэг нь ээж, нөгөө нь Мин-мин болно. Ээж «我们去看医生» гэхэд Мин-мин «我不去医院，我去学校» гэж ятгана. Номын яриагаар жүжиглэ."},
     {"label":"Үлгэрийн төгсгөл зохио","start_zh":"医生，我脚疼。","instruction_mn":"Гурван хүн болж эмч, ээж, хүү гурвын дүрд тоглоорой. Эмч хөлийг үзсэний дараа юу болох вэ? Төгсгөлийг зохиогоод бүхэл үлгэрийг жүжигл. Хамгийн хөгжилтэй нь хожно!"},
     {"label":"Эрвээхэйн үлгэр","start_zh":"我以前是毛毛虫。","instruction_mn":"«好朋友» үлгэрийг найзуудтайгаа тоглоорой: нэг нь эрвээхэй, нэг нь шоргоолж, нэг нь зөгий. Эрвээхэй «我以前是毛毛虫，现在是小蝴蝶了！» гээд далавчаа дэвсэж, бүгд тэврэлцээрэй."}]}},
 "grammarNotes":[],
 "culture":{"title":"看医生","title_mn":"Хятад хүүхэд өвдвөл яадаг вэ","text_mn":"Хятадад хүүхэд өвдвөл ээж аав нь эмнэлэгт аваачиж эмчид үзүүлдэг. Эмнэлгийг хятадаар «医院» гэнэ. Хөнгөн ханиад хүрсэн хүүхдэд халуун ус, халуун сүү өгч, сайн амраана.","note_mn":"Чи өвдөхөд ээж аав чинь юу хийдэг вэ? Халуун цай уулгадаг уу? Монголд ч, Хятадад ч ээж аав хүүхдээ л хамгийн түрүүнд халамжилна."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — өвдсөнөө хэлэх, «……гүй боллоо» гэж хэлэх.","topic":"Найздаа «чи яасан бэ?» гэж асуу","discussion":["Хосоороо: нэг нь «你怎么了？» гэж асууна, нөгөө нь «我脚疼 / 我手疼» гэж хариулна.","Бүгдээрээ «不疼了！» гэж хэлээд үсэрч, хөл сайжирсан дүр үзүүл."],
   "writing":{"promptChinese":"你怎么了？我……疼。","promptMongolian":"Гэрийн даалгавар: ээж, аавдаа «我脚疼！» гэж хэлээд, дараа нь «不疼了！» гэж хэлж үз.","minChars":"0","requiredWords":["脚","疼","不"],"sampleChinese":"我脚疼。现在我脚不疼了。","sampleMongolian":"Миний хөл өвдөж байсан. Одоо миний хөл өвдөхгүй боллоо.","gradingRubric":"«怎么了», «疼», «不……了»-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers: L10 1.C 2.A 3.B 4.A 5.C 6.B 7.A 8.D","parts":[]},
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
 {"point":"你怎么了？ — Чи яасан бэ?","gloss_mn":"«Чи яасан бэ?» — өвдсөн, гунигтай хүнээс асууна",
  "structure":"你怎么了？ → 我 + хэсэг + 疼。",
  "teacher_mn":"Найз чинь гунигтай байвал яана? «你怎么了？» гэж асууна. Хариулахдаа өвдсөн хэсгээ хэлээд «疼» гэнэ: «我脚疼». Гараараа хөлөө барьж үзээд хэл!",
  "teacher_notes":"Номын Key sentence. «手怎么了？» гэж тусгай хэсгийг ч асууж болно. Яриа 1: 你怎么了？— 我脚疼！",
  "examples":[ex("你怎么了？","Nǐ zěnme le?","Чи яасан бэ?"),ex("我脚疼！","Wǒ jiǎo téng!","Миний хөл өвдөж байна!"),ex("手怎么了？","Shǒu zěnme le?","Гар чинь яасан бэ?"),ex("你的脚怎么了？","Nǐ de jiǎo zěnme le?","Чиний хөл яасан бэ?")],
  "common_mistakes":[{"wrong":"你是怎么了？","right":"你怎么了？","why":"«是» нэмэхгүй."}],
  "check":chk("Найзаасаа «Чи яасан бэ?» гэж асуу:",["你怎么了？","我脚疼。","我去医院。"],"你怎么了？","g1c"),
  "exercises":[
   choice("你 ________ 了？",["怎么","医院","手"],"怎么","Зөв! 怎么了 = яасан бэ.","怎么了 = яасан бэ, 医院 = эмнэлэг, 手 = гар.","g1e1"),
   choice("«Миний хөл өвдөж байна» хятадаар:",["我脚疼。","我去医院。","你怎么了？"],"我脚疼。","Зөв! 脚 = хөл, 疼 = өвдөх.","脚疼 = хөл өвдөнө.","g1e2"),
   judge("«你怎么了？» гэдэг нь «Чи хаана байна?» гэсэн үг.",False,"Зөв — «Чи яасан бэ?» гэсэн үг.","你怎么了 = Чи яасан бэ?")]},
 {"point":"不……了 — …гүй боллоо","gloss_mn":"«Өмнө байсан, одоо өөрчлөгдсөн» — 不疼了",
  "structure":"我 + 不 + үйл/байдал + 了。",
  "teacher_mn":"Хөл чинь өвдөж байснаа сайжирвал «不疼了» гэнэ — «өвдөхгүй боллоо». Сургуульд явахаа больвол «不去学校了». Юм дуусвал «没有牛奶了» — «сүү дууслаа». Үсэрч «不疼了！» гэж хэлээд үз!",
  "teacher_notes":"了 нь өөрчлөлтийг хэлдэг. Яриа 2: 你脚不疼了？— 不疼了！ Let's match: 家里没有牛奶了 / 我不吃了 / 我脚不疼了 / 我明天不去学校了.",
  "examples":[ex("现在我手不疼了。","Xiànzài wǒ shǒu bù téng le.","Одоо миний гар өвдөхгүй боллоо."),ex("不疼了！","Bù téng le!","Өвдөхгүй боллоо!"),ex("我不吃了。","Wǒ bù chī le.","Би идэхгүй, хангалттай."),ex("家里没有牛奶了。","Jiā li méi yǒu niúnǎi le.","Гэрт сүү дуусчээ.")],
  "common_mistakes":[{"wrong":"我不吃。 (өмнө нь идэж байсан бол)","right":"我不吃了。","why":"Идэж байснаа больсон бол 了 нэмнэ."},{"wrong":"我脚不疼了了。","right":"我脚不疼了。","why":"了 нэг л удаа орно."}],
  "check":chk("«Миний хөл өвдөхгүй боллоо» хятадаар:",["我脚不疼了。","我脚疼。","我去医院。"],"我脚不疼了。","g2c"),
  "exercises":[
   choice("我脚不疼 ________。",["了","医院","手"],"了","Зөв! 了 — «боллоо».","了 нь өөрчлөлтийг хэлнэ.","g2e1"),
   choice("«Би идэхгүй боллоо» хятадаар:",["我不吃了。","我吃了。","我去吃。"],"我不吃了。","Зөв! 不 + 吃 + 了.","不……了 = …гүй боллоо.","g2e2"),
   judge("«不疼了» гэдэг нь «өвдөхгүй боллоо» гэсэн үг.",True,"Зөв! 不疼了 = өвдөхгүй боллоо.","不 = үгүй, 疼 = өвдөх, 了 = боллоо.")]},
 {"point":"去 + газар — явна, явахгүй","gloss_mn":"去学校 · 去医院 · 去看医生",
  "structure":"我 + 去 / 不去 + газар。",
  "teacher_mn":"Хаашаа явахаа 去 гэж хэлнэ. «去学校» — сургууль явна. «不去医院» — эмнэлэг явахгүй. «我们去看医生» — эмчид үзүүлэхээр явъя. Гараараа заагаад хэл!",
  "teacher_notes":"去 нь YCT1-д сурсан. Одоо 医院, 看医生-тэй хамт: 我不去医院，我去学校。",
  "examples":[ex("我去学校。","Wǒ qù xuéxiào.","Би сургууль явна."),ex("我不去医院。","Wǒ bú qù yīyuàn.","Би эмнэлэг явахгүй."),ex("我们去看医生。","Wǒmen qù kàn yīshēng.","Бид эмчид үзүүлэхээр явъя."),ex("我今天不去学校了。","Wǒ jīntiān bú qù xuéxiào le.","Би өнөөдөр сургууль явахгүй боллоо.")],
  "common_mistakes":[{"wrong":"我不是去医院。","right":"我不去医院。","why":"«явахгүй» гэхдээ 不 + 去."}],
  "check":chk("«Би эмнэлэг явахгүй» хятадаар:",["我不去医院。","我去学校。","我脚疼。"],"我不去医院。","g3c"),
  "exercises":[
   choice("我们 ________ 看医生。",["去","手","脚"],"去","Зөв! 去看医生 = эмчид үзүүлэхээр явна.","去 = явах.","g3e1"),
   choice("«Би сургууль явна» хятадаар:",["我去学校。","我不去学校。","我去医院。"],"我去学校。","Зөв! 学校 = сургууль.","学校 = сургууль, 医院 = эмнэлэг.","g3e2"),
   judge("«医院» гэдэг нь «сургууль» гэсэн үг.",False,"Зөв — 医院 = эмнэлэг, 学校 = сургууль.","医院 = эмнэлэг.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Хөл» хятадаар аль нь вэ?",["脚","手","医院","学校"],"脚","脚 (jiǎo) = хөл.","easy",["vocabulary"],"a1")
q("choice","«Гар» хятадаар аль нь вэ?",["手","脚","医生","老师"],"手","手 (shǒu) = гар.","easy",["vocabulary"],"a2")
q("choice","«Эмнэлэг» хятадаар аль нь вэ?",["医院","学校","医生","起床"],"医院","医院 (yīyuàn) = эмнэлэг.","easy",["vocabulary"],"a3")
q("choice","«Эмч» хятадаар аль нь вэ?",["医生","老师","医院","妈妈"],"医生","医生 (yīshēng) = эмч.","easy",["vocabulary"],"a4")
q("choice","«疼» гэдэг үг ямар утгатай вэ?",["өвдөх","идэх","явах","босох"],"өвдөх","疼 (téng) = өвдөх.","easy",["vocabulary"],"a5")
q("choice","«起床» гэдэг үг ямар утгатай вэ?",["орноосоо босох","сургууль явах","эмч үзэх","сүү уух"],"орноосоо босох","起床 (qǐchuáng) = орноосоо босох.","medium",["vocabulary"],"a6")
q("choice","«怎么了» гэдэг хэллэг ямар утгатай вэ?",["яасан бэ","баяртай","байхгүй","өвдөхгүй"],"яасан бэ","你怎么了？ = Чи яасан бэ?","easy",["vocabulary"],"a7")
q("choice","«Чи яасан бэ?» хятадаар:",["你怎么了？","你去哪儿？","你叫什么？","你好吗？"],"你怎么了？","怎么了 = яасан бэ.","easy",["dialogue"],"a8")
q("choice","«你怎么了？» гэж асуувал юу гэж хариулах вэ (хөл өвдөж байвал)?",["我脚疼。","我去学校。","再见。","谢谢。"],"我脚疼。","Хөл өвдөж байгаа тул 我脚疼.","easy",["dialogue"],"a9")
q("choice","Мин-мин ээждээ «Миний хөл өвдөж байна» гэж хэлэхдээ:",["我脚疼！","我手疼！","我不去！","我吃了！"],"我脚疼！","Яриа 1 — 我脚疼！","medium",["dialogue"],"a10")
q("choice","«Миний хөл өвдөхгүй боллоо» хятадаар:",["我脚不疼了。","我脚疼。","我手疼。","我不去了。"],"我脚不疼了。","不 + 疼 + 了 = өвдөхгүй боллоо.","medium",["structure"],"a11")
q("choice","«Би идэхгүй боллоо» хятадаар:",["我不吃了。","我吃饭。","我喝茶。","我去吃。"],"我不吃了。","不吃了 = идэхгүй боллоо.","medium",["structure"],"a12")
q("choice","«Гэрт сүү дуусчээ» хятадаар:",["家里没有牛奶了。","家里有牛奶。","我喝牛奶。","牛奶好喝。"],"家里没有牛奶了。","没有……了 = дууссан, байхгүй болсон.","hard",["structure"],"a13")
q("cloze","你（ ）了？",["怎么","医院","手","学校"],"怎么","你怎么了？","easy",["dialogue"],"a14")
q("cloze","我脚（ ）。",["疼","医院","学校","妈妈"],"疼","我脚疼 — хөл өвдөнө.","easy",["dialogue"],"a15")
q("cloze","我们去（ ）看医生。",["医院","手","脚","疼"],"医院","Эмч эмнэлэгт байдаг.","medium",["dialogue"],"a16")
q("cloze","我脚不疼（ ）。",["了","去","吃","手"],"了","不疼了 — өвдөхгүй боллоо.","medium",["structure"],"a17")
q("cloze","我不去医院，我去（ ）。",["学校","脚","疼","怎么"],"学校","Мин-мин эмнэлэг явахгүй, сургууль явна.","medium",["dialogue"],"a18")
q("choice","Мин-мин өглөө юу гэж хэлэв?",["今天不去学校了","今天去学校了","我去医院了","我吃了"],"今天不去学校了","Яриа 1: 我今天不去学校了，可以吗？","medium",["dialogue"],"a19")
q("choice","Мин-мин яагаад эмнэлэг явахгүй гэв?",["Хөл нь өвдөхөө больсон","Эмч дургүй","Сургууль байхгүй","Сүү байхгүй"],"Хөл нь өвдөхөө больсон","Яриа 2: 不疼了！","medium",["dialogue"],"a20")
q("choice","Пиньинь «jiǎo» гэж уншдаг үг:",["脚","手","疼","医"],"脚","脚 = jiǎo = хөл.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «yīyuàn» гэж уншдаг үг:",["医院","学校","医生","起床"],"医院","医院 = yīyuàn = эмнэлэг.","medium",["pronunciation"],"a22")
q("choice","Пиньинь «shǒu» гэж уншдаг үг:",["手","脚","疼","去"],"手","手 = shǒu = гар.","easy",["pronunciation"],"a23")
q("choice","Mini story-д эрвээхэй өмнө нь юу байсан бэ?",["毛毛虫","蜜蜂","蚂蚁","医生"],"毛毛虫","我以前是毛毛虫 — өмнө нь үслэг хорхой байсан.","medium",["usage"],"a24")
q("choice","Mini story-д «你会飞了！» гэж хэн хэлэв?",["蚂蚁","蝴蝶","医生","妈妈"],"蚂蚁","3-р зураг: шоргоолж «Чи нисдэг боллоо!» гэв.","hard",["usage"],"a25")
q("usage","Найз чинь гараа барьж гунигтай байна. Юу гэж асуух вэ?",["你怎么了？","再见。","你去学校吗？","我喝茶。"],"你怎么了？","Гунигтай найзаасаа «你怎么了？» гэж асууна.","medium",["usage"],"a26")
q("usage","Өвдөхөө больсон бол юу гэх вэ?",["不疼了！","疼！","我去医院。","怎么了？"],"不疼了！","Өвдөхөө больсон = 不疼了.","medium",["usage"],"a27")
q("choice","Дараах дундаас биеийн хэсэг нь:",["脚","学校","医院","妈妈"],"脚","脚 = хөл, бусад нь хүн/газар.","easy",["vocabulary"],"a28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
TBANK = ["A 怎么","B 不","C 了","D 可以"]
def lis(n,script,ans,expl):
    return {"n":n,"question_zh":f"（听录音）{script}","question_mn":f"{n}-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img(f"t{n}a"),img(f"t{n}b"),img(f"t{n}c")],"script_zh":script,"answer":ans,"explanation_mn":expl}
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (10-04) сонсоод зөв зургийг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    lis(1,"A：你姐姐去哪儿了？B：她去医院了。","C","«Эгч чинь хаашаа явсан бэ?» — «Тэр эмнэлэг явсан». C зураг дээр эмч өвчтөнтэй байна — эмнэлэг. A нь сургуульд гар өргөсөн охин, B нь компьютертэй залуу."),
    lis(2,"A：你的脚怎么样了？B：好多了，谢谢你。","A","«Хөл чинь яасан?» — «Их дээрдсэн». A зураг дээр хөл нь гипстэй, таяг бий — хөл. B нь гар, C нь гуяан дээр наалт."),
    lis(3,"A：医生，我的耳朵好了吗？B：我看看。","B","«Эмч ээ, миний чих сайжирсан уу?» — «Харъя». B зураг дээр эмч хүүхдийн чихийг шалгаж байна. A нь өндөр хэмжиж, C нь аман дотор харж байна."),
    lis(4,"A：他怎么了？B：没关系，他觉得不好吃。","A","«Тэр яасан бэ?» — «Зүгээр, түүнд амттай биш санагдаж байна». A зураг дээр нялх хүүхэд хоолноос татгалзаж уйлж байна. B нь ус ууж, C нь амттай идэж байна."),
   ],"answer_source":"YCT 2 Test Answers: 1.C 2.A 3.B 4.A; Listening script"},
  {"part":2,"type":"choice","instruction_mn":"Унших — А, B, C, D-ээс зөв үгийг сонгож нөхөө.","items":[
    {"n":5,"question_zh":"A：妈妈，家里没有牛奶（ ）。B：我明天去买。","question_mn":"Ээж ээ, гэрт сүү дуусчээ. — Би маргааш аваад ирье.","options":TBANK,"answer":"C","explanation_mn":"«Сүү байхгүй боллоо» — 没有牛奶了. 了 = боллоо. 怎么, 不, 可以 энд таарахгүй."},
    {"n":6,"question_zh":"A：请喝茶。B：（ ）喝了，我现在要去学校。","question_mn":"Цай уугаарай. — Уухгүй, би одоо сургууль явна.","options":TBANK,"answer":"B","explanation_mn":"«Уухгүй боллоо» — 不喝了. 不 = үгүй. Яагаад гэвэл сургууль явах гэж байна."},
    {"n":7,"question_zh":"A：姐姐，你的手（ ）了？B：没关系。","question_mn":"Эгч ээ, таны гар яасан бэ? — Зүгээр.","options":TBANK,"answer":"A","explanation_mn":"«Гар чинь яасан бэ?» — 手怎么了. 没关系 = зүгээр. Асуулт болохоор 怎么."},
    {"n":8,"question_zh":"A：今天中午吃米饭，（ ）吗？B：可以。","question_mn":"Өнөөдөр үдэд будаа идье, болох уу? — Болно.","options":TBANK,"answer":"D","explanation_mn":"«болох уу?» — 可以吗. Хариулт нь «可以». Бусад үг энд таарахгүй."}],
   "answer_source":"YCT 2 Test Answers: 5.C 6.B 7.A 8.D"},
  {"part":3,"type":"match","instruction_mn":"Let's match — зураг бүрт тохирох өгүүлбэрийг сонго (зургийн дугаараар).","image":img("match"),"items":[
    {"n":1,"question_zh":"A．家里没有牛奶了。","answer":"3","explanation_mn":"3-р зураг дээр хүү хөргөгчөө онгойлгоод хоосон байгааг харж байна — сүү дууссан."},
    {"n":2,"question_zh":"B．我不吃了。","answer":"1","explanation_mn":"1-р зураг дээр охин ууж дуусаад хоосон таваг дэргэд нь байна — идэхгүй."},
    {"n":3,"question_zh":"C．我脚不疼了。","answer":"4","explanation_mn":"4-р зураг дээр хоёр хүү спортоор хувцаслан зогсч байна — хөл нь өвдөхгүй боллоо."},
    {"n":4,"question_zh":"D．我明天不去学校了。","answer":"2","explanation_mn":"2-р зураг дээр хүү «no school» хуанли заасан — маргааш сургууль байхгүй."}],
   "answer_source":"Let's match (х.50) — зургаас тааруулсан, номд хариу байхгүй"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «好朋友» — зураг бүрт тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"你是谁？我们不认识你！","answer":"1","explanation_mn":"1-р зураг дээр зөгий, шоргоолж эрвээхэйг танихгүй байна."},
    {"n":2,"question_zh":"我以前是毛毛虫，现在是小蝴蝶了！","answer":"2","explanation_mn":"2-р зураг дээр үслэг хорхой → эрвээхэй болох дүрс."},
    {"n":3,"question_zh":"你会飞了！","answer":"3","explanation_mn":"3-р зураг дээр эрвээхэй далавчаа дэлгэсэн."},
    {"n":4,"question_zh":"以前我们是好朋友，现在还是好朋友！","answer":"4","explanation_mn":"4-р зураг дээр гурвуулаа гар барьж байна."}],
   "answer_source":"Mini story (х.51)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханз бичих — «хөл», «гар» гэсэн ханзыг бичиж үз.","question_zh":"脚 手","answer":"脚 手","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа асуу.","question_zh":"你怎么了？","answer":"你怎么了？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":2,"prompt_mn":"Өвдсөн дүр үзүүлээд хариул.","question_zh":"我脚疼。","answer":"我脚疼。","explanation_mn":"Хөлөө, гараа барьж тоглоорой."},
   {"n":3,"prompt_mn":"Let's imagine — гурван хүн болж, үлгэрийн төгсгөлийг зохиож жүжигл.","question_zh":"医生，我脚疼。","answer":"(нээлттэй)","explanation_mn":"Номын 3 зураг: хүү эмчид орно, эмч үзнэ, эмч боолт хийнэ. Дараа юу болох вэ?"}]},
 "answerSource":"YCT 标准教程 2 · х.52 Test (CD 10-04), Test Answers (Lesson 10)"}
dump("workbook.json", workbook)

# ---------------- IMAGE PROMPTS ----------------
NOTXT = " No English text."
def ip(file, aspect, title, section, prompt, chars, role=None):
    d={"file":file,"aspect":aspect,"title":title,"section":section}
    if role: d["role"]=role
    d["prompt"]=prompt+NOTXT; d["chars"]=chars; return d
PROMPTS = [
 ip("images/hero.jpg","4:3","你怎么了？","teacher-intro","Teacher camel with glasses stands beside a yellow camel calf boy who holds his sore foot and grimaces, the camel calf girl in a yellow dress asks with a concerned face and a speech bubble with the Chinese text 你怎么了？ in large clear black font; cozy bedroom with a small hospital cross sign on the wall.",["temee","huu","ohin"],"hero"),
 ip("images/w-jiao.jpg","1:1","脚","vocabulary","Close-up of the yellow camel calf boy's bare hooves and feet stepping on a sandy beach with small waves, feet clearly shown, cheerful.",["huu"]),
 ip("images/w-yiyuan.jpg","1:1","医院","vocabulary","A friendly small hospital building with a red cross sign; the brown camel calf boy in a green hat walks in with his adult camel mother, doctor camel in white coat waving at the door.",["bor"]),
 ip("images/w-zenmele.jpg","1:1","怎么了","vocabulary","The camel calf girl leans toward a sad yellow camel calf boy sitting on a bench, a big question mark above her head, caring face, asking what is wrong.",["ohin","huu"]),
 ip("images/w-teng.jpg","1:1","疼","vocabulary","The yellow camel calf boy holds his front leg with both hands, eyes squeezed shut, small red lightning pain marks around the leg, tears, exaggerated but cute.",["huu"]),
 ip("images/w-shou.jpg","1:1","手","vocabulary","The camel calf girl in a yellow dress holds up her hoof-hand waving with fingers spread, big friendly smile, hand centered and clearly visible.",["ohin"]),
 ip("images/w-yisheng.jpg","1:1","医生","vocabulary","A kind adult camel doctor wearing a white coat and a stethoscope listens to a small camel calf's chest, medical bag beside them, warm clinic room.",["bor"]),
 ip("images/w-qichuang.jpg","1:1","起床","vocabulary","The yellow camel calf boy sits up in bed stretching and yawning, sunlight through the window, his blanket with stars, an alarm clock on the table.",["huu"]),
 ip("images/d1.jpg","4:3","明明，起床！","dialogue","An adult camel mother in pink pajamas bends over a bed where the yellow camel calf boy lies under a star blanket covering one eye; speech bubble with the Chinese text 明明，起床！ in large clear black font; window with green curtains.",["huu"]),
 ip("images/d2.jpg","4:3","我们去看医生。","dialogue","The adult camel mother sits on the edge of the bed and talks to the yellow camel calf boy who smiles and points at school; two thought bubbles show a doctor and children playing; speech bubble with the Chinese text 我们去看医生。 in large clear black font.",["huu"]),
 ip("images/story.jpg","4:3","好朋友","story","A butterfly with big colorful wings landing in a green meadow, a small ant and a small bee stand beside her happily holding hands, a caterpillar-to-butterfly cycle shown faintly in the sky; cute storybook style.",["temee"],"illustration"),
]
dump("image_prompts.json", PROMPTS, ROOT)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("jiao","脚"),("yiyuan","医院"),("zenmele","怎么了"),("teng","疼"),("shou","手"),("yisheng","医生"),("qichuang","起床")]
images = []
for p in PROMPTS:
    images.append({"id":os.path.basename(p["file"]).rsplit(".",1)[0],"file":p["file"],"title":p["title"],"role":p.get("role","illustration"),"section":p["section"]})
images += [{"id":"story-book","file":"images/story.png","title":"好朋友 · Mini story","role":"illustration","section":"story"},
           {"id":"match","file":"images/match.png","title":"Let's match","role":"illustration","section":"workbook"},
           {"id":"imagine","file":"images/imagine.png","title":"Let's imagine","role":"illustration","section":"workbook"}]
images += [{"id":f"t{r}{c}","file":f"images/t{r}{c}.png","title":f"Test {r}{c.upper()}","role":"illustration","section":"workbook"} for r in range(1,5) for c in "abc"]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 10-р хичээл — Чи яасан бэ?","chineseTitle":"你怎么了？","targetTitle":"你怎么了？","mongolianTitle":"Чи яасан бэ?",
 "subtitle":"脚 · 医院 · 怎么了 · 疼 · 不……了 · «好朋友» үлгэр",
 "description":f"Өвдсөнөө хэлэх, «чи яасан бэ?» гэж асуух, «……гүй боллоо» гэж хэлэх. {len(vocab)} үг, 2 зурагт яриа, Mini story, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🩺","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第10课《你怎么了？》 [hskLevel=1] [lessonNumber=10]; эх: сурах бичиг х.48–52; аудио CD 10-01…10-04"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你怎么了？","mongolianTitle":"Чи яасан бэ?",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第10课 (сурах бичиг + CD аудио 10-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (1C 2A 3B 4A 5C 6B 7A 8D); Let's match хариу зургаас тааруулсан","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
