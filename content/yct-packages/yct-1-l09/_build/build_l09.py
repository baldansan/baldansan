#!/usr/bin/env python3
"""YCT 标准教程 1 · 第9课 今天星期几？ — Бөөндөө Сурцгаая хүүхдийн хичээлийн багц бүтээгч."""
import json, os, hashlib, shutil, subprocess
BASE = "/home/claude/work/yct1/l09"
OUT = f"{BASE}/pkg"
CID, LID, N = "yct-1", "yct-1-l09", 9
os.makedirs(f"{OUT}/audio", exist_ok=True)

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

# ---------------- AUDIO ----------------
A = f"{OUT}/audio"
AUD_WORDS, AUD_TEXT, AUD_SONG, AUD_STORY, AUD_TEST = ("audio/yct-1-09-words.mp3","audio/yct-1-09-text.mp3","audio/yct-1-09-song.mp3","audio/yct-1-09-story.mp3","audio/yct-1-09-test.mp3")
AUD_MAIN = "audio/yct-1-09-text-song.mp3"
for src, dst in [("01",AUD_WORDS),("02",AUD_TEXT),("03",AUD_SONG),("04",AUD_STORY),("05",AUD_TEST)]:
    if os.path.exists(f"{A}/yct-1-09-{src}.mp3") and not os.path.exists(f"{OUT}/{dst}"): shutil.copyfile(f"{A}/yct-1-09-{src}.mp3", f"{OUT}/{dst}")
lst = f"{BASE}/_concat.txt"
with open(lst,"w") as f:
    f.write(f"file '{OUT}/{AUD_TEXT}'\nfile '{OUT}/{AUD_SONG}'\n")
if not os.path.exists(f"{OUT}/{AUD_MAIN}"): subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-q:a","4",f"{OUT}/{AUD_MAIN}"],check=True)
os.remove(lst)

# ---------------- VOCAB ----------------
# (zh, py, mn, notes, ex_zh, ex_py, ex_mn, key)
VOCAB = [
 ("星期","xīngqī","долоо хоног, гариг","нэр үг · гол үг","今天星期五。","Jīntiān xīngqīwǔ.","Өнөөдөр баасан гариг.",True),
 ("星期一","Xīngqīyī","даваа гариг","нэр үг · гол үг","星期一，星期一。","Xīngqīyī, xīngqīyī.","Даваа, даваа. (chant-аас)",True),
 ("星期二","Xīngqī'èr","мягмар гариг","нэр үг · гол үг","明天星期二。","Míngtiān xīngqī'èr.","Маргааш мягмар гариг.",True),
 ("星期三","Xīngqīsān","лхагва гариг","нэр үг · гол үг","今天星期三，熊猫吃大餐。","Jīntiān xīngqīsān, xióngmāo chī dàcān.","Өнөөдөр лхагва, панд хоол хийж идэв. (mini story)",True),
 ("星期四","Xīngqīsì","пүрэв гариг","нэр үг · гол үг","今天星期四。","Jīntiān xīngqīsì.","Өнөөдөр пүрэв гариг.",True),
 ("星期五","Xīngqīwǔ","баасан гариг","нэр үг · гол үг","今天星期五。","Jīntiān xīngqīwǔ.","Өнөөдөр баасан гариг.",True),
 ("星期六","Xīngqīliù","бямба гариг","нэр үг · гол үг","明天星期六，我喜欢星期六。","Míngtiān xīngqīliù, wǒ xǐhuan xīngqīliù.","Маргааш бямба гариг, би бямбад дуртай.",True),
 ("星期天","Xīngqītiān","ням гариг","нэр үг · гол үг","昨天星期天。","Zuótiān xīngqītiān.","Өчигдөр ням гариг байлаа.",True),
 ("今天","jīntiān","өнөөдөр","цагийн үг · гол үг","今天星期几？","Jīntiān xīngqī jǐ?","Өнөөдөр ямар гариг вэ?",True),
 ("明天","míngtiān","маргааш","цагийн үг · гол үг","明天星期六。","Míngtiān xīngqīliù.","Маргааш бямба гариг.",True),
 ("昨天","zuótiān","өчигдөр","цагийн үг · chant-ын үг","昨天星期天。","Zuótiān xīngqītiān.","Өчигдөр ням гариг байлаа.",False),
 ("月","yuè","сар","нэр үг · гол үг","1月1号。","Yī yuè yī hào.","1 сарын 1.",True),
 ("号","hào","өдөр (сарын хэд)","нэр үг · гол үг","你的生日是几月几号？","Nǐ de shēngrì shì jǐ yuè jǐ hào?","Чиний төрсөн өдөр хэдэн сарын хэд вэ?",True),
 ("生日","shēngrì","төрсөн өдөр","нэр үг · нэмэлт үг (*)","你的生日是几月几号？","Nǐ de shēngrì shì jǐ yuè jǐ hào?","Чиний төрсөн өдөр хэдэн сарын хэд вэ?",False),
 ("喜欢","xǐhuan","дуртай, таалагдах","үйл үг · гол үг","我喜欢星期六。","Wǒ xǐhuan xīngqīliù.","Би бямба гарагт дуртай.",True),
]
vocab = [{"chinese":z,"pinyin":p,"mongolian":m,"notes":pos,"exampleChinese":ez,"examplePinyin":ep,"exampleMongolian":em,
          "hskLevel":"YCT 1","keyWord":key,"orderIndex":i+1} for i,(z,p,m,pos,ez,ep,em,key) in enumerate(VOCAB)]
dump("vocabulary.json", vocab)

# ---------------- TEXTS ----------------
def tok(s):
    out=[]
    for t in s.split(" "):
        z,_,py = t.partition("|"); out.append({"zh":z,"py":py})
    return out

