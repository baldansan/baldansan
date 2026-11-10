#!/usr/bin/env python3
"""YCT 标准教程 3 · 第7课 生日快乐！"""
import json, os, hashlib, re
OUT = "/home/claude/work/yct3/l07/pkg"
CID, LID, N = "yct-3", "yct-3-l07", 7
os.makedirs(f"{OUT}/images", exist_ok=True)
def dump(name, obj):
    with open(f"{OUT}/{name}", "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, indent=1)
def shuffle(options, correct, seed):
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16); opts = list(options)
    for i in range(len(opts)-1, 0, -1):
        j = h % (i+1); h //= (i+1); opts[i], opts[j] = opts[j], opts[i]
    return opts, opts.index(correct)

from PIL import Image
_pg = Image.open("/home/claude/work/yct3/l07/pages/hi-39.png").convert("RGB")
_S = _pg.size[0]/828
_BOX = {"t1a":(180,500,280,588),"t1b":(335,500,445,595),"t1c":(515,500,625,595),"t1d":(672,500,790,595)}
for _k,_b in _BOX.items():
    _c = _pg.crop(tuple(int(v*_S) for v in _b)); _c = _c.resize((_c.width*2,_c.height*2), Image.LANCZOS); _c.save(f"{OUT}/images/{_k}.png")

AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_TEST = [f"audio/yct-3-07-0{i}.mp3" for i in (1,2,3,4)]
AUD_MAIN = "audio/yct-3-07-text-song.mp3"

VOCAB = [
 ("生日","shēngrì","төрсөн өдөр","нэр үг · гол үг","明天是妈妈的生日。","Míngtiān shì māma de shēngrì.","Маргааш ээжийн төрсөн өдөр.",True),
 ("礼物","lǐwù","бэлэг","нэр үг · гол үг","我们送她什么礼物？","Wǒmen sòng tā shénme lǐwù?","Бид түүнд ямар бэлэг өгөх вэ?",True),
 ("送","sòng","бэлэглэх, өгөх","үйл үг · гол үг","我送你一个礼物。","Wǒ sòng nǐ yí ge lǐwù.","Би чамд нэг бэлэг өгье.",True),
 ("给","gěi","…-д, …-ийн төлөө","үйл үг · гол үг","我们给妈妈做一个蛋糕吧。","Wǒmen gěi māma zuò yí ge dàngāo ba.","Бид ээждээ нэг бялуу хийж өгөөд үзье.",True),
 ("花","huā","цэцэг","нэр үг · гол үг","这是我们送您的花。","Zhè shì wǒmen sòng nín de huā.","Энэ цэцгийг бид танд өгч байна.",True),
 ("蛋糕","dàngāo","бялуу","нэр үг · гол үг","这个蛋糕很好吃。","Zhège dàngāo hěn hǎochī.","Энэ бялуу маш амттай.",True),
 ("吧","ba","…ээ, …цгаая (санал болгох үг)","дагавар үг · гол үг","来一起唱歌吧。","Lái yìqǐ chàng gē ba.","Хамт дуулъя даа.",True),
 ("但是","dànshì","гэвч, гэхдээ","холбоос үг · гол үг","这个蛋糕好吃，但是不好看。","Zhège dàngāo hǎochī, dànshì bù hǎokàn.","Энэ бялуу амттай, гэвч гоё харагдахгүй байна.",True),
 ("快乐","kuàilè","хөгжилтэй, баяр хөөртэй","тэмдэг нэр · гол үг","妈妈，生日快乐！","Māma, shēngrì kuàilè!","Ээж ээ, төрсөн өдрийн мэнд!",True),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 3","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

def tok(s):
    out=[]
    for t in s.split(" "):
        if not t: continue
        if "|" in t:
            z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
        elif out and not re.search(r"[一-鿿]", t):
            out[-1]["py"] = (out[-1]["py"] + " " + t).strip()
        else: out.append({"zh":t,"py":""})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Ээжид ямар бэлэг өгөх вэ?","scene_mn":"Маргааш ээжийн төрсөн өдөр. Эгч буйдан дээр сууж, дүүтэйгээ бэлгээ хэлэлцэж байна. Дүү нь ширээн дээр зураг зурж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"姐姐","zh":"明天是妈妈的生日。我们送她什么礼物？","pinyin":"Míngtiān shì māma de shēngrì. Wǒmen sòng tā shénme lǐwù?","mn":"Маргааш ээжийн төрсөн өдөр. Бид түүнд ямар бэлэг өгөх вэ?"},
           {"speaker":"弟弟","zh":"我们给妈妈做一个蛋糕吧。","pinyin":"Wǒmen gěi māma zuò yí ge dàngāo ba.","mn":"Ээждээ нэг бялуу хийж өгөөд үзье дээ."},
           {"speaker":"姐姐","zh":"你会做蛋糕吗？","pinyin":"Nǐ huì zuò dàngāo ma?","mn":"Чи бялуу хийж чадах уу?"},
           {"speaker":"弟弟","zh":"不会，但是我会画蛋糕。","pinyin":"Bú huì, dànshì wǒ huì huà dàngāo.","mn":"Үгүй, чадахгүй. Гэвч би бялуу зурж чадна."}]},
 {"id":2,"title_mn":"Яриа 2 · Ээжийн төрсөн өдрийн үдэшлэг","scene_mn":"Гэрт бөмбөлөг, «HAPPY BIRTHDAY» туг өлгөөтэй. Охин ээждээ цэцэг барьж байна. Дүү нь ширээн дээрх бялууг харж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"姐姐","zh":"妈妈，生日快乐！这是我们送您的花。","pinyin":"Māma, shēngrì kuàilè! Zhè shì wǒmen sòng nín de huā.","mn":"Ээж ээ, төрсөн өдрийн мэнд! Энэ цэцгийг бид танд өгч байна."},
           {"speaker":"妈妈","zh":"太漂亮了，谢谢。","pinyin":"Tài piàoliang le, xièxie.","mn":"Үнэхээр гоё юм, баярлалаа."},
           {"speaker":"弟弟","zh":"妈妈，现在可以吃蛋糕吗？","pinyin":"Māma, xiànzài kěyǐ chī dàngāo ma?","mn":"Ээж ээ, одоо бялуу идэж болох уу?"}]},
]
sentences=[]
dlg = [
 (1,"姐姐：明天是妈妈的生日。","Jiějie: Míngtiān shì māma de shēngrì.","Эгч: Маргааш ээжийн төрсөн өдөр.","姐姐：| 明天|míngtiān 是|shì 妈妈|māma 的|de 生日|shēngrì 。|","生日 = төрсөн өдөр. 妈妈的生日 = ээжийн төрсөн өдөр.",["生日"]),
 (1,"姐姐：我们送她什么礼物？","Jiějie: Wǒmen sòng tā shénme lǐwù?","Эгч: Бид түүнд ямар бэлэг өгөх вэ?","姐姐：| 我们|wǒmen 送|sòng 她|tā 什么|shénme 礼物|lǐwù ？|","送 = бэлэглэх. 礼物 = бэлэг.",[]),
 (1,"弟弟：我们给妈妈做一个蛋糕吧。","Dìdi: Wǒmen gěi māma zuò yí ge dàngāo ba.","Дүү: Ээждээ нэг бялуу хийж өгөөд үзье дээ.","弟弟：| 我们|wǒmen 给|gěi 妈妈|māma 做|zuò 一个|yí ge 蛋糕|dàngāo 吧|ba 。|","给妈妈 = ээжид, ээжийн төлөө. Төгсгөлийн 吧 нь «…цгаая» гэж зөөлхөн санал болгодог.",["我们给妈妈做一个蛋糕吧。"]),
 (1,"姐姐：你会做蛋糕吗？","Jiějie: Nǐ huì zuò dàngāo ma?","Эгч: Чи бялуу хийж чадах уу?","姐姐：| 你|nǐ 会|huì 做|zuò 蛋糕|dàngāo 吗|ma ？|","",[]),
 (1,"弟弟：不会，但是我会画蛋糕。","Dìdi: Bú huì, dànshì wǒ huì huà dàngāo.","Дүү: Үгүй, чадахгүй. Гэвч би бялуу зурж чадна.","弟弟：| 不会|bú huì ，| 但是|dànshì 我|wǒ 会|huì 画|huà 蛋糕|dàngāo 。|","但是 = гэвч, гэхдээ. Эхлээд чадахгүйгээ хэлээд, дараа нь чадах зүйлээ хэлнэ.",["我不会做蛋糕，但是我会画蛋糕。"]),
 (2,"姐姐：妈妈，生日快乐！","Jiějie: Māma, shēngrì kuàilè!","Эгч: Ээж ээ, төрсөн өдрийн мэнд!","姐姐：| 妈妈|māma ，| 生日|shēngrì 快乐|kuàilè ！|","生日快乐 = төрсөн өдрийн мэнд. Төрсөн өдөр дээр найздаа ингэж хэлдэг.",[]),
 (2,"姐姐：这是我们送您的花。","Jiějie: Zhè shì wǒmen sòng nín de huā.","Эгч: Энэ цэцгийг бид танд өгч байна.","姐姐：| 这|zhè 是|shì 我们|wǒmen 送|sòng 您|nín 的|de 花|huā 。|","您 = «Та» — ахмад хүнд хүндэтгэж хэлдэг.",[]),
 (2,"妈妈：太漂亮了，谢谢。","Māma: Tài piàoliang le, xièxie.","Ээж: Үнэхээр гоё юм, баярлалаа.","妈妈：| 太|tài 漂亮|piàoliang 了|le ，| 谢谢|xièxie 。|","",[]),
 (2,"弟弟：妈妈，现在可以吃蛋糕吗？","Dìdi: Māma, xiànzài kěyǐ chī dàngāo ma?","Дүү: Ээж ээ, одоо бялуу идэж болох уу?","弟弟：| 妈妈|māma ，| 现在|xiànzài 可以|kěyǐ 吃|chī 蛋糕|dàngāo 吗|ma ？|","可以 = болно. 现在 = одоо.",[]),
]
for para,zh,py,mn,tk,note,ks in dlg:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note
    if ks: s["key_structures"]=ks
    sentences.append(s)
