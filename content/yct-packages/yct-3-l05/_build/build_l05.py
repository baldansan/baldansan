#!/usr/bin/env python3
"""YCT 标准教程 3 · 第5课 再吃几个。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
OUT = "/home/claude/work/yct3/l05/pkg"
CID, LID, N = "yct-3", "yct-3-l05", 5
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

# Тестийн зураг (hi-29.png): Reading 5–8 зураг A..D
from PIL import Image
_pg = Image.open("/home/claude/work/yct3/l05/pages/hi-29.png").convert("RGB")
_BOX = {"t2a":(450,765,575,955),"t2b":(845,780,985,960),"t2c":(415,975,600,1130),"t2d":(870,985,1040,1140)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")

AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_TEST = "audio/yct-3-05-01.mp3","audio/yct-3-05-02.mp3","audio/yct-3-05-03.mp3","audio/yct-3-05-05.mp3"
AUD_MAIN = "audio/yct-3-05-text-song.mp3"
_a = f"{OUT}/audio"
if os.path.exists(f"{_a}/yct-3-05-02.mp3") and os.path.exists(f"{_a}/yct-3-05-03.mp3"):
    open(f"{_a}/_list.txt","w").write(f"file '{_a}/yct-3-05-02.mp3'\nfile '{_a}/yct-3-05-03.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",f"{_a}/_list.txt","-c:a","libmp3lame","-q:a","4",f"{_a}/yct-3-05-text-song.mp3"],check=True)
    os.remove(f"{_a}/_list.txt")

# ---------------- VOCAB ----------------
VOCAB = [
 ("面条儿","miàntiáor","гоймон","нэр үг · гол үг","奶奶，有面条儿吗？","Nǎinai, yǒu miàntiáor ma?","Эмээ ээ, гоймон байна уу?",True),
 ("饺子","jiǎozi","банш (хятад банш)","нэр үг · гол үг","我最爱吃饺子。","Wǒ zuì ài chī jiǎozi.","Би банш идэх хамгийн их дуртай.",True),
 ("饿","è","өлсөх","тэмдэг нэр · гол үг","奶奶，我饿了。","Nǎinai, wǒ è le.","Эмээ ээ, би өлсөж байна.",True),
 ("想","xiǎng","хүсэх, идмээр байх","туслах үг · гол үг","你想吃吗？","Nǐ xiǎng chī ma?","Чи идмээр байна уу?",True),
 ("最","zuì","хамгийн","дайвар үг · гол үг","我最爱吃奶奶做的饺子。","Wǒ zuì ài chī nǎinai zuò de jiǎozi.","Би эмээгийн хийсэн баншинд хамгийн их дуртай.",True),
 ("给","gěi","өгөх","үйл үг · гол үг","好，给你。","Hǎo, gěi nǐ.","За, ав даа.",True),
 ("再","zài","дахиад","дайвар үг · гол үг","再吃几个。","Zài chī jǐ ge.","Дахиад хэдэн ширхэг ид.",True),
 ("饱","bǎo","цадах","тэмдэг нэр · гол үг","不吃了，太饱了。","Bù chī le, tài bǎo le.","Больё, би хэтэрхий цадчихлаа.",True),
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
 {"id":1,"title_mn":"Яриа 1 · Эмээгийн гал тогоонд","scene_mn":"Хүү сургуулиасаа ирээд өлсөж байна. Эмээ нь гал тогоонд банш хийчихсэн, таваг барьж зогсож байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"奶奶，我饿了，有面条儿吗？","pinyin":"Nǎinai, wǒ è le, yǒu miàntiáor ma?","mn":"Эмээ ээ, би өлсөөд байна. Гоймон байна уу?"},
           {"speaker":"奶奶","zh":"奶奶做了饺子，你想吃吗？","pinyin":"Nǎinai zuò le jiǎozi, nǐ xiǎng chī ma?","mn":"Эмээ банш хийсэн. Чи идмээр байна уу?"},
           {"speaker":"小明","zh":"想吃，我最爱吃奶奶做的饺子。","pinyin":"Xiǎng chī, wǒ zuì ài chī nǎinai zuò de jiǎozi.","mn":"Идмээр байна. Би эмээгийн хийсэн баншинд хамгийн их дуртай."},
           {"speaker":"奶奶","zh":"好，给你。","pinyin":"Hǎo, gěi nǐ.","mn":"За, ав даа."}]},
 {"id":2,"title_mn":"Яриа 2 · Баярлалаа, эмээ!","scene_mn":"Хүү банш идээд эмээгээ тэвэрч байна. Эмээ нь дахиад идүүлэх гэж байхад хүү цадчихсан.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"奶奶，谢谢您，饺子太好吃了！","pinyin":"Nǎinai, xièxie nín, jiǎozi tài hǎochī le!","mn":"Эмээ ээ, баярлалаа. Банш үнэхээр амттай юм!"},
           {"speaker":"奶奶","zh":"再吃几个。","pinyin":"Zài chī jǐ ge.","mn":"Дахиад хэдэн ширхэг ид."},
           {"speaker":"小明","zh":"不吃了，太饱了。","pinyin":"Bù chī le, tài bǎo le.","mn":"Больё, би хэтэрхий цадчихлаа."}]},
]
sentences=[]
dlg = [
 (1,"小明：奶奶，我饿了，有面条儿吗？","Xiǎo Míng: Nǎinai, wǒ è le, yǒu miàntiáor ma?","Сяо Мин: Эмээ ээ, би өлсөөд байна. Гоймон байна уу?","小明：| 奶奶|nǎinai ，| 我|wǒ 饿|è 了|le ，| 有|yǒu 面条儿|miàntiáor 吗|ma ？|","饿 = өлсөх. «我饿了» гэвэл «би өлслөө» гэсэн үг. Гэдсээ барьж хэлээд үз!",[]),
 (1,"奶奶：奶奶做了饺子，你想吃吗？","Nǎinai: Nǎinai zuò le jiǎozi, nǐ xiǎng chī ma?","Эмээ: Эмээ банш хийсэн. Чи идмээр байна уу?","奶奶：| 奶奶|nǎinai 做|zuò 了|le 饺子|jiǎozi ，| 你|nǐ 想|xiǎng 吃|chī 吗|ma ？|","想 = хүсэх. «想吃» — идмээр байна.",[]),
 (1,"小明：想吃，我最爱吃奶奶做的饺子。","Xiǎo Míng: Xiǎng chī, wǒ zuì ài chī nǎinai zuò de jiǎozi.","Сяо Мин: Идмээр байна. Би эмээгийн хийсэн баншинд хамгийн их дуртай.","小明：| 想|xiǎng 吃|chī ，| 我|wǒ 最|zuì 爱|ài 吃|chī 奶奶|nǎinai 做|zuò 的|de 饺子|jiǎozi 。|","最爱 = хамгийн их дуртай. Энэ бол хичээлийн гол өгүүлбэр!",["我最爱吃饺子。"]),
 (1,"奶奶：好，给你。","Nǎinai: Hǎo, gěi nǐ.","Эмээ: За, ав даа.","奶奶：| 好|hǎo ，| 给|gěi 你|nǐ 。|","给你 = «ав даа». Юм өгөхдөө хоёр гараараа өг!",[]),
 (2,"小明：奶奶，谢谢您，饺子太好吃了！","Xiǎo Míng: Nǎinai, xièxie nín, jiǎozi tài hǎochī le!","Сяо Мин: Эмээ ээ, баярлалаа. Банш үнэхээр амттай юм!","小明：| 奶奶|nǎinai ，| 谢谢|xièxie 您|nín ，| 饺子|jiǎozi 太|tài 好吃|hǎochī 了|le ！|","您 = «та». Эмээ, багш шиг эрхэм хүнд хэлнэ.",[]),
 (2,"奶奶：再吃几个。","Nǎinai: Zài chī jǐ ge.","Эмээ: Дахиад хэдэн ширхэг ид.","奶奶：| 再|zài 吃|chī 几个|jǐ ge 。|","再 = дахиад. Хятадууд зочиндоо «再吃几个» гэж байнга хэлдэг.",["再吃几个。"]),
 (2,"小明：不吃了，太饱了。","Xiǎo Míng: Bù chī le, tài bǎo le.","Сяо Мин: Больё, би хэтэрхий цадчихлаа.","小明：| 不|bù 吃|chī 了|le ，| 太|tài 饱|bǎo 了|le 。|","饱 = цадах. 不吃了 = «больё, идэхгүй».",[]),
 (3,"女：我饿了，吃饺子。","Nǚ: Wǒ è le, chī jiǎozi.","Охин: Би өлслөө, банш идье.","女：| 我|wǒ 饿|è 了|le ，| 吃|chī 饺子|jiǎozi 。|","Let's chant — гэдсээ илж, баншаа идэж байгаа дүр үзүүлээд хэл!",[]),
 (3,"女：你饿了，吃什么？","Nǚ: Nǐ è le, chī shénme?","Охин: Чи өлссөн бол юу идэх вэ?","女：| 你|nǐ 饿|è 了|le ，| 吃|chī 什么|shénme ？|","",[]),
 (3,"男：米饭面条儿我最爱，","Nán: Mǐfàn miàntiáor wǒ zuì ài,","Хүү: Будаа, гоймонд би хамгийн их дуртай,","男：| 米饭|mǐfàn 面条儿|miàntiáor 我|wǒ 最|zuì 爱|ài ，|","米饭 = чанасан цагаан будаа.",[]),
 (3,"男：饺子包子也喜欢。","Nán: Jiǎozi bāozi yě xǐhuan.","Хүү: банш, бууздаа ч бас дуртай.","男：| 饺子|jiǎozi 包子|bāozi 也|yě 喜欢|xǐhuan 。|","",[]),
 (3,"女：再吃一个饺子吧？","Nǚ: Zài chī yí ge jiǎozi ba?","Охин: Дахиад нэг банш идэх үү?","女：| 再|zài 吃|chī 一个|yí ge 饺子|jiǎozi 吧|ba ？|","吧 = «тэгье л дээ» гэж санал болгох үг.",[]),
 (3,"男：不吃了，太饱了！","Nán: Bù chī le, tài bǎo le!","Хүү: Больё, хэтэрхий цадчихлаа!","男：| 不|bù 吃|chī 了|le ，| 太|tài 饱|bǎo 了|le ！|","Төгсгөлд гэдсээ тачигнатал алгадаад «太饱了！» гэж хашгир!",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)

texts = {
 "unit":{"number":"5","title":"再吃几个。","mongolianTitle":"Дахиад хэдэн ширхэг идээрэй — өлсөх, цадах, хоолны дуртай зүйлээ хэлэх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх номнуудад чи гэр бүл, тоо, өнгө, цаг, спортын тухай сурсан даа. Одоо чамаас асууя: чи өлссөн үедээ юу идмээр санагддаг вэ? Хэнийх нь хийсэн хоол чамд хамгийн амттай вэ? Өнөөдөр «我饿了» гэж өлссөнөө хэлж, «我最爱吃饺子» гэж хамгийн дуртай хоолоо хэлж сурна. Эмээ «再吃几个» гэж дахиад идүүлэх үед «不吃了，太饱了» гэж эелдэгээр хэлэхийг ч мэдэх болно. Мөн хоолны самбарт тоглож, гэдсээ алгадан дуулна! Эхэлцгээе!",
  "warmup_mn":"Чи хамгийн их юу идэх дуртай вэ? Эмээ, ээж хоёрын чинь хийсэн хоолноос аль нь хамгийн амттай вэ?",
  "theme_zh":"饿 · 想 · 最爱 · 再 · 饱 · 饺子","theme_mn":"Өлсөх · идмээр байх · хамгийн дуртай · дахиад · цадах · банш"},
 "warmup":{"mongolian":"Чи хамгийн их юу идэх дуртай вэ? Дахиад нэг аяга идэж чадах уу, эсвэл цадчихсан уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"5","title":"再吃几个。","mongolianTitle":"Дахиад хэдэн ширхэг идээрэй — яриа, chant","title_mn":"Let's read · 2 яриа + Let's chant · 饿了，吃饺子","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 3 · 第5课 Let's read / Let's chant（CD 05-02, 05-03）","author_zh":"",
  "intro_zh":"小明饿了，奶奶做了饺子。你最爱吃什么？",
  "intro_mn":"Эхлээд хоёр яриа: хүү өлсөөд эмээгээсээ гоймон гуйхад эмээ нь банш хийчихсэн байна. Дараа нь «饿了，吃饺子» гэсэн chant. Эхлээд аудиог сонс, дараа нь хамт хэл! Chant-ыг гэдсээ алгадаж, ээлжлэн дуулж үзээрэй.",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хүү өлсөөд гоймон байгаа эсэхийг асууна. Эмээ нь банш хийсэн байна. Хүү эмээгийн банш хамгийн их дуртай тул эмээ түүнд өгнө."},
   {"paragraph":2,"mn":"Яриа 2 — Хүү эмээдээ баярлалаа гэж хэлнэ. Эмээ дахиад хэдэн ширхэг идүүлэх гэхэд хүү хэтэрхий цадчихсан тул больё гэнэ."},
   {"paragraph":3,"mn":"Chant — Охин, хүү хоёр ээлжлэн дуулна. Хүү будаа, гоймон, банш, бууздаа дуртай ч хэтэрхий цадчихаад «不吃了» гэнэ. Аудио: 05-03."}],
  "reflection":{"questions_mn":["Чи юунд хамгийн их дуртай вэ? «我最爱吃……» гэж хэлж үз.","Эмээ, ээж чинь дахиад идүүлэх гэхэд чи юу гэж хэлдэг вэ?","Цадсан үедээ эелдгээр яаж татгалзах вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Хамгийн дуртай хоолоо хэл","zh":"我最爱吃饺子。","pinyin":"Wǒ zuì ài chī jiǎozi.","mn":"Би банш идэх хамгийн их дуртай."},
  "writingPrompt_mn":"Найзаасаа «你最爱吃什么？» гэж асуугаад «我最爱吃……» гэж хариул."},
 "properNouns":[],
 "wordExplanation":[
  {"word":"最爱","gloss":"zuì ài — хамгийн их дуртай","explanation":"最 гэдэг нь «хамгийн» гэсэн үг. 爱 нь «хайрлах, их дуртай» гэсэн үг. Хоёрыг нийлүүлээд «最爱» гэвэл «хамгийн их дуртай» болно. «我最爱吃饺子» — би банш идэх хамгийн их дуртай. Өөрийн дуртай хоолоо тавиад хэлж үз!",
   "structure":"我最爱吃 + хоол。","teacher_notes":"Make a survey-н «我最爱吃 / 我最爱喝» хүснэгттэй холбож хэлүүл. Нэг үгээр дуртай хоолоо нэрлүүлж, ангийнхаа өөр хүүхдүүдээс асуулга авч болно.",
   "examples":[{"chinese":"我最爱吃饺子。","pinyin":"Wǒ zuì ài chī jiǎozi.","mongolian":"Би банш идэх хамгийн их дуртай."},{"chinese":"我最爱吃奶奶做的饺子。","pinyin":"Wǒ zuì ài chī nǎinai zuò de jiǎozi.","mongolian":"Би эмээгийн хийсэн баншинд хамгийн их дуртай."},{"chinese":"米饭面条儿我最爱。","pinyin":"Mǐfàn miàntiáor wǒ zuì ài.","mongolian":"Будаа, гоймонд би хамгийн их дуртай."}],
   "common_mistakes":[{"wrong":"我爱最吃饺子。","right":"我最爱吃饺子。","why":"最 нь 爱-ийн өмнө орно: 最爱."}],
   "check":{"question":"«Би банш идэх хамгийн их дуртай» хятадаар:","options":["我最爱吃饺子。","我饿了，吃饺子。","不吃了，太饱了。"],"answer":"0"},
   "practice":[{"n":1,"question":"我 ________ 爱吃面条儿。(хамгийн)","answer":"最","explanation_mn":"«Хамгийн» гэж хэлэхдээ 最."}]},
  {"word":"再","gloss":"zài — дахиад","explanation":"再 гэдэг нь «дахиад» гэсэн үг. Хоолоо дахиад идэхэд «再吃» гэнэ. «几个» нь «хэдэн ширхэг» гэсэн үг. Эмээ «再吃几个» гэвэл «дахиад хэдэн ширхэг ид» гэсэн үг. «一个» гэвэл «нэг ширхэг».",
   "structure":"再吃 + хэдэн ширхэг (几个 / 一个)。","teacher_notes":"Айлд зочилж байгаа дүр тоглуул: нэг нь эзэн, нөгөө нь зочин болж «再吃一个！» — «不吃了，太饱了。»",
   "examples":[{"chinese":"再吃几个。","pinyin":"Zài chī jǐ ge.","mongolian":"Дахиад хэдэн ширхэг ид."},{"chinese":"再吃一个饺子吧？","pinyin":"Zài chī yí ge jiǎozi ba?","mongolian":"Дахиад нэг банш идэх үү?"},{"chinese":"再吃一个！","pinyin":"Zài chī yí ge!","mongolian":"Дахиад нэгийг ид!"}],
   "common_mistakes":[{"wrong":"吃再几个。","right":"再吃几个。","why":"再 нь 吃-ийн өмнө орно."}],
   "check":{"question":"«Дахиад нэг банш идэх үү?» хятадаар:","options":["再吃一个饺子吧？","我最爱吃饺子。","奶奶，我饿了。"],"answer":"0"},
   "practice":[{"n":1,"question":"________ 吃一个！(дахиад)","answer":"再","explanation_mn":"«Дахиад» — 再."}]},
  {"word":"饿了 · 饱了","gloss":"è le · bǎo le — өлслөө · цадлаа","explanation":"Өлссөн үедээ «我饿了», цадсан үедээ «我饱了» гэнэ. Үгийн ард «了» орвол «одоо ийм болчихлоо» гэсэн утга өгнө. «不吃了» гэвэл «больё, идэхгүй» гэсэн үг. «太饱了» — хэтэрхий цадчихлаа.",
   "structure":"我饿了。/ 我饱了。/ 不吃了。","teacher_notes":"Гэдсээ барьж «饿了», алгадаж «饱了» гэж хөдөлгөөнтэй давтуул.",
   "examples":[{"chinese":"奶奶，我饿了。","pinyin":"Nǎinai, wǒ è le.","mongolian":"Эмээ ээ, би өлсөж байна."},{"chinese":"不吃了，太饱了。","pinyin":"Bù chī le, tài bǎo le.","mongolian":"Больё, хэтэрхий цадчихлаа."},{"chinese":"我吃饱了，不吃了。","pinyin":"Wǒ chī bǎo le, bù chī le.","mongolian":"Би цадлаа, больё."}],
   "common_mistakes":[{"wrong":"我饿。","right":"我饿了。","why":"Одоо өлсөж байгаагаа хэлэхдээ «了» нэмнэ."}],
   "check":{"question":"Хэтэрхий цадсан үед юу гэх вэ?","options":["不吃了，太饱了。","奶奶，我饿了。","好，给你。"],"answer":"0"},
   "practice":[{"n":1,"question":"不吃了，太 ________ 了。(цадах)","answer":"饱","explanation_mn":"Цадсан — 饱."}]},
 ],
 "collocations":[{"type":"хоолны хэллэг","rows":[
   {"head":"最爱","with":"吃饺子","mn":"банш идэх хамгийн их дуртай","usage_mn":"Хамгийн дуртай хоолоо хэлэх","example":{"zh":"我最爱吃饺子。","pinyin":"Wǒ zuì ài chī jiǎozi.","mn":"Би банш идэх хамгийн их дуртай."}},
   {"head":"再吃","with":"几个","mn":"дахиад хэдэн ширхэг идэх","usage_mn":"Дахиад идүүлэх үед","example":{"zh":"再吃几个。","pinyin":"Zài chī jǐ ge.","mn":"Дахиад хэдэн ширхэг ид."}},
   {"head":"太饱","with":"了","mn":"хэтэрхий цадлаа","usage_mn":"Эелдгээр татгалзах үед","example":{"zh":"不吃了，太饱了。","pinyin":"Bù chī le, tài bǎo le.","mn":"Больё, хэтэрхий цадчихлаа."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["饿","想","最","给","再","饱"],"items":[
     {"n":1,"question":"奶奶，我 ________ 了。","answer":"饿","explanation_mn":"Өлссөн — 饿."},
     {"n":2,"question":"你 ________ 吃吗？","answer":"想","explanation_mn":"«Идмээр байна уу?» — 想吃."},
     {"n":3,"question":"我 ________ 爱吃饺子。","answer":"最","explanation_mn":"«Хамгийн их дуртай» — 最爱."},
     {"n":4,"question":"好，________ 你。","answer":"给","explanation_mn":"«Ав даа» — 给你."},
     {"n":5,"question":"________ 吃几个。","answer":"再","explanation_mn":"«Дахиад» — 再."},
     {"n":6,"question":"不吃了，太 ________ 了。","answer":"饱","explanation_mn":"Цадсан — 饱."}]}],
   "answer_source":"agent-authored (YCT 3 · 5-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"他最爱吃什么？","answer":"饺子。","explanation_mn":"Яриа 1 — «我最爱吃奶奶做的饺子» гэсэн."},
     {"n":2,"question_zh":"男孩为什么不吃了？","answer":"太饱了。","explanation_mn":"Яриа 2 — «不吃了，太饱了» гэсэн, хүү цадчихсан."}],
   "answer_source":"textbook_verified (Let's read, х.24 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Бинго","start_zh":"饿！饺子！","instruction_mn":"Цаасан дээр 3×3 хүснэгт зур. Дотор нь 面条儿 饺子 饿 想 最 给 再 饱 гэсэн 8 үгээ дураар бич, нэг нүд сул үлдээ. Ээж аав нэг нэг үг хэлэхэд чи тойруул. Гурвыг эгнүүлж тойруулбал «Бинго!» гэж хашгир!"},
     {"label":"Хоолны самбар","start_zh":"想吃饺子。","instruction_mn":"Хоёр хүн шоо хаяж самбарын дагуу алхана. 饺子, 面条儿, 米饭 гэсэн карт 5-5-аар бэлд. «想吃饺子» гэсэн нүдэнд бол 饺子 карт ав. «饿了» бол нэг тойрог алгас. «太饱了» бол нэг карт буцаа. Төгсгөлд хамгийн олон картай нь хожно. Нүд бүр дээрх өгүүлбэрээ чангаар унш!"},
     {"label":"Ангийн асуулга","start_zh":"你最爱吃什么？","instruction_mn":"Найз нөхөд, гэр бүлийнхнээсээ «你最爱吃什么？ 你最爱喝什么？» гэж асуу. Хариултыг цаасан дээр бич: нэр, хамгийн дуртай хоол, ундаа. Хамгийн олон хүний дуртай хоолыг тоол!"},
     {"label":"Эелдэг татгалз","start_zh":"再吃几个。","instruction_mn":"Нэг нь эмээ болж «再吃几个！» гэж идүүлнэ. Нөгөө нь «谢谢，不吃了，太饱了！» гэж гэдсээ алгадаж эелдгээр татгалзана. Дараа нь солилцоорой."},
     {"label":"Chant хөдөлгөөнтэй","start_zh":"我饿了，吃饺子。","instruction_mn":"Chant-ыг хоёулаа ээлжлэн дуул. «饿了» дээр гэдсээ барь, «最爱» дээр зүрхээ барь, «太饱了» дээр гэдсээ алга. Аудиотой хамт дуулж үз!"}]}},
 "grammarNotes":[],
 "culture":{"title":"饺子","title_mn":"Хятад хүүхдийн дуртай банш — 饺子","text_mn":"Хятад гэр бүлүүд шинэ жилийн өдөр бүгдээрээ хамт 饺子 боодог. Монголчууд Цагаан сарын өдөр бууз, банш хийдэг шиг. Зарим 饺子-н дотор зоос нуудаг бөгөөд олсон хүн жилдээ аз жаргалтай байна гэдэг. Хятад эмээ нар ч бас «再吃几个！» гэж ач нартаа дахиад идүүлэхээс залхдаггүй!","note_mn":"Танай гэрт хамгийн амттай банш, бууз хэн хийдэг вэ? Цагаан сараар хэдийг иддэг вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — өлсөх, цадах, хамгийн дуртай хоолоо хэлэх.","topic":"Чи юунд хамгийн их дуртай вэ?","discussion":["Хосоороо: «你最爱吃什么？» гэж асууж, «我最爱吃……» гэж хариул.","Бүгдээрээ ээлжлэн «再吃几个！» — «不吃了，太饱了！» гэж тоглоорой."],
   "writing":{"promptChinese":"我最爱吃……。我最爱喝……。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «你最爱吃什么？» гэж хятадаар асуугаад хариултыг нь сонс.","minChars":"0","requiredWords":["最","爱"],"sampleChinese":"我最爱吃饺子。","sampleMongolian":"Би банш идэх хамгийн их дуртай.","gradingRubric":"最爱-г зөв байрлуулсан эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 3 · Test Answers: L5 1.A 2.C 3.B 4.B 5.D 6.B 7.A 8.C","parts":[]},
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
 {"point":"我最爱吃饺子。 — хамгийн дуртай","gloss_mn":"«Би банш идэх хамгийн их дуртай» — хамгийн дуртай зүйлээ хэлнэ",
  "structure":"我最爱吃 + хоол。",
  "teacher_mn":"Хамгийн дуртай хоолоо хэлэхдээ «最爱» гэнэ. 最 = хамгийн, 爱 = их дуртай. «我最爱吃饺子» — би банш идэх хамгийн их дуртай. Чи юунд хамгийн их дуртай вэ? «我最爱吃……» гэж хэлж үз!",
  "teacher_notes":"Key sentence 1. Номын яриа: 我最爱吃奶奶做的饺子。 chant: 米饭面条儿我最爱。",
  "examples":[ex("我最爱吃饺子。","Wǒ zuì ài chī jiǎozi.","Би банш идэх хамгийн их дуртай."),ex("想吃，我最爱吃奶奶做的饺子。","Xiǎng chī, wǒ zuì ài chī nǎinai zuò de jiǎozi.","Идмээр байна. Би эмээгийн хийсэн баншинд хамгийн их дуртай."),ex("米饭面条儿我最爱。","Mǐfàn miàntiáor wǒ zuì ài.","Будаа, гоймонд би хамгийн их дуртай.")],
  "common_mistakes":[{"wrong":"我爱最吃饺子。","right":"我最爱吃饺子。","why":"最 нь 爱-ийн өмнө: 最爱."}],
  "check":chk("«Би банш идэх хамгийн их дуртай» хятадаар:",["我最爱吃饺子。","我饿了。","不吃了。"],"我最爱吃饺子。","g1c"),
  "exercises":[
   choice("我 ________ 爱吃面条儿。",["最","再","给"],"最","Зөв! 最爱 = хамгийн их дуртай.","最 = хамгийн, 再 = дахиад, 给 = өгөх.","g1e1"),
   choice("«Хамгийн их дуртай» хятадаар:",["最爱","太饱","再吃"],"最爱","Зөв! 最爱.","太饱 = хэтэрхий цадсан, 再吃 = дахиад идэх.","g1e2"),
   judge("«最» гэдэг нь «хамгийн» гэсэн үг.",True,"Зөв! 最 = хамгийн.","最 = хамгийн.")]},
 {"point":"再吃几个。 — дахиад хэдэн ширхэг","gloss_mn":"«Дахиад хэдэн ширхэг ид» — дахиад идүүлнэ",
  "structure":"再吃 + 几个 / 一个。",
  "teacher_mn":"Хэн нэгэнд дахиад идүүлэхдээ «再吃» гэнэ. 再 = дахиад. 几个 = хэдэн ширхэг. «再吃几个» — дахиад хэдэн ширхэг ид. Нэг ширхэг бол «再吃一个». Эмээ шиг дүр үзүүлээд найздаа хэлж үз!",
  "teacher_notes":"Key sentence 2. Яриа 2: 再吃几个。 Chant: 再吃一个饺子吧？",
  "examples":[ex("再吃几个。","Zài chī jǐ ge.","Дахиад хэдэн ширхэг ид."),ex("再吃一个饺子吧？","Zài chī yí ge jiǎozi ba?","Дахиад нэг банш идэх үү?"),ex("再吃一个！","Zài chī yí ge!","Дахиад нэгийг ид!")],
  "common_mistakes":[{"wrong":"吃再几个。","right":"再吃几个。","why":"再 нь 吃-ийн өмнө орно."}],
  "check":chk("«Дахиад хэдэн ширхэг ид» хятадаар:",["再吃几个。","我最爱吃。","好，给你。"],"再吃几个。","g2c"),
  "exercises":[
   choice("________ 吃一个饺子吧？",["再","最","想"],"再","Зөв! 再 = дахиад.","再 = дахиад, 最 = хамгийн, 想 = хүсэх.","g2e1"),
   choice("«Хэдэн ширхэг» хятадаар:",["几个","一个","太饱"],"几个","Зөв! 几个 = хэдэн ширхэг.","一个 = нэг ширхэг.","g2e2"),
   judge("«再» гэдэг нь «дахиад» гэсэн үг.",True,"Зөв! 再 = дахиад.","再 = дахиад.")]},
 {"point":"饿了 · 饱了 · 不吃了","gloss_mn":"«Өлслөө · цадлаа · больё» — биеийн байдлаа хэлнэ",
  "structure":"我饿了。/ 太饱了。/ 不吃了。",
  "teacher_mn":"Өлссөн үедээ «我饿了» гэж хэлнэ. Цадсан үедээ «我饱了» эсвэл «太饱了» гэнэ. «不吃了» гэвэл «больё, идэхгүй». Үгийн ард «了» орвол «одоо ийм болчихлоо» гэсэн утга. Гэдсээ барьж «饿了», алгадаж «饱了» гэж хэлж үз!",
  "teacher_notes":"Яриа 1–2, chant, Let's play: 饿了 (нэг тойрог алгас), 太饱了 (карт буцаа).",
  "examples":[ex("奶奶，我饿了。","Nǎinai, wǒ è le.","Эмээ ээ, би өлсөж байна."),ex("不吃了，太饱了。","Bù chī le, tài bǎo le.","Больё, хэтэрхий цадчихлаа."),ex("你想吃吗？","Nǐ xiǎng chī ma?","Чи идмээр байна уу?")],
  "common_mistakes":[{"wrong":"我饿。","right":"我饿了。","why":"Одоо өлссөнөө хэлэхдээ «了» нэмнэ."}],
  "check":chk("Өлсөөд эмээдээ хэлэх:",["奶奶，我饿了。","不吃了，太饱了。","再吃几个。"],"奶奶，我饿了。","g3c"),
  "exercises":[
   choice("不吃了，太 ________ 了。",["饱","饿","想"],"饱","Зөв! 太饱了 = хэтэрхий цадлаа.","饱 = цадах, 饿 = өлсөх.","g3e1"),
   choice("«Чи идмээр байна уу?» хятадаар:",["你想吃吗？","你最爱吃吗？","你给吃吗？"],"你想吃吗？","Зөв! 想 = хүсэх.","Идмээр байна уу гэхэд 你想吃吗.","g3e2"),
   judge("«饱» гэдэг нь «өлсөх» гэсэн үг.",False,"Зөв! 饱 = цадах, 饿 = өлсөх.","饱 = цадах. Өлсөх нь 饿.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Гоймон» хятадаар аль нь вэ?",["面条儿","饺子","苹果","牛奶"],"面条儿","面条儿 (miàntiáor) = гоймон.","easy",["vocabulary"],"b1")
q("choice","«Банш» хятадаар аль нь вэ?",["饺子","面条儿","包子","香蕉"],"饺子","饺子 (jiǎozi) = банш.","easy",["vocabulary"],"b2")
q("choice","«饿» гэдэг үг ямар утгатай вэ?",["өлсөх","цадах","өгөх","дахиад"],"өлсөх","饿 (è) = өлсөх.","easy",["vocabulary"],"b3")
q("choice","«想» гэдэг үг ямар утгатай вэ?",["хүсэх, идмээр байх","өгөх","хамгийн","цадах"],"хүсэх, идмээр байх","想 (xiǎng) = хүсэх.","medium",["vocabulary"],"b4")
q("choice","«最» гэдэг үг ямар утгатай вэ?",["хамгийн","дахиад","өгөх","өлсөх"],"хамгийн","最 (zuì) = хамгийн.","easy",["vocabulary"],"b5")
q("choice","«给» гэдэг үг ямар утгатай вэ?",["өгөх","идэх","цадах","хүсэх"],"өгөх","给 (gěi) = өгөх.","easy",["vocabulary"],"b6")
q("choice","«再» гэдэг үг ямар утгатай вэ?",["дахиад","хамгийн","цадах","өгөх"],"дахиад","再 (zài) = дахиад.","easy",["vocabulary"],"b7")
q("choice","«饱» гэдэг үг ямар утгатай вэ?",["цадах","өлсөх","дахиад","хүсэх"],"цадах","饱 (bǎo) = цадах.","easy",["vocabulary"],"b8")
q("choice","«Эмээ ээ, би өлсөж байна» хятадаар:",["奶奶，我饿了。","奶奶，我饱了。","奶奶，给你。","奶奶，再见。"],"奶奶，我饿了。","饿了 = өлслөө.","easy",["dialogue"],"b9")
q("choice","«Би банш идэх хамгийн их дуртай» хятадаар:",["我最爱吃饺子。","我饿了，吃饺子。","再吃几个。","你想吃吗？"],"我最爱吃饺子。","最爱 = хамгийн их дуртай.","medium",["dialogue"],"b10")
q("choice","Эмээ «好，给你» гэвэл юу гэсэн үг вэ?",["За, ав даа","Больё","Би өлсөж байна","Дахиад ид"],"За, ав даа","给你 = ав даа.","easy",["dialogue"],"b11")
q("choice","Яриа 2-т эмээ «再吃几个» гэвэл юу гэсэн үг вэ?",["Дахиад хэдэн ширхэг ид","Хамгийн их дуртай","Би цадлаа","Гоймон байна уу"],"Дахиад хэдэн ширхэг ид","再 = дахиад, 几个 = хэдэн ширхэг.","medium",["dialogue"],"b12")
q("cloze","奶奶，我（ ）了。",["饿","最","给","再"],"饿","我饿了 = би өлслөө.","easy",["dialogue"],"b13")
q("cloze","我（ ）爱吃饺子。",["最","再","给","想"],"最","最爱 = хамгийн их дуртай.","easy",["dialogue"],"b14")
q("cloze","（ ）吃几个。",["再","最","饿","给"],"再","再吃几个 = дахиад хэдэн ширхэг ид.","medium",["dialogue"],"b15")
q("cloze","不吃了，太（ ）了。",["饱","想","给","最"],"饱","太饱了 = хэтэрхий цадлаа.","easy",["dialogue"],"b16")
q("choice","Яриа 1-т хүү юунд хамгийн их дуртай вэ?",["奶奶做的饺子","面条儿","苹果","牛奶"],"奶奶做的饺子","我最爱吃奶奶做的饺子 — эмээгийн хийсэн банш.","medium",["dialogue"],"b17")
q("choice","Хүү яагаад «不吃了» гэсэн бэ?",["Цадчихсан","Өлссөн","Банш дуртай биш","Гоймон хүссэн"],"Цадчихсан","太饱了 = хэтэрхий цадсан.","medium",["dialogue"],"b18")
q("choice","«Чи идмээр байна уу?» хятадаар:",["你想吃吗？","你最爱吃吗？","你给吃吗？","你饿了吃。"],"你想吃吗？","想 = хүсэх.","medium",["structure"],"b19")
q("choice","«Дахиад нэг банш идэх үү?» хятадаар:",["再吃一个饺子吧？","我最爱吃饺子。","我饿了，吃饺子。","不吃了，太饱了。"],"再吃一个饺子吧？","再吃一个 = дахиад нэг ширхэг идэх.","medium",["structure"],"b20")
q("choice","«几个» гэж асуувал юу гэж асууж байна вэ?",["Хэдэн ширхэг?","Хэн бэ?","Хаана вэ?","Юу вэ?"],"Хэдэн ширхэг?","几个 = хэдэн ширхэг.","medium",["structure"],"b21")
q("choice","Пиньинь «jiǎozi» гэж уншдаг үг:",["饺子","面条儿","苹果","牛奶"],"饺子","饺子 = jiǎozi = банш.","easy",["pronunciation"],"b22")
q("choice","Пиньинь «bǎo» гэж уншдаг үг:",["饱","饿","给","想"],"饱","饱 = bǎo = цадах.","easy",["pronunciation"],"b23")
q("choice","Пиньинь «zài» гэж уншдаг үг:",["再","最","给","想"],"再","再 = zài = дахиад.","easy",["pronunciation"],"b24")
q("usage","Эмээ дахиад идүүлэх гэж байна, харин чи цадчихсан. Юу гэх вэ?",["不吃了，太饱了。","我饿了。","好，给你。","再吃几个。"],"不吃了，太饱了。","Цадсан бол 不吃了，太饱了.","medium",["usage"],"b25")
q("usage","Найз чинь «你最爱吃什么？» гэж асуулаа. Чи банш идэх хамгийн дуртай бол:",["我最爱吃饺子。","我最爱喝牛奶。","不吃了。","奶奶，我饿了。"],"我最爱吃饺子。","最爱吃 + хоол.","medium",["usage"],"b26")
q("usage","Өлсөөд эмээгээсээ гоймон байгаа эсэхийг асуух:",["奶奶，有面条儿吗？","奶奶，太饱了。","奶奶，再吃一个。","奶奶，给你。"],"奶奶，有面条儿吗？","有…吗 = …байна уу?","hard",["usage"],"b27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t2a"),img("t2b"),img("t2c"),img("t2d")]
L3 = ["A","B","C"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (05-05) сонсоод зөв хариултыг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）女的觉得爸爸做的面条儿怎么样？","question_mn":"Охин аавын хийсэн гоймонг ямар гэж бодож байна вэ?","script_zh":"男：你吃饱了吗？ 女：吃饱了，爸爸，您做的面条儿真好吃。 问：女的觉得爸爸做的面条儿怎么样？","options":L3,"optionTexts":["很好吃","太少了","颜色不好看"],"answer":"A","explanation_mn":"Охин «您做的面条儿真好吃» гэсэн — гоймон нь амттай. Тиймээс A «很好吃». B «хэтэрхий цөөн», C «өнгө нь муу» гэж ярьсангүй."},
    {"n":2,"question_zh":"（听录音）男的觉得吃饺子怎么样？","question_mn":"Хүү банш идэхийг ямар гэж бодож байна вэ?","script_zh":"女：中午吃饺子怎么样？ 男：我最爱吃饺子了。 问：男的觉得吃饺子怎么样？","options":L3,"optionTexts":["太热了","太饱了","太好了"],"answer":"C","explanation_mn":"Хүү «我最爱吃饺子了» гэсэн — банш хамгийн дуртай тул «太好了 (үнэхээр сайн)». «Хэт халуун», «хэт цадсан» гэж хэлээгүй."},
    {"n":3,"question_zh":"（听录音）男的要吃什么？","question_mn":"Хүү юу идэх вэ?","script_zh":"女：你饿不饿？想吃点什么？ 男：我不饿，给我一个苹果吃。 问：男的要吃什么？","options":L3,"optionTexts":["牛奶","苹果","香蕉"],"answer":"B","explanation_mn":"Хүү «我不饿，给我一个苹果吃» гэсэн — алим гуйсан. Тиймээс B «苹果». Сүү, гадил хэлээгүй."},
    {"n":4,"question_zh":"（听录音）男的让女的做什么？","question_mn":"Хүү охиныг юу хийлгэх гэсэн бэ?","script_zh":"男：再玩十分钟。 女：不玩了，太晚了，回家了。 问：男的让女的做什么？","options":L3,"optionTexts":["说再见","一起玩","回家去"],"answer":"B","explanation_mn":"Хүү «再玩十分钟» гэсэн — «дахиад арван минут тоглоё». Тиймээс охиныг хамт тоглуулах гэсэн, B «一起玩». «Гэртээ харья» гэсэн нь охин."}],
   "answer_source":"YCT 3 Test Answers L5: 1.A 2.C 3.B 4.B"},
  {"part":2,"type":"choice","instruction_mn":"Унших — яриа бүрт тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"A：我们饿了，可以吃吗？ B：可以。","question_mn":"— Бид өлсөж байна, идэж болох уу? — Болно.","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"Хоёр охин хоолны дэргэд инээмсэглэн, идэхийг хүлээж байна — D. A бодож байна, B багштай ярьж байна, C цадсан байна."},
    {"n":6,"question_zh":"A：给你。 B：谢谢。","question_mn":"— Ав даа. — Баярлалаа.","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"B зураг дээр багш эмэгтэй хүүтэй цаас барин ярьж байна — юм өгч, авч байгаа дүр тул «给你 — 谢谢». Бусад зурагт юм өгч байгаа хүн алга."},
    {"n":7,"question_zh":"A：他在几年级？ B：您让我想想。","question_mn":"— Тэр хэддүгээр ангид сурдаг вэ? — Түр хүлээгээрэй, би бодож үзье.","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"A зураг дээр охин хуруугаа хацартаа тулаад бодож байна — «想想». B, C, D зурагт бодож байгаа хүн алга."},
    {"n":8,"question_zh":"A：再吃一个！ B：我吃饱了，不吃了。","question_mn":"— Дахиад нэгийг ид! — Би цадлаа, больё.","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"C зураг дээр охин хоолныхоо өмнө хацраа тулчихсан, цадсан харагдаж байна — «吃饱了，不吃了». A бодож байна, B багштай ярьж байна, D хоёр охин инээмсэглэж байна."}],
   "answer_source":"YCT 3 Test Answers L5: 5.D 6.B 7.A 8.C"},
  {"part":3,"type":"match","instruction_mn":"Let's play — Хоолны самбар. Нүд бүр юу гэж байгааг сонго.","items":[
    {"n":1,"question_zh":"想吃饺子。","answer":"饺子 карт нэгийг ав","explanation_mn":"想吃饺子 — «банш идмээр байна». Тиймээс 饺子 карт ав."},
    {"n":2,"question_zh":"不吃米饭。","answer":"өрсөлдөгч 米饭 карт авна","explanation_mn":"Чи будаа идэхгүй бол өрсөлдөгч чинь 米饭 карт авна."},
    {"n":3,"question_zh":"太饱了。","answer":"нэг карт буцаа","explanation_mn":"太饱了 — цадсан тул нэг картаа буцааж тавь."},
    {"n":4,"question_zh":"饿了。","answer":"нэг тойрог алгас","explanation_mn":"饿了 — өлссөн тул нэг удаа тоглохгүй."},
    {"n":5,"question_zh":"吃饱了。","answer":"5 алхам урагш","explanation_mn":"吃饱了 — цадсан, тиймээс 5 алхам урагш явна."}],
   "answer_source":"Let's play х.26 (самбарын англи заавраас)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «饺子» гэсэн ханзыг дахин бичиж хуул.","question_zh":"饺子","answer":"饺子","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."},
   {"n":2,"prompt_mn":"Бичиж үз — «再吃几个» гэсэн ханзыг хуул.","question_zh":"再吃几个","answer":"再吃几个","explanation_mn":"Нэг нэг ханзаар аажуухан бич."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Make a survey: найзаасаа хамгийн дуртай хоолыг нь асуу.","question_zh":"你最爱吃什么？","answer":"我最爱吃……","explanation_mn":"Найзынхаа нэр, дуртай хоол, ундааг цаасан дээр бичээрэй."},
   {"n":2,"prompt_mn":"Өлссөнөө хэл.","question_zh":"奶奶，我饿了。","answer":"奶奶，我饿了。","explanation_mn":"Гэдсээ барьж хэл."},
   {"n":3,"prompt_mn":"Эелдгээр татгалз.","question_zh":"不吃了，太饱了。","answer":"不吃了，太饱了。","explanation_mn":"Гэдсээ алгадаж хэл."},
   {"n":4,"prompt_mn":"Let's chant — аудиотой хамт дуул.","question_zh":"我饿了，吃饺子。","answer":"(нээлттэй)","explanation_mn":"Аудио 05-03-ын хамт ээлжлэн дуул."}]},
 "answerSource":"YCT 标准教程 3 · Test Listening Scripts, Test Answers (Lesson 5)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("miantiaor","面条儿"),("jiaozi","饺子"),("e","饿"),("xiang","想"),("zui","最"),("gei","给"),("zai","再"),("bao","饱")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"再吃几个。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"奶奶，我饿了，有面条儿吗？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"奶奶，谢谢您，饺子太好吃了！","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"我饿了，吃饺子。","role":"illustration","section":"song"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["2a","2b","2c","2d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 3 · 5-р хичээл — Дахиад хэдэн ширхэг идээрэй","chineseTitle":"再吃几个。","targetTitle":"再吃几个。","mongolianTitle":"Дахиад хэдэн ширхэг идээрэй",
 "subtitle":"饿 · 想 · 最爱 · 再 · 饱 · 饺子 · chant",
 "description":f"Өлсөх, цадахаа хэлж, хамгийн дуртай хоолоо нэрлэж (最爱), дахиад идүүлэх (再吃几个) хэллэгийг сурна. {len(vocab)} үг, 2 зурагт яриа, 1 chant, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🥟","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 3",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 3 — 第5课《再吃几个。》 [hskLevel=2] [lessonNumber=5]; эх: сурах бичиг х.23–27; аудио CD 05-01…05-05 (05-04 Let's play аудио алга)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"再吃几个。","mongolianTitle":"Дахиад хэдэн ширхэг идээрэй",
 "series":"YCT 标准教程 3","seriesLabel_mn":"YCT 3 — Хүүхдийн хятад хэл (≈HSK2)",
 "source":"YCT 标准教程 3 · 第5课 (сурах бичиг + CD аудио 05-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"test":AUD_TEST,"play":"","vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L5)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