dialogues = [
 {"id":1,"title_mn":"Яриа 1 · Төрсөн өдрийн үдэшлэг","scene_mn":"Титэм өмссөн охины төрсөн өдөр. Найз нь «Чиний төрсөн өдөр хэзээ вэ?» гэж асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"你的生日是几月几号？","pinyin":"Nǐ de shēngrì shì jǐ yuè jǐ hào?","mn":"Чиний төрсөн өдөр хэдэн сарын хэд вэ?"},
           {"speaker":"小红","zh":"1月1号。","pinyin":"Yī yuè yī hào.","mn":"1 сарын 1."}]},
 {"id":2,"title_mn":"Яриа 2 · Гэртээ, ээжтэйгээ","scene_mn":"Хүү хуанли барьчихсан ээжээсээ өнөөдөр ямар гариг вэ гэж асууж байна.","audio":AUD_TEXT,
  "lines":[{"speaker":"小明","zh":"今天星期几？","pinyin":"Jīntiān xīngqī jǐ?","mn":"Өнөөдөр ямар гариг вэ?"},
           {"speaker":"妈妈","zh":"今天星期五。","pinyin":"Jīntiān xīngqīwǔ.","mn":"Өнөөдөр баасан гариг."},
           {"speaker":"小明","zh":"明天星期六，我喜欢星期六。","pinyin":"Míngtiān xīngqīliù, wǒ xǐhuan xīngqīliù.","mn":"Маргааш бямба гариг, би бямбад дуртай."}]},
]
song_lines = [
 ("一、一、一，星期一，二、二、二，星期二，","Yī, yī, yī, Xīngqīyī, èr, èr, èr, Xīngqī'èr,","Нэг, нэг, нэг, даваа гариг. Хоёр, хоёр, хоёр, мягмар гариг.","一|yī 、| 一|yī 、| 一|yī ，| 星期一|xīngqīyī ，| 二|èr 、| 二|èr 、| 二|èr ，| 星期二|xīngqī'èr ，|"),
 ("三、三、三，星期三，四、四、四，星期四，","Sān, sān, sān, Xīngqīsān, sì, sì, sì, Xīngqīsì,","Гурав, гурав, гурав, лхагва гариг. Дөрөв, дөрөв, дөрөв, пүрэв гариг.","三|sān 、| 三|sān 、| 三|sān ，| 星期三|xīngqīsān ，| 四|sì 、| 四|sì 、| 四|sì ，| 星期四|xīngqīsì ，|"),
 ("五、五、五，星期五，六、六、六，星期六，","Wǔ, wǔ, wǔ, Xīngqīwǔ, liù, liù, liù, Xīngqīliù,","Тав, тав, тав, баасан гариг. Зургаа, зургаа, зургаа, бямба гариг.","五|wǔ 、| 五|wǔ 、| 五|wǔ ，| 星期五|xīngqīwǔ ，| 六|liù 、| 六|liù 、| 六|liù ，| 星期六|xīngqīliù ，|"),
 ("七、七、七，星期天。今天星期一，星期一，","Qī, qī, qī, Xīngqītiān. Jīntiān Xīngqīyī, Xīngqīyī,","Долоо, долоо, долоо, ням гариг. Өнөөдөр даваа гариг, даваа гариг,","七|qī 、| 七|qī 、| 七|qī ，| 星期天|xīngqītiān 。| 今天|jīntiān 星期一|xīngqīyī ，| 星期一|xīngqīyī ，|"),
 ("明天星期二，星期二，昨天星期天，星期天。","Míngtiān Xīngqī'èr, Xīngqī'èr, zuótiān Xīngqītiān, Xīngqītiān.","маргааш мягмар гариг, мягмар гариг, өчигдөр ням гариг байлаа, ням гариг.","明天|míngtiān 星期二|xīngqī'èr ，| 星期二|xīngqī'èr ，| 昨天|zuótiān 星期天|xīngqītiān ，| 星期天|xīngqītiān 。|"),
]
sentences=[]
dlg_lines=[
 (1,"小明：你的生日是几月几号？","Xiǎo Míng: Nǐ de shēngrì shì jǐ yuè jǐ hào?","Сяо Мин: Чиний төрсөн өдөр хэдэн сарын хэд вэ?","小明：| 你|nǐ 的|de 生日|shēngrì 是|shì 几|jǐ 月|yuè 几|jǐ 号|hào ？|","几月几号 — «хэдэн сарын хэд» гэж асууж байна. 几 нь «хэд» гэсэн асуух үг.",["你的生日是几月几号？"]),
 (1,"小红：1月1号。","Xiǎo Hóng: Yī yuè yī hào.","Сяо Хун: 1 сарын 1.","小红：| 1|yī 月|yuè 1|yī 号|hào 。|","Хариулахдаа 几-ийн оронд тоогоо тавина: 1月1号.",["你的生日是几月几号？"]),
 (2,"小明：今天星期几？","Xiǎo Míng: Jīntiān xīngqī jǐ?","Сяо Мин: Өнөөдөр ямар гариг вэ?","小明：| 今天|jīntiān 星期|xīngqī 几|jǐ ？|","今天星期几 — «өнөөдөр ямар гариг вэ?» гэж асууна.",["今天星期几？"]),
 (2,"妈妈：今天星期五。","Māma: Jīntiān xīngqīwǔ.","Ээж: Өнөөдөр баасан гариг.","妈妈：| 今天|jīntiān 星期五|xīngqīwǔ 。|",None,[]),
 (2,"小明：明天星期六，我喜欢星期六。","Xiǎo Míng: Míngtiān xīngqīliù, wǒ xǐhuan xīngqīliù.","Сяо Мин: Маргааш бямба гариг, би бямбад дуртай.","小明：| 明天|míngtiān 星期六|xīngqīliù ，| 我|wǒ 喜欢|xǐhuan 星期六|xīngqīliù 。|","我喜欢… — «би … дуртай». Бямба гарагт сургуульгүй тул хүү дуртай!",["今天星期几？"]),
]
for para,zh,py,mn,tk,note,ks in dlg_lines:
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":para,"tokens":tok(tk)}
    if note: s["note"]=note; s["key_structures"]=ks
    sentences.append(s)
for i,(zh,py,mn,tk) in enumerate(song_lines):
    s={"zh":zh,"pinyin":py,"mn":mn,"paragraph":3,"tokens":tok(tk)}
    if i==3: s["note"]="Дууны сүүлийн хоёр мөрөнд «өнөөдөр, маргааш, өчигдөр»-ийг сольж дуулна. Өнөөдөр хэн гариг вэ — тэрийгээ тавиад дуул!"; s["key_structures"]=["今天星期几？"]
    sentences.append(s)