song = [
 ("祝你生日快乐，","Zhù nǐ shēngrì kuàilè,","Чамд төрсөн өдрийн мэнд хүргэе,","祝|zhù 你|nǐ 生日|shēngrì 快乐|kuàilè ，|"),
 ("祝你生日快乐，","Zhù nǐ shēngrì kuàilè,","Чамд төрсөн өдрийн мэнд хүргэе,","祝|zhù 你|nǐ 生日|shēngrì 快乐|kuàilè ，|"),
 ("祝妈妈生日快乐，","Zhù māma shēngrì kuàilè,","Ээждээ төрсөн өдрийн мэнд хүргэе,","祝|zhù 妈妈|māma 生日|shēngrì 快乐|kuàilè ，|"),
 ("祝你每天快乐！","Zhù nǐ měitiān kuàilè!","Чамд өдөр бүр баяр жаргал хүсье!","祝|zhù 你|nǐ 每天|měitiān 快乐|kuàilè ！|"),
]
for i,(zh,py,mn,tk) in enumerate(song):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==0: s["note"]="Let's sing «生日快乐歌» (Төрсөн өдрийн дуу). 祝你…… = «чамд …-г ерөөе». Мөр бүрийг дуулж, хамт алгаа ташаарай."
    sentences.append(s)

