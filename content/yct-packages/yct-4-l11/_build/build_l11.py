#!/usr/bin/env python3
"""YCT 标准教程 4 · 第11课 它长得很快。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
OUT = "/home/claude/work/yct4/l11/pkg"
CID, LID, N = "yct-4", "yct-4-l11", 11
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
_pg = Image.open("/home/claude/work/yct4/l11/pages/hi-64.png").convert("RGB")
_S = 1.5
_BOX = {"t1a":(105,185,235,300),"t1b":(262,190,392,300),"t1c":(425,185,555,300),"t1d":(572,190,702,305)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct4/l11/pages/hi-63.png").convert("RGB").crop((int(60*_S),int(195*_S),int(790*_S),int(1020*_S))).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_CHANT, AUD_STORY, AUD_TEST = [f"audio/yct-4-11-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-4-11-text-song.mp3"
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"{OUT}/{AUD_TEXT}","-i",f"{OUT}/{AUD_CHANT}","-filter_complex","[0:a][1:a]concat=n=2:v=0:a=1[a]","-map","[a]","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)

# ---------------- VOCAB ----------------
VOCAB = [
 ("裙子","qúnzi","банзал, даашинз","нэр үг · гол үг","我有一条白裙子。","Wǒ yǒu yì tiáo bái qúnzi.","Надад нэг цагаан банзал бий.",True),
 ("裤子","kùzi","өмд","нэр үг · гол үг","他穿黑裤子。","Tā chuān hēi kùzi.","Тэр хар өмд өмссөн байна.",True),
 ("白","bái","цагаан","тэмдэг нэр · гол үг","她的裙子是白色的。","Tā de qúnzi shì báisè de.","Түүний банзал цагаан өнгөтэй.",True),
 ("黑","hēi","хар","тэмдэг нэр · гол үг","熊猫的眼睛是黑的。","Xióngmāo de yǎnjing shì hēi de.","Пандагийн нүд хар.",True),
 ("可爱","kě'ài","хөөрхөн, өхөөрдөм","тэмдэг нэр · гол үг","小熊猫真可爱！","Xiǎo xióngmāo zhēn kě'ài!","Бяцхан панда үнэхээр хөөрхөн!",True),
 ("长","zhǎng","ургах, томрох","үйл үг · гол үг","它长得很快。","Tā zhǎng de hěn kuài.","Тэр маш хурдан томорч байна.",True),
 ("出生","chūshēng","төрөх","үйл үг · гол үг","你是哪年出生的？","Nǐ shì nǎ nián chūshēng de?","Чи аль жил төрсөн бэ?",True),
 ("件","jiàn","(хувцасны тооны үг)","тооны үг · гол үг","今天你穿哪件衣服？","Jīntiān nǐ chuān nǎ jiàn yīfu?","Өнөөдөр чи аль хувцсаа өмсөх вэ?",True),
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
 {"id":1,"title_mn":"Яриа 1 · Өнөөдөр юу өмсөх вэ?","scene_mn":"Унтлагын өрөөнд охин панда тоглоомоо тэвэрчихсэн зогсоно. Ээж нь хувцас барьчихсан «аль хувцсаа өмсөх вэ?» гэж асууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"妈妈","zh":"今天你穿哪件衣服？","pinyin":"Jīntiān nǐ chuān nǎ jiàn yīfu?","mn":"Өнөөдөр чи аль хувцсаа өмсөх вэ?"},
           {"speaker":"月月","zh":"我要穿那条白裙子和那条黑裤子。","pinyin":"Wǒ yào chuān nà tiáo bái qúnzi hé nà tiáo hēi kùzi.","mn":"Би тэр цагаан банзал, тэр хар өмдөө өмсөнө."},
           {"speaker":"妈妈","zh":"为什么？","pinyin":"Wèi shénme?","mn":"Яагаад?"},
           {"speaker":"月月","zh":"因为今天我是大熊猫。","pinyin":"Yīnwèi jīntiān wǒ shì dà xióngmāo.","mn":"Учир нь өнөөдөр би том панда шүү дээ."}]},
 {"id":2,"title_mn":"Яриа 2 · Бяцхан панда Пан Пан","scene_mn":"Багш пандагийн зургийг үзүүлээд, өнгөрсөн жил төрсөн бяцхан панда одоо хэр том болсныг ярьж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"老师","zh":"你们还认识它吗？它就是去年出生的熊猫胖胖。","pinyin":"Nǐmen hái rènshi tā ma? Tā jiù shì qùnián chūshēng de xióngmāo Pàngpang.","mn":"Та нар түүнийг одоо ч таньж байна уу? Энэ бол өнгөрсөн жил төрсөн панда Пан Пан."},
           {"speaker":"老师","zh":"那时候它很小，但是它长得很快。","pinyin":"Nà shíhou tā hěn xiǎo, dànshì tā zhǎng de hěn kuài.","mn":"Тэр үед тэр маш жижигхэн байсан ч хурдан томорсон."},
           {"speaker":"老师","zh":"现在它一岁了，长得比我们高，比我们胖。它还是很可爱。","pinyin":"Xiànzài tā yí suì le, zhǎng de bǐ wǒmen gāo, bǐ wǒmen pàng. Tā háishi hěn kě'ài.","mn":"Одоо нэг настай болоод бидэнээс өндөр, бидэнээс тарган болсон. Гэхдээ хөөрхөн хэвээрээ."}]},
]
sentences=[]
dlg = [
 (1,"妈妈：今天你穿哪件衣服？","Māma: Jīntiān nǐ chuān nǎ jiàn yīfu?","Ээж: Өнөөдөр чи аль хувцсаа өмсөх вэ?","妈妈：| 今天|jīntiān 你|nǐ 穿|chuān 哪|nǎ 件|jiàn 衣服|yīfu ？|","哪件 = «аль нь». Цамц, хувцсыг тоолохдоо «件» гэж хэлдэг: 一件衣服.",["今天你穿哪件衣服？"]),
 (1,"月月：我要穿那条白裙子和那条黑裤子。","Yuèyue: Wǒ yào chuān nà tiáo bái qúnzi hé nà tiáo hēi kùzi.","Юэ-юэ: Би тэр цагаан банзал, тэр хар өмдөө өмсөнө.","月月：| 我|wǒ 要|yào 穿|chuān 那|nà 条|tiáo 白|bái 裙子|qúnzi 和|hé 那|nà 条|tiáo 黑|hēi 裤子|kùzi 。|","банзал, өмдийг тоолохдоо «条» гэнэ.",[]),
 (1,"妈妈：为什么？","Māma: Wèi shénme?","Ээж: Яагаад?","妈妈：| 为什么|wèi shénme ？|","",[]),
 (1,"月月：因为今天我是大熊猫。","Yuèyue: Yīnwèi jīntiān wǒ shì dà xióngmāo.","Юэ-юэ: Учир нь өнөөдөр би том панда шүү дээ.","月月：| 因为|yīnwèi 今天|jīntiān 我|wǒ 是|shì 大熊猫|dà xióngmāo 。|","因为 = «учир нь». Хариулахдаа ингэж эхэлнэ. Панда цагаан, хар өнгөтэй тул охин цагаан банзал, хар өмд өмссөн!",["为什么？"]),
 (2,"老师：你们还认识它吗？","Lǎoshī: Nǐmen hái rènshi tā ma?","Багш: Та нар түүнийг одоо ч таньж байна уу?","老师：| 你们|nǐmen 还|hái 认识|rènshi 它|tā 吗|ma ？|","",[]),
 (2,"它就是去年出生的熊猫胖胖。","Tā jiù shì qùnián chūshēng de xióngmāo Pàngpang.","Энэ бол өнгөрсөн жил төрсөн панда Пан Пан.","它|tā 就是|jiù shì 去年|qùnián 出生|chūshēng 的|de 熊猫|xióngmāo 胖胖|Pàngpang 。|","",[]),
 (2,"那时候它很小，但是它长得很快。","Nà shíhou tā hěn xiǎo, dànshì tā zhǎng de hěn kuài.","Тэр үед тэр маш жижигхэн байсан ч хурдан томорсон.","那时候|nà shíhou 它|tā 很|hěn 小|xiǎo ，| 但是|dànshì 它|tā 长|zhǎng 得|de 很|hěn 快|kuài 。|","长得很快 — «хурдан томорсон». Энд 长 нь zhǎng (ургах, томрох) гэж уншина.",["它长得很快。"]),
 (2,"现在它一岁了，长得比我们高，比我们胖。","Xiànzài tā yí suì le, zhǎng de bǐ wǒmen gāo, bǐ wǒmen pàng.","Одоо нэг настай болоод бидэнээс өндөр, бидэнээс тарган болсон.","现在|xiànzài 它|tā 一|yí 岁|suì 了|le ，| 长|zhǎng 得|de 比|bǐ 我们|wǒmen 高|gāo ，| 比|bǐ 我们|wǒmen 胖|pàng 。|","比我们高 = «бидээс өндөр».",[]),
 (2,"它还是很可爱。","Tā háishi hěn kě'ài.","Гэхдээ тэр хөөрхөн хэвээрээ.","它|tā 还是|háishi 很|hěn 可爱|kě'ài 。|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
chant = [
 ("我的妹妹长大了。","Wǒ de mèimei zhǎngdà le.","Миний дүү томорчихлоо.","我|wǒ 的|de 妹妹|mèimei 长大|zhǎngdà 了|le 。|"),
 ("她长得很漂亮，很可爱。","Tā zhǎng de hěn piàoliang, hěn kě'ài.","Тэр сайхан царайтай болсон, хөөрхөн.","她|tā 长|zhǎng 得|de 很|hěn 漂亮|piàoliang ，| 很|hěn 可爱|kě'ài 。|"),
 ("她的个子高高的，头发长长的。","Tā de gèzi gāogāo de, tóufa chángcháng de.","Түүний бие өндөр өндөр, үс нь урт урт.","她|tā 的|de 个子|gèzi 高高|gāogāo 的|de ，| 头发|tóufa 长长|chángcháng 的|de 。|"),
 ("她的个子长得很快，头发长得也很快。","Tā de gèzi zhǎng de hěn kuài, tóufa zhǎng de yě hěn kuài.","Түүний бие хурдан өсч, үс нь ч бас хурдан ургаж байна.","她|tā 的|de 个子|gèzi 长|zhǎng 得|de 很|hěn 快|kuài ，| 头发|tóufa 长|zhǎng 得|de 也|yě 很|hěn 快|kuài 。|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Let's say «妹妹长大了» — мөр бүрийг хэлэхдээ дүүгийнхээ өсөж буйг хөдөлгөөнөөр үзүүл: бөхийгөөд аажмаар босч, гараа дээш өргө!"
    if i==2: s["note"]="长 хоёр янзаар уншигддаг: zhǎng = ургах, томрох; cháng = урт. 头发长长的 (cháng) = үс урт, 长得很快 (zhǎng) = хурдан ургах."
    sentences.append(s)
story = [
 ("月亮：我有红色的裙子。","Yuèliang: Wǒ yǒu hóngsè de qúnzi.","Сар: Надад улаан банзал бий.","月亮：| 我|wǒ 有|yǒu 红色|hóngsè 的|de 裙子|qúnzi 。|"),
 ("太阳：把它送给天空吧，变成天边的红霞。","Tàiyáng: Bǎ tā sònggěi tiānkōng ba, biànchéng tiānbiān de hóngxiá.","Нар: Тэрийг тэнгэрт бэлэглэ. Тэр тэнгэрийн захын час улаан үүл болог.","太阳：| 把|bǎ 它|tā 送给|sònggěi 天空|tiānkōng 吧|ba ，| 变成|biànchéng 天边|tiānbiān 的|de 红霞|hóngxiá 。|"),
 ("月亮：我有白色的裙子。","Yuèliang: Wǒ yǒu báisè de qúnzi.","Сар: Надад цагаан банзал бий.","月亮：| 我|wǒ 有|yǒu 白色|báisè 的|de 裙子|qúnzi 。|"),
 ("太阳：把它送给天空吧，变成天上的白云。","Tàiyáng: Bǎ tā sònggěi tiānkōng ba, biànchéng tiānshang de báiyún.","Нар: Тэрийг тэнгэрт бэлэглэ. Тэр тэнгэрийн цагаан үүл болог.","太阳：| 把|bǎ 它|tā 送给|sònggěi 天空|tiānkōng 吧|ba ，| 变成|biànchéng 天上|tiānshang 的|de 白云|báiyún 。|"),
 ("月亮：我有蓝色的裙子。","Yuèliang: Wǒ yǒu lánsè de qúnzi.","Сар: Надад цэнхэр банзал бий.","月亮：| 我|wǒ 有|yǒu 蓝色|lánsè 的|de 裙子|qúnzi 。|"),
 ("太阳：把它送给天空吧，变成蓝天。","Tàiyáng: Bǎ tā sònggěi tiānkōng ba, biànchéng lántiān.","Нар: Тэрийг тэнгэрт бэлэглэ. Тэр цэнхэр тэнгэр болог.","太阳：| 把|bǎ 它|tā 送给|sònggěi 天空|tiānkōng 吧|ba ，| 变成|biànchéng 蓝天|lántiān 。|"),
 ("月亮：我有绿色的裙子。","Yuèliang: Wǒ yǒu lǜsè de qúnzi.","Сар: Надад ногоон банзал бий.","月亮：| 我|wǒ 有|yǒu 绿色|lǜsè 的|de 裙子|qúnzi 。|"),
 ("太阳：把它送给大地吧，变成绿地。","Tàiyáng: Bǎ tā sònggěi dàdì ba, biànchéng lǜdì.","Нар: Тэрийг дэлхийд бэлэглэ. Тэр ногоон тал болог.","太阳：| 把|bǎ 它|tā 送给|sònggěi 大地|dàdì 吧|ba ，| 变成|biànchéng 绿地|lǜdì 。|"),
 ("月亮：我穿什么裙子？","Yuèliang: Wǒ chuān shénme qúnzi?","Сар: Би ямар банзал өмсөх вэ?","月亮：| 我|wǒ 穿|chuān 什么|shénme 裙子|qúnzi ？|"),
 ("太阳：我有黄色的裙子，把它送给你！","Tàiyáng: Wǒ yǒu huángsè de qúnzi, bǎ tā sònggěi nǐ!","Нар: Надад шар банзал бий, тэрийг чамд бэлэглэе!","太阳：| 我|wǒ 有|yǒu 黄色|huángsè 的|de 裙子|qúnzi ，| 把|bǎ 它|tā 送给|sònggěi 你|nǐ ！|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «月亮的裙子» (Сарны банзал) — 5 зурагт үлгэр. 月亮 = сар, 太阳 = нар. Сар өөрийн банзлуудаа үзүүлэхэд нар «тэнгэрт, газарт бэлэглэ» гэнэ. Банзлууд нь үүл, тэнгэр, тал болдог!"
    if i==1: s["note"]="把它送给天空吧 = «тэрийг тэнгэрт бэлэглэ». 变成 = болох, хувирах."
    sentences.append(s)

texts = {
 "unit":{"number":"11","title":"它长得很快。","mongolianTitle":"Тэр маш хурдан томорч байна — хувцас, өнгө, өсөлт"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. YCT 1–3 номд чи гэр бүл, тоо, өнгө, амьтдыг сурсан даа. Одоо бид хувцас, өсөлтийн тухай ярина! Өнөөдөр «今天你穿哪件衣服？» гэж асууж, «它长得很快。» гэж хэлж сурна. Хөөрхөн бяцхан панда жилийн дотор хэр хурдан томорсныг бас үзнэ. Сар нарын «月亮的裙子» үлгэрийг уншина шүү. Эхэлцгээе!",
  "warmup_mn":"Чи өнөөдөр ямар өнгийн хувцас өмссөн бэ? Чи сүүлийн жилд хэр хурдан өссөн бэ — өмнөх жилийн хувцас чинь жижигдсэн үү?",
  "theme_zh":"裙子 · 裤子 · 白 · 黑 · 长得很快","theme_mn":"Банзал · өмд · цагаан · хар · хурдан өсөх"},
 "warmup":{"mongolian":"Чи өнөөдөр ямар өнгийн хувцас өмссөн бэ? Тэр хувцсаа хятадаар хэлж чадах уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"11","title":"它长得很快。","mongolianTitle":"Тэр хурдан томорч байна — яриа, Let's say, үлгэр","title_mn":"Let's read + Let's say + Mini story · 月亮的裙子","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 4 · 第11课 Let's read / Let's say / Mini story（CD 11-02, 11-03, 11-04）","author_zh":"",
  "intro_zh":"今天你穿哪件衣服？因为今天我是大熊猫。熊猫胖胖长得很快。妹妹也长大了。月亮的裙子变成了天空和大地。",
  "intro_mn":"Эхлээд ээж охиноос «今天你穿哪件衣服？» гэж асууна. Дараа нь бяцхан панда Пан Пан хэр хурдан томорсныг сонсоно. Let's say-д дүүгийнхээ өсөлтийг хөдөлгөөнтэйгээр хэлнэ. Эцэст нь «月亮的裙子» үлгэрийг унших болно. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Ээж охиноос юу өмсөхийг асууна. Охин цагаан банзал, хар өмдөө өмсөнө гэнэ. Учир нь өнөөдөр тэр том панда!"},
   {"paragraph":2,"mn":"Яриа 2 — Өнгөрсөн жил төрсөн бяцхан панда Пан Пан маш жижигхэн байсан ч хурдан томорчээ. Одоо нэг настай, бидэнээс өндөр, тарган, мөн л хөөрхөн."},
   {"paragraph":3,"mn":"Let's say — Миний дүү томорчихлоо. Тэр хөөрхөн, бие нь өндөр, үс нь урт. Бие, үс нь хоёулаа хурдан өсч байна. Аудио: 11-03."},
   {"paragraph":4,"mn":"Үлгэр «月亮的裙子» — Сар улаан, цагаан, цэнхэр, ногоон банзлаа нарын хэлснээр тэнгэр, газарт өгнө. Тэд үүл, тэнгэр, тал болно. Эцэст нь нар шар банзлаа сарт бэлэглэнэ. Аудио: 11-04."}],
  "reflection":{"questions_mn":["Чи өнөөдөр ямар хувцас өмссөн бэ? «我穿……» гэж хэлж үз.","Чи өнгөрсөн жилийнхээс хэр их өссөн бэ? «我长得很快» гэж хэлж чадах уу?","Нар, сар хоёрын үлгэрээс чамд аль хэсэг хамгийн их таалагдсан бэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Хувцсаа хэл","zh":"今天你穿哪件衣服？","pinyin":"Jīntiān nǐ chuān nǎ jiàn yīfu?","mn":"Өнөөдөр чи аль хувцсаа өмсөх вэ?"},
  "writingPrompt_mn":"Ээж, аавдаа «今天你穿哪件衣服？» гэж асуугаад, «我要穿……» гэж өөрөө хариул."},
 "properNouns":[{"zh":"胖胖","pinyin":"Pàngpang","mn":"Пан Пан (пандагийн нэр)"},{"zh":"月亮的裙子","pinyin":"Yuèliang de qúnzi","mn":"Сарны банзал (үлгэрийн нэр)"},{"zh":"月月","pinyin":"Yuèyue","mn":"Юэ-юэ (охины нэр)"}],
 "wordExplanation":[
  {"word":"长得很快","gloss":"zhǎng de hěn kuài — хурдан томрох, өсөх","explanation":"Бяцхан хүүхэд, амьтан хурдан өсөхөд «长得很快» гэнэ. 长 гэдгийг «zhǎng» гэж уншина — ургах, томрох гэсэн үг. «长大» гэвэл «том болох». Дүүгийнхээ үс хурдан ургавал «头发长得很快» гэж хэлж болно.",
   "structure":"…… 长得很 + сайхан/хурдан/өндөр","teacher_notes":"Хүүхдүүдээр бөхийгөөд аажмаар босч «长大了！» гэж хашгируул. Дараа нь өөрсдийн дүү, гэрийн тэжээвэр амьтны тухай хэлүүл.",
   "examples":[{"chinese":"它长得很快。","pinyin":"Tā zhǎng de hěn kuài.","mongolian":"Тэр маш хурдан томорч байна."},{"chinese":"我的妹妹长大了。","pinyin":"Wǒ de mèimei zhǎngdà le.","mongolian":"Миний дүү томорчихлоо."},{"chinese":"她的头发长得也很快。","pinyin":"Tā de tóufa zhǎng de yě hěn kuài.","mongolian":"Түүний үс ч бас хурдан ургаж байна."}],
   "common_mistakes":[{"wrong":"它长很快。","right":"它长得很快。","why":"«长» болон «很快» хоёрын дунд «得» орно."}],
   "check":(lambda o:{"question":"«Тэр хурдан томорч байна» хятадаар:","options":o[0],"answer":str(o[1])})(shuffle(["它长得很快。","它很小。","今天你穿哪件衣服？"],"它长得很快。","tc1")),
   "practice":[{"n":1,"question":"它长 ________ 很快。(холбох үг)","answer":"得","explanation_mn":"«长得很快» — 得 нь 长 болон 很快-ыг холбоно."}]},
  {"word":"哪件 · 那条","gloss":"nǎ jiàn · nà tiáo — аль нь, тэр нь","explanation":"Хувцас тоолохдоо хоёр үг хэрэглэнэ. Цамц, хүрэм, ерөнхий хувцсыг «件» гэнэ: 一件衣服. Банзал, өмдийг «条» гэнэ: 一条裙子, 一条裤子. «哪件» = аль нь вэ? гэж асуух үг.",
   "structure":"哪/那/这 + 件 (衣服) · 条 (裙子, 裤子)","teacher_notes":"Хувцсаа ангилуулж тоглоорой: цамц барьж «一件衣服», өмд барьж «一条裤子» гэж хэлүүл.",
   "examples":[{"chinese":"今天你穿哪件衣服？","pinyin":"Jīntiān nǐ chuān nǎ jiàn yīfu?","mongolian":"Өнөөдөр чи аль хувцсаа өмсөх вэ?"},{"chinese":"我要穿那条白裙子和那条黑裤子。","pinyin":"Wǒ yào chuān nà tiáo bái qúnzi hé nà tiáo hēi kùzi.","mongolian":"Би тэр цагаан банзал, тэр хар өмдөө өмсөнө."},{"chinese":"我有红色的裙子。","pinyin":"Wǒ yǒu hóngsè de qúnzi.","mongolian":"Надад улаан банзал бий."}],
   "common_mistakes":[{"wrong":"那件白裙子","right":"那条白裙子","why":"Банзлыг «条» гэж тоолно, «件» биш."}],
   "check":(lambda o:{"question":"«Тэр хар өмд» хятадаар:","options":o[0],"answer":str(o[1])})(shuffle(["那条黑裤子","那件黑裤子","那条白裙子"],"那条黑裤子","tc2")),
   "practice":[{"n":1,"question":"那 ________ 黑裤子。(өмдний тооны үг)","answer":"条","explanation_mn":"Өмдийг «条» гэж тоолно."}]},
  {"word":"为什么 · 因为","gloss":"wèi shénme · yīnwèi — яагаад, учир нь","explanation":"Шалтгааныг асуухдаа «为什么？» гэнэ, хариулахдаа «因为……» гэж эхэлнэ. Ээж «为什么？» гэхэд охин «因为今天我是大熊猫» гэж хариулсан даа.",
   "structure":"为什么？ → 因为 + шалтгаан","teacher_notes":"Хос хосоороо: нэг нь «为什么？» гэж асуугаад нөгөө нь «因为……» гэж тааж хариулна.",
   "examples":[{"chinese":"为什么？","pinyin":"Wèi shénme?","mongolian":"Яагаад?"},{"chinese":"因为今天我是大熊猫。","pinyin":"Yīnwèi jīntiān wǒ shì dà xióngmāo.","mongolian":"Учир нь өнөөдөр би том панда шүү дээ."},{"chinese":"为什么月亮晚上出来？","pinyin":"Wèi shénme yuèliang wǎnshang chūlái?","mongolian":"Сар яагаад шөнө гардаг вэ?"}],
   "common_mistakes":[{"wrong":"因为什么？","right":"为什么？","why":"Асуухдаа «为什么», хариулахдаа «因为»."}],
   "check":(lambda o:{"question":"«Яагаад?» хятадаар:","options":o[0],"answer":str(o[1])})(shuffle(["为什么？","因为……","哪件？"],"为什么？","tc3")),
   "practice":[{"n":1,"question":"________ 今天我是大熊猫。(учир нь)","answer":"因为","explanation_mn":"Хариулахдаа 因为 гэж эхэлнэ."}]},
 ],
 "collocations":[{"type":"Хувцас, өнгө, өсөлт","rows":[
   {"head":"穿","with":"白裙子","mn":"цагаан банзал өмсөх","usage_mn":"Хувцас өмсөхөд «穿» гэнэ","example":{"zh":"我要穿那条白裙子。","pinyin":"Wǒ yào chuān nà tiáo bái qúnzi.","mn":"Би тэр цагаан банзлаа өмсөнө."}},
   {"head":"长","with":"得很快","mn":"хурдан томрох","usage_mn":"Өсөлтийн хурдыг хэлэхэд","example":{"zh":"它长得很快。","pinyin":"Tā zhǎng de hěn kuài.","mn":"Тэр маш хурдан томорч байна."}},
   {"head":"一","with":"件衣服","mn":"нэг хувцас","usage_mn":"Хувцсыг «件» гэж тоолно","example":{"zh":"今天你穿哪件衣服？","pinyin":"Jīntiān nǐ chuān nǎ jiàn yīfu?","mn":"Өнөөдөр чи аль хувцсаа өмсөх вэ?"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["裙子","裤子","可爱","出生","件"],"items":[
     {"n":1,"question":"我有白色的 ________ 。","answer":"裙子","explanation_mn":"«Банзал» — 裙子."},
     {"n":2,"question":"他穿黑 ________ 。","answer":"裤子","explanation_mn":"«Өмд» — 裤子."},
     {"n":3,"question":"小熊猫真 ________ ！","answer":"可爱","explanation_mn":"«Хөөрхөн» — 可爱."},
     {"n":4,"question":"你是哪年 ________ 的？","answer":"出生","explanation_mn":"«Төрсөн» — 出生."},
     {"n":5,"question":"今天你穿哪 ________ 衣服？","answer":"件","explanation_mn":"Хувцасны тооны үг — 件."}]}],
   "answer_source":"agent-authored (YCT 4 · 11-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"女孩为什么要穿白裙子和黑裤子？","answer":"因为今天她是大熊猫。","explanation_mn":"Яриа 1 — «因为今天我是大熊猫» гэж охин хэлсэн. Панда цагаан, хар өнгөтэй."},
     {"n":2,"question_zh":"熊猫叫什么名字？它长得快吗？它多大了？","answer":"它叫胖胖。它长得很快。它一岁了。","explanation_mn":"Яриа 2 — «熊猫胖胖», «长得很快», «现在它一岁了» гэж байгаа."}],
   "answer_source":"textbook_verified (Let's read, х.54 Questions)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Хар цагаан тэмцээн","start_zh":"白色，黑色！","instruction_mn":"2 багт хуваагд. Баг тус бүр хар, цагаан өнгийн юмсыг хятадаар ээлжлэн нэрлэнэ: 白裙子, 黑裤子… Хамгийн олон нэр хэлсэн баг хожно!"},
     {"label":"Будаад таагаарай","start_zh":"熊猫，斑马","instruction_mn":"Панда, зебрийн хар цагаан зургийг буд. Төрөхдөө ямар өнгөтэй байсныг тааж, гэрийнхэнтэйгээ ярилц. Хэн аль нь зөв гэж бодож байна вэ?"},
     {"label":"Өнөөдөр юу өмсөх вэ?","start_zh":"今天你穿哪件衣服？","instruction_mn":"Найзаасаа «今天你穿哪件衣服？» гэж асуу. Тэр «我要穿那条白裙子» гэх мэтээр хариулаад «为什么？» гэж асуулгаарай. Хариулахдаа «因为……» гэж эхэл!"},
     {"label":"Дүүгийн өсөлт","start_zh":"妹妹长大了","instruction_mn":"Let's say-г чангаар хэл. «长大了» гэхдээ бөхийгөөд аажмаар босч, «高高的» гэхдээ гараа дээш сунга, «长长的» гэхдээ үсээ илж үз. Гэрийнхэнтэйгээ хамт хий!"},
     {"label":"月亮的裙子 жүжиг","start_zh":"我有红色的裙子。","instruction_mn":"Үлгэрийг найзтайгаа жүжигчил. Нэг нь сар, нөгөө нь нар. Сар «我有红色的裙子» гэхэд нар «把它送给天空吧» гэж хариулна. Эцэст нь шар банзлаа сарт бэлэглэ!"}]}},
 "grammarNotes":[],
 "culture":{"title":"大熊猫","title_mn":"Хятадын үндэсний сүлд — панда","text_mn":"Панда (大熊猫) бол Хятадын хамгийн хайртай амьтан. Төрөхдөө маш жижигхэн, ягаавтар, бараг үсгүй байдаг ч хэдхэн сарын дотор хурдан томорч, цагаан хар өнгөтэй болдог. Хятад хүүхдүүд пандад маш их дуртай бөгөөд амьтны хүрээлэнд тэднийг үзэхээр өдөр бүр олон хүн цуглардаг. Тэдний нэр заримдаа Пан Пан шиг давтагдсан, хөөрхөн байдаг.","note_mn":"Чамд ямар амьтан хамгийн хөөрхөн санагддаг вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — хувцсаа хэлэх, өсөлтийг дүрслэх.","topic":"Чи өнөөдөр юу өмссөн бэ?","discussion":["Хосоороо: «今天你穿哪件衣服？» гэж асууж, «我要穿……» гэж хариул.","Бүгдээрээ «为什么？» гэж асуугаад «因为……» гэж шалтгаанаа хэл."],
   "writing":{"promptChinese":"我有……的裙子。 / 我的妹妹长得很快。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «你是哪年出生的？» гэж хятадаар асуугаад хариултыг нь сонс.","minChars":"0","requiredWords":["裙子","长"],"sampleChinese":"我要穿那条白裙子和那条黑裤子。","sampleMongolian":"Би тэр цагаан банзал, тэр хар өмдөө өмсөнө.","gradingRubric":"裙子, 裤子, 条/件-ийг зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 4 · Test Answers: L11 1.D 2.C 3.B 4.A 5.B 6.B 7.B 8.B","parts":[]},
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
 {"point":"它长得很快。 — хурдан томрох","gloss_mn":"«Тэр маш хурдан томорч байна» — өсөлтийг дүрслэх",
  "structure":"…… 长得很 + хурдан/сайхан",
  "teacher_mn":"Хүүхэд, амьтан хурдан өсөхөд «它长得很快» гэж хэлнэ. «长» гэдгийг энд «zhǎng» гэж уншина — ургах, томрох. «长» болон «很快»-ийн дунд «得» гэсэн жижиг үг орно. Сайхан харагдаж байвал «长得很漂亮» гэж хэлж болно.",
  "teacher_notes":"Номын яриа: 那时候它很小，但是它长得很快。 Let's say: 她的个子长得很快，头发长得也很快。",
  "examples":[ex("它长得很快。","Tā zhǎng de hěn kuài.","Тэр маш хурдан томорч байна."),ex("她长得很漂亮，很可爱。","Tā zhǎng de hěn piàoliang, hěn kě'ài.","Тэр сайхан царайтай, хөөрхөн."),ex("她的头发长得也很快。","Tā de tóufa zhǎng de yě hěn kuài.","Түүний үс ч бас хурдан ургаж байна."),ex("我的妹妹长大了。","Wǒ de mèimei zhǎngdà le.","Миний дүү томорчихлоо.")],
  "common_mistakes":[{"wrong":"它长很快。","right":"它长得很快。","why":"«长» болон «很快»-ийн дунд «得» орно."}],
  "check":chk("«Тэр маш хурдан томорч байна» хятадаар:",["它长得很快。","它长大了吗？","我要穿白裙子。"],"它长得很快。","g1c"),
  "exercises":[
   choice("它长 ________ 很快。",["得","了","吗"],"得","Зөв! 长得很快.","«长» ба «很快»-ийн дунд 得 орно.","g1e1"),
   choice("«Миний дүү томорчихлоо» хятадаар:",["我的妹妹长大了。","我的妹妹很小。","我的妹妹出生了。"],"我的妹妹长大了。","Зөв! 长大 = том болох.","长大 = том болох, 出生 = төрөх.","g1e2"),
   judge("«长» гэдгийг «zhǎng» гэж уншвал «ургах, томрох» гэсэн утгатай.",True,"Зөв! zhǎng = ургах.","长 zhǎng = ургах, томрох; cháng = урт.")]},
 {"point":"今天你穿哪件衣服？ — хувцасны тооны үг","gloss_mn":"«Өнөөдөр чи аль хувцсаа өмсөх вэ?» — хувцас сонгох",
  "structure":"哪/那 + 件 (衣服) · 条 (裙子, 裤子)",
  "teacher_mn":"Хувцсаа сонгохдоо «今天你穿哪件衣服？» гэж асууна. Цамц, хүрэм зэрэг хувцсыг «件» гэж тоолно. Банзал, өмдийг «条» гэж тоолно. Тиймээс «那条白裙子», «那条黑裤子» гэнэ.",
  "teacher_notes":"Номын яриа: 今天你穿哪件衣服？ 我要穿那条白裙子和那条黑裤子。",
  "examples":[ex("今天你穿哪件衣服？","Jīntiān nǐ chuān nǎ jiàn yīfu?","Өнөөдөр чи аль хувцсаа өмсөх вэ?"),ex("我要穿那条白裙子和那条黑裤子。","Wǒ yào chuān nà tiáo bái qúnzi hé nà tiáo hēi kùzi.","Би тэр цагаан банзал, тэр хар өмдөө өмсөнө."),ex("我有红色的裙子。","Wǒ yǒu hóngsè de qúnzi.","Надад улаан банзал бий."),ex("我穿什么裙子？","Wǒ chuān shénme qúnzi?","Би ямар банзал өмсөх вэ?")],
  "common_mistakes":[{"wrong":"那件白裙子","right":"那条白裙子","why":"Банзал, өмдийг «条» гэж тоолно."}],
  "check":chk("«Тэр хар өмд» хятадаар:",["那条黑裤子","那件黑裤子","那条白裙子"],"那条黑裤子","g2c"),
  "exercises":[
   choice("今天你穿哪 ________ 衣服？",["件","条","个"],"件","Зөв! 衣服 → 件.","Хувцсыг 件 гэж тоолно.","g2e1"),
   choice("那 ________ 白裙子",["条","件","岁"],"条","Зөв! 裙子 → 条.","Банзлыг 条 гэж тоолно.","g2e2"),
   judge("«裤子»-г «条» гэж тоолно.",True,"Зөв! 一条裤子.","Өмд, банзал → 条.")]},
 {"point":"为什么？ 因为…… — шалтгаан асуух","gloss_mn":"«Яагаад? — Учир нь…» — шалтгаан асуух, хэлэх",
  "structure":"为什么？ → 因为 + шалтгаан",
  "teacher_mn":"Яагаад гэж асуухдаа «为什么？» гэнэ. Хариулахдаа «因为……» гэж эхэлнэ. Ээж «为什么？» гэхэд охин «因为今天我是大熊猫» гэж хариулсан. Чи ч найзаасаа «为什么？» гэж асуугаад үз!",
  "teacher_notes":"Номын яриа: 为什么？ 因为今天我是大熊猫。 Test: 为什么月亮晚上出来？",
  "examples":[ex("为什么？","Wèi shénme?","Яагаад?"),ex("因为今天我是大熊猫。","Yīnwèi jīntiān wǒ shì dà xióngmāo.","Учир нь өнөөдөр би том панда шүү дээ."),ex("为什么月亮晚上出来？","Wèi shénme yuèliang wǎnshang chūlái?","Сар яагаад шөнө гардаг вэ?"),ex("女孩为什么要穿白裙子和黑裤子？","Nǚhái wèi shénme yào chuān bái qúnzi hé hēi kùzi?","Охин яагаад цагаан банзал, хар өмд өмсөх гэж байна вэ?")],
  "common_mistakes":[{"wrong":"因为什么？","right":"为什么？","why":"Асуухдаа «为什么», хариулахдаа «因为»."}],
  "check":chk("Ээж «为什么？» гэвэл хариулахдаа:",["因为今天我是大熊猫。","哪件衣服？","它长得很快。"],"因为今天我是大熊猫。","g3c"),
  "exercises":[
   choice("________ 今天我是大熊猫。",["因为","为什么","哪件"],"因为","Зөв! 因为 = учир нь.","Хариулахдаа 因为 гэнэ.","g3e1"),
   choice("«Яагаад?» хятадаар:",["为什么？","因为……","你好吗？"],"为什么？","Зөв! 为什么 = яагаад.","为什么 = яагаад, 因为 = учир нь.","g3e2"),
   judge("«因为» гэдгээр асуулт эхэлдэг.",False,"Зөв! 因为 нь хариултыг эхлүүлнэ.","Асуулт «为什么», хариулт «因为».")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Банзал» хятадаар аль нь вэ?",["裙子","裤子","衣服","可爱"],"裙子","裙子 (qúnzi) = банзал.","easy",["vocabulary"],"a1")
q("choice","«Өмд» хятадаар аль нь вэ?",["裤子","裙子","衣服","件"],"裤子","裤子 (kùzi) = өмд.","easy",["vocabulary"],"a2")
q("choice","«Цагаан» хятадаар аль нь вэ?",["白","黑","红","蓝"],"白","白 (bái) = цагаан.","easy",["vocabulary"],"a3")
q("choice","«Хар» хятадаар аль нь вэ?",["黑","白","绿","黄"],"黑","黑 (hēi) = хар.","easy",["vocabulary"],"a4")
q("choice","«可爱» гэдэг үг ямар утгатай вэ?",["хөөрхөн","өндөр","хурдан","хүйтэн"],"хөөрхөн","可爱 (kě'ài) = хөөрхөн, өхөөрдөм.","easy",["vocabulary"],"a5")
q("choice","«出生» гэдэг үг ямар утгатай вэ?",["төрөх","өсөх","өмсөх","унтах"],"төрөх","出生 (chūshēng) = төрөх.","easy",["vocabulary"],"a6")
q("choice","«长» (zhǎng) гэдэг үг ямар утгатай вэ?",["ургах, томрох","өмсөх","цагаан","хөөрхөн"],"ургах, томрох","长 (zhǎng) = ургах, томрох.","easy",["vocabulary"],"a7")
q("choice","Хувцсыг тоолох үг аль нь вэ?",["件","岁","点","块"],"件","一件衣服 — хувцсыг «件» гэж тоолно.","medium",["vocabulary"],"a8")
q("choice","Пиньинь «qúnzi» гэж уншдаг үг:",["裙子","裤子","可爱","出生"],"裙子","裙子 = qúnzi = банзал.","easy",["pronunciation"],"a9")
q("choice","Пиньинь «kě'ài» гэж уншдаг үг:",["可爱","出生","裤子","白色"],"可爱","可爱 = kě'ài = хөөрхөн.","medium",["pronunciation"],"a10")
q("choice","Пиньинь «chūshēng» гэж уншдаг үг:",["出生","长大","裙子","衣服"],"出生","出生 = chūshēng = төрөх.","medium",["pronunciation"],"a11")
q("choice","Пиньинь «kùzi» гэж уншдаг үг:",["裤子","裙子","黑色","白色"],"裤子","裤子 = kùzi = өмд.","medium",["pronunciation"],"a12")
q("choice","«Өнөөдөр чи аль хувцсаа өмсөх вэ?» хятадаар:",["今天你穿哪件衣服？","它长得很快。","为什么？","你是哪年出生的？"],"今天你穿哪件衣服？","穿 = өмсөх, 哪件 = аль нь.","easy",["dialogue"],"a13")
q("choice","«它长得很快。» гэж юу гэсэн үг вэ?",["Тэр маш хурдан томорч байна.","Тэр маш хөөрхөн.","Тэр хар өнгөтэй.","Тэр өнгөрсөн жил төрсөн."],"Тэр маш хурдан томорч байна.","长得很快 = хурдан томрох.","medium",["dialogue"],"a14")
q("choice","Яриа 1-д охин юу өмсөх гэж байна вэ?",["Цагаан банзал, хар өмд","Хар банзал, цагаан өмд","Улаан банзал","Шар хувцас"],"Цагаан банзал, хар өмд","我要穿那条白裙子和那条黑裤子。","medium",["dialogue"],"a15")
q("choice","Охин яагаад цагаан банзал, хар өмд өмсөх гэж байна вэ?",["Өнөөдөр тэр том панда учраас","Түүнд дургүй өнгө учраас","Хүйтэн учраас","Ээж нь хэлсэн учраас"],"Өнөөдөр тэр том панда учраас","因为今天我是大熊猫。 Панда цагаан, хар.","medium",["dialogue"],"a16")
q("cloze","它长（ ）很快。",["得","了","吗","呢"],"得","长得很快 — 得 нь 长, 很快-ыг холбоно.","medium",["structure"],"a17")
q("cloze","今天你穿哪（ ）衣服？",["件","条","岁","块"],"件","哪件衣服 — хувцас → 件.","easy",["structure"],"a18")
q("cloze","我要穿那（ ）白裙子。",["条","件","岁","块"],"条","白裙子 → 条.","medium",["structure"],"a19")
q("cloze","（ ）今天我是大熊猫。",["因为","为什么","哪件","还是"],"因为","因为 = учир нь.","medium",["structure"],"a20")
q("cloze","（ ）？ — 因为我不会。",["为什么","因为","长大","可爱"],"为什么","为什么 = яагаад.","medium",["structure"],"a21")
q("choice","«Яагаад?» хятадаар аль нь вэ?",["为什么？","因为……","哪件？","你呢？"],"为什么？","为什么 = яагаад.","easy",["structure"],"a22")
q("choice","«长大了» гэж юу гэсэн үг вэ?",["том болсон","жижиг болсон","төрсөн","өмссөн"],"том болсон","长大 = том болох.","easy",["structure"],"a23")
q("choice","Let's say-д дүүгийн тухай ямар өгүүлбэр байна вэ?",["她的个子高高的，头发长长的。","她的裙子是白色的。","她是大熊猫。","她今年出生了。"],"她的个子高高的，头发长长的。","高高的 = өндөр өндөр, 长长的 (cháng) = урт урт.","hard",["dialogue"],"a24")
q("usage","Найз чинь «今天你穿哪件衣服？» гэж асуулаа. Чи цагаан банзал өмсөх бол:",["我要穿那条白裙子。","它长得很快。","为什么？","因为我很可爱。"],"我要穿那条白裙子。","我要穿…… = би … өмсөнө.","medium",["usage"],"a25")
q("usage","Найз чинь «今天我是大熊猫» гэвэл шалтгааныг нь асуух:",["为什么？","你好吗？","再见。","哪件衣服？"],"为什么？","为什么 = яагаад.","medium",["usage"],"a26")
q("usage","Бяцхан зулзага хурдан томорсныг хэлэхэд:",["它长得很快。","它出生了。","它是白色的。","它穿裙子。"],"它长得很快。","长得很快 = хурдан томрох.","medium",["usage"],"a27")
q("usage","«月亮的裙子» үлгэрийн төгсгөлд нар сарт ямар өнгийн банзал бэлэглэсэн бэ?",["Шар банзал","Хар банзал","Улаан банзал","Ногоон банзал"],"Шар банзал","我有黄色的裙子，把它送给你！","hard",["usage"],"a28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANK1 = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (11-05) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）这条红色的裙子怎么样？很漂亮，比黑色的好看。","script_zh":"女：这条红色的裙子怎么样？ 男：很漂亮，比黑色的好看。","options":BANK,"optionImages":BANK1,"answer":"D","explanation_mn":"«Энэ улаан банзал ямар вэ? — Маш хөөрхөн, харынхаас илүү гоё» — D зураг дээр улаан даашинз байна. A цагаан хүрэм, B судалтай цамц, C жинсэн өмд тул тохирохгүй."},
    {"n":2,"question_zh":"（听录音）妈妈，这条裤子是什么时候买的？是你出生那年买的。","script_zh":"男：妈妈，这条裤子是什么时候买的？ 女：是你出生那年买的。","options":BANK,"optionImages":BANK1,"answer":"C","explanation_mn":"«Ээж ээ, энэ өмдийг хэзээ авсан юм бэ? — Чамайг төрсөн жил авсан» — өмд ярьж байгаа тул C зураг (жинсэн өмд). Бусад нь хүрэм, цамц, даашинз."},
    {"n":3,"question_zh":"（听录音）这件衣服太小了，是他的吗？是的，他长得太快了！","script_zh":"男：这件衣服太小了，是他的吗？ 女：是的，他长得太快了！","options":BANK,"optionImages":BANK1,"answer":"B","explanation_mn":"«Энэ хувцас дэндүү жижиг байна, түүнийх үү? — Тийм, тэр дэндүү хурдан томорлоо!» — B зураг дээр хүүхдийн судалтай цамц байна. 件 гэж цамц, хүрэм тоолно; өмд, даашинз нь «条» байх ёстой."},
    {"n":4,"question_zh":"（听录音）你好，这件运动服有黑色的吗？对不起，这是最后一件了。","script_zh":"男：你好，这件运动服有黑色的吗？ 女：对不起，这是最后一件了。","options":BANK,"optionImages":BANK1,"answer":"A","explanation_mn":"«Сайн байна уу, энэ спорт хувцас хар өнгөтэй байна уу? — Уучлаарай, энэ сүүлийнх нь» — A зураг дээр цагаан спорт хүрэм байна. 运动服 = спорт хувцас."}],
   "answer_source":"YCT 4 Test Answers L11: 1.D 2.C 3.B 4.A"},
  {"part":2,"type":"choice","instruction_mn":"Унших — зөв хариултыг сонго.","items":[
    {"n":5,"question_zh":"女：哥哥，为什么月亮晚上出来？ 男：因为它（ ）要睡觉。","question_mn":"— Ах аа, сар яагаад шөнө гардаг вэ? — Учир нь тэр ... унтана.","options":["A","B","C"],"optionTexts":["晚上","白天","星期天"],"answer":"B","explanation_mn":"Сар шөнө гардаг, учир нь өдөртөө унтдаг: «因为它白天要睡觉». 晚上 (шөнө) нь өмнөх «晚上出来»-тай зөрчилдөнө, 星期天 (ням гараг) утгагүй."},
    {"n":6,"question_zh":"女：我今天穿这件（ ），好不好？ 女：让我看看。","question_mn":"— Би өнөөдөр энэ ... өмсөе, за юу? — Би хараад үзье.","options":["A","B","C"],"optionTexts":["黑裤子","衣服","白裙子"],"answer":"B","explanation_mn":"«这件» гэсэн тул 件-тэй хамт орох үг «衣服». 裤子, 裙子-г «条» гэж тоолдог тул «这条» гэх байсан."},
    {"n":7,"question_zh":"男：你觉得白色的裤子怎么样？ 女：你说的是那（ ）新买的吗？","question_mn":"— Цагаан өмд чамд ямар санагдаж байна? — Чи шинээр авсан тэр ... гэж байна уу?","options":["A","B","C"],"optionTexts":["件","条","只"],"answer":"B","explanation_mn":"Өмдийг «条» гэж тоолно: 那条裤子. 件 нь цамц, хүрэмд; 只 нь жижиг амьтанд хэрэглэнэ."},
    {"n":8,"question_zh":"男：这只小猫的眼睛是黑的，很（ ）。 女：是，我们家里人都很喜欢它。","question_mn":"— Энэ зулзага муурын нүд хар, их ... — Тийм, манай гэрийнхэн бүгд түүнд дуртай.","options":["A","B","C"],"optionTexts":["快乐","可爱","舒服"],"answer":"B","explanation_mn":"Хар нүдтэй зулзага «很可爱» — хөөрхөн. 快乐 нь баяртай, 舒服 нь тухтай гэсэн утгатай тул тохирохгүй."}],
   "answer_source":"YCT 4 Test Answers L11: 5.B 6.B 7.B 8.B"},
  {"part":3,"type":"match","instruction_mn":"Үлгэр «月亮的裙子» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"我有红色的裙子。","answer":"1","explanation_mn":"1-р зураг дээр сар улаан банзал барьж байна."},
    {"n":2,"question_zh":"我有白色的裙子。","answer":"2","explanation_mn":"2-р зураг дээр сар цагаан банзал барьсан."},
    {"n":3,"question_zh":"我有蓝色的裙子。","answer":"3","explanation_mn":"3-р зураг дээр сар цэнхэр банзал барьж байна."},
    {"n":4,"question_zh":"我有绿色的裙子。","answer":"4","explanation_mn":"4-р зураг дээр сар ногоон банзал барьсан, доор нь ногоон тал харагдана."},
    {"n":5,"question_zh":"我有黄色的裙子，把它送给你！","answer":"5","explanation_mn":"5-р зураг дээр нар шар банзлаа сарт бэлэглэж байна."}],
   "answer_source":"textbook х.56 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «裙子» гэсэн ханзыг дахин бичиж хуул.","question_zh":"裙子","answer":"裙子","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа юу өмсөхийг асуу, дараа нь яагаад гэдгийг нь асуу.","question_zh":"今天你穿哪件衣服？ 为什么？","answer":"今天你穿哪件衣服？","explanation_mn":"Хосоороо ээлжлэн. Хариуд нь «因为……» гэж хэл."},
   {"n":2,"prompt_mn":"Black and White — хар, цагаан зүйлсийг хятадаар нэрлэ.","question_zh":"白裙子，黑裤子……","answer":"(нээлттэй)","explanation_mn":"Хамгийн олон нэр хэлсэн баг хожно."},
   {"n":3,"prompt_mn":"Let's say-г хөдөлгөөнтэй хэл.","question_zh":"我的妹妹长大了。她长得很漂亮，很可爱。","answer":"(нээлттэй)","explanation_mn":"Аудио 11-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 4 · Test Listening Scripts, Test Answers (Lesson 11)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("qunzi","裙子"),("kuzi","裤子"),("bai","白"),("hei","黑"),("keai","可爱"),("zhang","长"),("chusheng","出生"),("jian","件")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"它长得很快。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"今天你穿哪件衣服？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"你们还认识它吗？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"妹妹长大了","role":"illustration","section":"song"},
 {"id":"story-art","file":"images/story.jpg","title":"月亮的裙子","role":"illustration","section":"story"},
 {"id":"story","file":"images/story.png","title":"月亮的裙子 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 4 · 11-р хичээл — Тэр маш хурдан томорч байна","chineseTitle":"它长得很快。","targetTitle":"它长得很快。","mongolianTitle":"Тэр маш хурдан томорч байна",
 "subtitle":"裙子 · 裤子 · 白 · 黑 · 长得很快 · «月亮的裙子» үлгэр",
 "description":f"Хувцсаа сонгох, өсөлтийг дүрслэхийг сурна. {len(vocab)} үг, 2 зурагт яриа, Let's say, Mini story «月亮的裙子», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"👗","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 4",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 4 — 第11课《它长得很快。》 [hskLevel=2] [lessonNumber=11]; эх: сурах бичиг х.53–57; аудио CD 11-01…11-05 (бүгд байгаа)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"它长得很快。","mongolianTitle":"Тэр маш хурдан томорч байна",
 "series":"YCT 标准教程 4","seriesLabel_mn":"YCT 4 — Хүүхдийн хятад хэл (≈HSK2–3)",
 "source":"YCT 标准教程 4 · 第11课 (сурах бичиг + CD аудио 11-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_CHANT,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L11)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
