#!/usr/bin/env python3
"""YCT 标准教程 4 · 第10课 爸爸为什么不休息？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, re, subprocess
OUT = "/home/claude/work/yct4/l10/pkg"
CID, LID, N = "yct-4", "yct-4-l10", 10
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

# Тестийн зураг (hi-59.png) + story (hi-58.png) хайчилна
from PIL import Image
_pg = Image.open("/home/claude/work/yct4/l10/pages/hi-59.png").convert("RGB")
_S = 1.5
_BOX = {"t2a":(112,480,232,583),"t2b":(278,480,418,583),"t2c":(427,480,560,583),"t2d":(582,480,727,583)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")
Image.open("/home/claude/work/yct4/l10/pages/hi-58.png").convert("RGB").crop((int(40*_S),int(120*_S),int(790*_S),int(1060*_S))).save(f"{OUT}/images/story.png")

AUD_WORDS, AUD_TEXT, AUD_STORY, AUD_TEST = [f"audio/yct-4-10-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = "audio/yct-4-10-text-song.mp3"
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"{OUT}/{AUD_TEXT}","-i",f"{OUT}/{AUD_STORY}","-filter_complex","[0:a][1:a]concat=n=2:v=0:a=1[a]","-map","[a]","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)

# ---------------- VOCAB ----------------
VOCAB = [
 ("电影","diànyǐng","кино","нэр үг · гол үг","你看过这个电影吗？","Nǐ kànguo zhège diànyǐng ma?","Чи энэ киног үзсэн үү?",True),
 ("为什么","wèi shénme","яагаад","асуух үг · гол үг","爸爸为什么不休息？","Bàba wèi shénme bù xiūxi?","Аав яагаад амрахгүй байна вэ?",True),
 ("忙","máng","завгүй","тэмдэг нэр · гол үг","爸爸太忙了。","Bàba tài máng le.","Аав дэндүү завгүй байна.",True),
 ("事情","shìqing","зүйл, ажил хэрэг","нэр үг · гол үг","爸爸有很多事情。","Bàba yǒu hěn duō shìqing.","Аавд хийх ажил их байгаа.",True),
 ("意思","yìsi","утга","нэр үг · гол үг","这个电影的名字是什么意思？","Zhège diànyǐng de míngzi shì shénme yìsi?","Энэ киноны нэр ямар утгатай вэ?",True),
 ("因为……所以……","yīnwèi … suǒyǐ …","учир нь … тиймээс …","хос бүтэц · гол бүтэц","因为我的电脑坏了，所以不能上网了。","Yīnwèi wǒ de diànnǎo huài le, suǒyǐ bù néng shàngwǎng le.","Миний компьютер эвдэрсэн болохоор интернэтэд орж чадахгүй байна.",True),
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
 {"id":1,"title_mn":"Яриа 1 · Аав яагаад амрахгүй байна вэ?","scene_mn":"Орой гэрийн хаалганы өмнө ээж, бяцхан охин хоёр байна. Аав ажлаасаа ирсэн ч гар цүнхээ барьсаар байгаа. Охин «аав яагаад амрахгүй байна вэ?» гэж ээжээсээ асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小红","zh":"爸爸为什么不休息？","pinyin":"Bàba wèi shénme bù xiūxi?","mn":"Аав яагаад амрахгүй байна вэ?"},
           {"speaker":"妈妈","zh":"因为爸爸太忙了。","pinyin":"Yīnwèi bàba tài máng le.","mn":"Аав дэндүү завгүй байгаа юм."},
           {"speaker":"小红","zh":"爸爸为什么很忙？","pinyin":"Bàba wèi shénme hěn máng?","mn":"Аав яагаад ийм завгүй байдаг юм бэ?"},
           {"speaker":"妈妈","zh":"因为爸爸有很多事情，所以很忙。","pinyin":"Yīnwèi bàba yǒu hěn duō shìqing, suǒyǐ hěn máng.","mn":"Аавд хийх ажил их байгаа. Тийм болохоор завгүй байгаа юм."}]},
 {"id":2,"title_mn":"Яриа 2 · Энэ киног үзсэн үү?","scene_mn":"Кино театрын гадаа хоёр хүү «Чулуу, хайч, цаас» киноны зурагт хуудасны өмнө зогсож байна. Тэд киноны нэрийн утгыг ойлгохгүй байгаа аж.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"你看过这个电影吗？","pinyin":"Nǐ kànguo zhège diànyǐng ma?","mn":"Чи энэ киног үзсэн үү?"},
           {"speaker":"大卫","zh":"看过，我是在电脑上看的。","pinyin":"Kànguo, wǒ shì zài diànnǎo shang kàn de.","mn":"Үзсэн. Би компьютер дээрээс үзсэн юм."},
           {"speaker":"小明","zh":"我也看了，但是没看懂。这个电影的名字是什么意思？","pinyin":"Wǒ yě kàn le, dànshì méi kàn dǒng. Zhège diànyǐng de míngzi shì shénme yìsi?","mn":"Би ч үзсэн, гэвч ойлгосонгүй. Энэ киноны нэр ямар утгатай вэ?"},
           {"speaker":"大卫","zh":"我也不知道。","pinyin":"Wǒ yě bù zhīdào.","mn":"Би ч мэдэхгүй байна."}]},
]
sentences=[]
dlg = [
 (1,"小红：爸爸为什么不休息？","Xiǎohóng: Bàba wèi shénme bù xiūxi?","Сяо Хун: Аав яагаад амрахгүй байна вэ?","小红：| 爸爸|bàba 为什么|wèi shénme 不|bù 休息|xiūxi ？|","为什么 = «яагаад». Ямар нэг юм гайхахад «为什么……？» гэж асууна.",["爸爸为什么不休息？"]),
 (1,"妈妈：因为爸爸太忙了。","Māma: Yīnwèi bàba tài máng le.","Ээж: Аав дэндүү завгүй байгаа юм.","妈妈：| 因为|yīnwèi 爸爸|bàba 太|tài 忙|máng 了|le 。|","因为 = «учир нь». «为什么»-д хариулахдаа «因为……» гэж эхэлнэ.",[]),
 (1,"小红：爸爸为什么很忙？","Xiǎohóng: Bàba wèi shénme hěn máng?","Сяо Хун: Аав яагаад ийм завгүй байдаг юм бэ?","小红：| 爸爸|bàba 为什么|wèi shénme 很|hěn 忙|máng ？|","",[]),
 (1,"妈妈：因为爸爸有很多事情，所以很忙。","Māma: Yīnwèi bàba yǒu hěn duō shìqing, suǒyǐ hěn máng.","Ээж: Аавд хийх ажил их байгаа. Тийм болохоор завгүй байгаа юм.","妈妈：| 因为|yīnwèi 爸爸|bàba 有|yǒu 很|hěn 多|duō 事情|shìqing ，| 所以|suǒyǐ 很|hěn 忙|máng 。|","因为……，所以…… — шалтгаан, дараа нь үр дүн. «Учир нь…, тиймээс…» гэсэн үг.",["因为……，所以……"]),
 (2,"小明：你看过这个电影吗？","Xiǎo Míng: Nǐ kànguo zhège diànyǐng ma?","Сяо Мин: Чи энэ киног үзсэн үү?","小明：| 你|nǐ 看过|kànguo 这个|zhège 电影|diànyǐng 吗|ma ？|","看过 = «үзсэн». «过» нь урьд нь нэг удаа хийж үзсэн гэсэн утга өгнө.",[]),
 (2,"大卫：看过，我是在电脑上看的。","Dàwèi: Kànguo, wǒ shì zài diànnǎo shang kàn de.","Дэвид: Үзсэн. Би компьютер дээрээс үзсэн юм.","大卫：| 看过|kànguo ，| 我|wǒ 是|shì 在|zài 电脑|diànnǎo 上|shang 看|kàn 的|de 。|","我是在……看的 — «Би … дээрээс үзсэн юм» гэж хаана үзснээ тодруулж хэлнэ.",["我是在……看的"]),
 (2,"小明：我也看了，但是没看懂。这个电影的名字是什么意思？","Xiǎo Míng: Wǒ yě kàn le, dànshì méi kàn dǒng. Zhège diànyǐng de míngzi shì shénme yìsi?","Сяо Мин: Би ч үзсэн, гэвч ойлгосонгүй. Энэ киноны нэр ямар утгатай вэ?","小明：| 我|wǒ 也|yě 看|kàn 了|le ，| 但是|dànshì 没|méi 看懂|kàn dǒng 。| 这个|zhège 电影|diànyǐng 的|de 名字|míngzi 是|shì 什么|shénme 意思|yìsi ？|","看懂 = «үзээд ойлгох». 没看懂 = үзсэн ч ойлгосонгүй.",[]),
 (2,"大卫：我也不知道。","Dàwèi: Wǒ yě bù zhīdào.","Дэвид: Би ч мэдэхгүй байна.","大卫：| 我|wǒ 也|yě 不|bù 知道|zhīdào 。|","",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
story = [
 ("叔叔：喂，你好！","Shūshu: Wèi, nǐ hǎo!","Авга ах: Алло, сайн байна уу!","叔叔：| 喂|wèi ，| 你|nǐ 好|hǎo ！|"),
 ("男孩：你好！","Nánhái: Nǐ hǎo!","Хүү: Сайн байна уу!","男孩：| 你|nǐ 好|hǎo ！|"),
 ("叔叔：我能和你妈妈说话吗？","Shūshu: Wǒ néng hé nǐ māma shuōhuà ma?","Авга ах: Би чиний ээжтэй ярьж болох уу?","叔叔：| 我|wǒ 能|néng 和|hé 你|nǐ 妈妈|māma 说话|shuōhuà 吗|ma ？|"),
 ("男孩：不能，妈妈现在很忙。","Nánhái: Bù néng, māma xiànzài hěn máng.","Хүү: Болохгүй, ээж одоо завгүй байна.","男孩：| 不|bù 能|néng ，| 妈妈|māma 现在|xiànzài 很|hěn 忙|máng 。|"),
 ("叔叔：你爸爸在家吗？我能和他说话吗？","Shūshu: Nǐ bàba zài jiā ma? Wǒ néng hé tā shuōhuà ma?","Авга ах: Аав чинь гэртээ байна уу? Би түүнтэй ярьж болох уу?","叔叔：| 你|nǐ 爸爸|bàba 在|zài 家|jiā 吗|ma ？| 我|wǒ 能|néng 和|hé 他|tā 说话|shuōhuà 吗|ma ？|"),
 ("男孩：爸爸在家，但是也不能说话。","Nánhái: Bàba zài jiā, dànshì yě bù néng shuōhuà.","Хүү: Аав гэртээ байгаа ч бас ярьж чадахгүй.","男孩：| 爸爸|bàba 在|zài 家|jiā ，| 但是|dànshì 也|yě 不|bù 能|néng 说话|shuōhuà 。|"),
 ("叔叔：为什么？","Shūshu: Wèi shénme?","Авга ах: Яагаад?","叔叔：| 为什么|wèi shénme ？|"),
 ("男孩：因为爸爸现在也很忙。","Nánhái: Yīnwèi bàba xiànzài yě hěn máng.","Хүү: Учир нь аав одоо бас завгүй байна.","男孩：| 因为|yīnwèi 爸爸|bàba 现在|xiànzài 也|yě 很|hěn 忙|máng 。|"),
 ("叔叔：你家还有别的人吗？","Shūshu: Nǐ jiā hái yǒu bié de rén ma?","Авга ах: Танайд өөр хүн байна уу?","叔叔：| 你|nǐ 家|jiā 还|hái 有|yǒu 别的|bié de 人|rén 吗|ma ？|"),
 ("男孩：还有警察。","Nánhái: Hái yǒu jǐngchá.","Хүү: Цагдаа байгаа.","男孩：| 还|hái 有|yǒu 警察|jǐngchá 。|"),
 ("叔叔：我能和他们说话吗？","Shūshu: Wǒ néng hé tāmen shuōhuà ma?","Авга ах: Би тэдэнтэй ярьж болох уу?","叔叔：| 我|wǒ 能|néng 和|hé 他们|tāmen 说话|shuōhuà 吗|ma ？|"),
 ("男孩：不能。","Nánhái: Bù néng.","Хүү: Болохгүй.","男孩：| 不|bù 能|néng 。|"),
 ("叔叔：为什么？","Shūshu: Wèi shénme?","Авга ах: Яагаад?","叔叔：| 为什么|wèi shénme ？|"),
 ("男孩：因为他们也很忙。","Nánhái: Yīnwèi tāmen yě hěn máng.","Хүү: Учир нь тэд ч бас завгүй байна.","男孩：| 因为|yīnwèi 他们|tāmen 也|yě 很|hěn 忙|máng 。|"),
 ("叔叔：他们都在忙什么呢？","Shūshu: Tāmen dōu zài máng shénme ne?","Авга ах: Тэд бүгд юугаар завгүй байгаа юм бэ?","叔叔：| 他们|tāmen 都|dōu 在|zài 忙|máng 什么|shénme 呢|ne ？|"),
 ("男孩：他们都忙着找我呢。","Nánhái: Tāmen dōu mángzhe zhǎo wǒ ne.","Хүү: Тэд бүгд намайг хайхаар завгүй байгаа юм.","男孩：| 他们|tāmen 都|dōu 忙着|mángzhe 找|zhǎo 我|wǒ 呢|ne 。|"),
]
for i,(zh,py,mn,tk) in enumerate(story):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Mini story «每个人都很忙» (Хүн болгон завгүй) — утсаар ярьж буй хошин түүх. Ном дээр «худалдагч» утасдаж байгаа тул энд 叔叔 (авга ах) гэж нэрлэв. 喂 = алло."
    if i==3: s["note"]="Эхлээд ээж, дараа нь аавын тухай асууж байна. Хүү «завгүй» гэж хариулсаар байна."
    if i==8: s["note"]="别的人 = өөр хүн. 警察 = цагдаа."
    if i==15: s["note"]="忙着找我 = намайг хайхаар завгүй байна. Хүү орны доор нуугдаж байгаа тул цагдаа нар түүнийг хайж байна — энэ бол хошигнол!"
    sentences.append(s)

texts = {
 "unit":{"number":"10","title":"爸爸为什么不休息？","mongolianTitle":"Аав яагаад амрахгүй байна вэ? — шалтгаан, үр дүн"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх гурван номонд чи олон үг, өгүүлбэр сурсан даа. Одоо чи «яагаад?» гэж асууж, «учир нь…» гэж хариулж сурна. Чиний аав, ээж үргэлж завгүй байдаг биз? Тэднээс «爸爸为什么不休息？» гэж асуух гээд үз. Өнөөдөр «因为……，所以……» гэж шалтгаан, үр дүнгээ хэлнэ. «我是在电脑上看的» гэж хаана үзсэнээ ч ярина. Мөн «每个人都很忙» гэсэн хошин түүхийг уншина — төгсгөлд нь инээх байх! Эхэлцгээе!",
  "warmup_mn":"Танай гэрт хамгийн завгүй хүн хэн бэ? Сүүлд үзсэн киногоо хэлээд өгөөч?",
  "theme_zh":"为什么 · 因为…所以… · 忙 · 电影","theme_mn":"Яагаад · учир нь…тиймээс… · завгүй · кино"},
 "warmup":{"mongolian":"Танай гэрт хамгийн завгүй хүн хэн бэ? Чи сүүлд ямар кино үзсэн бэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"10","title":"爸爸为什么不休息？","mongolianTitle":"Аав яагаад амрахгүй байна вэ? — 2 яриа, Mini story","title_mn":"Let's read · 2 яриа + Mini story · 每个人都很忙","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 4 · 第10课 Let's read / Mini story（CD 10-02, 10-03）","author_zh":"",
  "intro_zh":"两段小对话：爸爸为什么不休息？你看过这个电影吗？然后读小故事《每个人都很忙》。",
  "intro_mn":"Эхлээд хоёр яриа: «爸爸为什么不休息？» гэж аавын тухай асууж, «你看过这个电影吗？» гэж киноны тухай ярина. Дараа нь «每个人都很忙» хошин түүхийг уншина. Эхлээд аудиог сонс, дараа нь хамт хэл!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Охин аав яагаад амрахгүй байгааг асууна. Ээж «Аавд хийх ажил их байгаа, тиймээс завгүй» гэж хариулна."},
   {"paragraph":2,"mn":"Яриа 2 — Хоёр хүү «Чулуу, хайч, цаас» киноны зурагт хуудасны өмнө зогсоно. Нэг нь компьютер дээрээс үзсэн ч нэрийн утгыг ойлгоогүй. Нөгөө нь ч мэдэхгүй. Аудио: 10-02."},
   {"paragraph":3,"mn":"Mini story «每个人都很忙» — Утсаар нэг авга ах хүүгээс ээж, аавтай нь ярьж болох эсэхийг асууна. Хүү «тэд завгүй» гэсээр байгаад эцэст нь «цагдаа нар намайг хайхаар завгүй» гэнэ. Хүү орны доор нуугдаж байсан юм! Аудио: 10-03."}],
  "reflection":{"questions_mn":["Танай гэрт хамгийн завгүй хүн хэн бэ? «我家……最忙。» гэж хэлж үз.","Чи сүүлд ямар кино үзсэн бэ? Хаана үзсэн бэ?","Хошин түүхийн хүү яагаад орны доор нуугдсан гэж бодож байна?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Яагаад гэж асуу","zh":"爸爸为什么不休息？","pinyin":"Bàba wèi shénme bù xiūxi?","mn":"Аав яагаад амрахгүй байна вэ?"},
  "writingPrompt_mn":"Гэрийнхэндээ «为什么……？» гэж нэг асуулт асуугаад, тэдний хариуг «因为……» гэж хятадаар давтан хэл."},
 "properNouns":[{"zh":"每个人都很忙","pinyin":"Měi ge rén dōu hěn máng","mn":"Хүн болгон завгүй (түүхийн нэр)"},{"zh":"警察","pinyin":"jǐngchá","mn":"цагдаа"}],
 "wordExplanation":[
  {"word":"为什么 · 因为","gloss":"wèi shénme · yīnwèi — яагаад, учир нь","explanation":"Ямар нэг юм ойлгомжгүй байвал «为什么？» гэж асууна. Хариулахдаа «因为……» гэж эхэлнэ. Жишээ нь: «爸爸为什么不休息？» — «因为爸爸太忙了。» Чи ч гэсэн «яагаад?» гэж олон асуудаг биз дээ!",
   "structure":"为什么 + асуух зүйл？ → 因为 + шалтгаан。","teacher_notes":"Хос хосоороо: нэг нь «为什么……？» гэж асууна, нөгөө нь «因为……» гэж хүссэнээрээ хариулна. Хошин хариулт нь хамгийн сайн!",
   "examples":[{"chinese":"爸爸为什么不休息？","pinyin":"Bàba wèi shénme bù xiūxi?","mongolian":"Аав яагаад амрахгүй байна вэ?"},{"chinese":"因为爸爸太忙了。","pinyin":"Yīnwèi bàba tài máng le.","mongolian":"Аав дэндүү завгүй байгаа юм."},{"chinese":"为什么？因为他们也很忙。","pinyin":"Wèi shénme? Yīnwèi tāmen yě hěn máng.","mongolian":"Яагаад? Учир нь тэд ч бас завгүй байна."}],
   "common_mistakes":[{"wrong":"为什么？我忙。","right":"为什么？因为我忙。","why":"Шалтгаанаа хэлэхдээ «因为» гэж эхэлбэл илүү зөв сонсогдоно."}],
   "check":{"question":"«Яагаад?» хятадаар:","options":["为什么？","什么意思？","怎么样？"],"answer":"0"},
   "practice":[{"n":1,"question":"爸爸 ________ 不休息？(яагаад)","answer":"为什么","explanation_mn":"«Яагаад» — 为什么."}]},
  {"word":"因为……，所以……","gloss":"yīnwèi … suǒyǐ … — учир нь … тиймээс …","explanation":"Эхлээд шалтгаанаа «因为» гэж хэлээд, дараа нь үр дүнгээ «所以» гэж хэлнэ. Жишээ нь: «因为爸爸有很多事情，所以很忙。» — Аавд ажил их тул завгүй. Монголоор «Ажил их болохоор завгүй» гэж хэлдэгтэй адилхан.",
   "structure":"因为 + шалтгаан，所以 + үр дүн。","teacher_notes":"Let's try тоглоом: хүүхдүүд шалтгааныг сонгоод, «所以……» гэж үр дүнг нь хэлнэ. Жишээ: 因为要下雨了，所以妈妈让我拿雨伞。",
   "examples":[{"chinese":"因为爸爸有很多事情，所以很忙。","pinyin":"Yīnwèi bàba yǒu hěn duō shìqing, suǒyǐ hěn máng.","mongolian":"Аавд ажил их тул завгүй байна."},{"chinese":"因为我的电脑坏了，所以不能上网了。","pinyin":"Yīnwèi wǒ de diànnǎo huài le, suǒyǐ bù néng shàngwǎng le.","mongolian":"Компьютер минь эвдэрсэн болохоор интернэтэд орж чадахгүй байна."},{"chinese":"因为要下雨了，所以妈妈让我拿雨伞。","pinyin":"Yīnwèi yào xiàyǔ le, suǒyǐ māma ràng wǒ ná yǔsǎn.","mongolian":"Бороо орох гэж байгаа болохоор ээж намайг шүхэр аваарай гэсэн."}],
   "common_mistakes":[{"wrong":"所以爸爸忙，因为有很多事情。","right":"因为爸爸有很多事情，所以很忙。","why":"Эхлээд шалтгаан (因为), дараа нь үр дүн (所以) гэж хэлнэ."}],
   "check":{"question":"«Бороо орох гэж байгаа тул шүхэр авлаа» гэх бүтэц:","options":["因为要下雨了，所以我拿雨伞。","所以要下雨了，因为我拿雨伞。","我拿雨伞，因为所以。"],"answer":"0"},
   "practice":[{"n":1,"question":"因为忙，________ 没有去。(тиймээс)","answer":"所以","explanation_mn":"«Тиймээс» — 所以."}]},
  {"word":"我是在……看的 · 看过 · 没看懂","gloss":"wǒ shì zài … kàn de — би … дээрээс үзсэн","explanation":"Хаана үзсэнээ тодруулж хэлэхдээ «我是在……看的» гэнэ: «我是在电脑上看的» — Би компьютер дээрээс үзсэн юм. «看过» гэвэл «урьд нь үзсэн». «没看懂» гэвэл «үзсэн ч ойлгосонгүй».",
   "structure":"我是在 + хаана + 看的。 · 看过 · 没看懂","teacher_notes":"Хүүхдүүдээс «сүүлд үзсэн киногоо хаана үзсэн?» гэж асуу. «电影院里» (кино театрт), «电脑上» (компьютер дээр), «家里» (гэртээ) гэж сонгож хариулуулна.",
   "examples":[{"chinese":"我是在电脑上看的。","pinyin":"Wǒ shì zài diànnǎo shang kàn de.","mongolian":"Би компьютер дээрээс үзсэн юм."},{"chinese":"我是在电影院里看的。","pinyin":"Wǒ shì zài diànyǐngyuàn li kàn de.","mongolian":"Би кино театрт үзсэн юм."},{"chinese":"我也看了，但是没看懂。","pinyin":"Wǒ yě kàn le, dànshì méi kàn dǒng.","mongolian":"Би ч үзсэн, гэвч ойлгосонгүй."}],
   "common_mistakes":[{"wrong":"我在电脑上看是的。","right":"我是在电脑上看的。","why":"«是» нь «在»-ийн өмнө, «的» нь өгүүлбэрийн төгсгөлд орно."}],
   "check":{"question":"«Би кино театрт үзсэн» хятадаар:","options":["我是在电影院里看的。","我没看懂。","我也不知道。"],"answer":"0"},
   "practice":[{"n":1,"question":"我是在电脑上 ________ 的。(үзсэн)","answer":"看","explanation_mn":"«Үзэх» — 看."}]},
 ],
 "collocations":[{"type":"Завгүй, шалтгаан, кино","rows":[
   {"head":"很","with":"忙","mn":"их завгүй","usage_mn":"Завгүй байгаагаа хэлэхэд","example":{"zh":"爸爸现在也很忙。","pinyin":"Bàba xiànzài yě hěn máng.","mn":"Аав одоо бас завгүй байна."}},
   {"head":"很多","with":"事情","mn":"олон ажил","usage_mn":"Хийх ажил их гэж хэлэхэд","example":{"zh":"爸爸有很多事情。","pinyin":"Bàba yǒu hěn duō shìqing.","mn":"Аавд хийх ажил их байна."}},
   {"head":"看","with":"电影","mn":"кино үзэх","usage_mn":"Кино «үзнэ» — «看» гэж хэлнэ","example":{"zh":"你看过这个电影吗？","pinyin":"Nǐ kànguo zhège diànyǐng ma?","mn":"Чи энэ киног үзсэн үү?"}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["电影","为什么","忙","事情","意思"],"items":[
     {"n":1,"question":"你看过这个 ________ 吗？","answer":"电影","explanation_mn":"«Кино» — 电影."},
     {"n":2,"question":"爸爸 ________ 不休息？","answer":"为什么","explanation_mn":"«Яагаад» — 为什么."},
     {"n":3,"question":"因为爸爸太 ________ 了。","answer":"忙","explanation_mn":"«Завгүй» — 忙."},
     {"n":4,"question":"爸爸有很多 ________ 。","answer":"事情","explanation_mn":"«Ажил, зүйл» — 事情."},
     {"n":5,"question":"这个名字是什么 ________ ？","answer":"意思","explanation_mn":"«Утга» — 意思."}]}],
   "answer_source":"agent-authored (YCT 4 · 10-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"女孩的爸爸为什么不休息？","answer":"因为爸爸有很多事情，所以很忙。","explanation_mn":"Яриа 1 — ээж «因为爸爸有很多事情，所以很忙» гэж хариулсан."},
     {"n":2,"question_zh":"男孩在哪儿看的这个电影？","answer":"在电脑上看的。","explanation_mn":"Яриа 2 — «我是在电脑上看的» гэж хэлсэн."},
     {"n":3,"question_zh":"电影的名字是什么？","answer":"Rock Paper Scissors（石头剪刀布）。","explanation_mn":"Зурагт хуудас дээр «Rock Paper Scissors» гэж бичсэн, энэ нь «Чулуу, хайч, цаас» гэсэн утгатай."}],
   "answer_source":"textbook_verified (Let's read, х.49 Questions)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Шалтаг олох тоглоом (Excuse Finder)","start_zh":"为什么？","instruction_mn":"Хоёулаа тоглоно. Нэг нь «你为什么没做作业？» гэх мэт «为什么……？» гэж асууна. Нөгөө нь «因为……» гэж хамгийн хөгтэй шалтгаан зохиож хариулна. Бусдыг хамгийн их инээлгэсэн нь хожно!"},
     {"label":"Шалтгаанаа олоорой (Let's try)","start_zh":"因为……，所以……","instruction_mn":"Нэг нь «因为要下雨了，所以……» гэж шалтгаанаа хэлнэ. Нөгөө нь үр дүнг нь таана: «妈妈让我拿雨伞»! Дараа нь ээлжээ солиорой."},
     {"label":"Хүн болгон завгүй (Mini story)","start_zh":"喂，你好！","instruction_mn":"Түүхийг найзтайгаа жүжигчил. Нэг нь утсаар ярьж буй авга ах, нөгөө нь хүү. «不能，妈妈现在很忙。» гэж хариулаад, төгсгөлд нь «他们都忙着找我呢。» гэж хэлээд үз!"},
     {"label":"Хошин яриа хэл","start_zh":"你还知道别的笑话吗？","instruction_mn":"Чи өөр хошин түүх мэдэх үү? Хятадаар богино хэлж үзээд найзууддаа инээлгээрэй. Мэдэхгүй бол «每个人都很忙»-ыг дахин ярьж өг."},
     {"label":"Хэн хамгийн завгүй вэ?","start_zh":"我家谁最忙？","instruction_mn":"Гэрийнхнээсээ «你为什么这么忙？» гэж асуугаад хариуг нь сонс. Дараа нь «因为……，所以很忙。» гэж хятадаар давт."}]}},
 "grammarNotes":[],
 "culture":{"title":"石头剪刀布","title_mn":"Хятад хүүхдийн дуртай тоглоом — чулуу, хайч, цаас","text_mn":"Хятадын хүүхдүүд хэн түрүүлэхээ шийдэхдээ «石头、剪刀、布» (чулуу, хайч, цаас) тоглодог. Хоёр хүн нэгэн зэрэг гараа гаргана: чулуу хайчийг дарна, хайч цаасыг тасална, цаас чулууг ороож дарна. Ном дээрх киноны нэр «Rock Paper Scissors» нь яг энэ тоглоом юм! Чи ч мэдэх биз дээ — манай хүүхдүүд ч адилхан тоглодог.","note_mn":"Чи найзтайгаа хэн түрүүлэхээ яаж шийддэг вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — «яагаад?» гэж асуух, шалтгаан үр дүнгээ хэлэх.","topic":"Хамгийн завгүй хүн хэн бэ?","discussion":["Хосоороо: «为什么……？» гэж асууж, «因为……» гэж хариул.","Бүгдээрээ «因为……，所以……» гэж ээлжлэн нэг өгүүлбэр хэл."],
   "writing":{"promptChinese":"因为……，所以……。","promptMongolian":"Гэрийн даалгавар: гэрийнхэндээ «你为什么这么忙？» гэж хятадаар асууж, хариуг нь сонс.","minChars":"0","requiredWords":["因为","所以"],"sampleChinese":"因为爸爸有很多事情，所以很忙。","sampleMongolian":"Аавд хийх ажил их тул завгүй байна.","gradingRubric":"因为 ба 所以-г зөв дараалалтай хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 4 · Test Answers: L10 1.B 2.C 3.A 4.C 5.B 6.C 7.A 8.D","parts":[]},
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
 {"point":"为什么……？ 因为……","gloss_mn":"«Яагаад?» гэж асууж, «учир нь…» гэж хариулах",
  "structure":"为什么 + асуулт？ → 因为 + шалтгаан。",
  "teacher_mn":"Чи «яагаад?» гэж их асуудаг биз? Хятадаар «为什么？» гэнэ. Хариулахдаа «因为……» гэж эхэлнэ. Жишээ нь: «爸爸为什么不休息？» — «因为爸爸太忙了。» Гэрийнхнээсээ «为什么？» гэж асуугаад үз!",
  "teacher_notes":"Номын яриа 1: 爸爸为什么不休息？ 因为爸爸太忙了。 Mini story: 为什么？ 因为他们也很忙。",
  "examples":[ex("爸爸为什么不休息？","Bàba wèi shénme bù xiūxi?","Аав яагаад амрахгүй байна вэ?"),ex("因为爸爸太忙了。","Yīnwèi bàba tài máng le.","Аав дэндүү завгүй байгаа юм."),ex("爸爸为什么很忙？","Bàba wèi shénme hěn máng?","Аав яагаад ийм завгүй байдаг юм бэ?"),ex("因为爸爸现在也很忙。","Yīnwèi bàba xiànzài yě hěn máng.","Учир нь аав одоо бас завгүй байна.")],
  "common_mistakes":[{"wrong":"为什么？我忙。","right":"为什么？因为我忙。","why":"Шалтгаанаа «因为» гэж эхэлж хэлнэ."}],
  "check":chk("«Яагаад?» хятадаар:",["为什么？","什么意思？","你好吗？"],"为什么？","g1c"),
  "exercises":[
   choice("爸爸 ________ 不休息？",["为什么","什么意思","还有"],"为什么","Зөв! 为什么 = яагаад.","为什么 = яагаад.","g1e1"),
   choice("«为什么？»-д хариулахдаа эхэлдэг үг:",["因为","所以","但是"],"因为","Зөв! 因为 = учир нь.","Шалтгаан 因为-аар эхэлнэ.","g1e2"),
   judge("«因为爸爸太忙了» гэдэг нь «Аав дэндүү завгүй учраас» гэсэн утгатай.",True,"Зөв!","因为 = учир нь, 忙 = завгүй.")]},
 {"point":"因为……，所以……","gloss_mn":"«Учир нь …, тиймээс …» — шалтгаан, үр дүн",
  "structure":"因为 + шалтгаан，所以 + үр дүн。",
  "teacher_mn":"Нэг өгүүлбэрт шалтгаан, үр дүн хоёрыг хамт хэлж болно. Эхлээд «因为……» гэж шалтгаан, дараа нь «所以……» гэж үр дүн. «因为爸爸有很多事情，所以很忙。» — Аавд ажил их тул завгүй. Чи ч өөрөө нэг өгүүлбэр зохио!",
  "teacher_notes":"Let's try: 因为要下雨了，所以妈妈让我拿雨伞。 Let's match: 因为我的电脑坏了，所以不能上网。",
  "examples":[ex("因为爸爸有很多事情，所以很忙。","Yīnwèi bàba yǒu hěn duō shìqing, suǒyǐ hěn máng.","Аавд ажил их тул завгүй байна."),ex("因为我的电脑坏了，所以不能上网了。","Yīnwèi wǒ de diànnǎo huài le, suǒyǐ bù néng shàngwǎng le.","Компьютер минь эвдэрсэн тул интернэтэд орж чадахгүй."),ex("因为要下雨了，所以妈妈让我拿雨伞。","Yīnwèi yào xiàyǔ le, suǒyǐ māma ràng wǒ ná yǔsǎn.","Бороо орох гэж байгаа тул ээж намайг шүхэр аваарай гэсэн."),ex("因为今天是弟弟的生日，所以我们给他买了蛋糕。","Yīnwèi jīntiān shì dìdi de shēngrì, suǒyǐ wǒmen gěi tā mǎile dàngāo.","Өнөөдөр дүүгийн төрсөн өдөр тул бид түүнд бялуу авсан.")],
  "common_mistakes":[{"wrong":"所以爸爸忙，因为有很多事情。","right":"因为爸爸有很多事情，所以很忙。","why":"Эхлээд шалтгаан, дараа нь үр дүн."}],
  "check":chk("«Компьютер эвдэрсэн тул интернэтэд орж чадахгүй» гэх зөв өгүүлбэр:",["因为电脑坏了，所以不能上网。","所以电脑坏了，因为不能上网。","电脑坏了，因为所以上网。"],"因为电脑坏了，所以不能上网。","g2c"),
  "exercises":[
   choice("因为忙，________ 没有去。",["所以","因为","但是"],"所以","Зөв! 所以 = тиймээс.","Үр дүнг 所以-гаар эхэлнэ.","g2e1"),
   choice("因为今天是弟弟的生日，所以我们给他买了 ________ 。",["蛋糕","雨伞","电影"],"蛋糕","Зөв! Төрсөн өдөрт бялуу авна.","Төрсөн өдөр бялуу авдаг.","g2e2"),
   judge("«因为……» нь шалтгаан, «所以……» нь үр дүнг хэлнэ.",True,"Зөв!","因为 = шалтгаан, 所以 = үр дүн.")]},
 {"point":"我是在……看的 · 看过 · 没看懂","gloss_mn":"«Би … дээрээс үзсэн юм» — хаана үзснээ хэлэх",
  "structure":"我是在 + хаана + 看的。",
  "teacher_mn":"Хаана үзснээ тодруулж хэлэхдээ «我是在……看的» гэнэ. «我是在电脑上看的» — Би компьютер дээрээс үзсэн. «看过» гэвэл урьд нь нэг удаа үзсэн. «没看懂» гэвэл үзсэн ч ойлгосонгүй. Чи сүүлд үзсэн киногоо хаана үзсэн бэ?",
  "teacher_notes":"Номын яриа 2: 你看过这个电影吗？ 看过，我是在电脑上看的。 Let's match: 我是在电影院里看的。",
  "examples":[ex("你看过这个电影吗？","Nǐ kànguo zhège diànyǐng ma?","Чи энэ киног үзсэн үү?"),ex("看过，我是在电脑上看的。","Kànguo, wǒ shì zài diànnǎo shang kàn de.","Үзсэн. Би компьютер дээрээс үзсэн юм."),ex("我是在电影院里看的。","Wǒ shì zài diànyǐngyuàn li kàn de.","Би кино театрт үзсэн юм."),ex("我也看了，但是没看懂。","Wǒ yě kàn le, dànshì méi kàn dǒng.","Би ч үзсэн, гэвч ойлгосонгүй.")],
  "common_mistakes":[{"wrong":"我在电脑上看是的。","right":"我是在电脑上看的。","why":"«是» нь «在»-ийн өмнө, «的» нь төгсгөлд орно."}],
  "check":chk("«Би кино театрт үзсэн» хятадаар:",["我是在电影院里看的。","我没看懂。","你看过吗？"],"我是在电影院里看的。","g3c"),
  "exercises":[
   choice("我是在电脑上 ________ 的。",["看","吃","喝"],"看","Зөв! 看 = үзэх.","Кино «үзнэ» — 看.","g3e1"),
   choice("«Үзсэн ч ойлгосонгүй» хятадаар:",["没看懂","看过","不知道"],"没看懂","Зөв! 懂 = ойлгох.","没看懂 = үзсэн ч ойлгосонгүй.","g3e2"),
   judge("«看过» гэдэг нь «урьд нь үзсэн» гэсэн утгатай.",True,"Зөв!","过 = урьд нь хийж үзсэн.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Кино» хятадаар аль нь вэ?",["电影","学校","朋友","老师"],"电影","电影 (diànyǐng) = кино.","easy",["vocabulary"],"a1")
q("choice","«Яагаад» хятадаар аль нь вэ?",["为什么","什么","怎么样","谁"],"为什么","为什么 (wèi shénme) = яагаад.","easy",["vocabulary"],"a2")
q("choice","«Завгүй» хятадаар аль нь вэ?",["忙","高","累","好"],"忙","忙 (máng) = завгүй.","easy",["vocabulary"],"a3")
q("choice","«Зүйл, ажил хэрэг» хятадаар аль нь вэ?",["事情","意思","电影","名字"],"事情","事情 (shìqing) = зүйл, ажил хэрэг.","easy",["vocabulary"],"a4")
q("choice","«Утга» хятадаар аль нь вэ?",["意思","事情","朋友","电影"],"意思","意思 (yìsi) = утга.","easy",["vocabulary"],"a5")
q("choice","«因为» гэдэг үг ямар утгатай вэ?",["учир нь","тиймээс","гэвч","яагаад"],"учир нь","因为 (yīnwèi) = учир нь.","easy",["vocabulary"],"a6")
q("choice","«所以» гэдэг үг ямар утгатай вэ?",["тиймээс","учир нь","гэвч","хамт"],"тиймээс","所以 (suǒyǐ) = тиймээс.","easy",["vocabulary"],"a7")
q("choice","Пиньинь «diànyǐng» гэж уншдаг үг:",["电影","电脑","学校","意思"],"电影","电影 = diànyǐng = кино.","easy",["pronunciation"],"a8")
q("choice","Пиньинь «wèi shénme» гэж уншдаг үг:",["为什么","什么","怎么","因为"],"为什么","为什么 = wèi shénme = яагаад.","medium",["pronunciation"],"a9")
q("choice","Пиньинь «shìqing» гэж уншдаг үг:",["事情","意思","电影","休息"],"事情","事情 = shìqing = зүйл, ажил хэрэг.","medium",["pronunciation"],"a10")
q("choice","Пиньинь «yìsi» гэж уншдаг үг:",["意思","事情","休息","电影"],"意思","意思 = yìsi = утга.","medium",["pronunciation"],"a11")
q("choice","«爸爸为什么不休息？» гэж юу гэсэн үг вэ?",["Аав яагаад амрахгүй байна вэ?","Аав хаана байна вэ?","Аав кино үзсэн үү?","Аав завгүй юу?"],"Аав яагаад амрахгүй байна вэ?","为什么 = яагаад, 不休息 = амрахгүй.","easy",["dialogue"],"a12")
q("choice","Яриа 1-д ээж аав яагаад амрахгүй байгааг юу гэж хэлсэн бэ?",["Аавд ажил их байгаа","Аав ядарсан","Аав кино үзэж байна","Аав гэртээ байхгүй"],"Аавд ажил их байгаа","因为爸爸有很多事情，所以很忙。","medium",["dialogue"],"a13")
q("choice","«我是在电脑上看的» гэж юу гэсэн үг вэ?",["Би компьютер дээрээс үзсэн юм","Би компьютер худалдаж авсан","Би кино театрт явсан","Би киног ойлгосонгүй"],"Би компьютер дээрээс үзсэн юм","在电脑上 = компьютер дээр, 看的 = үзсэн.","medium",["dialogue"],"a14")
q("choice","Яриа 2-т хоёр хүү киноны юуг ойлгохгүй байна вэ?",["Киноны нэрийн утгыг","Киноны үнийг","Киноны цагийг","Киноны газрыг"],"Киноны нэрийн утгыг","这个电影的名字是什么意思？","medium",["dialogue"],"a15")
q("choice","«没看懂» гэж юу гэсэн үг вэ?",["Үзсэн ч ойлгосонгүй","Үзээгүй","Дахин үзнэ","Үзэх дуртай"],"Үзсэн ч ойлгосонгүй","看懂 = үзээд ойлгох, 没 = үгүй.","medium",["dialogue"],"a16")
q("cloze","爸爸（ ）什么不休息？",["为","是","在","有"],"为","为什么 = яагаад.","easy",["structure"],"a17")
q("cloze","（ ）为爸爸太忙了。",["因","所","但","还"],"因","因为 = учир нь.","easy",["structure"],"a18")
q("cloze","因为爸爸有很多事情，（ ）以很忙。",["所","因","但","也"],"所","所以 = тиймээс.","medium",["structure"],"a19")
q("cloze","爸爸有很多（ ）情。",["事","意","电","学"],"事","事情 = ажил, зүйл.","medium",["structure"],"a20")
q("cloze","这个电影的名字是什么（ ）思？",["意","事","电","忙"],"意","意思 = утга.","medium",["structure"],"a21")
q("cloze","我是在电影院里（ ）的。",["看","吃","喝","爱"],"看","看的 = үзсэн.","medium",["structure"],"a22")
q("choice","Аль өгүүлбэр зөв бэ?",["因为我忙，所以没有去。","所以我忙，因为没有去。","我忙因为，没有所以去。","因为所以我忙去。"],"因为我忙，所以没有去。","Эхлээд шалтгаан (因为), дараа нь үр дүн (所以).","hard",["structure"],"a23")
q("choice","«因为要下雨了，所以……» — үр дүнг сонго:",["妈妈让我拿雨伞","我们给他买了蛋糕","我不知道是什么意思","他要晚一点儿回家"],"妈妈让我拿雨伞","Бороо орох гэж байгаа тул шүхэр аваарай гэнэ.","medium",["structure"],"a24")
q("usage","Найз чинь «爸爸为什么不休息？» гэж асуувал та юу гэж хариулах вэ?",["因为爸爸太忙了。","我也看了。","所以很忙。","你好！"],"因为爸爸太忙了。","为什么-д 因为-аар хариулна.","medium",["usage"],"a25")
q("usage","Найз чинь «你看过这个电影吗？» гэж асуулаа. Чи үзсэн бол:",["看过，我是在电脑上看的。","因为我很忙。","没关系。","我不知道。"],"看过，我是在电脑上看的。","看过 = үзсэн.","medium",["usage"],"a26")
q("usage","Киноны нэрийн утгыг мэдэхгүй бол юу гэж асуух вэ?",["这个电影的名字是什么意思？","这个电影在哪儿？","你为什么忙？","你看过吗？"],"这个电影的名字是什么意思？","什么意思 = ямар утгатай вэ.","medium",["usage"],"a27")
q("usage","Mini story-д хүү яагаад «他们都忙着找我呢» гэж хэлсэн бэ?",["Цагдаа нар түүнийг хайж байгаа тул","Аав нь гэртээ байхгүй тул","Ээж нь утсаар ярьж байгаа тул","Тэр кино үзэж байгаа тул"],"Цагдаа нар түүнийг хайж байгаа тул","Хүү орны доор нуугдаж, цагдаа нар түүнийг хайж байна — энэ бол хошигнол.","hard",["usage"],"a28")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
BANK3 = ["A","B","C"]
BANK = ["A","B","C","D"]
BANK2 = [img("t2a"),img("t2b"),img("t2c"),img("t2d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (10-04) сонсоод зөв хариуг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"A 电影多长时间　B 电影有没有意思　C 电影院有多远","script_zh":"男：昨天我和同学去看电影了。 女：电影有意思吗？ 问：女的想知道什么？","options":BANK3,"optionTexts":["电影多长时间","电影有没有意思","电影院有多远"],"answer":"B","explanation_mn":"«Өчигдөр би ангийнхантайгаа кино үзсэн. — Кино сонирхолтой байсан уу?» гэж охин асуусан. Тэгэхээр охин «кино сонирхолтой юу» гэдгийг мэдэхийг хүсч байна — B. A (киноны урт), C (кино театр хэр хол) тухай яриагүй."},
    {"n":2,"question_zh":"A 今年不太忙　B 今年没有去年忙　C 今年太忙了","script_zh":"女：和去年比，你瘦多了。 男：因为今年比去年忙。 问：男的是什么意思？","options":BANK3,"optionTexts":["今年不太忙","今年没有去年忙","今年太忙了"],"answer":"C","explanation_mn":"Охин «Өнгөрсөн жилтэй харьцуулахад чи их туранхайлжээ» гэхэд хүү «Энэ жил өнгөрсөн жилээс завгүй» гэсэн. Өөрөөр хэлбэл энэ жил маш завгүй — C. A, B-д «завгүй биш» гэсэн эсрэг утгатай."},
    {"n":3,"question_zh":"A 自己做事情很好　B 帮妈妈做事情很好　C 自己的事情很多","script_zh":"男：我会自己穿衣服。 女：很好，自己的事情自己做。 问：女的是什么意思？","options":BANK3,"optionTexts":["自己做事情很好","帮妈妈做事情很好","自己的事情很多"],"answer":"A","explanation_mn":"Хүү «Би өөрөө хувцаслаж чадна» гэхэд ээж «Сайн байна, өөрийн ажлаа өөрөө хий» гэсэн. Өөрөө хийх сайн гэсэн утга — A. B (ээжид тусалж), C (ажил их) гэж хэлээгүй."},
    {"n":4,"question_zh":"A 去学校　B 看医生　C 看电影","script_zh":"男：天气这么热，我们去游泳吧。 女：不去了，我和妈妈去看电影。 问：他们为什么不去游泳？","options":BANK3,"optionTexts":["去学校","看医生","看电影"],"answer":"C","explanation_mn":"Хүү «Маш халуун байна, сэлэхээр явья» гэхэд охин «Үгүй, би ээжтэйгээ кино үзэх юм» гэсэн. Тиймээс сэлэхгүй шалтгаан нь кино үзэх — C."}],
   "answer_source":"YCT 4 Test Answers L10: 1.B 2.C 3.A 4.C"},
  {"part":2,"type":"choice","instruction_mn":"Унших — яриа бүрд тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"A：今天妈妈事情多，不能送你去学校。 B：没关系，我坐公共汽车去。","question_mn":"— Өнөөдөр ээжид ажил их, чамайг сургуульд хүргэж чадахгүй. — Зүгээр ээ, би автобусаар явна.","options":BANK,"optionImages":BANK2,"answer":"B","explanation_mn":"«Би автобусаар явна» (坐公共汽车) — B зураг дээр автобус байна. A цаг, C бүжиглэж буй охид, D кино театр."},
    {"n":6,"question_zh":"A：没和她一起跳舞，为什么？ B：因为脚还没好，所以没和她一起跳舞。","question_mn":"— Яагаад түүнтэй хамт бүжиглээгүй юм? — Хөл минь анагаагүй болохоор түүнтэй хамт бүжиглээгүй.","options":BANK,"optionImages":BANK2,"answer":"C","explanation_mn":"Яриа бүхэлдээ бүжгийн тухай (跳舞) — C зураг дээр бүжгийн хувцастай хоёр охин зогсож байна."},
    {"n":7,"question_zh":"A：喂，妈妈，您什么时候回来？ B：我今天太忙了，要晚一点儿回去。","question_mn":"— Алло, ээж ээ, та хэзээ ирэх вэ? — Би өнөөдөр дэндүү завгүй, жаахан оройтож очно.","options":BANK,"optionImages":BANK2,"answer":"A","explanation_mn":"«Хэзээ ирэх вэ?», «оройтож очно» — цагийн тухай яриа. A зураг дээр сэрүүлэгтэй цаг байна."},
    {"n":8,"question_zh":"A：去电影院要多长时间？ B：走过去要半个小时。","question_mn":"— Кино театр руу очиход хэр удах вэ? — Алхаад очиход хагас цаг болно.","options":BANK,"optionImages":BANK2,"answer":"D","explanation_mn":"电影院 = кино театр. D зураг дээр кино театрын танхим, том дэлгэц байна."}],
   "answer_source":"YCT 4 Test Answers L10: 5.B 6.C 7.A 8.D"},
  {"part":3,"type":"match","instruction_mn":"Let's match — зүүн талын өгүүлбэрт тохирох баруун талын өгүүлбэрийг сонго.","items":[
    {"n":1,"question_zh":"因为我的电脑坏了，","answer":"所以不能上网。","explanation_mn":"Компьютер эвдэрсэн тул интернэтэд орж чадахгүй. 因为…所以… хос."},
    {"n":2,"question_zh":"明天你忙吗？","answer":"很忙，有很多事情。","explanation_mn":"Завгүй юу гэж асуусан тул «Их завгүй, ажил их» гэж хариулна."},
    {"n":3,"question_zh":"这个电影你是在哪儿看的？","answer":"我是在电影院里看的。","explanation_mn":"«Хаана үзсэн?» — «Кино театрт үзсэн» гэж хариулна."}],
   "answer_source":"Let's match х.50 (1-C, 2-B, 3-A)"},
  {"part":4,"type":"choice","instruction_mn":"Let's try — шалтгааныг тохируулж өгүүлбэрийг гүйцээ.","items":[
    {"n":1,"question_zh":"因为____，所以妈妈让我拿雨伞。","options":["要下雨了","我没看懂","他还有很多事情"],"answer":"要下雨了","explanation_mn":"Бороо орох гэж байгаа тул ээж шүхэр аваарай гэнэ (D)."},
    {"n":2,"question_zh":"因为____，所以我们给他买了蛋糕。","options":["今天是弟弟的生日","杯子太漂亮了","那些都是新教室"],"answer":"今天是弟弟的生日","explanation_mn":"Төрсөн өдөрт бялуу авна (C)."},
    {"n":3,"question_zh":"因为____，所以我们还没去过。","options":["那些都是新教室","要下雨了","我没看懂"],"answer":"那些都是新教室","explanation_mn":"Шинэ анги тул одоохондоо очиж үзээгүй (E)."},
    {"n":4,"question_zh":"因为____，所以我不知道是什么意思。","options":["我没看懂","今天是弟弟的生日","杯子太漂亮了"],"answer":"我没看懂","explanation_mn":"Ойлгоогүй болохоор утгыг нь мэдэхгүй (B)."},
    {"n":5,"question_zh":"因为____，所以今天他要晚一点儿回家。","options":["他还有很多事情","要下雨了","那些都是新教室"],"answer":"他还有很多事情","explanation_mn":"Ажил их тул оройтож гэртээ ирнэ (A)."},
    {"n":6,"question_zh":"因为____，所以很快就卖完了。","options":["杯子太漂亮了","我没看懂","今天是弟弟的生日"],"answer":"杯子太漂亮了","explanation_mn":"Аяга маш гоё тул хурдан зарагдаж дууссан (F)."}],
   "answer_source":"Let's try х.50 (хариу утгаар тааруулсан: 1 D, 2 C, 3 E, 4 B, 5 A, 6 F)"},
  {"part":5,"type":"match","instruction_mn":"Mini story «每个人都很忙» — зураг бүрд тохирох өгүүлбэрийг сонго.","image":img("story"),"items":[
    {"n":1,"question_zh":"喂，你好！","answer":"1","explanation_mn":"1-р зураг дээр утсаар «喂，你好！» гэж мэндэлж байна."},
    {"n":2,"question_zh":"不能，妈妈现在很忙。","answer":"2","explanation_mn":"2-р зураг дээр ээжтэй ярихыг хүсэхэд хүү «болохгүй» гэнэ."},
    {"n":3,"question_zh":"爸爸在家，但是也不能说话。","answer":"3","explanation_mn":"3-р зураг дээр аавтай ярихыг хүснэ."},
    {"n":4,"question_zh":"还有警察。","answer":"4","explanation_mn":"4-р зураг дээр «танайд өөр хүн байна уу?» гэхэд «цагдаа» гэнэ."},
    {"n":5,"question_zh":"他们都忙着找我呢。","answer":"5","explanation_mn":"5-р зураг дээр хүү орны доор нуугдаж байна — цагдаа нар түүнийг хайж байна."}],
   "answer_source":"textbook х.51 (Mini story)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «忙» гэсэн ханзыг дахин бичиж хуул.","question_zh":"忙","answer":"忙","explanation_mn":"Зүүн талд «心» (зүрх) хэсэг, баруун талд «亡». Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Excuse Finder — «为什么……？» гэж асуугаад найз нь «因为……» гэж шалтаг хэлэх.","question_zh":"你为什么没做作业？ 因为……","answer":"(нээлттэй)","explanation_mn":"Хамгийн хөгтэй шалтгаан зохиосон нь хожно."},
   {"n":2,"prompt_mn":"Let's try — шалтгааныг хэлээд найздаа үр дүнг нь таалга.","question_zh":"因为……，所以……","answer":"(нээлттэй)","explanation_mn":"Эхлээд 因为, дараа нь 所以."},
   {"n":3,"prompt_mn":"Хошин түүхээ хятадаар ярь.","question_zh":"你还知道别的笑话吗？","answer":"(нээлттэй)","explanation_mn":"Мэдэхгүй бол «每个人都很忙» түүхийг дахин ярь."}]},
 "answerSource":"YCT 标准教程 4 · Test Listening Scripts, Test Answers (Lesson 10)"}
dump("workbook.json", workbook)

# ---------------- IMAGE PROMPTS ----------------
NOTXT = " No English text anywhere in the image."
P = []
def ip(file,aspect,title,section,prompt,chars,role=None):
    d={"file":file,"aspect":aspect,"title":title,"section":section}
    if role: d["role"]=role
    d["prompt"]=prompt+NOTXT; d["chars"]=chars; P.append(d)
ip("images/hero.jpg","4:3","爸爸为什么不休息？","teacher-intro","Teacher Camel (yellow camel with glasses) stands with a little girl camel calf and a yellow calf boy in front of a front door; an adult camel father in a blue jacket stands at the door holding a briefcase, looking tired and busy. A speech bubble with the Chinese text 为什么 in large clear black font.",["temee","huu","ohin"],"hero")
ip("images/w-dianying.jpg","1:1","电影","vocabulary","A cozy movie theater scene: the yellow calf boy and the girl calf sit with popcorn watching a big screen, a classic film reel icon above them.",["huu","ohin"])
ip("images/w-weishenme.jpg","1:1","为什么","vocabulary","The brown calf boy with green hat scratches his head with a big question mark floating above him, curious and puzzled expression.",["bor"])
ip("images/w-mang.jpg","1:1","忙","vocabulary","The yellow calf boy has many arms at once: sweeping, carrying a bucket, holding papers and a phone, looking very busy and sweaty, a funny cartoon scene.",["huu"])
ip("images/w-shiqing.jpg","1:1","事情","vocabulary","A big pile of tasks around the girl calf: a stack of books, a broom, a laundry basket, a to-do list scroll, she looks at them with wide eyes.",["ohin"])
ip("images/w-yisi.jpg","1:1","意思","vocabulary","Teacher Camel points to a big magnifying glass over a mysterious signboard; a small thought bubble with a lightbulb shows he is explaining the meaning.",["temee","bor"])
ip("images/w-yinweisuoyi.jpg","1:1","因为……所以……","vocabulary","Two panels side by side: left, dark rain clouds and rain; right, the girl calf holding a red umbrella happily, with a clear arrow from left to right showing cause and effect.",["ohin"])
ip("images/d1.jpg","4:3","爸爸为什么不休息？","dialogue","At home entrance in the evening, a girl calf asks her adult camel mother; an adult camel father in a blue jacket holds a briefcase at the door waving tiredly. Speech bubble with the Chinese text 爸爸为什么不休息？ in large clear black font.",["ohin","temee"])
ip("images/d2.jpg","4:3","你看过这个电影吗？","dialogue","Two calf boys (yellow calf in blue vest and brown calf with green hat) stand in front of a cinema poster with hands playing rock-paper-scissors. Speech bubble with the Chinese text 你看过这个电影吗？ in large clear black font.",["huu","bor"])
ip("images/story.jpg","4:3","每个人都很忙","story","A funny phone call scene: an uncle camel with headset on the phone, and in a thought bubble a calf boy hiding under a bed holding a phone, with tiny police camels looking around the room. Chinese text 每个人都很忙 as a title banner in large clear black font.",["bor","temee"],"illustration")
dump("image_prompts.json", P, base="/home/claude/work/yct4/l10")

# ---------------- LESSON / MANIFEST ----------------
ROLE = {"images/hero.jpg":"hero"}
images = [{"id":re.sub(r"^images/|\.jpg$","",p["file"]).replace("story","story-art") if p["file"]=="images/story.jpg" else re.sub(r"^images/|\.jpg$","",p["file"]),"file":p["file"],"title":p["title"],"role":"hero" if p["section"]=="teacher-intro" else "illustration","section":p["section"]} for p in P]
images += [{"id":"story","file":"images/story.png","title":"每个人都很忙 · Mini story","role":"illustration","section":"story"}]
images += [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["2a","2b","2c","2d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 4 · 10-р хичээл — Аав яагаад амрахгүй байна вэ?","chineseTitle":"爸爸为什么不休息？","targetTitle":"爸爸为什么不休息？","mongolianTitle":"Аав яагаад амрахгүй байна вэ?",
 "subtitle":"为什么 · 忙 · 因为……所以…… · «每个人都很忙» хошин түүх",
 "description":f"«Яагаад?» гэж асууж, шалтгаан үр дүнгээ хэлж сурна. {len(vocab)} үг, 2 зурагт яриа, Mini story «每个人都很忙», 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"❓","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 4",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 4 — 第10课《爸爸为什么不休息？》 [hskLevel=2] [lessonNumber=10]; эх: сурах бичиг х.48–52; аудио CD 10-01…10-04 (бүгд байгаа)"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"爸爸为什么不休息？","mongolianTitle":"Аав яагаад амрахгүй байна вэ?",
 "series":"YCT 标准教程 4","seriesLabel_mn":"YCT 4 — Хүүхдийн хятад хэл (≈HSK2–3)",
 "source":"YCT 标准教程 4 · 第10课 (сурах бичиг + CD аудио 10-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L10)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