texts = {
 "unit":{"number":"7","title":"生日快乐！","mongolianTitle":"Төрсөн өдрийн мэнд! — бэлэг өгөх, санал болгох"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Өмнөх номд чи хоол, хувцас, тоглоом, чадах зүйлсээ ярьж сурсан. Одоо нэг сайхан сэдэв байна. Чи төрсөн өдрөө хэрхэн тэмдэглэдэг вэ? Бялуу, цэцэг, бэлэг гэхээр сэтгэл хөдөлдөг биз дээ! Өнөөдөр «我们给妈妈做一个蛋糕吧» гэж ээждээ бэлэг бэлдэх санаагаа хэлж сурна. Мөн «我不会做蛋糕，但是我会画蛋糕» гэж чадахгүй зүйлээ хэлээд, чадах зүйлээ нэмж хэлнэ. Эцэст нь «生日快乐歌» дууг хятадаар дуулна. Эхэлцгээе!",
  "warmup_mn":"Чи хамгийн сүүлд хэний төрсөн өдөр дээр очсон бэ? Ээждээ ямар бэлэг өгмөөр байна?",
  "theme_zh":"生日 · 礼物 · 给 · 但是","theme_mn":"Төрсөн өдөр · бэлэг · -д · гэвч"},
 "warmup":{"mongolian":"Чи өөрийн төрсөн өдрөө хэрхэн тэмдэглэдэг вэ? Бялуу идэж, дуу дуулдаг уу?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"7","title":"生日快乐！","mongolianTitle":"Төрсөн өдрийн мэнд! — 2 яриа, дуу","title_mn":"Let's read · 2 яриа + Let's sing · 生日快乐歌","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 3 · 第7课 Let's read / Let's sing（CD 07-02, 07-03）","author_zh":"",
  "intro_zh":"两段小对话：我们送妈妈什么礼物？生日快乐！然后唱《生日快乐歌》。",
  "intro_mn":"Эхлээд хоёр яриа: ээжийн төрсөн өдөрт өгөх бэлгээ санал болгож, дараа нь бэлгээ өгнө. Дараа нь «生日快乐歌» дуулна. Эхлээд аудиог сонс, дараа нь хамт хэл! Дууны мөр бүрт алгаа ташаарай.",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Маргааш ээжийн төрсөн өдөр. Эгч, дүү хоёр бэлэг хэлэлцэнэ. Дүү бялуу хийж чадахгүй ч бялуу зурж чадна."},
   {"paragraph":2,"mn":"Яриа 2 — Хүүхдүүд ээждээ цэцэг өгч, төрсөн өдрийн мэнд хүргэнэ. Ээж баярлана. Дүү одоо бялуу идэж болох уу гэж асууна."},
   {"paragraph":3,"mn":"Дуу «生日快乐歌» — «Чамд төрсөн өдрийн мэнд хүргэе» дууг хятадаар дуулна. Аудио: 07-03."}],
  "reflection":{"questions_mn":["Чи төрсөн өдөр дээрээ юу хийдэг вэ?","Ээждээ ямар бэлэг өгөх вэ? «我送妈妈……» гэж хэлж үз.","Чи юу хийж чадахгүй, гэхдээ юу хийж чадах вэ?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Хүсэлтээ санал болго","zh":"我们给妈妈做一个蛋糕吧。","pinyin":"Wǒmen gěi māma zuò yí ge dàngāo ba.","mn":"Ээждээ нэг бялуу хийж өгөөд үзье дээ."},
  "writingPrompt_mn":"Найзаасаа «……吧» гэж санал тавь. Найз нь «但是我不会……» гэж шалтаг хэл."},
 "properNouns":[],
 "wordExplanation":[
  {"word":"给 · 吧","gloss":"gěi · ba — -д, төлөө · …цгаая","explanation":"给 гэдэг нь «-д, -ийн төлөө» гэсэн утгатай. «给妈妈做蛋糕» гэвэл ээжийн төлөө бялуу хийх гэсэн үг. Өгүүлбэрийн төгсгөлд 吧 нэмбэл зөөлөн санал болдог: «来吧！ 说吧！ 做蛋糕吧！»",
   "structure":"我们给 + хэн + юу хийх + 吧。","teacher_notes":"Хүүхэд найздаа «……吧» гэж хэлж, гараа даллан урь. Дүрмийн нэр томьёо хэрэглэхгүй.",
   "examples":[{"chinese":"我们给妈妈做一个蛋糕吧。","pinyin":"Wǒmen gěi māma zuò yí ge dàngāo ba.","mongolian":"Ээждээ нэг бялуу хийж өгөөд үзье дээ."},{"chinese":"来一起唱歌吧。","pinyin":"Lái yìqǐ chàng gē ba.","mongolian":"Хамт дуулъя даа."},{"chinese":"给他打电话吧。","pinyin":"Gěi tā dǎ diànhuà ba.","mongolian":"Түүнд утсаар залгаарай."}],
   "common_mistakes":[{"wrong":"我们妈妈给做一个蛋糕吧","right":"我们给妈妈做一个蛋糕吧。","why":"给 нь «妈妈»-н өмнө, 给妈妈 гэж хамт орно."}],
   "check":{"question":"«Ээждээ бялуу хийе дээ» хятадаар:","options":["我们给妈妈做一个蛋糕吧。","这是我们送您的花。","太漂亮了，谢谢。"],"answer":"0"},
   "practice":[{"n":1,"question":"我们 ________ 妈妈做一个蛋糕吧。(-д)","answer":"给","explanation_mn":"«Ээжийн төлөө» гэхдээ 给妈妈."}]},
  {"word":"但是","gloss":"dànshì — гэвч, гэхдээ","explanation":"Эхлээд нэг зүйлээ хэлээд, дараа нь «гэвч» гэж өөр зүйл нэмэхэд 但是 хэлнэ. «Би бялуу хийж чадахгүй, гэвч зурж чадна» гэх мэт.",
   "structure":"…，但是……。","teacher_notes":"Pair work: A «来一起唱歌吧。» B «但是我不会唱。» гэж хариулна.",
   "examples":[{"chinese":"我不会做蛋糕，但是我会画蛋糕。","pinyin":"Wǒ bú huì zuò dàngāo, dànshì wǒ huì huà dàngāo.","mongolian":"Би бялуу хийж чадахгүй, гэвч зурж чадна."},{"chinese":"这个蛋糕好吃，但是不好看。","pinyin":"Zhège dàngāo hǎochī, dànshì bù hǎokàn.","mongolian":"Энэ бялуу амттай, гэвч гоё харагдахгүй."},{"chinese":"来一起唱歌吧。 但是我不会唱。","pinyin":"Lái yìqǐ chàng gē ba. Dànshì wǒ bú huì chàng.","mongolian":"Хамт дуулъя. Гэвч би дуулж чадахгүй."}],
   "common_mistakes":[{"wrong":"但是我会画蛋糕，我不会做蛋糕。","right":"我不会做蛋糕，但是我会画蛋糕。","why":"Эхлээд чадахгүйгээ, дараа нь «гэвч»-ийн хойно чадах зүйлээ хэл."}],
   "check":{"question":"«Гэвч» хятадаар:","options":["但是","生日","礼物"],"answer":"0"},
   "practice":[{"n":1,"question":"我不会做蛋糕，________ 我会画蛋糕。","answer":"但是","explanation_mn":"«Гэвч» — 但是."}]},
  {"word":"送 · 礼物 · 生日快乐","gloss":"sòng · lǐwù · shēngrì kuàilè — бэлэглэх · бэлэг · төрсөн өдрийн мэнд","explanation":"Бэлэг өгөхдөө 送 гэнэ. «我送妈妈花» — би ээжид цэцэг өгнө. Төрсөн өдөр дээр «生日快乐！» гэж мэндлэнэ. Дуунд «祝你生日快乐» гэж ерөөдөг.",
   "structure":"我送 + хэнд + юу。","teacher_notes":"Ээж аав, найзынхаа төрсөн өдрийг ярьж, «我送……» гэж бэлгээ нэрлүүл.",
   "examples":[{"chinese":"我们送她什么礼物？","pinyin":"Wǒmen sòng tā shénme lǐwù?","mongolian":"Бид түүнд ямар бэлэг өгөх вэ?"},{"chinese":"这是我们送您的花。","pinyin":"Zhè shì wǒmen sòng nín de huā.","mongolian":"Энэ цэцгийг бид танд өгч байна."},{"chinese":"妈妈，生日快乐！","pinyin":"Māma, shēngrì kuàilè!","mongolian":"Ээж ээ, төрсөн өдрийн мэнд!"}],
   "common_mistakes":[{"wrong":"我送花妈妈","right":"我送妈妈花。","why":"Хэнд өгч байгаагаа эхэлж, дараа нь юу өгөхөө хэл."}],
   "check":{"question":"«Төрсөн өдрийн мэнд!» хятадаар:","options":["生日快乐！","我们送她什么礼物？","来吧！"],"answer":"0"},
   "practice":[{"n":1,"question":"妈妈，生日 ________ ！(мэнд)","answer":"快乐","explanation_mn":"«Төрсөн өдрийн мэнд» — 生日快乐."}]},
 ],
 "collocations":[{"type":"Бэлэг, төрсөн өдөр","rows":[
   {"head":"送","with":"礼物","mn":"бэлэг өгөх","usage_mn":"Хэнд ямар бэлэг өгөхөө хэлэх","example":{"zh":"我们送她什么礼物？","pinyin":"Wǒmen sòng tā shénme lǐwù?","mn":"Бид түүнд ямар бэлэг өгөх вэ?"}},
   {"head":"给","with":"妈妈做蛋糕","mn":"ээждээ бялуу хийх","usage_mn":"Хэний төлөө хийхээ хэлэх","example":{"zh":"我们给妈妈做一个蛋糕吧。","pinyin":"Wǒmen gěi māma zuò yí ge dàngāo ba.","mn":"Ээждээ нэг бялуу хийж өгөөд үзье дээ."}},
   {"head":"生日","with":"快乐","mn":"төрсөн өдрийн мэнд","usage_mn":"Төрсөн өдөр мэндлэх","example":{"zh":"妈妈，生日快乐！","pinyin":"Māma, shēngrì kuàilè!","mn":"Ээж ээ, төрсөн өдрийн мэнд!"}}]}],
 "wordComparison":[{"words":["花 huā","画 huà"],"note_mn":"花 (huā) = цэцэг, 画 (huà) = зурах. Ижил сонсогдож болох ч аялгуу өөр, ханз өөр. «我会画蛋糕» — зурна, «送花» — цэцэг өгнө."}],
 "textExercises":{
  "selectWord":{"instruction_mn":"Нөхөж бич — зөв үгийг сонго.","banks":[{"words":["给","但是","送","快乐","吧"],"items":[
     {"n":1,"question":"我们 ________ 妈妈做一个蛋糕吧。","answer":"给","explanation_mn":"«Ээжийн төлөө» — 给."},
     {"n":2,"question":"我不会做蛋糕，________ 我会画蛋糕。","answer":"但是","explanation_mn":"«Гэвч» — 但是."},
     {"n":3,"question":"我们 ________ 她什么礼物？","answer":"送","explanation_mn":"Бэлэг өгөхдөө 送."},
     {"n":4,"question":"妈妈，生日 ________ ！","answer":"快乐","explanation_mn":"生日快乐 = төрсөн өдрийн мэнд."},
     {"n":5,"question":"来一起唱歌 ________ 。","answer":"吧","explanation_mn":"Зөөлөн санал болгоход 吧."}]}],
   "answer_source":"agent-authored (YCT 3 · 7-р хичээлийн үгсээс)"},
  "comprehension":{"instruction_mn":"Яриаг дахин сонсоод асуултад хариул.","items":[
     {"n":1,"question_zh":"弟弟会做蛋糕吗？","answer":"不会，但是他会画蛋糕。","explanation_mn":"Яриа 1 — «不会，但是我会画蛋糕»."},
     {"n":2,"question_zh":"他们给妈妈送了什么礼物？","answer":"花。","explanation_mn":"Яриа 2 — «这是我们送您的花»."}],
   "answer_source":"textbook_verified (Let's read, х.34 Question)"},
  "retell":{"instruction_mn":"Тоглоомууд — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Үгэнд хүр","start_zh":"礼物！","instruction_mn":"Цаасан дээр 生日、礼物、花、蛋糕 гэж бичээд хана налуул. Ээж аав нэг үгийг хэлэхэд чи тэр цаасанд хамгийн түрүүнд гараараа хүр!"},
     {"label":"«吧» ба «但是» тоглоом","start_zh":"来一起唱歌吧。","instruction_mn":"Хосоороо тогло. Нэг нь «来一起唱歌吧！» гэж санал тавина. Нөгөө нь «但是我不会唱。» гэж шалтаг хэлнэ. Дараа нь «来一起跳舞吧！» гэх мэтээр өөр юм санал болго. Хэн илүү олон шалтаг олсон нь хожно."},
     {"label":"Бэлгийн уут","start_zh":"我送你一个礼物。","instruction_mn":"Уутанд цэцэг, бялуу, ном зэрэг жижиг зүйл хий. Найз нэгийг нь гаргаад «我送你一个礼物！» гэж хэл. Тэр хариуд «谢谢！» гэнэ."},
     {"label":"Ээждээ мэнд хүргэ","start_zh":"妈妈，生日快乐！","instruction_mn":"Гэрийнхэндээ «生日快乐！» гэж хэлээд «生日快乐歌» дууг хамт дуул. Дуулахдаа бялууны зураг зурж, түүн дээр «祝妈妈生日快乐» гэж бичээрэй."},
     {"label":"Зураад харьцуул","start_zh":"……人……，但是中国人……。","instruction_mn":"Монголын төрсөн өдрийг Хятадынхтай харьцуул. Жишээ нь: хятадууд урт удаан насалъя гэж урт гоймон иддэг. Монголчууд юу хийдэг вэ? Зураг зураад гэрийнхэндээ тайлбарла."}]}},
 "grammarNotes":[],
 "culture":{"title":"长寿面","title_mn":"Хятадын төрсөн өдрийн ёс — 长寿面","text_mn":"Хятад хүүхэд төрсөн өдрөө 长寿面 буюу «урт насны гоймон» идэж тэмдэглэдэг. Гоймон урт байх тусам нас урт гэж үздэг тул тасалж зажилдаггүй. Нэг настай хүүхдийг хивс дээр тавиад, ном, үзэг, жижиг зүйлс дундаас юу сонгохыг харна. Үүнийг 抓周 гэдэг. Мөн хүн бүр төрсөн жилийнхээ амьтантай — 十二生肖 буюу 12 амьтны жил. Монголчууд ч 12 жилийн амьтнаа мэддэг шүү дээ.","note_mn":"Чи ямар амьтны жилд төрсөн бэ? Монголд төрсөн өдөр дээр юу иддэг вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — төрсөн өдөр, бэлэг, санал болгох, чадах зүйлээ хэлэх.","topic":"Төрсөн өдрөө хэрхэн тэмдэглэх вэ?","discussion":["Хосоороо: нэг нь «来一起……吧» гэж санал тавина, нөгөө нь «但是我不会……» гэж хариулна.","Гэр бүлийнхээ хүнд «生日快乐！» гэж хэлж, цэцэг эсвэл зураг бэлэглэ."],
   "writing":{"promptChinese":"我们给……做……吧。","promptMongolian":"Гэрийн даалгавар: төрсөн өдрийн бялуу зураад «生日快乐！» гэж бич.","minChars":"0","requiredWords":["生日","快乐"],"sampleChinese":"妈妈，生日快乐！","sampleMongolian":"Ээж ээ, төрсөн өдрийн мэнд!","gradingRubric":"生日快乐 ба 给/但是-г зөв хэрэглэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 3 · Test Answers: L7 1.B 2.A 3.B 4.C 5.C 6.A 7.D 8.B","parts":[]},
}
dump("texts.json", texts)

