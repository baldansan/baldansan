#!/usr/bin/env python3
"""YCT 标准教程 1 · 第7课 这是谁的狗？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
from PIL import Image
BASE = "/home/claude/work/yct1/l07"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-1", "yct-1-l07", 7
os.makedirs(OUT + "/images", exist_ok=True)

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

# ---------------- IMAGE CROPS (Test / Let's guess / zodiac) ----------------
def crop(src, out, x0, y0, x1, y1):
    p = Image.open(f"{BASE}/pages/{src}"); W, H = p.size
    p.crop((int(x0*W), int(y0*H), int(x1*W), int(y1*H))).save(f"{OUT}/images/{out}")
T = "hi-35.png"
crop(T,"t1.png",0.33,0.180,0.50,0.247); crop(T,"t2.png",0.33,0.256,0.50,0.322)
crop(T,"t3.png",0.32,0.322,0.52,0.394); crop(T,"t4.png",0.33,0.400,0.52,0.468)
crop(T,"t5a.png",0.20,0.515,0.34,0.625); crop(T,"t5b.png",0.54,0.53,0.74,0.61)
crop(T,"t5c.png",0.20,0.632,0.38,0.74); crop(T,"t5d.png",0.56,0.615,0.73,0.74)
crop("hi-33.png","guess.png",0.07,0.095,0.88,0.47)
crop("hi-33.png","zodiac.png",0.13,0.53,0.84,0.76)
def img(n): return f"images/{n}.png"

# ---------------- AUDIO ----------------
AUD_WORDS, AUD_TEXT, AUD_CULT, AUD_SONG, AUD_TEST = [f"audio/yct-1-07-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-1-07-text-song.mp3"
lst = f"{BASE}/concat.txt"
open(lst,"w").write(f"file '{OUT}/{AUD_TEXT}'\nfile '{OUT}/{AUD_SONG}'\n")
if not os.path.exists(f"{OUT}/{AUD_MAIN}"): subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
os.remove(lst)

# ---------------- VOCAB ----------------
# (zh, py, mn, notes, ex_zh, ex_py, ex_mn, key)
VOCAB = [
 ("这","zhè","энэ","заах үг · гол үг","这是谁的狗？","Zhè shì shéi de gǒu?","Энэ хэний нохой вэ?",True),
 ("那","nà","тэр (холын)","заах үг · гол үг","那是谁的猫？","Nà shì shéi de māo?","Тэр хэний муур вэ?",True),
 ("谁","shéi","хэн","асуух үг · гол үг","这是谁的猫？","Zhè shì shéi de māo?","Энэ хэний муур вэ?",True),
 ("看","kàn","харах","үйл үг","看这儿！","Kàn zhèr!","Энд хар!",False),
 ("这儿","zhèr","энд","газар заах · гол үг","这儿有很多小鱼。","Zhèr yǒu hěn duō xiǎo yú.","Энд олон жижиг загас байна.",True),
 ("多","duō","олон, их","тэмдэг үг · гол үг","很多小鱼。","Hěn duō xiǎo yú.","Олон жижиг загас.",True),
 ("那儿","nàr","тэнд","газар заах · гол үг","那儿有很多小鸟。","Nàr yǒu hěn duō xiǎo niǎo.","Тэнд олон жижиг шувуу байна.",True),
 ("猫","māo","муур","амьтан","那是明明的猫。","Nà shì Míngming de māo.","Тэр Мин-мины муур.",False),
 ("狗","gǒu","нохой","амьтан","这是我的狗。","Zhè shì wǒ de gǒu.","Энэ миний нохой.",False),
 ("鱼","yú","загас","амьтан","你看，这儿有很多小鱼。","Nǐ kàn, zhèr yǒu hěn duō xiǎo yú.","Хар даа, энд олон жижиг загас байна.",False),
 ("鸟","niǎo","шувуу","амьтан","那儿有很多小鸟。","Nàr yǒu hěn duō xiǎo niǎo.","Тэнд олон жижиг шувуу байна.",False),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 1","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    out=[]
    for t in s.split(" "):
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Хэний нохой вэ?","scene_mn":"Гэрийн хажууд Дэвид Юэ-юэгийн нохойг хараад асууна. Цаана нэг муур явна.","audio":AUD_TEXT,
  "lines":[{"speaker":"大卫","zh":"这是谁的狗？","pinyin":"Zhè shì shéi de gǒu?","mn":"Энэ хэний нохой вэ?"},
           {"speaker":"月月","zh":"这是我的狗。","pinyin":"Zhè shì wǒ de gǒu.","mn":"Энэ миний нохой."},
           {"speaker":"大卫","zh":"那是谁的猫？","pinyin":"Nà shì shéi de māo?","mn":"Тэр хэний муур вэ?"},
           {"speaker":"月月","zh":"那是明明的猫。","pinyin":"Nà shì Míngming de māo.","mn":"Тэр Мин-мины муур."}]},
 {"id":2,"title_mn":"Яриа 2 · Голын эрэг дээр","scene_mn":"Хоёр хүүхэд голын эрэг дээр зогсоод загас, шувуу харна.","audio":AUD_TEXT,
  "lines":[{"speaker":"月月","zh":"你看，这儿有很多小鱼。","pinyin":"Nǐ kàn, zhèr yǒu hěn duō xiǎo yú.","mn":"Хар даа, энд олон жижиг загас байна!"},
           {"speaker":"大卫","zh":"你看，那儿有很多小鸟。","pinyin":"Nǐ kàn, nàr yǒu hěn duō xiǎo niǎo.","mn":"Хар даа, тэнд олон жижиг шувуу байна!"}]},
]
sentences=[]
dlg = [
 (1,"大卫：这是谁的狗？","Dàwèi: Zhè shì shéi de gǒu?","Дэвид: Энэ хэний нохой вэ?","大卫：| 这|zhè 是|shì 谁|shéi 的|de 狗|gǒu ？|","这是谁的狗 — «Энэ хэний нохой вэ?» гэж асууж байна. 谁 = хэн, 的 = «-ийн».",["这是谁的狗？"]),
 (1,"月月：这是我的狗。","Yuèyue: Zhè shì wǒ de gǒu.","Юэ-юэ: Энэ миний нохой.","月月：| 这|zhè 是|shì 我|wǒ 的|de 狗|gǒu 。|",None,[]),
 (1,"大卫：那是谁的猫？","Dàwèi: Nà shì shéi de māo?","Дэвид: Тэр хэний муур вэ?","大卫：| 那|nà 是|shì 谁|shéi 的|de 猫|māo ？|","Ойр байвал 这, хол байвал 那. Муур хол байгаа тул 那是谁的猫？",[]),
 (1,"月月：那是明明的猫。","Yuèyue: Nà shì Míngming de māo.","Юэ-юэ: Тэр Мин-мины муур.","月月：| 那|nà 是|shì 明明|Míngming 的|de 猫|māo 。|","明明的猫 — «Мин-мины муур». Нэр + 的 + юу байна.",[]),
 (2,"月月：你看，这儿有很多小鱼。","Yuèyue: Nǐ kàn, zhèr yǒu hěn duō xiǎo yú.","Юэ-юэ: Хар даа, энд олон жижиг загас байна!","月月：| 你|nǐ 看|kàn ，| 这儿|zhèr 有|yǒu 很|hěn 多|duō 小|xiǎo 鱼|yú 。|","这儿有很多小鱼 — «Энд олон жижиг загас байна». 这儿 = энд (ойр).",["这儿有很多小鱼。"]),
 (2,"大卫：你看，那儿有很多小鸟。","Dàwèi: Nǐ kàn, nàr yǒu hěn duō xiǎo niǎo.","Дэвид: Хар даа, тэнд олон жижиг шувуу байна!","大卫：| 你|nǐ 看|kàn ，| 那儿|nàr 有|yǒu 很|hěn 多|duō 小|xiǎo 鸟|niǎo 。|","那儿 = тэнд (хол).",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
song = [
 ("小狗小狗，汪汪汪。","Xiǎo gǒu xiǎo gǒu, wāng wāng wāng.","Бяцхан нохой, бяцхан нохой, ав ав ав.","小狗|xiǎo gǒu 小狗|xiǎo gǒu ，| 汪汪汪|wāng wāng wāng 。|"),
 ("小猫小猫，喵喵喵。","Xiǎo māo xiǎo māo, miāo miāo miāo.","Бяцхан муур, бяцхан муур, мяау мяау мяау.","小猫|xiǎo māo 小猫|xiǎo māo ，| 喵喵喵|miāo miāo miāo 。|"),
 ("小牛小牛，哞哞哞。","Xiǎo niú xiǎo niú, mōu mōu mōu.","Бяцхан үхэр, бяцхан үхэр, мөө мөө мөө.","小牛|xiǎo niú 小牛|xiǎo niú ，| 哞哞哞|mōu mōu mōu 。|"),
 ("小羊小羊，咩咩咩。","Xiǎo yáng xiǎo yáng, miē miē miē.","Бяцхан хурга, бяцхан хурга, мээ мээ мээ.","小羊|xiǎo yáng 小羊|xiǎo yáng ，| 咩咩咩|miē miē miē 。|"),
 ("你追我赶真热闹！","Nǐ zhuī wǒ gǎn zhēn rènao!","Чи хөөнө, би гүйцнэ — үнэхээр хөгжилтэй!","你|nǐ 追|zhuī 我|wǒ 赶|gǎn 真|zhēn 热闹|rènao ！|"),
]
for i,(zh,py,mn,tk) in enumerate(song):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Хятадад нохой «汪汪汪 (wāng wāng wāng)» гэж хуцдаг, манайд «ав ав». Хөдөлгөөн хийж дуулъя: нохой шиг мөлхөж, муур шиг гараа үрж!"
    if i==4: s["note"]="追 = хөөх, 赶 = гүйцэх. 热闹 = хөгжилтэй, шуугиантай. Хүүхдүүд бие биенээ хөөж тоглоход «你追我赶» гэнэ."
    sentences.append(s)

texts = {
 "unit":{"number":"7","title":"这是谁的狗？","mongolianTitle":"Энэ хэний нохой вэ? — энэ/тэр, хэний, энд/тэнд, амьтад"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи гэртээ нохой, муур тэжээдэг үү? Өнөөдөр бид амьтдын тухай ярина! Хятадаар нохой бол «狗 (gǒu)», муур бол «猫 (māo)», загас бол «鱼 (yú)», шувуу бол «鸟 (niǎo)». Мөн «Энэ хэний нохой вэ?» гэж асууж сурна: «这是谁的狗？». Дараа нь «Энд олон загас байна!», «Тэнд олон шувуу байна!» гэж хэлнэ. Амьтан шиг дуурайж тоглоно, «动物歌» дууг ч дуулна. Эхэлцгээе!",
  "warmup_mn":"Чи ямар амьтанд хамгийн их дуртай вэ? Нохой хэрхэн хуцдаг вэ, муур яаж дуугардаг вэ? Монголоор хэлж үзээрэй!",
  "theme_zh":"这/那 · 谁的 · 这儿/那儿 · 动物","theme_mn":"Энэ/тэр · Хэний · Энд/тэнд · Амьтад"},
 "warmup":{"mongolian":"Чи ямар амьтанд хамгийн их дуртай вэ? Нохой, муур яаж дуугардаг вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"7","title":"这是谁的狗？","mongolianTitle":"Энэ хэний нохой вэ? — яриа ба дуу","title_mn":"Let's read · 2 яриа + Let's chant · 动物歌","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第7课 Let's read + Let's chant（CD 07-02, 07-04）","author_zh":"",
  "intro_zh":"两段小对话：这是谁的狗？你看，这儿有很多小鱼。然后一起唱“动物歌”。",
  "intro_mn":"Эхлээд хоёр яриа: Дэвид, Юэ-юэ хоёр нохой, муур, загас, шувууг харна. Дараа нь «动物歌» — амьтдын дуу. Эхлээд аудиог сонс, дараа нь хамт хэл. Дуунд нохой, муур, үхэр, хонь хэрхэн дуугардгийг хятадаар хэлнэ. Амьтан шиг дуурайж, бие биенээ хөөж тоглоорой!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Дэвид «Энэ хэний нохой вэ?» гэж асууна. Юэ-юэ «Энэ миний нохой» гэнэ. Цаана байгаа муур Мин-мины муур."},
   {"paragraph":2,"mn":"Яриа 2 — Голын эрэг дээр Юэ-юэ энд олон жижиг загас, Дэвид тэнд олон жижиг шувуу байгааг харуулна."},
   {"paragraph":3,"mn":"Дуу «动物歌» — нохой «汪汪汪», муур «喵喵喵», үхэр «哞哞哞», хонь «咩咩咩» гэж дуугарна. «Чи хөөнө, би гүйцнэ — хөгжилтэй!» гэж төгсөнө."}],
  "reflection":{"questions_mn":["Хятадаар «Энэ хэний нохой вэ?» гэж яаж асуух вэ?","Ойрхон байгааг хэлэхдээ 这 уу, 那 уу? Холхон байгааг?","Нохой, муур, үхэр, хонь хятадаар яаж дуугардаг вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Хэний вэ?","zh":"这是谁的猫？这是我的猫。","pinyin":"Zhè shì shéi de māo? Zhè shì wǒ de māo.","mn":"Энэ хэний муур вэ? Энэ миний муур."},
  "writingPrompt_mn":"Гэр доторх эд зүйл, тоглоомоо заагаад «这是谁的…？» гэж асуу. Найз чинь «这是我的…» гэж хариулна. Холхон байгааг 那 гэж асуугаарай!"},
 "properNouns":[{"zh":"明明","pinyin":"Míngming","mn":"Мин-мин (хүүхдийн нэр)"},{"zh":"大卫","pinyin":"Dàwèi","mn":"Дэвид"},{"zh":"月月","pinyin":"Yuèyue","mn":"Юэ-юэ"}],
 "wordExplanation":[
  {"word":"这 / 那","gloss":"zhè / nà — энэ / тэр","explanation":"Ойрхон байгааг заахдаа 这 (энэ), холхон байгааг заахдаа 那 (тэр) гэнэ. Хуруугаараа заагаад хэлээрэй: гар дээр байгаа тоглоом — 这, өрөөний нөгөө үзүүрт байгаа — 那.",
   "structure":"这是… · 那是… · 这儿 (энд) · 那儿 (тэнд)","teacher_notes":"Хүүхдүүдэд гараараа заалгаж хэлүүл. 这 ба 那-г ойр/холоор ялгана.",
   "examples":[{"chinese":"这是我的狗。","pinyin":"Zhè shì wǒ de gǒu.","mongolian":"Энэ миний нохой."},{"chinese":"那是明明的猫。","pinyin":"Nà shì Míngming de māo.","mongolian":"Тэр Мин-мины муур."},{"chinese":"那儿有很多小鸟。","pinyin":"Nàr yǒu hěn duō xiǎo niǎo.","mongolian":"Тэнд олон жижиг шувуу байна."}],
   "common_mistakes":[{"wrong":"Ойрхон байгаа нохойг «那是狗» гэх","right":"Ойрхон бол «这是狗»","why":"这 ойр, 那 хол."}],
   "check":{"question":"Холхон байгаа муурыг заана. Юу гэх вэ?","options":["那是猫。","这是猫。","这儿是猫。"],"answer":"0"},
   "practice":[{"n":1,"question":"Гар дээрх нохойн тоглоом: ________是狗。","answer":"这","explanation_mn":"Ойрхон байгаа тул 这."}]},
  {"word":"谁的","gloss":"shéi de — хэний","explanation":"«Хэний?» гэж асуухдаа 谁的 гэнэ. Хариулахдаа «хэн + 的 + юу» гэж хэлнэ: 我的狗 (миний нохой), 明明的猫 (Мин-мины муур). 的 нь Монгол хэлний «-ийн» шиг.",
   "structure":"这是谁的狗？ · 这是我的狗。 · 那是明明的猫。","teacher_notes":"的 нь хөнгөн, богино дуудагдана (de). 谁 нь shéi, зарим хүн shuí гэж дууддаг.",
   "examples":[{"chinese":"这是谁的狗？","pinyin":"Zhè shì shéi de gǒu?","mongolian":"Энэ хэний нохой вэ?"},{"chinese":"这是我的狗。","pinyin":"Zhè shì wǒ de gǒu.","mongolian":"Энэ миний нохой."},{"chinese":"那是谁的猫？","pinyin":"Nà shì shéi de māo?","mongolian":"Тэр хэний муур вэ?"}],
   "common_mistakes":[{"wrong":"这是谁狗？","right":"这是谁的狗？","why":"Хэний гэж асуухад 的-г мартаж болохгүй."}],
   "check":{"question":"«Энэ хэний нохой вэ?» хятадаар аль нь вэ?","options":["这是谁的狗？","这是我的狗。","那儿有狗。"],"answer":"0"},
   "practice":[{"n":1,"question":"这是________的猫？（хэний）","answer":"谁","explanation_mn":"«Хэн» = 谁."}]},
  {"word":"这儿 / 那儿","gloss":"zhèr / nàr — энд / тэнд","explanation":"这儿 бол «энд», 那儿 бол «тэнд». Хаана юу байгааг хэлэхдээ «这儿有…» эсвэл «那儿有…» гэнэ. 很多 = «олон».",
   "structure":"这儿有很多小鱼。 · 那儿有很多小鸟。","teacher_notes":"儿 (r) дуудлага: zhèr, nàr — төгсгөлд нь хэлээ атгаж «р» гэж дуудна.",
   "examples":[{"chinese":"这儿有很多小鱼。","pinyin":"Zhèr yǒu hěn duō xiǎo yú.","mongolian":"Энд олон жижиг загас байна."},{"chinese":"那儿有很多小鸟。","pinyin":"Nàr yǒu hěn duō xiǎo niǎo.","mongolian":"Тэнд олон жижиг шувуу байна."},{"chinese":"你看！","pinyin":"Nǐ kàn!","mongolian":"Чи хар даа!"}],
   "common_mistakes":[{"wrong":"Холхон байгааг «这儿有…» гэх","right":"Холхон бол «那儿有…»","why":"这儿 энд, 那儿 тэнд."}],
   "check":{"question":"Голд олон загас байна. Ойрхон байгаа бол:","options":["这儿有很多小鱼。","那儿有很多小鸟。","那是谁的猫？"],"answer":"0"},
   "practice":[{"n":1,"question":"________有很多小鸟。（тэнд）","answer":"那儿","explanation_mn":"Хол байгааг 那儿 гэнэ."}]},
 ],
 "collocations":[{"type":"这/那 — ойр/хол","rows":[
   {"head":"这","with":"是…","mn":"энэ бол…","usage_mn":"Ойрхон байгааг заахад","example":{"zh":"这是我的狗。","pinyin":"Zhè shì wǒ de gǒu.","mn":"Энэ миний нохой."}},
   {"head":"那","with":"是…","mn":"тэр бол…","usage_mn":"Холхон байгааг заахад","example":{"zh":"那是明明的猫。","pinyin":"Nà shì Míngming de māo.","mn":"Тэр Мин-мины муур."}},
   {"head":"那儿","with":"有很多…","mn":"тэнд олон … байна","usage_mn":"Хол газар юу байгааг хэлэхэд","example":{"zh":"那儿有很多小鸟。","pinyin":"Nàr yǒu hěn duō xiǎo niǎo.","mn":"Тэнд олон жижиг шувуу байна."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Let's guess — зургийн хэсгийг хараад юу болохыг таа.","banks":[{"words":["狗","猫","鱼","鸟"],"items":[
     {"n":1,"question":"Хэл гарсан, хурц чихтэй хүрэн амьтан: 这是________。","answer":"狗","explanation_mn":"Хэлээ гарган, хоёр хурц чихтэй — нохой (狗)."},
     {"n":2,"question":"Хар цагаан толгойтой, ягаан чихтэй амьтан: 这是________。","answer":"猫","explanation_mn":"Муурын толгой — 猫."},
     {"n":3,"question":"Шар биетэй, өнгөт сэрвээтэй амьтан: 这是________。","answer":"鱼","explanation_mn":"Шар алтан загасны толгой, сэрвээ — 鱼."},
     {"n":4,"question":"Ягаан биетэй, хөх сүүлтэй амьтан: 这是________。","answer":"鱼","explanation_mn":"Хөх дэлбэгэр сүүл бүхий загас — 鱼."}]}],
   "answer_source":"textbook picture (Let's guess, х.31): 狗 猫 鱼 鱼 (4-р зураг загасны сүүл гэж таамагласан)"},
  "comprehension":{"instruction_mn":"Let's read — яриаг сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"那是谁的猫？","answer":"那是明明的猫。","explanation_mn":"Юэ-юэ «那是明明的猫» гэсэн."},
     {"n":2,"question_zh":"那儿有什么？","answer":"那儿有很多小鸟。","explanation_mn":"Дэвид «那儿有很多小鸟» гэсэн — тэнд олон жижиг шувуу байна."},
     {"n":3,"question_zh":"这儿有什么？","answer":"这儿有很多小鱼。","explanation_mn":"Юэ-юэ «这儿有很多小鱼» гэсэн."}],
   "answer_source":"textbook_verified"},
  "retell":{"instruction_mn":"Let's play — Амьтан дуурайх тоглоом.","prompts":[
     {"label":"Амьтан дуурайх","start_zh":"狗？猫？鱼？鸟？ — Нэг хүүхэд амьтан шиг дуурайна (нохой хуцна, муур мяаглана, шувуу далбаагаа дэвсэнэ). Бусад нь хятадаар таана: «这是狗！». Хамгийн түрүүнд зөв хэлсэн хүүхэд дараагийн амьтан болно."},
     {"label":"Хэний вэ?","start_zh":"这是谁的……？ — Найзтайгаа тоглоомууд (бөмбөг, цүнх, харандаа) дундаа тавь. Нэгийг заагаад «这是谁的…？» гэж асуу, найз «这是我的…» гэж хариулна."},
     {"label":"Энд ба тэнд","start_zh":"这儿有…… 那儿有…… — Өрөөнөөс ойрхон, холхон зүйл заагаад «这儿有…», «那儿有…» гэж хэл. Хэдэн ширхэг байвал «很多» гэнэ."}]}},
 "grammarNotes":[],
 "culture":{"title":"十二生肖","title_mn":"Хятадын 12 жилийн амьтад","text_mn":"Хятадад жил бүр нэг амьтны нэртэй: хулгана 鼠, үхэр 牛, бар 虎, туулай 兔, луу 龙, могой 蛇, морь 马, хонь 羊, сармагчин 猴, тахиа 鸡, нохой 狗, гахай 猪. Нийт 12 амьтан, 12 жил тутамд дахин эхэлнэ. Жишээ нь 2018 он — нохой жил, 2019 он — гахай жил. Чи ямар амьтны жилд төрсөн бэ? Аав, ээж чинь? Номын 31-р хуудасны зургийг хараад хайж үзээрэй.","note_mn":"Монголчууд ч 12 жилийн амьтадтай — хулгана, үхэр, бар, туулай, луу, могой, морь, хонь, бич, тахиа, нохой, гахай. Хятадад сармагчин (猴) оронд манайд «бич» гэдэг, бусад нь адилхан!","image":"images/zodiac.png"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — энэ/тэр, хэний, энд/тэнд, амьтад.","topic":"Миний гэрийн амьтад","discussion":["Хосоороо: нэг нь амьтан дуурайна, нөгөө нь «这是狗/猫/鱼/鸟！» гэж таана.","Бүгдээрээ: аль амьтны жилд төрснөө хятадаар хэл."],
   "writing":{"promptChinese":"这是谁的狗？这是我的狗。","promptMongolian":"Гэрийн даалгавар: гэр орон, хашаандаа байгаа амьтад (эсвэл тоглоом) дээр «这是谁的…？» гэж асуугаад гэрийнхэнтэйгээ хариулж үз.","minChars":"0","requiredWords":["这","谁","的"],"sampleChinese":"这是谁的猫？这是我的猫。","sampleMongolian":"Энэ хэний муур вэ? Энэ миний муур.","gradingRubric":"Зөв дуудлага, чанга хэлсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers: L7 1✗ 2✗ 3✓ 4✓ 5D 6C 7B 8A","parts":[]},
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
 {"point":"这是谁的狗？ — хэний вэ?","gloss_mn":"«Энэ хэний нохой вэ?» — эзнийг нь асуух",
  "structure":"这/那 + 是 + 谁的 + юу？ · 这是 + хэн + 的 + юу",
  "teacher_mn":"Гудамжинд нэг нохой харлаа. Хэний нохой вэ? Хятадаар «这是谁的狗？» гэж асууна. 谁 = хэн, 的 = «-ийн». Хариулахдаа «这是我的狗» (энэ миний нохой), эсвэл «那是明明的猫» (тэр Мин-мины муур) гэнэ. Гараараа заагаад хэлээрэй!",
  "teacher_notes":"Хүүхдэд дүрэм тайлбарлахгүй. Гэрийн эд зүйл дээр заагаад давтуул: 这是谁的…？",
  "examples":[ex("这是谁的狗？","Zhè shì shéi de gǒu?","Энэ хэний нохой вэ?"),ex("这是我的狗。","Zhè shì wǒ de gǒu.","Энэ миний нохой."),ex("那是谁的猫？","Nà shì shéi de māo?","Тэр хэний муур вэ?"),ex("那是明明的猫。","Nà shì Míngming de māo.","Тэр Мин-мины муур.")],
  "common_mistakes":[{"wrong":"这是谁狗？","right":"这是谁的狗？","why":"谁 ба 狗-ийн дунд 的 байна."},{"wrong":"这是狗我的。","right":"这是我的狗。","why":"Эзэн эхэнд, амьтан ард."}],
  "check":chk("«Энэ хэний нохой вэ?» хятадаар:",["这是谁的狗？","这是我的狗。","那儿有狗。"],"这是谁的狗？","g1c"),
  "exercises":[
   choice("Дэвид асуулаа: 这是谁的狗？ Юэ-юэ хариулна:",["这是我的狗。","那儿有很多小鸟。","再见。"],"这是我的狗。","Зөв! Юэ-юэ нохой нь өөрийнх гэж хэлсэн.","Асуулт нь нохойн эзний тухай — «这是我的狗» гэж хариулна.","g1e1"),
   judge("«那是明明的猫» гэдэг нь «Тэр Мин-мины муур» гэсэн үг.",True,"Зөв! 明明的猫 = Мин-мины муур.","那 = тэр, 明明的 = Мин-мины, 猫 = муур."),
   choice("«Хэний» гэдгийг хятадаар ямар үгээр асуух вэ?",["谁的","那儿","很多"],"谁的","Зөв! 谁的 = хэний.","那儿 = тэнд, 很多 = олон.","g1e3")]},
 {"point":"这儿有很多小鱼 — энд/тэнд юу байна","gloss_mn":"«Энд олон жижиг загас байна» — ойр/хол газар юу байгааг хэлэх",
  "structure":"这儿 / 那儿 + 有 + 很多 + юу",
  "teacher_mn":"Голын эрэг дээр зогсоод хар даа! Энд олон жижиг загас байна: «这儿有很多小鱼». Тэнд олон жижиг шувуу байна: «那儿有很多小鸟». 这儿 = энд (ойр), 那儿 = тэнд (хол), 很多 = олон. Хуруугаараа заагаад хэлээрэй!",
  "teacher_notes":"这儿 ба 那儿-г ойр/холоор хүүхдэд заалгаж давтуул. 儿-г зөөлөн «р» гэж төгсгө.",
  "examples":[ex("这儿有很多小鱼。","Zhèr yǒu hěn duō xiǎo yú.","Энд олон жижиг загас байна."),ex("那儿有很多小鸟。","Nàr yǒu hěn duō xiǎo niǎo.","Тэнд олон жижиг шувуу байна."),ex("你看，这儿有很多小鱼。","Nǐ kàn, zhèr yǒu hěn duō xiǎo yú.","Хар даа, энд олон жижиг загас байна!")],
  "common_mistakes":[{"wrong":"Холхон байгаа шувууг «这儿有…» гэх","right":"Холхон бол «那儿有…»","why":"这儿 энд, 那儿 тэнд."}],
  "check":chk("Хол байгаа шувууг заахад:",["那儿有很多小鸟。","这儿有很多小鱼。","这是我的狗。"],"那儿有很多小鸟。","g2c"),
  "exercises":[
   choice("你看，________有很多小鱼。（энд）",["这儿","那儿","谁的"],"这儿","Зөв! Ойрхон бол 这儿.","那儿 = тэнд.","g2e1"),
   judge("«很多» гэдэг нь «олон» гэсэн үг.",True,"Зөв!","很多 = олон."),
   choice("«Тэнд олон шувуу байна» хятадаар:",["那儿有很多小鸟。","这儿有很多小鸟。","那是谁的鸟？"],"那儿有很多小鸟。","Зөв!","这儿 = энд, 那儿 = тэнд.","g2e3")]},
 {"point":"这 / 那 — ойр ба хол","gloss_mn":"这 = энэ (ойр), 那 = тэр (хол); 这儿 = энд, 那儿 = тэнд",
  "structure":"这是… · 那是… · 这儿 · 那儿",
  "teacher_mn":"Гар дээр барьсан тоглоомоо заахдаа «这» гэнэ — энэ. Өрөөний нөгөө үзүүрт байгааг заахдаа «那» гэнэ — тэр. Газар ч адилхан: энд бол 这儿, тэнд бол 那儿. Амьтны зургийг заагаад тоглоцгооё: «这是狗！», «那是猫！»",
  "teacher_notes":"Дуулах үед 这 ба 那-г гараар ойр/холоор заалгаж давтуул. Хэлэх: zhè / nà.",
  "examples":[ex("这是我的狗。","Zhè shì wǒ de gǒu.","Энэ миний нохой."),ex("那是明明的猫。","Nà shì Míngming de māo.","Тэр Мин-мины муур."),ex("看那儿！","Kàn nàr!","Тэнд хар!"),ex("看这儿！","Kàn zhèr!","Энд хар!")],
  "common_mistakes":[{"wrong":"这 ба 那-г андуурах","right":"Ойр — 这, хол — 那","why":"Гар дээрх зүйл 这, холхон зүйл 那."}],
  "check":chk("Хол байгаа муурыг заана:",["那是猫。","这是猫。","这儿是猫。"],"那是猫。","g3c"),
  "exercises":[
   choice("Гар дээр барьсан нохой: ________是狗。",["这","那","谁"],"这","Зөв! Ойрхон бол 这.","那 = холхон.","g3e1"),
   choice("«Тэр» хятадаар аль нь вэ?",["那","这","多"],"那","Зөв! 那 = тэр.","这 = энэ, 多 = олон.","g3e2"),
   judge("«这儿» гэдэг нь «тэнд» гэсэн үг.",False,"Зөв — 这儿 = энд, 那儿 = тэнд.","这儿 = энд (ойр)."),
   choice("Аль нь амьтан бэ?",["猫","这","看"],"猫","Зөв! 猫 = муур.","这 = энэ, 看 = харах.","g3e4")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Нохой» хятадаар аль нь вэ?",["狗","猫","鱼","鸟"],"狗","狗 (gǒu) = нохой.","easy",["vocabulary"],"q1")
q("choice","«Муур» хятадаар аль нь вэ?",["猫","狗","鱼","鸟"],"猫","猫 (māo) = муур.","easy",["vocabulary"],"q2")
q("choice","«Загас» хятадаар аль нь вэ?",["鱼","鸟","猫","狗"],"鱼","鱼 (yú) = загас.","easy",["vocabulary"],"q3")
q("choice","«Шувуу» хятадаар аль нь вэ?",["鸟","鱼","狗","猫"],"鸟","鸟 (niǎo) = шувуу.","easy",["vocabulary"],"q4")
q("choice","«这» гэж юу вэ?",["энэ","тэр","энд","олон"],"энэ","这 (zhè) = энэ.","easy",["vocabulary"],"q5")
q("choice","«那» гэж юу вэ?",["тэр","энэ","тэнд","хэн"],"тэр","那 (nà) = тэр.","easy",["vocabulary"],"q6")
q("choice","«这儿» гэж юу вэ?",["энд","тэнд","энэ","олон"],"энд","这儿 (zhèr) = энд.","easy",["vocabulary"],"q7")
q("choice","«那儿» гэж юу вэ?",["тэнд","энд","тэр","харах"],"тэнд","那儿 (nàr) = тэнд.","easy",["vocabulary"],"q8")
q("choice","«谁» гэж юу вэ?",["хэн","олон","харах","муур"],"хэн","谁 (shéi) = хэн.","easy",["vocabulary"],"q9")
q("choice","«多» гэж юу вэ?",["олон","харах","тэнд","хэн"],"олон","多 (duō) = олон.","easy",["vocabulary"],"q10")
q("choice","«看» гэж юу вэ?",["харах","олон","шувуу","энд"],"харах","看 (kàn) = харах. 你看！ = Чи хар даа!","easy",["vocabulary"],"q11")
q("choice","«Энэ хэний нохой вэ?» хятадаар аль нь вэ?",["这是谁的狗？","这是我的狗。","那儿有小鸟。","你看！"],"这是谁的狗？","谁的 = хэний.","easy",["dialogue"],"q12")
q("cloze","大卫：这是谁的狗？ 月月：这是（ ）的狗。",["我","那儿","多","看"],"我","Хариулахдаа «我的狗» — миний нохой.","easy",["dialogue"],"q13")
q("choice","«那是明明的猫。» гэдэг юу гэсэн үг вэ?",["Тэр Мин-мины муур.","Энэ миний нохой.","Энд олон загас байна.","Тэнд шувуу байна."],"Тэр Мин-мины муур.","明明的猫 = Мин-мины муур.","medium",["dialogue"],"q14")
q("choice","«这儿有很多小鱼。» гэдэг юу гэсэн үг вэ?",["Энд олон жижиг загас байна.","Тэнд олон жижиг шувуу байна.","Энэ хэний загас вэ?","Энэ миний муур."],"Энд олон жижиг загас байна.","这儿 = энд, 很多 = олон, 小鱼 = жижиг загас.","medium",["dialogue"],"q15")
q("choice","Голын эрэг дээр хол олон шувуу харав. Юу гэх вэ?",["那儿有很多小鸟。","这儿有很多小鱼。","这是我的狗。","这是谁的猫？"],"那儿有很多小鸟。","Хол бол 那儿.","medium",["usage"],"q16")
q("cloze","你看，（ ）有很多小鱼。（энд）",["这儿","那儿","谁","猫"],"这儿","Ойрхон байгаа тул 这儿.","medium",["usage"],"q17")
q("usage","Ойрхон байгаа нохойг заахдаа:",["这是狗。","那是狗。","那儿是狗。","谁是狗。"],"这是狗。","Ойр бол 这.","easy",["usage"],"q18")
q("usage","Холхон байгаа муурыг заахдаа:",["那是猫。","这是猫。","这儿是猫。","多是猫。"],"那是猫。","Хол бол 那.","easy",["usage"],"q19")
q("choice","Пиньинь «gǒu» гэж уншдаг ханз:",["狗","猫","鱼","鸟"],"狗","狗 = gǒu = нохой.","easy",["pronunciation"],"q20")
q("choice","Пиньинь «māo» гэж уншдаг ханз:",["猫","狗","鱼","鸟"],"猫","猫 = māo = муур.","easy",["pronunciation"],"q21")
q("choice","Пиньинь «niǎo» гэж уншдаг ханз:",["鸟","鱼","狗","猫"],"鸟","鸟 = niǎo = шувуу.","easy",["pronunciation"],"q22")
q("choice","Пиньинь «shéi» гэж уншдаг ханз:",["谁","这","那","看"],"谁","谁 = shéi = хэн.","medium",["pronunciation"],"q23")
q("choice","Дууны «汪汪汪» ямар амьтан вэ?",["Нохой","Муур","Үхэр","Хонь"],"Нохой","小狗小狗，汪汪汪 — нохой.","easy",["song"],"q24")
q("choice","Дууны «喵喵喵» ямар амьтан вэ?",["Муур","Нохой","Үхэр","Хонь"],"Муур","小猫小猫，喵喵喵 — муур.","easy",["song"],"q25")
q("choice","«小牛» гэж юу вэ?",["Бяцхан үхэр","Бяцхан хонь","Бяцхан нохой","Бяцхан муур"],"Бяцхан үхэр","小 = жижиг, 牛 = үхэр.","medium",["song"],"q26")
q("choice","Хятад зодиакт хэдэн амьтан байдаг вэ?",["12","10","5","8"],"12","十二生肖 — 12 амьтан.","medium",["culture"],"q27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (07-05) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）鸟","image":img("t1"),"options":["✓","✗"],"answer":"✗","script_zh":"鸟","explanation_mn":"Аудионд «鸟 (niǎo) — шувуу» гэнэ. Харин зураг дээр алтан загас байна (鱼). Таарахгүй → ✗."},
    {"n":2,"question_zh":"（听录音）长耳朵","image":img("t2"),"options":["✓","✗"],"answer":"✗","script_zh":"长耳朵","explanation_mn":"«长耳朵» = урт чих. Зураг дээр тахиа байна, урт чихгүй. Таарахгүй → ✗."},
    {"n":3,"question_zh":"（听录音）这儿有很多小鸟。","image":img("t3"),"options":["✓","✗"],"answer":"✓","script_zh":"这儿有很多小鸟。","explanation_mn":"Зураг дээр тэнгэрт олон шувуу нисч, хүүхдүүд харж байна — «энд олон жижиг шувуу байна» таарч байна → ✓."},
    {"n":4,"question_zh":"（听录音）看那儿，在那儿。","image":img("t4"),"options":["✓","✗"],"answer":"✓","script_zh":"看那儿，在那儿。","explanation_mn":"«Тэнд хар, тэнд байна» — зураг дээр гэр бүл дээш хуруугаараа заагаад харж байна → ✓."}],
   "answer_source":"Test Answers: 1✗ 2✗ 3✓ 4✓"},
  {"part":2,"type":"choice","instruction_mn":"Унших — өгүүлбэр бүрт тохирох зургийг (A, B, C, D) сонго.","items":[
    {"n":5,"question_zh":"我的鱼在这儿。","options":["A","B","C","D"],"optionImages":[img("t5a"),img("t5b"),img("t5c"),img("t5d")],"answer":"D","explanation_mn":"«Миний загас энд байна» — D зураг дээр хөвгүүн загасны аяга барьж байна. A — нохой, B — охин, муур, C — хоёр тоть."},
    {"n":6,"question_zh":"我很喜欢小鸟。","options":["A","B","C","D"],"optionImages":[img("t5a"),img("t5b"),img("t5c"),img("t5d")],"answer":"C","explanation_mn":"«Би жижиг шувуунд маш их дуртай» — C зураг дээр хоёр тоть (шувуу) байна."},
    {"n":7,"question_zh":"小猫，你几岁？","options":["A","B","C","D"],"optionImages":[img("t5a"),img("t5b"),img("t5c"),img("t5d")],"answer":"B","explanation_mn":"«Муур минь, чи хэдэн настай вэ?» — B зураг дээр охин муураа тэврэн хэвтэж байна."},
    {"n":8,"question_zh":"那个小狗叫多多。","options":["A","B","C","D"],"optionImages":[img("t5a"),img("t5b"),img("t5c"),img("t5d")],"answer":"A","explanation_mn":"«Тэр гөлөг Дуо-дуо гэдэг нэртэй» — A зураг дээр цамцтай гөлөг байна."}],
   "answer_source":"Test Answers: 5D 6C 7B 8A (зурагтай таарч байна)"},
  {"part":3,"type":"match","instruction_mn":"Let's guess — зураг дээрх амьтдыг таагаад хятадаар хэл.","image":img("guess"),"items":[
    {"n":1,"question_zh":"这是什么？（1-р зураг）","answer":"这是狗。","explanation_mn":"Хэл гарсан, хурц чихтэй — нохой (狗)."},
    {"n":2,"question_zh":"这是什么？（2-р зураг）","answer":"这是猫。","explanation_mn":"Хар цагаан толгой, ягаан чих — муур (猫)."},
    {"n":3,"question_zh":"这是什么？（3-р зураг）","answer":"这是鱼。","explanation_mn":"Шар биетэй, өнгөт сэрвээтэй — загас (鱼)."},
    {"n":4,"question_zh":"这是什么？（4-р зураг）","answer":"这是鱼。","explanation_mn":"Ягаан биетэй, хөх сүүлтэй — загас (鱼)."}],
   "answer_source":"textbook picture (х.31)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бич: «小鱼» гэсэн хоёр ханзыг тод хуулан бич. 小 = жижиг, 鱼 = загас.","question_zh":"小鱼","answer":"小鱼","explanation_mn":"Эхлээд 小-г, дараа нь 鱼-г бич."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа асуу: «Энэ хэний нохой вэ?»","question_zh":"这是谁的狗？","answer":"这是谁的狗？","explanation_mn":"谁的 = хэний."},
   {"n":2,"prompt_mn":"Ойрхон загас, холхон шувууг заагаад хэл.","question_zh":"这儿有很多小鱼。那儿有很多小鸟。","answer":"这儿有很多小鱼。那儿有很多小鸟。","explanation_mn":"这儿 = энд, 那儿 = тэнд."},
   {"n":3,"prompt_mn":"«动物歌»-г хөдөлгөөнтэйгээр дуул.","question_zh":"小狗小狗，汪汪汪。","answer":"(нээлттэй)","explanation_mn":"Аудио 07-04-тэй хамт."}]},
 "answerSource":"YCT 标准教程 1 · Test Answers (Lesson 7): 1✗ 2✗ 3✓ 4✓ 5D 6C 7B 8A"}
dump("workbook.json", workbook)

# ---------------- IMAGE PROMPTS ----------------
NOTXT = " No English text."
def ip(file, aspect, title, section, prompt, chars, role=None):
    d={"file":file,"aspect":aspect,"title":title,"section":section}
    if role: d["role"]=role
    d["prompt"]=prompt+NOTXT; d["chars"]=chars; return d
PROMPTS = [
 ip("images/hero.jpg","4:3","这是谁的狗？","teacher-intro","Teacher camel with glasses stands beside the yellow camel calf boy, the camel calf girl and the brown camel calf boy in a sunny meadow; a puppy, a kitten, a fish pond and little birds are around, the boy points at the puppy with a speech bubble with the Chinese text 这是谁的狗？ in large clear black font.",["temee","huu","ohin","bor"],"hero"),
 ip("images/w-zhe.jpg","1:1","这","vocabulary","Close-up: the yellow camel calf boy stretches his arm and points with his index finger at a toy puppy held right in front of his nose, the puppy big and near, his other hand open, clear near-object emphasis.",["huu"]),
 ip("images/w-na.jpg","1:1","那","vocabulary","The camel calf girl points far away across a field at a small house on a distant hill, the object tiny in the distance, arm stretched out.",["ohin"]),
 ip("images/w-shei.jpg","1:1","谁","vocabulary","The brown camel calf boy scratches his head with a big question mark above, looking at a toy ball that nobody owns, puzzled friendly face.",["bor"]),
 ip("images/w-kan.jpg","1:1","看","vocabulary","The yellow camel calf boy holds both hands as binoculars in front of his wide-open eyes and looks eagerly at a distant butterfly and a rainbow, both eyes clearly visible, excited face, not covering his face.",["huu"]),
 ip("images/w-zher.jpg","1:1","这儿","vocabulary","The camel calf girl stands on a river bank pointing at the ground at her feet where many small goldfish swim close to her, a big arrow marker pointing down here.",["ohin"]),
 ip("images/w-duo.jpg","1:1","多","vocabulary","A big pile of many colorful apples and balls in a basket, with the brown camel calf boy surprised by how many there are, lots of items filling the picture.",["bor"]),
 ip("images/w-nar.jpg","1:1","那儿","vocabulary","The yellow camel calf boy points far away to a distant tree where many small birds sit, the birds tiny and far, arm stretched out.",["huu"]),
 ip("images/w-mao.jpg","1:1","猫","vocabulary","A cute kitten sitting and washing its paw, soft colors, simple clean background.",[]),
 ip("images/w-gou.jpg","1:1","狗","vocabulary","A friendly brown puppy with its tongue out, wagging its tail, simple clean background.",[]),
 ip("images/w-yu.jpg","1:1","鱼","vocabulary","A bright orange goldfish swimming in blue water with bubbles, simple clean background.",[]),
 ip("images/w-niao.jpg","1:1","鸟","vocabulary","A small colorful bird sitting on a branch and singing, simple clean background.",[]),
 ip("images/d1.jpg","4:3","这是谁的狗？","dialogue","The yellow camel calf boy points at a brown puppy while the camel calf girl in a yellow dress kneels beside the puppy and pets it; a small kitten walks in the distance near a little house, speech bubble above the boy with the Chinese text 这是谁的狗？ in large clear black font. Only camel calf characters, no human children.",["huu","ohin"]),
 ip("images/d2.jpg","4:3","你看，这儿有很多小鱼。","dialogue","The camel calf girl in a pink top kneels at a river bank pointing at many small fish while the yellow camel calf boy points far at many little birds near a big tree, speech bubble with the Chinese text 你看，这儿有很多小鱼。 in large clear black font.",["ohin","huu"]),
 ip("images/song.jpg","4:3","动物歌","song","Four camel calf kids wear animal headbands (dog, cat, cow, sheep) and play chasing each other on a green meadow, laughing, music notes in the air; teacher camel claps happily.",["temee","huu","ohin","bor"]),
]
dump("image_prompts.json", PROMPTS, BASE)

# ---------------- LESSON / MANIFEST ----------------
images = [{"id":p["file"].split("/")[1].rsplit(".",1)[0],"file":p["file"],"title":p["title"],"role":p.get("role","illustration"),"section":p["section"]} for p in PROMPTS]
images += [{"id":"zodiac","file":"images/zodiac.png","title":"十二生肖","role":"illustration","section":"culture"},
           {"id":"guess","file":"images/guess.png","title":"Let's guess","role":"illustration","section":"workbook"}]
images += [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1","2","3","4","5a","5b","5c","5d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 7-р хичээл — Энэ хэний нохой вэ?","chineseTitle":"这是谁的狗？","targetTitle":"这是谁的狗？","mongolianTitle":"Энэ хэний нохой вэ?",
 "subtitle":"这/那 · 谁的 · 这儿/那儿 · 猫 狗 鱼 鸟 · «动物歌» · амьтан дуурайх тоглоом",
 "description":f"Энэ/тэр, хэний, энд/тэнд, амьтдын нэр. {len(vocab)} үг, 2 зурагт яриа, 1 дуу, 2 түлхүүр өгүүлбэр, {len(Q)} шалгалтын асуулт, номын тест (сонсох 4 + унших 4) — АЛБАН АУДИО, ЗУРАГТАЙ.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🐶","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第7课《这是谁的狗？》 [hskLevel=1] [lessonNumber=7]; эх: х.29–33; аудио CD 07-01…07-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"这是谁的狗？","mongolianTitle":"Энэ хэний нохой вэ?",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第7课 (сурах бичиг + CD аудио 07-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"culture":AUD_CULT,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers: 1✗ 2✗ 3✓ 4✓ 5D 6C 7B 8A)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"chant lines",len(song),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
