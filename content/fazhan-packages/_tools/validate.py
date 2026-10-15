"""Багцын шалгалт. Usage: validate.py LESSON_DIR [--no-audio]
--no-audio: албан ёсны аудио/PPT эх сурвалжгүй ном (жишээ нь zhongji-2+) — үгийн клип,
audio/text, audio/words, vocabularyAudio бүрэн байхыг шаардахгүй (апп өөрөө TTS-ээр уншина).
Зураг бас сонголттой болно (warn, err биш). exit 1 if hard errors."""
import sys, os, json, re, glob
D = os.path.abspath(sys.argv[1]); P = f"{D}/pkg"; err, warn = [], []
NO_AUDIO = "--no-audio" in sys.argv[2:]
J = {f: json.load(open(f"{P}/{f}.json")) for f in ["lesson", "manifest", "vocabulary", "texts", "grammar", "quiz", "workbook"]}
subs = json.load(open(f"{P}/subtitles.json")) if os.path.exists(f"{P}/subtitles.json") else []
V, T, G, Q, W, M = J["vocabulary"], J["texts"], J["grammar"], J["quiz"], J["workbook"], J["manifest"]
sents = T["mainText"]["sentences"]
# counts
if len(V) < 20: err.append(f"vocab {len(V)} < 20")
if len(G) < 3: err.append(f"grammar {len(G)} < 3")
if len(Q) < 25: err.append(f"quiz {len(Q)} < 25")
if len(T["wordExplanation"]) < 5: warn.append(f"wordExplanation {len(T['wordExplanation'])} < 5")
if not NO_AUDIO and len(subs) != len(sents): err.append(f"subtitles {len(subs)} != sentences {len(sents)}")
elif NO_AUDIO and subs and len(subs) != len(sents): warn.append(f"subtitles {len(subs)} != sentences {len(sents)}")
clips = sorted(glob.glob(f"{P}/audio/words/w*.mp3"))
if not NO_AUDIO and len(clips) != len(V): err.append(f"word clips {len(clips)} != vocab {len(V)}")
elif NO_AUDIO and clips and len(clips) != len(V): warn.append(f"word clips {len(clips)} != vocab {len(V)} (хэсэгчилсэн, үлдсэнийг апп TTS-ээр унших)")
va = T.get("vocabularyAudio", {})
for v in V:
    if v["chinese"] not in va:
        (warn if NO_AUDIO else err).append(f"vocabularyAudio дутуу (TTS уншина): {v['chinese']}" if NO_AUDIO else f"vocabularyAudio дутуу: {v['chinese']}")
if not NO_AUDIO:
    for f in ["audio/" + os.path.basename(M["audio"]["text"]), "audio/" + os.path.basename(M["audio"]["words"])]:
        if not os.path.exists(f"{P}/{f}"): err.append(f"audio дутуу {f}")
elif M.get("audio", {}).get("text") or M.get("audio", {}).get("words"):
    for f in ["audio/" + os.path.basename(M["audio"].get("text") or ""), "audio/" + os.path.basename(M["audio"].get("words") or "")]:
        if f != "audio/" and not os.path.exists(f"{P}/{f}"): warn.append(f"audio дутуу {f}")
for im in M.get("media", {}).get("images", []):
    if not os.path.exists(f"{P}/{im['file']}"): (warn if NO_AUDIO else err).append(f"image дутуу {im['file']}")
    if not im.get("title"): warn.append(f"image title хоосон {im['id']}")
if NO_AUDIO and not M.get("media", {}).get("images"): warn.append("зураг огт алга (албан 课件 эх сурвалж байхгүй тул)")
if J["lesson"].get("thumbnailFile") and not os.path.exists(f"{P}/{J['lesson']['thumbnailFile']}"): (warn if NO_AUDIO else err).append("thumbnail дутуу")
# quiz / exercises sanity + answer balance
pos = {}
for q in Q:
    if q["correct_answer"] not in q["options"]: err.append(f"quiz {q['id']} хариулт options-д алга")
    if len(set(q["options"])) != len(q["options"]): err.append(f"quiz {q['id']} давхар option")
    pos[q["options"].index(q["correct_answer"])] = pos.get(q["options"].index(q["correct_answer"]), 0) + 1
if Q and max(pos.values()) > 0.5 * len(Q): warn.append(f"quiz хариултын байрлал тэнцвэргүй {pos}")
for g in G:
    for e in g["exercises"]:
        if e["type"] == "choice" and not (0 <= int(e["answer"]) < len(e["options"])): err.append(f"grammar ex answer idx {g['point']}")
    for ex in g["examples"]:
        if not ex["mongolian"].strip(): err.append(f"grammar example mn хоосон {g['point']}")
for v in V:
    if not v["mongolian"].strip() or not v["exampleMongolian"].strip(): err.append(f"vocab mn хоосон {v['chinese']}")
    if not re.search(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜa-z]", v["pinyin"]): err.append(f"vocab pinyin? {v['chinese']}")
# text coverage: vocab words appearing in text
text_all = "".join(s["zh"] for s in sents)
missing = [v["chinese"].split("（")[0] for v in V if v["chinese"].split("（")[0] not in text_all]
if len(missing) > len(V) * 0.25: warn.append(f"эх бичвэрт байхгүй үг олон ({len(missing)}): {missing[:10]}")
# Russian loanwords / Cyrillic quality
LOAN = ["цукар", "заправк", "институт", "студент", "магазин", "доктор", "урок", "класс", "кино", "ресторан", "кафе", "автобус", "такси", "парк", "музей", "театр", "фото", "телевизор", "костюм", "шкаф", "пальто", "диван", "мебель", "холодильник", "квартир", "агент", "контракт", "ремонт", "салон", "спорт зал", "продукт", "рынок"]
blob = json.dumps({k: J[k] for k in ["vocabulary", "texts", "grammar", "quiz", "workbook"]}, ensure_ascii=False).lower()
hits = {w: blob.count(w) for w in LOAN if w in blob}
if hits: warn.append(f"орос галиг магадлалтай: {hits}")
if re.search(r"[щъ]", blob): warn.append("орос үсэг щ/ъ... олдсон (монгол бичвэрт ховор) — шалга")
# emptiness
for key in ["lessonIntro", "culture", "collocations", "textExercises", "applicationDiscussionOrWriting"]:
    if not T.get(key): warn.append(f"texts.{key} хоосон")
if not W["reading"]["parts"] or len(W["reading"]["parts"]) < 4: warn.append(f"workbook parts {len(W['reading']['parts'])} < 4")
print(f"vocab {len(V)} | sentences {len(sents)} chars {T['mainText']['charCount']} | grammar {len(G)} | wordExpl {len(T['wordExplanation'])} | colloc {len(T['collocations'])} | quiz {len(Q)} | wb parts {len(W['reading']['parts'])} | subs {len(subs)} | clips {len(clips)} | images {len(M.get('media', {}).get('images', []))}")
for w in warn: print("WARN:", w)
for e in err: print("ERR:", e)
sys.exit(1 if err else 0)