def ex(zh,py,mn): return {"chinese":zh,"pinyin":py,"mongolian":mn}
def choice(q,opts,ans,ok,wrong,seed):
    o,i = shuffle(opts,ans,seed); return {"type":"choice","question":q,"options":o,"answer":str(i),"explanation_correct_mn":ok,"explanation_wrong_mn":wrong}
def judge(q,ans,ok,wrong): return {"type":"judge","question":q,"options":["Зөв","Буруу"],"answer":"true" if ans else "false","explanation_correct_mn":ok,"explanation_wrong_mn":wrong}
def chk(q,opts,ans,seed):
    o,i=shuffle(opts,ans,seed); return {"question":q,"options":o,"answer":str(i)}

grammar = [
 {"point":"我们给妈妈做一个蛋糕吧。 — ээждээ, …цгаая","gloss_mn":"«Ээждээ бялуу хийж өгөөд үзье» — хэний төлөө хийх, санал болгох",
  "structure":"我们给 + хэн + юу хийх + 吧。",
  "teacher_mn":"Хэн нэгний төлөө юм хийхдээ «给» гэнэ. 给妈妈 = ээжид, ээжийн төлөө. Өгүүлбэрийн төгсгөлд «吧» нэмбэл «…цгаая» гэж зөөлөн санал болно. Найздаа «来吧！» гэж хэлээд гараа даллаж үз!",
  "teacher_notes":"Номын яриа 1: 我们给妈妈做一个蛋糕吧。 Pair work-д: 来一起唱歌吧。",
  "examples":[ex("我们给妈妈做一个蛋糕吧。","Wǒmen gěi māma zuò yí ge dàngāo ba.","Ээждээ нэг бялуу хийж өгөөд үзье дээ."),ex("来一起唱歌吧。","Lái yìqǐ chàng gē ba.","Хамт дуулъя даа."),ex("给他打电话吧。","Gěi tā dǎ diànhuà ba.","Түүнд утсаар залгаарай.")],
  "common_mistakes":[{"wrong":"我们妈妈给做一个蛋糕吧","right":"我们给妈妈做一个蛋糕吧。","why":"给 нь «妈妈»-н өмнө, 给妈妈 гэж хамт орно."}],
  "check":chk("«Ээждээ бялуу хийе дээ» хятадаар:",["我们给妈妈做一个蛋糕吧。","这是我们送您的花。","太漂亮了，谢谢。"],"我们给妈妈做一个蛋糕吧。","g1c"),
  "exercises":[
   choice("我们 ________ 妈妈做一个蛋糕吧。",["给","送","但是"],"给","Зөв! 给妈妈 = ээжийн төлөө.","给 = -д, төлөө. 送 = бэлэглэх.","g1e1"),
   choice("«Хамт дуулъя даа» хятадаар:",["来一起唱歌吧。","生日快乐！","我会画蛋糕。"],"来一起唱歌吧。","Зөв! 吧 санал болгоно.","吧 нь өгүүлбэрийн төгсгөлд зөөлөн санал болгоно.","g1e2"),
   judge("«吧» гэдэг нь зөөлхөн санал болгох үг.",True,"Зөв! 来吧 = ирээрэй.","吧 = «…цгаая» гэж санал болгоно.")]},
 {"point":"我不会做蛋糕，但是我会画蛋糕。 — гэвч","gloss_mn":"«Би бялуу хийж чадахгүй, гэвч зурж чадна» — чадахгүй зүйлээсээ чадах зүйл рүү",
  "structure":"我不会……，但是我会……。",
  "teacher_mn":"Чадахгүй зүйлээ хэлээд, «гэвч» гээд чадах зүйлээ нэм. Хятадаар «但是» гэнэ. Бялуу хийж чадахгүй ч зурж чадна — энэ бол Дүү хүүгийн хариу. Чи юу хийж чадахгүй, юу хийж чадах вэ?",
  "teacher_notes":"Номын яриа 1 ба Key sentence. Pair work: 来一起唱歌吧。 但是我不会唱。",
  "examples":[ex("不会，但是我会画蛋糕。","Bú huì, dànshì wǒ huì huà dàngāo.","Үгүй, чадахгүй. Гэвч бялуу зурж чадна."),ex("这个蛋糕好吃，但是不好看。","Zhège dàngāo hǎochī, dànshì bù hǎokàn.","Энэ бялуу амттай, гэвч гоё харагдахгүй."),ex("来一起唱歌吧。 但是我不会唱。","Lái yìqǐ chàng gē ba. Dànshì wǒ bú huì chàng.","Хамт дуулъя. Гэвч би дуулж чадахгүй.")],
  "common_mistakes":[{"wrong":"但是我会画蛋糕，我不会做蛋糕。","right":"我不会做蛋糕，但是我会画蛋糕。","why":"Эхлээд нэг зүйл, дараа нь 但是-гийн хойно нөгөөг нь хэлнэ."}],
  "check":chk("«Гэвч» хятадаар:",["但是","生日","礼物"],"但是","g2c"),
  "exercises":[
   choice("我不会做蛋糕，________ 我会画蛋糕。",["但是","给","吧"],"但是","Зөв! 但是 = гэвч.","«Гэвч» гэж 但是.","g2e1"),
   choice("«Би бялуу зурж чадна» хятадаар:",["我会画蛋糕。","我不会做蛋糕。","我送你花。"],"我会画蛋糕。","Зөв! 画 = зурах.","画 = зурах, 做 = хийх.","g2e2"),
   judge("«不会» гэдэг нь «чадна» гэсэн үг.",False,"Зөв! 不会 = чадахгүй, чадна бол 会.","不会 = чадахгүй. «Чадна» бол 会.")]},
 {"point":"送 · 礼物 · 生日快乐","gloss_mn":"Бэлэг өгөх, төрсөн өдрийн мэнд хүргэх",
  "structure":"我们送她什么礼物？ 生日快乐！",
  "teacher_mn":"Бэлэг өгөхдөө «送» гэнэ. 礼物 = бэлэг. «我们送她什么礼物？» — бид түүнд ямар бэлэг өгөх вэ? Төрсөн өдөр дээр «生日快乐！» гэж хэлээд баярлаж үз.",
  "teacher_notes":"Номын яриа 1–2 ба дуу. 您 = «Та» ахмад хүнд.",
  "examples":[ex("我们送她什么礼物？","Wǒmen sòng tā shénme lǐwù?","Бид түүнд ямар бэлэг өгөх вэ?"),ex("这是我们送您的花。","Zhè shì wǒmen sòng nín de huā.","Энэ цэцгийг бид танд өгч байна."),ex("妈妈，生日快乐！","Māma, shēngrì kuàilè!","Ээж ээ, төрсөн өдрийн мэнд!")],
  "common_mistakes":[{"wrong":"我送花妈妈","right":"我送妈妈花。","why":"Хэнд өгч байгаагаа эхэлж хэл."}],
  "check":chk("«Төрсөн өдрийн мэнд!» хятадаар:",["生日快乐！","我们送她什么礼物？","来吧！"],"生日快乐！","g3c"),
  "exercises":[
   choice("我们 ________ 她什么礼物？",["送","给","吧"],"送","Зөв! 送 = бэлэглэх.","Бэлэг өгөхдөө 送.","g3e1"),
   choice("«Цэцэг» хятадаар:",["花","蛋糕","生日"],"花","Зөв! 花 = цэцэг.","花 = цэцэг, 蛋糕 = бялуу.","g3e2"),
   judge("«蛋糕» гэдэг нь «цэцэг» гэсэн үг.",False,"Зөв! 蛋糕 = бялуу, цэцэг нь 花.","蛋糕 = бялуу. Цэцэг бол 花.")]},
]
dump("grammar.json", grammar)

Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
q("choice","«Төрсөн өдөр» хятадаар аль нь вэ?",["生日","礼物","蛋糕","花"],"生日","生日 (shēngrì) = төрсөн өдөр.","easy",["vocabulary"],"a1")
q("choice","«Бэлэг» хятадаар аль нь вэ?",["礼物","生日","苹果","包子"],"礼物","礼物 (lǐwù) = бэлэг.","easy",["vocabulary"],"a2")
q("choice","«Бялуу» хятадаар аль нь вэ?",["蛋糕","花","包子","生日"],"蛋糕","蛋糕 (dàngāo) = бялуу.","easy",["vocabulary"],"a3")
q("choice","«Цэцэг» хятадаар аль нь вэ?",["花","画","送","给"],"花","花 (huā) = цэцэг. 画 = зурах.","easy",["vocabulary"],"a4")
q("choice","«送» гэдэг үг ямар утгатай вэ?",["бэлэглэх","зурах","идэх","чадах"],"бэлэглэх","送 (sòng) = бэлэглэх.","easy",["vocabulary"],"a5")
q("choice","«给» гэдэг үг ямар утгатай вэ?",["-д, -ийн төлөө","гэвч","цэцэг","амттай"],"-д, -ийн төлөө","给 (gěi) = -д, -ийн төлөө.","medium",["vocabulary"],"a6")
q("choice","«但是» гэдэг үг ямар утгатай вэ?",["гэвч, гэхдээ","бялуу","баяртай","чадах"],"гэвч, гэхдээ","但是 (dànshì) = гэвч.","easy",["vocabulary"],"a7")
q("choice","«快乐» гэдэг үг ямар утгатай вэ?",["хөгжилтэй, баяр хөөртэй","төрсөн өдөр","бэлэг","муухай"],"хөгжилтэй, баяр хөөртэй","快乐 (kuàilè) = хөгжилтэй, баяр хөөртэй.","easy",["vocabulary"],"a8")
q("choice","«Төрсөн өдрийн мэнд!» хятадаар:",["生日快乐！","我们送她什么礼物？","来一起唱歌吧。","太漂亮了。"],"生日快乐！","生日快乐 = төрсөн өдрийн мэнд.","easy",["dialogue"],"a9")
q("choice","«Бид түүнд ямар бэлэг өгөх вэ?» хятадаар:",["我们送她什么礼物？","你会做蛋糕吗？","现在可以吃蛋糕吗？","这是我们送您的花。"],"我们送她什么礼物？","送 + 礼物 = бэлэг өгөх.","medium",["dialogue"],"a10")
q("choice","Яриа 1-д дүү юу гэсэн бэ?",["Би бялуу зурж чадна","Би цэцэг авмаар байна","Би хоол идэхгүй","Би сургуульд явна"],"Би бялуу зурж чадна","不会，但是我会画蛋糕。","medium",["dialogue"],"a11")
q("choice","Яриа 2-т хүүхдүүд ээждээ юу өгсөн бэ?",["花","蛋糕","苹果","书"],"花","这是我们送您的花 — цэцэг өгсөн.","easy",["dialogue"],"a12")
q("cloze","我们（ ）妈妈做一个蛋糕吧。",["给","但是","花","快乐"],"给","给妈妈 = ээжийн төлөө.","easy",["dialogue"],"a13")
q("cloze","我不会做蛋糕，（ ）我会画蛋糕。",["但是","给","吧","送"],"但是","但是 = гэвч.","easy",["dialogue"],"a14")
q("cloze","妈妈，生日（ ）！",["快乐","礼物","蛋糕","花"],"快乐","生日快乐 = төрсөн өдрийн мэнд.","easy",["dialogue"],"a15")
q("cloze","来一起唱歌（ ）。",["吧","很","了","的"],"吧","吧 = «…цгаая» санал болгоно.","medium",["dialogue"],"a16")
q("choice","Эгч «你会做蛋糕吗？» гэвэл тэр юу асууж байна вэ?",["Чи бялуу хийж чадах уу?","Чи бялуу идэх үү?","Чи цэцэг авах уу?","Бялуу хэд вэ?"],"Чи бялуу хийж чадах уу?","会 = чадах, 吗 = асуух.","medium",["structure"],"a17")
q("choice","Найз «来一起唱歌吧» гэвэл чи дуулж чадахгүй. Юу гэх вэ?",["但是我不会唱。","生日快乐！","这是花。","我送你礼物。"],"但是我不会唱。","但是 = гэвч, 不会 = чадахгүй.","medium",["structure"],"a18")
q("choice","«吧» гэж өгүүлбэрийн төгсгөлд хэлбэл юу болох вэ?",["Зөөлөн санал","Асуулт","Үгүйсгэл","Тоо"],"Зөөлөн санал","来吧 = ирээрэй, …цгаая.","medium",["structure"],"a19")
q("choice","«Би бялуу хийж чадахгүй» хятадаар:",["我不会做蛋糕。","我会画蛋糕。","我送你花。","我要吃蛋糕。"],"我不会做蛋糕。","不会 = чадахгүй.","easy",["structure"],"a20")
q("choice","Пиньинь «shēngrì» гэж уншдаг үг:",["生日","礼物","蛋糕","快乐"],"生日","生日 = shēngrì = төрсөн өдөр.","easy",["pronunciation"],"a21")
q("choice","Пиньинь «lǐwù» гэж уншдаг үг:",["礼物","生日","但是","蛋糕"],"礼物","礼物 = lǐwù = бэлэг.","easy",["pronunciation"],"a22")
q("choice","Пиньинь «dàngāo» гэж уншдаг үг:",["蛋糕","但是","快乐","包子"],"蛋糕","蛋糕 = dàngāo = бялуу.","medium",["pronunciation"],"a23")
q("usage","Найзынхаа төрсөн өдөр дээр мэндлэхдээ юу гэх вэ?",["生日快乐！","再见！","谢谢。","不会。"],"生日快乐！","生日快乐 = төрсөн өдрийн мэнд.","easy",["usage"],"a24")
q("usage","Ээжид цэцэг өгөөд юу гэх вэ?",["这是我们送您的花。","我不会做蛋糕。","你会画画吗？","你吃苹果吗？"],"这是我们送您的花。","送 нь бэлэг өгөх, 您 = Та.","medium",["usage"],"a25")
q("usage","«生日快乐歌»-д «Ээжид мэнд хүргэе» гэсэн мөр аль нь вэ?",["祝妈妈生日快乐","祝你每天快乐","我会画蛋糕","这是我的书"],"祝妈妈生日快乐","祝妈妈生日快乐 = ээждээ төрсөн өдрийн мэнд хүргэе.","medium",["usage"],"a26")
q("usage","Хятадын төрсөн өдөр дээр идэх урт гоймон юу вэ?",["长寿面","包子","蛋糕","苹果"],"长寿面","长寿面 = урт насны гоймон.","hard",["usage"],"a27")
dump("quiz.json", Q)

