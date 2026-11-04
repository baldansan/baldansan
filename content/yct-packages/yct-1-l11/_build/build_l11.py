#!/usr/bin/env python3
"""YCT 标准教程 1 · 第11课 你吃什么？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib
OUT = "/home/claude/work/yct1/l11/pkg"
CID, LID, N = "yct-1", "yct-1-l11", 11
os.makedirs(OUT, exist_ok=True)


# ---------------- TEST CROPS (hi-55.png, 150dpi) ----------------
from PIL import Image
_pg = Image.open("/home/claude/work/yct1/l11/pages/hi-55.png").convert("RGB")
os.makedirs(f"{OUT}/images", exist_ok=True)
for _n,_box in {1:(440,327,720,446),2:(440,456,720,576),3:(440,582,720,704),4:(440,712,720,832),
                5:(290,1030,490,1162),6:(740,1032,960,1166),7:(320,1302,450,1436),8:(790,1302,920,1438)}.items():
    _pg.crop(_box).save(f"{OUT}/images/t{_n}.png")

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

# ---------------- VOCAB ----------------
VOCAB = [
 ("米饭","mǐfàn","будаа (чанасан цагаан будаа)","нэр үг","我吃米饭。","Wǒ chī mǐfàn.","Би будаа иднэ.",True),
 ("面条","miàntiáo","гоймон","нэр үг","今天吃面条。","Jīntiān chī miàntiáo.","Өнөөдөр гоймон идье.",True),
 ("苹果","píngguǒ","алим","нэр үг","我吃苹果。","Wǒ chī píngguǒ.","Би алим иднэ.",True),
 ("牛奶","niúnǎi","сүү","нэр үг","我喝牛奶。","Wǒ hē niúnǎi.","Би сүү уна.",True),
 ("水","shuǐ","ус","нэр үг","牛奶和水，你喝哪个？","Niúnǎi hé shuǐ, nǐ hē nǎge?","Сүү, ус хоёроос чи аль нэгийг уух вэ?",True),
 ("吃","chī","идэх","үйл үг","你吃什么？","Nǐ chī shénme?","Чи юу идэх вэ?",True),
 ("喝","hē","уух","үйл үг","我喝牛奶。","Wǒ hē niúnǎi.","Би сүү уна.",True),
 ("爱","ài","дуртай, хайртай","үйл үг","我爱吃蛋糕。","Wǒ ài chī dàngāo.","Би бялуу идэх дуртай.",True),
 ("什么","shénme","юу","асуух үг","你吃什么？","Nǐ chī shénme?","Чи юу идэх вэ?",True),
 ("蛋糕","dàngāo","бялуу (торт)","нэр үг · нэмэлт үг","我爱吃蛋糕。","Wǒ ài chī dàngāo.","Би бялуу идэх дуртай.",False),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 1","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_SONG, AUD_TEST = "audio/yct-1-11-01.mp3","audio/yct-1-11-02.mp3","audio/yct-1-11-03.mp3","audio/yct-1-11-04.mp3","audio/yct-1-11-05.mp3"
AUD_MAIN = "audio/yct-1-11-text-song.mp3"
def tok(s):
    out=[]
    for t in s.split(" "):
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Хоолны газарт","scene_mn":"Ээж охиныхоо хамт хоолны газарт орж, юу идэж уухаа сонгож байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"妈妈","zh":"你吃什么？","pinyin":"Nǐ chī shénme?","mn":"Чи юу идэх вэ?"},
           {"speaker":"小红","zh":"我吃苹果。","pinyin":"Wǒ chī píngguǒ.","mn":"Би алим иднэ."},
           {"speaker":"妈妈","zh":"牛奶和水，你喝哪个？","pinyin":"Niúnǎi hé shuǐ, nǐ hē nǎge?","mn":"Сүү, ус хоёроос чи аль нэгийг уух вэ?"},
           {"speaker":"小红","zh":"我喝牛奶。","pinyin":"Wǒ hē niúnǎi.","mn":"Би сүү уна."}]},
 {"id":2,"title_mn":"Яриа 2 · Аавын төрсөн өдөр","scene_mn":"Гэр бүл ширээний ард сууж, өнөөдөр юу идэхээ ярилцаж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"今天吃什么？","pinyin":"Jīntiān chī shénme?","mn":"Өнөөдөр юу идэх вэ?"},
           {"speaker":"妈妈","zh":"今天是爸爸的生日，吃面条。","pinyin":"Jīntiān shì bàba de shēngrì, chī miàntiáo.","mn":"Өнөөдөр аавын төрсөн өдөр. Гоймон идье."},
           {"speaker":"小明","zh":"我爱吃蛋糕。","pinyin":"Wǒ ài chī dàngāo.","mn":"Би бялуунд дуртай шүү."}]},
]
dlg_lines=[
 (1,"妈妈：你吃什么？","妈妈: Nǐ chī shénme?","Ээж: Чи юу идэх вэ?","妈妈：| 你|nǐ 吃|chī 什么|shénme ？|","你吃什么？ — «Чи юу идэх вэ?» гэж асууна. 什么 = юу.",["你吃什么"]),
 (1,"小红：我吃苹果。","小红: Wǒ chī píngguǒ.","Сяо Хун: Би алим иднэ.","小红：| 我|wǒ 吃|chī 苹果|píngguǒ 。|",None,[]),
 (1,"妈妈：牛奶和水，你喝哪个？","妈妈: Niúnǎi hé shuǐ, nǐ hē nǎge?","Ээж: Сүү, ус хоёроос чи аль нэгийг уух вэ?","妈妈：| 牛奶|niúnǎi 和|hé 水|shuǐ ，| 你|nǐ 喝|hē 哪个|nǎge ？|","哪个 = аль нэг. Хоёр юмнаас сонгуулахдаа асууна.",[]),
 (1,"小红：我喝牛奶。","小红: Wǒ hē niúnǎi.","Сяо Хун: Би сүү уна.","小红：| 我|wǒ 喝|hē 牛奶|niúnǎi 。|",None,[]),
 (2,"小明：今天吃什么？","小明: Jīntiān chī shénme?","Сяо Мин: Өнөөдөр юу идэх вэ?","小明：| 今天|jīntiān 吃|chī 什么|shénme ？|",None,[]),
 (2,"妈妈：今天是爸爸的生日，吃面条。","妈妈: Jīntiān shì bàba de shēngrì, chī miàntiáo.","Ээж: Өнөөдөр аавын төрсөн өдөр. Гоймон идье.","妈妈：| 今天|jīntiān 是|shì 爸爸|bàba 的|de 生日|shēngrì ，| 吃|chī 面条|miàntiáo 。|","生日 = төрсөн өдөр. Хятадад төрсөн өдрөөр урт гоймон иддэг — урт насалдаг гэсэн мөрөөдөл.",[]),
 (2,"小明：我爱吃蛋糕。","小明: Wǒ ài chī dàngāo.","Сяо Мин: Би бялуунд дуртай шүү.","小明：| 我|wǒ 爱|ài 吃|chī 蛋糕|dàngāo 。|","我爱吃蛋糕 — «Би бялуу идэх дуртай». 爱 = дуртай.",["我爱吃蛋糕"]),
]
story_lines=[
 ("你喜欢吃什么？","Nǐ xǐhuan chī shénme?","Чи юу идэх дуртай вэ?","你|nǐ 喜欢|xǐhuan 吃|chī 什么|shénme ？|","喜欢 = дуртай. 爱-тай адил утгатай — «идэх дуртай» гэж хэлэхэд хоёулаа болно.",[]),
 ("我喜欢吃寿司。","Wǒ xǐhuan chī shòusī.","Би суши идэх дуртай.","我|wǒ 喜欢|xǐhuan 吃|chī 寿司|shòusī 。|","寿司 = суши. Японы хоол.",[]),
 ("我喜欢吃比萨。","Wǒ xǐhuan chī bǐsà.","Би пицца идэх дуртай.","我|wǒ 喜欢|xǐhuan 吃|chī 比萨|bǐsà 。|","比萨 = пицца. Итали хоол.",[]),
 ("我们爱喝冰水。","Wǒmen ài hē bīngshuǐ.","Бид мөстэй ус уух дуртай.","我们|wǒmen 爱|ài 喝|hē 冰水|bīngshuǐ 。|","冰水 = мөстэй хүйтэн ус.",[]),
 ("我们爱喝热水。","Wǒmen ài hē rèshuǐ.","Бид халуун ус уух дуртай.","我们|wǒmen 爱|ài 喝|hē 热水|rèshuǐ 。|","热水 = халуун ус. Хятадууд халуун ус их уудаг!",[]),
]
chant_lines=[
 ("熊猫爱吃竹子，","Xióngmāo ài chī zhúzi,","Панда хулс идэх дуртай,","熊猫|xióngmāo 爱|ài 吃|chī 竹子|zhúzi ，|"),
 ("猴子爱吃香蕉。","hóuzi ài chī xiāngjiāo.","сармагчин гадил жимс идэх дуртай.","猴子|hóuzi 爱|ài 吃|chī 香蕉|xiāngjiāo 。|"),
 ("你爱吃什么？","Nǐ ài chī shénme?","Чи юу идэх дуртай вэ?","你|nǐ 爱|ài 吃|chī 什么|shénme ？|"),
 ("我爱吃苹果，果果果果果。","Wǒ ài chī píngguǒ, guǒ guǒ guǒ guǒ guǒ.","Би алим идэх дуртай, гуо гуо гуо гуо гуо!","我|wǒ 爱|ài 吃|chī 苹果|píngguǒ ，| 果|guǒ 果|guǒ 果|guǒ 果|guǒ 果|guǒ 。|"),
]
sentences=[]
for para,zh,py,mn,tk,note,ks in dlg_lines:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note; s["key_structures"]=ks
    sentences.append(s)
for i,(zh,py,mn,tk,note,ks) in enumerate(story_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if note: s["note"]=note
    sentences.append(s)
for i,(zh,py,mn,tk) in enumerate(chant_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==3: s["note"]="Энд 苹果-г өөрийн дуртай хоолоор соль! Жишээ нь «我爱吃面条，条条条条条»."
    sentences.append(s)

texts = {
 "unit":{"number":"11","title":"你吃什么？","mongolianTitle":"Чи юу идэх вэ? — идэх, уух, дуртай хоол"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи өнөөдөр юу идсэн бэ? Будаа уу, гоймон уу, бялуу юу? Өнөөдөр бид «Чи юу идэх вэ?» гэж хятадаар асууж сурна: 你吃什么？ Хариуд нь «Би бялуу идэх дуртай» гэж хэлнэ: 我爱吃蛋糕。 Алим, сүү, ус гэсэн амттай үгсийг ч сурна. Панда, сармагчин хоёр юу идэх дуртай вэ? Дуунаас мэдээрэй! Эхэлцгээе!",
  "warmup_mn":"Чи юу идэх хамгийн их дуртай вэ? Юу уух дуртай вэ? Гараараа идэж уусан дүр үзүүлээд, найз чинь таагаарай!",
  "theme_zh":"吃什么 · 喝什么 · 爱吃","theme_mn":"Юу идэх, юу уух · Дуртай хоол"},
 "warmup":{"mongolian":"Чи юу идэх хамгийн их дуртай вэ? Юу уух дуртай вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"11","title":"你吃什么？","mongolianTitle":"Чи юу идэх вэ? — яриа, жижиг түүх, дуу","title_mn":"Let's read · 2 яриа + Mini story + Let's chant · 你爱吃什么？","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第11课 Let's read / Mini story / Let's chant（CD 11-02, 11-03, 11-04）","author_zh":"",
  "intro_zh":"两段对话、一个小故事和一首儿歌：你吃什么？我爱吃苹果！",
  "intro_mn":"Эхлээд хоёр яриа: хоолны газарт ээж, охин юу идэж уухаа сонгоно. Дараа нь аавын төрсөн өдрөөр гэр бүл юу идэхээ ярина. Дараа нь жижиг түүх: дэлхийн хүүхдүүд юу идэх дуртай вэ? Эцэст нь «你爱吃什么？» дуу. Аудиог сонсоод, чанга хамт хэлээрэй, идэж уух дүр үзүүлээрэй!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хоолны газарт ээж «你吃什么？» гэж асууна. Охин алим, сүү сонгоно."},
   {"paragraph":2,"mn":"Яриа 2 — Өнөөдөр аавын төрсөн өдөр тул гоймон иднэ. Хүү бялуунд дуртай гэж хэлнэ."},
   {"paragraph":3,"mn":"Mini story — Дөрвөн зураг: Японд суши, Италид пицца, Америкт мөстэй ус, Хятадад халуун ус. Хүүхдүүд юу идэж уух дуртайгаа хэлнэ."},
   {"paragraph":4,"mn":"Дуу — Панда хулс, сармагчин гадил, хүү алим идэх дуртай. «Чи юу идэх дуртай вэ?» гэж асуугаад 苹果-г өөрийн дуртай хоолоор соль."}],
  "reflection":{"questions_mn":["Хятадаар «Чи юу идэх вэ?» гэж яаж асуух вэ?","Чи юу идэх дуртай вэ? Хятадаар «Би … идэх дуртай» гэж хэлээд үз.","Сүү, ус хоёроос аль нэгийг нь сонгоход юу гэж асуух вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Найзаасаа асуу","zh":"你吃什么？我爱吃蛋糕。","pinyin":"Nǐ chī shénme? Wǒ ài chī dàngāo.","mn":"Чи юу идэх вэ? Би бялуу идэх дуртай."},
  "writingPrompt_mn":"Найз, ах эгчээсээ «你吃什么？» гэж асуу. Хариултыг нь «他/她爱吃…» гэж бусдад хэл. Идэж буй дүр үзүүлбэл бүр хөгжилтэй!"},
 "properNouns":[],
 "wordExplanation":[
  {"word":"吃","gloss":"chī — идэх","explanation":"吃 бол «идэх». Хоолоо хэлж болно: 吃苹果 (алим идэх), 吃面条 (гоймон идэх). Хэлэхдээ «ч» гэхээсээ хэлээ арай хойш нь татаж «chī» гэж хэл. Хоол идэх дүр үзүүлээд хэлбэл амархан цээжлэгдэнэ!",
   "structure":"我吃 + хоол · 你吃什么？","teacher_notes":"chī-г хүүхдүүд «си» гэж хэлдэг — хэлээ хойш нь буруулж ch дууг гаргуулна.",
   "examples":[{"chinese":"我吃苹果。","pinyin":"Wǒ chī píngguǒ.","mongolian":"Би алим иднэ."},{"chinese":"吃面条。","pinyin":"Chī miàntiáo.","mongolian":"Гоймон идье."},{"chinese":"你吃什么？","pinyin":"Nǐ chī shénme?","mongolian":"Чи юу идэх вэ?"}],
   "common_mistakes":[{"wrong":"我吃牛奶。","right":"我喝牛奶。","why":"Сүү, ус зэргийг уудаг тул 喝 хэрэглэнэ. 吃 нь идэх зүйлд."}],
   "check":{"question":"«Алим идэх» хятадаар?","options":["吃苹果","喝苹果","爱苹果"],"answer":"0"},
   "practice":[{"n":1,"question":"我________米饭。(идэх)","answer":"吃","explanation_mn":"Будаа идэх зүйл тул 吃."}]},
  {"word":"喝","gloss":"hē — уух","explanation":"喝 бол «уух». Сүү, ус зэргийг уудаг тул 喝牛奶 (сүү уух), 喝水 (ус уух) гэнэ. Хуруугаараа аяга барьж ууж байгаа дүр үзүүлээд хэлээрэй!",
   "structure":"我喝 + ундаа","teacher_notes":"吃 ба 喝 хоёрыг андуурдаг — идэх зүйл / уух зүйл гэж ялгуул.",
   "examples":[{"chinese":"我喝牛奶。","pinyin":"Wǒ hē niúnǎi.","mongolian":"Би сүү уна."},{"chinese":"你喝哪个？","pinyin":"Nǐ hē nǎge?","mongolian":"Чи аль нэгийг нь уух вэ?"},{"chinese":"我们爱喝冰水。","pinyin":"Wǒmen ài hē bīngshuǐ.","mongolian":"Бид мөстэй ус уух дуртай."}],
   "common_mistakes":[{"wrong":"我喝面条。","right":"我吃面条。","why":"Гоймон идэх юм тул 吃."}],
   "check":{"question":"«Ус уух» хятадаар?","options":["喝水","吃水","爱水"],"answer":"0"},
   "practice":[{"n":1,"question":"我________牛奶。(уух)","answer":"喝","explanation_mn":"Сүү уух юм тул 喝."}]},
  {"word":"爱","gloss":"ài — дуртай","explanation":"爱 + 吃/喝 нь «идэх, уух дуртай» гэсэн утгатай. 我爱吃蛋糕 — «Би бялуунд дуртай». Хамгийн дуртай хоолоо хэлэхдээ 爱 гэж хэлнэ. Зүрхээ барьж «ài» гэж хэлээрэй!",
   "structure":"我爱吃 + хоол · 我爱喝 + ундаа","teacher_notes":"爱-ийн дараа 吃/喝 ордог: 爱吃, 爱喝.",
   "examples":[{"chinese":"我爱吃蛋糕。","pinyin":"Wǒ ài chī dàngāo.","mongolian":"Би бялуу идэх дуртай."},{"chinese":"熊猫爱吃竹子。","pinyin":"Xióngmāo ài chī zhúzi.","mongolian":"Панда хулс идэх дуртай."},{"chinese":"你爱喝牛奶吗？","pinyin":"Nǐ ài hē niúnǎi ma?","mongolian":"Чи сүү уух дуртай юу?"}],
   "common_mistakes":[{"wrong":"我吃爱蛋糕。","right":"我爱吃蛋糕。","why":"爱 эхэнд, 吃 дараа нь."}],
   "check":{"question":"«Би бялуу идэх дуртай» хятадаар?","options":["我爱吃蛋糕","我吃爱蛋糕","蛋糕爱吃我"],"answer":"0"},
   "practice":[{"n":1,"question":"我________喝牛奶。(дуртай)","answer":"爱","explanation_mn":"Дуртай = 爱."}]},
 ],
 "collocations":[{"type":"吃 / 喝 / 爱 — юуг хэлэх","rows":[
   {"head":"吃","with":"苹果 / 面条 / 米饭 / 蛋糕","mn":"алим / гоймон / будаа / бялуу идэх","usage_mn":"Идэх зүйл","example":{"zh":"我吃苹果。","pinyin":"Wǒ chī píngguǒ.","mn":"Би алим иднэ."}},
   {"head":"喝","with":"牛奶 / 水","mn":"сүү / ус уух","usage_mn":"Уух зүйл","example":{"zh":"我喝牛奶。","pinyin":"Wǒ hē niúnǎi.","mn":"Би сүү уна."}},
   {"head":"爱","with":"吃 / 喝","mn":"идэх / уух дуртай","usage_mn":"Дуртай зүйлээ хэлэхэд","example":{"zh":"我爱吃蛋糕。","pinyin":"Wǒ ài chī dàngāo.","mn":"Би бялуу идэх дуртай."}}]}],
 "wordComparison":[{"words":["吃","喝"],"mn":"吃 = идэх (хатуу хоол), 喝 = уух (ундаа)."}],
 "textExercises":{
  "selectWord":{"instruction_mn":"Let's match — асуулт бүрт тохирох хариултыг ол.","banks":[{"words":["我爱喝牛奶。","她喜欢吃面条。","我不吃苹果。"],"items":[
     {"n":1,"question":"你爱喝什么？→ ________","answer":"我爱喝牛奶。","explanation_mn":"«Чи юу уух дуртай вэ?» — «Би сүү уух дуртай»."},
     {"n":2,"question":"你妈妈喜欢吃什么？→ ________","answer":"她喜欢吃面条。","explanation_mn":"«Ээж чинь юу идэх дуртай вэ?» — «Тэр гоймонд дуртай». 她 = тэр (эмэгтэй)."},
     {"n":3,"question":"你吃苹果吗？→ ________","answer":"我不吃苹果。","explanation_mn":"«Чи алим идэх үү?» — «Үгүй, би алим идэхгүй». 不 = үгүй."}]}],
   "answer_source":"textbook (Let's match, х.51 — утгаар нь тааруулав)"},
  "comprehension":{"instruction_mn":"Let's read — яриаг сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"她喝什么？","answer":"牛奶。","explanation_mn":"Охин «我喝牛奶» гэсэн."},
     {"n":2,"question_zh":"他爱吃什么？","answer":"蛋糕。","explanation_mn":"Хүү «我爱吃蛋糕» гэсэн."}],
   "answer_source":"textbook_verified"},
  "retell":{"instruction_mn":"Let's play — Хоолны тоглоом.","prompts":[
     {"label":"Найзаасаа асуу","start_zh":"你爱吃什么？……","hint_mn":"Найз, гэрийнхнээсээ «你爱吃什么？» гэж асуугаад хариултыг нь сонс. Дараа нь «他爱吃… / 她爱吃…» гэж бусдад хэл."},
     {"label":"Дүр үзүүл","start_zh":"我吃…… 我喝……","hint_mn":"Нэг нь идэж уух дүр үзүүлнэ, нөгөө нь «你吃面条！» «你喝水！» гэж таана."},
     {"label":"Дууны үгийг соль","start_zh":"我爱吃……，果果果果果。","hint_mn":"Дууны 苹果-ыг өөрийн дуртай хоолоор соль. Жишээ: 我爱吃蛋糕！"}]}},
 "grammarNotes":[],
 "culture":{"title":"中国的生日面条","title_mn":"Хятадын төрсөн өдрийн гоймон","text_mn":"Хятад хүүхдүүд төрсөн өдөр дээрээ урт гоймон иддэг! Гоймон урт байх тусам хүн урт насалдаг гэж үздэг тул хазаж таслалгүй, нэг амьсгаагаар сорж иднэ. Манайд төрсөн өдөр бялуу, чихэр иддэг шиг тэнд урт гоймон иддэг. Мөн Хятадад хүүхдүүд хүйтэн ус биш халуун ус уух дуртай — биед сайн гэж ээж аав нь хэлдэг.","note_mn":"Номын 50-р хуудасны зураг дээр гэр бүл аавын төрсөн өдөр гоймон идэж байна."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — юу идэх, юу уух, дуртай хоол.","topic":"Дуртай хоолоо хятадаар хэлье!","discussion":["Хосоороо: нэг нь «你吃什么？» гэж асууна, нөгөө нь «我爱吃…» гэж хариулна. Дараа нь солино.","Бүгдээрээ: дуртай хоолоо дүр үзүүлээд, бусад нь хятадаар таа."],
   "writing":{"promptChinese":"你吃什么？我爱吃……","promptMongolian":"Гэрийн даалгавар: ээж, аав, ах эгч гурваас «你爱吃什么？» гэж асуугаад хариултыг нь цээжил. Маргааш ангидаа хэл.","minChars":"0","requiredWords":["吃","爱"],"sampleChinese":"妈妈爱吃面条。","sampleMongolian":"Ээж гоймонд дуртай.","gradingRubric":"Зөв хэлсэн, 吃/喝-г зөв сонгосон эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers (х.63): L11 1✓ 2✗ 3✗ 4✓ 5B 6D 7C 8A","parts":[]},
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
 {"point":"你吃什么？ — юу идэх вэ?","gloss_mn":"«Чи юу идэх вэ?» — идэх зүйлийг асуух",
  "structure":"你吃什么？  ·  你喝什么？  ·  我吃 / 喝 + зүйл",
  "teacher_mn":"Найзаасаа юу идэхийг асуухдаа «你吃什么？» гэнэ. 什么 гэдэг нь «юу». Хариулахдаа асуусан газарт нь хоолоо тавина: «我吃苹果。» Уух зүйл асуухдаа 吃-ийн оронд 喝 гэнэ: «你喝什么？» Гараараа идэж уух дүр үзүүлээд хэлээрэй!",
  "teacher_notes":"Хятад хэлэнд асуух үг (什么) хариулт орох газартаа л байдаг: 你吃什么？ → 我吃苹果。 Хүүхдэд «үгийн дараалал» гэж тайлбарлахгүй, хоёр өгүүлбэрийг зэрэгцүүлж давтуул.",
  "examples":[ex("你吃什么？","Nǐ chī shénme?","Чи юу идэх вэ?"),ex("我吃苹果。","Wǒ chī píngguǒ.","Би алим иднэ."),ex("今天吃什么？","Jīntiān chī shénme?","Өнөөдөр юу идэх вэ?"),ex("你喝什么？ 水，谢谢。","Nǐ hē shénme? Shuǐ, xièxie.","Чи юу уух вэ? Ус, баярлалаа.")],
  "common_mistakes":[{"wrong":"你什么吃？","right":"你吃什么？","why":"什么 нь 吃-ийн ард орно."},{"wrong":"你吃什么？ — «我喝水。»","right":"你喝什么？ — «我喝水。»","why":"Уух зүйлийн асуултад 喝 хэрэглэнэ."}],
  "check":chk("Найзаасаа «Чи юу идэх вэ?» гэж асуу.",["你吃什么？","我吃什么？","你吃苹果！"],"你吃什么？","g1c"),
  "exercises":[
   choice("你吃什么？ — 我________苹果。",["吃","喝","爱"],"吃","Зөв! Алим идэх юм тул 吃.","Алим уудаггүй, идэг — 吃.","g1e1"),
   judge("«什么» гэдэг нь «юу» гэсэн үг.",True,"Зөв!","什么 = юу."),
   choice("«Ус уух» хятадаар ________",["喝水","吃水","爱水"],"喝水","Зөв! Уух = 喝.","Ус уудаг — 喝.","g1e3")]},
 {"point":"我爱吃蛋糕。 — дуртай хоол","gloss_mn":"«Би бялуу идэх дуртай» — дуртай хоолоо хэлэх",
  "structure":"我爱吃 + хоол  ·  我爱喝 + ундаа",
  "teacher_mn":"Хамгийн дуртай хоолоо хэлэхдээ 吃-ийн өмнө 爱 гэж нэмнэ. «Би бялуу идэх дуртай» — 我爱吃蛋糕。 Уух зүйлд мөн адил: 我爱喝牛奶。 Дууны панда хулс идэх дуртай — 熊猫爱吃竹子。 Чи юу идэх дуртай вэ? Хэлээд үзээрэй!",
  "teacher_notes":"爱 + 吃/喝. «不» нэмбэл: 我不爱吃… (дуртай биш). Энэ хичээлд «我不吃苹果» гэсэн хэлбэр л гарна.",
  "examples":[ex("我爱吃蛋糕。","Wǒ ài chī dàngāo.","Би бялуу идэх дуртай."),ex("熊猫爱吃竹子。","Xióngmāo ài chī zhúzi.","Панда хулс идэх дуртай."),ex("我们爱喝冰水。","Wǒmen ài hē bīngshuǐ.","Бид мөстэй ус уух дуртай."),ex("我爱喝牛奶。","Wǒ ài hē niúnǎi.","Би сүү уух дуртай.")],
  "common_mistakes":[{"wrong":"我吃爱蛋糕。","right":"我爱吃蛋糕。","why":"爱 нь 吃-ийн өмнө."}],
  "check":chk("«Би сүү уух дуртай» хятадаар?",["我爱喝牛奶。","我爱吃牛奶。","我喝爱牛奶。"],"我爱喝牛奶。","g2c"),
  "exercises":[
   choice("我________吃蛋糕。(дуртай)",["爱","喝","水"],"爱","Зөв! 爱 = дуртай.","爱 = дуртай, 喝 = уух.","g2e1"),
   judge("«我爱吃蛋糕» гэдэг нь «Би бялуу идэх дуртай» гэсэн үг.",True,"Зөв!","爱 = дуртай, 吃 = идэх, 蛋糕 = бялуу."),
   choice("«Би будаа идэх дуртай» хятадаар?",["我爱吃米饭。","我爱喝米饭。","我吃爱米饭。"],"我爱吃米饭。","Зөв!","Будаа идэх юм — 吃. 爱 нь 吃-ийн өмнө.","g2e3")]},
 {"point":"吃 ба 喝 — идэх, уух","gloss_mn":"Идэх зүйлд 吃, уух зүйлд 喝",
  "structure":"吃 + хоол (苹果, 面条, 米饭, 蛋糕)  ·  喝 + ундаа (牛奶, 水)",
  "teacher_mn":"Хоол идэхдээ 吃 гэнэ: 吃苹果, 吃面条, 吃米饭. Сүү, ус уухдаа 喝 гэнэ: 喝牛奶, 喝水. «Сүү, ус хоёроос аль нэгийг нь уух вэ?» гэж асуухдаа «牛奶和水，你喝哪个？» гэнэ. Хариуд нь «我喝牛奶。» Эсвэл «不» гэж хэлж болно: «我不吃苹果» — би алим идэхгүй.",
  "teacher_notes":"和 = «ба/болон». 哪个 = «аль нэг». 不 + үйл үг = «үгүй, … -гүй» (2-р хичээлээс).",
  "examples":[ex("我喝牛奶。","Wǒ hē niúnǎi.","Би сүү уна."),ex("牛奶和水，你喝哪个？","Niúnǎi hé shuǐ, nǐ hē nǎge?","Сүү, ус хоёроос чи аль нэгийг уух вэ?"),ex("今天是爸爸的生日，吃面条。","Jīntiān shì bàba de shēngrì, chī miàntiáo.","Өнөөдөр аавын төрсөн өдөр, гоймон идье."),ex("我不吃苹果。","Wǒ bù chī píngguǒ.","Би алим идэхгүй.")],
  "common_mistakes":[{"wrong":"我喝面条。","right":"我吃面条。","why":"Гоймон идэх юм."},{"wrong":"我吃水。","right":"我喝水。","why":"Ус уудаг."}],
  "check":chk("«Сүү уух» хятадаар?",["喝牛奶","吃牛奶","爱牛奶"],"喝牛奶","g3c"),
  "exercises":[
   choice("我________面条。",["吃","喝","什么"],"吃","Зөв! Гоймон идэх юм.","Гоймон идэх юм — 吃.","g3e1"),
   choice("我________水。",["喝","吃","什么"],"喝","Зөв! Ус уух юм.","Ус уух юм — 喝.","g3e2"),
   judge("«我喝苹果» гэж хэлж болно.",False,"Зөв — алим идэх юм, 我吃苹果.","喝 нь ундаанд. Алим идэх юм."),
   choice("«Би алим идэхгүй» хятадаар?",["我不吃苹果。","我吃不苹果。","我不喝苹果。"],"我不吃苹果。","Зөв! 不 + 吃.","不 нь 吃-ийн өмнө.","g3e4")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Будаа» хятадаар аль нь вэ?",["米饭","面条","苹果","牛奶"],"米饭","米饭 (mǐfàn) = будаа.","easy",["vocabulary"],"a1")
q("choice","«Гоймон» хятадаар аль нь вэ?",["面条","米饭","蛋糕","水"],"面条","面条 (miàntiáo) = гоймон.","easy",["vocabulary"],"a2")
q("choice","«Алим» хятадаар аль нь вэ?",["苹果","蛋糕","牛奶","米饭"],"苹果","苹果 (píngguǒ) = алим.","easy",["vocabulary"],"a3")
q("choice","«Сүү» хятадаар аль нь вэ?",["牛奶","水","面条","苹果"],"牛奶","牛奶 (niúnǎi) = сүү.","easy",["vocabulary"],"a4")
q("choice","«Ус» хятадаар аль нь вэ?",["水","牛奶","米饭","蛋糕"],"水","水 (shuǐ) = ус.","easy",["vocabulary"],"a5")
q("choice","«Бялуу» хятадаар аль нь вэ?",["蛋糕","面条","水","苹果"],"蛋糕","蛋糕 (dàngāo) = бялуу.","easy",["vocabulary"],"a6")
q("choice","«吃» гэж юу вэ?",["идэх","уух","дуртай","юу"],"идэх","吃 (chī) = идэх.","easy",["vocabulary"],"a7")
q("choice","«喝» гэж юу вэ?",["уух","идэх","дуртай","ус"],"уух","喝 (hē) = уух.","easy",["vocabulary"],"a8")
q("choice","«爱» гэж юу вэ?",["дуртай","идэх","уух","чи"],"дуртай","爱 (ài) = дуртай.","easy",["vocabulary"],"a9")
q("choice","«什么» гэж юу вэ?",["юу","хэн","аль","сайн"],"юу","什么 (shénme) = юу.","easy",["vocabulary"],"a10")
q("choice","Хичээлийн түлхүүр өгүүлбэр «Чи юу идэх вэ?» хятадаар:",["你吃什么？","你喝什么？","我吃什么？","你爱吃吗？"],"你吃什么？","吃 = идэх, 什么 = юу.","easy",["sentence"],"a11")
q("choice","«Би бялуу идэх дуртай» хятадаар:",["我爱吃蛋糕。","我吃爱蛋糕。","我爱喝蛋糕。","你爱吃蛋糕。"],"我爱吃蛋糕。","爱 + 吃 + хоол.","easy",["sentence"],"a12")
q("cloze","我（ ）牛奶。(уух)",["喝","吃","爱","水"],"喝","Сүү уух юм — 喝.","easy",["usage"],"a13")
q("cloze","我（ ）面条。(идэх)",["吃","喝","什么","水"],"吃","Гоймон идэх юм — 吃.","easy",["usage"],"a14")
q("cloze","你吃（ ）？",["什么","水","爱","喝"],"什么","«Чи юу идэх вэ?» — 什么 = юу.","easy",["usage"],"a15")
q("cloze","熊猫（ ）吃竹子。(дуртай)",["爱","喝","水","吃"],"爱","Панда хулс идэх дуртай — 爱.","medium",["dialogue"],"a16")
q("choice","Ээж «你吃什么？» гэж асуулаа. Охин юу гэж хариулав (яриа 1)?",["我吃苹果。","我吃面条。","我喝水。","我爱蛋糕。"],"我吃苹果。","Яриа 1: 我吃苹果。","easy",["dialogue"],"a17")
q("choice","«牛奶和水，你喝哪个？» — охин юу уусан бэ?",["牛奶","水","面条","苹果"],"牛奶","Охин «我喝牛奶» гэсэн.","easy",["dialogue"],"a18")
q("choice","Аавын төрсөн өдөр гэр бүл юу идэв (яриа 2)?",["面条","米饭","苹果","水"],"面条","今天是爸爸的生日，吃面条。","medium",["dialogue"],"a19")
q("choice","Хүү юу идэх дуртай вэ (яриа 2)?",["蛋糕","面条","米饭","牛奶"],"蛋糕","我爱吃蛋糕。","medium",["dialogue"],"a20")
q("choice","Пиньинь «niúnǎi» гэж уншдаг үг:",["牛奶","面条","苹果","蛋糕"],"牛奶","牛奶 = niúnǎi = сүү.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «miàntiáo» гэж уншдаг үг:",["面条","米饭","苹果","水"],"面条","面条 = miàntiáo = гоймон.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «píngguǒ» гэж уншдаг үг:",["苹果","蛋糕","牛奶","面条"],"苹果","苹果 = píngguǒ = алим.","easy",["pronunciation"],"a23")
q("usage","Аль нь уух зүйл вэ? (喝-тэй хэрэглэнэ)",["牛奶","面条","苹果","米饭"],"牛奶","Сүү уудаг тул 喝牛奶. Бусад нь идэх хоол.","medium",["usage"],"a24")
q("usage","Аль нь идэх зүйл вэ? (吃-тэй хэрэглэнэ)",["蛋糕","水","牛奶","爱"],"蛋糕","蛋糕 идэх юм. 水, 牛奶 уух юм.","medium",["usage"],"a25")
q("choice","«Би алим идэхгүй» хятадаар:",["我不吃苹果。","我吃不苹果。","我不喝苹果。","我爱吃苹果。"],"我不吃苹果。","不 + 吃 = идэхгүй.","medium",["sentence"],"a26")
q("choice","Үгсийг зөв дарааллаар нь байрлуулж өгүүлбэр болго: 我 / 爱 / 吃 / 面条",["我爱吃面条","我吃爱面条","爱我吃面条","面条爱我吃"],"我爱吃面条","Би + дуртай + идэх + гоймон.","medium",["sentence"],"a27")
q("choice","Өмнөх хичээл: «Чи хэдэн настай вэ?» хятадаар:",["你几岁？","你吃什么？","你去哪儿？","你好吗？"],"你几岁？","几岁 = хэдэн настай. 你吃什么 = чи юу идэх вэ.","medium",["review"],"a28")
dump("quiz.json", Q)

# ---------------- WORKBOOK (Test) ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (11-05) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）他爱吃米饭。","image":img("t1"),"answer":"✓","script_zh":"他爱吃米饭。","explanation_mn":"«Тэр будаа идэх дуртай» гэсэн. Зураг дээр будаатай аяга байна → ✓."},
    {"n":2,"question_zh":"（听录音）牛奶在这儿，你喝吗？","image":img("t2"),"answer":"✗","script_zh":"牛奶在这儿，你喝吗？","explanation_mn":"Аудио «сүү энд байна» гэж байна. Харин зураг дээр эмэгтэй усны шил барьж байна, сүү биш → ✗."},
    {"n":3,"question_zh":"（听录音）她不爱吃这个。","image":img("t3"),"answer":"✗","script_zh":"她不爱吃这个。","explanation_mn":"«Тэр үүнийг идэх дургүй» гэсэн. Гэтэл зураг дээр охин шоколад идэж, баяртай байна → ✗."},
    {"n":4,"question_zh":"（听录音）这是谁的苹果？","image":img("t4"),"answer":"✓","script_zh":"这是谁的苹果？","explanation_mn":"«Энэ хэний алим вэ?» — зураг дээр сагс дүүрэн алим байна → ✓."}],
   "answer_source":"Test Answers х.63: 1✓ 2✗ 3✗ 4✓; Listening script х.61"},
  {"part":2,"type":"choice","instruction_mn":"Унших — А-аас D-ийн дундаас таарах үгийг сонго: A 牛奶, B 谁, C 谢谢, D 什么.","items":[
    {"n":5,"question_zh":"A：（ ）吃米饭？ B：我吃米饭。","image":img("t5"),"options":["A 牛奶","B 谁","C 谢谢","D 什么"],"answer":"B","explanation_mn":"«Хэн будаа идэх вэ?» — «Би будаа иднэ». Хариулт нь хүн (би) тул 谁 (хэн). 什么 биш — юу гэж асууж байгаа биш."},
    {"n":6,"question_zh":"A：她们爱吃（ ）？ B：面条。","image":img("t6"),"options":["A 牛奶","B 谁","C 谢谢","D 什么"],"answer":"D","explanation_mn":"«Тэд юу идэх дуртай вэ?» — «Гоймон». Зураг дээр гурван охин гоймон идэж байна. Юу гэж асууж байгаа тул 什么."},
    {"n":7,"question_zh":"A：你喝什么？ B：水，（ ）。","image":img("t7"),"options":["A 牛奶","B 谁","C 谢谢","D 什么"],"answer":"C","explanation_mn":"«Чи юу уух вэ?» — «Ус, баярлалаа». Зураг дээр усны сав байна. Ус авахдаа 谢谢 (баярлалаа) гэнэ."},
    {"n":8,"question_zh":"A：你爱喝（ ）吗？ B：爱喝。","image":img("t8"),"options":["A 牛奶","B 谁","C 谢谢","D 什么"],"answer":"A","explanation_mn":"«Чи сүү уух дуртай юу?» — «Дуртай». Зураг дээр хүү сүүтэй шил барьж байна → 牛奶."}],
   "answer_source":"Test Answers х.63: 5B 6D 7C 8A"},
  {"part":3,"type":"match","instruction_mn":"Let's match — асуулт ба хариултыг холбо.","items":[
    {"n":1,"question_zh":"你爱喝什么？","answer":"我爱喝牛奶。","explanation_mn":"«Юу уух дуртай вэ?» — «Сүү уух дуртай»."},
    {"n":2,"question_zh":"你妈妈喜欢吃什么？","answer":"她喜欢吃面条。","explanation_mn":"«Ээж юу идэх дуртай вэ?» — «Гоймонд дуртай»."},
    {"n":3,"question_zh":"你吃苹果吗？","answer":"我不吃苹果。","explanation_mn":"«Алим идэх үү?» — «Үгүй, идэхгүй»."}],
   "answer_source":"textbook х.51"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханз бичих — 水 гэсэн ханзыг сайн харж, агаарт хуруугаараа 4 удаа зур.","question_zh":"水","answer":"水","explanation_mn":"水 — усны урсгал шиг дунд нь босоо шугамтай."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа асуу: чи юу идэх вэ?","question_zh":"你吃什么？","answer":"我吃……","explanation_mn":"Хоолоо нэрлэж хариул."},
   {"n":2,"prompt_mn":"Дуртай хоолоо хэл.","question_zh":"我爱吃……","answer":"我爱吃蛋糕。","explanation_mn":"爱吃 + хоол."},
   {"n":3,"prompt_mn":"«你爱吃什么？» дууг дуул, 苹果-ыг өөрийн хоолоор соль.","question_zh":"熊猫爱吃竹子……","answer":"(нээлттэй)","explanation_mn":"Аудио 11-04-тэй хамт."}]},
 "answerSource":"YCT 标准教程 1 · х.61 Test Listening Scripts, х.63 Test Answers (Lesson 11)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDS=[("mifan","米饭"),("miantiao","面条"),("pingguo","苹果"),("niunai","牛奶"),("shui","水"),("chi","吃"),("he","喝"),("ai","爱"),("shenme","什么"),("dangao","蛋糕")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"你吃什么？ — Чи юу идэх вэ?","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你吃什么？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"今天吃什么？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"你爱吃什么？","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"Mini story · 你喜欢吃什么？","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in range(1,9)]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 11-р хичээл — Чи юу идэх вэ?","chineseTitle":"你吃什么？","targetTitle":"你吃什么？","mongolianTitle":"Чи юу идэх вэ?",
 "subtitle":"你吃什么？ · 我爱吃蛋糕 · 吃 · 喝 · 爱 · хоол ундаа · дуу",
 "description":"Юу идэх, юу уухаа асуух (你吃什么？), дуртай хоолоо хэлэх (我爱吃蛋糕). 10 үг, 2 зурагт яриа, жижиг түүх, 1 дуу, 3 дүрэм, 28 шалгалтын асуулт, номын тест (сонсох 4 + унших 4) — албан аудио, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🍎","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "sourceNote":"YCT 标准教程 1 — 第11课《你吃什么？》 [hskLevel=1] [lessonNumber=11]; аудио CD 11-01…11-05"
}
lesson["hook"]={"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你吃什么？","mongolianTitle":"Чи юу идэх вэ?",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第11课 (сурах бичиг + CD аудио 11-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"story":AUD_STORY,"words":AUD_WORDS,"song":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers х.63)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