texts = {
 "unit":{"number":"9","title":"今天星期几？","mongolianTitle":"Өнөөдөр ямар гариг вэ? — гарагууд, сар өдөр, төрсөн өдөр"},
 "lessonIntro":{
  "teacher_mn":"Сайн уу, хүүхдүүд ээ! Би Тэмээ багш. Чи долоо хоногт хамгийн их юунд дуртай вэ? Бямба, ням гарагт үү? Өнөөдөр бид хятадаар гарагуудыг нэрлэж сурна. Хятадад гараг бүр тоогоор нэрлэгддэг: 星期一 бол «нэгдүгээр гариг», 星期二 — «хоёрдугаар гариг». Маш амархан! Мөн төрсөн өдрөө хэлж сурна: «1月1号». Хамт «星期歌» дуулж, жижигхэн панд хэрхэн долоо хоногийг өнгөрөөдгийг үзнэ. Бэлэн үү? Эхэлцгээе!",
  "warmup_mn":"Чи өнөөдөр ямар гариг гэдгийг мэдэх үү? Өөрийн төрсөн өдрөө, хэдэн сарын хэд гэдгийг хэл. Дуртай гариг чинь аль вэ?",
  "theme_zh":"星期 · 月和号 · 生日 · 喜欢","theme_mn":"Гарагууд · Сар өдөр · Төрсөн өдөр · Дуртай гариг"},
 "warmup":{"mongolian":"Өнөөдөр ямар гариг вэ? Чи хамгийн их аль гарагт дуртай вэ?"},
 "vocabularyAudio":{},
 "dialogues":dialogues,
 "mainText":{
  "id":"9","title":"今天星期几？","mongolianTitle":"Өнөөдөр ямар гариг вэ? — яриа ба «星期歌» дуу","title_mn":"Let's read · 2 яриа + Let's chant · 星期歌","audioFile":AUD_MAIN,
  "charCount":str(sum(len(x["zh"]) for x in sentences)),
  "source":"YCT 标准教程 1 · 第9课 Let's read（CD 09-02）+ Let's chant（CD 09-03）","author_zh":"",
  "intro_zh":"两段小对话：你的生日是几月几号？今天星期几？然后一起唱《星期歌》。","intro_mn":"Эхлээд хоёр яриа: төрсөн өдрийн үдэшлэг дээр «你的生日是几月几号？», гэртээ ээжээсээ «今天星期几？» гэж асууна. Дараа нь «星期歌» хэмээх дууг дуулъя. Хуруугаараа 1–7 тоолоод гараг бүрийг хэл, гараа алгадаж хэмнэл өг!",
  "sentences":sentences,
  "paragraph_summaries":[
   {"paragraph":1,"mn":"Яриа 1 — Төрсөн өдрийн үдэшлэг. Найз «你的生日是几月几号？» гэж асуухад охин «1月1号» гэж хариулна."},
   {"paragraph":2,"mn":"Яриа 2 — Хүү ээжээсээ «今天星期几？» гэж асуухад ээж «今天星期五» гэнэ. Хүү «明天星期六，我喜欢星期六» гэж баярлана."},
   {"paragraph":3,"mn":"星期歌 — Нэгээс долоо хүртэл тоогоо гурав гурваар давтаж, гараг бүрийг нэрлэнэ. Сүүлд «өнөөдөр, маргааш, өчигдөр»-ийг сольж дуулна. Тоолж, алгадаж, хөдөлж дуул!"}],
  "reflection":{"questions_mn":["Хятадаар «өнөөдөр ямар гариг вэ?» гэж яаж асуух вэ?","Өөрийн төрсөн өдрийг хятадаар «…月…号» гэж хэлж үз.","Чи ямар гарагт хамгийн их дуртай вэ? Яагаад?"]},
  "writingSample":{"title_mn":"Ярих дасгал · Өөрийнхөө тухай хэл","zh":"今天星期五。明天星期六，我喜欢星期六。","pinyin":"Jīntiān xīngqīwǔ. Míngtiān xīngqīliù, wǒ xǐhuan xīngqīliù.","mn":"Өнөөдөр баасан гариг. Маргааш бямба гариг, би бямбад дуртай."},
  "writingPrompt_mn":"Гэрийнхэндээ «今天星期几？» гэж асуу. Тэд хариулсны дараа «明天星期…，我喜欢星期…» гэж өөрийнхөө дуртай гарагийг хэл."},
 "properNouns":[],
 "wordExplanation":[
  {"word":"星期","gloss":"xīngqī — долоо хоног, гариг","explanation":"星期 + тоо = гарагийн нэр. 星期一 = даваа, 星期二 = мягмар, 星期三 = лхагва, 星期四 = пүрэв, 星期五 = баасан, 星期六 = бямба. Зөвхөн ням гараг нь тоогоор биш — 星期天 гэнэ.",
   "structure":"星期 + 一/二/三/四/五/六/天","teacher_notes":"Хүүхдүүд монгол гарагийн нэрийг хятад тоотой холбож санахад амар: даваа=1, мягмар=2 гэх мэт. 星期天 дээр 天 нь «тэнгэр/өдөр» гэсэн утгатай, тоо биш гэдгийг дурьдана.",
   "examples":[{"chinese":"星期一","pinyin":"Xīngqīyī","mongolian":"Даваа гариг"} ,{"chinese":"星期五","pinyin":"Xīngqīwǔ","mongolian":"Баасан гариг"},{"chinese":"星期天","pinyin":"Xīngqītiān","mongolian":"Ням гариг"}],
   "common_mistakes":[{"wrong":"星期七","right":"星期天","why":"Долоо дахь өдрийг тоогоор биш, 星期天 гэж хэлнэ."}],
   "check":{"question":"«Мягмар гариг» хятадаар аль нь вэ?","options":["星期二","星期三","星期天"],"answer":"0"},
   "practice":[{"n":1,"question":"星期一、星期二、________、星期四","answer":"星期三","explanation_mn":"Даваа, мягмар, лхагва, пүрэв — гуравдугаарт 星期三."}]},
  {"word":"几","gloss":"jǐ — хэд, хэд дэх","explanation":"几 бол «хэд» гэж асуух үг. 今天星期几？ = «өнөөдөр хэд дэх гариг вэ?», 几月几号？ = «хэдэн сарын хэд?». Хариулахдаа 几-ийн оронд тоо тавина.",
   "structure":"今天星期几？ → 今天星期五。 · 几月几号？ → 1月1号。","teacher_notes":"几 нь 吗-тай хамт хэрэглэгдэхгүй. 几 асуулттай өгүүлбэрт 吗 нэмэхгүй.",
   "examples":[{"chinese":"今天星期几？","pinyin":"Jīntiān xīngqī jǐ?","mongolian":"Өнөөдөр ямар гариг вэ?"},{"chinese":"你的生日是几月几号？","pinyin":"Nǐ de shēngrì shì jǐ yuè jǐ hào?","mongolian":"Чиний төрсөн өдөр хэдэн сарын хэд вэ?"},{"chinese":"今天星期五。","pinyin":"Jīntiān xīngqīwǔ.","mongolian":"Өнөөдөр баасан гариг."}],
   "common_mistakes":[{"wrong":"今天星期几吗？","right":"今天星期几？","why":"几-тай өгүүлбэрт 吗 хэрэггүй."}],
   "check":{"question":"«Өнөөдөр ямар гариг вэ?» хятадаар:","options":["今天星期几？","星期几今天？","今天几月？"],"answer":"0"},
   "practice":[{"n":1,"question":"今天星期________？","answer":"几","explanation_mn":"Асуухдаа 几 тавина."}]},
 ],
 "collocations":[{"type":"今天 / 明天 / 昨天 + 星期…","rows":[
   {"head":"今天","with":"星期一","mn":"өнөөдөр даваа гариг","usage_mn":"Өнөөдрийн гарагийг хэлэхэд","example":{"zh":"今天星期一。","pinyin":"Jīntiān xīngqīyī.","mn":"Өнөөдөр даваа гариг."}},
   {"head":"明天","with":"星期二","mn":"маргааш мягмар гариг","usage_mn":"Маргаашийн гарагийг хэлэхэд","example":{"zh":"明天星期二。","pinyin":"Míngtiān xīngqī'èr.","mn":"Маргааш мягмар гариг."}},
   {"head":"昨天","with":"星期天","mn":"өчигдөр ням гариг","usage_mn":"Өчигдрийн гарагийг хэлэхэд","example":{"zh":"昨天星期天。","pinyin":"Zuótiān xīngqītiān.","mn":"Өчигдөр ням гариг байлаа."}},
   {"head":"我喜欢","with":"星期六","mn":"би бямбад дуртай","usage_mn":"Дуртай гарагаа хэлэхэд","example":{"zh":"我喜欢星期六。","pinyin":"Wǒ xǐhuan xīngqīliù.","mn":"Би бямба гарагт дуртай."}}]}],
 "wordComparison":[],
 "textExercises":{
  "selectWord":{"instruction_mn":"Let's make — гараг, сар, өдрөө зөв нөх.","banks":[{"words":["星期五","星期六","星期天"],"items":[
     {"n":1,"question":"今天星期四，明天________。","answer":"星期五","explanation_mn":"Пүрэв гарагийн маргааш баасан — 星期五."},
     {"n":2,"question":"今天星期五，明天________。","answer":"星期六","explanation_mn":"Баасны маргааш бямба — 星期六."},
     {"n":3,"question":"今天星期六，明天________。","answer":"星期天","explanation_mn":"Бямбын маргааш ням — 星期天."}]}],
   "answer_source":"textbook-based (Let's make, х.41)"},
  "comprehension":{"instruction_mn":"Mini story · 熊猫的一周 — панд долоо хоногт юу хийдэг вэ? Зургийг хараад хариул.","items":[
     {"n":1,"question_zh":"星期一，熊猫做什么？","answer":"熊猫查身体。","explanation_mn":"Даваа гарагт эмч пандыг үзэж байна (查身体 — эрүүл мэндээ шалгуулах)."},
     {"n":2,"question_zh":"星期二，熊猫做什么？","answer":"熊猫学画画儿。","explanation_mn":"Мягмар гарагт панд зураг зурж сурч байна, ногоон будгийн мөр үлдээжээ."},
     {"n":3,"question_zh":"星期三，熊猫做什么？","answer":"熊猫吃大餐。","explanation_mn":"Лхагва гарагт панд хулс идэж байна — том хоол (吃大餐)."},
     {"n":4,"question_zh":"星期四，熊猫做什么？","answer":"熊猫写汉字。","explanation_mn":"Пүрэв гарагт панд газар дээр ханз бичиж байна."},
     {"n":5,"question_zh":"星期五，熊猫做什么？","answer":"熊猫学跳舞。","explanation_mn":"Баасан гарагт гурван панд бүжиг сурч байна."},
     {"n":6,"question_zh":"星期六，熊猫做什么？","answer":"熊猫看朋友。","explanation_mn":"Бямба гарагт панд найзуудтайгаа уулзаж байна."},
     {"n":7,"question_zh":"星期天，熊猫做什么？","answer":"熊猫睡一天！","explanation_mn":"Ням гарагт панд өдөржин унтаж байна (z z z)."}],
   "answer_source":"textbook_verified (Mini story, х.42; CD 09-04)"},
  "retell":{"instruction_mn":"Let's play — гэрийнхэнтэйгээ, найзтайгаа тоглоорой.","prompts":[
     {"label":"Гараг тааж тоглоё","start_zh":"Нэг хүн гараараа 1–7 хуруу үзүүлнэ. Нөгөө нь гарагийг хятадаар хэлнэ: 1 хуруу = 星期一, 2 = 星期二 … 7 = 星期天. Дараа нь сольж тоглоно."},
     {"label":"Хуанли хий","start_zh":"Цаасан дээр энэ сарын хуанли зур. Дээд мөрөнд 日 一 二 三 四 五 六 гэж бич. Өнөөдөр, маргаашийг тойруулаад «今天/明天__月__号，星期__» гэж хэл."},
     {"label":"Төрсөн өдрийн асуулт","start_zh":"Гурван хүнээс «你的生日是几月几号？» гэж асуу. Тэд «…月…号» гэж хариулна. Хамгийн дуртай гарагаа ч асууж үз!"},
     {"label":"Пандын жүжиг","start_zh":"Mini story-г найзтайгаа уншаад жүжигл: гараг бүрт панд юу хийдгийг хөдөлгөөнөөр үзүүл (бүжиглэ, унт, зураг зур)."}]}},
 "grammarNotes":[],
 "culture":{"title":"中国的生日面","title_mn":"Төрсөн өдрийн урт гоймон","text_mn":"Хятад хүүхдүүд төрсөн өдрөөрөө мөн л торт хөрөөдөг, гэхдээ заавал урт гоймон (长寿面) иддэг! Гоймон урт байх тусам настай, жаргалтай амьдарна гэж үздэг. Тиймээс гоймонг таслахгүй нэг амьсгаагаар зажилдаг. Мөн хятад хэлэнд сар нь зүгээр л тоо + 月: 一月, 二月 … 十二月. Тиймээс сарын нэрийг цээжлэх шаардлагагүй!","note_mn":"Монголд бид төрсөн өдөр бууз, шарсан мах идэж, хамтдаа дуулдаг. Хятадад — гоймон. Чи ямар хоол хүсэх вэ?"},
 "applicationDiscussionOrWriting":{"background":"Хичээлийн сэдэв — гарагууд, сар өдөр, дуртай гараг.","topic":"Гарагийн дуугаа хамтдаа дуулъя!","discussion":["Хосоороо: нэг нь хуанли заагаад «今天星期几？» гэж асууна, нөгөө нь хариулна.","Бүгдээрээ дугуйлж зогсоод «星期歌»-г гар алгадаж дуулцгаая."],
   "writing":{"promptChinese":"今天星期几？","promptMongolian":"Гэрийн даалгавар: гэрийнхнээсээ төрсөн өдрийг нь асуугаад «…月…号» гэж хэл. Маргааш ангидаа ярьж өг.","minChars":"0","requiredWords":["星期","喜欢"],"sampleChinese":"今天星期五。明天星期六，我喜欢星期六。","sampleMongolian":"Өнөөдөр баасан гариг. Маргааш бямба гариг, би бямбад дуртай.","gradingRubric":"Зөв дуудлага, гарагийг зөв нэрлэсэн эсэх."}},
 "workbookReading":{"answer_source":"YCT 标准教程 1 · Test Answers: L9 1.B 2.B 3.C 4.C 5.B 6.D 7.A","parts":[]},
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
 {"point":"今天星期几？ — өнөөдөр ямар гариг вэ?","gloss_mn":"Гарагаа асууж, хариулах",
  "structure":"今天 / 明天 / 昨天 + 星期 + 几？ → 今天星期五。",
  "teacher_mn":"«Өнөөдөр ямар гариг вэ?» гэж асуухдаа «今天星期几？» гэнэ. 几 бол «хэд» гэсэн асуух үг. Хариулахдаа 几-ийн оронд гарагаа хэлнэ: «今天星期五。» Маргаашийг хэлэх бол 今天-ийн оронд 明天, өчигдрийг хэлэх бол 昨天 гэж тавина. Хуруугаараа тоолж хэлээд үз!",
  "teacher_notes":"星期 + тоо = гараг. Долоо дахь нь 星期天. Асуултад 吗 хэрэглэхгүй. Хүүхдэд «ямар гариг» гэж утгыг нь монголоор хэлүүл.",
  "examples":[ex("今天星期几？","Jīntiān xīngqī jǐ?","Өнөөдөр ямар гариг вэ?"),ex("今天星期五。","Jīntiān xīngqīwǔ.","Өнөөдөр баасан гариг."),ex("明天星期六。","Míngtiān xīngqīliù.","Маргааш бямба гариг."),ex("昨天星期天。","Zuótiān xīngqītiān.","Өчигдөр ням гариг байлаа.")],
  "common_mistakes":[{"wrong":"星期七","right":"星期天","why":"Нэг, хоёр, … зургаа хүртэл тоо тавина. Ням гарагийг 星期天 гэнэ."},{"wrong":"今天星期几吗？","right":"今天星期几？","why":"几 байгаа бол 吗 хэрэггүй."}],
  "check":chk("Ээжээсээ өнөөдөр ямар гариг гэж асуух вэ?",["今天星期几？","明天星期六。","你好吗？"],"今天星期几？","g1c"),
  "exercises":[
   choice("今天星期四，明天星期________。",["五","三","天"],"五","Зөв! Пүрэвийн маргааш баасан — 星期五.","Пүрэв (四)-ийн дараа тав (五).","g1e1"),
   choice("«Бямба гариг» хятадаар аль нь вэ?",["星期六","星期一","星期五"],"星期六","Зөв! 六 = зургаа, бямба = 星期六.","六 = зургаа. 一 = нэг (даваа), 五 = тав (баасан).","g1e2"),
   judge("«星期天» бол ням гариг.",True,"Зөв! 星期天 = ням гариг.","星期天 = ням гариг.")]},
 {"point":"你的生日是几月几号？ — төрсөн өдөр","gloss_mn":"Сар, өдрөө асуух ба хэлэх",
  "structure":"你的生日是几月几号？ → …月…号。",
  "teacher_mn":"«Чиний төрсөн өдөр хэдэн сарын хэд вэ?» гэж асуухдаа «你的生日是几月几号？» гэнэ. Хариулахдаа тоо + 月 + тоо + 号 гэнэ. Жишээ нь 1月1号 — «1 сарын 1». Найзуудаасаа төрсөн өдрийг нь асуугаад бич!",
  "teacher_notes":"月 ба 号 өмнө нь тоо. Сарын нэр байхгүй — 1月, 2月 гэж тоогоор. Хүүхэд өөрийн төрсөн өдрийг хятадаар хэлж сурах нь бодит хэрэглээ.",
  "examples":[ex("你的生日是几月几号？","Nǐ de shēngrì shì jǐ yuè jǐ hào?","Чиний төрсөн өдөр хэдэн сарын хэд вэ?"),ex("1月1号。","Yī yuè yī hào.","1 сарын 1."),ex("今天10月8号。","Jīntiān shí yuè bā hào.","Өнөөдөр 10 сарын 8. (тестээс)"),ex("今天星期一，明天星期二。","Jīntiān xīngqīyī, míngtiān xīngqī'èr.","Өнөөдөр даваа, маргааш мягмар.")],
  "common_mistakes":[{"wrong":"号1月1","right":"1月1号","why":"Эхлээд сар, дараа нь өдөр."}],
  "check":chk("«1 сарын 1» хятадаар:",["1月1号","1号1月","星期一"],"1月1号","g2c"),
  "exercises":[
   choice("你的生日是________月几号？",["几","吗","天"],"几","Зөв! 几 = хэд.","Асуух үг 几 хэрэгтэй.","g2e1"),
   judge("«3号» гэдэг нь «сарын 3» гэсэн утгатай.",True,"Зөв! 号 = сарын өдөр.","号 = сарын өдөр.")]},
 {"point":"我喜欢… — дуртай","gloss_mn":"Юунд дуртайгаа хэлэх",
  "structure":"我喜欢 + (гараг, зүйл)。 不喜欢 = дургүй。",
  "teacher_mn":"Дуртай зүйлээ хэлэхдээ «我喜欢…» гэнэ. 我 = би, 喜欢 = дуртай. Жишээ: «我喜欢星期六» — би бямба гарагт дуртай. Дургүй бол 不 нэмээд «不喜欢» гэнэ. Чи аль гарагт дуртай вэ?",
  "teacher_notes":"喜欢 дээр 不 нэмэхэд 不喜欢. Номд «不喜欢, 很喜欢» гэсэн жишээтэй.",
  "examples":[ex("我喜欢星期六。","Wǒ xǐhuan xīngqīliù.","Би бямба гарагт дуртай."),ex("明天星期六，我喜欢星期六。","Míngtiān xīngqīliù, wǒ xǐhuan xīngqīliù.","Маргааш бямба, би бямбад дуртай."),ex("不喜欢","bù xǐhuan","дургүй"),ex("很喜欢","hěn xǐhuan","маш их дуртай")],
  "common_mistakes":[{"wrong":"喜欢我星期六","right":"我喜欢星期六","why":"Эхлээд «би», дараа нь «дуртай», дараа нь юунд."}],
  "check":chk("«Би бямбад дуртай» хятадаар:",["我喜欢星期六。","星期六我不。","你喜欢吗？"],"我喜欢星期六。","g3c"),
  "exercises":[
   choice("我________星期六。",["喜欢","明天","月"],"喜欢","Зөв! 我喜欢 = би дуртай.","Дуртай гэх үг 喜欢.","g3e1"),
   judge("«不喜欢» гэдэг нь «дургүй» гэсэн үг.",True,"Зөв! 不 = үгүй, 不喜欢 = дургүй.","不喜欢 = дургүй.")]},
]
dump("grammar.json", grammar)

