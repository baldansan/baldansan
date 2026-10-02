#!/usr/bin/env python3
"""
Хадмал орчуулга — Anthropic API-аар (ChatGPT/Claude chat цонх хэрэггүй).

Шаардлага:  pip install anthropic      Орчин: ANTHROPIC_API_KEY=sk-ant-...
Хэрэглээ:
  python scripts/bichleg/translate_api.py work/feizhengshi            # mn/epNN.todo.txt → mn/epNN.txt (бүх анги)
  python scripts/bichleg/translate_api.py work/feizhengshi --ep 3     # зөвхөн 3-р анги
  python scripts/bichleg/translate_api.py work/feizhengshi --gloss    # missing-words.txt → gloss.json
Сонголт: --model claude-sonnet-4-5 (default; хямд: claude-haiku-4-5), --batch 120
Нэр томьёо: work/<series>/glossary.txt (мөр бүр «莫凡=Мо Фань») — бүх ангид ижил орчуулагдана.
"""
import argparse, json, os, re, sys, time

ap = argparse.ArgumentParser()
ap.add_argument("folder")
ap.add_argument("--ep", type=int)
ap.add_argument("--gloss", action="store_true")
ap.add_argument("--model", default=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5"))
ap.add_argument("--batch", type=int, default=120)
a = ap.parse_args()

try:
    import anthropic
except ImportError:
    sys.exit("pip install anthropic")
client = anthropic.Anthropic()

cfg = json.load(open(os.path.join(a.folder, "config.json"), encoding="utf-8"))
series = cfg["series"]
gpath = os.path.join(a.folder, "glossary.txt")
glossary = open(gpath, encoding="utf-8").read().strip() if os.path.exists(gpath) else ""

RULES = """Чи монгол сурагчдад зориулсан хятад хэл сурах апп-ын хадмал орчуулагч. Цуврал: {title_zh} ({title_mn}). {desc}

Орчуулгын дүрэм:
- Хоёр алхам: мөрийг өмнөх/дараагийн мөртэй нь хамт ОЙЛГО, дараа нь хятад бүтцийг мартаж «монгол хүн яг энэ үед юу гэж хэлэх вэ» гэдгийг бич. Чангаар уншихад яриа шиг сонсогдох ёстой.
- Калька ХОРИОТОЙ («...-аар дамжуулан», «...болгодог», «утасны нөгөө үзүүрт», «...юм» давталт). Урт мөрийг 2 богино өгүүлбэр болгож болно.
- Орос галиг ХОРИОТОЙ: студент→оюутан, класс→анги, магазин→дэлгүүр, газет→сонин, институт→дээд сургууль.
- Хараал, дуудлагыг монгол ярианы тэнцүү хэллэгээр; хэт албан биш. Дууны үг бол яруу найраглаг богино; англи мөрийг хэвээр.
- Хүний нэрийг кириллээр галигла. Доорх толийг ЗААВАЛ мөрд:
{glossary}

Формат: оролт «N|хятад», гаралт ЯГ ижил тооны «N|монгол» мөр, өөр юу ч бүү бич (тайлбар, code block, хоосон мөр хэрэггүй). Дугаар алгасахгүй, өөрчлөхгүй."""

def call(system, user, retries=3):
    for i in range(retries):
        try:
            r = client.messages.create(model=a.model, max_tokens=8000, system=system,
                                       messages=[{"role": "user", "content": user}])
            return r.content[0].text
        except Exception as e:  # rate limit / network
            print("  retry:", e); time.sleep(5 * (i + 1))
    raise SystemExit("API алдаа")

def parse_nt(text):
    out = {}
    for line in text.splitlines():
        line = line.strip().strip("`")
        m = re.match(r"^(\d+)\s*\|\s*(.+)$", line)
        if m:
            out[int(m.group(1))] = m.group(2).strip()
    return out

def translate_episode(ep):
    src = os.path.join(a.folder, "mn", f"ep{ep:02d}.todo.txt")
    dst = os.path.join(a.folder, "mn", f"ep{ep:02d}.txt")
    if not os.path.exists(src):
        print(f"ep{ep:02d}: {src} байхгүй (эхлээд build_series.py --export-zh)"); return
    lines = [l.rstrip("\n") for l in open(src, encoding="utf-8-sig") if "|" in l]
    system = RULES.format(title_zh=series.get("title_zh", ""), title_mn=series.get("title_mn", ""),
                          desc=series.get("description_mn", ""), glossary=glossary or "(толь хоосон)")
    done, prev = {}, []
    for i in range(0, len(lines), a.batch):
        chunk = lines[i:i + a.batch]
        ctx = ("Өмнөх хэсгийн сүүлийн мөрүүд (зөвхөн контекст, орчуулахгүй):\n" + "\n".join(prev[-8:]) + "\n\n") if prev else ""
        user = ctx + "Орчуул:\n" + "\n".join(chunk)
        got = parse_nt(call(system, user))
        want = [int(l.split("|", 1)[0]) for l in chunk]
        miss = [n for n in want if n not in got]
        if miss:  # дутууг дахин нэг удаа
            got.update(parse_nt(call(system, "Орчуул:\n" + "\n".join(l for l in chunk if int(l.split('|',1)[0]) in miss))))
        done.update({n: got.get(n, "") for n in want})
        prev = chunk
        print(f"  ep{ep:02d}: {min(i + a.batch, len(lines))}/{len(lines)}")
    with open(dst, "w", encoding="utf-8") as f:
        for l in lines:
            n = int(l.split("|", 1)[0]); f.write(f"{n}|{done.get(n, '')}\n")
    empty = sum(1 for v in done.values() if not v)
    print(f"ep{ep:02d}: {len(lines)} мөр → {dst}" + (f"  (хоосон {empty} — дахин ажиллуул)" if empty else ""))

def gloss_words():
    src = os.path.join(a.folder, "missing-words.txt")
    dst = os.path.join(a.folder, "gloss.json")
    words = [l.split("|")[0].strip() for l in open(src, encoding="utf-8") if l.strip()]
    cur = json.load(open(dst, encoding="utf-8")) if os.path.exists(dst) else {}
    words = [w for w in words if not cur.get(w)]
    system = ("Хятад үг/хэллэгийн богино монгол толь бичгийн утга (1–4 үг, кирилл; «; »-ээр хоёр утга болно). "
              "Орос галиг, латин хориотой. Хүний нэрийг кириллээр галигла. Толь:\n" + (glossary or "") +
              "\nФормат: оролт «үг», гаралт «үг|утга» мөр бүрд, өөр юу ч бүү бич.")
    for i in range(0, len(words), 150):
        chunk = words[i:i + 150]
        for line in call(system, "\n".join(chunk)).splitlines():
            if "|" in line:
                w, m = line.split("|", 1)
                if w.strip() in chunk and m.strip():
                    cur[w.strip()] = m.strip()
        print(f"  толь: {min(i + 150, len(words))}/{len(words)}")
    json.dump(cur, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)
    print(f"{len(cur)} үг → {dst}  (одоо build_series.py-г дахин ажиллуул)")

if a.gloss:
    gloss_words()
else:
    eps = [a.ep] if a.ep else [e["ep"] for e in cfg["episodes"]]
    for ep in eps:
        translate_episode(ep)
