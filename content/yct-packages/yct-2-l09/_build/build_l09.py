#!/usr/bin/env python3
"""YCT 标准教程 2 · 第9课 你今天做什么了？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, subprocess
OUT = "/home/claude/work/yct2/l09/pkg"
CID, LID, N = "yct-2", "yct-2-l09", 9
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

# Тестийн зураг (hi-48.png = х.47) + story (hi-47.png = х.46)
from PIL import Image
_pg = Image.open("/home/claude/work/yct2/l09/pages/hi-48.png").convert("RGB")
_BOX = {"t1":(375,312,603,447),"t2":(399,480,573,630),"t3":(432,657,525,810),"t4":(384,834,609,987)}
for _k,_b in _BOX.items():
    _c = _pg.crop(_b); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct2/l09/pages/hi-47.png").convert("RGB").crop((170,270,1220,1530)).save(f"{OUT}/images/story.png")

# audio: яриа (09-02) + дуу (09-04) нийлүүлэх
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_LISTEN, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-2-09-0{i}.mp3" for i in (1,2,3,4,5,6)]
AUD_MAIN = "audio/yct-2-09-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-2-09-02.mp3'\nfile '{A}/yct-2-09-04.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("香蕉","xiāngjiāo","гадил жимс (банана)","нэр үг · гол үг","我吃了一个香蕉。","Wǒ chī le yí ge xiāngjiāo.","Би нэг гадил жимс идлээ.",True),
 ("熊猫","xióngmāo","панда","нэр үг · гол үг","这只熊猫真漂亮！","Zhè zhī xióngmāo zhēn piàoliang!","Энэ панда үнэхээр сайхан юм!",True),
 ("水果","shuǐguǒ","жимс","нэр үг · нэмэлт үг","你今天吃水果了吗？","Nǐ jīntiān chī shuǐguǒ le ma?","Чи өнөөдөр жимс идсэн үү?",False),
 ("了","le","«…лаа, …сан» — хийж дууссан үйлийг хэлдэг үг","туслах үг · гол үг","我吃了。","Wǒ chī le.","Би идсэн.",True),
 ("画","huà","зурах; зураг","үйл үг · гол үг","我画画儿了。","Wǒ huà huàr le.","Би зураг зурлаа.",True),
 ("没（有）","méi(yǒu)","…гүй, хийгээгүй","дайвар үг · гол үг","我没吃香蕉。","Wǒ méi chī xiāngjiāo.","Би гадил жимс идээгүй.",True),
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
 {"id":1,"title_mn":"Яриа 1 · Ээж охиноосоо асууж байна","scene_mn":"Охин сургуулиас ирлээ. Ээж нь өнөөдөр жимс идсэн эсэхийг, ямар жимс идсэнийг нь асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"妈妈","zh":"你今天吃水果了吗？","pinyin":"Nǐ jīntiān chī shuǐguǒ le ma?","mn":"Чи өнөөдөр жимс идсэн үү?"},
           {"speaker":"小红","zh":"吃了。","pinyin":"Chī le.","mn":"Идсэн."},
           {"speaker":"妈妈","zh":"吃了什么水果？","pinyin":"Chī le shénme shuǐguǒ?","mn":"Ямар жимс идсэн бэ?"},
           {"speaker":"小红","zh":"吃了一个苹果和一个香蕉。","pinyin":"Chī le yí ge píngguǒ hé yí ge xiāngjiāo.","mn":"Нэг алим, нэг гадил жимс идсэн."}]},
 {"id":2,"title_mn":"Яриа 2 · Аав хүүгийнхээ зургийг харж байна","scene_mn":"Аав ажлаасаа ирлээ. Хүү нь зураг барьчихсан байна. Аав зургийг нь панда гэж бодсон ч хүү «Энэ гөлөг шүү!» гэнэ.","audio":AUD_TEXT,
  "lines":[{"speaker":"爸爸","zh":"你今天做什么了？","pinyin":"Nǐ jīntiān zuò shénme le?","mn":"Чи өнөөдөр юу хийсэн бэ?"},
           {"speaker":"小明","zh":"我画画儿了。","pinyin":"Wǒ huà huàr le.","mn":"Би зураг зурсан."},
           {"speaker":"爸爸","zh":"这只熊猫真漂亮！","pinyin":"Zhè zhī xióngmāo zhēn piàoliang!","mn":"Энэ панда үнэхээр сайхан юм!"},
           {"speaker":"小明","zh":"爸爸，我没画熊猫。这是小狗！","pinyin":"Bàba, wǒ méi huà xióngmāo. Zhè shì xiǎo gǒu!","mn":"Аав аа, би панда зураагүй. Энэ бол гөлөг шүү!"}]},
]
sentences=[]
dlg = [
 (1,"妈妈：你今天吃水果了吗？","Māma: Nǐ jīntiān chī shuǐguǒ le ma?","Ээж: Чи өнөөдөр жимс идсэн үү?","妈妈：| 你|nǐ 今天|jīntiān 吃|chī 水果|shuǐguǒ 了|le 吗|ma ？|","吃水果了吗？ — «жимс идсэн үү?» гэж асууж байна. 了 нь «идчихсэн» гэсэн утга өгнө.",["你今天吃水果了吗？"]),
 (1,"小红：吃了。","Xiǎo Hóng: Chī le.","Сяо Хун: Идсэн.","小红：| 吃|chī 了|le 。|","Идсэн бол «吃了» гэж богино хариулна.",[]),
 (1,"妈妈：吃了什么水果？","Māma: Chī le shénme shuǐguǒ?","Ээж: Ямар жимс идсэн бэ?","妈妈：| 吃|chī 了|le 什么|shénme 水果|shuǐguǒ ？|","什么 = «юу, ямар».",[]),
 (1,"小红：吃了一个苹果和一个香蕉。","Xiǎo Hóng: Chī le yí ge píngguǒ hé yí ge xiāngjiāo.","Сяо Хун: Нэг алим, нэг гадил жимс идсэн.","小红：| 吃|chī 了|le 一|yí 个|ge 苹果|píngguǒ 和|hé 一|yí 个|ge 香蕉|xiāngjiāo 。|","我吃了一个苹果和一个香蕉。 — Түлхүүр өгүүлбэр. 和 = «ба».",["我吃了一个苹果和一个香蕉。"]),
 (2,"爸爸：你今天做什么了？","Bàba: Nǐ jīntiān zuò shénme le?","Аав: Чи өнөөдөр юу хийсэн бэ?","爸爸：| 你|nǐ 今天|jīntiān 做|zuò 什么|shénme 了|le ？|","«Өнөөдөр юу хийсэн бэ?» — энэ хичээлийн гарчиг.",["你今天做什么了？"]),
 (2,"小明：我画画儿了。","Xiǎo Míng: Wǒ huà huàr le.","Сяо Мин: Би зураг зурсан.","小明：| 我|wǒ 画画儿|huà huàr 了|le 。|","画画儿 = зураг зурах.",[]),
 (2,"爸爸：这只熊猫真漂亮！","Bàba: Zhè zhī xióngmāo zhēn piàoliang!","Аав: Энэ панда үнэхээр сайхан юм!","爸爸：| 这|zhè 只|zhī 熊猫|xióngmāo 真|zhēn 漂亮|piàoliang ！|","Аав зургийг панда гэж андуурчээ.",[]),
 (2,"小明：爸爸，我没画熊猫。这是小狗！","Xiǎo Míng: Bàba, wǒ méi huà xióngmāo. Zhè shì xiǎo gǒu!","Сяо Мин: Аав аа, би панда зураагүй. Энэ бол гөлөг шүү!","小明：| 爸爸|bàba ，| 我|wǒ 没|méi 画|huà 熊猫|xióngmāo 。| 这|zhè 是|shì 小狗|xiǎo gǒu ！|","我没画熊猫。 — Түлхүүр өгүүлбэр. 没 = «…гүй». 没 гэвэл 了 хэрэггүй.",["我没画熊猫。"]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("医生：你今天吃什么了？","Yīshēng: Nǐ jīntiān chī shénme le?","Эмч: Чи өнөөдөр юу идсэн бэ?","医生：| 你|nǐ 今天|jīntiān 吃|chī 什么|shénme 了|le ？|"),
 ("小老鼠：我吃了很多东西。","Xiǎo lǎoshǔ: Wǒ chī le hěn duō dōngxi.","Бяцхан хулгана: Би маш олон юм идсэн.","小老鼠：| 我|wǒ 吃|chī 了|le 很多|hěn duō 东西|dōngxi 。|"),
 ("医生：你吃了什么东西？","Yīshēng: Nǐ chī le shénme dōngxi?","Эмч: Чи ямар юм идсэн бэ?","医生：| 你|nǐ 吃|chī 了|le 什么|shénme 东西|dōngxi ？|"),
 ("小老鼠：吃了一个香蕉、两个苹果，还有冰淇淋。","Xiǎo lǎoshǔ: Chī le yí ge xiāngjiāo, liǎng ge píngguǒ, hái yǒu bīngqílín.","Бяцхан хулгана: Нэг гадил жимс, хоёр алим идсэн. Бас зайрмаг идсэн.","小老鼠：| 吃|chī 了|le 一|yí 个|ge 香蕉|xiāngjiāo ，| 两|liǎng 个|ge 苹果|píngguǒ ，| 还有|hái yǒu 冰淇淋|bīngqílín 。|"),
 ("医生：你吃了几个冰淇淋？","Yīshēng: Nǐ chī le jǐ ge bīngqílín?","Эмч: Чи хэдэн зайрмаг идсэн бэ?","医生：| 你|nǐ 吃|chī 了|le 几|jǐ 个|ge 冰淇淋|bīngqílín ？|"),
 ("小老鼠：吃了三个冰淇淋。","Xiǎo lǎoshǔ: Chī le sān ge bīngqílín.","Бяцхан хулгана: Гурван зайрмаг идсэн.","小老鼠：| 吃|chī 了|le 三|sān 个|ge 冰淇淋|bīngqílín 。|"),
 ("医生：还吃了什么？","Yīshēng: Hái chī le shénme?","Эмч: Бас юу идсэн бэ?","医生：| 还|hái 吃|chī 了|le 什么|shénme ？|"),
 ("小老鼠：还喝了四杯冰水。","Xiǎo lǎoshǔ: Hái hē le sì bēi bīng shuǐ.","Бяцхан хулгана: Бас дөрвөн аяга мөстэй ус уусан.","小老鼠：| 还|hái 喝|hē 了|le 四|sì 杯|bēi 冰水|bīng shuǐ 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «看医生» (Эмчид үзүүлэх) — 4 зурагт үлгэр. Хулгана хэтэрхий их идсэн тул гэдэс нь өвдөж эмчид иржээ. Аудио: 09-05."
    if i==3: s["note"]="还有 = «бас … бий». 冰淇淋 = зайрмаг."
    sentences.append(s)
song = [
 ("如果没吃香蕉，你就跺跺脚。","Rúguǒ méi chī xiāngjiāo, nǐ jiù duòduo jiǎo.","Хэрвээ гадил жимс идээгүй бол хөлөө газар дэвс.","如果|rúguǒ 没|méi 吃|chī 香蕉|xiāngjiāo ，| 你|nǐ 就|jiù 跺跺脚|duòduo jiǎo 。|"),
 ("如果吃了香蕉，你就拍拍手，拍拍手。","Rúguǒ chī le xiāngjiāo, nǐ jiù pāipai shǒu, pāipai shǒu.","Хэрвээ гадил жимс идсэн бол алга ташаарай, алга ташаарай.","如果|rúguǒ 吃|chī 了|le 香蕉|xiāngjiāo ，| 你|nǐ 就|jiù 拍拍手|pāipai shǒu ，| 拍拍手|pāipai shǒu 。|"),
 ("如果没吃香蕉，你就跺跺脚。","Rúguǒ méi chī xiāngjiāo, nǐ jiù duòduo jiǎo.","Хэрвээ гадил жимс идээгүй бол хөлөө газар дэвс.","如果|rúguǒ 没|méi 吃|chī 香蕉|xiāngjiāo ，| 你|nǐ 就|jiù 跺跺脚|duòduo jiǎo 。|"),
]
for i,(zh,py,mn,tk) in enumerate(song):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Let's sing «如果吃了香蕉» — «Баяртай бол алгаа таш» аяны дуу. Идсэн бол алгаа таш, идээгүй бол хөлөө дэвс! 吃了 ба 没吃-г ялгаж сур."
    sentences.append(s)
listen = [
 ("熊猫贝贝喜欢画画儿。","Xióngmāo Bèibei xǐhuan huà huàr.","Панда Бэй-бэй зураг зурах дуртай.","熊猫|xióngmāo 贝贝|Bèibei 喜欢|xǐhuan 画画儿|huà huàr 。|"),
 ("今天她画了一只小鸟、一只小猫和一只小狗。","Jīntiān tā huà le yì zhī xiǎo niǎo, yì zhī xiǎo māo hé yì zhī xiǎo gǒu.","Өнөөдөр тэр нэг бяцхан шувуу, нэг муур, нэг гөлөг зурсан.","今天|jīntiān 她|tā 画|huà 了|le 一|yì 只|zhī 小鸟|xiǎo niǎo ，| 小猫|xiǎo māo 和|hé 一|yì 只|zhī 小狗|xiǎo gǒu 。|"),
 ("小鸟是红色的，小猫是黄色的，小狗是白色的。","Xiǎo niǎo shì hóngsè de, xiǎo māo shì huángsè de, xiǎo gǒu shì báisè de.","Шувуу нь улаан, муур нь шар, гөлөг нь цагаан.","小鸟|xiǎo niǎo 是|shì 红色|hóngsè 的|de ，| 小猫|xiǎo māo 是|shì 黄色|huángsè 的|de ，| 小狗|xiǎo gǒu 是|shì 白色|báisè 的|de 。|"),
 ("请问，今天熊猫贝贝画了什么？","Qǐngwèn, jīntiān xióngmāo Bèibei huà le shénme?","Асууя, өнөөдөр панда Бэй-бэй юу зурсан бэ?","请问|qǐngwèn ，| 今天|jīntiān 熊猫|xióngmāo 贝贝|Bèibei 画|huà 了|le 什么|shénme ？|"),
]
for i,(zh,py,mn,tk) in enumerate(listen):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":5,"tokens":tok(tk)}
    if i==0: s["note"]="Сонсох дасгал (аудио 09-03). Эхийг аудиогоос сонсож буулгасан. Сонсоод асуултад хариул: 小鸟、小猫、小狗."
    sentences.append(s)

texts = {
 "unit":{"number":"9","title":"你今天做什么了？","mongolianTitle":"Чи өнөөдөр юу хийсэн бэ?"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх номд чи тоо, хоол, гэр бүлийн тухай сурсан. Одоо өнөөдөр юу хийснээ хятадаар ярьж сурна! «我吃了苹果» гэвэл «Би алим идлээ» гэсэн үг. Үйл үгийн ард «了» гэж хэлбэл «хийчихсэн» гэсэн утга болно. Харин «我没画熊猫» гэвэл «Би панда зураагүй» гэсэн үг. Бас «如果吃了香蕉» дууг алгаа таших, хөлөө дэвсэх хөдөлгөөнтэй дуулна. Бэлэн үү? Эхэлцгээе!",
  "warmup_mn":"Чи өнөөдөр юу идсэн бэ? Гараараа үзүүлж хэл. Өнөөдөр юу зурсан бэ, юу тоглосон бэ?",
  "theme_zh":"吃了 · 画了 · 没吃 · 没画","theme_mn":"Өнөөдөр юу хийсэн бэ · Хийсэн / хийгээгүй"},
 "warmup":{"mongolian":"Чи өнөөдөр юу идсэн бэ? Өнөөдөр юу зурсан бэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"9","title":"你今天做什么了？","mongolianTitle":"Чи өнөөдөр юу хийсэн бэ? — яриа, үлгэр, дуу","title_mn":"Let's read · 2 яриа + Let's sing · 如果吃了香蕉 + Mini story · 看医生","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 2 · 第9课 Let's read / Let's sing / Mini story（CD 09-02, 09-03, 09-04, 09-05）","author_zh":"",
  "intro_zh":"两段小对话：你今天吃水果了吗？你今天做什么了？再唱歌“如果吃了香蕉”，读小故事《看医生》。",
  "intro_mn":"Эхлээд хоёр богино яриа: «你今天吃水果了吗？» гэж жимс идсэн эсэхийг асууна, «你今天做什么了？» гэж өнөөдөр юу хийснийг асууна. Дараа нь «如果吃了香蕉» дууг алгаа таших, хөлөө дэвсэх хөдөлгөөнтэй дуулна. Хамгийн сүүлд «看医生» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Ээж охиноосоо «你今天吃水果了吗？» гэж асуугаад охин «吃了一个苹果和一个香蕉» гэж хариулна."},
   {"paragraph":2,"mn":"Яриа 2 — Аав хүүгээсээ «你今天做什么了？» гэж асууна. Хүү зураг зурсан бөгөөд «我没画熊猫，这是小狗！» гэнэ."},
   {"paragraph":3,"mn":"Үлгэр «Эмчид үзүүлэх» — бяцхан хулгана маш их юм идсэн: гадил жимс, алим, гурван зайрмаг, дөрвөн аяга мөстэй ус. Аудио: 09-05."},
   {"paragraph":4,"mn":"Дуу «Хэрвээ гадил жимс идсэн бол» — идсэн бол алгаа таш, идээгүй бол хөлөө дэвс. Аудио: 09-04."},
   {"paragraph":5,"mn":"Сонсох дасгал — панда Бэй-бэй зураг зурж, шувуу, муур, гөлөг зурсан. Аудио: 09-03."}],
  "reflection":{"questions_mn":["Чи өнөөдөр юу идсэн бэ? «我吃了……» гэж хэлж үз.","Өнөөдөр юу хийгээгүй вэ? «我没……» гэж хэл.","Хулганад юу тохиолдсон бэ? Яагаад гэдэс нь өвдсөн бол?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Өнөөдөр юу хийснээ хэл","zh":"我吃了一个苹果和一个香蕉。","pinyin":"Wǒ chī le yí ge píngguǒ hé yí ge xiāngjiāo.","mn":"Би нэг алим, нэг гадил жимс идлээ."},
  "writingPrompt_mn":"Өнөөдөр идсэн юмаа зураад хятадаар хэл: 我吃了……。 Идээгүй юмаа бас хэл: 我没吃……。"},
 "properNouns":[{"zh":"贝贝","pinyin":"Bèibei","mn":"Бэй-бэй (пандагийн нэр)"},{"zh":"小红","pinyin":"Xiǎo Hóng","mn":"Сяо Хун (охины нэр)"},{"zh":"小明","pinyin":"Xiǎo Míng","mn":"Сяо Мин (хүүгийн нэр)"}],
 "wordExplanation":[
  {"word":"了","gloss":"le — хийж дууссан","explanation":"Үйл үгийн ард «了» хэлбэл «хийчихсэн, дууссан» гэсэн утга болно. 吃了 = идсэн. 画了 = зурсан. Асуухдаа «吗» нэмнэ: «你吃水果了吗？» — «Чи жимс идсэн үү?» Асуулттай үед «了» нь «什么» ба «几个»-ын ард ч ордог: «你吃了什么？»",
   "structure":"吃 + 了 → 吃了。 你 + 吃 + 水果 + 了吗？","teacher_notes":"Дүрмийн нэр томьёо хэрэглэхгүй. «Идлээ, зурлаа, уулаа» гэж монголоор жишээ хэлж, хятад «了»-тай нь зэрэгцүүл.",
   "examples":[{"chinese":"我吃了。","pinyin":"Wǒ chī le.","mongolian":"Би идсэн."},{"chinese":"我画画儿了。","pinyin":"Wǒ huà huàr le.","mongolian":"Би зураг зурсан."},{"chinese":"你今天做什么了？","pinyin":"Nǐ jīntiān zuò shénme le?","mongolian":"Чи өнөөдөр юу хийсэн бэ?"}],
   "common_mistakes":[{"wrong":"我吃了苹果。(тоогүй, дараа нь өгүүлбэр үргэлжилбэл)","right":"我吃了一个苹果。","why":"«Идсэн юм»-аа тоогоор хэлбэл «吃了一个苹果» гэж «了»-г үйл үгийн ард тавина."}],
   "check":{"question":"«Би идсэн» хятадаар:","options":["我吃了。","我没吃。","我画了。"],"answer":"0"},
   "practice":[{"n":1,"question":"我画画儿 ________。(дууссан)","answer":"了","explanation_mn":"Хийж дууссан бол «了»."}]},
  {"word":"没（有）","gloss":"méi(yǒu) — …гүй, хийгээгүй","explanation":"Хийгээгүй бол үйл үгийн өмнө «没» тавина. 我没吃香蕉 — «Би гадил жимс идээгүй». «没» гэвэл «了» хэрэггүй. «吃了» ба «没吃» нь бие биеийн эсрэг!",
   "structure":"没 + үйл үг: 我没吃苹果。/ 我没画熊猫。","teacher_notes":"Эсрэг үгийн тоглоом: «我吃苹果了» ↔ «我没吃苹果».",
   "examples":[{"chinese":"我没画熊猫。","pinyin":"Wǒ méi huà xióngmāo.","mongolian":"Би панда зураагүй."},{"chinese":"我没吃香蕉。","pinyin":"Wǒ méi chī xiāngjiāo.","mongolian":"Би гадил жимс идээгүй."},{"chinese":"没睡觉。","pinyin":"Méi shuìjiào.","mongolian":"Унтаагүй."}],
   "common_mistakes":[{"wrong":"我没吃苹果了。","right":"我没吃苹果。","why":"«没» байвал «了» нэмэхгүй."}],
   "check":{"question":"«Би панда зураагүй» хятадаар:","options":["我没画熊猫。","我画熊猫了。","我吃熊猫了。"],"answer":"0"},
   "practice":[{"n":1,"question":"我 ________ 吃香蕉。(идээгүй)","answer":"没","explanation_mn":"Идээгүй бол үйл үгийн өмнө «没»."}]},
 ],
 "collocations":[{"type":"吃了 / 没吃 — идсэн, идээгүй","rows":[
   {"head":"吃了","with":"水果","mn":"жимс идсэн","usage_mn":"Идсэн үед","example":{"zh":"吃了一个苹果和一个香蕉。","pinyin":"Chī le yí ge píngguǒ hé yí ge xiāngjiāo.","mn":"Нэг алим, нэг гадил жимс идсэн."}},
   {"head":"没","with":"画熊猫","mn":"панда зураагүй","usage_mn":"Хийгээгүй үед","example":{"zh":"我没画熊猫。","pinyin":"Wǒ méi huà xióngmāo.","mn":"Би панда зураагүй."}},
   {"head":"画","with":"画儿","mn":"зураг зурах","usage_mn":"Зураг зурах гэхдээ «画画儿» гэж хэлнэ","example":{"zh":"我画画儿了。","pinyin":"Wǒ huà huàr le.","mn":"Би зураг зурсан."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["了","没","画","水果"],"items":[
     {"n":1,"question":"我吃 ________ 一个香蕉。","answer":"了","explanation_mn":"Идсэн бол үйл үгийн ард «了»."},
     {"n":2,"question":"我 ________ 画熊猫。","answer":"没","explanation_mn":"Зураагүй бол «没»."},
     {"n":3,"question":"我 ________ 画儿了。","answer":"画","explanation_mn":"«画画儿» — зураг зурах."},
     {"n":4,"question":"苹果和香蕉是 ________。","answer":"水果","explanation_mn":"Алим, гадил жимс бол «水果» (жимс)."}]}],
   "answer_source":"agent-authored (YCT 9 үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"她吃了什么水果？","answer":"一个苹果和一个香蕉。","explanation_mn":"Яриа 1 — охин нэг алим, нэг гадил жимс идсэн."},
     {"n":2,"question_zh":"他画熊猫了吗？","answer":"没有，他画的是小狗。","explanation_mn":"Яриа 2 — хүү «我没画熊猫，这是小狗» гэв."}],
   "answer_source":"textbook_verified (Let's read, х.44 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Эсрэг үгийн тоглоом","start_zh":"我吃苹果了。","instruction_mn":"Хоёулаа ээлжлэн хэлнэ. Нэг нь «我吃苹果了» гэвэл нөгөө нь эсрэгээр нь «我没吃苹果» гэж хэлнэ. Алдахгүй байж чадах уу?"},
     {"label":"Жимс, амьтнаа нэрлэе","start_zh":"我吃了香蕉。","instruction_mn":"Эхлээд мэддэг жимс, амьтнаа хятадаар нэрлэ (苹果, 香蕉, 熊猫, 小狗…). Дараа нь «吃» ба «画» гэж хэлж өгүүлбэр болго: «我吃了苹果», «我画了小狗». Нэг өгүүлбэрийг хоёр дахин хэлэхгүй!"},
     {"label":"Дуулж, хөдөлгөөн хий","start_zh":"如果吃了香蕉，你就拍拍手。","instruction_mn":"«如果吃了香蕉» дууг дуул. «吃了» гэхэд алгаа таш, «没吃» гэхэд хөлөө дэвс! Найзууд бүгдээрээ хамт хий."},
     {"label":"Эмч ба хулгана","start_zh":"你今天吃什么了？","instruction_mn":"«看医生» үлгэрийг жүжигчил. Нэг нь эмч, нөгөө нь бяцхан хулгана болно. Эмч нь «你今天吃什么了？» гэж асуугаад хулгана нь «吃了三个冰淇淋» гэж хариулна."}]}},
 "grammarNotes":[],
 "culture":{"title":"熊猫","title_mn":"Панда — Хятадын онцгой амьтан","text_mn":"Панда бол Хятадын хамгийн хайртай амьтан. Зэрлэг панда зөвхөн Хятадын баруун өмнөд хэсгийн уулсад амьдардаг. Панда өдөржин хулсны навч иддэг юм. Хятад хүүхдүүд пандаг маш их хайрладаг тул зураг зурахдаа ч, тоглоом авахдаа ч ихэвчлэн пандаг сонгодог.","note_mn":"Монголд ямар амьтан хамгийн алдартай вэ? Чи ямар амьтныг хамгийн их хайрладаг вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — өнөөдөр юу хийсэн, юу хийгээгүй гэж хэлэх.","topic":"Өнөөдөр юу хийснээ хятадаар хэл","discussion":["Хосоороо: «你今天做什么了？» гэж асууж, «我画画儿了» гэх мэтээр хариул.","Бүгдээрээ «如果吃了香蕉» дууг алгаа таших, хөлөө дэвсэх хөдөлгөөнтэй дуул."],
   "writing":{"promptChinese":"我吃了……。我没吃……。","promptMongolian":"Гэрийн даалгавар: өнөөдөр идсэн ба идээгүй юмаа зураад «我吃了……，我没吃……» гэж ээж аавдаа хэлж өг.","minChars":"0","requiredWords":["了","没","画"],"sampleChinese":"我吃了一个苹果，我没吃香蕉。","sampleMongolian":"Би нэг алим идлээ, гадил жимс идээгүй.","gradingRubric":"«了» ба «没»-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 2 · Test Answers (х.68/70): L9 1.✗ 2.✓ 3.✓ 4.✓ 5.C 6.A 7.D 8.B","parts":[]},
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
 {"point":"我吃了一个苹果和一个香蕉。 — идсэн, зурсан","gloss_mn":"«Би нэг алим, нэг гадил жимс идлээ» — «了» нь хийж дууссан үйлийг хэлнэ",
  "structure":"吃了 + тоо + юм。 / 你 + үйл + 了吗？",
  "teacher_mn":"Чи өнөөдөр юм идлээ гэж хэлмээр байна уу? «吃» гэдэг үгийн ард «了» нэм: «吃了». Идсэн юмаа тоогоор нь хэл: «我吃了一个苹果和一个香蕉». Асуухдаа төгсгөлд нь «吗» нэм: «你吃水果了吗？» Хариулахдаа «吃了» гэхэд л болно!",
  "teacher_notes":"了 нь үйл дууссаныг заана. Ном: 我吃了一个苹果和一个香蕉。 / 吃了。 / 我画画儿了。 Хүүхдэд «идлээ, зурлаа» гэж монголоор тэнцүүл.",
  "examples":[ex("我吃了一个苹果和一个香蕉。","Wǒ chī le yí ge píngguǒ hé yí ge xiāngjiāo.","Би нэг алим, нэг гадил жимс идлээ."),ex("你今天吃水果了吗？","Nǐ jīntiān chī shuǐguǒ le ma?","Чи өнөөдөр жимс идсэн үү?"),ex("吃了。","Chī le.","Идсэн."),ex("我画画儿了。","Wǒ huà huàr le.","Би зураг зурсан.")],
  "common_mistakes":[{"wrong":"我吃苹果了一个。","right":"我吃了一个苹果。","why":"了 нь 吃-ийн ард шууд орно, дараа нь тоо ба юм."}],
  "check":chk("«Чи өнөөдөр жимс идсэн үү?» гэж асуу:",["你今天吃水果了吗？","我没吃水果。","我画画儿了。"],"你今天吃水果了吗？","g1c"),
  "exercises":[
   choice("我吃 ________ 一个香蕉。",["了","没","吗"],"了","Зөв! Идсэн бол 吃了.","了 = хийж дууссан, 没 = хийгээгүй.","g1e1"),
   choice("«Идсэн» гэж богино хариул:",["吃了。","没吃。","画画儿。"],"吃了。","Зөв! 吃了 = идсэн.","没吃 = идээгүй.","g1e2"),
   judge("«我画画儿了» гэдэг нь «Би зураг зурсан» гэсэн үг.",True,"Зөв! 画画儿 = зураг зурах, 了 = дууссан.","画画儿 = зураг зурах.")]},
 {"point":"我没画熊猫。 — хийгээгүй","gloss_mn":"«Би панда зураагүй» — «没» нь хийгээгүйг хэлнэ",
  "structure":"我 + 没 + үйл үг + юм。",
  "teacher_mn":"Хийгээгүй юмаа хэлэхдээ үйл үгийн өмнө «没» тавина: «我没画熊猫» — «Би панда зураагүй». Гол нь: «没» байвал «了» хэрэггүй! «吃了» ба «没吃» нь бие биеийн эсрэг. Алгаа таш — «吃了», хөлөө дэвс — «没吃»!",
  "teacher_notes":"没 = 没有 (…гүй). Ном: 我没画熊猫。 / 我没吃香蕉。 Эсрэг үгийн тоглоом: 我吃苹果了 ↔ 我没吃苹果.",
  "examples":[ex("我没画熊猫。","Wǒ méi huà xióngmāo.","Би панда зураагүй."),ex("我没吃香蕉。","Wǒ méi chī xiāngjiāo.","Би гадил жимс идээгүй."),ex("我没吃苹果。","Wǒ méi chī píngguǒ.","Би алим идээгүй.")],
  "common_mistakes":[{"wrong":"我没吃香蕉了。","right":"我没吃香蕉。","why":"«没» байвал «了» нэмэхгүй."},{"wrong":"我不吃香蕉。(өнгөрсөн хэлэхэд)","right":"我没吃香蕉。","why":"Өнөөдөр хийгээгүй бол «没», харин «不» нь «хүсэхгүй/хийхгүй» гэх мэт."}],
  "check":chk("«Би панда зураагүй» гэж хэл:",["我没画熊猫。","我画熊猫了。","我吃熊猫了。"],"我没画熊猫。","g2c"),
  "exercises":[
   choice("我 ________ 吃香蕉。(идээгүй)",["没","了","吗"],"没","Зөв! 没 = идээгүй.","没 = …гүй, 了 = дууссан.","g2e1"),
   choice("«Би алим идээгүй» хятадаар:",["我没吃苹果。","我吃苹果了。","我画苹果了。"],"我没吃苹果。","Зөв!","没吃 = идээгүй.","g2e2"),
   judge("«我没吃苹果了» гэж хэлж болно.",False,"Зөв — «没» байвал «了» хэрэггүй: 我没吃苹果.","«没» ба «了»-г хамт хэрэглэхгүй.")]},
 {"point":"你今天做什么了？ — юу хийсэн бэ","gloss_mn":"«Чи өнөөдөр юу хийсэн бэ?» — «什么» ба «几个» гэж асуух",
  "structure":"你今天做什么了？ / 吃了什么？ / 吃了几个……？",
  "teacher_mn":"«Юу хийсэн бэ?» гэж асуухдаа «做什么了» гэнэ. «Юу идсэн бэ?» бол «吃了什么». «Хэдэн ширхэг идсэн бэ?» бол «吃了几个». Хариулахдаа асуултын «什么»-ний оронд юмаа хэлнэ. Жишээ: «吃了三个冰淇淋».",
  "teacher_notes":"Ном: 你今天做什么了？ / 吃了什么水果？ / 你吃了几个冰淇淋？ (Mini story). Хүүхэд «хэдэн» гэхэд тоо хэлнэ.",
  "examples":[ex("你今天做什么了？","Nǐ jīntiān zuò shénme le?","Чи өнөөдөр юу хийсэн бэ?"),ex("你吃了几个冰淇淋？","Nǐ chī le jǐ ge bīngqílín?","Чи хэдэн зайрмаг идсэн бэ?"),ex("吃了三个冰淇淋。","Chī le sān ge bīngqílín.","Гурван зайрмаг идсэн."),ex("还喝了四杯冰水。","Hái hē le sì bēi bīng shuǐ.","Бас дөрвөн аяга мөстэй ус уусан.")],
  "common_mistakes":[{"wrong":"你今天什么做了？","right":"你今天做什么了？","why":"Дараалал: 做 → 什么 → 了."}],
  "check":chk("«Чи хэдэн зайрмаг идсэн бэ?» хятадаар:",["你吃了几个冰淇淋？","你吃水果了吗？","你今天做什么了？"],"你吃了几个冰淇淋？","g3c"),
  "exercises":[
   choice("你今天做 ________ 了？",["什么","几个","没"],"什么","Зөв! 什么 = юу.","几个 = хэдэн ширхэг.","g3e1"),
   choice("你吃了 ________ 个冰淇淋？",["几","什么","没"],"几","Зөв! 几个 = хэдэн.","Тоог асуухад 几.","g3e2"),
   judge("«吃了三个冰淇淋» гэдэг нь «Гурван зайрмаг идсэн» гэсэн үг.",True,"Зөв! 三 = гурав.","三 = гурав, 冰淇淋 = зайрмаг.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Гадил жимс» хятадаар аль нь вэ?",["香蕉","苹果","熊猫","水果"],"香蕉","香蕉 (xiāngjiāo) = гадил жимс.","easy",["vocabulary"],"b1")
q("choice","«Панда» хятадаар аль нь вэ?",["熊猫","小猫","小狗","香蕉"],"熊猫","熊猫 (xióngmāo) = панда.","easy",["vocabulary"],"b2")
q("choice","«Жимс» хятадаар аль нь вэ?",["水果","面条","米饭","牛奶"],"水果","水果 (shuǐguǒ) = жимс.","easy",["vocabulary"],"b3")
q("choice","«画» гэдэг үг ямар утгатай вэ?",["зурах","идэх","уух","унтах"],"зурах","画 (huà) = зурах, зураг.","easy",["vocabulary"],"b4")
q("choice","«没吃» гэдэг ямар утгатай вэ?",["идээгүй","идсэн","идмээр байна","хэдэн"],"идээгүй","没 = …гүй. 没吃 = идээгүй.","easy",["vocabulary"],"b5")
q("choice","«了» гэдэг үг юуг хэлдэг вэ?",["хийж дууссан","хийгээгүй","хэдэн","ба"],"хийж дууссан","吃了 = идсэн. 了 нь хийж дууссаныг хэлнэ.","medium",["vocabulary"],"b6")
q("choice","«Алим» хятадаар аль нь вэ?",["苹果","香蕉","熊猫","水果"],"苹果","苹果 (píngguǒ) = алим.","easy",["vocabulary"],"b7")
q("choice","Пиньинь «xiāngjiāo» гэж уншдаг үг:",["香蕉","熊猫","水果","苹果"],"香蕉","香蕉 = xiāngjiāo = гадил жимс.","easy",["pronunciation"],"b8")
q("choice","Пиньинь «xióngmāo» гэж уншдаг үг:",["熊猫","香蕉","小猫","小狗"],"熊猫","熊猫 = xióngmāo = панда.","medium",["pronunciation"],"b9")
q("choice","Пиньинь «shuǐguǒ» гэж уншдаг үг:",["水果","苹果","香蕉","面条"],"水果","水果 = shuǐguǒ = жимс.","medium",["pronunciation"],"b10")
q("choice","«Би идсэн» хятадаар:",["我吃了。","我没吃。","我画了。","我喝了。"],"我吃了。","吃了 = идсэн.","easy",["dialogue"],"b11")
q("choice","«Би зураг зурсан» хятадаар:",["我画画儿了。","我吃画儿了。","我没画画儿。","我画熊猫。"],"我画画儿了。","画画儿 = зураг зурах, 了 = дууссан.","easy",["dialogue"],"b12")
q("choice","«Чи өнөөдөр юу хийсэн бэ?» хятадаар:",["你今天做什么了？","你吃水果了吗？","你吃了几个？","你家有几口人？"],"你今天做什么了？","做什么了 = юу хийсэн бэ.","easy",["dialogue"],"b13")
q("choice","«Чи өнөөдөр жимс идсэн үү?» хятадаар:",["你今天吃水果了吗？","你今天吃什么了？","你今天画画儿了吗？","你有水果吗？"],"你今天吃水果了吗？","吃水果了吗 = жимс идсэн үү.","medium",["dialogue"],"b14")
q("choice","Ээж «你今天吃水果了吗？» гэж асуулаа. Идсэн бол юу гэж хариулах вэ?",["吃了。","没画。","再见。","画了。"],"吃了。","Идсэн бол 吃了.","easy",["dialogue"],"b15")
q("cloze","我吃（ ）一个香蕉。",["了","没","吗","画"],"了","Идсэн бол үйл үгийн ард 了.","easy",["usage"],"b16")
q("cloze","我（ ）画熊猫。",["没","了","吗","几"],"没","Зураагүй бол 没.","easy",["usage"],"b17")
q("cloze","你今天做（ ）了？",["什么","几个","没","和"],"什么","«Юу» — 什么.","easy",["usage"],"b18")
q("cloze","你吃了（ ）个冰淇淋？",["几","什么","没","了"],"几","«Хэдэн» — 几.","medium",["usage"],"b19")
q("cloze","吃了一个苹果（ ）一个香蕉。",["和","没","吗","画"],"和","«ба» — 和.","medium",["usage"],"b20")
q("choice","«我没画熊猫» гэдэг нь:",["Би панда зураагүй","Би панда зурсан","Би панда идсэн","Би панда харсан"],"Би панда зураагүй","没画 = зураагүй.","medium",["usage"],"b21")
q("choice","Дараах дундаас зөв өгүүлбэр аль нь вэ?",["我没吃香蕉。","我没吃香蕉了。","我吃没香蕉。","没我吃香蕉。"],"我没吃香蕉。","«没» үйл үгийн өмнө орно, «了» хэрэггүй.","hard",["usage"],"b22")
q("choice","«我吃苹果了» гэдгийн эсрэг нь:",["我没吃苹果。","我吃香蕉了。","我画苹果了。","我吃了。"],"我没吃苹果。","Эсрэг үгийн тоглоом: 吃了 ↔ 没吃.","medium",["usage"],"b23")
q("choice","Яриа 2-д хүү юу зурсан бэ?",["小狗","熊猫","小猫","苹果"],"小狗","Хүү «我没画熊猫，这是小狗！» гэв.","medium",["dialogue"],"b24")
q("choice","Mini story-д хулгана хэдэн зайрмаг идсэн бэ?",["三个","一个","两个","四个"],"三个","吃了三个冰淇淋.","medium",["dialogue"],"b25")
q("choice","Mini story-д хулгана хэдэн аяга мөстэй ус уусан бэ?",["四杯","三杯","两杯","一杯"],"四杯","还喝了四杯冰水.","medium",["dialogue"],"b26")
q("choice","Дуунд «吃了香蕉» гэхэд юу хийх вэ?",["алгаа таших","хөлөө дэвсэх","унтах","зурах"],"алгаа таших","如果吃了香蕉，你就拍拍手 — алгаа таш.","medium",["usage"],"b27")
q("choice","Дараах дундаас жимс биш нь:",["熊猫","苹果","香蕉","水果"],"熊猫","熊猫 = панда (амьтан). Бусад нь жимс.","easy",["vocabulary"],"b28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
OPT = ["没起床。","两个。","苹果。","吃了。"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"judge","instruction_mn":"Сонсох — Аудио (09-06) сонсоод зураг таарч байвал ✓, таарахгүй бол ✗.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）两只大熊猫","image":img("t1"),"script_zh":"两只大熊猫","answer":"✗","explanation_mn":"Аудионд «两只大熊猫 — хоёр том панда». Зураг дээр хоёр муур байна, панда биш → ✗."},
    {"n":2,"question_zh":"（听录音）没睡觉","image":img("t2"),"script_zh":"没睡觉","answer":"✓","explanation_mn":"Аудионд «没睡觉 — унтаагүй». Зураг дээр эмэгтэй ор дээр хэвтээд утсаар ярьж байна, нүд нь нээлттэй → ✓."},
    {"n":3,"question_zh":"（听录音）吃香蕉","image":img("t3"),"script_zh":"吃香蕉","answer":"✓","explanation_mn":"Аудионд «吃香蕉 — гадил жимс идэх». Зураг дээр охин гадил жимс идэж байна → ✓."},
    {"n":4,"question_zh":"（听录音）画画儿","image":img("t4"),"script_zh":"画画儿","answer":"✓","explanation_mn":"Аудионд «画画儿 — зураг зурах». Зураг дээр хоёр хүүхэд сойз барьж зураг зурж байна → ✓."}],
   "answer_source":"Test Answers: 1.✗ 2.✓ 3.✓ 4.✓"},
  {"part":2,"type":"choice","instruction_mn":"Унших — асуулт бүрд тохирох хариултыг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"你昨天买什么了？","question_mn":"Чи өчигдөр юу худалдаж авсан бэ?","options":BANK,"optionTexts":OPT,"answer":"C","explanation_mn":"«Юу авсан бэ?» гэж асуусан тул юмаар хариулна: «苹果 — алим». 没起床 босоогүй, 两个 хоёр ширхэг, 吃了 идсэн — асуулттай таарахгүй."},
    {"n":6,"question_zh":"你哥哥起床了吗？","question_mn":"Чиний ах боссон уу?","options":BANK,"optionTexts":OPT,"answer":"A","explanation_mn":"«Боссон уу?» гэж асуусан. «没起床 — босоогүй» нь хариулт болно."},
    {"n":7,"question_zh":"你吃饭了吗？","question_mn":"Чи хоол идсэн үү?","options":BANK,"optionTexts":OPT,"answer":"D","explanation_mn":"«Хоол идсэн үү?» гэсэн асуултад «吃了 — идсэн» гэж хариулна."},
    {"n":8,"question_zh":"你吃了几个香蕉？","question_mn":"Чи хэдэн гадил жимс идсэн бэ?","options":BANK,"optionTexts":OPT,"answer":"B","explanation_mn":"«Хэдэн?» гэж асуусан тул тоогоор хариулна: «两个 — хоёр ширхэг»."}],
   "answer_source":"Test Answers: 5.C 6.A 7.D 8.B"},
  {"part":3,"type":"match","instruction_mn":"Асуулт бүрд тохирох хариултыг холбо.","items":[
    {"n":1,"question_zh":"你今天吃水果了吗？","answer":"吃了。","explanation_mn":"Асуулт «жимс идсэн үү?» — «吃了» гэж хариулна."},
    {"n":2,"question_zh":"吃了什么水果？","answer":"吃了一个苹果和一个香蕉。","explanation_mn":"«Ямар жимс?» гэсэн асуултад жимсээ нэрлэнэ."},
    {"n":3,"question_zh":"你今天做什么了？","answer":"我画画儿了。","explanation_mn":"«Юу хийсэн бэ?» — «зураг зурсан»."},
    {"n":4,"question_zh":"你吃了几个冰淇淋？","answer":"吃了三个冰淇淋。","explanation_mn":"«Хэдэн?» — тоогоо хэлнэ."}],
   "answer_source":"textbook х.44, х.46 (Let's read, Mini story)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «看医生» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"我吃了很多东西。","answer":"1","explanation_mn":"1-р зураг дээр эмч хулганаас юу идсэнийг асууж, хулгана «маш олон юм идсэн» гэж байна."},
    {"n":2,"question_zh":"吃了一个香蕉、两个苹果，还有冰淇淋。","answer":"2","explanation_mn":"2-р зураг дээр хулгана хэвтээд идсэн юмаа жагсааж байна."},
    {"n":3,"question_zh":"吃了三个冰淇淋。","answer":"3","explanation_mn":"3-р зураг дээр хулганы толгойн дээр гурван зайрмаг байна."},
    {"n":4,"question_zh":"还喝了四杯冰水。","answer":"4","explanation_mn":"4-р зураг дээр хулганы толгойн дээр дөрвөн аяга ус байна."}],
   "answer_source":"textbook х.46 (Mini story)"},
  {"part":5,"type":"match","instruction_mn":"Эсрэг үгийн тоглоом — өгүүлбэр бүрийн эсрэгийг холбо.","items":[
    {"n":1,"question_zh":"我吃苹果了。","answer":"我没吃苹果。","explanation_mn":"吃了 ↔ 没吃."},
    {"n":2,"question_zh":"我画熊猫了。","answer":"我没画熊猫。","explanation_mn":"画了 ↔ 没画."},
    {"n":3,"question_zh":"我没吃香蕉。","answer":"我吃香蕉了。","explanation_mn":"没吃 ↔ 吃了."}],
   "answer_source":"textbook х.44 (Antonyms game)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Ханз бичих — «画», «了» гэсэн ханзыг дахин бичиж хуулж үз.","question_zh":"画 了","answer":"画 了","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Өнөөдөр юу идснээ хэл.","question_zh":"我吃了……。","answer":"我吃了……","explanation_mn":"Идсэн юмаа нэрлэ."},
   {"n":2,"prompt_mn":"Найзаасаа өнөөдөр юу хийснийг нь асуу.","question_zh":"你今天做什么了？","answer":"你今天做什么了？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":3,"prompt_mn":"«如果吃了香蕉» дууг алгаа таших, хөлөө дэвсэх хөдөлгөөнтэй дуул.","question_zh":"如果吃了香蕉","answer":"(нээлттэй)","explanation_mn":"Аудио 09-04-ийн хамт."}]},
 "answerSource":"YCT 标准教程 2 · Test Listening Scripts, Test Answers (Lesson 9)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("xiangjiao","香蕉"),("xiongmao","熊猫"),("shuiguo","水果"),("le","了"),("hua","画"),("mei","没（有）")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"你今天做什么了？","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你今天吃水果了吗？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"你今天做什么了？","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"如果吃了香蕉","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"看医生 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1","2","3","4"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 2 · 9-р хичээл — Чи өнөөдөр юу хийсэн бэ?","chineseTitle":"你今天做什么了？","targetTitle":"你今天做什么了？","mongolianTitle":"Чи өнөөдөр юу хийсэн бэ?",
 "subtitle":"香蕉 · 熊猫 · 水果 · 了 · 没 · «如果吃了香蕉» дуу · «看医生» үлгэр",
 "description":f"Өнөөдөр юу хийснээ (吃了, 画了) ба хийгээгүйгээ (没吃, 没画) хэлж сурна. {len(vocab)} үг, 2 зурагт яриа, дуу, Mini story «看医生», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🍌","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 2",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 2 — 第9课《你今天做什么了？》 [hskLevel=1] [lessonNumber=9]; эх: сурах бичиг х.43, 44, 46, 47 (х.45 сканнд алга — дуу ба сонсох текстийг аудио 09-03, 09-04-өөс ASR-аар буулгасан); аудио CD 09-01…09-06"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你今天做什么了？","mongolianTitle":"Чи өнөөдөр юу хийсэн бэ?",
 "series":"YCT 标准教程 2","seriesLabel_mn":"YCT 2 — Хүүхдийн хятад хэл (≈HSK1–2)",
 "source":"YCT 标准教程 2 · 第9课 (сурах бичиг + CD аудио 09-01..06 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"listen":AUD_LISTEN,"song":AUD_SONG,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L9)","textStatus":"source_verified (хуудас х.43,44,46,47); дуу ба 09-03 текст = аудиогоос ASR (х.45 алга)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
