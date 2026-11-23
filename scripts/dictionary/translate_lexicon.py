#!/usr/bin/env python3
"""
CC-CEDICT англи утгыг МОНГОЛ руу орчуулах (бөөн, хямд). Anthropic API.
Оролт: data/dictionary/lexicon.json (build_lexicon.py)   Гаралт: data/dictionary/lexicon_mn.jsonl (resumable)

  python scripts/dictionary/translate_lexicon.py --limit 100          # сорил + зардлын тооцоо
  python scripts/dictionary/translate_lexicon.py --kind word          # бүгдийг (дахин ажиллуулахад үргэлжилнэ)
Сонголт: --model claude-sonnet-5-5 (default; Haiku нь чанар муу — туршиж харсан), --batch 60,
         --workers 12 (зэрэгцээ), --max-minutes 8.5 (дараа нь зогсоод, дахин ажиллуулахад үргэлжилнэ), --max-usd 90
Шаардлага: pip install anthropic;  ANTHROPIC_API_KEY (чатад бичихгүй — .env.local/терминалд)
"""
import argparse, json, os, re, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "data", "dictionary", "lexicon.json")
OUT = os.path.join(ROOT, "data", "dictionary", "lexicon_mn.jsonl")
ap = argparse.ArgumentParser()
ap.add_argument("--limit", type=int, default=0)
ap.add_argument("--kind", default="all")
ap.add_argument("--batch", type=int, default=60)
ap.add_argument("--model", default=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5"))
ap.add_argument("--workers", type=int, default=12)
ap.add_argument("--shuffle", type=int, default=0, help="санамсаргүй дараалал (зардлын туршилтад)")
ap.add_argument("--max-minutes", type=float, default=8.5)
ap.add_argument("--max-usd", type=float, default=90.0)
a = ap.parse_args()
try:
    import anthropic
except ImportError:
    sys.exit("pip install anthropic")
client = anthropic.Anthropic()

SYSTEM = """Чи хятад-монгол толь бичгийн орчуулагч. Хятад үг + англи тайлбар (CC-CEDICT) өгнө; МОНГОЛ (кирилл, Халх) утгыг бич.

Дүрэм:
- Хятад үгийн утгыг англи тайлбараас ОЙЛГОЖ, монгол толь бичгийн хэлээр товч бич: 1–4 утга, «; »-ээр тусгаарла. Хамгийн түгээмэл утга эхэнд.
- Калька ХОРИОТОЙ (англи бүтцийг шууд буулгахгүй). Монгол хүн яг тэр үгэнд ямар үг хэлэх вэ — тэрийг бич. Орос галиг ХОРИОТОЙ (студент→оюутан, магазин→дэлгүүр).
- (CL:…) тооны нэр, [pinyin] лавлагаа, «Taiwan pr.» зэргийг орхи. Шаардлагатай бол аймгийг заа: (нэр үг) биш — шууд утгыг бич; үйл үгийг «-х/-ах» хэлбэрээр (харах, унших).
- surname → «Ли (овог)» маягаар кирилл галигтай. «variant of 看» → «看-ийн хувилбар». «see 看» → «үз: 看». «abbr. for X» → X-ийн товчлол + утга.
- Нэр, газар, байгууллагыг кириллээр галигла (Beijing → Бээжин, мэдэгдэж буй монгол нэр байвал түүнийг).
- Брэнд, сайт, товчлол, латин үсэгтэй нэрийг зохиомол галиглахгүй: латинаар нь үлдээгээд, монголоор товч тайлбар бич (B站 → Bilibili (хятад видео сайт)).
- Сайн мэдэхгүй, утга нь тодорхойгүй бол хоосон «-» бич. Таамаглаж зохиохгүй, утгагүй үг бүү зохио.

Формат: оролт «N|ханз|pinyin|english», гаралт ЯГ ижил тооны «N|монгол» мөр. Өөр юу ч бүү бич (тайлбар, code block, хоосон мөр хэрэггүй)."""

rows = json.load(open(SRC, encoding="utf-8"))
done = set()
if os.path.exists(OUT):
    for l in open(OUT, encoding="utf-8"):
        try: done.add(json.loads(l)["i"])
        except Exception: pass
todo = [i for i, r in enumerate(rows) if i not in done and (a.kind == "all" or r["kind"] == a.kind)]
# HSK үгсийг эхэнд нь (сурагчид эхлээд эдгээрийг хайдаг), дараа нь бусад
hsk = {w["simplified"] for w in json.load(open(os.path.join(ROOT, "data", "hsk_words.json"), encoding="utf-8"))}
todo.sort(key=lambda i: (rows[i]["simplified"] not in hsk, i))
if a.shuffle:
    import random; random.Random(a.shuffle).shuffle(todo)
if a.limit: todo = todo[: a.limit]
print(f"нийт {len(rows)}, хийгдсэн {len(done)}, одоо {len(todo)}  model={a.model}")

import threading, concurrent.futures as cf
tin = tout = 0
lock = threading.Lock()
PRICE = (3.0, 15.0) if "sonnet" in a.model else (1.0, 5.0) if "haiku" in a.model else (5.0, 25.0)  # $/M токен (тооцоо)
start = time.time()
stop = threading.Event()

def usd(): return tin / 1e6 * PRICE[0] + tout / 1e6 * PRICE[1]

def call(user, retries=6):
    global tin, tout
    for k in range(retries):
        try:
            r = client.messages.create(model=a.model, max_tokens=8000, system=SYSTEM,
                                       messages=[{"role": "user", "content": user}])
            with lock:
                tin += r.usage.input_tokens; tout += r.usage.output_tokens
            return r.content[0].text
        except Exception as e:
            time.sleep(min(60, 4 * (k + 1)))
    return ""

def work(chunk, f):
    if stop.is_set(): return 0
    user = "\n".join(f"{n}|{rows[i]['simplified']}|{rows[i]['pinyin']}|{rows[i]['english'][:300]}"
                     for n, i in enumerate(chunk, 1))
    got = {}
    for line in call(user).splitlines():
        m = re.match(r"^\s*(\d+)\s*\|\s*(.+?)\s*$", line.strip("` "))
        if m: got[int(m.group(1))] = m.group(2).split("|")[-1].strip()
    ok = 0
    with lock:
        for n, i in enumerate(chunk, 1):
            mn = got.get(n)
            if not mn or mn == "-": continue
            f.write(json.dumps({"i": i, "simplified": rows[i]["simplified"], "pinyin_num": rows[i]["pinyin_num"],
                                "english": rows[i]["english"], "meaning_mn": mn}, ensure_ascii=False) + "\n"); ok += 1
        f.flush()
    return ok

chunks = [todo[s:s + a.batch] for s in range(0, len(todo), a.batch)]
finished = written = 0
with open(OUT, "a", encoding="utf-8") as f, cf.ThreadPoolExecutor(a.workers) as ex:
    it = iter(chunks); pending = set()
    def submit():
        if stop.is_set(): return
        c = next(it, None)
        if c: pending.add(ex.submit(work, c, f))
    for _ in range(a.workers): submit()
    while pending:
        d, pending = cf.wait(pending, return_when=cf.FIRST_COMPLETED)
        for fu in d:
            written += fu.result(); finished += 1
            if time.time() - start > a.max_minutes * 60 or usd() > a.max_usd: stop.set()
            submit()
        if finished % 20 == 0:
            print(f"  батч {finished}/{len(chunks)}  орчуулсан {written}  ≈${usd():.2f}  {int(time.time()-start)}с", flush=True)
print(f"Зогслоо: {finished}/{len(chunks)} батч, {written} бичилт, in={tin} out={tout}, ≈${usd():.2f}"
      + ("  (цаг/төсвийн хязгаар — дахин ажиллуулбал үргэлжилнэ)" if stop.is_set() else "  — БҮГД ДУУСЛАА"))
