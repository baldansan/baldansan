#!/usr/bin/env python3
"""YCT 标准教程 2 · 第7课 今天比昨天热。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
OUT = "/home/claude/work/yct2/l07/pkg"
CID, LID, N = "yct-2", "yct-2-l07", 7
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

# Тестийн зураг (х.37 = hi-39.png), хувь хэмжээгээр
from PIL import Image
_pg = Image.open("/home/claude/work/yct2/l07/pages/hi-39.png").convert("RGB"); _W,_H = _pg.size
def _crop(n,x0,y0,x1,y1): _pg.crop((int(x0*_W),int(y0*_H),int(x1*_W),int(y1*_H))).save(f"{OUT}/images/{n}.png")
for k,(a,b) in zip("abcd",[(.20,.33),(.38,.53),(.58,.72),(.80,.92)]): _crop("t1"+k,a,.16,b,.285)
for k,(a,b) in zip("abcd",[(.17,.33),(.37,.55),(.60,.72),(.76,.88)]): _crop("t5"+k,a,.535,b,.62)
_st = Image.open("/home/claude/work/yct2/l07/pages/hi-38.png").convert("RGB"); _sw,_sh = _st.size
_st.crop((int(.19*_sw),int(.47*_sh),_sw,int(.89*_sh))).save(f"{OUT}/images/story.png")

# audio
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-2-07-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-2-07-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-2-07-02.mp3'\nfile '{A}/yct-2-07-03.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("冷","lěng","хүйтэн, даарах","тэмдэг үг · гол үг","纽约比北京冷。","Niǔyuē bǐ Běijīng lěng.","Нью-Йорк Бээжингээс хүйтэн.",True),
 ("热","rè","халуун","тэмдэг үг · гол үг","今天比昨天热。","Jīntiān bǐ zuótiān rè.","Өнөөдөр өчигдрөөс халуун.",True),
 ("北京","Běijīng","Бээжин (Хятадын нийслэл)","газрын нэр · гол үг","北京天气怎么样？","Běijīng tiānqì zěnmeyàng?","Бээжингийн цаг агаар ямар байна?",True),
 ("纽约","Niǔyuē","Нью-Йорк (Америкийн хот)","газрын нэр · нэмэлт үг","纽约呢？","Niǔyuē ne?","Нью-Йорк чинь?",False),
 ("冰水","bīng shuǐ","мөстэй ус","нэр үг · нэмэлт үг","我喜欢喝冰水。","Wǒ xǐhuan hē bīng shuǐ.","Би мөстэй ус уух дуртай.",False),
 ("天气","tiānqì","цаг агаар","нэр үг · гол үг","天气很好。","Tiānqì hěn hǎo.","Цаг агаар сайхан байна.",True),
 ("怎么样","zěnmeyàng","ямар вэ? яаж байна вэ?","асуух үг · гол үг","今天天气怎么样？","Jīntiān tiānqì zěnmeyàng?","Өнөөдөр цаг агаар ямар байна?",True),
 ("比","bǐ","-аас илүү (харьцуулах үг)","харьцуулах үг · гол үг","哥哥比我聪明。","Gēge bǐ wǒ cōngming.","Ах надаас ухаалаг.",True),
 ("昨天","zuótiān","өчигдөр","цагийн үг · гол үг","昨天很热。","Zuótiān hěn rè.","Өчигдөр халуун байсан.",True),
 ("觉得","juéde","санагдах, гэж бодох","үйл үг · гол үг","我觉得冰水比热水好喝。","Wǒ juéde bīng shuǐ bǐ rè shuǐ hǎohē.","Миний бодоход мөстэй ус халуун уснаас амттай.",True),
 ("好喝","hǎohē","амттай (уух юм)","тэмдэг үг · гол үг","这茶很好喝！","Zhè chá hěn hǎohē!","Энэ цай амттай юм!",True),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 2","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    out=[]
    for t in s.split(" "):
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py.replace("_"," ")})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Утсаар цаг агаараа асууж байна","scene_mn":"Нью-Йоркт байгаа хүү Бээжинд байгаа найзаасаа утсаар цаг агаарыг нь асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"大卫","zh":"北京天气怎么样？","pinyin":"Běijīng tiānqì zěnmeyàng?","mn":"Бээжингийн цаг агаар ямар байна?"},
           {"speaker":"小明","zh":"很好，不冷也不热。纽约呢？","pinyin":"Hěn hǎo, bù lěng yě bú rè. Niǔyuē ne?","mn":"Сайхан байна. Хүйтэн ч биш, халуун ч биш. Нью-Йорк чинь?"},
           {"speaker":"大卫","zh":"纽约今天比昨天热。","pinyin":"Niǔyuē jīntiān bǐ zuótiān rè.","mn":"Нью-Йорк өнөөдөр өчигдрөөс халуун байна."}]},
 {"id":2,"title_mn":"Яриа 2 · Гэртээ ус ууж байна","scene_mn":"Хүү гэртээ мөстэй ус аягалж байна. Аав ээж нь буйдан дээр халуун ус ууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"我喜欢喝冰水，爸爸妈妈喜欢喝热水。我觉得冰水比热水好喝，爸爸妈妈觉得热水比冰水好喝。他们不热吗？","pinyin":"Wǒ xǐhuan hē bīng shuǐ, bàba māma xǐhuan hē rè shuǐ. Wǒ juéde bīng shuǐ bǐ rè shuǐ hǎohē, bàba māma juéde rè shuǐ bǐ bīng shuǐ hǎohē. Tāmen bú rè ma?","mn":"Би мөстэй ус уух дуртай, аав ээж нь халуун ус уух дуртай. Миний бодоход мөстэй ус амттай, аав ээж нь халуун ус амттай гэж боддог. Тэдэнд халуун биш юм уу?"}]},
]
sentences=[]
dlg = [
 (1,"大卫：北京天气怎么样？","Dàwèi: Běijīng tiānqì zěnmeyàng?","Дэвид: Бээжингийн цаг агаар ямар байна?","大卫：| 北京|Běijīng 天气|tiānqì 怎么样|zěnmeyàng ？|","天气怎么样？ — цаг агаар ямар байна гэж асууна. Хариуд «很好» эсвэл «冷» «热» гэж хэлнэ.",["北京天气怎么样？"]),
 (1,"小明：很好，不冷也不热。纽约呢？","Xiǎo Míng: Hěn hǎo, bù lěng yě bú rè. Niǔyuē ne?","Сяо Мин: Сайхан байна. Хүйтэн ч биш, халуун ч биш. Нью-Йорк чинь?","小明：| 很|hěn 好|hǎo ，| 不|bù 冷|lěng 也|yě 不|bú 热|rè 。| 纽约|Niǔyuē 呢|ne ？|","不冷也不热 — хүйтэн ч биш, халуун ч биш. 呢 — «чинь?» гэж эргүүлж асууна.",[]),
 (1,"大卫：纽约今天比昨天热。","Dàwèi: Niǔyuē jīntiān bǐ zuótiān rè.","Дэвид: Нью-Йорк өнөөдөр өчигдрөөс халуун байна.","大卫：| 纽约|Niǔyuē 今天|jīntiān 比|bǐ 昨天|zuótiān 热|rè 。|","比 — хоёр юмыг харьцуулна: «өнөөдөр 比 өчигдөр халуун» = өнөөдөр илүү халуун.",["今天比昨天热。"]),
 (2,"小明：我喜欢喝冰水，爸爸妈妈喜欢喝热水。","Xiǎo Míng: Wǒ xǐhuan hē bīng shuǐ, bàba māma xǐhuan hē rè shuǐ.","Сяо Мин: Би мөстэй ус уух дуртай, аав ээж нь халуун ус уух дуртай.","小明：| 我|wǒ 喜欢|xǐhuan 喝|hē 冰水|bīng_shuǐ ，| 爸爸|bàba 妈妈|māma 喜欢|xǐhuan 喝|hē 热水|rè_shuǐ 。|","",[]),
 (2,"我觉得冰水比热水好喝，爸爸妈妈觉得热水比冰水好喝。","Wǒ juéde bīng shuǐ bǐ rè shuǐ hǎohē, bàba māma juéde rè shuǐ bǐ bīng shuǐ hǎohē.","Миний бодоход мөстэй ус халуун уснаас амттай. Аав ээж нь халуун ус илүү амттай гэж боддог.","我|wǒ 觉得|juéde 冰水|bīng_shuǐ 比|bǐ 热水|rè_shuǐ 好喝|hǎohē ，| 爸爸|bàba 妈妈|māma 觉得|juéde 热水|rè_shuǐ 比|bǐ 冰水|bīng_shuǐ 好喝|hǎohē 。|","觉得 — «миний бодоход». A 比 B 好喝 = A нь B-ээс илүү амттай.",["A 比 B 好喝"]),
 (2,"他们不热吗？","Tāmen bú rè ma?","Тэдэнд халуун биш юм уу?","他们|tāmen 不|bú 热|rè 吗|ma ？|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
song = [
 ("纽约天气怎么样？天气怎么样？","Niǔyuē tiānqì zěnmeyàng? Tiānqì zěnmeyàng?","Нью-Йоркийн цаг агаар ямар вэ? Цаг агаар ямар вэ?","纽约|Niǔyuē 天气|tiānqì 怎么样|zěnmeyàng ？| 天气|tiānqì 怎么样|zěnmeyàng ？|"),
 ("纽约比北京冷，冷，冷，冷，冷，冷。","Niǔyuē bǐ Běijīng lěng, lěng, lěng, lěng, lěng, lěng.","Нью-Йорк Бээжингээс хүйтэн, хүйтэн, хүйтэн, хүйтэн, хүйтэн, хүйтэн.","纽约|Niǔyuē 比|bǐ 北京|Běijīng 冷|lěng ，| 冷|lěng ，| 冷|lěng ，| 冷|lěng ，| 冷|lěng ，| 冷|lěng 。|"),
 ("悉尼天气怎么样？天气怎么样？","Xīní tiānqì zěnmeyàng? Tiānqì zěnmeyàng?","Сидней хотын цаг агаар ямар вэ? Цаг агаар ямар вэ?","悉尼|Xīní 天气|tiānqì 怎么样|zěnmeyàng ？| 天气|tiānqì 怎么样|zěnmeyàng ？|"),
 ("悉尼比北京热，热，热，热，热，热。","Xīní bǐ Běijīng rè, rè, rè, rè, rè, rè.","Сидней Бээжингээс халуун, халуун, халуун, халуун, халуун, халуун.","悉尼|Xīní 比|bǐ 北京|Běijīng 热|rè ，| 热|rè ，| 热|rè ，| 热|rè ，| 热|rè ，| 热|rè 。|"),
]
for i,(zh,py,mn,tk) in enumerate(song):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Дуу «天气怎么样？» — «冷» дээр өөрийгөө тэврээд чичрээрэй, «热» дээр гараараа сэнгэнээрэй. 悉尼 = Сидней (Австралийн хот)."
    sentences.append(s)
story = [
 ("哥哥比我聪明。","Gēge bǐ wǒ cōngming.","Ах надаас ухаалаг.","哥哥|gēge 比|bǐ 我|wǒ 聪明|cōngming 。|"),
 ("姐姐比我漂亮。","Jiějie bǐ wǒ piàoliang.","Эгч надаас гоё.","姐姐|jiějie 比|bǐ 我|wǒ 漂亮|piàoliang 。|"),
 ("我不聪明，也不漂亮。","Wǒ bù cōngming, yě bú piàoliang.","Би ухаалаг ч биш, гоё ч биш.","我|wǒ 不|bù 聪明|cōngming ，| 也|yě 不|bú 漂亮|piàoliang 。|"),
 ("你很可爱，我们爱你！","Nǐ hěn kě'ài, wǒmen ài nǐ!","Чи хөөрхөн, бид чамд хайртай!","你|nǐ 很|hěn 可爱|kě'ài ，| 我们|wǒmen 爱|ài 你|nǐ ！|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «比一比» — 4 зурагт үлгэр. 聪明 = ухаалаг, 漂亮 = гоё, 可爱 = хөөрхөн. Аудио: 07-04."
    sentences.append(s)

texts = {
 "unit":{"number":"7","title":"今天比昨天热。","mongolianTitle":"Өнөөдөр өчигдрөөс халуун — цаг агаар, харьцуулах"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх номд чи гэр бүл, тоо, өнгө, ном, тоглоомоо хятадаар хэлж сурсан шүү. Одоо өнөөдрийн цаг агаарыг ярья! Гадаа халуун уу, хүйтэн үү? Энэ хичээлээр «今天天气怎么样？» гэж асууж, «今天比昨天热» гэж хэлж сурна. «比» гэдэг нь «-аас илүү» гэсэн жижигхэн үг, хоёр юмыг харьцуулахад хэрэгтэй. Мөн «天气怎么样？» дууг дуулж, «比一比» үлгэрийг жүжиглэнэ. Хүйтэн дээр чичрээд, халуун дээр сэнгэнээрэй! Эхэлцгээе!",
  "warmup_mn":"Өнөөдөр гадаа халуун уу, хүйтэн үү? Чи мөстэй ус дуртай юу, халуун цай дуртай юу?",
  "theme_zh":"天气 · 冷 / 热 · 比","theme_mn":"Цаг агаар · Хүйтэн / халуун · Харьцуулах"},
 "warmup":{"mongolian":"Өнөөдөр гадаа халуун уу, хүйтэн үү? Өчигдөр ямар байсан бэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"7","title":"今天比昨天热。","mongolianTitle":"Өнөөдөр өчигдрөөс халуун — яриа, дуу, үлгэр","title_mn":"Let's read · 2 яриа + Let's sing · 天气怎么样？ + Mini story · 比一比","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第7课 Let's read / Let's sing / Mini story（CD 07-02, 07-03, 07-04）","author_zh":"",
  "intro_zh":"先听两段对话：北京天气怎么样？你喜欢喝冰水还是热水？然后唱《天气怎么样？》，再读小故事《比一比》。",
  "intro_mn":"Эхлээд хоёр яриа: Нью-Йорк, Бээжингийн цаг агаарыг асууна. Дараа нь мөстэй ус, халуун усны тухай яриа. Үүний дараа «天气怎么样？» дууг чичрэх, сэнгэнэх хөдөлгөөнтэй дуулна. Хамгийн сүүлд «比一比» үлгэрийг жүжиглэнэ. Эхлээд аудиог сонс!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Нью-Йоркт байгаа хүү Бээжингийн цаг агаарыг асууна. Бээжинд хүйтэн ч биш халуун ч биш, харин Нью-Йорк өчигдрөөс халуун."},
   {"paragraph":2,"mn":"Яриа 2 — Хүү мөстэй ус уух дуртай, харин аав ээж нь халуун ус илүү амттай гэж боддог. «比» үгээр хэн нь юуг илүү гэж боддогоо хэлнэ."},
   {"paragraph":3,"mn":"Дуу «Цаг агаар ямар вэ?» — Нью-Йорк Бээжингээс хүйтэн, Сидней Бээжингээс халуун. «冷», «热» гэж зургаа давтана. Аудио: 07-03."},
   {"paragraph":4,"mn":"Үлгэр «Харьцуулъя» — ах охиноос ухаалаг, эгч нь гоё. Охин гунигтай байтал ах эгч нь «Чи хөөрхөн, бид чамд хайртай!» гэнэ. Аудио: 07-04."}],
  "reflection":{"questions_mn":["Өнөөдөр гадаа ямар байна? 冷 эсвэл 热 гэж хэл.","Чи мөстэй ус дуртай юу, халуун цай дуртай юу?","Чамд гунигтай байхад хэн «Чи хөөрхөн» гэж хэлдэг вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Цаг агаараа хэл","zh":"今天比昨天热。","pinyin":"Jīntiān bǐ zuótiān rè.","mn":"Өнөөдөр өчигдрөөс халуун."},
  "writingPrompt_mn":"Өнөөдрийн цаг агаарыг өчигдрийнхтэй харьцуулж хэл: 今天比昨天……。 «冷» эсвэл «热» гэж нөх!"},
 "properNouns":[{"zh":"北京","pinyin":"Běijīng","mn":"Бээжин"},{"zh":"纽约","pinyin":"Niǔyuē","mn":"Нью-Йорк"},{"zh":"悉尼","pinyin":"Xīní","mn":"Сидней"}],
 "wordExplanation":[
  {"word":"比","gloss":"bǐ — -аас илүү","explanation":"Хоёр юмыг харьцуулахдаа «比» гэж хэлнэ. «今天比昨天热» гэвэл «өнөөдөр өчигдрөөс халуун» гэсэн үг. Эхлээд нэг юмаа хэлээд, дараа нь 比, дараа нь нөгөө юмаа, хамгийн сүүлд «халуун», «хүйтэн» гэх мэтээ хэлнэ.",
   "structure":"A 比 B + халуун / хүйтэн / ухаалаг…","teacher_notes":"Хүүхдийг хоёр ширхэг юм барьж харьцуулуулж хэлүүл: «Миний цүнх чинийхээс том». «很» үгийг 比-тэй хамт хэлэхгүй.",
   "examples":[{"chinese":"今天比昨天热。","pinyin":"Jīntiān bǐ zuótiān rè.","mongolian":"Өнөөдөр өчигдрөөс халуун."},{"chinese":"纽约比北京冷。","pinyin":"Niǔyuē bǐ Běijīng lěng.","mongolian":"Нью-Йорк Бээжингээс хүйтэн."},{"chinese":"哥哥比我聪明。","pinyin":"Gēge bǐ wǒ cōngming.","mongolian":"Ах надаас ухаалаг."}],
   "common_mistakes":[{"wrong":"今天比昨天很热。","right":"今天比昨天热。","why":"«比»-тэй өгүүлбэрт «很» оруулдаггүй."}],
   "check":{"question":"«Өнөөдөр өчигдрөөс халуун» хятадаар:","options":["今天比昨天热。","今天不冷也不热。","昨天比今天热。"],"answer":"0"},
   "practice":[{"n":1,"question":"姐姐 ____ 我漂亮。(-аас илүү)","answer":"比","explanation_mn":"«-аас илүү» гэж харьцуулахад 比."}]},
  {"word":"天气怎么样","gloss":"tiānqì zěnmeyàng — цаг агаар ямар вэ","explanation":"Цаг агаар ямар байгааг асуухдаа «天气怎么样？» гэнэ. 天气 = цаг агаар, 怎么样 = ямар вэ. Хариуд «冷», «热», «很好» гэж хэлнэ. Хүйтэн ч биш халуун ч биш бол «不冷也不热».",
   "structure":"…天气怎么样？ → 很好 / 冷 / 热 / 不冷也不热。","teacher_notes":"Нэг хүүхэд цонхоор харж асуугаад, нөгөө нь хариулах тоглоом.",
   "examples":[{"chinese":"北京天气怎么样？","pinyin":"Běijīng tiānqì zěnmeyàng?","mongolian":"Бээжингийн цаг агаар ямар байна?"},{"chinese":"很好，不冷也不热。","pinyin":"Hěn hǎo, bù lěng yě bú rè.","mongolian":"Сайхан. Хүйтэн ч биш, халуун ч биш."},{"chinese":"今天天气怎么样？","pinyin":"Jīntiān tiānqì zěnmeyàng?","mongolian":"Өнөөдөр цаг агаар ямар байна?"}],
   "common_mistakes":[{"wrong":"天气怎么样很？","right":"天气怎么样？","why":"Асуултад «很» хэрэггүй."}],
   "check":{"question":"«Цаг агаар ямар байна?» хятадаар:","options":["天气怎么样？","你叫什么？","我喜欢喝冰水。"],"answer":"0"},
   "practice":[{"n":1,"question":"今天 ________ 怎么样？","answer":"天气","explanation_mn":"天气 = цаг агаар."}]},
 ],
 "collocations":[{"type":"比 + хоёр юм — харьцуулах","rows":[
   {"head":"冰水","with":"比热水好喝","mn":"мөстэй ус халуун уснаас амттай","usage_mn":"A 比 B + тэмдэг үг","example":{"zh":"冰水比热水好喝。","pinyin":"Bīng shuǐ bǐ rè shuǐ hǎohē.","mn":"Мөстэй ус халуун уснаас амттай."}},
   {"head":"今天","with":"比昨天热","mn":"өнөөдөр өчигдрөөс халуун","usage_mn":"Өдрүүдийг харьцуулах","example":{"zh":"今天比昨天热。","pinyin":"Jīntiān bǐ zuótiān rè.","mn":"Өнөөдөр өчигдрөөс халуун."}},
   {"head":"我","with":"觉得很好喝","mn":"миний бодоход амттай","usage_mn":"觉得 — өөрийн бодол","example":{"zh":"我觉得很好喝。","pinyin":"Wǒ juéde hěn hǎohē.","mn":"Миний бодоход их амттай."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["比","冷","热","天气"],"items":[
     {"n":1,"question":"今天 ________ 昨天热。","answer":"比","explanation_mn":"«-аас илүү» — 比."},
     {"n":2,"question":"冬天很 ________，我要穿大衣。","answer":"冷","explanation_mn":"Өвөл хүйтэн."},
     {"n":3,"question":"夏天很 ________，我喝冰水。","answer":"热","explanation_mn":"Зун халуун тул мөстэй ус уудаг."},
     {"n":4,"question":"今天 ________ 怎么样？","answer":"天气","explanation_mn":"Цаг агаар — 天气."}]}],
   "answer_source":"agent-authored (YCT 2 · 7-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"纽约今天天气怎么样？","answer":"比昨天热。","explanation_mn":"Яриа 1 — Нью-Йорк өчигдрөөс халуун байна."},
     {"n":2,"question_zh":"爸爸觉得热水和冰水哪个好喝？","answer":"热水。","explanation_mn":"Яриа 2 — аав ээж халуун ус илүү амттай гэж боддог."}],
   "answer_source":"textbook_verified (Let's read, х.34 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — найзтайгаа, гэрийнхэнтэйгээ тоглоорой.","prompts":[
     {"label":"Цаг агаар асуух","start_zh":"今天天气怎么样？","instruction_mn":"Хоёулаа цонхоор хараад ээлжлэн асуу: «今天天气怎么样？» Нөгөө нь «今天冷» эсвэл «今天热» гэж хариулна. Хүйтэн бол чичир, халуун бол сэнгэн!"},
     {"label":"Миний дуртай ундаа","start_zh":"我喜欢喝……","instruction_mn":"Гэр бүлийнхээ дуртай ундааг асуугаад хэл: «我觉得冰水比热水好喝». Аав ээж чинь юу гэж бодож байна? «比»-ээ хэрэглээрэй."},
     {"label":"Температур тэмдэглэе","start_zh":"今天比昨天……","instruction_mn":"3 өдөр дараалан гадаа хэд хэм байгааг (хамгийн өндөр, нам) дэвтэртээ тэмдэглэ. Дараа нь «今天比昨天热» эсвэл «冷» гэж харьцуулж хэл."},
     {"label":"Үлгэр жүжиглэе","start_zh":"比一比","instruction_mn":"«比一比» үлгэрийг уншаад жүжиглэе. Нэг нь ах, нэг нь эгч, нэг нь жижиг охин болно. Сүүлд «你很可爱，我们爱你！» гээд тэврээрэй!"}]}},
 "grammarNotes":[],
 "culture":{"title":"北京 · 冬天和夏天","title_mn":"Бээжинд өвөл хүйтэн, зун халуун","text_mn":"Бээжин хот Монголын адил дөрвөн улиралтай. Зун 35 хэм хүртэл халуу оргиж, өвөл хасах 10 хэм хүртэл хүйтэрнэ. Хятадад олон хүн, ялангуяа аав ээж, өвөө эмээ нар халуун өдөр ч «热水» буюу халуун ус ууж дуртай байдаг. Номын хүү «Тэдэнд халуун биш юм уу?» гэж гайхаж байгаа нь тэр.","note_mn":"Чиний өвөө эмээ халуун цай уудаг уу? Монголын сүүтэй цай шиг Хятадад халуун ус, цай уудаг юм."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — цаг агаар, 比 гэж харьцуулах.","topic":"Цаг агаараа хятадаар ярь","discussion":["Хосоороо: «今天天气怎么样？» гэж асууж хариул.","«我觉得……比……好喝» гэж гэр бүлийнхээ дуртай ундааг ярь."],
   "writing":{"promptChinese":"今天比昨天……。","promptMongolian":"Гэрийн даалгавар: 3 өдрийн температураа тэмдэглээд «今天比昨天热/冷» гэж ээж аавдаа хэлж өг.","minChars":"0","requiredWords":["比","冷","热"],"sampleChinese":"今天比昨天热。","sampleMongolian":"Өнөөдөр өчигдрөөс халуун.","gradingRubric":"比-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers: L7 1.B 2.A 3.D 4.C 5.B 6.A 7.C 8.D","parts":[]},
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
 {"point":"北京天气怎么样？ — цаг агаар ямар вэ","gloss_mn":"«Бээжингийн цаг агаар ямар байна?» — цаг агаар асуух",
  "structure":"…天气怎么样？ → 很好 / 冷 / 热。",
  "teacher_mn":"Цаг агаар ямар байгааг мэдэхийг хүсвэл «天气怎么样？» гэж асууна. Хот нэрийг өмнө нь хэлж болно: «北京天气怎么样？» Хариуд «很好», «冷», «热» гэж хэлнэ. Хүйтэн ч биш халуун ч биш бол «不冷也不热». Цонхоор хараад хэлээд үз!",
  "teacher_notes":"Ном: 北京天气怎么样？ 很好，不冷也不热。纽约呢？ 呢 нь «…чинь?» гэж эргүүлж асууна.",
  "examples":[ex("北京天气怎么样？","Běijīng tiānqì zěnmeyàng?","Бээжингийн цаг агаар ямар байна?"),ex("很好，不冷也不热。","Hěn hǎo, bù lěng yě bú rè.","Сайхан. Хүйтэн ч биш, халуун ч биш."),ex("纽约呢？","Niǔyuē ne?","Нью-Йорк чинь?"),ex("纽约天气怎么样？","Niǔyuē tiānqì zěnmeyàng?","Нью-Йоркийн цаг агаар ямар вэ?")],
  "common_mistakes":[{"wrong":"天气北京怎么样？","right":"北京天气怎么样？","why":"Эхлээд хотоо, дараа нь 天气 гэж хэлнэ."}],
  "check":chk("«Бээжингийн цаг агаар ямар байна?» гэж асуу:",["北京天气怎么样？","北京比纽约冷。","纽约呢？"],"北京天气怎么样？","g1c"),
  "exercises":[
   choice("北京 ________ 怎么样？",["天气","昨天","冰水"],"天气","Зөв! 天气 = цаг агаар.","天气 = цаг агаар, 昨天 = өчигдөр, 冰水 = мөстэй ус.","g1e1"),
   choice("«Хүйтэн ч биш, халуун ч биш» хятадаар:",["不冷也不热","很冷","比昨天热"],"不冷也不热","Зөв!","不冷也不热 = хүйтэн ч биш, халуун ч биш.","g1e2"),
   judge("«纽约呢？» гэдэг нь «Нью-Йорк чинь?» гэсэн үг.",True,"Зөв! 呢 — эргүүлж асууна.","呢 нь «…чинь?» гэж асуудаг.")]},
 {"point":"今天比昨天热。 — 比 харьцуулах","gloss_mn":"«Өнөөдөр өчигдрөөс халуун» — A 比 B …",
  "structure":"A 比 B + халуун / хүйтэн / ухаалаг…",
  "teacher_mn":"Хоёр юмыг харьцуулахдаа «比» гэж хэлнэ. «今天比昨天热» — өнөөдөр өчигдрөөс халуун. Эхлээд нэг юмаа, дараа нь 比, дараа нь нөгөө юмаа, хамгийн сүүлд «热», «冷» гэж хэл. Хоёр гараа өргөөд харьцуулж үз!",
  "teacher_notes":"比-тэй өгүүлбэрт «很» оруулдаггүй. Дуу: 纽约比北京冷。 Үлгэр: 哥哥比我聪明。",
  "examples":[ex("今天比昨天热。","Jīntiān bǐ zuótiān rè.","Өнөөдөр өчигдрөөс халуун."),ex("纽约比北京冷。","Niǔyuē bǐ Běijīng lěng.","Нью-Йорк Бээжингээс хүйтэн."),ex("悉尼比北京热。","Xīní bǐ Běijīng rè.","Сидней Бээжингээс халуун."),ex("冰水比热水好喝。","Bīng shuǐ bǐ rè shuǐ hǎohē.","Мөстэй ус халуун уснаас амттай.")],
  "common_mistakes":[{"wrong":"今天比昨天很热。","right":"今天比昨天热。","why":"比 байвал 很 хэрэггүй."},{"wrong":"今天昨天比热。","right":"今天比昨天热。","why":"Дараалал: нэг юм → 比 → нөгөө юм → тэмдэг үг."}],
  "check":chk("«Өнөөдөр өчигдрөөс хүйтэн» хятадаар:",["今天比昨天冷。","昨天比今天冷。","今天不冷也不热。"],"今天比昨天冷。","g2c"),
  "exercises":[
   choice("纽约 ________ 北京冷。",["比","和","吗"],"比","Зөв! 比 = -аас илүү.","比 нь харьцуулдаг.","g2e1"),
   choice("悉尼比北京 ________。",["热","冷","好"],"热","Зөв! Дуунд «悉尼比北京热».","Дуунд Сидней Бээжингээс халуун гэж дуулсан.","g2e2"),
   judge("«哥哥比我聪明» гэдэг нь «Ах надаас ухаалаг» гэсэн үг.",True,"Зөв! 聪明 = ухаалаг.","哥哥比我聪明 — ах илүү ухаалаг.")]},
 {"point":"我觉得……好喝 — миний бодоход","gloss_mn":"«Миний бодоход» — 觉得",
  "structure":"我觉得 + A 比 B 好喝。",
  "teacher_mn":"Өөрийн бодлоо хэлэхдээ «我觉得……» гэж эхэлнэ. «我觉得冰水好喝» — миний бодоход мөстэй ус амттай. Хоёр уухыг харьцуулбал «冰水比热水好喝». Чи юу дуртайгаа хэлээд үз!",
  "teacher_notes":"觉得 = санагдах, бодох. 好喝 нь уух зүйлд хэрэглэнэ (идэх зүйлд 好吃).",
  "examples":[ex("我觉得冰水比热水好喝。","Wǒ juéde bīng shuǐ bǐ rè shuǐ hǎohē.","Миний бодоход мөстэй ус халуун уснаас амттай."),ex("爸爸妈妈觉得热水比冰水好喝。","Bàba māma juéde rè shuǐ bǐ bīng shuǐ hǎohē.","Аав ээж халуун ус илүү амттай гэж боддог."),ex("这茶很好喝！","Zhè chá hěn hǎohē!","Энэ цай амттай юм!")],
  "common_mistakes":[{"wrong":"这个饭很好喝。","right":"这个饭很好吃。","why":"Уух зүйлд 好喝, идэх зүйлд 好吃."}],
  "check":chk("«Миний бодоход мөстэй ус амттай» хятадаар:",["我觉得冰水很好喝。","我喜欢北京。","今天比昨天热。"],"我觉得冰水很好喝。","g3c"),
  "exercises":[
   choice("我 ________ 冰水好喝。",["觉得","比","怎么样"],"觉得","Зөв! 觉得 = миний бодоход.","觉得 = бодох.","g3e1"),
   choice("Цай уухад «амттай» гэж хэлэх үг:",["好喝","天气","昨天"],"好喝","Зөв! 好喝 = уух амттай.","好喝 — ундаа.","g3e2"),
   judge("«好喝» нь «амттай (уух юм)» гэсэн үг.",True,"Зөв!","好喝 = амттай (уух юм).")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Хүйтэн» хятадаар аль нь вэ?",["冷","热","好","大"],"冷","冷 (lěng) = хүйтэн.","easy",["vocabulary"],"b1")
q("choice","«Халуун» хятадаар аль нь вэ?",["热","冷","好喝","比"],"热","热 (rè) = халуун.","easy",["vocabulary"],"b2")
q("choice","«Цаг агаар» хятадаар аль нь вэ?",["天气","昨天","北京","冰水"],"天气","天气 (tiānqì) = цаг агаар.","easy",["vocabulary"],"b3")
q("choice","«Өчигдөр» хятадаар аль нь вэ?",["昨天","今天","明天","天气"],"昨天","昨天 (zuótiān) = өчигдөр.","easy",["vocabulary"],"b4")
q("choice","«Бээжин» хятадаар аль нь вэ?",["北京","纽约","天气","冰水"],"北京","北京 (Běijīng) = Бээжин.","easy",["vocabulary"],"b5")
q("choice","«Нью-Йорк» хятадаар аль нь вэ?",["纽约","北京","昨天","冷"],"纽约","纽约 (Niǔyuē) = Нью-Йорк.","medium",["vocabulary"],"b6")
q("choice","«冰水» гэдэг үг ямар утгатай вэ?",["мөстэй ус","халуун цай","сүү","будаа"],"мөстэй ус","冰水 (bīng shuǐ) = мөстэй ус.","easy",["vocabulary"],"b7")
q("choice","«比» гэдэг үг ямар утгатай вэ?",["-аас илүү (харьцуулах)","өчигдөр","цаг агаар","хүйтэн"],"-аас илүү (харьцуулах)","比 (bǐ) — хоёр юмыг харьцуулна.","easy",["vocabulary"],"b8")
q("choice","«觉得» гэдэг үг ямар утгатай вэ?",["санагдах, бодох","уух","харах","дуртай"],"санагдах, бодох","觉得 (juéde) = бодох.","medium",["vocabulary"],"b9")
q("choice","«好喝» гэдэг үг ямар утгатай вэ?",["амттай (уух юм)","халуун","хүйтэн","өчигдөр"],"амттай (уух юм)","好喝 (hǎohē) = амттай (уух).","easy",["vocabulary"],"b10")
q("choice","«怎么样» гэдэг нь:",["ямар вэ? яаж байна вэ?","хэн бэ?","хэдэн вэ?","хаана вэ?"],"ямар вэ? яаж байна вэ?","怎么样 (zěnmeyàng) = ямар вэ?","medium",["vocabulary"],"b11")
q("choice","«Бээжингийн цаг агаар ямар байна?» хятадаар:",["北京天气怎么样？","北京比纽约冷。","今天比昨天热。","我觉得很好喝。"],"北京天气怎么样？","天气怎么样 = цаг агаар ямар вэ.","easy",["dialogue"],"b12")
q("choice","«Хүйтэн ч биш, халуун ч биш» хятадаар:",["不冷也不热","很冷","很热","比昨天热"],"不冷也不热","不冷也不热 — хүйтэн ч биш, халуун ч биш.","medium",["dialogue"],"b13")
q("choice","«Өнөөдөр өчигдрөөс халуун» хятадаар:",["今天比昨天热。","昨天比今天热。","今天比昨天冷。","今天不热。"],"今天比昨天热。","A 比 B 热 = A нь B-ээс халуун.","easy",["dialogue"],"b14")
q("cloze","今天（ ）昨天热。",["比","和","吗","也"],"比","Харьцуулахдаа 比.","easy",["usage"],"b15")
q("cloze","北京（ ）怎么样？",["天气","昨天","冰水","觉得"],"天气","天气怎么样 — цаг агаар ямар вэ.","easy",["usage"],"b16")
q("cloze","纽约比北京（ ）。",["冷","比","天气","好"],"冷","Дуунд: 纽约比北京冷.","medium",["usage"],"b17")
q("cloze","我（ ）冰水好喝。",["觉得","比","北京","怎么样"],"觉得","觉得 — миний бодоход.","medium",["usage"],"b18")
q("cloze","这茶很（ ）！",["好喝","天气","昨天","比"],"好喝","Цай — уух юм, 好喝.","easy",["usage"],"b19")
q("choice","Дуунд Сидней Бээжингээс ямар вэ?",["热","冷","好","小"],"热","悉尼比北京热 — Сидней Бээжингээс халуун.","medium",["dialogue"],"b20")
q("choice","Дуунд Нью-Йорк Бээжингээс ямар вэ?",["冷","热","大","好"],"冷","纽约比北京冷 — Нью-Йорк Бээжингээс хүйтэн.","medium",["dialogue"],"b21")
q("choice","Хүү юу уух дуртай вэ?",["冰水","热水","牛奶","茶"],"冰水","我喜欢喝冰水 — мөстэй ус.","medium",["dialogue"],"b22")
q("choice","Аав ээж юу илүү амттай гэж боддог вэ?",["热水","冰水","面条","米饭"],"热水","爸爸妈妈觉得热水比冰水好喝.","medium",["dialogue"],"b23")
q("choice","Пиньинь «lěng» гэж уншдаг үг:",["冷","热","比","好"],"冷","冷 = lěng = хүйтэн.","easy",["pronunciation"],"b24")
q("choice","Пиньинь «zuótiān» гэж уншдаг үг:",["昨天","今天","天气","北京"],"昨天","昨天 = zuótiān = өчигдөр.","medium",["pronunciation"],"b25")
q("choice","Пиньинь «tiānqì» гэж уншдаг үг:",["天气","怎么样","觉得","冰水"],"天气","天气 = tiānqì = цаг агаар.","easy",["pronunciation"],"b26")
q("usage","Гадаа маш халуун байна. Юу гэж хэлэх вэ?",["今天很热。","今天很冷。","北京呢？","再见。"],"今天很热。","热 = халуун.","easy",["usage"],"b27")
q("usage","Мөстэй ус халуун уснаас амттай гэж бодож байвал:",["我觉得冰水比热水好喝。","我觉得热水比冰水冷。","冰水不是水。","今天天气好。"],"我觉得冰水比热水好喝。","觉得 + A 比 B 好喝.","hard",["usage"],"b28")
q("choice","Mini story-д ах охиноос ямар вэ?",["聪明","热","冷","好喝"],"聪明","哥哥比我聪明 — ах ухаалаг.","medium",["usage"],"b29")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
LIMG = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
RIMG = [img("t5a"),img("t5b"),img("t5c"),img("t5d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (07-05) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）妹妹爱喝热牛奶。","script_zh":"妹妹爱喝热牛奶。","options":BANK,"optionImages":LIMG,"answer":"B","explanation_mn":"«Дүү халуун сүү уух дуртай» — B зураг дээр охин аягатай сүү ууж байна. A эр хүн охиныг тэврээд байна, C хүү гоймон идэж байна, D үүргэвчтэй охин зогсож байна."},
    {"n":2,"question_zh":"（听录音）爸爸的个子比我高。","script_zh":"爸爸的个子比我高。","options":BANK,"optionImages":LIMG,"answer":"A","explanation_mn":"«Аав надаас өндөр» — A зураг дээр өндөр аав жижиг охины ард зогсож байна. B сүү ууж буй охин, C гоймон идэж буй хүү, D үүргэвчтэй охин."},
    {"n":3,"question_zh":"（听录音）你看，我的书包怎么样？","script_zh":"你看，我的书包怎么样？","options":BANK,"optionImages":LIMG,"answer":"D","explanation_mn":"«Хар даа, миний цүнх ямар байна?» — D зураг дээр охин цүнхээ үзүүлж зогсож байна. Бусад зурагт цүнх алга."},
    {"n":4,"question_zh":"（听录音）你觉得这儿的面条儿好吃不好吃？","script_zh":"你觉得这儿的面条儿好吃不好吃？","options":BANK,"optionImages":LIMG,"answer":"C","explanation_mn":"«Энд гоймон чамд амттай санагдаж байна уу?» — C зураг дээр хүү том таваг гоймон идэж байна."}],
   "answer_source":"YCT 2 Test Answers L7: 1.B 2.A 3.D 4.C"},
  {"part":2,"type":"choice","instruction_mn":"Унших — ярианд тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"A：我们两个人谁的手大？ B：你的手比我的小。","question_mn":"Хоёулаа хэний гар том вэ? — Чиний гар минийхээс жижиг.","options":BANK,"optionImages":RIMG,"answer":"B","explanation_mn":"Хоёр хүний гарыг харьцуулж байна — B зураг дээр том, жижиг хоёр гар харагдаж байна. A даарсан хүүхэд, C цай барьсан охин, D эрхий хуруу."},
    {"n":6,"question_zh":"A：今天天气怎么样？ B：比昨天冷。","question_mn":"Өнөөдөр цаг агаар ямар байна? — Өчигдрөөс хүйтэн.","options":BANK,"optionImages":RIMG,"answer":"A","explanation_mn":"«Өчигдрөөс хүйтэн» — A зураг дээр хүүхэд малгай өмсөөд даарч байна. B гар, C цай, D эрхий хуруу."},
    {"n":7,"question_zh":"A：这茶好喝不好喝？ B：很好喝！","question_mn":"Энэ цай амттай юу? — Маш амттай!","options":BANK,"optionImages":RIMG,"answer":"C","explanation_mn":"Цайны тухай — C зураг дээр охин аяга цай барьж байна. Цай = 茶, амттай = 好喝."},
    {"n":8,"question_zh":"A：我的汉语怎么样？ B：很好，很好！","question_mn":"Миний хятад хэл ямар байна? — Маш сайн!","options":BANK,"optionImages":RIMG,"answer":"D","explanation_mn":"Магтаж байна — D зураг дээр эрхий хуруу өргөсөн байна. Энэ нь «маш сайн» гэсэн дохио."}],
   "answer_source":"YCT 2 Test Answers L7: 5.B 6.A 7.C 8.D"},
  {"part":3,"type":"match","instruction_mn":"Асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"北京天气怎么样？","answer":"很好，不冷也不热。","explanation_mn":"Цаг агаар ямар вэ гэсэн асуултад хариулсан."},
    {"n":2,"question_zh":"纽约呢？","answer":"纽约今天比昨天热。","explanation_mn":"Нью-Йорк өчигдрөөс халуун."}],
   "answer_source":"textbook х.34 (Let's read)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «比一比» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"哥哥比我聪明。","answer":"1","explanation_mn":"1-р зураг дээр ах тестээ барьж байна."},
    {"n":2,"question_zh":"姐姐比我漂亮。","answer":"2","explanation_mn":"2-р зураг дээр гоё даашинзтай эгч."},
    {"n":3,"question_zh":"我不聪明，也不漂亮。","answer":"3","explanation_mn":"3-р зураг дээр охин гунигтай хацраа түшиж байна."},
    {"n":4,"question_zh":"你很可爱，我们爱你！","answer":"4","explanation_mn":"4-р зураг дээр ах эгч нь охиныг гараас нь барьж байна."}],
   "answer_source":"textbook х.36 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Let's write — 3 өдрийн хамгийн өндөр, нам температураа тэмдэглээд 比-ээр харьцуул.","question_zh":"今天比昨天……","answer":"今天比昨天热/冷。","explanation_mn":"Хоёр өдрийн температурыг харьцуулж 热 эсвэл 冷 гэж бич."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Let's say — зургийг хараад асуулт хариул.","question_zh":"今天天气怎么样？ 今天……。","answer":"今天热。/ 今天冷。","explanation_mn":"Зургийн нар бол 热, цастай үүл бол 冷."},
   {"n":2,"prompt_mn":"Гэр бүлийнхээ дуртай ундааг 比-ээр хэл.","question_zh":"我觉得……比……好喝。","answer":"(нээлттэй)","explanation_mn":"Номын 2-р текстээр хэл."},
   {"n":3,"prompt_mn":"«天气怎么样？» дууг чичрэх, сэнгэнэх хөдөлгөөнтэй дуул.","question_zh":"纽约比北京冷","answer":"(нээлттэй)","explanation_mn":"Аудио 07-03-тай хамт."}]},
 "answerSource":"YCT 标准教程 2 · Test Listening Scripts, Test Answers (Lesson 7)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("leng","冷"),("re","热"),("beijing","北京"),("niuyue","纽约"),("bingshui","冰水"),("tianqi","天气"),("zenmeyang","怎么样"),("bi","比"),("zuotian","昨天"),("juede","觉得"),("haohe","好喝")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"今天比昨天热。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"北京天气怎么样？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"我喜欢喝冰水","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"天气怎么样？","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"比一比 · Mini story","role":"illustration","section":"story"},
 {"id":"story-art","file":"images/story.jpg","title":"比一比","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d","5a","5b","5c","5d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 7-р хичээл — Өнөөдөр өчигдрөөс халуун","chineseTitle":"今天比昨天热。","targetTitle":"今天比昨天热。","mongolianTitle":"Өнөөдөр өчигдрөөс халуун",
 "subtitle":"天气 · 冷 / 热 · 比 · 觉得 · «天气怎么样？» дуу",
 "description":f"Цаг агаар асуух (天气怎么样), 比-ээр харьцуулах, 觉得 гэж бодлоо хэлэх. {len(vocab)} үг, 2 яриа, дуу, Mini story, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🌡️","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第7课《今天比昨天热。》 [hskLevel=1] [lessonNumber=7]; эх: сурах бичиг х.33–37; аудио CD 07-01…07-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"今天比昨天热。","mongolianTitle":"Өнөөдөр өчигдрөөс халуун",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第7课 (сурах бичиг + CD аудио 07-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L7)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
