#!/usr/bin/env python3
"""YCT 标准教程 1 · 第10课 现在几点？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, shutil, subprocess
BASE = "/home/claude/work/yct1/l10"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-1", "yct-1-l10", 10
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

# ---------------- AUDIO ----------------
AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_SONG, AUD_TEST = ("audio/yct-1-10-words.mp3","audio/yct-1-10-text.mp3","audio/yct-1-10-story.mp3","audio/yct-1-10-song.mp3","audio/yct-1-10-test.mp3")
AUD_MAIN = "audio/yct-1-10-text-song.mp3"
for src, dst in [("01",AUD_WORDS),("02",AUD_TEXT),("03",AUD_STORY),("04",AUD_SONG),("05",AUD_TEST)]:
    if not os.path.exists(f"{OUT}/{dst}"):
        shutil.copy(f"{OUT}/audio/yct-1-10-{src}.mp3", f"{OUT}/{dst}")
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"/tmp/l10_concat.txt"
    open(lst,"w").write(f"file '{OUT}/{AUD_TEXT}'\nfile '{OUT}/{AUD_SONG}'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)

# ---------------- IMAGE CROPS (номын хуудаснаас; хуудас 150dpi) ----------------
try:
    from PIL import Image
    _p = Image.open(f"{BASE}/pages/hi-46.png").convert("RGB")
    for _k, _cy in enumerate([875, 1080, 1285], 1):
        _p.crop((135, _cy-108, 345, _cy+108)).save(f"{OUT}/images/clock{_k}.png")
    Image.open(f"{BASE}/pages/hi-50.png").convert("RGB").crop((265, 1283, 555, 1410)).save(f"{OUT}/images/t6.png")
except Exception as _e:
    print("crop skipped:", _e)

# ---------------- VOCAB ----------------
VOCAB = [
 ("现在","xiànzài","одоо","цаг хугацаа · гол үг","现在几点？","Xiànzài jǐdiǎn?","Одоо хэдэн цаг болж байна?",True),
 ("几点","jǐdiǎn","хэдэн цаг","асуулт · гол үг","明天几点见？","Míngtiān jǐdiǎn jiàn?","Маргааш хэдэн цагт уулзах вэ?",True),
 ("点","diǎn","цаг","цаг хэлэх үг · гол үг","五点。","Wǔ diǎn.","5 цаг.",True),
 ("分","fēn","минут","минутыг хэлэх үг","一点十分。","Yī diǎn shí fēn.","1 цаг 10 минут.",False),
 ("见","jiàn","уулзах","үйлдэл","明天五点见。","Míngtiān wǔ diǎn jiàn.","Маргааш 5 цагт уулзъя.",False),
 ("早上","zǎoshang","өглөө","цаг хугацаа","早上五点。","Zǎoshang wǔ diǎn.","Өглөө 5 цаг.",False),
 ("太早了","tài zǎo le","хэтэрхий эрт байна","хэллэг","太早了！","Tài zǎo le!","Хэтэрхий эрт байна шүү!",False),
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
 {"id":1,"title_mn":"Яриа 1 · Гэртээ, цаг хэд болсон бэ?","scene_mn":"Хүү гар цагаа хараад ээжээсээ цаг асууна. Ээж гал тогоонд аяга таваг угааж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"妈妈，现在几点？","pinyin":"Māma, xiànzài jǐdiǎn?","mn":"Ээж ээ, одоо хэдэн цаг болж байна?"},
           {"speaker":"妈妈","zh":"十一点十分。","pinyin":"Shíyī diǎn shí fēn.","mn":"11 цаг 10 минут."}]},
 {"id":2,"title_mn":"Яриа 2 · Маргааш хэдэн цагт уулзах вэ?","scene_mn":"Хөлбөмбөгийн хувцастай хүүхдүүд тоглох цагаа тохирч байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"明天几点见？","pinyin":"Míngtiān jǐdiǎn jiàn?","mn":"Маргааш хэдэн цагт уулзах вэ?"},
           {"speaker":"大卫","zh":"早上五点。","pinyin":"Zǎoshang wǔ diǎn.","mn":"Өглөө 5 цагт."},
           {"speaker":"小明","zh":"太早了！","pinyin":"Tài zǎo le!","mn":"Хэтэрхий эрт байна шүү!"}]},
]
song_lines = [
 ("现在几点？","Xiànzài jǐ diǎn?","Одоо хэдэн цаг болж байна?","现在|xiànzài 几点|jǐdiǎn ？|"),
 ("现在几点？现在几点？","Xiànzài jǐ diǎn? Xiànzài jǐ diǎn?","Одоо хэдэн цаг? Одоо хэдэн цаг?","现在|xiànzài 几点|jǐdiǎn ？| 现在|xiànzài 几点|jǐdiǎn ？|"),
 ("现在一点，一一一。","Xiànzài yī diǎn, yī yī yī.","Одоо 1 цаг, нэг нэг нэг.","现在|xiànzài 一|yī 点|diǎn ，| 一|yī 一|yī 一|yī 。|"),
 ("现在几点？现在几点？","Xiànzài jǐ diǎn? Xiànzài jǐ diǎn?","Одоо хэдэн цаг? Одоо хэдэн цаг?","现在|xiànzài 几点|jǐdiǎn ？| 现在|xiànzài 几点|jǐdiǎn ？|"),
 ("现在三点，三三三。","Xiànzài sān diǎn, sān sān sān.","Одоо 3 цаг, гурав гурав гурав.","现在|xiànzài 三|sān 点|diǎn ，| 三|sān 三|sān 三|sān 。|"),
]
sentences=[]
dlg_lines=[
 (1,"小明：妈妈，现在几点？","小明: Māma, xiànzài jǐdiǎn?","Сяо Мин: Ээж ээ, одоо хэдэн цаг болж байна?","小明：| 妈妈|māma ，| 现在|xiànzài 几点|jǐdiǎn ？|","现在几点？ — цаг асууж байна. 几点 = «хэдэн цаг». Хариулахдаа тоогоо хэлээд 点 гэж залгана.",["现在几点？"]),
 (1,"妈妈：十一点十分。","妈妈: Shíyī diǎn shí fēn.","Ээж: 11 цаг 10 минут.","妈妈：| 十一|shíyī 点|diǎn 十|shí 分|fēn 。|","十一点十分 — 11 цаг 10 минут. 点 = цаг, 分 = минут.",["点"]),
 (2,"小明：明天几点见？","小明: Míngtiān jǐdiǎn jiàn?","Сяо Мин: Маргааш хэдэн цагт уулзах вэ?","小明：| 明天|míngtiān 几点|jǐdiǎn 见|jiàn ？|","明天几点见？ — «Маргааш хэдэн цагт уулзах вэ?» 见 = уулзах.",["明天五点见"]),
 (2,"大卫：早上五点。","大卫: Zǎoshang wǔ diǎn.","Дэвид: Өглөө 5 цагт.","大卫：| 早上|zǎoshang 五|wǔ 点|diǎn 。|","早上 = өглөө. Өглөө 5 цаг.",[]),
 (2,"小明：太早了！","小明: Tài zǎo le!","Сяо Мин: Хэтэрхий эрт байна шүү!","小明：| 太早了|tài zǎo le ！|","太早了！ — «Хэтэрхий эрт байна!» Эрт босох гэхээр хүүхэд бүр хэлмээр санагдана.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg_lines:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note; s["key_structures"]=ks
    sentences.append(s)
for i,(zh,py,mn,tk) in enumerate(song_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="现在几点？ — дууны нэр бөгөөд гол асуулт. Хамт дуулахдаа хуруугаа цаг шиг эргүүл."; s["key_structures"]=["现在几点？"]
    if i==2: s["note"]="现在一点 — «Одоо 1 цаг». 一一一 нь ая зохиохын тулд тоог давтсан, зүгээр л «нэг нэг нэг»."; s["key_structures"]=["点"]
    sentences.append(s)

texts = {
 "unit":{"number":"10","title":"现在几点？","mongolianTitle":"Одоо хэдэн цаг болж байна? — цаг хэлэх, цагтаа уулзах"},
 "lessonIntro":{
  "teacher_mn":"Сайн байна уу, хүүхдүүд ээ! Чи өглөө хэдэн цагт сэрдэг вэ? Сургуульдаа хэдэн цагт очдог вэ? Өнөөдөр бид хятадаар цаг хэлж сурна. «Одоо хэдэн цаг болж байна?» гэдгийг «现在几点？» гэж асууна. Хариулахдаа тоогоо хэлээд «点» гэж залгахад л болно, жишээ нь «五点» — 5 цаг. Найздаа «Маргааш 5 цагт уулзъя!» гэж хэлэх нь ч амархан. Мөн бид хуруугаараа цагийн зүү болж, «Би цаг» тоглоом тоглоно. Дугуйлан дуулж, дэлхийн өөр өөр хотод одоо хэдэн цаг болж байгааг ч мэднэ. Эхэлцгээе!",
  "warmup_mn":"Чи өглөө хэдэн цагт босдог вэ? Гар цагаа харж, одоо хэдэн цаг болж байгааг гэр бүлийнхэндээ хэлж үзээрэй. Хоёр гараараа цагийн зүү шиг дүрсэлж чадах уу?",
  "theme_zh":"现在几点？ · 点 · 分 · 早上","theme_mn":"Цаг асуух · цаг хэлэх · цагтаа уулзах"},
 "warmup":{"mongolian":"Чи өглөө хэдэн цагт босдог вэ? Одоо хэдэн цаг болж байна?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"10","title":"现在几点？","mongolianTitle":"Одоо хэдэн цаг болж байна? — яриа ба дуу","title_mn":"Let's read · 2 яриа + Let's sing · 现在几点？ (дуу)","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第10课 Let's read / Let's sing（CD 10-02, 10-04）","author_zh":"",
  "intro_zh":"两段小对话：现在几点？明天几点见？然后一起唱“现在几点？”。","intro_mn":"Эхлээд хоёр богино яриа: хүү ээжээсээ цаг асууна, дараа нь найзууд маргаашийн уулзах цагаа тохирно. Дараа нь «现在几点？» дуу. Дуулахдаа хуруугаараа цагийн зүү болж 1 цаг, 3 цагийг үзүүлээрэй!",
  "sentences":sentences,
  "paragraph_summaries":[{"paragraph":1,"mn":"Яриа 1 — Сяо Мин ээжээсээ «现在几点？» гэж асууж, ээж «十一点十分» (11 цаг 10 минут) гэж хариулна."},{"paragraph":2,"mn":"Яриа 2 — Найзууд маргааш хэдэн цагт уулзахаа тохирно. Өглөө 5 цаг гэхэд Сяо Мин «太早了！» гэнэ."},{"paragraph":3,"mn":"Дуу «现在几点？» — «одоо хэдэн цаг?» гэж асуугаад «одоо 1 цаг», «одоо 3 цаг» гэж хариулдаг дуу. Дугуйлан зогсож, гар барьж дуул."}],
  "reflection":{"questions_mn":["Хятадаар «одоо хэдэн цаг болж байна?» гэж яаж асуух вэ?","Найздаа «маргааш 5 цагт уулзъя» гэж хэлж чадах уу?","Чи өглөө хэдэн цагт босдог вэ? «太早了» гэж хэлмээр байна уу?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Цаг асуух, цаг хэлэх","zh":"现在几点？现在五点。","pinyin":"Xiànzài jǐ diǎn? Xiànzài wǔ diǎn.","mn":"Одоо хэдэн цаг болж байна? Одоо 5 цаг."},
  "writingPrompt_mn":"Найзтайгаа хос болж асуулт, хариулт хий: нэг нь «现在几点？» гэж асууна, нөгөө нь гар цагаа хараад «…点» гэж хариулна. Дараа нь «明天几点见？» гэж тохиръё!"},
 "properNouns":[{"zh":"小明","pinyin":"Xiǎo Míng","mn":"Сяо Мин"},{"zh":"大卫","pinyin":"Dàwèi","mn":"Дэвид"}],
 "wordExplanation":[
  {"word":"几点","gloss":"jǐdiǎn — хэдэн цаг","explanation":"几 = хэд, 点 = цаг. «现在几点？» гэвэл «Одоо хэдэн цаг болж байна?» гэсэн үг. Хариулахдаа 几-ийн оронд тоогоо тавина: 五点 (5 цаг), 十二点 (12 цаг).",
   "structure":"现在几点？ → 现在 + тоо + 点。","teacher_notes":"几 (хэд) нь 5-р хичээлд «几岁» (хэдтэй вэ) гэж гарсан. Хүүхдэд «аль тоогоор солих вэ?» гэж асуугаад гар цагаар жишээ үзүүл. Дүрмийн нэр томьёо хэрэглэхгүй.",
   "examples":[{"chinese":"现在几点？","pinyin":"Xiànzài jǐdiǎn?","mongolian":"Одоо хэдэн цаг болж байна?"},{"chinese":"现在五点。","pinyin":"Xiànzài wǔ diǎn.","mongolian":"Одоо 5 цаг."},{"chinese":"明天几点见？","pinyin":"Míngtiān jǐdiǎn jiàn?","mongolian":"Маргааш хэдэн цагт уулзах вэ?"}],
   "common_mistakes":[{"wrong":"现在五？","right":"现在五点。","why":"Тооны ард 点 (цаг) заавал хэлнэ."}],
   "check":{"question":"«Одоо хэдэн цаг вэ?» хятадаар аль нь вэ?","options":["现在几点？","明天见！","太早了！"],"answer":"0"},
   "practice":[{"n":1,"question":"现在________？ (Хэдэн цаг вэ гэж асуу)","answer":"几点","explanation_mn":"几点 = хэдэн цаг."}]},
  {"word":"太早了","gloss":"tài zǎo le — хэтэрхий эрт байна","explanation":"早 = эрт, 太…了 = «хэтэрхий». Өглөө 5 цагт уулзъя гэвэл «太早了！» гэж хэлнэ. Эрт сэрээд нойр хүрээгүй үед чинь хэлэхэд тохиромжтой!",
   "structure":"太早了！ · 早上五点，太早了！","teacher_notes":"太…了 бүтцийг энд бүхэл хэллэг болгон л цээжлүүл; бусад үгтэй хослуулахыг дараа нь заана.",
   "examples":[{"chinese":"太早了！","pinyin":"Tài zǎo le!","mongolian":"Хэтэрхий эрт байна шүү!"},{"chinese":"早上五点。","pinyin":"Zǎoshang wǔ diǎn.","mongolian":"Өглөө 5 цаг."},{"chinese":"早上五点，太早了！","pinyin":"Zǎoshang wǔ diǎn, tài zǎo le!","mongolian":"Өглөө 5 цаг гэнэ ээ, хэтэрхий эрт байна шүү!"}],
   "common_mistakes":[{"wrong":"太早！","right":"太早了！","why":"Төгсгөлд нь 了 хэлж «太早了» гэж бүтнээр хэлнэ."}],
   "check":{"question":"Найз чинь «Өглөө 5 цагт уулзъя» гэвэл чи юу гэх вэ?","options":["太早了！","你好！","再见！"],"answer":"0"},
   "practice":[{"n":1,"question":"早上五点，________！","answer":"太早了","explanation_mn":"Өглөө 5 цаг бол хэтэрхий эрт тул 太早了."}]},
 ],
 "collocations":[{"type":"点 / 分 — цаг ба минут","rows":[
   {"head":"五","with":"点","mn":"5 цаг","usage_mn":"Яг цаг хэлэхэд","example":{"zh":"现在五点。","pinyin":"Xiànzài wǔ diǎn.","mn":"Одоо 5 цаг."}},
   {"head":"一点十","with":"分","mn":"1 цаг 10 минут","usage_mn":"Минуттай цаг хэлэхэд","example":{"zh":"现在一点十分。","pinyin":"Xiànzài yī diǎn shí fēn.","mn":"Одоо 1 цаг 10 минут."}},
   {"head":"早上","with":"五点","mn":"өглөөний 5 цаг","usage_mn":"Өглөө гэж тодруулахад","example":{"zh":"早上五点。","pinyin":"Zǎoshang wǔ diǎn.","mn":"Өглөө 5 цаг."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Доорх үгээс сонгож хоосон зайг бөглө.","banks":[{"words":["现在","点","早上","太早了"],"items":[
     {"n":1,"question":"________几点？","answer":"现在","explanation_mn":"现在几点？ — «Одоо хэдэн цаг болж байна?»"},
     {"n":2,"question":"五________。","answer":"点","explanation_mn":"Цаг хэлэхдээ тооны ард 点 залгана."},
     {"n":3,"question":"________五点，太早了！","answer":"早上","explanation_mn":"早上 = өглөө. Өглөө 5 цаг."},
     {"n":4,"question":"早上五点，________！","answer":"太早了","explanation_mn":"Өглөө 5 цагт уулзахад «хэтэрхий эрт» гэж хэлнэ."}]}],
   "answer_source":"textbook-based (Let's read, х.45)"},
  "comprehension":{"instruction_mn":"Let's read — зургийг хараад асуултад хариул.","items":[
     {"n":1,"question_zh":"现在几点？","answer":"十一点十分。","explanation_mn":"Ээж «十一点十分» гэж хариулна — 11 цаг 10 минут."},
     {"n":2,"question_zh":"明天几点见？","answer":"早上五点。","explanation_mn":"Найз нь «早上五点» гэж хариулна — өглөө 5 цаг."},
     {"n":3,"question_zh":"早上五点，怎么样？","answer":"太早了！","explanation_mn":"Хүү «太早了» гэнэ — хэтэрхий эрт гэсэн үг."}],
   "answer_source":"textbook_verified (х.45 Question)"},
  "retell":{"instruction_mn":"Гэр бүл, найзтайгаа тоглоод үз! Хэрэгтэй зүйл: гар цаг эсвэл цаасан цаг.","prompts":[
     {"label":"Би цаг","start_zh":"我是钟表！","text_mn":"«Би цаг» тоглоом: нэг хүн урд зогсоод хоёр гараараа цагийн урт, богино зүү болно. Багш (эсвэл ээж) нэг цаг хэлнэ, жишээ нь «五点». Чи гараараа 5 цагийг үзүүлнэ. Бусад нь «现在几点？» гэж асууж, хариулж таана."},
     {"label":"Хосоороо цаг хэл","start_zh":"现在几点？","text_mn":"Нэг нь цаг хэлнэ, нөгөө нь тухайн цагийг цагийн зураг дээр заана: 1:00, 4:15, 5:00, 5:40, 7:20, 8:45, 10:50, 11:58. Дараа нь солино."},
     {"label":"Маргааш хэдэн цагт уулзах вэ?","start_zh":"明天几点见？","text_mn":"Найздаа «明天几点见？» гэж асуу. Тэр «早上五点» гэвэл «太早了！» гэж хэл. Хоёулаа тохирсон цагтаа хүрээд ир!"},
     {"label":"Хоосон зай бөглө","start_zh":"现在__点__。","text_mn":"Дэвтэртээ бичнэ: 现在__点__ (одоо хэдэн цаг хэдэн минут), 我__点去学校 (би хэдэн цагт сургуульдаа явдаг), 我早上__点起床 (би өглөө хэдэн цагт босдог). Өөрийнхөө жинхэнэ цагийг нөхөөрэй."}]}},
 "grammarNotes":[],
 "culture":{"title":"世界上的时间","title_mn":"Дэлхийн өөр өөр хотод цаг хэд болж байна?","text_mn":"Шинэ жилийн босгон дээр Нью-Йорк хотод хүмүүс цугларч, 12 цаг болохыг чангаар тоолдог. Яг тэр мөчид Бээжинд өдрийн 1 цаг болж, хүүхдүүд өдрийн хоолоо идэж байдаг. Сидней хотод орой 4 цаг болж, хүүхдүүд майханд амарч байна! Дэлхий том тул газар бүр өөр цагтай. Бээжин, Улаанбаатар хоёрын цаг адилхан, тиймээс Монгол найзтайгаа «现在几点？» гэж асуувал хоёулаа нэг хариулт хэлнэ.","note_mn":"Номын 46-р хуудасны Mini story зургийг хараад Нью-Йорк, Бээжин, Сидней хотын цагийг хэлж үзээрэй."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — цаг асуух, цаг хэлэх, цагтаа уулзах.","topic":"Хятадаар цагаа тохиръё!","discussion":["Хосоороо: нэг нь «现在几点？» гэж асууна, нөгөө нь гар цагаа хараад хариулна.","Найзуудтайгаа «明天几点见？» гэж ээлжлэн асууж, цаг тохиро. «Хэтэрхий эрт» бол «太早了！» гэж хэл."],
   "writing":{"promptChinese":"现在几点？明天几点见？","promptMongolian":"Гэрийн даалгавар: гэр бүлийнхэнтэйгээ «现在几点？» гэж асуугаад хариулаарай. Маргааш найзтайгаа хэдэн цагт тоглохоо хятадаар тохиро.","minChars":"0","requiredWords":["现在","点"],"sampleChinese":"现在五点。明天五点见。","sampleMongolian":"Одоо 5 цаг. Маргааш 5 цагт уулзъя.","gradingRubric":"Цагаа зөв хэлсэн эсэх, чанга тод дуудсан эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L10 1.C 2.B 3.A 4.D 5.A 6.C 7.B","parts":[]},
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
 {"point":"现在几点？ — цаг асуух","gloss_mn":"«Одоо хэдэн цаг болж байна?» — цаг асууж, тоогоо хэлээд «点» гэж хариулна",
  "structure":"现在几点？  →  现在 + тоо + 点。",
  "teacher_mn":"Гар цагаа хараад «现在几点？» гэж асуугаарай. 几点 гэдэг нь «хэдэн цаг» гэсэн үг. Хариулахдаа 几-ийн оронд тоогоо хэлээд 点 гэж залгана. Жишээ нь «现在五点» — одоо 5 цаг. Минуттай бол 分 гэж нэмнэ: «一点十分» — 1 цаг 10 минут.",
  "teacher_notes":"几点 = «хэд + цаг». Тоонууд өмнөх хичээлүүдэд гарсан; 十一, 十二-ыг «арав нэг», «арав хоёр» гэж тайлбарла. Хүүхдэд цагны зураг үзүүлээд «яг хэд вэ?» гэж асуу. 12 нь 十二 (shí'èr).",
  "examples":[ex("现在几点？","Xiànzài jǐdiǎn?","Одоо хэдэн цаг болж байна?"),ex("十一点十分。","Shíyī diǎn shí fēn.","11 цаг 10 минут. (ээжийн хариулт)"),ex("现在一点，一一一。","Xiànzài yī diǎn, yī yī yī.","Одоо 1 цаг. (дуунаас)"),ex("现在三点，三三三。","Xiànzài sān diǎn, sān sān sān.","Одоо 3 цаг. (дуунаас)")],
  "common_mistakes":[{"wrong":"现在五？","right":"现在五点。","why":"Тооны ард 点 (цаг) хэлнэ."},{"wrong":"现在几？","right":"现在几点？","why":"Асуухдаа 几点 гэж хоёуланг нь хэл."}],
  "check":chk("Цаг асуухдаа юу гэж хэлэх вэ?",["现在几点？","你好吗？","太早了！"],"现在几点？","g1c"),
  "exercises":[
   choice("Найзаасаа цаг асуу: 现在________？",["几点","三点","早上"],"几点","Зөв! 几点 = хэдэн цаг.","Асуулт бол 几点, 三点 бол хариулт.","g1e1"),
   judge("«现在五点» гэдэг нь «Одоо 5 цаг» гэсэн үг.",True,"Зөв! 现在 = одоо, 五点 = 5 цаг.","五点 = 5 цаг, 现在 = одоо."),
   choice("Одоо 3 цаг. Яаж хэлэх вэ?",["现在三点","现在三分","现在见"],"现在三点","Зөв! Цагийг 点-ээр хэлнэ.","分 бол минут, 见 бол уулзах. Цаг бол 点.","g1e3")]},
 {"point":"明天五点见。— цагтаа уулзах","gloss_mn":"«Маргааш 5 цагт уулзъя» — цаг тохирох, «太早了» гэж хэлэх",
  "structure":"明天 + цаг + 见。  ·  明天几点见？",
  "teacher_mn":"Найзтайгаа уулзах цагаа тохирохдоо «明天几点见？» гэж асууна. Хариултыг «明天五点见» гэж хэлнэ — маргааш 5 цагт уулзъя. Өглөө гэж тодруулах бол 早上 гэнэ: «早上五点». Хэтэрхий эрт санагдвал «太早了！» гэж хэл.",
  "teacher_notes":"明天 (маргааш) 9-р хичээлд гарсан. 见 = уулзах (дараа нь 再见-д дахин гарна). 早上 = өглөө. 太早了 — бүхэл хэллэг болгон цээжлүүл.",
  "examples":[ex("明天几点见？","Míngtiān jǐdiǎn jiàn?","Маргааш хэдэн цагт уулзах вэ?"),ex("明天五点见。","Míngtiān wǔ diǎn jiàn.","Маргааш 5 цагт уулзъя."),ex("早上五点。","Zǎoshang wǔ diǎn.","Өглөө 5 цаг."),ex("太早了！","Tài zǎo le!","Хэтэрхий эрт байна шүү!")],
  "common_mistakes":[{"wrong":"五点明天见。","right":"明天五点见。","why":"Хэзээ гэдгээ эхэнд хэл: 明天 (маргааш), дараа нь цаг."}],
  "check":chk("Найз «Өглөө 5 цагт уулзъя» гэв. Чи «хэтэрхий эрт» гэж хэлмээр байна:",["太早了！","你好！","再见！"],"太早了！","g2c"),
  "exercises":[
   choice("«Маргааш хэдэн цагт уулзах вэ?»",["明天几点见？","现在几点？","早上五点。"],"明天几点见？","Зөв! 明天 = маргааш, 几点 = хэдэн цаг, 见 = уулзах.","现在几点 бол «одоо хэдэн цаг».","g2e1"),
   judge("早上 гэдэг нь «орой» гэсэн үг.",False,"Зөв — 早上 = өглөө.","早上 = өглөө."),
   choice("明天五点见。 = ________",["Маргааш 5 цагт уулзъя.","Одоо 5 цаг.","Өчигдөр 5 цагт тоглосон."],"Маргааш 5 цагт уулзъя.","Зөв!","明天 = маргааш. Одоо бол 现在.","g2e3")]},
 {"point":"点 · 分 — цаг ба минут","gloss_mn":"Цаг (点), минут (分) хэлэх",
  "structure":"тоо + 点  ·  тоо + 点 + тоо + 分",
  "teacher_mn":"Цагны богино зүү хэд дээр байна вэ? Тэр тоогоо хэлээд 点 гэнэ: 五点, 十二点. Урт зүү 12 дээр байвал яг цаг. Урт зүү өөр тоон дээр бол минутаа нэмж 分 гэж хэлнэ: «一点十分» — 1 цаг 10 минут. Цагтай хүүхдүүд хоёр гараараа тоглоцгооё!",
  "teacher_notes":"Энэ хичээлд минутыг тоо+分 хэлбэрээр л үзнэ (十分, 十一点十分). Хагас, дөрөвний нэг гэх мэт өөр хэлбэр одоохондоо хэрэггүй.",
  "examples":[ex("五点","Wǔ diǎn","5 цаг"),ex("十二点","Shí'èr diǎn","12 цаг"),ex("一点十分","Yī diǎn shí fēn","1 цаг 10 минут"),ex("十一点十分","Shíyī diǎn shí fēn","11 цаг 10 минут")],
  "common_mistakes":[{"wrong":"一分十点","right":"一点十分","why":"Эхлээд цаг (点), дараа нь минут (分)."},{"wrong":"十二分 = 12 цаг","right":"十二点 = 12 цаг","why":"点 = цаг, 分 = минут."}],
  "check":chk("«Минут» хятадаар аль нь вэ?",["分","点","见"],"分","g3c"),
  "exercises":[
   choice("«12 цаг» хятадаар:",["十二点","十二分","十点"],"十二点","Зөв! 十二 = 12, 点 = цаг.","分 = минут, 十 = 10.","g3e1"),
   choice("«1 цаг 10 минут»:",["一点十分","十点一分","一分十点"],"一点十分","Зөв! Эхлээд цаг, дараа минут.","Цаг (点) урд, минут (分) ард.","g3e2"),
   judge("«五点» гэдэг нь «5 минут» гэсэн үг.",False,"Зөв — 五点 = 5 цаг.","点 = цаг. 5 минут бол 五分.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«现在» гэж юу вэ?",["одоо","маргааш","өглөө","багш"],"одоо","现在 (xiànzài) = одоо.","easy",["vocabulary"],"a1")
q("choice","«点» (цаг) хятадаар аль нь вэ?",["点","分","见","早上"],"点","点 (diǎn) = цаг. 分 = минут.","easy",["vocabulary"],"a2")
q("choice","«分» гэж юу вэ?",["минут","цаг","өглөө","уулзах"],"минут","分 (fēn) = минут.","easy",["vocabulary"],"a3")
q("choice","«见» гэж юу вэ?",["уулзах","идэх","явах","унтах"],"уулзах","见 (jiàn) = уулзах.","easy",["vocabulary"],"a4")
q("choice","«早上» гэж юу вэ?",["өглөө","орой","шөнө","өнөөдөр"],"өглөө","早上 (zǎoshang) = өглөө.","easy",["vocabulary"],"a5")
q("choice","«太早了！» гэж ямар үед хэлэх вэ?",["Хэтэрхий эрт санагдахад","Баяртай гэхэд","Цаг асуухад","Мэндлэхэд"],"Хэтэрхий эрт санагдахад","太早了 = хэтэрхий эрт байна.","easy",["usage"],"a6")
q("choice","«Хэдэн цаг» хятадаар аль нь вэ?",["几点","现在","明天","早上"],"几点","几点 (jǐdiǎn) = хэдэн цаг.","easy",["vocabulary"],"a7")
q("choice","«Одоо хэдэн цаг болж байна?» хятадаар:",["现在几点？","明天几点见？","早上五点。","太早了！"],"现在几点？","现在 = одоо, 几点 = хэдэн цаг.","easy",["dialogue"],"a8")
q("choice","«Маргааш хэдэн цагт уулзах вэ?» хятадаар:",["明天几点见？","现在几点？","早上五点。","你几岁？"],"明天几点见？","明天 = маргааш, 见 = уулзах.","medium",["dialogue"],"a9")
q("choice","妈妈：十一点十分。 Хэдэн цаг вэ?",["11 цаг 10 минут","10 цаг 11 минут","1 цаг 10 минут","11 цаг"],"11 цаг 10 минут","十一点十分 — 11 цаг 10 минут.","medium",["dialogue"],"a10")
q("choice","Дэвид «早上五点» гэв. Хэдэн цаг вэ?",["Өглөө 5 цаг","Орой 5 цаг","Өглөө 3 цаг","Өглөө 1 цаг"],"Өглөө 5 цаг","早上 = өглөө, 五点 = 5 цаг.","easy",["dialogue"],"a11")
q("cloze","小明：现在几点？ 妈妈：（ ）。",["十一点十分","明天见","太早了","再见"],"十一点十分","Цаг асуувал цагаар хариулна.","easy",["dialogue"],"a12")
q("cloze","A：明天几点见？ B：早上五点。 A：（ ）！",["太早了","你好","三点","现在"],"太早了","Өглөө 5 цаг — хэтэрхий эрт тул 太早了.","medium",["dialogue"],"a13")
q("cloze","现在（ ）点？ — «Одоо хэдэн цаг?»",["几","三","五","见"],"几","几点 = хэдэн цаг.","easy",["structure"],"a14")
q("cloze","五（ ）。 — «5 цаг»",["点","分","见","了"],"点","Цагийг тооны ард 点 залгаж хэлнэ.","easy",["structure"],"a15")
q("cloze","一点十（ ）。 — «1 цаг 10 минут»",["分","点","见","早"],"分","Минутыг 分 гэнэ.","medium",["structure"],"a16")
for i,(z,p,m) in enumerate([("三点","sān diǎn","3 цаг"),("五点","wǔ diǎn","5 цаг"),("十二点","shí'èr diǎn","12 цаг"),("八点","bā diǎn","8 цаг")]):
    others=[x for x in ["3 цаг","5 цаг","12 цаг","8 цаг","7 цаг","10 цаг"] if x!=m][:3]
    q("choice",f"«{z}» ({p}) хэдэн цаг вэ?",[m]+others,m,f"{z} = {m}.","easy",["number"],"b%d"%i)
q("choice","«7 цаг» хятадаар аль нь вэ?",["七点","六点","九点","四点"],"七点","七 = 7, 点 = цаг.","easy",["number"],"a21")
q("choice","«4 цаг» хятадаар аль нь вэ?",["四点","十点","三点","五点"],"四点","四 = 4. 十 = 10 — андуурахгүй!","medium",["number"],"a22")
q("choice","Пиньинь «xiànzài» гэж уншдаг үг:",["现在","早上","明天","几点"],"现在","现在 = xiànzài = одоо.","easy",["pronunciation"],"a23")
q("choice","Пиньинь «zǎoshang» гэж уншдаг үг:",["早上","现在","分","点"],"早上","早上 = zǎoshang = өглөө.","easy",["pronunciation"],"a24")
q("choice","Пиньинь «jǐdiǎn» гэж уншдаг үг:",["几点","见","分","太早了"],"几点","几点 = jǐdiǎn = хэдэн цаг.","easy",["pronunciation"],"a25")
q("usage","Гар цагаа хараад ээжээсээ цаг асуу:",["妈妈，现在几点？","妈妈，再见！","妈妈，太早了！","妈妈，五个人。"],"妈妈，现在几点？","Цаг асуухдаа 现在几点？.","medium",["usage"],"a26")
q("usage","Найзаа маргааш 5 цагт уулзахыг хүсвэл:",["明天五点见。","现在五点。","五分。","早上好。"],"明天五点见。","明天 + цаг + 见 = маргааш … цагт уулзъя.","medium",["usage"],"a27")
q("usage","1 цаг 10 минутыг хятадаар яаж хэлэх вэ?",["一点十分","十点一分","十分一点","一分十点"],"一点十分","Эхлээд цаг (点), дараа минут (分).","medium",["usage"],"a28")
q("choice","Өглөө 5 цагт уулзъя гэвэл «хэтэрхий эрт байна» гэж яаж хэлэх вэ?",["太早了！","现在几点？","明天见！","三点。"],"太早了！","太早了 = хэтэрхий эрт байна.","medium",["usage"],"a29")
dump("quiz.json", Q)

# ---------------- WORKBOOK (Test) ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"listening","instruction_mn":"Сонсох — Аудио (10-05) сонсоод зөв цаг, огноог сонго (A/B/C).","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）四点","question_mn":"1-р асуулт: сонсоод зөв цагийг сонго","options":["A","B","C"],"optionImages":[img("t1a"),img("t1b"),img("t1c")],"answer":"C","script_zh":"四点","explanation_mn":"Аудионд «四点 — 4 цаг» гэнэ. C цагны богино зүү 4 дээр, урт зүү 12 дээр байна. A, B цагийн зүү өөр газар заана."},
    {"n":2,"question_zh":"（听录音）七点","question_mn":"2-р асуулт: сонсоод зөв цагийг сонго","options":["A","B","C"],"optionImages":[img("t2a"),img("t2b"),img("t2c")],"answer":"B","script_zh":"七点","explanation_mn":"«七点 — 7 цаг». Хөх сэрүүлэгт богино зүү 7 дээр, урт зүү 12 дээр байна (B). A, C-ийн зүү өөр тоон дээр."},
    {"n":3,"question_zh":"（听录音）十四号","question_mn":"3-р асуулт: сонсоод зөв хуанлийн хуудсыг сонго","options":["A","B","C"],"optionImages":[img("t3a"),img("t3b"),img("t3c")],"answer":"A","script_zh":"十四号","explanation_mn":"«十四号 — 14-ний өдөр». A хуудсан дээр «14» гэж бичсэн. B дээр 21, C дээр 4 байна."}],
   "answer_source":"Test Answers х.63: 1.C 2.B 3.A; Listening script: 四点 / 七点 / 十四号"},
  {"part":2,"type":"choice","instruction_mn":"Унших — Хоосон зайд тохирох үгийг A–D-ээс сонго. A 我们 (бид) · B 商店 (дэлгүүр) · C 三 (гурав) · D 现在 (одоо).","options":["A 我们","B 商店","C 三","D 现在"],"items":[
    {"n":4,"question_zh":"爸爸，（ ）几点？ — 十二点。","image":img("t4"),"options":["A","B","C","D"],"answer":"D","explanation_mn":"Зурагт цаг 12-г заана. «爸爸，现在几点？» — «Аав аа, одоо хэдэн цаг?» Тиймээс D 现在. 我们, 商店, 三 тохирохгүй."},
    {"n":5,"question_zh":"星期二（ ）几点见？ — 八点。","image":img("t5"),"options":["A","B","C","D"],"answer":"A","explanation_mn":"«星期二我们几点见？» — «Мягмар гарагт бид хэдэн цагт уулзах вэ?» Зурагт цаг барьсан хүн байна. 我们 = бид, тиймээс A."},
    {"n":6,"question_zh":"这儿有几个人？ — 这儿有（ ）个人。","image":img("t6"),"options":["A","B","C","D"],"answer":"C","explanation_mn":"Асуулт нь «хэдэн хүн?» тул хариулт нь тоо байх ёстой. Зурагт хөнжлийн доороос хөлүүд цухуйсан, тэр нь «三个人» — гурван хүн. Тиймээс C 三."},
    {"n":7,"question_zh":"明天几点去（ ）？ — 八点。","image":img("t7"),"options":["A","B","C","D"],"answer":"B","explanation_mn":"«明天几点去商店？» — «Маргааш хэдэн цагт дэлгүүрт явах вэ?» 去 (явах)-ийн ард очих газар орно, 商店 = дэлгүүр. Хариулт нь B."}],
   "answer_source":"Test Answers х.63: 4.D 5.A 6.C 7.B"},
  {"part":3,"type":"fill","instruction_mn":"Let's write — өөрийн амьдралаараа нөхөж бич.","items":[
    {"n":1,"question_zh":"现在____点____。","answer":"(жишээ: 现在三点十分。)","explanation_mn":"Гар цагаа хараад одоо хэдэн цаг хэдэн минут болсныг бич. Цаг (点) нь урд, минут (分) нь ард."},
    {"n":2,"question_zh":"我____点去学校。","answer":"(жишээ: 我八点去学校。)","explanation_mn":"Чи хэдэн цагт сургуульдаа явдаг вэ? Тоо + 点 бич. 去学校 = сургуульд явах."},
    {"n":3,"question_zh":"我早上____点起床。","answer":"(жишээ: 我早上七点起床。)","explanation_mn":"Өглөө хэдэн цагт босдгоо бич. 起床 (qǐchuáng) = босох."}],
   "answer_source":"textbook (х.46 Let's write; нээлттэй хариулт)"},
  {"part":4,"type":"match","instruction_mn":"Mini story — зургийг хараад хотыг цагтай нь холбо.","items":[
    {"n":1,"question_zh":"纽约","image":img("story1"),"answer":"十二点","explanation_mn":"Нью-Йоркт шинэ жилийн шөнө. Том цаг 12 дээр, салют буудаж байна."},
    {"n":2,"question_zh":"北京","image":img("story2"),"answer":"一点","explanation_mn":"Бээжинд өдрийн 1 цаг. Хүү ширээ цэвэрлэж, өвөө эмээ нь сонин уншиж байна."},
    {"n":3,"question_zh":"悉尼","image":img("story3"),"answer":"四点","explanation_mn":"Сиднейд гар цаг 4 цагийг заана. Хоёр хүүхэд майханд сууж байна."}],
   "answer_source":"textbook х.46 Mini story (зургаас уншсан)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханзаа бич — «点» ба «分» гэсэн хоёр үгийг дэвтэртээ хуулж бич.","question_zh":"点 分","answer":"点 分","explanation_mn":"Зүүнээс баруун, дээрээс доош бич."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Гар цагаа хараад цаг хэл.","question_zh":"现在五点。","answer":"现在五点。","explanation_mn":"现在 + тоо + 点."},
   {"n":2,"prompt_mn":"Найздаа маргаашийн уулзах цагийг асуу.","question_zh":"明天几点见？","answer":"明天几点见？","explanation_mn":"Хариулт: 明天…点见."},
   {"n":3,"prompt_mn":"«现在几点？» дууг хуруугаар цаг дүрслэн дуул.","question_zh":"现在几点？","answer":"(нээлттэй)","explanation_mn":"Аудио 10-04-ийн хамт."}]},
 "answerSource":"YCT 标准教程 1 · х.61 Test Listening Scripts, х.63 Test Answers (Lesson 10)"}
dump("workbook.json", workbook)

# ---------------- IMAGES / LESSON / MANIFEST ----------------
prompts = json.load(open(f"{BASE}/image_prompts.json", encoding="utf-8"))
def pid(f): return os.path.splitext(os.path.basename(f))[0]
images = [{"id":pid(p["file"]),"file":p["file"],"title":p["title"],"role":p.get("role","illustration"),"section":p["section"]} for p in prompts]
images += [{"id":f"clock{k}","file":f"images/clock{k}.png","title":t,"role":"illustration","section":"vocabulary"} for k,t in [(1,"五点"),(2,"十二点"),(3,"一点十分")]]
images += [{"id":f"story{k}","file":f"images/story{k}.png","title":t,"role":"illustration","section":"story"} for k,t in [(1,"纽约"),(2,"北京"),(3,"悉尼"),(4,"北极")]]
images += [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","2a","2b","2c","3a","3b","3c","4","5","6","7"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 10-р хичээл — Одоо хэдэн цаг болж байна вэ?","chineseTitle":"现在几点？","targetTitle":"现在几点？","mongolianTitle":"Одоо хэдэн цаг болж байна вэ?",
 "subtitle":"现在几点？ · 点 · 分 · 早上 · 太早了 · 明天五点见 · «现在几点？» дуу · «Би цаг» тоглоом",
 "description":f"Цаг асуух, цаг хэлэх (点, 分), цагтаа уулзах (明天五点见). {len(vocab)} үг, 2 зурагт яриа, 1 дуу, 3 түлхүүр бүтэц, {len(Q)} шалгалтын асуулт, номын тест (сонсох 3 + унших 4 + бичих 3 + Mini story 3) — албан аудио, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"⏰","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第10课《现在几点？》 [hskLevel=1] [lessonNumber=10]; эх: х.44–48, х.61 (сонсголын текст), х.63 (хариу); аудио CD 10-01…10-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"现在几点？","mongolianTitle":"Одоо хэдэн цаг болж байна вэ?",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第10课 (сурах бичиг + CD аудио 10-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers х.63)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан)"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"song lines",len(song_lines),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