def img(n): return f"images/{n}.png"
BANK = ["A","B","C","D"]; BANKIMG = [img("t1a"),img("t1b"),img("t1c"),img("t1d")]
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"choice","instruction_mn":"Сонсох — Аудио (07-04) сонсоод зөв хариултыг A, B, C-ээс сонго.","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）你想要什么生日礼物？","script_zh":"男：你想要什么生日礼物？ 女：我想要花。 问：男的会送女的什么？","options":["A","B","C"],"optionTexts":["蛋糕","花","画"],"answer":"B","explanation_mn":"Эмэгтэй «我想要花» — цэцэг авмаар байна гэсэн. Тиймээс эрэгтэй цэцэг өгнө. 蛋糕 бялуу, 画 зураг."},
    {"n":2,"question_zh":"（听录音）你吃蛋糕吗？","script_zh":"男：你吃蛋糕吗？这个蛋糕很好吃。 女：谢谢，我不吃了，我不饿。 问：女的现在觉得怎么样？","options":["A","B","C"],"optionTexts":["不饿","没吃饱","想吃蛋糕"],"answer":"A","explanation_mn":"Эмэгтэй «我不饿» — өлсөөгүй гэсэн. 没吃饱 бол цатгалан идээгүй, 想吃蛋糕 бялуу идмээр байна гэсэн үг тул буруу."},
    {"n":3,"question_zh":"（听录音）今天几号？","script_zh":"男：今天几号？ 女：今天三号，明天是我的生日。 问：哪天是她的生日？","options":["A","B","C"],"optionTexts":["三号","四号","今天"],"answer":"B","explanation_mn":"Өнөөдөр 3-ны өдөр, маргааш нь төрсөн өдөр. Тэгэхээр 4-ний өдөр. A 3-ны өдөр буюу өнөөдөр, C өнөөдөр гэсэн нь буруу."},
    {"n":4,"question_zh":"（听录音）生日那天你快乐吗？","script_zh":"男：生日那天你快乐吗？ 女：快乐，我最爱和小狗玩了。 问：女的生日那天做什么了？","options":["A","B","C"],"optionTexts":["不快乐","送礼物了","和小狗玩了"],"answer":"C","explanation_mn":"Охин «我最爱和小狗玩了» — хамгийн их нохойтой тоглох дуртай гэсэн. Тэр баярласан тул A буруу. Бэлэг өгсөн тухай яриагүй тул B буруу."}],
   "answer_source":"YCT 3 Test Answers L7: 1.B 2.A 3.B 4.C"},
  {"part":2,"type":"choice","instruction_mn":"Унших — яриа бүрд тохирох зургийг A, B, C, D-ээс сонго.","items":[
    {"n":5,"question_zh":"A：怎么了？不好吃？ B：我想吃水果蛋糕。","options":BANK,"optionImages":BANKIMG,"answer":"C","explanation_mn":"«Яасан бэ? Амттай биш юу? Би жимсний бялуу идмээр байна» — C зураг дээр хүү аяганы өмнө гунигтай сууж байна. A охин бэлгийн хайрцагтай, B хоёр хүн бэлэг, D хоёр хүүхэд идэж байна."},
    {"n":6,"question_zh":"A：这是谁送你的生日礼物？ B：我们班同学。","options":BANK,"optionImages":BANKIMG,"answer":"A","explanation_mn":"«Энэ бэлгийг чамд хэн өгсөн бэ? Манай ангийн найзууд.» — A зураг дээр охин бэлгийн хайрцагт хүрч байна. B дээр хоёр эр, C уйтгартай хүү, D идэж байна."},
    {"n":7,"question_zh":"女：这个蛋糕在哪儿买的？真好吃。 男：不是买的，是我奶奶自己做的。","options":BANK,"optionImages":BANKIMG,"answer":"D","explanation_mn":"Бялуу идэж байгаа хоёр хүүхэд — D зураг. Эмээ өөрөө хийсэн тул идэж, амттай гэж байна. A бэлэг, B эрчүүд, C уйтгартай хүү."},
    {"n":8,"question_zh":"A：让我看看，这是什么礼物？ B：不，这是爷爷给我买的。","options":BANK,"optionImages":BANKIMG,"answer":"B","explanation_mn":"Хоёр хүн бэлгийг харж байна — B зураг. Өвөө худалдаж авсан бэлгийг үзэхийг хүсэж байна. A дээр охин ганцаараа, C хүү гунигтай, D идэж байна."}],
   "answer_source":"YCT 3 Test Answers L7: 5.C 6.A 7.D 8.B"},
  {"part":3,"type":"match","instruction_mn":"Нөхөж бич — 给, 送, 但是, 吧, 快乐-аас зөв үгийг сонго.","items":[
    {"n":1,"question_zh":"我们____妈妈做一个蛋糕吧。","answer":"给","explanation_mn":"Ээжийн төлөө — 给."},
    {"n":2,"question_zh":"我们____她什么礼物？","answer":"送","explanation_mn":"Бэлэг өгөх — 送."},
    {"n":3,"question_zh":"我不会做蛋糕，____我会画蛋糕。","answer":"但是","explanation_mn":"Гэвч — 但是."},
    {"n":4,"question_zh":"来一起唱歌____。","answer":"吧","explanation_mn":"Санал болгох — 吧."},
    {"n":5,"question_zh":"生日____！","answer":"快乐","explanation_mn":"生日快乐 — төрсөн өдрийн мэнд."}],
   "answer_source":"Let's learn х.33 (хариу агент тааруулсан)"},
  {"part":4,"type":"match","instruction_mn":"Let's draw and compare — зураад хоосон зайг нөх.","items":[
    {"n":1,"question_zh":"……人……，但是中国人……。","answer":"(нээлттэй)","explanation_mn":"Монгол хүн төрсөн өдөр юу хийдэг, хятад хүн юу хийдэг вэ? Жишээ нь: монгол хүн бялуу иддэг, гэвч хятад хүн 长寿面 иддэг."}],
   "answer_source":"Let's draw and compare х.36"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Бичиж үз — «生日» гэсэн ханзыг дахин бичиж хуул.","question_zh":"生日","answer":"生日","explanation_mn":"Зураасыг дээрээс доош, зүүнээс баруун тийш бичнэ."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найздаа санал тавь.","question_zh":"来一起唱歌吧。","answer":"但是我不会唱。","explanation_mn":"Нэг нь санал тавина, нөгөө нь шалтаг хэлнэ."},
   {"n":2,"prompt_mn":"Төрсөн өдрийн дууг дуул.","question_zh":"祝你生日快乐。","answer":"(нээлттэй)","explanation_mn":"Аудио 07-03-ын хамт дуул."},
   {"n":3,"prompt_mn":"Ээждээ юу бэлэглэхээ хэл.","question_zh":"我送妈妈……","answer":"我送妈妈花。","explanation_mn":"Өөрийн бэлгээ нэрлэ."}]},
 "answerSource":"YCT 标准教程 3 · Test Listening Scripts, Test Answers (Lesson 7)"}