# ---------------- QUIZ ----------------
Q=[]
def q(t,question,opts,correct,expl,diff,tags,seed):
    o,_=shuffle(opts,correct,seed)
    Q.append({"type":t,"question":question,"options":o,"correct_answer":correct,"explanation":expl,"order_index":len(Q)+1,"id":f"{LID}-q{len(Q)+1:02d}","skillTags":tags,"difficulty":diff})
DAYS=[("星期一","Xīngqīyī","даваа"),("星期二","Xīngqī'èr","мягмар"),("星期三","Xīngqīsān","лхагва"),("星期四","Xīngqīsì","пүрэв"),("星期五","Xīngqīwǔ","баасан"),("星期六","Xīngqīliù","бямба"),("星期天","Xīngqītiān","ням")]
for i,(z,p,m) in enumerate(DAYS):
    others=[d[0] for d in DAYS if d[0]!=z][i%3:i%3+3]
    if len(others)<3: others=[d[0] for d in DAYS if d[0]!=z][:3]
    q("choice",f"«{m.capitalize()} гариг» хятадаар аль нь вэ?",[z]+others,z,f"{m.capitalize()} = {z} ({p}).","easy",["vocabulary"],"qd"+z)
q("choice","«今天» гэж юу вэ?",["өнөөдөр","маргааш","өчигдөр","төрсөн өдөр"],"өнөөдөр","今天 (jīntiān) = өнөөдөр.","easy",["vocabulary"],"qa1")
q("choice","«明天» гэж юу вэ?",["маргааш","өнөөдөр","өчигдөр","сар"],"маргааш","明天 (míngtiān) = маргааш.","easy",["vocabulary"],"qa2")
q("choice","«昨天» гэж юу вэ?",["өчигдөр","маргааш","өнөөдөр","дуртай"],"өчигдөр","昨天 (zuótiān) = өчигдөр.","easy",["vocabulary"],"qa3")
q("choice","«生日» гэж юу вэ?",["төрсөн өдөр","долоо хоног","сар","дуртай"],"төрсөн өдөр","生日 (shēngrì) = төрсөн өдөр.","easy",["vocabulary"],"qa4")
q("choice","«喜欢» гэж юу вэ?",["дуртай","төрсөн өдөр","маргааш","сар"],"дуртай","喜欢 (xǐhuan) = дуртай.","easy",["vocabulary"],"qa5")
q("choice","«月» ба «号» — аль нь «сар», аль нь «өдөр» вэ?",["月 = сар, 号 = өдөр","月 = өдөр, 号 = сар","хоёулаа сар","хоёулаа гараг"],"月 = сар, 号 = өдөр","月 = сар, 号 = сарын өдөр.","medium",["vocabulary"],"qa6")
q("choice","Хоёр дахь өдөр, «мягмар гариг» хятадаар:",["星期二","星期三","星期五","星期天"],"星期二","二 = хоёр, 星期二 = мягмар.","easy",["number"],"qa7")
q("choice","Найзаасаа төрсөн өдрийг нь асуух:",["你的生日是几月几号？","今天星期几？","我喜欢星期六。","明天见！"],"你的生日是几月几号？","生日 = төрсөн өдөр, 几月几号 = хэдэн сарын хэд.","easy",["dialogue"],"qb1")
q("choice","Ээжээсээ өнөөдөр ямар гариг гэж асуух:",["今天星期几？","你的生日是几月几号？","我喜欢星期六。","你好吗？"],"今天星期几？","今天星期几 = өнөөдөр ямар гариг вэ?","easy",["dialogue"],"qb2")
q("cloze","A：今天星期几？ B：今天（ ）。",["星期五","生日","喜欢","明天"],"星期五","Асуултад гарагаар хариулна: 今天星期五.","easy",["dialogue"],"qb3")
q("cloze","A：你的生日是几月几号？ B：（ ）。",["1月1号","星期一","喜欢","今天"],"1月1号","Хэдэн сарын хэд гэхэд «1月1号» гэж хариулна.","medium",["dialogue"],"qb4")
q("cloze","今天星期四，明天星期（ ）。",["五","三","一","天"],"五","Пүрэвийн маргааш баасан — 星期五.","medium",["usage"],"qb5")
q("cloze","今天星期六，昨天星期（ ）。",["五","天","一","三"],"五","Бямбын өчигдөр баасан — 星期五.","medium",["usage"],"qb6")
q("cloze","今天星期六，明天星期（ ）。",["天","五","一","二"],"天","Бямбын маргааш ням — 星期天.","medium",["usage"],"qb7")
q("choice","Хүү «明天星期六，我喜欢星期六» гэжээ. Тэр юунд дуртай вэ?",["бямба гарагт","баасан гарагт","ням гарагт","даваа гарагт"],"бямба гарагт","喜欢星期六 = бямба гарагт дуртай.","easy",["dialogue"],"qb8")
q("choice","Төрсөн өдрийн яриан дээр охины төрсөн өдөр хэзээ вэ?",["1月1号","1月2号","2月1号","10月8号"],"1月1号","Охин «1月1号» гэж хариулсан.","easy",["dialogue"],"qb9")
q("choice","Пиньинь «xīngqīliù» гэж уншдаг үг:",["星期六","星期五","星期一","星期天"],"星期六","星期六 = xīngqīliù = бямба.","medium",["pronunciation"],"qc1")
q("choice","Пиньинь «míngtiān» гэж уншдаг үг:",["明天","今天","昨天","星期"],"明天","明天 = míngtiān = маргааш.","medium",["pronunciation"],"qc2")
q("choice","Пиньинь «xǐhuan» гэж уншдаг үг:",["喜欢","生日","星期","今天"],"喜欢","喜欢 = xǐhuan = дуртай.","medium",["pronunciation"],"qc3")
q("choice","«几» гэдэг үг ямар утгатай вэ?",["хэд","өнөөдөр","дуртай","сар"],"хэд","几 (jǐ) = хэд. Асуух үг.","easy",["vocabulary"],"qc4")
q("usage","«我不喜欢星期一» гэдэг нь юу гэсэн үг вэ?",["Би даваа гарагт дургүй","Би даваа гарагт дуртай","Өнөөдөр даваа гариг","Маргааш даваа гариг"],"Би даваа гарагт дургүй","不喜欢 = дургүй.","medium",["usage"],"qd1")
q("usage","Мягмар гариг гэхэд тоогоор хэд вэ?",["2 (二)","1 (一)","3 (三)","7 (天)"],"2 (二)","星期二 — тоо 二 = хоёр.","medium",["number"],"qd2")
q("usage","Хятад хэлэнд «星期七» гэж хэлдэг үү?",["Үгүй, ням гарагийг 星期天 гэнэ","Тийм, ням гарагийг 星期七 гэнэ","Үгүй, ням гарагийг 星期八 гэнэ","Тийм, бямба гарагийг 星期七 гэнэ"],"Үгүй, ням гарагийг 星期天 гэнэ","Долоо дахь өдрийг 星期天 гэнэ.","medium",["usage"],"qd3")
q("choice","Панд ямар гарагт найзуудтайгаа уулздаг вэ? (Mini story)",["星期六","星期一","星期三","星期天"],"星期六","今天星期六，熊猫看朋友。","medium",["dialogue"],"qd4")
q("choice","Панд ням гарагт юу хийдэг вэ? (Mini story)",["Өдөржин унтдаг","Бүжиг сурдаг","Ханз бичдэг","Хоол иддэг"],"Өдөржин унтдаг","星期天，熊猫睡一天！","medium",["dialogue"],"qd5")
dump("quiz.json", Q)

