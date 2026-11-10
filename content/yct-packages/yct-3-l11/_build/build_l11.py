#!/usr/bin/env python3
"""YCT 标准教程 3 · 第11课 妈妈把糖给弟弟了。 — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re
OUT = "/home/claude/work/yct3/l11/pkg"
CID, LID, N = "yct-3", "yct-3-l11", 11
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
_pg = Image.open("/home/claude/work/yct3/l11/pages/hi-59.png").convert("RGB")
_S = 1.5
_BOX = {"t1a":(150,185,220,272),"t1b":(300,182,388,278),"t1c":(460,192,558,285),"t1d":(598,185,700,282)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct3/l11/pages/hi-58.png").convert("RGB").crop(tuple(int(v*_S) for v in (65,195,760,1035))).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-3-11-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = AUD_TEXT   # дуу байхгүй → яриа track

# ---------------- VOCAB ----------------
VOCAB = [
 ("把","bǎ","-ыг, -ийг (юуг өгөхийг хэлэх үг)","туслах үг · гол үг","把西瓜给我。","Bǎ xīguā gěi wǒ.","Тарвасыг надад өгөөч.",True),
 ("糖","táng","чихэр","нэр үг · гол үг","妈妈把糖给弟弟了。","Māma bǎ táng gěi dìdi le.","Ээж чихрийг дүүд өгчихлөө.",True),
 ("水果","shuǐguǒ","жимс","нэр үг · гол үг","要水果吗？","Yào shuǐguǒ ma?","Жимс авах уу?",True),
 ("西瓜","xīguā","тарвас","нэр үг · гол үг","把西瓜给我吧。","Bǎ xīguā gěi wǒ ba.","Тарвасыг надад өгөөч.",True),
 ("鸡蛋","jīdàn","тахианы өндөг","нэр үг · гол үг","我吃面包和鸡蛋。","Wǒ chī miànbāo hé jīdàn.","Би талх, өндөг идэж байна.",True),
 ("面包","miànbāo","талх","нэр үг · нэмэлт үг","我还有面包。","Wǒ hái yǒu miànbāo.","Надад талх бас байна.",False),
 ("果汁","guǒzhī","жимсний шүүс","нэр үг · нэмэлт үг","谁喝了我的果汁？","Shéi hē le wǒ de guǒzhī?","Миний жимсний шүүсийг хэн уучихав?",False),
 ("猴子","hóuzi","сармагчин","нэр үг · нэмэлт үг","你们看，是猴子！","Nǐmen kàn, shì hóuzi!","Хараарай, сармагчин байна!",False),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 3","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

def chk(q,opts,ans,seed):
    o,i=shuffle(opts,ans,seed); return {"question":q,"options":o,"answer":str(i)}

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
 {"id":1,"title_mn":"Яриа 1 · Өглөөний хоолны ширээний ард","scene_mn":"Ээж аав хоёр өглөөний хоолоо иднэ. Ширээн дээр талх, өндөг, бууз, жимс байна. Аав тарвас авахыг хүсч байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"妈妈","zh":"你吃什么？","pinyin":"Nǐ chī shénme?","mn":"Чи юу идэх вэ?"},
           {"speaker":"爸爸","zh":"我吃面包和鸡蛋。","pinyin":"Wǒ chī miànbāo hé jīdàn.","mn":"Би талх, өндөг идье."},
           {"speaker":"妈妈","zh":"要水果吗？","pinyin":"Yào shuǐguǒ ma?","mn":"Жимс авах уу?"},
           {"speaker":"爸爸","zh":"把西瓜给我吧。","pinyin":"Bǎ xīguā gěi wǒ ba.","mn":"Тэгвэл тарвасыг надад өгөөч."}]},
 {"id":2,"title_mn":"Яриа 2 · Хэллоуины орой, чихэр хаана байна?","scene_mn":"Хэллоуины орой. Хүүхэд гадаа чихэр аваад ирсэн. Аав дотроос хариулна. Дүү нь чихрээ найздаа өгчихсөн байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"爸爸，把糖给我吧。","pinyin":"Bàba, bǎ táng gěi wǒ ba.","mn":"Аав аа, чихрээ надад өгөөч."},
           {"speaker":"爸爸","zh":"妈妈把糖给弟弟了。","pinyin":"Māma bǎ táng gěi dìdi le.","mn":"Ээж чихрийг дүүд чинь өгчихсөн."},
           {"speaker":"小红","zh":"弟弟呢？","pinyin":"Dìdi ne?","mn":"Дүү хаана байна?"},
           {"speaker":"爸爸","zh":"在外面。啊，弟弟把我们的糖都给那个同学了。","pinyin":"Zài wàimiàn. A, dìdi bǎ wǒmen de táng dōu gěi nà ge tóngxué le.","mn":"Гадаа байна. Аа, дүү маань бидний бүх чихрийг тэр ангийн найздаа өгчихөж."}]},
]
sentences=[]
dlg = [
 (1,"妈妈：你吃什么？","Māma: Nǐ chī shénme?","Ээж: Чи юу идэх вэ?","妈妈：| 你|nǐ 吃|chī 什么|shénme ？|","",[]),
 (1,"爸爸：我吃面包和鸡蛋。","Bàba: Wǒ chī miànbāo hé jīdàn.","Аав: Би талх, өндөг идье.","爸爸：| 我|wǒ 吃|chī 面包|miànbāo 和|hé 鸡蛋|jīdàn 。|","和 = «ба, болон». 面包和鸡蛋 — талх, өндөг.",[]),
 (1,"妈妈：要水果吗？","Māma: Yào shuǐguǒ ma?","Ээж: Жимс авах уу?","妈妈：| 要|yào 水果|shuǐguǒ 吗|ma ？|","",[]),
 (1,"爸爸：把西瓜给我吧。","Bàba: Bǎ xīguā gěi wǒ ba.","Аав: Тэгвэл тарвасыг надад өгөөч.","爸爸：| 把|bǎ 西瓜|xīguā 给|gěi 我|wǒ 吧|ba 。|","把西瓜给我 — «тарвасыг надад өг». 吧 нь зөөлнөөр хүсэх үг.",["把西瓜给我。"]),
 (2,"小红：爸爸，把糖给我吧。","Xiǎo Hóng: Bàba, bǎ táng gěi wǒ ba.","Сяо Хун: Аав аа, чихрээ надад өгөөч.","小红：| 爸爸|bàba ，| 把|bǎ 糖|táng 给|gěi 我|wǒ 吧|ba 。|","",[]),
 (2,"爸爸：妈妈把糖给弟弟了。","Bàba: Māma bǎ táng gěi dìdi le.","Аав: Ээж чихрийг дүүд чинь өгчихсөн.","爸爸：| 妈妈|māma 把|bǎ 糖|táng 给|gěi 弟弟|dìdi 了|le 。|","了 — «өгчихлөө, болчихлоо» гэж дууссаныг хэлнэ.",["妈妈把糖给弟弟了。"]),
 (2,"小红：弟弟呢？","Xiǎo Hóng: Dìdi ne?","Сяо Хун: Дүү хаана байна?","小红：| 弟弟|dìdi 呢|ne ？|","弟弟呢？ — «дүү хаана вэ?» гэж асууна.",[]),
 (2,"爸爸：在外面。啊，弟弟把我们的糖都给那个同学了。","Bàba: Zài wàimiàn. A, dìdi bǎ wǒmen de táng dōu gěi nà ge tóngxué le.","Аав: Гадаа байна. Аа, дүү маань бидний бүх чихрийг тэр ангийн найздаа өгчихөж.","爸爸：| 在|zài 外面|wàimiàn 。| 啊|a ，| 弟弟|dìdi 把|bǎ 我们|wǒmen 的|de 糖|táng 都|dōu 给|gěi 那个|nà ge 同学|tóngxué 了|le 。|","都 = «бүгдийг». 同学 = ангийн найз.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("谁吃了我的蛋糕？","Shéi chī le wǒ de dàngāo?","Миний бялууг хэн идчихэв?","谁|shéi 吃|chī 了|le 我|wǒ 的|de 蛋糕|dàngāo ？|"),
 ("谁喝了我的果汁？","Shéi hē le wǒ de guǒzhī?","Миний жимсний шүүсийг хэн уучихав?","谁|shéi 喝|hē 了|le 我|wǒ 的|de 果汁|guǒzhī ？|"),
 ("我的面包和鸡蛋也没有了。","Wǒ de miànbāo hé jīdàn yě méiyǒu le.","Миний талх, өндөг ч алга болчихлоо.","我|wǒ 的|de 面包|miànbāo 和|hé 鸡蛋|jīdàn 也|yě 没有|méiyǒu 了|le 。|"),
 ("我的水果也没有了。","Wǒ de shuǐguǒ yě méiyǒu le.","Миний жимс ч алга болчихлоо.","我|wǒ 的|de 水果|shuǐguǒ 也|yě 没有|méiyǒu 了|le 。|"),
 ("你们看，是猴子，猴子妈妈把我们的东西给小猴子了。","Nǐmen kàn, shì hóuzi, hóuzi māma bǎ wǒmen de dōngxi gěi xiǎo hóuzi le.","Хараарай, сармагчин байна! Эх сармагчин бидний юмсыг ёолоо хүүдээ өгчихжээ.","你们|nǐmen 看|kàn ，| 是|shì 猴子|hóuzi ，| 猴子|hóuzi 妈妈|māma 把|bǎ 我们|wǒmen 的|de 东西|dōngxi 给|gěi 小|xiǎo 猴子|hóuzi 了|le 。|"),
 ("我还有面包，把面包也给小猴子吧。","Wǒ hái yǒu miànbāo, bǎ miànbāo yě gěi xiǎo hóuzi ba.","Надад талх үлдсэн байна. Талхаа ч хүү сармагчинд өгье.","我|wǒ 还|hái 有|yǒu 面包|miànbāo ，| 把|bǎ 面包|miànbāo 也|yě 给|gěi 小|xiǎo 猴子|hóuzi 吧|ba 。|"),
]
story[4]=(story[4][0],story[4][1],"Хараарай, сармагчин байна! Сармагчин ээж бидний юмыг хүүдээ өгчихжээ.",story[4][3])
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «野餐» (Зугаалгын хоол) — 4 зурагт үлгэр. 谁 = хэн. Аудио: 11-03."
    if i==2: s["note"]="也没有了 = «бас алга болчихлоо». 也 = бас."
    if i==4: s["note"]="东西 = юм, эд зүйл. 小猴子 = хүү сармагчин. Сармагчин ээж хүүхдүүдийн хоолыг хүүдээ өгчихжээ."
    sentences.append(s)

texts = {
 "unit":{"number":"11","title":"妈妈把糖给弟弟了。","mongolianTitle":"Ээж чихрийг дүүд өгчихлөө — «хэнд юуг өгөх»"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, найзуудаа! Би Тэмээ багш. Чи YCT 1-ийг дуусгаад олон үг мэддэг болсон. Одоо амттан жимс, чихрийн тухай ярилцъя. Чи ээж аавтайгаа хоолны ширээний ард «тарвасыг надад өгөөч» гэж хэлж үзсэн үү? Хятадаар «把西瓜给我吧» гэнэ. Дүүдээ чихрээ өгөх үед «妈妈把糖给弟弟了» гэж хэлнэ. Хэллоуины орой чихэр хэн авчихсан бэ, зугаалгад сармагчин хэний хоолыг авсан бэ гэдгийг хамт уншина. Эхэлцгээе!",
  "warmup_mn":"Чи хамгийн их дуртай жимсээ юу гэдэг вэ? Чихрээ хэнтэй хуваалцдаг вэ?",
  "theme_zh":"把 · 糖 · 水果 · 西瓜 · 鸡蛋","theme_mn":"Өгөөч · чихэр · жимс · тарвас · өндөг"},
 "warmup":{"mongolian":"Чи хамгийн их дуртай жимсээ хэл. Чихрээ хэнд өгөх вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"11","title":"妈妈把糖给弟弟了。","mongolianTitle":"Ээж чихрийг дүүд өгчихлөө — яриа, үлгэр","title_mn":"Let's read · 2 яриа + Mini story · 野餐","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 3 · 第11课 Let's read / Mini story（CD 11-02, 11-03）","author_zh":"",
  "intro_zh":"两段小对话：把西瓜给我吧。妈妈把糖给弟弟了。然后读小故事《野餐》。",
  "intro_mn":"Эхлээд хоёр яриа: «把西瓜给我吧» гэж ширээн дээр тарвас авна, «妈妈把糖给弟弟了» гэж чихэр хэнд очсоныг хэлнэ. Дараа нь «野餐» гэсэн зугаалгын үлгэрийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл! Үлгэрийг найзуудтайгаа жүжиглээрэй.",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Ээж аав хоёр өглөөний хоол идэж байна. Аав талх, өндөг иднэ. Ээж жимс санал болгоход аав тарвас авахыг хүснэ."},
   {"paragraph":2,"mn":"Яриа 2 — Хүүхэд аавдаа чихрээ өгөхийг гуйна. Ээж чихрийг дүүд өгчихсөн. Дүү нь бүх чихрээ ангийн найздаа өгчихөж."},
   {"paragraph":3,"mn":"Үлгэр «野餐» — Зугаалгад хүүхдүүдийн бялуу, шүүс, талх, жимс алга болно. Мод дээр сармагчин ээж хүүдээ хүүхдүүдийн хоолыг өгч байна. Хүүхдүүд үүнийг хараад үлдсэн талхаа ч хүү сармагчинд өгнө. Аудио: 11-03."}],
  "reflection":{"questions_mn":["Чи юуг хэнд өгөх дуртай вэ? «把……给……» гэж хэлж үз.","Хэллоуины үеэр чи ямар хувцас өмсөх вэ?","Зугаалгад сармагчин хоол авбал чи юу хийх байсан бэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Өгөөч гэж гуй","zh":"把西瓜给我吧。","pinyin":"Bǎ xīguā gěi wǒ ba.","mn":"Тарвасыг надад өгөөч."},
  "writingPrompt_mn":"Найзаасаа «把……给我吧» гэж ямар нэг юм гуйгаад, тэр чамд өгөхөд «谢谢» гэж хэл."},
 "properNouns":[{"zh":"野餐","pinyin":"Yěcān","mn":"Зугаалгын хоол (үлгэрийн нэр)"},{"zh":"万圣节","pinyin":"Wànshèngjié","mn":"Хэллоуин (шившлэгт баяр)"},{"zh":"孙悟空","pinyin":"Sūn Wùkōng","mn":"Сүн Үкун (Хятадын сармагчин баатар)"}],
 "wordExplanation":[
  {"word":"把","gloss":"bǎ — «юуг» гэж заадаг үг","explanation":"Тэмээ багш чамд нэг дүрэм заая. Юуг хэнд өгөхөө хэлэхдээ «把 + юу + 给 + хэнд» гэж хэлнэ. Жишээ нь «把西瓜给我» — тарвасыг надад өгөөч. 把 нь «юуг» гэж заадаг үг, 给 нь «өгөх».",
   "structure":"把 + юу + 给 + хэнд","teacher_notes":"Ширээн дээр жинхэнэ алим, чихэр тавиад «把糖给我！» гэж гуйлгаад өгүүл. Дүрмийн нэр томьёо хэрэглэхгүй.",
   "examples":[{"chinese":"把西瓜给我。","pinyin":"Bǎ xīguā gěi wǒ.","mongolian":"Тарвасыг надад өгөөч."},{"chinese":"把糖给弟弟。","pinyin":"Bǎ táng gěi dìdi.","mongolian":"Чихрийг дүүд өг."},{"chinese":"把面包给妈妈。","pinyin":"Bǎ miànbāo gěi māma.","mongolian":"Талхыг ээжид өг."}],
   "common_mistakes":[{"wrong":"给我把西瓜。","right":"把西瓜给我。","why":"把 нь юуг гэсэн үгийн өмнө, эхэнд орно."}],
   "check":chk("«Тарвасыг надад өгөөч» хятадаар:",["把西瓜给我。","你吃什么？","要水果吗？"],"把西瓜给我。","w1c"),
   "practice":[{"n":1,"question":"________ 糖给我。(юуг)","answer":"把","explanation_mn":"«Юуг» гэж заахдаа 把."}]},
  {"word":"了","gloss":"le — өгчихлөө, болчихлоо","explanation":"Өгүүлбэрийн төгсгөлд «了» гэвэл «аль хэдийн болчихсон» гэсэн утга өгнө. «妈妈把糖给弟弟了» — ээж чихрийг дүүд өгчихлөө. Хэрэв «хоол алга болчихлоо» гэвэл «没有了» гэнэ.",
   "structure":"…… 了。 → өгчихлөө, байхгүй болчихлоо","teacher_notes":"Хүүхдүүдэд жинхэнэ чихэр өгөөд «我把糖给你了» гэж хэлүүл.",
   "examples":[{"chinese":"妈妈把糖给弟弟了。","pinyin":"Māma bǎ táng gěi dìdi le.","mongolian":"Ээж чихрийг дүүд өгчихлөө."},{"chinese":"我的水果也没有了。","pinyin":"Wǒ de shuǐguǒ yě méiyǒu le.","mongolian":"Миний жимс ч алга болчихлоо."},{"chinese":"谁吃了我的蛋糕？","pinyin":"Shéi chī le wǒ de dàngāo?","mongolian":"Миний бялууг хэн идчихэв?"}],
   "common_mistakes":[{"wrong":"妈妈把糖给弟弟。(өгчихсөн гэж хэлэх)","right":"妈妈把糖给弟弟了。","why":"Өгчихсөн гэж хэлэхэд төгсгөлд 了 нэм."}],
   "check":chk("«Миний жимс алга болчихлоо» хятадаар:",["我的水果没有了。","你吃什么？","把西瓜给我吧。"],"我的水果没有了。","w2c"),
   "practice":[{"n":1,"question":"我的水果也没有 ________ 。","answer":"了","explanation_mn":"Алга болчихлоо гэхэд төгсгөлд 了."}]},
  {"word":"吧 · 吗","gloss":"ba · ma — гуйх, асуух","explanation":"Өгүүлбэрийн төгсгөлд «吧» гэвэл зөөлөн гуйлт болно: «把西瓜给我吧» — тарвасыг надад өгөөч. «吗» гэвэл асуулт болно: «要水果吗？» — жимс авах уу?",
   "structure":"…… 吧。 (гуйх)  /  …… 吗？ (асуух)","teacher_notes":"吧 нь «-аач» гэсэн зөөлөн гуйлт. Хүүхдүүдээр өөрсдөө гуйлгаж, асуулгаж давтуул.",
   "examples":[{"chinese":"要水果吗？","pinyin":"Yào shuǐguǒ ma?","mongolian":"Жимс авах уу?"},{"chinese":"爸爸，把糖给我吧。","pinyin":"Bàba, bǎ táng gěi wǒ ba.","mongolian":"Аав аа, чихрээ надад өгөөч."},{"chinese":"把面包也给小猴子吧。","pinyin":"Bǎ miànbāo yě gěi xiǎo hóuzi ba.","mongolian":"Талхыг ч хүү сармагчинд өгье."}],
   "common_mistakes":[{"wrong":"要水果吧？","right":"要水果吗？","why":"Асуухдаа 吗, гуйхдаа 吧."}],
   "check":chk("«Жимс авах уу?» хятадаар:",["要水果吗？","把西瓜给我吧。","我吃面包和鸡蛋。"],"要水果吗？","w3c"),
   "practice":[{"n":1,"question":"要水果 ________ ？(асуулт)","answer":"吗","explanation_mn":"Асуултын төгсгөлд 吗."}]},
 ],
 "collocations":[{"type":"把……给…… — өгөх","rows":[
   {"head":"把","with":"西瓜给我","mn":"тарвасыг надад өг","usage_mn":"Юуг өгөхийг гуйх","example":{"zh":"把西瓜给我吧。","pinyin":"Bǎ xīguā gěi wǒ ba.","mn":"Тарвасыг надад өгөөч."}},
   {"head":"把","with":"糖给弟弟","mn":"чихрийг дүүд өг","usage_mn":"Хэнд өгснөө хэлэх","example":{"zh":"妈妈把糖给弟弟了。","pinyin":"Māma bǎ táng gěi dìdi le.","mn":"Ээж чихрийг дүүд өгчихлөө."}},
   {"head":"面包","with":"和鸡蛋","mn":"талх, өндөг","usage_mn":"Хоёр юмыг 和-оор холбох","example":{"zh":"我吃面包和鸡蛋。","pinyin":"Wǒ chī miànbāo hé jīdàn.","mn":"Би талх, өндөг идье."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["把","糖","西瓜","鸡蛋"],"items":[
     {"n":1,"question":"________ 西瓜给我吧。","answer":"把","explanation_mn":"«Юуг» гэж заахдаа 把."},
     {"n":2,"question":"妈妈把 ________ 给弟弟了。(чихэр)","answer":"糖","explanation_mn":"糖 = чихэр."},
     {"n":3,"question":"外面是绿色，里面是红色的水果是 ________ 。","answer":"西瓜","explanation_mn":"Гаднаа ногоон, дотроо улаан жимс — тарвас."},
     {"n":4,"question":"我吃面包和 ________ 。(өндөг)","answer":"鸡蛋","explanation_mn":"鸡蛋 = тахианы өндөг."}]}],
   "answer_source":"agent-authored (YCT 3 · 11-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"男的让女的做什么？","answer":"把西瓜给他。","explanation_mn":"Яриа 1 — аав «把西瓜给我吧» гэсэн."},
     {"n":2,"question_zh":"他们家的糖呢？","answer":"弟弟把糖都给同学了。","explanation_mn":"Яриа 2 — дүү бүх чихрийг ангийн найздаа өгчихсөн."}],
   "answer_source":"textbook_verified (Let's read, х.54 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Хоол жимсний санал асуулга","start_zh":"你最爱吃什么？","instruction_mn":"Ном дээрх «Food and fruit» тэмцээнийг тоглоё. Ээж аав, найзуудаасаа «水果、糖、西瓜、鸡蛋» дотроос аль нь хамгийн дуртайг нь асуу. Хариултыг самбар дээр зураасаар тэмдэглээд аль нь хамгийн олон санал авсныг хэлээрэй."},
     {"label":"Эстафет «把花给猴子»","start_zh":"老虎把花给猴子。","instruction_mn":"Номын зураг шиг 4 хүнтэй хоёр баг болоорой. Цэцэг (эсвэл үзэг) эстафетийн таяг болно. Дамжуулах бүрдээ «老虎把花给猴子。» гэж хэл. Хэн алдаагүй, хурдан дамжуулсан баг хожно!"},
     {"label":"Өгөөч! тоглоом","start_zh":"把糖给我吧。","instruction_mn":"Ширээн дээр чихэр, алим, талх тавь. Найз чинь «把糖给我吧！» гэж гуйхад чи тэр юмыг нь өгч «把糖给你了。» гэж хэл. Дараа нь ээлжээ солиорой."},
     {"label":"Сармагчин ээж жүжиг","start_zh":"你们看，是猴子！","instruction_mn":"«野餐» үлгэрийг найзуудтайгаа жүжигчилье. Нэг нь сармагчин ээж, нэг нь хүү сармагчин, бусад нь хүүхдүүд. Хүүхдүүд «谁吃了我的蛋糕？» гэж гайхаж, сүүлд «把面包也给小猴子吧！» гэж өгнө."},
     {"label":"Нүүр будах","start_zh":"孙悟空","instruction_mn":"Номын 55-р хуудсан дээрх 孙悟空-ийн нүүрийг өнгөөр будаарай. Дараа нь «这是孙悟空！» гэж гэр бүлдээ танилцуулаарай."}]}},
 "grammarNotes":[],
 "culture":{"title":"万圣节 · 孙悟空","title_mn":"Хятад хүүхдийн Хэллоуин — Сүн Үкуны нүүр","text_mn":"Хэллоуин буюу «万圣节»-д хүүхдүүд тусгай хувцас өмсөж, айлаар орж чихэр цуглуулдаг. Хятад хүүхдүүд заримдаа Хятадын алдарт баатар, сармагчин 孙悟空-ийн нүүрийг будаж өмсдөг. Тэр нь Хятадын дуурийн нүүрний зургаар хийсэн байдаг. Чи ч гэсэн чихрээ найзуудтайгаа хуваалцаарай.","note_mn":"Чи Хэллоуинд хэн болж хувцаслахыг хүсэх вэ? Чихрээ хэнд өгөх вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — юуг хэнд өгснөө хэлэх, жимс хоол нэрлэх.","topic":"Чи юуг хэнд өгсөн бэ?","discussion":["Хосоороо: «把……给我吧» гэж ямар нэг юм гуйж, нөгөө нь өгөөд «给你了» гэж хэл.","Бүгдээрээ «你吃什么？» гэж ээлжлэн асууж, хариулаарай."],
   "writing":{"promptChinese":"我把……给……了。","promptMongolian":"Гэрийн даалгавар: ээж аавдаа «把西瓜给我吧» гэж хятадаар гуйгаад, өгөхөд нь «谢谢» гэж хэл.","minChars":"0","requiredWords":["把","给"],"sampleChinese":"妈妈把糖给弟弟了。","sampleMongolian":"Ээж чихрийг дүүд өгчихлөө.","gradingRubric":"把……给…… бүтцийг зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 3 · Test Answers: L11 1.C 2.A 3.B 4.D 5.A 6.C 7.C 8.A","parts":[]},
}
dump("texts.json", texts)

# ---------------- GRAMMAR ----------------
def ex(zh,py,mn): return {"chinese":zh,"pinyin":py,"mongolian":mn}
def choice(q,opts,ans,ok,wrong,seed):
    o,i = shuffle(opts,ans,seed); return {"type":"choice","question":q,"options":o,"answer":str(i),"explanation_correct_mn":ok,"explanation_wrong_mn":wrong}
def judge(q,ans,ok,wrong): return {"type":"judge","question":q,"options":["Зөв","Буруу"],"answer":"true" if ans else "false","explanation_correct_mn":ok,"explanation_wrong_mn":wrong}

grammar = [
 {"point":"把西瓜给我。 — юуг надад өг","gloss_mn":"«Тарвасыг надад өгөөч» — юуг хэнд өгөхийг хэлнэ",
  "structure":"把 + юу + 给 + хэнд",
  "teacher_mn":"Ширээн дээрээс юм авмаар байвал «把……给我» гэж хэлнэ. 把 нь «юуг» гэсэн үг. 给 нь «өгөх». «把西瓜给我» — тарвасыг надад өг. Гараа сунгаад «把糖给我！» гэж хэлж үз.",
  "teacher_notes":"Номын Key sentence: 把西瓜给我。 Яриа 1: 把西瓜给我吧。",
  "examples":[ex("把西瓜给我。","Bǎ xīguā gěi wǒ.","Тарвасыг надад өгөөч."),ex("把西瓜给我吧。","Bǎ xīguā gěi wǒ ba.","Тэгвэл тарвасыг надад өгөөч."),ex("把面包给妈妈。","Bǎ miànbāo gěi māma.","Талхыг ээжид өг."),ex("爸爸，把糖给我吧。","Bàba, bǎ táng gěi wǒ ba.","Аав аа, чихрээ надад өгөөч.")],
  "common_mistakes":[{"wrong":"给我把西瓜。","right":"把西瓜给我。","why":"把 + юу эхэнд, 给 + хэнд сүүлд."}],
  "check":chk("«Тарвасыг надад өгөөч» хятадаар:",["把西瓜给我。","你吃什么？","要水果吗？"],"把西瓜给我。","g1c"),
  "exercises":[
   choice("________ 糖给我。",["把","吗","和"],"把","Зөв! 把 = юуг.","Юуг гэж заахдаа 把 хэрэглэнэ.","g1e1"),
   choice("«Талхыг ээжид өг» хятадаар:",["把面包给妈妈。","我吃面包。","面包和鸡蛋。"],"把面包给妈妈。","Зөв!","把 + юу + 给 + хэнд гэж дараалуул.","g1e2"),
   judge("«给» гэдэг нь «өгөх» гэсэн үг.",True,"Зөв! 给 = өгөх.","给 = өгөх.")]},
 {"point":"妈妈把糖给弟弟了。 — өгчихлөө","gloss_mn":"«Ээж чихрийг дүүд өгчихлөө» — өгчихсөнийг хэлнэ",
  "structure":"хэн + 把 + юу + 给 + хэнд + 了",
  "teacher_mn":"Өгч дууссан бол төгсгөлд нь «了» нэмнэ. «妈妈把糖给弟弟了» — ээж чихрийг дүүд өгчихлөө. «没有了» гэвэл «алга болчихлоо» гэсэн утга. Чихэр алга болбол «糖没有了！» гэж хэл.",
  "teacher_notes":"Яриа 2: 妈妈把糖给弟弟了。弟弟把我们的糖都给那个同学了。",
  "examples":[ex("妈妈把糖给弟弟了。","Māma bǎ táng gěi dìdi le.","Ээж чихрийг дүүд өгчихлөө."),ex("弟弟把我们的糖都给那个同学了。","Dìdi bǎ wǒmen de táng dōu gěi nà ge tóngxué le.","Дүү маань бидний бүх чихрийг тэр ангийн найздаа өгчихөж."),ex("我的水果也没有了。","Wǒ de shuǐguǒ yě méiyǒu le.","Миний жимс ч алга болчихлоо."),ex("猴子妈妈把我们的东西给小猴子了。","Hóuzi māma bǎ wǒmen de dōngxi gěi xiǎo hóuzi le.","Сармагчин ээж бидний юмыг хүүдээ өгчихжээ.")],
  "common_mistakes":[{"wrong":"妈妈把糖给弟弟。(өгчихсөн гэж)","right":"妈妈把糖给弟弟了。","why":"Өгчихсөн гэхэд төгсгөлд 了 хэрэгтэй."}],
  "check":chk("«Ээж чихрийг дүүд өгчихлөө» хятадаар:",["妈妈把糖给弟弟了。","妈妈吃糖。","弟弟呢？"],"妈妈把糖给弟弟了。","g2c"),
  "exercises":[
   choice("妈妈把糖给弟弟 ________ 。",["了","吗","吧"],"了","Зөв! 了 = өгчихлөө.","Дууссаныг 了 илэрхийлнэ.","g2e1"),
   choice("«Миний жимс алга болчихлоо» хятадаар:",["我的水果没有了。","我的水果吃了吗？","我要水果。"],"我的水果没有了。","Зөв!","没有了 = алга болчихлоо.","g2e2"),
   judge("«弟弟呢？» гэдэг нь «дүү хаана байна?» гэсэн асуулт.",True,"Зөв! 呢 нь «хаана вэ?» гэж асууна.","弟弟呢？ = дүү хаана вэ?")]},
 {"point":"要水果吗？ · 把西瓜给我吧。 — асуух, гуйх","gloss_mn":"吗 — асуух, 吧 — зөөлөн гуйх",
  "structure":"…… 吗？ (асуух)  /  …… 吧。 (гуйх)",
  "teacher_mn":"Асуумаар байвал төгсгөлд нь «吗» нэм: «要水果吗？» — жимс авах уу? Гуйж, санал болгомоор байвал «吧» нэм: «把西瓜给我吧» — тарвасыг надад өгөөч. Хос хосоороо ээлжлэн асуугаад, гуйгаад үз!",
  "teacher_notes":"Яриа 1: 要水果吗？ 把西瓜给我吧。 Яриа 2: 把糖给我吧。",
  "examples":[ex("要水果吗？","Yào shuǐguǒ ma?","Жимс авах уу?"),ex("把西瓜给我吧。","Bǎ xīguā gěi wǒ ba.","Тарвасыг надад өгөөч."),ex("把糖给我吧。","Bǎ táng gěi wǒ ba.","Чихрээ надад өгөөч."),ex("我还有面包，把面包也给小猴子吧。","Wǒ hái yǒu miànbāo, bǎ miànbāo yě gěi xiǎo hóuzi ba.","Надад талх үлдсэн байна. Талхаа ч хүү сармагчинд өгье.")],
  "common_mistakes":[{"wrong":"要水果吧？","right":"要水果吗？","why":"Асуухад 吗, гуйхад 吧."}],
  "check":chk("«Жимс авах уу?» хятадаар:",["要水果吗？","把糖给我吧。","我吃面包。"],"要水果吗？","g3c"),
  "exercises":[
   choice("要水果 ________ ？",["吗","吧","了"],"吗","Зөв! 吗 нь асуулт болгоно.","Асуултын төгсгөлд 吗.","g3e1"),
   choice("把西瓜给我 ________ 。",["吧","吗","什么"],"吧","Зөв! 吧 = гуйх.","Зөөлөн гуйхад 吧.","g3e2"),
   judge("«你吃什么？» гэдэг нь «чи юу идэх вэ?» гэсэн үг.",True,"Зөв! 什么 = юу.","你吃什么？ = чи юу идэх вэ?")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Чихэр» хятадаар аль нь вэ?",["糖","水果","西瓜","鸡蛋"],"糖","糖 (táng) = чихэр.","easy",["vocabulary"],"a1")
q("choice","«Жимс» хятадаар аль нь вэ?",["水果","糖","面包","果汁"],"水果","水果 (shuǐguǒ) = жимс.","easy",["vocabulary"],"a2")
q("choice","«Тарвас» хятадаар аль нь вэ?",["西瓜","苹果","鸡蛋","面包"],"西瓜","西瓜 (xīguā) = тарвас.","easy",["vocabulary"],"a3")
q("choice","«Тахианы өндөг» хятадаар аль нь вэ?",["鸡蛋","糖","西瓜","包子"],"鸡蛋","鸡蛋 (jīdàn) = өндөг.","easy",["vocabulary"],"a4")
q("choice","«面包» гэдэг үг ямар утгатай вэ?",["талх","жимс","чихэр","сүү"],"талх","面包 (miànbāo) = талх.","easy",["vocabulary"],"a5")
q("choice","«果汁» гэдэг үг ямар утгатай вэ?",["жимсний шүүс","талх","өндөг","чихэр"],"жимсний шүүс","果汁 (guǒzhī) = жимсний шүүс.","medium",["vocabulary"],"a6")
q("choice","«猴子» гэдэг амьтан аль нь вэ?",["сармагчин","нохой","муур","заан"],"сармагчин","猴子 (hóuzi) = сармагчин.","easy",["vocabulary"],"a7")
q("choice","«给» гэдэг үг ямар утгатай вэ?",["өгөх","идэх","уух","харах"],"өгөх","给 (gěi) = өгөх.","easy",["vocabulary"],"a8")
q("choice","«Тарвасыг надад өгөөч» хятадаар:",["把西瓜给我。","你吃什么？","要水果吗？","我吃鸡蛋。"],"把西瓜给我。","把 + юу + 给 + хэнд.","easy",["dialogue"],"a9")
q("choice","«Ээж чихрийг дүүд өгчихлөө» хятадаар:",["妈妈把糖给弟弟了。","妈妈吃糖。","弟弟吃糖了吗？","把糖给我吧。"],"妈妈把糖给弟弟了。","把糖给弟弟了 = чихрийг дүүд өгчихлөө.","medium",["dialogue"],"a10")
q("choice","Яриа 1-д аав юу авахыг хүссэн бэ?",["西瓜","糖","蛋糕","果汁"],"西瓜","Аав «把西瓜给我吧» гэсэн.","easy",["dialogue"],"a11")
q("choice","Яриа 1-д аав юу идэж байна?",["面包和鸡蛋","糖和水果","包子和西瓜","蛋糕"],"面包和鸡蛋","«我吃面包和鸡蛋» — талх, өндөг.","medium",["dialogue"],"a12")
q("choice","Яриа 2-т чихэр хаана байна?",["弟弟给同学了","妈妈吃了","爸爸吃了","猴子吃了"],"弟弟给同学了","Дүү бүх чихрийг ангийн найздаа өгчихсөн.","medium",["dialogue"],"a13")
q("cloze","（ ）西瓜给我吧。",["把","吗","和","了"],"把","把西瓜给我吧 = тарвасыг надад өгөөч.","easy",["structure"],"a14")
q("cloze","妈妈把糖给弟弟（ ）。(өгчихлөө)",["了","吗","吧","什么"],"了","了 = өгчихлөө.","easy",["structure"],"a15")
q("cloze","要水果（ ）？(асуулт)",["吗","吧","了","把"],"吗","吗 = асуулт.","easy",["structure"],"a16")
q("cloze","我吃面包（ ）鸡蛋。",["和","把","给","了"],"和","和 = ба, болон.","medium",["structure"],"a17")
q("cloze","把糖（ ）我吧。",["给","吃","喝","看"],"给","把糖给我 = чихрийг надад өг.","medium",["structure"],"a18")
q("choice","«你吃什么？» гэдэг юу гэж асууж байна вэ?",["Чи юу идэх вэ?","Чи хаана байна?","Чи хэн бэ?","Чи хэдэн настай вэ?"],"Чи юу идэх вэ?","什么 = юу.","easy",["structure"],"a19")
q("choice","«弟弟呢？» гэж асуувал юу гэсэн үг вэ?",["Дүү хаана байна?","Дүү хэдэн настай вэ?","Дүү юу идэж байна?","Дүү өндөр үү?"],"Дүү хаана байна?","呢 нь «хаана вэ?» гэж асууна.","medium",["structure"],"a20")
q("choice","Пиньинь «xīguā» гэж уншдаг үг:",["西瓜","水果","鸡蛋","面包"],"西瓜","西瓜 = xīguā = тарвас.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «jīdàn» гэж уншдаг үг:",["鸡蛋","西瓜","果汁","蛋糕"],"鸡蛋","鸡蛋 = jīdàn = өндөг.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «shuǐguǒ» гэж уншдаг үг:",["水果","果汁","西瓜","面包"],"水果","水果 = shuǐguǒ = жимс.","medium",["pronunciation"],"a23")
q("usage","Ширээн дээрээс чихрээ авмаар байна. Юу гэх вэ?",["把糖给我吧。","你吃什么？","我吃面包。","弟弟呢？"],"把糖给我吧。","把……给我吧 = …-ыг надад өгөөч.","medium",["usage"],"a24")
q("usage","Ээж «要水果吗？» гэж асуулаа. Тарвас авмаар байвал:",["把西瓜给我吧。","我吃面包。","弟弟呢？","谁吃了我的蛋糕？"],"把西瓜给我吧。","Тарвас авахыг хүсвэл «把西瓜给我吧».","medium",["usage"],"a25")
q("usage","野餐 үлгэрт сармагчин ээж хэнд хоол өгсөн бэ?",["小猴子","弟弟","同学","老师"],"小猴子","猴子妈妈把我们的东西给小猴子了 — хүү сармагчинд.","hard",["usage"],"a26")
q("usage","Үлгэрийн төгсгөлд хүүхэд талхаа хэнд өгсөн бэ?",["小猴子","妈妈","爸爸","弟弟"],"小猴子","把面包也给小猴子吧 — талхыг ч хүү сармагчинд өгье.","hard",["usage"],"a27")
q("usage","«谁吃了我的蛋糕？» гэж хэлбэл:",["Миний бялууг хэн идчихэв?","Миний бялуу амттай байна","Надад бялуу байхгүй","Бялуу өгөөч"],"Миний бялууг хэн идчихэв?","谁 = хэн; 吃了 = идчихэв.","hard",["usage"],"a28")
Q[7]["options"]=[o.replace("харах","харах") for o in Q[7]["options"]]
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]
BANKIMG = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (11-04) сонсоод тохирох зургийг A, B, C, D-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）女：你妹妹也在这，你要和她说话吗？ 男：好的，那您把电话给她吧。","script_zh":"女：你妹妹也在这，你要和她说话吗？ 男：好的，那您把电话给她吧。","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"Ээж «Дүү чинь энд байна, түүнтэй ярих уу?» гэхэд хүү «Утсаа түүнд өгөөч» гэнэ. C зураг дээр эмэгтэй утсаар ярьж байна. A тарвас идэж буй хүүхэд, B бууз, D алим."},
    {"n":2,"question_zh":"（听录音）女：你爸爸没买香蕉？ 男：对，他只买了两个西瓜。","script_zh":"女：你爸爸没买香蕉？ 男：对，他只买了两个西瓜。","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"Аав зөвхөн хоёр тарвас авсан гэж ярьж байна. A зураг дээр хүүхэд тарвас идэж байна. B бууз, C утас, D алим."},
    {"n":3,"question_zh":"（听录音）男：来吃饭吧，有包子，还有鸡蛋。 女：好，来了！","script_zh":"男：来吃饭吧，有包子，还有鸡蛋。 女：好，来了！","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"«Хоолоо идэцгээе, бууз, өндөг бий» гэж байна. B зураг дээр тавагтай бууз байна. A тарвас, C утас, D алим."},
    {"n":4,"question_zh":"（听录音）女：你吃水果吗？我这儿有水果。 男：谢谢，那我吃苹果吧。","script_zh":"女：你吃水果吗？我这儿有水果。 男：谢谢，那我吃苹果吧。","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"Хүү «Тэгвэл би алим идье» гэнэ. D зураг дээр хоёр гарт алим байна. A тарвас, B бууз, C утас."}],
   "answer_source":"YCT 3 Test Answers L11: 1.C 2.A 3.B 4.D"},
  {"part":2,"type":"choice","instruction_mn":"Унших — асуултад тохирох хариултыг сонго.","items":[
    {"n":5,"question_zh":"男：这些水果多少钱？ 女：（　　）。","question_mn":"Эдгээр жимс хэдний үнэтэй вэ? — Хариулт:","options":["A","B","C"],"optionTexts":["100块","卖西瓜","少买一些"],"answer":"A","explanation_mn":"«Хэдэн төгрөг вэ?» гэж үнэ асуусан тул үнээр хариулна: 100块 (100 юань). «卖西瓜» тарвас зарна, «少买一些» арай цөөхөн ав гэсэн утга тул таарахгүй."},
    {"n":6,"question_zh":"女：您想吃什么？ 男：给我一个（　　）吧。","question_mn":"Та юу идмээр байна? — Надад нэг ... өгөөч.","options":["A","B","C"],"optionTexts":["书包","里面","鸡蛋"],"answer":"C","explanation_mn":"Идэх юм асуусан тул «鸡蛋 — өндөг» таарна. 书包 цүнх, 里面 дотор — идэж болохгүй."},
    {"n":7,"question_zh":"男：再来一个鸡蛋？ 女：谢谢，我吃（　　）了，给我杯茶吧。","question_mn":"Дахиад нэг өндөг авах уу? — Баярлалаа, би ... , надад цай өгөөч.","options":["A","B","C"],"optionTexts":["近","瘦","饱"],"answer":"C","explanation_mn":"Өндөг дахиад авахгүй, «吃饱了 — цадлаа» гэж хэлнэ. 近 ойр, 瘦 туранхай — энд таарахгүй."},
    {"n":8,"question_zh":"男：什么水果外面是绿色，里面是红色？ 女：我知道，是（　　）。","question_mn":"Гаднаа ногоон, дотроо улаан жимс юу вэ? — Би мэдэж байна, энэ нь ...","options":["A","B","C"],"optionTexts":["西瓜","鸡蛋","苹果"],"answer":"A","explanation_mn":"Гаднаа ногоон, дотроо улаан жимс бол тарвас. 鸡蛋 жимс биш, 苹果 дотроо цагаан."}],
   "answer_source":"YCT 3 Test Answers L11: 5.A 6.C 7.C 8.A"},
  {"part":3,"type":"match","instruction_mn":"Let's play and say — «把» өгүүлбэрээр эстафет тоглоё.","items":[
    {"n":1,"question_zh":"老虎把花给猴子。","answer":"老虎把花给猴子。","explanation_mn":"Эстафетад бар цэцгээ сармагчинд дамжуулж байна. 把花给猴子 = цэцгийг сармагчинд өг."}],
   "answer_source":"Let's play and say х.55"},
  {"part":4,"type":"match","instruction_mn":"Үлгэр «野餐» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"谁吃了我的蛋糕？","answer":"1","explanation_mn":"1-р зураг дээр хүүхдүүд ширээний хажууд бялуу, шүүс алга болсонд гайхаж байна."},
    {"n":2,"question_zh":"我的水果也没有了。","answer":"2","explanation_mn":"2-р зураг дээр хүүхдүүд хоол алга болсонд толгойгоо бариад байна."},
    {"n":3,"question_zh":"猴子妈妈把我们的东西给小猴子了。","answer":"3","explanation_mn":"3-р зураг дээр мод дээр сармагчин ээж, хүү сармагчин байна."},
    {"n":4,"question_zh":"把面包也给小猴子吧。","answer":"4","explanation_mn":"4-р зураг дээр хүү талхыг хүү сармагчинд өгч байна."}],
   "answer_source":"textbook х.56 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «糖» гэсэн ханзыг дахин бичиж хуул.","question_zh":"糖","answer":"糖","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."},
                      {"n":2,"prompt_mn":"Бичиж үз — «把» гэсэн ханзыг дахин бичиж хуул.","question_zh":"把","answer":"把","explanation_mn":"Зүүн талд гар (扌), баруун талд 巴."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Ширээн дээрээс юм гуй.","question_zh":"把西瓜给我吧。","answer":"把西瓜给我吧。","explanation_mn":"Хосоороо ээлжлэн гуйж, өг."},
   {"n":2,"prompt_mn":"Найзаасаа Хэллоуин хэрхэн тэмдэглэдгийг асуу.","question_zh":"万圣节你做什么？","answer":"(нээлттэй)","explanation_mn":"Номын даалгавар: гурван найзаасаа асуу."},
   {"n":3,"prompt_mn":"野餐 үлгэрийг жүжигчил.","question_zh":"谁吃了我的蛋糕？","answer":"(нээлттэй)","explanation_mn":"Аудио 11-03-ын хамт."}]},
 "answerSource":"YCT 标准教程 3 · Test Listening Scripts, Test Answers (Lesson 11)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
WORDKEYS=[("ba","把"),("tang","糖"),("shuiguo","水果"),("xigua","西瓜"),("jidan","鸡蛋"),("mianbao","面包"),("guozhi","果汁"),("houzi","猴子")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"妈妈把糖给弟弟了。","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"你吃什么？","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"爸爸，把糖给我吧。","role":"illustration","section":"dialogue"},
 {"id":"play","file":"images/play.jpg","title":"老虎把花给猴子。","role":"illustration","section":"activity"},
 {"id":"story","file":"images/story.png","title":"野餐 · Mini story","role":"illustration","section":"story"},
 {"id":"story-cover","file":"images/story.jpg","title":"野餐","role":"illustration","section":"story"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 3 · 11-р хичээл — Ээж чихрийг дүүд өгчихлөө","chineseTitle":"妈妈把糖给弟弟了。","targetTitle":"妈妈把糖给弟弟了。","mongolianTitle":"Ээж чихрийг дүүд өгчихлөө",
 "subtitle":"把 · 糖 · 水果 · 西瓜 · 鸡蛋 · «野餐» үлгэр",
 "description":f"Юуг хэнд өгснөө хэлж (把……给……), жимс хоолоо нэрлэж сурна. {len(vocab)} үг, 2 зурагт яриа, Mini story «野餐», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🍉","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 3",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 3 — 第11课《妈妈把糖给弟弟了。》 [hskLevel=2] [lessonNumber=11]; эх: сурах бичиг х.53–57; аудио CD 11-01…11-04 (дуу байхгүй)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"妈妈把糖给弟弟了。","mongolianTitle":"Ээж чихрийг дүүд өгчихлөө",
 "series":"YCT 标准教程 3","seriesLabel_mn":"YCT 3 — Хүүхдийн хятад хэл (≈HSK2)",
 "source":"YCT 标准教程 3 · 第11课 (сурах бичиг + CD аудио 11-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L11)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
