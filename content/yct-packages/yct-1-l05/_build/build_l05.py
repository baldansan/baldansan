#!/usr/bin/env python3
"""YCT 标准教程 1 · 第5课 我6岁。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, shutil, subprocess
from PIL import Image
BASE = "/home/claude/work/yct1/l05"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-1", "yct-1-l05", 5
os.makedirs(OUT + "/audio", exist_ok=True); os.makedirs(OUT + "/images", exist_ok=True)

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

# ---------------- AUDIO ----------------
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-1-05-{k}.mp3" for k in ["words","text","song","story","test"]]
AUD_MAIN = "audio/yct-1-05-text-song.mp3"
for k, n in [("words","01"),("text","02"),("song","03"),("story","04"),("test","05")]:
    src = f"{A}/yct-1-05-{n}.mp3"; dst = f"{A}/yct-1-05-{k}.mp3"
    if os.path.exists(src) and not os.path.exists(dst): shutil.copy(src, dst)
if not os.path.exists(f"{A}/yct-1-05-text-song.mp3"):
    lst = f"{BASE}/concat.txt"
    open(lst, "w").write(f"file '{A}/yct-1-05-text.mp3'\nfile '{A}/yct-1-05-song.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c","copy",f"{A}/yct-1-05-text-song.mp3"],check=True)

# ---------------- IMAGE CROPS (Test, story, grid) ----------------
def crop(page, out, x0, y0, x1, y1):
    p = Image.open(f"{BASE}/pages/{page}"); W, H = p.size
    p.crop((int(x0*W), int(y0*H), int(x1*W), int(y1*H))).save(f"{OUT}/images/{out}")
crop("hi-25.png","t1.png",0.26,0.205,0.43,0.275)
crop("hi-25.png","t2.png",0.25,0.295,0.435,0.38)
crop("hi-25.png","t3.png",0.25,0.395,0.435,0.48)
crop("hi-25.png","t4.png",0.18,0.587,0.335,0.662)
crop("hi-25.png","t5.png",0.55,0.585,0.707,0.654)
crop("hi-25.png","t6.png",0.175,0.742,0.34,0.82)
crop("hi-25.png","t7.png",0.546,0.745,0.71,0.82)
crop("hi-24.png","story1.png",0.30,0.248,0.53,0.44)
crop("hi-24.png","story2.png",0.62,0.248,0.865,0.44)
crop("hi-24.png","story3.png",0.30,0.58,0.55,0.775)
crop("hi-24.png","story4.png",0.62,0.58,0.865,0.775)
crop("hi-21.png","numgrid.png",0.15,0.44,0.88,0.70)

# ---------------- VOCAB ----------------
VOCAB = [
 ("岁","suì","нас (хэдэн нас)","тоологч · гол үг","你几岁？","Nǐ jǐ suì?","Чи хэдтэй вэ?",True),
 ("几","jǐ","хэд (хэдэн)","асуух үг · гол үг","你几岁？","Nǐ jǐ suì?","Чи хэдтэй вэ?",True),
 ("多大","duōdà","хэдтэй (хэр том)","асуух үг · гол үг","你哥哥多大？","Nǐ gēge duōdà?","Чиний ах хэдтэй вэ?",True),
 ("也","yě","бас, мөн","нэмэлт үг · гол үг","他也6岁。","Tā yě liù suì.","Тэр бас 6 настай.",True),
 ("您","nín","та (хүндэтгэсэн)","дуунаас","老师，老师，您多大？","Lǎoshī, lǎoshī, nín duōdà?","Багш аа, багш аа, та хэдтэй вэ?",False),
 ("秘密","mìmì","нууц","дуунаас","是秘密。","Shì mìmì.","Нууц шүү!",False),
 ("十一","shíyī","арван нэг","тоо","我十一岁。","Wǒ shíyī suì.","Би арван нэгэн настай.",False),
 ("二十","èrshí","хорь","тоо","二十、三十、四十。","Èrshí, sānshí, sìshí.","Хорь, гуч, дөч.",False),
 ("一百","yìbǎi","нэг зуу","тоо","一百岁！","Yìbǎi suì!","Зуун настай!",False),
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
 {"id":1,"title_mn":"Яриа 1 · Чи хэдтэй вэ?","scene_mn":"Багш Юэ-юэгээс нас нь хэд вэ гэж асууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"老师","zh":"月月，你几岁？","pinyin":"Yuèyuè, nǐ jǐ suì?","mn":"Юэ-юэ, чи хэдтэй вэ?"},
           {"speaker":"月月","zh":"我6岁。","pinyin":"Wǒ liù suì.","mn":"Би 6 настай."}]},
 {"id":2,"title_mn":"Яриа 2 · Чиний ах хэдтэй вэ?","scene_mn":"Юэ-юэ ахынхаа зургийг үзүүлж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"老师","zh":"你哥哥多大？","pinyin":"Nǐ gēge duōdà?","mn":"Чиний ах хэдтэй вэ?"},
           {"speaker":"月月","zh":"他也6岁。","pinyin":"Tā yě liù suì.","mn":"Тэр бас 6 настай."}]},
]
song_lines = [
 ("老师：玛丽，玛丽，你几岁？","Lǎoshī: Mǎlì, Mǎlì, nǐ jǐ suì?","Багш: Мари, Мари, чи хэдтэй вэ?","老师：| 玛丽|mǎlì ，| 玛丽|mǎlì ，| 你|nǐ 几|jǐ 岁|suì ？|"),
 ("玛丽：8岁，8岁，我8岁。","Mǎlì: Bā suì, bā suì, wǒ bā suì.","Мари: 8 настай, 8 настай, би 8 настай.","玛丽：| 8| 岁|suì ，| 8| 岁|suì ，| 我|wǒ 8| 岁|suì 。|"),
 ("老师：大卫，大卫，你几岁？","Lǎoshī: Dàwèi, Dàwèi, nǐ jǐ suì?","Багш: Дэвид, Дэвид, чи хэдтэй вэ?","老师：| 大卫|dàwèi ，| 大卫|dàwèi ，| 你|nǐ 几|jǐ 岁|suì ？|"),
 ("大卫：9岁，9岁，我9岁。","Dàwèi: Jiǔ suì, jiǔ suì, wǒ jiǔ suì.","Дэвид: 9 настай, 9 настай, би 9 настай.","大卫：| 9| 岁|suì ，| 9| 岁|suì ，| 我|wǒ 9| 岁|suì 。|"),
 ("玛丽/大卫：老师，老师，您多大？","Mǎlì / Dàwèi: Lǎoshī, lǎoshī, nín duōdà?","Мари, Дэвид: Багш аа, багш аа, та хэдтэй вэ?","玛丽/大卫：| 老师|lǎoshī ，| 老师|lǎoshī ，| 您|nín 多大|duōdà ？|"),
 ("老师：秘密，秘密，是秘密，是～秘～密～。","Lǎoshī: Mìmì, mìmì, shì mìmì, shì — mì — mì —.","Багш: Нууц, нууц, нууц шүү, нуу-у-ууц!","老师：| 秘密|mìmì ，| 秘密|mìmì ，| 是|shì 秘密|mìmì ，| 是|shì ～| 秘|mì ～| 密|mì ～| 。|"),
]
sentences=[]
dlg_lines=[
 (1,"老师：月月，你几岁？","Lǎoshī: Yuèyuè, nǐ jǐ suì?","Багш: Юэ-юэ, чи хэдтэй вэ?","老师：| 月月|yuèyuè ，| 你|nǐ 几|jǐ 岁|suì ？|","你几岁？ — «Чи хэдтэй вэ?» гэж асууж байна. Хариуд нь тоогоо хэлээд 岁 гэнэ.",["你几岁"]),
 (1,"月月：我6岁。","Yuèyuè: Wǒ liù suì.","Юэ-юэ: Би 6 настай.","月月：| 我|wǒ 6| 岁|suì 。|",None,[]),
 (2,"老师：你哥哥多大？","Lǎoshī: Nǐ gēge duōdà?","Багш: Чиний ах хэдтэй вэ?","老师：| 你|nǐ 哥哥|gēge 多大|duōdà ？|","你哥哥多大？ — ахынхаа насыг асууж байна. 多大 нь «хэдтэй вэ» гэсэн утгатай.",["你哥哥多大"]),
 (2,"月月：他也6岁。","Yuèyuè: Tā yě liù suì.","Юэ-юэ: Тэр бас 6 настай.","月月：| 他|tā 也|yě 6| 岁|suì 。|","也 = «бас». Ах нь бас 6 настай байна.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg_lines:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note; s["key_structures"]=ks
    sentences.append(s)
for i,(zh,py,mn,tk) in enumerate(song_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Дуунд «玛丽» гэдэг нэрийн оронд өөрийнхөө нэрийг хэлээд дуулж болно."; s["key_structures"]=["你几岁"]
    if i==4: s["note"]="您 — «та», том хүнд хүндэтгэж хэлэх үг. Багшаас нас асуухад 您多大 гэнэ."; s["key_structures"]=["你哥哥多大"]
    if i==5: s["note"]="Багш нас хэлэхгүй, «нууц!» гэж хариулна."
    sentences.append(s)

story = [
 ("弟弟1岁，妹妹也1岁。","Dìdi yí suì, mèimei yě yí suì.","Дүү хүү 1 настай, дүү охин бас 1 настай.","story1.png"),
 ("我7岁。","Wǒ qī suì.","Би 7 настай.","story2.png"),
 ("爸爸35岁，妈妈也35岁。","Bàba sānshíwǔ suì, māma yě sānshíwǔ suì.","Аав 35 настай, ээж бас 35 настай.","story3.png"),
 ("爷爷60岁，奶奶也60岁。","Yéye liùshí suì, nǎinai yě liùshí suì.","Өвөө 60 настай, эмээ бас 60 настай.","story4.png"),
]

texts = {
 "unit":{"number":"5","title":"我6岁。","mongolianTitle":"Би 6 настай — нас асуух, хэлэх, 1–100 тоолох"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи хэдтэй вэ? Өнөөдөр бид хятадаар нас асууж, нас хэлж сурна. «你几岁?» гэвэл «Чи хэдтэй вэ?» гэсэн үг. Хариулахдаа «我6岁» гэнэ. Ахынхаа насыг асуухдаа «你哥哥多大?» гэнэ. Бас нэгээс зуу хүртэл хятадаар тоолно! Тоолох нь амархан, чи удахгүй мэдэх болно. Бөмбөг шидэлцэж тоглоно, дуу дуулна. Эхэлцгээе!",
  "warmup_mn":"Чи хэдтэй вэ? Хуруугаараа үзүүлээрэй. Чиний ах, эгч, дүү хэдтэй вэ? Аав, ээж хэдтэй вэ?",
  "theme_zh":"年龄 · 几岁 · 多大 · 数字 1–100","theme_mn":"Нас асуух · Нас хэлэх · Тоо 1–100"},
 "warmup":{"mongolian":"Чи хэдтэй вэ? Гэр бүлийн хүмүүс чинь хэдтэй вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"5","title":"我6岁。","mongolianTitle":"Би 6 настай — яриа ба дуу","title_mn":"Let's read · 2 яриа + Let's sing · 你几岁？ (дуу)","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第5课 Let's read / Let's sing（CD 05-02, 05-03）","author_zh":"",
  "intro_zh":"两段对话：月月，你几岁？你哥哥多大？然后唱歌“你几岁？”。",
  "intro_mn":"Эхлээд хоёр яриа: багш Юэ-юэгээс нас асууна, дараа нь Юэ-юэгийн ахын нас. Дараа нь 5-р хичээлийн дуу. Хамт дуулж, «Мари»-гийн оронд өөрийнхөө нэрийг хэлээд бүр хөгжилтэй болго! Аудиог сонсоод хамт давтаарай.",
  "sentences":sentences,
  "paragraph_summaries":[{"paragraph":1,"mn":"Яриа 1 — Багш «月月，你几岁？» гэж асууна. Юэ-юэ «我6岁» гэж хариулна."},
    {"paragraph":2,"mn":"Яриа 2 — Багш «你哥哥多大？» гэж асууна. Юэ-юэ «他也6岁» гэнэ — ах нь бас 6 настай."},
    {"paragraph":3,"mn":"Дуу «你几岁？» — Багш Мари, Дэвид хоёроос нас асууна. Мари 8, Дэвид 9 настай. Хоёулаа багшаас нас нь хэд вэ гэж асуухад багш «нууц!» гэж хариулна."}],
  "reflection":{"questions_mn":["Хятадаар чи хэдтэй вэ гэж яаж асуух вэ?","Өөрийнхөө насыг хятадаар хэлээрэй.","Багшаас нас нь хэд вэ гэж асуухад ямар үг хэлэх вэ? (您多大)"]},
  "writingSample":{"title_mn":"Ярих дасгал · Нас хэлцгээе","zh":"你几岁？我6岁。你哥哥多大？他也6岁。","pinyin":"Nǐ jǐ suì? Wǒ liù suì. Nǐ gēge duōdà? Tā yě liù suì.","mn":"Чи хэдтэй вэ? Би 6 настай. Чиний ах хэдтэй вэ? Тэр бас 6 настай."},
  "writingPrompt_mn":"Найзаасаа «你几岁?» гэж асуугаад, өөрөө «我…岁» гэж хариул. Дараа нь ах, эгч, дүүгийнхээ насыг асуу."},
 "miniStory":{
  "title":"我家的相册","pinyin":"Wǒ jiā de xiàngcè","title_mn":"Манай гэрийн зургийн цомог","audio":AUD_STORY,
  "scene_mn":"Цомогт 4 зураг байна: дүү нар, би, аав ээж, өвөө эмээ. Зураг бүр дээр нас нь бичигдсэн.",
  "sentences":[{"zh":a,"pinyin":b,"mn":c,"image":"images/"+d} for a,b,c,d in story]},
 "properNouns":[{"zh":"月月","pinyin":"Yuèyuè","mn":"Юэ-юэ"},{"zh":"玛丽","pinyin":"Mǎlì","mn":"Мари"},{"zh":"大卫","pinyin":"Dàwèi","mn":"Дэвид"}],
 "wordExplanation":[
  {"word":"几岁","gloss":"jǐ suì — хэдэн нас","explanation":"几 = «хэд», 岁 = «нас». Хоёрыг нийлүүлбэл «хэдтэй вэ?» болно. Жижиг хүүхдээс нас асуухдаа «你几岁?» гэнэ. Хариулахдаа тоогоо хэлээд 岁 гэж хэлнэ: 我6岁.",
   "structure":"你几岁？ → 我 + тоо + 岁。","teacher_notes":"几 нь 10 хүртэлх жижиг тоог асуухад ашиглагддаг. Хүүхдүүдэд «ойролцоогоор 10 хүртэлх нас» гэж хэлж болно. Хариултад 我 + тоо + 岁 бүтнээр нь хэлүүл.",
   "examples":[{"chinese":"你几岁？","pinyin":"Nǐ jǐ suì?","mongolian":"Чи хэдтэй вэ?"},{"chinese":"我6岁。","pinyin":"Wǒ liù suì.","mongolian":"Би 6 настай."},{"chinese":"月月，你几岁？","pinyin":"Yuèyuè, nǐ jǐ suì?","mongolian":"Юэ-юэ, чи хэдтэй вэ?"}],
   "common_mistakes":[{"wrong":"我6。","right":"我6岁。","why":"Насыг хэлэхдээ 岁-ийг мартаж болохгүй."}],
   "check":{"question":"Найзаасаа нас асуухдаа юу гэх вэ?","options":["你几岁？","再见！","我6岁。"],"answer":"0"},
   "practice":[{"n":1,"question":"你________岁？ (хэд)","answer":"几","explanation_mn":"几 = хэд. 你几岁 = чи хэдтэй вэ."}]},
  {"word":"多大","gloss":"duōdà — хэдтэй вэ","explanation":"你哥哥多大? гэвэл «Чиний ах хэдтэй вэ?» гэсэн үг. Ах, эгч, аав, ээж, найз — хэнээс ч нас асууж болно. Багшаас эсвэл том хүнээс хүндэтгэж асуухдаа 您多大 гэнэ.",
   "structure":"хүн + 多大？","teacher_notes":"多大 — «хэр том» гэсэн үгийн утгатай; ном дотор ахын нас, багшийн нас асуухад хэрэглэсэн. 几岁-г голдуу жижиг хүүхдээс асуудаг.",
   "examples":[{"chinese":"你哥哥多大？","pinyin":"Nǐ gēge duōdà?","mongolian":"Чиний ах хэдтэй вэ?"},{"chinese":"你多大？","pinyin":"Nǐ duōdà?","mongolian":"Чи хэдтэй вэ?"},{"chinese":"老师，您多大？","pinyin":"Lǎoshī, nín duōdà?","mongolian":"Багш аа, та хэдтэй вэ?"}],
   "common_mistakes":[{"wrong":"你哥哥多大岁？","right":"你哥哥多大？","why":"多大 дотор «нас» аль хэдийн байгаа тул 岁 нэмэхгүй."}],
   "check":{"question":"Ахынхаа насыг асуухдаа:","options":["你哥哥多大？","我6岁。","老师好！"],"answer":"0"},
   "practice":[{"n":1,"question":"你姐姐________？ (хэдтэй вэ)","answer":"多大","explanation_mn":"Эгчийн нас — 多大."}]},
  {"word":"也","gloss":"yě — бас","explanation":"Хоёр хүн адилхан үед «бас» гэж хэлдэг: 我6岁，他也6岁. Тэр бас 6 настай. 也-г ихэвчлэн хэн нэгний нэрийн ард хэлнэ.",
   "structure":"хүн + 也 + 6岁。","teacher_notes":"也 нь үйл үг/тоо-ийн өмнө, хүний нэрийн дараа ордог.",
   "examples":[{"chinese":"他也6岁。","pinyin":"Tā yě liù suì.","mongolian":"Тэр бас 6 настай."},{"chinese":"妹妹也1岁。","pinyin":"Mèimei yě yí suì.","mongolian":"Дүү охин бас 1 настай."},{"chinese":"妈妈也35岁。","pinyin":"Māma yě sānshíwǔ suì.","mongolian":"Ээж бас 35 настай."}],
   "common_mistakes":[{"wrong":"也他6岁。","right":"他也6岁。","why":"Хүн эхэнд, 也 дундаа."}],
   "check":{"question":"«Тэр бас 6 настай» хятадаар:","options":["他也6岁。","他6也岁。","也他6岁。"],"answer":"0"},
   "practice":[{"n":1,"question":"我6岁，你________6岁。 (бас)","answer":"也","explanation_mn":"Адилхан үед 也 гэнэ."}]},
 ],
 "collocations":[{"type":"Нас хэлэх хэв","rows":[
   {"head":"你","with":"几岁","mn":"чи хэдтэй вэ","usage_mn":"Найзаасаа асуухад","example":{"zh":"你几岁？","pinyin":"Nǐ jǐ suì?","mn":"Чи хэдтэй вэ?"}},
   {"head":"你哥哥","with":"多大","mn":"чиний ах хэдтэй вэ","usage_mn":"Ах, эгч, том хүний нас асуухад","example":{"zh":"你哥哥多大？","pinyin":"Nǐ gēge duōdà?","mn":"Чиний ах хэдтэй вэ?"}},
   {"head":"他","with":"也6岁","mn":"тэр бас 6 настай","usage_mn":"Адилхан нас байхад","example":{"zh":"他也6岁。","pinyin":"Tā yě liù suì.","mn":"Тэр бас 6 настай."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Зөв үгийг нөхөж бич.","banks":[{"words":["几","也","多大"],"items":[
     {"n":1,"question":"月月，你________岁？","answer":"几","explanation_mn":"几岁 = хэдтэй. Ном дээрх асуулт."},
     {"n":2,"question":"你哥哥________？","answer":"多大","explanation_mn":"你哥哥多大 — ахын нас."},
     {"n":3,"question":"他________6岁。","answer":"也","explanation_mn":"他也6岁 — тэр бас 6 настай."}]}],
   "answer_source":"textbook (Let's read, х.20)"},
  "comprehension":{"instruction_mn":"Let's read — яриаг сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"月月几岁？","answer":"6岁。","explanation_mn":"Юэ-юэ «我6岁» гэсэн."},
     {"n":2,"question_zh":"她哥哥多大？","answer":"他也6岁。","explanation_mn":"Ах нь «他也6岁» — бас 6 настай."}],
   "answer_source":"textbook_verified (Let's read, х.20 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тогло.","prompts":[
     {"label":"Бөмбөг шидэлцэх тоглоом","start_zh":"你几岁？ 你多大？……","detail_mn":"Бөмбөгтэй хүн бөмбөгөө шидэхдээ «你几岁?» эсвэл «你多大?» гэж асууна. Бөмбөг барьж авсан хүн «我…岁» гэж хариулаад, дараагийн хүн рүү шиднэ."},
     {"label":"Жижиг судалгаа (Small survey)","start_zh":"爸爸多大？ 妈妈多大？……","detail_mn":"5 найзаасаа аав, ээж, ах, эгч, дүү нарын нас хэд вэ гэж асуугаад хүснэгтэнд бич. Дараа нь ангидаа хэл."},
     {"label":"Манай гэрийн зургийн цомог","start_zh":"我7岁。爸爸35岁……","detail_mn":"Дөрвөн зураг зур: аав ээж, өвөө эмээ, өөрөө, дүү нар. Зураг бүр дээр насыг хятадаар бич (35岁 гэх мэт)."}]}},
 "grammarNotes":[],
 "culture":{"title":"长寿面","title_mn":"Төрсөн өдрийн урт гоймон","text_mn":"Хятад хүүхдүүд төрсөн өдрөө урт гоймон иддэг. Үүнийг «长寿面» гэнэ — «урт настай болох гоймон». Гоймонг тасалж болохгүй, урт хэвээр нь идвэл урт настай болно гэж үздэг. Манайд төрсөн өдөр бялуу идэж, лаа үлээдэг шүү дээ. Чи төрсөн өдөр юу иддэг вэ?","note_mn":"Хятадад ч, Монголд ч төрсөн өдөр бялуу идэж, лаа үлээдэг. Гэхдээ хятадууд урт гоймонг ч заавал иддэг!"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — нас асуух, хэлэх, 1–100 тоолох.","topic":"Нас хэлцгээе!","discussion":["Найзтайгаа хос болоод «你几岁?» гэж асуулцаж, «我…岁» гэж хариулцаарай.","Гэрийнхээ хүмүүсийн насыг хятадаар хэлээд үзээрэй."],
   "writing":{"promptChinese":"我__岁。我的爸爸__岁。","promptMongolian":"Гэрийн даалгавар: «Манай гэрийн зургийн цомог»-ыг зурж, зураг бүр дээр насыг хятадаар бич.","minChars":"0","requiredWords":["岁","也"],"sampleChinese":"我7岁。爸爸35岁，妈妈也35岁。","sampleMongolian":"Би 7 настай. Аав 35 настай, ээж бас 35 настай.","gradingRubric":"Зөв хэлсэн, 岁 мартаагүй эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L5 1.✗ 2.✓ 3.✗ 4.D 5.C 6.B 7.A","parts":[]},
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
 {"point":"你几岁？ — нас асуух","gloss_mn":"«Чи хэдтэй вэ?» — нас асуух, «我…岁» гэж хариулах",
  "structure":"你几岁？  →  我 + тоо + 岁。",
  "teacher_mn":"Найзаасаа нас асуухдаа «你几岁?» гэнэ. 几 = «хэд», 岁 = «нас». Хариулахдаа тоогоо хэлээд «岁» нэмнэ: «我6岁». Чи хэдтэй вэ? Хуруугаараа үзүүлээд хятадаар хэлээрэй!",
  "teacher_notes":"几岁-г жижиг хүүхдэд асуудаг. Хариулахдаа 岁-ийг орхихгүй байх.",
  "examples":[ex("月月，你几岁？","Yuèyuè, nǐ jǐ suì?","Юэ-юэ, чи хэдтэй вэ?"),ex("我6岁。","Wǒ liù suì.","Би 6 настай."),ex("玛丽，玛丽，你几岁？","Mǎlì, Mǎlì, nǐ jǐ suì?","Мари, Мари, чи хэдтэй вэ? (дуунаас)")],
  "common_mistakes":[{"wrong":"我6。","right":"我6岁。","why":"岁 буюу «нас» гэдгийг хэлнэ."}],
  "check":chk("Найзаасаа нас асуухдаа:",["你几岁？","我6岁。","再见！"],"你几岁？","g1c"),
  "exercises":[
   choice("A：你几岁？ B：我________岁。",["6","你","也"],"6","Зөв! Хариулахдаа тоо хэлнэ.","Хариу нь тоо байх ёстой: 我6岁.","g1e1"),
   judge("«你几岁?» гэдэг нь «Чи хэдтэй вэ?» гэсэн үг.",True,"Зөв!","你几岁 = чи хэдтэй вэ."),
   choice("«几» гэдэг үг юу гэсэн үг вэ?",["хэд","бас","нас"],"хэд","Зөв! 几 = хэд, 岁 = нас.","几 = хэд. 也 = бас, 岁 = нас.","g1e3")]},
 {"point":"你哥哥多大？ · 他也6岁。","gloss_mn":"Ах, эгчийн нас асуух, «бас» гэж хэлэх",
  "structure":"хүн + 多大？  ·  хүн + 也 + тоо + 岁。",
  "teacher_mn":"Ахынхаа насыг асуухдаа «你哥哥多大?» гэнэ. Хариуд нь «他也6岁» — «тэр бас 6 настай». 也 = «бас». Багшаас нас асуухдаа «您多大?» гэнэ. Чиний ах, эгч хэдтэй вэ? Хятадаар асууж үзээрэй!",
  "teacher_notes":"几岁-г голдуу жижиг хүүхдээс асуудаг, 多大-г ах, эгч, багш зэрэг хүнээс асууна. 也 хүний нэрийн ард ордог.",
  "examples":[ex("你哥哥多大？","Nǐ gēge duōdà?","Чиний ах хэдтэй вэ?"),ex("他也6岁。","Tā yě liù suì.","Тэр бас 6 настай."),ex("老师，老师，您多大？","Lǎoshī, lǎoshī, nín duōdà?","Багш аа, багш аа, та хэдтэй вэ? (дуунаас)")],
  "common_mistakes":[{"wrong":"他6也岁。","right":"他也6岁。","why":"也 хүн, тооны дунд орно."}],
  "check":chk("Ахын нас асуухдаа:",["你哥哥多大？","你哥哥6岁。","他也6岁。"],"你哥哥多大？","g2c"),
  "exercises":[
   choice("我6岁，他________6岁。",["也","几","多大"],"也","Зөв! 也 = бас.","几 = хэд, 多大 = хэдтэй. «Бас» нь 也.","g2e1"),
   judge("«您多大?» гэдгийг багшаас асуухад хэлнэ.",True,"Зөв! 您 = та.","您 хүндэтгэж хэлэх үг.")
   ,choice("«你哥哥多大？» гэсэн асуултад хариулах нь:",["他也6岁。","你好！","再见！"],"他也6岁。","Зөв! Насыг хэлнэ.","Асуулт нас асууж байна, нас хэлж хариулна.","g2e3")]},
 {"point":"11–100 тоолох","gloss_mn":"Арав дээр нэмж тоолох",
  "structure":"十一 = 10 + 1 · 二十 = 2 × 10 · 三十五 = 30 + 5",
  "teacher_mn":"Нэгээс арав хүртэлх тоог чи мэднэ. Арав дээр нэмбэл: 十一 (арван нэг), 十二 (арван хоёр). Хорь нь «хоёр арав» гэж 二十 болно. 三十五 — «гурван арав, тав» — 35. 一百 — зуу!",
  "teacher_notes":"Хятадад 11–99 нь 10-ын тоо + нэгж гэж тогтмол. Энэ нь монголоос амархан.",
  "examples":[ex("十一","shíyī","арван нэг"),ex("二十","èrshí","хорь"),ex("三十五","sānshíwǔ","35 (гучин тав)"),ex("六十","liùshí","60 (жар)")],
  "common_mistakes":[{"wrong":"二十 = 12","right":"二十 = 20, 十二 = 12","why":"Хоёр арав = хорь, арав хоёр = 12."}],
  "check":chk("«三十五» хэд вэ?",["35","53","30"],"35","g3c"),
  "exercises":[
   choice("«十一» хэд вэ?",["11","1","20"],"11","Зөв! 十 + 一 = 11.","十一 = арав + нэг = 11.","g3e1"),
   choice("«二十» хэд вэ?",["20","12","2"],"20","Зөв! 二十 = 20.","二十 = 2 × 10 = 20. 12 бол 十二.","g3e2"),
   judge("«六十» гэдэг нь 60.",True,"Зөв! 六 = 6, 十 = 10, 六十 = 60.","六十 = 60.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«岁» хэд гэсэн үг вэ?",["нас","бас","хэд","нууц"],"нас","岁 (suì) = нас.","easy",["vocabulary"],"q1")
q("choice","«几» хэд гэсэн үг вэ?",["хэд","нас","бас","та"],"хэд","几 (jǐ) = хэд.","easy",["vocabulary"],"q2")
q("choice","«也» хэд гэсэн үг вэ?",["бас","нас","хэд","нууц"],"бас","也 (yě) = бас.","easy",["vocabulary"],"q3")
q("choice","«多大» хэд гэсэн үг вэ?",["хэдтэй вэ","баяртай","бас","нууц"],"хэдтэй вэ","多大 (duōdà) = хэдтэй вэ.","easy",["vocabulary"],"q4")
q("choice","«您» хэд гэсэн үг вэ?",["та (хүндэтгэсэн)","чи","бид","тэр"],"та (хүндэтгэсэн)","您 (nín) = та. 你 = чи.","medium",["vocabulary"],"q5")
q("choice","«秘密» хэд гэсэн үг вэ?",["нууц","нас","багш","сайн"],"нууц","秘密 (mìmì) = нууц.","medium",["vocabulary"],"q6")
q("choice","Найзаасаа нас асуухад:",["你几岁？","我6岁。","再见！","他也6岁。"],"你几岁？","你几岁 = чи хэдтэй вэ.","easy",["dialogue"],"q7")
q("choice","«我6岁。» гэдэг:",["Би 6 настай.","Чи хэдтэй вэ?","Тэр бас 6 настай.","Багш аа, баяртай!"],"Би 6 настай.","我6岁 = Би 6 настай.","easy",["dialogue"],"q8")
q("cloze","A：月月，你几岁？ B：我（ ）岁。",["6","你","也","好"],"6","Хариу нь тоо: 我6岁.","easy",["dialogue"],"q9")
q("cloze","A：你哥哥多大？ B：他（ ）6岁。",["也","几","您","是"],"也","他也6岁 = тэр бас 6 настай.","medium",["dialogue"],"q10")
q("choice","Ахын насыг асуухад:",["你哥哥多大？","你哥哥再见。","我6岁。","他也6岁。"],"你哥哥多大？","你哥哥多大 = чиний ах хэдтэй вэ.","easy",["dialogue"],"q11")
q("choice","«他也6岁。» гэдэг:",["Тэр бас 6 настай.","Би 6 настай.","Чи хэдтэй вэ?","Ээж 6 настай."],"Тэр бас 6 настай.","也 = бас.","easy",["dialogue"],"q12")
q("choice","Дууны тухай: Мари хэдтэй вэ?",["8 настай","9 настай","6 настай","7 настай"],"8 настай","Дуунд: 玛丽：8岁，8岁，我8岁。","medium",["song"],"q13")
q("choice","Дууны тухай: Дэвид хэдтэй вэ?",["9 настай","8 настай","7 настай","10 настай"],"9 настай","大卫：9岁，我9岁。","medium",["song"],"q14")
q("choice","Дуунд багш нас нь хэд вэ гэхэд юу гэж хариулав?",["秘密 (нууц)","我6岁","他也6岁","再见"],"秘密 (нууц)","老师：秘密，秘密，是秘密。","medium",["song"],"q15")
q("choice","«十一» хэд вэ?",["11","1","10","21"],"11","十 + 一 = 11.","easy",["number"],"q16")
q("choice","«二十» хэд вэ?",["20","12","2","22"],"20","二十 = 2 × 10 = 20.","easy",["number"],"q17")
q("choice","«三十五» хэд вэ?",["35","53","30","15"],"35","三十 = 30, 五 = 5 → 35.","medium",["number"],"q18")
q("choice","«六十» хэд вэ?",["60","16","6","66"],"60","六十 = 60.","medium",["number"],"q19")
q("choice","«一百» хэд вэ?",["100","10","1","1000"],"100","一百 = 100.","easy",["number"],"q20")
q("choice","Аль нь «арван хоёр» вэ?",["十二","二十","二","十"],"十二","十二 = 12, 二十 = 20.","medium",["number"],"q21")
q("choice","Пиньинь «suì» гэж уншдаг ханз:",["岁","几","也","您"],"岁","岁 = suì = нас.","easy",["pronunciation"],"q22")
q("choice","Пиньинь «duōdà» гэж уншдаг үг:",["多大","几岁","老师","秘密"],"多大","多大 = duōdà = хэдтэй вэ.","medium",["pronunciation"],"q23")
q("choice","Пиньинь «yě» гэж уншдаг ханз:",["也","几","岁","好"],"也","也 = yě = бас.","easy",["pronunciation"],"q24")
q("usage","Багшаас нас асуухдаа хүндэтгэж:",["老师，您多大？","老师，你几岁？","老师再见。","我6岁。"],"老师，您多大？","您 = хүндэтгэсэн «та».","medium",["usage"],"q25")
q("usage","Ээжийн нас асуухад аль нь тохиромжтой вэ?",["妈妈多大？","妈妈也6岁。","我6岁。","你好！"],"妈妈多大？","Ээж зэрэг том хүний насыг 多大 гэж асууна.","medium",["usage"],"q26")
q("choice","Mini story: «爸爸35岁，妈妈也35岁。» — Ээж хэдтэй вэ?",["35 настай","60 настай","7 настай","1 настай"],"35 настай","妈妈也35岁 = ээж бас 35 настай.","medium",["story"],"q27")
q("choice","Mini story: «爷爷60岁，奶奶也60岁。» — Эмээ хэдтэй вэ?",["60 настай","35 настай","1 настай","7 настай"],"60 настай","奶奶也60岁 = эмээ бас 60 настай.","medium",["story"],"q28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"listening","instruction_mn":"Сонсох — Аудио (05-05) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗ гэж сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）五","question_mn":"1-р асуулт: сонсоод зурагтай тулга","options":["✓","✗"],"image":img("t1"),"answer":"✗","script_zh":"五","explanation_mn":"Аудионд «五 (wǔ) — тав» гэж хэлнэ. Зураг дээр 3 гүзээлзгэнэ байна — энэ нь «三» тул таарахгүй ✗."},
    {"n":2,"question_zh":"（听录音）我的哥哥","question_mn":"2-р асуулт: сонсоод зурагтай тулга","options":["✓","✗"],"image":img("t2"),"answer":"✓","script_zh":"我的哥哥","explanation_mn":"Аудионд «我的哥哥 — миний ах» гэнэ. Зураг дээр цүнхтэй, ном барьсан том хүү байна — ах гэж болно ✓."},
    {"n":3,"question_zh":"（听录音）月月，你几岁？我六岁。","question_mn":"3-р асуулт: сонсоод зурагтай тулга","options":["✓","✗"],"image":img("t3"),"answer":"✗","script_zh":"A：月月，你几岁？B：我六岁。","explanation_mn":"Аудионд Юэ-юэ «我六岁» — 6 настай гэнэ. Зураг дээр бялуун дээр «5» тоотой лаа байна — 5 нас. 6 ≠ 5 тул ✗."}],
   "answer_source":"Test Answers х.63: 1.✗ 2.✓ 3.✗; Listening script х.61"},
  {"part":2,"type":"choice","instruction_mn":"Унших — А九 В是 С哪 D有-аас зөв үгийг сонгож нөх.","wordBank":["A 九","B 是","C 哪","D 有"],"items":[
    {"n":4,"question_zh":"A：你家（ ）几口人？ B：四口人。","image":img("t4"),"options":["A 九","B 是","C 哪","D 有"],"answer":"D","explanation_mn":"«Чиний гэрт хэдэн хүн байна вэ?» — 你家有几口人. Зураг дээр гэр бүл байна. 有 = байна. 九 (ес), 是 (мөн), 哪 (аль) энд таарахгүй."},
    {"n":5,"question_zh":"A：你是（ ）国人？ B：我是中国人。","image":img("t5"),"options":["A 九","B 是","C 哪","D 有"],"answer":"C","explanation_mn":"«Чи аль улсын хүн бэ?» — 你是哪国人. 哪 = аль. Хариу нь «Би Хятад хүн». Зураг дээр инээсэн охин байна."},
    {"n":6,"question_zh":"A：哪个（ ）你哥哥？ B：7号。","image":img("t6"),"options":["A 九","B 是","C 哪","D 有"],"answer":"B","explanation_mn":"«Аль нь чиний ах вэ?» — 哪个是你哥哥. 是 = мөн/нь. Хариу «7-р дугаартай». Зураг дээр дугаартай 4 сагсан бөмбөгчин байна."},
    {"n":7,"question_zh":"A：你八岁吗？ B：不，我（ ）岁。","image":img("t7"),"options":["A 九","B 是","C 哪","D 有"],"answer":"A","explanation_mn":"«Чи 8 настай юу?» — «Үгүй, би 9 настай». 九 = 9 нас. Зураг дээр төрсөн өдрийн бялуутай хүүхэд байна."}],
   "answer_source":"Test Answers х.63: 4.D 5.C 6.B 7.A"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Mini story — «Манай гэрийн зургийн цомог»: 4 зураг зур, зураг бүр дээр насыг хятадаар бич.","question_zh":"我7岁。爸爸35岁。","answer":"(нээлттэй)","explanation_mn":"Жишээ: 我7岁。爸爸35岁，妈妈也35岁。"}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Бөмбөг шидэлцэх тоглоом: «你几岁？» «你多大？» гэж асууна.","question_zh":"你几岁？你多大？","answer":"我…岁。","explanation_mn":"Бөмбөг барьж авсан хүн хариулна."},
   {"n":2,"prompt_mn":"Small survey: 5 найзаасаа гэр бүлийнх нь насыг асуу.","question_zh":"爸爸多大？妈妈多大？","answer":"(нээлттэй)","explanation_mn":"Хүснэгтэнд бичээд ангидаа хэл."},
   {"n":3,"prompt_mn":"«你几岁？» дууг дуул, нэрээ солиод дуул.","question_zh":"玛丽，玛丽，你几岁？","answer":"(нээлттэй)","explanation_mn":"Аудио 05-03-ыг дагана."}]},
 "answerSource":"YCT 标准教程 1 · х.61 Test Listening Scripts, х.63 Test Answers (Lesson 5)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
images = [
 {"id":"hero","file":"images/hero.jpg","title":"我6岁。 — нас хэлцгээе","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"月月，你几岁？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"你哥哥多大？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"你几岁？","role":"illustration","section":"song"},
 {"id":"numgrid","file":"images/numgrid.png","title":"1–100 тооны хүснэгт","role":"illustration","section":"vocabulary"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in [("sui","岁"),("ji","几"),("duoda","多大"),("ye","也"),("nin","您"),("mimi","秘密"),("shiyi","十一"),("ershi","二十"),("yibai","一百")]] \
  + [{"id":f"story{i}","file":f"images/story{i}.png","title":f"Mini story {i}","role":"illustration","section":"story"} for i in range(1,5)] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in range(1,8)]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 5-р хичээл — Би 6 настай","chineseTitle":"我6岁。","targetTitle":"我6岁。","mongolianTitle":"Би 6 настай",
 "subtitle":"你几岁 · 你哥哥多大 · 也 · тоо 11–100 · «你几岁» дуу · бөмбөгний тоглоом",
 "description":f"Нас асуух (你几岁, 你哥哥多大), нас хэлэх (我6岁), 1–100 тоолох. {len(vocab)} үг, 2 зурагт яриа, 1 дуу, 1 mini story, 3 дүрэм, {len(Q)} шалгалтын асуулт, номын тест (сонсох 3 + унших 4) — АЛБАН АУДИО, ЗУРАГТАЙ.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🎂","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第5课《我6岁。》 [hskLevel=1] [lessonNumber=5]; эх: YCT1标准教程.pdf х.19–23, х.61 (сонсголын текст), х.63 (хариу); аудио CD 05-01…05-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"我6岁。","mongolianTitle":"Би 6 настай",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第5课 (сурах бичиг + CD аудио 05-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers х.63)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