dump("workbook.json", workbook)

WORDKEYS=[("shengri","生日"),("liwu","礼物"),("song","送"),("gei","给"),("hua","花"),("dangao","蛋糕"),("ba","吧"),("danshi","但是"),("kuaile","快乐")]
images = [
 {"id":"hero","file":"images/hero.jpg","title":"生日快乐！","role":"hero","section":"teacher-intro"},
 {"id":"d1","file":"images/d1.jpg","title":"明天是妈妈的生日。","role":"illustration","section":"dialogue"},
 {"id":"d2","file":"images/d2.jpg","title":"妈妈，生日快乐！","role":"illustration","section":"dialogue"},
 {"id":"song","file":"images/song.jpg","title":"生日快乐歌","role":"illustration","section":"song"},
] + [{"id":f"w-{k}","file":f"images/w-{k}.jpg","title":z,"role":"illustration","section":"vocabulary"} for k,z in WORDKEYS] \
  + [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","1d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 3 · 7-р хичээл — Төрсөн өдрийн мэнд!","chineseTitle":"生日快乐！","targetTitle":"生日快乐！","mongolianTitle":"Төрсөн өдрийн мэнд!",
 "subtitle":"生日 · 礼物 · 蛋糕 · 给 · 但是 · «生日快乐歌» дуу",
 "description":f"Төрсөн өдөр, бэлэг, санал болгох (吧), «гэвч» (但是)-ийг сурна. {len(vocab)} үг, 2 зурагт яриа, «生日快乐歌» дуу, 3 дүрмийн сэдэв, {len(Q)} шалгалтын асуулт, номын тест — албан аудиотой, зурагтай.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"🎂","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 3",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 3 — 第7课《生日快乐！》 [hskLevel=2] [lessonNumber=7]; эх: сурах бичиг х.33–37; аудио CD 07-01…07-04"
}
dump("lesson.json", lesson)
manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":2,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"生日快乐！","mongolianTitle":"Төрсөн өдрийн мэнд!",
 "series":"YCT 标准教程 3","seriesLabel_mn":"YCT 3 — Хүүхдийн хятад хэл (≈HSK2)",
 "source":"YCT 标准教程 3 · 第7课 (сурах бичиг + CD аудио 07-01..04 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"story":AUD_SONG,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers L7)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан); орчуулга чангаар уншиж шалгасан"}
}
dump("manifest.json", manifest)

