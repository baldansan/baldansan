#!/usr/bin/env python3
"""YCT 标准教程 1 · 第1课 你好 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib
OUT = "/home/claude/work/yct1-l01/pkg"
CID, LID, N = "yct-1", "yct-1-l01", 1
os.makedirs(OUT, exist_ok=True)

def dump(name, obj):
    with open(f"{OUT}/{name}", "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

def shuffle(options, correct, seed):
    """Тогтвортой hash-аар холино; буцаах: (options, correct_index)."""
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    opts = list(options)
    for i in range(len(opts) - 1, 0, -1):
        j = h % (i + 1); h //= (i + 1)
        opts[i], opts[j] = opts[j], opts[i]
    return opts, opts.index(correct)

# ---------------- VOCAB ----------------
NUM = [("一","yī","нэг"),("二","èr","хоёр"),("三","sān","гурав"),("四","sì","дөрөв"),("五","wǔ","тав"),
       ("六","liù","зургаа"),("七","qī","долоо"),("八","bā","найм"),("九","jiǔ","ес"),("十","shí","арав")]
VOCAB = [
 ("你","nǐ","чи","төлөөний үг · гол үг","你好！","Nǐ hǎo!","Сайн уу! (чи сайн уу)",True),
 ("好","hǎo","сайн","тэмдэг нэр · гол үг","你好！","Nǐ hǎo!","Сайн уу!",True),
 ("老师","lǎoshī","багш","нэр үг · гол үг","老师好！","Lǎoshī hǎo!","Багш аа, сайн байна уу!",True),
 ("再见","zàijiàn","баяртай","хэллэг · гол үг","再见！","Zàijiàn!","Баяртай!",True),
] + [(z,p,m,"тоо","" if z!="一" else "一、二、三。","" if z!="一" else "Yī, èr, sān.","" if z!="一" else "Нэг, хоёр, гурав.",False) for z,p,m in NUM]
vocab = []
for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB):
    if z in dict((a,b) for a,b,c in NUM) and not ez:
        k = [a for a,b,c in NUM].index(z)
        ez = "、".join(a for a,b,c in NUM[:k+1]) + "。" if k < 10 else ""
        ep = ", ".join(b for a,b,c in NUM[:k+1]) + "."
        em = ", ".join(c for a,b,c in NUM[:k+1]) + " (тоолж үзье)"
    vocab.append({"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,
                  "exampleMongolian":em,"hskLevel":"YCT 1","keyWord":key,"orderIndex":i+1})
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_TEST = "audio/yct-1-01-words.mp3","audio/yct-1-01-text.mp3","audio/yct-1-01-song.mp3","audio/yct-1-01-test.mp3"
def tok(s):
    """'你|nǐ 好|hǎo ！|' → tokens"""
    out=[]
    for t in s.split(" "):
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Сургуулийн хашаанд","scene_mn":"Хоёр сурагч өглөө сургууль дээрээ уулзаж мэндэлнэ.","audio":AUD_TEXT,
  "lines":[{"speaker":"A","zh":"你好！","pinyin":"Nǐ hǎo!","mn":"Сайн уу!"},{"speaker":"B","zh":"你好！","pinyin":"Nǐ hǎo!","mn":"Сайн уу!"}]},
 {"id":2,"title_mn":"Яриа 2 · Ангид багштайгаа","scene_mn":"Сурагч ангид орж ирээд багштайгаа мэндэлнэ.","audio":AUD_TEXT,
  "lines":[{"speaker":"Сурагч","zh":"老师好！","pinyin":"Lǎoshī hǎo!","mn":"Багш аа, сайн байна уу!"},{"speaker":"Багш","zh":"你好！","pinyin":"Nǐ hǎo!","mn":"Сайн уу!"}]},
 {"id":3,"title_mn":"Яриа 3 · Хичээл тараад","scene_mn":"Хичээл тарахад хоёр сурагч салах ёс хийнэ.","audio":AUD_TEXT,
  "lines":[{"speaker":"A","zh":"再见！","pinyin":"Zàijiàn!","mn":"Баяртай!"},{"speaker":"B","zh":"再见！","pinyin":"Zàijiàn!","mn":"Баяртай!"}]},
]
song_lines = [
 ("你好，你好，你好，你好。","Nǐ hǎo, nǐ hǎo, nǐ hǎo, nǐ hǎo.","Сайн уу, сайн уу, сайн уу, сайн уу.","你|nǐ 好|hǎo ，| 你|nǐ 好|hǎo ，| 你|nǐ 好|hǎo ，| 你|nǐ 好|hǎo 。|"),
 ("你好吗？你好吗？","Nǐ hǎo ma? Nǐ hǎo ma?","Сайн байна уу? Сайн байна уу?","你|nǐ 好|hǎo 吗|ma ？| 你|nǐ 好|hǎo 吗|ma ？|"),
 ("我很好，再见。我很好，再见。","Wǒ hěn hǎo, zàijiàn. Wǒ hěn hǎo, zàijiàn.","Би сайн байна, баяртай. Би сайн байна, баяртай.","我|wǒ 很|hěn 好|hǎo ，| 再见|zàijiàn 。| 我|wǒ 很|hěn 好|hǎo ，| 再见|zàijiàn 。|"),
 ("再见，再见。","Zàijiàn, zàijiàn.","Баяртай, баяртай.","再见|zàijiàn ，| 再见|zàijiàn 。|"),
]
AUD_MAIN="audio/yct-1-01-text-song.mp3"
sentences=[]
dlg_lines=[
 (1,"A：你好！","A: Nǐ hǎo!","А: Сайн уу!","A：| 你|nǐ 好|hǎo ！|","你好 — анхны мэндчилгээ. Хоёр сурагч сургуулийн хашаанд уулзаж байна.",["你好"]),
 (1,"B：你好！","B: Nǐ hǎo!","Б: Сайн уу!","B：| 你|nǐ 好|hǎo ！|",None,[]),
 (2,"学生：老师好！","Xuésheng: Lǎoshī hǎo!","Сурагч: Багш аа, сайн байна уу!","学生：| 老师|lǎoshī 好|hǎo ！|","老师好 — багштайгаа мэндлэхдээ 你-гийн оронд 老师 гэж тавина.",["你好"]),
 (2,"老师：你好！","Lǎoshī: Nǐ hǎo!","Багш: Сайн уу!","老师：| 你|nǐ 好|hǎo ！|",None,[]),
 (3,"A：再见！","A: Zàijiàn!","А: Баяртай!","A：| 再见|zàijiàn ！|","再见 — салахдаа хэлнэ. Хичээл тарлаа.",["再见"]),
 (3,"B：再见！","B: Zàijiàn!","Б: Баяртай!","B：| 再见|zàijiàn ！|",None,[]),
]
for para,zh,py,mn,tk,note,ks in dlg_lines:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note; s["key_structures"]=ks
    sentences.append(s)
for i,(zh,py,mn,tk) in enumerate(song_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==1: s["note"]="你好吗？ — «Сайн байна уу?» гэж асууж байна. 吗 нь өгүүлбэрийн төгсгөлд орж асуулт болгодог. Энэ үг дараагийн хичээлүүдэд дахин гарна, одоохондоо дуугаар нь л цээжилье."; s["key_structures"]=["你好"]
    if i==2: s["note"]="我很好 — «Би сайн байна». 很 = «маш, их», харин «我很好» гэдэг нь зүгээр л «би сайн» гэсэн утгатай."; s["key_structures"]=["再见"]
    sentences.append(s)

texts = {
 "unit":{"number":"1","title":"你好！","mongolianTitle":"Сайн уу! — мэндлэх, баяртай гэж хэлэх, 1–10 хүртэл тоолох"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өнөөдрөөс бид хятад хэл сурч эхэлнэ. Хамгийн түрүүнд юу сурах вэ? Мэндлэх! Хятадаар «сайн уу» гэдгийг «你好 (nǐ hǎo)» гэдэг. Багштайгаа мэндлэхдээ «老师好 (lǎoshī hǎo)» гэнэ. Хичээл тараад гэртээ харихдаа «再见 (zàijiàn)» — «баяртай» гэж хэлнэ. Мөн өнөөдөр бид нэгээс арав хүртэл хятадаар тоолж сурна: 一, 二, 三… Гараараа тоо зааж тоглоно, «你好» дууг дуулна. Бэлэн үү? Эхэлцгээе!",
  "warmup_mn":"Чи монголоор хэдэн янзаар мэндэлдэг вэ? Багштайгаа яаж мэндэлдэг вэ? Нэгээс арав хүртэл гараараа тоолж үзээрэй — хятадаар ч гараараа тоолдог, гэхдээ арай өөрөөр!",
  "theme_zh":"问候 · 再见 · 数字 1–10","theme_mn":"Мэндлэх · Баяртай гэж хэлэх · Тоо 1–10"},
 "warmup":{"mongolian":"Чи монголоор хэдэн янзаар мэндэлдэг вэ? Багштайгаа яаж мэндэлдэг вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"1","title":"你好！","mongolianTitle":"Сайн уу! — яриа ба дуу","title_mn":"Let's read · 3 яриа + Let's sing · 你好 (дуу)","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第1课 Let's sing（CD 01-03）","author_zh":"",
  "intro_zh":"三段小对话：你好！老师好！再见！然后一起唱儿歌“你好”。","intro_mn":"Эхлээд гурван богино яриа: сургуулийн хашаанд «你好!», ангид багштайгаа «老师好!», хичээл тараад «再见!». Дараа нь 1-р хичээлийн дуу. «Сайн уу», «баяртай» гэж хамтдаа дуулцгаая. Эхлээд аудиог сонс, дараа нь хамт дуул, гараараа даллаж бүжиглэ!",
  "sentences":sentences,
  "paragraph_summaries":[{"paragraph":1,"mn":"Яриа 1 — Сургуулийн хашаанд хоёр сурагч уулзаад «你好!» гэж мэндэлнэ."},{"paragraph":2,"mn":"Яриа 2 — Сурагч ангид орж ирээд «老师好!» гэнэ, багш «你好!» гэж хариулна."},{"paragraph":3,"mn":"Яриа 3 — Хичээл тараад хоёр сурагч «再见!» гэж салах ёс хийнэ."},{"paragraph":4,"mn":"Дуу «你好». Дуунд «你好» (сайн уу), «你好吗» (сайн байна уу), «我很好» (би сайн байна), «再见» (баяртай) гэсэн дөрвөн хэллэг давтагдана. Хоёр хүүхэд уулзаж мэндлээд, салахдаа баяртай гэж хэлж байгаа мэт дуул."}],
  "reflection":{"questions_mn":["Өглөө сургуульд ороод багштайгаа хятадаар яаж мэндлэх вэ?","Найзтайгаа салахдаа хятадаар юу гэж хэлэх вэ?","Хятадаар нэгээс арав хүртэл тоолж үзээрэй. Аль тоог хэлэхэд хамгийн хэцүү байна?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Өөрийгөө танилцуулж мэндэл","zh":"老师好！你好！再见！","pinyin":"Lǎoshī hǎo! Nǐ hǎo! Zàijiàn!","mn":"Багш аа, сайн байна уу! Сайн уу! Баяртай!"},
  "writingPrompt_mn":"Гурван хүнтэй мэндэл: багштайгаа (老师好), найзтайгаа (你好), дараа нь салах ёс хий (再见). Гараараа даллаж, чанга хэл!"},
 "properNouns":[],
 "wordExplanation":[
  {"word":"你好","gloss":"nǐ hǎo — сайн уу","explanation":"你 = чи, 好 = сайн. Хоёрыг нийлүүлбэл «你好» — хятад хүмүүсийн хамгийн энгийн мэндчилгээ. Өглөө, өдөр, орой хэзээ ч хэлж болно. Хэлэхдээ 你-г арай өндөр (ní), 好-г доош уруудуулаад дээш (hǎo) гэж хэл.",
   "structure":"你好！ · 老师好！ · 妈妈好！ (хүний нэр/дуудлага + 好)","teacher_notes":"Хоёр 3-р аялгуу дараалахад эхнийх нь 2-р аялгуу шиг дуудагдана: nǐ hǎo → ní hǎo. Хүүхдэд «аялгуу» гэж тайлбарлахгүй, зүгээр л багшийн араас давтуулна.",
   "examples":[{"chinese":"你好！","pinyin":"Nǐ hǎo!","mongolian":"Сайн уу!"},{"chinese":"老师好！","pinyin":"Lǎoshī hǎo!","mongolian":"Багш аа, сайн байна уу!"},{"chinese":"你好吗？","pinyin":"Nǐ hǎo ma?","mongolian":"Сайн байна уу?"}],
   "common_mistakes":[{"wrong":"好你！","right":"你好！","why":"Дараалал: эхлээд 你 (чи), дараа нь 好 (сайн)."}],
   "check":{"question":"Найзтайгаа уулзаад юу гэж хэлэх вэ?","options":["你好！","再见！","老师！"],"answer":"0"},
   "practice":[{"n":1,"question":"Ээжтэйгээ хятадаар мэндэл: ________好！","answer":"妈妈","explanation_mn":"Хэн нэгний нэр, дуудлага + 好. 妈妈 (ээж) гэдэг үг дараагийн хичээлд гарна."}]},
  {"word":"再见","gloss":"zàijiàn — баяртай","explanation":"再 = дахин, 见 = уулзах. «Дахин уулзъя» гэсэн утгатай тул салахдаа хэлдэг. Монголоор «баяртай» гэдэгтэй яг адил.",
   "structure":"再见！ · 老师再见！ (хүн + 再见)","teacher_notes":"Хүүхдүүд ихэвчлэн 再 ба 见-г тус тусад нь хэлж сурахыг хүсдэг — нэг үг шиг «zàijiàn» гэж хурдан хэлүүл.",
   "examples":[{"chinese":"再见！","pinyin":"Zàijiàn!","mongolian":"Баяртай!"},{"chinese":"老师再见！","pinyin":"Lǎoshī zàijiàn!","mongolian":"Багш аа, баяртай!"},{"chinese":"再见，再见。","pinyin":"Zàijiàn, zàijiàn.","mongolian":"Баяртай, баяртай."}],
   "common_mistakes":[{"wrong":"Уулзахдаа «再见！» гэх","right":"Уулзахдаа «你好！», салахдаа «再见！»","why":"再见 зөвхөн салахдаа хэлнэ."}],
   "check":{"question":"Хичээл тараад багшдаа юу гэж хэлэх вэ?","options":["老师再见！","老师好！","你好！"],"answer":"0"},
   "practice":[{"n":1,"question":"Гэртээ харихдаа найздаа: ________！","answer":"再见","explanation_mn":"Салахдаа 再见."}]},
 ],
 "collocations":[{"type":"好 / 再见 — хэнд хэлэх","rows":[
   {"head":"你","with":"好","mn":"сайн уу (найз, үе тэнгийн хүнд)","usage_mn":"Хамгийн энгийн мэндчилгээ","example":{"zh":"你好！","pinyin":"Nǐ hǎo!","mn":"Сайн уу!"}},
   {"head":"老师","with":"好","mn":"багш аа, сайн байна уу","usage_mn":"Багштайгаа мэндлэхэд","example":{"zh":"老师好！","pinyin":"Lǎoshī hǎo!","mn":"Багш аа, сайн байна уу!"}},
   {"head":"老师","with":"再见","mn":"багш аа, баяртай","usage_mn":"Багштайгаа салахад","example":{"zh":"老师再见！","pinyin":"Lǎoshī zàijiàn!","mn":"Багш аа, баяртай!"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Let's match — зүүн талын хэллэгт зөв хариултыг нь ол.","banks":[{"words":["你好","再见","老师好"],"items":[
     {"n":1,"question":"你好。→ ________","answer":"你好","explanation_mn":"«Сайн уу» гэхэд «сайн уу» гэж хариулна."},
     {"n":2,"question":"老师好。→ ________","answer":"你好","explanation_mn":"Багш сурагчдаа «你好» гэж хариулна (номд: 老师好 → 你好)."},
     {"n":3,"question":"再见。→ ________","answer":"再见","explanation_mn":"«Баяртай» гэхэд «баяртай» гэнэ."}]}],
   "answer_source":"textbook (Let's match, х.3)"},
  "comprehension":{"instruction_mn":"Let's read — зургийг хараад асуултад хариул.","items":[
     {"n":1,"question_zh":"两个学生见面说什么？","answer":"你好！","explanation_mn":"Хоёр сурагч уулзахдаа «你好» гэж мэндэлнэ."},
     {"n":2,"question_zh":"学生对老师说什么？","answer":"老师好！","explanation_mn":"Сурагч багштайгаа «老师好» гэж мэндэлнэ."},
     {"n":3,"question_zh":"放学的时候说什么？","answer":"再见！","explanation_mn":"Хичээл тараад «再见» гэж салах ёс хийнэ."}],
   "answer_source":"textbook_verified"},
  "retell":{"instruction_mn":"Let's play — Гарын тоглоом: нэг хүүхэд гараараа тоо заана, нөгөө нь хятадаар хэлнэ (1–10). Дараа нь солино. Хурдан хурдан!","prompts":[
     {"label":"Тоолъё","start_zh":"一、二、三……"},{"label":"Мэндэлье","start_zh":"你好！……"},{"label":"Баяртай","start_zh":"再见！……"}]}},
 "grammarNotes":[],
 "culture":{"title":"中国的手势数字","title_mn":"Хятадын гарын тоо","text_mn":"Хятадад нэгээс арав хүртэлх тоог нэг гараараа заадаг! 1–5 нь манайхтай адил хуруугаар. Харин 6 — эрхий, чигчий хоёрыг дэлгэнэ (утас шиг), 7 — гурван хурууны үзүүрийг нийлүүлнэ, 8 — эрхий, долоовор хоёрыг буу шиг дэлгэнэ, 9 — долоовор хуруугаа дэгээ шиг нугална, 10 — нударга зангидна эсвэл хоёр долоовор хуруугаа загалмайлна. Номын 3-р хуудасны зургийг хараад найзтайгаа тоглоорой.","note_mn":"Монголд бид хоёр гараараа тоолдог, хятадууд нэг гараараа — захын дэлгүүрт үнэ хэлэхэд ч ингэж заадаг."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — мэндлэх, салах ёс, тоолох.","topic":"Ангидаа хятадаар мэндэлцгээе!","discussion":["Хосоороо: нэг нь багш, нөгөө нь сурагч болж «老师好！» «你好！» «再见！» гэж жүжиглэ.","Бүгдээрээ тойрог болж суугаад ээлжлэн 一-ээс 十 хүртэл тоолно, бүр хурдан!"],
   "writing":{"promptChinese":"你好！再见！","promptMongolian":"Гэрийн даалгавар: ээж, аав, ах эгчтэйгээ хятадаар мэндлээд (你好) унтахдаа баяртай гэж хэл (再见). Маргааш ангидаа ярьж өг.","minChars":"0","requiredWords":["你好","再见"],"sampleChinese":"妈妈，你好！妈妈，再见！","sampleMongolian":"Ээж ээ, сайн уу! Ээж ээ, баяртай!","gradingRubric":"Зөв дуудлага, зоригтой чанга хэлсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L1 1.B 2.A 3.C 4.✗ 5.✗ 6.✓","parts":[]},
}
dump("texts.json", texts)

# ---------------- GRAMMAR (Key sentences) ----------------
def ex(zh,py,mn): return {"chinese":zh,"pinyin":py,"mongolian":mn}
def choice(q,opts,ans,ok,wrong,seed):
    o,i = shuffle(opts,ans,seed); return {"type":"choice","question":q,"options":o,"answer":str(i),"explanation_correct_mn":ok,"explanation_wrong_mn":wrong}
def judge(q,ans,ok,wrong): return {"type":"judge","question":q,"options":["Зөв","Буруу"],"answer":"true" if ans else "false","explanation_correct_mn":ok,"explanation_wrong_mn":wrong}
def chk(q,opts,ans,seed):
    o,i=shuffle(opts,ans,seed); return {"question":q,"options":o,"answer":str(i)}

grammar = [
 {"point":"你好！ — мэндлэх","gloss_mn":"«Сайн уу!» — хэнтэй ч, хэзээ ч хэлж болох мэндчилгээ",
  "structure":"你好！  ·  хүн + 好！ (老师好！)",
  "teacher_mn":"Хятад хүүхдүүд өглөө сургууль дээрээ уулзахдаа «你好!» гэж хэлдэг. 你 нь «чи», 好 нь «сайн». Багштайгаа мэндлэхдээ 你-гийн оронд 老师 гэж тавиад «老师好!» гэнэ. Хариуд нь мөн «你好!» гэж хэлнэ. Инээмсэглээд, гараа даллаад хэл!",
  "teacher_notes":"你好 хэлэхэд nǐ → ní болж өөрчлөгддөг (3+3 аялгуу). Хүүхдэд дүрэм тайлбарлахгүй, аудио сонсгоод давтуул. «老师好» гэдэг нь сургуулийн соёл — Хятадад сурагчид багш ангид ороход бүгд босож «老师好!» гэж хэлдэг.",
  "examples":[ex("你好！","Nǐ hǎo!","Сайн уу!"),ex("老师好！","Lǎoshī hǎo!","Багш аа, сайн байна уу!"),ex("A：你好！ B：你好！","A: Nǐ hǎo! B: Nǐ hǎo!","А: Сайн уу! Б: Сайн уу!"),ex("你好吗？","Nǐ hǎo ma?","Сайн байна уу? (дуунаас)")],
  "common_mistakes":[{"wrong":"好老师！","right":"老师好！","why":"Хүн/дуудлага эхэнд, 好 ард нь."},{"wrong":"Салахдаа «你好!» гэх","right":"Салахдаа «再见!»","why":"你好 уулзахад, 再见 салахад."}],
  "check":chk("Сургууль дээрээ найзтайгаа уулзлаа. Юу гэж хэлэх вэ?",["你好！","再见！","七！"],"你好！","g1c"),
  "exercises":[
   choice("Багш ангид орж ирлээ. Сурагчид: ________！",["老师好","再见","老师再见"],"老师好","Зөв! Багштай уулзахад «老师好».","Уулзахад мэндлэх ёстой, салахдаа 再见 гэнэ.","g1e1"),
   judge("«你好» гэдэг нь «баяртай» гэсэн үг.",False,"Зөв — 你好 бол «сайн уу».","你好 = сайн уу, 再见 = баяртай."),
   choice("«你好» гэдэг үгийн эхний ханз 你 ямар утгатай вэ?",["чи","сайн","багш"],"чи","Зөв! 你 = чи, 好 = сайн.","你 = чи. 好 = сайн, 老师 = багш.","g1e3")]},
 {"point":"再见！ — салах ёс","gloss_mn":"«Баяртай!» — салахдаа хэлнэ",
  "structure":"再见！  ·  хүн + 再见！ (老师再见！)",
  "teacher_mn":"Хичээл тараад, гэртээ харихдаа «再见!» гэж хэлнэ. 再 = дахин, 见 = уулзах — «дахин уулзъя» гэсэн утгатай. Багшдаа «老师再见!» гэнэ. Гараа даллаад хэлэхэд бүр сайхан!",
  "teacher_notes":"再见 — хоёр ханз нэг үг. Хүүхдүүд «zài-jiàn» гэж хоёр хэсэг болгож хэлдэг, нэг амьсгаагаар хэлүүл.",
  "examples":[ex("再见！","Zàijiàn!","Баяртай!"),ex("老师再见！","Lǎoshī zàijiàn!","Багш аа, баяртай!"),ex("A：再见！ B：再见！","A: Zàijiàn! B: Zàijiàn!","А: Баяртай! Б: Баяртай!"),ex("我很好，再见。","Wǒ hěn hǎo, zàijiàn.","Би сайн байна, баяртай. (дуунаас)")],
  "common_mistakes":[{"wrong":"见再！","right":"再见！","why":"Дараалал: 再 эхэнд, 见 ард."}],
  "check":chk("Хичээл тарлаа. Багшдаа юу гэж хэлэх вэ?",["老师再见！","老师好！","你好！"],"老师再见！","g2c"),
  "exercises":[
   choice("Найз чинь гэртээ харих гэж байна. Чи: ________！",["再见","你好","老师好"],"再见","Зөв! Салахдаа 再见.","你好/老师好 бол уулзахад хэлдэг мэндчилгээ.","g2e1"),
   judge("«老师再见!» гэдэг нь «Багш аа, баяртай!» гэсэн үг.",True,"Зөв!","老师 = багш, 再见 = баяртай."),
   choice("Аль нь салахдаа хэлэх үг вэ?",["再见","你好","十"],"再见","Зөв!","你好 — уулзахад, 十 — тоо «арав».","g2e3")]},
 {"point":"一～十 — тоолох","gloss_mn":"Нэгээс арав хүртэлх тоо",
  "structure":"一 二 三 四 五 六 七 八 九 十  (yī èr sān sì wǔ liù qī bā jiǔ shí)",
  "teacher_mn":"Хятадаар тоолъё: 一 (yī), 二 (èr), 三 (sān), 四 (sì), 五 (wǔ), 六 (liù), 七 (qī), 八 (bā), 九 (jiǔ), 十 (shí). Хараарай — 一 нэг зураас, 二 хоёр зураас, 三 гурван зураас! Гараараа тоо зааж тоглоцгооё: нэг нь гараараа заана, нөгөө нь хятадаар хэлнэ.",
  "teacher_notes":"四 (sì) ба 十 (shí)-г хүүхдүүд андуурдаг — s ба sh ялгааг аудиогоор давтуул. 一 нь тоолоход yī, харин дараа нь үгийн өмнө yí/yì болж өөрчлөгддөг (дараагийн хичээлүүдэд).",
  "examples":[ex("一、二、三。","Yī, èr, sān.","Нэг, хоёр, гурав."),ex("四、五、六。","Sì, wǔ, liù.","Дөрөв, тав, зургаа."),ex("七、八、九、十。","Qī, bā, jiǔ, shí.","Долоо, найм, ес, арав."),ex("一、二、三、四、五、六、七、八、九、十！","Yī, èr, sān, sì, wǔ, liù, qī, bā, jiǔ, shí!","1, 2, 3, 4, 5, 6, 7, 8, 9, 10!")],
  "common_mistakes":[{"wrong":"四 = арав","right":"四 = дөрөв, 十 = арав","why":"sì / shí хоёр ойролцоо сонсогдоно — анхаар."},{"wrong":"三 = хоёр","right":"三 = гурав","why":"Зураасаа тоол: 二 хоёр зураас, 三 гурван зураас."}],
  "check":chk("«七» хэд вэ?",["долоо","зургаа","найм"],"долоо","g3c"),
  "exercises":[
   choice("一、二、三、________、五",["四","六","十"],"四","Зөв! Гуравын дараа дөрөв (四).","Дарааллаар: 一 二 三 四 五.","g3e1"),
   choice("«Арав» хятадаар ________",["十","四","七"],"十","Зөв! 十 = shí = арав.","四 = дөрөв, 七 = долоо.","g3e2"),
   choice("Гурван зураастай ханз аль нь вэ?",["三","二","一"],"三","Зөв! 三 = гурав.","一 нэг зураас, 二 хоёр зураас, 三 гурван зураас.","g3e3"),
   judge("«八» гэдэг нь «ес» гэсэн тоо.",False,"Зөв — 八 = найм, 九 = ес.","八 (bā) = найм. 九 (jiǔ) = ес.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ (~20) ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
NUMMN=dict((z,m) for z,p,m in NUM); NUMPY=dict((z,p) for z,p,m in NUM)
q("choice","«Сайн уу» хятадаар аль нь вэ?",["你好","再见","老师","三"],"你好","你好 = сайн уу. 再见 = баяртай, 老师 = багш, 三 = гурав.","easy",["vocabulary"],"q1")
q("choice","«Баяртай» хятадаар аль нь вэ?",["再见","你好","老师","十"],"再见","再见 = баяртай. 你好 = сайн уу, 老师 = багш, 十 = арав.","easy",["vocabulary"],"q2")
q("choice","«老师» гэж юу вэ?",["багш","найз","ээж","сурагч"],"багш","老师 (lǎoshī) = багш.","easy",["vocabulary"],"q3")
q("choice","Багш ангид орж ирэхэд сурагчид юу гэж хэлэх вэ?",["老师好！","老师再见！","你好吗？","五！"],"老师好！","Уулзахад 老师好 (багш аа, сайн байна уу). 老师再见 — салахад.","easy",["dialogue"],"q4")
q("choice","Хичээл тараад хэлэх үг:",["再见！","你好！","老师好！","一！"],"再见！","Салахдаа 再见.","easy",["dialogue"],"q5")
q("cloze","A：你好！ B：（ ）！",["你好","再见","老师","九"],"你好","«Сайн уу» гэхэд «сайн уу» гэж хариулна.","easy",["dialogue"],"q6")
q("cloze","A：再见！ B：（ ）！",["再见","你好","老师好","六"],"再见","«Баяртай» гэхэд «баяртай» гэж хариулна.","easy",["dialogue"],"q7")
for z,p,m in [NUM[0],NUM[2],NUM[4],NUM[6],NUM[9]]:
    others=[x for x in NUMMN.values() if x!=m][:3]
    q("choice",f"«{z}» ({p}) хэд вэ?",[m]+others,m,f"{z} = {m}.","easy",["number"],"qn"+z)
for z,p,m in [NUM[1],NUM[3],NUM[5],NUM[7],NUM[8]]:
    others=[x for x in NUMMN if x!=z][:3]
    q("choice",f"«{m}» хятадаар аль нь вэ?",[z]+others,z,f"{m} = {z} ({p}).","easy",["number"],"qm"+z)
q("choice","Дарааллаар: 五、六、（ ）、八",["七","九","四","十"],"七","5, 6, 7, 8 — 七 = долоо.","medium",["number"],"q18")
q("choice","Пиньинь «shí» гэж уншдаг ханз:",["十","四","七","三"],"十","十 = shí = арав. 四 = sì (дөрөв) — андуурахгүй!","medium",["pronunciation"],"q19")
q("choice","Пиньинь «zàijiàn» гэж уншдаг үг:",["再见","你好","老师","你"],"再见","再见 = zàijiàn = баяртай.","easy",["pronunciation"],"q20")
q("usage","Найз чинь «你好!» гэлээ. Чи юу гэж хэлэх вэ?",["你好！","再见！","老师！","二！"],"你好！","Мэндчилгээнд мэндчилгээгээр хариулна.","easy",["usage"],"q21")
q("usage","«老师再见!» гэдгийг хэзээ хэлэх вэ?",["Багштайгаа салахдаа","Багштайгаа уулзахдаа","Тоолохдоо","Дуулахдаа"],"Багштайгаа салахдаа","再见 = баяртай — салахад.","medium",["usage"],"q22")
q("choice","«你» гэдэг үг ямар утгатай вэ?",["чи","би","багш","сайн"],"чи","你 = чи. 好 = сайн, 老师 = багш.","easy",["vocabulary"],"q23")
q("choice","«好» гэдэг үг ямар утгатай вэ?",["сайн","муу","том","чи"],"сайн","好 (hǎo) = сайн.","easy",["vocabulary"],"q24")
q("choice","Дарааллаар: 八、九、（ ）",["十","七","六","一"],"十","8, 9, 10 — 十 = арав.","medium",["number"],"q25")
q("choice","Пиньинь «lǎoshī» гэж уншдаг үг:",["老师","再见","你好","九"],"老师","老师 = lǎoshī = багш.","easy",["pronunciation"],"q26")
dump("quiz.json", Q)

# ---------------- WORKBOOK (Test) ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"listening","instruction_mn":"Сонсох — Аудио (01-04) сонсоод зөв зургийг сонго (A/B/C).","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）六","question_mn":"1-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t1a"),img("t1b"),img("t1c")],"answer":"B","script_zh":"六","explanation_mn":"Аудионд «六 (liù) — зургаа» гэж хэлнэ. B зураг дээр охин 6 тоо барьж байна. A — 5, C — 0/нүдний шил."},
    {"n":2,"question_zh":"（听录音）你好。","question_mn":"2-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t2a"),img("t2b"),img("t2c")],"answer":"A","script_zh":"你好。","explanation_mn":"«你好 — сайн уу» — A зураг дээр хоёр хүүхэд гар барьж мэндэлж байна. B — гараа даллаж салах ёс, C — хоёр охин зураг авахуулж байна."},
    {"n":3,"question_zh":"（听录音）老师再见。","question_mn":"3-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t3a"),img("t3b"),img("t3c")],"answer":"C","script_zh":"老师再见。","explanation_mn":"«老师再见 — багш аа, баяртай» — C зураг дээр хүүхдүүд машинаас багшдаа гараа даллан баяртай гэж байна."}],
   "answer_source":"Test Answers х.63: 1.B 2.A 3.C; Listening script х.61"},
  {"part":2,"type":"judge","instruction_mn":"Унших — Зураг ба үг таарч байвал ✓, таарахгүй бол ✗.","items":[
    {"n":4,"question_zh":"七","image":img("t4"),"answer":"✗","explanation_mn":"Зураг дээр дөрвөн навчтай цэцэг — дөрөв бол 四. 七 бол долоо → ✗."},
    {"n":5,"question_zh":"老师","image":img("t5"),"answer":"✗","explanation_mn":"Зураг дээр цүнхтэй охин — сурагч. 老师 = багш → ✗."},
    {"n":6,"question_zh":"再见","image":img("t6"),"answer":"✓","explanation_mn":"Хүүхэд гараа даллаж байна — 再见 (баяртай) → ✓."}],
   "answer_source":"Test Answers х.63: 4.✗ 5.✗ 6.✓"},
  {"part":3,"type":"match","instruction_mn":"Let's match — хэллэг ба хариултыг холбо.","items":[
    {"n":1,"question_zh":"你好。","answer":"你好。","explanation_mn":"Сайн уу → Сайн уу."},
    {"n":2,"question_zh":"老师好。","answer":"你好。","explanation_mn":"Багш «你好» гэж хариулна."},
    {"n":3,"question_zh":"再见。","answer":"再见。","explanation_mn":"Баяртай → Баяртай."}],
   "answer_source":"textbook х.3"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханз бичих — 一 二 三 гурван ханзыг зураасаар нь бич (нэг, хоёр, гурван хэвтээ зураас).","question_zh":"一 二 三","answer":"一 二 三","explanation_mn":"Зураасыг зүүнээс баруун тийш, дээрээс доош бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Багштайгаа мэндэл.","question_zh":"老师好！","answer":"老师好！","explanation_mn":"Уулзахад 老师好."},
   {"n":2,"prompt_mn":"Гараараа 1–10 зааж хятадаар хэл.","question_zh":"一……十","answer":"一 二 三 四 五 六 七 八 九 十","explanation_mn":"Дарааллаар, чанга."},
   {"n":3,"prompt_mn":"«你好» дууг дуул.","question_zh":"你好，你好……","answer":"(нээлттэй)","explanation_mn":"Аудио 01-03-ийн хамт."}]},
 "answerSource":"YCT 标准教程 1 · х.61 Test Listening Scripts, х.63 Test Answers (Lesson 1)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
images = [
 {"id":"hero","file":"images/d1-nihao.png","title":"你好！ — сургуулийн хашаанд мэндлэх","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1-nihao.png","title":"你好！","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2-laoshihao.png","title":"老师好！","role":"illustration","section":"dialogue"},
 {"id":"d3","file":"images/d3-zaijian.png","title":"再见！","role":"illustration","section":"dialogue"},
 {"id":"hands","file":"images/hands.png","title":"Хятадын гарын тоо 1–10","role":"illustration","section":"culture"},
 {"id":"sing","file":"images/sing-girl.png","title":"Let's sing · 你好","role":"illustration","section":"song"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in [("ni","你"),("hao","好"),("laoshi","老师"),("zaijian","再见")]] \
  + [{"id":f"n{i+1}","file":f"images/n{i+1}.png","title":z,"role":"illustration","section":"vocabulary"} for i,(z,p,m) in enumerate(NUM)] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","2a","2b","2c","3a","3b","3c","4","5","6"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 1-р хичээл — Сайн уу!","chineseTitle":"你好！","targetTitle":"你好！","mongolianTitle":"Сайн уу!",
 "subtitle":"你好 · 老师好 · 再见 · тоо 一～十 · «你好» дуу · гарын тоглоом",
 "description":"Мэндлэх (你好, 老师好), баяртай гэж хэлэх (再见), 1–10 хүртэл тоолох. 14 үг, 3 зурагт яриа, 1 дуу, 3 түлхүүр өгүүлбэр, 22 шалгалтын асуулт, номын тест (сонсох 3 + унших 3) — АЛБАН АУДИО, ЗУРАГТАЙ.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":1,"icon":"👋","thumbnailFile":"images/d1-nihao.png","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":texts["lessonIntro"] | {},
 "sourceNote":"YCT 标准教程 1 — 第1课《你好！》 [hskLevel=1] [lessonNumber=1]; эх: YCT1标准教程.pdf х.1–4, х.61 (сонсголын текст), х.63 (хариу); аудио CD 01-01…01-04"
}
lesson["hook"]={"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你好！","mongolianTitle":"Сайн уу!",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第1课 (сурах бичиг + CD аудио 01-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers х.63)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан)"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"song lines",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
