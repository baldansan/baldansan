"""HSK3 хичээл N-ийн эх сурвалжийг бэлтгэнэ: src/ текст, img/ зураг, zip/audio/ аудио.
python3 prep.py 3
"""
import sys, os, re, json, subprocess, glob
N = int(sys.argv[1]); NN = f"{N:02d}"
HERE = os.path.dirname(os.path.abspath(__file__))
OCR = "/tmp/claude-0/-home-claude/0dad5b7f-ed75-5623-bcab-6034d4b71551/scratchpad/hskocr"
UP = "/mnt/user-data/uploads/Hyatad hel/hsk3"
TB = f"{UP}/HSK-3-Textbook.pdf"; TE = f"{UP}/HSK_Standard_Course_3_Teacher_39_s_Book.pdf"; WB = f"{UP}/HSK-3-Workbook.pdf"
OUT = f"{HERE}/L{NN}"
for d in ("src", "img", "zip/audio", "probe"): os.makedirs(f"{OUT}/{d}", exist_ok=True)

def sh(cmd): return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout

def lesson_pages(book, lesson):
    idx = json.load(open(f"{OCR}/books/{book}.index.json"))
    row = [l for l in idx["lessons"] if l["lesson"] == lesson][0]
    return row["start_page"], row["end_page"]

def slice_md(book, a, b):
    md = open(f"{OCR}/books/{book}.md", encoding="utf-8").read()
    parts = re.split(r"(?=<!-- p\.\d{3})", md)
    keep = [p for p in parts if (m := re.match(r"<!-- p\.(\d{3})", p)) and a <= int(m.group(1)) <= b]
    return "\n".join(keep)

def render(pdf, pages, prefix, dpi=130):
    for p in pages:
        if not os.path.exists(f"{OUT}/img/{prefix}_p{p}.png"):
            sh(f'pdftoppm -f {p} -l {p} -r {dpi} -png -singlefile "{pdf}" "{OUT}/img/{prefix}_p{p}"')

# 1. textbook
a, b = lesson_pages("HSK-3-Textbook", N)
open(f"{OUT}/src/textbook_L{NN}.txt", "w").write(slice_md("HSK-3-Textbook", a, b)); render(TB, range(a, b + 1), "textbook")
tb_pages = (a, b)
# 2. teacher + appendix
a, b = lesson_pages("HSK_Standard_Course_3_Teacher_39_s_Book", N)
open(f"{OUT}/src/teacher_L{NN}.txt", "w").write(slice_md("HSK_Standard_Course_3_Teacher_39_s_Book", a, b)); render(TE, range(a, b + 1), "teacher")
te_pages = (a, b)
md = open(f"{OCR}/books/HSK_Standard_Course_3_Teacher_39_s_Book.md", encoding="utf-8").read()
m = re.search(rf"## Хавсралт · 第{N}课.*?(?=## Хавсралт · 第{N+1}课|\Z)", md, re.S)
app_pages = []
if m:
    open(f"{OUT}/src/teacher_appendix_L{NN}.txt", "w").write(m.group(0))
    app_pages = sorted(set(int(x) for x in re.findall(r"<!-- p\.(\d{3})", m.group(0))))
    # хариултын хуудас дараагийн хичээлийн гарчигт орсон байж болно — +1 хуудас нэм
    app_pages.append(app_pages[-1] + 1)
    render(TE, app_pages, "teacher")
else:
    print("!! appendix heading not found for lesson", N)
# 3. workbook: printed 7 pages per lesson, PDF = printed + 4; шалгаж тохируулна
wb_start = 4 + 1 + 7 * (N - 1)
wpages = list(range(wb_start - 1, wb_start + 8))
txt = {}
for p in wpages:
    sh(f'pdftoppm -f {p} -l {p} -r 220 -png -singlefile "{WB}" "{OUT}/wb_p{p}" && tesseract "{OUT}/wb_p{p}.png" "{OUT}/wb_p{p}" -l chi_sim+eng --psm 4 2>/dev/null')
    txt[p] = open(f"{OUT}/wb_p{p}.txt", encoding="utf-8", errors="replace").read() if os.path.exists(f"{OUT}/wb_p{p}.txt") else ""
