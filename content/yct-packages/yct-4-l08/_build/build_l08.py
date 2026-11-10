#!/usr/bin/env python3
"""YCT 标准教程 4 · 第8课 要下雨了。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
OUT = "/home/claude/work/yct4/l08/pkg"
CID, LID, N = "yct-4", "yct-4-l08", 8
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

from PIL import Image
_pg = Image.open("/home/claude/work/yct4/l08/pages/hi-49.png").convert("RGB")
_S = 150/100
_BOX = {"t1a":(135,195,240,290),"t1b":(262,196,412,294),"t1c":(450,192,552,296),"t1d":(603,192,725,296)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
_p47 = Image.open("/home/claude/work/yct4/l08/pages/hi-47.png").convert("RGB")
for _k,_b in {"cw1":(176,716,386,860),"cw2":(430,716,638,860),"cw3":(176,872,390,1034),"cw4":(430,872,640,1034)}.items():
    _p47.crop(tuple(int(v*_S) for v in _b)).save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct4/l08/pages/hi-48.png").convert("RGB").crop((int(65*_S),int(215*_S),int(740*_S),int(1000*_S))).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_CHANT, AUD_STORY, AUD_TEST = [f"audio/yct-4-08-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-4-08-text-song.mp3"
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"{OUT}/{AUD_TEXT}","-i",f"{OUT}/{AUD_CHANT}","-filter_complex","[0:a][1:a]concat=n=2:v=0:a=1[a]","-map","[a]","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)

# ---------------- VOCAB ----------------
VOCAB = [
 ("雨伞","yǔsǎn","шүхэр","нэр үг · гол үг","漂亮的雨伞","Piàoliang de yǔsǎn","Гоё шүхэр",True),
 ("拿","ná","барих, авах","үйл үг · гол үг","你拿雨伞了吗？","Nǐ ná yǔsǎn le ma?","Чи шүхрээ авсан уу?",True),
 ("蓝","lán","цэнхэр","тэмдэг нэр · гол үг","蓝色的花","Lánsè de huā","Цэнхэр цэцэг",True),
 ("坏","huài","муу, эвдэрсэн","тэмдэг нэр · гол үг","雨伞坏了。","Yǔsǎn huài le.","Шүхэр эвдэрчээ.",True),
 ("慢","màn","удаан","тэмдэг нэр · гол үг","慢一点儿好。","Màn yìdiǎnr hǎo.","Жаахан удаан нь дээр.",True),
 ("迟到","chídào","хоцрох","үйл үг · гол үг","要迟到了，快走！","Yào chídào le, kuài zǒu!","Хоцрох нь ээ, хурдан яв!",True),
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
 {"id":1,"title_mn":"Яриа 1 · Бороо орох нь!","scene_mn":"Гадаа бороо орохоор болж байна. Ээж хүүгээсээ шүхрээ авсан эсэхийг асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"妈妈","zh":"要下雨了，你拿雨伞了吗？","pinyin":"Yào xiàyǔ le, nǐ ná yǔsǎn le ma?","mn":"Бороо орох нь, чи шүхрээ авсан уу?"},
           {"speaker":"小明","zh":"拿了。","pinyin":"Ná le.","mn":"Авсан."},
           {"speaker":"妈妈","zh":"别拿蓝色的雨伞，那个坏了。","pinyin":"Bié ná lánsè de yǔsǎn, nàge huài le.","mn":"Цэнхэр шүхрийг бүү ав, тэр эвдэрсэн."}]},
 {"id":2,"title_mn":"Яриа 2 · Яст мэлхийн машин","scene_mn":"Туулай хурдан гүйж яваад машинтай яст мэлхийтэй уулзав. Яст мэлхий маш удаан жолоодож байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"兔子","zh":"你开得太慢了，比我走得还慢。","pinyin":"Nǐ kāi de tài màn le, bǐ wǒ zǒu de hái màn.","mn":"Чи дэндүү удаан жолооддог юм аа, миний алхахаас ч удаан байна."},
           {"speaker":"乌龟","zh":"慢一点儿好，慢一点儿好。","pinyin":"Màn yìdiǎnr hǎo, màn yìdiǎnr hǎo.","mn":"Жаахан удаан нь дээр, жаахан удаан нь дээр."},
           {"speaker":"兔子","zh":"要迟到了，快一点儿吧。","pinyin":"Yào chídào le, kuài yìdiǎnr ba.","mn":"Хоцрох нь ээ, жаахан хурдлаарай."},
           {"speaker":"乌龟","zh":"我不喜欢开快车。","pinyin":"Wǒ bù xǐhuan kāi kuài chē.","mn":"Би хурдан жолоодох дургүй."}]},
]
sentences=[]
dlg = [
 (1,"妈妈：要下雨了，你拿雨伞了吗？","Māma: Yào xiàyǔ le, nǐ ná yǔsǎn le ma?","Ээж: Бороо орох нь, чи шүхрээ авсан уу?","妈妈：| 要|yào 下雨|xiàyǔ 了|le ，| 你|nǐ 拿|ná 雨伞|yǔsǎn 了|le 吗|ma ？|","要……了 = «удахгүй …». 要下雨了 = удахгүй бороо орно.",["要下雨了。"]),
 (1,"小明：拿了。","Xiǎo Míng: Ná le.","Сяо Мин: Авсан.","小明：| 拿|ná 了|le 。|","拿了 = авсан. Хийж дууссан үйлдлийг «了» гэж төгсгөнө.",[]),
 (1,"妈妈：别拿蓝色的雨伞，那个坏了。","Māma: Bié ná lánsè de yǔsǎn, nàge huài le.","Ээж: Цэнхэр шүхрийг бүү ав, тэр эвдэрсэн.","妈妈：| 别|bié 拿|ná 蓝色|lánsè 的|de 雨伞|yǔsǎn ，| 那个|nàge 坏|huài 了|le 。|","别 + үйлдэл = «бүү хий». 别拿 = бүү ав.",[]),
 (2,"兔子：你开得太慢了，比我走得还慢。","Tùzi: Nǐ kāi de tài màn le, bǐ wǒ zǒu de hái màn.","Туулай: Чи дэндүү удаан жолооддог юм аа, миний алхахаас ч удаан байна.","兔子：| 你|nǐ 开|kāi 得|de 太|tài 慢|màn 了|le ，| 比|bǐ 我|wǒ 走|zǒu 得|de 还|hái 慢|màn 。|","开得慢 = жолоодох нь удаан. 「得」-ийн дараа хэрхэн хийснийг хэлнэ.",[]),
 (2,"乌龟：慢一点儿好，慢一点儿好。","Wūguī: Màn yìdiǎnr hǎo, màn yìdiǎnr hǎo.","Яст мэлхий: Жаахан удаан нь дээр, жаахан удаан нь дээр.","乌龟：| 慢|màn 一点儿|yìdiǎnr 好|hǎo ，| 慢|màn 一点儿|yìdiǎnr 好|hǎo 。|","",[]),
 (2,"兔子：要迟到了，快一点儿吧。","Tùzi: Yào chídào le, kuài yìdiǎnr ba.","Туулай: Хоцрох нь ээ, жаахан хурдлаарай.","兔子：| 要|yào 迟到|chídào 了|le ，| 快|kuài 一点儿|yìdiǎnr 吧|ba 。|","",["要迟到了。"]),
 (2,"乌龟：我不喜欢开快车。","Wūguī: Wǒ bù xǐhuan kāi kuài chē.","Яст мэлхий: Би хурдан жолоодох дургүй.","乌龟：| 我|wǒ 不|bù 喜欢|xǐhuan 开|kāi 快|kuài 车|chē 。|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
chant = [
 ("要下雨了，要下雨了，动物们早都知道了。","Yào xiàyǔ le, yào xiàyǔ le, dòngwùmen zǎo dōu zhīdào le.","Бороо орох нь, бороо орох нь, амьтад бүгд аль эрт мэдсэн байна.","要下雨|yào xiàyǔ 了|le ，| 要下雨|yào xiàyǔ 了|le ，| 动物们|dòngwùmen 早|zǎo 都|dōu 知道|zhīdào 了|le 。|"),
 ("燕子水面低低飞，蚂蚁搬家快快跑，","Yànzi shuǐmiàn dīdī fēi, mǎyǐ bānjiā kuàikuài pǎo,","Хараацай усны дээгүүр намхан нисч, шоргоолж нүүхээр хурдан гүйнэ,","燕子|yànzi 水面|shuǐmiàn 低低|dīdī 飞|fēi ，| 蚂蚁|mǎyǐ 搬家|bānjiā 快快|kuàikuài 跑|pǎo ，|"),
 ("鱼儿水面跳跳跳。","Yú ér shuǐmiàn tiào tiào tiào.","Загас усан дээр харайна, харайна, харайна.","鱼儿|yú'ér 水面|shuǐmiàn 跳|tiào 跳|tiào 跳|tiào 。|"),
 ("大雨大雨快下吧，我们都做好准备啦！","Dàyǔ dàyǔ kuài xià ba, wǒmen dōu zuò hǎo zhǔnbèi la!","Аадар бороо ээ, хурдан ор! Бид бүгд бэлэн боллоо!","大雨|dàyǔ 大雨|dàyǔ 快|kuài 下|xià 吧|ba ，| 我们|wǒmen 都|dōu 做好|zuò hǎo 准备|zhǔnbèi 啦|la ！|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Let's chant — «бороо орох нь!» гэхдээ гараа дээш өргөж бороо дуурайлга. Амьтад борооноос өмнө мэддэг байдаг: хараацай намхан нисдэг, шоргоолж нүүдэг, загас харайдаг."
    if i==1: s["note"]="燕子 = хараацай, 蚂蚁 = шоргоолж. «搬家» = нүүх. Гараараа далавч дэвсэж, хурдан гүйх дүр үзүүл!"
    if i==3: s["note"]="准备 = бэлдэх. 做好准备 = бэлэн болох."
    sentences.append(s)
story = [
 ("兔子：要迟到了，快走！","Tùzi: Yào chídào le, kuài zǒu!","Туулай: Хоцрох нь ээ, хурдан яв!","兔子：| 要|yào 迟到|chídào 了|le ，| 快|kuài 走|zǒu ！|"),
 ("乌龟：现在10点，还有半个小时。","Wūguī: Xiànzài shí diǎn, hái yǒu bàn ge xiǎoshí.","Яст мэлхий: Одоо 10 цаг, дахиад хагас цаг байна.","乌龟：| 现在|xiànzài 10|shí 点|diǎn ，| 还|hái 有|yǒu 半|bàn 个|ge 小时|xiǎoshí 。|"),
 ("兔子：你的表坏了吧？现在11点！","Tùzi: Nǐ de biǎo huài le ba? Xiànzài shíyī diǎn!","Туулай: Чиний гар цаг эвдэрсэн биз дээ? Одоо 11 цаг болчихлоо!","兔子：| 你|nǐ 的|de 表|biǎo 坏|huài 了|le 吧|ba ？| 现在|xiànzài 11|shíyī 点|diǎn ！|"),
 ("乌龟：啊？我的表慢了1个小时。","Wūguī: À? Wǒ de biǎo màn le yí ge xiǎoshí.","Яст мэлхий: Аан? Миний гар цаг нэг цагаар удааширчээ.","乌龟：| 啊|à ？| 我|wǒ 的|de 表|biǎo 慢|màn 了|le 1|yí 个|ge 小时|xiǎoshí 。|"),
 ("兔子：你走得慢，你的表也走得慢！","Tùzi: Nǐ zǒu de màn, nǐ de biǎo yě zǒu de màn!","Туулай: Чи удаан алхдаг, чиний гар цаг ч удаан явдаг юм!","兔子：| 你|nǐ 走|zǒu 得|de 慢|màn ，| 你|nǐ 的|de 表|biǎo 也|yě 走|zǒu 得|de 慢|màn ！|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «乌龟的表» (Яст мэлхийн гар цаг) — 4 зурагт үлгэр. Туулай, яст мэлхий хоёр кино үзэх гэж яарч байна."
    if i==1: s["note"]="半个小时 = хагас цаг. 现在10点 = одоо 10 цаг."
    if i==3: s["note"]="«表慢了» = гар цаг удааширсан (хоцорч байна). 表 = гар цаг."
    sentences.append(s)

texts = {
 "unit":{"number":"8","title":"要下雨了。","mongolianTitle":"Бороо орох нь! — удахгүй болох зүйл, хоцрох"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи YCT 1, 2, 3-ыг дуусгаж, 300 орчим үг мэддэг болсон. Баяр хүргэе! Одоо «要……了» гэж удахгүй болох зүйлээ хэлж сурна. Тэнгэр бүрхэгдвэл «要下雨了！» (бороо орох нь!) гэж хэлээд шүхрээ аваарай. Хоцрох гэж байвал «要迟到了！» гэж хашгирна. Мөн яарсан туулай, удаан яст мэлхий хоёрын «乌龟的表» үлгэрийг уншина. Шүхрээ аваад, эхэлцгээе!",
  "warmup_mn":"Чи бороотой өдрийг хайрладаг уу? Ямар өнгийн шүхэртэй вэ? Өнөөдөр хэзээ нэгэн цагт хоцорч байсан уу?",
  "theme_zh":"要下雨了 · 要迟到了 · 雨伞 · 慢","theme_mn":"Бороо орох нь · хоцрох нь · шүхэр · удаан"},
 "warmup":{"mongolian":"Чи бороотой өдрийг хайрладаг уу? Ямар өнгийн шүхэртэй вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"8","title":"要下雨了。","mongolianTitle":"Бороо орох нь! — яриа, chant, үлгэр","title_mn":"Let's read · 2 яриа + Let's chant + Mini story · 乌龟的表","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 4 · 第8课 Let's read / Let's chant / Mini story（CD 08-02, 08-03, 08-04）","author_zh":"",
  "intro_zh":"两段小对话：要下雨了，你拿雨伞了吗？要迟到了，快一点儿吧。然后唱歌谣，读小故事《乌龟的表》。",
  "intro_mn":"Эхлээд хоёр яриа: ээж «要下雨了，你拿雨伞了吗？» гэж асууна, туулай «要迟到了，快一点儿吧» гэж яст мэлхийг яаруулна. Дараа нь chant-аа бороо дуурайлган хэлж, эцэст нь «乌龟的表» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Бороо орох гэж байна. Ээж хүүгээсээ шүхрээ авсан эсэхийг асууна. Хүү авсан. Ээж цэнхэр шүхэр эвдэрсэн тул бүү ав гэнэ."},
   {"paragraph":2,"mn":"Яриа 2 — Туулай яст мэлхийд «дэндүү удаан жолооддог юм» гэнэ. Яст мэлхий «удаан нь дээр, би хурдан жолоодох дургүй» гэж хариулна."},
   {"paragraph":3,"mn":"Chant — Хараацай намхан нисч, шоргоолж нүүж, загас харайвал бороо орох нь. Амьтад бүгд мэдэж, бэлтгэсэн. Аудио: 08-03."},
   {"paragraph":4,"mn":"Үлгэр «乌龟的表» — Туулай хоцорлоо гэж яарна. Яст мэлхий «одоо 10 цаг» гэнэ. Харин түүний гар цаг нэг цагаар удаан байжээ! Аудио: 08-04."}],
  "reflection":{"questions_mn":["Бороо орохоос өмнө чи юу хийдэг вэ? «我拿雨伞了。» гэж хэлж үз.","Яст мэлхийн гар цаг яагаад буруу байсан бэ?","Чи хэзээ нэгэн цагт хоцорч байсан уу? «要迟到了！» гэж хэлж үз."]},
  "writingSample":{"title_mn":"Ярих дасгал · Бороо орох нь","zh":"要下雨了，你拿雨伞了吗？","pinyin":"Yào xiàyǔ le, nǐ ná yǔsǎn le ma?","mn":"Бороо орох нь, чи шүхрээ авсан уу?"},
  "writingPrompt_mn":"Гэрийнхэндээ «要下雨了，你拿雨伞了吗？» гэж асуу. Тэд «拿了。» гэж хариулна. Дараа нь «要迟到了，快一点儿！» гэж яаруулж үз."},
 "properNouns":[{"zh":"乌龟的表","pinyin":"Wūguī de biǎo","mn":"Яст мэлхийн гар цаг (үлгэрийн нэр)"},{"zh":"乌龟","pinyin":"wūguī","mn":"яст мэлхий"},{"zh":"兔子","pinyin":"tùzi","mn":"туулай"}],
 "wordExplanation":[
  {"word":"要……了","gloss":"yào … le — удахгүй, … нь ээ","explanation":"Ямар нэг зүйл удахгүй болох үедээ «要……了» гэж хэлнэ. Тэнгэр бүрхэгдвэл «要下雨了！» (бороо орох нь). Хичээлд хоцрох гэж байвал «要迟到了！» (хоцрох нь ээ).",
   "structure":"要 + юу болох + 了","teacher_notes":"Хүүхдүүдэд «要下雨了！» гэхдээ гараа дээш өргөж бороо дуурайлга, «要迟到了！» гэхдээ цагаа харах дүр үзүүл.",
   "examples":[{"chinese":"要下雨了。","pinyin":"Yào xiàyǔ le.","mongolian":"Бороо орох нь."},{"chinese":"要迟到了，快走！","pinyin":"Yào chídào le, kuài zǒu!","mongolian":"Хоцрох нь ээ, хурдан яв!"},{"chinese":"要下雨了，你拿雨伞了吗？","pinyin":"Yào xiàyǔ le, nǐ ná yǔsǎn le ma?","mongolian":"Бороо орох нь, чи шүхрээ авсан уу?"}],
   "common_mistakes":[{"wrong":"下雨要了。","right":"要下雨了。","why":"«要» нь эхэнд, «了» нь төгсгөлд орно: 要……了."}],
   "check":{"question":"«Бороо орох нь» хятадаар:","options":["要下雨了。","你拿雨伞了吗？","我不喜欢开快车。"],"answer":"0"},
   "practice":[{"n":1,"question":"________ 迟到了！(хоцрох нь)","answer":"要","explanation_mn":"«Удахгүй …» — 要……了."}]},
  {"word":"别 · 拿了 · 坏了","gloss":"bié · ná le · huài le — бүү …, авсан, эвдэрсэн","explanation":"«别» гэдэг нь «бүү хий» гэсэн үг. Ээж «别拿蓝色的雨伞！» гэхэд цэнхэр шүхрийг бүү ав гэсэн хэрэг. Хийх үйлдлийн ард «了» орвол «хийсэн» болно: 拿了 = авсан. 坏了 = эвдэрчээ.",
   "structure":"别 + үйлдэл · үйлдэл + 了","teacher_notes":"Тоглоом: нэг нь «别……！» гэж хэлнэ, нөгөө нь хөдөлгөөнөө зогсооно. Жишээ нь «别拿！» гэхэд юмаа тавина.",
   "examples":[{"chinese":"别拿蓝色的雨伞，那个坏了。","pinyin":"Bié ná lánsè de yǔsǎn, nàge huài le.","mongolian":"Цэнхэр шүхрийг бүү ав, тэр эвдэрсэн."},{"chinese":"拿了。","pinyin":"Ná le.","mongolian":"Авсан."},{"chinese":"你的表坏了吧？","pinyin":"Nǐ de biǎo huài le ba?","mongolian":"Чиний гар цаг эвдэрсэн биз дээ?"}],
   "common_mistakes":[{"wrong":"拿别雨伞。","right":"别拿雨伞。","why":"«别» нь хийх үйлдлийн өмнө орно."}],
   "check":{"question":"«Бүү ав» хятадаар:","options":["别拿。","拿了。","慢一点儿。"],"answer":"0"},
   "practice":[{"n":1,"question":"雨伞 ________ 了。(эвдэрсэн)","answer":"坏","explanation_mn":"«Эвдэрсэн» — 坏了."}]},
  {"word":"慢 · 快 · 开得慢","gloss":"màn · kuài · kāi de màn — удаан, хурдан, удаан жолоодох","explanation":"慢 = удаан, 快 = хурдан. «慢一点儿» = жаахан удаан, «快一点儿» = жаахан хурдан. Хэрхэн хийснийг хэлэхдээ хийх үйлдлийн ард «得» тавина: 开得慢 = удаан жолооддог, 走得慢 = удаан алхдаг.",
   "structure":"хийх үйлдэл + 得 + 慢/快 · 慢/快 + 一点儿","teacher_notes":"Хүүхдүүд яст мэлхий шиг удаан, туулай шиг хурдан алхаж үзээд «我走得慢！» «我走得快！» гэж хэлнэ.",
   "examples":[{"chinese":"你开得太慢了。","pinyin":"Nǐ kāi de tài màn le.","mongolian":"Чи дэндүү удаан жолооддог юм аа."},{"chinese":"慢一点儿好。","pinyin":"Màn yìdiǎnr hǎo.","mongolian":"Жаахан удаан нь дээр."},{"chinese":"你走得慢，你的表也走得慢！","pinyin":"Nǐ zǒu de màn, nǐ de biǎo yě zǒu de màn!","mongolian":"Чи удаан алхдаг, чиний гар цаг ч удаан явдаг юм!"}],
   "common_mistakes":[{"wrong":"你开太慢了。","right":"你开得太慢了。","why":"Хэрхэн жолоодохыг хэлэхдээ «开» ба «慢»-ын дунд «得» орно."}],
   "check":{"question":"«Жаахан хурдлаарай» хятадаар:","options":["快一点儿吧。","慢一点儿好。","要下雨了。"],"answer":"0"},
   "practice":[{"n":1,"question":"你走 ________ 慢。(…дог)","answer":"得","explanation_mn":"Хийх үйлдлийн ард «得» орно: 走得慢."}]},
 ],
 "collocations":[{"type":"Бороо, хоцрох, хурд","rows":[
   {"head":"拿","with":"雨伞","mn":"шүхэр авах","usage_mn":"Бороо орох үед","example":{"zh":"你拿雨伞了吗？","pinyin":"Nǐ ná yǔsǎn le ma?","mn":"Чи шүхрээ авсан уу?"}},
   {"head":"开得","with":"慢","mn":"удаан жолоодох","usage_mn":"Яст мэлхий шиг","example":{"zh":"你开得太慢了。","pinyin":"Nǐ kāi de tài màn le.","mn":"Чи дэндүү удаан жолооддог."}},
   {"head":"要","with":"迟到了","mn":"хоцрох нь","usage_mn":"Яарах үед","example":{"zh":"要迟到了，快走！","pinyin":"Yào chídào le, kuài zǒu!","mn":"Хоцрох нь ээ, хурдан яв!"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["雨伞","拿","蓝","坏","慢","迟到"],"items":[
     {"n":1,"question":"要下雨了，你拿 ________ 了吗？","answer":"雨伞","explanation_mn":"«Шүхэр» — 雨伞."},
     {"n":2,"question":"你 ________ 雨伞了吗？","answer":"拿","explanation_mn":"«Авах» — 拿."},
     {"n":3,"question":"别拿 ________ 色的雨伞。","answer":"蓝","explanation_mn":"«Цэнхэр» — 蓝."},
     {"n":4,"question":"那个雨伞 ________ 了。","answer":"坏","explanation_mn":"«Эвдэрсэн» — 坏了."},
     {"n":5,"question":"你开得太 ________ 了。","answer":"慢","explanation_mn":"«Удаан» — 慢."},
     {"n":6,"question":"要 ________ 了，快走！","answer":"迟到","explanation_mn":"«Хоцрох» — 迟到."}]}],
   "answer_source":"agent-authored (YCT 4 · 8-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"妈妈说什么？","answer":"要下雨了，别拿蓝色的雨伞，那个坏了。","explanation_mn":"Яриа 1 — ээж «Бороо орох нь, цэнхэр шүхрийг бүү ав, тэр эвдэрсэн» гэсэн."},
     {"n":2,"question_zh":"乌龟开车开得怎么样？","answer":"开得很慢。","explanation_mn":"Яриа 2 — туулай «你开得太慢了» гэсэн, яст мэлхий «慢一点儿好» гэсэн."}],
   "answer_source":"textbook_verified (Let's read х.39 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Penny Bank (Гахайн банк)","start_zh":"雨伞！","instruction_mn":"Гэрийнхэндээ 6 жижиг гахайн зураг зур, тус бүрд нь 雨伞, 迟到, 蓝, 拿, 坏, 慢 гэж бич. Нэг нь хятад үгийг чангаар хэлнэ, нөгөө нь сонссон үгтэй гахайг будна. Хамгийн олон гахай будсан нь хожно!"},
     {"label":"Бороо орох нь!","start_zh":"要下雨了！","instruction_mn":"Нэг нь «要下雨了！» гэж хашгирна. Бусад нь хурдан «我拿雨伞了！» гэж хэлээд шүхэр барьсан дүр үзүүлнэ. Хамгийн түрүүнд хийсэн нь хожно."},
     {"label":"Туулай ба яст мэлхий","start_zh":"快一点儿吧！","instruction_mn":"Нэг нь туулай «快一点儿吧！» гэнэ, нөгөө нь яст мэлхий болж «慢一点儿好！» гэж удаан алхана. Дараа нь дүрээ солих."},
     {"label":"Chant хөдөлгөөнтэй","start_zh":"要下雨了，要下雨了！","instruction_mn":"Chant-аа чангаар хэл. «鱼儿跳跳跳» гэхдээ үсэр, «快快跑» гэхдээ байрандаа гүй, «低低飞» гэхдээ гараа далавч шиг дэвс."},
     {"label":"乌龟的表 жүжиг","start_zh":"要迟到了，快走！","instruction_mn":"Үлгэрийг найзтайгаа жүжигчил. Нэг нь туулай, нөгөө нь яст мэлхий. Эцэст нь туулай «你走得慢，你的表也走得慢！» гэж инээнэ."}]}},
 "grammarNotes":[],
 "culture":{"title":"油纸伞","title_mn":"Хятадын уламжлалт цаасан шүхэр","text_mn":"Эрт цагт Хятадад хүмүүс тосолсон цаасаар хийсэн «油纸伞» гэдэг шүхэр барьдаг байлаа. Шүхрийг хулсан хүрээнд цаас нааж, тосолж борооноос хамгаалдаг. Одоо ч гэсэн гоёмсог будсан цаасан шүхэр аялагчдын дуртай бэлэг. Бороотой өдөр шүхэр хүн бүрт хэрэг болдог.","note_mn":"Чи ямар өнгийн, ямар зурагтай шүхэр авмаар байна вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — удахгүй болох зүйлийг хэлэх, хоцрох үед яаруулах.","topic":"Бороо орох нь, хоцрох нь","discussion":["Хосоороо: нэг нь «要下雨了！» гэнэ, нөгөө нь «拿雨伞了吗？» гэж асууна.","«要迟到了，快一点儿！» гэж яарсан дүр үзүүлээд, «慢一点儿好» гэж удаан хариул."],
   "writing":{"promptChinese":"要下雨了，我拿雨伞了。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «要下雨了，你拿雨伞了吗？» гэж хятадаар хэл.","minChars":"0","requiredWords":["雨伞","要"],"sampleChinese":"要下雨了，你拿雨伞了吗？","sampleMongolian":"Бороо орох нь, чи шүхрээ авсан уу?","gradingRubric":"要……了, 雨伞-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 4 · Test Answers: L8 1.C 2.D 3.A 4.B 5.B 6.C 7.A 8.B","parts":[]},
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
 {"point":"要下雨了。 · 要迟到了。","gloss_mn":"«Бороо орох нь» · «Хоцрох нь ээ» — удахгүй болох зүйл",
  "structure":"要 + юу болох + 了",
  "teacher_mn":"Ямар нэг зүйл удахгүй болох үедээ «要……了» гэж хэл. Тэнгэр харлавал «要下雨了！» гэнэ. Хоцрох гэж байвал «要迟到了！» гэнэ. «要» эхэнд, «了» төгсгөлд орно. Гараа дээш өргөж бороо дуурайгаад хэлээд үз.",
  "teacher_notes":"Номын яриа: 要下雨了，你拿雨伞了吗？ 要迟到了，快一点儿吧。 Mini story: 要迟到了，快走！",
  "examples":[ex("要下雨了。","Yào xiàyǔ le.","Бороо орох нь."),ex("要迟到了。","Yào chídào le.","Хоцрох нь ээ."),ex("要迟到了，快一点儿吧。","Yào chídào le, kuài yìdiǎnr ba.","Хоцрох нь ээ, жаахан хурдлаарай."),ex("要下雨了，你拿雨伞了吗？","Yào xiàyǔ le, nǐ ná yǔsǎn le ma?","Бороо орох нь, чи шүхрээ авсан уу?")],
  "common_mistakes":[{"wrong":"下雨要了。","right":"要下雨了。","why":"«要» эхэнд, «了» төгсгөлд орно."}],
  "check":chk("Тэнгэр харлаж байна. Чи юу хэлэх вэ?",["要下雨了。","我不喜欢。","拿了。"],"要下雨了。","g1c"),
  "exercises":[
   choice("________ 下雨了。",["要","也","得"],"要","Зөв! 要下雨了 = бороо орох нь.","要……了 = удахгүй.","g1e1"),
   choice("«Хоцрох нь ээ!» хятадаар:",["要迟到了！","要下雨了！","拿雨伞了！"],"要迟到了！","Зөв! 迟到 = хоцрох.","迟到 = хоцрох, 下雨 = бороо орох.","g1e2"),
   judge("«要下雨了» гэдэг нь «бороо орох нь» гэсэн үг.",True,"Зөв!","要下雨了 = бороо орох нь.")]},
 {"point":"别拿蓝色的雨伞。 · 拿了。","gloss_mn":"«Цэнхэр шүхрийг бүү ав» · «Авсан»",
  "structure":"别 + үйлдэл · үйлдэл + 了",
  "teacher_mn":"«别» гэдэг бол «бүү хий» гэсэн үг. Ээж «别拿蓝色的雨伞！» гэхэд цэнхэр шүхрийг бүү ав гэсэн хэрэг. Хийж дууссан зүйлээ «拿了» гэж хэлнэ. «了» нь «хийчихлээ» гэсэн утгатай.",
  "teacher_notes":"Номын яриа 1: 拿了。别拿蓝色的雨伞，那个坏了。",
  "examples":[ex("拿了。","Ná le.","Авсан."),ex("别拿蓝色的雨伞，那个坏了。","Bié ná lánsè de yǔsǎn, nàge huài le.","Цэнхэр шүхрийг бүү ав, тэр эвдэрсэн."),ex("你的表坏了吧？","Nǐ de biǎo huài le ba?","Чиний гар цаг эвдэрсэн биз дээ?")],
  "common_mistakes":[{"wrong":"拿别雨伞。","right":"别拿雨伞。","why":"«别» нь хийх үйлдлийн өмнө орно."}],
  "check":chk("«Бүү ав» хятадаар:",["别拿。","拿了。","要拿。"],"别拿。","g2c"),
  "exercises":[
   choice("________ 拿蓝色的雨伞，那个坏了。",["别","要","太"],"别","Зөв! 别 = бүү.","别 + үйлдэл = бүү хий.","g2e1"),
   choice("«Эвдэрсэн» хятадаар:",["坏了","慢了","蓝了"],"坏了","Зөв! 坏 = эвдэрсэн.","坏 = муу, эвдэрсэн.","g2e2"),
   judge("«拿了» гэдэг нь «авсан» гэсэн үг.",True,"Зөв!","拿 = авах, 了 = хийсэн.")]},
 {"point":"你开得太慢了。 · 慢一点儿","gloss_mn":"«Чи дэндүү удаан жолооддог» — хэрхэн хийснийг хэлэх",
  "structure":"хийх үйлдэл + 得 + 慢/快 · 慢/快 + 一点儿",
  "teacher_mn":"Хэрхэн хийснийг хэлэхдээ хийх үйлдлийн ард «得» тавина. 开得慢 = удаан жолооддог. 走得慢 = удаан алхдаг. «一点儿» нь «жаахан»: 快一点儿 = жаахан хурдан. Яст мэлхий шиг удаан алхаж үзээд «我走得慢» гэж хэл.",
  "teacher_notes":"Номын яриа 2: 你开得太慢了，比我走得还慢。慢一点儿好。要迟到了，快一点儿吧。",
  "examples":[ex("你开得太慢了。","Nǐ kāi de tài màn le.","Чи дэндүү удаан жолооддог юм аа."),ex("慢一点儿好。","Màn yìdiǎnr hǎo.","Жаахан удаан нь дээр."),ex("快一点儿吧。","Kuài yìdiǎnr ba.","Жаахан хурдлаарай."),ex("你走得慢，你的表也走得慢！","Nǐ zǒu de màn, nǐ de biǎo yě zǒu de màn!","Чи удаан алхдаг, чиний гар цаг ч удаан явдаг юм!")],
  "common_mistakes":[{"wrong":"你开太慢了。","right":"你开得太慢了。","why":"Хэрхэн жолоодохыг хэлэхдээ «开» ба «慢»-ын дунд «得» орно."}],
  "check":chk("«Жаахан удаан нь дээр» хятадаар:",["慢一点儿好。","快一点儿吧。","要迟到了。"],"慢一点儿好。","g3c"),
  "exercises":[
   choice("你走 ________ 慢。",["得","了","别"],"得","Зөв! 走得慢 = удаан алхдаг.","Хийх үйлдлийн ард «得» орно.","g3e1"),
   choice("Хоцрох гэж байна. Хэлэх нь:",["快一点儿吧。","慢一点儿好。","别拿雨伞。"],"快一点儿吧。","Зөв! 快 = хурдан.","Яарах үед 快一点儿 гэнэ.","g3e2"),
   judge("«慢» гэдэг нь «удаан» гэсэн үг.",True,"Зөв!","慢 = удаан, 快 = хурдан.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Шүхэр» хятадаар аль нь вэ?",["雨伞","老师","朋友","学校"],"雨伞","雨伞 (yǔsǎn) = шүхэр.","easy",["vocabulary"],"a1")
q("choice","«Барих, авах» хятадаар аль нь вэ?",["拿","慢","坏","蓝"],"拿","拿 (ná) = барих, авах.","easy",["vocabulary"],"a2")
q("choice","«Цэнхэр» хятадаар аль нь вэ?",["蓝","坏","慢","拿"],"蓝","蓝 (lán) = цэнхэр.","easy",["vocabulary"],"a3")
q("choice","«Муу, эвдэрсэн» хятадаар аль нь вэ?",["坏","蓝","慢","雨伞"],"坏","坏 (huài) = муу, эвдэрсэн.","easy",["vocabulary"],"a4")
q("choice","«慢» гэдэг үг ямар утгатай вэ?",["удаан","хурдан","цэнхэр","шүхэр"],"удаан","慢 (màn) = удаан.","easy",["vocabulary"],"a5")
q("choice","«迟到» гэдэг үг ямар утгатай вэ?",["хоцрох","авах","эвдрэх","удаан"],"хоцрох","迟到 (chídào) = хоцрох.","easy",["vocabulary"],"a6")
q("choice","Пиньинь «yǔsǎn» гэж уншдаг үг:",["雨伞","迟到","蓝","慢"],"雨伞","雨伞 = yǔsǎn = шүхэр.","easy",["pronunciation"],"a7")
q("choice","Пиньинь «chídào» гэж уншдаг үг:",["迟到","雨伞","坏","拿"],"迟到","迟到 = chídào = хоцрох.","medium",["pronunciation"],"a8")
q("choice","Пиньинь «huài» гэж уншдаг үг:",["坏","蓝","慢","拿"],"坏","坏 = huài = эвдэрсэн.","medium",["pronunciation"],"a9")
q("choice","Пиньинь «màn» гэж уншдаг үг:",["慢","蓝","拿","坏"],"慢","慢 = màn = удаан.","medium",["pronunciation"],"a10")
q("choice","«要下雨了。» гэж юу гэсэн үг вэ?",["Бороо орох нь.","Би шүхрээ авсан.","Би хоцорлоо.","Шүхэр эвдэрсэн."],"Бороо орох нь.","要……了 = удахгүй. 下雨 = бороо орох.","easy",["dialogue"],"a11")
q("choice","«要迟到了。» гэж юу гэсэн үг вэ?",["Хоцрох нь ээ.","Бороо орох нь.","Удаан жолоодоорой.","Шүхэр авсан."],"Хоцрох нь ээ.","迟到 = хоцрох.","easy",["dialogue"],"a12")
q("choice","Яриа 1-д ээж хүүдээ ямар шүхрийг бүү ав гэсэн бэ?",["Цэнхэр шүхэр","Улаан шүхэр","Шар шүхэр","Хар шүхэр"],"Цэнхэр шүхэр","别拿蓝色的雨伞，那个坏了。","medium",["dialogue"],"a13")
q("choice","Ээж цэнхэр шүхрийг яагаад бүү ав гэсэн бэ?",["Тэр эвдэрсэн","Тэр том","Тэр хуучин биш","Хүү дуртай"],"Тэр эвдэрсэн","那个坏了 = тэр эвдэрсэн.","medium",["dialogue"],"a14")
q("choice","Яриа 2-т яст мэлхий хэрхэн жолооддог вэ?",["Удаан","Хурдан","Тэр жолоодохгүй","Шөнө л"],"Удаан","你开得太慢了。","easy",["dialogue"],"a15")
q("choice","Яст мэлхий яагаад хурдан жолоодохгүй вэ?",["Хурдан жолоодох дургүй","Машин эвдэрсэн","Бороо орж байна","Хоцорсон"],"Хурдан жолоодох дургүй","我不喜欢开快车。","medium",["dialogue"],"a16")
q("cloze","（ ）下雨了，你拿雨伞了吗？",["要","也","得","吗"],"要","要下雨了 = бороо орох нь.","easy",["structure"],"a17")
q("cloze","（ ）拿蓝色的雨伞，那个坏了。",["别","要","太","也"],"别","别 = бүү.","medium",["structure"],"a18")
q("cloze","你开（ ）太慢了。",["得","了","别","要"],"得","开得 = жолоодох нь … .","medium",["structure"],"a19")
q("cloze","要迟到了，（ ）一点儿吧。",["快","慢","蓝","坏"],"快","快一点儿 = жаахан хурдан.","medium",["structure"],"a20")
q("cloze","雨伞（ ）了，不能用。",["坏","蓝","拿","慢"],"坏","坏了 = эвдэрсэн.","medium",["structure"],"a21")
q("choice","Mini story-д туулай «现在11点！» гэхэд яст мэлхийн гар цаг яасан бэ?",["Нэг цагаар удааширсан","Нэг цагаар хурдассан","Эвдэрч зогссон","Алга болсон"],"Нэг цагаар удааширсан","我的表慢了1个小时。","hard",["dialogue"],"a22")
q("choice","«Жаахан хурдлаарай» хятадаар аль нь вэ?",["快一点儿吧。","慢一点儿好。","别拿雨伞。","要下雨了。"],"快一点儿吧。","快 = хурдан.","medium",["usage"],"a23")
q("usage","Тэнгэр харлаж байна. Чи юу хэлэх вэ?",["要下雨了！","要迟到了！","我不喜欢。","拿了。"],"要下雨了！","Бороо орох гэж байна.","medium",["usage"],"a24")
q("usage","Ээж «你拿雨伞了吗？» гэж асуулаа. Чи шүхрээ авсан бол:",["拿了。","别拿。","坏了。","慢一点儿。"],"拿了。","拿了 = авсан.","medium",["usage"],"a25")
q("usage","Чи хичээлд хоцрох гэж байна. Яаруулахдаа:",["要迟到了，快走！","慢一点儿好。","要下雨了。","别拿雨伞。"],"要迟到了，快走！","迟到 = хоцрох, 快走 = хурдан яв.","medium",["usage"],"a26")
q("usage","Найз чинь маш хурдан явж байна. Удаан яваасай гэвэл:",["慢一点儿好。","快一点儿吧。","要迟到了。","拿了。"],"慢一点儿好。","慢一点儿 = жаахан удаан.","hard",["usage"],"a27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANK1 = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (08-05) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）请把这四个椅子拿进去。坏的也拿吗？","script_zh":"男：请把这四个椅子拿进去。 女：坏的也拿吗？","options":BANK,"optionImages":BANK1,"answer":"C","explanation_mn":"«Эдгээр дөрвөн сандлыг дотогш оруулаарай. Эвдэрсэнийг нь ч авах уу?» — C зураг дээр дөрвөн сандал байна, нэг нь эвдэрсэн. A харандаа, B гоймон, D шүхэр."},
    {"n":2,"question_zh":"（听录音）红色和黑色的雨伞，你喜欢哪一个？这两个颜色我都不喜欢，我喜欢蓝色的。","script_zh":"男：红色和黑色的雨伞，你喜欢哪一个？ 女：这两个颜色我都不喜欢，我喜欢蓝色的。","options":BANK,"optionImages":BANK1,"answer":"D","explanation_mn":"«Улаан, хар шүхрээс аль нь дуртай вэ? — Хоёр өнгө хоёулаа дургүй, би цэнхэр нь дуртай» — D зураг дээр улаан, хар хоёр шүхэр байна."},
    {"n":3,"question_zh":"（听录音）我的铅笔坏了，你还有铅笔吗？有，在书包里，你自己拿吧。","script_zh":"男：我的铅笔坏了，你还有铅笔吗？ 女：有，在书包里，你自己拿吧。","options":BANK,"optionImages":BANK1,"answer":"A","explanation_mn":"«Миний харандаа эвдэрсэн, танд харандаа байна уу? — Байна, цүнхэн дотор, өөрөө ав» — A зураг дээр харандаа байна."},
    {"n":4,"question_zh":"（听录音）你做的面条真好吃。慢点儿吃，还有很多。","script_zh":"男：你做的面条真好吃。 女：慢点儿吃，还有很多。","options":BANK,"optionImages":BANK1,"answer":"B","explanation_mn":"«Чиний хийсэн гоймон үнэхээр амттай. — Удаан идээрэй, дахиад их бий» — B зураг дээр гоймон байна."}],
   "answer_source":"YCT 4 Test Answers L8: 1.C 2.D 3.A 4.B"},
  {"part":2,"type":"choice","instruction_mn":"Унших — хаалтанд тохирох үгийг A, B, C-ээс сонго.","items":[
    {"n":5,"question_zh":"A：我的雨伞（ ）了。 B：我这儿还有一把，你拿去吧。  A 好　B 坏　C 多","question_mn":"— Миний шүхэр ( ). — Надад дахиад нэг шүхэр байгаа, аваад яв.","options":["A","B","C"],"answer":"B","explanation_mn":"Нөгөө хүн «надад дахиад нэг байна» гэсэн нь шүхэр эвдэрсэн гэсэн үг: 坏了. 好 (сайн), 多 (олон) таарахгүй."},
    {"n":6,"question_zh":"A：我能用你的手机吗？ B：可以。你自己去（ ）吧。  A 玩　B 开　C 拿","question_mn":"— Би чиний утсыг ашиглаж болох уу? — Болно. Өөрөө аваад ир.","options":["A","B","C"],"answer":"C","explanation_mn":"«Өөрөө аваад ир» — 自己去拿吧. 拿 = авах. 玩 (тоглох), 开 (нээх) таарахгүй."},
    {"n":7,"question_zh":"A：你的车开得太（ ）了，快一点儿吧。 B：还有时间，不会迟到的。  A 慢　B 快　C 后","question_mn":"— Чиний машин дэндүү ( ) явна, жаахан хурдлаарай. — Цаг хугацаа бий, хоцрохгүй.","options":["A","B","C"],"answer":"A","explanation_mn":"«Жаахан хурдлаарай» гэсэн тул машин удаан байна: 太慢了. 快 (хурдан) эсрэг утгатай."},
    {"n":8,"question_zh":"A：快起床，7点半了，要（ ）了。 B：爷爷，今天是星期六。  A 感冒　B 迟到　C 上网","question_mn":"— Хурдан бос, 7 цаг хагас болчихлоо, ( ) нь ээ. — Өвөө ээ, өнөөдөр бямба гараг шүү дээ.","options":["A","B","C"],"answer":"B","explanation_mn":"7 цаг хагас болсон, босоорой гэдэг нь хоцрох гэж байна: 要迟到了. 感冒 (ханиад), 上网 (интернет ашиглах) таарахгүй."}],
   "answer_source":"YCT 4 Test Answers L8: 5.B 6.C 7.A 8.B"},
  {"part":3,"type":"choice","instruction_mn":"Let's choose and write — зураг бүрд тохирох хэллэгийг сонго. A 下雪、穿衣服　B 迟到、拿书包　C 开车、关车门　D 跑步、穿运动鞋","items":[
    {"n":1,"question_zh":"要（ ）了，你（ ）了吗？ — 1-р зураг","image":img("cw1"),"options":["A","B","C","D"],"answer":"B","explanation_mn":"1-р зураг дээр аав, хүү хаалганы өмнө — сургуульд хоцрох нь, цүнхээ авсан уу: 要迟到了，你拿书包了吗？"},
    {"n":2,"question_zh":"要（ ）了，你（ ）了吗？ — 2-р зураг","image":img("cw2"),"options":["A","B","C","D"],"answer":"A","explanation_mn":"2-р зураг дээр охин утсаар ярьж байна, гадаа цас орж байна: 要下雪了，你穿衣服了吗？"},
    {"n":3,"question_zh":"要（ ）了，你（ ）了吗？ — 3-р зураг","image":img("cw3"),"options":["A","B","C","D"],"answer":"D","explanation_mn":"3-р зураг дээр гурван хүүхэд спортын хувцастай: 要跑步了，你穿运动鞋了吗？"},
    {"n":4,"question_zh":"要（ ）了，你（ ）了吗？ — 4-р зураг","image":img("cw4"),"options":["A","B","C","D"],"answer":"C","explanation_mn":"4-р зураг дээр эмэгтэй машины жолоо барьж байна: 要开车了，你关车门了吗？"}],
   "answer_source":"Let's choose and write х.40 (хариу номд байхгүй, зурагтай тааруулсан)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «乌龟的表» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"要迟到了，快走！","answer":"1","explanation_mn":"1-р зураг дээр туулай кино театрын өмнө яарч байна."},
    {"n":2,"question_zh":"现在10点，还有半个小时。","answer":"2","explanation_mn":"2-р зураг дээр яст мэлхий гар цагаа харж байна."},
    {"n":3,"question_zh":"你的表坏了吧？现在11点！","answer":"3","explanation_mn":"3-р зураг дээр туулай ханын цагийг зааж байна."},
    {"n":4,"question_zh":"你走得慢，你的表也走得慢！","answer":"4","explanation_mn":"4-р зураг дээр яст мэлхий гар цагаа харж, туулай хаалганаас шагайн «чи удаан алхдаг тул цаг чинь ч удаан» гэж хэлж байна."}],
   "answer_source":"textbook х.41 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «迟到» гэсэн үгийг дахин бичиж хуул.","question_zh":"迟到","answer":"迟到","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найздаа «要下雨了，你拿雨伞了吗？» гэж асуу.","question_zh":"要下雨了，你拿雨伞了吗？","answer":"拿了。","explanation_mn":"Хосоороо ээлжлэн. Найз «拿了。» гэж хариулна."},
   {"n":2,"prompt_mn":"Penny Bank — хятад үг хэлж, сонссон үгтэй гахайг буд.","question_zh":"雨伞 迟到 蓝 拿 坏 慢","answer":"(нээлттэй)","explanation_mn":"Хамгийн олон гахай будсан нь хожно."},
   {"n":3,"prompt_mn":"Chant-ыг хөдөлгөөнтэй хэл.","question_zh":"要下雨了，要下雨了，动物们早都知道了。","answer":"(нээлттэй)","explanation_mn":"Аудио 08-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 4 · Test Listening Scripts, Test Answers (Lesson 8)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("yusan","雨伞"),("na","拿"),("lan","蓝"),("huai","坏"),("man","慢"),("chidao","迟到")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"要下雨了。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"要下雨了，你拿雨伞了吗？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"你开得太慢了，比我走得还慢。","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"要下雨了，要下雨了","role":"illustration","section":"song"},
 {"id":"story-art","file":"images/story.jpg","title":"乌龟的表","role":"illustration","section":"story"},
 {"id":"story","file":"images/story.png","title":"乌龟的表 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d"]] \
  + [{"id":f"cw{k}","file":f"images/cw{k}.png","title":f"Choose and write {k}","role":"illustration","section":"workbook"} for k in "1234"]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 4 · 8-р хичээл — Бороо орох нь!","chineseTitle":"要下雨了。","targetTitle":"要下雨了。","mongolianTitle":"Бороо орох нь!",
 "subtitle":"要下雨了 · 雨伞 · 迟到 · 慢 · «乌龟的表» үлгэр",
 "description":f"Удахгүй болох зүйлийг хэлж, хоцрох үед яаруулж сурна. {len(vocab)} үг, 2 зурагт яриа, chant, Mini story «乌龟的表», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"☔","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 4",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 4 — 第8课《要下雨了。》 [hskLevel=2] [lessonNumber=8]; эх: сурах бичиг х.38–42; аудио CD 08-01…08-05 (бүгд байгаа)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"要下雨了。","mongolianTitle":"Бороо орох нь!",
 "series":"YCT 标准教程 4","seriesLabel_mn":"YCT 4 — Хүүхдийн хятад хэл (≈HSK2–3)",
 "source":"YCT 标准教程 4 · 第8课 (сурах бичиг + CD аудио 08-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_CHANT,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L8)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
