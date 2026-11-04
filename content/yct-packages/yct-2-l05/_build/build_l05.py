#!/usr/bin/env python3
"""YCT 标准教程 2 · 第5课 你会不会做饭？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib
OUT = "/home/claude/work/yct2/l05/pkg"
CID, LID, N = "yct-2", "yct-2-l05", 5
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

# Тестийн зураг (hi-29.png) + story (hi-28.png) pkg/images-д аль хэдийн хайчлагдсан (t1a..t1d, story)
from PIL import Image
_pg = Image.open("/home/claude/work/yct2/l05/pages/hi-29.png").convert("RGB")
_BOX = {"t1a":(270,310,420,440),"t1b":(515,310,620,465),"t1c":(780,315,860,465),"t1d":(970,335,1130,440)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct2/l05/pages/hi-28.png").convert("RGB").crop((190,280,1240,1560)).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-2-05-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = AUD_TEXT   # дуу байхгүй → яриа track

# ---------------- VOCAB ----------------
VOCAB = [
 ("包子","bāozi","бууз (хятадын уураар чанасан бууз)","нэр үг · гол үг","这个包子真好吃！","Zhège bāozi zhēn hǎochī!","Энэ бууз үнэхээр амттай юм!",True),
 ("医生","yīshēng","эмч","нэр үг · гол үг","我妈妈是医生。","Wǒ māma shì yīshēng.","Миний ээж эмч.",True),
 ("厨师","chúshī","тогооч","нэр үг · нэмэлт үг","你妈妈是不是厨师？","Nǐ māma shì bu shì chúshī?","Чиний ээж тогооч уу?",False),
 ("会","huì","чадах, мэддэг","туслах үйл үг · гол үг","我不会做包子。","Wǒ bú huì zuò bāozi.","Би бууз хийж чадахгүй.",True),
 ("做","zuò","хийх, хоол хийх","үйл үг · гол үг","这是我妈妈做的。","Zhè shì wǒ māma zuò de.","Энийг миний ээж хийсэн.",True),
 ("真","zhēn","үнэхээр","дайвар үг · гол үг","这个包子真好吃！","Zhège bāozi zhēn hǎochī!","Энэ бууз үнэхээр амттай юм!",True),
 ("好吃","hǎochī","амттай","тэмдэг нэр · гол үг","今天的饭不好吃。","Jīntiān de fàn bù hǎochī.","Өнөөдрийн хоол амттай биш байна.",True),
 ("漂亮","piàoliang","сайхан, үзэсгэлэнтэй","тэмдэг нэр · нэмэлт үг","妹妹漂亮不漂亮？","Mèimei piàoliang bu piàoliang?","Дүү охин минь үзэсгэлэнтэй юү?",False),
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
 {"id":1,"title_mn":"Яриа 1 · Гал тогоонд","scene_mn":"Гал тогооны өрөөнд хүү эгчээсээ хоол хийж чадах эсэхийг асууж байна. Эгч нь буйдан дээр ном барьж сууна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"姐姐，你会不会做饭？","pinyin":"Jiějie, nǐ huì bu huì zuò fàn?","mn":"Эгч ээ, чи хоол хийж чадах уу?"},
           {"speaker":"姐姐","zh":"会。你要吃什么？","pinyin":"Huì. Nǐ yào chī shénme?","mn":"Чадна. Чи юу идмээр байна?"},
           {"speaker":"小明","zh":"我要吃包子。","pinyin":"Wǒ yào chī bāozi.","mn":"Би бууз идмээр байна."},
           {"speaker":"姐姐","zh":"我不会做包子。","pinyin":"Wǒ bú huì zuò bāozi.","mn":"Би бууз хийж чадахгүй."}]},
 {"id":2,"title_mn":"Яриа 2 · Зүлэг дээр пикник","scene_mn":"Хүүхдүүд мод дор зүлэг дээр пикник хийж байна. Нэг нь бууз идээд, хэн хийснийг асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"玛丽","zh":"这个包子真好吃！","pinyin":"Zhège bāozi zhēn hǎochī!","mn":"Энэ бууз үнэхээр амттай юм!"},
           {"speaker":"大卫","zh":"这是我妈妈做的。","pinyin":"Zhè shì wǒ māma zuò de.","mn":"Энийг миний ээж хийсэн."},
           {"speaker":"小红","zh":"你妈妈是不是厨师？","pinyin":"Nǐ māma shì bu shì chúshī?","mn":"Чиний ээж тогооч уу?"},
           {"speaker":"小明","zh":"不是，我妈妈是医生。","pinyin":"Bú shì, wǒ māma shì yīshēng.","mn":"Үгүй, миний ээж эмч."}]},
]
sentences=[]
dlg = [
 (1,"小明：姐姐，你会不会做饭？","Xiǎo Míng: Jiějie, nǐ huì bu huì zuò fàn?","Сяо Мин: Эгч ээ, чи хоол хийж чадах уу?","小明：| 姐姐|jiějie ，| 你|nǐ 会不会|huì bu huì 做饭|zuò fàn ？|","会不会 — «чадах уу, үгүй юу?» гэж асууна. Хариулахдаа 会 эсвэл 不会 гэнэ.",["你会不会做饭？"]),
 (1,"姐姐：会。你要吃什么？","Jiějie: Huì. Nǐ yào chī shénme?","Эгч: Чадна. Чи юу идмээр байна?","姐姐：| 会|huì 。| 你|nǐ 要|yào 吃|chī 什么|shénme ？|","",[]),
 (1,"小明：我要吃包子。","Xiǎo Míng: Wǒ yào chī bāozi.","Сяо Мин: Би бууз идмээр байна.","小明：| 我|wǒ 要|yào 吃|chī 包子|bāozi 。|","",[]),
 (1,"姐姐：我不会做包子。","Jiějie: Wǒ bú huì zuò bāozi.","Эгч: Би бууз хийж чадахгүй.","姐姐：| 我|wǒ 不会|bú huì 做|zuò 包子|bāozi 。|","不会 = «чадахгүй». 不 энд 2-р аялгуугаар «bú» гэж уншигдана.",[]),
 (2,"玛丽：这个包子真好吃！","Mǎlì: Zhège bāozi zhēn hǎochī!","Мари: Энэ бууз үнэхээр амттай юм!","玛丽：| 这个|zhège 包子|bāozi 真|zhēn 好吃|hǎochī ！|","真 = «үнэхээр». Гайхсан, сэтгэл ханасан үед хэлнэ.",[]),
 (2,"大卫：这是我妈妈做的。","Dàwèi: Zhè shì wǒ māma zuò de.","Дэвид: Энийг миний ээж хийсэн.","大卫：| 这|zhè 是|shì 我|wǒ 妈妈|māma 做|zuò 的|de 。|","",[]),
 (2,"小红：你妈妈是不是厨师？","Xiǎo Hóng: Nǐ māma shì bu shì chúshī?","Сяо Хун: Чиний ээж тогооч уу?","小红：| 你|nǐ 妈妈|māma 是不是|shì bu shì 厨师|chúshī ？|","是不是 — «мөн үү, биш үү?» гэж асууна.",["你妈妈是不是厨师？"]),
 (2,"小明：不是，我妈妈是医生。","Xiǎo Míng: Bú shì, wǒ māma shì yīshēng.","Сяо Мин: Үгүй, миний ээж эмч.","小明：| 不是|bú shì ，| 我|wǒ 妈妈|māma 是|shì 医生|yīshēng 。|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("妹妹漂亮不漂亮？","Mèimei piàoliang bu piàoliang?","Дүү охин минь үзэсгэлэнтэй юү?","妹妹|mèimei 漂亮不漂亮|piàoliang bu piàoliang ？|"),
 ("她不漂亮。","Tā bú piàoliang.","Тэр сайхан биш.","她|tā 不|bú 漂亮|piàoliang 。|"),
 ("你喜欢不喜欢妹妹？","Nǐ xǐhuan bu xǐhuan mèimei?","Чи дүүгээ дуртай юу?","你|nǐ 喜欢不喜欢|xǐhuan bu xǐhuan 妹妹|mèimei ？|"),
 ("我不喜欢她，她太难看了。","Wǒ bù xǐhuan tā, tā tài nánkàn le.","Би түүнд дургүй. Тэр хэтэрхий муухай юм.","我|wǒ 不|bù 喜欢|xǐhuan 她|tā ，| 她|tā 太|tài 难看|nánkàn 了|le 。|"),
 ("妈妈，你爱不爱我？","Māma, nǐ ài bu ài wǒ?","Ээж ээ, чи намайг хайрладаг уу?","妈妈|māma ，| 你|nǐ 爱不爱|ài bu ài 我|wǒ ？|"),
 ("妈妈爱你。","Māma ài nǐ.","Ээж чамайг хайрладаг.","妈妈|māma 爱|ài 你|nǐ 。|"),
 ("妈妈，我没有朋友。","Māma, wǒ méiyǒu péngyou.","Ээж ээ, надад найз байхгүй.","妈妈|māma ，| 我|wǒ 没有|méiyǒu 朋友|péngyou 。|"),
 ("太冷了，太冷了！","Tài lěng le, tài lěng le!","Үнэхээр даарч байна, үнэхээр даарч байна!","太|tài 冷|lěng 了|le ，| 太|tài 冷|lěng 了|le ！|"),
 ("你会不会飞？","Nǐ huì bu huì fēi?","Чи нисч чадах уу?","你|nǐ 会不会|huì bu huì 飞|fēi ？|"),
 ("我试试……","Wǒ shìshi ……","Би үзье дээ...","我|wǒ 试试|shìshi ……|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «丑小鸭» (Муухай нугасны ангаахай) — 6 зурагт үлгэр. 漂亮不漂亮 = «сайхан уу, үгүй юу?»"
    if i==3: s["note"]="难看 = муухай. 太……了 = «хэтэрхий …». Яг энэ хэсэгт дүү нь ангаахайг муухай гэж хэлж байна."
    if i==6: s["note"]="朋友 = найз. 没有 = байхгүй."
    if i==8: s["note"]="飞 = нисэх. Ангаахай хунгийн ертөнцөд очно: нисч чадах уу?"
    sentences.append(s)

texts = {
 "unit":{"number":"5","title":"你会不会做饭？","mongolianTitle":"Чи хоол хийж чадах уу? — чадах, чадахгүйгээ асуух"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх YCT 1 номд чи гэр бүлээ, тоо, өнгө, амьтдыг сурсан даа. Одоо чамаас асууя: чи хоол хийж чадах уу? Ээж чинь ямар ажил хийдэг вэ? Эмч үү, тогооч уу? Өнөөдөр «你会不会做饭？» гэж чадахаа асууж, «你妈妈是不是厨师？» гэж найзаасаа лавлаж сурна. Мөн хятадуудын дуртай «包子» буюу бууз идэж үзээд «真好吃！» гэж хашгирна. Хамт «丑小鸭» үлгэр уншина. Эхэлцгээе!",
  "warmup_mn":"Чи ээждээ туслаад ямар хоол хийж чадах вэ? Өнөөдөр хамгийн амттай юм чи юу идсэн бэ?",
  "theme_zh":"会不会 · 是不是 · 包子 · 医生","theme_mn":"Чадах уу · мөн үү · бууз · эмч"},
 "warmup":{"mongolian":"Чи ээждээ туслаад ямар хоол хийж чадах вэ? Хамгийн дуртай хоол чинь юу вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"5","title":"你会不会做饭？","mongolianTitle":"Чи хоол хийж чадах уу? — яриа, үлгэр","title_mn":"Let's read · 2 яриа + Mini story · 丑小鸭","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第5课 Let's read / Mini story（CD 05-02, 05-03）","author_zh":"",
  "intro_zh":"两段小对话：你会不会做饭？你妈妈是不是厨师？然后读小故事《丑小鸭》。",
  "intro_mn":"Эхлээд хоёр яриа: «你会不会做饭？» гэж хоол хийж чадахаа асууна, «你妈妈是不是厨师？» гэж ээжийн ажлыг асууна. Дараа нь «丑小鸭» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл! Үлгэрийг найзтайгаа жүжигчилж үзээрэй.",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хүү эгчээсээ хоол хийж чадах эсэхийг асууна. Эгч чадна гэнэ. Гэтэл бууз хийж чадахгүй."},
   {"paragraph":2,"mn":"Яриа 2 — Пикникт хүүхдүүд бууз идэж байна. Бууз нь Дэвидийн ээжийн хийсэн. Дэвидийн ээж тогооч биш, эмч."},
   {"paragraph":3,"mn":"Үлгэр «丑小鸭» — Саарал ангаахайг дүү нь муухай гэж хэлж, найз байхгүй болно. Ээж нь л хайрлана. Дараа нь хунгууд «Чи нисч чадах уу?» гэж асуувал ангаахай «Би үзье» гэнэ. Аудио: 05-03."}],
  "reflection":{"questions_mn":["Чи юу хийж чадах вэ? «我会……» гэж хэлж үз.","Ээж аав чинь ямар ажил хийдэг вэ?","Ангаахайг найзгүй болоход чи юу гэх байсан бэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Чадахаа асуу","zh":"你会不会做饭？","pinyin":"Nǐ huì bu huì zuò fàn?","mn":"Чи хоол хийж чадах уу?"},
  "writingPrompt_mn":"Найзаасаа «你会不会……？» гэж асуугаад «会» эсвэл «不会» гэж хариул."},
 "properNouns":[{"zh":"丑小鸭","pinyin":"Chǒuxiǎoyā","mn":"Муухай нугасны ангаахай (үлгэрийн нэр)"}],
 "wordExplanation":[
  {"word":"会不会","gloss":"huì bu huì — чадах уу, үгүй юу","explanation":"会 гэдэг нь «чадах, мэддэг» гэсэн үг. Чадах эсэхийг асуухдаа 会 ба 不会-г дараалуулж «会不会» гэнэ. «你会不会做饭？» — Чи хоол хийж чадах уу? Чадна гэвэл «会», чадахгүй бол «不会» гэж хариулна.",
   "structure":"你会不会 + юу хийх？ → 会。/ 不会。","teacher_notes":"Хүүхэд өөрийн чадах зүйлээр жишээ хэлүүл: 会唱歌 г.м. Дүрмийн нэр томьёо хэрэглэхгүй, жишээгээр давтуул.",
   "examples":[{"chinese":"你会不会做饭？","pinyin":"Nǐ huì bu huì zuò fàn?","mongolian":"Чи хоол хийж чадах уу?"},{"chinese":"我不会做包子。","pinyin":"Wǒ bú huì zuò bāozi.","mongolian":"Би бууз хийж чадахгүй."},{"chinese":"你会不会飞？","pinyin":"Nǐ huì bu huì fēi?","mongolian":"Чи нисч чадах уу?"}],
   "common_mistakes":[{"wrong":"你会做饭不会？","right":"你会不会做饭？","why":"会不会 хоёр үгийг хамт, үйл үгийн өмнө тавина."}],
   "check":{"question":"«Чи хоол хийж чадах уу?» хятадаар:","options":["你会不会做饭？","你妈妈是不是厨师？","这个包子真好吃！"],"answer":"0"},
   "practice":[{"n":1,"question":"你 ________ 做饭？(чадах уу)","answer":"会不会","explanation_mn":"«Чадах уу» гэж асуухдаа 会不会."}]},
  {"word":"是不是","gloss":"shì bu shì — мөн үү, биш үү","explanation":"是 гэдэг нь «мөн, бол» гэсэн үг. «Мөн үү, биш үү?» гэж лавлахдаа «是不是» гэнэ. Мөн бол «是», биш бол «不是» гэж хариулна.",
   "structure":"你妈妈是不是 + хэн？ → 是。/ 不是，……是……。","teacher_notes":"Номын яриа: 不是，我妈妈是医生。 «Үгүй» гэснийхээ дараа зөв хариултыг нэмж хэл.",
   "examples":[{"chinese":"你妈妈是不是厨师？","pinyin":"Nǐ māma shì bu shì chúshī?","mongolian":"Чиний ээж тогооч уу?"},{"chinese":"不是，我妈妈是医生。","pinyin":"Bú shì, wǒ māma shì yīshēng.","mongolian":"Үгүй, миний ээж эмч."},{"chinese":"你爸爸是不是医生？","pinyin":"Nǐ bàba shì bu shì yīshēng?","mongolian":"Чиний аав эмч үү?"}],
   "common_mistakes":[{"wrong":"你妈妈是厨师不是？","right":"你妈妈是不是厨师？","why":"是不是 нь 厨师-ийн өмнө орно."}],
   "check":{"question":"«Чиний ээж эмч үү?» хятадаар:","options":["你妈妈是不是医生？","你会不会做饭？","我要吃包子。"],"answer":"0"},
   "practice":[{"n":1,"question":"你爸爸 ________ 医生？(мөн үү)","answer":"是不是","explanation_mn":"«Мөн үү» гэж асуухдаа 是不是."}]},
  {"word":"大不大 · 漂亮不漂亮","gloss":"dà bu dà · piàoliang bu piàoliang — том уу? сайхан уу?","explanation":"Тэмдэг нэрээ хоёр удаа хэлж «…уу, үгүй юу?» гэж асууна: 大不大 (том уу?), 高不高 (өндөр үү?), 漂亮不漂亮 (сайхан уу?). Мөн «要不要» — «авмаар байна уу?» гэж асууна.",
   "structure":"A不A？ → 大不大？ 高不高？ 要不要？","teacher_notes":"Let's match-ийн бөмбөлгүүд: 是不是 会不会 要不要 高不高 大不大 漂亮不漂亮 — бүгд адил бүтэцтэй.",
   "examples":[{"chinese":"这个苹果大不大？","pinyin":"Zhège píngguǒ dà bu dà?","mongolian":"Энэ алим том уу?"},{"chinese":"妹妹漂亮不漂亮？","pinyin":"Mèimei piàoliang bu piàoliang?","mongolian":"Дүү охин минь сайхан уу?"},{"chinese":"这个你要不要？","pinyin":"Zhège nǐ yào bu yào?","mongolian":"Энийг чи авмаар байна уу?"}],
   "common_mistakes":[{"wrong":"这个苹果大大不？","right":"这个苹果大不大？","why":"Дараалал: том → 不 → том."}],
   "check":{"question":"«Энэ алим том уу?» хятадаар:","options":["这个苹果大不大？","这个苹果真好吃！","你会不会做饭？"],"answer":"0"},
   "practice":[{"n":1,"question":"你的手 ________ ？(том уу)","answer":"大不大","explanation_mn":"«Том уу» — 大不大."}]},
 ],
 "collocations":[{"type":"A不A — асуух хэлбэр","rows":[
   {"head":"会不会","with":"做饭","mn":"хоол хийж чадах уу","usage_mn":"Чадах эсэхийг асуух","example":{"zh":"你会不会做饭？","pinyin":"Nǐ huì bu huì zuò fàn?","mn":"Чи хоол хийж чадах уу?"}},
   {"head":"是不是","with":"厨师","mn":"тогооч уу","usage_mn":"Ажил, хэн болохыг лавлах","example":{"zh":"你妈妈是不是厨师？","pinyin":"Nǐ māma shì bu shì chúshī?","mn":"Чиний ээж тогооч уу?"}},
   {"head":"真","with":"好吃","mn":"үнэхээр амттай","usage_mn":"Амттай байхад баярлан хэлэх","example":{"zh":"这个包子真好吃！","pinyin":"Zhège bāozi zhēn hǎochī!","mn":"Энэ бууз үнэхээр амттай юм!"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["会不会","是不是","真","做"],"items":[
     {"n":1,"question":"你 ________ 做饭？","answer":"会不会","explanation_mn":"«Чадах уу?» — 会不会."},
     {"n":2,"question":"你妈妈 ________ 医生？","answer":"是不是","explanation_mn":"«Мөн үү?» — 是不是."},
     {"n":3,"question":"这个包子 ________ 好吃！","answer":"真","explanation_mn":"«Үнэхээр» — 真."},
     {"n":4,"question":"这是我妈妈 ________ 的。","answer":"做","explanation_mn":"Ээж хийсэн — 做."}]}],
   "answer_source":"agent-authored (YCT 2 · 5-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"姐姐会不会做包子？","answer":"不会。","explanation_mn":"Яриа 1 — эгч «我不会做包子» гэсэн."},
     {"n":2,"question_zh":"他妈妈是不是医生？","answer":"是。","explanation_mn":"Яриа 2 — «我妈妈是医生» гэсэн."}],
   "answer_source":"textbook_verified (Let's read, х.24 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Үгэнд хүр","start_zh":"包子！","instruction_mn":"Самбар эсвэл цаасан дээр шинэ үгсийг бичээд хана налуул. Ээж аав «包子！医生！做！» гэж хэлэхэд чи тэр үгэнд аль болох хурдан гараараа хүр!"},
     {"label":"会不会 тэмцээн","start_zh":"你会不会……？","instruction_mn":"Нэг нь «你会不会做饭？ 你会不会跳舞？» гэж асууна. Нөгөө нь хурдан «会！» эсвэл «不会！» гэж хариулна. Хэн алдаагүй хариулсан нь хожно."},
     {"label":"Ээж аавынхаа ажлыг хэл","start_zh":"我妈妈是……","instruction_mn":"Хосоороо гэр бүлийнхээ ажлыг хэл: «我妈妈是医生。» Нөгөө нь «你妈妈是不是医生？» гэж асууна. Ээж аав чинь юу хийж чадахыг мөн хэлж үз."},
     {"label":"Шоотой тоглоом","start_zh":"妈妈会不会做饭？","instruction_mn":"Шоо хаяж зураг дээрх зам дагана. Зураг бүр дээр найздаа «妈妈会不会做饭？» гэж асууна, найз нь «妈妈会做饭。» гэж хариулна. Хэн түрүүлж төгсгөлд хүрэх вэ?"},
     {"label":"丑小鸭 жүжиг","start_zh":"你会不会飞？","instruction_mn":"Үлгэрийг уншаад жүжигчилье. Нэг нь ангаахай, нэг нь ээж, нэг нь дүү болно. Хамгийн сүүлд «你会不会飞？» гэхэд ангаахай «我试试……» гэж далавчаа дэлгэж үз!"}]}},
 "grammarNotes":[],
 "culture":{"title":"包子","title_mn":"Хятад хүүхдийн өглөөний хоол — 包子","text_mn":"Хятад хүүхдүүд өглөө ихэвчлэн 包子 иддэг. Энэ бол уураар чанасан, дотроо мах, ногоотой зөөлөн бууз. Монголын бууз шиг боловч дүүргэлт нь янз бүр, зарим нь амтат байдаг. Монгол хүүхэд та бууздаа дуртай бол «包子真好吃！» гэж хэлээрэй.","note_mn":"Чиний гэрт хамгийн амттай бууз хэн хийдэг вэ? Ээж үү, эмээ үү?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — чадах, чадахгүйгээ ба хэн болохыг асуух.","topic":"Чи юу хийж чадах вэ?","discussion":["Хосоороо: «你会不会做饭？» гэж асууж, «会» эсвэл «不会» гэж хариул.","Бүгдээрээ «你妈妈是不是医生？» гэж ээлжлэн асуу."],
   "writing":{"promptChinese":"我会……。我不会……。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «你会不会做饭？» гэж хятадаар асуугаад хариултыг нь сонс.","minChars":"0","requiredWords":["会","做"],"sampleChinese":"我不会做包子。","sampleMongolian":"Би бууз хийж чадахгүй.","gradingRubric":"会 ба 不会-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers: L5 1.C 2.A 3.B 4.D 5.D 6.C 7.B 8.A","parts":[]},
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
 {"point":"你会不会做饭？ — чадах уу","gloss_mn":"«Чи хоол хийж чадах уу?» — чадах эсэхийг асууна",
  "structure":"你会不会 + юу хийх？ → 会。/ 不会。",
  "teacher_mn":"Найзаасаа хийж чадах эсэхийг нь асуумаар байвал «会不会» гэж хэлнэ. 会 = чадна. Чадахгүй бол «不会» гэнэ. «你会不会做饭？» — чи хоол хийж чадах уу? Гараа даллаад «会！» эсвэл «不会！» гэж хариулж үз.",
  "teacher_notes":"Номын яриа: 姐姐，你会不会做饭？ 会。 … 我不会做包子。 不会-д 不 нь «bú» гэж уншигдана.",
  "examples":[ex("你会不会做饭？","Nǐ huì bu huì zuò fàn?","Чи хоол хийж чадах уу?"),ex("会。你要吃什么？","Huì. Nǐ yào chī shénme?","Чадна. Чи юу идмээр байна?"),ex("我不会做包子。","Wǒ bú huì zuò bāozi.","Би бууз хийж чадахгүй."),ex("你会不会飞？","Nǐ huì bu huì fēi?","Чи нисч чадах уу?")],
  "common_mistakes":[{"wrong":"我不会做包子吗？","right":"我不会做包子。","why":"Хариулахдаа асуулт болгож 吗 нэмэхгүй."}],
  "check":chk("Найзаасаа «Чи хоол хийж чадах уу?» гэж асуу:",["你会不会做饭？","你妈妈是不是厨师？","这个包子真好吃！"],"你会不会做饭？","g1c"),
  "exercises":[
   choice("你 ________ 做饭？",["会不会","是不是","大不大"],"会不会","Зөв! 会不会 = чадах уу.","会不会 = чадах уу, 是不是 = мөн үү, 大不大 = том уу.","g1e1"),
   choice("«Би чадахгүй» хятадаар:",["不会","会","是"],"不会","Зөв! 不会 = чадахгүй.","会 = чадна, 不会 = чадахгүй.","g1e2"),
   judge("«会» гэдэг нь «чадах» гэсэн үг.",True,"Зөв! 会 = чадах.","会 = чадах.")]},
 {"point":"你妈妈是不是厨师？ — мөн үү","gloss_mn":"«Чиний ээж тогооч уу?» — мөн үү, биш үү",
  "structure":"你妈妈是不是 + хэн？ → 是。/ 不是，……",
  "teacher_mn":"Хэн болохыг нь лавлахдаа «是不是» гэнэ. 是 = мөн. «你妈妈是不是厨师？» — чиний ээж тогооч уу? Мөн бол «是», биш бол «不是» гэж хэлээд зөв хариултыг нэм: «不是，我妈妈是医生».",
  "teacher_notes":"Номын яриа 2: 你妈妈是不是厨师？ 不是，我妈妈是医生。",
  "examples":[ex("你妈妈是不是厨师？","Nǐ māma shì bu shì chúshī?","Чиний ээж тогооч уу?"),ex("不是，我妈妈是医生。","Bú shì, wǒ māma shì yīshēng.","Үгүй, миний ээж эмч."),ex("他妈妈是不是医生？","Tā māma shì bu shì yīshēng?","Түүний ээж эмч үү?"),ex("这是我妈妈做的。","Zhè shì wǒ māma zuò de.","Энийг миний ээж хийсэн.")],
  "common_mistakes":[{"wrong":"你妈妈是厨师不是？","right":"你妈妈是不是厨师？","why":"是不是 нь ажлын нэрийн өмнө орно."}],
  "check":chk("«Чиний ээж эмч үү?» хятадаар:",["你妈妈是不是医生？","你会不会做饭？","我要吃包子。"],"你妈妈是不是医生？","g2c"),
  "exercises":[
   choice("你爸爸 ________ 医生？",["是不是","会不会","要不要"],"是不是","Зөв! 是不是 = мөн үү.","Ажил, хэн болохыг лавлахад 是不是.","g2e1"),
   choice("«Үгүй, миний ээж эмч» хятадаар:",["不是，我妈妈是医生。","会。","我要吃包子。"],"不是，我妈妈是医生。","Зөв!","不是 = үгүй, мөн биш.","g2e2"),
   judge("«医生» гэдэг нь «эмч» гэсэн үг.",True,"Зөв! 医生 = эмч.","医生 = эмч, 厨师 = тогооч.")]},
 {"point":"大不大 · 漂亮不漂亮 · 要不要","gloss_mn":"«…уу, үгүй юу?» — тэмдэг нэр ба үйл үгээр асуух",
  "structure":"A不A？ → 大不大？ 高不高？ 要不要？",
  "teacher_mn":"Тэмдэг нэрээ хоёр удаа хэлж, дунд нь «不» тавивал асуулт болно. 大不大 — том уу? 高不高 — өндөр үү? 要不要 — авмаар байна уу? Алимаа барьж асуугаад үз!",
  "teacher_notes":"Let's match: 是不是 会不会 要不要 高不高 大不大 漂亮不漂亮. Бүгд ижил бүтэцтэй.",
  "examples":[ex("这个苹果大不大？","Zhège píngguǒ dà bu dà?","Энэ алим том уу?"),ex("妹妹漂亮不漂亮？","Mèimei piàoliang bu piàoliang?","Дүү охин минь сайхан уу?"),ex("你要不要喝牛奶？","Nǐ yào bu yào hē niúnǎi?","Чи сүү уумаар байна уу?")],
  "common_mistakes":[{"wrong":"这个苹果大大不？","right":"这个苹果大不大？","why":"Дараалал: том → 不 → том."}],
  "check":chk("«Энэ алим том уу?» хятадаар:",["这个苹果大不大？","这个苹果真好吃！","你会不会做饭？"],"这个苹果大不大？","g3c"),
  "exercises":[
   choice("你的手 ________ ？",["大不大","会不会","是不是"],"大不大","Зөв! 大不大 = том уу.","Том уу гэж асуухад 大不大.","g3e1"),
   choice("她的个子 ________ ？",["高不高","要不要","会不会"],"高不高","Зөв! 高不高 = өндөр үү.","个子 өндөр үү гэж 高不高.","g3e2"),
   judge("«要不要» гэдэг нь «авмаар байна уу?» гэсэн үг.",True,"Зөв!","要 = авмаар байх, хүсэх.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Бууз» хятадаар аль нь вэ?",["包子","医生","苹果","妈妈"],"包子","包子 (bāozi) = бууз.","easy",["vocabulary"],"a1")
q("choice","«Эмч» хятадаар аль нь вэ?",["医生","厨师","老师","妈妈"],"医生","医生 (yīshēng) = эмч.","easy",["vocabulary"],"a2")
q("choice","«Тогооч» хятадаар аль нь вэ?",["厨师","医生","包子","爸爸"],"厨师","厨师 (chúshī) = тогооч.","medium",["vocabulary"],"a3")
q("choice","«会» гэдэг үг ямар утгатай вэ?",["чадах","амттай","үнэхээр","хийх"],"чадах","会 (huì) = чадах.","easy",["vocabulary"],"a4")
q("choice","«做» гэдэг үг ямар утгатай вэ?",["хийх, хоол хийх","идэх","уух","чадах"],"хийх, хоол хийх","做 (zuò) = хийх. 做饭 = хоол хийх.","easy",["vocabulary"],"a5")
q("choice","«真» гэдэг үг ямар утгатай вэ?",["үнэхээр","байхгүй","сайхан","том"],"үнэхээр","真 (zhēn) = үнэхээр.","easy",["vocabulary"],"a6")
q("choice","«好吃» гэдэг үг ямар утгатай вэ?",["амттай","чадах","муухай","том"],"амттай","好吃 (hǎochī) = амттай.","easy",["vocabulary"],"a7")
q("choice","«漂亮» гэдэг үг ямар утгатай вэ?",["сайхан, үзэсгэлэнтэй","амттай","өндөр","жижиг"],"сайхан, үзэсгэлэнтэй","漂亮 (piàoliang) = сайхан, үзэсгэлэнтэй.","medium",["vocabulary"],"a8")
q("choice","«Чи хоол хийж чадах уу?» хятадаар:",["你会不会做饭？","你妈妈是不是厨师？","这个包子真好吃！","我要吃包子。"],"你会不会做饭？","会不会 = чадах уу.","easy",["dialogue"],"a9")
q("choice","«Чиний ээж тогооч уу?» хятадаар:",["你妈妈是不是厨师？","你会不会做饭？","这是我妈妈做的。","我要吃包子。"],"你妈妈是不是厨师？","是不是 = мөн үү.","medium",["dialogue"],"a10")
q("choice","Эгч «我不会做包子» гэвэл тэр юу гэсэн үг вэ?",["Би бууз хийж чадахгүй","Би бууз идмээр байна","Бууз амттай байна","Би эмч"],"Би бууз хийж чадахгүй","不会 = чадахгүй.","easy",["dialogue"],"a11")
q("choice","Яриа 2-т Дэвидийн ээж хэн бэ?",["医生","厨师","老师","姐姐"],"医生","不是，我妈妈是医生 — ээж нь эмч.","medium",["dialogue"],"a12")
q("cloze","你（ ）不会做饭？",["会","是","真","做"],"会","会不会 = чадах уу.","easy",["dialogue"],"a13")
q("cloze","你妈妈（ ）不是厨师？",["是","会","要","真"],"是","是不是 = мөн үү.","easy",["dialogue"],"a14")
q("cloze","这个包子（ ）好吃！",["真","会","做","吗"],"真","真好吃 = үнэхээр амттай.","easy",["dialogue"],"a15")
q("cloze","这是我妈妈（ ）的。",["做","吃","是","会"],"做","做 = хийх.","medium",["dialogue"],"a16")
q("choice","«大不大» гэж асуувал юу гэж асууж байна вэ?",["Том уу?","Өндөр үү?","Амттай юу?","Чадах уу?"],"Том уу?","大不大 = том уу.","easy",["structure"],"a17")
q("choice","«高不高» гэж асуувал юу гэж асууж байна вэ?",["Өндөр үү?","Том уу?","Авмаар байна уу?","Мөн үү?"],"Өндөр үү?","高不高 = өндөр үү.","easy",["structure"],"a18")
q("choice","«要不要» гэж асуувал юу гэж асууж байна вэ?",["Авмаар байна уу?","Мөн үү?","Чадах уу?","Том уу?"],"Авмаар байна уу?","要不要 = авмаар байна уу.","medium",["structure"],"a19")
q("choice","«Үгүй, мөн биш» хэлэхдээ:",["不是","不会","没有","再见"],"不是","不是 = мөн биш.","easy",["structure"],"a20")
q("choice","Пиньинь «bāozi» гэж уншдаг үг:",["包子","医生","厨师","好吃"],"包子","包子 = bāozi = бууз.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «yīshēng» гэж уншдаг үг:",["医生","厨师","包子","漂亮"],"医生","医生 = yīshēng = эмч.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «hǎochī» гэж уншдаг үг:",["好吃","漂亮","厨师","做饭"],"好吃","好吃 = hǎochī = амттай.","medium",["pronunciation"],"a23")
q("usage","Найз чинь «你会不会做饭？» гэж асуулаа. Чи хоол хийж чадахгүй бол:",["不会。","会。","是。","再见。"],"不会。","Чадахгүй бол 不会.","medium",["usage"],"a24")
q("usage","Бууз идээд маш амттай санагдлаа. Юу гэх вэ?",["这个包子真好吃！","我不会做包子。","你妈妈是医生。","你好！"],"这个包子真好吃！","真好吃 = үнэхээр амттай.","medium",["usage"],"a25")
q("usage","丑小鸭 үлгэрт ангаахайг дүү нь муухай гэхэд ээж нь юу гэсэн бэ?",["妈妈爱你。","我不喜欢她。","她不漂亮。","太冷了。"],"妈妈爱你。","Ээж нь «妈妈爱你» — «ээж чамайг хайрладаг» гэсэн.","medium",["usage"],"a26")
q("usage","Хамгийн сүүлд хунгууд ангаахайгаас юу гэж асуусан бэ?",["你会不会飞？","你会不会做饭？","你是不是医生？","你要不要吃？"],"你会不会飞？","你会不会飞？ = чи нисч чадах уу.","hard",["usage"],"a27")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (05-04) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）妈妈，你的个子真高！","script_zh":"妈妈，你的个子真高！","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"«Ээж ээ, чи үнэхээр өндөр юм аа!» — C зураг дээр өндөр ээжийн хөлөөс хүүхэд тэвэрч байна. A охин ногоон хоол харж сууна, B тогоочийн малгайтай охин, D алим барьсан гар."},
    {"n":2,"question_zh":"（听录音）今天的饭不好吃。","script_zh":"今天的饭不好吃。","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"«Өнөөдрийн хоол амттай биш» — A зураг дээр охин хоолны өмнө гомдонгуй сууж байна. B тогооч охин, C ээж, D алим."},
    {"n":3,"question_zh":"（听录音）我爱做饭。","script_zh":"我爱做饭。","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"«Би хоол хийх дуртай» — B зураг дээр охин тогоочийн малгай, хормогчтой байна. A охин гунигтай, C ээж, D алим."},
    {"n":4,"question_zh":"（听录音）你看，这个苹果大不大？","script_zh":"你看，这个苹果大不大？","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"«Хар даа, энэ алим том уу?» — D зураг дээр гарт алим байна. Алим гэдэг 苹果 үг сонсогдсон."}],
   "answer_source":"YCT 2 Test Answers L5: 1.C 2.A 3.B 4.D"},
  {"part":2,"type":"choice","instruction_mn":"Унших — асуултад тохирох хариултыг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"你妈妈是做什么的？","question_mn":"Чиний ээж юу хийдэг вэ?","options":BANK,"optionTexts":["包子。","她不会。","我要。","医生。"],"answer":"D","explanation_mn":"Ээжийн ажлыг асуусан тул «医生 — эмч» гэж хариулна. 包子 бууз, 她不会 чадахгүй, 我要 авмаар байна."},
    {"n":6,"question_zh":"这个你要不要？","question_mn":"Энийг чи авмаар байна уу?","options":BANK,"optionTexts":["包子。","她不会。","我要。","医生。"],"answer":"C","explanation_mn":"要不要 гэж асуусан тул «我要 — би авна» гэж хариулна."},
    {"n":7,"question_zh":"你姐姐会不会做面条儿？","question_mn":"Чиний эгч гоймон хийж чадах уу?","options":BANK,"optionTexts":["包子。","她不会。","我要。","医生。"],"answer":"B","explanation_mn":"会不会 гэж асуусан. «她不会 — тэр чадахгүй» нь хариулт."},
    {"n":8,"question_zh":"明天早上我们吃什么？","question_mn":"Маргааш өглөө бид юу идэх вэ?","options":BANK,"optionTexts":["包子。","她不会。","我要。","医生。"],"answer":"A","explanation_mn":"«Юу идэх вэ?» гэсэн асуултад хоолоор хариулна: «包子 — бууз»."}],
   "answer_source":"YCT 2 Test Answers L5: 5.D 6.C 7.B 8.A"},
  {"part":3,"type":"match","instruction_mn":"Let's match — бэлэг бүрийн хоосон зайд тохирох бөмбөлгийг сонго.","items":[
    {"n":1,"question_zh":"她的个子____？","answer":"高不高","explanation_mn":"Өндөр эсэхийг асууна."},
    {"n":2,"question_zh":"你的手____？","answer":"大不大","explanation_mn":"Гар том уу гэж асууна."},
    {"n":3,"question_zh":"你____做饭？","answer":"会不会","explanation_mn":"Хоол хийж чадах уу."},
    {"n":4,"question_zh":"你妈妈____？","answer":"漂亮不漂亮","explanation_mn":"Ээж сайхан уу."},
    {"n":5,"question_zh":"你____喝牛奶？","answer":"要不要","explanation_mn":"Сүү уумаар байна уу."},
    {"n":6,"question_zh":"你爸爸____医生？","answer":"是不是","explanation_mn":"Аав эмч үү."}],
   "answer_source":"Let's match х.25 (хариу агент тааруулсан)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «丑小鸭» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"她不漂亮。","answer":"1","explanation_mn":"1-р зураг дээр ангаахай шинэхэн гарч ирэхэд нугас «Тэр сайхан биш» гэж байна."},
    {"n":2,"question_zh":"我不喜欢她，她太难看了。","answer":"2","explanation_mn":"2-р зураг дээр шар ангаахайнууд саарал ангаахайг муухай гэнэ."},
    {"n":3,"question_zh":"妈妈爱你。","answer":"3","explanation_mn":"3-р зураг дээр ээж нугас ангаахайгаа тэвэрнэ."},
    {"n":4,"question_zh":"妈妈，我没有朋友。","answer":"4","explanation_mn":"4-р зураг дээр ангаахай ээжийгээ тэвэрч уйлна."},
    {"n":5,"question_zh":"太冷了，太冷了！","answer":"5","explanation_mn":"5-р зураг дээр цас, хөлдсөн цөөрөм байна."},
    {"n":6,"question_zh":"你会不会飞？","answer":"6","explanation_mn":"6-р зураг дээр хунгууд нисч байна."}],
   "answer_source":"textbook х.26 (Mini story)"},
  {"part":5,"type":"match","instruction_mn":"Let's play — шоо хаяж хосоороо асуу, хариул.","items":[
    {"n":1,"question_zh":"妈妈会不会做饭？","answer":"妈妈会做饭。","explanation_mn":"Зураг дээр ээж хоол хийж байгаа тул «会»."}],
   "answer_source":"Let's play х.25"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «包子» гэсэн ханзыг дахин бичиж хуул.","question_zh":"包子","answer":"包子","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа хоол хийж чадахыг нь асуу.","question_zh":"你会不会做饭？","answer":"你会不会做饭？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":2,"prompt_mn":"Ээж аавынхаа ажлыг хэл.","question_zh":"我妈妈是……","answer":"我妈妈是医生。","explanation_mn":"Өөрийн ээжийн ажлыг хэл."},
   {"n":3,"prompt_mn":"丑小鸭 үлгэрийг жүжигчил.","question_zh":"你会不会飞？ 我试试……","answer":"(нээлттэй)","explanation_mn":"Аудио 05-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 2 · Test Listening Scripts, Test Answers (Lesson 5)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("baozi","包子"),("yisheng","医生"),("chushi","厨师"),("hui","会"),("zuo","做"),("zhen","真"),("haochi","好吃"),("piaoliang","漂亮")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"你会不会做饭？","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"姐姐，你会不会做饭？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"这个包子真好吃！","role":"illustration","section":"dialogue"},
 {"id":"story","file":"images/story.png","title":"丑小鸭 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 5-р хичээл — Чи хоол хийж чадах уу?","chineseTitle":"你会不会做饭？","targetTitle":"你会不会做饭？","mongolianTitle":"Чи хоол хийж чадах уу?",
 "subtitle":"包子 · 医生 · 厨师 · 会不会 · 是不是 · «丑小鸭» үлгэр",
 "description":f"Чадах эсэхээ (会不会), хэн болохыг (是不是) асууж сурна. {len(vocab)} үг, 2 зурагт яриа, Mini story «丑小鸭», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🥟","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第5课《你会不会做饭？》 [hskLevel=1] [lessonNumber=5]; эх: сурах бичиг х.23–27; аудио CD 05-01…05-04 (дуу байхгүй)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你会不会做饭？","mongolianTitle":"Чи хоол хийж чадах уу?",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第5课 (сурах бичиг + CD аудио 05-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L5)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
