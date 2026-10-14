"""
OCR хийсэн 发展汉语 хуудсуудыг ном тус бүрээр нэг Markdown болгож угсарна.
docs/hsk-source/assemble.py-тэй ижил зарчим, гэхдээ 发展汉语-ийн хичээлийн эхлэлийг
өөр аргаар таних шаардлагатай (энэ номд "第N课" гэсэн гарчиг хичээлийн эхний
хуудсанд ШУУД гардаггүй — том өнгөт дугаар + гарчгийн зурагтай хуудсаар эхэлдэг,
дугаарыг OCR уншиж чаддаггүй тул дараалан дугаарлана):

  * "-answers" ном (参考答案, хариултын ном) — "第一课/第二课/…" (хятад тоогоор)
    мөрөөр шууд дугаарладаг → cn_to_int ашиглан шууд унших.
  * Үндсэн сурах бичиг (综合) — хичээл бүр том дугаар + гарчгийн зурагтай хуудсаар
    эхэлж, дараа нь 初级: "语音练习 Phonetic Exercises" эсвэл 中级/高级: "题解"/
    "词语学习" гэсэн анхны дэд гарчгаар үргэлжилнэ. Эдгээр REGEX-ийг (зөвхөн эхний
    удаа тохиолдоход) хичээлийн эхлэл гэж үзнэ, дараалан дугаарлана
    (first_lesson + i). Тоо нь 教案 (багшийн төлөвлөгөө, хичээл тус бүр тусдаа
    файлтай)-ийн файлын тооноос гарсан хүлээгдсэн тоотой (EXPECTED) таарч байгааг
    шалгана — зөрвөл index.json-д ХҮЛЭЭГДСЭН тэмдэглэнэ, overrides.json-оор
    гараар засна.
"""
import os, re, json, glob, sys

BASE = os.path.dirname(os.path.abspath(__file__))
PAGES = os.path.join(BASE, "pages")
OUT = os.path.join(BASE, "books")
os.makedirs(OUT, exist_ok=True)

CN_NUM = {"一":1,"二":2,"三":3,"四":4,"五":5,"六":6,"七":7,"八":8,"九":9,"十":10}
def cn_to_int(s):
    s = s.strip()
    if s.isdigit(): return int(s)
    if s in CN_NUM: return CN_NUM[s]
    if s.startswith("十"): return 10 + CN_NUM.get(s[1:], 0) if len(s) > 1 else 10
    if "十" in s:
        a, b = s.split("十", 1)
        return CN_NUM.get(a, 0) * 10 + (CN_NUM.get(b, 0) if b else 0)
    return None

ANSWERS_LESSON_RE = re.compile(r"第\s*([一二三四五六七八九十]{1,4})\s*课")
# Лавлагаа: "语音练习/题解/词语学习" эхний нэр зөвхөн фонетикийн хичээлүүдэд байдаг
# (анхны 10 орчим хичээл) — дундаас хойш алга болдог тул 9/30-аар дутуу олсон.
# "Part One" (第一部分) бол лавлагаагаар бүх хичээлийн гарчгийн хуудасны дараа шууд
# ордог тогтмол загвар (chuji-zonghe-1 дээр 29/30 олсон) — үүнийг гол тэмдэг болгов.
TEXTBOOK_START_RE = re.compile(r"\bPart\s+One\b")
TEXTBOOK_START_FALLBACK_RE = re.compile(r"语音练习|Phonetic Exercises|题\s*解|词语学习")

# 教案 (per-lesson teacher-plan files) тооноос гарсан хүлээгдсэн хичээлийн тоо.
EXPECTED = {
    "chuji-zonghe-1": 30, "chuji-zonghe-2": 25,
    "zhongji-zonghe-1": 15, "zhongji-zonghe-2": 15,
    "gaoji-zonghe-1": 15, "gaoji-zonghe-2": 15,
}
OVERRIDES_FILE = os.path.join(BASE, "overrides.json")
OVERRIDES = json.load(open(OVERRIDES_FILE)) if os.path.exists(OVERRIDES_FILE) else {}

def page_no(f):
    return int(re.search(r"p(\d+)\.txt$", f).group(1))

def clean(text):
    lines = [l.rstrip() for l in text.splitlines()]
    out, blank = [], 0
    for l in lines:
        if not l.strip():
            blank += 1
            if blank <= 1: out.append("")
        else:
            blank = 0; out.append(l)
    return "\n".join(out).strip()

