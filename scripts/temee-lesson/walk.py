#!/usr/bin/env python3
"""
Тэмээ багшийн хичээлийг утасны хэмжээгээр эхнээс нь дуустал туулж, дэлгэц бүрийн зургийг авна.
  python3 scripts/temee-lesson/walk.py <lessonId> <гаралтын хавтас> [--base URL] [--dark] [--draft]
Жишээ (ноорог хичээлийг live дээр):
  python3 scripts/temee-lesson/walk.py fazhan-chuji1-l02 /tmp/shots --draft
Дуусаад: гарчиг таарахгүй (MISMATCH), товч олдоогүй (NOCLICK/NONEXT), консолын алдаа (ERRS)-г хэвлэнэ —
эдгээр нь хоосон байх ёстой. Дараа нь зургуудыг ӨӨРӨӨ нээж хар (Read): давхцсан/тасарсан бичвэр, хоосон карт.
Шаардлага: pip install playwright && playwright install chromium
"""
import argparse, asyncio, json, os, re
from playwright.async_api import async_playwright

ap = argparse.ArgumentParser()
ap.add_argument("lesson_id"); ap.add_argument("out")
ap.add_argument("--base", default="https://surtsgaay.buunduu.mn")
ap.add_argument("--dark", action="store_true"); ap.add_argument("--draft", action="store_true")
A = ap.parse_args()
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
L = json.load(open(os.path.join(ROOT, "content/temee-lessons", A.lesson_id + ".json"), encoding="utf8"))
os.makedirs(A.out, exist_ok=True)
problems = []

async def click_text(pg, text, scope="main"):
    return await pg.evaluate("""([label,scope])=>{const els=[...document.querySelectorAll(scope+' button, '+scope+' a')].filter(e=>e.offsetParent!==null&&!e.disabled);
      const t=e=>(e.innerText||'').trim().replace(/\\s+/g,' ');
      const el=els.find(e=>t(e)===label)||els.find(e=>t(e).startsWith(label)); if(el){el.click();return true} return false}""", [text, scope])

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(**p.devices["iPhone 13"], locale="mn-MN", color_scheme="dark" if A.dark else "light")
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "favicon" not in m.text else None)
        await pg.goto(f"{A.base}/lessons/{A.lesson_id}/watch" + ("?temee=1" if A.draft else ""), wait_until="networkidle", timeout=90000)
        await pg.wait_for_timeout(2500)
        try: await pg.get_by_text("✕", exact=True).first.click(timeout=2500)
        except Exception: pass
        n = [0]
        async def shot(name):
            await pg.wait_for_timeout(350)
            await pg.screenshot(path=f"{A.out}/{n[0]:03d}-{name}.png", full_page=True); n[0] += 1

        async def run_section(sec, tag):
            for part in sec["parts"]:
                for s in part["screens"]:
                    checks = s.get("checks") or ([s["check"]] if s.get("check") else [])
                    hdr = (await pg.locator(".tm-title").first.inner_text()).strip()
                    if hdr != s["title"]: problems.append(f"MISMATCH {s['id']}: дэлгэц дээр «{hdr}»")
                    for i, c in enumerate(checks):
                        if i == 0:  # эхлээд буруу хариулж үзнэ
                            wrong = [o for j, o in enumerate(c["options"]) if j != c["answer"]][0]
                            await click_text(pg, wrong, ".tm-check"); await pg.wait_for_timeout(150)
                        if not await click_text(pg, c["options"][c["answer"]], ".tm-check"):
                            problems.append(f"NOCLICK {s['id']}: {c['options'][c['answer']]}")
                        await pg.wait_for_timeout(700 if len(checks) > 1 else 200)
                    await shot(f"{tag}-{s['id']}")
                    if not (await click_text(pg, "Дараах") or await click_text(pg, "Дуусгах")):
                        problems.append(f"NONEXT {s['id']}")
                    await pg.wait_for_timeout(300)

        async def run_practice():
            for it in L.get("practice", []):
                if not await click_text(pg, it["options"][it["answer"]], ".tm-opts"):
                    problems.append(f"NOCLICK дасгал {it['id']}")
                await shot(f"p-{it['id']}")
                await click_text(pg, "Дараагийн дасгал") or await click_text(pg, "Дуусгах")
                await pg.wait_for_timeout(300)

        await shot("intro")
        if not await click_text(pg, "Эхлэх"): problems.append("Эхлэх товч олдсонгүй")
        await pg.wait_for_timeout(1200)
        seen = []
        for _ in range(12):
            txt = await pg.locator("main").inner_text()
            m = re.search(r"(\d+) / (\d+) · ([^\n]+)", txt)
            if not m:
                if await click_text(pg, "Дараагийн үе"):
                    await pg.wait_for_timeout(900); continue
                break
            label = m.group(3).strip(); seen.append(label)
            if label == L["teach"]["label"]: await run_section(L["teach"], "t")
            elif L.get("sounds") and label == L["sounds"]["label"]: await run_section(L["sounds"], "s")
            elif label == "Дасгал" and L.get("practice"): await run_practice()
            elif label == "Сорил":
                await shot("quiz-1")
                q = re.search(r"Асуулт 1 / (\d+)", txt)
                if L.get("quiz") and (not q or int(q.group(1)) != len(L["quiz"])):
                    problems.append(f"Сорилын тоо таарахгүй: дэлгэц дээр {q.group(1) if q else '?'}, файлд {len(L['quiz'])}")
                break
            else:
                await shot("stage-" + re.sub(r"\W+", "-", label))
                for _ in range(12):
                    if not await click_text(pg, "Дараагийн мөр"): break
                    await pg.wait_for_timeout(150)
                await click_text(pg, "Үе дуусгах")
            await pg.wait_for_timeout(900)
        if L["teach"]["label"] not in seen: problems.append("«Тэмээ багшийн хичээл» үе гарсангүй (ноорог бол --draft нэм)")
        await pg.goto(f"{A.base}/lessons/{A.lesson_id}" + ("?temee=1" if A.draft else ""), wait_until="networkidle"); await pg.wait_for_timeout(1500)
        await shot("cover")
        print("ҮЕҮД:", seen); print("ЗУРАГ:", n[0]); print("АСУУДАЛ:", problems or "байхгүй"); print("ERRS:", errs[:8] or "байхгүй")
        await b.close()
        raise SystemExit(1 if problems or errs else 0)
asyncio.run(main())
