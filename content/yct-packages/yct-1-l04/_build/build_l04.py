#!/usr/bin/env python3
"""YCT 标准教程 1 · 第4课 我家有四口人。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
OUT = "/home/claude/work/yct1/l04/pkg"
CID, LID, N = "yct-1", "yct-1-l04", 4
os.makedirs(OUT, exist_ok=True)

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

# audio: яриа (04-02) + chant (04-04) нийлүүлэх
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_SONG, AUD_TEST = [f"audio/yct-1-04-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-1-04-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-1-04-02.mp3'\nfile '{A}/yct-1-04-04.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("爸爸","bàba","аав","нэр үг · гол үг","爸爸，爸爸，好爸爸。","Bàba, bàba, hǎo bàba.","Аав, аав, сайн аав минь.",True),
 ("妈妈","māma","ээж","нэр үг · гол үг","妈妈，妈妈，好妈妈。","Māma, māma, hǎo māma.","Ээж, ээж, сайн ээж минь.",True),
 ("哥哥","gēge","ах (өөрөөс том эрэгтэй төрсөн ах)","нэр үг · гол үг","哥哥，哥哥，好哥哥。","Gēge, gēge, hǎo gēge.","Ах, ах, сайн ах минь.",True),
 ("姐姐","jiějie","эгч (өөрөөс том эмэгтэй төрсөн эгч)","нэр үг · гол үг","你有姐姐吗？","Nǐ yǒu jiějie ma?","Чамд эгч байна уу?",True),
 ("妹妹","mèimei","дүү охин","нэр үг · нэмэлт үг","我有一个妹妹。","Wǒ yǒu yí ge mèimei.","Надад нэг дүү охин бий.",False),
 ("家","jiā","гэр бүл, гэр","нэр үг · гол үг","你家有几口人？","Nǐ jiā yǒu jǐ kǒu rén?","Чиний гэрт хэдэн хүн байдаг вэ?",True),
 ("有","yǒu","байх, эзэмшиж байх","үйл үг · гол үг","你有姐姐吗？","Nǐ yǒu jiějie ma?","Чамд эгч байна уу?",True),
 ("没有","méiyǒu","байхгүй","үйл үг · нэмэлт үг","没有。我有一个妹妹。","Méiyǒu. Wǒ yǒu yí ge mèimei.","Үгүй, байхгүй. Надад нэг дүү охин бий.",False),
 ("几","jǐ","хэдэн (арав хүртэлх тоог асуух)","асуух үг · гол үг","你家有几口人？","Nǐ jiā yǒu jǐ kǒu rén?","Чиний гэрт хэдэн хүн байдаг вэ?",True),
 ("口","kǒu","гэр бүлийн гишүүдийг тоолох үг (хүн)","тоолох үг · гол үг","四口人","Sì kǒu rén","Дөрвөн хүн (гэр бүл)",True),
 ("和","hé","ба, ба мөн, болон","холбох үг · гол үг","爸爸和妈妈","Bàba hé māma","Аав ба ээж",True),
 ("个","ge","ширхэг (ерөнхий тоолох үг)","тоолох үг · гол үг","一个姐姐","Yí ge jiějie","Нэг эгч",True),
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
 {"id":1,"title_mn":"Яриа 1 · Шатан дээр гэр бүлийн зургийн өмнө","scene_mn":"Хоёр хүү шатан дээр зогсоод хананд өлгөсөн гэр бүлийн зургийг харж байна. Нэг нь нөгөөгөөсөө гэр бүлийг нь асууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"你家有几口人？","pinyin":"Nǐ jiā yǒu jǐ kǒu rén?","mn":"Чиний гэрт хэдэн хүн байдаг вэ?"},
           {"speaker":"大卫","zh":"四口人，爸爸、妈妈、哥哥和我。","pinyin":"Sì kǒu rén, bàba, māma, gēge hé wǒ.","mn":"Дөрвөн хүн. Аав, ээж, ах бид хоёр."}]},
 {"id":2,"title_mn":"Яриа 2 · Зуны байгальд пикник хийж байна","scene_mn":"Хүүхдүүд ээжүүдийнхээ хамт зүлэг дээр пикник хийж байна. Охин хүүгээс эгчийг нь асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"月月","zh":"你有姐姐吗？","pinyin":"Nǐ yǒu jiějie ma?","mn":"Чамд эгч байна уу?"},
           {"speaker":"小红","zh":"没有。我有一个妹妹。","pinyin":"Méiyǒu. Wǒ yǒu yí ge mèimei.","mn":"Үгүй, байхгүй. Надад нэг дүү охин бий."}]},
]
sentences=[]
dlg = [
 (1,"小明：你好吗？","",""),
]
dlg = [
 (1,"小明：你家有几口人？","Xiǎo Míng: Nǐ jiā yǒu jǐ kǒu rén?","Сяо Мин: Чиний гэрт хэдэн хүн байдаг вэ?","小明：| 你|nǐ 家|jiā 有|yǒu 几|jǐ 口|kǒu 人|rén ？|","你家有几口人？ — «几» гэж арав хүртэлх тоог асууна. «口» нь гэр бүлийн хүнийг тоолдог үг.",["你家有几口人？"]),
 (1,"大卫：四口人，爸爸、妈妈、哥哥和我。","Dàwèi: Sì kǒu rén, bàba, māma, gēge hé wǒ.","Дэвид: Дөрвөн хүн. Аав, ээж, ах бид хоёр.","大卫：| 四|sì 口|kǒu 人|rén ，| 爸爸|bàba 、| 妈妈|māma 、| 哥哥|gēge 和|hé 我|wǒ 。|","Хариулахдаа тоо + 口人 гэж хэлээд, хэн хэн байгааг нэрлэнэ. 和 = «ба».",[]),
 (2,"月月：你有姐姐吗？","Yuèyue: Nǐ yǒu jiějie ma?","Юэ-юэ: Чамд эгч байна уу?","月月：| 你|nǐ 有|yǒu 姐姐|jiějie 吗|ma ？|","你有姐姐吗？ — 吗 нь өгүүлбэрийн эцэст орж «байна уу?» гэсэн асуулт болгоно.",["你有姐姐吗？"]),
 (2,"小红：没有。我有一个妹妹。","Xiǎo Hóng: Méiyǒu. Wǒ yǒu yí ge mèimei.","Сяо Хун: Үгүй, байхгүй. Надад нэг дүү охин бий.","小红：| 没有|méiyǒu 。| 我|wǒ 有|yǒu 一|yí 个|ge 妹妹|mèimei 。|","没有 = «байхгүй». 一个 = «нэг», хүнийг тоолох ерөнхий үг 个.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("我家有三口人，爸爸、妈妈和我。","Wǒ jiā yǒu sān kǒu rén, bàba, māma hé wǒ.","Манай гэрт гурван хүн бий. Аав, ээж, би.","我|wǒ 家|jiā 有|yǒu 三|sān 口|kǒu 人|rén ，| 爸爸|bàba 、| 妈妈|māma 和|hé 我|wǒ 。|"),
 ("我爱爸爸妈妈，爸爸妈妈也爱我。","Wǒ ài bàba māma, bàba māma yě ài wǒ.","Би аав ээжийгээ хайрладаг. Аав ээж минь ч намайг хайрладаг.","我|wǒ 爱|ài 爸爸|bàba 妈妈|māma ，| 爸爸|bàba 妈妈|māma 也|yě 爱|ài 我|wǒ 。|"),
 ("我有一只小狗和一只小猫。小狗叫豆豆，小猫叫多多。","Wǒ yǒu yì zhī xiǎo gǒu hé yì zhī xiǎo māo. Xiǎo gǒu jiào Dòudou, xiǎo māo jiào Duōduo.","Надад нэг гөлөг, нэг муур бий. Гөлөг нь Доу-доу, муур нь До-до гэдэг.","我|wǒ 有|yǒu 一|yì 只|zhī 小狗|xiǎo gǒu 和|hé 一|yì 只|zhī 小猫|xiǎo māo 。| 小狗|xiǎo gǒu 叫|jiào 豆豆|Dòudou ，| 小猫|xiǎo māo 叫|jiào 多多|Duōduo 。|"),
 ("豆豆爱多多，多多也爱豆豆。","Dòudou ài Duōduo, Duōduo yě ài Dòudou.","Доу-доу До-догоо хайрладаг. До-до ч Доу-доуг хайрладаг.","豆豆|Dòudou 爱|ài 多多|Duōduo ，| 多多|Duōduo 也|yě 爱|ài 豆豆|Dòudou 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «我的家» — 4 зурагт богино үлгэр. 我家有三口人 — манай гэрт гурван хүн бий."
    if i==1: s["note"]="爱 = хайрлах. 也 = мөн, бас (ч)."
    sentences.append(s)
chant = [
 ("爸爸，爸爸，好爸爸，我爱好爸爸。","Bàba, bàba, hǎo bàba, wǒ ài hǎo bàba.","Аав, аав, сайн аав, би сайн аавыгаа хайрладаг.","爸爸|bàba ，| 爸爸|bàba ，| 好|hǎo 爸爸|bàba ，| 我|wǒ 爱|ài 好|hǎo 爸爸|bàba 。|"),
 ("妈妈，妈妈，好妈妈，我爱好妈妈。","Māma, māma, hǎo māma, wǒ ài hǎo māma.","Ээж, ээж, сайн ээж, би сайн ээжээ хайрладаг.","妈妈|māma ，| 妈妈|māma ，| 好|hǎo 妈妈|māma ，| 我|wǒ 爱|ài 好|hǎo 妈妈|māma 。|"),
 ("哥哥，哥哥，好哥哥，我爱好哥哥。","Gēge, gēge, hǎo gēge, wǒ ài hǎo gēge.","Ах, ах, сайн ах, би сайн ахаа хайрладаг.","哥哥|gēge ，| 哥哥|gēge ，| 好|hǎo 哥哥|gēge ，| 我|wǒ 爱|ài 好|hǎo 哥哥|gēge 。|"),
 ("姐姐，姐姐，好姐姐，我爱好姐姐。","Jiějie, jiějie, hǎo jiějie, wǒ ài hǎo jiějie.","Эгч, эгч, сайн эгч, би сайн эгчээ хайрладаг.","姐姐|jiějie ，| 姐姐|jiějie ，| 好|hǎo 姐姐|jiějie ，| 我|wǒ 爱|ài 好|hǎo 姐姐|jiějie 。|"),
 ("我爱我的家，嘿，我爱我的家。","Wǒ ài wǒ de jiā, hēi, wǒ ài wǒ de jiā.","Би гэр бүлээ хайрладаг, хэй, би гэр бүлээ хайрладаг.","我|wǒ 爱|ài 我|wǒ 的|de 家|jiā ，| 嘿|hēi ，| 我|wǒ 爱|ài 我|wǒ 的|de 家|jiā 。|"),
 ("我爱我的家，嘿，我爱我的家。","Wǒ ài wǒ de jiā, hēi, wǒ ài wǒ de jiā.","Би гэр бүлээ хайрладаг, хэй, би гэр бүлээ хайрладаг.","我|wǒ 爱|ài 我|wǒ 的|de 家|jiā ，| 嘿|hēi ，| 我|wǒ 爱|ài 我|wǒ 的|de 家|jiā 。|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Chant «我爱我的家» — мөр бүрээр аав, ээж, ах, эгчээ нэрлэж «хайртай» гэж хэлнэ. 爱 = хайрлах."
    sentences.append(s)

texts = {
 "unit":{"number":"4","title":"我家有四口人。","mongolianTitle":"Манай гэр бүлд дөрвөн хүн бий — гэр бүлээ танилцуулах"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чиний гэрт хэдэн хүн байдаг вэ? Аав, ээж, ах, эгч, дүү — тэд бүгд чиний гэр бүл! Өнөөдөр бид хятадаар гэр бүлээ танилцуулж сурна. Аавыг «爸爸 (bàba)», ээжийг «妈妈 (māma)» гэдэг. Мөн «你家有几口人？» гэж найзаасаа асууж, «我有一个妹妹» гэж хариулж сурна. Дараа нь «我爱我的家» дууг гараараа зүрх хийж дуулна. Гэр бүлээ зураад найзууддаа танилцуулъя. Эхэлцгээе!",
  "warmup_mn":"Чиний гэрт хэдэн хүн байдаг вэ? Хуруугаараа тоолоод хэл. Чамд ах, эгч, дүү байна уу?",
  "theme_zh":"家人 · 几口人 · 有 / 没有","theme_mn":"Гэр бүл · Хэдэн хүн вэ · Байна / байхгүй"},
 "warmup":{"mongolian":"Чиний гэрт хэдэн хүн байдаг вэ? Чамд ах, эгч, дүү байна уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"4","title":"我家有四口人。","mongolianTitle":"Манай гэр бүлд дөрвөн хүн бий — яриа, үлгэр, дуу","title_mn":"Let's read · 2 яриа + Mini story + Let's chant · 我爱我的家","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第4课 Let's read / Mini story / Let's chant（CD 04-02, 04-03, 04-04）","author_zh":"",
  "intro_zh":"两段小对话：你家有几口人？你有姐姐吗？然后读小故事《我的家》，一起唱“我爱我的家”。",
  "intro_mn":"Эхлээд хоёр богино яриа: «你家有几口人？» гэж гэр бүлээ асууна, «你有姐姐吗？» гэж эгчийг нь асууна. Дараа нь «Миний гэр» үлгэрийг уншина. Хамгийн сүүлд «我爱我的家» chant-ыг гараараа зүрх хийж дуулна. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Шатан дээр хоёр хүү гэр бүлийн зургийг харна. «你家有几口人？» гэж асуугаад «四口人» гэж хариулна."},
   {"paragraph":2,"mn":"Яриа 2 — Пикникт охин «你有姐姐吗？» гэж асуугаад «没有，我有一个妹妹» гэсэн хариу авна."},
   {"paragraph":3,"mn":"Үлгэр «Миний гэр» — гурван хүнтэй гэр бүл, гөлөг Доу-доу, муур До-до. Бүгд бие биенээ хайрладаг. Аудио: 04-03."},
   {"paragraph":4,"mn":"Chant «Би гэр бүлээ хайрладаг» — аав, ээж, ах, эгч бүрийг «сайн» гэж нэрлэж, «хайртай» гэж дуулна. Хамгийн сүүлд «我爱我的家»-г хоёр удаа давтана."}],
  "reflection":{"questions_mn":["Чиний гэрт хэдэн хүн байдаг вэ? Хятадаар хэлж үз.","Чамд ах, эгч байна уу? 有 эсвэл 没有 гэж хэл.","Гэр бүлийн хэн нэгэнд «Би чамайг хайрладаг» гэж хэлсэн үү?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Гэр бүлээ танилцуул","zh":"我家有四口人，爸爸、妈妈、哥哥和我。","pinyin":"Wǒ jiā yǒu sì kǒu rén, bàba, māma, gēge hé wǒ.","mn":"Манай гэрт дөрвөн хүн бий. Аав, ээж, ах бид хоёр."},
  "writingPrompt_mn":"Гэр бүлээ зураад хятадаар танилцуул: 我家有……口人，……和我。 Тоог зөв хэл!"},
 "properNouns":[{"zh":"豆豆","pinyin":"Dòudou","mn":"Доу-доу (гөлөгний нэр)"},{"zh":"多多","pinyin":"Duōduo","mn":"До-до (муурны нэр)"}],
 "wordExplanation":[
  {"word":"几口人","gloss":"jǐ kǒu rén — хэдэн хүн","explanation":"几 нь «хэдэн» гэсэн асуулт. Арав хүртэлх тоог асуухад хэрэглэнэ. 口 нь гэр бүлийн хүнийг тоолдог үг. Тиймээс «你家有几口人？» гэвэл «Чиний гэрт хэдэн хүн байдаг вэ?» гэсэн үг. Хариулахдаа «四口人» гэх мэт тоогоо хэлнэ.",
   "structure":"你家有几口人？ → 我家有 + тоо + 口人。","teacher_notes":"Хүүхдэд 口 гэж «ам» гэсэн утга бас байдгийг хэлж болно: гэр бүлд хэдэн «ам» байна гэж тоолдог. Дүрмийн нэр томьёо хэрэглэхгүй, жишээгээр л давтуул.",
   "examples":[{"chinese":"你家有几口人？","pinyin":"Nǐ jiā yǒu jǐ kǒu rén?","mongolian":"Чиний гэрт хэдэн хүн байдаг вэ?"},{"chinese":"四口人，爸爸、妈妈、哥哥和我。","pinyin":"Sì kǒu rén, bàba, māma, gēge hé wǒ.","mongolian":"Дөрвөн хүн. Аав, ээж, ах бид хоёр."},{"chinese":"我家有三口人。","pinyin":"Wǒ jiā yǒu sān kǒu rén.","mongolian":"Манай гэрт гурван хүн бий."}],
   "common_mistakes":[{"wrong":"我家有三个人口。","right":"我家有三口人。","why":"Гэр бүлийг тоолохдоо тоо, дараа нь 口, дараа нь 人."}],
   "check":{"question":"«Чиний гэрт хэдэн хүн байдаг вэ?» хятадаар:","options":["你家有几口人？","你有姐姐吗？","我爱我的家。"],"answer":"0"},
   "practice":[{"n":1,"question":"我家有 ________ 口人。(гурав)","answer":"三","explanation_mn":"三 = гурав. 我家有三口人 — гурван хүнтэй гэр бүл."}]},
  {"word":"有 / 没有","gloss":"yǒu / méiyǒu — байна / байхгүй","explanation":"有 = «байх, эзэмшиж байх». 你有姐姐吗？ — «Чамд эгч байна уу?» Байхгүй бол «没有» гэнэ. Байвал «我有……» гэж хэлээд тоог нь нэмнэ.",
   "structure":"你有……吗？ → 我有一个……。 / 没有。","teacher_notes":"没有 гэж хариулсны дараа «我有一个妹妹» гэх мэтээр бусад гишүүдийг нэмж хэлж болно (номын яриа 2).",
   "examples":[{"chinese":"你有姐姐吗？","pinyin":"Nǐ yǒu jiějie ma?","mongolian":"Чамд эгч байна уу?"},{"chinese":"没有。我有一个妹妹。","pinyin":"Méiyǒu. Wǒ yǒu yí ge mèimei.","mongolian":"Үгүй. Надад нэг дүү охин бий."},{"chinese":"我有一只小狗。","pinyin":"Wǒ yǒu yì zhī xiǎo gǒu.","mongolian":"Надад нэг гөлөг бий."}],
   "common_mistakes":[{"wrong":"没有姐姐吗？ гэж хариулах","right":"没有。","why":"Асуултад «байхгүй» гэж богино хариулна."}],
   "check":{"question":"«Надад нэг дүү охин бий» хятадаар:","options":["我有一个妹妹。","我没有哥哥。","你有姐姐吗？"],"answer":"0"},
   "practice":[{"n":1,"question":"你有哥哥吗？ — ________。(байхгүй)","answer":"没有","explanation_mn":"Байхгүй бол 没有."}]},
 ],
 "collocations":[{"type":"家人 + 有 — гэр бүлийн гишүүд","rows":[
   {"head":"有","with":"姐姐","mn":"эгчтэй","usage_mn":"Эгч байгаа үед","example":{"zh":"你有姐姐吗？","pinyin":"Nǐ yǒu jiějie ma?","mn":"Чамд эгч байна уу?"}},
   {"head":"一个","with":"妹妹","mn":"нэг дүү охин","usage_mn":"Хүнийг тоолох 个","example":{"zh":"我有一个妹妹。","pinyin":"Wǒ yǒu yí ge mèimei.","mn":"Надад нэг дүү охин бий."}},
   {"head":"爸爸","with":"和妈妈","mn":"аав ба ээж","usage_mn":"Хоёр хүнийг холбох 和","example":{"zh":"爸爸和妈妈","pinyin":"Bàba hé māma","mn":"Аав ба ээж"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["几","有","和","个"],"items":[
     {"n":1,"question":"你家有 ________ 口人？","answer":"几","explanation_mn":"«Хэдэн» гэж асуухдаа 几."},
     {"n":2,"question":"你 ________ 姐姐吗？","answer":"有","explanation_mn":"«Чамд ... байна уу?» — 有."},
     {"n":3,"question":"爸爸 ________ 妈妈","answer":"和","explanation_mn":"Хоёр хүнийг холбоход 和 (ба)."},
     {"n":4,"question":"我有一 ________ 妹妹。","answer":"个","explanation_mn":"Нэг хүнийг тоолоход 个."}]}],
   "answer_source":"agent-authored (YCT 4 үгсээс)"},
  "comprehension":{"instruction_mn":"Let's read — асуултад хариул.","items":[
     {"n":1,"question_zh":"他家有谁？","answer":"爸爸、妈妈、哥哥和我。","explanation_mn":"Яриа 1 — Дэвид дөрвөн хүн гэж хэлээд бүгдийг нэрлэв."},
     {"n":2,"question_zh":"他有姐姐吗？","answer":"没有。","explanation_mn":"Яриа 2 — «没有» гэж хариулаад «Надад нэг дүү охин бий» гэв."}],
   "answer_source":"textbook_verified (Let's read, х.15)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэр бүлтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Найздаа танилцуул","start_zh":"我家有……口人。","instruction_mn":"Let's read — хоёр хүн болж ээлжлэн асууна: «你家有几口人？» Нөгөө нь «我家有……口人，……和我» гэж хариулна. Сайн сонс!"},
     {"label":"Ах эгч, дүүгээ тоолъё","start_zh":"你有姐姐吗？","instruction_mn":"Найздаа «你有姐姐吗？ 你有哥哥吗？» гэж асууж үз. Тэр «有» эсвэл «没有» гэж хариулна. Хэдэн ах, эгчтэй байгааг нь гараараа тоолоорой."},
     {"label":"Гэр бүлээ зур","start_zh":"我爱我的家。","instruction_mn":"Let's draw — цаасан дээр хүрээ зураад гэр бүлийнхээ гишүүдийг зур. Дараа нь «我家有……口人» гэж ангидаа танилцуул."},
     {"label":"Үлгэр жүжигчилье","start_zh":"我的家","instruction_mn":"Mini story — «我的家» үлгэрийг уншаад жүжигчилье. Нэг нь аав, нэг нь ээж, нэг нь гөлөг Доу-доу, нэг нь муур До-до болно. Гараараа тэврэлцэж «我爱你» гэж тоглоорой!"}]}},
 "grammarNotes":[],
 "culture":{"title":"哥哥 · 姐姐 · 妹妹","title_mn":"Хятадад ах, эгч, дүүг тусад нь нэрлэдэг","text_mn":"Монголоор бид «ах», «эгч», «дүү» гэдэг шиг хятадууд ч өөрөөс том, жижгийг ялгадаг. Өөрөөс том ахыг «哥哥», том эгчийг «姐姐» гэнэ. Харин өөрөөс бага дүү охиныг «妹妹» гэнэ. Хятад хүүхдүүд ах, эгчээ нэрээр нь биш «哥哥», «姐姐» гэж дууддаг.","note_mn":"Чи ахаа, эгчээ нэрээр нь дууддаг уу, «ах», «эгч» гэж дууддаг уу? Хятадад ч яг л чам шиг дууддаг юм."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — гэр бүлийн гишүүд ба хэдэн хүн вэ гэж асуух.","topic":"Гэр бүлээ хятадаар танилцуул","discussion":["Хосоороо: «你家有几口人？» гэж асууж, «我家有……口人» гэж хариул.","Бүгдээрээ «我爱我的家» chant-ыг тойрог болж хэл."],
   "writing":{"promptChinese":"我家有……口人。","promptMongolian":"Гэрийн даалгавар: гэр бүлийнхээ зургийг зураад «我家有……口人，……和我» гэж ээж аавдаа хэлж өг.","minChars":"0","requiredWords":["家","有","和"],"sampleChinese":"我家有四口人，爸爸、妈妈、哥哥和我。","sampleMongolian":"Манай гэрт дөрвөн хүн бий. Аав, ээж, ах бид хоёр.","gradingRubric":"Тоог зөв хэлсэн, гэр бүлийн гишүүдийг нэрлэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L4 1.✓ 2.✗ 3.✗ 4.✓ 5.C 6.A 7.B 8.D","parts":[]},
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
 {"point":"你家有几口人？ — хэдэн хүн вэ","gloss_mn":"«Чиний гэрт хэдэн хүн байдаг вэ?» — гэр бүлийн хүний тоог асууна",
  "structure":"你家有几口人？ → 我家有 + тоо + 口人。",
  "teacher_mn":"Найзынхаа гэр бүлийг мэдэхийг хүсвэл «你家有几口人？» гэж асууна. 几 нь «хэдэн», 口 нь гэр бүлийн хүнийг тоолдог үг. Хариулахдаа «四口人» гэх мэтээр тоогоо хэлээд, хэн хэн байгааг нэрлэнэ. Гараараа тоолж хэлээд үз!",
  "teacher_notes":"几 нь арав хүртэлх тоог асуудаг. Номын яриа: 四口人，爸爸、妈妈、哥哥和我。 Хүүхдэд «口 = гэр бүлийн хүн тоолох үг» гэж л хэл.",
  "examples":[ex("你家有几口人？","Nǐ jiā yǒu jǐ kǒu rén?","Чиний гэрт хэдэн хүн байдаг вэ?"),ex("四口人，爸爸、妈妈、哥哥和我。","Sì kǒu rén, bàba, māma, gēge hé wǒ.","Дөрвөн хүн. Аав, ээж, ах бид хоёр."),ex("我家有三口人，爸爸、妈妈和我。","Wǒ jiā yǒu sān kǒu rén, bàba, māma hé wǒ.","Манай гэрт гурван хүн. Аав, ээж, би."),ex("我家有四口人。","Wǒ jiā yǒu sì kǒu rén.","Манай гэрт дөрвөн хүн бий.")],
  "common_mistakes":[{"wrong":"你家有几人口？","right":"你家有几口人？","why":"Дараалал: 几 → 口 → 人."},{"wrong":"我家有四个口人。","right":"我家有四口人。","why":"Гэр бүлийн хүнийг тоолохдоо 口 хэрэглэнэ, 个 нэмэхгүй."}],
  "check":chk("Найзаасаа «Чиний гэрт хэдэн хүн байдаг вэ?» гэж асуу:",["你家有几口人？","你有姐姐吗？","我爱我的家。"],"你家有几口人？","g1c"),
  "exercises":[
   choice("你家有 ________ 口人？",["几","和","没有"],"几","Зөв! 几 = хэдэн.","几 = хэдэн, 和 = ба, 没有 = байхгүй.","g1e1"),
   choice("我家有三 ________ 人，爸爸、妈妈和我。",["口","个","有"],"口","Зөв! Гэр бүлийн хүнийг тоолоход 口.","Гэр бүлийн хүн тоолох үг нь 口.","g1e2"),
   judge("«四口人» гэдэг нь «дөрвөн хүнтэй гэр бүл» гэсэн үг.",True,"Зөв! 四 = дөрөв, 口人 = гэр бүлийн хүн.","四 = дөрөв, тиймээс 四口人 = дөрвөн хүн.")]},
 {"point":"你有姐姐吗？ — байна уу? байхгүй","gloss_mn":"«Чамд эгч байна уу?» — 有 ба 没有",
  "structure":"你有 + хэн + 吗？ → 有。/ 没有。 → 我有一个 + хэн。",
  "teacher_mn":"«Чамд эгч байна уу?» гэж асуухдаа «你有姐姐吗？» гэнэ. 吗 нь асуулт болгодог үг. Байвал «有», байхгүй бол «没有» гэж хариулна. Дараа нь «我有一个妹妹» гэж өөр хэнтэй гэдгээ нэмж хэлж болно.",
  "teacher_notes":"个 нь хүнийг тоолоход хэрэглэдэг ерөнхий үг: 一个姐姐. Хоёр дахь яриа: 没有。我有一个妹妹。",
  "examples":[ex("你有姐姐吗？","Nǐ yǒu jiějie ma?","Чамд эгч байна уу?"),ex("没有。我有一个妹妹。","Méiyǒu. Wǒ yǒu yí ge mèimei.","Үгүй. Надад нэг дүү охин бий."),ex("爸爸和妈妈","Bàba hé māma","Аав ба ээж"),ex("我有一个姐姐。","Wǒ yǒu yí ge jiějie.","Надад нэг эгч бий.")],
  "common_mistakes":[{"wrong":"你有姐姐？(吗 орхих)","right":"你有姐姐吗？","why":"Асуухад өгүүлбэрийн эцэст 吗 тавина."},{"wrong":"我有姐姐一个。","right":"我有一个姐姐。","why":"Дараалал: 一个 → хэн."}],
  "check":chk("Найздаа «Чамд эгч байна уу?» гэж асуу:",["你有姐姐吗？","你家有几口人？","我爱爸爸。"],"你有姐姐吗？","g2c"),
  "exercises":[
   choice("你有哥哥 ________？",["吗","和","口"],"吗","Зөв! 吗 — асуулт.","吗 нь асуулт болгодог үг.","g2e1"),
   choice("Эгч байхгүй бол хариулах нь:",["没有","有","几"],"没有","Зөв! 没有 = байхгүй.","有 = байна, 没有 = байхгүй.","g2e2"),
   judge("«我有一个妹妹» гэдэг нь «Надад нэг дүү охин бий» гэсэн үг.",True,"Зөв! 妹妹 = дүү охин.","一个 = нэг, 妹妹 = дүү охин.")]},
 {"point":"和 ба 个 — ба, нэг хүн","gloss_mn":"«ба» ба хүнийг тоолох үг",
  "structure":"A 和 B  ·  一个 + хүн",
  "teacher_mn":"Хоёр хүнийг холбохдоо 和 гэж хэлнэ: «爸爸和妈妈» — аав ба ээж. Нэг хүнийг тоолохдоо 个 хэрэглэнэ: «一个姐姐» — нэг эгч. Гар даллаад хэл!",
  "teacher_notes":"和 нь сүүлийн хоёр хүний хооронд орно: 爸爸、妈妈、哥哥和我. Нэгийг заахад 一个.",
  "examples":[ex("爸爸和妈妈","Bàba hé māma","Аав ба ээж"),ex("爸爸、妈妈、哥哥和我","Bàba, māma, gēge hé wǒ","Аав, ээж, ах бид хоёр"),ex("一个姐姐","Yí ge jiějie","Нэг эгч")],
  "common_mistakes":[{"wrong":"爸爸妈妈和哥哥和我","right":"爸爸、妈妈、哥哥和我","why":"和 зөвхөн сүүлийн хоёрын хооронд."}],
  "check":chk("«Аав ба ээж» хятадаар:",["爸爸和妈妈","爸爸有妈妈","爸爸几妈妈"],"爸爸和妈妈","g3c"),
  "exercises":[
   choice("爸爸 ________ 妈妈",["和","几","有"],"和","Зөв! 和 = ба.","和 = ба.","g3e1"),
   choice("我有一 ________ 姐姐。",["个","口","几"],"个","Зөв! 一个姐姐 — нэг эгч.","Хүнийг тоолоход 个.","g3e2"),
   judge("«哥哥» гэдэг нь «эгч» гэсэн үг.",False,"Зөв — 哥哥 = ах, 姐姐 = эгч.","哥哥 = ах, 姐姐 = эгч.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Аав» хятадаар аль нь вэ?",["爸爸","妈妈","哥哥","姐姐"],"爸爸","爸爸 (bàba) = аав.","easy",["vocabulary"],"a1")
q("choice","«Ээж» хятадаар аль нь вэ?",["妈妈","爸爸","姐姐","家"],"妈妈","妈妈 (māma) = ээж.","easy",["vocabulary"],"a2")
q("choice","«Ах» хятадаар аль нь вэ?",["哥哥","姐姐","妹妹","爸爸"],"哥哥","哥哥 (gēge) = ах.","easy",["vocabulary"],"a3")
q("choice","«Эгч» хятадаар аль нь вэ?",["姐姐","哥哥","妈妈","老师"],"姐姐","姐姐 (jiějie) = эгч.","easy",["vocabulary"],"a4")
q("choice","«Дүү охин» хятадаар аль нь вэ?",["妹妹","姐姐","哥哥","妈妈"],"妹妹","妹妹 (mèimei) = дүү охин.","medium",["vocabulary"],"a5")
q("choice","«家» гэдэг үг ямар утгатай вэ?",["гэр бүл, гэр","багш","сайн","баяртай"],"гэр бүл, гэр","家 (jiā) = гэр бүл, гэр.","easy",["vocabulary"],"a6")
q("choice","«有» гэдэг үг ямар утгатай вэ?",["байх, эзэмшиж байх","байхгүй","ба","хэдэн"],"байх, эзэмшиж байх","有 (yǒu) = байх. 没有 = байхгүй.","easy",["vocabulary"],"a7")
q("choice","«没有» гэдэг үг ямар утгатай вэ?",["байхгүй","байна","хэдэн","ба"],"байхгүй","没有 (méiyǒu) = байхгүй.","easy",["vocabulary"],"a8")
q("choice","«几» гэдэг үг ямар утгатай вэ?",["хэдэн","байна","ба","сайн"],"хэдэн","几 (jǐ) = хэдэн.","easy",["vocabulary"],"a9")
q("choice","«和» гэдэг үг ямар утгатай вэ?",["ба","байхгүй","хэдэн","сайн"],"ба","和 (hé) = ба.","easy",["vocabulary"],"a10")
q("choice","Гэр бүлийн хүнийг тоолох үг аль нь вэ?",["口","几","和","有"],"口","口 (kǒu) — 四口人 (дөрвөн хүн).","medium",["vocabulary"],"a11")
q("choice","«Чиний гэрт хэдэн хүн байдаг вэ?» хятадаар:",["你家有几口人？","你有姐姐吗？","我爱我的家。","没有。"],"你家有几口人？","几口人 = хэдэн хүн.","easy",["dialogue"],"a12")
q("choice","«你有姐姐吗？» гэж асуувал юу гэж хариулах вэ (эгч байхгүй)?",["没有。","四口人。","我爱爸爸。","再见。"],"没有。","Байхгүй бол 没有.","easy",["dialogue"],"a13")
q("cloze","你家有（ ）口人？",["几","和","有","个"],"几","«хэдэн» гэж асуухад 几.","easy",["dialogue"],"a14")
q("cloze","爸爸（ ）妈妈",["和","几","没有","口"],"和","«ба» — 和.","easy",["dialogue"],"a15")
q("cloze","我有一（ ）妹妹。",["个","口","几","和"],"个","Нэг хүн — 一个.","medium",["dialogue"],"a16")
q("cloze","我家有三（ ）人。",["口","个","和","吗"],"口","Гэр бүлийн хүн — 口.","medium",["dialogue"],"a17")
q("choice","«Аав, ээж, ах бид хоёр» — хэдэн хүн вэ?",["四口人","三口人","五口人","一口人"],"四口人","爸爸、妈妈、哥哥和我 = 4 хүн = 四口人.","medium",["number"],"a18")
q("choice","我家有三口人，爸爸、妈妈和我。Хэдэн хүн бэ?",["3","4","2","5"],"3","三 = гурав.","easy",["number"],"a19")
q("choice","Пиньинь «bàba» гэж уншдаг үг:",["爸爸","妈妈","哥哥","家"],"爸爸","爸爸 = bàba = аав.","easy",["pronunciation"],"a20")
q("choice","Пиньинь «jiějie» гэж уншдаг үг:",["姐姐","哥哥","妹妹","妈妈"],"姐姐","姐姐 = jiějie = эгч.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «méiyǒu» гэж уншдаг үг:",["没有","几口","再见","你好"],"没有","没有 = méiyǒu = байхгүй.","medium",["pronunciation"],"a22")
q("usage","Найз чинь «你有哥哥吗？» гэж асуулаа. Чамд ах байвал юу гэх вэ?",["有。","没有。","再见。","老师好。"],"有。","Байвал 有.","medium",["usage"],"a23")
q("usage","Chant-д «我爱好爸爸» гэдэг нь:",["Би сайн аавыгаа хайрладаг","Миний аав байхгүй","Би хэдэн хүн вэ","Аав ба ээж"],"Би сайн аавыгаа хайрладаг","爱 = хайрлах, 好爸爸 = сайн аав.","medium",["usage"],"a24")
q("usage","Mini story-д гөлөгний нэр хэн бэ?",["豆豆","多多","爸爸","妹妹"],"豆豆","小狗叫豆豆 — гөлөг нь Доу-доу.","medium",["usage"],"a25")
q("usage","Mini story-д муурны нэр хэн бэ?",["多多","豆豆","哥哥","姐姐"],"多多","小猫叫多多 — муур нь До-до.","medium",["usage"],"a26")
q("choice","Дараах дундаас гэр бүлийн гишүүн биш нь:",["老师","爸爸","哥哥","妹妹"],"老师","老师 = багш, бусад нь гэр бүлийн гишүүн.","easy",["vocabulary"],"a27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t5a"),img("t5b"),img("t5c"),img("t5d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (04-05) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）爸爸","image":img("t1"),"script_zh":"爸爸","answer":"✓","explanation_mn":"Аудионд «爸爸 — аав» гэнэ. Зураг дээр охин аавынхаа нүдийг бүтээж байна, аав нь байна → ✓."},
    {"n":2,"question_zh":"（听录音）一个人","image":img("t2"),"script_zh":"一个人","answer":"✗","explanation_mn":"Аудионд «一个人 — нэг хүн». Зураг дээр буйдан дээр дөрвөн хүн сууж байна → ✗."},
    {"n":3,"question_zh":"（听录音）爸爸和妈妈","image":img("t3"),"script_zh":"爸爸和妈妈","answer":"✗","explanation_mn":"Аудионд «аав ба ээж». Зураг дээр охин ба ээж инээж байна, аав алга → ✗."},
    {"n":4,"question_zh":"（听录音）她是我姐姐。","image":img("t4"),"script_zh":"她是我姐姐。","answer":"✓","explanation_mn":"Аудионд «Тэр бол миний эгч». Зураг дээр завин дээр хоёр охин сууж байна — нэг нь эгч → ✓."}],
   "answer_source":"Test Answers х.63: 1.✓ 2.✗ 3.✗ 4.✓; Listening script х.61"},
  {"part":2,"type":"choice","instruction_mn":"Унших — өгүүлбэрт тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"我家有四口人。","question_mn":"Дөрвөн хүнтэй гэр бүл","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"«Манай гэрт дөрвөн хүн» — C зураг дээр аав, ээж, хоёр охин — 4 хүн. A хоёр охин, B хоёр хүү, D нэг хүү."},
    {"n":6,"question_zh":"我有一个姐姐。","question_mn":"Нэг эгчтэй","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"«Надад нэг эгч бий» — A зураг дээр хоёр охин зэрэгцэж зогсож байна, нэг нь эгч. B хоёр хүү, C гэр бүл, D нэг хүү."},
    {"n":7,"question_zh":"他是我哥哥。","question_mn":"Тэр бол миний ах","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"«Тэр бол миний ах» — B зураг дээр хоёр хүү, нэг нь нөгөөгөө үүрсэн ах дүү. A охид, C гэр бүл, D ганц хүү."},
    {"n":8,"question_zh":"妈妈，再见。","question_mn":"Ээж ээ, баяртай","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"«Ээж ээ, баяртай» — D зураг дээр цүнхтэй хүү гараа даллаж байна. Салахдаа гар даллана."}],
   "answer_source":"Test Answers х.63: 5.C 6.A 7.B 8.D"},
  {"part":3,"type":"match","instruction_mn":"Let's read — асуултад зөв хариултыг холбо.","items":[
    {"n":1,"question_zh":"你家有几口人？","answer":"四口人，爸爸、妈妈、哥哥和我。","explanation_mn":"Хэдэн хүн гэж асуусан тул тоогоо хэлнэ."},
    {"n":2,"question_zh":"你有姐姐吗？","answer":"没有。我有一个妹妹。","explanation_mn":"Эгч байхгүй, дүү охин бий."}],
   "answer_source":"textbook х.15 (Let's read)"},
  {"part":4,"type":"match","instruction_mn":"Mini story — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"我家有三口人，爸爸、妈妈和我。","answer":"1","explanation_mn":"1-р зураг дээр аав, ээж, хүүхэд буйдан дээр сууж байна."},
    {"n":2,"question_zh":"我爱爸爸妈妈，爸爸妈妈也爱我。","answer":"2","explanation_mn":"2-р зураг дээр аав ээж хүүхдээ тэвэрч байна."},
    {"n":3,"question_zh":"我有一只小狗和一只小猫。","answer":"3","explanation_mn":"3-р зураг дээр хүү нохой, мууртайгаа тоглож байна."},
    {"n":4,"question_zh":"豆豆爱多多，多多也爱豆豆。","answer":"4","explanation_mn":"4-р зураг дээр нохой ба муур хамт идэж байна."}],
   "answer_source":"textbook х.16 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханз бичих — «аав», «ээж» гэсэн ханзыг дахин бичиж хуулж үз.","question_zh":"爸爸 妈妈","answer":"爸爸 妈妈","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Гэр бүлээ хятадаар танилцуул.","question_zh":"我家有……口人，……和我。","answer":"我家有……口人","explanation_mn":"Let's draw — зурсан гэр бүлээ танилцуул."},
   {"n":2,"prompt_mn":"Найзаасаа ах эгчийг нь асуу.","question_zh":"你有姐姐吗？","answer":"你有姐姐吗？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":3,"prompt_mn":"«我爱我的家» chant-ыг гараараа зүрх хийж хэл.","question_zh":"我爱我的家","answer":"(нээлттэй)","explanation_mn":"Аудио 04-04-ийн хамт."}]},
 "answerSource":"YCT 标准教程 1 · х.61 Test Listening Scripts, х.63 Test Answers (Lesson 4)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("baba","爸爸"),("mama","妈妈"),("gege","哥哥"),("jiejie","姐姐"),("meimei","妹妹"),("jia","家"),("you","有"),("meiyou","没有"),("ji","几"),("kou","口"),("he","和"),("ge","个")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"我家有四口人。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你家有几口人？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"你有姐姐吗？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"我爱我的家","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"我的家 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1","2","3","4","5a","5b","5c","5d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 4-р хичээл — Манай гэр бүл","chineseTitle":"我家有四口人。","targetTitle":"我家有四口人。","mongolianTitle":"Манай гэр бүл",
 "subtitle":"爸爸 · 妈妈 · 哥哥 · 姐姐 · 几口人 · 有 / 没有 · «我爱我的家» chant",
 "description":f"Гэр бүлийн гишүүд (爸爸 妈妈 哥哥 姐姐 妹妹), 几口人, 有/没有 гэж асуух ба хариулах. {len(vocab)} үг, 2 зурагт яриа, Mini story, 1 chant, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"👨‍👩‍👧‍👦","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第4课《我家有四口人。》 [hskLevel=1] [lessonNumber=4]; эх: сурах бичиг х.14–18, х.61 (сонсголын текст), х.63 (хариу); аудио CD 04-01…04-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"我家有四口人。","mongolianTitle":"Манай гэр бүл",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第4课 (сурах бичиг + CD аудио 04-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers х.63)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