def has_lesson_head(t, k): return re.search(rf"第\s*{k}\s*课", t[:400]) is not None
starts = [p for p in wpages if has_lesson_head(txt[p], N)]
nxt = [p for p in wpages if has_lesson_head(txt[p], N + 1)]
s = starts[0] if starts else wb_start
e = (nxt[0] - 1) if nxt else s + 6
wb_pages = list(range(s, e + 1))
with open(f"{OUT}/src/workbook_L{NN}.txt", "w") as f:
    for p in wb_pages:
        if p not in txt:
            sh(f'pdftoppm -f {p} -l {p} -r 220 -png -singlefile "{WB}" "{OUT}/wb_p{p}" && tesseract "{OUT}/wb_p{p}.png" "{OUT}/wb_p{p}" -l chi_sim+eng --psm 4 2>/dev/null')
            txt[p] = open(f"{OUT}/wb_p{p}.txt", encoding="utf-8", errors="replace").read()
        f.write(f"<!-- WB PDF p.{p} · хэвлэсэн х. {p-4} -->\n{txt[p]}\n")
render(WB, wb_pages, "workbook")
for f_ in glob.glob(f"{OUT}/wb_p*"): os.remove(f_)
# 4. audio
clips = sorted(glob.glob(f"{HERE}/tbaudio/hsk3textbookaudios/lesson-{NN}/*.mp3"))
for c in clips:
    sh(f'ffmpeg -v error -y -i "{c}" -ac 1 -b:a 48k "{OUT}/zip/audio/{os.path.basename(c)}"')
wbmp3 = f"{UP}/HSK3_Textbook.pdf/hsk3workbookaudios/hsk3workbookaudios/lesson-{NN}/hsk3-workbook-{NN}.mp3"
audio_report = {}
if os.path.exists(wbmp3):
    dur = float(sh(f'ffprobe -v error -show_entries format=duration -of csv=p=0 "{wbmp3}"').strip())
    det = sh(f'ffmpeg -hide_banner -i "{wbmp3}" -af silencedetect=noise=-35dB:d=4 -f null - 2>&1')
    sil = [(float(e_), float(d_)) for e_, d_ in re.findall(r"silence_end: ([0-9.]+) \| silence_duration: ([0-9.]+)", det)]
    # завсрын уртын огцом өсөлт = хэсгийн зааг; Part2 = 7 завсар, бусад 6 (жишээ + 5)
    # Урт бүлэглэх: дараалсан завсрын уртууд ойролцоо (<1.5 с зөрүү) бол нэг хэсэг
    groups = []
    for end, d in sil:
        if groups and abs(groups[-1][-1][1] - d) < 1.5: groups[-1].append((end, d))
        else: groups.append([(end, d)])
    audio_report = {"duration": dur, "groups": [[len(g), round(g[0][1], 1), round(g[0][0], 1), round(g[-1][0], 1)] for g in groups]}
    # хэсгийн эхлэл = өмнөх бүлгийн сүүлийн silence_end
    if len(groups) >= 3:
        # Part3 ба Part4 ижил урттай завсартай тул нэг бүлэгт нийлдэг — 12 завсар бол 6/6 хуваана
        bounds = [0.0]
        flat = []
        for g in groups:
            if len(g) == 12: flat.append(g[:6]); flat.append(g[6:])
            elif len(g) == 13: flat.append(g[:7]); flat.append(g[7:])
            else: flat.append(g)
        for g in flat[:-1]: bounds.append(g[-1][0])
        audio_report["flat_groups"] = [len(g) for g in flat]
        audio_report["bounds"] = bounds
        if len(flat) == 4:
            for i, st in enumerate(bounds):
                en = bounds[i + 1] if i + 1 < len(bounds) else dur
                sh(f'ffmpeg -v error -y -ss {st} -to {en} -i "{wbmp3}" -ac 1 -b:a 48k "{OUT}/zip/audio/hsk3-workbook-{NN}-part{i+1}.mp3"')
                sh(f'ffmpeg -v error -y -ss {st} -t 10 -i "{wbmp3}" -ac 1 -ar 16000 "{OUT}/probe/part{i+1}.wav"')
else:
    audio_report = {"missing": wbmp3}
json.dump({"lesson": N, "textbook_pdf_pages": tb_pages, "teacher_pdf_pages": te_pages, "appendix_pdf_pages": app_pages,
           "workbook_pdf_pages": [wb_pages[0], wb_pages[-1]], "textbook_clips": [os.path.basename(c) for c in clips],
           "workbook_audio": audio_report}, open(f"{OUT}/prep.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(json.load(open(f"{OUT}/prep.json")), ensure_ascii=False, indent=1))
