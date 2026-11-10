#!/usr/bin/env python3
"""YCT 标准教程 4 · 第7课 你们每天怎么去学校？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
OUT = "/home/claude/work/yct4/l07/pkg"
BASE = "/home/claude/work/yct4/l07"
CID, LID, N = "yct-4", "yct-4-l07", 7
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

# Тестийн зураг (hi-44.png), Let's guess (hi-42.png), Let's find (hi-43.png), bus (hi-42.png)
from PIL import Image
_t = Image.open(f"{BASE}/pages/hi-44.png").convert("RGB")
for _k,_b in {"t2a":(190,823,384,962),"t2b":(427,823,614,962),"t2c":(675,823,838,966),"t2d":(904,823,1074,966)}.items():
    _c=_t.crop(_b); _c=_c.resize((_c.width*2,_c.height*2),Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
_g = Image.open(f"{BASE}/pages/hi-42.png").convert("RGB")
for _k,_b in {"g1":(225,1010,484,1200),"g2":(675,1005,966,1210),"g3":(218,1272,515,1450),"g4":(710,1270,970,1455),"bus":(640,225,1115,435)}.items():
    _g.crop(_b).save(f"{OUT}/images/{_k}.png")
Image.open(f"{BASE}/pages/hi-43.png").convert("RGB").crop((125,440,1070,1450)).save(f"{OUT}/images/find.png")

AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_TEST = [f"audio/yct-4-07-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = "audio/yct-4-07-text-song.mp3"
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"{OUT}/{AUD_TEXT}","-i",f"{OUT}/{AUD_SONG}","-filter_complex","[0:a][1:a]concat=n=2:v=0:a=1[a]","-map","[a]","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)

# ---------------- VOCAB ----------------
VOCAB = [
 ("公共汽车","gōnggòng qìchē","нийтийн автобус","нэр үг · гол үг","我坐公共汽车去学校。","Wǒ zuò gōnggòng qìchē qù xuéxiào.","Би автобусаар сургуульдаа явдаг.",True),
 ("动物园","dòngwùyuán","амьтны хүрээлэн","нэр үг · гол үг","去动物园走这条路，对吗？","Qù dòngwùyuán zǒu zhè tiáo lù, duì ma?","Амьтны хүрээлэн рүү энэ замаар явдаг биз дээ?",True),
 ("车站","chēzhàn","автобусны буудал","нэр үг · гол үг","车站就在旁边。","Chēzhàn jiù zài pángbiān.","Автобусны буудал яг хажууд байна.",True),
 ("开","kāi","жолоодох","үйл үг · гол үг","哥哥自己开车去学校。","Gēge zìjǐ kāichē qù xuéxiào.","Ах өөрөө машин жолоодоод сургуульдаа явдаг.",True),
 ("对","duì","зөв","тэмдэг нэр · гол үг","对，但是有一点儿远。","Duì, dànshì yǒu yìdiǎnr yuǎn.","Тийм ээ, гэхдээ жаахан холхон.",True),
 ("路","lù","зам","нэр үг · гол үг","走这条路，对吗？","Zǒu zhè tiáo lù, duì ma?","Энэ замаар явна, зөв үү?",True),
 ("远","yuǎn","хол","тэмдэг нэр · гол үг","学校远吗？","Xuéxiào yuǎn ma?","Сургууль хол уу?",True),
 ("近","jìn","ойр","тэмдэг нэр · гол үг","我的学校很近。","Wǒ de xuéxiào hěn jìn.","Миний сургууль ойрхон.",True),
 ("旁边","pángbiān","хажууд, дэргэд","байрлал · гол үг","车站就在旁边。","Chēzhàn jiù zài pángbiān.","Автобусны буудал яг хажууд байна.",True),
 ("条","tiáo","(зам, гол зэргийг тоолох үг)","тоолох үг · гол үг","走这条路。","Zǒu zhè tiáo lù.","Энэ замаар яв.",True),
 ("坐","zuò","суух; (автобус, галт тэргээр) явах","үйл үг","你可以坐公共汽车。","Nǐ kěyǐ zuò gōnggòng qìchē.","Чи автобусаар явж болно.",False),
 ("怎么","zěnme","яаж","асуух үг","你们每天怎么去学校？","Nǐmen měitiān zěnme qù xuéxiào?","Та нар өдөр бүр сургуульдаа яаж явдаг вэ?",False),
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
 {"id":1,"title_mn":"Яриа 1 · Автобусны буудал дээр","scene_mn":"Автобусны буудал дээр хоёр хүүхэд таарав. Нэг нь нөгөөгөөсөө өдөр бүр сургуульдаа яаж явдгийг асууж байна. Ард нь шар машин өнгөрч байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"你们每天怎么去学校？","pinyin":"Nǐmen měitiān zěnme qù xuéxiào?","mn":"Та нар өдөр бүр сургуульдаа яаж явдаг вэ?"},
           {"speaker":"玛丽","zh":"我坐公共汽车去学校，哥哥自己开车去学校。","pinyin":"Wǒ zuò gōnggòng qìchē qù xuéxiào, gēge zìjǐ kāichē qù xuéxiào.","mn":"Би автобусаар явдаг. Ах маань өөрөө машин жолоодоод явдаг."},
           {"speaker":"小明","zh":"学校远吗？","pinyin":"Xuéxiào yuǎn ma?","mn":"Сургууль чинь хол уу?"},
           {"speaker":"玛丽","zh":"我的学校很近，哥哥的学校有一点儿远。","pinyin":"Wǒ de xuéxiào hěn jìn, gēge de xuéxiào yǒu yìdiǎnr yuǎn.","mn":"Миний сургууль ойрхон. Ахын сургууль жаахан холхон."}]},
 {"id":2,"title_mn":"Яриа 2 · Амьтны хүрээлэн рүү явах зам","scene_mn":"Хоёр охин газрын зураг харж, амьтны хүрээлэн рүү явах замаа хайж байна. Нэг хүү тэдэнд зам зааж өгөв.","audio":AUD_TEXT,
  "lines":[{"speaker":"玛丽","zh":"去动物园走这条路，对吗？","pinyin":"Qù dòngwùyuán zǒu zhè tiáo lù, duì ma?","mn":"Амьтны хүрээлэн рүү энэ замаар явдаг биз дээ?"},
           {"speaker":"大卫","zh":"对，但是有一点儿远，你可以坐公共汽车。","pinyin":"Duì, dànshì yǒu yìdiǎnr yuǎn, nǐ kěyǐ zuò gōnggòng qìchē.","mn":"Тийм. Гэхдээ жаахан холхон, чи автобусаар явж болно."},
           {"speaker":"月月","zh":"车站在哪儿？","pinyin":"Chēzhàn zài nǎr?","mn":"Автобусны буудал хаана байдаг вэ?"},
           {"speaker":"大卫","zh":"车站就在旁边。","pinyin":"Chēzhàn jiù zài pángbiān.","mn":"Автобусны буудал яг хажууд байна."}]},
]
sentences=[]
dlg = [
 (1,"小明：你们每天怎么去学校？","Xiǎo Míng: Nǐmen měitiān zěnme qù xuéxiào?","Сяо Мин: Та нар өдөр бүр сургуульдаа яаж явдаг вэ?","小明：| 你们|nǐmen 每天|měitiān 怎么|zěnme 去|qù 学校|xuéxiào ？|","怎么 = яаж. «怎么去学校？» гэвэл «сургууль руу яаж явдаг вэ?» гэсэн үг. Хариулахдаа «我坐……去学校» гэнэ.",["你们每天怎么去学校？"]),
 (1,"玛丽：我坐公共汽车去学校，哥哥自己开车去学校。","Mǎlì: Wǒ zuò gōnggòng qìchē qù xuéxiào, gēge zìjǐ kāichē qù xuéxiào.","Мари: Би автобусаар явдаг. Ах маань өөрөө машин жолоодоод явдаг.","玛丽：| 我|wǒ 坐|zuò 公共汽车|gōnggòng qìchē 去|qù 学校|xuéxiào ，| 哥哥|gēge 自己|zìjǐ 开车|kāichē 去|qù 学校|xuéxiào 。|","坐 + тээврийн хэрэгсэл + 去 = «…-аар явах». 自己 = өөрөө. 开车 = машин жолоодох.",["我坐公共汽车去学校，哥哥自己开车去学校。"]),
 (1,"小明：学校远吗？","Xiǎo Míng: Xuéxiào yuǎn ma?","Сяо Мин: Сургууль чинь хол уу?","小明：| 学校|xuéxiào 远|yuǎn 吗|ma ？|","",[]),
 (1,"玛丽：我的学校很近，哥哥的学校有一点儿远。","Mǎlì: Wǒ de xuéxiào hěn jìn, gēge de xuéxiào yǒu yìdiǎnr yuǎn.","Мари: Миний сургууль ойрхон. Ахын сургууль жаахан холхон.","玛丽：| 我|wǒ 的|de 学校|xuéxiào 很|hěn 近|jìn ，| 哥哥|gēge 的|de 学校|xuéxiào 有|yǒu 一点儿|yìdiǎnr 远|yuǎn 。|","有一点儿远 = «жаахан холхон». 近 = ойр, 远 = хол.",[]),
 (2,"玛丽：去动物园走这条路，对吗？","Mǎlì: Qù dòngwùyuán zǒu zhè tiáo lù, duì ma?","Мари: Амьтны хүрээлэн рүү энэ замаар явдаг биз дээ?","玛丽：| 去|qù 动物园|dòngwùyuán 走|zǒu 这|zhè 条|tiáo 路|lù ，| 对|duì 吗|ma ？|","对吗？ = «зөв үү?». Замаа шалгахдаа хэлдэг. 条 нь зам тоолох үг: 一条路.",["去动物园走这条路，对吗？"]),
 (2,"大卫：对，但是有一点儿远，你可以坐公共汽车。","Dàwèi: Duì, dànshì yǒu yìdiǎnr yuǎn, nǐ kěyǐ zuò gōnggòng qìchē.","Дэвид: Тийм. Гэхдээ жаахан холхон, чи автобусаар явж болно.","大卫：| 对|duì ，| 但是|dànshì 有|yǒu 一点儿|yìdiǎnr 远|yuǎn ，| 你|nǐ 可以|kěyǐ 坐|zuò 公共汽车|gōnggòng qìchē 。|","但是 = «гэхдээ». 可以 = «болно».",[]),
 (2,"月月：车站在哪儿？","Yuèyue: Chēzhàn zài nǎr?","Юэ-юэ: Автобусны буудал хаана байдаг вэ?","月月：| 车站|chēzhàn 在|zài 哪儿|nǎr ？|","",[]),
 (2,"大卫：车站就在旁边。","Dàwèi: Chēzhàn jiù zài pángbiān.","Дэвид: Автобусны буудал яг хажууд байна.","大卫：| 车站|chēzhàn 就|jiù 在|zài 旁边|pángbiān 。|","就在旁边 = «яг хажууд». 旁边 = хажуу, дэргэд.",["车站就在旁边。"]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
song = [
 ("我爱开公共汽车","Wǒ ài kāi gōnggòng qìchē","Би автобус жолоодох дуртай","我|wǒ 爱|ài 开|kāi 公共汽车|gōnggòng qìchē"),
 ("我爱车，我爱车，我爱开公共汽车。","Wǒ ài chē, wǒ ài chē, wǒ ài kāi gōnggòng qìchē.","Би машинд дуртай, би машинд дуртай, би автобус жолоодох дуртай!","我|wǒ 爱|ài 车|chē ，| 我|wǒ 爱|ài 车|chē ，| 我|wǒ 爱|ài 开|kāi 公共汽车|gōnggòng qìchē 。|"),
 ("老师啊，同学啊，你们坐好我再开。","Lǎoshī a, tóngxué a, nǐmen zuòhǎo wǒ zài kāi.","Багш аа, ангийнхан аа, сайн суугаарай, тэгээд би хөдөлнө.","老师|lǎoshī 啊|a ，| 同学|tóngxué 啊|a ，| 你们|nǐmen 坐好|zuòhǎo 我|wǒ 再|zài 开|kāi 。|"),
 ("远的来，近的来，送你们去动物园。","Yuǎn de lái, jìn de lái, sòng nǐmen qù dòngwùyuán.","Хол газраас ч ир, ойроос ч ир, би та нарыг амьтны хүрээлэн рүү хүргэнэ.","远|yuǎn 的|de 来|lái ，| 近|jìn 的|de 来|lái ，| 送|sòng 你们|nǐmen 去|qù 动物园|dòngwùyuán 。|"),
 ("您走好，您玩好，我在车站等您来。","Nín zǒuhǎo, nín wánhǎo, wǒ zài chēzhàn děng nín lái.","Сайн яваарай, сайхан тоглоорой, би буудал дээр таныг хүлээж байя.","您|nín 走好|zǒuhǎo ，| 您|nín 玩好|wánhǎo ，| 我|wǒ 在|zài 车站|chēzhàn 等|děng 您|nín 来|lái 。|"),
]
for i,(zh,py,mn,tk) in enumerate(song):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Let's draw and sing — дууны нэр. Эхлээд автобусны зургийг дуртай өнгөөрөө будаарай, дараа нь дуулаарай!"
    if i==1: s["note"]="Дуулахдаа гараараа жолооны хүрд мушгиж буй мэт хөдөл!"
    if i==4: s["note"]="您 = «та» (хүндэтгэлтэй). 走好 = сайн яваарай, 玩好 = сайхан тоглоорой."
    sentences.append(s)

texts = {
 "unit":{"number":"7","title":"你们每天怎么去学校？","mongolianTitle":"Та нар өдөр бүр сургуульдаа яаж явдаг вэ? — тээвэр, зам, хол ойр"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх номуудад чи гэр бүл, тоо, амьтан, хоол, спортын тухай маш олон үг сурсан даа. Одоо чи өглөө бүр сургуульдаа яаж явдаг вэ? Автобусаар уу, машинаар уу, алхаж уу? Өнөөдөр «你们每天怎么去学校？» гэж найзаасаа асуугаад «我坐公共汽车去学校» гэж хариулж сурна. Мөн амьтны хүрээлэн рүү явах замаа асууж, «远» (хол), «近» (ойр) гэж хэлж сурна. Автобусны дууг дуулж, автобусны зургийг будна шүү. Тээврийн хэрэгсэлд суугаад хөдөлцгөөе, эхэлцгээе!",
  "warmup_mn":"Чи өглөө бүр сургуульдаа яаж явдаг вэ? Чиний сургууль гэрээс чинь хол уу, ойр уу?",
  "theme_zh":"坐公共汽车 · 开车 · 远 · 近 · 旁边","theme_mn":"Автобусаар явах · жолоодох · хол · ойр · хажууд"},
 "warmup":{"mongolian":"Чи өглөө бүр сургуульдаа яаж явдаг вэ? Автобусаар уу, машинаар уу, алхаж уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"7","title":"你们每天怎么去学校？","mongolianTitle":"Та нар өдөр бүр сургуульдаа яаж явдаг вэ? — яриа, дуу","title_mn":"Let's read · 2 яриа + Let's draw and sing · 我爱开公共汽车","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 4 · 第7课 Let's read / Let's draw and sing（CD 07-02, 07-03）","author_zh":"",
  "intro_zh":"两段小对话：你们每天怎么去学校？去动物园走这条路，对吗？然后唱歌《我爱开公共汽车》。",
  "intro_mn":"Эхлээд хоёр яриа: «你们每天怎么去学校？» гэж сургуульдаа яаж явдгаа асууна, «去动物园走这条路，对吗？» гэж замаа шалгана. Дараа нь «我爱开公共汽车» дууг дуулна. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Мари автобусаар сургуульдаа явдаг, ах нь өөрөө машин жолоодоод явдаг. Мариын сургууль ойрхон, ахын сургууль жаахан холхон. Аудио: 07-02."},
   {"paragraph":2,"mn":"Яриа 2 — Хоёр охин амьтны хүрээлэн рүү явах замаа асууна. Хүү «зам зөв, гэхдээ жаахан холхон, автобусаар яв» гэнэ. Автобусны буудал яг хажууд байна. Аудио: 07-02."},
   {"paragraph":3,"mn":"Дуу «我爱开公共汽车» — Жолооч хүүхдүүдээ автобусандаа суулгаад амьтны хүрээлэн рүү хүргэнэ. Эцэст нь буудал дээр хүлээнэ гэж хэлнэ. Аудио: 07-03."}],
  "reflection":{"questions_mn":["Чи сургуульдаа яаж явдаг вэ? «我……去学校» гэж хэлж үз.","Чиний сургууль ойрхон уу, холхон уу? «很近» эсвэл «有一点儿远» гэж хэл.","Автобусны жолооч болбол чи хүүхдүүдийг хаашаа хүргэх вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Сургуульд яаж явдгаа хэл","zh":"我坐公共汽车去学校。","pinyin":"Wǒ zuò gōnggòng qìchē qù xuéxiào.","mn":"Би автобусаар сургуульдаа явдаг."},
  "writingPrompt_mn":"Найзаасаа «你们每天怎么去学校？» гэж асуугаад «我坐……去学校» гэж хариул. Дараа нь «学校远吗？» гэж асуу."},
 "properNouns":[{"zh":"我爱开公共汽车","pinyin":"Wǒ ài kāi gōnggòng qìchē","mn":"Би автобус жолоодох дуртай (дууны нэр)"}],
 "wordExplanation":[
  {"word":"坐 · 开 · 怎么","gloss":"zuò · kāi · zěnme — явах, жолоодох, яаж","explanation":"Автобус, галт тэргээр явахдаа «坐» гэнэ. Харин өөрөө жолоодвол «开车» гэнэ. «怎么去？» гэвэл «яаж явдаг вэ?» гэсэн асуулт. Жишээ нь: «我坐公共汽车去学校» — Би автобусаар сургуульдаа явдаг.",
   "structure":"我坐 + автобус/…… + 去 + хаашаа · 自己开车去……","teacher_notes":"Хүүхдүүдэд гараараа жолоо мушгиулж «开车！» гэж хэлүүл, дараа нь суудалд суугаад «坐公共汽车！» гэж хэлүүл.",
   "examples":[{"chinese":"你们每天怎么去学校？","pinyin":"Nǐmen měitiān zěnme qù xuéxiào?","mongolian":"Та нар өдөр бүр сургуульдаа яаж явдаг вэ?"},{"chinese":"我坐公共汽车去学校。","pinyin":"Wǒ zuò gōnggòng qìchē qù xuéxiào.","mongolian":"Би автобусаар сургуульдаа явдаг."},{"chinese":"哥哥自己开车去学校。","pinyin":"Gēge zìjǐ kāichē qù xuéxiào.","mongolian":"Ах өөрөө машин жолоодоод сургуульдаа явдаг."}],
   "common_mistakes":[{"wrong":"我去学校坐公共汽车。","right":"我坐公共汽车去学校。","why":"Яаж явахаа эхлээд хэлнэ: «坐公共汽车» нь «去»-ийн өмнө орно."}],
   "check":{"question":"«Би автобусаар явдаг» хятадаар:","options":["我坐公共汽车去。","我开车去。","我走路去。"],"answer":"0"},
   "practice":[{"n":1,"question":"我 ________ 公共汽车去学校。(суух, явах)","answer":"坐","explanation_mn":"Автобусаар явахдаа 坐 гэнэ."}]},
  {"word":"对吗？ · 条 · 走","gloss":"duì ma · tiáo · zǒu — зөв үү, зам тоолох үг, явах","explanation":"Замаа шалгахдаа «走这条路，对吗？» гэж асууна. Хариулахдаа «对» (зөв) эсвэл «不对» (буруу) гэнэ. Зам, гол зэргийг тоолохдоо «条» гэж хэлдэг: «一条路» — нэг зам.",
   "structure":"去 + хаашаа + 走这条路，对吗？ → 对 / 不对","teacher_notes":"Хүүхдүүдэд сургуулийн хонгилд зам зааж өгүүл: «走这条路，对吗？» «对！»",
   "examples":[{"chinese":"去动物园走这条路，对吗？","pinyin":"Qù dòngwùyuán zǒu zhè tiáo lù, duì ma?","mongolian":"Амьтны хүрээлэн рүү энэ замаар явдаг биз дээ?"},{"chinese":"对，但是有一点儿远。","pinyin":"Duì, dànshì yǒu yìdiǎnr yuǎn.","mongolian":"Тийм, гэхдээ жаахан холхон."},{"chinese":"一条路","pinyin":"yì tiáo lù","mongolian":"нэг зам"}],
   "common_mistakes":[{"wrong":"一个路","right":"一条路","why":"Зам тоолохдоо «个» биш «条» гэнэ."}],
   "check":{"question":"Замаа шалгаж асуух нь:","options":["走这条路，对吗？","车站在哪儿？","学校远吗？"],"answer":"0"},
   "practice":[{"n":1,"question":"走这 ________ 路，对吗？(зам тоолох үг)","answer":"条","explanation_mn":"Замыг 条-өөр тоолно."}]},
  {"word":"远 · 近 · 旁边","gloss":"yuǎn · jìn · pángbiān — хол, ойр, хажууд","explanation":"Хол бол «远», ойр бол «近». Жаахан холхон бол «有一点儿远». Хажууд байвал «旁边». «车站就在旁边» — буудал яг хажууд байна.",
   "structure":"学校远吗？ → 很近 / 有一点儿远 · 车站在旁边","teacher_notes":"Хүүхдүүдээр «хол» гэхдээ гараа тал тийш сунгаж, «ойр» гэхдээ гараа ойртуулж үзүүл.",
   "examples":[{"chinese":"学校远吗？","pinyin":"Xuéxiào yuǎn ma?","mongolian":"Сургууль хол уу?"},{"chinese":"我的学校很近。","pinyin":"Wǒ de xuéxiào hěn jìn.","mongolian":"Миний сургууль ойрхон."},{"chinese":"车站就在旁边。","pinyin":"Chēzhàn jiù zài pángbiān.","mongolian":"Автобусны буудал яг хажууд байна."}],
   "common_mistakes":[{"wrong":"车站在哪儿旁边？","right":"车站在哪儿？","why":"«Хаана» гэж асуухдаа зөвхөн «在哪儿» гэнэ."}],
   "check":{"question":"«Миний сургууль ойрхон» хятадаар:","options":["我的学校很近。","我的学校很远。","我的学校在车站。"],"answer":"0"},
   "practice":[{"n":1,"question":"学校 ________ 吗？(хол)","answer":"远","explanation_mn":"«Хол» — 远."}]},
 ],
 "collocations":[{"type":"Тээвэр, зам","rows":[
   {"head":"坐","with":"公共汽车","mn":"автобусаар явах","usage_mn":"Суугаад явах тээвэрт «坐» гэнэ","example":{"zh":"我坐公共汽车去学校。","pinyin":"Wǒ zuò gōnggòng qìchē qù xuéxiào.","mn":"Би автобусаар сургуульдаа явдаг."}},
   {"head":"开","with":"车","mn":"машин жолоодох","usage_mn":"Өөрөө жолоодвол «开车»","example":{"zh":"哥哥自己开车去学校。","pinyin":"Gēge zìjǐ kāichē qù xuéxiào.","mn":"Ах өөрөө машин жолоодоод сургуульдаа явдаг."}},
   {"head":"走","with":"这条路","mn":"энэ замаар явах","usage_mn":"Замаар явахад «走»","example":{"zh":"去动物园走这条路。","pinyin":"Qù dòngwùyuán zǒu zhè tiáo lù.","mn":"Амьтны хүрээлэн рүү энэ замаар яв."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["公共汽车","车站","远","近","旁边"],"items":[
     {"n":1,"question":"我坐 ________ 去学校。","answer":"公共汽车","explanation_mn":"«Автобус» — 公共汽车."},
     {"n":2,"question":"________ 就在旁边。","answer":"车站","explanation_mn":"«Автобусны буудал» — 车站."},
     {"n":3,"question":"哥哥的学校有一点儿 ________ 。","answer":"远","explanation_mn":"«Жаахан холхон» — 有一点儿远."},
     {"n":4,"question":"我的学校很 ________ 。","answer":"近","explanation_mn":"«Ойрхон» — 很近."},
     {"n":5,"question":"车站就在 ________ 。","answer":"旁边","explanation_mn":"«Хажууд» — 旁边."}]}],
   "answer_source":"agent-authored (YCT 4 · 7-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"她每天怎么去学校？","answer":"坐公共汽车。","explanation_mn":"Яриа 1 — Мари «我坐公共汽车去学校» гэсэн. Ах нь өөрөө машин жолоодно."},
     {"n":2,"question_zh":"这条路能到动物园，对吗？","answer":"对。","explanation_mn":"Яриа 2 — хүү «对，但是有一点儿远» гэж хариулсан. Зам зөв, гэхдээ жаахан холхон."}],
   "answer_source":"textbook_verified (Let's read, х.34 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Bingo — зам заая","start_zh":"去学校走这条路。","instruction_mn":"3×3 нүдтэй цаас бэлд. Нүд бүрт 公共汽车, 动物园, 车站, 开, 对, 路, 远, 近, 旁边-ийн аль нэгийг зур. Нэг нь «去学校走这条路» гэх мэтээр хэлнэ, бусад нь сонссон үгээ тойруулна. Гурван үг нэг мөрөнд тойрвол «Bingo!» гэж хашгир!"},
     {"label":"Яаж явдаг вэ?","start_zh":"你们每天怎么去学校？","instruction_mn":"Найзаасаа «你们每天怎么去学校？» гэж асуу. Тэр «我坐……去学校» гэж хариулна. Дараа нь «学校远吗？» гэж асуу, тэр «很近» эсвэл «有一点儿远» гэнэ."},
     {"label":"Зам зааж өг","start_zh":"去动物园走这条路，对吗？","instruction_mn":"Найзтайгаа хос болж ээлжлэн зам зааж тогло. Нэг нь «去动物园走这条路，对吗？» гэж асууна. Нөгөө нь «对！» эсвэл «不对！» гэж хариулаад «车站就在旁边» гэж зааж өгнө."},
     {"label":"Автобусны дуу","start_zh":"我爱车，我爱车！","instruction_mn":"Эхлээд автобусны зургийг дуртай өнгөөрөө будаарай. Дараа нь гэрийнхэнтэйгээ дуулаарай. Нэг нь жолооч болж жолоо мушгиад, бусад нь «хүүхдүүд» болж суугаад дуулна."},
     {"label":"Автобус, машин, зам","start_zh":"开！","instruction_mn":"Нэг нь «开！» гэхэд бүгд жолоо мушгиж, «坐！» гэхэд суугаад, «走！» гэхэд алхана. Андуурсан нь гарна!"}]}},
 "grammarNotes":[],
 "culture":{"title":"公共汽车和地铁","title_mn":"Хятад хүүхдүүд сургуульдаа яаж явдаг вэ?","text_mn":"Хятадын том хотуудад хүмүүс маш олон тул автобус, метро (地铁) их хэрэглэгддэг. Олон хүүхэд аав ээжтэйгээ хамт эсвэл өөрөө автобусаар явдаг. Зарим хүүхэд сургуулиасаа ойрхон байвал алхаж, дугуйгаар явна. Улаанбаатарт ч гэсэн олон хүүхэд автобусаар эсвэл аав ээжийнхээ машинаар сургуульдаа явдаг даа.","note_mn":"Чи ямар тээврээр хамгийн их явдаг вэ? Хамгийн сонирхолтой тээвэр чинь юу вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — сургуульд яаж явдгаа хэлэх, замаа асуух.","topic":"Чи сургуульдаа яаж явдаг вэ?","discussion":["Хосоороо: «你们每天怎么去学校？» гэж асууж, «我坐……去学校» гэж хариул.","Бүгдээрээ «学校远吗？» гэж асууж, «很近» эсвэл «有一点儿远» гэж хариул."],
   "writing":{"promptChinese":"我坐……去学校。我的学校……。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «你们每天怎么去学校？» гэж хятадаар асуугаад хариултыг нь сонс.","minChars":"0","requiredWords":["坐","学校"],"sampleChinese":"我坐公共汽车去学校，我的学校很近。","sampleMongolian":"Би автобусаар сургуульдаа явдаг, миний сургууль ойрхон.","gradingRubric":"坐 ба 去-г зөв дарааллаар хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 4 · Test Answers: L7 1.C 2.B 3.B 4.C 5.D 6.A 7.B 8.C","parts":[]},
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
 {"point":"你们每天怎么去学校？ · 我坐……去学校","gloss_mn":"«Та нар сургуульдаа яаж явдаг вэ?» — тээврээр явах",
  "structure":"我坐 + автобус/…… + 去 + хаашаа",
  "teacher_mn":"Найзаасаа яаж явдгийг нь асуухдаа «你们每天怎么去学校？» гэнэ. «怎么» гэдэг нь «яаж». Хариулахдаа «我坐公共汽车去学校» гэнэ. Эхлээд яаж явахаа, дараа нь «去» гэж хэлдэг шүү. Өөрөө жолоодвол «开车» гэнэ.",
  "teacher_notes":"Номын яриа 1: 你们每天怎么去学校？ 我坐公共汽车去学校，哥哥自己开车去学校。",
  "examples":[ex("你们每天怎么去学校？","Nǐmen měitiān zěnme qù xuéxiào?","Та нар өдөр бүр сургуульдаа яаж явдаг вэ?"),ex("我坐公共汽车去学校。","Wǒ zuò gōnggòng qìchē qù xuéxiào.","Би автобусаар сургуульдаа явдаг."),ex("哥哥自己开车去学校。","Gēge zìjǐ kāichē qù xuéxiào.","Ах өөрөө машин жолоодоод сургуульдаа явдаг."),ex("你可以坐公共汽车。","Nǐ kěyǐ zuò gōnggòng qìchē.","Чи автобусаар явж болно.")],
  "common_mistakes":[{"wrong":"我去学校坐公共汽车。","right":"我坐公共汽车去学校。","why":"«坐公共汽车» нь «去»-ийн өмнө орно."}],
  "check":chk("«Та нар яаж явдаг вэ?» хятадаар:",["你们怎么去学校？","学校远吗？","车站在哪儿？"],"你们怎么去学校？","g1c"),
  "exercises":[
   choice("我 ________ 公共汽车去学校。",["坐","吃","看"],"坐","Зөв! Автобусаар явахад 坐 гэнэ.","Автобусаар суугаад явахад 坐 гэнэ. 吃 = идэх, 看 = харах.","g1e1"),
   choice("«Ах өөрөө машин жолооддог» хятадаар:",["哥哥自己开车。","哥哥坐公共汽车。","哥哥在车站。"],"哥哥自己开车。","Зөв! 开车 = машин жолоодох.","自己 = өөрөө, 开车 = жолоодох.","g1e2"),
   judge("«怎么去学校？» гэдэг нь «сургууль руу яаж явдаг вэ?» гэсэн асуулт.",True,"Зөв! 怎么 = яаж.","怎么 = яаж.")]},
 {"point":"去动物园走这条路，对吗？","gloss_mn":"«Амьтны хүрээлэн рүү энэ замаар явдаг биз дээ?» — замаа шалгах",
  "structure":"去 + хаашаа + 走这条路，对吗？ → 对 / 不对",
  "teacher_mn":"Явах замаа мэдэхгүй бол «去动物园走这条路，对吗？» гэж асуу. Зөв бол «对», буруу бол «不对» гэж хариулна. Замыг тоолохдоо «条» гэнэ: «一条路». «但是» гэвэл «гэхдээ» гэсэн үг.",
  "teacher_notes":"Номын яриа 2: 去动物园走这条路，对吗？ 对，但是有一点儿远，你可以坐公共汽车。",
  "examples":[ex("去动物园走这条路，对吗？","Qù dòngwùyuán zǒu zhè tiáo lù, duì ma?","Амьтны хүрээлэн рүү энэ замаар явдаг биз дээ?"),ex("对，但是有一点儿远。","Duì, dànshì yǒu yìdiǎnr yuǎn.","Тийм, гэхдээ жаахан холхон."),ex("车站在哪儿？","Chēzhàn zài nǎr?","Автобусны буудал хаана байдаг вэ?"),ex("车站就在旁边。","Chēzhàn jiù zài pángbiān.","Автобусны буудал яг хажууд байна.")],
  "common_mistakes":[{"wrong":"一个路","right":"一条路","why":"Зам тоолохдоо «条» гэнэ."}],
  "check":chk("«Энэ замаар явдаг биз дээ?» гэж асуух нь:",["走这条路，对吗？","学校远吗？","我坐公共汽车。"],"走这条路，对吗？","g2c"),
  "exercises":[
   choice("走这 ________ 路，对吗？",["条","个","吗"],"条","Зөв! 一条路 = нэг зам.","Зам тоолохдоо 条 гэнэ.","g2e1"),
   choice("Замыг зөв гэж хэлэхдээ:",["对","不对","远"],"对","Зөв! 对 = зөв.","对 = зөв, 不对 = буруу.","g2e2"),
   judge("«车站就在旁边» гэдэг нь «автобусны буудал яг хажууд» гэсэн үг.",True,"Зөв! 旁边 = хажууд.","旁边 = хажууд.")]},
 {"point":"学校远吗？ · 很近 · 有一点儿远","gloss_mn":"«Сургууль хол уу?» — хол, ойр хэлэх",
  "structure":"学校远吗？ → 很近 / 有一点儿远",
  "teacher_mn":"Хол ойрыг асуухдаа «学校远吗？» гэнэ. Ойрхон бол «很近», жаахан холхон бол «有一点儿远» гэж хариулна. «远» хол, «近» ойр гэсэн үг. Гараа сунгаж хол, ойртуулж ойр гэж үзүүл.",
  "teacher_notes":"Номын яриа 1: 学校远吗？ 我的学校很近，哥哥的学校有一点儿远。",
  "examples":[ex("学校远吗？","Xuéxiào yuǎn ma?","Сургууль хол уу?"),ex("我的学校很近。","Wǒ de xuéxiào hěn jìn.","Миний сургууль ойрхон."),ex("哥哥的学校有一点儿远。","Gēge de xuéxiào yǒu yìdiǎnr yuǎn.","Ахын сургууль жаахан холхон."),ex("你可以坐公共汽车。","Nǐ kěyǐ zuò gōnggòng qìchē.","Чи автобусаар явж болно.")],
  "common_mistakes":[{"wrong":"我的学校很远近。","right":"我的学校很近。","why":"Нэг л үг сонгоно: «近» эсвэл «远»."}],
  "check":chk("«Сургууль хол уу?» хятадаар:",["学校远吗？","学校近吗？","学校在哪儿？"],"学校远吗？","g3c"),
  "exercises":[
   choice("我的学校很 ________ 。(ойр)",["近","远","对"],"近","Зөв! 近 = ойр.","近 = ойр, 远 = хол.","g3e1"),
   choice("«Жаахан холхон» хятадаар:",["有一点儿远","很近","就在旁边"],"有一点儿远","Зөв! 有一点儿 = жаахан.","远 = хол.","g3e2"),
   judge("«近» гэдэг нь «хол» гэсэн үг.",False,"Зөв! 近 = ойр, 远 = хол.","近 = ойр, 远 = хол.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Нийтийн автобус» хятадаар аль нь вэ?",["公共汽车","动物园","车站","学校"],"公共汽车","公共汽车 (gōnggòng qìchē) = нийтийн автобус.","easy",["vocabulary"],"b1")
q("choice","«Амьтны хүрээлэн» хятадаар аль нь вэ?",["动物园","车站","学校","朋友"],"动物园","动物园 (dòngwùyuán) = амьтны хүрээлэн.","easy",["vocabulary"],"b2")
q("choice","«Автобусны буудал» хятадаар аль нь вэ?",["车站","动物园","公共汽车","旁边"],"车站","车站 (chēzhàn) = автобусны буудал.","easy",["vocabulary"],"b3")
q("choice","«Жолоодох» хятадаар аль нь вэ?",["开","对","路","远"],"开","开 (kāi) = жолоодох. 开车 = машин жолоодох.","easy",["vocabulary"],"b4")
q("choice","«Зам» хятадаар аль нь вэ?",["路","远","近","对"],"路","路 (lù) = зам.","easy",["vocabulary"],"b5")
q("choice","«远» гэдэг үг ямар утгатай вэ?",["хол","ойр","зөв","хажууд"],"хол","远 (yuǎn) = хол.","easy",["vocabulary"],"b6")
q("choice","«近» гэдэг үг ямар утгатай вэ?",["ойр","хол","зөв","зам"],"ойр","近 (jìn) = ойр.","easy",["vocabulary"],"b7")
q("choice","«旁边» гэдэг үг ямар утгатай вэ?",["хажууд","хол","зам","буудал"],"хажууд","旁边 (pángbiān) = хажууд, дэргэд.","easy",["vocabulary"],"b8")
q("choice","«对» гэдэг үг ямар утгатай вэ?",["зөв","хол","жолоодох","хажууд"],"зөв","对 (duì) = зөв.","easy",["vocabulary"],"b9")
q("choice","«一条路» гэдэг дэх «条» нь юуг тоолох үг вэ?",["зам","амьтан","ном","хүн"],"зам","条 (tiáo) — зам, гол зэргийг тоолно.","medium",["vocabulary"],"b10")
q("choice","Пиньинь «gōnggòng qìchē» гэж уншдаг үг:",["公共汽车","动物园","车站","学校"],"公共汽车","公共汽车 = gōnggòng qìchē.","medium",["pronunciation"],"b11")
q("choice","Пиньинь «dòngwùyuán» гэж уншдаг үг:",["动物园","公共汽车","车站","旁边"],"动物园","动物园 = dòngwùyuán.","medium",["pronunciation"],"b12")
q("choice","Пиньинь «chēzhàn» гэж уншдаг үг:",["车站","动物园","旁边","学校"],"车站","车站 = chēzhàn.","medium",["pronunciation"],"b13")
q("choice","Пиньинь «pángbiān» гэж уншдаг үг:",["旁边","车站","远","近"],"旁边","旁边 = pángbiān.","medium",["pronunciation"],"b14")
q("choice","«Та нар сургуульдаа яаж явдаг вэ?» хятадаар:",["你们每天怎么去学校？","学校远吗？","车站在哪儿？","对吗？"],"你们每天怎么去学校？","怎么 = яаж.","easy",["dialogue"],"b15")
q("choice","«我坐公共汽车去学校» гэж юу гэсэн үг вэ?",["Би автобусаар сургуульдаа явдаг.","Би өөрөө машин жолооддог.","Миний сургууль хол.","Би амьтны хүрээлэн рүү явна."],"Би автобусаар сургуульдаа явдаг.","坐公共汽车 = автобусаар явах.","medium",["dialogue"],"b16")
q("choice","Яриа 1-д Мариын ах сургуульдаа яаж явдаг вэ?",["Өөрөө машин жолоодоод","Автобусаар","Алхаж","Дугуйгаар"],"Өөрөө машин жолоодоод","哥哥自己开车去学校。","medium",["dialogue"],"b17")
q("choice","Мариын сургууль ойрхон уу, холхон уу?",["Ойрхон","Холхон","Амьтны хүрээлэнд байдаг","Буудал дээр байдаг"],"Ойрхон","我的学校很近。","medium",["dialogue"],"b18")
q("choice","Яриа 2-т автобусны буудал хаана байдаг вэ?",["Яг хажууд","Маш хол","Сургууль дотор","Амьтны хүрээлэнд"],"Яг хажууд","车站就在旁边。","medium",["dialogue"],"b19")
q("cloze","我（ ）公共汽车去学校。",["坐","吃","吗","近"],"坐","坐公共汽车 = автобусаар явах.","easy",["structure"],"b20")
q("cloze","哥哥自己（ ）车去学校。",["开","吃","远","对"],"开","开车 = машин жолоодох.","easy",["structure"],"b21")
q("cloze","走这（ ）路，对吗？",["条","个","只","本"],"条","一条路 = нэг зам.","medium",["structure"],"b22")
q("cloze","学校（ ）吗？",["远","车站","公共汽车","旁边"],"远","学校远吗？ = Сургууль хол уу?","medium",["structure"],"b23")
q("cloze","去动物园走这条路，（ ）吗？",["对","远","近","开"],"对","对吗？ = зөв үү?","medium",["structure"],"b24")
q("usage","Найз чинь «你们每天怎么去学校？» гэж асууж байна. Чи автобусаар явдаг бол:",["我坐公共汽车去学校。","车站在旁边。","学校很远吗？","对，走这条路。"],"我坐公共汽车去学校。","我坐…… 去 = …-аар явдаг.","medium",["usage"],"b25")
q("usage","Амьтны хүрээлэн рүү явах замаа шалгах бол:",["去动物园走这条路，对吗？","我坐公共汽车。","学校很近。","车站在哪儿？"],"去动物园走这条路，对吗？","对吗 = зөв үү?","medium",["usage"],"b26")
q("usage","Автобусны буудлаа олохгүй байна. Асуух нь:",["车站在哪儿？","学校远吗？","你开车吗？","对吗？"],"车站在哪儿？","在哪儿 = хаана.","medium",["usage"],"b27")
q("usage","Сургууль чинь гэрээс маш ойрхон. Хэлэх нь:",["我的学校很近。","我的学校很远。","我开车去。","车站有一点儿远。"],"我的学校很近。","近 = ойр.","medium",["usage"],"b28")
q("usage","Амьтны хүрээлэн жаахан холхон байвал хэлэх нь:",["有一点儿远，你可以坐公共汽车。","很近，走路去。","车站就在旁边。","我自己开车。"],"有一点儿远，你可以坐公共汽车。","有一点儿远 = жаахан холхон.","hard",["usage"],"b29")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
ABC = ["A","B","C"]; BANK = ["A","B","C","D"]
BANK2 = [img("t2a"),img("t2b"),img("t2c"),img("t2d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (07-04) сонсоод зөв хариуг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）A 不知道　B 对　C 不对","script_zh":"女：走这条路，对吗？ 男：不对，你的车不能开进去。 问：男的觉得走这条路对吗？","question_mn":"Сонголт: A «мэдэхгүй» · B «зөв» · C «буруу»","options":ABC,"answer":"C","explanation_mn":"Эмэгтэй «Энэ замаар явна, зөв үү?» гэж асуухад эрэгтэй «不对» (буруу) гэсэн: машин энэ замаар орж болохгүй. Тэгэхээр хариу C «不对». B «зөв» биш, A «мэдэхгүй» гэж хэлээгүй."},
    {"n":2,"question_zh":"（听录音）A 动物园　B 车站　C 学校","script_zh":"男：我开车送你到车站吧。 女：时间还早，我坐公共汽车就可以。 问：男的想送女的到哪儿？","question_mn":"Сонголт: A амьтны хүрээлэн · B автобусны буудал · C сургууль","options":ABC,"answer":"B","explanation_mn":"Эрэгтэй «Би чамайг машинаар буудал хүртэл хүргэе» гэсэн. 车站 = автобусны буудал, тэгэхээр B. Эмэгтэй автобусаар явна гэж татгалзсан."},
    {"n":3,"question_zh":"（听录音）A 很远　B 很近　C 不知道","script_zh":"男：学校到车站远吗？ 女：很近，走5分钟就能到。 问：女的觉得学校到车站远吗？","question_mn":"Сонголт: A «маш хол» · B «маш ойр» · C «мэдэхгүй»","options":ABC,"answer":"B","explanation_mn":"Эмэгтэй «很近» (маш ойр), алхаад 5 минутад хүрнэ гэсэн. Тэгэхээр B. «远» гэж хэлээгүй тул A биш."},
    {"n":4,"question_zh":"（听录音）A 学校前边　B 学校后边　C 学校旁边","script_zh":"男：那个商店远不远？我想去看看。 女：不远，就在学校旁边。 问：商店在哪儿？","question_mn":"Сонголт: A сургуулийн урд · B сургуулийн ард · C сургуулийн хажууд","options":ABC,"answer":"C","explanation_mn":"Эмэгтэй «不远，就在学校旁边» гэсэн: хол биш, сургуулийн хажууд. 旁边 = хажууд, тэгэхээр C."}],
   "answer_source":"YCT 4 Test Answers L7: 1.C 2.B 3.B 4.C"},
  {"part":2,"type":"choice","instruction_mn":"Унших — яриа бүрд тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"A：您好，您知道去动物园的路吗？ B：知道。就在前边，再走5分钟就到了。","question_mn":"— Сайн байна уу, амьтны хүрээлэн рүү явах замыг мэдэх үү? — Мэднэ. Яг урд байна, 5 минут алхахад хүрнэ.","options":BANK,"optionImages":BANK2,"answer":"D","explanation_mn":"Яриа зам заах тухай (路). D зураг дээр ой дундуур гарсан урт зам байна. A автобус, B панда, C багш ба сурагч — замын тухай биш."},
    {"n":6,"question_zh":"A：你们怎么去动物园？ B：坐公共汽车。","question_mn":"— Та нар амьтны хүрээлэн рүү яаж явах вэ? — Автобусаар явна.","options":BANK,"optionImages":BANK2,"answer":"A","explanation_mn":"«坐公共汽车» = автобусаар явна. A зураг дээр автобус буудал дээр зогсож байна."},
    {"n":7,"question_zh":"A：你见过大熊猫吗？ B：我在动物园见过，很可爱。","question_mn":"— Чи том панда харж байсан уу? — Би амьтны хүрээлэнд харсан, их хөөрхөн.","options":BANK,"optionImages":BANK2,"answer":"B","explanation_mn":"大熊猫 = том панда. B зураг дээр панда байна."},
    {"n":8,"question_zh":"A：你妈妈旁边那个人是谁？ B：是她的学生。","question_mn":"— Ээжийн чинь хажууд байгаа тэр хүн хэн бэ? — Тэр бол ээжийн сурагч.","options":BANK,"optionImages":BANK2,"answer":"C","explanation_mn":"Ээж нь багш, хажууд нь сурагч нь байна. C зураг дээр багш самбар дэргэд сурагчтайгаа зогсож байна."}],
   "answer_source":"YCT 4 Test Answers L7: 5.D 6.A 7.B 8.C"},
  {"part":3,"type":"choice","instruction_mn":"Let's guess — энэ тээврийн хэрэгслийн нэрийг сонго. A 公共汽车 · B 校车 · C 大巴车 · D 双层巴士","items":[
    {"n":1,"question_zh":"1-р зураг: цэнхэр цагаан хотын автобус","image":img("g1"),"options":BANK,"answer":"A","explanation_mn":"Цэнхэр цагаан, хотод явдаг автобус нь 公共汽车."},
    {"n":2,"question_zh":"2-р зураг: ягаан том автобус","image":img("g2"),"options":BANK,"answer":"C","explanation_mn":"Холын аялалд явдаг том автобус нь 大巴车."},
    {"n":3,"question_zh":"3-р зураг: шар автобус","image":img("g3"),"options":BANK,"answer":"B","explanation_mn":"Шар автобус нь сургуулийн автобус — 校车."},
    {"n":4,"question_zh":"4-р зураг: улаан хоёр давхар автобус","image":img("g4"),"options":BANK,"answer":"D","explanation_mn":"Хоёр давхар автобус нь 双层巴士."}],
   "answer_source":"Let's guess х.35 (хариу зургаар тааруулсан)"},
  {"part":4,"type":"choice","instruction_mn":"Let's find — мөр бүрийн дүрмийг ажиглаад «?» дээр орох зургийг A, B, C, D-ээс сонго. A 车站 · B 路 · C 公共汽车 · D 开","image":img("find"),"items":[
    {"n":1,"question_zh":"公共汽车 · 动物园 · 车站 · 公共汽车 · 动物园 · ？","options":BANK,"answer":"A","explanation_mn":"Гурвыг давтана: автобус, амьтны хүрээлэн, буудал. Дараагийнх нь буудал — A 车站."},
    {"n":2,"question_zh":"动物园 · 车站 · 公共汽车 · 动物园 · 车站 · ？","options":BANK,"answer":"C","explanation_mn":"Амьтны хүрээлэн, буудал, автобус гэж давтана. Дараагийнх нь автобус — C 公共汽车."},
    {"n":3,"question_zh":"车站 · 开 · 车站 · 开 · 车站 · ？","options":BANK,"answer":"D","explanation_mn":"Буудал, жолоодох хоёр ээлжлэнэ. Дараагийнх нь жолоодох — D 开."},
    {"n":4,"question_zh":"对 · 路 · 对 · 路 · 对 · ？","options":BANK,"answer":"B","explanation_mn":"Зөв тэмдэг, зам хоёр ээлжлэнэ. Дараагийнх нь зам — B 路."}],
   "answer_source":"Let's find х.36 (логик дараалал, хариу дүрмээс)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «车站» гэсэн ханзыг дахин бичиж хуул.","question_zh":"车站","answer":"车站","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа сургуульд яаж явдгийг нь асуу, дараа нь хол ойрыг нь асуу.","question_zh":"你们每天怎么去学校？ 学校远吗？","answer":"我坐……去学校。","explanation_mn":"Хосоороо ээлжлэн. «很近» эсвэл «有一点儿远» гэж хариул."},
   {"n":2,"prompt_mn":"Bingo — багшийн хэлсэн замын үгийг тойруул.","question_zh":"去学校走这条路。","answer":"(нээлттэй)","explanation_mn":"3 үг мөрөнд тойрвол «Bingo!» гэж хашгир."},
   {"n":3,"prompt_mn":"Дууг жолоо мушгиж буй хөдөлгөөнтэй дуул.","question_zh":"我爱车，我爱车，我爱开公共汽车。","answer":"(нээлттэй)","explanation_mn":"Аудио 07-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 4 · Test Listening Scripts, Test Answers (Lesson 7)"}
dump("workbook.json", workbook)

# ---------------- IMAGE PROMPTS ----------------
NOTXT = " No English text in the image."
def P(file,aspect,title,section,prompt,chars,role=None):
    d={"file":file,"aspect":aspect,"title":title,"section":section,"prompt":prompt+NOTXT,"chars":chars}
    if role: d["role"]=role
    return d
W = [
 ("gonggongqiche","公共汽车","A bright blue and white city bus stopped at a bus stop, the young camel calf boy waving from the window.",["huu"]),
 ("dongwuyuan","动物园","A cheerful zoo entrance gate with a lion and a panda peeking out, the young camel calf girl pointing at it.",["ohin"]),
 ("chezhan","车站","A bus stop shelter with a bench, the green-hat camel calf boy waiting there with a backpack.",["bor"]),
 ("kai","开","The yellow camel calf boy driving a little toy car with both hands on the steering wheel, big smile.",["huu"]),
 ("dui","对","The camel calf girl holding up a big green check mark card, smiling.",["ohin"]),
 ("lu","路","A long winding road through green hills, the little camel calf boy walking on it with a backpack.",["bor"]),
 ("yuan","远","A tiny school far away in the distance on a hill, the camel calf boy looking out with a hand over his eyes.",["huu"]),
 ("jin","近","A school right next to a house, the camel calf girl standing close to it, happy.",["ohin"]),
 ("pangbian","旁边","The camel calf boy standing right beside a big tree, the camel calf girl beside him, close together.",["huu","ohin"]),
 ("tiao","条","One long road drawn clearly, the camel calf boy pointing at it with one finger up.",["huu"]),
 ("zuo","坐","The camel calf boy sitting in a bus seat by the window, looking outside.",["bor"]),
 ("zenme","怎么","The camel calf girl with a big question mark above her head, looking at a bus, a bicycle and a car on the road.",["ohin"]),
]
prompts = [
 P("images/hero.jpg","4:3","你们每天怎么去学校？","teacher-intro","Teacher Camel (a yellow camel with glasses) drives a cute yellow school bus on a sunny road toward a school, the yellow camel calf boy, the camel calf girl in a yellow dress and the green-hat camel calf boy wave happily from the windows; a speech bubble with the Chinese text 你们每天怎么去学校？ in large clear black font.",["temee","huu","ohin","bor"],"hero"),
] + [P(f"images/w-{k}.jpg","1:1",z,"vocabulary",p,c) for k,z,p,c in W] + [
 P("images/d1.jpg","4:3","你们每天怎么去学校？","dialogue","At a bus stop, the yellow camel calf boy asks the camel calf girl a question, a yellow car with an adult camel brother driving passes behind and a bus is coming; speech bubble with the Chinese text 你们每天怎么去学校？ in large clear black font.",["huu","ohin"]),
 P("images/d2.jpg","4:3","去动物园走这条路，对吗？","dialogue","Two camel calf girls hold a map on a path and point at a road, the green-hat camel calf boy stands by a bus stop shelter and points to it, a bus stop sign nearby; speech bubble with the Chinese text 去动物园走这条路，对吗？ in large clear black font.",["ohin","bor","huu"]),
 P("images/song.jpg","4:3","我爱开公共汽车","song","The camel calf children sit on a happy blue bus, Teacher Camel drives with a big smile and hands on the wheel, music notes floating in the air, zoo gate visible ahead.",["temee","huu","ohin","bor"]),
]
dump("image_prompts.json", prompts, BASE)

# ---------------- LESSON / MANIFEST ----------------
images = [{"id":p["file"].split("/")[1].rsplit(".",1)[0],"file":p["file"],"title":p["title"],"role":p.get("role","illustration"),"section":p["section"]} for p in prompts]
images += [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["2a","2b","2c","2d"]]
images += [{"id":k,"file":f"images/{k}.png","title":t,"role":"illustration","section":"workbook"} for k,t in [("g1","Let's guess 1"),("g2","Let's guess 2"),("g3","Let's guess 3"),("g4","Let's guess 4"),("find","Let's find"),("bus","Let's draw · 公共汽车")]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 4 · 7-р хичээл — Та нар сургуульдаа яаж явдаг вэ?","chineseTitle":"你们每天怎么去学校？","targetTitle":"你们每天怎么去学校？","mongolianTitle":"Та нар өдөр бүр сургуульдаа яаж явдаг вэ?",
 "subtitle":"公共汽车 · 动物园 · 车站 · 远 · 近 · «我爱开公共汽车» дуу",
 "description":f"Сургуульдаа яаж явдгаа хэлж, замаа асууж, хол ойрыг хэлж сурна. {len(vocab)} үг, 2 зурагт яриа, автобусны дуу, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🚌","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 4",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 4 — 第7课《你们每天怎么去学校？》 [hskLevel=2] [lessonNumber=7]; эх: сурах бичиг х.33–37; аудио CD 07-01…07-04 (бүгд байгаа)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你们每天怎么去学校？","mongolianTitle":"Та нар өдөр бүр сургуульдаа яаж явдаг вэ?",
 "series":"YCT 标准教程 4","seriesLabel_mn":"YCT 4 — Хүүхдийн хятад хэл (≈HSK2–3)",
 "source":"YCT 标准教程 4 · 第7课 (сурах бичиг + CD аудио 07-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L7)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
