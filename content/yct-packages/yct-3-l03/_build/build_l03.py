#!/usr/bin/env python3
"""YCT 标准教程 3 · 第3课 我在画画儿呢。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re
OUT = "/home/claude/work/yct3/l03/pkg"
CID, LID, N = "yct-3", "yct-3-l03", 3
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

# Тестийн зураг (hi-19) + Let's match (hi-17) + story (hi-18)
from PIL import Image
_pg = Image.open("/home/claude/work/yct3/l03/pages/hi-19.png").convert("RGB")
_BOX = {"t1a":(245,305,385,460),"t1b":(478,305,608,460),"t1c":(708,315,842,448),"t1d":(958,305,1065,452),
        "t5":(80,990,235,1155),"t6":(625,960,735,1155),"t7":(80,1345,208,1545),"t8":(625,1350,730,1548)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
_p17 = Image.open("/home/claude/work/yct3/l03/pages/hi-17.png").convert("RGB")
for _i,(_y0,_y1) in enumerate([(235,360),(365,478),(480,620),(620,740)],1):
    _p17.crop((255,_y0,410,_y1)).resize((310,(_y1-_y0)*2),Image.LANCZOS).save(f"{OUT}/images/m{_i}.png")
Image.open("/home/claude/work/yct3/l03/pages/hi-18.png").convert("RGB").crop((150,300,1150,1560)).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = "audio/yct-3-03-01.mp3","audio/yct-3-03-02.mp3","audio/yct-3-03-04.mp3","audio/yct-3-03-05.mp3"
AUD_PLAY = ""   # 03-03 алга
AUD_MAIN = "audio/yct-3-03-text-song.mp3"   # яриа 03-02 + Mini story 03-04

# ---------------- VOCAB ----------------
VOCAB = [
 ("太阳","tàiyáng","нар","нэр үг · гол үг","太阳出来了，天亮了。","Tàiyáng chūlái le, tiān liàng le.","Нар мандлаа, үүр цайлаа.",True),
 ("月亮","yuèliang","сар","нэр үг · гол үг","今天的月亮真漂亮。","Jīntiān de yuèliang zhēn piàoliang.","Өнөөдрийн сар үнэхээр хөөрхөн юм.",True),
 ("跑步","pǎobù","гүйх","үйл үг · гол үг","爷爷跟月亮一起跑步。","Yéye gēn yuèliang yìqǐ pǎobù.","Өвөө сартай хамт гүйж байна.",True),
 ("爷爷","yéye","өвөө (аавын аав)","нэр үг · гол үг","爷爷唱歌呢。","Yéye chànggē ne.","Өвөө дуулж байна.",True),
 ("奶奶","nǎinai","эмээ (аавын ээж)","нэр үг · гол үг","奶奶跳舞呢。","Nǎinai tiàowǔ ne.","Эмээ бүжиглэж байна.",True),
 ("唱歌","chànggē","дуулах","үйл үг · гол үг","我喜欢唱歌。","Wǒ xǐhuan chànggē.","Би дуулах дуртай.",True),
 ("跳舞","tiàowǔ","бүжиглэх","үйл үг · гол үг","奶奶跟太阳一起跳舞。","Nǎinai gēn tàiyáng yìqǐ tiàowǔ.","Эмээ нартай хамт бүжиглэж байна.",True),
 ("让","ràng","зөвшөөрөх, …болгох","үйл үг · гол үг","让我看看。","Ràng wǒ kànkan.","Би хараад үзье.",True),
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
 {"id":1,"title_mn":"Яриа 1 · Чи юу хийж байна?","scene_mn":"Зургийн өрөөнд охин тавцан дээр зураг зурчихаад зогсож байна. Хөвгүүн хажууд нь ирж, юу зурсныг нь асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"你在做什么呢？","pinyin":"Nǐ zài zuò shénme ne?","mn":"Чи юу хийж байна?"},
           {"speaker":"小红","zh":"我在画画儿呢。","pinyin":"Wǒ zài huà huàr ne.","mn":"Би зураг зурж байна."},
           {"speaker":"小明","zh":"让我看看，你画的是什么？","pinyin":"Ràng wǒ kànkan, nǐ huà de shì shénme?","mn":"Би хараад үзье. Чи юу зурсан юм бэ?"},
           {"speaker":"小红","zh":"太阳和月亮在跑步。","pinyin":"Tàiyáng hé yuèliang zài pǎobù.","mn":"Нар сар хоёр гүйж байна."}]},
 {"id":2,"title_mn":"Яриа 2 · Хүрээлэнд өвөө эмээ","scene_mn":"Цэцэрлэгт хүрээлэнд өвөө найз нартайгаа дуулж, эмээ усан оргилуурын дэргэд бүжиглэж байна. Хоёр хүүхэд хажуугаас нь харна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"爷爷、奶奶做什么呢？","pinyin":"Yéye, nǎinai zuò shénme ne?","mn":"Өвөө, эмээ хоёр юу хийж байна?"},
           {"speaker":"小明","zh":"爷爷唱歌呢，奶奶跳舞呢。","pinyin":"Yéye chànggē ne, nǎinai tiàowǔ ne.","mn":"Өвөө дуулж байна, эмээ бүжиглэж байна."}]},
]
sentences=[]
dlg = [
 (1,"小明：你在做什么呢？","Xiǎo Míng: Nǐ zài zuò shénme ne?","Сяо Мин: Чи юу хийж байна?","小明：| 你|nǐ 在|zài 做|zuò 什么|shénme 呢|ne ？|","在……呢 — одоо яг хийж байгааг хэлнэ. «Чи юу хийж байна?» гэж асуухдаа 你在做什么呢？ гэнэ.",["你在做什么呢？"]),
 (1,"小红：我在画画儿呢。","Xiǎo Hóng: Wǒ zài huà huàr ne.","Сяо Хун: Би зураг зурж байна.","小红：| 我|wǒ 在|zài 画画儿|huà huàr 呢|ne 。|","我在……呢 — «Би …ж байна». Зураг зурж байгаа бол 画画儿.",["我在画画儿呢。"]),
 (1,"小明：让我看看，你画的是什么？","Xiǎo Míng: Ràng wǒ kànkan, nǐ huà de shì shénme?","Сяо Мин: Би хараад үзье. Чи юу зурсан юм бэ?","小明：| 让|ràng 我|wǒ 看看|kànkan ，| 你|nǐ 画|huà 的|de 是|shì 什么|shénme ？|","让我看看 — «Би хараад үзье». 看看 = жаахан харах.",["让我看看。"]),
 (1,"小红：太阳和月亮在跑步。","Xiǎo Hóng: Tàiyáng hé yuèliang zài pǎobù.","Сяо Хун: Нар сар хоёр гүйж байна.","小红：| 太阳|tàiyáng 和|hé 月亮|yuèliang 在|zài 跑步|pǎobù 。|","",[]),
 (2,"小红：爷爷、奶奶做什么呢？","Xiǎo Hóng: Yéye, nǎinai zuò shénme ne?","Сяо Хун: Өвөө, эмээ хоёр юу хийж байна?","小红：| 爷爷|yéye 、| 奶奶|nǎinai 做|zuò 什么|shénme 呢|ne ？|","",[]),
 (2,"小明：爷爷唱歌呢，奶奶跳舞呢。","Xiǎo Míng: Yéye chànggē ne, nǎinai tiàowǔ ne.","Сяо Мин: Өвөө дуулж байна, эмээ бүжиглэж байна.","小明：| 爷爷|yéye 唱歌|chànggē 呢|ne ，| 奶奶|nǎinai 跳舞|tiàowǔ 呢|ne 。|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("奶奶喜欢太阳，","Nǎinai xǐhuan tàiyáng,","Эмээ нарт дуртай,","奶奶|nǎinai 喜欢|xǐhuan 太阳|tàiyáng ，|"),
 ("爷爷喜欢月亮。","yéye xǐhuan yuèliang.","өвөө сарт дуртай.","爷爷|yéye 喜欢|xǐhuan 月亮|yuèliang 。|"),
 ("早上，奶奶跟太阳一起跳舞，奶奶真漂亮。","Zǎoshang, nǎinai gēn tàiyáng yìqǐ tiàowǔ, nǎinai zhēn piàoliang.","Өглөө эмээ нартай хамт бүжиглэнэ. Эмээ үнэхээр хөөрхөн юм.","早上|zǎoshang ，| 奶奶|nǎinai 跟|gēn 太阳|tàiyáng 一起|yìqǐ 跳舞|tiàowǔ ，| 奶奶|nǎinai 真|zhēn 漂亮|piàoliang 。|"),
 ("晚上，爷爷跟月亮一起跑步，爷爷真健康。","Wǎnshang, yéye gēn yuèliang yìqǐ pǎobù, yéye zhēn jiànkāng.","Орой өвөө сартай хамт гүйнэ. Өвөө үнэхээр эрүүл чийрэг юм.","晚上|wǎnshang ，| 爷爷|yéye 跟|gēn 月亮|yuèliang 一起|yìqǐ 跑步|pǎobù ，| 爷爷|yéye 真|zhēn 健康|jiànkāng 。|"),
 ("我们一起来运动，","Wǒmen yìqǐ lái yùndòng,","Бид хамт спорт хийцгээе,","我们|wǒmen 一起|yìqǐ 来|lái 运动|yùndòng ，|"),
 ("你们觉得怎么样？","nǐmen juéde zěnmeyàng?","та нарт ямар санагдаж байна?","你们|nǐmen 觉得|juéde 怎么样|zěnmeyàng ？|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «爷爷和奶奶» (Өвөө эмээ хоёр) — 4 зурагт үлгэр. 喜欢 = дуртай."
    if i==2: s["note"]="跟……一起 = «…тай хамт». Эмээ нар мандахад нартай хамт бүжиглэнэ."
    if i==3: s["note"]="健康 = эрүүл чийрэг."
    if i==4: s["note"]="运动 = спорт хийх, хөдөлгөөн хийх."
    if i==5: s["note"]="怎么样 = «ямар вэ?» гэж санал асуух үг."
    sentences.append(s)

texts = {
 "unit":{"number":"3","title":"我在画画儿呢。","mongolianTitle":"Би зураг зурж байна — одоо юу хийж байгаагаа хэлэх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх номуудад чи гэр бүл, амьтан, тоо, өнгөө сурсан даа. Одоо тэр мэдлэгтээ шинэ юм нэмье. Чи яг одоо юу хийж байна вэ? Зураг зурж байна уу, дуулж байна уу? Өнөөдөр «我在画画儿呢» гэж өөрийнхөө хийж байгааг хэлж, «你在做什么呢？» гэж найзаасаа асууна. Мөн өвөө, эмээгээ «爷爷、奶奶» гэж дуудаж, нар сар хоёрын тухай хөөрхөн үлгэр уншина. Бид бүгдээрээ дуулж, бүжиглэж, гүйж тоглоно. Эхэлцгээе!",
  "warmup_mn":"Чи одоо юу хийж байна вэ? Тэр хийж байгаагаа бүгдээр нь гараараа дүрсэлж үз, гэрийнхэн чинь таая!",
  "theme_zh":"在……呢 · 让我看看 · 太阳 · 月亮 · 爷爷 · 奶奶","theme_mn":"Юу хийж байна · Би хараад үзье · Нар сар · Өвөө эмээ"},
 "warmup":{"mongolian":"Чи одоо юу хийж байна вэ? Хийж байгаагаа хөдөлгөөнөөр үзүүл, гэрийнхэн чинь таая."},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"3","title":"我在画画儿呢。","mongolianTitle":"Би зураг зурж байна — яриа, үлгэр","title_mn":"Let's read · 2 яриа + Mini story · 爷爷和奶奶","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 3 · 第3课 Let's read / Mini story（CD 03-02, 03-04）","author_zh":"",
  "intro_zh":"两段小对话：你在做什么呢？爷爷、奶奶做什么呢？然后读小故事《爷爷和奶奶》。",
  "intro_mn":"Эхлээд хоёр яриа: «你在做什么呢？» гэж юу хийж байгааг асууна, «爷爷、奶奶做什么呢？» гэж өвөө эмээгийн тухай хэлнэ. Дараа нь «爷爷和奶奶» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хөдөлгөөнтэй нь хамт хэл! Өвөө эмээ шиг дуулж, бүжиглэж үзээрэй.",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хөвгүүн охиноос юу хийж байгааг асууна. Охин зураг зурж байна. Зурагт нар сар хоёр гүйж байна."},
   {"paragraph":2,"mn":"Яриа 2 — Хүрээлэнд өвөө дуулж, эмээ бүжиглэж байна."},
   {"paragraph":3,"mn":"Үлгэр «爷爷和奶奶» — Эмээ нарт, өвөө сарт дуртай. Өглөө эмээ нартай бүжиглэнэ, орой өвөө сартай гүйнэ. Эцэст нь бүгдээрээ хамт спорт хийцгээнэ. Аудио: 03-04."}],
  "reflection":{"questions_mn":["Чиний өвөө, эмээ юу хийх дуртай вэ?","Чи нар, сарын аль нэгийг сонговол алийг нь сонгох вэ?","Чи өглөө, орой юу хийдэг вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Юу хийж байна?","zh":"你在做什么呢？","pinyin":"Nǐ zài zuò shénme ne?","mn":"Чи юу хийж байна?"},
  "writingPrompt_mn":"Найзаасаа «你在做什么呢？» гэж асуугаад «我在……呢» гэж хариул."},
 "properNouns":[],
 "wordExplanation":[
  {"word":"在……呢","gloss":"zài … ne — яг одоо …ж байна","explanation":"Одоо яг хийж байгаа зүйлээ хэлэхдээ «我在 + юу хийх + 呢» гэнэ. 我在画画儿呢 — би зураг зурж байна. Асуухдаа «你在做什么呢？» — чи юу хийж байна? Цонхоор хараад «爷爷唱歌呢» — өвөө дуулж байна гэж ч хэлж болно.",
   "structure":"我在 + хийх үйлдэл + 呢。 → 我在画画儿呢。","teacher_notes":"Хүүхдүүд хөдөлгөөнөөр дүрслээд нөгөө нь «你在做什么呢？» гэж асууж, «你在……呢» гэж таана.",
   "examples":[{"chinese":"你在做什么呢？","pinyin":"Nǐ zài zuò shénme ne?","mongolian":"Чи юу хийж байна?"},{"chinese":"我在画画儿呢。","pinyin":"Wǒ zài huà huàr ne.","mongolian":"Би зураг зурж байна."},{"chinese":"太阳和月亮在跑步。","pinyin":"Tàiyáng hé yuèliang zài pǎobù.","mongolian":"Нар сар хоёр гүйж байна."}],
   "common_mistakes":[{"wrong":"我画画儿在呢。","right":"我在画画儿呢。","why":"在 нь хийж буй үйлдлийн өмнө орно."}],
   "check":{"question":"«Би зураг зурж байна» хятадаар:","options":["我在画画儿呢。","你在做什么呢？","让我看看。"],"answer":"0"},
   "practice":[{"n":1,"question":"我 ________ 画画儿呢。(байна)","answer":"在","explanation_mn":"«…ж байна» гэхдээ 在 хэрэглэнэ."}]},
  {"word":"让我看看","gloss":"ràng wǒ kànkan — би хараад үзье","explanation":"Найзынхаа зургийг, тоглоомыг үзмээр байвал «让我看看» гэнэ. 看看 нь «жаахан харах». Тоглохыг хүсвэл 让我玩玩, зурахыг хүсвэл 让我画画, суухыг хүсвэл 让我坐坐. Сүүлд нь «好吗？» (болох уу?) нэмбэл эелдэг сонсогдоно.",
   "structure":"让我 + (хийх үйлдэл ×2)，好吗？ → 让我看看，好吗？","teacher_notes":"Let's match: 让我看看 / 玩玩 / 画画 / 坐坐 — үйлдлээ давтана. Өрөөнд зүйл заагаад «让我……，好吗？» гэж ээлжлэн хэл.",
   "examples":[{"chinese":"让我看看。","pinyin":"Ràng wǒ kànkan.","mongolian":"Би хараад үзье."},{"chinese":"让我玩玩，好吗？","pinyin":"Ràng wǒ wánwan, hǎo ma?","mongolian":"Би жаахан тоглоод үзье, болох уу?"},{"chinese":"让我画画，好吗？","pinyin":"Ràng wǒ huàhua, hǎo ma?","mongolian":"Би жаахан зураад үзье, болох уу?"}],
   "common_mistakes":[{"wrong":"我让看看。","right":"让我看看。","why":"让 нь өгүүлбэрийн эхэнд, 我-ийн өмнө орно."}],
   "check":{"question":"«Би хараад үзье» хятадаар:","options":["让我看看。","我在画画儿呢。","爷爷唱歌呢。"],"answer":"0"},
   "practice":[{"n":1,"question":"让我 ________ ，好吗？(суух)","answer":"坐坐","explanation_mn":"«Суух» = 坐, давхардуулбал 坐坐."}]},
  {"word":"和 · 跟……一起","gloss":"hé · gēn … yìqǐ — ба, …тай хамт","explanation":"«太阳和月亮» — нар сар хоёр. «和» нь «ба» гэсэн үг. «奶奶跟太阳一起跳舞» — эмээ нартай хамт бүжиглэнэ. «跟…一起» нь «…тай хамт» гэсэн үг.",
   "structure":"A 和 B → 太阳和月亮；A 跟 B 一起 + үйлдэл","teacher_notes":"Найзтайгаа «我跟……一起……» гэж хэлж тоглуул.",
   "examples":[{"chinese":"太阳和月亮在跑步。","pinyin":"Tàiyáng hé yuèliang zài pǎobù.","mongolian":"Нар сар хоёр гүйж байна."},{"chinese":"爷爷跟月亮一起跑步。","pinyin":"Yéye gēn yuèliang yìqǐ pǎobù.","mongolian":"Өвөө сартай хамт гүйж байна."},{"chinese":"我们一起来运动。","pinyin":"Wǒmen yìqǐ lái yùndòng.","mongolian":"Бид хамт спорт хийцгээе."}],
   "common_mistakes":[{"wrong":"太阳月亮在跑步。","right":"太阳和月亮在跑步。","why":"Хоёр юмыг «ба» гэж холбохдоо дунд нь 和 хэрэгтэй."}],
   "check":{"question":"«Нар сар хоёр» хятадаар:","options":["太阳和月亮","爷爷和奶奶","唱歌跳舞"],"answer":"0"},
   "practice":[{"n":1,"question":"爷爷 ________ 奶奶","answer":"和","explanation_mn":"«Өвөө эмээ хоёр» — 和."}]},
 ],
 "collocations":[{"type":"Өдөр тутмын хэллэг","rows":[
   {"head":"在……呢","with":"画画儿","mn":"зураг зурж байна","usage_mn":"Одоо яг хийж байгаагаа хэлэх","example":{"zh":"我在画画儿呢。","pinyin":"Wǒ zài huà huàr ne.","mn":"Би зураг зурж байна."}},
   {"head":"让我","with":"看看","mn":"би хараад үзье","usage_mn":"Найзынхаа юмыг үзмээр байхад","example":{"zh":"让我看看。","pinyin":"Ràng wǒ kànkan.","mn":"Би хараад үзье."}},
   {"head":"跟……一起","with":"跳舞","mn":"…тай хамт бүжиглэх","usage_mn":"Хэнтэй хамт хийхээ хэлэх","example":{"zh":"奶奶跟太阳一起跳舞。","pinyin":"Nǎinai gēn tàiyáng yìqǐ tiàowǔ.","mn":"Эмээ нартай хамт бүжиглэнэ."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["太阳","爷爷","唱歌","让"],"items":[
     {"n":1,"question":"________ 我看看。","answer":"让","explanation_mn":"«Би хараад үзье» — 让我看看."},
     {"n":2,"question":"早上出来的是 ________ 。","answer":"太阳","explanation_mn":"Өглөө мандах нь 太阳 (нар)."},
     {"n":3,"question":"我喜欢 ________ ，也喜欢跳舞。","answer":"唱歌","explanation_mn":"Дуулах = 唱歌."},
     {"n":4,"question":"我爸爸的爸爸是 ________ 。","answer":"爷爷","explanation_mn":"Аавын аав = өвөө = 爷爷."}]}],
   "answer_source":"agent-authored (YCT 3 · 3-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"女孩在画什么？","answer":"太阳和月亮。","explanation_mn":"Яриа 1 — «太阳和月亮在跑步» гэсэн."},
     {"n":2,"question_zh":"你的爷爷、奶奶也唱歌、跳舞吗？","answer":"(нээлттэй асуулт — өөрийнхөөрөө хариул)","explanation_mn":"Номын асуулт. «也唱歌、也跳舞» эсвэл «不唱歌» гэж хариулж болно."}],
   "answer_source":"textbook_verified (Let's read, х.14 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Жанжин тоглоом","start_zh":"让我看看！","instruction_mn":"Нэг нь «жанжин» болж шинэ үгээр тушаал өгнө: «唱歌！跳舞！跑步！». Бусад нь тэр даруй хийнэ. Зөв хийсэн хүн дараагийн жанжин болно!"},
     {"label":"Мөрдөгч тоглоом","start_zh":"我在……呢。","instruction_mn":"Өчигдөр өглөө 8 цагт нэг юм болчихлоо. Чи мөрдөгчид «我在画画儿呢» гэх мэтээр тэр үед юу хийж байснаа хэл. Мөрдөгч асууна: «你在做什么呢？»"},
     {"label":"Дүрслээд таа","start_zh":"你在做什么呢？","instruction_mn":"Нэг нь дуугүй хөдөлгөөнөөр (дуулах, бүжиглэх, гүйх, зурах) харуулна. Нөгөө нь «你在做什么呢？» гэж асууж, «你在唱歌呢！» гэж таана."},
     {"label":"让我…，好吗？","start_zh":"让我玩玩，好吗？","instruction_mn":"Тоглоом юм барьчихаад найздаа «让我看看，好吗？» гэж хэл. Найз чинь «好的！» гэвэл өгнө. «不好» гэвэл өөр юмаар хүсч үз."},
     {"label":"Өвөө эмээ жүжиг","start_zh":"我们一起来运动！","instruction_mn":"Үлгэрийг жүжигчилье. Нэг нь эмээ нартай бүжиглэнэ, нөгөө нь өвөө сартай гүйнэ. Төгсгөлд бүгдээрээ «我们一起来运动！» гэж хашгираад хамт хөдөл!"}]}},
 "grammarNotes":[],
 "culture":{"title":"公园里的爷爷奶奶","title_mn":"Хятадын хүрээлэнд өвөө эмээ нар","text_mn":"Хятадад өглөө бүр цэцэрлэгт хүрээлэнд өвөө, эмээ нар цуглана. Зарим нь хамт дуулна, зарим нь хөгжимтэй бүжиглэнэ, зарим нь аажуу гүйнэ. Тэд «ийм л байвал эрүүл» гэж боддог. Монголд өвөө эмээ нар өглөө алхдаг, хүрээлэнд сууж хөөрөлддөг шиг л юм даа.","note_mn":"Чиний өвөө, эмээ өглөө юу хийдэг вэ? Чи тэдэнтэй хамт бүжиглэж үзсэн үү?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — одоо юу хийж байгаагаа хэлэх, хүснэ гэж найзаасаа зөвшөөрөл асуух.","topic":"Чи юу хийж байна?","discussion":["Хосоороо: нэг нь хөдөлгөөн хийж, нөгөө нь «你在做什么呢？» гэж асууна.","Бүгдээрээ «让我看看，好吗？» гэж ээлжлэн хэл."],
   "writing":{"promptChinese":"我在……呢。爷爷……。奶奶……。","promptMongolian":"Гэрийн даалгавар: өвөө, эмээ (эсвэл аав ээж) чинь одоо юу хийж байгааг асууж, «爷爷……呢» гэж хэл.","minChars":"0","requiredWords":["在","呢"],"sampleChinese":"我在画画儿呢。","sampleMongolian":"Би зураг зурж байна.","gradingRubric":"在……呢-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 3 · Test Answers: L3 1.B 2.A 3.D 4.C 5.C 6.B 7.A 8.B","parts":[]},
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
 {"point":"我在画画儿呢。 — одоо юу хийж байна","gloss_mn":"«Би зураг зурж байна» — яг одоо хийж байгаагаа хэлнэ",
  "structure":"我在 + хийх үйлдэл + 呢。 / 你在做什么呢？",
  "teacher_mn":"Яг одоо хийж байгаа юмаа хэлэхдээ «在……呢» гэнэ. Зураг зурж байвал «我在画画儿呢». Найзаасаа асуухдаа «你在做什么呢？» гэнэ. Гараа даллаад, хийж байгаагаа дүрсэлж үз!",
  "teacher_notes":"Номын яриа: 你在做什么呢？ 我在画画儿呢。 太阳和月亮在跑步。",
  "examples":[ex("你在做什么呢？","Nǐ zài zuò shénme ne?","Чи юу хийж байна?"),ex("我在画画儿呢。","Wǒ zài huà huàr ne.","Би зураг зурж байна."),ex("太阳和月亮在跑步。","Tàiyáng hé yuèliang zài pǎobù.","Нар сар хоёр гүйж байна."),ex("爷爷唱歌呢，奶奶跳舞呢。","Yéye chànggē ne, nǎinai tiàowǔ ne.","Өвөө дуулж байна, эмээ бүжиглэж байна.")],
  "common_mistakes":[{"wrong":"我画画儿在呢。","right":"我在画画儿呢。","why":"在 нь хийж буй үйлдлийн өмнө орно."}],
  "check":chk("Найзаасаа «Чи юу хийж байна?» гэж асуу:",["你在做什么呢？","让我看看。","爷爷唱歌呢。"],"你在做什么呢？","g1c"),
  "exercises":[
   choice("我 ________ 画画儿呢。",["在","让","和"],"在","Зөв! 在 = ...ж байна.","在……呢 — одоо хийж байгааг хэлнэ.","g1e1"),
   choice("«Өвөө дуулж байна» хятадаар:",["爷爷唱歌呢。","奶奶跳舞呢。","我在画画儿呢。"],"爷爷唱歌呢。","Зөв! 唱歌 = дуулах.","唱歌 = дуулах, 跳舞 = бүжиглэх.","g1e2"),
   judge("«你在做什么呢？» гэдэг нь «Чи юу хийж байна?» гэсэн үг.",True,"Зөв!","你在做什么呢？ = Чи юу хийж байна?")]},
 {"point":"让我看看。 — би хараад үзье","gloss_mn":"«Би хараад үзье» — найзаасаа юм үзэхээр хүснэ",
  "structure":"让我 + хийх үйлдэл ×2，好吗？",
  "teacher_mn":"Найзынхаа зургийг үзмээр байвал «让我看看» гэнэ. Хийх үйлдлээ хоёр дахин хэлбэл «жаахан …ж үзье» гэсэн утга болно. 玩玩, 画画, 坐坐 гэж бас хэлнэ. Эцэст нь «好吗？» гэвэл эелдэг сонсогдоно.",
  "teacher_notes":"Let's match: 让我看看 / 玩玩 / 画画 / 坐坐, бүгд «好吗？»-аар төгсөнө.",
  "examples":[ex("让我看看。","Ràng wǒ kànkan.","Би хараад үзье."),ex("让我玩玩，好吗？","Ràng wǒ wánwan, hǎo ma?","Би жаахан тоглоод үзье, болох уу?"),ex("让我画画，好吗？","Ràng wǒ huàhua, hǎo ma?","Би жаахан зураад үзье, болох уу?"),ex("让我坐坐，好吗？","Ràng wǒ zuòzuo, hǎo ma?","Би жаахан суугаад үзье, болох уу?")],
  "common_mistakes":[{"wrong":"我让看看。","right":"让我看看。","why":"让 нь эхэнд орно."}],
  "check":chk("«Би жаахан тоглоод үзье, болох уу?» хятадаар:",["让我玩玩，好吗？","让我坐坐，好吗？","我在画画儿呢。"],"让我玩玩，好吗？","g2c"),
  "exercises":[
   choice("________ 我看看。",["让","在","和"],"让","Зөв! 让 = ...болгох, зөвшөөрөх.","让我看看 — «Би хараад үзье».","g2e1"),
   choice("Машинд суумаар байна. Юу гэх вэ?",["让我坐坐，好吗？","让我画画，好吗？","让我看看，好吗？"],"让我坐坐，好吗？","Зөв! 坐 = суух.","坐坐 = суух, 画画 = зурах.","g2e2"),
   judge("«让我看看» гэдэг нь «Би хараад үзье» гэсэн үг.",True,"Зөв!","让我看看 = Би хараад үзье.")]},
 {"point":"太阳和月亮 · 跟……一起","gloss_mn":"«ба», «…тай хамт»",
  "structure":"A 和 B；A 跟 B 一起 + үйлдэл",
  "teacher_mn":"Хоёр юмыг холбохдоо «和» гэнэ: 爷爷和奶奶 — өвөө эмээ хоёр. «…тай хамт» гэвэл «跟……一起» гэнэ: 奶奶跟太阳一起跳舞. Найзтайгаа хамт юм хийхээ хэлж үз!",
  "teacher_notes":"Mini story: 奶奶跟太阳一起跳舞。爷爷跟月亮一起跑步。",
  "examples":[ex("太阳和月亮在跑步。","Tàiyáng hé yuèliang zài pǎobù.","Нар сар хоёр гүйж байна."),ex("奶奶跟太阳一起跳舞。","Nǎinai gēn tàiyáng yìqǐ tiàowǔ.","Эмээ нартай хамт бүжиглэнэ."),ex("爷爷跟月亮一起跑步。","Yéye gēn yuèliang yìqǐ pǎobù.","Өвөө сартай хамт гүйнэ.")],
  "common_mistakes":[{"wrong":"爷爷跟月亮跑步一起。","right":"爷爷跟月亮一起跑步。","why":"一起 нь хийх үйлдлийн өмнө орно."}],
  "check":chk("«Өвөө эмээ хоёр» хятадаар:",["爷爷和奶奶","太阳和月亮","唱歌和跳舞"],"爷爷和奶奶","g3c"),
  "exercises":[
   choice("太阳 ________ 月亮",["和","让","在"],"和","Зөв! 和 = ба.","Хоёр юмыг холбохдоо 和.","g3e1"),
   choice("«Эмээ нартай хамт бүжиглэнэ» хятадаар:",["奶奶跟太阳一起跳舞。","爷爷跟月亮一起跑步。","奶奶喜欢月亮。"],"奶奶跟太阳一起跳舞。","Зөв!","跳舞 = бүжиглэх, 太阳 = нар.","g3e2"),
   judge("«跑步» гэдэг нь «дуулах» гэсэн үг.",False,"Зөв! 跑步 = гүйх.","跑步 = гүйх, 唱歌 = дуулах.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Нар» хятадаар аль нь вэ?",["太阳","月亮","爷爷","苹果"],"太阳","太阳 (tàiyáng) = нар.","easy",["vocabulary"],"a1")
q("choice","«Сар» хятадаар аль нь вэ?",["月亮","太阳","奶奶","妈妈"],"月亮","月亮 (yuèliang) = сар.","easy",["vocabulary"],"a2")
q("choice","«Гүйх» хятадаар аль нь вэ?",["跑步","唱歌","跳舞","吃"],"跑步","跑步 (pǎobù) = гүйх.","easy",["vocabulary"],"a3")
q("choice","«Өвөө» хятадаар аль нь вэ?",["爷爷","奶奶","爸爸","老师"],"爷爷","爷爷 (yéye) = өвөө.","easy",["vocabulary"],"a4")
q("choice","«Эмээ» хятадаар аль нь вэ?",["奶奶","爷爷","妈妈","月亮"],"奶奶","奶奶 (nǎinai) = эмээ.","easy",["vocabulary"],"a5")
q("choice","«Дуулах» хятадаар аль нь вэ?",["唱歌","跳舞","跑步","看"],"唱歌","唱歌 (chànggē) = дуулах.","easy",["vocabulary"],"a6")
q("choice","«Бүжиглэх» хятадаар аль нь вэ?",["跳舞","唱歌","跑步","喝"],"跳舞","跳舞 (tiàowǔ) = бүжиглэх.","easy",["vocabulary"],"a7")
q("choice","«让» гэдэг үг ямар утгатай вэ?",["зөвшөөрөх, …болгох","гүйх","дуулах","ба"],"зөвшөөрөх, …болгох","让 (ràng) — «让我看看» гэх мэтээр хэрэглэнэ.","medium",["vocabulary"],"a8")
q("choice","«Чи юу хийж байна?» хятадаар:",["你在做什么呢？","让我看看。","我在画画儿呢。","爷爷唱歌呢。"],"你在做什么呢？","在……呢 = ...ж байна.","easy",["dialogue"],"a9")
q("choice","«Би зураг зурж байна» хятадаар:",["我在画画儿呢。","你在做什么呢？","让我看看。","奶奶跳舞呢。"],"我在画画儿呢。","画画儿 = зураг зурах.","easy",["dialogue"],"a10")
q("choice","Яриа 1-д охин юу зурсан бэ?",["Нар сар гүйж байгаа","Өвөө дуулж байгаа","Эмээ бүжиглэж байгаа","Алим"],"Нар сар гүйж байгаа","太阳和月亮在跑步 — нар сар гүйж байна.","medium",["dialogue"],"a11")
q("choice","Яриа 2-т өвөө юу хийж байна?",["唱歌","跳舞","跑步","画画儿"],"唱歌","爷爷唱歌呢 — өвөө дуулж байна.","medium",["dialogue"],"a12")
q("cloze","我（ ）画画儿呢。",["在","让","和","真"],"在","在……呢 = ...ж байна.","easy",["dialogue"],"a13")
q("cloze","（ ）我看看。",["让","在","和","吃"],"让","让我看看 = Би хараад үзье.","easy",["dialogue"],"a14")
q("cloze","太阳（ ）月亮在跑步。",["和","让","呢","吗"],"和","和 = ба.","medium",["dialogue"],"a15")
q("cloze","奶奶（ ）太阳一起跳舞。",["跟","让","在","吃"],"跟","跟……一起 = …тай хамт.","medium",["dialogue"],"a16")
q("choice","«让我看看，好吗？» гэж хэзээ хэлэх вэ?",["Найзын зургийг үзмээр байхад","Дуулмаар байхад","Өвөө дуудахад","Сайн уу гэхэд"],"Найзын зургийг үзмээр байхад","让我看看 = Би хараад үзье.","easy",["structure"],"a17")
q("choice","«让我坐坐» гэвэл юу хийхийг хүсч байна вэ?",["Суух","Гүйх","Зурах","Дуулах"],"Суух","坐 = суух.","medium",["structure"],"a18")
q("choice","«让我玩玩» гэвэл юу хийхийг хүсч байна вэ?",["Тоглох","Суух","Харах","Бүжиглэх"],"Тоглох","玩 = тоглох.","medium",["structure"],"a19")
q("choice","«让我画画» гэвэл юу хийхийг хүсч байна вэ?",["Зурах","Харах","Суух","Гүйх"],"Зурах","画 = зурах.","medium",["structure"],"a20")
q("choice","Пиньинь «tàiyáng» гэж уншдаг үг:",["太阳","月亮","爷爷","奶奶"],"太阳","太阳 = tàiyáng = нар.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «pǎobù» гэж уншдаг үг:",["跑步","唱歌","跳舞","月亮"],"跑步","跑步 = pǎobù = гүйх.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «yéye» гэж уншдаг үг:",["爷爷","奶奶","妈妈","爸爸"],"爷爷","爷爷 = yéye = өвөө.","medium",["pronunciation"],"a23")
q("usage","Найз чинь «你在做什么呢？» гэж асуулаа. Чи дуулж байгаа бол:",["我在唱歌呢。","我在跳舞呢。","让我看看。","奶奶唱歌呢。"],"我在唱歌呢。","Дуулж байгаа бол 唱歌.","medium",["usage"],"a24")
q("usage","Найзынхаа тоглоомыг үзмээр байна. Юу гэх вэ?",["让我看看，好吗？","我在画画儿呢。","太阳和月亮。","爷爷唱歌呢。"],"让我看看，好吗？","让我看看 = Би хараад үзье.","medium",["usage"],"a25")
q("usage","爷爷和奶奶 үлгэрт өглөө эмээ юу хийдэг вэ?",["Нартай хамт бүжиглэнэ","Сартай хамт гүйнэ","Дуулна","Зураг зурна"],"Нартай хамт бүжиглэнэ","早上，奶奶跟太阳一起跳舞。","medium",["usage"],"a26")
q("usage","爷爷和奶奶 үлгэрт орой өвөө юу хийдэг вэ?",["Сартай хамт гүйнэ","Нартай хамт бүжиглэнэ","Дуулна","Хоол хийнэ"],"Сартай хамт гүйнэ","晚上，爷爷跟月亮一起跑步。","hard",["usage"],"a27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK3 = ["A","B","C"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (03-05) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）你在画什么呢？ 我在画小猫和小狗。","script_zh":"男：你在画什么呢？ 女：我在画小猫和小狗。","options":["A","B","C","D"],"optionImages":[img("t1a"),img("t1b"),img("t1c"),img("t1d")],"answer":"B","explanation_mn":"«Чи юу зурж байна? — Би муур нохой зурж байна» гэж сонсогдсон. B зураг дээр охин будгаар зураг зурж байна. A хос бүжиглэж байна, C эмэгтэй хүүхэдтэй ном үзэж байна, D сансар (гараг)-ын зураг."},
    {"n":2,"question_zh":"（听录音）和我一起跳舞，好吗？ 好的。","script_zh":"男：和我一起跳舞，好吗？ 女：好的。","options":["A","B","C","D"],"optionImages":[img("t1a"),img("t1b"),img("t1c"),img("t1d")],"answer":"A","explanation_mn":"«Надтай хамт бүжиглэх үү? — За» гэж сонссон. A зураг дээр эр, эм хос бүжиглэж байна. B зурж байна, C ном уншиж байна."},
    {"n":3,"question_zh":"（听录音）太阳和月亮哪个大？ 太阳大，太阳比月亮大很多。","script_zh":"女：太阳和月亮哪个大？ 男：太阳大，太阳比月亮大很多。","options":["A","B","C","D"],"optionImages":[img("t1a"),img("t1b"),img("t1c"),img("t1d")],"answer":"D","explanation_mn":"Нар, сарын тухай ярьсан тул сансрын зураг D. D дээр нар шиг том улбар шар од, гаригууд байна. Бусад нь бүжиг, зураг, ном."},
    {"n":4,"question_zh":"（听录音）看什么书呢？让我也看看。 汉语书。","script_zh":"女：看什么书呢？让我也看看。 男：汉语书。","options":["A","B","C","D"],"optionImages":[img("t1a"),img("t1b"),img("t1c"),img("t1d")],"answer":"C","explanation_mn":"«Ямар ном үзэж байна? Би бас үзье» — ном байгаа зураг C. Эмэгтэй хүүхэдтэй хамт ном үзэж байна."}],
   "answer_source":"YCT 3 Test Answers L3: 1.B 2.A 3.D 4.C"},
  {"part":2,"type":"choice","instruction_mn":"Унших — зурагт тохирох өгүүлбэрийг A, B, C-ээс сонго.","items":[
    {"n":5,"question_zh":"（зургийг хар）","question_mn":"Зураг дээр хоёр охин микрофонтой дуулж байна.","image":img("t5"),"options":BANK3,"optionTexts":["包子比面条儿好吃。","你认识自己的名字吗？","她们两个都爱唱歌。"],"answer":"C","explanation_mn":"Зураг дээр хоёр охин микрофонтой дуулж байгаа тул «她们两个都爱唱歌 — Тэр хоёулаа дуулах дуртай». A бууз гоймнооноос амттай, B чи өөрийнхөө нэрийг таних уу гэсэн утгатай."},
    {"n":6,"question_zh":"（зургийг хар）","question_mn":"Зураг дээр малгайтай охин бүжиглэж байна.","image":img("t6"),"options":BANK3,"optionTexts":["您让我再想想。","我喜欢跳舞，还喜欢唱歌。","小姐，买玫瑰花吗？"],"answer":"B","explanation_mn":"Охин бүжиглэж байгаа тул «我喜欢跳舞，还喜欢唱歌 — Би бүжиглэх дуртай, бас дуулах дуртай». A «Би дахиад бодоод үзье», C «Хатагтай, сарнай авах уу?» гэсэн утгатай."},
    {"n":7,"question_zh":"（зургийг хар）","question_mn":"Зураг дээр үдшийн тэнгэрт сар харагдаж байна.","image":img("t7"),"options":BANK3,"optionTexts":["今天的月亮真漂亮。","谢谢您的帮助！","他们在看电视。"],"answer":"A","explanation_mn":"Тэнгэрт сар байгаа тул «今天的月亮真漂亮 — Өнөөдрийн сар үнэхээр хөөрхөн». B «Тусалсанд баярлалаа», C «Тэд телевиз үзэж байна»."},
    {"n":8,"question_zh":"（зургийг хар）","question_mn":"Зураг дээр эмээ хуруугаа уруулдаа тавьж «чш» гэж байна.","image":img("t8"),"options":BANK3,"optionTexts":["你和爷爷、奶奶一起去吗？","奶奶不让我说话。","我每天都跑步。"],"answer":"B","explanation_mn":"Эмээ «чш, дуугүй» гэж байгаа тул «奶奶不让我说话 — Эмээ намайг ярихыг зөвшөөрөхгүй байна». A «Чи өвөө, эмээтэйгээ хамт явах уу?», C «Би өдөр бүр гүйдэг»."}],
   "answer_source":"YCT 3 Test Answers L3: 5.C 6.B 7.A 8.B"},
  {"part":3,"type":"match","instruction_mn":"Let's match — зураг бүрд тохирох өгүүлбэрийг A, B, C, D-ээс сонго.","items":[
    {"n":1,"question_zh":"（зураг 1）","image":img("m1"),"options":["A","B","C","D"],"optionTexts":["让我看看，好吗？","让我玩玩，好吗？","让我画画，好吗？","让我坐坐，好吗？"],"answer":"C","explanation_mn":"Зураг 1 дээр хүүхэд тавцан дээр зураг зурж байна — 让我画画."},
    {"n":2,"question_zh":"（зураг 2）","image":img("m2"),"options":["A","B","C","D"],"optionTexts":["让我看看，好吗？","让我玩玩，好吗？","让我画画，好吗？","让我坐坐，好吗？"],"answer":"A","explanation_mn":"Зураг 2 дээр хүүхдүүд компьютерийн дэлгэц рүү харж байна — 让我看看."},
    {"n":3,"question_zh":"（зураг 3）","image":img("m3"),"options":["A","B","C","D"],"optionTexts":["让我看看，好吗？","让我玩玩，好吗？","让我画画，好吗？","让我坐坐，好吗？"],"answer":"D","explanation_mn":"Зураг 3 дээр охин тоглоомон машинд суусан, нөгөө нь суумаар байна — 让我坐坐."},
    {"n":4,"question_zh":"（зураг 4）","image":img("m4"),"options":["A","B","C","D"],"optionTexts":["让我看看，好吗？","让我玩玩，好吗？","让我画画，好吗？","让我坐坐，好吗？"],"answer":"B","explanation_mn":"Зураг 4 дээр охид тоглоомоор тоглож байна — 让我玩玩."}],
   "answer_source":"Let's match х.15 (ном хариу өгөөгүй; зургаар агент тааруулсан)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «爷爷和奶奶» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"奶奶喜欢太阳，爷爷喜欢月亮。","answer":"1","explanation_mn":"1-р зураг дээр өвөө эмээ гараа барьж, дээр нь нар сар байна."},
    {"n":2,"question_zh":"早上，奶奶跟太阳一起跳舞。","answer":"2","explanation_mn":"2-р зураг дээр эмээ нарны доор бүжиглэж байна."},
    {"n":3,"question_zh":"晚上，爷爷跟月亮一起跑步。","answer":"3","explanation_mn":"3-р зураг дээр өвөө сарны доор гүйж байна."},
    {"n":4,"question_zh":"我们一起来运动，你们觉得怎么样？","answer":"4","explanation_mn":"4-р зураг дээр өвөө эмээ хүүхдүүдтэй гар барьж хамт хөдөлж байна."}],
   "answer_source":"textbook х.16 (Mini story)"},
  {"part":5,"type":"match","instruction_mn":"Let's play «Мөрдөгч тоглоом» — зураг бүрд «我在……呢» гэж хэлж үз. (Аудио 03-03 алга)","audio":AUD_PLAY,"items":[
    {"n":1,"question_zh":"我在____呢。","answer":"我在画画儿呢。","explanation_mn":"Охин зураг зурж байгаа зураг дээр «我在画画儿呢». Бусад зургаар 唱歌, 跳舞, 跑步 гэх мэтээр хэл."}],
   "answer_source":"Let's play х.15 (нээлттэй тоглоом)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «太阳» гэсэн ханзыг дахин бичиж хуул.","question_zh":"太阳","answer":"太阳","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."},
   {"n":2,"prompt_mn":"Бичиж үз — «月亮» гэсэн ханзыг хуул.","question_zh":"月亮","answer":"月亮","explanation_mn":"Эхлээд 月, дараа нь 亮."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа юу хийж байгааг нь асуу.","question_zh":"你在做什么呢？","answer":"你在做什么呢？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":2,"prompt_mn":"Найзынхаа юмыг үзмээр байна.","question_zh":"让我看看，好吗？","answer":"让我看看，好吗？","explanation_mn":"«好吗？» нэмбэл эелдэг."},
   {"n":3,"prompt_mn":"Өвөө эмээ жүжиг: нартай бүжиглэ, сартай гүй.","question_zh":"我们一起来运动！","answer":"(нээлттэй)","explanation_mn":"Аудио 03-04-ийн хамт."}]},
 "answerSource":"YCT 标准教程 3 · Test Listening Scripts, Test Answers (Lesson 3)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("taiyang","太阳"),("yueliang","月亮"),("paobu","跑步"),("yeye","爷爷"),("nainai","奶奶"),("changge","唱歌"),("tiaowu","跳舞"),("rang","让")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"我在画画儿呢。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你在做什么呢？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"爷爷、奶奶做什么呢？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"我们一起来运动","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"爷爷和奶奶 · Mini story","role":"illustration","section":"story"},
 {"id":"story-art","file":"images/story.jpg","title":"爷爷和奶奶","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d","5","6","7","8"]] \
  + [{"id":f"m{k}","file":f"images/m{k}.png","title":f"Let's match {k}","role":"illustration","section":"workbook"} for k in range(1,5)]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 3 · 3-р хичээл — Би зураг зурж байна","chineseTitle":"我在画画儿呢。","targetTitle":"我在画画儿呢。","mongolianTitle":"Би зураг зурж байна",
 "subtitle":"太阳 · 月亮 · 爷爷 · 奶奶 · 在……呢 · 让我看看",
 "description":f"Одоо юу хийж байгаагаа (在……呢) хэлж, найзаасаа «让我看看» гэж хүсэж сурна. {len(vocab)} үг, 2 зурагт яриа, Mini story «爷爷和奶奶», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🌞","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 3",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 3 — 第3课《我在画画儿呢。》 [hskLevel=2] [lessonNumber=3]; эх: сурах бичиг х.13–17; аудио CD 03-01, 03-02, 03-04, 03-05 (03-03 Let's play алга)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"我在画画儿呢。","mongolianTitle":"Би зураг зурж байна",
 "series":"YCT 标准教程 3","seriesLabel_mn":"YCT 3 — Хүүхдийн хятад хэл (≈HSK2)",
 "source":"YCT 标准教程 3 · 第3课 (сурах бичиг + CD аудио 03-01,02,04,05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"play":AUD_PLAY,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L3)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
