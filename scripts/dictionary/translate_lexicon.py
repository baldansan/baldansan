#!/usr/bin/env python3
"""
CC-CEDICT англи утгыг МОНГОЛ руу орчуулах (бөөн, хямд). Anthropic API.
Оролт: data/dictionary/lexicon.json (build_lexicon.py)   Гаралт: data/dictionary/lexicon_mn.jsonl (resumable)

  python scripts/dictionary/translate_lexicon.py --limit 100          # сорил + зардлын тооцоо
  python scripts/dictionary/translate_lexicon.py --kind word          # бүгдийг (дахин ажиллуулахад үргэлжилнэ)
Сонголт: --model claude-haiku-4-5 (default; чанар өндөр бол claude-sonnet-5-5), --batch 60
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
ap.add_argument("--model", default=os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5"))
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
- Сайн мэдэхгүй, утга нь тодорхойгүй бол хоосон «-» бич. Таамаглаж зохиохгүй.

Формат: оролт «N|ханз|pinyin|english», гаралт ЯГ ижил тооны «N|монгол» мөр. Өөр юу ч бүү бич (тайлбар, code block, хоосон мөр хэрэггүй)."""

rows = json.load(open(SRC, encoding="utf-8"))
done = set()
if os.path.exists(OUT):
    for l in open(OUT, encoding="utf-8"):
        try: done.add(json.loads(l)["i"])
        except Exception: pass
todo = [i for i, r in enumerate(rows) if i not in done and (a.kind == "all" or r["kind"] == a.kind)]
if a.limit: todo = todo[: a.limit]
print(f"нийт {len(rows)}, хийгдсэн {len(done)}, одоо {len(todo)}  model={a.model}")

tin = tout = 0
def call(user):
    global tin, tout
    for k in range(4):
        try:
            r = client.messages.create(model=a.model, max_tokens=8000, system=SYSTEM,
                                       messages=[{"role": "user", "content": user}])
            tin += r.usage.input_tokens; tout += r.usage.output_tokens
            return r.content[0].text
        except Exception as e:
            print("  retry:", e); time.sleep(5 * (k + 1))
    raise SystemExit("API алдаа")

with open(OUT, "a", encoding="utf-8") as f:
    for s in range(0, len(todo), a.batch):
        chunk = todo[s : s + a.batch]
        user = "\n".join(f"{n}|{rows[i]['simplified']}|{rows[i]['pinyin']}|{rows[i]['english'][:300]}"
                         for n, i in enumerate(chunk, 1))
        got = {}
        for line in call(user).splitlines():
            m = re.match(r"^\s*(\d+)\s*\|\s*(.+?)\s*$", line.strip("` "))
            if m: got[int(m.group(1))] = m.group(2)
        ok = 0
        for n, i in enumerate(chunk, 1):
            mn = got.get(n)
            if not mn or mn == "-": continue
            f.write(json.dumps({"i": i, "simplified": rows[i]["simplified"], "pinyin_num": rows[i]["pinyin_num"],
                                "english": rows[i]["english"], "meaning_mn": mn}, ensure_ascii=False) + "\n"); ok += 1
        f.flush()
        print(f"  [{s + len(chunk)}/{len(todo)}] {ok}/{len(chunk)}  токен in={tin} out={tout}")
print(f"Дууслаа. Нийт токен in={tin} out={tout}")
