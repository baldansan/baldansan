#!/usr/bin/env python3
"""YCT 标准教程 2 · 第1课 我可以坐这儿吗？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
OUT = "/home/claude/work/yct2/l01/pkg"
CID, LID, N = "yct-2", "yct-2-l01", 1
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

# Тестийн зургийг номын х.9 (hi-09.png)-аас хайчлах
from PIL import Image
_pg = Image.open("/home/claude/work/yct2/l01/pages/hi-09.png").convert("RGB")
_BOX = {"t1":(400,375,610,545),"t2":(400,550,580,715),"t3":(420,730,600,895),"t4":(385,905,605,1075)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS)
    _c.save(f"{OUT}/images/{_k}.png")
# Mini story (х.8, hi-08.png) — 4 зураг
_st = Image.open("/home/claude/work/yct2/l01/pages/hi-08.png").convert("RGB").crop((170,335,1200,1570))
_st.save(f"{OUT}/images/story.png")

# audio: яриа (01-02) + chant (01-03) нийлүүлэх
A = f"{OUT}/audio"
AUD_WARM, AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = "audio/yct-2-00-01.mp3", *[f"audio/yct-2-01-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-2-01-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-2-01-02.mp3'\nfile '{A}/yct-2-01-03.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("可以","kěyǐ","болно, чадна","үйл үг · гол үг","我可以坐这儿吗？","Wǒ kěyǐ zuò zhèr ma?","Би энд суувал болох уу?",True),
 ("坐","zuò","суух","үйл үг · гол үг","请坐。","Qǐng zuò.","Суугаарай.",True),
 ("请","qǐng","гуйя, ...аарай (эелдгээр хэлэх үг)","үйл үг · гол үг","请坐。","Qǐng zuò.","Суугаарай.",True),
 ("不客气","bú kèqi","зүгээр ээ (талархалд хариулах үг)","хэллэг · гол үг","谢谢！——不客气。","Xièxie! — Bú kèqi.","Баярлалаа! — Зүгээр ээ.",True),
 ("不要","bú yào","битгий, ... хэрэггүй","үйл үг · гол үг","请不要说话。","Qǐng bú yào shuōhuà.","Дуугүй байгаарай (ярихгүй байгаарай).",True),
 ("说话","shuōhuà","ярих","үйл үг · гол үг","请不要说话。","Qǐng bú yào shuōhuà.","Дуугүй байгаарай (ярихгүй байгаарай).",True),
 ("对不起","duìbuqǐ","уучлаарай","хэллэг · гол үг","好的，对不起。","Hǎode, duìbuqǐ.","За, уучлаарай.",True),
 ("没关系","méi guānxi","зүгээр, зовох юмгүй","хэллэг · гол үг","对不起！——没关系。","Duìbuqǐ! — Méi guānxi.","Уучлаарай! — Зүгээр дээ.",True),
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
 {"id":1,"title_mn":"Яриа 1 · Номын санд","scene_mn":"Номын санд олон ширээ байна. Хүү нэг охины ширээнд суухыг хүсэж, эелдгээр асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"大卫","zh":"你好，我可以坐这儿吗？","pinyin":"Nǐ hǎo, wǒ kěyǐ zuò zhèr ma?","mn":"Сайн уу, би энд суувал болох уу?"},
           {"speaker":"月月","zh":"可以。请坐。","pinyin":"Kěyǐ. Qǐng zuò.","mn":"Болно. Суугаарай."},
           {"speaker":"大卫","zh":"谢谢！","pinyin":"Xièxie!","mn":"Баярлалаа!"},
           {"speaker":"月月","zh":"不客气。","pinyin":"Bú kèqi.","mn":"Зүгээр ээ."}]},
 {"id":2,"title_mn":"Яриа 2 · Номын сан чимээгүй байх ёстой","scene_mn":"Хоёр хүү номын санд чанга ярьж байна. Нэг охин тэднийг дуугүй байхыг эелдгээр хэлж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"月月","zh":"请不要说话。","pinyin":"Qǐng bú yào shuōhuà.","mn":"Дуугүй байгаарай."},
           {"speaker":"大卫","zh":"好的，对不起。","pinyin":"Hǎode, duìbuqǐ.","mn":"За, уучлаарай."},
           {"speaker":"月月","zh":"没关系。","pinyin":"Méi guānxi.","mn":"Зүгээр дээ."}]},
]
sentences=[]
dlg = [
 (1,"大卫：你好，我可以坐这儿吗？","Dàwèi: Nǐ hǎo, wǒ kěyǐ zuò zhèr ma?","Дэвид: Сайн уу, би энд суувал болох уу?","大卫：| 你好|nǐ hǎo ，| 我|wǒ 可以|kěyǐ 坐|zuò 这儿|zhèr 吗|ma ？|","我可以坐这儿吗？ — өөр хүний ширээнд суухаасаа өмнө эелдгээр асууна. 可以 = болно, 吗 = асуулт.",["我可以坐这儿吗？"]),
 (1,"月月：可以。请坐。","Yuèyue: Kěyǐ. Qǐng zuò.","Юэ-юэ: Болно. Суугаарай.","月月：| 可以|kěyǐ 。| 请|qǐng 坐|zuò 。|","Болно гэвэл «可以». 请 нь эелдэг үг: «请坐» = «Суугаарай».",[]),
 (1,"大卫：谢谢！","Dàwèi: Xièxie!","Дэвид: Баярлалаа!","大卫：| 谢谢|xièxie ！|","",[]),
 (1,"月月：不客气。","Yuèyue: Bú kèqi.","Юэ-юэ: Зүгээр ээ.","月月：| 不客气|bú kèqi 。|","Баярлалаа гэсэнд «不客气» гэж хариулна.",[]),
 (2,"月月：请不要说话。","Yuèyue: Qǐng bú yào shuōhuà.","Юэ-юэ: Дуугүй байгаарай.","月月：| 请|qǐng 不要|bú yào 说话|shuōhuà 。|","请不要…… = «……хийхгүй байгаарай». 不要 = битгий. Эелдгээр хориглоно.",["请不要说话。"]),
 (2,"大卫：好的，对不起。","Dàwèi: Hǎode, duìbuqǐ.","Дэвид: За, уучлаарай.","大卫：| 好的|hǎode ，| 对不起|duìbuqǐ 。|","Буруу хийвэл «对不起» гэж уучлал гуйна.",[]),
 (2,"月月：没关系。","Yuèyue: Méi guānxi.","Юэ-юэ: Зүгээр дээ.","月月：| 没关系|méi guānxi 。|","«对不起»-д «没关系» гэж хариулна.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("灰姑娘：我可以去吗？","Huīgūniang: Wǒ kěyǐ qù ma?","Үнсгэлжин: Би явж болох уу?","灰姑娘：| 我|wǒ 可以|kěyǐ 去|qù 吗|ma ？|","Mini story «灰姑娘» (Үнсгэлжин) — 4 зурагт үлгэр. 去 = явах."),
 ("后妈：不可以。","Hòumā: Bù kěyǐ.","Хойд эх: Болохгүй.","后妈：| 不|bù 可以|kěyǐ 。|","不可以 = болохгүй."),
 ("灰姑娘：我可以穿吗？","Huīgūniang: Wǒ kěyǐ chuān ma?","Үнсгэлжин: Би үүнийг өмсөж болох уу?","灰姑娘：| 我|wǒ 可以|kěyǐ 穿|chuān 吗|ma ？|","穿 = өмсөх."),
 ("仙女：可以。","Xiānnǚ: Kěyǐ.","Шидэт эмээ: Болно.","仙女：| 可以|kěyǐ 。|",""),
 ("灰姑娘：谢谢你！","Huīgūniang: Xièxie nǐ!","Үнсгэлжин: Баярлалаа!","灰姑娘：| 谢谢|xièxie 你|nǐ ！|",""),
 ("王子：我可以请你跳舞吗？","Wángzǐ: Wǒ kěyǐ qǐng nǐ tiàowǔ ma?","Ханхүү: Би чамайг бүжиглэхийг урьж болох уу?","王子：| 我|wǒ 可以|kěyǐ 请|qǐng 你|nǐ 跳舞|tiàowǔ 吗|ma ？|","跳舞 = бүжиглэх."),
 ("灰姑娘：好的。","Huīgūniang: Hǎode.","Үнсгэлжин: За.","灰姑娘：| 好的|hǎode 。|",""),
 ("王子：你去哪儿？","Wángzǐ: Nǐ qù nǎr?","Ханхүү: Чи хаачих вэ?","王子：| 你|nǐ 去|qù 哪儿|nǎr ？|","哪儿 = хаана, хаашаа. Үнсгэлжин гутлаа алдаад гүйж байна. Төгсгөлийг нь мэдэх үү?"),
]
for zh,py,mn,tk,note in story:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if note: s["note"]=note
    sentences.append(s)
chant = [
 ("爸爸，爸爸，谢谢您。","Bàba, bàba, xièxie nín.","Аав аа, аав аа, баярлалаа.","爸爸|bàba ，| 爸爸|bàba ，| 谢谢|xièxie 您|nín 。|","Chant «谢谢您 · 对不起» — аав, ээж, ах, эгчдээ баярлалаа гэж хэлээд, уучлалт гуйж дуулна. 您 = «та» (том хүнд хүндэтгэлтэй хэлэх «чи»)."),
 ("妈妈，妈妈，谢谢您。","Māma, māma, xièxie nín.","Ээж ээ, ээж ээ, баярлалаа.","妈妈|māma ，| 妈妈|māma ，| 谢谢|xièxie 您|nín 。|",""),
 ("哥哥，哥哥，谢谢你。","Gēge, gēge, xièxie nǐ.","Ах аа, ах аа, баярлалаа.","哥哥|gēge ，| 哥哥|gēge ，| 谢谢|xièxie 你|nǐ 。|",""),
 ("姐姐，姐姐，谢谢你。","Jiějie, jiějie, xièxie nǐ.","Эгч ээ, эгч ээ, баярлалаа.","姐姐|jiějie ，| 姐姐|jiějie ，| 谢谢|xièxie 你|nǐ 。|",""),
 ("不客气，不客气。","Bú kèqi, bú kèqi.","Зүгээр ээ, зүгээр ээ.","不客气|bú kèqi ，| 不客气|bú kèqi 。|",""),
 ("爸爸，爸爸，对不起。","Bàba, bàba, duìbuqǐ.","Аав аа, аав аа, уучлаарай.","爸爸|bàba ，| 爸爸|bàba ，| 对不起|duìbuqǐ 。|",""),
 ("妈妈，妈妈，对不起。","Māma, māma, duìbuqǐ.","Ээж ээ, ээж ээ, уучлаарай.","妈妈|māma ，| 妈妈|māma ，| 对不起|duìbuqǐ 。|",""),
 ("哥哥，哥哥，对不起。","Gēge, gēge, duìbuqǐ.","Ах аа, ах аа, уучлаарай.","哥哥|gēge ，| 哥哥|gēge ，| 对不起|duìbuqǐ 。|",""),
 ("姐姐，姐姐，对不起。","Jiějie, jiějie, duìbuqǐ.","Эгч ээ, эгч ээ, уучлаарай.","姐姐|jiějie ，| 姐姐|jiějie ，| 对不起|duìbuqǐ 。|",""),
 ("没关系，没关系。","Méi guānxi, méi guānxi.","Зүгээр дээ, зүгээр дээ.","没关系|méi guānxi ，| 没关系|méi guānxi 。|","Дуулахдаа хажууд байгаа хүнээ тэврээд «没关系» гэж хэлээрэй."),
]
for zh,py,mn,tk,note in chant:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if note: s["note"]=note
    sentences.append(s)

WARM_Q = [("你叫什么？","Nǐ jiào shénme?","Чамайг хэн гэдэг вэ?"),("你多大？","Nǐ duō dà?","Чи хэдэн настай вэ?"),("你是哪国人？","Nǐ shì nǎ guó rén?","Чи аль орны хүн бэ?"),("你喜欢吃什么？","Nǐ xǐhuan chī shénme?","Чи юу идэх дуртай вэ?")]
WARM_W = [("面条","miàntiáo","гоймон"),("教室","jiàoshì","анги танхим"),("米饭","mǐfàn","будаа"),("商店","shāngdiàn","дэлгүүр"),("水","shuǐ","ус"),("小狗","xiǎo gǒu","гөлөг"),("牛奶","niúnǎi","сүү"),("小猫","xiǎo māo","муур"),("手","shǒu","гар"),("苹果","píngguǒ","алим"),("头发","tóufa","үс"),("眼睛","yǎnjing","нүд")]

texts = {
 "unit":{"number":"1","title":"我可以坐这儿吗？","mongolianTitle":"Би энд суувал болох уу? — эелдэг хэлэх нь"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи өмнөх номонд «你好», «谢谢», тоо, өнгө, гэр бүлээ хятадаар хэлж сурсан. Одоо чи том болж, YCT 2-т орлоо! Өнөөдөр бид эелдэг хүүхэд болно. Номын санд өөр хүний ширээнд суухаасаа өмнө «我可以坐这儿吗？» гэж асууна. Чимээ шуугиантай байвал «请不要说话» гэж зөөлөн хэлнэ. Буруу хийвэл «对不起», хариуд нь «没关系» гэнэ. Эхлээд хуучин үгсээ давтаад, дараа нь шинэ үгээ сурцгаая. Эхэлцгээе!",
  "warmup_mn":"Хуучин үгээ санаж байна уу? Аудио сонсоод 12 зургаас сонссон зургуудаа ол. Нэг зураг аудионд ороогүй — аль нь вэ? Дараа нь найздаа «你叫什么？» гэж асуугаарай.",
  "theme_zh":"请 · 可以 · 谢谢 · 对不起","theme_mn":"Эелдэг хэллэг · Болох уу · Баярлалаа · Уучлаарай"},
 "warmup":{"mongolian":"Хуучин үгсээ давтья: 12 зургийг сонсоод ол. Найзтайгаа танилц.","audio":AUD_WARM,
   "questions":[{"zh":a,"pinyin":b,"mn":c} for a,b,c in WARM_Q],
   "words":[{"zh":a,"pinyin":b,"mn":c} for a,b,c in WARM_W],
   "game_mn":"Аудиог сонсоод зураг бүрийг тэмдэглэ. Аудионд хэлээгүй зураг аль нь вэ? Дараа нь хос болж 4 асуулт асууж, найзынхаа хариултыг ангид танилцуул. «你好» гэж эхэл!"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"1","title":"我可以坐这儿吗？","mongolianTitle":"Би энд суувал болох уу? — яриа, үлгэр, дуу","title_mn":"Let's read · 2 яриа + Mini story 灰姑娘 + Let's chant · 谢谢您 对不起","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第1课 Let's read / Let's chant / Mini story（CD 01-02, 01-03, 01-04）","author_zh":"",
  "intro_zh":"在图书馆，我可以坐这儿吗？请不要说话。谢谢，对不起，没关系。",
  "intro_mn":"Эхлээд номын санд болсон хоёр богино яриаг сонс: суухыг хүсэх, чимээгүй байхыг хүсэх. Дараа нь «谢谢您 · 对不起» дууг хөдөлгөөнтэй дуул. Хамгийн сүүлд «Үнсгэлжин» үлгэрийн 4 зургийг хараад жүжигчил. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Номын санд хүү «我可以坐这儿吗？» гэж асууна. Охин «可以，请坐» гэнэ. Хүү «谢谢», охин «不客气» гэнэ."},
   {"paragraph":2,"mn":"Яриа 2 — Хоёр хүү чанга ярьж байна. Охин «请不要说话» гэхэд хүү «好的，对不起» гэнэ. Охин «没关系» гэж хариулна."},
   {"paragraph":3,"mn":"Үлгэр «灰姑娘» (Үнсгэлжин) — «我可以……吗？» гэж асуух бүтцээр: явж болох уу? (болохгүй), өмсөж болох уу? (болно), бүжиглэж болох уу? (за). Аудио: 01-04."},
   {"paragraph":4,"mn":"Chant «谢谢您 · 对不起» — аав, ээж, ах, эгчдээ баярлаж, уучлалт гуйгаад «不客气», «没关系» гэж хариулна."}],
  "reflection":{"questions_mn":["Хүнд талархахдаа хятадаар юу гэж хэлэх вэ? Түүнд юу гэж хариулах вэ?","Буруу хийвэл «对不起» гэнэ. Түүнд юу гэж хариулдаг вэ?","Чи өөр хүний ширээнд суухаасаа өмнө юу гэж асуух вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Эелдгээр асуу","zh":"你好，我可以坐这儿吗？","pinyin":"Nǐ hǎo, wǒ kěyǐ zuò zhèr ma?","mn":"Сайн уу, би энд суувал болох уу?"},
  "writingPrompt_mn":"Найзаасаа «我可以……吗？» гэж асуугаад «可以» эсвэл «不可以» гэсэн хариу сонс. Дараа нь «谢谢» гэж хэл!"},
 "properNouns":[{"zh":"灰姑娘","pinyin":"Huīgūniang","mn":"Үнсгэлжин (үлгэрийн охин)"},{"zh":"后妈","pinyin":"hòumā","mn":"хойд эх"},{"zh":"仙女","pinyin":"xiānnǚ","mn":"шидэт эмээ, дагина"},{"zh":"王子","pinyin":"wángzǐ","mn":"ханхүү"}],
 "wordExplanation":[
  {"word":"可以","gloss":"kěyǐ — болно, чадна","explanation":"Өөр хүнээс зөвшөөрөл асуухдаа «我可以……吗？» гэж хэлнэ. «Болно» гэвэл «可以», «болохгүй» гэвэл «不可以». Номын санд «我可以坐这儿吗？» гэвэл «Би энд суувал болох уу?» гэсэн үг.",
   "structure":"我可以 + үйлдэл + 吗？ → 可以。/ 不可以。","teacher_notes":"Хүүхдүүд өдөр тутам «болох уу?» гэж олон асуудаг. Тэр бүр дээр «我可以……吗？» гэж хэлүүл. Дүрмийн нэр томьёо хэрэглэхгүй.",
   "examples":[{"chinese":"我可以坐这儿吗？","pinyin":"Wǒ kěyǐ zuò zhèr ma?","mongolian":"Би энд суувал болох уу?"},{"chinese":"我可以去吗？","pinyin":"Wǒ kěyǐ qù ma?","mongolian":"Би явж болох уу?"},{"chinese":"不可以。","pinyin":"Bù kěyǐ.","mongolian":"Болохгүй."}],
   "common_mistakes":[{"wrong":"我坐这儿可以吗？(吗 ба 可以-г солих)","right":"我可以坐这儿吗？","why":"可以 нь «坐»-н өмнө, 吗 нь өгүүлбэрийн эцэст."}],
   "check":{"question":"«Би энд суувал болох уу?» хятадаар:","options":["我可以坐这儿吗？","请不要说话。","没关系。"],"answer":"0"},
   "practice":[{"n":1,"question":"我 ________ 坐这儿吗？(болно)","answer":"可以","explanation_mn":"«Болох уу» гэж асуухдаа 可以."}]},
  {"word":"请","gloss":"qǐng — гуйя, ...аарай","explanation":"请 нь эелдэг үг. «请坐» = «Суугаарай». «请不要说话» = «Дуугүй байгаарай». Багшид, том хүнд, найздаа ч хэлж болно.",
   "structure":"请 + үйлдэл。 · 请不要 + үйлдэл。","teacher_notes":"不要 = «битгий». «请» нэмбэл зөөлөн сонсогдоно.",
   "examples":[{"chinese":"请坐。","pinyin":"Qǐng zuò.","mongolian":"Суугаарай."},{"chinese":"请不要说话。","pinyin":"Qǐng bú yào shuōhuà.","mongolian":"Дуугүй байгаарай."},{"chinese":"我可以请你跳舞吗？","pinyin":"Wǒ kěyǐ qǐng nǐ tiàowǔ ma?","mongolian":"Би чамайг бүжиглэхийг урьж болох уу?"}],
   "common_mistakes":[{"wrong":"不要说话。(请 хэлэхгүй)","right":"请不要说话。","why":"请 нэмбэл эелдэг сонсогдоно."}],
   "check":{"question":"«Суугаарай» хятадаар:","options":["请坐。","谢谢。","对不起。"],"answer":"0"},
   "practice":[{"n":1,"question":"请 ________ 说话。(битгий)","answer":"不要","explanation_mn":"«Битгий» гэж хэлэхдээ 不要."}]},
 ],
 "collocations":[{"type":"Баярлах ба уучлал гуйх","rows":[
   {"head":"谢谢","with":"不客气","mn":"баярлалаа — зүгээр ээ","usage_mn":"Талархалд хариулна","example":{"zh":"谢谢！——不客气。","pinyin":"Xièxie! — Bú kèqi.","mn":"Баярлалаа! — Зүгээр ээ."}},
   {"head":"对不起","with":"没关系","mn":"уучлаарай — зүгээр дээ","usage_mn":"Уучлалт гуйхад хариулна","example":{"zh":"对不起！——没关系。","pinyin":"Duìbuqǐ! — Méi guānxi.","mn":"Уучлаарай! — Зүгээр дээ."}},
   {"head":"请","with":"坐","mn":"суугаарай","usage_mn":"Хүнийг суухыг урина","example":{"zh":"请坐。","pinyin":"Qǐng zuò.","mn":"Суугаарай."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["可以","请","不要","对不起"],"items":[
     {"n":1,"question":"我 ________ 坐这儿吗？","answer":"可以","explanation_mn":"«Болох уу?» гэж асуухдаа 可以."},
     {"n":2,"question":"________ 坐。","answer":"请","explanation_mn":"«Суугаарай» — 请坐."},
     {"n":3,"question":"请 ________ 说话。","answer":"不要","explanation_mn":"«Ярихгүй байгаарай» — 请不要说话."},
     {"n":4,"question":"________，没关系。","answer":"对不起","explanation_mn":"Уучлалт гуйхад 对不起, хариулахдаа 没关系."}]}],
   "answer_source":"agent-authored (YCT 2 · L1 үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"他可以坐这儿吗？","answer":"可以。","explanation_mn":"Яриа 1 — охин «可以。请坐。» гэж хариулав."},
     {"n":2,"question_zh":"谁在说话？","answer":"两个男孩。","explanation_mn":"Яриа 2 — хоёр хүү чанга ярьж байхад охин «请不要说话» гэв."}],
   "answer_source":"textbook_verified (Let's read, х.6)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"N-1 тоглоом","start_zh":"可以","instruction_mn":"Хүн бүр багш болж ээлжлэн шинэ үгийг хэлнэ. Хэд хэлснээс нэг дор цөөн удаа давт! Жишээ нь багш «对不起» гэж 3 удаа хэлбэл чи 2 удаа хэл."},
     {"label":"Дүр бүтээе (4 зураг)","start_zh":"我可以坐这儿吗？","instruction_mn":"Номын 4 зургаас нэгийг сонго: багшид мэндлэх, автобуст суудал өгөх, бөмбөгөөр мөргөлдөж уучлал гуйх, автобусанд явах. Найзтайгаа хятадаар «你好 / 请坐 / 谢谢 / 对不起 / 没关系 / 再见» гэж дүр бүтээ."},
     {"label":"Баярлалаа-Зүгээр ээ чант","start_zh":"谢谢您","instruction_mn":"Аав, ээж, ах, эгчийнхээ нэрийг хэлж «谢谢您» гэж бөхийж баярла. Тэд «不客气» гэж хариулна. Дараа нь «对不起» гэхэд «没关系» гэж хариул."},
     {"label":"Үнсгэлжин жүжиг","start_zh":"我可以去吗？","instruction_mn":"4 зургийг хараад жүжигчил: Үнсгэлжин, хойд эх, шидэт эмээ, ханхүү. Төгсгөлийг мэдэх үү? Найзуудаасаа асуугаад бүтэн үлгэрийг тогло!"}]}},
 "grammarNotes":[],
 "culture":{"title":"您 — хүндэтгэлтэй «чи»","title_mn":"Хятад хүүхэд өвөө эмээ, багшдаа «您» гэдэг","text_mn":"Дууны эхний хэсэгт «谢谢您» гэж байгаа. 您 (nín) гэдэг нь «чи»-гийн хүндэтгэлтэй хэлбэр. Хятад хүүхэд аав, ээж, багш, өвөө эмээдээ «谢谢您» гэж хэлдэг. Монголд бид том хүндээ «та» гэдэг шиг л дээ.","note_mn":"Чи багшдаа «чи» гэж хэлдэг үү, «та» гэж хэлдэг үү? Хятад хүүхэд ч адилхан хүндэтгэлтэй үг хэлдэг юм."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — эелдгээр зөвшөөрөл асуух, талархах, уучлал гуйх.","topic":"Эелдэг хүүхэд бол","discussion":["Хосоороо: «我可以坐这儿吗？» гэж асууж, «可以。请坐。» гэж хариул.","Бүгдээрээ «谢谢您 · 对不起» дууг хөдөлгөөнтэй дуул."],
   "writing":{"promptChinese":"我可以……吗？","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «谢谢您» гэж хэлээд, нэг удаа «对不起» гэж уучлал гуй.","minChars":"0","requiredWords":["可以","请","对不起"],"sampleChinese":"你好，我可以坐这儿吗？","sampleMongolian":"Сайн уу, би энд суувал болох уу?","gradingRubric":"Эелдэг үгээ зөв, зохистой үед хэлсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers: L1 1.✗ 2.✓ 3.✓ 4.✗ 5.C 6.A 7.D 8.B","parts":[]},
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
 {"point":"我可以坐这儿吗？ — болох уу гэж асуух","gloss_mn":"«Би энд суувал болох уу?» — зөвшөөрөл асуух",
  "structure":"我可以 + үйлдэл + 吗？ → 可以。/ 不可以。",
  "teacher_mn":"Ямар нэг юм хийхийн өмнө зөвшөөрөл асуувал эелдэг хүүхэд болно. «我可以……吗？» гэж хэлээд, төгсгөлд нь «吗» нэм. Хариуд нь «可以» гэвэл болно, «不可以» гэвэл болохгүй. Хажууд суух гэж байвал «我可以坐这儿吗？» гэж үз!",
  "teacher_notes":"Номын яриа: 你好，我可以坐这儿吗？— 可以。请坐。 Үлгэрт 我可以去吗？/ 我可以穿吗？ гэж олон давтагдана.",
  "examples":[ex("我可以坐这儿吗？","Wǒ kěyǐ zuò zhèr ma?","Би энд суувал болох уу?"),ex("可以。请坐。","Kěyǐ. Qǐng zuò.","Болно. Суугаарай."),ex("我可以去吗？","Wǒ kěyǐ qù ma?","Би явж болох уу?"),ex("不可以。","Bù kěyǐ.","Болохгүй.")],
  "common_mistakes":[{"wrong":"我坐这儿可以吗？","right":"我可以坐这儿吗？","why":"Дараалал: 我 → 可以 → юу хийх → 吗."}],
  "check":chk("«Би явж болох уу?» хятадаар:",["我可以去吗？","请不要说话。","谢谢你。"],"我可以去吗？","g1c"),
  "exercises":[
   choice("我 ________ 坐这儿吗？",["可以","对不起","没关系"],"可以","Зөв! 可以 = болно.","可以 = болно, 对不起 = уучлаарай, 没关系 = зүгээр.","g1e1"),
   choice("Хүн «我可以坐这儿吗？» гэж асуулаа. Болно гэвэл:",["可以。请坐。","对不起。","请不要说话。"],"可以。请坐。","Зөв! 可以 + 请坐.","Болно гэвэл «可以» гэж хариулна.","g1e2"),
   judge("«不可以» гэдэг нь «болохгүй» гэсэн үг.",True,"Зөв! 不 = үгүй, 可以 = болно, 不可以 = болохгүй.","不可以 = болохгүй.")]},
 {"point":"请不要说话。 — эелдгээр хориглох","gloss_mn":"«Дуугүй байгаарай» — 请 ба 不要",
  "structure":"请 + 不要 + үйлдэл。 · 请 + үйлдэл。",
  "teacher_mn":"Хэн нэгэнд «битгий хий» гэж хэлэхдээ «不要» гэнэ. Урд нь «请» нэмбэл зөөлөн сонсогдоно: «请不要说话» — «Дуугүй байгаарай». «请坐» гэвэл «Суугаарай». Номын санд, ангид ингэж хэлээрэй. Хуруугаа амандаа тавиад «шш» гэж хэл!",
  "teacher_notes":"Test зураг 3: хуруугаа амандаа тавьсан эмэгтэй = 请不要说话。",
  "examples":[ex("请不要说话。","Qǐng bú yào shuōhuà.","Дуугүй байгаарай."),ex("请坐。","Qǐng zuò.","Суугаарай."),ex("好的，对不起。","Hǎode, duìbuqǐ.","За, уучлаарай."),ex("不说话","bù shuōhuà","ярихгүй")],
  "common_mistakes":[{"wrong":"请不说话。","right":"请不要说话。","why":"«Битгий» гэж хориглохдоо 不要 хэлнэ."}],
  "check":chk("«Дуугүй байгаарай» хятадаар:",["请不要说话。","请坐。","没关系。"],"请不要说话。","g2c"),
  "exercises":[
   choice("请 ________ 说话。",["不要","可以","谢谢"],"不要","Зөв! 不要 = битгий.","不要 = битгий.","g2e1"),
   choice("Номын санд чанга ярьж байгаа хүүд юу гэх вэ?",["请不要说话。","请坐。","不客气。"],"请不要说话。","Зөв!","Ярихыг хориглохдоо 请不要说话.","g2e2"),
   judge("«请坐» гэдэг нь «Суугаарай» гэсэн үг.",True,"Зөв! 请 = ...аарай, 坐 = суух.","请坐 = Суугаарай.")]},
 {"point":"谢谢 · 不客气 · 对不起 · 没关系","gloss_mn":"Баярлах ба уучлал гуйх, хариулах",
  "structure":"谢谢 → 不客气  ·  对不起 → 没关系",
  "teacher_mn":"Хоёр хос үгийг цээжил. Хэн нэгэн танд тусалбал «谢谢», тэр «不客气» гэнэ. Буруу хийвэл «对不起», тэр «没关系» гэнэ. Дууны хөгжимтэй хамт хэлээд үз!",
  "teacher_notes":"Chant: 谢谢您/谢谢你 → 不客气; 对不起 → 没关系. Let's match: 谢谢→不客气, 对不起→没关系.",
  "examples":[ex("谢谢！——不客气。","Xièxie! — Bú kèqi.","Баярлалаа! — Зүгээр ээ."),ex("对不起！——没关系。","Duìbuqǐ! — Méi guānxi.","Уучлаарай! — Зүгээр дээ."),ex("谢谢你！","Xièxie nǐ!","Баярлалаа!")],
  "common_mistakes":[{"wrong":"谢谢——没关系。","right":"谢谢——不客气。","why":"Талархалд «不客气», уучлалтад «没关系»."}],
  "check":chk("«Баярлалаа» гэсэнд хариулах нь:",["不客气。","没关系。","对不起。"],"不客气。","g3c"),
  "exercises":[
   choice("对不起！—— ________。",["没关系","不客气","请坐"],"没关系","Зөв! Уучлалтад 没关系.","Уучлалтад 没关系 гэж хариулна.","g3e1"),
   choice("谢谢！—— ________。",["不客气","没关系","不可以"],"不客气","Зөв! Талархалд 不客气.","Талархалд 不客气 гэж хариулна.","g3e2"),
   judge("«对不起» гэдэг нь «баярлалаа» гэсэн үг.",False,"Зөв — 对不起 = уучлаарай, 谢谢 = баярлалаа.","对不起 = уучлаарай.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Болно, чадна» хятадаар аль нь вэ?",["可以","对不起","没关系","不要"],"可以","可以 (kěyǐ) = болно.","easy",["vocabulary"],"a1")
q("choice","«Суух» хятадаар аль нь вэ?",["坐","请","说话","去"],"坐","坐 (zuò) = суух.","easy",["vocabulary"],"a2")
q("choice","«请» гэдэг үг ямар утгатай вэ?",["гуйя, ...аарай","баярлалаа","уучлаарай","ярих"],"гуйя, ...аарай","请 (qǐng) — эелдэг үг.","easy",["vocabulary"],"a3")
q("choice","«Зүгээр ээ (талархалд хариулах)» хятадаар:",["不客气","没关系","对不起","不要"],"不客气","不客气 (bú kèqi).","easy",["vocabulary"],"a4")
q("choice","«Битгий» хятадаар аль нь вэ?",["不要","可以","请","坐"],"不要","不要 (bú yào) = битгий.","medium",["vocabulary"],"a5")
q("choice","«Ярих» хятадаар аль нь вэ?",["说话","坐","吃","喝"],"说话","说话 (shuōhuà) = ярих.","easy",["vocabulary"],"a6")
q("choice","«Уучлаарай» хятадаар аль нь вэ?",["对不起","没关系","不客气","谢谢"],"对不起","对不起 (duìbuqǐ).","easy",["vocabulary"],"a7")
q("choice","«Зүгээр дээ (уучлалтад хариулах)» хятадаар:",["没关系","对不起","请坐","你好"],"没关系","没关系 (méi guānxi).","easy",["vocabulary"],"a8")
q("choice","«Би энд суувал болох уу?» хятадаар:",["我可以坐这儿吗？","请不要说话。","我爱爸爸。","你叫什么？"],"我可以坐这儿吗？","可以 = болно, 坐 = суух.","easy",["dialogue"],"a9")
q("choice","«Суугаарай» хятадаар:",["请坐。","谢谢。","再见。","对不起。"],"请坐。","请坐 = суугаарай.","easy",["dialogue"],"a10")
q("choice","«Дуугүй байгаарай» хятадаар:",["请不要说话。","我可以去吗？","没关系。","你好。"],"请不要说话。","请不要说话 = дуугүй байгаарай.","medium",["dialogue"],"a11")
q("choice","«我可以坐这儿吗？» гэж асуулаа. Болно гэвэл юу гэх вэ?",["可以。请坐。","对不起。","请不要说话。","再见。"],"可以。请坐。","Болно гэвэл 可以.","easy",["dialogue"],"a12")
q("choice","Хүн «谢谢！» гэвэл чи юу гэх вэ?",["不客气。","没关系。","对不起。","请坐。"],"不客气。","Талархалд 不客气.","easy",["dialogue"],"a13")
q("choice","Хүн «对不起！» гэвэл чи юу гэх вэ?",["没关系。","不客气。","请坐。","谢谢。"],"没关系。","Уучлалтад 没关系.","easy",["dialogue"],"a14")
q("cloze","我（ ）坐这儿吗？",["可以","请","对不起","谢谢"],"可以","«Болох уу» — 可以.","easy",["dialogue"],"a15")
q("cloze","（ ）坐。",["请","谢谢","说话","不客气"],"请","«Суугаарай» — 请坐.","easy",["dialogue"],"a16")
q("cloze","请（ ）说话。",["不要","可以","对不起","没关系"],"不要","«Битгий» — 不要.","medium",["dialogue"],"a17")
q("cloze","（ ），没关系。",["对不起","不客气","请坐","你好"],"对不起","Уучлалт — 对不起.","easy",["dialogue"],"a18")
q("choice","Пиньинь «duìbuqǐ» гэж уншдаг үг:",["对不起","没关系","不客气","可以"],"对不起","对不起 = duìbuqǐ.","medium",["pronunciation"],"a19")
q("choice","Пиньинь «bú kèqi» гэж уншдаг үг:",["不客气","没关系","说话","请坐"],"不客气","不客气 = bú kèqi.","medium",["pronunciation"],"a20")
q("choice","Пиньинь «méi guānxi» гэж уншдаг үг:",["没关系","对不起","不要","我们"],"没关系","没关系 = méi guānxi.","medium",["pronunciation"],"a21")
q("usage","Номын санд найз чинь чанга ярьж байна. Чи юу гэх вэ?",["请不要说话。","谢谢！","我可以去吗？","没关系。"],"请不要说话。","Дуугүй байхыг эелдгээр хэлнэ.","medium",["usage"],"a22")
q("usage","Чи найзынхаа цүнхийг мөргөчихлөө. Юу гэх вэ?",["对不起。","不客气。","请坐。","再见。"],"对不起。","Буруу хийвэл 对不起.","medium",["usage"],"a23")
q("usage","Үнсгэлжин «我可以去吗？» гэж асуухад хойд эх юу гэв?",["不可以。","可以。","谢谢。","没关系。"],"不可以。","后妈：不可以 — болохгүй.","medium",["usage"],"a24")
q("usage","Үнсгэлжин өмсөж болох уу гэж асуухад шидэт эмээ юу гэв?",["可以。","不可以。","对不起。","再见。"],"可以。","仙女：可以 — болно.","medium",["usage"],"a25")
q("choice","Өмнөх хичээлээс: «Баяртай» хятадаар аль нь вэ?",["再见","你好","谢谢","对不起"],"再见","再见 = баяртай.","easy",["review"],"a26")
q("choice","Өмнөх хичээлээс: «Багш» хятадаар аль нь вэ?",["老师","妈妈","可以","说话"],"老师","老师 = багш.","easy",["review"],"a27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (01-05) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）请坐。","image":img("t1"),"script_zh":"请坐。","answer":"✗","explanation_mn":"Аудионд «请坐 — суугаарай» гэнэ. Зураг дээр хоёр охин тоглоомон баавгайг булаалдаж байна. Суухыг урьж байгаа биш → ✗."},
    {"n":2,"question_zh":"（听录音）谢谢妈妈。","image":img("t2"),"script_zh":"谢谢妈妈。","answer":"✓","explanation_mn":"Аудионд «谢谢妈妈 — ээжид баярлалаа». Зураг дээр ээж охиндоо юм өгөхөд охин баярлаж байна → ✓."},
    {"n":3,"question_zh":"（听录音）请不要说话。","image":img("t3"),"script_zh":"请不要说话。","answer":"✓","explanation_mn":"Аудионд «请不要说话 — дуугүй байгаарай». Зураг дээр эмэгтэй хуруугаа амандаа тавьж «шш» гэж байна → ✓."},
    {"n":4,"question_zh":"（听录音）今天吃面条，可以吗？","image":img("t4"),"script_zh":"今天吃面条，可以吗？","answer":"✗","explanation_mn":"Аудионд «Өнөөдөр гоймон идэж болох уу?» Зураг дээр хүн алим идэж байна, гоймон биш → ✗."}],
   "answer_source":"Test Answers: 1.✗ 2.✓ 3.✓ 4.✗; Listening script х.68/70"},
  {"part":2,"type":"choice","instruction_mn":"Унших — өгүүлбэр бүрд тохирох хариултыг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"谢谢。","question_mn":"Баярлалаа гэвэл...","options":["A 不，谢谢。","B 可以，请坐。","C 不客气。","D 好的，对不起。"],"answer":"C","explanation_mn":"Баярлалаа гэсэнд «不客气» (зүгээр ээ) гэж хариулна. A «үгүй, баярлалаа», B «болно, суугаарай», D «за, уучлаарай»."},
    {"n":6,"question_zh":"你喝水吗？","question_mn":"Ус уух уу?","options":["A 不，谢谢。","B 可以，请坐。","C 不客气。","D 好的，对不起。"],"answer":"A","explanation_mn":"Ус уух уу гэсэнд «不，谢谢» (үгүй, баярлалаа) гэж татгалзаж болно. B суухыг, C талархлыг, D уучлалтыг хэлнэ."},
    {"n":7,"question_zh":"请不要说话。","question_mn":"Дуугүй байгаарай гэвэл...","options":["A 不，谢谢。","B 可以，请坐。","C 不客气。","D 好的，对不起。"],"answer":"D","explanation_mn":"Дуугүй байгаарай гэхэд «好的，对不起» (за, уучлаарай) гэнэ. Бусад нь тохирохгүй."},
    {"n":8,"question_zh":"你好，我可以坐这儿吗？","question_mn":"Би энд суувал болох уу?","options":["A 不，谢谢。","B 可以，请坐。","C 不客气。","D 好的，对不起。"],"answer":"B","explanation_mn":"Суугаарай гэж хариулахдаа «可以，请坐» (болно, суугаарай) гэнэ."}],
   "answer_source":"Test Answers: 5.C 6.A 7.D 8.B"},
  {"part":3,"type":"match","instruction_mn":"Let's match — тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"老师好。","answer":"你好。","explanation_mn":"Мэндэлсэнд мэндээр хариулна."},
    {"n":2,"question_zh":"谢谢。","answer":"不客气。","explanation_mn":"Талархалд 不客气."},
    {"n":3,"question_zh":"对不起。","answer":"没关系。","explanation_mn":"Уучлалтад 没关系."},
    {"n":4,"question_zh":"再见。","answer":"再见。","explanation_mn":"Баяртай гэвэл баяртай гэж хариулна."}],
   "answer_source":"textbook х.5 (Let's match, логикоор)"},
  {"part":4,"type":"match","instruction_mn":"Давтлага — YCT 1-ийн асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"今天星期几？","answer":"今天星期天。","explanation_mn":"Ямар гариг вэ гэсэнд гарагаа хэлнэ."},
    {"n":2,"question_zh":"你爸爸在家吗？","answer":"他不在。","explanation_mn":"Аав гэрт байна уу гэсэнд «Тэр байхгүй»."},
    {"n":3,"question_zh":"这是你的小猫吗？","answer":"不是。","explanation_mn":"«Энэ чиний муур уу?» — «Үгүй»."},
    {"n":4,"question_zh":"今天几月几号？","answer":"今天二月十号。","explanation_mn":"Огноо асуусан."},
    {"n":5,"question_zh":"你家有几口人？","answer":"我家有五口人。","explanation_mn":"Хэдэн хүн вэ гэсэнд тоо хэлнэ."},
    {"n":6,"question_zh":"你吃什么？","answer":"我吃苹果。","explanation_mn":"Юу идэх вэ гэсэнд алим."},
    {"n":7,"question_zh":"你有几个姐姐？","answer":"我有两个姐姐。","explanation_mn":"Хэдэн эгчтэй вэ гэсэнд 两个."}],
   "answer_source":"textbook х.4 (Let's match, логикоор)"},
  {"part":5,"type":"match","instruction_mn":"Үнсгэлжин — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"我可以去吗？——不可以。","answer":"1","explanation_mn":"1-р зураг: хойд эх «болохгүй» гэж байна."},
    {"n":2,"question_zh":"我可以穿吗？——可以。谢谢你！","answer":"2","explanation_mn":"2-р зураг: шидэт эмээ даашинз өгч байна."},
    {"n":3,"question_zh":"我可以请你跳舞吗？——好的。","answer":"3","explanation_mn":"3-р зураг: ханхүү бүжиглэхийг урьж байна."},
    {"n":4,"question_zh":"你去哪儿？","answer":"4","explanation_mn":"4-р зураг: ханхүү араас нь «хаачих вэ» гэж байна."}],
   "answer_source":"textbook х.8 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханз бичих — «请», «坐» гэсэн ханзыг дахин бичиж хуулж үз.","question_zh":"请 坐","answer":"请 坐","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа суухыг эелдгээр асуу.","question_zh":"我可以坐这儿吗？","answer":"我可以坐这儿吗？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":2,"prompt_mn":"Чанга ярьж байгаа найздаа эелдгээр хэл.","question_zh":"请不要说话。","answer":"请不要说话。","explanation_mn":"Хуруугаа амандаа тавь."},
   {"n":3,"prompt_mn":"«谢谢您 · 对不起» дууг хөдөлгөөнтэй дуул.","question_zh":"谢谢您","answer":"(нээлттэй)","explanation_mn":"Аудио 01-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 2 · Test Listening Scripts х.68, Test Answers х.70 (Lesson 1)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("keyi","可以"),("zuo","坐"),("qing","请"),("bukeqi","不客气"),("buyao","不要"),("shuohua","说话"),("duibuqi","对不起"),("meiguanxi","没关系")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"我可以坐这儿吗？","role":"hero","section":"teacher-intro"},
 {"id":"warmup","file":"images/warmup.jpg","title":"热身","role":"illustration","section":"warmup"},
 {"id":"d1","file":"images/d1.jpg","title":"你好，我可以坐这儿吗？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"请不要说话。","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"谢谢您 · 对不起","role":"illustration","section":"song"},
 {"id":"story-jpg","file":"images/story.jpg","title":"灰姑娘","role":"illustration","section":"story"},
 {"id":"story","file":"images/story.png","title":"灰姑娘 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1","2","3","4"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 1-р хичээл — Би энд суувал болох уу?","chineseTitle":"我可以坐这儿吗？","targetTitle":"我可以坐这儿吗？","mongolianTitle":"Би энд суувал болох уу?",
 "subtitle":"可以 · 请 · 不要 · 谢谢您 · 对不起 · 没关系 · 灰姑娘",
 "description":f"Эелдгээр зөвшөөрөл асуух (我可以……吗？), хориглох (请不要……), талархах, уучлал гуйх. {len(vocab)} үг, 2 зурагт яриа, Mini story «灰姑娘», 1 chant, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, YCT 1 давтлагатай Warm-up, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🙏","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第1课《我可以坐这儿吗？》 [hskLevel=1] [lessonNumber=1]; эх: сурах бичиг х.1–7 (Warm-up + Lesson 1), Test Listening Scripts, Test Answers; аудио CD 00-01, 01-01…01-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"我可以坐这儿吗？","mongolianTitle":"Би энд суувал болох уу?",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第1课 (сурах бичиг + CD аудио 00-01, 01-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"song":AUD_SONG,"test":AUD_TEST,"warmup":AUD_WARM,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
