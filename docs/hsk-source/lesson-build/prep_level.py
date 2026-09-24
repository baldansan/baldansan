"""Ямар ч түвшний хичээлийн эх сурвалжийг бэлтгэнэ (текст + зураг, аудиогүй).
python3 prep_level.py hsk1 5        → /home/claude/hskbuild/hsk1/L05/{src,img,prep.json}
Ном: HSK1,2,3 → нэг ном; hsk4 → 4A (1–10)/4B (11–20); hsk5 → 5A (1–18)/5B (19–36); hsk6 → 6A (1–20)/6B (21–40).
"""
import sys, os, re, json, subprocess
level, N = sys.argv[1], int(sys.argv[2]); NN = f"{N:02d}"
OCR = "/tmp/claude-0/-home-claude/0dad5b7f-ed75-5623-bcab-6034d4b71551/scratchpad/hskocr"
UP = "/mnt/user-data/uploads/Hyatad hel"
num = level[3:]
part = ""
if num == "4": part = "A" if N <= 10 else "B"
if num == "5": part = "A" if N <= 18 else "B"
if num == "6": part = "A" if N <= 20 else "B"
book = f"HSK-{num}{part}"
TB_BOOK = f"{book}-Textbook"; WB_BOOK = f"{book}-Workbook"; TE_BOOK = f"HSK_Standard_Course_{num}{part}_Teacher_39_s_Book"
def pdf(name):
    d = f"{UP}/{level}"
    for f in os.listdir(d):
        if f.startswith(name) and f.endswith(".pdf"): return f"{d}/{f}"
    return None
TB = pdf(TB_BOOK); WB = pdf(WB_BOOK); TE = pdf(TE_BOOK)
OUT = f"/home/claude/hskbuild/{level}/L{NN}"
for d in ("src", "img"): os.makedirs(f"{OUT}/{d}", exist_ok=True)
def sh(c): return subprocess.run(c, shell=True, capture_output=True, text=True).stdout
def lesson_pages(bk, lesson):
    f = f"{OCR}/books/{bk}.index.json"
    if not os.path.exists(f): return None
    idx = json.load(open(f))
    rows = [l for l in idx["lessons"] if l["lesson"] == lesson]
    return (rows[0]["start_page"], rows[0]["end_page"]) if rows else None
def slice_md(bk, a, b):
    md = open(f"{OCR}/books/{bk}.md", encoding="utf-8").read()
    parts = re.split(r"(?=<!-- p\.\d{3})", md)
    return "\n".join(p for p in parts if (m := re.match(r"<!-- p\.(\d{3})", p)) and a <= int(m.group(1)) <= b)
def render(pdfp, pages, prefix, dpi=130):
    if not pdfp: return
    for p in pages:
        if not os.path.exists(f"{OUT}/img/{prefix}_p{p}.png"):
            sh(f'pdftoppm -f {p} -l {p} -r {dpi} -png -singlefile "{pdfp}" "{OUT}/img/{prefix}_p{p}"')
rep = {"level": level, "lesson": N, "book": f"HSK{num}{part}", "pdf": {"textbook": TB, "teacher": TE, "workbook": WB}}
# textbook
r = lesson_pages(TB_BOOK, N)
if r:
    a, b = r; open(f"{OUT}/src/textbook_L{NN}.txt", "w").write(slice_md(TB_BOOK, a, b)); render(TB, range(a, b + 1), "textbook"); rep["textbook_pdf_pages"] = [a, b]
# teacher
r = lesson_pages(TE_BOOK, N) if TE else None
if r:
    a, b = r; open(f"{OUT}/src/teacher_L{NN}.txt", "w").write(slice_md(TE_BOOK, a, b)); render(TE, range(a, b + 1), "teacher"); rep["teacher_pdf_pages"] = [a, b]
    md = open(f"{OCR}/books/{TE_BOOK}.md", encoding="utf-8").read()
    m = re.search(rf"## Хавсралт · 第{N}课.*?(?=## Хавсралт · 第\d+课|\Z)", md, re.S)
    if m:
        pages = sorted(set(int(x) for x in re.findall(r"<!-- p\.(\d{3})", m.group(0))))[:5]
        txt = "\n".join(p for p in re.split(r"(?=<!-- p\.\d{3})", m.group(0)) if (mm := re.match(r"<!-- p\.(\d{3})", p)) and int(mm.group(1)) in pages) if pages else m.group(0)
        open(f"{OUT}/src/teacher_appendix_L{NN}.txt", "w").write(txt)
        if pages: pages.append(pages[-1] + 1)
        render(TE, pages, "teacher"); rep["appendix_pdf_pages"] = pages
    else:
        rep["appendix_pdf_pages"] = []
else:
    rep["teacher_pdf_pages"] = None
# workbook
r = lesson_pages(WB_BOOK, N)
if r:
    a, b = r; open(f"{OUT}/src/workbook_L{NN}.txt", "w").write(slice_md(WB_BOOK, a, b)); render(WB, range(a, b + 1), "workbook"); rep["workbook_pdf_pages"] = [a, b]
    # дасгалын номын хавсралт (5B: наалттай товхимол)
    md = open(f"{OCR}/books/{WB_BOOK}.md", encoding="utf-8").read()
    m = re.search(rf"## Хавсралт · 第{N}课.*?(?=## Хавсралт · 第\d+课|\Z)", md, re.S)
    if m:
        pages = sorted(set(int(x) for x in re.findall(r"<!-- p\.(\d{3})", m.group(0))))[:4]
        open(f"{OUT}/src/workbook_appendix_L{NN}.txt", "w").write(m.group(0)); render(WB, pages, "workbook"); rep["workbook_appendix_pdf_pages"] = pages
# HSK1 хариултын ном
if level == "hsk1":
    r = lesson_pages("hsk1-workbook-answers", N)
    if r:
        a, b = r; open(f"{OUT}/src/workbook_answers_L{NN}.txt", "w").write(slice_md("hsk1-workbook-answers", a, b))
        render(pdf("hsk1-workbook-answers"), range(a, b + 1), "answers"); rep["workbook_answers_pdf_pages"] = [a, b]
json.dump(rep, open(f"{OUT}/prep.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(rep, ensure_ascii=False))
