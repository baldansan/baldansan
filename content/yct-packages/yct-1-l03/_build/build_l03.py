#!/usr/bin/env python3
"""YCT 标准教程 1 · 第3课 他是谁？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
from PIL import Image
BASE = "/home/claude/work/yct1/l03"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-1", "yct-1-l03", 3
os.makedirs(OUT + "/images", exist_ok=True)

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
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = ("audio/yct-1-03-01.mp3","audio/yct-1-03-02.mp3","audio/yct-1-03-03.mp3","audio/yct-1-03-04.mp3","audio/yct-1-03-05.mp3")
AUD_MAIN = "audio/yct-1-03-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"/tmp/l03_concat.txt"
    open(lst, "w").write(f"file '{OUT}/{AUD_TEXT}'\nfile '{OUT}/{AUD_SONG}'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)

# ---------------- TEST IMAGE CROPS (150dpi hi-15) ----------------
def crop(box, name):
    im = Image.open(f"{BASE}/pages/hi-15.png").convert("RGB")
    W, H = im.size
    x0,y0,x1,y1 = box
    im.crop((int(x0*W),int(y0*H),int(x1*W),int(y1*H))).save(f"{OUT}/images/{name}.png")
rows_l = [(0.192,0.286),(0.293,0.387),(0.394,0.488)]
cols = [(0.218,0.422),(0.430,0.636),(0.644,0.851)]
for r,(ya,yb) in enumerate(rows_l):
    for c,(xa,xb) in enumerate(cols):
        crop((xa,ya,xb,yb), f"t{r+1}{'abc'[c]}")
rows_r = [(0.576,0.668),(0.677,0.770),(0.778,0.870)]
for r,(ya,yb) in enumerate(rows_r):
    crop((0.218,ya,0.422,yb), f"t{r+4}")

# ---------------- VOCAB ----------------
VOCAB = [
 ("他","tā","тэр (эрэгтэй хүн)","төлөөний үг · гол үг","他是成龙。","Tā shì Chéng Lóng.","Тэр бол Чэн Лун."),
 ("是","shì","бол, мөн","үйл үг · гол үг","他是成龙。","Tā shì Chéng Lóng.","Тэр бол Чэн Лун."),
 ("谁","shéi","хэн","асуух үг · гол үг","他是谁？","Tā shì shéi?","Тэр хэн бэ?"),
 ("哪","nǎ","аль","асуух үг · гол үг","成龙是哪国人？","Chéng Lóng shì nǎ guó rén?","Чэн Лун аль улсын хүн бэ?"),
 ("国","guó","улс","нэр үг · гол үг","中国","Zhōngguó","Хятад улс"),
 ("人","rén","хүн","нэр үг · гол үг","他是中国人。","Tā shì Zhōngguó rén.","Тэр бол хятад хүн."),
 ("中国人","Zhōngguó rén","хятад хүн","нэр үг · гол үг","他是中国人。","Tā shì Zhōngguó rén.","Тэр бол хятад хүн."),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 1","keyWord":True,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    out=[]
    for t in s.split(" "):
        if not t: continue
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Тэр хэн бэ?","scene_mn":"Музейд охин дүр хөшөөг хараад ээжээсээ «тэр хэн бэ?» гэж асууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"女孩","zh":"他是谁？","pinyin":"Tā shì shéi?","mn":"Тэр хэн бэ?"},{"speaker":"妈妈","zh":"他是成龙。","pinyin":"Tā shì Chéng Lóng.","mn":"Тэр бол Чэн Лун."}]},
 {"id":2,"title_mn":"Яриа 2 · Аль улсын хүн бэ?","scene_mn":"Охин «Чэн Лун аль улсын хүн бэ?» гэж асууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"女孩","zh":"成龙是哪国人？","pinyin":"Chéng Lóng shì nǎ guó rén?","mn":"Чэн Лун аль улсын хүн бэ?"},{"speaker":"妈妈","zh":"中国人。","pinyin":"Zhōngguó rén.","mn":"Хятад хүн."}]},
 {"id":3,"title_mn":"Мини түүх · Од хүмүүстэй зураг авахуулъя","scene_mn":"Охин ээжтэйгээ хамт алдартай хүмүүсийг таньж, эцэст нь хамтдаа зураг авахуулна.","audio":AUD_STORY,
  "lines":[
   {"speaker":"女孩","zh":"妈妈，她是谁？","pinyin":"Māma, tā shì shéi?","mn":"Ээж ээ, тэр хэн бэ?"},
   {"speaker":"妈妈","zh":"她是章子怡。","pinyin":"Tā shì Zhāng Zǐyí.","mn":"Тэр бол Жан Цзы-и."},
   {"speaker":"女孩","zh":"他呢？","pinyin":"Tā ne?","mn":"Харин тэр хэн бэ?"},
   {"speaker":"妈妈","zh":"他是姚明。","pinyin":"Tā shì Yáo Míng.","mn":"Тэр бол Яо Мин."},
   {"speaker":"妈妈","zh":"他们都是中国人。","pinyin":"Tāmen dōu shì Zhōngguó rén.","mn":"Тэд хоёулаа хятад хүн."},
   {"speaker":"女孩","zh":"我认识他，他是迈克尔·杰克逊。","pinyin":"Wǒ rènshi tā, tā shì Màikè'ěr Jiékèxùn.","mn":"Би түүнийг мэднэ, тэр бол Майкл Жексон."},
   {"speaker":"女孩","zh":"她是谁？真漂亮！","pinyin":"Tā shì shéi? Zhēn piàoliang!","mn":"Тэр хэн бэ? Ямар үзэсгэлэнтэй вэ!"},
   {"speaker":"艾玛","zh":"你好，我是艾玛。","pinyin":"Nǐ hǎo, wǒ shì Àimǎ.","mn":"Сайн уу, би Ай Ма."},
   {"speaker":"女孩","zh":"你好！你好！","pinyin":"Nǐ hǎo! Nǐ hǎo!","mn":"Сайн уу! Сайн уу!"},
   {"speaker":"大家","zh":"一、二、三，茄子！","pinyin":"Yī, èr, sān, qiézi!","mn":"Нэг, хоёр, гурав, «цээнзэ»! (зураг авахуулахдаа хэлдэг)"}]},
]
song_lines = [
 ("找呀找呀找朋友，","Zhǎo ya zhǎo ya zhǎo péngyou,","Хайж хайж найзаа хайя,","找|zhǎo 呀|ya 找|zhǎo 呀|ya 找|zhǎo 朋友|péngyou ，|"),
 ("找到一个好朋友。","Zhǎodào yí ge hǎo péngyou.","Сайхан нэг найзтай боллоо.","找到|zhǎodào 一|yí 个|ge 好|hǎo 朋友|péngyou 。|"),
 ("成龙，中国人，","Chéng Lóng, Zhōngguó rén,","Чэн Лун, хятад хүн,","成龙|Chéng Lóng ，| 中国|Zhōngguó 人|rén ，|"),
 ("你是我的好朋友。","Nǐ shì wǒ de hǎo péngyou.","Чи бол миний сайн найз.","你|nǐ 是|shì 我|wǒ 的|de 好|hǎo 朋友|péngyou 。|"),
 ("再见！","Zàijiàn!","Баяртай!","再见|zàijiàn ！|"),
]
sentences=[]
dl = [
 (1,"女孩：他是谁？","Nǚhái: Tā shì shéi?","Охин: Тэр хэн бэ?","女孩：| 他|tā 是|shì 谁|shéi ？|","他是谁？ — хэн нэгнийг заагаад «тэр хэн бэ?» гэж асууна. Охин музейд Чэн Лун гэдэг алдартай жүжигчний дүр хөшөөг хараад байна.",["他是谁"]),
 (1,"妈妈：他是成龙。","Māma: Tā shì Chéng Lóng.","Ээж: Тэр бол Чэн Лун.","妈妈：| 他|tā 是|shì 成龙|Chéng Lóng 。|","他是…… — «Тэр бол …» гэж хариулна. Цэг дээр нэрийг нь хэлнэ.",["他是成龙"]),
 (2,"女孩：成龙是哪国人？","Nǚhái: Chéng Lóng shì nǎ guó rén?","Охин: Чэн Лун аль улсын хүн бэ?","女孩：| 成龙|Chéng Lóng 是|shì 哪|nǎ 国|guó 人|rén ？|","哪国人？ — «аль улсын хүн бэ?» гэсэн асуулт. 哪 = аль, 国 = улс, 人 = хүн.",["哪国人"]),
 (2,"妈妈：中国人。","Māma: Zhōngguó rén.","Ээж: Хятад хүн.","妈妈：| 中国|Zhōngguó 人|rén 。|","中国人 — «хятад хүн». 中国 = Хятад улс, 人 = хүн.",["中国人"]),
]
for para,zh,py,mn,tk,note,ks in dl:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk),"note":note,"key_structures":ks}
    sentences.append(s)
for i,(zh,py,mn,tk) in enumerate(song_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==3: s["note"]="你是我的好朋友 — «чи бол миний сайн найз». 的 нь «миний» гэх мэт «-ийн» утгыг өгдөг жижиг үг. Дуунд 成龙, 中国人-ын оронд найзынхаа нэр, улсыг хэлж болно."; s["key_structures"]=["你是我的好朋友"]
    sentences.append(s)

story_summary = "Мини түүх — Охин ээжтэйгээ хамт алдартай хүмүүсийг хараад «Тэр хэн бэ?» гэж асууна. Ээж нь Жан Цзы-и, Яо Мин хоёр хятад хүмүүс гэж хэлнэ. Охин Майкл Жексоныг өөрөө таньж байна. Эцэст нь Ай Ма гэдэг эмэгтэйтэй танилцаж, гурвуулаа «一、二、三，茄子！» гэж хашгиран зураг авахуулна."
texts = {
 "unit":{"number":"3","title":"他是谁？","mongolianTitle":"Тэр хэн бэ? — хүнийг танилцуулах, аль улсын хүн гэж асуух"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, найзуудаа! Би Тэмээ багш. Чи кинонд гардаг, алдартай хүмүүсийг таньдаг уу? Өнөөдөр бид «Тэр хэн бэ?» гэж асууж сурна. Хятадаар «他是谁？(tā shì shéi)» гэдэг. Хариуд нь «他是……» гэж нэрийг нь хэлнэ. Мөн «Тэр аль улсын хүн бэ?» гэж асууж, «中国人 — хятад хүн» гэж хариулж сурна. Дараа нь найзаа хайдаг хөгжилтэй дуу дуулна. Гараа ташин, чанга дуулъя! Эхэлцгээе!",
  "warmup_mn":"Чи хамгийн дуртай алдартай хүнээ хэлж өгөөч? Тэр хүн аль улсын хүн бэ? Гэрийнхэндээ зургийг нь үзүүлээд «Энэ хэн бэ?» гэж асуугаарай.",
  "theme_zh":"他是谁？ · 哪国人 · 中国人","theme_mn":"Тэр хэн бэ? · Аль улсын хүн · Хятад хүн"},
 "warmup":{"mongolian":"Чи хамгийн дуртай алдартай хүнээ хэлж өгөөч? Тэр хүн аль улсын хүн бэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"3","title":"他是谁？","mongolianTitle":"Тэр хэн бэ? — яриа ба дуу","title_mn":"Let's read · 2 яриа + Let's sing · 找朋友 (дуу)","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第3课 Let's read, Let's sing（CD 03-02, 03-03）","author_zh":"",
  "intro_zh":"小女孩在博物馆问妈妈：他是谁？成龙是哪国人？然后一起唱《找朋友》。",
  "intro_mn":"Эхлээд хоёр богино яриа: охин ээжээсээ «Тэр хэн бэ?», «Чэн Лун аль улсын хүн бэ?» гэж асууна. Дараа нь «Найзаа хайя» дуу. Аудиог сонсоод, дараа нь хамт дуул, дуулахдаа гараа таших хэрэгтэй шүү!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Охин музейд дүр хөшөөг хараад «他是谁？» гэж асууж, ээж нь «他是成龙» гэж хариулна."},
   {"paragraph":2,"mn":"Яриа 2 — Охин «成龙是哪国人？» гэж асуухад ээж нь «中国人» гэж хариулна."},
   {"paragraph":3,"mn":"Дуу «找朋友» (найзаа хайя). Найзаа хайж олоод «чи бол миний сайн найз» гэж хэлээд баяртай гэнэ. Дууны Чэн Лун, хятад хүн гэдгийг найзынхаа нэр, улсаар солиод дуул."}],
  "reflection":{"questions_mn":["Алдартай хүнийг заагаад хятадаар яаж асуух вэ?","Найзынхаа нэрийг хэлээд «Тэр бол ……» гэж хятадаар хэлж үз.","Чэн Лун аль улсын хүн бэ? Хятадаар хариул."]},
  "writingSample":{"title_mn":"Ярих дасгал · Хүнийг танилцуул","zh":"他是谁？他是成龙。他是中国人。","pinyin":"Tā shì shéi? Tā shì Chéng Lóng. Tā shì Zhōngguó rén.","mn":"Тэр хэн бэ? Тэр бол Чэн Лун. Тэр бол хятад хүн."},
  "writingPrompt_mn":"Гэр бүлийнхээ хүнийг заагаад «他是谁？» гэж асуу, гэр бүлийн хүн «他是……» гэж хариулаг. Дараа нь солилцож тогло."},
 "properNouns":[
  {"zh":"成龙","py":"Chéng Lóng","mn":"Чэн Лун (Жеки Чан) — алдартай хятад жүжигчин"},
  {"zh":"章子怡","py":"Zhāng Zǐyí","mn":"Жан Цзы-и — хятад жүжигчин"},
  {"zh":"姚明","py":"Yáo Míng","mn":"Яо Мин — хятад сагсан бөмбөгчин"},
  {"zh":"迈克尔·杰克逊","py":"Màikè'ěr Jiékèxùn","mn":"Майкл Жексон — дуучин"},
  {"zh":"艾玛","py":"Àimǎ","mn":"Ай Ма (Эмма) — түүхэнд гардаг эмэгтэй"}],
 "wordExplanation":[
  {"word":"他是谁？","gloss":"tā shì shéi — тэр хэн бэ?","explanation":"他 = тэр, 是 = бол, 谁 = хэн. Гурвыг цуг хэлбэл «Тэр хэн бэ?» Хятадаар «Тэр бол хэн?» гэж хэлж байгаа юм шиг хэлнэ. Хариулахдаа 谁-ийн оронд нэрийг нь хэлнэ: 他是成龙.",
   "structure":"他是谁？ → 他是……。","teacher_notes":"谁 нь shéi (эсвэл shuí) гэж дуудагддаг, номд shéi. Хүүхдэд дүрэм тайлбарлахгүй; асуулт, хариултыг хосоор нь давтуул.",
   "examples":[{"chinese":"他是谁？","pinyin":"Tā shì shéi?","mongolian":"Тэр хэн бэ?"},{"chinese":"他是成龙。","pinyin":"Tā shì Chéng Lóng.","mongolian":"Тэр бол Чэн Лун."},{"chinese":"她是谁？","pinyin":"Tā shì shéi?","mongolian":"Тэр (эмэгтэй) хэн бэ?"}],
   "common_mistakes":[{"wrong":"他谁是？","right":"他是谁？","why":"是 дунд нь, 谁 төгсгөлд нь."}],
   "check":{"question":"Хэн нэгнийг заагаад «Тэр хэн бэ?» гэж асуу.","options":["他是谁？","他是中国人。","再见！"],"answer":"0"},
   "practice":[{"n":1,"question":"他是________？ — 他是成龙。","answer":"谁","explanation_mn":"Нэрийг асууж байгаа тул 谁 (хэн)."}]},
  {"word":"哪国人","gloss":"nǎ guó rén — аль улсын хүн","explanation":"哪 = аль, 国 = улс, 人 = хүн. «Аль улсын хүн бэ?» гэж асуухдаа 哪国人 гэнэ. Хариулахдаа 哪-ийн оронд улсын нэрийг хэлнэ: 中国人 = хятад хүн.",
   "structure":"成龙是哪国人？ → 成龙是中国人。","teacher_notes":"Хариу нь «中国人» гэж богино байж болно. 哪 (nǎ, 3-р аялгуу) ба 那 (nà) өөр үг — дараа нь сурна.",
   "examples":[{"chinese":"成龙是哪国人？","pinyin":"Chéng Lóng shì nǎ guó rén?","mongolian":"Чэн Лун аль улсын хүн бэ?"},{"chinese":"中国人。","pinyin":"Zhōngguó rén.","mongolian":"Хятад хүн."},{"chinese":"他是中国人。","pinyin":"Tā shì Zhōngguó rén.","mongolian":"Тэр бол хятад хүн."}],
   "common_mistakes":[{"wrong":"成龙是国哪人？","right":"成龙是哪国人？","why":"Дараалал: 哪 → 国 → 人."}],
   "check":{"question":"«Хятад хүн» хятадаар аль нь вэ?","options":["中国人","哪国人","他是谁"],"answer":"0"},
   "practice":[{"n":1,"question":"成龙是哪国人？ — ________。","answer":"中国人","explanation_mn":"Чэн Лун хятад хүн."}]},
 ],
 "collocations":[{"type":"是 — хэн бэ, хэний хүн бэ","rows":[
   {"head":"他","with":"是成龙","mn":"тэр бол Чэн Лун","usage_mn":"Хэн болохыг хэлэх","example":{"zh":"他是成龙。","pinyin":"Tā shì Chéng Lóng.","mn":"Тэр бол Чэн Лун."}},
   {"head":"他","with":"是中国人","mn":"тэр бол хятад хүн","usage_mn":"Аль улсын хүн болохыг хэлэх","example":{"zh":"他是中国人。","pinyin":"Tā shì Zhōngguó rén.","mn":"Тэр бол хятад хүн."}},
   {"head":"成龙","with":"是哪国人","mn":"Чэн Лун аль улсын хүн бэ","usage_mn":"Улсыг асуух","example":{"zh":"成龙是哪国人？","pinyin":"Chéng Lóng shì nǎ guó rén?","mn":"Чэн Лун аль улсын хүн бэ?"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Зөв үгийг нөхөж бич.","banks":[{"words":["谁","哪","中国人"],"items":[
     {"n":1,"question":"他是________？","answer":"谁","explanation_mn":"Нэрийг асууж байна — 谁 (хэн)."},
     {"n":2,"question":"成龙是________国人？","answer":"哪","explanation_mn":"«Аль улсын хүн» — 哪国人."},
     {"n":3,"question":"他是________。","answer":"中国人","explanation_mn":"Чэн Лун хятад хүн — 中国人."}]}],
   "answer_source":"textbook-derived"},
  "comprehension":{"instruction_mn":"Яриаг уншаад асуултад хариул.","items":[
     {"n":1,"question_zh":"他是谁？","answer":"他是成龙。","explanation_mn":"Музейн хөшөө бол Чэн Лун."},
     {"n":2,"question_zh":"成龙是哪国人？","answer":"中国人。","explanation_mn":"Чэн Лун хятад хүн."}],
   "answer_source":"textbook_verified (х.10 Question)"},
  "retell":{"instruction_mn":"Таах тоглоом — Хэн бэ?","prompts":[
     {"label":"Хэн бэ? (хосоороо)","start_zh":"他/她是谁？ 他/她是哪国人？ — Нэг нь алдартай хүн, мультфильмийн баатрын зургийг заагаад «他是谁？» гэж асууна. Нөгөө нь «他是……。 他是……国人。» гэж хариулна. Дараа нь солино."},
     {"label":"Таа даа! (хосоороо)","start_zh":"Нэг нь алдартай хүн эсвэл баатар шиг дүр үзүүлнэ (жишээ нь Яо Мин шиг сагс шидэнэ). Нөгөө нь «他是谁？» гэж асуугаад таана."},
     {"label":"Найзуудаа танилцуул (бүлгээрээ)","start_zh":"他/她是……，他/她是……国人。 — Бүлгийн найз бүрийг заагаад нэрийг нь хэлнэ. Жишээ нь «她是……，她是中国人。» гэж хэлж болно."},
     {"label":"Чанга, сэм тоглоом","start_zh":"Багш чанга хэлбэл чи сэмхэн, багш сэмхэн хэлбэл чи чанга хэлнэ. Үгс: 他、是、谁、哪、国、人、中国人."},
     {"label":"Хамтдаа зураг авахуулъя","start_zh":"一、二、三，茄子！ — Гэрийнхэнтэйгээ зураг авахуулахдаа хятадаар «нэг, хоёр, гурав, цээнзэ!» гэж хашгир."}]}},
 "grammarNotes":[],
 "culture":{"title":"拍照说“茄子”","title_mn":"Зураг авахдаа «цээнзэ» гэнэ","text_mn":"Мини түүхийн төгсгөлд хүүхэд «一、二、三，茄子！(qiézi)» гэж хашгирч байна. 茄子 гэдэг нь «цээнзэ» гэсэн үг (хар ягаан өнгөтэй, урт хэлбэртэй ногоо). Хятад хүүхдүүд зураг авахуулахдаа «цээнзэ!» гэж хэлдэг. Энэ үгийг хэлэхэд ам инээмсэглэсэн хэлбэртэй болдог.","note_mn":"Чи зураг авахуулахдаа ямар үг хэлдэг вэ? Дараагийн удаа гэр бүлтэйгээ «цээнзэ!» гэж хятадаар хэлж үз!"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — хүнийг танилцуулах, аль улсын хүн гэж асуух.","topic":"Найзуудаа хятадаар танилцуулъя!","discussion":["Бүлгээрээ: найз бүрийг заагаад «她/他是……» гэж нэрийг нь хэл.","Хосоороо: нэг нь алдартай хүн шиг дүр үзүүлэхэд нөгөө нь «他是谁？» гэж асууж таа."],
   "writing":{"promptChinese":"他是谁？他是……","promptMongolian":"Гэрийн даалгавар: гэр бүлийнхээ нэг хүнийг (эсвэл дуртай баатраа) заагаад «他是谁？» гэж асуугаад, өөрөө «他是……» гэж хариул. Маргааш ангидаа хэлж өг.","minChars":"0","requiredWords":["他是谁","他是"],"sampleChinese":"他是谁？他是成龙。","sampleMongolian":"Тэр хэн бэ? Тэр бол Чэн Лун.","gradingRubric":"Асуулт, хариултыг зөв, чанга хэлсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L3 1.A 2.B 3.C 4.✓ 5.✗ 6.✗","parts":[]},
 "miniStory":{"title_mn":"Мини түүх","summary_mn":story_summary}
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
 {"point":"他是谁？ — тэр хэн бэ?","gloss_mn":"Хэн нэгнийг заагаад хэн болохыг асуух",
  "structure":"他是谁？ → 他是 + нэр。",
  "teacher_mn":"Алдартай хүнийг хараад «Тэр хэн бэ?» гэж асуумаар байна уу? Хятадаар «他是谁？» гэнэ. 他 = тэр, 是 = бол, 谁 = хэн. Хариулахдаа 谁-ийн оронд нэрийг нь тавина: «他是成龙». Эмэгтэй хүн бол 她 гэнэ. Хосоороо асууж, хариулж тогло!",
  "teacher_notes":"他 (эрэгтэй) ба 她 (эмэгтэй) нэг л tā гэж дуудагддаг. Дүрмийн нэр томьёогүй, жишээгээр сургана.",
  "examples":[ex("他是谁？","Tā shì shéi?","Тэр хэн бэ?"),ex("他是成龙。","Tā shì Chéng Lóng.","Тэр бол Чэн Лун."),ex("她是章子怡。","Tā shì Zhāng Zǐyí.","Тэр бол Жан Цзы-и."),ex("他是姚明。","Tā shì Yáo Míng.","Тэр бол Яо Мин.")],
  "common_mistakes":[{"wrong":"他谁是？","right":"他是谁？","why":"是 дунд нь, 谁 төгсгөлд нь."},{"wrong":"Эмэгтэйг заагаад «他是…» гэх","right":"Эмэгтэй хүнд 她 (tā) гэнэ","why":"Хоёулаа tā гэж дуудагдана, гэхдээ бичихэд ялгаатай."}],
  "check":chk("Хүнийг заагаад «Тэр хэн бэ?» гэж асуу.",["他是谁？","他是成龙。","再见！"],"他是谁？","g1c"),
  "exercises":[
   choice("他是谁？ — 他是________。",["成龙","哪","谁"],"成龙","Зөв! Нэрээр хариулна.","哪, 谁 бол асуух үг, хариулахдаа нэр хэлнэ.","g1e1"),
   judge("«他是成龙» гэдэг нь «Тэр бол Чэн Лун» гэсэн үг.",True,"Зөв!","他 = тэр, 是 = бол, 成龙 = Чэн Лун."),
   choice("«谁» гэдэг үг ямар утгатай вэ?",["хэн","аль","хүн"],"хэн","Зөв! 谁 = хэн.","哪 = аль, 人 = хүн.","g1e3")]},
 {"point":"成龙是哪国人？ — аль улсын хүн бэ?","gloss_mn":"Хэн нэгний улсыг асуух ба хариулах",
  "structure":"…是哪国人？ → …是中国人。",
  "teacher_mn":"Хэн нэгний аль улсын хүн болохыг асуумаар байвал «哪国人？» гэнэ. 哪 = аль, 国 = улс, 人 = хүн. «Чэн Лун аль улсын хүн бэ?» — «成龙是哪国人？». Хариулахдаа «中国人» буюу «хятад хүн» гэнэ. 中国 = Хятад улс.",
  "teacher_notes":"Одоохондоо зөвхөн 中国人 гэж хариулна; бусад улсын нэр дараагийн хичээлүүдэд. Бүлгээрээ найзуудаа танилцуулж тогло.",
  "examples":[ex("成龙是哪国人？","Chéng Lóng shì nǎ guó rén?","Чэн Лун аль улсын хүн бэ?"),ex("中国人。","Zhōngguó rén.","Хятад хүн."),ex("他是中国人。","Tā shì Zhōngguó rén.","Тэр бол хятад хүн."),ex("他们都是中国人。","Tāmen dōu shì Zhōngguó rén.","Тэд хоёулаа хятад хүн.")],
  "common_mistakes":[{"wrong":"成龙是国哪人？","right":"成龙是哪国人？","why":"Дараалал: 哪 → 国 → 人."}],
  "check":chk("Яо Мин аль улсын хүн бэ?",["中国人","他是谁","哪国人"],"中国人","g2c"),
  "exercises":[
   choice("成龙是________国人？",["哪","谁","他"],"哪","Зөв! 哪国人 = аль улсын хүн.","谁 = хэн, 他 = тэр.","g2e1"),
   judge("«中国人» гэдэг нь «хятад хүн».",True,"Зөв! 中国 = Хятад, 人 = хүн.","中国 = Хятад улс, 人 = хүн."),
   choice("他是中国人。 — «中国人» гэж юу вэ?",["хятад хүн","багш","найз"],"хятад хүн","Зөв!","中国人 = хятад хүн.","g2e3")]},
 {"point":"他/她是…… — танилцуулах","gloss_mn":"Найзаа, танихгүй хүнийг нэрээр нь танилцуулах",
  "structure":"他是…… · 她是…… · 我是……",
  "teacher_mn":"Хүнийг танилцуулахдаа «是» гэж хэлнэ. «Тэр бол …» — «他是……». Өөрийгөө хэлэхдээ «我是……» гэнэ: «Би Ай Ма» — «我是艾玛». Дуунд «你是我的好朋友» — «Чи бол миний сайн найз» гэж байна. 是 нь «бол» гэсэн утгатай.",
  "teacher_notes":"我 (би), 你 (чи) нь өмнөх хичээлд гарсан. 的-г «миний» гэж нэг жишээгээр л танилцуулна.",
  "examples":[ex("我是艾玛。","Wǒ shì Àimǎ.","Би Ай Ма."),ex("你好，我是艾玛。","Nǐ hǎo, wǒ shì Àimǎ.","Сайн уу, би Ай Ма."),ex("你是我的好朋友。","Nǐ shì wǒ de hǎo péngyou.","Чи бол миний сайн найз."),ex("我认识他，他是迈克尔·杰克逊。","Wǒ rènshi tā, tā shì Màikè'ěr Jiékèxùn.","Би түүнийг мэднэ, тэр бол Майкл Жексон.")],
  "common_mistakes":[{"wrong":"我艾玛。","right":"我是艾玛。","why":"Нэрийн өмнө 是 хэлнэ."}],
  "check":chk("«Би Ай Ма» хятадаар аль нь вэ?",["我是艾玛。","他是艾玛。","你是谁？"],"我是艾玛。","g3c"),
  "exercises":[
   choice("你好，我________艾玛。",["是","谁","哪"],"是","Зөв! 我是…… = би ….","谁 = хэн, 哪 = аль. Энд «бол» буюу 是 хэрэгтэй.","g3e1"),
   judge("«她是章子怡» гэдэг нь «Тэр (эмэгтэй) бол Жан Цзы-и».",True,"Зөв!","她 = тэр (эмэгтэй), 是 = бол."),
   choice("«你是我的好朋友» гэдэг нь юу вэ?",["Чи бол миний сайн найз","Чи хэн бэ","Баяртай"],"Чи бол миний сайн найз","Зөв!","是 = бол, 好朋友 = сайн найз.","g3e3")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«谁» гэж юу вэ?",["хэн","аль","хүн","улс"],"хэн","谁 (shéi) = хэн.","easy",["vocabulary"],"a1")
q("choice","«他» гэж юу вэ?",["тэр (эрэгтэй)","чи","багш","хэн"],"тэр (эрэгтэй)","他 (tā) = тэр.","easy",["vocabulary"],"a2")
q("choice","«是» гэж юу вэ?",["бол","хүн","сайн","баяртай"],"бол","是 (shì) = бол, мөн.","easy",["vocabulary"],"a3")
q("choice","«哪» гэж юу вэ?",["аль","хэн","тэр","улс"],"аль","哪 (nǎ) = аль.","easy",["vocabulary"],"a4")
q("choice","«国» гэж юу вэ?",["улс","хүн","багш","чи"],"улс","国 (guó) = улс.","easy",["vocabulary"],"a5")
q("choice","«人» гэж юу вэ?",["хүн","улс","тэр","хэн"],"хүн","人 (rén) = хүн.","easy",["vocabulary"],"a6")
q("choice","«中国人» гэж юу вэ?",["хятад хүн","хятад хэл","багш","найз"],"хятад хүн","中国 = Хятад, 人 = хүн.","easy",["vocabulary"],"a7")
q("choice","«Хэн» хятадаар аль нь вэ?",["谁","哪","他","是"],"谁","хэн = 谁 (shéi).","easy",["vocabulary"],"a8")
q("choice","«Хүн» хятадаар аль нь вэ?",["人","国","他","你"],"人","хүн = 人 (rén).","easy",["vocabulary"],"a9")
q("choice","«Хятад хүн» хятадаар аль нь вэ?",["中国人","哪国人","老师","你好"],"中国人","хятад хүн = 中国人 (Zhōngguó rén).","easy",["vocabulary"],"a10")
q("choice","Пиньинь «shéi» гэж уншдаг ханз:",["谁","是","人","哪"],"谁","谁 = shéi = хэн. 是 = shì.","medium",["pronunciation"],"b1")
q("choice","Пиньинь «shì» гэж уншдаг ханз:",["是","谁","他","国"],"是","是 = shì = бол.","medium",["pronunciation"],"b2")
q("choice","Пиньинь «Zhōngguó rén» гэж уншдаг үг:",["中国人","你好","再见","老师"],"中国人","中国人 = хятад хүн.","easy",["pronunciation"],"b3")
q("choice","Пиньинь «nǎ» гэж уншдаг ханз:",["哪","国","人","他"],"哪","哪 (nǎ) = аль.","medium",["pronunciation"],"b4")
q("choice","Пиньинь «guó» гэж уншдаг ханз:",["国","人","他","是"],"国","国 (guó) = улс.","medium",["pronunciation"],"b5")
q("cloze","他是（ ）？ — 他是成龙。",["谁","哪","人","国"],"谁","Нэрийг асууж байна — 谁 (хэн).","easy",["dialogue"],"c1")
q("cloze","成龙是（ ）国人？ — 中国人。",["哪","谁","他","是"],"哪","哪国人 = аль улсын хүн.","easy",["dialogue"],"c2")
q("cloze","他是（ ）国人。",["中","你","老","好"],"中","他是中国人 — тэр хятад хүн.","medium",["dialogue"],"c3")
q("cloze","你好，我（ ）艾玛。",["是","谁","哪","他"],"是","我是艾玛 = би Ай Ма.","medium",["dialogue"],"c4")
q("choice","Охин «他是谁？» гэж асуулаа. Ээж нь юу гэж хариулав?",["他是成龙。","再见！","老师好！","一、二、三！"],"他是成龙。","Нэрээр хариулна: 他是成龙.","easy",["dialogue"],"d1")
q("choice","«成龙是哪国人？» — зөв хариу:",["中国人。","他是谁？","你好！","再见！"],"中国人。","Чэн Лун хятад хүн.","easy",["dialogue"],"d2")
q("usage","«Тэр хэн бэ?» гэж асуухдаа:",["他是谁？","他是中国人。","成龙是哪国人？","再见！"],"他是谁？","Хэн болохыг асуухад 他是谁？","easy",["usage"],"e1")
q("usage","«Аль улсын хүн бэ?» гэж асуухдаа:",["哪国人？","他是谁？","你好吗？","再见！"],"哪国人？","哪国人 — аль улсын хүн.","easy",["usage"],"e2")
q("usage","Зураг авахуулахдаа хятад хүүхдүүд юу гэж хашгирдаг вэ?",["茄子！","再见！","你好！","谁！"],"茄子！","一、二、三，茄子！ — «цээнзэ!»","medium",["usage"],"e3")
q("usage","Охин найзаа заагаад «Тэр бол Саруул» гэж хэлэхдээ ямар үгээр эхлэх вэ?",["她是……","谁是……","哪是……","国是……"],"她是……","Эмэгтэйг 她是…… гэж танилцуулна.","medium",["usage"],"e4")
q("choice","«你好» гэж юу вэ?",["сайн уу","баяртай","хэн","хятад хүн"],"сайн уу","你好 = сайн уу (1-р хичээл).","easy",["review"],"f1")
q("choice","«老师» гэж юу вэ?",["багш","найз","хятад хүн","хэн"],"багш","老师 = багш (1-р хичээл).","easy",["review"],"f2")
q("choice","Дуунд «你是我的好朋友» гэдэг нь:",["Чи бол миний сайн найз","Чи хэн бэ","Тэр хятад хүн","Баяртай"],"Чи бол миний сайн найз","是 = бол, 好朋友 = сайн найз.","medium",["song"],"g1")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"listening","instruction_mn":"Сонсох — Аудио (03-05) сонсоод зөв зургийг сонго (A/B/C).","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）人","question_mn":"1-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t1a"),img("t1b"),img("t1c")],"answer":"A","script_zh":"人","explanation_mn":"Аудионд «人 (rén) — хүн» гэж хэлнэ. A зураг дээр хүү (хүн) байна. B — муур, C — туулай, тэд хүн биш."},
    {"n":2,"question_zh":"（听录音）中国人","question_mn":"2-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t2a"),img("t2b"),img("t2c")],"answer":"B","script_zh":"中国人","explanation_mn":"«中国人 — хятад хүн». B зураг дээр хятад хувцастай хятад охин байна. A — цайвар үстэй гадаад охин, C — гадаад эмэгтэй."},
    {"n":3,"question_zh":"（听录音）他很高兴。","question_mn":"3-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t3a"),img("t3b"),img("t3c")],"answer":"C","script_zh":"他很高兴。","explanation_mn":"«他很高兴 — Тэр баяртай байна». «他» нь эрэгтэй хүүхэд. C зураг дээр хүү улаан загас барьж баярлан инээж байна. A — гурван хүнтэй гэр бүл (нэг «тэр» гэж заахгүй), B — охин (她), тэр гунигтай байна."}],
   "answer_source":"Test Answers х.63: 1.A 2.B 3.C; Listening script х.61"},
  {"part":2,"type":"judge","instruction_mn":"Унших — Зураг ба үг таарч байвал ✓, таарахгүй бол ✗.","items":[
    {"n":4,"question_zh":"二","image":img("t4"),"answer":"✓","explanation_mn":"Зураг дээр хоёр гүзээлзгэнэ байна — хоёр бол 二 → ✓."},
    {"n":5,"question_zh":"他","image":img("t5"),"answer":"✗","explanation_mn":"Зураг дээр эмэгтэй хүн байна. 他 нь эрэгтэй хүнийг хэлнэ → ✗."},
    {"n":6,"question_zh":"中国","image":img("t6"),"answer":"✗","explanation_mn":"Зураг дээр Хятадын улаан туг, Их хэрэм байна. Номын хариу ✗ байгаа тул ✗ гэж тэмдэглэнэ (багшаасаа асуугаарай)."}],
   "answer_source":"Test Answers х.63: 4.✓ 5.✗ 6.✗ (6-р асуулт зурагтай зөрөх мэт харагдана — номын хариуг хэрэглэв)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичих дасгал — «他是谁？» гэж асуугаад «他是……» гэж хариулсан хоёр өгүүлбэрийг ханзаар хуулж бич.","question_zh":"他是谁？他是成龙。","answer":"他是谁？他是成龙。","explanation_mn":"Эхлээд асуулт, дараа нь нэрээр хариулна."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Let's guess · Хосоороо: зургийг заагаад асуу, хариул.","question_zh":"他/她是谁？ 他/她是哪国人？","answer":"他是……。 他是中国人。","explanation_mn":"Хүнийг заагаад асууж, нэр, улсыг хариулна."},
   {"n":2,"prompt_mn":"Бүлгээрээ найзуудаа танилцуул.","question_zh":"他/她是……，他/她是……国人。","answer":"她是……，她是中国人。","explanation_mn":"Нэр, улсаа хэлнэ."},
   {"n":3,"prompt_mn":"«找朋友» дууг гараа таших хэрэгтэй дуул. Дараа нь гэрийнхэндээ дуулж өг.","question_zh":"找呀找呀找朋友……","answer":"(нээлттэй)","explanation_mn":"Аудио 03-03-ын хамт. Найзынхаа нэр, улсаар сольж дуул."},
   {"n":4,"prompt_mn":"Мини түүхийг уншаад жүжигчилж тогло.","question_zh":"妈妈，她是谁？","answer":"(нээлттэй)","explanation_mn":"Аудио 03-04-ийн хамт."}]},
 "answerSource":"YCT 标准教程 1 · х.61 Test Listening Scripts, х.63 Test Answers (Lesson 3)"}
dump("workbook.json", workbook)

# ---------------- IMAGES / LESSON / MANIFEST ----------------
prompts = json.load(open(f"{BASE}/image_prompts.json", encoding="utf-8"))
images = []
for p in prompts:
    images.append({"id":os.path.splitext(os.path.basename(p["file"]))[0],"file":p["file"],"title":p["title"],"role":p.get("role","illustration"),"section":p["section"]})
tests = ["1a","1b","1c","2a","2b","2c","3a","3b","3c","4","5","6"]
images += [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in tests]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 3-р хичээл — Тэр хэн бэ?","chineseTitle":"他是谁？","targetTitle":"他是谁？","mongolianTitle":"Тэр хэн бэ?",
 "subtitle":"他是谁？ · 哪国人 · 中国人 · «找朋友» дуу · мини түүх",
 "description":"Хүнийг танилцуулах (他是……), аль улсын хүн гэж асуух (哪国人), хятад хүн (中国人). 7 үг, 3 зурагт яриа, 1 дуу, 3 түлхүүр өгүүлбэр, 28 шалгалтын асуулт, номын тест (сонсох 3 + унших 3) — албан аудио, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🧑","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第3课《他是谁？》 [hskLevel=1] [lessonNumber=3]; х.9–13, х.61, х.63; CD 03-01…03-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"他是谁？","mongolianTitle":"Тэр хэн бэ?",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第3课 (сурах бичиг + CD аудио 03-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers х.63); 6-р асуулт зурагтай зөрөх мэт","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан)"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"song lines",len(song_lines),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
