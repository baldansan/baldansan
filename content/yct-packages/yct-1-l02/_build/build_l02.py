#!/usr/bin/env python3
"""YCT 标准教程 1 · 第2课 你叫什么？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, shutil
from PIL import Image
BASE = "/home/claude/work/yct1/l02"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-1", "yct-1-l02", 2
os.makedirs(OUT, exist_ok=True); os.makedirs(f"{OUT}/images", exist_ok=True)

def dump(name, obj, path=OUT):
    with open(f"{path}/{name}", "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

def shuffle(options, correct, seed):
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    opts = list(options)
    for i in range(len(opts) - 1, 0, -1):
        j = h % (i + 1); h //= (i + 1)
        opts[i], opts[j] = opts[j], opts[i]
    return opts, opts.index(correct)

# ---------------- AUDIO (CD 02-01 үг, 02-02 яриа, 02-03 тест) ----------------
A = f"{OUT}/audio"
for src, dst in [("02-01","words"),("02-02","text"),("02-02","text-song"),("02-03","test")]:
    if os.path.exists(f"{A}/yct-1-{src}.mp3"): shutil.copyfile(f"{A}/yct-1-{src}.mp3", f"{A}/yct-1-02-{dst}.mp3")
AUD_WORDS, AUD_TEXT, AUD_TEST = "audio/yct-1-02-words.mp3","audio/yct-1-02-text.mp3","audio/yct-1-02-test.mp3"
AUD_MAIN = "audio/yct-1-02-text-song.mp3"   # дуу байхгүй → яриа track

# ---------------- TEST CROPS (hi-10.png, 150dpi) ----------------
P = Image.open(f"{BASE}/pages/hi-10.png"); W, H = P.size
def crop(name, x0,y0,x1,y1): P.crop((int(x0*W),int(y0*H),int(x1*W),int(y1*H))).convert("RGB").save(f"{OUT}/images/{name}.png")
crop("t1",0.31,0.203,0.50,0.288); crop("t2",0.31,0.305,0.50,0.391); crop("t3",0.31,0.404,0.50,0.492)
crop("t4",0.30,0.585,0.42,0.670); crop("t5",0.30,0.685,0.42,0.772); crop("t6",0.30,0.787,0.42,0.875)

# ---------------- VOCAB ----------------
VOCAB = [
 ("我","wǒ","би","төлөөний үг","我叫月月。","Wǒ jiào Yuèyue.","Намайг Юэ-юэ гэдэг.",False),
 ("叫","jiào","нэрлэгдэх, нэртэй байх","үйл үг · гол үг","我叫星星。","Wǒ jiào Xīngxing.","Намайг Син-син гэдэг.",True),
 ("什么","shénme","юу, ямар","асуух үг · гол үг","你叫什么？","Nǐ jiào shénme?","Чамайг юу гэдэг вэ?",True),
 ("认识","rènshi","таних, танилцах","үйл үг · гол үг","认识你很高兴！","Rènshi nǐ hěn gāoxìng!","Чамтай танилцсандаа баяртай байна!",True),
 ("很","hěn","маш","тусгах үг","你很好。","Nǐ hěn hǎo.","Чи сайн байна.",False),
 ("高兴","gāoxìng","баярлах, баяртай","тэмдэг нэр","认识你很高兴。","Rènshi nǐ hěn gāoxìng.","Чамтай танилцсандаа баяртай байна.",False),
 ("她","tā","тэр (охин, эмэгтэй)","төлөөний үг · гол үг","你认识她吗？","Nǐ rènshi tā ma?","Чи түүнийг мэдэх үү?",True),
 ("吗","ma","уу, үү (асуух үг)","асуух үг · гол үг","你认识她吗？","Nǐ rènshi tā ma?","Чи түүнийг танина уу?",True),
 ("不","bù","үгүй, биш","үгүйсгэх үг","不认识。","Bù rènshi.","Танихгүй.",False),
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
 {"id":1,"title_mn":"Яриа 1 · Цонхны гаднах танихгүй найз","scene_mn":"Орой цонхны гадна ногоон харь гарагийн хүүхэд зогсож байна. Юэ-юэ түүнтэй танилцана.","audio":AUD_TEXT,
  "lines":[{"speaker":"星星","zh":"你好！我叫星星，你叫什么？","pinyin":"Nǐ hǎo! Wǒ jiào Xīngxing, nǐ jiào shénme?","mn":"Сайн уу! Намайг Син-син гэдэг. Чамайг юу гэдэг вэ?"},
            {"speaker":"月月","zh":"我叫月月。","pinyin":"Wǒ jiào Yuèyue.","mn":"Намайг Юэ-юэ гэдэг."},
            {"speaker":"星星","zh":"认识你很高兴！","pinyin":"Rènshi nǐ hěn gāoxìng!","mn":"Чамтай танилцсандаа баяртай байна!"}]},
 {"id":2,"title_mn":"Яриа 2 · Хаалганы гадаа","scene_mn":"Хүү найздаа гадаа зогсож буй танихгүй охиныг заагаад асууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"男孩","zh":"你认识她吗？","pinyin":"Nǐ rènshi tā ma?","mn":"Чи түүнийг мэдэх үү?"},
            {"speaker":"月月","zh":"不认识。","pinyin":"Bù rènshi.","mn":"Үгүй, танихгүй."}]},
 {"id":3,"title_mn":"Яриа 3 · Ангид нэрийн хуудас солилцох","scene_mn":"Ангид хүүхдүүд хятад нэрээ нэрийн хуудсан дээр бичиж аваад бие биедээ өгч танилцана.","audio":AUD_TEXT,
  "lines":[{"speaker":"李芳","zh":"你好！我叫李芳，你叫什么？","pinyin":"Nǐ hǎo! Wǒ jiào Lǐ Fāng, nǐ jiào shénme?","mn":"Сайн уу! Намайг Ли Фан гэдэг. Чамайг юу гэдэг вэ?"},
            {"speaker":"张伟强","zh":"你好！我叫张伟强。认识你很高兴。","pinyin":"Nǐ hǎo! Wǒ jiào Zhāng Wěiqiáng. Rènshi nǐ hěn gāoxìng.","mn":"Сайн уу! Намайг Жан Вэй-чян гэдэг. Чамтай танилцсандаа баяртай байна."}]},
]
dlg_lines=[
 (1,"星星：你好！我叫星星，你叫什么？","Xīngxing: Nǐ hǎo! Wǒ jiào Xīngxing, nǐ jiào shénme?","Син-син: Сайн уу! Намайг Син-син гэдэг. Чамайг юу гэдэг вэ?","星星：| 你|nǐ 好|hǎo ！| 我|wǒ 叫|jiào 星星|Xīngxing ，| 你|nǐ 叫|jiào 什么|shénme ？|","你叫什么？ — нэр асууна. Хариулахдаа «我叫……» гэж нэрээ хэлнэ. 叫 = «нэртэй байх».",["你叫什么"]),
 (1,"月月：我叫月月。","Yuèyue: Wǒ jiào Yuèyue.","Юэ-юэ: Намайг Юэ-юэ гэдэг.","月月：| 我|wǒ 叫|jiào 月月|Yuèyue 。|",None,[]),
 (1,"星星：认识你很高兴！","Xīngxing: Rènshi nǐ hěn gāoxìng!","Син-син: Чамтай танилцсандаа баяртай байна!","星星：| 认识|rènshi 你|nǐ 很|hěn 高兴|gāoxìng ！|","认识你很高兴 — шинэ хүнтэй танилцахдаа хэлдэг эелдэг үг.",[]),
 (2,"男孩：你认识她吗？","Nánhái: Nǐ rènshi tā ma?","Хүү: Чи түүнийг мэдэх үү?","男孩：| 你|nǐ 认识|rènshi 她|tā 吗|ma ？|","吗 — өгүүлбэрийн төгсгөлд орвол «уу/үү?» гэсэн асуулт болно.",["你认识她吗"]),
 (2,"月月：不认识。","Yuèyue: Bù rènshi.","Юэ-юэ: Танихгүй.","月月：| 不|bù 认识|rènshi 。|","不 — «үгүй, биш». 不认识 = танихгүй.",[]),
 (3,"李芳：你好！我叫李芳，你叫什么？","Lǐ Fāng: Nǐ hǎo! Wǒ jiào Lǐ Fāng, nǐ jiào shénme?","Ли Фан: Сайн уу! Намайг Ли Фан гэдэг. Чамайг юу гэдэг вэ?","李芳：| 你|nǐ 好|hǎo ！| 我|wǒ 叫|jiào 李芳|Lǐ Fāng ，| 你|nǐ 叫|jiào 什么|shénme ？|","Хятад нэр = овог + өөрийн нэр. 李 бол овог, 芳 бол өөрийн нэр.",[]),
 (3,"张伟强：你好！我叫张伟强。认识你很高兴。","Zhāng Wěiqiáng: Nǐ hǎo! Wǒ jiào Zhāng Wěiqiáng. Rènshi nǐ hěn gāoxìng.","Жан Вэй-чян: Сайн уу! Намайг Жан Вэй-чян гэдэг. Чамтай танилцсандаа баяртай байна.","张伟强：| 你|nǐ 好|hǎo ！| 我|wǒ 叫|jiào 张伟强|Zhāng Wěiqiáng 。| 认识|rènshi 你|nǐ 很|hěn 高兴|gāoxìng 。|",None,[]),
]
sentences=[]
for para,zh,py,mn,tk,note,ks in dlg_lines:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note; s["key_structures"]=ks
    sentences.append(s)

texts = {
 "unit":{"number":"2","title":"你叫什么？","mongolianTitle":"Чамайг юу гэдэг вэ? — нэрээ хэлэх, танилцах"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Тэмээ багш байна. Чи шинэ найзтай уулзвал юу гэж асуух вэ? Нэрийг нь л асууна даа! Хятадаар «你叫什么？ (nǐ jiào shénme?)» гэж асууна. Харин өөрийнхөө нэрийг «我叫…… (wǒ jiào…)» гэж хэлнэ. Танилцсандаа баяртай байвал «认识你很高兴！» гэнэ. Өнөөдөр бид ногоон харь гарагийн хүүхэд Син-синтэй танилцаж, өөртөө хятад нэр хүртэл нэрлэнэ! Бэлэн үү? Эхэлцгээе!",
  "warmup_mn":"Чи шинэ найзтайгаа уулзахдаа яаж танилцдаг вэ? Чамайг гэрийнхэн чинь юу гэж дууддаг вэ? Нэрээ чанга хэлж үзээрэй!",
  "theme_zh":"你叫什么？ · 认识你很高兴","theme_mn":"Нэр асуух · Танилцах"},
 "warmup":{"mongolian":"Шинэ найзтайгаа уулзахдаа яаж танилцдаг вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"2","title":"你叫什么？","mongolianTitle":"Чамайг юу гэдэг вэ? — 3 яриа","title_mn":"Let's read · 3 яриа","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第2课 Let's read（CD 02-02）+ Let's play","author_zh":"",
  "intro_zh":"星星和月月认识了。月月不认识那个女孩。李芳和张伟强交换名片。","intro_mn":"Гурван яриа байна. Эхний яриагаар ногоон харь гарагийн хүүхэд Син-син Юэ-юэтэй танилцана. Хоёрдугаар яриад хүү Юэ-юэгээс «Чи түүнийг мэдэх үү?» гэж асууна. Гуравдугаар яриад Ли Фан, Жан Вэй-чян хоёр нэрийн хуудас солилцож танилцана. Эхлээд аудиог сонс, дараа нь дүрээ сонгоод хамт ярь!",
  "sentences":sentences,
  "paragraph_summaries":[{"paragraph":1,"mn":"Яриа 1 — Син-син «我叫星星» гэж нэрээ хэлээд Юэ-юэгийн нэрийг асууна. Юэ-юэ «我叫月月» гэж хариулна. Хоёулаа танилцсандаа баяртай."},{"paragraph":2,"mn":"Яриа 2 — Хүү «你认识她吗？» гэж асуухад Юэ-юэ «不认识» гэж хариулна."},{"paragraph":3,"mn":"Яриа 3 — Ли Фан, Жан Вэй-чян хоёр хятад нэрээ нэрийн хуудсан дээр бичиж солилцон танилцана."}],
  "reflection":{"questions_mn":["Шинэ хүнтэй танилцахдаа хятадаар юу гэж асуух вэ?","Өөрийнхөө нэрийг хятадаар яаж хэлэх вэ?","Танихгүй хүний тухай «Чи түүнийг мэдэх үү?» гэж хятадаар яаж асуух вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Нэрээ хэл","zh":"你好！我叫月月，你叫什么？","pinyin":"Nǐ hǎo! Wǒ jiào Yuèyue, nǐ jiào shénme?","mn":"Сайн уу! Намайг Юэ-юэ гэдэг. Чамайг юу гэдэг вэ?"},
  "writingPrompt_mn":"Найзтайгаа танилц: «你好！我叫……，你叫什么？» гэж асуу. Хариулсных нь дараа «认识你很高兴！» гэж хэл."},
 "properNouns":[{"zh":"星星","pinyin":"Xīngxing","mn":"Син-син (ногоон харь гарагийн хүүхдийн нэр)"},{"zh":"月月","pinyin":"Yuèyue","mn":"Юэ-юэ"},{"zh":"李芳","pinyin":"Lǐ Fāng","mn":"Ли Фан"},{"zh":"张伟强","pinyin":"Zhāng Wěiqiáng","mn":"Жан Вэй-чян"}],
 "wordExplanation":[
  {"word":"叫","gloss":"jiào — нэртэй байх","explanation":"«我叫月月» гэвэл «Намайг Юэ-юэ гэдэг». 叫-ын дараа өөрийн нэрээ хэлнэ. Асуухдаа 叫-ын ард 什么 (юу) тавина: «你叫什么？» — «Чамайг юу гэдэг вэ?»",
   "structure":"我叫 + нэр · 你叫什么？","teacher_notes":"Хүүхдүүдэд нэрээ чанга хэлүүлж, ээлжлэн асуулгана.",
   "examples":[{"chinese":"我叫星星。","pinyin":"Wǒ jiào Xīngxing.","mongolian":"Намайг Син-син гэдэг."},{"chinese":"我叫月月。","pinyin":"Wǒ jiào Yuèyue.","mongolian":"Намайг Юэ-юэ гэдэг."},{"chinese":"你叫什么？","pinyin":"Nǐ jiào shénme?","mongolian":"Чамайг юу гэдэг вэ?"}],
   "common_mistakes":[{"wrong":"你叫什么吗？","right":"你叫什么？","why":"什么 (юу) өөрөө асуух үг тул 吗 нэмэхгүй."}],
   "check":{"question":"Нэрээ хэлэхдээ юу гэх вэ?","options":["我叫……","你好吗","再见"],"answer":"0"},
   "practice":[{"n":1,"question":"你叫什么？ — 我________月月。","answer":"叫","explanation_mn":"Нэрээ хэлэхдээ «我叫……»."}]},
  {"word":"认识","gloss":"rènshi — таних, танилцах","explanation":"认识你很高兴 — «Чамтай танилцсандаа баяртай байна». Мөн «你认识她吗？» — «Чи түүнийг мэдэх үү?»; танихгүй бол «不认识».",
   "structure":"认识 + хүн · 不认识","teacher_notes":"吗-ыг асуултын төгсгөлд сонсгож давтуул.",
   "examples":[{"chinese":"认识你很高兴！","pinyin":"Rènshi nǐ hěn gāoxìng!","mongolian":"Чамтай танилцсандаа баяртай байна!"},{"chinese":"你认识她吗？","pinyin":"Nǐ rènshi tā ma?","mongolian":"Чи түүнийг мэдэх үү?"},{"chinese":"不认识。","pinyin":"Bù rènshi.","mongolian":"Танихгүй."}],
   "common_mistakes":[{"wrong":"认识不","right":"不认识","why":"不 нь үгийн өмнө орно."}],
   "check":{"question":"«Танихгүй» хятадаар:","options":["不认识","认识","很高兴"],"answer":"0"},
   "practice":[{"n":1,"question":"Танихгүй охиныг заагаад: 你认识她________？","answer":"吗","explanation_mn":"Асуултын төгсгөлд 吗."}]},
 ],
 "collocations":[{"type":"叫 / 认识 — хэрэглээ","rows":[
   {"head":"我","with":"叫 + нэр","mn":"намайг ... гэдэг","usage_mn":"Өөрийгөө танилцуулахад","example":{"zh":"我叫张伟强。","pinyin":"Wǒ jiào Zhāng Wěiqiáng.","mn":"Намайг Жан Вэй-чян гэдэг."}},
   {"head":"认识","with":"你很高兴","mn":"танилцсандаа баяртай","usage_mn":"Шинэ хүнтэй уулзахад","example":{"zh":"认识你很高兴！","pinyin":"Rènshi nǐ hěn gāoxìng!","mn":"Чамтай танилцсандаа баяртай байна!"}},
   {"head":"你认识她","with":"吗","mn":"чи түүнийг мэдэх үү?","usage_mn":"Тодорхой хүнийг мэдэх эсэхийг асуухад","example":{"zh":"你认识她吗？","pinyin":"Nǐ rènshi tā ma?","mn":"Чи түүнийг мэдэх үү?"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Let's match — зүүн талын хэллэгт тохирох хариултыг ол.","banks":[{"words":["你好。","我叫月月。","不认识。"],"items":[
     {"n":1,"question":"你好。→ ________","answer":"你好。","explanation_mn":"«Сайн уу» гэхэд «сайн уу» гэж хариулна."},
     {"n":2,"question":"你叫什么？→ ________","answer":"我叫月月。","explanation_mn":"Нэр асуувал «我叫……» гэж нэрээ хэлнэ."},
     {"n":3,"question":"你认识她吗？→ ________","answer":"不认识。","explanation_mn":"Танихгүй бол «不认识»."}]}],
   "answer_source":"textbook (Let's match, х.7)"},
  "comprehension":{"instruction_mn":"Let's read — зургийг хараад асуултад хариул.","items":[
     {"n":1,"question_zh":"她叫什么？","answer":"她叫星星。","explanation_mn":"Ногоон харь гарагийн хүүхэд «我叫星星» гэж хэлсэн."},
     {"n":2,"question_zh":"月月认识她吗？","answer":"不认识。","explanation_mn":"Юэ-юэ «不认识» гэж хэлсэн, тэр танихгүй."}],
   "answer_source":"textbook_verified (х.6 Question)"},
  "retell":{"instruction_mn":"Let's play — Нэрийн хуудас тоглоом! Хятад нэр өөртөө олж аваад хуудсан дээр том том бич.","prompts":[
     {"label":"Нэрээ ол","start_zh":"Овог сонго: 李 Lǐ, 王 Wáng, 张 Zhāng, 刘 Liú. Хүү бол 强 (хүчтэй), 伟 (агуу), 龙 (луу), 勇 (зоригтой), 峰 (оргил), 海 (далай)-ээс сонго. Охин бол 美 (үзэсгэлэнтэй), 娟 (уян хатан), 月 (сар), 芳 (анхилуун), 静 (нам гүм), 文 (соёл)-оос сонго. Жишээ нь: 李 + 芳 = 李芳."},
     {"label":"Нэрийн хуудас хий","start_zh":"Цаасан дээр хятад нэрээ бичиж, зургаа зур. Бэлэн боллоо!"},
     {"label":"Солилцоё","start_zh":"Найзтайгаа уулзаад: «你好！我叫……，你叫什么？» Нэрийн хуудсаа өгөөд «认识你很高兴！» гэж хэл."},
     {"label":"Дугуйн гинж","start_zh":"Хүүхдүүд хоёр тойрог болж хосоороо нүүр тулан зогсоно. Хос бүр «你好！我叫……，你叫什么？» гэж ярина. Багш «солих» гэвэл нэг тойрог баруун тийш нэг алхаад дараагийн хүүхэдтэй ярина."}]}},
 "grammarNotes":[],
 "culture":{"title":"中国人的名字","title_mn":"Хятад хүний нэр","text_mn":"Хятад хүний нэр овгоос эхэлдэг! Эхлээд овог (李, 王, 张, 刘), дараа нь өөрийн нэр. Жишээ нь 李芳 бол Ли овогтой Фан. Хятад нэр бүр тусгай утгатай: 强 хүчтэй, 龙 луу, 海 далай, 月 сар, 美 үзэсгэлэнтэй. Тиймээс хүүхдийнхээ нэрийг аав ээж нь сайхан утгатай болгож сонгодог. Монголд бид нэрээ ээж аав эсвэл өвөө эмээ хоёр маань өгдөг шүү дээ.","note_mn":"Хятадад овог нэрнийхээ өмнө бичигддэг, харин Монголд ихэнхдээ эцгийн нэр өмнө байдаг."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — нэр асуух, танилцах.","topic":"Ангидаа хятадаар танилцацгаая!","discussion":["Хосоороо: «你好！我叫……，你叫什么？» «认识你很高兴！» гэж жүжиглэ.","Хятад нэрээ өөртөө сонгоод ангийнхандаа танилцуул."],
   "writing":{"promptChinese":"你好！我叫……，你叫什么？","promptMongolian":"Гэрийн даалгавар: гэрийнхэнтэйгээ хятадаар танилц. Хятад нэрээ өөртөө сонгож цаасан дээр бичээд ээж аавдаа үзүүл. Маргааш ангидаа танилцуул.","minChars":"0","requiredWords":["叫","什么","认识"],"sampleChinese":"你好！我叫李芳，你叫什么？认识你很高兴！","sampleMongolian":"Сайн уу! Намайг Ли Фан гэдэг. Чамайг юу гэдэг вэ? Танилцсандаа баяртай байна!","gradingRubric":"Зөв дуудлага, нэрээ тодорхой хэлсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L2 1.✗ 2.✗ 3.✓ 4.✓ 5.✓ 6.✗","parts":[]},
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
 {"point":"你叫什么？ — нэр асуух, нэрээ хэлэх","gloss_mn":"«Чамайг юу гэдэг вэ?» — «Намайг …… гэдэг.»",
  "structure":"你叫什么？  ·  我叫 + нэр",
  "teacher_mn":"Шинэ найзтайгаа уулзахад нэрийг нь асууя. «你叫什么？» гэж асууна. Харин хариулахдаа «我叫……» гэж нэрээ хэлнэ. Жишээ нь «我叫月月». 叫 нь «нэртэй байх» гэсэн үг. Одоо чи өөрийнхөө нэрийг хятадаар чанга хэлээрэй!",
  "teacher_notes":"什么 (shénme) — асуух үг тул 吗 нэмэхгүй. Хүүхдүүдийг тойрог болгож ээлжлэн асуулгана.",
  "examples":[ex("你叫什么？","Nǐ jiào shénme?","Чамайг юу гэдэг вэ?"),ex("我叫月月。","Wǒ jiào Yuèyue.","Намайг Юэ-юэ гэдэг."),ex("我叫李芳。","Wǒ jiào Lǐ Fāng.","Намайг Ли Фан гэдэг."),ex("我叫张伟强。","Wǒ jiào Zhāng Wěiqiáng.","Намайг Жан Вэй-чян гэдэг.")],
  "common_mistakes":[{"wrong":"你叫什么吗？","right":"你叫什么？","why":"什么 өөрөө асуух үг тул 吗 хэрэггүй."},{"wrong":"我什么叫月月","right":"我叫月月","why":"Нэрээ хэлэхдээ 我叫 + нэр гэж хэлнэ."}],
  "check":chk("Найзаасаа нэрийг нь асуу:",["你叫什么？","你好吗？","再见！"],"你叫什么？","g1c"),
  "exercises":[
   choice("Хүн «你叫什么？» гэж асуулаа. Чи юу гэж хариулах вэ?",["我叫月月。","不认识。","再见。"],"我叫月月。","Зөв! Нэр асуувал «我叫 + нэр».","不认识 — «танихгүй», 再见 — «баяртай». Нэр асуухад хариулахгүй.","g1e1"),
   judge("«我叫星星» гэдэг нь «Намайг Син-син гэдэг» гэсэн үг.",True,"Зөв!","我 = би, 叫 = нэртэй байх, 星星 = Син-син."),
   choice("«什么» гэдэг үг ямар утгатай вэ?",["юу","би","тэр"],"юу","Зөв! 什么 = юу.","我 = би, 她 = тэр (охин).","g1e3")]},
 {"point":"你认识她吗？ — танина уу? гэж асуух","gloss_mn":"«Чи түүнийг мэдэх үү?» — «不认识 (танихгүй)»",
  "structure":"你认识她吗？  ·  不认识",
  "teacher_mn":"Танихгүй охин харагдлаа. «Чи түүнийг мэдэх үү?» гэж асууя: «你认识她吗？» Өгүүлбэрийн төгсгөлд 吗 гэж хэлбэл асуулт болдог. Танихгүй бол «不认识» гэнэ. 不 гэдэг нь «үгүй, биш». Гараа сарвайж «үгүй» гэж үзүүлээд хэлээрэй!",
  "teacher_notes":"吗 — асуулт болгодог үг. 她 (tā) = тэр (охин/эмэгтэй).",
  "examples":[ex("你认识她吗？","Nǐ rènshi tā ma?","Чи түүнийг мэдэх үү?"),ex("不认识。","Bù rènshi.","Танихгүй."),ex("男孩：你认识她吗？ 月月：不认识。","Nánhái: Nǐ rènshi tā ma? Yuèyue: Bù rènshi.","Хүү: Чи түүнийг мэдэх үү? Юэ-юэ: Танихгүй."),ex("她叫什么？","Tā jiào shénme?","Түүнийг юу гэдэг вэ?")],
  "common_mistakes":[{"wrong":"认识不","right":"不认识","why":"不 нь үйл үгийн өмнө орно."}],
  "check":chk("Танихгүй бол юу гэх вэ?",["不认识。","很高兴。","我叫月月。"],"不认识。","g2c"),
  "exercises":[
   choice("你认识她________？",["吗","什么","不"],"吗","Зөв! Асуултын төгсгөлд 吗.","什么 = юу, 不 = үгүй.","g2e1"),
   judge("«不认识» гэдэг нь «танина» гэсэн үг.",False,"Зөв — 不认识 = танихгүй.","不 = үгүй, 认识 = таних. 不认识 = танихгүй."),
   choice("«她» гэж хэнийг хэлэх вэ?",["тэр охиныг","намайг","чамайг"],"тэр охиныг","Зөв! 她 = тэр (охин, эмэгтэй).","我 = би, 你 = чи.","g2e3")]},
 {"point":"认识你很高兴！ — танилцахдаа","gloss_mn":"«Чамтай танилцсандаа баяртай байна!»",
  "structure":"认识你很高兴！",
  "teacher_mn":"Шинэ найзтайгаа танилцсан үед «认识你很高兴!» гэж хэлнэ. Энэ нь «Танилцсандаа баяртай байна» гэсэн үг. Инээмсэглээд гар барьж хэлээрэй!",
  "teacher_notes":"高兴 (gāoxìng) — баяртай. 很 (hěn) = маш гэдгийг тайлбарлах албагүй.",
  "examples":[ex("认识你很高兴！","Rènshi nǐ hěn gāoxìng!","Чамтай танилцсандаа баяртай байна!"),ex("你好！我叫张伟强。认识你很高兴。","Nǐ hǎo! Wǒ jiào Zhāng Wěiqiáng. Rènshi nǐ hěn gāoxìng.","Сайн уу! Намайг Жан Вэй-чян гэдэг. Танилцсандаа баяртай байна."),ex("你很好。","Nǐ hěn hǎo.","Чи сайн байна.")],
  "common_mistakes":[{"wrong":"Салахдаа «认识你很高兴» гэх","right":"Салахдаа «再见»","why":"认识你很高兴 нь танилцахад хэлдэг үг."}],
  "check":chk("Шинэ хүнтэй танилцлаа. Юу гэх вэ?",["认识你很高兴！","再见！","不认识。"],"认识你很高兴！","g3c"),
  "exercises":[
   choice("Танилцсандаа баяртай байна: 认识你很________！",["高兴","什么","她"],"高兴","Зөв! 高兴 = баяртай.","什么 = юу, 她 = тэр.","g3e1"),
   judge("«高兴» гэдэг нь «баяртай, баярлах» гэсэн үг.",True,"Зөв!","高兴 (gāoxìng) = баярлах."),
   choice("Хятад нэрэнд эхлээд юу бичих вэ?",["овог (李, 王)","өөрийн нэр","нас"],"овог (李, 王)","Зөв! Хятадад овог эхэлж бичигдэнэ.","Овог эхэнд: 李芳 — Ли (овог) Фан (нэр).","g3e3")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«我» (wǒ) гэж юу вэ?",["би","чи","тэр","багш"],"би","我 = би. 你 = чи, 她 = тэр.","easy",["vocabulary"],"q1")
q("choice","«什么» гэж юу вэ?",["юу","би","баяртай","сайн"],"юу","什么 (shénme) = юу.","easy",["vocabulary"],"q2")
q("choice","«认识» гэж юу вэ?",["таних","баяртай","юу","дөрөв"],"таних","认识 (rènshi) = таних, танилцах.","easy",["vocabulary"],"q3")
q("choice","«高兴» гэж юу вэ?",["баярлах","таних","нэртэй байх","сайн"],"баярлах","高兴 (gāoxìng) = баярлах, баяртай.","easy",["vocabulary"],"q4")
q("choice","«她» гэж хэнийг хэлэх вэ?",["тэр охиныг","намайг","чамайг","багшийг"],"тэр охиныг","她 (tā) = тэр (охин, эмэгтэй).","easy",["vocabulary"],"q5")
q("choice","«不» гэж юу вэ?",["үгүй, биш","маш","юу","би"],"үгүй, биш","不 (bù) = үгүй, биш.","easy",["vocabulary"],"q6")
q("choice","«叫» гэж юу вэ?",["нэртэй байх","таних","баярлах","баяртай"],"нэртэй байх","叫 (jiào) = нэртэй байх. 我叫月月 = намайг Юэ-юэ гэдэг.","easy",["vocabulary"],"q7")
q("choice","«吗» нь аль өгүүлбэрт хэрэгтэй вэ?",["你认识她…？","我叫月月…","再见…","你叫什么…？"],"你认识她…？","吗 нь «уу/үү?» гэсэн асуулт үүсгэнэ. 什么 өөрөө асуух үг тул 吗 хэрэггүй.","medium",["grammar"],"q8")
q("choice","Нэр асуух өгүүлбэр аль нь вэ?",["你叫什么？","我叫月月。","不认识。","再见。"],"你叫什么？","你叫什么？ = Чамайг юу гэдэг вэ?","easy",["dialogue"],"q9")
q("cloze","A：你叫什么？ B：我（ ）月月。",["叫","不","很","吗"],"叫","我叫月月 = Намайг Юэ-юэ гэдэг.","easy",["dialogue"],"q10")
q("cloze","A：你认识她吗？ B：（ ）认识。",["不","很","叫","她"],"不","不认识 = танихгүй.","easy",["dialogue"],"q11")
q("cloze","认识你（ ）高兴！",["很","吗","不","叫"],"很","认识你很高兴 = Танилцсандаа баяртай байна.","medium",["dialogue"],"q12")
q("choice","Шинэ найзтайгаа танилцахдаа хэлэх үг:",["认识你很高兴！","再见！","不认识。","老师好！"],"认识你很高兴！","Танилцахад «认识你很高兴».","easy",["dialogue"],"q13")
q("choice","«我叫星星» гэж хэн хэлсэн бэ?",["ногоон харь гарагийн хүүхэд","Юэ-юэ","багш","ээж"],"ногоон харь гарагийн хүүхэд","Ногоон харь гарагийн хүүхэд «你好！我叫星星» гэж хэлсэн.","easy",["dialogue"],"q14")
q("choice","Юэ-юэ танихгүй охиныг харав. Тэр юу гэсэн бэ?",["不认识。","我叫星星。","再见。","很高兴。"],"不认识。","Хүү «你认识她吗？» гэж асуухад Юэ-юэ «不认识» гэсэн.","medium",["dialogue"],"q15")
q("choice","Пиньинь «shénme» гэж уншдаг үг:",["什么","认识","高兴","老师"],"什么","什么 = shénme = юу.","easy",["pronunciation"],"q16")
q("choice","Пиньинь «gāoxìng» гэж уншдаг үг:",["高兴","认识","再见","你好"],"高兴","高兴 = gāoxìng = баярлах.","easy",["pronunciation"],"q17")
q("choice","Пиньинь «rènshi» гэж уншдаг үг:",["认识","什么","老师","再见"],"认识","认识 = rènshi = таних.","easy",["pronunciation"],"q18")
q("choice","«bù» гэж уншдаг ханз:",["不","吗","很","她"],"不","不 = bù = үгүй, биш.","easy",["pronunciation"],"q19")
q("usage","Хятад хүний нэрэнд эхлээд юу бичигддэг вэ?",["овог","өөрийн нэр","нас","хот"],"овог","Хятадад овог эхэлж, дараа нь өөрийн нэр. 李芳 = Ли (овог) Фан.","medium",["culture"],"q20")
q("choice","Дараах нэрнээс овог аль нь вэ?",["李","芳","月","美"],"李","李, 王, 张, 刘 — овог. 芳, 月, 美 — охины өөрийн нэр.","medium",["culture"],"q21")
q("choice","«月» ямар утгатай вэ?",["сар","далай","луу","хүчтэй"],"сар","月 (yuè) = сар. 海 = далай, 龙 = луу, 强 = хүчтэй.","medium",["culture"],"q22")
q("choice","«你好» гэхэд найз чинь юу гэж хариулах вэ?",["你好！","再见！","不认识。","三"],"你好！","Мэндчилгээнд мэндчилгээгээр хариулна.","easy",["review"],"q23")
q("choice","Дарааллаар: 一、二、（ ）、四",["三","五","七","十"],"三","1, 2, 3, 4 — 三 = гурав.","easy",["review"],"q24")
q("choice","Багш ангид ороод ирлээ. Сурагчид юу гэх вэ?",["老师好！","老师再见！","我叫月月。","不认识。"],"老师好！","Уулзахад 老师好.","easy",["review"],"q25")
q("usage","Найзаасаа нэрийг нь асуухдаа:",["你叫什么？","你认识她吗？","认识你很高兴！","再见！"],"你叫什么？","Нэр асуухдаа 你叫什么？","easy",["usage"],"q26")
q("choice","«她» ба «我»-г зөв холбо: «我» =",["би","тэр","чи","юу"],"би","我 = би, 她 = тэр, 你 = чи, 什么 = юу.","easy",["vocabulary"],"q27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"listening","instruction_mn":"Сонсох — Аудио (02-03) сонсоод өгүүлбэр зурагтай таарвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）她不高兴。","question_mn":"1-р асуулт: сонсоод зурагтай тулга","options":["✓","✗"],"image":img("t1"),"answer":"✗","script_zh":"她不高兴。","explanation_mn":"Аудионд «她不高兴 — тэр баярлахгүй байна». Зурагт бүсгүй баяртай, инээж байна. Тиймээс таарахгүй → ✗."},
    {"n":2,"question_zh":"（听录音）我不认识她。","question_mn":"2-р асуулт: сонсоод зурагтай тулга","options":["✓","✗"],"image":img("t2"),"answer":"✗","script_zh":"我不认识她。","explanation_mn":"Аудионд «我不认识她 — би түүнийг танихгүй». Зурагт ээж охин хоёр хамт таарч байна — бие биеээ сайн мэднэ. Таарахгүй → ✗."},
    {"n":3,"question_zh":"（听录音）认识你很高兴。","question_mn":"3-р асуулт: сонсоод зурагтай тулга","options":["✓","✗"],"image":img("t3"),"answer":"✓","script_zh":"认识你很高兴。","explanation_mn":"Аудионд «认识你很高兴 — танилцсандаа баяртай байна». Зурагт хоёр том хүн гар барьж танилцаж байна → ✓."}],
   "answer_source":"Test Answers х.63: 1.✗ 2.✗ 3.✓; Listening script х.61"},
  {"part":2,"type":"judge","instruction_mn":"Унших — Зураг ба үг таарч байвал ✓, таарахгүй бол ✗.","items":[
    {"n":4,"question_zh":"她","image":img("t4"),"answer":"✓","explanation_mn":"Зурагт охин байна. 她 = тэр охин → ✓."},
    {"n":5,"question_zh":"很好","image":img("t5"),"answer":"✓","explanation_mn":"Хүү эрхий хуруугаа өргөж байна — «маш сайн» → ✓."},
    {"n":6,"question_zh":"高兴","image":img("t6"),"answer":"✗","explanation_mn":"Зурагт хүү гунигтай байна. 高兴 = баяртай → таарахгүй, ✗."}],
   "answer_source":"Test Answers х.63: 4.✓ 5.✓ 6.✗"},
  {"part":3,"type":"match","instruction_mn":"Let's match — хэллэг ба хариултыг холбо.","items":[
    {"n":1,"question_zh":"你好。","answer":"你好。","explanation_mn":"Сайн уу → Сайн уу (B)."},
    {"n":2,"question_zh":"你叫什么？","answer":"我叫月月。","explanation_mn":"Нэр асуувал нэрээ хэлнэ (C)."},
    {"n":3,"question_zh":"你认识她吗？","answer":"不认识。","explanation_mn":"Танихгүй бол «不认识» (A)."}],
   "answer_source":"textbook х.7"},
  {"part":4,"type":"choice","instruction_mn":"Let's play — Хятад нэр бүтээх: овог + өөрийн нэр.","items":[
    {"n":1,"question_zh":"李 + 芳 = ？","question_mn":"Ли овогтой, «芳» нэртэй охиныг юу гэх вэ?","options":["李芳","芳李","李月"],"answer":"李芳","explanation_mn":"Овог эхэнд, нэр ард: 李芳. 芳李 — буруу дараалал; 李月 — өөр нэр."},
    {"n":2,"question_zh":"张 + 伟强 = ？","question_mn":"Жан овогтой «伟强» нэртэй хүү:","options":["张伟强","伟强张","王伟强"],"answer":"张伟强","explanation_mn":"Овог 张 эхэлнэ: 张伟强. 王 бол өөр овог."}],
   "answer_source":"textbook х.7 Let's play"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Хятад нэрээ нэрийн хуудсан дээр том том бич.","question_zh":"我叫……","answer":"(өөрийн нэр)","explanation_mn":"Овог + өөрийн нэр: жишээ нь 李芳."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа нэрийг нь асуу.","question_zh":"你叫什么？","answer":"你叫什么？","explanation_mn":"Нэр асуух өгүүлбэр."},
   {"n":2,"prompt_mn":"Өөрийгөө танилцуул.","question_zh":"你好！我叫……","answer":"你好！我叫……","explanation_mn":"我叫 + нэр."},
   {"n":3,"prompt_mn":"Танилцсандаа баяртай байгаагаа хэл.","question_zh":"认识你很高兴！","answer":"认识你很高兴！","explanation_mn":"Танилцахдаа хэлдэг эелдэг үг."}]},
 "answerSource":"YCT 标准教程 1 · х.61 Test Listening Scripts, х.63 Test Answers (Lesson 2)"}
dump("workbook.json", workbook)

# ---------------- IMAGE PROMPTS ----------------
def ip(file,aspect,title,section,prompt,chars,role=None):
    d={"file":file,"aspect":aspect,"title":title,"section":section}
    if role: d["role"]=role
    d["prompt"]=prompt+" No English text."; d["chars"]=chars; return d
IMG = [
 ip("images/hero.jpg","4:3","你叫什么？","teacher-intro","A cheerful yellow camel teacher with glasses and the young yellow camel boy wave hello to a small friendly green alien child in the schoolyard at sunset; speech bubble with the Chinese text 你叫什么？ in large clear black font.",["temee","huu"],"hero"),
 ip("images/w-wo.jpg","1:1","我","vocabulary","The yellow camel calf boy in blue vest points proudly at his own chest, smiling.",["huu"]),
 ip("images/w-jiao.jpg","1:1","叫","vocabulary","The camel girl in yellow dress holds a hand-made name tag and introduces herself to a friend, name tag on her chest.",["ohin"]),
 ip("images/w-shenme.jpg","1:1","什么","vocabulary","The brown camel boy in green hat tilts his head with a big question mark above him, holding a mystery box.",["bor"]),
 ip("images/w-renshi.jpg","1:1","认识","vocabulary","Two camel calves shake hands happily meeting for the first time in a classroom.",["huu","ohin"]),
 ip("images/w-hen.jpg","1:1","很","vocabulary","A very tall tower of colorful building blocks with the camel calf boy stretching up to reach the top, showing the idea of very much.",["huu"]),
 ip("images/w-gaoxing.jpg","1:1","高兴","vocabulary","The camel girl in yellow dress jumps with joy and a huge smile, confetti around her.",["ohin"]),
 ip("images/w-ta.jpg","1:1","她","vocabulary","The yellow camel calf boy points at the camel girl in yellow dress with pink ribbon standing at a distance.",["huu","ohin"]),
 ip("images/w-ma.jpg","1:1","吗","vocabulary","The camel teacher with glasses asks a question with a big glowing question mark bubble floating above, kids listening.",["temee"]),
 ip("images/w-bu.jpg","1:1","不","vocabulary","The brown camel boy in green hat shakes his head and crosses his arms in a no gesture.",["bor"]),
 ip("images/d1.jpg","4:3","你好！我叫星星，你叫什么？","dialogue","A small friendly green alien child in a silver suit hovers in a glowing beam outside a window and waves; the camel girl in yellow dress leans out of the window; speech bubble with the Chinese text 你好！我叫星星，你叫什么？ in large clear black font.",["ohin"]),
 ip("images/d2.jpg","4:3","你认识她吗？","dialogue","The yellow camel calf boy asks the camel girl at a doorway while a green alien girl waits in the garden behind; speech bubble with the Chinese text 你认识她吗？ in large clear black font.",["huu","ohin"]),
 ip("images/d3.jpg","4:3","你好！我叫李芳，你叫什么？","dialogue","In a bright classroom two camel calves exchange handmade name cards; speech bubble with the Chinese text 你好！我叫李芳 in large clear black font.",["huu","ohin"]),
 ip("images/play.jpg","4:3","起名字","song","Camel teacher shows a poster of Chinese names; camel calves write their Chinese names on paper name cards with colorful markers; the cards show the characters 李 王 张 刘.",["temee","huu","ohin","bor"]),
]
dump("image_prompts.json", IMG, BASE)

# ---------------- LESSON / MANIFEST ----------------
images = [{"id":d["file"].split("/")[1].rsplit(".",1)[0],"file":d["file"],"title":d["title"],"role":d.get("role","illustration"),"section":d["section"]} for d in IMG] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in range(1,7)]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 2-р хичээл — Чамайг юу гэдэг вэ?","chineseTitle":"你叫什么？","targetTitle":"你叫什么？","mongolianTitle":"Чамайг юу гэдэг вэ?",
 "subtitle":"你叫什么？ · 我叫…… · 你认识她吗？ · 认识你很高兴 · нэрийн хуудас тоглоом",
 "description":"Нэр асуух (你叫什么？), нэрээ хэлэх (我叫……), танилцах (认识你很高兴), «таних уу?» гэж асуух. 9 үг, 3 зурагт яриа, 3 түлхүүр өгүүлбэр, 27 шалгалтын асуулт, номын тест (сонсох 3 + унших 3) — АЛБАН АУДИО, ЗУРАГТАЙ.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🙋","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第2课《你叫什么？》 [hskLevel=1] [lessonNumber=2]; эх: YCT1标准教程.pdf х.5–8, х.61 (сонсголын текст), х.63 (хариу); аудио CD 02-01…02-03"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你叫什么？","mongolianTitle":"Чамайг юу гэдэг вэ?",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第2课 (сурах бичиг + CD аудио 02-01..03 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":"байхгүй","test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers х.63)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан)"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