def answers_lesson_starts(files):
    """Хариултын ном: '第一课 … ' мөр → {pdf_page: [lessons]}. Нэг хуудсанд хэд хэдэн
    хичээлийн гарчиг багтдаг (жижиг хариулт, нягт байршилтай) тул ХАМГИЙН ЭХНИЙ
    тохиолдлыг биш, ДАРААЛСАН бүх тохиолдлыг (last+1) хуудас болгонд авна."""
    out, last = {}, 0
    for f in files:
        n = page_no(f)
        text = open(f, encoding="utf-8", errors="replace").read()
        for m in ANSWERS_LESSON_RE.finditer(text):
            k = cn_to_int(m.group(1))
            # OCR-ийн алдаанаас болж заримдаа дараалал тасардаг (жиш: "六"->"从")
            # тул k==last+1 гэж чанга шаардахгүй, 1-5 илүү өсөхийг зөвшөөрнө.
            if k and last < k <= last + 5:
                out.setdefault(n, []).append(k); last = k
    return out

def textbook_lesson_starts(files, book):
    """Үндсэн сурах бичиг: эхний удаа '语音练习/题解/词语学习' тохиолдсон хуудсыг
    хичээлийн эхлэл гэж үзнэ (ойролцоо хуудсуудыг нэгтгэнэ)."""
    if book in OVERRIDES and OVERRIDES[book].get("starts"):
        return [int(x) for x in OVERRIDES[book]["starts"]]
    cands = []
    for f in files:
        n = page_no(f)
        text = open(f, encoding="utf-8", errors="replace").read()
        head = "\n".join(text.splitlines()[:15])
        if TEXTBOOK_START_RE.search(head):
            cands.append(n)
    if len(cands) < 5:
        # "Part One" олдоогүй бол (OCR чанар муу эсвэл загвар өөр) хуучин
        # тэмдгүүдээр оролдоно.
        cands = []
        for f in files:
            n = page_no(f)
            text = open(f, encoding="utf-8", errors="replace").read()
            head = "\n".join(text.splitlines()[:12])
            if TEXTBOOK_START_FALLBACK_RE.search(head):
                cands.append(n)
    merged = []
    for n in cands:
        if merged and n - merged[-1] <= 2: continue
        merged.append(n)
    extra = OVERRIDES.get(book, {}).get("extra_starts", [])
    excl = set(int(x) for x in OVERRIDES.get(book, {}).get("exclude_starts", []))
    merged = sorted((set(merged) | set(int(x) for x in extra)) - excl)
    return merged

def assemble(book):
    files = sorted(glob.glob(os.path.join(PAGES, book, "p*.txt")))
    if not files: return None
    first_lesson = int(OVERRIDES.get(book, {}).get("first_lesson", 1))
    is_answers = book.endswith("-answers")
    if is_answers:
        start_to_lessons = answers_lesson_starts(files)  # n -> [lesson,...]
    else:
        starts = textbook_lesson_starts(files, book)
        start_to_lessons = {n: [first_lesson + i] for i, n in enumerate(starts)}
    md = [f"# {book}", "",
          f"_OCR (tesseract chi_sim+eng), {len(files)} PDF хуудас. Хичээлийн эхлэлийг "
          f"{'хятад тоон \"第N课\" гарчгаар' if is_answers else '\"语音练习/题解/词语学习\" анхны дэд гарчгаар'} "
          f"автоматаар таньсан — 100% биш, overrides.json-оор гараар засч болно._", ""]
    index = []
    for f in files:
        n = page_no(f)
        text = clean(open(f, encoding="utf-8", errors="replace").read())
        for lesson in start_to_lessons.get(n, []):
            if index: index[-1]["end_page"] = n - 1
            index.append({"lesson": lesson, "start_page": n, "end_page": None})
            md.append(f"\n## 第{lesson}课  (PDF х. {n})\n")
        md.append(f"<!-- p.{n:03d} -->")
        md.append(text)
        md.append("")
    if index and index[-1]["end_page"] is None:
        index[-1]["end_page"] = page_no(files[-1])
    open(os.path.join(OUT, book + ".md"), "w", encoding="utf-8").write("\n".join(md))
    exp = EXPECTED.get(book.replace("-answers", "")) if is_answers else EXPECTED.get(book)
    json.dump({"book": book, "pages": len(files), "expected_lessons": exp, "lessons": index},
              open(os.path.join(OUT, book + ".index.json"), "w"), ensure_ascii=False, indent=1)
    return len(files), index, exp

if __name__ == "__main__":
    books = sys.argv[1:] or [d for d in sorted(os.listdir(PAGES)) if os.path.exists(os.path.join(PAGES, d, "DONE"))]
    for b in books:
        r = assemble(b)
        if not r: print(b, "no pages"); continue
        n, idx, exp = r
        flag = "" if exp is None or exp == len(idx) else f"   <-- ХҮЛЭЭГДСЭН {exp}"
        print(f"{b}: {n} pages, {len(idx)} lessons @pdf {[x['start_page'] for x in idx]}{flag}")