# ---------------- WORKBOOK ----------------
def img(n): return f"images/{n}.png"
workbook = {
 "reading":{"parts":[
  {"part":1,"type":"listening","instruction_mn":"Сонсох — Аудио (09-05) сонсоод зөв зургийг сонго (A/B/C).","audio":AUD_TEST,"items":[
    {"n":1,"question_zh":"（听录音）A：今天星期几？B：今天星期一。","question_mn":"1-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t1a"),img("t1b"),img("t1c")],"answer":"B","script_zh":"A：今天星期几？B：今天星期一。","explanation_mn":"«星期一 — даваа» гэдэг нь «нэг». B зураг дээр хүү нэг хуруугаа өргөжээ. A-д гурав, дөрөв хуруу, C-д охин хоёр хуруу (V) харуулж байна."},
    {"n":2,"question_zh":"（听录音）A：你不去学校吗？B：今天星期六。","question_mn":"2-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t2a"),img("t2b"),img("t2c")],"answer":"B","script_zh":"A：你不去学校吗？B：今天星期六。","explanation_mn":"Бямба гарагт сургууль байхгүй. B зураг дээр охин теннисний цохиуртай, тоглохоор явна. A — нялх хүүхэд, C — ангид суугаа хүүхдүүд, сургуульд байна."},
    {"n":3,"question_zh":"（听录音）A：再见。B：再见，明天见。","question_mn":"3-р асуулт: сонсоод зургаа сонго","options":["A","B","C"],"optionImages":[img("t3a"),img("t3b"),img("t3c")],"answer":"C","script_zh":"A：再见。B：再见，明天见。","explanation_mn":"«再见，明天见» — салах ёс, маргааш уулзана. C зураг дээр охин цонхоор гараа даллаж байна. A — ээжтэйгээ ном уншиж байна, B — ээж охиноо тэврэв."}],
   "answer_source":"Test Answers: 1.B 2.B 3.C; Listening script"},
  {"part":2,"type":"choice","instruction_mn":"Унших — Өгүүлбэр бүрт тохирох зургийг сонго (A, B, C, D).","items":[
    {"n":4,"question_zh":"今天星期二。","image":img("t4c"),"options":["A","B","C","D"],"optionImages":[img("t4a"),img("t4b"),img("t4c"),img("t4d")],"answer":"C","explanation_mn":"星期二 — мягмар, «2» тоо. C зураг дээр эр хоёр хуруугаа өргөжээ. A — утсаар ярьж байна, B — «8» хуанли, D — дэлгүүрт байна."},
    {"n":5,"question_zh":"今天10月8号。","image":img("t4b"),"options":["A","B","C","D"],"optionImages":[img("t4a"),img("t4b"),img("t4c"),img("t4d")],"answer":"B","explanation_mn":"8号 — сарын 8. B зураг дээр хуанли дээр «8» гэж бичсэн."},
    {"n":6,"question_zh":"妈妈明天去商店。","image":img("t4d"),"options":["A","B","C","D"],"optionImages":[img("t4a"),img("t4b"),img("t4c"),img("t4d")],"answer":"D","explanation_mn":"商店 — дэлгүүр. D зураг дээр ээж дэлгүүрт сагстай хүнс авч байна."},
    {"n":7,"question_zh":"A：我们哪天去学校？ B：星期六。","image":img("t4a"),"options":["A","B","C","D"],"optionImages":[img("t4a"),img("t4b"),img("t4c"),img("t4d")],"answer":"A","explanation_mn":"«Бид хэзээ сургуульд явах вэ?» гэж асуух яриа. A зураг дээр охин утсаар ярьж асууж байна."}],
   "answer_source":"Test Answers: 4.C 5.B 6.D 7.A"},
  {"part":3,"type":"choice","instruction_mn":"Mini story · 熊猫的一周 — зургийг хараад гарагийг сонго (story.png).","items":[
    {"n":1,"question_zh":"今天星期（ ），熊猫学跳舞。","image":"images/story.png","options":["星期五","星期三","星期天"],"answer":"星期五","explanation_mn":"Зураг 5-д гурван панд бүжиглэж байна — баасан гариг (星期五)."},
    {"n":2,"question_zh":"今天星期（ ），熊猫睡一天！","image":"images/story.png","options":["星期天","星期一","星期六"],"answer":"星期天","explanation_mn":"Зураг 7-д панд унтаж байна — ням гариг (星期天)."},
    {"n":3,"question_zh":"今天星期（ ），熊猫写汉字。","image":"images/story.png","options":["星期四","星期二","星期六"],"answer":"星期四","explanation_mn":"Зураг 4-д панд ханз бичиж байна — пүрэв гариг (星期四)."}],
   "answer_source":"textbook х.42"},
  {"part":4,"type":"choice","instruction_mn":"Let's chant — 星期歌-ийг нөх.","items":[
    {"n":1,"question_zh":"今天星期一，明天星期（ ）。","options":["星期二","星期三","星期天"],"answer":"星期二","explanation_mn":"Даваагийн маргааш мягмар — 星期二."},
    {"n":2,"question_zh":"今天星期一，昨天星期（ ）。","options":["星期天","星期二","星期六"],"answer":"星期天","explanation_mn":"Дууны сүүлийн мөр: 昨天星期天 — даваагийн өчигдөр ням."}],
   "answer_source":"textbook х.41 (chant)"}]},
 "writing":{"items":[{"n":1,"prompt_mn":"Let's make — хуанлийн дээд мөрөнд гарагийн ханзуудыг бич: 日 一 二 三 四 五 六.","question_zh":"日 一 二 三 四 五 六","answer":"日 一 二 三 四 五 六","explanation_mn":"Хуанлийн дээд мөр: ням (日), даваа (一) … бямба (六)."}]},
 "speaking":{"items":[
   {"n":1,"prompt_mn":"Найзаасаа гарагийг асуу.","question_zh":"今天星期几？","answer":"今天星期…","explanation_mn":"几-ийн оронд гарагаа хэл."},
   {"n":2,"prompt_mn":"Төрсөн өдрөө хэл.","question_zh":"我的生日是…月…号。","answer":"(нээлттэй)","explanation_mn":"Өөрийн сар, өдрөө тавь."},
   {"n":3,"prompt_mn":"«星期歌»-г дуул.","question_zh":"一、一、一，星期一……","answer":"(нээлттэй)","explanation_mn":"Аудио 09-03-ын хамт."},
   {"n":4,"prompt_mn":"Дуртай гарагаа хэл.","question_zh":"我喜欢星期…","answer":"(нээлттэй)","explanation_mn":"Дуртай гарагаа нэрлээд яагаад гэдгийг монголоор хэл."}]},
 "answerSource":"YCT 标准教程 1 · Test Listening Scripts, Test Answers (Lesson 9: 1B 2B 3C 4C 5B 6D 7A)"}
