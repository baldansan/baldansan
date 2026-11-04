#!/usr/bin/env python3
"""YCT 标准教程 2 · 第2课 你早上几点起床？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
OUT = "/home/claude/work/yct2/l02/pkg"
CID, LID, N = "yct-2", "yct-2-l02", 2
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
_pg = Image.open("/home/claude/work/yct2/l02/pages/hi-14.png").convert("RGB")
_cols = [(338,584),(592,840),(848,1094)]
_rows = [(320,444),(492,614),(662,784),(830,952)]
_BOX = {}
for r in range(4):
    for c,l in enumerate("abc"):
        _BOX[f"t{r+1}{l}"] = (_cols[c][0],_rows[r][0],_cols[c][1],_rows[r][1])
_BOX.update({"t5a":(276,1090,440,1214),"t5b":(552,1082,640,1214),"t5c":(782,1086,880,1214),"t5d":(990,1082,1130,1214)})
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS)
    _c.save(f"{OUT}/images/{_k}.png")
_st = Image.open("/home/claude/work/yct2/l02/pages/hi-13.png").convert("RGB")
_st.crop((55,290,1110,1545)).save(f"{OUT}/images/story.png")

A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-2-02-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-2-02-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-2-02-02.mp3'\nfile '{A}/yct-2-02-03.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("起床","qǐchuáng","орноосоо босох, сэрэх","үйл үг · гол үг","快快起床！","Kuài kuài qǐchuáng!","Хурдан хурдан босоорой!",True),
 ("睡觉","shuìjiào","унтах","үйл үг · гол үг","快睡觉！","Kuài shuìjiào!","Хурдан унт!",True),
 ("早上","zǎoshang","өглөө","цаг заасан үг · гол үг","你早上几点起床？","Nǐ zǎoshang jǐ diǎn qǐchuáng?","Чи өглөө хэд цагт босдог вэ?",True),
 ("晚上","wǎnshang","орой, шөнө","цаг заасан үг · гол үг","今天晚上我可以不睡觉吗？","Jīntiān wǎnshang wǒ kěyǐ bú shuìjiào ma?","Өнөө орой би унтахгүй байж болох уу?",True),
 ("点","diǎn","цаг (цагийн заалт)","тоолох үг · гол үг","我七点起床。","Wǒ qī diǎn qǐchuáng.","Би долоон цагт босдог.",True),
 ("到","dào","...-аас ... хүртэл","холбох үг · нэмэлт үг","星期一到星期五","Xīngqīyī dào Xīngqīwǔ","Даваагаас баасан гараг хүртэл",False),
 ("呢","ne","...-ийг яах вэ? (асуулт дагуулдаг үг)","өгүүлбэрийн төгсгөлийн үг · нэмэлт үг","星期六和星期天呢？","Xīngqīliù hé Xīngqītiān ne?","Бямба, ням гарагт яах вэ?",False),
 ("要","yào","хүсэх, хийхээр төлөвлөх","үйл үг · нэмэлт үг","我要看小鱼几点睡觉。","Wǒ yào kàn xiǎo yú jǐ diǎn shuìjiào.","Би загас хэдэн цагт унтахыг харах гэж байна.",False),
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
 {"id":1,"title_mn":"Яриа 1 · Хоёр хүү өглөө хэд цагт босдгоо ярилцаж байна","scene_mn":"Нэг хүү орон дээрээ сууж байна, нөгөө хоёр нь хажууд нь зогсоно. Тэд даваа–баасан, бямба–ням гарагт хэд цагт босдгоо хэлж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"大卫","zh":"你早上几点起床？","pinyin":"Nǐ zǎoshang jǐ diǎn qǐchuáng?","mn":"Чи өглөө хэд цагт босдог вэ?"},
           {"speaker":"小明","zh":"星期一到星期五我7点起床。","pinyin":"Xīngqīyī dào Xīngqīwǔ wǒ qī diǎn qǐchuáng.","mn":"Даваагаас баасан гараг хүртэл би долоон цагт босдог."},
           {"speaker":"大卫","zh":"星期六和星期天呢？","pinyin":"Xīngqīliù hé Xīngqītiān ne?","mn":"Бямба, ням гарагт яадаг вэ?"},
           {"speaker":"小明","zh":"星期六和星期天我12点起床。","pinyin":"Xīngqīliù hé Xīngqītiān wǒ shí'èr diǎn qǐchuáng.","mn":"Бямба, ням гарагт би арван хоёр цагт босдог."}]},
 {"id":2,"title_mn":"Яриа 2 · Хүү унтахгүй байж болох уу гэж асууж байна","scene_mn":"Хүү аквариумын загасаа харж, гараа хацартаа тулж сууна. Ээж нь цонхны дэргэд зогсож байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"妈妈，今天晚上我可以不睡觉吗？","pinyin":"Māma, jīntiān wǎnshang wǒ kěyǐ bú shuìjiào ma?","mn":"Ээж ээ, өнөө орой би унтахгүй байж болох уу?"},
           {"speaker":"妈妈","zh":"你要做什么？","pinyin":"Nǐ yào zuò shénme?","mn":"Чи юу хийх гэж байна?"},
           {"speaker":"小明","zh":"我要看小鱼几点睡觉。","pinyin":"Wǒ yào kàn xiǎo yú jǐ diǎn shuìjiào.","mn":"Би загас хэдэн цагт унтахыг харах гэж байна."}]},
]
sentences=[]
dlg = [
 (1,"大卫：你早上几点起床？","Dàwèi: Nǐ zǎoshang jǐ diǎn qǐchuáng?","Дэвид: Чи өглөө хэд цагт босдог вэ?","大卫：| 你|nǐ 早上|zǎoshang 几|jǐ 点|diǎn 起床|qǐchuáng ？|","几点 = хэд цаг. Хариулахдаа «七点» гэх мэтээр цагаа хэлнэ.",["你早上几点起床？"]),
 (1,"小明：星期一到星期五我7点起床。","Xiǎo Míng: Xīngqīyī dào Xīngqīwǔ wǒ qī diǎn qǐchuáng.","Сяо Мин: Даваагаас баасан гараг хүртэл би долоон цагт босдог.","小明：| 星期一|xīngqīyī 到|dào 星期五|xīngqīwǔ 我|wǒ 7|  点|diǎn 起床|qǐchuáng 。|","到 = «хүртэл». 星期一到星期五 = даваагаас баасан хүртэл.",[]),
 (1,"大卫：星期六和星期天呢？","Dàwèi: Xīngqīliù hé Xīngqītiān ne?","Дэвид: Бямба, ням гарагт яадаг вэ?","大卫：| 星期六|xīngqīliù 和|hé 星期天|xīngqītiān 呢|ne ？|","呢 — «харин ... нь?» гэж асуултаа үргэлжлүүлнэ.",[]),
 (1,"小明：星期六和星期天我12点起床。","Xiǎo Míng: Xīngqīliù hé Xīngqītiān wǒ shí'èr diǎn qǐchuáng.","Сяо Мин: Бямба, ням гарагт би арван хоёр цагт босдог.","小明：| 星期六|xīngqīliù 和|hé 星期天|xīngqītiān 我|wǒ 12|  点|diǎn 起床|qǐchuáng 。|","",[]),
 (2,"小明：妈妈，今天晚上我可以不睡觉吗？","Xiǎo Míng: Māma, jīntiān wǎnshang wǒ kěyǐ bú shuìjiào ma?","Сяо Мин: Ээж ээ, өнөө орой би унтахгүй байж болох уу?","小明：| 妈妈|māma ，| 今天|jīntiān 晚上|wǎnshang 我|wǒ 可以|kěyǐ 不|bú 睡觉|shuìjiào 吗|ma ？|","可以不睡觉吗 — «унтахгүй байж болох уу?» гэж зөвшөөрөл гуйна.",["今天晚上我可以不睡觉吗？"]),
 (2,"妈妈：你要做什么？","Māma: Nǐ yào zuò shénme?","Ээж: Чи юу хийх гэж байна?","妈妈：| 你|nǐ 要|yào 做|zuò 什么|shénme ？|","要 = «хийхийг хүсэх, хийх гэж байх».",[]),
 (2,"小明：我要看小鱼几点睡觉。","Xiǎo Míng: Wǒ yào kàn xiǎo yú jǐ diǎn shuìjiào.","Сяо Мин: Би загас хэдэн цагт унтахыг харах гэж байна.","小明：| 我|wǒ 要|yào 看|kàn 小鱼|xiǎo yú 几点|jǐ diǎn 睡觉|shuìjiào 。|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":[t for t in tok(tk) if t["zh"]]}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("小松鼠：妈妈，我要和朋友们出去玩！","Xiǎo sōngshǔ: Māma, wǒ yào hé péngyoumen chūqu wán!","Бяцхан хэрэм: Ээж ээ, би найзуудтайгаа гадаа тоглох гэж байна!","小松鼠：|xiǎo sōngshǔ 妈妈|māma ，| 我|wǒ 要|yào 和|hé 朋友们|péngyoumen 出去|chūqu 玩|wán ！|"),
 ("妈妈：去吧。","Māma: Qù ba.","Ээж: Яв даа.","妈妈：| 去|qù 吧|ba 。|"),
 ("小松鼠：你们在哪儿？快出来玩吧！","Xiǎo sōngshǔ: Nǐmen zài nǎr? Kuài chūlai wán ba!","Бяцхан хэрэм: Та нар хаана байна? Хурдан гараад ирж тоглоорой!","小松鼠：|xiǎo sōngshǔ 你们|nǐmen 在|zài 哪儿|nǎr ？| 快|kuài 出来|chūlai 玩|wán 吧|ba ！|"),
 ("小松鼠：大熊哥哥，你今天怎么不起床？","Xiǎo sōngshǔ: Dà xióng gēge, nǐ jīntiān zěnme bù qǐchuáng?","Бяцхан хэрэм: Баавгай ах аа, чи өнөөдөр яагаад босохгүй байна вэ?","小松鼠：|xiǎo sōngshǔ 大熊|dà xióng 哥哥|gēge ，| 你|nǐ 今天|jīntiān 怎么|zěnme 不|bù 起床|qǐchuáng ？|"),
 ("小松鼠：青蛙弟弟，你今天怎么不起床？","Xiǎo sōngshǔ: Qīngwā dìdi, nǐ jīntiān zěnme bù qǐchuáng?","Бяцхан хэрэм: Мэлхий дүү минь, чи өнөөдөр яагаад босохгүй байна вэ?","小松鼠：|xiǎo sōngshǔ 青蛙|qīngwā 弟弟|dìdi ，| 你|nǐ 今天|jīntiān 怎么|zěnme 不|bù 起床|qǐchuáng ？|"),
 ("小松鼠：它们今天怎么都不起床？","Xiǎo sōngshǔ: Tāmen jīntiān zěnme dōu bù qǐchuáng?","Бяцхан хэрэм: Тэд өнөөдөр яагаад бүгд босохгүй байна вэ?","小松鼠：|xiǎo sōngshǔ 它们|tāmen 今天|jīntiān 怎么|zěnme 都|dōu 不|bù 起床|qǐchuáng ？|"),
 ("山羊爷爷：冬天它们每天睡觉，不起床。","Shānyáng yéye: Dōngtiān tāmen měitiān shuìjiào, bù qǐchuáng.","Ямаа өвөө: Өвлийн улиралд тэд өдөр бүр унтаж, босдоггүй юм.","山羊爷爷：|shānyáng yéye 冬天|dōngtiān 它们|tāmen 每天|měitiān 睡觉|shuìjiào ，| 不|bù 起床|qǐchuáng 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «你怎么不起床？» — 5 зурагт өвлийн үлгэр. 怎么不起床 = яагаад босохгүй байна вэ?"
    if i==6: s["note"]="冬天 = өвөл. Баавгай, мэлхий өвөлдөө дуйдаг тул босдоггүй!"
    sentences.append(s)
chant = [
 ("快快起床，快快起床，","Kuài kuài qǐchuáng, kuài kuài qǐchuáng,","Хурдан хурдан босоорой, хурдан хурдан босоорой,","快快|kuài kuài 起床|qǐchuáng ，| 快快|kuài kuài 起床|qǐchuáng ，|"),
 ("7点啦，7点啦。","Qī diǎn la, qī diǎn la.","Долоон цаг боллоо, долоон цаг боллоо.","7|  点|diǎn 啦|la ，| 7|  点|diǎn 啦|la 。|"),
 ("太阳已经很高，太阳已经很高。","Tàiyáng yǐjīng hěn gāo, tàiyáng yǐjīng hěn gāo.","Нар аль хэдийн өндөрт гарлаа, нар аль хэдийн өндөрт гарлаа.","太阳|tàiyáng 已经|yǐjīng 很|hěn 高|gāo ，| 太阳|tàiyáng 已经|yǐjīng 很|hěn 高|gāo 。|"),
 ("快起床，快起床！","Kuài qǐchuáng, kuài qǐchuáng!","Хурдан босоорой, хурдан босоорой!","快|kuài 起床|qǐchuáng ，| 快|kuài 起床|qǐchuáng ！|"),
 ("快快睡觉，快快睡觉，","Kuài kuài shuìjiào, kuài kuài shuìjiào,","Хурдан хурдан унтаарай, хурдан хурдан унтаарай,","快快|kuài kuài 睡觉|shuìjiào ，| 快快|kuài kuài 睡觉|shuìjiào ，|"),
 ("9点啦，9点啦。","Jiǔ diǎn la, jiǔ diǎn la.","Есөн цаг боллоо, есөн цаг боллоо.","9|  点|diǎn 啦|la ，| 9|  点|diǎn 啦|la 。|"),
 ("月亮已经很高，月亮已经很高。","Yuèliang yǐjīng hěn gāo, yuèliang yǐjīng hěn gāo.","Сар аль хэдийн өндөрт гарлаа, сар аль хэдийн өндөрт гарлаа.","月亮|yuèliang 已经|yǐjīng 很|hěn 高|gāo ，| 月亮|yuèliang 已经|yǐjīng 很|hěn 高|gāo 。|"),
 ("快睡觉，快睡觉！","Kuài shuìjiào, kuài shuìjiào!","Хурдан унтаарай, хурдан унтаарай!","快|kuài 睡觉|shuìjiào ，| 快|kuài 睡觉|shuìjiào ！|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    tks=[t for t in tok(tk) if t["zh"].strip()]
    for t in tks: t["zh"]=t["zh"].strip()
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tks}
    if i==0: s["note"]="Chant «快快起床» — босох дууг сунаж, гараа дээш өргөөд дууль. Унтах дууг гараа хацартаа тулж, нүдээ анин дууль."
    sentences.append(s)
for s in sentences:
    for t in s["tokens"]:
        t["zh"]=t["zh"].strip()
    s["tokens"]=[t for t in s["tokens"] if t["zh"]]

texts = {
 "unit":{"number":"2","title":"你早上几点起床？","mongolianTitle":"Чи өглөө хэд цагт босдог вэ? — өдрийн цаг ба унтах, босох"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, найзуудаа! Би Тэмээ багш. Өмнөх номонд чи гэр бүл, өдрийн цагийн талаар хэдэн үг сурсан даа. Одоо хятадаар «чи хэдэн цагт босдог вэ?» гэж асууж сурна. Өглөө нь «早上 (zǎoshang)», орой нь «晚上 (wǎnshang)» гэнэ. Босохыг «起床 (qǐchuáng)», унтахыг «睡觉 (shuìjiào)» гэж хэлдэг юм. «我七点起床» гэвэл «Би долоон цагт босдог» гэсэн үг. Дараа нь «快快起床» дууг гараа өргөн, хацартаа тулж дуулна. Мөн өвлийн нойрсдог баавгай, мэлхийн үлгэрийг хамт уншина. Эхэлцгээе!",
  "warmup_mn":"Чи өглөө хэдэн цагт босдог вэ? Хуруугаараа цагаа үзүүл. Орой хэдэн цагт унтдаг вэ?",
  "theme_zh":"早上 · 晚上 · 几点起床 · 几点睡觉","theme_mn":"Өглөө · Орой · Хэд цагт босох, унтах"},
 "warmup":{"mongolian":"Чи өглөө хэдэн цагт босдог вэ? Орой хэдэн цагт унтдаг вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"2","title":"你早上几点起床？","mongolianTitle":"Чи өглөө хэд цагт босдог вэ? — яриа, дуу, үлгэр","title_mn":"Let's read · 2 яриа + Let's chant · 快快起床 + Mini story · 你怎么不起床？","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第2课 Let's read / Let's chant / Mini story（CD 02-02, 02-03, 02-04）","author_zh":"",
  "intro_zh":"两段小对话：你早上几点起床？今天晚上我可以不睡觉吗？然后唱歌《快快起床》，再读小故事《你怎么不起床？》。",
  "intro_mn":"Эхлээд хоёр богино яриа: «你早上几点起床？» гэж босох цагийг асууна. «我可以不睡觉吗？» гэж ээжээсээ зөвшөөрөл гуйна. Дараа нь «快快起床» дууг гараараа хөдөлгөөн хийж дуулна. Сүүлд өвлийн нойрсдог баавгай, мэлхийн тухай «Чи яагаад босохгүй байна?» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хоёр хүү босох цагаа ярилцана. Даваагаас баасан хүртэл долоон цагт, бямба ням гарагт арван хоёр цагт босдог."},
   {"paragraph":2,"mn":"Яриа 2 — Хүү ээждээ «өнөө орой унтахгүй байж болох уу?» гэж асууна. Загас хэдэн цагт унтахыг харах гэж байгаа юм."},
   {"paragraph":3,"mn":"Үлгэр «Чи яагаад босохгүй байна?» — Бяцхан хэрэм найзуудаа тоглоход дуудахад баавгай, мэлхий хоёр босохгүй байв. Ямаа өвөө өвөл бүгд өдөр бүр унтдаг гэж тайлбарлав. Аудио: 02-04."},
   {"paragraph":4,"mn":"Chant «Хурдан босоорой» — долоон цагт нар өндөрт гарахад босоорой, есөн цагт сар өндөрт гарахад унтаарай гэж дуулна. Аудио: 02-03."}],
  "reflection":{"questions_mn":["Чи даваагаас баасан хүртэл хэдэн цагт босдог вэ? Хятадаар хэлж үз.","Бямба, ням гарагт хэдэн цагт босдог вэ?","Баавгай, мэлхий өвөлдөө яагаад босдоггүй вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Өглөө хэдэн цагт босдгоо хэл","zh":"我早上七点起床。","pinyin":"Wǒ zǎoshang qī diǎn qǐchuáng.","mn":"Би өглөө долоон цагт босдог."},
  "writingPrompt_mn":"Өөрийнхөө босдог цагийг хэл: 我早上……点起床。 Дараа нь «你呢？» гэж найзаасаа асуу!"},
 "properNouns":[],
 "wordExplanation":[
  {"word":"几点","gloss":"jǐ diǎn — хэд цаг","explanation":"«几» нь «хэдэн», «点» нь «цаг». Тиймээс «你早上几点起床？» гэвэл «Чи өглөө хэд цагт босдог вэ?» гэсэн үг. Хариулахдаа тоо дээр 点 нэмнэ: «七点» — долоон цаг.",
   "structure":"你早上几点起床？ → 我早上 + тоо + 点起床。","teacher_notes":"Хүүхдэд цагийн зураг, тоглоомон цаг үзүүлж, «хэд цаг вэ?» гэж асуулгаад хариулуул. Дүрмийн нэр томьёо хэрэглэхгүй.",
   "examples":[{"chinese":"你早上几点起床？","pinyin":"Nǐ zǎoshang jǐ diǎn qǐchuáng?","mongolian":"Чи өглөө хэд цагт босдог вэ?"},{"chinese":"我早上七点起床。","pinyin":"Wǒ zǎoshang qī diǎn qǐchuáng.","mongolian":"Би өглөө долоон цагт босдог."},{"chinese":"我要看小鱼几点睡觉。","pinyin":"Wǒ yào kàn xiǎo yú jǐ diǎn shuìjiào.","mongolian":"Би загас хэдэн цагт унтахыг харах гэж байна."}],
   "common_mistakes":[{"wrong":"你起床早上几点？","right":"你早上几点起床？","why":"Цагаа заасан үгийг (өглөө, 7 цаг) үйл үгийн өмнө хэлнэ."}],
   "check":{"question":"«Чи өглөө хэд цагт босдог вэ?» хятадаар:","options":["你早上几点起床？","我七点起床。","快快睡觉。"],"answer":"0"},
   "practice":[{"n":1,"question":"我早上 ________ 起床。(долоон цаг)","answer":"七点","explanation_mn":"七 = долоо, 点 = цаг. 七点 — долоон цаг."}]},
  {"word":"到 / 呢","gloss":"dào / ne — хүртэл / харин ... нь?","explanation":"«星期一到星期五» — даваагаас баасан хүртэл. «到» нь хоёр зүйлийн хооронд орж «хүртэл» гэсэн утга өгнө. Нэг асуултыг «呢» гэж үргэлжлүүлж болно: «星期六和星期天呢？» — «Харин бямба, ням гарагт яадаг вэ?»",
   "structure":"A 到 B  ·  ……，你呢？","teacher_notes":"呢-ийн тоглоом (х.8): нэг хүүхэд «我七点起床，你呢？» гэж асууж, хөршийнхөө хариултыг сонсоод адилхан асуулт дамжуулна.",
   "examples":[{"chinese":"星期一到星期五","pinyin":"Xīngqīyī dào Xīngqīwǔ","mongolian":"Даваагаас баасан хүртэл"},{"chinese":"星期六和星期天呢？","pinyin":"Xīngqīliù hé Xīngqītiān ne?","mongolian":"Харин бямба, ням гарагт?"},{"chinese":"我是中国人，你呢？","pinyin":"Wǒ shì Zhōngguó rén, nǐ ne?","mongolian":"Би хятад хүн. Харин чи?"}],
   "common_mistakes":[{"wrong":"你呢吗？","right":"你呢？","why":"呢 ба 吗 хоёрыг хамт хэрэглэхгүй."}],
   "check":{"question":"«Даваагаас баасан хүртэл» хятадаар:","options":["星期一到星期五","星期一和星期五","星期一起床"],"answer":"0"},
   "practice":[{"n":1,"question":"星期一 ________ 星期五 (хүртэл)","answer":"到","explanation_mn":"«Хүртэл» гэж хэлэхэд 到."}]},
  {"word":"要 / 可以不……吗","gloss":"yào / kěyǐ bù … ma — хүсэх / ...хийхгүй байж болох уу?","explanation":"«我要看小鱼» — «Би загасыг харах гэж байна». «要» нь хийхийг хүсэж байгааг хэлнэ. Зөвшөөрөл гуйхдаа «可以……吗？» гэнэ: «我可以不睡觉吗？» — «Би унтахгүй байж болох уу?».",
   "structure":"我要 + хийх зүйл。 · 我可以不 + хийх зүйл + 吗？","teacher_notes":"Ээж, аавдаа зөвшөөрөл гуйх жижиг жүжиг тоглуул: «我可以……吗？»",
   "examples":[{"chinese":"你要做什么？","pinyin":"Nǐ yào zuò shénme?","mongolian":"Чи юу хийх гэж байна?"},{"chinese":"我要喝水。","pinyin":"Wǒ yào hē shuǐ.","mongolian":"Би ус уумаар байна."},{"chinese":"我可以不睡觉吗？","pinyin":"Wǒ kěyǐ bú shuìjiào ma?","mongolian":"Би унтахгүй байж болох уу?"}],
   "common_mistakes":[{"wrong":"我可以不睡觉？(吗 орхих)","right":"我可以不睡觉吗？","why":"Асуухад төгсгөлд нь 吗 тавина."}],
   "check":{"question":"«Би ус уумаар байна» хятадаар:","options":["我要喝水。","你要做什么？","我七点起床。"],"answer":"0"},
   "practice":[{"n":1,"question":"你 ________ 做什么？(хүсэх)","answer":"要","explanation_mn":"«Юу хийх гэж байна?» — 要."}]},
 ],
 "collocations":[{"type":"цаг + үйл — өдрийн дэглэм","rows":[
   {"head":"早上","with":"起床","mn":"өглөө босох","usage_mn":"Өглөөний үйл","example":{"zh":"我早上七点起床。","pinyin":"Wǒ zǎoshang qī diǎn qǐchuáng.","mn":"Би өглөө долоон цагт босдог."}},
   {"head":"晚上","with":"睡觉","mn":"орой унтах","usage_mn":"Оройн үйл","example":{"zh":"我晚上九点睡觉。","pinyin":"Wǒ wǎnshang jiǔ diǎn shuìjiào.","mn":"Би орой есөн цагт унтдаг."}},
   {"head":"星期一","with":"到星期五","mn":"даваагаас баасан хүртэл","usage_mn":"Цагийн хүрээ","example":{"zh":"星期一到星期五","pinyin":"Xīngqīyī dào Xīngqīwǔ","mn":"Даваагаас баасан хүртэл"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["起床","睡觉","点","到"],"items":[
     {"n":1,"question":"我早上七 ________ 起床。","answer":"点","explanation_mn":"Цагийг хэлэхэд 点."},
     {"n":2,"question":"晚上我 ________，月亮很高。","answer":"睡觉","explanation_mn":"Оройд сар гарахад унтана — 睡觉."},
     {"n":3,"question":"星期一 ________ 星期五","answer":"到","explanation_mn":"«Хүртэл» — 到."},
     {"n":4,"question":"太阳很高了，快 ________！","answer":"起床","explanation_mn":"Нар өндөр гарсан тул босох цаг боллоо — 起床."}]}],
   "answer_source":"agent-authored (YCT 2 · L2 үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"他星期六早上几点起床？","answer":"12点。","explanation_mn":"Яриа 1 — бямба, ням гарагт арван хоёр цагт босдог."},
     {"n":2,"question_zh":"他要做什么？","answer":"看小鱼几点睡觉。","explanation_mn":"Яриа 2 — хүү загас хэдэн цагт унтахыг харах гэж байна."}],
   "answer_source":"textbook_verified (Let's read, х.9)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Асуултаа дамжуул","start_zh":"我七点起床，你呢？","instruction_mn":"Тойрог болж суугаад нэг нь «我七点起床，你呢？» гэж хөршөөсөө асууна. Хөрш нь хариулаад өөрийнхөө хөршөөс адилхан асууна. Бүгд хариулах хүртэл үргэлжлүүл. Дараа нь өөр асуулт сонго!"},
     {"label":"Хэдэн цагт босдгоо асуу","start_zh":"你早上几点起床？","instruction_mn":"Ээж, аав, ах, эгчээсээ «你早上几点起床？» гэж асуугаад хариултыг нь цагаар ширээн дээр зур. Даваа–баасан, бямба, нямыг тусад нь асуугаарай."},
     {"label":"Миний хуваарь","start_zh":"星期天 · 星期一到星期五 · 星期六","instruction_mn":"Цаасан дээр хүснэгт зураад босох, хоол идэх, сургуульд явах, унтах цагаа бич. Найзынхаа хуваартай харьцуулаад адилхан, өөр цагийг ол."},
     {"label":"Үлгэр жүжигчилье","start_zh":"你怎么不起床？","instruction_mn":"Нэг нь бяцхан хэрэм, нэг нь баавгай, нэг нь мэлхий, нэг нь ямаа өвөө болоорой. Хэрэм «你怎么不起床？» гэж асуухад бусад нь нойрмоглоод «冬天睡觉！» гэж хариулаарай."}]}},
 "grammarNotes":[],
 "culture":{"title":"冬天睡觉 · 冬眠","title_mn":"Өвөл дуйдаг амьтад","text_mn":"Хятадын хойд хэсэгт өвөл маш хүйтэн. Баавгай, мэлхий өвлийн турш унтаж, хаврыг хүлээдэг. Хятад хүүхдүүд ч өглөө сургуульдаа эрт босдог. Тэд заримдаа долоон цагаас өмнө босно.","note_mn":"Монголын өвөл ч хүйтэн. Чи өвлийн өглөө хэдэн цагт босдог вэ? Баавгай шиг унтмаар байдаг уу?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — өдрийн цаг, босох ба унтах цагаа хэлэх.","topic":"Өдрийн дэглэмээ хятадаар хэл","discussion":["Хосоороо: «你早上几点起床？» гэж асууж, «我早上……点起床» гэж хариул.","Бүгдээрээ «快快起床» дууг хөдөлгөөнтэй дуул."],
   "writing":{"promptChinese":"我早上……点起床。","promptMongolian":"Гэрийн даалгавар: «Миний хуваарь» хүснэгтийг бөглөөд ээж, аавдаа «我早上……点起床» гэж хэлж өг.","minChars":"0","requiredWords":["早上","起床","点"],"sampleChinese":"我早上七点起床，晚上九点睡觉。","sampleMongolian":"Би өглөө долоон цагт босож, орой есөн цагт унтдаг.","gradingRubric":"Цагийг зөв хэлсэн, 点-ийг ашигласан эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers: L2 1B 2C 3B 4B 5D 6B 7A 8C","parts":[]},
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
 {"point":"我早上七点起床。 — цагаа хэлэх","gloss_mn":"«Би өглөө долоон цагт босдог» — хэд цагт хийхийг хэлнэ",
  "structure":"你早上几点起床？ → 我早上 + тоо + 点起床。",
  "teacher_mn":"Хэд цагт босдгийг асуухдаа «你早上几点起床？» гэнэ. 几 = хэдэн, 点 = цаг. Хариулахдаа тоо хэлээд 点 нэмнэ: «七点». Цагаа заасан үгийг үйл үгийн өмнө хэлдэг. Гараараа цаг үзүүлж хэлээд үз!",
  "teacher_notes":"Номын key sentence: 我早上七点起床。 Тоглоомон цагаар 6, 7, 9, 12 цагийг заалгаж давтуул.",
  "examples":[ex("你早上几点起床？","Nǐ zǎoshang jǐ diǎn qǐchuáng?","Чи өглөө хэд цагт босдог вэ?"),ex("我早上七点起床。","Wǒ zǎoshang qī diǎn qǐchuáng.","Би өглөө долоон цагт босдог."),ex("我12点起床。","Wǒ shí'èr diǎn qǐchuáng.","Би арван хоёр цагт босдог."),ex("9点啦！快睡觉！","Jiǔ diǎn la! Kuài shuìjiào!","Есөн цаг боллоо! Хурдан унтаарай!")],
  "common_mistakes":[{"wrong":"我起床七点。","right":"我七点起床。","why":"Цагийг үйл үгийн өмнө хэлнэ."}],
  "check":chk("«Чи өглөө хэд цагт босдог вэ?» гэж асуу:",["你早上几点起床？","我早上七点起床。","快快睡觉。"],"你早上几点起床？","g1c"),
  "exercises":[
   choice("你早上 ________ 起床？",["几点","星期","晚上"],"几点","Зөв! 几点 = хэд цаг.","几点 = хэд цаг, 星期 = долоо хоног, 晚上 = орой.","g1e1"),
   choice("我晚上九点 ________。",["睡觉","起床","早上"],"睡觉","Зөв! Орой есөн цагт унтана.","Орой унтдаг тул 睡觉.","g1e2"),
   judge("«七点» гэдэг нь «долоон цаг» гэсэн үг.",True,"Зөв! 七 = долоо, 点 = цаг.","七 = долоо, тиймээс 七点 = долоон цаг.")]},
 {"point":"到 ба 呢 — хүртэл, харин ... нь?","gloss_mn":"«Даваагаас баасан хүртэл» ба «харин чи?»",
  "structure":"星期一到星期五  ·  ……，你呢？",
  "teacher_mn":"Хоёр өдрийн хооронд «到» гэвэл «хүртэл» болно: «星期一到星期五». Нэг асуултыг дахин асуухдаа төгсгөлд нь «呢» гэнэ: «星期六和星期天呢？» — «Харин бямба, ням гарагт?». «我七点起床，你呢？» гэж найздаа асуугаарай!",
  "teacher_notes":"呢-ийн тоглоом: асуултыг ээлжлэн дамжуул. Нэр томьёо хэрэглэхгүй.",
  "examples":[ex("星期一到星期五","Xīngqīyī dào Xīngqīwǔ","Даваагаас баасан хүртэл"),ex("星期六和星期天呢？","Xīngqīliù hé Xīngqītiān ne?","Харин бямба, ням гарагт?"),ex("我是中国人，你呢？","Wǒ shì Zhōngguó rén, nǐ ne?","Би хятад хүн. Харин чи?")],
  "common_mistakes":[{"wrong":"星期一和星期五起床七点","right":"星期一到星期五我七点起床","why":"«Хүртэл» гэж хэлэхэд 到."}],
  "check":chk("«Даваагаас баасан хүртэл» хятадаар:",["星期一到星期五","星期一和星期五","星期五起床"],"星期一到星期五","g2c"),
  "exercises":[
   choice("星期一 ________ 星期五",["到","呢","要"],"到","Зөв! 到 = хүртэл.","到 = хүртэл, 呢 = харин ... нь, 要 = хүсэх.","g2e1"),
   choice("我七点起床，你 ________？",["呢","到","点"],"呢","Зөв! 呢 — «харин чи?»","Асуултыг дамжуулахад төгсгөлд нь 呢.","g2e2"),
   judge("«星期六和星期天呢？» гэдэг нь «Харин бямба, ням гарагт?» гэсэн асуулт.",True,"Зөв! 呢 асуултыг үргэлжлүүлнэ.","呢 нь «харин ... нь?» гэсэн утгатай.")]},
 {"point":"要 · 可以不……吗 — хүсэх, зөвшөөрөл гуйх","gloss_mn":"«Би ... гэж байна» ба «... хийхгүй байж болох уу?»",
  "structure":"我要 + хийх зүйл  ·  我可以不 + хийх зүйл + 吗？",
  "teacher_mn":"Юу хийх гэж байгаагаа хэлэхдээ «我要……» гэнэ: «我要喝水». Ээж аавдаа зөвшөөрөл гуйхдаа «我可以不睡觉吗？» гэнэ. Төгсгөлд нь 吗 тавина. Ээж «你要做什么？» гэж асуувал юу хийх гэж байгаагаа хэлээрэй!",
  "teacher_notes":"Номын key sentence: 今天晚上我可以不睡觉吗？ Жижиг жүжиг: хүүхэд ээжээсээ зөвшөөрөл гуйна.",
  "examples":[ex("你要做什么？","Nǐ yào zuò shénme?","Чи юу хийх гэж байна?"),ex("我要看小鱼几点睡觉。","Wǒ yào kàn xiǎo yú jǐ diǎn shuìjiào.","Би загас хэдэн цагт унтахыг харах гэж байна."),ex("今天晚上我可以不睡觉吗？","Jīntiān wǎnshang wǒ kěyǐ bú shuìjiào ma?","Өнөө орой би унтахгүй байж болох уу?")],
  "common_mistakes":[{"wrong":"我可以不睡觉？","right":"我可以不睡觉吗？","why":"Асуухад төгсгөлд нь 吗."}],
  "check":chk("«Би ус уумаар байна» хятадаар:",["我要喝水。","你要做什么？","星期一到星期五。"],"我要喝水。","g3c"),
  "exercises":[
   choice("你 ________ 做什么？",["要","到","呢"],"要","Зөв! 你要做什么？ — Чи юу хийх гэж байна?","要 нь «хийх гэж байх».","g3e1"),
   choice("我可以不睡觉 ________？",["吗","呢","到"],"吗","Зөв! Зөвшөөрөл гуйхад 吗.","Асуултын төгсгөлд 吗.","g3e2"),
   judge("«我要看小鱼» гэдэг нь «Би загас харах гэж байна» гэсэн үг.",True,"Зөв! 要 = хийх гэж байх.","小鱼 = загас, 看 = харах.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Босох» хятадаар аль нь вэ?",["起床","睡觉","吃饭","再见"],"起床","起床 (qǐchuáng) = босох.","easy",["vocabulary"],"b1")
q("choice","«Унтах» хятадаар аль нь вэ?",["睡觉","起床","早上","晚上"],"睡觉","睡觉 (shuìjiào) = унтах.","easy",["vocabulary"],"b2")
q("choice","«Өглөө» хятадаар аль нь вэ?",["早上","晚上","星期","点"],"早上","早上 (zǎoshang) = өглөө.","easy",["vocabulary"],"b3")
q("choice","«Орой» хятадаар аль нь вэ?",["晚上","早上","起床","到"],"晚上","晚上 (wǎnshang) = орой.","easy",["vocabulary"],"b4")
q("choice","«点» гэдэг үг ямар утгатай вэ?",["цаг","өглөө","унтах","хүртэл"],"цаг","点 (diǎn) = цаг. 七点 = долоон цаг.","easy",["vocabulary"],"b5")
q("choice","«到» гэдэг үг ямар утгатай вэ?",["хүртэл","унтах","босох","орой"],"хүртэл","到 (dào) = хүртэл. 星期一到星期五 = даваагаас баасан хүртэл.","medium",["vocabulary"],"b6")
q("choice","«要» гэдэг үг ямар утгатай вэ?",["хүсэх, хийх гэж байх","унтах","өглөө","хүртэл"],"хүсэх, хийх гэж байх","要 (yào) = хүсэх. 我要喝水 — ус уумаар байна.","medium",["vocabulary"],"b7")
q("choice","«Чи өглөө хэд цагт босдог вэ?» хятадаар:",["你早上几点起床？","你要做什么？","星期六呢？","快睡觉！"],"你早上几点起床？","几点 = хэд цаг, 起床 = босох.","easy",["dialogue"],"b8")
q("choice","«我早上七点起床» гэдэг нь:",["Би өглөө долоон цагт босдог","Би орой долоон цагт унтдаг","Би хоол идэж байна","Би найздаа баяртай гэв"],"Би өглөө долоон цагт босдог","早上 = өглөө, 七点 = долоон цаг, 起床 = босох.","easy",["dialogue"],"b9")
q("choice","Яриа 1-д хүү бямба, ням гарагт хэдэн цагт босдог вэ?",["12点","7点","9点","6点"],"12点","星期六和星期天我12点起床 — арван хоёр цагт.","medium",["dialogue"],"b10")
q("choice","Яриа 2-т хүү юу хийх гэж байна?",["Загас хэдэн цагт унтахыг харах","Алим идэх","Сургуульд явах","Ус уух"],"Загас хэдэн цагт унтахыг харах","我要看小鱼几点睡觉。","medium",["dialogue"],"b11")
q("cloze","你早上几（ ）起床？",["点","到","呢","要"],"点","几点 = хэд цаг.","easy",["dialogue"],"b12")
q("cloze","星期一（ ）星期五",["到","呢","要","吗"],"到","«Хүртэл» — 到.","easy",["dialogue"],"b13")
q("cloze","我七点起床，你（ ）？",["呢","到","点","睡觉"],"呢","«Харин чи?» — 你呢？","medium",["dialogue"],"b14")
q("cloze","你（ ）做什么？",["要","到","呢","点"],"要","你要做什么？ — Чи юу хийх гэж байна?","medium",["dialogue"],"b15")
q("cloze","今天晚上我可以不睡觉（ ）？",["吗","呢","到","要"],"吗","Зөвшөөрөл гуйхад төгсгөлд 吗.","medium",["dialogue"],"b16")
q("choice","Өглөө нар гарахад ямар үйлийг хийх вэ?",["起床","睡觉","晚上","呢"],"起床","Нар өндөр болохоор босно — 起床.","easy",["usage"],"b17")
q("choice","Орой сар гарахад ямар үйлийг хийх вэ?",["睡觉","起床","早上","到"],"睡觉","Сар өндөр болохоор унтана — 睡觉.","easy",["usage"],"b18")
q("choice","Chant-д «7点啦» гэдэг нь:",["Долоон цаг боллоо","Есөн цаг боллоо","Арван хоёр цаг боллоо","Нэг цаг боллоо"],"Долоон цаг боллоо","7点 = долоон цаг, 啦 = боллоо.","medium",["usage"],"b19")
q("choice","Chant-д «月亮» гэдэг нь юу вэ?",["сар","нар","цаг","гэр"],"сар","月亮 (yuèliang) = сар.","medium",["usage"],"b20")
q("choice","Chant-д «太阳» гэдэг нь юу вэ?",["нар","сар","өглөө","орой"],"нар","太阳 (tàiyáng) = нар.","medium",["usage"],"b21")
q("choice","Пиньинь «qǐchuáng» гэж уншдаг үг:",["起床","睡觉","早上","晚上"],"起床","起床 = qǐchuáng = босох.","easy",["pronunciation"],"b22")
q("choice","Пиньинь «shuìjiào» гэж уншдаг үг:",["睡觉","起床","星期","中国"],"睡觉","睡觉 = shuìjiào = унтах.","easy",["pronunciation"],"b23")
q("choice","Пиньинь «wǎnshang» гэж уншдаг үг:",["晚上","早上","起床","吃饭"],"晚上","晚上 = wǎnshang = орой.","medium",["pronunciation"],"b24")
q("usage","Найз чинь «我七点起床，你呢？» гэв. Чи юу гэж хариулах вэ?",["我八点起床。","再见。","我要苹果。","星期一到星期五。"],"我八点起床。","Цаг хэлж хариулна: 我八点起床.","medium",["usage"],"b25")
q("choice","Mini story-д хэрэм баавгайг босгохыг оролдоход ямаа өвөө юу гэв?",["Өвөл бүгд өдөр бүр унтдаг","Баавгай хоол иддэг","Өнөөдөр бямба гараг","Баавгай найзтайгаа тоглож байна"],"Өвөл бүгд өдөр бүр унтдаг","冬天它们每天睡觉，不起床。","medium",["usage"],"b26")
q("choice","Дараах дундаас цагийг заасан үг биш нь:",["吃","早上","晚上","点"],"吃","吃 = идэх. Бусад нь өглөө, орой, цаг.","easy",["vocabulary"],"b27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t5a"),img("t5b"),img("t5c"),img("t5d")]
def L(n): return [img(f"t{n}{x}") for x in "abc"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (02-05) сонсоод тохирох зургийг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）你明天几点去学校？","script_zh":"A：你明天几点去学校？B：9点。","options":["A","B","C"],"optionImages":L(1),"answer":"B","explanation_mn":"Хариулт нь «9点» — есөн цаг. B цагны зүү 9-д зогсож байна. A зургийн цаг 6 цаг, C нь 12 цаг."},
    {"n":2,"question_zh":"（听录音）今天晚上我们吃什么？","script_zh":"A：今天晚上我们吃什么？B：吃米饭可以吗？","options":["A","B","C"],"optionImages":L(2),"answer":"C","explanation_mn":"Хариулт нь «吃米饭» — будаа идье. C зураг дээр будаа байна. A алим, B уураар жигнэсэн боов."},
    {"n":3,"question_zh":"（听录音）再见！我们星期四见！","script_zh":"A：再见！B：再见！我们星期四见！","options":["A","B","C"],"optionImages":L(3),"answer":"B","explanation_mn":"«Баяртай!» гэж салах үед гараа даллана. B зураг дээр хүү цүнхээ үүрээд гараа даллаж байна. A дуран барьж байна, C эрхий хуруугаа өргөсөн."},
    {"n":4,"question_zh":"（听录音）爸爸，星期一我可以不去学校吗？","script_zh":"A：爸爸，星期一我可以不去学校吗？B：不可以。","options":["A","B","C"],"optionImages":L(4),"answer":"B","explanation_mn":"Аав «不可以» — болохгүй гэв. B зураг дээр эр гараа тавьж «болохгүй» гэж харуулж байна. A «за» гэсэн дохио, C эрхий хуруу — «сайн»."}],
   "answer_source":"Test Answers: 1B 2C 3B 4B; Listening script (брэнд хураангуй)"},
  {"part":2,"type":"choice","instruction_mn":"Унших — яриа бүрд тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"我晚上9点睡觉，你呢？ — 我10点多睡觉。","question_mn":"Орой унтах цагаа ярилцаж байна","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"Хоёулаа хэд цагт унтахаа ярьж байна — цаг барьсан D зураг таарна. A босож байна, B алим барьсан, C хоёр хуруу."},
    {"n":6,"question_zh":"你要吃苹果吗？ — 不吃，谢谢！","question_mn":"Алим идэх үү? Үгүй, баярлалаа","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"«Алим идэх үү?» гэсэн ярианд алим барьсан охин B таарна. A унтаж босож буй охин, C хоёр хуруу, D цаг."},
    {"n":7,"question_zh":"你早上几点起床？ — 7点。","question_mn":"Өглөө хэд цагт босдог вэ?","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"Босох тухай яриа — A зураг дээр охин орон дээр гараа өргөн сэрж байна. B алим, C хоёр хуруу, D цаг."},
    {"n":8,"question_zh":"你星期几去中国？ — 星期二。","question_mn":"Даваа, мягмар гарагийн тухай","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"Хариулт «星期二» — мягмар гараг, тоо «2». C зураг дээр хоёр хуруу байна. Бусад зураг босох, алим, цагтай холбоотой."}],
   "answer_source":"Test Answers: 5D 6B 7A 8C"},
  {"part":3,"type":"match","instruction_mn":"Асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"你早上几点起床？","answer":"星期一到星期五我7点起床。","explanation_mn":"Хэд цагт босохыг асуусан тул цагаа хэлнэ."},
    {"n":2,"question_zh":"今天晚上我可以不睡觉吗？","answer":"你要做什么？","explanation_mn":"Ээж «чи юу хийх гэж байна?» гэж асууна."},
    {"n":3,"question_zh":"星期六和星期天呢？","answer":"星期六和星期天我12点起床。","explanation_mn":"呢-ээр үргэлжлүүлсэн асуултад арван хоёр цагт босдгоо хэлнэ."}],
   "answer_source":"textbook х.9 (Let's read)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"妈妈，我要和朋友们出去玩！","answer":"1","explanation_mn":"1-р зураг дээр бяцхан хэрэм ээждээ найзуудтайгаа гадаа тоглохоор явна гэж хэлж байна."},
    {"n":2,"question_zh":"你们在哪儿？快出来玩吧！","answer":"2","explanation_mn":"2-р зураг дээр хэрэм цас бүхий ойд найзуудаа дуудаж байна."},
    {"n":3,"question_zh":"大熊哥哥，你今天怎么不起床？","answer":"3","explanation_mn":"3-р зураг дээр хэрэм баавгайн мод байшингийн өмнө зогсож байна."},
    {"n":4,"question_zh":"青蛙弟弟，你今天怎么不起床？","answer":"4","explanation_mn":"4-р зураг дээр хэрэм мэлхийг дуудаж байна."},
    {"n":5,"question_zh":"冬天它们每天睡觉，不起床。","answer":"5","explanation_mn":"5-р зураг дээр ямаа өвөө хэрэмд өвөл бүгд унтдаг гэж тайлбарлаж байна."}],
   "answer_source":"textbook х.11 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Let's make — «Миний хуваарь» хүснэгтийг бөглө. Ням, даваа–баасан, бямба гаригт босох, хоол идэх, сургуульд явах, унтах цагаа бич.","question_zh":"星期天 · 星期一到星期五 · 星期六","answer":"(нээлттэй) жишээ: 7点","explanation_mn":"Цагаа тоогоор бичээд хажууд нь 点 нэм. Найзынхаа хуваартай харьцуул."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Босдог цагаа хятадаар хэл.","question_zh":"我早上……点起床。","answer":"我早上……点起床","explanation_mn":"Өөрийн цагаа хэл."},
   {"n":2,"prompt_mn":"Найзаасаа хэд цагт босдгийг нь асуу.","question_zh":"你早上几点起床？","answer":"你早上几点起床？","explanation_mn":"Хосоороо ээлжлэн. Хариулсны дараа «你呢？» гэж асуу."},
   {"n":3,"prompt_mn":"«快快起床» дууг хөдөлгөөнтэй хэл.","question_zh":"快快起床","answer":"(нээлттэй)","explanation_mn":"Аудио 02-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 2 · х.12 Test (Lesson 2); хариу 1B 2C 3B 4B 5D 6B 7A 8C"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("qichuang","起床"),("shuijiao","睡觉"),("zaoshang","早上"),("wanshang","晚上"),("dian","点"),("dao","到"),("ne","呢"),("yao","要")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"你早上几点起床？","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你早上几点起床？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"妈妈，今天晚上我可以不睡觉吗？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"快快起床","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"你怎么不起床？ · Mini story","role":"illustration","section":"story"},
 {"id":"story-art","file":"images/story.jpg","title":"你怎么不起床？","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in [f"{r}{c}" for r in "1234" for c in "abc"]+["5a","5b","5c","5d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 2-р хичээл — Өглөө хэд цагт босдог вэ?","chineseTitle":"你早上几点起床？","targetTitle":"你早上几点起床？","mongolianTitle":"Өглөө хэд цагт босдог вэ?",
 "subtitle":"早上 · 晚上 · 几点起床 · 睡觉 · «快快起床» chant",
 "description":f"Өглөө, орой, босох ба унтах цагаа хэлэх (起床 睡觉 早上 晚上 点), 到 ба 呢, 要. {len(vocab)} үг, 2 зурагт яриа, Mini story, 1 chant, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"⏰","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第2课《你早上几点起床？》 [hskLevel=1] [lessonNumber=2]; эх: сурах бичиг х.8–12; аудио CD 02-01…02-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你早上几点起床？","mongolianTitle":"Өглөө хэд цагт босдог вэ?",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第2课 (сурах бичиг + CD аудио 02-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L2)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
