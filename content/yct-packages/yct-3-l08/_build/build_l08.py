#!/usr/bin/env python3
"""YCT 标准教程 3 · 第8课 下雪了。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re
OUT = "/home/claude/work/yct3/l08/pkg"
CID, LID, N = "yct-3", "yct-3-l08", 8
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

# Тестийн зураг (hi-44 → t1a..t1d), Mini story (hi-43 → story), Let's choose and write (hi-42 → c1..c6)
from PIL import Image
_pg = Image.open("/home/claude/work/yct3/l08/pages/hi-44.png").convert("RGB")
_BOX = {"t1a":(243,296,397,400),"t1b":(505,288,620,403),"t1c":(710,298,867,402),"t1d":(965,283,1052,403)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct3/l08/pages/hi-43.png").convert("RGB").crop((150,290,1170,935)).save(f"{OUT}/images/story.png")
_wp = Image.open("/home/claude/work/yct3/l08/pages/hi-42.png").convert("RGB")
_CB = [(128,556,445,950),(471,556,788,950),(813,556,1130,950),(128,1080,445,1475),(471,1080,788,1475),(813,1080,1130,1475)]
for _i,_b in enumerate(_CB,1): _wp.crop(_b).save(f"{OUT}/images/c{_i}.png")

AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_SONG, AUD_TEST = [f"audio/yct-3-08-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-3-08-text-song.mp3"

# ---------------- VOCAB ----------------
VOCAB = [
 ("下雪","xiàxuě","цас орох","үйл үг · гол үг","今天下雪了。","Jīntiān xiàxuě le.","Өнөөдөр цас орж байна.",True),
 ("听","tīng","сонсох","үйл үг · гол үг","你听，外面下雨了。","Nǐ tīng, wàimian xiàyǔ le.","Чи сонс, гадаа бороо орж байна.",True),
 ("下雨","xiàyǔ","бороо орох","үйл үг · нэмэлт үг","外面下雨了。","Wàimian xiàyǔ le.","Гадаа бороо орж байна.",False),
 ("外面","wàimian","гадаа","байршил · гол үг","外面很冷吧？","Wàimian hěn lěng ba?","Гадаа хүйтэн байгаа биз?",True),
 ("出","chū","гарах","үйл үг · гол үг","他出来了。","Tā chūlai le.","Тэр гарч ирлээ.",True),
 ("别","bié","битгий","дайвар үг · гол үг","别出去跑步了。","Bié chūqu pǎobù le.","Битгий гүйлт хийхээр гараарай.",True),
 ("作业","zuòyè","гэрийн даалгавар","нэр үг · гол үг","帮我做作业吧！","Bāng wǒ zuò zuòyè ba!","Надад гэрийн даалгавраа хийхэд тусал даа!",True),
 ("冷","lěng","хүйтэн, даарах","тэмдэг нэр · нэмэлт үг","太冷了！","Tài lěng le!","Үнэхээр хүйтэн байна!",False),
 ("热","rè","халуун","тэмдэг нэр · нэмэлт үг","太热了！","Tài rè le!","Үнэхээр халуун байна!",False),
 ("里面","lǐmian","дотор","байршил · нэмэлт үг","小狗在里面。","Xiǎo gǒu zài lǐmian.","Нохой дотор байна.",False),
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
 {"id":1,"title_mn":"Яриа 1 · Цонхоор цас харж","scene_mn":"Хоёр хүүхэд цонхны өмнө зогсож байна. Гадаа цас орж байгааг хараад баярлаж, гадаа гарч тоглохоор шийдэв.","audio":AUD_TEXT,
  "lines":[{"speaker":"妹妹","zh":"哥哥，你看，下雪了！","pinyin":"Gēge, nǐ kàn, xiàxuě le!","mn":"Ах аа, хар даа, цас орлоо!"},
           {"speaker":"哥哥","zh":"太好了，我最喜欢下雪了。","pinyin":"Tài hǎo le, wǒ zuì xǐhuan xiàxuě le.","mn":"Сайхан байна! Би цас ороход хамгийн их дуртай."},
           {"speaker":"妹妹","zh":"外面很冷吧？","pinyin":"Wàimian hěn lěng ba?","mn":"Гадаа хүйтэн байгаа биз?"},
           {"speaker":"哥哥","zh":"没关系，我们出去玩！","pinyin":"Méi guānxi, wǒmen chūqu wán!","mn":"Зүгээр ээ, гараад тоглоцгооё!"}]},
 {"id":2,"title_mn":"Яриа 2 · Бороотой өдөр","scene_mn":"Гадаа бороо орж байна. Эгч гүйлтэд явахаар гутлаа углаж байхад дүү нь түүнийг зогсоохыг оролдоно.","audio":AUD_TEXT,
  "lines":[{"speaker":"弟弟","zh":"你听，外面下雨了，你还去跑步吗？","pinyin":"Nǐ tīng, wàimian xiàyǔ le, nǐ hái qù pǎobù ma?","mn":"Сонсооч, гадаа бороо орж байна. Чи гүйлтэд явах уу?"},
           {"speaker":"姐姐","zh":"去，你呢？","pinyin":"Qù, nǐ ne?","mn":"Явна. Чи яах вэ?"},
           {"speaker":"弟弟","zh":"别出去跑步了，帮我做作业吧！","pinyin":"Bié chūqu pǎobù le, bāng wǒ zuò zuòyè ba!","mn":"Гүйлтэд битгий яв л даа. Надад даалгавраа хийхэд тусал!"},
           {"speaker":"姐姐","zh":"再见！","pinyin":"Zàijiàn!","mn":"Баяртай!"}]},
]
sentences=[]
dlg = [
 (1,"妹妹：哥哥，你看，下雪了！","Mèimei: Gēge, nǐ kàn, xiàxuě le!","Дүү охин: Ах аа, хар даа, цас орлоо!","妹妹：| 哥哥|gēge ，| 你|nǐ 看|kàn ，| 下雪|xiàxuě 了|le ！|","下雪了 — «цас орлоо». Гэнэт шинэ юм болоход үгийн ард «了» нэмнэ.",["下雪了"]),
 (1,"哥哥：太好了，我最喜欢下雪了。","Gēge: Tài hǎo le, wǒ zuì xǐhuan xiàxuě le.","Ах: Сайхан байна! Би цас ороход хамгийн их дуртай.","哥哥：| 太好了|tài hǎo le ，| 我|wǒ 最|zuì 喜欢|xǐhuan 下雪|xiàxuě 了|le 。|","",[]),
 (1,"妹妹：外面很冷吧？","Mèimei: Wàimian hěn lěng ba?","Дүү охин: Гадаа хүйтэн байгаа биз?","妹妹：| 外面|wàimian 很|hěn 冷|lěng 吧|ba ？|","吧 — «биз дээ?» гэж лавлаж асууна.",["外面很冷吧？"]),
 (1,"哥哥：没关系，我们出去玩！","Gēge: Méi guānxi, wǒmen chūqu wán!","Ах: Зүгээр ээ, гараад тоглоцгооё!","哥哥：| 没关系|méi guānxi ，| 我们|wǒmen 出去|chūqu 玩|wán ！|","出去 = гадагш гарах.",[]),
 (2,"弟弟：你听，外面下雨了，你还去跑步吗？","Dìdi: Nǐ tīng, wàimian xiàyǔ le, nǐ hái qù pǎobù ma?","Дүү хүү: Сонсооч, гадаа бороо орж байна. Чи гүйлтэд явах уу?","弟弟：| 你|nǐ 听|tīng ，| 外面|wàimian 下雨|xiàyǔ 了|le ，| 你|nǐ 还|hái 去|qù 跑步|pǎobù 吗|ma ？|","",[]),
 (2,"姐姐：去，你呢？","Jiějie: Qù, nǐ ne?","Эгч: Явна. Чи яах вэ?","姐姐：| 去|qù ，| 你|nǐ 呢|ne ？|","",[]),
 (2,"弟弟：别出去跑步了，帮我做作业吧！","Dìdi: Bié chūqu pǎobù le, bāng wǒ zuò zuòyè ba!","Дүү хүү: Гүйлтэд битгий яв л даа. Надад даалгавраа хийхэд тусал!","弟弟：| 别|bié 出去|chūqu 跑步|pǎobù 了|le ，| 帮|bāng 我|wǒ 做|zuò 作业|zuòyè 吧|ba ！|","别……了 — «битгий …». Хийж байгаа зүйлийг зогсоохыг хүсэхэд хэлнэ. 吧 энд «тус л даа» гэж зөөлөн гуйна.",["别出去跑步了"]),
 (2,"姐姐：再见！","Jiějie: Zàijiàn!","Эгч: Баяртай!","姐姐：| 再见|zàijiàn ！|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("4月的北京，刮风了。","Sì yuè de Běijīng, guāfēng le.","Дөрөвдүгээр сарын Бээжинд салхи салхилж байна.","4月|sì yuè 的|de 北京|Běijīng ，| 刮风|guāfēng 了|le 。|"),
 ("7月的北京，下雨了。","Qī yuè de Běijīng, xiàyǔ le.","Долдугаар сарын Бээжинд бороо орлоо.","7月|qī yuè 的|de 北京|Běijīng ，| 下雨|xiàyǔ 了|le 。|"),
 ("10月的北京，不冷也不热。","Shí yuè de Běijīng, bù lěng yě bú rè.","Аравдугаар сарын Бээжин хүйтэн ч биш, халуун ч биш.","10月|shí yuè 的|de 北京|Běijīng ，| 不|bù 冷|lěng 也|yě 不|bú 热|rè 。|"),
 ("1月的北京，下雪了。","Yī yuè de Běijīng, xiàxuě le.","Нэгдүгээр сарын Бээжинд цас орлоо.","1月|yī yuè 的|de 北京|Běijīng ，| 下雪|xiàxuě 了|le 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «北京» — Бээжингийн 4 улирал. 刮风 = салхи салхилах. «Аль сард ямар цаг агаар вэ?» гэж зураг харж таа."
    if i==2: s["note"]="不冷也不热 = «хүйтэн ч биш, халуун ч биш». Намар сайхан цаг агаар."
    sentences.append(s)
chant = [
 ("外面外面下雪了，小朋友们拍手笑。","Wàimian wàimian xiàxuě le, xiǎopéngyǒumen pāishǒu xiào.","Гадаа, гадаа цас орлоо, хүүхдүүд алга ташиж инээнэ.","外面|wàimian 外面|wàimian 下雪|xiàxuě 了|le ，| 小朋友们|xiǎopéngyǒumen 拍手|pāishǒu 笑|xiào 。|"),
 ("堆个雪人做朋友，看看谁的个子高。","Duī ge xuěrén zuò péngyou, kànkan shéi de gèzi gāo.","Цасан хүн хийж найз болъё, хэний бие өндөр бэ гэж харъя.","堆|duī 个|ge 雪人|xuěrén 做|zuò 朋友|péngyou ，| 看看|kànkan 谁|shéi 的|de 个子|gèzi 高|gāo 。|"),
 ("雪人雪人你别跑，我来给你戴红帽，","Xuěrén xuěrén nǐ bié pǎo, wǒ lái gěi nǐ dài hóngmào,","Цасан хүн ээ, битгий зугт. Би чамд улаан малгай өмсгөнө.","雪人|xuěrén 雪人|xuěrén 你|nǐ 别|bié 跑|pǎo ，| 我|wǒ 来|lái 给|gěi 你|nǐ 戴|dài 红帽|hóngmào ，|"),
 ("再做一个长鼻子，两只眼睛真不小。","Zài zuò yí ge cháng bízi, liǎng zhī yǎnjing zhēn bù xiǎo.","Бас урт хамар хийе. Хоёр нүд нь үнэхээр том юм.","再|zài 做|zuò 一个|yí ge 长|cháng 鼻子|bízi ，| 两只|liǎng zhī 眼睛|yǎnjing 真|zhēn 不|bù 小|xiǎo 。|"),
 ("雪人雪人开口笑，新朋友们，你们好！","Xuěrén xuěrén kāi kǒu xiào, xīn péngyoumen, nǐmen hǎo!","Цасан хүн ам нээж инээв. Шинэ найзууд аа, сайн уу!","雪人|xuěrén 雪人|xuěrén 开口|kāi kǒu 笑|xiào ，| 新|xīn 朋友们|péngyoumen ，| 你们|nǐmen 好|hǎo ！|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Chant «外面外面下雪了» — дуулж, мөр бүрд алга ташиж, хөдөлгөөн хий. 拍手 = алга таших. 堆雪人 = цасан хүн хийх."
    if i==2: s["note"]="别跑 = битгий зугт. 戴 = өмсөх (малгай, ээмэг, нүдний шил)."
    sentences.append(s)

texts = {
 "unit":{"number":"8","title":"下雪了。","mongolianTitle":"Цас орлоо — цаг агаар, битгий гэж хэлэх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх YCT 1 номд чи гэр бүл, тоо, өнгө, амьтдыг сурсан даа. Одоо гадаа цаг агаар хэр байгааг хэлж сурна. Цонхоор харахад цас орж байвал яах вэ? «下雪了！» гэж хашгирна! Бороо орвол «下雨了». Мөн найздаа «别出去跑步了» гэж «битгий» гэхийг сурна. Эцэст нь цасан хүний дууг дуулж, алгаа таших болно. Эхэлцгээе!",
  "warmup_mn":"Өнөөдөр гадаа цаг агаар ямар байна? Чи цас орохд дуртай юу, бороо орохд дуртай юу?",
  "theme_zh":"下雪了 · 下雨了 · 别……了 · 吧","theme_mn":"Цас орлоо · бороо орлоо · битгий · биз дээ"},
 "warmup":{"mongolian":"Өнөөдөр гадаа цаг агаар ямар байна? Чи цас орохд дуртай юу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"8","title":"下雪了。","mongolianTitle":"Цас орлоо — яриа, Mini story, chant","title_mn":"Let's read · 2 яриа + Mini story «北京» + Let's chant","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 3 · 第8课 Let's read / Mini story / Let's chant（CD 08-02, 08-03, 08-04）","author_zh":"",
  "intro_zh":"两段小对话：下雪了，下雨了。然后读《北京》，唱《外面外面下雪了》。",
  "intro_mn":"Эхлээд хоёр яриа: «下雪了！» гэж цас орсонд баярлана, «别出去跑步了» гэж найздаа битгий гэж хэлнэ. Дараа нь Бээжингийн дөрвөн улирлыг уншаад, цасан хүний дууг дуулна. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Дүү ахдаа цас орж байгааг үзүүлнэ. Ах нь цас орохд хамгийн их дуртай, хүйтэн ч зүгээр гэж гадаа тоглохоор гарна."},
   {"paragraph":2,"mn":"Яриа 2 — Гадаа бороо орж байна. Дүү эгчийгээ гүйлтэд битгий яв гээд, даалгавраа хийхэд тусал гэнэ. Эгч нь «баяртай» гээд явчихна."},
   {"paragraph":3,"mn":"Mini story «北京» — Бээжин дөрвөн сард салхитай, долоон сард борооны, арван сард хүйтэн ч биш халуун ч биш, нэг сард цастай. Аудио: 08-03."},
   {"paragraph":4,"mn":"Chant — Гадаа цас орлоо. Хүүхдүүд цасан хүн хийж, улаан малгай өмсгөөд, шинэ найзтайгаа мэндэлнэ. Аудио: 08-04."}],
  "reflection":{"questions_mn":["Чиний хотод 1-р сард цаг агаар ямар байдаг вэ?","Цас орвол чи юу хийх дуртай вэ?","Цасан хүндээ ямар малгай өмсгөх вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Цаг агаараа хэл","zh":"下雪了！","pinyin":"Xiàxuě le!","mn":"Цас орлоо!"},
  "writingPrompt_mn":"Цонхоор хараад гаднах цаг агаарыг «下雪了» эсвэл «下雨了» гэж хэл."},
 "properNouns":[{"zh":"北京","pinyin":"Běijīng","mn":"Бээжин (Хятадын нийслэл)"}],
 "wordExplanation":[
  {"word":"……了","gloss":"le — шинэ юм болчихлоо","explanation":"Өмнө нь байгаагүй зүйл гэнэт болбол үгийн ард «了» хэлнэ. Цас орж эхэлбэл «下雪了», бороо орж эхэлбэл «下雨了», салхи салхилбал «刮风了». «Өө, цас орлоо!» гэж гайхаж хэлэх шиг.",
   "structure":"цаг агаар + 了 → 下雪了。下雨了。刮风了。","teacher_notes":"Цонхоор хараад «下雪了！» гэж хашгируулж үз. Хүүхэд өөрөө цаг агаараа хэлж давтана.",
   "examples":[{"chinese":"哥哥，你看，下雪了！","pinyin":"Gēge, nǐ kàn, xiàxuě le!","mongolian":"Ах аа, хар даа, цас орлоо!"},{"chinese":"外面下雨了。","pinyin":"Wàimian xiàyǔ le.","mongolian":"Гадаа бороо орж байна."},{"chinese":"4月的北京，刮风了。","pinyin":"Sì yuè de Běijīng, guāfēng le.","mongolian":"Дөрөвдүгээр сарын Бээжинд салхи салхилж байна."}],
   "common_mistakes":[{"wrong":"下雪","right":"下雪了","why":"Одоо цас орж байгааг хэлэхдээ ард нь 了 нэм."}],
   "check":{"question":"«Цас орлоо!» хятадаар:","options":["下雨了！","下雪了！","别跑了！"],"answer":"1"},
   "practice":[{"n":1,"question":"外面下雨 ________ 。(орлоо)","answer":"了","explanation_mn":"Бороо орж эхэлснийг 了-гаар хэлнэ."}]},
  {"word":"别……了","gloss":"bié … le — битгий …","explanation":"Найз хийж байгаа зүйлээ зогсооно гэж хүсвэл «别» гэнэ. «别出去跑步了» — гүйлтэд битгий яв л даа. «别吃了» — битгий идээрэй. «别» нь «битгий» гэсэн үг.",
   "structure":"别 + юу хийх + 了 → 别跑了。别出去了。","teacher_notes":"Chant-д «雪人你别跑» гэж гардаг. «别 + хөдөлгөөн» тоглоом тоглуул.",
   "examples":[{"chinese":"别出去跑步了。","pinyin":"Bié chūqu pǎobù le.","mongolian":"Гүйлтэд битгий яв л даа."},{"chinese":"雪人雪人你别跑。","pinyin":"Xuěrén xuěrén nǐ bié pǎo.","mongolian":"Цасан хүн ээ, битгий зугт."},{"chinese":"别吃了。","pinyin":"Bié chī le.","mongolian":"Битгий идээрэй."}],
   "common_mistakes":[{"wrong":"不出去跑步了！(битгий гэж хориглох)","right":"别出去跑步了！","why":"Бусдад «битгий» гэхдээ 别 хэрэглэнэ."}],
   "check":{"question":"«Битгий гүй» хятадаар:","options":["我去跑步","下雪了","别跑了"],"answer":"2"},
   "practice":[{"n":1,"question":"________ 出去玩了。(битгий)","answer":"别","explanation_mn":"«Битгий» — 别."}]},
  {"word":"吧","gloss":"ba — биз дээ / л дээ","explanation":"«吧» нь өгүүлбэрийн төгсгөлд орж зөөлөн өнгө өгнө. «外面很冷吧？» — гадаа хүйтэн байгаа биз? гэж лавлана. «帮我做作业吧！» — надад тусал даа гэж зөөлөн гуйна.",
   "structure":"…… 吧？ (лавлах) / …… 吧！ (зөөлөн гуйх)","teacher_notes":"Хоёр өнгө аясыг хоёуланг нь хэлж харуул: асуух өнгө, гуйх өнгө.",
   "examples":[{"chinese":"外面很冷吧？","pinyin":"Wàimian hěn lěng ba?","mongolian":"Гадаа хүйтэн байгаа биз?"},{"chinese":"帮我做作业吧！","pinyin":"Bāng wǒ zuò zuòyè ba!","mongolian":"Надад даалгавраа хийхэд тусал даа!"},{"chinese":"我们出去玩儿吧。","pinyin":"Wǒmen chūqu wánr ba.","mongolian":"Гараад тоглоцгооё."}],
   "common_mistakes":[{"wrong":"外面很冷吗吧？","right":"外面很冷吧？","why":"吗 ба 吧-г хамт хэлэхгүй. Нэгийг л сонго."}],
   "check":{"question":"«Гадаа хүйтэн байгаа биз?» хятадаар:","options":["别出去了。","外面很冷吧？","外面下雨了。"],"answer":"1"},
   "practice":[{"n":1,"question":"外面很冷 ________ ？","answer":"吧","explanation_mn":"«Биз?» гэж лавлахдаа 吧."}]},
 ],
 "collocations":[{"type":"цаг агаарын үгс","rows":[
   {"head":"下","with":"雪 / 雨","mn":"цас / бороо орох","usage_mn":"Цаг агаарыг хэлэх","example":{"zh":"外面下雨了。","pinyin":"Wàimian xiàyǔ le.","mn":"Гадаа бороо орж байна."}},
   {"head":"出","with":"去 / 来","mn":"гарах / гарч ирэх","usage_mn":"Дотроос гадагш гарахдаа 出去, гаднаас ирэхдээ 出来","example":{"zh":"我们出去玩！","pinyin":"Wǒmen chūqu wán!","mn":"Гараад тоглоцгооё!"}},
   {"head":"做","with":"作业","mn":"гэрийн даалгавар хийх","usage_mn":"Сургуулийн даалгавраа хийх","example":{"zh":"帮我做作业吧！","pinyin":"Bāng wǒ zuò zuòyè ba!","mn":"Надад даалгавраа хийхэд тусал даа!"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["下雪","别","作业","外面"],"items":[
     {"n":1,"question":"哥哥，你看，________ 了！","answer":"下雪","explanation_mn":"Цас орлоо — 下雪了."},
     {"n":2,"question":"________ 出去跑步了。","answer":"别","explanation_mn":"«Битгий» — 别."},
     {"n":3,"question":"帮我做 ________ 吧！","answer":"作业","explanation_mn":"Гэрийн даалгавар — 作业."},
     {"n":4,"question":"________ 很冷吧？","answer":"外面","explanation_mn":"Гадаа — 外面."}]}],
   "answer_source":"agent-authored (YCT 3 · 8-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"哥哥想做什么？","answer":"出去玩。","explanation_mn":"Яриа 1 — ах «我们出去玩！» гэсэн, гадаа тоглохыг хүсч байна."},
     {"n":2,"question_zh":"弟弟想让姐姐做什么？","answer":"帮他做作业。","explanation_mn":"Яриа 2 — дүү «帮我做作业吧！» гэж эгчээсээ даалгавраа хийхэд туслахыг гуйсан."}],
   "answer_source":"textbook_verified (Let's read, х.39 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Үгээ буд (Penny bank)","start_zh":"下雪！","instruction_mn":"Цаасан дээр шинэ үгсийн зураг, ханзыг зур. Ээж аав «下雪！ 听！ 作业！» гэж нэг нэгээр хэлнэ. Чи сонссон үгээ өнгөөр буд. Хамгийн олныг будсан нь хожно!"},
     {"label":"Цаг агаарын тоглоом","start_zh":"下雨了！","instruction_mn":"Нэг нь бороо орж байгаа (шүхэр барих), цас орж байгаа (хүйтэнд чичрэх), салхи салхилж байгаа дүр үзүүлнэ. Нөгөө нь «下雪了！ 下雨了！ 刮风了！» гэж хурдан таана."},
     {"label":"别 тоглоом","start_zh":"别跑了！","instruction_mn":"Нэг нь гүйх, үсрэх, идэх мэт дүр үзүүлнэ. Нөгөө нь «别跑了！ 别吃了！» гэж хэлж, нөгөөг нь зогсооно. Дараа нь солино."},
     {"label":"Цасан хүний chant","start_zh":"外面外面下雪了","instruction_mn":"Дууг сонсоод хамт дуул. «拍手» гэхэд алгаа таш, «别跑» гэхэд гараа өргөж зогс, «你们好» гэхэд даллаж мэндэл!"},
     {"label":"Гэр орны цаг агаар","start_zh":"外面很冷吧？","instruction_mn":"Ээж аавдаа «外面很冷吧？» гэж асуугаад «很冷！» эсвэл «不冷。» гэсэн хариуг сонс. Дараа нь «我们出去玩吧！» гэж урь."}]}},
 "grammarNotes":[],
 "culture":{"title":"北京的四季","title_mn":"Бээжингийн дөрвөн улирал","text_mn":"Бээжинд 4 улирал тод ялгардаг. Хавар салхитай, зун борооны ихтэй, намар хүйтэн ч халуун ч биш сайхан, өвөл цастай байдаг. Монголд ч бас адил: өвөл маш хүйтэн, хавар салхитай. Хятад хүүхдүүд цас орвол цасан хүн хийж, ихэвчлэн хамар, нүд хийдэг. Чи цасан хүндээ ямар малгай өмсгөх вэ?","note_mn":"Чиний хотод өвөл цасан хүн хийдэг үү? Хэн хамт хийдэг вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — цаг агаар хэлэх, битгий гэж хэлэх.","topic":"Өнөөдөр цаг агаар ямар байна?","discussion":["Хосоороо: нэг нь цонхоор хараад «下雪了！» эсвэл «下雨了！» гэнэ.","Нэг нь «别……了» гэж хэлээд нөгөө нь зогсоно."],
   "writing":{"promptChinese":"外面下雪了。我们出去玩吧！","promptMongolian":"Гэрийн даалгавар: өнөөдрийн цаг агаарыг хятадаар нэг өгүүлбэрээр хэлж, гэрийнхэндээ сонсго.","minChars":"0","requiredWords":["下雪","别"],"sampleChinese":"别出去跑步了。","sampleMongolian":"Гүйлтэд битгий яв л даа.","gradingRubric":"了 ба 别-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 3 · Test Answers: L8 1.C 2.D 3.A 4.B 5.C 6.C 7.C 8.A","parts":[]},
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
 {"point":"下雪了！ — цас орлоо","gloss_mn":"«Цас орлоо!» — шинэ зүйл болоход «了» нэмнэ",
  "structure":"цаг агаар + 了 → 下雪了。下雨了。刮风了。",
  "teacher_mn":"Цонхоор хараад цас орж байвал «下雪了！» гэж хашгир. Бороо орвол «下雨了». Үгийн ард «了» нэмбэл «одоо болчихлоо» гэсэн утга болдог. Гараа дээш өргөөд «下雪了！» гэж хэлээд үз.",
  "teacher_notes":"Номын яриа: 哥哥，你看，下雪了！ 外面下雨了。 4月的北京，刮风了。",
  "examples":[ex("哥哥，你看，下雪了！","Gēge, nǐ kàn, xiàxuě le!","Ах аа, хар даа, цас орлоо!"),ex("你听，外面下雨了。","Nǐ tīng, wàimian xiàyǔ le.","Сонсооч, гадаа бороо орж байна."),ex("1月的北京，下雪了。","Yī yuè de Běijīng, xiàxuě le.","Нэгдүгээр сарын Бээжинд цас орлоо.")],
  "common_mistakes":[{"wrong":"外面下雨。","right":"外面下雨了。","why":"Бороо орж эхэлснийг хэлэхдээ ард нь 了 нэм."}],
  "check":chk("Цонхоор хараад «Цас орлоо!» гэж хашгир:",["下雪了！","下雨了！","别跑了！"],"下雪了！","g1c"),
  "exercises":[
   choice("外面 ________ 了。(бороо орлоо)",["下雨","下雪","作业"],"下雨","Зөв! 下雨 = бороо орох.","下雨 = бороо, 下雪 = цас, 作业 = даалгавар.","g1e1"),
   choice("«Цас орлоо» хятадаар:",["下雪了","别出去","外面冷"],"下雪了","Зөв! 下雪了 = цас орлоо.","下雪 = цас орох.","g1e2"),
   judge("«下雨» гэдэг нь «бороо орох» гэсэн үг.",True,"Зөв! 下雨 = бороо орох.","下雨 = бороо орох, 下雪 = цас орох.")]},
 {"point":"别出去跑步了 — битгий","gloss_mn":"«Битгий …» — найздаа зогсооно гэж хэлнэ",
  "structure":"别 + юу хийх + 了 → 别跑了。别出去了。",
  "teacher_mn":"Найз чинь юм хийж байхад зогсоомоор бол «别» гэж хэл. «别跑了» — битгий гүй. «别出去跑步了» — гүйлтэд битгий яв л даа. Гараа өргөөд «别！» гэж хэлж үз!",
  "teacher_notes":"Номын яриа 2: 别出去跑步了，帮我做作业吧！ Chant: 雪人雪人你别跑。",
  "examples":[ex("别出去跑步了。","Bié chūqu pǎobù le.","Гүйлтэд битгий яв л даа."),ex("雪人雪人你别跑。","Xuěrén xuěrén nǐ bié pǎo.","Цасан хүн ээ, битгий зугт."),ex("别吃了。","Bié chī le.","Битгий идээрэй.")],
  "common_mistakes":[{"wrong":"不出去跑步了！","right":"别出去跑步了！","why":"Бусдад «битгий» гэхдээ 别 хэрэглэнэ."}],
  "check":chk("«Битгий гүй» хятадаар:",["别跑了","下雪了","我去跑步"],"别跑了","g2c"),
  "exercises":[
   choice("________ 出去跑步了。(битгий)",["别","听","热"],"别","Зөв! 别 = битгий.","别 = битгий, 听 = сонсох, 热 = халуун.","g2e1"),
   choice("«Гэрийн даалгавар» хятадаар:",["作业","外面","下雨"],"作业","Зөв! 作业 = гэрийн даалгавар.","作业 = гэрийн даалгавар, 外面 = гадаа.","g2e2"),
   judge("«别» гэдэг нь «битгий» гэсэн үг.",True,"Зөв! 别 = битгий.","别 = битгий.")]},
 {"point":"外面很冷吧？ — биз дээ","gloss_mn":"«Гадаа хүйтэн байгаа биз?» — 吧-аар лавлах, зөөлөн гуйх",
  "structure":"…… 吧？ (лавлах) / …… 吧！ (зөөлөн гуйх)",
  "teacher_mn":"Өгүүлбэрийн төгсгөлд «吧» хэлбэл зөөлөн сонсогдоно. «外面很冷吧？» — гадаа хүйтэн байгаа биз? гэж лавлана. «帮我做作业吧！» — надад тусал даа гэж гуйна. Хоёр янзаар хэлж үз!",
  "teacher_notes":"Номын key sentence: 外面很冷吧？ Яриа 2: 帮我做作业吧！",
  "examples":[ex("外面很冷吧？","Wàimian hěn lěng ba?","Гадаа хүйтэн байгаа биз?"),ex("帮我做作业吧！","Bāng wǒ zuò zuòyè ba!","Надад даалгавраа хийхэд тусал даа!"),ex("我们出去玩儿吧。","Wǒmen chūqu wánr ba.","Гараад тоглоцгооё.")],
  "common_mistakes":[{"wrong":"外面很冷吗吧？","right":"外面很冷吧？","why":"吗 ба 吧-г хамт хэлэхгүй."}],
  "check":chk("«Гадаа хүйтэн байгаа биз?» хятадаар:",["外面很冷吧？","外面下雨了。","别出去了。"],"外面很冷吧？","g3c"),
  "exercises":[
   choice("外面很冷 ________ ？",["吧","别","了"],"吧","Зөв! 吧 = биз дээ.","Лавлахдаа өгүүлбэрийн төгсгөлд 吧.","g3e1"),
   choice("«Гараад тоглоцгооё» хятадаар:",["我们出去玩吧。","别出去了。","外面下雨了。"],"我们出去玩吧。","Зөв!","出去 = гарах, 玩 = тоглох, 吧 = л даа.","g3e2"),
   judge("«吧» нь өгүүлбэрийн төгсгөлд орж зөөлөн өнгө өгдөг.",True,"Зөв!","吧 нь өгүүлбэрийн төгсгөлд хэлэгдэнэ.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Цас орох» хятадаар аль нь вэ?",["下雪","下雨","作业","外面"],"下雪","下雪 (xiàxuě) = цас орох.","easy",["vocabulary"],"a1")
q("choice","«Бороо орох» хятадаар аль нь вэ?",["下雨","下雪","出去","听"],"下雨","下雨 (xiàyǔ) = бороо орох.","easy",["vocabulary"],"a2")
q("choice","«Сонсох» хятадаар аль нь вэ?",["听","看","吃","别"],"听","听 (tīng) = сонсох.","easy",["vocabulary"],"a3")
q("choice","«Гадаа» хятадаар аль нь вэ?",["外面","里面","作业","下雪"],"外面","外面 (wàimian) = гадаа.","easy",["vocabulary"],"a4")
q("choice","«Дотор» хятадаар аль нь вэ?",["里面","外面","出来","冷"],"里面","里面 (lǐmian) = дотор.","medium",["vocabulary"],"a5")
q("choice","«别» гэдэг үг ямар утгатай вэ?",["битгий","гарах","сонсох","халуун"],"битгий","别 (bié) = битгий.","easy",["vocabulary"],"a6")
q("choice","«作业» гэдэг үг ямар утгатай вэ?",["гэрийн даалгавар","цас","гадаа","дотор"],"гэрийн даалгавар","作业 (zuòyè) = гэрийн даалгавар.","easy",["vocabulary"],"a7")
q("choice","«冷» гэдэг үг ямар утгатай вэ?",["хүйтэн","халуун","бороо","цас"],"хүйтэн","冷 (lěng) = хүйтэн, даарах.","easy",["vocabulary"],"a8")
q("choice","«热» гэдэг үг ямар утгатай вэ?",["халуун","хүйтэн","гадаа","сонсох"],"халуун","热 (rè) = халуун.","easy",["vocabulary"],"a9")
q("choice","Ах, дүү хоёр цонхоор цас харлаа. Дүү юу гэсэн бэ?",["哥哥，你看，下雪了！","外面下雨了。","别出去跑步了。","再见！"],"哥哥，你看，下雪了！","Яриа 1 — «Ах аа, хар даа, цас орлоо!»","easy",["dialogue"],"a10")
q("choice","Яриа 1-д ах юу хийхийг хүссэн бэ?",["Гараад тоглох","Даалгавраа хийх","Гүйлтэд явах","Унтах"],"Гараад тоглох","哥哥: 没关系，我们出去玩！","medium",["dialogue"],"a11")
q("choice","«外面很冷吧？» гэдэг нь юу гэсэн үг вэ?",["Гадаа хүйтэн байгаа биз?","Гадаа бороо орж байна.","Битгий гар.","Гэрийн даалгавар хийе."],"Гадаа хүйтэн байгаа биз?","吧 = биз дээ. 外面很冷吧？ = гадаа хүйтэн байгаа биз?","medium",["dialogue"],"a12")
q("choice","Яриа 2-т гадаа цаг агаар ямар байсан бэ?",["Бороо орж байсан","Цас орж байсан","Халуун байсан","Салхитай байсан"],"Бороо орж байсан","弟弟: 外面下雨了 — гадаа бороо орж байна.","easy",["dialogue"],"a13")
q("choice","Яриа 2-т дүү эгчээсээ юу гуйсан бэ?",["Даалгавраа хийхэд туслах","Гүйлтэд хамт явах","Хоол хийх","Цасан хүн хийх"],"Даалгавраа хийхэд туслах","帮我做作业吧！","medium",["dialogue"],"a14")
q("cloze","哥哥，你看，（ ）了！",["下雪","作业","别","外面"],"下雪","下雪了 = цас орлоо.","easy",["dialogue"],"a15")
q("cloze","（ ）出去跑步了。",["别","听","热","冷"],"别","别 = битгий.","easy",["structure"],"a16")
q("cloze","帮我做（ ）吧！",["作业","外面","下雪","里面"],"作业","做作业 = гэрийн даалгавар хийх.","easy",["structure"],"a17")
q("cloze","外面很冷（ ）？",["吧","了","别","去"],"吧","吧 = биз дээ.","medium",["structure"],"a18")
q("choice","«Битгий гүй» хэлэхдээ:",["别跑了","我跑了","下雪了","去跑步"],"别跑了","别 = битгий.","easy",["structure"],"a19")
q("choice","Цас орж эхлэхэд «了»-тэй өгүүлбэрээр хэлвэл:",["下雪了","下雪","外面","作业"],"下雪了","Шинэ юм болсныг 了-гаар хэлнэ.","medium",["structure"],"a20")
q("choice","Пиньинь «xiàxuě» гэж уншдаг үг:",["下雪","下雨","外面","作业"],"下雪","下雪 = xiàxuě = цас орох.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «wàimian» гэж уншдаг үг:",["外面","里面","作业","下雨"],"外面","外面 = wàimian = гадаа.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «zuòyè» гэж уншдаг үг:",["作业","下雪","出去","听"],"作业","作业 = zuòyè = гэрийн даалгавар.","medium",["pronunciation"],"a23")
q("usage","Гадаа бороо орж байна. Найздаа юу гэх вэ?",["外面下雨了。","外面下雪了。","我很热。","再见。"],"外面下雨了。","下雨了 = бороо орлоо.","medium",["usage"],"a24")
q("usage","Найз чинь бороотой өдөр гүйлтэд явах гэж байна. Чи юу гэх вэ?",["别出去跑步了！","我们出去玩！","外面很热。","你好！"],"别出去跑步了！","别……了 = битгий … гэж зогсооно.","medium",["usage"],"a25")
q("usage","Mini story-д Бээжин 1-р сард ямар байдаг вэ?",["Цас ордог","Салхи салхилдаг","Бороо ордог","Хүйтэн ч биш, халуун ч биш"],"Цас ордог","1月的北京，下雪了。","medium",["usage"],"a26")
q("usage","Mini story-д 10-р сарын Бээжин ямар вэ?",["不冷也不热","下雪了","下雨了","刮风了"],"不冷也不热","10月的北京，不冷也不热 — хүйтэн ч биш, халуун ч биш.","hard",["usage"],"a27")
q("usage","Chant-д цасан хүнд юу өмсгөдөг вэ?",["Улаан малгай","Ногоон цүнх","Шар гутал","Цэнхэр цамц"],"Улаан малгай","我来给你戴红帽 — би чамд улаан малгай өмсгөнө.","hard",["usage"],"a28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
BANK3 = ["A","B","C"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (08-05) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）你别说了，我不想听。好好好，不说了。","script_zh":"男：你别说了，我不想听。 女：好好好，不说了。","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"«Битгий ярь, би сонсмооргүй байна» — C зураг дээр хүү хоёр чихээ таглачихсан байна. A бороонд шүхэртэй хүүхэд, B хоёр хүүхэд бичиж байна, D цастай газар гэр рүү явж байна."},
    {"n":2,"question_zh":"（听录音）今天雪真大！是，我们回去吧。","script_zh":"女：今天雪真大！ 男：是，我们回去吧。","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"«Өнөөдөр цас үнэхээр их орлоо! Тийм ээ, буцаж харьцгаая» — D зураг дээр цастай газраар хүн байшин руу явж байна. A бороо, B бичиж буй хүүхдүүд, C чих таглаж буй хүү."},
    {"n":3,"question_zh":"（听录音）下雨了，别在外面玩了。没关系。","script_zh":"女：下雨了，别在外面玩了。 男：没关系。","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"«Бороо орлоо, гадаа битгий тогло. — Зүгээр ээ» — A зураг дээр хүүхэд бороонд шүхэртэй зогсож байна. B бичиж байна, C чих таглаж байна, D цас."},
    {"n":4,"question_zh":"（听录音）太阳出来了，我们出去玩吧。不，我要做作业。","script_zh":"女：太阳出来了，我们出去玩吧。 男：不，我要做作业。","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"«Нар гарлаа, гараад тоглоцгооё. — Үгүй, би даалгавраа хийнэ» — B зураг дээр хоёр хүүхэд даалгавар бичиж байна. A бороо, C чих таглаж буй хүү, D цас."}],
   "answer_source":"YCT 3 Test Answers L8: 1.C 2.D 3.A 4.B"},
  {"part":2,"type":"choice","instruction_mn":"Унших — хоосон зайд тохирох үгийг сонго.","items":[
    {"n":5,"question_zh":"外面（　　）了，我不想去了。 我也不去了。","question_mn":"Гадаа (...), би явмааргүй байна. — Би ч бас явахгүй.","options":BANK3,"optionTexts":["说话","出来","下雪"],"answer":"C","explanation_mn":"Гадаа цас орвол явмааргүй болно: «下雪了». 说话 ярих, 出来 гарч ирэх — утга таарахгүй."},
    {"n":6,"question_zh":"请问，白老师在吗？ （　　）。","question_mn":"Уучлаарай, Бай багш байна уу? — (...).","options":BANK3,"optionTexts":["不客气","她饿了","她出去了"],"answer":"C","explanation_mn":"Багш байгаа эсэхийг асуусан тул «她出去了 — тэр гарсан» гэж хариулна. 不客气 «баярлалаа»-д хариулах үг, 她饿了 «тэр өлсөв» — таарахгүй."},
    {"n":7,"question_zh":"（　　）下雨了，你还去跑步吗？ 去。","question_mn":"(...) бороо орж байна, чи гүйлтэд явах уу? — Явна.","options":BANK3,"optionTexts":["里面","太阳","外面"],"answer":"C","explanation_mn":"«外面下雨了 — гадаа бороо орж байна». 里面 дотор, 太阳 нар — таарахгүй."},
    {"n":8,"question_zh":"今天没有（　　），我们出去玩儿吧。 但是我有。","question_mn":"Өнөөдөр (...) алга, гараад тоглоцгооё. — Гэхдээ надад байгаа.","options":BANK3,"optionTexts":["作业","运动","外面"],"answer":"A","explanation_mn":"«今天没有作业 — өнөөдөр даалгавар байхгүй». «Гэхдээ надад байгаа» гэхээр даалгавар. 外面 гадаа, 运动 спорт — таарахгүй."}],
   "answer_source":"YCT 3 Test Answers L8: 5.C 6.C 7.C 8.A"},
  {"part":3,"type":"match","instruction_mn":"Let's choose and write — зураг бүрд тохирох үгийг сонго.","items":[
    {"n":1,"question_zh":"（зураг: халуунд хөлсөө арчиж буй охин）","image":img("c1"),"answer":"热","explanation_mn":"Нар төөнөж, охин хөлсөө арчиж байна — халуун, 热."},
    {"n":2,"question_zh":"（зураг: нохой байшингийнхаа дотор）","image":img("c2"),"answer":"里面","explanation_mn":"Нохой байшингийн дотор хэвтэж байна — 里面."},
    {"n":3,"question_zh":"（зураг: хүү хаалгаар гарч ирж байна）","image":img("c3"),"answer":"出来","explanation_mn":"Хүү дотроос гадаа гарч ирж байна — 出来."},
    {"n":4,"question_zh":"（зураг: зузаан хувцастай даарч буй хүүхэд）","image":img("c4"),"answer":"冷","explanation_mn":"Хүүхэд даарч чичирч байна — 冷."},
    {"n":5,"question_zh":"（зураг: нохой байшингийнхаа гадна）","image":img("c5"),"answer":"外面","explanation_mn":"Нохой байшингийн гадна байна — 外面."},
    {"n":6,"question_zh":"（зураг: хоёр хүү хаалгыг түлхэж байна）","image":img("c6"),"answer":"出去","explanation_mn":"Хаалгаар гадагш гарч байна — 出去."}],
   "answer_source":"Let's choose and write х.40 (зургаар тааруулсан, аудитаар баталгаажсан)"},
  {"part":4,"type":"match","instruction_mn":"Mini story «北京» — сар бүрийн цаг агаарыг тааруул.","image":img("story"),"items":[
    {"n":1,"question_zh":"4月的北京，……","answer":"刮风了","explanation_mn":"1-р зураг — цэцэглэсэн мод, салхи: «刮风了»."},
    {"n":2,"question_zh":"7月的北京，……","answer":"下雨了","explanation_mn":"2-р зураг — нуур, бороо: «下雨了»."},
    {"n":3,"question_zh":"10月的北京，……","answer":"不冷也不热","explanation_mn":"3-р зураг — улаан навчтай намрын уул: хүйтэн ч биш, халуун ч биш."},
    {"n":4,"question_zh":"1月的北京，……","answer":"下雪了","explanation_mn":"4-р зураг — цастай Их хэрэм: «下雪了»."}],
   "answer_source":"textbook х.41 (Mini story)"},
  {"part":5,"type":"match","instruction_mn":"Let's chant — дууг сонсоод мөр бүрийг гүйцээ.","items":[
    {"n":1,"question_zh":"外面外面下雪了，小朋友们____笑。","answer":"拍手","explanation_mn":"Алга таших — 拍手."},
    {"n":2,"question_zh":"雪人雪人你____跑，我来给你戴红帽。","answer":"别","explanation_mn":"Цасан хүнд «битгий зугт» гэж хэлж байна — 别."},
    {"n":3,"question_zh":"雪人雪人开口笑，新朋友们，你们____！","answer":"好","explanation_mn":"«你们好» — сайн уу гэж мэндэлнэ."}],
   "answer_source":"Let's chant х.41"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «下雪» гэсэн ханзыг дахин бичиж хуул.","question_zh":"下雪","answer":"下雪","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Цонхоор хараад цаг агаарыг хэл.","question_zh":"下雪了！/ 下雨了！","answer":"外面下雪了。","explanation_mn":"Өнөөдрийн цаг агаарыг хэл."},
   {"n":2,"prompt_mn":"Найздаа «битгий» гэж хэл.","question_zh":"别……了","answer":"别跑了！","explanation_mn":"别 + хөдөлгөөн + 了."},
   {"n":3,"prompt_mn":"Цасан хүний дууг дуул.","question_zh":"外面外面下雪了","answer":"(нээлттэй)","explanation_mn":"Аудио 08-04-ийн хамт, алга таш."}]},
 "answerSource":"YCT 标准教程 3 · Test Listening Scripts, Test Answers (Lesson 8)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("xiaxue","下雪"),("ting","听"),("xiayu","下雨"),("waimian","外面"),("chu","出"),("bie","别"),("zuoye","作业"),("leng","冷"),("re","热"),("limian","里面")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"下雪了。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"哥哥，你看，下雪了！","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"你听，外面下雨了","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"外面外面下雪了","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"北京 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d"]] \
  + [{"id":f"c{i}","file":f"images/c{i}.png","title":f"Choose and write {i}","role":"illustration","section":"workbook"} for i in range(1,7)]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 3 · 8-р хичээл — Цас орлоо","chineseTitle":"下雪了。","targetTitle":"下雪了。","mongolianTitle":"Цас орлоо",
 "subtitle":"下雪 · 下雨 · 外面 · 别……了 · 吧 · «北京» · цасан хүний дуу",
 "description":f"Цаг агаараа хэлж (下雪了, 下雨了), «битгий» (别……了) гэж хэлж сурна. {len(vocab)} үг, 2 зурагт яриа, Mini story «北京», цасан хүний chant, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"❄️","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 3",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 3 — 第8课《下雪了。》 [hskLevel=2] [lessonNumber=8]; эх: сурах бичиг х.38–42; аудио CD 08-01…08-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"下雪了。","mongolianTitle":"Цас орлоо",
 "series":"YCT 标准教程 3","seriesLabel_mn":"YCT 3 — Хүүхдийн хятад хэл (≈HSK2)",
 "source":"YCT 标准教程 3 · 第8课 (сурах бичиг + CD аудио 08-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L8)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