dump("workbook.json", workbook)

# ---------------- LESSON / MANIFEST ----------------
IMGP = json.load(open(f"{BASE}/image_prompts.json", encoding="utf-8"))
images = [{"id":os.path.splitext(os.path.basename(p["file"]))[0],"file":p["file"],"title":p["title"],"role":p.get("role","illustration"),"section":p["section"]} for p in IMGP]
images += [{"id":"story","file":"images/story.png","title":"熊猫的一周 (Mini story)","role":"illustration","section":"story"}]
images += [{"id":f"t{k}","file":f"images/t{k}.png","title":f"Test {k}","role":"illustration","section":"workbook"} for k in ["1a","1b","1c","2a","2b","2c","3a","3b","3c","4a","4b","4c","4d"]]

lesson = {
 "courseId":CID,"lessonId":LID,
 "title":"YCT 1 · 9-р хичээл — Өнөөдөр ямар гариг вэ?","chineseTitle":"今天星期几？","targetTitle":"今天星期几？","mongolianTitle":"Өнөөдөр ямар гариг вэ?",
 "subtitle":"星期一～星期天 · 今天 明天 昨天 · 生日 几月几号 · 喜欢 · «星期歌» · панд",
 "description":"Долоо хоногийн гарагууд, өнөөдөр/маргааш/өчигдөр, төрсөн өдөр (几月几号), дуртай гараг. 15 үг, 2 зурагт яриа, 星期歌, Mini story 熊猫的一周, 3 түлхүүр бүтэц, 30 шалгалтын асуулт, номын тест — АЛБАН АУДИО, ЗУРАГТАЙ.",
 "duration":"2 × 35 мин","status":"draft","orderIndex":N,"icon":"📅","thumbnailFile":"images/hero.jpg","audioFile":AUD_MAIN,
 "level":"YCT 1",
 "hook":{"teacher_mn":texts["lessonIntro"]["teacher_mn"],"warmup_mn":texts["lessonIntro"]["warmup_mn"]},
 "sourceNote":"YCT 标准教程 1 — 第9课《今天星期几？》 [hskLevel=1] [lessonNumber=9]; эх: х.39–43; аудио CD 09-01…09-05"
}
dump("lesson.json", lesson)

