#!/usr/bin/env python3
"""YCT 标准教程 3 · 第9课 笑一笑！ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
OUT = "/home/claude/work/yct3/l09/pkg"
CID, LID, N = "yct-3", "yct-3-l09", 9
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

# Тестийн зураг (t5..t8) + story: hi-49 / hi-48-аас хайчлана
from PIL import Image
_pg = Image.open("/home/claude/work/yct3/l09/pages/hi-49.png").convert("RGB")
_s = 1240/830
_BOX = {"t5":(125,485,295,605),"t6":(125,610,280,745),"t7":(135,765,260,900),"t8":(180,925,265,1055)}
for _k,(_a,_b,_c,_d) in _BOX.items():
    _pg.crop((int(_a*_s),int(_b*_s),int(_c*_s),int(_d*_s))).save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct3/l09/pages/hi-48.png").convert("RGB").crop((110,285,1160,1560)).save(f"{OUT}/images/story.png")

# audio: 01 үг, 02 яриа, 03 chant, 04 mini story, 05 test. Үндсэн = яриа + chant
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = [f"audio/yct-3-09-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-3-09-text-song.mp3"
if not os.path.exists(f"{OUT}/{AUD_MAIN}"):
    lst = f"{A}/_concat.txt"
    open(lst,"w").write(f"file '{A}/yct-3-09-02.mp3'\nfile '{A}/yct-3-09-03.mp3'\n")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
    os.remove(lst)

# ---------------- VOCAB ----------------
VOCAB = [
 ("哭","kū","уйлах","үйлдэл заасан үг · гол үг","你怎么哭了？","Nǐ zěnme kū le?","Чи яагаад уйлаад байгаа юм бэ?",True),
 ("笑","xiào","инээх, инээмсэглэх","үйлдэл заасан үг · гол үг","笑一笑！","Xiào yi xiào!","Инээмсэглээрэй!",True),
 ("东西","dōngxi","юм, эд зүйл","нэр үг · гол үг","我的东西丢了。","Wǒ de dōngxi diū le.","Миний юм алга болсон.",True),
 ("丢","diū","гээх, алдах","үйлдэл заасан үг · гол үг","我的熊猫丢了。","Wǒ de xiōngmāo diū le.","Миний панда алга болчихлоо.",True),
 ("到","dào","хайх, харах зэрэг үгийн ард орж «амжилттай болсон» гэдгийг заана","үйлдлийн дараа орно · гол үг","找到了！","Zhǎodào le!","Олдлоо!",True),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 3","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    """'汉字|pīnyīn 汉字|pīn yīn ，|' → tokens. '|'-гүй, ханзгүй хэсгийг өмнөх токений пиньиньд залгана."""
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
 {"id":1,"title_mn":"Яриа 1 · Хүү яагаад уйлав?","scene_mn":"Унтлагын өрөөнд хүү орон дээр суугаад уйлж байна. Охин ирээд яагаад уйлсан, юу алга болсныг асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"你怎么哭了？","pinyin":"Nǐ zěnme kū le?","mn":"Чи яагаад уйлаад байгаа юм бэ?"},
           {"speaker":"小明","zh":"我的东西丢了。","pinyin":"Wǒ de dōngxi diū le.","mn":"Миний юм алга болсон."},
           {"speaker":"小红","zh":"什么东西丢了？","pinyin":"Shénme dōngxi diū le?","mn":"Ямар юм алга болсон бэ?"},
           {"speaker":"小明","zh":"我的熊猫丢了。","pinyin":"Wǒ de xiōngmāo diū le.","mn":"Миний панда алга болчихлоо."}]},
 {"id":2,"title_mn":"Яриа 2 · Хамт хайцгаая","scene_mn":"Охин хүүгээ тайвшруулаад хамт хайна. Хүү орны доороос пандаа олж хараад баярлана.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"别哭，我们一起找一找。","pinyin":"Bié kū, wǒmen yìqǐ zhǎo yi zhǎo.","mn":"Бүү уйл, бид хамт хайж үзье."},
           {"speaker":"小明","zh":"看，我的熊猫在那儿！","pinyin":"Kàn, wǒ de xiōngmāo zài nàr!","mn":"Хар даа, миний панда тэнд байна!"},
           {"speaker":"小红","zh":"太好了！找到了，笑一笑吧！","pinyin":"Tài hǎo le! Zhǎodào le, xiào yi xiào ba!","mn":"Яасан сайн юм бэ! Олдлоо, инээмсэглээрэй!"}]},
]
sentences=[]
dlg = [
 (1,"小红：你怎么哭了？","Xiǎo Hóng: Nǐ zěnme kū le?","Сяо Хун: Чи яагаад уйлаад байгаа юм бэ?","小红：| 你|nǐ 怎么|zěnme 哭|kū 了|le ？|","怎么……了？ — «яагаад … байна?» гэж асууна. Найз чинь уйлж байвал ингэж асуугаарай.",["你怎么哭了？"]),
 (1,"小明：我的东西丢了。","Xiǎo Míng: Wǒ de dōngxi diū le.","Сяо Мин: Миний юм алга болсон.","小明：| 我|wǒ 的|de 东西|dōngxi 丢|diū 了|le 。|","东西 = юм, эд зүйл. 丢了 = алга болсон, гээсэн.",["东西丢了"]),
 (1,"小红：什么东西丢了？","Xiǎo Hóng: Shénme dōngxi diū le?","Сяо Хун: Ямар юм алга болсон бэ?","小红：| 什么|shénme 东西|dōngxi 丢|diū 了|le ？|","",["什么东西丢了？"]),
 (1,"小明：我的熊猫丢了。","Xiǎo Míng: Wǒ de xiōngmāo diū le.","Сяо Мин: Миний панда алга болчихлоо.","小明：| 我|wǒ 的|de 熊猫|xióngmāo 丢|diū 了|le 。|","",[]),
 (2,"小红：别哭，我们一起找一找。","Xiǎo Hóng: Bié kū, wǒmen yìqǐ zhǎo yi zhǎo.","Сяо Хун: Бүү уйл, бид хамт хайж үзье.","小红：| 别|bié 哭|kū ，| 我们|wǒmen 一起|yìqǐ 找一找|zhǎo yi zhǎo 。|","别哭 = «бүү уйл». 找一找 = «хайж үзэх».",["别哭"]),
 (2,"小明：看，我的熊猫在那儿！","Xiǎo Míng: Kàn, wǒ de xiōngmāo zài nàr!","Сяо Мин: Хар даа, миний панда тэнд байна!","小明：| 看|kàn ，| 我|wǒ 的|de 熊猫|xióngmāo 在|zài 那儿|nàr ！|","",[]),
 (2,"小红：太好了！找到了，笑一笑吧！","Xiǎo Hóng: Tài hǎo le! Zhǎodào le, xiào yi xiào ba!","Сяо Хун: Яасан сайн юм бэ! Олдлоо, инээмсэглээрэй!","小红：| 太好了|tài hǎo le ！| 找到|zhǎodào 了|le ，| 笑一笑|xiào yi xiào 吧|ba ！|","找到 — олох гэсэн үйлдэл амжилттай болсныг 到 заана.",["笑一笑！"]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
chant = [
 ("小熊猫，去学校，高高兴兴跑又跳，","Xiǎo xióngmāo, qù xuéxiào, gāogāoxìngxìng pǎo yòu tiào,","Бяцхан панда сургууль руу явна, баяртайгаар гүйж, үсэрнэ.","小熊猫|xiǎo xióngmāo ，| 去|qù 学校|xuéxiào ，| 高高兴兴|gāogāoxìngxìng 跑|pǎo 又|yòu 跳|tiào ，|"),
 ("见到老师问您好，坐下拿出小书包。","Jiàndào lǎoshī wèn nín hǎo, zuò xià ná chū xiǎo shūbāo.","Багшаа хараад «Сайн байна уу» гэнэ. Суугаад жижиг цүнхээ гаргана.","见到|jiàndào 老师|lǎoshī 问|wèn 您好|nín hǎo ，| 坐下|zuò xià 拿出|ná chū 小|xiǎo 书包|shūbāo 。|"),
 ("咦？","Yí?","Өө?","咦|yí ？|"),
 ("书和铅笔都丢了，东西丢了找不到。","Shū hé qiānbǐ dōu diū le, dōngxi diū le zhǎo bu dào.","Ном, харандаа хоёулаа алга болжээ. Юм алга болоод олдохгүй байна.","书|shū 和|hé 铅笔|qiānbǐ 都|dōu 丢|diū 了|le ，| 东西|dōngxi 丢|diū 了|le 找|zhǎo 不|bu 到|dào 。|"),
 ("别哭别哭你别哭，我们帮你找一找。","Bié kū bié kū nǐ bié kū, wǒmen bāng nǐ zhǎo yi zhǎo.","Бүү уйл, бүү уйл, чи бүү уйл. Бид чамд туслаж хайя.","别|bié 哭|kū 别|bié 哭|kū 你|nǐ 别|bié 哭|kū ，| 我们|wǒmen 帮|bāng 你|nǐ 找一找|zhǎo yi zhǎo 。|"),
 ("找到了，找到了，好朋友们哈哈笑。","Zhǎodào le, zhǎodào le, hǎo péngyoumen hāha xiào.","Олдлоо, олдлоо! Сайн найзууд хаха гэж инээцгээв.","找到|zhǎodào 了|le ，| 找到|zhǎodào 了|le ，| 好|hǎo 朋友们|péngyoumen 哈哈|hāha 笑|xiào 。|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Let's chant «小熊猫，去学校» — ая гаргаж, хөдөлгөөнтэй хэлдэг. Эхний мөрөнд гүйж, үсэр! «别哭» гэхдээ толгой сэгсэр, «哈哈笑» гэхдээ чанга инээ. Аудио: 09-03."
    if i==2: s["note"]="咦 = «Өө?» гэж гайхахад хэлнэ. Гайхсан царай гарга!"
    sentences.append(s)
story = [
 ("老虎：熊猫，你怎么哭了？","Lǎohǔ: Xióngmāo, nǐ zěnme kū le?","Бар: Панда аа, чи яагаад уйлаад байгаа юм бэ?","老虎：| 熊猫|xióngmāo ，| 你|nǐ 怎么|zěnme 哭|kū 了|le ？|"),
 ("熊猫：我弟弟丢了。","Xióngmāo: Wǒ dìdi diū le.","Панда: Миний дүү алга болчихлоо.","熊猫：| 我|wǒ 弟弟|dìdi 丢|diū 了|le 。|"),
 ("老虎：别着急，我帮你找一找。","Lǎohǔ: Bié zháojí, wǒ bāng nǐ zhǎo yi zhǎo.","Бар: Санаа битгий зов, би чамд туслаж хайя.","老虎：| 别|bié 着急|zháojí ，| 我|wǒ 帮|bāng 你|nǐ 找一找|zhǎo yi zhǎo 。|"),
 ("老虎：那不是你弟弟吗？","Lǎohǔ: Nà bú shì nǐ dìdi ma?","Бар: Тэр чинь чиний дүү биш гэж үү?","老虎：| 那|nà 不是|bú shì 你|nǐ 弟弟|dìdi 吗|ma ？|"),
 ("熊猫：不是，我弟弟不是绿色的。","Xióngmāo: Bú shì, wǒ dìdi bú shì lǜsè de.","Панда: Үгүй, миний дүү ногоон биш шүү дээ.","熊猫：| 不是|bú shì ，| 我|wǒ 弟弟|dìdi 不是|bú shì 绿色|lǜsè 的|de 。|"),
 ("熊猫：真的是弟弟！我的弟弟找到了！","Xióngmāo: Zhēnde shì dìdi! Wǒ de dìdi zhǎodào le!","Панда: Үнэхээр миний дүү байна! Дүү маань олдлоо!","熊猫：| 真的|zhēnde 是|shì 弟弟|dìdi ！| 我|wǒ 的|de 弟弟|dìdi 找到|zhǎodào 了|le ！|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «弟弟丢了» (Дүү алга боллоо) — 4 зурагт үлгэр. Бар панда хоёр дүүг хайна. Аудио: 09-04. Найзтайгаа жүжигчилж үзээрэй."
    if i==2: s["note"]="着急 = санаа зовох, яарах. «别着急» = «санаа битгий зов»."
    if i==4: s["note"]="Ногоон боодол мэт зүйл бол дүү биш байсан! 绿色 = ногоон өнгө."
    sentences.append(s)

texts = {
 "unit":{"number":"9","title":"笑一笑！","mongolianTitle":"Инээмсэглээрэй! — уйлсан найзаа тайвшруулж, алдсан юмаа хамт хайх"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх YCT 1, YCT 2 номд чи гэр бүл, тоо, хоол хүнсний тухай маш олон үг сурсан даа. Одоо нэг асуулт асууя: чи хэзээ нэг өдөр хайртай тоглоомоо гээж, уйлж байсан уу? Тэр үед найз чинь чамд юу гэж хэлвэл баярлах вэ? Өнөөдөр «你怎么哭了？» гэж найзаасаа асууж, «别哭，我们一起找一找» гэж тайвшруулж сурна. Мөн алдсан юмаа олоод «找到了！» гэж хашгирч, бүгдээрээ «笑一笑！» гэж инээмсэглэнэ. Бяцхан панда «小熊猫，去学校» дууг чамтай хамт хөдөлгөөнтэй хэлнэ. Эхэлцгээе!",
  "warmup_mn":"Чи хамгийн сүүлд юу гээж байсан бэ? Тэр юм олдоход чи юу гэж хашгирсан бэ?",
  "theme_zh":"哭 · 笑 · 东西 · 丢 · 找到","theme_mn":"Уйлах · инээх · юм · алдах · олох"},
 "warmup":{"mongolian":"Чи гээсэн юмаа олоход яаж баярладаг вэ? Гараа дээш өргөөд «找到了！» гэж хашгирч үз!"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"9","title":"笑一笑！","mongolianTitle":"Инээмсэглээрэй! — яриа, chant, үлгэр","title_mn":"Let's read · 2 яриа + Let's chant · 小熊猫 + Mini story · 弟弟丢了","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 3 · 第9课 Let's read / Let's chant / Mini story（CD 09-02, 09-03, 09-04）","author_zh":"",
  "intro_zh":"两段小对话：你怎么哭了？别哭，我们一起找一找。然后读儿歌《小熊猫》和小故事《弟弟丢了》。",
  "intro_mn":"Эхлээд хоёр яриа: «你怎么哭了？» гэж уйлсан найзаасаа асууна, «别哭，我们一起找一找» гэж тайвшруулна. Дараа нь «小熊猫，去学校» chant-ыг хөдөлгөөнтэй хэлээд, «弟弟丢了» үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Хүү орон дээр уйлж байна. Охин яагаад уйлснийг асуутал хүүгийн панда алга болсон байна."},
   {"paragraph":2,"mn":"Яриа 2 — Охин «бүү уйл, хамт хайя» гэнэ. Хүү орны доороос пандаа олж, бүгд баярлан инээмсэглэнэ."},
   {"paragraph":3,"mn":"Chant «小熊猫，去学校» — Бяцхан панда баяртайгаар сургуульд явна. Гэтэл ном, харандаа нь алга болжээ. Найзууд хамт хайж олоод хаха инээнэ. Аудио: 09-03."},
   {"paragraph":4,"mn":"Үлгэр «弟弟丢了» — Панда дүүгээ алдаад уйлна. Бар туслахаар хайна. Ногоон боодол дүү биш байсан ч эцэст нь бороонд жинхэнэ дүү олдоно. Аудио: 09-04."}],
  "reflection":{"questions_mn":["Чи юмаа гээхэд яах вэ? «我的东西丢了» гэж хэлж үз.","Найз чинь уйлж байвал чи юу гэх вэ?","Үлгэрт бар яагаад панда руу «别着急» гэсэн бэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Тайвшруул","zh":"别哭，我们一起找一找。","pinyin":"Bié kū, wǒmen yìqǐ zhǎo yi zhǎo.","mn":"Бүү уйл, бид хамт хайж үзье."},
  "writingPrompt_mn":"Найзаа уйлсан дүр үзүүл. Чи «你怎么哭了？» гэж асуугаад «别哭，我们一起找一找» гэж тайвшруул."},
 "properNouns":[],
 "wordExplanation":[
  {"word":"东西 · 丢了","gloss":"dōngxi · diū le — юм · алга болсон","explanation":"东西 гэдэг нь «юм, эд зүйл» гэсэн үг. Юмаа гээвэл «东西丢了» гэнэ. Ямар юм гэдгийг нь асуухдаа «什么东西丢了？» гэж хэлдэг. Хариулахдаа «我的熊猫丢了» гэж юмныхаа нэрийг хэлнэ.",
   "structure":"什么东西丢了？ → 我的……丢了。","teacher_notes":"Хүүхдүүдэд өөрийн цүнхнээсээ нэг юм нуулгаад «什么东西丢了？» гэж асуулга.",
   "examples":[{"chinese":"什么东西丢了？","pinyin":"Shénme dōngxi diū le?","mongolian":"Ямар юм алга болсон бэ?"},{"chinese":"我的熊猫丢了。","pinyin":"Wǒ de xiōngmāo diū le.","mongolian":"Миний панда алга болчихлоо."},{"chinese":"书和铅笔都丢了。","pinyin":"Shū hé qiānbǐ dōu diū le.","mongolian":"Ном, харандаа хоёулаа алга болжээ."}],
   "common_mistakes":[{"wrong":"丢我的熊猫了。","right":"我的熊猫丢了。","why":"Эхлээд юмаа хэлээд, дараа нь 丢了 гэнэ."}],
   "check":{"question":"«Ямар юм алга болсон бэ?» хятадаар:","options":["什么东西丢了？","你怎么哭了？","笑一笑！"],"answer":"0"},
   "practice":[{"n":1,"question":"什么 ________ 丢了？(юм)","answer":"东西","explanation_mn":"«Юм» — 东西."}]},
  {"word":"怎么……了？","gloss":"zěnme … le — яагаад … байна?","explanation":"Найз чинь гэнэт уйлж, гомдож байвал «яасан бэ?» гэж асууна. Хятадаар «你怎么哭了？» гэнэ. Хариулахдаа шалтгаанаа хэлнэ: «我的东西丢了».",
   "structure":"你怎么 + юу болсон + 了？","teacher_notes":"Номын яриа: 你怎么哭了？ — 我的东西丢了。 Хүүхдүүд хосоороо уйлах дүр үзүүлээд асуулцаж болно.",
   "examples":[{"chinese":"你怎么哭了？","pinyin":"Nǐ zěnme kū le?","mongolian":"Чи яагаад уйлаад байгаа юм бэ?"},{"chinese":"熊猫，你怎么哭了？","pinyin":"Xióngmāo, nǐ zěnme kū le?","mongolian":"Панда аа, чи яагаад уйлаад байгаа юм бэ?"},{"chinese":"我的东西丢了。","pinyin":"Wǒ de dōngxi diū le.","mongolian":"Миний юм алга болсон."}],
   "common_mistakes":[{"wrong":"你哭怎么了？","right":"你怎么哭了？","why":"怎么 нь 哭-ийн өмнө орно."}],
   "check":{"question":"Уйлж буй найзаасаа «Яагаад уйлав?» гэж асуу:","options":["你怎么哭了？","别哭。","找到了！"],"answer":"0"},
   "practice":[{"n":1,"question":"你 ________ 哭了？(яагаад)","answer":"怎么","explanation_mn":"«Яагаад» — 怎么."}]},
  {"word":"别","gloss":"bié — бүү, битгий","explanation":"Найздаа «битгий хий» гэж хэлэхдээ 别-г хийх зүйлийнхээ өмнө тавина. 别哭 = бүү уйл. 别着急 = санаа битгий зов. Дөлгөөн, халуун үгээр хэлээрэй.",
   "structure":"别 + юу хийх","teacher_notes":"Chant-д «别哭别哭你别哭» гэж давтагдана. Толгой сэгсэрч, гараа даллаж хэл.",
   "examples":[{"chinese":"别哭。","pinyin":"Bié kū.","mongolian":"Бүү уйл."},{"chinese":"别着急。","pinyin":"Bié zháojí.","mongolian":"Санаа битгий зов."},{"chinese":"别哭了。","pinyin":"Bié kū le.","mongolian":"Уйлахаа боль доо."}],
   "common_mistakes":[{"wrong":"哭别。","right":"别哭。","why":"别 нь хийх зүйлийнхээ өмнө орно."}],
   "check":{"question":"«Бүү уйл» хятадаар:","options":["别哭","笑一笑","你好"],"answer":"0"},
   "practice":[{"n":1,"question":"________ 哭。(бүү)","answer":"别","explanation_mn":"«Бүү, битгий» — 别."}]},
  {"word":"找一找 · 笑一笑","gloss":"zhǎo yi zhǎo · xiào yi xiào — хайж үзэх · инээмсэглэж үзэх","explanation":"Нэг үгээ хоёр хэлж, дундуур нь 一 хийвэл «жаахан … үзье» гэсэн зөөлөн хүсэлт болно. 找一找 = жаахан хайж үзье. 笑一笑 = инээмсэглээрэй. 看一看 = харж үзье.",
   "structure":"找 + 一 + 找 → 找一找，笑一笑","teacher_notes":"Зураг авахдаа багш «笑一笑！» гэж хэлнэ. Хүүхдүүд хамт инээмсэглэ.",
   "examples":[{"chinese":"我们一起找一找。","pinyin":"Wǒmen yìqǐ zhǎo yi zhǎo.","mongolian":"Бид хамт хайж үзье."},{"chinese":"笑一笑！","pinyin":"Xiào yi xiào!","mongolian":"Инээмсэглээрэй!"},{"chinese":"我帮你找一找。","pinyin":"Wǒ bāng nǐ zhǎo yi zhǎo.","mongolian":"Би чамд туслаж хайж үзье."}],
   "common_mistakes":[{"wrong":"笑笑一。","right":"笑一笑。","why":"Дундаа 一 байна: 笑 → 一 → 笑."}],
   "check":{"question":"«Инээмсэглээрэй!» хятадаар:","options":["笑一笑！","找一找！","别哭！"],"answer":"0"},
   "practice":[{"n":1,"question":"我们一起找 ________ 。(жаахан)","answer":"一找","explanation_mn":"找一找 — хайж үзье."}]},
  {"word":"找到了","gloss":"zhǎodào le — олдлоо","explanation":"到 нь 找-ын ард орж «амжилттай болсон» гэдгийг заана. 找 = хайх, 找到 = хайгаад олох. 看 = харах, 看到 = хараад олж харах. Олдвол «找到了！» гэж хашгир.",
   "structure":"找 + 到 + 了 → 找到了，看到了","teacher_notes":"Chant: 找到了，找到了，好朋友们哈哈笑。 Олсон юмаа өргөөд хашгирч хэл.",
   "examples":[{"chinese":"找到了！","pinyin":"Zhǎodào le!","mongolian":"Олдлоо!"},{"chinese":"我的弟弟找到了！","pinyin":"Wǒ de dìdi zhǎodào le!","mongolian":"Миний дүү олдлоо!"},{"chinese":"东西丢了找不到。","pinyin":"Dōngxi diū le zhǎo bu dào.","mongolian":"Юм алга болоод олдохгүй байна."}],
   "common_mistakes":[{"wrong":"到找了！","right":"找到了！","why":"到 нь 找-ын ард орно."}],
   "check":{"question":"«Олдлоо!» хятадаар:","options":["找到了！","丢了。","哭了。"],"answer":"0"},
   "practice":[{"n":1,"question":"我的熊猫找 ________ 了！(олсон)","answer":"到","explanation_mn":"Олсныг заахад 找到."}]},
 ],
 "collocations":[{"type":"Хэрэгтэй хэллэг","rows":[
   {"head":"怎么","with":"哭了","mn":"яагаад уйлав","usage_mn":"Уйлж буй найзаасаа асуух","example":{"zh":"你怎么哭了？","pinyin":"Nǐ zěnme kū le?","mn":"Чи яагаад уйлаад байгаа юм бэ?"}},
   {"head":"别","with":"哭","mn":"бүү уйл","usage_mn":"Найзаа тайвшруулах","example":{"zh":"别哭，我们一起找一找。","pinyin":"Bié kū, wǒmen yìqǐ zhǎo yi zhǎo.","mn":"Бүү уйл, бид хамт хайж үзье."}},
   {"head":"找","with":"到","mn":"хайгаад олох","usage_mn":"Олсондоо баярлах","example":{"zh":"找到了！","pinyin":"Zhǎodào le!","mn":"Олдлоо!"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["哭","笑","丢","东西"],"items":[
     {"n":1,"question":"你怎么 ________ 了？","answer":"哭","explanation_mn":"Уйлж байгаа найзаас «яагаад уйлав?» гэж асууна — 哭."},
     {"n":2,"question":"我的熊猫 ________ 了。","answer":"丢","explanation_mn":"Панда алга болсон — 丢."},
     {"n":3,"question":"什么 ________ 丢了？","answer":"东西","explanation_mn":"«Ямар юм» — 什么东西."},
     {"n":4,"question":"太好了！ ________ 一笑吧！","answer":"笑","explanation_mn":"«Инээмсэглээрэй» — 笑一笑."}]}],
   "answer_source":"agent-authored (YCT 3 · 9-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"男孩为什么哭？","answer":"他的熊猫丢了。","explanation_mn":"Яриа 1 — «我的熊猫丢了» гэсэн."},
     {"n":2,"question_zh":"女孩让男孩做什么？","answer":"笑一笑。","explanation_mn":"Яриа 2 — «笑一笑吧！» гэж хэлсэн."}],
   "answer_source":"textbook_verified (Let's read, х.44 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Эсрэг утгын тоглоом","start_zh":"哭——笑","instruction_mn":"Үгийг цаасан карт дээр бичнэ: 哭, 笑, 大, 小, 东西丢了, 东西找到了. Нэг нь «哭！» гэвэл нөгөө нь эсрэг картаа өргөөд «笑！» гэж чанга хэлнэ. Хурдан зөв хэлсэн нь оноо авна."},
     {"label":"Юм хайх тоглоом","start_zh":"什么东西丢了？","instruction_mn":"Нэг нь нүдээ ухаад хүлээнэ. Нөгөө нь тоглоомыг нууна. Нүдээ нээгээд «什么东西丢了？» гэж асууна. Хамт «我们一起找一找！» гэж хайгаад, олмогцоо «找到了！» гэж хашгир."},
     {"label":"Зургийн тоглоом","start_zh":"笑一笑！","instruction_mn":"Утсаараа найзынхаа зургийг ав. Зургийг авахын өмнө «笑一笑！» гэж хэл. Найз чинь хамгийн хөгжилтэй инээмсэглэлээ үзүүлнэ!"},
     {"label":"Chant хөдөлгөөнтэй","start_zh":"小熊猫，去学校","instruction_mn":"Аудиог асаагаад chant-ыг дагаж хэл. «跑又跳» дээр гүй, үсэр. «别哭» дээр толгойгоо сэгсэр. «哈哈笑» дээр чанга инээ!"},
     {"label":"弟弟丢了 жүжиг","start_zh":"熊猫，你怎么哭了？","instruction_mn":"Гурвуулаа үлгэрийг жүжигчилье: панда, бар, дүү. Панда уйлаад «我弟弟丢了» гэнэ. Бар «别着急，我帮你找一找» гэнэ. Эцэст нь «我的弟弟找到了！» гэж хамт баярла."}]}},
 "grammarNotes":[],
 "culture":{"title":"茄子","title_mn":"Хятад хүүхэд зураг авахдаа «茄子!» гэдэг","text_mn":"Монголд зураг авахдаа «чи-из!» гэж хэлдэг шүү дээ. Хятад хүүхдүүд «茄子!» (qiézi) гэж хэлдэг. Энэ нь «баклажан» гэсэн үг. «Qiézi» гэж хэлэхэд ам нь өөрөө инээмсэглэсэн хэлбэртэй болдог. Мөн панда бол Хятадын хамгийн дуртай, дэлхийн хамгийн алдартай амьтдын нэг. Тийм учраас сурах бичигт панда ихэд гардаг.","note_mn":"Чи зураг авахдаа юу гэж хэлдэг вэ? Найзуудтайгаа «茄子!» гэж хэлээд зураг аваад үз."},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — найзаа тайвшруулж, алдсан юмаа хамт хайх.","topic":"Найз чинь юмаа гээвэл чи юу гэх вэ?","discussion":["Хосоороо: нэг нь уйлсан дүр үзүүлж «我的东西丢了» гэнэ. Нөгөө нь «别哭，我们一起找一找» гэнэ.","Бүгдээрээ «笑一笑！» гэж хэлээд хамт инээмсэглээрэй."],
   "writing":{"promptChinese":"我的东西丢了。别哭，我们一起找一找。","promptMongolian":"Гэрийн даалгавар: гэр бүлийн гишүүнээсээ «你怎么哭了？» гэж тоглоомоор асуугаад «我的……丢了» гэж хариул.","minChars":"0","requiredWords":["丢","找"],"sampleChinese":"我的熊猫丢了。","sampleMongolian":"Миний панда алга болчихлоо."}},
 "workbookReading":{"answer_source":"YCT 标准教程 3 · Test Answers: L9 1.A 2.A 3.B 4.C 5.A 6.C 7.C 8.B","parts":[]},
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
 {"point":"什么东西丢了？ — юм алга болсон","gloss_mn":"«Ямар юм алга болсон бэ?» — алдсан юмаа хэлэх",
  "structure":"什么东西丢了？ → 我的……丢了。",
  "teacher_mn":"Найз чинь юмаа алдвал «什么东西丢了？» гэж асууна. 东西 = юм. 丢了 = алга болсон. Хариулахдаа «我的熊猫丢了» гэж өөрийн юмаа хэлнэ. Бүх юмаа нэрлэж үз!",
  "teacher_notes":"Номын яриа: 什么东西丢了？ 我的熊猫丢了。",
  "examples":[ex("什么东西丢了？","Shénme dōngxi diū le?","Ямар юм алга болсон бэ?"),ex("我的东西丢了。","Wǒ de dōngxi diū le.","Миний юм алга болсон."),ex("我的熊猫丢了。","Wǒ de xiōngmāo diū le.","Миний панда алга болчихлоо."),ex("我弟弟丢了。","Wǒ dìdi diū le.","Миний дүү алга болчихлоо.")],
  "common_mistakes":[{"wrong":"丢我的熊猫了。","right":"我的熊猫丢了。","why":"Эхлээд юмаа, дараа нь 丢了."}],
  "check":chk("«Ямар юм алга болсон бэ?» хятадаар:",["什么东西丢了？","你怎么哭了？","笑一笑！"],"什么东西丢了？","g1c"),
  "exercises":[
   choice("什么 ________ 丢了？",["东西","熊猫","弟弟"],"东西","Зөв! 东西 = юм.","«Ямар юм» гэхдээ 什么东西.","g1e1"),
   choice("«Миний юм алга болсон» хятадаар:",["我的东西丢了。","我的东西找到了。","你的东西丢了。"],"我的东西丢了。","Зөв!","丢了 = алга болсон, 我的 = миний.","g1e2"),
   judge("«丢» гэдэг нь «алдах, гээх» гэсэн үг.",True,"Зөв! 丢 = гээх, алдах.","丢 = гээх, алдах.")]},
 {"point":"你怎么哭了？ — яагаад … байна","gloss_mn":"«Чи яагаад уйлав?» — найзаасаа шалтгааныг нь асуух",
  "structure":"你怎么 + юу болсон + 了？",
  "teacher_mn":"Найз чинь гэнэт уйлбал «яасан бэ?» гэж асууна. Хятадаар «你怎么哭了？» гэнэ. 怎么 = яагаад. Хариулахдаа шалтгаанаа хэлнэ: «我的东西丢了». Гунигтай царай гаргаад хосоороо тоглож үз!",
  "teacher_notes":"Номын яриа: 你怎么哭了？ Mini story: 熊猫，你怎么哭了？",
  "examples":[ex("你怎么哭了？","Nǐ zěnme kū le?","Чи яагаад уйлаад байгаа юм бэ?"),ex("熊猫，你怎么哭了？","Xióngmāo, nǐ zěnme kū le?","Панда аа, чи яагаад уйлаад байгаа юм бэ?"),ex("我弟弟丢了。","Wǒ dìdi diū le.","Миний дүү алга болчихлоо.")],
  "common_mistakes":[{"wrong":"你哭怎么了？","right":"你怎么哭了？","why":"怎么 нь 哭-ийн өмнө орно."}],
  "check":chk("Уйлж буй найзаасаа «Яагаад уйлав?» гэж асуу:",["你怎么哭了？","别哭。","找到了！"],"你怎么哭了？","g2c"),
  "exercises":[
   choice("你 ________ 哭了？",["怎么","什么","别"],"怎么","Зөв! 怎么 = яагаад.","«Яагаад» гэж асуухдаа 怎么.","g2e1"),
   choice("«Яагаад уйлав?» гэж асуухад хариулах нь:",["我的东西丢了。","笑一笑！","太好了！"],"我的东西丢了。","Зөв!","Уйлсан шалтгаанаа хэлнэ.","g2e2"),
   judge("«哭» гэдэг нь «уйлах» гэсэн үг.",True,"Зөв! 哭 = уйлах.","哭 = уйлах, 笑 = инээх.")]},
 {"point":"别哭 · 找一找 · 笑一笑","gloss_mn":"«Бүү уйл», «хайж үзье», «инээмсэглээрэй»",
  "structure":"别 + юу хийх · 找一找 · 笑一笑",
  "teacher_mn":"Найзаа тайвшруулахдаа «别哭» гэнэ. 别 = бүү. Хамт хайя гэвэл «找一找» гэнэ — нэг үгээ хоёр хэлж, дундуур нь 一 хийнэ. Зураг авахдаа «笑一笑！» гэж хэлээрэй. Гараа тавиад тайвшруулах дүр үзүүл!",
  "teacher_notes":"Номын яриа: 别哭，我们一起找一找。 太好了！找到了，笑一笑吧！",
  "examples":[ex("别哭，我们一起找一找。","Bié kū, wǒmen yìqǐ zhǎo yi zhǎo.","Бүү уйл, бид хамт хайж үзье."),ex("笑一笑！","Xiào yi xiào!","Инээмсэглээрэй!"),ex("别着急，我帮你找一找。","Bié zháojí, wǒ bāng nǐ zhǎo yi zhǎo.","Санаа битгий зов, би чамд туслаж хайя.")],
  "common_mistakes":[{"wrong":"哭别。","right":"别哭。","why":"别 нь хийх зүйлийнхээ өмнө орно."}],
  "check":chk("«Бүү уйл» хятадаар:",["别哭","笑一笑","找到了"],"别哭","g3c"),
  "exercises":[
   choice("________ 哭，我们一起找一找。",["别","会","要"],"别","Зөв! 别 = бүү.","«Бүү, битгий» — 别.","g3e1"),
   choice("«Хайж үзье» хятадаар:",["找一找","笑一笑","哭一哭"],"找一找","Зөв!","找 = хайх, 找一找 = хайж үзэх.","g3e2"),
   judge("«笑一笑» гэж зураг авахдаа хэлж болно.",True,"Зөв! «Инээмсэглээрэй!»","笑一笑 = инээмсэглээрэй.")]},
 {"point":"找到了 — олдлоо","gloss_mn":"«Олдлоо!» — үйлдэл амжилттай болсныг хэлэх",
  "structure":"找 + 到 + 了 → 找到了，看到了",
  "teacher_mn":"Юмаа хайгаад олбол «找到了！» гэж хашгирна. 找 = хайх. 到 нь ард нь орж «олдсон» гэсэн амжилтыг заана. Олохгүй бол «找不到» гэнэ. Нэг юмаа нуугаад олоод үз!",
  "teacher_notes":"Chant: 东西丢了找不到 … 找到了，找到了。 Mini story: 我的弟弟找到了！",
  "examples":[ex("找到了！","Zhǎodào le!","Олдлоо!"),ex("我的弟弟找到了！","Wǒ de dìdi zhǎodào le!","Миний дүү олдлоо!"),ex("东西丢了找不到。","Dōngxi diū le zhǎo bu dào.","Юм алга болоод олдохгүй байна.")],
  "common_mistakes":[{"wrong":"到找了！","right":"找到了！","why":"到 нь 找-ын ард орно."}],
  "check":chk("«Олдлоо!» хятадаар:",["找到了！","丢了。","哭了。"],"找到了！","g4c"),
  "exercises":[
   choice("我的熊猫找 ________ 了！",["到","别","哭"],"到","Зөв! 找到 = олох.","Олсныг 找到 гэнэ.","g4e1"),
   choice("«Олдохгүй байна» хятадаар:",["找不到","找到了","别哭"],"找不到","Зөв!","不到 = олдохгүй.","g4e2"),
   judge("«找到了» гэдэг нь «алга болсон» гэсэн үг.",False,"Зөв! 找到了 = олдлоо.","找到了 = олдлоо, 丢了 = алга болсон.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Уйлах» хятадаар аль нь вэ?",["哭","笑","吃","看"],"哭","哭 (kū) = уйлах.","easy",["vocabulary"],"a1")
q("choice","«Инээх, инээмсэглэх» хятадаар аль нь вэ?",["笑","哭","丢","去"],"笑","笑 (xiào) = инээх.","easy",["vocabulary"],"a2")
q("choice","«Юм, эд зүйл» хятадаар аль нь вэ?",["东西","熊猫","弟弟","老师"],"东西","东西 (dōngxi) = юм, эд зүйл.","easy",["vocabulary"],"a3")
q("choice","«Гээх, алдах» хятадаар аль нь вэ?",["丢","吃","看","去"],"丢","丢 (diū) = гээх, алдах.","easy",["vocabulary"],"a4")
q("choice","«找到了» доторх 到 нь юу заадаг вэ?",["Үйлдэл амжилттай болсныг","Хүний нэрийг","Тоог","Асуултыг"],"Үйлдэл амжилттай болсныг","找到 = хайгаад олох. 到 нь амжилттай болсныг заана.","medium",["vocabulary"],"a5")
q("choice","«哭»-ийн эсрэг утгатай үг аль нь вэ?",["笑","丢","大","小"],"笑","哭 (уйлах) — 笑 (инээх).","easy",["vocabulary"],"a6")
q("choice","«东西丢了»-ийн эсрэг утгатай хэллэг аль нь вэ?",["东西找到了","东西大了","我哭了","你好"],"东西找到了","东西丢了 (алга болсон) — 东西找到了 (олдсон).","medium",["vocabulary"],"a7")
q("choice","«Чи яагаад уйлаад байгаа юм бэ?» хятадаар:",["你怎么哭了？","什么东西丢了？","笑一笑！","我的东西丢了。"],"你怎么哭了？","怎么 = яагаад.","easy",["dialogue"],"a8")
q("choice","«Ямар юм алга болсон бэ?» хятадаар:",["什么东西丢了？","你怎么哭了？","别哭。","找到了！"],"什么东西丢了？","什么东西 = ямар юм.","medium",["dialogue"],"a9")
q("choice","Яриа 1-д хүү яагаад уйлсан бэ?",["Түүний панда алга болсон","Түүний багш ирээгүй","Түүнд хоол байхгүй","Түүний дүү инээсэн"],"Түүний панда алга болсон","我的熊猫丢了 — миний панда алга болсон.","easy",["dialogue"],"a10")
q("choice","Охин «别哭，我们一起找一找» гэвэл юу гэсэн үг вэ?",["Бүү уйл, бид хамт хайж үзье","Би гэртээ харилаа","Би чамд панда өгье","Чи ирээрэй"],"Бүү уйл, бид хамт хайж үзье","别哭 = бүү уйл, 找一找 = хайж үзэх.","medium",["dialogue"],"a11")
q("choice","Хүү «看，我的熊猫在那儿！» гэвэл юу гэсэн үг вэ?",["Хар даа, миний панда тэнд байна","Миний панда алга боллоо","Би панда хайхгүй","Панда уйлж байна"],"Хар даа, миний панда тэнд байна","那儿 = тэнд.","medium",["dialogue"],"a12")
q("cloze","你怎么（ ）了？",["哭","东西","熊猫","那儿"],"哭","你怎么哭了？ = Чи яагаад уйлав?","easy",["dialogue"],"a13")
q("cloze","我的东西（ ）了。",["丢","哭","笑","去"],"丢","东西丢了 = юм алга болсон.","easy",["dialogue"],"a14")
q("cloze","找（ ）了！",["到","哭","笑","吗"],"到","找到了 = олдлоо.","medium",["dialogue"],"a15")
q("cloze","（ ）哭，我们一起找一找。",["别","不","没","是"],"别","别哭 = бүү уйл.","medium",["dialogue"],"a16")
q("choice","Mini story-д панда «我弟弟丢了» гэвэл юу гэсэн үг вэ?",["Миний дүү алга болчихлоо","Миний дүү инээж байна","Миний дүү ногоон","Миний дүү сургуульд явсан"],"Миний дүү алга болчихлоо","弟弟丢了 = дүү алга болсон.","easy",["story"],"a17")
q("choice","Панда «我弟弟不是绿色的» гэж яагаад хэлсэн бэ?",["Тэр ногоон зүйл түүний дүү биш байсан","Дүү нь ногоон малгай өмссөн","Дүү нь ногоонд дуртай","Дүү нь сургуульд байсан"],"Тэр ногоон зүйл түүний дүү биш байсан","Панда ногоон боодлыг дүү биш гэж хэлсэн.","medium",["story"],"a18")
q("choice","Үлгэрийн төгсгөлд юу болсон бэ?",["Дүү олдсон","Бар алга болсон","Панда сургуульд явсан","Бороо зогссон"],"Дүү олдсон","我的弟弟找到了！ = Дүү маань олдлоо!","easy",["story"],"a19")
q("choice","Chant-д бяцхан панда хаашаа явсан бэ?",["Сургууль руу","Зах руу","Гэр рүү","Цэцэрлэг рүү"],"Сургууль руу","小熊猫，去学校 = Бяцхан панда сургууль руу явна.","easy",["story"],"a20")
q("choice","Chant-д ямар юм алга болсон бэ?",["Ном, харандаа","Гутал, малгай","Алим, талх","Нохой, муур"],"Ном, харандаа","书和铅笔都丢了。","medium",["story"],"a21")
q("choice","Пиньинь «kū» гэж уншдаг үг:",["哭","笑","丢","到"],"哭","哭 = kū = уйлах.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «xiào» гэж уншдаг үг:",["笑","哭","东西","丢"],"笑","笑 = xiào = инээх.","easy",["pronunciation"],"a23")
q("choice","Пиньинь «dōngxi» гэж уншдаг үг:",["东西","熊猫","老师","弟弟"],"东西","东西 = dōngxi = юм.","medium",["pronunciation"],"a24")
q("choice","Пиньинь «diū» гэж уншдаг үг:",["丢","到","哭","笑"],"丢","丢 = diū = гээх, алдах.","medium",["pronunciation"],"a25")
q("usage","Найз чинь уйлж байна. Чи юу гэж асуух вэ?",["你怎么哭了？","笑一笑！","找到了！","再见！"],"你怎么哭了？","Яагаад уйлснийг 你怎么哭了？ гэж асууна.","medium",["usage"],"a26")
q("usage","Найз чинь юмаа алдаж уйлж байна. Тайвшруулахад юу гэх вэ?",["别哭，我们一起找一找。","太好了！","你好！","我不去。"],"别哭，我们一起找一找。","Тайвшруулж, хамт хайна.","medium",["usage"],"a27")
q("usage","Алдсан юмаа олоод баярлалаа. Юу гэх вэ?",["找到了！","我丢了。","别哭。","再见。"],"找到了！","Олсон үедээ 找到了！","easy",["usage"],"a28")
q("usage","Багш зураг авахын өмнө юу гэж хэлдэг вэ?",["笑一笑！","别哭！","什么东西？","你怎么了？"],"笑一笑！","笑一笑 = инээмсэглээрэй.","easy",["usage"],"a29")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
ABC = ["A","B","C"]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (09-05) сонсоод зөв хариуг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）你怎么哭了？","script_zh":"你怎么哭了？","options":ABC,"optionTexts":["我的熊猫丢了。","他笑了。","找到了。"],"answer":"A","explanation_mn":"«Чи яагаад уйлав?» гэж асуусан тул шалтгаанаа хэлнэ: «我的熊猫丢了 — миний панда алга болсон». B «Тэр инээсэн», C «Олдлоо» — асуултад таарахгүй."},
    {"n":2,"question_zh":"（听录音）那儿有几只熊猫？","script_zh":"那儿有几只熊猫？","options":ABC,"optionTexts":["两只","三岁","9本"],"answer":"A","explanation_mn":"«Хэдэн панда байна?» гэж асуусан — тоогоор хариулна: «两只 — хоёр». 三岁 нь гурван нас, 9本 нь ес ширхэг ном — таарахгүй."},
    {"n":3,"question_zh":"（听录音）你看见我的衣服了吗？","script_zh":"你看见我的衣服了吗？","options":ABC,"optionTexts":["几年级？","没有，你再找一找。","我们一起去。"],"answer":"B","explanation_mn":"«Миний хувцсыг харсан уу?» — «没有，你再找一找 — үгүй, чи дахин хайж үз». A «Хэддүгээр анги?», C «Хамт явъя» — таарахгүй."},
    {"n":4,"question_zh":"（听录音）你的东西在哪儿？","script_zh":"你的东西在哪儿？","options":ABC,"optionTexts":["上课","很多","下边"],"answer":"C","explanation_mn":"«Чиний юм хаана байна?» — газар хэлнэ: «下边 — доор». 上课 хичээл, 很多 их олон — «хаана» гэсэн асуултад таарахгүй."}],
   "answer_source":"YCT 3 Test Answers L9: 1.A 2.A 3.B 4.C"},
  {"part":2,"type":"choice","instruction_mn":"Унших — зураг бүрд тохирох өгүүлбэрийг A, B, C-ээс сонго.","items":[
    {"n":5,"question_zh":"（зураг 5）","question_mn":"Хоёр хүүхэд хамт инээж байна.","image":img("t5"),"options":ABC,"optionTexts":["他们都笑了。","你爱吃饺子吗？","我们比一比，看谁能自己穿。"],"answer":"A","explanation_mn":"Зураг дээр хоёр хүүхэд инээмсэглэж байна: «他们都笑了 — тэд хоёулаа инээсэн». B банш идэх тухай, C хувцас өмсөх тэмцээн — зурагт таарахгүй."},
    {"n":6,"question_zh":"（зураг 6）","question_mn":"Эр хүн хүүд гөлөг өгч байна.","image":img("t6"),"options":ABC,"optionTexts":["熊猫在那儿。","我的鼻子很长。","这是你丢的那只狗吧？"],"answer":"C","explanation_mn":"Зураг дээр эр хүн хүүд хар цагаан гөлөг барьж өгч байна: «Энэ чиний алдсан нохой биз?». A панда, B урт хамар — зурагт байхгүй."},
    {"n":7,"question_zh":"（зураг 7）","question_mn":"Охин нүдээ арчаад уйлж байна.","image":img("t7"),"options":ABC,"optionTexts":["她很快乐。","他说的话真好笑。","你怎么哭了？"],"answer":"C","explanation_mn":"Охин нүдээ арчиж уйлж байна — «你怎么哭了？ — чи яагаад уйлав?». A «Тэр баяртай» — гунигтай зурагт таарахгүй, B «Түүний үг хөгжилтэй» — таарахгүй."},
    {"n":8,"question_zh":"（зураг 8）","question_mn":"Охин камертай зураг авч байна.","image":img("t8"),"options":ABC,"optionTexts":["那只小老虎在看什么呢？","看这里，笑一笑。","不，我不想吃香蕉。"],"answer":"B","explanation_mn":"Зураг авч байгаа охин «看这里，笑一笑 — энд хар, инээмсэглээрэй» гэнэ. A бар юу харж байгааг асуусан, C гадил жимс — зурагт байхгүй."}],
   "answer_source":"YCT 3 Test Answers L9: 5.A 6.C 7.C 8.B"},
  {"part":3,"type":"match","instruction_mn":"Let's match — зүүн талын өгүүлбэрт тохирох баруун талын өгүүлбэрийг сонго.","items":[
    {"n":1,"question_zh":"别哭了。","answer":"笑一笑。","explanation_mn":"«Бүү уйл» — «инээмсэглээрэй» гэж тайвшруулна."},
    {"n":2,"question_zh":"什么东西丢了？","answer":"我的熊猫丢了。","explanation_mn":"Юу алга болсныг асуулаа — панда гэж хариулна."},
    {"n":3,"question_zh":"我们找一找。","answer":"我找到了！","explanation_mn":"Хамт хайвал олдоно: «Олдлоо!»."}],
   "answer_source":"Let's match х.45 (хариуг агент утгаар нь тааруулсан, номд хариу байхгүй)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «弟弟丢了» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"熊猫，你怎么哭了？","answer":"1","explanation_mn":"1-р зураг дээр бар уйлж буй пандаас асууна."},
    {"n":2,"question_zh":"别着急，我帮你找一找。","answer":"2","explanation_mn":"2-р зураг дээр бар пандад тусална гэж хэлж байна."},
    {"n":3,"question_zh":"那不是你弟弟吗？","answer":"3","explanation_mn":"3-р зураг дээр бар бамбуйн дундах ногоон боодол руу заана."},
    {"n":4,"question_zh":"我的弟弟找到了！","answer":"4","explanation_mn":"4-р зураг дээр бороонд жинхэнэ дүү олдсон."}],
   "answer_source":"textbook х.46 (Mini story)"},
  {"part":5,"type":"match","instruction_mn":"Эсрэг утгын тоглоом — хос бүрийг тааруул.","items":[
    {"n":1,"question_zh":"哭","answer":"笑","explanation_mn":"уйлах — инээх."},
    {"n":2,"question_zh":"大","answer":"小","explanation_mn":"том — жижиг."},
    {"n":3,"question_zh":"东西丢了","answer":"东西找到了","explanation_mn":"алга болсон — олдсон."}],
   "answer_source":"Антоним тоглоом х.43"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «笑» гэсэн ханзыг дахин бичиж хуул.","question_zh":"笑","answer":"笑","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Уйлсан найзаасаа асуу.","question_zh":"你怎么哭了？","answer":"你怎么哭了？","explanation_mn":"Хосоороо ээлжлэн."},
   {"n":2,"prompt_mn":"Найзаа тайвшруул.","question_zh":"别哭，我们一起找一找。","answer":"别哭，我们一起找一找。","explanation_mn":"Нөгөө нь «我的……丢了» гэж хариулна."},
   {"n":3,"prompt_mn":"弟弟丢了 үлгэрийг жүжигчил.","question_zh":"熊猫，你怎么哭了？ 我弟弟丢了。","answer":"(нээлттэй)","explanation_mn":"Аудио 09-04-ийн хамт."}]},
 "answerSource":"YCT 标准教程 3 · Test Listening Scripts, Test Answers (Lesson 9)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("ku","哭"),("xiao","笑"),("dongxi","东西"),("diu","丢"),("dao","到")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"笑一笑！","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你怎么哭了？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"别哭，我们一起找一找。","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"小熊猫，去学校","role":"illustration","section":"song"},
 {"id":"story","file":"images/story.png","title":"弟弟丢了 · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in [5,6,7,8]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 3 · 9-р хичээл — Инээмсэглээрэй!","chineseTitle":"笑一笑！","targetTitle":"笑一笑！","mongolianTitle":"Инээмсэглээрэй!",
 "subtitle":"哭 · 笑 · 东西 · 丢 · 找到了 · «弟弟丢了» үлгэр",
 "description":f"Уйлсан найзаа тайвшруулж (别哭), алдсан юмаа хамт хайж (找一找) сурна. {len(vocab)} үг, 2 зурагт яриа, chant «小熊猫», Mini story «弟弟丢了», {len(grammar)} дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"😊","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 3",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 3 — 第9课《笑一笑！》 [hskLevel=2] [lessonNumber=9]; эх: сурах бичиг х.43–47; аудио CD 09-01…09-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"笑一笑！","mongolianTitle":"Инээмсэглээрэй!",
 "series":"YCT 标准教程 3","seriesLabel_mn":"YCT 3 — Хүүхдийн хятад хэл (≈HSK2)",
 "source":"YCT 标准教程 3 · 第9课 (сурах бичиг + CD аудио 09-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй (ASR ажиллаагүй) — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L9)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
