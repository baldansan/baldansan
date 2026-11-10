#!/usr/bin/env python3
"""YCT 标准教程 4 · 第3课 早上八点半就开门。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess, shutil
BASE = "/home/claude/work/yct4/l03"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-4", "yct-4-l03", 3
os.makedirs(f"{OUT}/images", exist_ok=True)

def dump(name, obj, base=OUT):
    with open(f"{base}/{name}", "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

def shuffle(options, correct, seed):
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    opts = list(options)
    for i in range(len(opts) - 1, 0, -1):
        j = h % (i + 1); h //= (i + 1)
        opts[i], opts[j] = opts[j], opts[i]
    return opts, opts.index(correct)

# Тестийн зураг (hi-24.png) + Mini story (hi-23.png) хайчилна
from PIL import Image
_pg = Image.open(f"{BASE}/pages/hi-24.png").convert("RGB")
_S = 1240/830
_BOX = {"t1":(235,197,322,278),"t2":(235,283,322,365),"t3":(235,372,322,452),"t4":(235,458,322,540),
        "t5":(163,613,252,697),"t6":(165,752,250,802),"t7":(172,858,255,912),"t8":(177,958,250,1040)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open(f"{BASE}/pages/hi-23.png").convert("RGB").crop(tuple(int(v*_S) for v in (60,200,790,1050))).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-4-03-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = "audio/yct-4-03-text-song.mp3"
shutil.copyfile(f"{OUT}/{AUD_TEXT}", f"{OUT}/{AUD_MAIN}")   # дуу байхгүй → яриа track

# ---------------- VOCAB ----------------
VOCAB = [
 ("开","kāi","нээх, онгойлгох","үйл үг · гол үг","商店几点开门？","Shāngdiàn jǐ diǎn kāimén?","Дэлгүүр хэдэн цагт нээгддэг вэ?",True),
 ("关","guān","хаах, хаалттай болох","үйл үг · гол үг","中午不关门。","Zhōngwǔ bù guānmén.","Үд дунд хаалгаа хаадаггүй.",True),
 ("门","mén","хаалга","нэр үг · гол үг","门关上了。","Mén guānshang le.","Хаалга хаагдлаа.",True),
 ("杯子","bēizi","аяга","нэр үг · гол үг","我买两个老虎杯子。","Wǒ mǎi liǎng ge lǎohǔ bēizi.","Би барын зурагтай хоёр аяга авна.",True),
 ("中午","zhōngwǔ","үд дунд","цаг · гол үг","今天中午我吃面条儿。","Jīntiān zhōngwǔ wǒ chī miàntiáor.","Өнөөдөр үд дунд би гоймон иднэ.",True),
 ("卖","mài","зарах","үйл үг · гол үг","这个商店卖什么？","Zhège shāngdiàn mài shénme?","Энэ дэлгүүрт юу зардаг вэ?",True),
 ("完","wán","дуусах, дуусгах","үйл үг · гол үг","老虎杯子都卖完了。","Lǎohǔ bēizi dōu mài wán le.","Барын зурагтай аяга бүгд зарагдаж дууссан.",True),
 ("就","jiù","аль хэдийнэ, ердөө","дайвар үг · гол үг","我六点就起床了。","Wǒ liù diǎn jiù qǐchuáng le.","Би зургаан цагт л босчихсон.",True),
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
 {"id":1,"title_mn":"Яриа 1 · Дэлгүүр хэдэн цагт нээгддэг вэ?","scene_mn":"Гудамжинд хөвгүүн бэлэг авах гэж байна. Охиноос дэлгүүр хэдэн цагт нээгдэж, хэдэн цагт хаагддагийг асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"我想去买礼物，商店几点开门？","pinyin":"Wǒ xiǎng qù mǎi lǐwù, shāngdiàn jǐ diǎn kāimén?","mn":"Би бэлэг авмаар байна. Дэлгүүр хэдэн цагт нээгддэг вэ?"},
           {"speaker":"小红","zh":"早上八点半就开门。","pinyin":"Zǎoshang bā diǎn bàn jiù kāimén.","mn":"Өглөө найман цаг хагаст л нээчихдэг."},
           {"speaker":"小明","zh":"中午关门吗？","pinyin":"Zhōngwǔ guānmén ma?","mn":"Үд дунд хаалгаа хаадаг уу?"},
           {"speaker":"小红","zh":"中午不关门，但是下午三点就关门。你快去吧。","pinyin":"Zhōngwǔ bù guānmén, dànshì xiàwǔ sāndiǎn jiù guānmén. Nǐ kuài qù ba.","mn":"Үд дунд хаадаггүй, гэхдээ үдээс хойш гурван цагт хаачихдаг. Хурдан яв даа."}]},
 {"id":2,"title_mn":"Яриа 2 · Барын зурагтай аяга","scene_mn":"Дэлгүүрт охин барын зурагтай аяга авах гэж байна. Худалдагч ах лангуун дээрх аягуудыг харуулж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"我买两个老虎杯子。","pinyin":"Wǒ mǎi liǎng ge lǎohǔ bēizi.","mn":"Би барын зурагтай хоёр аяга авна."},
           {"speaker":"店员","zh":"老虎杯子都卖完了。","pinyin":"Lǎohǔ bēizi dōu mài wán le.","mn":"Барын зурагтай аяга бүгд зарагдаж дууссан."},
           {"speaker":"小红","zh":"这个不是吗？","pinyin":"Zhège bú shì ma?","mn":"Энэ биш гэж үү?"},
           {"speaker":"店员","zh":"不是，这是猫。","pinyin":"Bú shì, zhè shì māo.","mn":"Биш ээ, энэ муур."}]},
]
sentences=[]
dlg = [
 (1,"小明：我想去买礼物，商店几点开门？","Xiǎo Míng: Wǒ xiǎng qù mǎi lǐwù, shāngdiàn jǐ diǎn kāimén?","Сяо Мин: Би бэлэг авмаар байна. Дэлгүүр хэдэн цагт нээгддэг вэ?","小明：| 我|wǒ 想|xiǎng 去|qù 买|mǎi 礼物|lǐwù ，| 商店|shāngdiàn 几点|jǐ diǎn 开门|kāimén ？|","几点开门？ — «хэдэн цагт нээгддэг вэ?» гэж асуух өгүүлбэр. 开门 = хаалгаа нээх, нээгдэх.",["商店几点开门？"]),
 (1,"小红：早上八点半就开门。","Xiǎo Hóng: Zǎoshang bā diǎn bàn jiù kāimén.","Сяо Хун: Өглөө найман цаг хагаст л нээчихдэг.","小红：| 早上|zǎoshang 八点半|bā diǎn bàn 就|jiù 开门|kāimén 。|","就 = «аль хэдийнэ, л». «Эрт нээгддэг шүү» гэдгийг онцолж байна. 八点半 = найман цаг хагас.",["早上八点半就开门。"]),
 (1,"小明：中午关门吗？","Xiǎo Míng: Zhōngwǔ guānmén ma?","Сяо Мин: Үд дунд хаалгаа хаадаг уу?","小明：| 中午|zhōngwǔ 关门|guānmén 吗|ma ？|","关门 = хаалгаа хаах, хаагдах.",[]),
 (1,"小红：中午不关门，但是下午三点就关门。你快去吧。","Xiǎo Hóng: Zhōngwǔ bù guānmén, dànshì xiàwǔ sāndiǎn jiù guānmén. Nǐ kuài qù ba.","Сяо Хун: Үд дунд хаадаггүй, гэхдээ үдээс хойш гурван цагт хаачихдаг. Хурдан яв даа.","小红：| 中午|zhōngwǔ 不|bù 关门|guānmén ，| 但是|dànshì 下午|xiàwǔ 三点|sāndiǎn 就|jiù 关门|guānmén 。| 你|nǐ 快|kuài 去|qù 吧|ba 。|","但是 = «гэхдээ». 吧 = «даа, аа» — зөөлөн уриалга. 就 энд «гурван цагт л хаачихдаг» — эрт хаагдана гэсэн утга.",[]),
 (2,"小红：我买两个老虎杯子。","Xiǎo Hóng: Wǒ mǎi liǎng ge lǎohǔ bēizi.","Сяо Хун: Би барын зурагтай хоёр аяга авна.","小红：| 我|wǒ 买|mǎi 两个|liǎng ge 老虎|lǎohǔ 杯子|bēizi 。|","老虎杯子 = барын зурагтай аяга.",[]),
 (2,"店员：老虎杯子都卖完了。","Diànyuán: Lǎohǔ bēizi dōu mài wán le.","Худалдагч: Барын зурагтай аяга бүгд зарагдаж дууссан.","店员：| 老虎|lǎohǔ 杯子|bēizi 都|dōu 卖完|mài wán 了|le 。|","卖完了 = зарагдаж дууссан. 完 нь үйлдэл «дуусчихлаа» гэдгийг хэлнэ.",["老虎杯子都卖完了。"]),
 (2,"小红：这个不是吗？","Xiǎo Hóng: Zhège bú shì ma?","Сяо Хун: Энэ биш гэж үү?","小红：| 这个|zhège 不是|bú shì 吗|ma ？|","",[]),
 (2,"店员：不是，这是猫。","Diànyuán: Bú shì, zhè shì māo.","Худалдагч: Биш ээ, энэ муур.","店员：| 不是|bú shì ，| 这|zhè 是|shì 猫|māo 。|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    mn = mn.replace("зарагдаж","зарагдаж")
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("中午，小猴子坐在门口吃水果。","Zhōngwǔ, xiǎo hóuzi zuò zài ménkǒu chī shuǐguǒ.","Үд дунд зулзага сармагчин хаалганы үүдэнд суугаад жимс иднэ.","中午|zhōngwǔ ，| 小猴子|xiǎo hóuzi 坐|zuò 在|zài 门口|ménkǒu 吃|chī 水果|shuǐguǒ 。|"),
 ("吃完水果，小猴子想关门去踢足球。","Chī wán shuǐguǒ, xiǎo hóuzi xiǎng guānmén qù tī zúqiú.","Жимсээ идчихээд сармагчин хаалгаа хаагаад хөл бөмбөг тоглохоор явья гэж бодлоо.","吃完|chī wán 水果|shuǐguǒ ，| 小猴子|xiǎo hóuzi 想|xiǎng 关门|guānmén 去|qù 踢足球|tī zúqiú 。|"),
 ("小猴子：咦，门怎么关不上呢？","Xiǎo hóuzi: Yí, mén zěnme guān bu shàng ne?","Сармагчин: Өө, хаалга яагаад хаагдахгүй байна аа?","小猴子：| 咦|yí ，| 门|mén 怎么|zěnme 关不上|guān bu shàng 呢|ne ？|"),
 ("小猴子：这是什么东西？","Xiǎo hóuzi: Zhè shì shénme dōngxi?","Сармагчин: Энэ юу вэ дээ?","小猴子：| 这|zhè 是|shì 什么|shénme 东西|dōngxi ？|"),
 ("小猴子：对不起，它不能在这里。","Xiǎo hóuzi: Duìbuqǐ, tā bù néng zài zhèlǐ.","Сармагчин: Уучлаарай, чи энд байж болохгүй.","小猴子：| 对不起|duìbuqǐ ，| 它|tā 不能|bù néng 在|zài 这里|zhèlǐ 。|"),
 ("门关上了，小猴子高高兴兴去踢足球了。","Mén guānshang le, xiǎo hóuzi gāogāoxìngxìng qù tī zúqiú le.","Хаалга хаагдлаа. Сармагчин баяртайхан хөл бөмбөг тоглохоор гүйлээ.","门|mén 关上|guānshang 了|le ，| 小猴子|xiǎo hóuzi 高高兴兴|gāogāoxìngxìng 去|qù 踢足球|tī zúqiú 了|le 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «门怎么关不上呢？» (Хаалга яагаад хаагдахгүй байна аа?) — 6 зурагт үлгэр. 小猴子 = зулзага сармагчин. Аудио: 03-03."
    if i==2: s["note"]="关不上 = хааж чадахгүй, хаагдахгүй. Хаалганд ямар нэг юм ороод хавчигдсан байна."
    if i==4: s["note"]="Сармагчин хаалганд орсон хэрэггүй юмыг (хогийг) аваад «Чи энд байж болохгүй» гээд хогийн савандаа хаяна."
    sentences.append(s)

texts = {
 "unit":{"number":"3","title":"早上八点半就开门。","mongolianTitle":"Өглөө найман цаг хагаст л нээгддэг — дэлгүүр, цаг"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. YCT 1–3-д чи цаг, тоо, амьтан, өдөр тутмын олон үг сурсан даа. Одоо бид дэлгүүрт орно! Чи дэлгүүр хэдэн цагт нээгддэг, хэдэн цагт хаагддагийг мэдэх үү? Өнөөдөр «早上八点半就开门。» гэж хэлж, «老虎杯子都卖完了。» гэж хэлж сурна. Нээх, хаах, зарах, дуусах гэсэн шинэ үгс байна. Мөн хаалгаа хааж чадахгүй байгаа зулзага сармагчны инээдтэй үлгэрийг уншина. Хөл, гараа бэлд, эхэлцгээе!",
  "warmup_mn":"Чиний очдог дэлгүүр хэдэн цагт нээгддэг вэ? Чи хэзээ нэгэн цагт дэлгүүрт очтол хаалттай байсан уу?",
  "theme_zh":"开门 · 关门 · 卖完了 · 就","theme_mn":"Нээх · хаах · зарагдаж дууссан · аль хэдийнэ"},
 "warmup":{"mongolian":"Чиний очдог дэлгүүр хэдэн цагт нээгддэг вэ? Чи дуртай юмаа авах гэтэл дууссан байсан уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"3","title":"早上八点半就开门。","mongolianTitle":"Өглөө найман цаг хагаст л нээгддэг — яриа, үлгэр","title_mn":"Let's read · 2 яриа + Mini story · 门怎么关不上呢？","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 4 · 第3课 Let's read / Mini story（CD 03-02, 03-03）","author_zh":"",
  "intro_zh":"两段对话：商店几点开门？老虎杯子都卖完了。然后读小故事《门怎么关不上呢？》。",
  "intro_mn":"Эхлээд хоёр яриа: «商店几点开门？» гэж дэлгүүрийн цагийг асууна, «老虎杯子都卖完了» гэж худалдагч хэлнэ. Дараа нь «门怎么关不上呢？» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хөвгүүн бэлэг авах гэж байна. Дэлгүүр өглөө 8:30-д нээгдэж, үд дунд хаагддаггүй, харин үдээс хойш 3 цагт хаагддаг. Охин «хурдан яв даа» гэнэ."},
   {"paragraph":2,"mn":"Яриа 2 — Охин барын зурагтай хоёр аяга авах гэтэл худалдагч «бүгд зарагдсан» гэнэ. Охин өөр аягыг заахад «Биш ээ, энэ муур» гэж хариулна."},
   {"paragraph":3,"mn":"Үлгэр «门怎么关不上呢？» — Сармагчин жимс идчихээд хаалгаа хаах гэтэл хаагдахгүй. Хаалганд орсон юмыг гаргаж хаяад хаалгаа хааж, баярлан хөл бөмбөг тоглохоор явна. Аудио: 03-03."}],
  "reflection":{"questions_mn":["Дэлгүүр хэдэн цагт нээгдэж, хэдэн цагт хаагддагийг хэлж үз. «……就开门。»","Нэг зүйл зарагдаж дуусвал чи юу гэж хэлэх вэ? «……都卖完了。»","Сармагчны хаалга яагаад хаагдахгүй байсан бол? Чи ийм юм болж байсан уу?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Дэлгүүрийн цаг","zh":"商店几点开门？","pinyin":"Shāngdiàn jǐ diǎn kāimén?","mn":"Дэлгүүр хэдэн цагт нээгддэг вэ?"},
  "writingPrompt_mn":"Найзаасаа «商店几点开门？» гэж асуугаад «早上……点就开门。» гэж хариул."},
 "properNouns":[{"zh":"门怎么关不上呢？","pinyin":"Mén zěnme guān bu shàng ne?","mn":"Хаалга яагаад хаагдахгүй байна аа? (үлгэрийн нэр)"},{"zh":"老虎","pinyin":"lǎohǔ","mn":"бар"},{"zh":"小猴子","pinyin":"xiǎo hóuzi","mn":"зулзага сармагчин"}],
 "wordExplanation":[
  {"word":"就","gloss":"jiù — аль хэдийнэ, л","explanation":"«早上八点半就开门» гэвэл «өглөө найман цаг хагаст л нээгдэнэ» — эрт нээгддэг гэдгийг онцолно. Цагийн ард «就» тавьж «аль хэдийнэ» гэж хэлнэ. Жишээ нь «我六点就起床了» — би зургаан цагт л босчихсон.",
   "structure":"цаг + 就 + юу хийх","teacher_notes":"Хүүхдүүдээс «Чи хэдэн цагт босдог вэ?» гэж асуугаад «我……点就起床。» гэж хэлүүл. Эрт босдог хүүхэд «就» гэхэд сайхан сонсогдоно.",
   "examples":[{"chinese":"早上八点半就开门。","pinyin":"Zǎoshang bā diǎn bàn jiù kāimén.","mongolian":"Өглөө найман цаг хагаст л нээгддэг."},{"chinese":"下午三点就关门。","pinyin":"Xiàwǔ sāndiǎn jiù guānmén.","mongolian":"Үдээс хойш гурван цагт л хаагддаг."},{"chinese":"我六点就起床了。","pinyin":"Wǒ liù diǎn jiù qǐchuáng le.","mongolian":"Би зургаан цагт л босчихсон."}],
   "common_mistakes":[{"wrong":"就八点半开门。","right":"八点半就开门。","why":"«就» цагийн ард, үйл үгийн өмнө орно."}],
   "check":{"question":"«Өглөө найман цагт л нээгддэг» хятадаар:","options":["早上八点就开门。","就早上八点开门。","早上八点开门就。"],"answer":"0"},
   "practice":[{"n":1,"question":"早上八点半 ________ 开门。(аль хэдийнэ)","answer":"就","explanation_mn":"«Аль хэдийнэ, л» — 就."}]},
  {"word":"开门 · 关门","gloss":"kāimén · guānmén — нээгдэх, хаагдах","explanation":"Дэлгүүр өглөө нээгдэхийг «开门», орой хаагдахыг «关门» гэнэ. «几点开门？» гэвэл «хэдэн цагт нээгддэг вэ?», «几点关门？» гэвэл «хэдэн цагт хаагддаг вэ?» гэсэн үг. 开 ба 关 нь эсрэг утгатай.",
   "structure":"商店几点开门/关门？","teacher_notes":"Гараа хаалга шиг нээж, хааж үзүүл: «开门！ 关门！» гэж хэлэхэд хүүхдүүд хөдөлгөөнийг давтана.",
   "examples":[{"chinese":"商店几点开门？","pinyin":"Shāngdiàn jǐ diǎn kāimén?","mongolian":"Дэлгүүр хэдэн цагт нээгддэг вэ?"},{"chinese":"中午关门吗？","pinyin":"Zhōngwǔ guānmén ma?","mongolian":"Үд дунд хаалгаа хаадаг уу?"},{"chinese":"中午不关门。","pinyin":"Zhōngwǔ bù guānmén.","mongolian":"Үд дунд хаадаггүй."}],
   "common_mistakes":[{"wrong":"商店几点门开？","right":"商店几点开门？","why":"«开» нь «门»-ийн өмнө орно: 开门."}],
   "check":{"question":"«Хэдэн цагт хаагддаг вэ?» хятадаар:","options":["几点关门？","几点开门？","几点买门？"],"answer":"0"},
   "practice":[{"n":1,"question":"商店几点 ________ ？(нээгдэх)","answer":"开门","explanation_mn":"«Нээгдэх» — 开门."}]},
  {"word":"卖完了","gloss":"mài wán le — зарагдаж дууссан","explanation":"Дэлгүүрт авах гэсэн юм дууссан бол «卖完了» гэнэ. «完» гэдэг нь «дууссан» гэсэн үг. Олон зүйл бол «都卖完了» — «бүгд зарагдсан». «吃完» гэвэл идчихсэн, «写完» гэвэл бичиж дууссан.",
   "structure":"үйл үг + 完了","teacher_notes":"Хүүхдүүдээр дэлгүүр тоглуулж, худалдагч нь «都卖完了！» гэж хэлээд худалдан авагч гомдонгуй дуугаар «啊……» гэж хэлэг.",
   "examples":[{"chinese":"老虎杯子都卖完了。","pinyin":"Lǎohǔ bēizi dōu mài wán le.","mongolian":"Барын зурагтай аяга бүгд зарагдаж дууссан."},{"chinese":"吃完水果，小猴子想关门。","pinyin":"Chī wán shuǐguǒ, xiǎo hóuzi xiǎng guānmén.","mongolian":"Жимсээ идчихээд сармагчин хаалгаа хаахаар бодлоо."},{"chinese":"我写完了。","pinyin":"Wǒ xiě wán le.","mongolian":"Би бичиж дууслаа."}],
   "common_mistakes":[{"wrong":"卖了完。","right":"卖完了。","why":"«完» нь үйл үгийн ард шууд, «了» нь хамгийн сүүлд орно."}],
   "check":{"question":"«Бүгд зарагдаж дууссан» хятадаар:","options":["都卖完了。","都开门了。","都不是。"],"answer":"0"},
   "practice":[{"n":1,"question":"老虎杯子都卖 ________ 了。(дуусах)","answer":"完","explanation_mn":"«Дуусах» — 完."}]},
 ],
 "collocations":[{"type":"Дэлгүүр","rows":[
   {"head":"开","with":"门","mn":"хаалгаа нээх, нээгдэх","usage_mn":"Дэлгүүр өглөө нээгдэхэд","example":{"zh":"早上八点半就开门。","pinyin":"Zǎoshang bā diǎn bàn jiù kāimén.","mn":"Өглөө найман цаг хагаст л нээгддэг."}},
   {"head":"关","with":"门","mn":"хаалгаа хаах, хаагдах","usage_mn":"Дэлгүүр орой хаагдахад","example":{"zh":"下午三点就关门。","pinyin":"Xiàwǔ sāndiǎn jiù guānmén.","mn":"Үдээс хойш гурван цагт л хаагддаг."}},
   {"head":"卖","with":"完","mn":"зарагдаж дуусах","usage_mn":"Бараа дууссан үед","example":{"zh":"老虎杯子都卖完了。","pinyin":"Lǎohǔ bēizi dōu mài wán le.","mn":"Барын зурагтай аяга бүгд зарагдсан."}}]}],
 "wordComparison":[{"words":["开","关"],"explanation_mn":"开 = нээх, 关 = хаах. Хоёр үг эсрэг утгатай. Хаалгаа нээвэл 开门, хаавал 关门."},{"words":["买","卖"],"explanation_mn":"买 = авах, 卖 = зарах. Дэлгүүрт хүн «买» хийж, худалдагч «卖» хийнэ."}],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["就","卖","完","中午","杯子"],"items":[
     {"n":1,"question":"早上八点半 ________ 开门。","answer":"就","explanation_mn":"«Аль хэдийнэ, л» — 就."},
     {"n":2,"question":"这个商店 ________ 什么？","answer":"卖","explanation_mn":"«Зарах» — 卖."},
     {"n":3,"question":"老虎杯子都卖 ________ 了。","answer":"完","explanation_mn":"«Дуусах» — 完."},
     {"n":4,"question":"________ 不关门。","answer":"中午","explanation_mn":"«Үд дунд» — 中午."},
     {"n":5,"question":"我买两个老虎 ________ 。","answer":"杯子","explanation_mn":"«Аяга» — 杯子."}]}],
   "answer_source":"agent-authored (YCT 4 · 3-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"商店几点开门？几点关门？","answer":"早上八点半开门，下午三点关门。","explanation_mn":"Яриа 1 — «早上八点半就开门», «下午三点就关门». Үд дунд хаахгүй."},
     {"n":2,"question_zh":"还有老虎杯子吗？","answer":"没有了，都卖完了。","explanation_mn":"Яриа 2 — худалдагч «老虎杯子都卖完了» гэсэн."}],
   "answer_source":"textbook_verified (Let's read, х.14 Questions)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Дэлгүүр тоглоом (Role Play)","start_zh":"我买两个杯子。","instruction_mn":"Хоёулаа дэлгүүр тоглоно. Нэг нь худалдагч, нөгөө нь худалдан авагч. Худалдан авагч «我买两个杯子» гэнэ. Худалдагч «都卖完了» гэж хэлж болно, эсвэл «给你» гэж өгч болно. Дараа нь солигд!"},
     {"label":"Манай хавийн дэлгүүр","start_zh":"商店几点开门？","instruction_mn":"Гэртээ ойр байдаг дэлгүүр, хүнсний дэлгүүрийн цагийг ээж ааваас асууж мэд. Маргааш найздаа «……几点开门？ ……点就开门。» гэж хэлж өг!"},
     {"label":"Эсрэг үгсийг ол","start_zh":"开 — 关","instruction_mn":"Хос тоглоом. Нэг нь «开» гэвэл нөгөө нь «关» гэж хариулна. Дараа нь 买–卖, 来–去, 哭–笑. Гараа ч хөдөлгөж үз: хаалга нээж, хаа!"},
     {"label":"Touch the Card","start_zh":"门！杯子！","instruction_mn":"8 үгийг тус тусад нь цаасан дээр бич. Нэг нь үгээ уншина, нөгөө нь тэр цаасыг хурдан хүрнэ. Хэн хурдан вэ?"},
     {"label":"Сармагчны үлгэр жүжиг","start_zh":"门怎么关不上呢？","instruction_mn":"Нэг нь сармагчин, нөгөө нь өгүүлэгч. Сармагчин «咦，门怎么关不上呢？» гээд хаалгаа хаахыг оролд. Дараа нь «对不起，它不能在这里» гээд юмаа хаяад хаалгаа хаа!"}]}},
 "grammarNotes":[],
 "culture":{"title":"虎头鞋","title_mn":"Хятад хүүхдийн барын толгойтой гутал","text_mn":"Хятадад бар (老虎) хүчтэй, зоригтой амьтан гэж тооцогддог. Тийм учраас хүүхдүүдэд барын толгойтой гутал, малгай (虎头鞋, 虎头帽) өмсгөдөг уламжлал бий. «Хүүхэд минь бар шиг эрүүл, хүчтэй өсөөрэй» гэсэн хүслийг илэрхийлдэг. Тиймээс дэлгүүрт барын зурагтай аяга ч олон байдаг!","note_mn":"Монголд хүүхдэд ямар амьтны зураг бүхий юм өгдөг вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — дэлгүүрийн цаг асуух, юм зарагдаж дууссан гэж хэлэх.","topic":"Дэлгүүр хэдэн цагт нээгддэг вэ?","discussion":["Хосоороо: «商店几点开门？» гэж асууж, «早上……点就开门» гэж хариул.","Дэлгүүр тоглоом: худалдагч «都卖完了» гэж хэлээд худалдан авагчид өөр зүйл санал болго."],
   "writing":{"promptChinese":"商店早上……点就开门。","promptMongolian":"Гэрийн даалгавар: ойр дэлгүүрийн нээгдэх, хаагдах цагийг ээж ааваас асууж мэдээд хятадаар хэл.","minChars":"0","requiredWords":["开门","关门"],"sampleChinese":"商店早上八点半就开门，下午三点就关门。","sampleMongolian":"Дэлгүүр өглөө найман цаг хагаст нээгдэж, үдээс хойш гурван цагт хаагддаг.","gradingRubric":"开门, 关门, 就-г цагийн ард зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 4 · Test Answers: L3 1.✓ 2.✗ 3.✓ 4.✓ 5.C 6.B 7.C 8.B","parts":[]},
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
 {"point":"早上八点半就开门。 — 就","gloss_mn":"«Өглөө найман цаг хагаст л нээгддэг» — аль хэдийнэ",
  "structure":"цаг + 就 + юу хийх",
  "teacher_mn":"Цагийн ард «就» тавьбал «аль хэдийнэ» гэсэн утгатай болно. «早上八点半就开门» — дэлгүүр маш эрт нээгддэг гэсэн үг. «我六点就起床了» — би зургаан цагт л босчихсон. Чи хэдэн цагт босдог вэ? «我……点就起床» гэж хэлж үз.",
  "teacher_notes":"Номын яриа 1: 早上八点半就开门。 下午三点就关门。",
  "examples":[ex("早上八点半就开门。","Zǎoshang bā diǎn bàn jiù kāimén.","Өглөө найман цаг хагаст л нээгддэг."),ex("下午三点就关门。","Xiàwǔ sāndiǎn jiù guānmén.","Үдээс хойш гурван цагт л хаагддаг."),ex("我六点就起床了。","Wǒ liù diǎn jiù qǐchuáng le.","Би зургаан цагт л босчихсон.")],
  "common_mistakes":[{"wrong":"就八点半开门。","right":"八点半就开门。","why":"«就» цагийн ард орно."}],
  "check":chk("«Үдээс хойш гурван цагт л хаагддаг» хятадаар:",["下午三点就关门。","就下午三点关门。","下午三点关门就。"],"下午三点就关门。","g1c"),
  "exercises":[
   choice("早上八点半 ________ 开门。",["就","吗","吧"],"就","Зөв! 就 = аль хэдийнэ.","«就» цагийн ард орно.","g1e1"),
   choice("«Би зургаан цагт л босчихсон» хятадаар:",["我六点就起床了。","我六点起床吗。","我就六点起床。"],"我六点就起床了。","Зөв! 六点就起床.","就 нь цагийн ард, үйл үгийн өмнө.","g1e2"),
   judge("«八点半就开门» гэвэл дэлгүүр эрт нээгддэг гэсэн утгатай.",True,"Зөв! 就 нь «эрт» гэдгийг онцолно.","就 = аль хэдийнэ, л.")]},
 {"point":"开门 · 关门 — нээх, хаах","gloss_mn":"«Хэдэн цагт нээгддэг вэ? Үд дунд хаагддаг уу?»",
  "structure":"商店几点开门/关门？ · 中午关门吗？ → 不关门。",
  "teacher_mn":"Дэлгүүр нээгдэхийг «开门», хаагдахыг «关门» гэнэ. Цагийг асуухдаа «几点» гэнэ: «几点开门？». Хаадаггүй бол «不关门». «但是» гэвэл «гэхдээ». Гараараа хаалга нээж, хааж «开门！关门！» гэж хэлж үз.",
  "teacher_notes":"Номын яриа 1: 商店几点开门？ 中午关门吗？ 中午不关门，但是下午三点就关门。",
  "examples":[ex("商店几点开门？","Shāngdiàn jǐ diǎn kāimén?","Дэлгүүр хэдэн цагт нээгддэг вэ?"),ex("中午关门吗？","Zhōngwǔ guānmén ma?","Үд дунд хаалгаа хаадаг уу?"),ex("中午不关门，但是下午三点就关门。","Zhōngwǔ bù guānmén, dànshì xiàwǔ sāndiǎn jiù guānmén.","Үд дунд хаадаггүй, гэхдээ үдээс хойш гурван цагт хаагддаг."),ex("门关上了。","Mén guānshang le.","Хаалга хаагдлаа.")],
  "common_mistakes":[{"wrong":"商店几点门开？","right":"商店几点开门？","why":"«开» нь «门»-ийн өмнө орно."}],
  "check":chk("«Үд дунд хаалгаа хаадаг уу?» хятадаар:",["中午关门吗？","中午开门吗？","中午几点？"],"中午关门吗？","g2c"),
  "exercises":[
   choice("商店几点 ________ ？(нээгдэх)",["开门","关门","卖完"],"开门","Зөв! 开门 = нээгдэх.","开门 = нээгдэх, 关门 = хаагдах.","g2e1"),
   choice("«Гэхдээ» гэсэн үг:",["但是","中午","杯子"],"但是","Зөв! 但是 = гэхдээ.","但是 = гэхдээ.","g2e2"),
   judge("«关» гэдэг нь «нээх» гэсэн үг.",False,"Зөв! 关 = хаах, 开 = нээх.","开 = нээх, 关 = хаах.")]},
 {"point":"老虎杯子都卖完了。 — 完","gloss_mn":"«Барын зурагтай аяга бүгд зарагдсан» — дууссан",
  "structure":"үйл үг + 完了",
  "teacher_mn":"Ямар нэг юм дуусвал үйл үгийн ард «完了» нэмнэ. «卖完了» — зарагдаж дууссан. «吃完了» — идчихсэн. «写完了» — бичиж дууссан. «都» гэвэл «бүгд». Дэлгүүрт авах гэсэн юм дууссан бол «都卖完了» гэж сонсогдоно.",
  "teacher_notes":"Номын яриа 2: 老虎杯子都卖完了。 Үлгэр: 吃完水果，小猴子想关门去踢足球。",
  "examples":[ex("老虎杯子都卖完了。","Lǎohǔ bēizi dōu mài wán le.","Барын зурагтай аяга бүгд зарагдаж дууссан."),ex("吃完水果，小猴子想关门去踢足球。","Chī wán shuǐguǒ, xiǎo hóuzi xiǎng guānmén qù tī zúqiú.","Жимсээ идчихээд сармагчин хаалгаа хаагаад хөл бөмбөг тоглохоор явья гэж бодлоо."),ex("我写完了。","Wǒ xiě wán le.","Би бичиж дууслаа.")],
  "common_mistakes":[{"wrong":"卖了完。","right":"卖完了。","why":"«完» үйл үгийн ард шууд, «了» хамгийн сүүлд."}],
  "check":chk("«Би идчихлээ» хятадаар:",["我吃完了。","我完吃了。","我吃了完。"],"我吃完了。","g3c"),
  "exercises":[
   choice("老虎杯子都卖 ________ 了。",["完","就","门"],"完","Зөв! 卖完了 = зарагдаж дууссан.","完 = дуусах.","g3e1"),
   choice("«Би бичиж дууслаа» хятадаар:",["我写完了。","我写就了。","我完写了。"],"我写完了。","Зөв! 写完了.","完 нь үйл үгийн ард.","g3e2"),
   judge("«卖完了» гэвэл дэлгүүрт бараа үлдсэн гэсэн утгатай.",False,"Зөв! 卖完了 = зарагдаж дууссан.","卖完了 = дууссан.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Нээх, онгойлгох» хятадаар аль нь вэ?",["开","关","买","卖"],"开","开 (kāi) = нээх.","easy",["vocabulary"],"a1")
q("choice","«Хаах» хятадаар аль нь вэ?",["关","开","完","就"],"关","关 (guān) = хаах.","easy",["vocabulary"],"a2")
q("choice","«Хаалга» хятадаар аль нь вэ?",["门","杯子","学校","商店"],"门","门 (mén) = хаалга.","easy",["vocabulary"],"a3")
q("choice","«Аяга» хятадаар аль нь вэ?",["杯子","门","水果","朋友"],"杯子","杯子 (bēizi) = аяга.","easy",["vocabulary"],"a4")
q("choice","«Үд дунд» хятадаар аль нь вэ?",["中午","早上","下午","晚上"],"中午","中午 (zhōngwǔ) = үд дунд.","easy",["vocabulary"],"a5")
q("choice","«卖» гэдэг үг ямар утгатай вэ?",["зарах","авах","нээх","хаах"],"зарах","卖 (mài) = зарах. 买 = авах.","easy",["vocabulary"],"a6")
q("choice","«完» гэдэг үг ямар утгатай вэ?",["дуусах","нээх","аль хэдийнэ","хаалга"],"дуусах","完 (wán) = дуусах. 卖完了 = зарагдаж дууссан.","easy",["vocabulary"],"a7")
q("choice","«就» гэдэг үг ямар утгатай вэ?",["аль хэдийнэ, л","дуусах","аяга","үд дунд"],"аль хэдийнэ, л","就 (jiù) = аль хэдийнэ. 八点就开门 = найман цагт л нээгддэг.","medium",["vocabulary"],"a8")
q("choice","Пиньинь «bēizi» гэж уншдаг үг:",["杯子","孩子","桌子","椅子"],"杯子","杯子 = bēizi = аяга.","medium",["pronunciation"],"a9")
q("choice","Пиньинь «zhōngwǔ» гэж уншдаг үг:",["中午","下午","早上","中国"],"中午","中午 = zhōngwǔ = үд дунд.","medium",["pronunciation"],"a10")
q("choice","Пиньинь «kāimén» гэж уншдаг үг:",["开门","关门","大门","同学"],"开门","开门 = kāimén = хаалга нээх, нээгдэх.","medium",["pronunciation"],"a11")
q("choice","Пиньинь «mài» гэж уншдаг үг:",["卖","买","来","去"],"卖","卖 = mài = зарах. 买 = mǎi = авах.","medium",["pronunciation"],"a12")
q("choice","«Дэлгүүр хэдэн цагт нээгддэг вэ?» хятадаар:",["商店几点开门？","商店几点关门？","商店在哪儿？","商店卖什么？"],"商店几点开门？","几点 = хэдэн цаг, 开门 = нээгдэх.","easy",["dialogue"],"a13")
q("choice","«早上八点半就开门。» гэж юу гэсэн үг вэ?",["Өглөө найман цаг хагаст л нээгддэг.","Орой найман цагт хаагддаг.","Үд дунд хаалгаа хаадаг.","Дэлгүүр зарагдсан."],"Өглөө найман цаг хагаст л нээгддэг.","早上 = өглөө, 八点半 = найман цаг хагас, 就开门 = л нээгддэг.","medium",["dialogue"],"a14")
q("choice","Яриа 1-д дэлгүүр хэдэн цагт хаагддаг вэ?",["Үдээс хойш гурван цагт","Үд дунд","Өглөө найман цагт","Орой есөн цагт"],"Үдээс хойш гурван цагт","中午不关门，但是下午三点就关门。","medium",["dialogue"],"a15")
q("choice","Яриа 2-т худалдагч «老虎杯子都卖完了» гэхэд охин юу авах гэсэн бэ?",["Барын зурагтай хоёр аяга","Хоёр муур","Хоёр ном","Хоёр алим"],"Барын зурагтай хоёр аяга","我买两个老虎杯子。","medium",["dialogue"],"a16")
q("cloze","早上八点半（ ）开门。",["就","吗","吧","了"],"就","就开门 = л нээгддэг.","medium",["dialogue"],"a17")
q("cloze","中午不关门，（ ）下午三点就关门。",["但是","也","每","太"],"但是","但是 = гэхдээ.","medium",["dialogue"],"a18")
q("cloze","你快去（ ）！",["吧","吗","呢","了"],"吧","去吧 = яв даа.","medium",["structure"],"a19")
q("cloze","老虎杯子都卖（ ）了。",["完","开","关","门"],"完","卖完了 = зарагдаж дууссан.","easy",["structure"],"a20")
q("cloze","商店几点（ ）门？(нээгдэх)",["开","关","买","卖"],"开","开门 = нээгдэх.","easy",["structure"],"a21")
q("choice","«Би бичиж дууслаа» хятадаар:",["我写完了。","我写就了。","我完写了。","我写开了。"],"我写完了。","写完了 = бичиж дууслаа.","medium",["structure"],"a22")
q("choice","«关» ба «开»-ийн ялгаа:",["关 = хаах, 开 = нээх","关 = нээх, 开 = хаах","хоёулаа «авах»","хоёулаа «зарах»"],"关 = хаах, 开 = нээх","关 = хаах, 开 = нээх. Хоёр эсрэг утгатай.","easy",["structure"],"a23")
q("choice","«买» ба «卖»-ийн ялгаа:",["买 = авах, 卖 = зарах","买 = зарах, 卖 = авах","хоёулаа «авах»","хоёулаа «зарах»"],"买 = авах, 卖 = зарах","买 (mǎi) = авах, 卖 (mài) = зарах.","medium",["structure"],"a24")
q("usage","Дэлгүүр хэдэн цагт нээгддэгийг асуух нь:",["商店几点开门？","老虎杯子都卖完了。","这个不是吗？","你快去吧。"],"商店几点开门？","几点开门 = хэдэн цагт нээгдэх.","medium",["usage"],"a25")
q("usage","Худалдагч «Бүгд зарагдаж дууссан» гэж хэлэх нь:",["都卖完了。","都开门了。","就关门。","都不是。"],"都卖完了。","卖完了 = зарагдаж дууссан.","medium",["usage"],"a26")
q("usage","Дэлгүүр үд дунд хаалгаа хаадаггүй гэж хэлэх нь:",["中午不关门。","中午关门吗？","中午就开门。","中午卖完了。"],"中午不关门。","不关门 = хаадаггүй.","medium",["usage"],"a27")
q("usage","Өглөө зургаан цагт л босчихсон гэж хэлэх нь:",["我六点就起床了。","我六点起床吗。","我就六点吗。","我起床六点。"],"我六点就起床了。","цаг + 就 + үйл үг.","medium",["usage"],"a28")
q("usage","Үлгэрт сармагчин хаалгаа яаж хаасан бэ?",["Хаалганд орсон юмыг гаргаж хаяад","Хаалгыг зарсан","Дэлгүүр хаасан","Хаалгыг орхисон"],"Хаалганд орсон юмыг гаргаж хаяад","Сармагчин «这是什么东西？» гээд юмыг аваад хаяхад хаалга хаагдсан.","hard",["usage"],"a29")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK3 = ["A","B","C"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (03-04) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"answer_source":"YCT 4 Test Answers L3: 1.✓ 2.✗ 3.✓ 4.✓","items":[
    {"n":1,"question_zh":"（听录音）商店中午关门吗？不关门。","image":img("t1"),"script_zh":"男：商店中午关门吗？ 女：不关门。","answer":"✓","explanation_mn":"«Дэлгүүр үд дунд хаалгаа хаадаг уу? — Хаадаггүй» — зураг дээр хаалган дээр «营业中 OPEN» (нээлттэй) гэсэн самбар өлгөөтэй байна. Тиймээс таарна."},
    {"n":2,"question_zh":"（听录音）中午我们一起跑步，好吗？对不起，我没穿运动鞋。","image":img("t2"),"script_zh":"男：中午我们一起跑步，好吗？ 女：对不起，我没穿运动鞋。","answer":"✗","explanation_mn":"«Үд дунд хамт гүйх үү? — Уучлаарай, би спорт гутал өмсөөгүй» — охин гүйхгүй гэсэн. Харин зураг дээр хоёр эмэгтэй гүйж байгаа тул таарахгүй."},
    {"n":3,"question_zh":"（听录音）家里没有水果了，你去买一些吧。好的，我看完电视就去。","image":img("t3"),"script_zh":"女：家里没有水果了，你去买一些吧。 男：好的，我看完电视就去。","answer":"✓","explanation_mn":"«Гэртээ жимс дууссан, чи очиж авчираарай — За, зурагт үзчихээд явъя» — зураг дээр хоёр хүн буйдан дээр зурагт үзэж байна. Таарна."},
    {"n":4,"question_zh":"（听录音）这儿有水果店吗？我想买些苹果。旁边那家商店就有。","image":img("t4"),"script_zh":"男：这儿有水果店吗？我想买些苹果。 女：旁边那家商店就有。","answer":"✓","explanation_mn":"«Энд жимсний дэлгүүр байна уу? Алим авмаар байна — Хажуугийн дэлгүүрт бий» — зураг дээр жимсний дэлгүүр байна. Таарна."}]},
  {"part":2,"type":"choice","instruction_mn":"Унших — зурагт тохирох өгүүлбэрийг A, B, C-ээс сонго.","answer_source":"YCT 4 Test Answers L3: 5.C 6.B 7.C 8.B","items":[
    {"n":5,"question_zh":"（зургийг хар）","question_mn":"Зураг дээр хүү орондоо унтаж байна.","image":img("t5"),"options":BANK3,"optionTexts":["香蕉卖完了。","我买这个杯子。","昨天晚上我九点就睡觉了。"],"answer":"C","explanation_mn":"Хүү унтаж байгаа тул «Өчигдөр орой би есөн цагт л унтсан» (C) таарна. A «Гадил дууссан», B «Би энэ аяга авна» — унтахтай хамаагүй."},
    {"n":6,"question_zh":"（зургийг хар）","question_mn":"Зураг дээр улаан аяга байна.","image":img("t6"),"options":BANK3,"optionTexts":["好，把门关了再出去。","先生，这杯子的颜色可以吗？","没关系，我不累，很快就写完了。"],"answer":"B","explanation_mn":"Аяга байгаа тул «Ноён оо, энэ аяганы өнгө болох уу?» (B) таарна. A «За, хаалгаа хаагаад гараарай», C «Зүгээр, би ядраагүй, удахгүй бичиж дуусна» — аяга байхгүй."},
    {"n":7,"question_zh":"（зургийг хар）","question_mn":"Зураг дээр нээлттэй ном байна.","image":img("t7"),"options":BANK3,"optionTexts":["爸爸，我写完了。","这是朋友送的杯子，漂亮吗？","我上网看了这本书，你看了吗？"],"answer":"C","explanation_mn":"Ном байгаа тул «Би интернетээр энэ номыг үзсэн, чи үзсэн үү?» (C) таарна. A «Аав аа, би бичиж дууслаа», B «Найзын бэлэглэсэн аяга» — ном биш."},
    {"n":8,"question_zh":"（зургийг хар）","question_mn":"Зураг дээр хаалга байна.","image":img("t8"),"options":BANK3,"optionTexts":["我七点就能到家。","你为什么把门关了？","中午在外面吃什么了？"],"answer":"B","explanation_mn":"Хаалга байгаа тул «Чи яагаад хаалгаа хаачихав?» (B) таарна. A «Долоон цагт л гэртээ ирнэ», C «Үд дунд гадаа юу идэв?» — хаалгатай хамаагүй."}]},
  {"part":3,"type":"match","instruction_mn":"Let's match — эсрэг утгатайг ол.","answer_source":"Let's match х.15 (хариу утгаар тааруулсан)","items":[
    {"n":1,"question_zh":"开 ____","answer":"关","explanation_mn":"开 = нээх, 关 = хаах. Зураг дээр хаалга нээлттэй ба хаалттай."},
    {"n":2,"question_zh":"买 ____","answer":"卖","explanation_mn":"买 = авах, 卖 = зарах."},
    {"n":3,"question_zh":"哭 ____","answer":"笑","explanation_mn":"哭 = уйлах, 笑 = инээх."},
    {"n":4,"question_zh":"来 ____","answer":"去","explanation_mn":"来 = ирэх, 去 = явах."}]},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «门怎么关不上呢？» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"answer_source":"textbook х.16 (Mini story)","items":[
    {"n":1,"question_zh":"中午，小猴子坐在门口吃水果。","answer":"1","explanation_mn":"1-р зураг дээр сармагчин хаалганы үүдэнд суугаад жимс идэж байна."},
    {"n":2,"question_zh":"吃完水果，小猴子想关门去踢足球。","answer":"2","explanation_mn":"2-р зураг дээр сармагчин бөмбөг тэвэрч хаалганы бариулыг барьж байна."},
    {"n":3,"question_zh":"咦，门怎么关不上呢？","answer":"3","explanation_mn":"3-р зураг дээр сармагчин гайхаж, хаалга хаагдахгүй байна."},
    {"n":4,"question_zh":"这是什么东西？","answer":"4","explanation_mn":"4-р зураг дээр сармагчин хаалганы доор бөхийж юм харж байна."},
    {"n":5,"question_zh":"对不起，它不能在这里。","answer":"5","explanation_mn":"5-р зураг дээр сармагчин юмыг хогийн сав руу хаяж байна."},
    {"n":6,"question_zh":"门关上了，小猴子高高兴兴去踢足球了。","answer":"6","explanation_mn":"6-р зураг дээр хаалга хаагдсан, сармагчин бөмбөгтэй гүйж байна."}]},
  {"part":5,"type":"match","instruction_mn":"Let's say — дэлгүүрийн зургийг хараад өгүүлбэр хэл. (Зураг дээр цагийн хуваарь 7:00–4:30)","answer_source":"Let's say х.15","items":[
    {"n":1,"question_zh":"这个商店中午关门吗？","answer":"这个商店中午不关门。","explanation_mn":"Номын жишээ: 这个商店中午不关门。 Хуваарьт 7:00–4:30 гэсэн байгаа тул үд дунд нээлттэй."},
    {"n":2,"question_zh":"这个商店卖什么？","answer":"卖苹果、香蕉、书。","explanation_mn":"Тавиур дээр apple, banana, pear, book, pencil, school bag байна. Өөрийнхөөрөө хэл!"}]}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «开门» гэсэн үгийг дахин бичиж хуул.","question_zh":"开门","answer":"开门","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа дэлгүүрийн цагийг асуу.","question_zh":"商店几点开门？ 几点关门？","answer":"早上八点半就开门。","explanation_mn":"Хосоороо ээлжлэн. «就»-ийг цагийн ард хэл."},
   {"n":2,"prompt_mn":"Дэлгүүр тоглоом — «我买两个杯子。» «都卖完了。»","question_zh":"我买两个杯子。","answer":"(нээлттэй)","explanation_mn":"Худалдагч, худалдан авагчийн дүрээр солилцож тогло."},
   {"n":3,"prompt_mn":"Мини үлгэрийг найзтайгаа жүжигчил.","question_zh":"咦，门怎么关不上呢？","answer":"(нээлттэй)","explanation_mn":"Аудио 03-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 4 · Test Listening Scripts, Test Answers (Lesson 3)"}
dump("workbook.json", workbook)

# ---------------- IMAGE PROMPTS ----------------
NOTXT = " No English text."
def P(file,aspect,title,section,prompt,chars,role=None):
    d={"file":file,"aspect":aspect,"title":title,"section":section}
    if role: d["role"]=role
    d["prompt"]=prompt+NOTXT; d["chars"]=chars; return d
WORDS=[
 ("kai","开","A yellow camel calf boy pushing open a big wooden shop door with both hands, bright morning light pouring in, happy face.",["huu"]),
 ("guan","关","A camel calf girl in a yellow dress with a pink ribbon gently closing a big wooden door, the door nearly shut, sunset light.",["ohin"]),
 ("men","门","A big red wooden door with golden handles standing alone in a sunny courtyard, a little camel calf boy pointing at it.",["huu"]),
 ("beizi","杯子","A brown camel calf boy in a green hat holding a cute red mug with a small tiger picture, smiling.",["bor"]),
 ("zhongwu","中午","A bright noon sun high in the sky above a school yard, a camel calf girl in a yellow dress eating lunch at a table, a clock showing 12:00.",["ohin"]),
 ("mai","卖","A teacher camel with glasses as a friendly shopkeeper behind a counter selling mugs and fruit to a happy camel calf boy.",["temee","huu"]),
 ("wan","完","A yellow camel calf boy lifting up an empty shelf and empty basket, with a surprised face, a few crumbs left.",["huu"]),
 ("jiu","就","A yellow camel calf boy in blue vest already standing at a shop door early in the morning, with a big clock showing 8:30 and the sunrise behind him.",["huu"])]
IP=[P("images/hero.jpg","4:3","早上八点半就开门。","teacher-intro","Teacher camel with glasses, a yellow camel calf boy and a camel calf girl standing in front of a cute shop with an OPEN sign, a big clock showing 8:30 above; speech bubble with the Chinese text 早上八点半就开门。 in large clear black font.",["temee","huu","ohin"],"hero")]
for k,z,pr,ch in WORDS: IP.append(P(f"images/w-{k}.jpg","1:1",z,"vocabulary",pr,ch))
IP += [
 P("images/d1.jpg","4:3","我想去买礼物，商店几点开门？","dialogue","A yellow camel calf boy and a camel calf girl in a yellow dress on a street in front of a small shop, the boy pointing at the shop, the girl pointing at a clock; speech bubble with the Chinese text 我想去买礼物，商店几点开门？ in large clear black font.",["huu","ohin"]),
 P("images/d2.jpg","4:3","我买两个老虎杯子。","dialogue","A camel calf girl in a yellow dress with a pink ribbon at a shop counter; a shopkeeper camel in a green apron shows an empty shelf, with a tiger mug picture and a cat mug on the shelf; speech bubble with the Chinese text 我买两个老虎杯子。 in large clear black font.",["ohin"]),
 P("images/story.jpg","4:3","门怎么关不上呢？","story","A funny little monkey in a purple shirt holding a soccer ball, puzzled, trying to close a big yellow wooden door that will not shut because something is stuck at the bottom; speech bubble with the Chinese text 门怎么关不上呢？ in large clear black font.",[]),
]
dump("image_prompts.json", IP, BASE)

# ---------------- LESSON / MANIFEST ----------------
images = [{"id":p["file"].split("/")[-1].rsplit(".",1)[0],"file":p["file"],"title":p["title"],"role":p.get("role","illustration"),"section":p["section"]} for p in IP]
images += [{"id":"story-panels","file":"images/story.png","title":"门怎么关不上呢？ · Mini story","role":"illustration","section":"story"}]
images += [{"id":k,"file":f"images/{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["t1","t2","t3","t4","t5","t6","t7","t8"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 4 · 3-р хичээл — Өглөө найман цаг хагаст л нээгддэг","chineseTitle":"早上八点半就开门。","targetTitle":"早上八点半就开门。","mongolianTitle":"Өглөө найман цаг хагаст л нээгддэг",
 "subtitle":"开 · 关 · 门 · 杯子 · 中午 · 卖 · 完 · 就 · «门怎么关不上呢？» үлгэр",
 "description":f"Дэлгүүрийн цаг асуух, «都卖完了» гэж хэлэхийг сурна. {len(vocab)} үг, 2 зурагт яриа, Mini story «门怎么关不上呢？», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🏪","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 4",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 4 — 第3课《早上八点半就开门。》 [hskLevel=2] [lessonNumber=3]; эх: сурах бичиг х.13–17; аудио CD 03-01…03-04 (бүгд байгаа)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"早上八点半就开门。","mongolianTitle":"Өглөө найман цаг хагаст л нээгддэг",
 "series":"YCT 标准教程 4","seriesLabel_mn":"YCT 4 — Хүүхдийн хятад хэл (≈HSK2–3)",
 "source":"YCT 标准教程 4 · 第3课 (сурах бичиг + CD аудио 03-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L3)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