manifest = {
 "packageVersion":"BUUNDUU_CHINESE_HSK_PACKAGE_V1","courseType":"chinese-hsk","courseId":CID,"lessonId":LID,
 "hskLevel":1,"lessonNumber":N,"lessonProfile":"hsk4-dialogue-shorttext-exam-workbook","lessonType":"hsk4-dialogue-shorttext-exam-workbook",
 "language":"zh-MN","targetLanguage":"zh","uiLanguage":"mn",
 "title":"今天星期几？","mongolianTitle":"Өнөөдөр ямар гариг вэ?",
 "series":"YCT 标准教程 1","seriesLabel_mn":"YCT 1 — Хүүхдийн хятад хэл (≈HSK1)",
 "source":"YCT 标准教程 1 · 第9课 (сурах бичиг + CD аудио 09-01..05 + Test Answers)",
 "hasAudio":True,"hasImages":True,
 "audio":{"text":AUD_MAIN,"dialogues":AUD_TEXT,"words":AUD_WORDS,"song":AUD_SONG,"story":AUD_STORY,"test":AUD_TEST,"vocabularyClips":"байхгүй — үг TTS-ээр"},
 "media":{"lessonId":LID,"images":images},
 "verification":{"answerStatus":"official_answer_key_verified (Test Answers)","textStatus":"source_verified (сурах бичгийн хуудсыг зургаар уншсан)","teacherLayer":"агентаар бичигдсэн (хүүхдэд зориулсан)"}
}
dump("manifest.json", manifest)
print("vocab",len(vocab),"dialogues",len(dialogues),"song lines",len(song_lines),"grammar",len(grammar),"quiz",len(Q),"wb items",sum(len(p["items"]) for p in workbook["reading"]["parts"]),"images",len(images))
