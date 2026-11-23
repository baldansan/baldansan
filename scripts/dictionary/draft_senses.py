#!/usr/bin/env python3
"""
Толь бичиг v2 — монгол ноорог (AI draft) гаргах скрипт. Anthropic API, Sonnet.

Эх: data/hsk_words.json (10,896 үг; CC-CEDICT маягийн meaning_en + hsk_level).
Гаралт: data/dictionary/drafts/hsk<level>.json — үг бүрт утгууд, синонимууд, жишээ.
Дараа нь: node scripts/dictionary/load_drafts.mjs --level 1   (Supabase-д оруулна)

Шаардлага:  pip install anthropic      Орчин: ANTHROPIC_API_KEY=sk-ant-...
Хэрэглээ:
  python scripts/dictionary/draft_senses.py --level 1            # HSK1 бүх үг (300)
  python scripts/dictionary/draft_senses.py --level 1 --limit 20 # эхний 20 (сорил)
  python scripts/dictionary/draft_senses.py --level 2 --batch 15
Дахин ажиллуулахад хийгдсэн үгийг алгасна (resumable).
Сонголт: --model claude-sonnet-4-5 (default), --batch 20
"""
import argparse, json, os, re, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "data", "hsk_words.json")
OUT_DIR = os.path.join(ROOT, "data", "dictionary", "drafts")

