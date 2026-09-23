"""
OCR хийсэн хуудсуудыг ном тус бүрээр нэг Markdown болгож угсарна.

Гаралт: books/<book>.md — хуудас бүр `<!-- p.NNN -->` тэмдэгтэй, хичээлийн
эхлэлийг `## 第N课 …` гэсэн гарчгаар тэмдэглэсэн. Хичээлийн эхлэлийг OCR
текстээс «第N课» / «Lesson N» хэлбэрээр таньж, тухайн хуудсыг хичээлийн эхний
хуудас гэж үзнэ (нэг хичээл нэг л удаа эхэлнэ — хамгийн эхний тохиолдол).

Мөн books/<book>.index.json — хичээл → хуудсын муж.
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

# «第 3 课», «第三课», «Lesson 3» — хуудсын дээд хэсэгт (эхний 12 мөр) байх ёстой.
LESSON_RE = re.compile(r"第\s*([一二三四五六七八九十\d]{1,3})\s*课")
LESSON_EN = re.compile(r"\bLesson\s+(\d{1,2})\b")

def clean(text):
    # OCR-ийн зайг цэгцлэнэ, хоосон мөрийн давхардлыг багасгана
    lines = [l.rstrip() for l in text.splitlines()]
    out, blank = [], 0
    for l in lines:
        if not l.strip():
            blank += 1
            if blank <= 1: out.append("")
        else:
            blank = 0
            out.append(l)
    return "\n".join(out).strip()

EXPECTED = {
    "HSK-1-Textbook":15,"HSK-2-Textbook":15,"HSK-3-Textbook":20,
    "HSK-4A-Textbook":10,"HSK-4B-Textbook":10,"HSK-5A-Textbook":18,"HSK-5B-Textbook":18,
    "HSK-6A-Textbook":20,"HSK-6B-Textbook":20,
    "HSK-1-Workbook":15,"HSK-2-Workbook":15,"HSK-3-Workbook":20,
    "HSK-4A-Workbook":10,"HSK-4B-Workbook":10,"HSK-5A-Workbook":18,"HSK-5B-Workbook":18,
    "HSK-6A-Workbook":20,"HSK-6B-Workbook":20,
    "HSK_Standard_Course_1_Teacher_39_s_Book":15,"HSK_Standard_Course_2_Teacher_39_s_Book":15,
    "HSK_Standard_Course_3_Teacher_39_s_Book":20,"HSK_Standard_Course_4A_Teacher_39_s_Book":10,
    "HSK_Standard_Course_4B_Teacher_39_s_Book":10,"HSK_Standard_Course_5A_Teacher_39_s_Book":18,
    "HSK_Standard_Course_5B_Teacher_39_s_Book":18,
}
# Гараар засах эхлэл: book -> {lesson: pdf_page}
OVERRIDES_FILE = os.path.join(BASE, "overrides.json")
OVERRIDES = json.load(open(OVERRIDES_FILE)) if os.path.exists(OVERRIDES_FILE) else {}

def printed_offset(files):
    """PDF хуудас − хэвлэсэн хуудас (олонхийн санал)."""
    votes = {}
    for f in files:
        n = int(re.search(r"p(\d+)\.txt$", f).group(1))
        lines = [l.strip() for l in open(f, encoding="utf-8", errors="replace") if l.strip()]
        for l in lines[:4] + lines[-4:]:
            if re.fullmatch(r"\d{1,3}", l) and 0 < int(l) < 500:
                votes[n - int(l)] = votes.get(n - int(l), 0) + 1
    if not votes: return None
    best = max(votes.items(), key=lambda kv: kv[1])
    return best[0] if best[1] >= 5 else None

def teacher_appendix_start(files):
    """Хавсралт (练习册听力文本及参考答案) хаанаас эхэлдэг — номын СҮҮЛИЙН 40%-д
    байх «听力文本» хуудас (гарчгийн хуудсанд ч энэ үг байдаг тул эхнийхийг авахгүй)."""
    pages = [(int(re.search(r"p(\d+)\.txt$", f).group(1)), f) for f in files]
    total = pages[-1][0]
    for n, f in pages:
        if n < total * 0.55: continue
        t = open(f, encoding="utf-8", errors="replace").read()
        if "听力文本" in t and ("参考答案" in t or "练习册" in t):
            return n
    return None

def teacher_lesson_starts(files, book=None):
    """Багшийн ном: хичээл бүр «教学目标»-аар эхэлж, «本课小结»-ээр төгсдөг. Хоёр
    дохиог нэгтгэнэ (OCR аль нэгийг алгасаж болно), гарчиг/өмнөх үгийн хуудсыг хасна."""
    app = teacher_appendix_start(files) or 10**6
    goals, summaries = [], []
    for f in files:
        n = int(re.search(r"p(\d+)\.txt$", f).group(1))
        if n >= app: break
        t = open(f, encoding="utf-8", errors="replace").read()
        if re.search(r"目录|Contents|使用说明|本册说明|编写说明|教材说明|致教师|前言", t[:900]):
            continue
        if "教学目标" in t: goals.append(n)
        if "本课小结" in t: summaries.append(n)
    if not goals or (book and OVERRIDES.get(book, {}).get("first_start")):
        # HSK5 багшийн ном: «教学目标» байхгүй, хичээл бүр «小结与布置作业»-аар төгсдөг.
        # Эхлэл = өмнөх хичээлийн 小结 + 1; 1-р хичээлийн эхлэл overrides.first_start (гарчгийн зураг хуудас).
        first = int(OVERRIDES.get(book, {}).get("first_start", 0)) if book else 0
        summ = []
        for f in files:
            n = int(re.search(r"p(\d+)\.txt$", f).group(1))
            if n >= app or n < first: continue
            if re.search(r"小结与布置作业|布置作业", open(f, encoding="utf-8", errors="replace").read()): summ.append(n)
        if not first or not summ: return []
        return [first] + [x + 1 for x in summ[:-1]]
    first = goals[0]
    # сүүлийн 小结-ийн дараа хичээл байхгүй — түүнийг эхлэл болгохгүй
    cands = sorted(set(goals) | set(x + 1 for x in summaries[:-1] if x + 1 > first))
    merged = []
    for n in cands:
        if n < first: continue
        if merged and n - merged[-1] <= 2: continue
        merged.append(n)
    return merged

def teacher_appendix(files):
    """Хавсралт доторх «第N课» хуудсууд → {pdf_page: N}."""
    app = teacher_appendix_start(files)
    if app is None: return {}
    out = {}
    for f in files:
        n = int(re.search(r"p(\d+)\.txt$", f).group(1))
        if n < app: continue
        t = open(f, encoding="utf-8", errors="replace").read()
        for m in re.finditer(r"第\s*([一二三四五六七八九十\d]{1,3})\s*课", t):
            k = cn_to_int(m.group(1))
            if k and k not in out.values():
                out[n] = k; break
    return out

def lesson_starts(book, files):
    """Хичээлийн эхлэх PDF хуудсуудыг олно (дараалсан жагсаалт)."""
    if book in OVERRIDES and OVERRIDES[book].get("starts"):
        return [int(x) for x in OVERRIDES[book]["starts"]]
    if "Teacher" in book:
        st = teacher_lesson_starts(files, book)
        extra = OVERRIDES.get(book, {}).get("extra_starts", [])
        excl = set(int(x) for x in OVERRIDES.get(book, {}).get("exclude_starts", []))
        return sorted((set(st) | set(int(x) for x in extra)) - excl)
    starts = []
    for f in files:
        n = int(re.search(r"p(\d+)\.txt$", f).group(1))
        text = open(f, encoding="utf-8", errors="replace").read()
        head = "\n".join(text.splitlines()[:18])
        if re.search(r"本册说明|使用说明|编写说明|Contents|目录", head):
            continue  # өмнөх үг, гарчгийн хуудас — хичээлийн эхлэл биш
        if re.search(r"Warm-?up|热身", head):
            starts.append(n); continue
        m = LESSON_RE.search(head) or LESSON_EN.search(head)
        if m and book.endswith("Teacher_39_s_Book"):
            starts.append(n)
    # ойролцоо хуудсуудыг нэгтгэнэ (нэг хичээл 2 хуудсанд илэрсэн бол)
    merged = []
    for n in starts:
        if merged and n - merged[-1] <= 2: continue
        merged.append(n)
    extra = OVERRIDES.get(book, {}).get("extra_starts", [])
    excl = set(int(x) for x in OVERRIDES.get(book, {}).get("exclude_starts", []))
    merged = sorted((set(merged) | set(int(x) for x in extra)) - excl)
    return merged

def assemble(book):
    files = sorted(glob.glob(os.path.join(PAGES, book, "p*.txt")))
    if not files: return None
    offset = printed_offset(files)
    starts = lesson_starts(book, files)
    first_lesson = int(OVERRIDES.get(book, {}).get("first_lesson", 1))
    start_to_lesson = {n: first_lesson + i for i, n in enumerate(starts)}
    appendix = teacher_appendix(files) if "Teacher" in book else {}
    md = [f"# {book.replace('_',' ')}", "",
          f"_OCR (tesseract chi_sim+eng), {len(files)} PDF хуудас. Хэвлэсэн хуудас = PDF хуудас − {offset if offset is not None else '?'}. "
          f"Пиньиний хөгийн тэмдэг OCR-д алдаатай — ханзаас дахин гарга. Хичээлийн эхлэлийг автоматаар таньсан._", ""]
    index = []
    for f in files:
        n = int(re.search(r"p(\d+)\.txt$", f).group(1))
        text = clean(open(f, encoding="utf-8", errors="replace").read())
        if n in start_to_lesson:
            lesson = start_to_lesson[n]
            if index: index[-1]["end_page"] = n - 1
            index.append({"lesson": lesson, "start_page": n, "end_page": None,
                          "printed_page": (n - offset) if offset is not None else None})
            md.append(f"\n## 第{lesson}课  (PDF х. {n}{f', хэвлэсэн х. {n-offset}' if offset is not None else ''})\n")
        if n in appendix:
            md.append(f"\n## Хавсралт · 第{appendix[n]}课 — дасгалын номын сонсголын бичвэр, хариулт (PDF х. {n})\n")
        printed = f" · хэвлэсэн х. {n-offset}" if offset is not None else ""
        md.append(f"<!-- p.{n:03d}{printed} -->")
        md.append(text)
        md.append("")
    if index: index[-1]["end_page"] = int(re.search(r"p(\d+)\.txt$", files[-1]).group(1))
    open(os.path.join(OUT, book + ".md"), "w", encoding="utf-8").write("\n".join(md))
    exp = EXPECTED.get(book)
    json.dump({"book": book, "pages": len(files), "printed_offset": offset,
               "expected_lessons": exp, "lessons": index},
              open(os.path.join(OUT, book + ".index.json"), "w"), ensure_ascii=False, indent=1)
    return len(files), index, exp, offset

if __name__ == "__main__":
    books = sys.argv[1:] or [d for d in sorted(os.listdir(PAGES)) if os.path.exists(os.path.join(PAGES, d, "DONE"))]
    for b in books:
        r = assemble(b)
        if not r: print(b, "no pages"); continue
        n, idx, exp, off = r
        flag = "" if exp is None or exp == len(idx) else f"   <-- ХҮЛЭЭГДСЭН {exp}"
        print(f"{b}: {n} pages, offset={off}, {len(idx)} lessons @pdf {[x['start_page'] for x in idx]}{flag}")
