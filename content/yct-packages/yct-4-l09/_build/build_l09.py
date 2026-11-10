#!/usr/bin/env python3
"""YCT 标准教程 4 · 第9课 你是什么时候去的？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
OUT = "/home/claude/work/yct4/l09/pkg"
CID, LID, N = "yct-4", "yct-4-l09", 9
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

from PIL import Image
_S = 1.5
_pg = Image.open("/home/claude/work/yct4/l09/pages/hi-54.png").convert("RGB")
_BOX = {"t5":(131,430,252,508),"t6":(131,590,252,692),"t7":(131,750,252,847),"t8":(131,903,252,1006)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct4/l09/pages/hi-53.png").convert("RGB").crop((int(60*_S),int(200*_S),int(790*_S),int(1010*_S))).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_CHANT, AUD_STORY, AUD_TEST = [f"audio/yct-4-09-0{i}.mp3" for i in (1,2,3,4,5)]
AUD_MAIN = "audio/yct-4-09-text-song.mp3"
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"{OUT}/{AUD_TEXT}","-i",f"{OUT}/{AUD_CHANT}","-filter_complex","[0:a][1:a]concat=n=2:v=0:a=1[a]","-map","[a]","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)

# ---------------- VOCAB ----------------
VOCAB = [
 ("时候","shíhou","цаг, үе","нэр үг · гол үг","你是什么时候去的？","Nǐ shì shénme shíhou qù de?","Чи хэзээ явсан юм бэ?",True),
 ("去年","qùnián","өнгөрсөн жил","нэр үг · гол үг","我是去年8月去的。","Wǒ shì qùnián bā yuè qù de.","Би өнгөрсөн жилийн 8-р сард явсан.",True),
 ("次","cì","удаа","хэмжих үг · гол үг","那是我第一次坐飞机。","Nà shì wǒ dì yī cì zuò fēijī.","Миний онгоцонд анх удаа суусан нь тэр байсан.",True),
 ("飞机","fēijī","онгоц","нэр үг · гол үг","我们是坐飞机去的。","Wǒmen shì zuò fēijī qù de.","Бид онгоцоор явсан.",True),
 ("累","lèi","ядарсан, ядрах","тэмдэг нэр · гол үг","坐飞机有一点儿累。","Zuò fēijī yǒu yìdiǎnr lèi.","Онгоцоор явахад жаахан ядардаг.",True),
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
 {"id":1,"title_mn":"Яриа 1 · Газрын зургийн өмнө","scene_mn":"Мари, Дэвид хоёр дэлхийн газрын зургийн өмнө зогсоод Хятадад очиж байсан эсэхээ ярилцаж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"玛丽","zh":"你去过中国吗？","pinyin":"Nǐ qùguo Zhōngguó ma?","mn":"Чи Хятадад очиж үзсэн үү?"},
           {"speaker":"大卫","zh":"去过，你呢？","pinyin":"Qùguo, nǐ ne?","mn":"Очиж үзсэн. Чи?"},
           {"speaker":"玛丽","zh":"我没去过。你是什么时候去的？","pinyin":"Wǒ méi qùguo. Nǐ shì shénme shíhou qù de?","mn":"Би очоогүй. Чи хэзээ явсан юм бэ?"},
           {"speaker":"大卫","zh":"我是去年8月去的。","pinyin":"Wǒ shì qùnián bā yuè qù de.","mn":"Би өнгөрсөн жилийн 8-р сард явсан."}]},
 {"id":2,"title_mn":"Яриа 2 · Онгоцоор Хятад руу","scene_mn":"Дэвид өнгөрсөн жил аав ээжтэйгээ онгоцоор Хятад руу явсан тухайгаа ярьж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"大卫","zh":"去年，我和爸爸妈妈去了中国。我们是坐飞机去的，那是我第一次坐飞机。","pinyin":"Qùnián, wǒ hé bàba māma qùle Zhōngguó. Wǒmen shì zuò fēijī qù de, nà shì wǒ dì yī cì zuò fēijī.","mn":"Өнгөрсөн жил би аав ээжтэйгээ Хятад явсан. Бид онгоцоор явсан. Миний онгоцонд анх удаа суусан нь тэр байсан."},
           {"speaker":"大卫","zh":"中国很远，我们飞了十三个小时，有一点儿累，但是我们都很高兴。","pinyin":"Zhōngguó hěn yuǎn, wǒmen fēile shísān ge xiǎoshí, yǒu yìdiǎnr lèi, dànshì wǒmen dōu hěn gāoxìng.","mn":"Хятад хол. Бид арван гурван цаг нисч, жаахан ядарсан ч бүгдээрээ баяртай байсан."}]},
]
sentences=[]
dlg = [
 (1,"玛丽：你去过中国吗？","Mǎlì: Nǐ qùguo Zhōngguó ma?","Мари: Чи Хятадад очиж үзсэн үү?","玛丽：| 你|nǐ 去过|qùguo 中国|Zhōngguó 吗|ma ？|","去过 = очиж үзсэн. «Очиж байсан уу?» гэж асуухдаа «去过……吗？» гэнэ.",["你去过中国吗？"]),
 (1,"大卫：去过，你呢？","Dàwèi: Qùguo, nǐ ne?","Дэвид: Очиж үзсэн. Чи?","大卫：| 去过|qùguo ，| 你|nǐ 呢|ne ？|","",[]),
 (1,"玛丽：我没去过。你是什么时候去的？","Mǎlì: Wǒ méi qùguo. Nǐ shì shénme shíhou qù de?","Мари: Би очоогүй. Чи хэзээ явсан юм бэ?","玛丽：| 我|wǒ 没|méi 去过|qùguo 。| 你|nǐ 是|shì 什么|shénme 时候|shíhou 去|qù 的|de ？|","没去过 = очиж үзээгүй. «是……的» нь өнгөрсөн явдлыг «хэзээ, яаж» гэж асуух үед хэрэглэгдэнэ.",["你是什么时候去的？"]),
 (1,"大卫：我是去年8月去的。","Dàwèi: Wǒ shì qùnián bā yuè qù de.","Дэвид: Би өнгөрсөн жилийн 8-р сард явсан.","大卫：| 我|wǒ 是|shì 去年|qùnián 8| 月|yuè 去|qù 的|de 。|","去年 = өнгөрсөн жил. 8月 = 8-р сар.",["我是去年8月去的。"]),
 (2,"大卫：去年，我和爸爸妈妈去了中国。","Dàwèi: Qùnián, wǒ hé bàba māma qùle Zhōngguó.","Дэвид: Өнгөрсөн жил би аав ээжтэйгээ Хятад явсан.","大卫：| 去年|qùnián ，| 我|wǒ 和|hé 爸爸|bàba 妈妈|māma 去|qù 了|le 中国|Zhōngguó 。|","",[]),
 (2,"我们是坐飞机去的，那是我第一次坐飞机。","Wǒmen shì zuò fēijī qù de, nà shì wǒ dì yī cì zuò fēijī.","Бид онгоцоор явсан. Миний онгоцонд анх удаа суусан нь тэр байсан.","我们|wǒmen 是|shì 坐|zuò 飞机|fēijī 去|qù 的|de ，| 那|nà 是|shì 我|wǒ 第一次|dì yī cì 坐|zuò 飞机|fēijī 。|","第一次 = анх удаа. 第二次 = хоёр дахь удаа.",["我们是坐飞机去的。"]),
 (2,"中国很远，我们飞了十三个小时，有一点儿累，但是我们都很高兴。","Zhōngguó hěn yuǎn, wǒmen fēile shísān ge xiǎoshí, yǒu yìdiǎnr lèi, dànshì wǒmen dōu hěn gāoxìng.","Хятад хол. Бид арван гурван цаг нисч, жаахан ядарсан ч бүгдээрээ баяртай байсан.","中国|Zhōngguó 很|hěn 远|yuǎn ，| 我们|wǒmen 飞|fēi 了|le 十三|shísān 个|ge 小时|xiǎoshí ，| 有一点儿|yǒu yìdiǎnr 累|lèi ，| 但是|dànshì 我们|wǒmen 都|dōu 很|hěn 高兴|gāoxìng 。|","有一点儿累 = жаахан ядарсан.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
chant = [
 ("一二三，三二一，","Yī èr sān, sān èr yī,","Нэг, хоёр, гурав, гурав, хоёр, нэг,","一二三|yī èr sān ，| 三二一|sān èr yī ，|"),
 ("我和爸爸坐飞机。","wǒ hé bàba zuò fēijī.","Би аавтайгаа онгоцонд суув.","我|wǒ 和|hé 爸爸|bàba 坐|zuò 飞机|fēijī 。|"),
 ("坐上飞机去哪里？","Zuò shang fēijī qù nǎlǐ?","Онгоцонд суугаад хаашаа явах вэ?","坐上|zuò shang 飞机|fēijī 去|qù 哪里|nǎlǐ ？|"),
 ("我们飞到中国去。","Wǒmen fēi dào Zhōngguó qu.","Бид Хятад руу нисэнэ.","我们|wǒmen 飞到|fēi dào 中国|Zhōngguó 去|qu 。|"),
 ("中国大，人口多。","Zhōngguó dà, rénkǒu duō.","Хятад том, хүн ам нь олон.","中国|Zhōngguó 大|dà ，| 人口|rénkǒu 多|duō 。|"),
 ("黄河黄，长江长。","Huánghé huáng, Chángjiāng cháng.","Шар мөрөн шаргал, Чанзи мөрөн урт.","黄河|Huánghé 黄|huáng ，| 长江|Chángjiāng 长|cháng 。|"),
 ("高山草原真美丽！","Gāoshān cǎoyuán zhēn měilì!","Өндөр уул, тал нутаг үнэхээр сайхан!","高山|gāoshān 草原|cǎoyuán 真|zhēn 美丽|měilì ！|"),
 ("一二三，三二一，","Yī èr sān, sān èr yī,","Нэг, хоёр, гурав, гурав, хоёр, нэг,","一二三|yī èr sān ，| 三二一|sān èr yī ，|"),
 ("我和妈妈坐飞机。","wǒ hé māma zuò fēijī.","Би ээжтэйгээ онгоцонд суув.","我|wǒ 和|hé 妈妈|māma 坐|zuò 飞机|fēijī 。|"),
 ("坐上飞机去哪里？","Zuò shang fēijī qù nǎlǐ?","Онгоцонд суугаад хаашаа явах вэ?","坐上|zuò shang 飞机|fēijī 去|qù 哪里|nǎlǐ ？|"),
 ("我们飞到北京去。","Wǒmen fēi dào Běijīng qu.","Бид Бээжин рүү нисэнэ.","我们|wǒmen 飞到|fēi dào 北京|Běijīng 去|qu 。|"),
 ("爬长城，吃烤鸭，","Pá Chángchéng, chī kǎoyā,","Их хэрэмд авирна, шарсан нугас идэнэ,","爬|pá 长城|Chángchéng ，| 吃|chī 烤鸭|kǎoyā ，|"),
 ("去故宫，听京剧。","qù Gùgōng, tīng jīngjù.","Хаадын ордонд очно, Бээжингийн дуурь сонсоно.","去|qù 故宫|Gùgōng ，| 听|tīng 京剧|jīngjù 。|"),
 ("一定学会说汉语。","Yídìng xuéhuì shuō Hànyǔ.","Хятадаар ярьж сурна гэдэгтээ итгэлтэй байна.","一定|yídìng 学会|xuéhuì 说|shuō 汉语|Hànyǔ 。|"),
]
for i,(zh,py,mn,tk) in enumerate(chant):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Let's chant «坐飞机» (Онгоцоор явья) — хоёр хэсэгтэй. Гараа жигүүр шиг дэлгээд, онгоц шиг «нисч» хэлээрэй!"
    if i==3: s["note"]="飞到中国去 = Хятад руу нисэх."
    if i==7: s["note"]="Хоёр дахь хэсэг — ээжтэйгээ Бээжин рүү нисэх замнал."
    if i==11: s["note"]="长城 = Их хэрэм, 烤鸭 = шарсан нугас."
    if i==12: s["note"]="故宫 = Бээжингийн хаадын ордон. 京剧 = Бээжингийн дуурь."
    sentences.append(s)
story = [
 ("小熊猫：妈妈，哥哥去年坐飞机回家了，我什么时候回家？","Xiǎo xióngmāo: Māma, gēge qùnián zuò fēijī huíjiā le, wǒ shénme shíhou huíjiā?","Бяцхан панда: Ээж ээ, ах өнгөрсөн жил онгоцоор гэртээ харьсан шүү дээ. Би хэзээ гэртээ харих вэ?","小熊猫：| 妈妈|māma ，| 哥哥|gēge 去年|qùnián 坐|zuò 飞机|fēijī 回家|huíjiā 了|le ，| 我|wǒ 什么|shénme 时候|shíhou 回家|huíjiā ？|"),
 ("妈妈：你太小，坐飞机回家会很累的。","Māma: Nǐ tài xiǎo, zuò fēijī huíjiā huì hěn lèi de.","Ээж: Чи дэндүү жижиг байна. Онгоцоор харивал маш ядарна шүү.","妈妈：| 你|nǐ 太|tài 小|xiǎo ，| 坐|zuò 飞机|fēijī 回家|huíjiā 会|huì 很|hěn 累|lèi 的|de 。|"),
 ("小熊猫：我们的家很远吗？我们的家在哪儿？","Xiǎo xióngmāo: Wǒmen de jiā hěn yuǎn ma? Wǒmen de jiā zài nǎr?","Бяцхан панда: Манай гэр хол уу? Манай гэр хаана вэ?","小熊猫：| 我们|wǒmen 的|de 家|jiā 很|hěn 远|yuǎn 吗|ma ？| 我们|wǒmen 的|de 家|jiā 在|zài 哪儿|nǎr ？|"),
 ("妈妈：我们的家在中国。","Māma: Wǒmen de jiā zài Zhōngguó.","Ээж: Манай гэр Хятадад байгаа.","妈妈：| 我们|wǒmen 的|de 家|jiā 在|zài 中国|Zhōngguó 。|"),
 ("小熊猫：我们的家什么样？","Xiǎo xióngmāo: Wǒmen de jiā shénmeyàng?","Бяцхан панда: Манай гэр ямар вэ?","小熊猫：| 我们|wǒmen 的|de 家|jiā 什么样|shénmeyàng ？|"),
 ("妈妈：那里有大大的广场、长长的墙和高高的山。","Māma: Nàli yǒu dàdà de guǎngchǎng, chángcháng de qiáng hé gāogāo de shān.","Ээж: Тэнд асар том талбай, урт хэрэм, өндөр өндөр уул бий.","妈妈：| 那里|nàli 有|yǒu 大大|dàdà 的|de 广场|guǎngchǎng ，| 长长|chángcháng 的|de 墙|qiáng 和|hé 高高|gāogāo 的|de 山|shān 。|"),
 ("小熊猫：有竹子吗？","Xiǎo xióngmāo: Yǒu zhúzi ma?","Бяцхан панда: Бамбай байдаг уу?","小熊猫：| 有|yǒu 竹子|zhúzi 吗|ma ？|"),
 ("妈妈：有，那里有最好的竹子！","Māma: Yǒu, nàli yǒu zuì hǎo de zhúzi!","Ээж: Байлгүй яахав, тэнд хамгийн сайхан бамбай бий!","妈妈：| 有|yǒu ，| 那里|nàli 有|yǒu 最|zuì 好|hǎo 的|de 竹子|zhúzi ！|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":4,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «我们的家在哪儿？» (Манай гэр хаана вэ?) — 4 зурагт үлгэр. Бяцхан панда ээжээсээ гэрийнхээ тухай асууна."
    if i==5: s["note"]="大大的 = том том, 长长的 = урт урт, 高高的 = өндөр өндөр — үгээ давтвал «маш» гэсэн утга нэмэгдэнэ."
    if i==6: s["note"]="最好 = хамгийн сайн."
    sentences.append(s)

texts = {
 "unit":{"number":"9","title":"你是什么时候去的？","mongolianTitle":"Чи хэзээ явсан юм бэ? — өнгөрсөн жил, онгоцоор аялах"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи YCT 1–3-ийг дуусгасан болохоор аль хэдийн 300 орчим үг мэддэг болжээ. Чи өмнөх номнуудад газар, цаг, тоо хэлж сурсан. Одоо нэг алхам урагшилна. Чи хаашаа явсан бэ? Хэзээ явсан бэ? Юугаар явсан бэ? Өнөөдөр «我是去年8月去的» гэж хэзээ явсанаа, «我们是坐飞机去的» гэж яаж явсанаа хэлж сурна. Бас бяцхан пандын «Манай гэр хаана вэ?» үлгэрийг уншина. Онгоц шиг гараа дэлгээд нисэхэд бэлэн үү? Эхэлцгээе!",
  "warmup_mn":"Чи онгоцонд суусан уу? Хаашаа явсан бэ? Хэзээ, юугаар явсан бэ?",
  "theme_zh":"时候 · 去年 · 次 · 飞机 · 累","theme_mn":"хэзээ · өнгөрсөн жил · удаа · онгоц · ядарсан"},
 "warmup":{"mongolian":"Чи хаашаа аялж үзсэн бэ? Тэнд юугаар явсан бэ — машинаар уу, галт тэргээр үү, онгоцоор уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"9","title":"你是什么时候去的？","mongolianTitle":"Чи хэзээ явсан юм бэ? — яриа, chant, үлгэр","title_mn":"Let's read · 2 яриа + Let's chant «坐飞机» + Mini story · 我们的家在哪儿？","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 4 · 第9课 Let's read / Let's chant / Mini story（CD 09-02, 09-03, 09-04）","author_zh":"",
  "intro_zh":"两段对话：你是什么时候去的？我们是坐飞机去的。然后唱歌谣《坐飞机》，读小故事《我们的家在哪儿？》。",
  "intro_mn":"Эхлээд хоёр яриа: «你是什么时候去的？» гэж хэзээ явсныг асууна, «我们是坐飞机去的» гэж яаж явсанаа хэлнэ. Дараа нь «坐飞机» chant-ыг онгоц шиг гараа дэлгээд хэл. Эцэст нь бяцхан пандын үлгэрийг унш. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Мари Хятадад очоогүй. Дэвид очиж үзсэн. Мари «Хэзээ явсан бэ?» гэж асуухад Дэвид «Өнгөрсөн жилийн 8-р сард» гэж хариулна."},
   {"paragraph":2,"mn":"Яриа 2 — Дэвид аав ээжтэйгээ онгоцоор Хятад явсан. Энэ нь анх удаа онгоцонд суусан нь байлаа. 13 цаг нисч жаахан ядарсан ч бүгд баяртай байсан."},
   {"paragraph":3,"mn":"Chant «坐飞机» — Аав, ээжтэйгээ онгоцонд суугаад Хятад, Бээжин рүү нисэнэ. Их хэрэмд авирч, шарсан нугас идэнэ. Аудио: 09-03."},
   {"paragraph":4,"mn":"Үлгэр «我们的家在哪儿？» — Бяцхан панда гэртээ харихыг хүсэв. Ээж нь «Чи жижиг, онгоцоор ядарна» гэнэ. Манай гэр Хятадад, тэнд том талбай, урт хэрэм, өндөр уул, хамгийн сайхан бамбай бий. Аудио: 09-04."}],
  "reflection":{"questions_mn":["Чи хаашаа явж байсан бэ? «我去过……» гэж хэлж үз.","Чи хэзээ, юугаар явсан бэ? «我是……去的» гэж хэл.","Чиний мөрөөдлийн газар хаана вэ? Тэнд юу байдаг вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Хэзээ явсанаа хэл","zh":"我是去年8月去的。","pinyin":"Wǒ shì qùnián bā yuè qù de.","mn":"Би өнгөрсөн жилийн 8-р сард явсан."},
  "writingPrompt_mn":"Найзаасаа «你去过……吗？» гэж асуугаад «你是什么时候去的？» гэж үз. Дараа нь «你是怎么去的？» гэж асуу."},
 "properNouns":[{"zh":"中国","pinyin":"Zhōngguó","mn":"Хятад"},{"zh":"北京","pinyin":"Běijīng","mn":"Бээжин"},{"zh":"长城","pinyin":"Chángchéng","mn":"Их хэрэм"},{"zh":"故宫","pinyin":"Gùgōng","mn":"Гу гун (хаадын ордон)"}],
 "wordExplanation":[
  {"word":"是……的","gloss":"shì … de — хэзээ, яаж явсан бэ","explanation":"Чи ямар нэг юм хийсэн бол «хэзээ?», «яаж?» гэж асууж болно. Хариулахдаа «是» ба «的»-ийн хооронд хэзээ эсвэл яаж гэдгээ хий. Жишээ нь: «我是去年8月去的» — Би өнгөрсөн жилийн 8-р сард явсан. «我们是坐飞机去的» — Бид онгоцоор явсан.",
   "structure":"我是 + хэзээ / яаж + явсан үйл + 的","teacher_notes":"Хүүхдүүдээс «你是什么时候去的？» гэж асуугаад «我是去年……去的» гэж хариулуул.",
   "examples":[{"chinese":"我是去年8月去的。","pinyin":"Wǒ shì qùnián bā yuè qù de.","mongolian":"Би өнгөрсөн жилийн 8-р сард явсан."},{"chinese":"我们是坐飞机去的。","pinyin":"Wǒmen shì zuò fēijī qù de.","mongolian":"Бид онгоцоор явсан."},{"chinese":"我是坐公共汽车去的。","pinyin":"Wǒ shì zuò gōnggòng qìchē qù de.","mongolian":"Би автобусаар явсан."}],
   "common_mistakes":[{"wrong":"我是去年去的了。","right":"我是去年去的。","why":"«是……的» өгүүлбэрийн төгсгөлд «了» нэмдэггүй."}],
   "check":{"question":"«Би өнгөрсөн жил явсан» хятадаар:","options":["我是去年去的。","我去过北京。","我很累。"],"answer":"0"},
   "practice":[{"n":1,"question":"我 ________ 去年去的。(是)","answer":"是","explanation_mn":"«是……的» — хоёр үг хамт ордог."}]},
  {"word":"时候 · 去年 · 次","gloss":"shíhou · qùnián · cì — хэзээ, өнгөрсөн жил, удаа","explanation":"什么时候 = хэзээ. 去年 = өнгөрсөн жил. 第一次 = анх удаа, 第二次 = хоёр дахь удаа. Жишээ нь: «那是我第一次坐飞机» — Миний онгоцонд анх удаа суусан нь тэр байсан.",
   "structure":"什么时候 · 去年 + сар · 第 + тоо + 次","teacher_notes":"Хүүхдүүд «Чи хэд дэх удаа ... вэ?» гэж бие биедээ асуугаад үз.",
   "examples":[{"chinese":"你是什么时候去的？","pinyin":"Nǐ shì shénme shíhou qù de?","mongolian":"Чи хэзээ явсан юм бэ?"},{"chinese":"我是去年8月去的。","pinyin":"Wǒ shì qùnián bā yuè qù de.","mongolian":"Би өнгөрсөн жилийн 8-р сард явсан."},{"chinese":"那是我第一次坐飞机。","pinyin":"Nà shì wǒ dì yī cì zuò fēijī.","mongolian":"Миний онгоцонд анх удаа суусан нь тэр байсан."}],
   "common_mistakes":[{"wrong":"我一次第坐飞机。","right":"我第一次坐飞机。","why":"«第» эхэнд, дараа нь тоо, хамгийн сүүлд «次» орно."}],
   "check":{"question":"«Анх удаа» хятадаар:","options":["第一次","去年","时候"],"answer":"0"},
   "practice":[{"n":1,"question":"你是什么 ________ 去的？(хэзээ)","answer":"时候","explanation_mn":"«Хэзээ» — 什么时候."}]},
  {"word":"去过 · 有一点儿累","gloss":"qùguo · yǒu yìdiǎnr lèi — очиж үзсэн, жаахан ядарсан","explanation":"去过 = очиж үзсэн. Очоогүй бол «没去过». 有一点儿累 = жаахан ядарсан. 很累 бол маш ядарсан. Үлгэрт ээж бяцхан пандад «Чи жижиг, онгоцоор маш ядарна» гэж хэлсэн.",
   "structure":"去过 + газар · 没去过 · 有一点儿 + ядарсан","teacher_notes":"«你去过中国吗？» гэж асууж, «去过 / 没去过» гэж хариулуул.",
   "examples":[{"chinese":"你去过中国吗？","pinyin":"Nǐ qùguo Zhōngguó ma?","mongolian":"Чи Хятадад очиж үзсэн үү?"},{"chinese":"我没去过。","pinyin":"Wǒ méi qùguo.","mongolian":"Би очоогүй."},{"chinese":"坐飞机有一点儿累。","pinyin":"Zuò fēijī yǒu yìdiǎnr lèi.","mongolian":"Онгоцоор явахад жаахан ядардаг."}],
   "common_mistakes":[{"wrong":"我不去过中国。","right":"我没去过中国。","why":"«去过»-ийг үгүйсгэхдээ «没» хэрэглэнэ, «不» биш."}],
   "check":{"question":"«Би очиж үзээгүй» хятадаар:","options":["我没去过。","我不累。","我去年去的。"],"answer":"0"},
   "practice":[{"n":1,"question":"我 ________ 去过中国。(үгүй)","answer":"没","explanation_mn":"«Очоогүй» — 没去过."}]},
 ],
 "collocations":[{"type":"Аялал, явах арга","rows":[
   {"head":"坐","with":"飞机","mn":"онгоцоор явах","usage_mn":"Тээврийн хэрэгсэлд суухыг «坐» гэнэ","example":{"zh":"我们是坐飞机去的。","pinyin":"Wǒmen shì zuò fēijī qù de.","mn":"Бид онгоцоор явсан."}},
   {"head":"第一","with":"次","mn":"анх удаа","usage_mn":"Тоо + 次 = удаа","example":{"zh":"那是我第一次坐飞机。","pinyin":"Nà shì wǒ dì yī cì zuò fēijī.","mn":"Миний онгоцонд анх удаа суусан нь тэр байсан."}},
   {"head":"有一点儿","with":"累","mn":"жаахан ядарсан","usage_mn":"Мэдрэмжээ хэлэхэд","example":{"zh":"有一点儿累。","pinyin":"Yǒu yìdiǎnr lèi.","mn":"Жаахан ядарсан."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["时候","去年","次","飞机","累"],"items":[
     {"n":1,"question":"你是什么 ________ 去的？","answer":"时候","explanation_mn":"«Хэзээ» — 什么时候."},
     {"n":2,"question":"我是 ________ 8月去的。","answer":"去年","explanation_mn":"«Өнгөрсөн жил» — 去年."},
     {"n":3,"question":"那是我第一 ________ 坐飞机。","answer":"次","explanation_mn":"«Анх удаа» — 第一次."},
     {"n":4,"question":"我们是坐 ________ 去的。","answer":"飞机","explanation_mn":"«Онгоцоор» — 坐飞机."},
     {"n":5,"question":"我有一点儿 ________ 。","answer":"累","explanation_mn":"«Жаахан ядарсан» — 有一点儿累."}]}],
   "answer_source":"agent-authored (YCT 4 · 9-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"男孩是什么时候去中国的？","answer":"去年8月。","explanation_mn":"Яриа 1 — Дэвид «我是去年8月去的» гэсэн."},
     {"n":2,"question_zh":"他们是怎么去中国的？","answer":"坐飞机去的。","explanation_mn":"Яриа 2 — «我们是坐飞机去的» гэсэн. Тэд арван гурван цаг нисчээ."}],
   "answer_source":"textbook_verified (Let's read, х.44 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Touch the Card · Картыг хүр","start_zh":"时候！去年！飞机！","instruction_mn":"Хичээлийн 5 үгийг (时候, 去年, 次, 飞机, 累) тус тусад нь цаасан дээр бич. Нэг хүн үгийг чангаар уншина. Бусад нь тэр картыг хамгийн түрүүнд гараараа хүрнэ. Хурдан нь хожно!"},
     {"label":"Газрын зураг дээр тэмдэглэ","start_zh":"我去过北京。","instruction_mn":"Газрын зураг дээр очиж үзсэн газраа тэмдэглэ. Дараа нь найздаа «我去过……，我是去年去的，我是坐……去的» гэж хэл. Найз чинь яаж явснаа хэлэхэд чи тэмдэглэ!"},
     {"label":"Өгүүлбэр бүтээ","start_zh":"我是坐飞机去的。","instruction_mn":"Гурван хайрцагнаас нэг нэг үг ав: газар (新学校, 医院, 动物园, 北京), цаг (去年, 上星期, 昨天), арга (坐飞机, 开车). Тэгээд «我去过北京，我是去年去的，我是坐飞机去的» шиг өгүүлбэр бүтээ!"},
     {"label":"坐飞机 chant · онгоц шиг","start_zh":"一二三，三二一！","instruction_mn":"Гараа жигүүр шиг дэлгээд chant-аа чангаар хэл. «飞到中国去» гэхдээ өрөөгөөр «нис». Гэрийнхэнтэйгээ хамт хий!"},
     {"label":"Мөрөөдлөө хэл","start_zh":"我们的家在哪儿？","instruction_mn":"Үлгэрийн бяцхан панда шиг өөрийн мөрөөдлийн газраа ярь: «Тэнд юу байдаг вэ?» Найз чинь асуулт асууна: «有……吗？» Чи «有！» гэж хариул."}]}},
 "grammarNotes":[],
 "culture":{"title":"长城","title_mn":"Хятадын Их хэрэм — урт хана","text_mn":"Chant-д «爬长城» гэж гардаг Их хэрэм бол дэлхийн хамгийн урт хэрмүүдийн нэг. Түүнийг олон мянган жилийн турш байгуулсан бөгөөд хэдэн мянган километр үргэлжилдэг. Хятад хүүхдүүд сургуулийн аяллаар Бээжин дэх Их хэрэмд авирдаг. Чи Их хэрэмд авирмаар байна уу?","note_mn":"Чиний хамгийн дуртай аялсан газар хаана вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — хэзээ, яаж явснаа хэлэх.","topic":"Чи хаашаа явсан бэ?","discussion":["Хосоороо: «你去过……吗？» гэж асуу. Дараа нь «你是什么时候去的？ 你是怎么去的？» гэж үз.","Газрын зураг дээр очсон газраа тэмдэглээд ангийнхандаа хэл."],
   "writing":{"promptChinese":"我去过……，我是……去的，我是坐……去的。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «你是什么时候去的？» гэж хятадаар асуугаад хариултыг нь сонс.","minChars":"0","requiredWords":["去年","飞机"],"sampleChinese":"我去过北京，我是去年去的，我是坐飞机去的。","sampleMongolian":"Би Бээжин явж үзсэн. Өнгөрсөн жил, онгоцоор явсан.","gradingRubric":"是……的 бүтцийг зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 4 · Test Answers: L9 1.C 2.A 3.B 4.B 5.A 6.B 7.A 8.C","parts":[]},
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
 {"point":"我是去年8月去的。 — хэзээ явсан бэ","gloss_mn":"«Би өнгөрсөн жилийн 8-р сард явсан» — цагаа хэлэх",
  "structure":"我是 + цаг + 去 + 的",
  "teacher_mn":"Хэзээ явснаа хэлэхдээ «是» ба «的»-ийн дунд цагаа хий. «我是去年8月去的.» Асуухдаа «你是什么时候去的？» гэнэ. «是» ба «的» хоёр нь хамт явдаг найзууд шиг шүү!",
  "teacher_notes":"Номын яриа 1: 你是什么时候去的？ 我是去年8月去的。",
  "examples":[ex("你是什么时候去的？","Nǐ shì shénme shíhou qù de?","Чи хэзээ явсан юм бэ?"),ex("我是去年8月去的。","Wǒ shì qùnián bā yuè qù de.","Би өнгөрсөн жилийн 8-р сард явсан."),ex("你是什么时候去北京的？","Nǐ shì shénme shíhou qù Běijīng de?","Чи Бээжин рүү хэзээ явсан юм бэ?")],
  "common_mistakes":[{"wrong":"我是去年去的了。","right":"我是去年去的。","why":"«是……的» өгүүлбэрийн төгсгөлд «了» нэмдэггүй."}],
  "check":chk("«Чи хэзээ явсан юм бэ?» хятадаар:",["你是什么时候去的？","你去过中国吗？","你累吗？"],"你是什么时候去的？","g1c"),
  "exercises":[
   choice("我 ________ 去年8月去的。",["是","没","有"],"是","Зөв! 我是……去的.","«是……的» бүтцэд «是» орно.","g1e1"),
   choice("«Би өнгөрсөн жил явсан» хятадаар:",["我是去年去的。","我去过北京。","我没去过。"],"我是去年去的。","Зөв! 去年 = өнгөрсөн жил.","去年 = өнгөрсөн жил.","g1e2"),
   judge("«你是什么时候去的？» гэдэг нь «Чи хэзээ явсан бэ?» гэсэн асуулт.",True,"Зөв!","什么时候 = хэзээ.")]},
 {"point":"我们是坐飞机去的。 — яаж явсан бэ","gloss_mn":"«Бид онгоцоор явсан» — явсан аргаа хэлэх",
  "structure":"我们是 + 坐 + тээвэр + 去的",
  "teacher_mn":"Юугаар явснаа хэлэхдээ «坐» гэж хэлээд тээврийн хэрэгслээ нэм. «坐飞机» = онгоцоор, «坐公共汽车» = автобусаар. Асуухдаа «你是怎么去的？» гэнэ. Машинаа өөрөө жолоодвол «开车».",
  "teacher_notes":"Номын Let's match: 你是怎么去的？ 我是坐公共汽车去的。",
  "examples":[ex("我们是坐飞机去的。","Wǒmen shì zuò fēijī qù de.","Бид онгоцоор явсан."),ex("你是怎么去的？","Nǐ shì zěnme qù de?","Чи яаж явсан бэ?"),ex("我是坐公共汽车去的。","Wǒ shì zuò gōnggòng qìchē qù de.","Би автобусаар явсан.")],
  "common_mistakes":[{"wrong":"我们是飞机坐去的。","right":"我们是坐飞机去的。","why":"«坐» нь «飞机»-ийн өмнө орно."}],
  "check":chk("«Бид онгоцоор явсан» хятадаар:",["我们是坐飞机去的。","我们是去年去的。","我们很累。"],"我们是坐飞机去的。","g2c"),
  "exercises":[
   choice("我们是 ________ 飞机去的。",["坐","去","吃"],"坐","Зөв! 坐飞机 = онгоцоор.","坐 = суух, тээврээр явах.","g2e1"),
   choice("«Чи яаж явсан бэ?» хятадаар:",["你是怎么去的？","你是什么时候去的？","你去过吗？"],"你是怎么去的？","Зөв! 怎么 = яаж.","怎么 = яаж, 什么时候 = хэзээ.","g2e2"),
   judge("«坐飞机» гэдэг нь «онгоцоор явах» гэсэн үг.",True,"Зөв!","坐飞机 = онгоцоор явах.")]},
 {"point":"去过 · 没去过 · 第一次 · 有一点儿累","gloss_mn":"«Очиж үзсэн», «очоогүй», «анх удаа», «жаахан ядарсан»",
  "structure":"去过 + газар → 没去过 · 第 + тоо + 次 · 有一点儿 + мэдрэмж",
  "teacher_mn":"«你去过中国吗？» — «Чи Хятадад очиж үзсэн үү?» Очсон бол «去过», очоогүй бол «没去过». Анх удаа бол «第一次». Жаахан ядарсан бол «有一点儿累».",
  "teacher_notes":"Номын яриа: 你去过中国吗？ 去过，你呢？ 我没去过。 · Яриа 2: 那是我第一次坐飞机。有一点儿累。",
  "examples":[ex("你去过中国吗？","Nǐ qùguo Zhōngguó ma?","Чи Хятадад очиж үзсэн үү?"),ex("我没去过。","Wǒ méi qùguo.","Би очоогүй."),ex("那是我第一次坐飞机。","Nà shì wǒ dì yī cì zuò fēijī.","Миний онгоцонд анх удаа суусан нь тэр байсан."),ex("坐飞机有一点儿累。","Zuò fēijī yǒu yìdiǎnr lèi.","Онгоцоор явахад жаахан ядардаг.")],
  "common_mistakes":[{"wrong":"我不去过中国。","right":"我没去过中国。","why":"«去过»-ийг үгүйсгэхэд «没» хэрэглэнэ."}],
  "check":chk("«Би очоогүй» хятадаар:",["我没去过。","我是去年去的。","我很累。"],"我没去过。","g3c"),
  "exercises":[
   choice("我 ________ 去过中国。(үгүй)",["没","不","是"],"没","Зөв! 没去过 = очоогүй.","去过-ийн үгүйсгэл — 没去过.","g3e1"),
   choice("«Анх удаа» хятадаар:",["第一次","第二次","去年"],"第一次","Зөв! 第一次 = анх удаа.","第一 = эхний, 次 = удаа.","g3e2"),
   judge("«有一点儿累» гэдэг нь «жаахан ядарсан» гэсэн үг.",True,"Зөв!","有一点儿 = жаахан.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Онгоц» хятадаар аль нь вэ?",["飞机","医院","学校","北京"],"飞机","飞机 (fēijī) = онгоц.","easy",["vocabulary"],"b1")
q("choice","«Өнгөрсөн жил» хятадаар аль нь вэ?",["去年","昨天","星期","时候"],"去年","去年 (qùnián) = өнгөрсөн жил.","easy",["vocabulary"],"b2")
q("choice","«Ядарсан» хятадаар аль нь вэ?",["累","高兴","远","小"],"累","累 (lèi) = ядарсан.","easy",["vocabulary"],"b3")
q("choice","«次» гэдэг үг ямар утгатай вэ?",["удаа","цаг","онгоц","өнгөрсөн жил"],"удаа","次 (cì) = удаа. 第一次 = анх удаа.","easy",["vocabulary"],"b4")
q("choice","«时候» гэдэг үг ямар утгатай вэ?",["цаг, үе","удаа","ядарсан","онгоц"],"цаг, үе","时候 (shíhou). 什么时候 = хэзээ.","easy",["vocabulary"],"b5")
q("choice","«什么时候» гэж юу гэсэн үг вэ?",["хэзээ","хаана","яаж","хэн"],"хэзээ","什么时候 = хэзээ.","easy",["vocabulary"],"b6")
q("choice","«第一次» гэж юу гэсэн үг вэ?",["анх удаа","хоёр дахь удаа","гурав дахь удаа","өдөр бүр"],"анх удаа","第一 = эхний, 次 = удаа.","medium",["vocabulary"],"b7")
q("choice","Пиньинь «fēijī» гэж уншдаг үг:",["飞机","累","去年","时候"],"飞机","飞机 = fēijī = онгоц.","easy",["pronunciation"],"b8")
q("choice","Пиньинь «qùnián» гэж уншдаг үг:",["去年","时候","飞机","高兴"],"去年","去年 = qùnián.","medium",["pronunciation"],"b9")
q("choice","Пиньинь «shíhou» гэж уншдаг үг:",["时候","去年","累","次"],"时候","时候 = shíhou.","medium",["pronunciation"],"b10")
q("choice","Пиньинь «lèi» гэж уншдаг үг:",["累","次","飞机","北京"],"累","累 = lèi = ядарсан.","easy",["pronunciation"],"b11")
q("choice","«Чи хэзээ явсан юм бэ?» хятадаар:",["你是什么时候去的？","你是怎么去的？","你去过中国吗？","你累吗？"],"你是什么时候去的？","什么时候 = хэзээ.","medium",["dialogue"],"b12")
q("choice","«Чи яаж явсан бэ?» хятадаар:",["你是怎么去的？","你是什么时候去的？","你去过吗？","你累吗？"],"你是怎么去的？","怎么 = яаж.","medium",["dialogue"],"b13")
q("choice","Яриа 1-д Дэвид хэзээ Хятад явсан бэ?",["Өнгөрсөн жилийн 8-р сард","Өчигдөр","Өнгөрсөн долоо хоногт","Хэзээ ч яваагүй"],"Өнгөрсөн жилийн 8-р сард","我是去年8月去的。","medium",["dialogue"],"b14")
q("choice","Яриа 1-д Мари Хятадад очиж үзсэн үү?",["Үгүй, очоогүй","Тийм, очсон","Өчигдөр очсон","Мэдэхгүй"],"Үгүй, очоогүй","玛丽说：我没去过。","easy",["dialogue"],"b15")
q("choice","Яриа 2-т Дэвид хэд цаг нисэв?",["13 цаг","10 цаг","12 цаг","3 цаг"],"13 цаг","我们飞了十三个小时。","medium",["dialogue"],"b16")
q("choice","Дэвид Хятад руу юугаар явсан бэ?",["Онгоцоор","Автобусаар","Машинаар","Галт тэргээр"],"Онгоцоор","我们是坐飞机去的。","easy",["dialogue"],"b17")
q("cloze","我是（ ）年8月去的。",["去","好","坐","没"],"去","去年 = өнгөрсөн жил.","medium",["structure"],"b18")
q("cloze","我们是坐（ ）去的。",["飞机","北京","高兴","星期"],"飞机","坐飞机 = онгоцоор.","easy",["structure"],"b19")
q("cloze","你是什么（ ）去的？",["时候","飞机","累","次"],"时候","什么时候 = хэзээ.","easy",["structure"],"b20")
q("cloze","我（ ）去过中国。（Очоогүй）",["没","是","很","都"],"没","没去过 = очоогүй.","medium",["structure"],"b21")
q("cloze","那是我第一（ ）坐飞机。",["次","年","天","月"],"次","第一次 = анх удаа.","medium",["structure"],"b22")
q("choice","«我没去过。» гэж юу гэсэн үг вэ?",["Би очоогүй.","Би очиж үзсэн.","Би ядарсан.","Би өчигдөр явсан."],"Би очоогүй.","没去过 = очоогүй.","medium",["structure"],"b23")
q("choice","Бяцхан панда яагаад онгоцоор гэртээ харьж чадахгүй вэ?",["Тэр жижиг, ядарна","Онгоц байхгүй","Гэр нь ойрхон","Тэр хүсэхгүй"],"Тэр жижиг, ядарна","妈妈说：你太小，坐飞机回家会很累的。","medium",["usage"],"b24")
q("choice","Пандын гэр хаана байдаг вэ?",["Хятадад","Монголд","Бээжин хотод л","Онгоцон дээр"],"Хятадад","我们的家在中国。","easy",["usage"],"b25")
q("usage","Найз чинь «你去过北京吗？» гэж асуув. Чи очиж үзээгүй бол:",["我没去过。","我是去年去的。","我很累。","我是坐飞机去的。"],"我没去过。","没去过 = очоогүй.","medium",["usage"],"b26")
q("usage","Найзаасаа юугаар явсныг нь асуух нь:",["你是怎么去的？","你是什么时候去的？","你去过吗？","你累吗？"],"你是怎么去的？","怎么 = яаж.","medium",["usage"],"b27")
q("usage","Онгоцоор удаан явсан хойно жаахан ядарсан бол юу гэх вэ?",["有一点儿累。","第一次。","去年8月。","我没去过。"],"有一点儿累。","有一点儿累 = жаахан ядарсан.","hard",["usage"],"b28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (09-05) сонсоод зөв хариуг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）坐飞机到北京要10个小时。","script_zh":"坐飞机到北京要10个小时。","options":["不到10个小时","12个小时","10个小时"],"answer":"C","explanation_mn":"«Онгоцоор Бээжин хүрэхэд 10 цаг шаардагдана» — 10个小时 = C. А «10 цаг хүрэхгүй», B «12 цаг» тул таарахгүй."},
    {"n":2,"question_zh":"（听录音）我今天有一点儿累，不去跑步了。","script_zh":"我今天有一点儿累，不去跑步了。","options":["有一点儿累","有一点儿饿","有一点儿热"],"answer":"A","explanation_mn":"«Би өнөөдөр жаахан ядарсан, гүйхгүй» — 有一点儿累 = A. 饿 (өлссөн), 热 (халуун) биш."},
    {"n":3,"question_zh":"（听录音）我的个子比去年高了很多。","script_zh":"我的个子比去年高了很多。","options":["胖了很多","高了很多","瘦了很多"],"answer":"B","explanation_mn":"«Миний биеийн өндөр өнгөрсөн жилээс их өссөн» — 高了很多 = B. 胖 (таргалсан), 瘦 (турсан) биш."},
    {"n":4,"question_zh":"（听录音）我第一次做饺子，好吃吗？","script_zh":"我第一次做饺子，好吃吗？","options":["第二次","第一次","第三次"],"answer":"B","explanation_mn":"«Би анх удаа банш хийлээ, амттай юу?» — 第一次 = B."}],
   "answer_source":"YCT 4 Test Answers L9: 1.C 2.A 3.B 4.B"},
  {"part":2,"type":"choice","instruction_mn":"Унших — зураг бүрд тохирох өгүүлбэрийг A, B, C-ээс сонго.","items":[
    {"n":5,"image":img("t5"),"question_zh":"（зураг）","question_mn":"Зураг: гурван охин хамтдаа тэврэлдэн инээж байна.","options":["A 我们都很高兴。","B 你们是什么时候认识的？","C 我们是去年八月在中国认识的。"],"answer":"A","explanation_mn":"Зураг дээр гурван найз баяртай инээж байна — «Бид бүгд баяртай байна» (A). B «Та нар хэзээ танилцсан бэ?» асуулт, C «Бид өнгөрсөн жилийн 8-р сард Хятадад танилцсан» гэсэн цаг, газар хэлж байгаа тул зурагт таарахгүй."},
    {"n":6,"image":img("t6"),"question_zh":"（зураг）","question_mn":"Зураг: охин нүдээ үрж, ядарч нойрмоглож байна.","options":["A 比去年多一些。","B 坐飞机有一点儿累。","C 三年级有一百多个学生学汉语。"],"answer":"B","explanation_mn":"Зураг дээр охин ядарсан байна — «Онгоцоор явахад жаахан ядарна» (B). A «Өнгөрсөн жилээс арай олон», C «3-р ангид зуу гаруй сурагч хятад хэл сурдаг» — ядарсан нүүртэй холбоогүй."},
    {"n":7,"image":img("t7"),"question_zh":"（зураг）","question_mn":"Зураг: нэг хүн том хананы цаг барьсан байна.","options":["A 什么时候吃药？","B 中午要吃药吗？","C 医生说，一天吃三次，饭后吃。"],"answer":"A","explanation_mn":"Зураг дээр том цаг байна — «Эмийг хэзээ уух вэ?» (A). B «Өдөр эм уух уу?», C «Эмч өдөрт гурван удаа, хоолны дараа гэсэн» — цаг асуух зурагтай A хамгийн их таарна."},
    {"n":8,"image":img("t8"),"question_zh":"（зураг）","question_mn":"Зураг: онгоц.","options":["A 你是什么时候去北京的？","B 你说什么？你再说一次。","C 我和爸爸妈妈坐飞机去中国。"],"answer":"C","explanation_mn":"Зураг дээр онгоц байна — «Би аав ээжтэйгээ онгоцоор Хятад явсан» (C). A «Чи Бээжин рүү хэзээ явсан бэ?» асуулт, B «Чи юу гэсэн бэ? Дахин хэлээч» — онгоцтой холбоогүй."}],
   "answer_source":"YCT 4 Test Answers L9: 5.A 6.B 7.A 8.C"},
  {"part":3,"type":"match","instruction_mn":"Let's match — асуулт бүрд тохирох хариуг сонго.","items":[
    {"n":1,"question_zh":"你是怎么去的？","answer":"我是坐公共汽车去的。","explanation_mn":"怎么 = яаж. Хариу нь «Би автобусаар явсан» (C)."},
    {"n":2,"question_zh":"你是什么时候去北京的？","answer":"我是去年8月去的。","explanation_mn":"什么时候 = хэзээ. Хариу нь «Би өнгөрсөн жилийн 8-р сард явсан» (A)."},
    {"n":3,"question_zh":"坐飞机去中国累吗？","answer":"有一点儿累。","explanation_mn":"累吗？ = ядрах уу? Хариу нь «Жаахан ядарна» (B)."}],
   "answer_source":"Let's match х.45 (номын шугамын дагуу)"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «我们的家在哪儿？» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"我什么时候回家？","answer":"1","explanation_mn":"1-р зураг дээр бяцхан панда ахынхаа онгоцоор харьсан зургийг бодож ээжээсээ асууж байна."},
    {"n":2,"question_zh":"我们的家在中国。","answer":"2","explanation_mn":"2-р зураг дээр ээж панда «манай гэр Хятадад» гэж хариулж байна."},
    {"n":3,"question_zh":"那里有大大的广场、长长的墙和高高的山。","answer":"3","explanation_mn":"3-р зураг дээр Их хэрэм, уул, онгоцтой панда байна."},
    {"n":4,"question_zh":"有，那里有最好的竹子！","answer":"4","explanation_mn":"4-р зураг дээр панда бамбай идэж байна."}],
   "answer_source":"textbook х.46 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «飞机» гэсэн ханзыг дахин бичиж хуул.","question_zh":"飞机","answer":"飞机","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа очиж үзсэн газрыг нь асуу, дараа нь хэзээ, яаж явсныг нь асуу.","question_zh":"你去过……吗？ 你是什么时候去的？ 你是怎么去的？","answer":"你是什么时候去的？","explanation_mn":"Хосоороо ээлжлэн. Хариуд нь «我是……去的» гэж хэл."},
   {"n":2,"prompt_mn":"Touch the Card — үгийг сонсоод картад хурдан хүр.","question_zh":"时候！去年！次！飞机！累！","answer":"(нээлттэй)","explanation_mn":"Хамгийн хурдан хүрсэн нь хожно."},
   {"n":3,"prompt_mn":"Chant-ыг онгоц шиг гараа дэлгээд хэл.","question_zh":"坐上飞机去哪里？我们飞到中国去。","answer":"(нээлттэй)","explanation_mn":"Аудио 09-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 4 · Test Listening Scripts, Test Answers (Lesson 9)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("shihou","时候"),("qunian","去年"),("ci","次"),("feiji","飞机"),("lei","累")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"你是什么时候去的？","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你去过中国吗？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"去年，我和爸爸妈妈去了中国。","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"坐飞机","role":"illustration","section":"song"},
 {"id":"story-art","file":"images/story.jpg","title":"我们的家在哪儿？","role":"illustration","section":"story"},
 {"id":"story","file":"images/story.png","title":"我们的家在哪儿？ · Mini story","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in [5,6,7,8]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 4 · 9-р хичээл — Чи хэзээ явсан юм бэ?","chineseTitle":"你是什么时候去的？","targetTitle":"你是什么时候去的？","mongolianTitle":"Чи хэзээ явсан юм бэ?",
 "subtitle":"去年 · 飞机 · 第一次 · 我们是坐飞机去的 · «我们的家在哪儿？» үлгэр",
 "description":f"Хэзээ, яаж явснаа хэлж сурна. {len(vocab)} үг, 2 зурагт яриа, chant «坐飞机», Mini story «我们的家在哪儿？», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"✈️","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 4",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 4 — 第9课《你是什么时候去的？》 [hskLevel=2] [lessonNumber=9]; эх: сурах бичиг х.43–47; аудио CD 09-01…09-05 (бүгд байгаа)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"你是什么时候去的？","mongolianTitle":"Чи хэзээ явсан юм бэ?",
 "series":"YCT 标准教程 4","seriesLabel_mn":"YCT 4 — Хүүхдийн хятад хэл (≈HSK2–3)",
 "source":"YCT 标准教程 4 · 第9课 (сурах бичиг + CD аудио 09-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_CHANT,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L9)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
