#!/usr/bin/env python3
"""YCT 标准教程 2 · 第8课 马丁比我大三岁。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
OUT = "/home/claude/work/yct2/l08/pkg"
CID, LID, N = "yct-2", "yct-2-l08", 8
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


# Тестийн зургийг crop.py-аар (hi-43/44) өмнө нь хайчилсан: images/t1a-d, t5a-d, tstory.png
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-2-08-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = AUD_TEXT   # дуу байхгүй тул зөвхөн яриа
AUD_SONG = None

from PIL import Image
os.makedirs(f"{OUT}/images", exist_ok=True)
_p44 = Image.open("/home/claude/work/yct2/l08/pages/hi-44.png").convert("RGB"); _s = _p44.size[0]/830
_BOX = {"t1a":(235,210,355,312),"t1b":(380,210,490,318),"t1c":(540,230,650,308),"t1d":(705,235,795,312),
        "t5a":(208,632,318,720),"t5b":(380,640,490,720),"t5c":(555,632,655,720),"t5d":(690,632,785,720)}
for _k,_b in _BOX.items():
    _c = _p44.crop(tuple(int(v*_s) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
_p43 = Image.open("/home/claude/work/yct2/l08/pages/hi-43.png").convert("RGB"); _s3 = _p43.size[0]/830
_p43.crop(tuple(int(v*_s3) for v in (60,190,780,1010))).save(f"{OUT}/images/tstory.png")

# ---------------- VOCAB ----------------
VOCAB = [
 ("弟弟","dìdi","дүү хүү","нэр үг · гол үг","我的弟弟是学生。","Wǒ de dìdi shì xuésheng.","Миний дүү хүү сурагч.",True),
 ("妹妹","mèimei","дүү охин","нэр үг · гол үг","我比弟弟、妹妹高。","Wǒ bǐ dìdi, mèimei gāo.","Би дүү хүү, дүү охин хоёроосоо өндөр.",True),
 ("朋友","péngyou","найз","нэр үг · гол үг","他们是我的好朋友。","Tāmen shì wǒ de hǎo péngyou.","Тэд миний сайн найзууд.",True),
 ("同学","tóngxué","ангийн хүүхэд, ангийн найз","нэр үг · гол үг","苏珊和马丁是同学。","Sūshān hé Mǎdīng shì tóngxué.","Су-шан, Ма-дин хоёр ангийн хүүхдүүд.",True),
 ("也","yě","бас, ч","холбох үг · гол үг","我也是学生。","Wǒ yě shì xuésheng.","Би ч бас сурагч.",True),
 ("学生","xuésheng","сурагч","нэр үг · гол үг","他们也是小学生。","Tāmen yě shì xiǎoxuéshēng.","Тэд ч бас бага ангийн сурагчид.",True),
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
 {"id":1,"title_mn":"Яриа 1 · Хэн хэнээсээ өндөр вэ?","scene_mn":"Таван хүүхэд (том хоёр нь ах, эгч) өндрөөрөө эгнэж зогсоно. Хажууд нь жижиг нохой Да-хуан сууж байна. Хүү хэн хэнээсээ өндрийг хэлж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"哥哥比姐姐高，姐姐比我高，我比弟弟、妹妹高。","pinyin":"Gēge bǐ jiějie gāo, jiějie bǐ wǒ gāo, wǒ bǐ dìdi, mèimei gāo.","mn":"Ах эгчээсээ өндөр, эгч надаас өндөр, би дүү нараасаа өндөр."},
           {"speaker":"小明","zh":"我们比大黄高很多。","pinyin":"Wǒmen bǐ Dàhuáng gāo hěn duō.","mn":"Бид бүгд Да-хуан нохойноос хавьгүй өндөр."}]},
 {"id":2,"title_mn":"Яриа 2 · Төрсөн өдрийн найр дээр","scene_mn":"Цэцэрлэгт төрсөн өдрийн бялуу, жимс, шүүс тавьсан байна. Охин хоёр найзаа танилцуулж байна: Су-шан ба Ма-дин.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"这是苏珊，这是马丁，他们是我的好朋友。","pinyin":"Zhè shì Sūshān, zhè shì Mǎdīng, tāmen shì wǒ de hǎo péngyou.","mn":"Энэ Су-шан, энэ Ма-дин. Тэд миний сайн найзууд."},
           {"speaker":"小红","zh":"苏珊和马丁是同学，也是小学生。马丁比我大三岁，苏珊比我大两岁。","pinyin":"Sūshān hé Mǎdīng shì tóngxué, yě shì xiǎoxuéshēng. Mǎdīng bǐ wǒ dà sān suì, Sūshān bǐ wǒ dà liǎng suì.","mn":"Су-шан, Ма-дин хоёр ангийн хүүхдүүд, бас бага ангийн сурагчид. Ма-дин надаас гурван насаар том, Су-шан надаас хоёр насаар том."}]},
]
sentences=[]
dlg = [
 (1,"小明：哥哥比姐姐高，姐姐比我高，我比弟弟、妹妹高。","Xiǎo Míng: Gēge bǐ jiějie gāo, jiějie bǐ wǒ gāo, wǒ bǐ dìdi, mèimei gāo.","Сяо Мин: Ах эгчээсээ өндөр, эгч надаас өндөр, би дүү нараасаа өндөр.","小明：| 哥哥|gēge 比|bǐ 姐姐|jiějie 高|gāo ，| 姐姐|jiějie 比|bǐ 我|wǒ 高|gāo ，| 我|wǒ 比|bǐ 弟弟|dìdi 、| 妹妹|mèimei 高|gāo 。|","«A 比 B 高» гэвэл «A нь B-ээс өндөр». 比 нь «-ээс» гэсэн үг — хоёр юмыг жишнэ.",["哥哥比姐姐高。"]),
 (1,"小明：我们比大黄高很多。","Xiǎo Míng: Wǒmen bǐ Dàhuáng gāo hěn duō.","Сяо Мин: Бид бүгд Да-хуан нохойноос хавьгүй өндөр.","小明：| 我们|wǒmen 比|bǐ 大黄|Dàhuáng 高|gāo 很多|hěn duō 。|","高很多 = хавьгүй өндөр. Ялгаа том бол «很多» нэм. 大黄 бол нохойн нэр.",["我们比大黄高很多。"]),
 (2,"小红：这是苏珊，这是马丁，他们是我的好朋友。","Xiǎo Hóng: Zhè shì Sūshān, zhè shì Mǎdīng, tāmen shì wǒ de hǎo péngyou.","Сяо Хун: Энэ Су-шан, энэ Ма-дин. Тэд миний сайн найзууд.","小红：| 这|zhè 是|shì 苏珊|Sūshān ，| 这|zhè 是|shì 马丁|Mǎdīng ，| 他们|tāmen 是|shì 我|wǒ 的|de 好|hǎo 朋友|péngyou 。|","好朋友 = сайн найз.",[]),
 (2,"小红：苏珊和马丁是同学，也是小学生。","Xiǎo Hóng: Sūshān hé Mǎdīng shì tóngxué, yě shì xiǎoxuéshēng.","Сяо Хун: Су-шан, Ма-дин хоёр ангийн хүүхдүүд, бас бага ангийн сурагчид.","小红：| 苏珊|Sūshān 和|hé 马丁|Mǎdīng 是|shì 同学|tóngxué ，| 也|yě 是|shì 小学生|xiǎoxuéshēng 。|","也 = «бас». 也是小学生 — «бас бага ангийн сурагч».",["他们也是小学生。"]),
 (2,"小红：马丁比我大三岁，苏珊比我大两岁。","Xiǎo Hóng: Mǎdīng bǐ wǒ dà sān suì, Sūshān bǐ wǒ dà liǎng suì.","Сяо Хун: Ма-дин надаас гурван насаар том, Су-шан надаас хоёр насаар том.","小红：| 马丁|Mǎdīng 比|bǐ 我|wǒ 大|dà 三|sān 岁|suì ，| 苏珊|Sūshān 比|bǐ 我|wǒ 大|dà 两|liǎng 岁|suì 。|","Хэдэн насаар том бэ гэдгийг 大 ийн ард тоо + 岁 гэж хэлнэ.",["马丁比我大三岁。"]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("骆驼：我比你高，哈哈。","Luòtuo: Wǒ bǐ nǐ gāo, hāha.","Тэмээ: Би чамаас өндөр, ха-ха.","骆驼：| 我|wǒ 比|bǐ 你|nǐ 高|gāo ，| 哈哈|hāha 。|"),
 ("骆驼：我比你高得多，哈哈。","Luòtuo: Wǒ bǐ nǐ gāo de duō, hāha.","Тэмээ: Би чамаас хавьгүй өндөр, ха-ха.","骆驼：| 我|wǒ 比|bǐ 你|nǐ 高|gāo 得|de 多|duō ，| 哈哈|hāha 。|"),
 ("山羊：我比你矮。","Shānyáng: Wǒ bǐ nǐ ǎi.","Ямаа: Би чамаас намхан.","山羊：| 我|wǒ 比|bǐ 你|nǐ 矮|ǎi 。|"),
 ("山羊：我比你矮，可是我也能做很多事。","Shānyáng: Wǒ bǐ nǐ ǎi, kěshì wǒ yě néng zuò hěn duō shì.","Ямаа: Би чамаас намхан, гэвч би ч бас олон юм хийж чадна.","山羊：| 我|wǒ 比|bǐ 你|nǐ 矮|ǎi ，| 可是|kěshì 我|wǒ 也|yě 能|néng 做|zuò 很多|hěn duō 事|shì 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «比高矮» — өндөр, намыг жишдэг тэмээ ба ямааны 4 зурагт үлгэр. 矮 = намхан. Аудио: 08-03."
    if i==1: s["note"]="高得多 = хавьгүй өндөр (高很多-той адил)."
    if i==3: s["note"]="可是 = гэвч. 能 = чадах. Намхан ч гэсэн олон юм хийж чадна!"
    sentences.append(s)

texts = {
 "unit":{"number":"8","title":"马丁比我大三岁。","mongolianTitle":"Ма-дин надаас гурван насаар том — хэн хэнээсээ том, өндөр вэ"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх YCT 1 номд чи гэр бүлээ, тоо, өнгө, амьтдыг сурсан. Одоо чи хэн хэнээсээ өндөр, хэн хэнээсээ том вэ гэдгийг хятадаар хэлж сурна! Ахтайгаа зэрэгцэж зогсоод «哥哥比我高» гэж хэлээд үз. Мөн «马丁比我大三岁» гэж хэдэн насаар том болохыг хэлнэ. Найзуудаа «朋友», «同学» гэж нэрлээд, «我也是学生» гэж «бас» гэж хэлэхийг сурна. Тэмээ ямаа хоёр хэн өндөр вэ гэж маргаж байгаа үлгэрийг бас сонсоорой. Эхэлцгээе!",
  "warmup_mn":"Чи гэр бүлдээ хэн нь хамгийн өндөр вэ? Чи хэдэн настай вэ, найз чинь чамаас хэдэн насаар том юм бэ?",
  "theme_zh":"比 · 大几岁 · 也 · 朋友 同学","theme_mn":"Хэн хэнээсээ өндөр, том · найз, ангийн хүүхэд · бас"},
 "warmup":{"mongolian":"Гэр бүлд чинь хэн нь хамгийн өндөр вэ? Найз чинь чамаас хэдэн насаар том бэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"8","title":"马丁比我大三岁。","mongolianTitle":"Ма-дин надаас гурван насаар том — 2 яриа ба Mini story","title_mn":"Let's read · 2 яриа + Mini story «比高矮»","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第8课 Let's read / Mini story（CD 08-02, 08-03）","author_zh":"",
  "intro_zh":"两段小对话：谁比谁高？马丁比我大三岁。然后读小故事《比高矮》，和朋友一起演一演。",
  "intro_mn":"Эхний яриаг өндрөөрөө эгнэж зогссон таван хүүхэд хэлнэ: хэн хэнээсээ өндөр вэ? Хоёр дахь ярианд охин найзуудаа танилцуулж, хэн хэдэн насаар том гэдгийг хэлнэ. Дараа нь тэмээ ямаа хоёрын «比高矮» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хүүхдүүд өндрөөрөө эгнэж зогсоод «哥哥比姐姐高...» гэж хэн хэнээсээ өндрийг хэлнэ. Асуулт: 谁比他高？他比谁高？"},
   {"paragraph":2,"mn":"Яриа 2 — Төрсөн өдрийн найр дээр охин Су-шан, Ма-дин хоёрыг танилцуулна. Ма-дин 3, Су-шан 2 насаар том. Асуулт: 马丁比苏珊大几岁？ (一岁)"},
   {"paragraph":3,"mn":"Үлгэр «比高矮» — тэмээ «Би чамаас өндөр» гэж сайрхана. Ямаа «Би намхан, гэвч олон юм хийж чадна» гэж хариулна. Аудио: 08-03."}],
  "reflection":{"questions_mn":["Чи гэр бүлдээ хэнээс өндөр бэ? Хятадаар хэлж үз.","Чамаас хэн хэдэн насаар том бэ? «比我大…岁» гэж хэл.","Намхан хүн ч гэсэн олон юм хийж чадна гэж ямаа хэлсэн. Чи юу хийж чадах вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Өөрийгөө найзтайгаа жиш","zh":"马丁比我大三岁。","pinyin":"Mǎdīng bǐ wǒ dà sān suì.","mn":"Ма-дин надаас гурван насаар том."},
  "writingPrompt_mn":"Найзтайгаа зэрэгцэж зогсоод «我比你高» эсвэл «你比我高» гэж хэл. Дараа нь «我比你大……岁» гэж насаа жиш."},
 "properNouns":[{"zh":"苏珊","pinyin":"Sūshān","mn":"Су-шан (охины нэр)"},{"zh":"马丁","pinyin":"Mǎdīng","mn":"Ма-дин (Мартин, хүүгийн нэр)"},{"zh":"大黄","pinyin":"Dàhuáng","mn":"Да-хуан (нохойн нэр)"}],
 "wordExplanation":[
  {"word":"比","gloss":"bǐ — -ээс (хоёр юмыг жиших)","explanation":"Хоёр хүн, хоёр юмыг жишихдээ «A 比 B» гэнэ. Дараа нь өндөр, том гэх мэт үгээ хэлнэ. Тиймээс «哥哥比我高» гэвэл «Ах надаас өндөр». Хэн нь өндөр байна, түүнийгээ түрүүлж хэлнэ.",
   "structure":"A 比 B 高。 → Хэн нь өндөр байна тэр түрүүлж.","teacher_notes":"Хоёр хүүхдийг зэрэгцүүлж зогсоод тоглуул. Өндөр нь «我比你高» гэж хэлнэ. Дүрмийн нэр томьёо хэрэглэхгүй.",
   "examples":[{"chinese":"哥哥比姐姐高。","pinyin":"Gēge bǐ jiějie gāo.","mongolian":"Ах эгчээсээ өндөр."},{"chinese":"姐姐比我高。","pinyin":"Jiějie bǐ wǒ gāo.","mongolian":"Эгч надаас өндөр."},{"chinese":"我们比大黄高很多。","pinyin":"Wǒmen bǐ Dàhuáng gāo hěn duō.","mongolian":"Бид Да-хуанаас хавьгүй өндөр."}],
   "common_mistakes":[{"wrong":"哥哥比姐姐很高。","right":"哥哥比姐姐高。","why":"比-тэй өгүүлбэрт 很 тавихгүй. Их өндөр бол «高很多» гэж ард нь нэмнэ."}],
   "check":{"question":"«Ах надаас өндөр» хятадаар:","options":["哥哥比我高","我比哥哥高","哥哥和我高"],"answer":"0"},
   "practice":[{"n":1,"question":"姐姐 ________ 我高。(-ээс)","answer":"比","explanation_mn":"«-ээс» гэж жишихдээ 比."}]},
  {"word":"也","gloss":"yě — бас, ч","explanation":"Нэг юм нөгөөтэй адилхан бол «也» нэмнэ. «我是学生，弟弟也是学生» гэвэл «Би сурагч, дүү ч бас сурагч». 也 нь хүнийхээ дараа, үйл үгийн өмнө орно.",
   "structure":"…是…，…也是…。","teacher_notes":"Хүүхдүүд тойрог болж «我是学生，你也是学生» гэж ээлжлэн хэл.",
   "examples":[{"chinese":"他们也是小学生。","pinyin":"Tāmen yě shì xiǎoxuéshēng.","mongolian":"Тэд ч бас бага ангийн сурагчид."},{"chinese":"我是学生，弟弟也是学生。","pinyin":"Wǒ shì xuésheng, dìdi yě shì xuésheng.","mongolian":"Би сурагч, дүү ч бас сурагч."},{"chinese":"苏珊和马丁是同学，也是小学生。","pinyin":"Sūshān hé Mǎdīng shì tóngxué, yě shì xiǎoxuéshēng.","mongolian":"Су-шан, Ма-дин ангийн хүүхдүүд, бас бага ангийн сурагчид."}],
   "common_mistakes":[{"wrong":"弟弟是也学生。","right":"弟弟也是学生。","why":"也 нь 是-ийн өмнө орно."}],
   "check":{"question":"«Дүү ч бас сурагч» хятадаар:","options":["弟弟也是学生","弟弟是也学生","也弟弟是学生"],"answer":"0"},
   "practice":[{"n":1,"question":"我是学生，妹妹 ________ 是学生。(бас)","answer":"也","explanation_mn":"«Бас» — 也."}]},
 ],
 "collocations":[{"type":"比 + хэн + өндөр/том","rows":[
   {"head":"比","with":"我高","mn":"надаас өндөр","usage_mn":"Өндрөө жиших","example":{"zh":"姐姐比我高。","pinyin":"Jiějie bǐ wǒ gāo.","mn":"Эгч надаас өндөр."}},
   {"head":"大","with":"三岁","mn":"гурван насаар том","usage_mn":"Насны зөрүү хэлэх","example":{"zh":"马丁比我大三岁。","pinyin":"Mǎdīng bǐ wǒ dà sān suì.","mn":"Ма-дин надаас гурван насаар том."}},
   {"head":"好","with":"朋友","mn":"сайн найз","usage_mn":"Дотно найз","example":{"zh":"他们是我的好朋友。","pinyin":"Tāmen shì wǒ de hǎo péngyou.","mn":"Тэд миний сайн найзууд."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["比","也","朋友","同学"],"items":[
     {"n":1,"question":"哥哥 ________ 姐姐高。","answer":"比","explanation_mn":"«-ээс» гэж жишихдээ 比."},
     {"n":2,"question":"我是学生，弟弟 ________ 是学生。","answer":"也","explanation_mn":"«Бас» гэхдээ 也."},
     {"n":3,"question":"他们是我的好 ________。","answer":"朋友","explanation_mn":"好朋友 = сайн найз."},
     {"n":4,"question":"苏珊和马丁是 ________，也是小学生。","answer":"同学","explanation_mn":"同学 = ангийн хүүхэд."}]}],
   "answer_source":"agent-authored (YCT 2 · 8-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"谁比他高？他比谁高？","answer":"姐姐比他高。他比弟弟、妹妹高。","explanation_mn":"Яриа 1 — эгч нь надаас өндөр, би дүү нараасаа өндөр."},
     {"n":2,"question_zh":"马丁比苏珊大几岁？","answer":"一岁。","explanation_mn":"Ма-дин 3 насаар, Су-шан 2 насаар том тул 3 - 2 = 1."}],
   "answer_source":"textbook_verified (Let's read, х.39: Questions)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Хэн өндөр вэ?","start_zh":"我比你高。","instruction_mn":"Найзтайгаа нуруугаараа зэрэгцэж зогс. Өндөр нь «我比你高» гэж, намхан нь «我比你矮» гэж хэл. Дараа нь ээлжээ солиорой!"},
     {"label":"Миний дүрслэл","start_zh":"A比B高。","instruction_mn":"Номын 40-р хуудасны зургийг хар. Өвөө, эмээ, хоёр хүү, хоёр цүнхийг «A 比 B + том / өндөр» гэж тайлбарла. Жишээ нь: «红书包比蓝书包大»."},
     {"label":"Хүснэгт бөглө","start_zh":"我比你大……岁。","instruction_mn":"Найзтайгаа нас, өндөр, жин, гутлын хэмжээгээ харьцуул. Нас нь өөр бол «我比你大一岁» гэж хэл."},
     {"label":"Үлгэр жүжигчилье","start_zh":"我比你高，哈哈。","instruction_mn":"Нэг нь тэмээ, нөгөө нь ямаа болно. Тэмээ «我比你高» гэж сайрхана. Ямаа «我比你矮，可是我也能做很多事» гэж хариулна. Ямаа юу хийж чадахаа тоолоорой!"}]}},
 "grammarNotes":[],
 "culture":{"title":"Хятад хүүхдийн нас, ах дүү","title_mn":"Хятад хүүхдүүд хэн нь том бэ гэдгийг чухалчилдаг","text_mn":"Хятад хүүхдүүд найзтайгаа танилцахдаа «Чи хэдэн настай вэ?» гэж асуудаг. Үүнээс болж хэн нь ах, хэн нь дүү гэдгээ мэддэг. Бага ангийн хүүхдүүд ангийнхаа найзыг «同学» гэж дууддаг. Монголд ч бас ах, дүү гэж ялгадаг шүү дээ.","note_mn":"Чи найзаасаа хэн нь том бэ гэж асууж үзсэн үү? Хятадаар «你比我大吗？» гэж асууж болно."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — хоёр хүнийг өндөр, насаар жиших.","topic":"Найзтайгаа өөрийгөө жиш","discussion":["Хосоороо: «我比你高» эсвэл «你比我高» гэж хэл.","Бүгдээрээ эгнэж зогсоод хэн нь хамгийн өндөр вэ гэж «谁比谁高» тоглоорой."],
   "writing":{"promptChinese":"我比你大……岁。","promptMongolian":"Гэрийн даалгавар: ээж аав, ах эгч, дүүтэйгээ өндрөө, насаа жиш. «……比我高», «我比……大……岁» гэж хэл.","minChars":"0","requiredWords":["比","也"],"sampleChinese":"马丁比我大三岁。我也是学生。","sampleMongolian":"Ма-дин надаас гурван насаар том. Би ч бас сурагч.","gradingRubric":"比-г зөв хэрэглэсэн, насны зөрүүг хэлсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test (х.42) L8: 1.A 2.D 3.C 4.B 5.D 6.A 7.B 8.C","parts":[]},
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
 {"point":"他们也是小学生。 — бас, ч","gloss_mn":"«Тэд ч бас бага ангийн сурагчид» — адилхан зүйлийг «бас» гэж хэлнэ",
  "structure":"A 是 …，B 也是 …。",
  "teacher_mn":"Хоёр хүн адилхан бол «也» гэж хэлнэ. «我是学生» — би сурагч. «弟弟也是学生» — дүү ч бас сурагч. 也 нь хүнийхээ дараа, 是-ийн өмнө ордог. Найзтайгаа ээлжлэн хэлж үз!",
  "teacher_notes":"Номын Key sentence: 他们也是小学生。 Ярианд: 苏珊和马丁是同学，也是小学生。",
  "examples":[ex("他们也是小学生。","Tāmen yě shì xiǎoxuéshēng.","Тэд ч бас бага ангийн сурагчид."),ex("我是学生，弟弟也是学生。","Wǒ shì xuésheng, dìdi yě shì xuésheng.","Би сурагч, дүү ч бас сурагч."),ex("苏珊和马丁是同学，也是小学生。","Sūshān hé Mǎdīng shì tóngxué, yě shì xiǎoxuéshēng.","Су-шан, Ма-дин ангийн хүүхдүүд, бас бага ангийн сурагчид.")],
  "common_mistakes":[{"wrong":"我也是学生，弟弟是也学生。","right":"我是学生，弟弟也是学生。","why":"也 нь 是-ийн өмнө орно."}],
  "check":chk("«Дүү ч бас сурагч» гэж хэл:",["弟弟也是学生。","弟弟是也学生。","也弟弟是学生。"],"弟弟也是学生。","g1c"),
  "exercises":[
   choice("我是学生，妹妹 ________ 是学生。",["也","比","几"],"也","Зөв! 也 = бас.","也 = бас, 比 = -ээс, 几 = хэдэн.","g1e1"),
   choice("他们 ________ 是小学生。",["也","大","高"],"也","Зөв! 他们也是小学生。","«Тэд ч бас» — 也.","g1e2"),
   judge("«我也是学生» гэдэг нь «Би ч бас сурагч» гэсэн үг.",True,"Зөв! 也 = бас.","也 = бас, 学生 = сурагч.")]},
 {"point":"哥哥比姐姐高。 — хэн хэнээсээ өндөр","gloss_mn":"«Ах эгчээсээ өндөр» — хоёр хүнийг 比-ээр жиших",
  "structure":"A 比 B 高 / 大 / 矮。",
  "teacher_mn":"Хоёр хүнийг жишихдээ «A 比 B 高» гэнэ. 比 = «-ээс». «哥哥比姐姐高» — ах эгчээсээ өндөр. Өндөр нь түрүүлж. Дараа нь найзтайгаа зэрэгцэж зогсоод хэлээд үз!",
  "teacher_notes":"Ярианд: 哥哥比姐姐高，姐姐比我高，我比弟弟、妹妹高。 矮 = намхан (үлгэрт). 比-тэй өгүүлбэрт 很 тавихгүй.",
  "examples":[ex("哥哥比姐姐高。","Gēge bǐ jiějie gāo.","Ах эгчээсээ өндөр."),ex("姐姐比我高。","Jiějie bǐ wǒ gāo.","Эгч надаас өндөр."),ex("我比弟弟、妹妹高。","Wǒ bǐ dìdi, mèimei gāo.","Би дүү нараасаа өндөр."),ex("我比你矮。","Wǒ bǐ nǐ ǎi.","Би чамаас намхан.")],
  "common_mistakes":[{"wrong":"哥哥比姐姐很高。","right":"哥哥比姐姐高。","why":"比-тэй өгүүлбэрт 很 тавихгүй."},{"wrong":"姐姐高比我。","right":"姐姐比我高。","why":"Дараалал: хэн + 比 + хэнээс + өндөр."}],
  "check":chk("«Эгч надаас өндөр» гэж хэл:",["姐姐比我高。","我比姐姐高。","姐姐和我高。"],"姐姐比我高。","g2c"),
  "exercises":[
   choice("哥哥 ________ 姐姐高。",["比","也","和"],"比","Зөв! 比 = -ээс.","比 = -ээс, 也 = бас, 和 = ба.","g2e1"),
   choice("«Би чамаас намхан» хятадаар:",["我比你矮","我比你高","你比我矮"],"我比你矮","Зөв! 矮 = намхан.","矮 = намхан. Би намхан бол «我比你矮».","g2e2"),
   judge("«我们比大黄高很多» гэдэг нь «Бид Да-хуанаас хавьгүй өндөр» гэсэн үг.",True,"Зөв! 高很多 = хавьгүй өндөр.","很多 = хавьгүй, маш олон.")]},
 {"point":"马丁比我大三岁。 — хэдэн насаар том","gloss_mn":"«Ма-дин надаас гурван насаар том» — зөрүүг тоогоор хэлэх",
  "structure":"A 比 B 大 + тоо + 岁。",
  "teacher_mn":"Хэн нь хэдэн насаар том гэдгийг хэлэхдээ «A 比 B 大 + тоо + 岁» гэнэ. «马丁比我大三岁» — Ма-дин надаас гурван насаар том. Тоог 大-ийн ард тавина. Жижиг бол 小 гэж хэлнэ. Ахдаа «你比我大几岁？» гэж асууж үз!",
  "teacher_notes":"两 = хоёр (тоолохдоо): 大两岁. Асуулт: 马丁比苏珊大几岁？ → 一岁.",
  "examples":[ex("马丁比我大三岁。","Mǎdīng bǐ wǒ dà sān suì.","Ма-дин надаас гурван насаар том."),ex("苏珊比我大两岁。","Sūshān bǐ wǒ dà liǎng suì.","Су-шан надаас хоёр насаар том."),ex("他比我小两岁。","Tā bǐ wǒ xiǎo liǎng suì.","Тэр надаас хоёр насаар бага.")],
  "common_mistakes":[{"wrong":"马丁比我三岁大。","right":"马丁比我大三岁。","why":"Эхлээд 大, дараа нь тоо ба 岁."},{"wrong":"苏珊比我大二岁。","right":"苏珊比我大两岁。","why":"Хоёрыг тоолохдоо 两 гэнэ."}],
  "check":chk("«Ма-дин надаас гурван насаар том» хятадаар:",["马丁比我大三岁。","马丁比我三岁大。","我比马丁大三岁。"],"马丁比我大三岁。","g3c"),
  "exercises":[
   choice("苏珊比我大 ________ 岁。(хоёр)",["两","二","比"],"两","Зөв! 大两岁.","Тоолохдоо хоёрыг 两 гэнэ.","g3e1"),
   choice("马丁比我 ________ 三岁。",["大","也","很"],"大","Зөв! 比我大三岁。","大 нь «том» гэсэн утгатай.","g3e2"),
   judge("«他比我小两岁» гэдэг нь «Тэр надаас хоёр насаар бага» гэсэн үг.",True,"Зөв! 小 = бага.","小 = бага, 两岁 = хоёр нас.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Дүү хүү» хятадаар аль нь вэ?",["弟弟","哥哥","妹妹","朋友"],"弟弟","弟弟 (dìdi) = дүү хүү.","easy",["vocabulary"],"a1")
q("choice","«Дүү охин» хятадаар аль нь вэ?",["妹妹","姐姐","弟弟","同学"],"妹妹","妹妹 (mèimei) = дүү охин.","easy",["vocabulary"],"a2")
q("choice","«Найз» хятадаар аль нь вэ?",["朋友","同学","老师","学生"],"朋友","朋友 (péngyou) = найз.","easy",["vocabulary"],"a3")
q("choice","«Ангийн хүүхэд» хятадаар аль нь вэ?",["同学","朋友","哥哥","妈妈"],"同学","同学 (tóngxué) = ангийн хүүхэд.","easy",["vocabulary"],"a4")
q("choice","«Бас, ч» хятадаар аль нь вэ?",["也","比","和","几"],"也","也 (yě) = бас.","easy",["vocabulary"],"a5")
q("choice","«Сурагч» хятадаар аль нь вэ?",["学生","老师","朋友","弟弟"],"学生","学生 (xuésheng) = сурагч.","easy",["vocabulary"],"a6")
q("choice","«弟弟» гэдэг үг ямар утгатай вэ?",["дүү хүү","ах","эгч","найз"],"дүү хүү","弟弟 = дүү хүү.","easy",["vocabulary"],"a7")
q("choice","«同学» гэдэг үг ямар утгатай вэ?",["ангийн хүүхэд","багш","ээж","дүү охин"],"ангийн хүүхэд","同学 = ангийн хүүхэд.","easy",["vocabulary"],"a8")
q("choice","«比» гэдэг үг юуг хэлэх вэ?",["-ээс (жиших)","бас","ба","хэдэн"],"-ээс (жиших)","哥哥比姐姐高 — ах эгчээсээ өндөр.","medium",["grammar"],"a9")
q("choice","«Ах эгчээсээ өндөр» хятадаар:",["哥哥比姐姐高","姐姐比哥哥高","哥哥和姐姐高","哥哥也姐姐高"],"哥哥比姐姐高","哥哥比姐姐高 — ах нь өндөр.","medium",["dialogue"],"a10")
q("choice","«Эгч надаас өндөр» хятадаар:",["姐姐比我高","我比姐姐高","姐姐也我高","我和姐姐高"],"姐姐比我高","姐姐比我高 — эгч нь өндөр.","medium",["dialogue"],"a11")
q("cloze","哥哥（ ）姐姐高。",["比","也","和","几"],"比","«-ээс» гэж жишихдээ 比.","easy",["grammar"],"a12")
q("cloze","我是学生，弟弟（ ）是学生。",["也","比","几","有"],"也","«Бас» — 也.","easy",["grammar"],"a13")
q("cloze","他们是我的好（ ）。",["朋友","同学","学生","哥哥"],"朋友","好朋友 = сайн найз.","medium",["dialogue"],"a14")
q("cloze","马丁比我（ ）三岁。",["大","高","也","比"],"大","大 + тоо + 岁 = хэдэн насаар том.","medium",["grammar"],"a15")
q("cloze","苏珊比我大（ ）岁。(хоёр)",["两","二","四","比"],"两","Тоолохдоо хоёрыг 两 гэнэ.","medium",["number"],"a16")
q("choice","«Ма-дин надаас гурван насаар том» хятадаар:",["马丁比我大三岁","马丁比我小三岁","我比马丁大三岁","马丁比我高三岁"],"马丁比我大三岁","大 = том, 三岁 = гурван нас.","medium",["dialogue"],"a17")
q("choice","«他比我小两岁» — тэр хэн бэ?",["Надаас 2 насаар бага","Надаас 2 насаар том","Надтай адил настай","Надаас 3 насаар том"],"Надаас 2 насаар бага","小 = бага, 两岁 = 2 нас.","hard",["grammar"],"a18")
q("choice","Ма-дин 3 насаар, Су-шан 2 насаар том. Ма-дин Су-шанаас хэдэн насаар том бэ?",["1","2","3","5"],"1","3 - 2 = 1 нас.","hard",["number"],"a19")
q("choice","Тэмээ «我比你高» гэвэл ямаа юу гэж хэлэх вэ?",["我比你矮","我比你高","我也高","我是学生"],"我比你矮","矮 = намхан. Ямаа намхан.","medium",["story"],"a20")
q("choice","Пиньинь «péngyou» гэж уншдаг үг:",["朋友","同学","学生","弟弟"],"朋友","朋友 = péngyou = найз.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «tóngxué» гэж уншдаг үг:",["同学","学生","朋友","妹妹"],"同学","同学 = tóngxué = ангийн хүүхэд.","medium",["pronunciation"],"a22")
q("choice","Пиньинь «dìdi» гэж уншдаг үг:",["弟弟","哥哥","妹妹","姐姐"],"弟弟","弟弟 = dìdi = дүү хүү.","easy",["pronunciation"],"a23")
q("usage","Чи сурагч, дүү чинь ч бас сурагч. Юу гэж хэлэх вэ?",["我是学生，弟弟也是学生。","我是学生，弟弟比学生。","我也弟弟是学生。","弟弟是我学生。"],"我是学生，弟弟也是学生。","也 нь 是-ийн өмнө орно.","medium",["usage"],"a24")
q("usage","Найзаасаа «Чи надаас өндөр үү?» гэж хэлэх нь:",["你比我高吗？","你也我高吗？","你是我高吗？","你和我高？"],"你比我高吗？","比 + 吗 = «-ээс өндөр үү?»","hard",["usage"],"a25")
q("choice","«Бид Да-хуанаас хавьгүй өндөр» хятадаар:",["我们比大黄高很多","我们比大黄矮很多","我们也大黄高","大黄比我们高"],"我们比大黄高很多","高很多 = хавьгүй өндөр.","medium",["dialogue"],"a26")
q("choice","Дараах дундаас хүн биш нь:",["大黄","马丁","苏珊","同学"],"大黄","大黄 нь нохойн нэр. Бусад нь хүн.","hard",["dialogue"],"a27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
LBANK = ["A","B","C","D"]; LIMG=[img("t1a"),img("t1b"),img("t1c"),img("t1d")]
RIMG=[img("t5a"),img("t5b"),img("t5c"),img("t5d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (08-04) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）你弟弟几岁？","script_zh":"你弟弟几岁？","options":LBANK,"optionImages":LIMG,"answer":"A","explanation_mn":"«Чиний дүү хэдэн настай вэ?» — A зураг дээр жижиг хүү номон дээрээ унтаж байна, тэр бол дүү. B нохой, C хоёр охин, D дөрвөн хүүхэд."},
    {"n":2,"question_zh":"（听录音）这儿有四个学生。","script_zh":"这儿有四个学生。","options":LBANK,"optionImages":LIMG,"answer":"D","explanation_mn":"«Энд дөрвөн сурагч бий» — D зураг дээр дөрвөн хүүхэд байна. C дээр хоёр охин л бий."},
    {"n":3,"question_zh":"（听录音）我们两个人是好朋友。","script_zh":"我们两个人是好朋友。","options":LBANK,"optionImages":LIMG,"answer":"C","explanation_mn":"«Бид хоёр сайн найзууд» — C зураг дээр хоёр охин инээмсэглэн хамт байна. D дээр дөрвөн хүүхэд."},
    {"n":4,"question_zh":"（听录音）我的个子比你高。","script_zh":"我的个子比你高。","options":LBANK,"optionImages":LIMG,"answer":"B","explanation_mn":"«Миний биеийн өндөр чамаас өндөр» — B зураг дээр том нохой жижиг нохойг харж зогсож байна, том нь өндөр."}],
   "answer_source":"Test Answers: 1.A 2.D 3.C 4.B; Listening script х.42"},
  {"part":2,"type":"choice","instruction_mn":"Унших — ярианд тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"小明：这个人是谁？ 小红：她是妈妈的一个好朋友。","question_mn":"Энэ хүн хэн бэ? — Тэр ээжийн сайн найз.","options":LBANK,"optionImages":RIMG,"answer":"D","explanation_mn":"Ээжийн найз — D зураг дээр эмэгтэй жижиг хүүтэй ном үзэж байна. A хоёр охин, B хоёр хүү, C сагсан бөмбөгчид."},
    {"n":6,"question_zh":"小明：你认识她吗？ 小红：她是我同学。","question_mn":"Чи түүнийг мэдэх үү? — Тэр миний ангийн хүүхэд.","options":LBANK,"optionImages":RIMG,"answer":"A","explanation_mn":"Ангийн хүүхэд — A зураг дээр хоёр охин бие бие рүүгээ харж байна. Тэд ангийн найзууд."},
    {"n":7,"question_zh":"小明：你弟弟多大？ 小红：7岁，他比我小两岁。","question_mn":"Чиний дүү хэдэн настай вэ? — 7 настай, надаас хоёр насаар бага.","options":LBANK,"optionImages":RIMG,"answer":"B","explanation_mn":"Ах, дүү — B зураг дээр хоёр хүү, нэг нь нөгөөгөө тэвэрсэн. A охид, C өндөр эрчүүд, D эмэгтэй."},
    {"n":8,"question_zh":"小明：你们谁高？ 小红：他比我高很多。","question_mn":"Та хоёрын хэн нь өндөр вэ? — Тэр надаас хавьгүй өндөр.","options":LBANK,"optionImages":RIMG,"answer":"C","explanation_mn":"Хавьгүй өндөр — C зураг дээр нэг нь нөгөөгөөсөө хавьгүй өндөр хоёр хүн зогсож байна."}],
   "answer_source":"Test Answers: 5.D 6.A 7.B 8.C"},
  {"part":3,"type":"match","instruction_mn":"Үлгэр «比高矮» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("tstory"),"items":[
    {"n":1,"question_zh":"我比你高，哈哈。","answer":"1","explanation_mn":"1-р зураг дээр тэмээ мод руу сунаж, доор нь ямаа зогсож байна."},
    {"n":2,"question_zh":"我比你高得多，哈哈。","answer":"2","explanation_mn":"2-р зураг дээр тэмээ усанд, ямаа хажууд нь байна."},
    {"n":3,"question_zh":"我比你矮。","answer":"3","explanation_mn":"3-р зураг дээр ямаа ханын дэргэд, тэмээ толгойгоо сунгана."},
    {"n":4,"question_zh":"我比你矮，可是我也能做很多事。","answer":"4","explanation_mn":"4-р зураг дээр ямаа өндөр газраас доор байгаа тэмээг харна."}],
   "answer_source":"textbook х.41 (Mini story)"},
  {"part":4,"type":"match","instruction_mn":"Асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"马丁比苏珊大几岁？","answer":"一岁。","explanation_mn":"Ма-дин 3, Су-шан 2 насаар том: 3 - 2 = 1."},
    {"n":2,"question_zh":"谁比他高？","answer":"姐姐比他高。","explanation_mn":"Яриа 1 — эгч нь надаас өндөр."},
    {"n":3,"question_zh":"他们是谁？","answer":"他们是我的好朋友。","explanation_mn":"Яриа 2 — Су-шан, Ма-дин нь миний сайн найзууд."}],
   "answer_source":"textbook х.39 (Let's read)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Let's write — найзтайгаа нас, өндөр, жин, гутлын хэмжээгээ хүснэгтэнд бич.","question_zh":"年龄 身高 体重 鞋的大小","answer":"(нээлттэй)","explanation_mn":"Хоёулаа бичсэний дараа «我比你大…岁» гэж харьцуул."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Let's say — х.40-ийн зургийг «A 比 B + том / өндөр» гэж тайлбарла.","question_zh":"A比B大/高……","answer":"(нээлттэй)","explanation_mn":"Өвөө эмээ, хоёр хүү, хоёр цүнхийг жиш."},
   {"n":2,"prompt_mn":"Найзтайгаа зэрэгцэж зогсоод хэн өндрийг хэл.","question_zh":"我比你高。","answer":"我比你高。","explanation_mn":"Өндөр нь «高», намхан нь «矮» гэж хэлнэ."},
   {"n":3,"prompt_mn":"Тэмээ ямаа хоёрын үлгэрийг жүжигчил.","question_zh":"我比你矮，可是我也能做很多事。","answer":"(нээлттэй)","explanation_mn":"Аудио 08-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 2 · х.42 Test, Test Answers (Lesson 8)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("didi","弟弟"),("meimei","妹妹"),("pengyou","朋友"),("tongxue","同学"),("ye","也"),("xuesheng","学生")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"马丁比我大三岁。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"哥哥比姐姐高","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"这是苏珊","role":"illustration","section":"dialogue"},
 {"id":"story","file":"images/story.jpg","title":"比高矮","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d","5a","5b","5c","5d","story"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 8-р хичээл — Хэн хэнээсээ өндөр, том вэ","chineseTitle":"马丁比我大三岁。","targetTitle":"马丁比我大三岁。","mongolianTitle":"Хэн хэнээсээ өндөр, том вэ",
 "subtitle":"比 · 大三岁 · 也 · 朋友 · 同学 · «比高矮» үлгэр",
 "description":f"Хоёр хүнийг 比-ээр жиших (өндөр, нас), 也 (бас), 弟弟 妹妹 朋友 同学 学生. {len(vocab)} үг, 2 зурагт яриа, Mini story, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"📏","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第8课《马丁比我大三岁。》 [hskLevel=1] [lessonNumber=8]; эх: сурах бичиг х.38–42; аудио CD 08-01…08-04"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"马丁比我大三岁。","mongolianTitle":"Хэн хэнээсээ өндөр, том вэ",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第8课 (сурах бичиг + CD аудио 08-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