# image prompts
P=lambda f,a,t,s,pr,ch,role=None: dict(file=f,aspect=a,title=t,section=s,**({"role":role} if role else {}),prompt=pr,chars=ch)
NT=" No English text."
ip=[
 P("images/hero.jpg","4:3","生日快乐！","teacher-intro","Cheerful birthday party in a cozy room: Teacher Camel, the shaggy yellow camel with glasses, and three young camel calves hold a big birthday cake with candles, balloons and a flower bouquet, with a speech bubble with the Chinese text 生日快乐！ in large clear black font."+NT,["temee","huu","ohin","bor"],"hero"),
 P("images/d1.jpg","4:3","明天是妈妈的生日。","dialogue","Living room: the calf girl in a yellow dress sits on a sofa talking, while the yellow calf boy in a blue vest draws a cake on paper at the table; speech bubble with the Chinese text 明天是妈妈的生日。 in large clear black font."+NT,["ohin","huu"]),
 P("images/d2.jpg","4:3","妈妈，生日快乐！","dialogue","Birthday party at home with balloons and a banner: the calf girl hands a flower bouquet to an adult mother camel, the calf boy looks at a cake on the table with a speech bubble with the Chinese text 妈妈，生日快乐！ in large clear black font. A father camel in an apron stands nearby."+NT,["ohin","huu"]),
 P("images/song.jpg","4:3","生日快乐歌","song","Teacher Camel and the calves sing around a birthday cake with candles, clapping and holding music notes, speech bubble with the Chinese text 祝你生日快乐 in large clear black font."+NT,["temee","huu","ohin","bor"]),
]
wp={"shengri":("生日","The yellow calf boy blows out candles on a birthday cake with a small calendar page behind him."),
 "liwu":("礼物","The calf girl holds a big wrapped gift box with a red ribbon, smiling."),
 "song":("送","The brown calf boy hands a wrapped gift to the calf girl, who happily takes it."),
 "gei":("给","The calf girl gives a drawing to an adult mother camel, arrows suggest giving for someone."),
 "hua":("花","The calf girl smells a bunch of colorful flowers in a garden."),
 "dangao":("蛋糕","A big round cake with strawberries and one candle on a table."),
 "ba":("吧","The yellow calf boy waves and invites a friend with an open hand, speech bubble with the Chinese text 来吧 in large clear black font."),
 "danshi":("但是","The calf boy shakes his head and holds up a drawing instead of a cake, with a cake that is too hard to make shown crossed out in a thought bubble."),
 "kuaile":("快乐","Calves jump happily with balloons and big smiles.")}
for k,(z,pr) in wp.items():
    ip.append(P(f"images/w-{k}.jpg","1:1",z,"vocabulary",pr+NT,["huu","ohin","bor"]))
json.dump(ip,open("/home/claude/work/yct3/l07/image_prompts.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("vocab",len(vocab),"dialogues",len(dialogues),"sentences",len(sentences),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