ap = argparse.ArgumentParser()
ap.add_argument("--level", required=True, help="1 | 2 | 3 | 4 | 5 | 6 | 7-9")
ap.add_argument("--limit", type=int, default=0)
ap.add_argument("--batch", type=int, default=20)
ap.add_argument("--model", default=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5"))
a = ap.parse_args()

try:
    import anthropic
except ImportError:
    sys.exit("pip install anthropic")
client = anthropic.Anthropic()

SYSTEM = """Чи монгол сурагчдад зориулсан хятад-монгол ТОЛЬ БИЧГИЙН редактор. Жишиг: Өвөр Монголын Мэнкэлэн (蒙科立) хятад-монгол толийн баялаг, нарийн хэв маяг — гэхдээ ХАЛХ монгол (кирилл) хэлээр.

Үг бүрт дараах зүйлийг гарга:
1. УТГЫГ САЛААЛ: нэг үг олон утгатай бол утга тус бүрийг тусад нь (sense). Хэлзүйн аймгаар ялгаатай бол тусдаа утга. HSK-д хэрэгтэй утгыг эхэнд.
2. Утга бүрт: pos (n/v/a/ad/prep/conj/m/u/pron/num/int), gloss_zh (хятад тайлбар, товч, 词典 маягаар), meaning_mn (1–3 үгтэй үндсэн монгол утга), synonyms_mn (3–5 ойролцоо утгатай/өнгө аястай МОНГОЛ үг — үгийн баялгийг харуул: ярианы, бичгийн, уламжлалт үгсийг хольж), meaning_en, note_mn (хэрэглээний онцлог, 1 өгүүлбэр, хэрэггүй бол "").
3. Утга бүрт 2 жишээ (zh, pinyin tone-тэй, mn). Жишээ нь тухайн HSK түвшинд ойлгомжтой, өдөр тутмын, 6–14 ханзтай.
4. Үгийн түвшинд: measure_words (нэр үг бол тооны нэр, бусад []), collocations (3–5 түгээмэл холбоо үг: {zh,pinyin,mn}), confusable_with (андуурагддаг 0–3 үг, ханзаар), usage_note_mn (хэзээ, юунаас ялгаатай хэрэглэх — 1–2 өгүүлбэр), register (ярианы|бичгийн|албан|хоёулаа).

ОРЧУУЛГЫН ДҮРЭМ (заавал):
- 2 алхам: хятад өгүүлбэрийг БҮХЭЛД нь ойлго → хятад бүтцийг мартаад «монгол хүн яг энэ үед юу гэж хэлэх вэ» гэдгийг бич. Чангаар уншихад яриа шиг сонсогдох.
- Калька ХОРИОТОЙ: «...-аар дамжуулан», «...болгодог», «нөлөө үзүүлдэг», «утасны нөгөө үзүүрт», «...юм» давталт. 是…的/通过/使-ийг механикаар бүү давт.
- Орос галиг ХОРИОТОЙ: студент→оюутан, класс→анги, магазин→дэлгүүр, газет→сонин, институт→дээд сургууль, машин→(тээврийн) машин зөвшөөрнө.
- Синонимд жинхэнэ монгол үг: жишээ нь 高兴 → баяртай, хөгжилтэй, баясгалантай, сэтгэл хангалуун, дог дог (ярианы).
- Ханзаас таамаглахгүй — meaning_en-д өгсөн утгыг л салаал.

ФОРМАТ: ЗӨВХӨН JSON массив, өөр юу ч бүү бич (тайлбар, code block хэрэггүй). Оролтын үг бүрт нэг объект, дараалал ижил:
[{"simplified":"…","senses":[{"pos":"…","gloss_zh":"…","meaning_mn":"…","synonyms_mn":["…"],"meaning_en":"…","note_mn":"…","examples":[{"zh":"…","pinyin":"…","mn":"…"}]}],"measure_words":[],"collocations":[{"zh":"…","pinyin":"…","mn":"…"}],"confusable_with":[],"usage_note_mn":"…","register":"…"}]"""


def call(user, retries=3):
    for i in range(retries):
        try:
            r = client.messages.create(
                model=a.model, max_tokens=16000, system=SYSTEM,
                messages=[{"role": "user", "content": user}],
            )
            return r.content[0].text
        except Exception as e:  # rate limit / network
            print("  retry:", e)
            time.sleep(5 * (i + 1))
    raise SystemExit("API алдаа")


def parse_json(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    s, e = text.find("["), text.rfind("]")
    return json.loads(text[s:e + 1])


words = [w for w in json.load(open(SRC, encoding="utf-8")) if str(w.get("hsk_level")) == a.level]
words.sort(key=lambda w: (w.get("frequency") or 10**9))
if a.limit:
    words = words[: a.limit]

os.makedirs(OUT_DIR, exist_ok=True)
out_path = os.path.join(OUT_DIR, f"hsk{a.level}.json")
done = {}
if os.path.exists(out_path):
    for row in json.load(open(out_path, encoding="utf-8")):
        done[row["simplified"]] = row
todo = [w for w in words if w["simplified"] not in done]
print(f"HSK {a.level}: нийт {len(words)}, хийгдсэн {len(done)}, үлдсэн {len(todo)}  model={a.model}")


def save():
    rows = [done[w["simplified"]] for w in words if w["simplified"] in done]
    json.dump(rows, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


for i in range(0, len(todo), a.batch):
    chunk = todo[i : i + a.batch]
    lines = []
    for w in chunk:
        lines.append(json.dumps({
            "simplified": w["simplified"], "pinyin": w.get("pinyin"), "pos": w.get("pos"),
            "hsk_level": w.get("hsk_level"), "meaning_en": w.get("meaning_en"),
            "current_mn": w.get("meaning_mn"), "example_zh": w.get("example_zh"),
        }, ensure_ascii=False))
    user = f"HSK {a.level} түвшний {len(chunk)} үг. Үг бүрт толийн бүтэн бичилт гарга.\n" + "\n".join(lines)
    print(f"  [{i + 1}-{i + len(chunk)}/{len(todo)}] {chunk[0]['simplified']} … {chunk[-1]['simplified']}")
    try:
        rows = parse_json(call(user))
    except Exception as e:
        print("  JSON алдаа, batch алгасав:", e)
        continue
    by_word = {r.get("simplified"): r for r in rows if isinstance(r, dict)}
    for w in chunk:
        r = by_word.get(w["simplified"])
        if not r or not r.get("senses"):
            print("   ⚠ дутуу:", w["simplified"])
            continue
        r["hsk_level"] = a.level
        r["source"] = "ai"
        done[w["simplified"]] = r
    save()

print("Дууслаа →", out_path)
