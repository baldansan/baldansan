"""
发展汉语 (Fazhan Hanyu) номуудыг OCR хийх. docs/hsk-source/ocr.py-той ижил арга:
хуудас бүрийг PNG болгож, tesseract (chi_sim+eng) ажиллуулж, хуудас бүрийн текстийг
pages/<book>/pNNN.txt-д хадгална. Дахин ажиллуулахад дууссан хуудсыг алгасна.
Дараалал: queue.txt дэх файлууд (мөр бүрт: <pdf_path>\t<book_slug>).
"""
import os, subprocess, sys, time, concurrent.futures as cf
BASE = os.path.dirname(os.path.abspath(__file__))
PAGES = os.path.join(BASE, "pages")
LOG = open(os.path.join(BASE, "progress.log"), "a", buffering=1)
DPI = "220"

def npages(pdf):
    out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout
    for line in out.splitlines():
        if line.startswith("Pages:"):
            return int(line.split()[1])
    return 0

def ocr_page(pdf, book, n):
    dest = os.path.join(PAGES, book, f"p{n:03d}.txt")
    if os.path.exists(dest):
        return n, "skip"
    png = os.path.join(PAGES, book, f"tmp_{n:03d}")
    subprocess.run(["pdftoppm", "-f", str(n), "-l", str(n), "-r", DPI, "-png", "-singlefile", pdf, png],
                   check=True, capture_output=True)
    subprocess.run(["tesseract", png + ".png", dest[:-4], "-l", "chi_sim+eng", "--psm", "4"],
                   check=True, capture_output=True)
    try: os.remove(png + ".png")
    except OSError: pass
    return n, "ok"

def process(pdf, book):
    os.makedirs(os.path.join(PAGES, book), exist_ok=True)
    total = npages(pdf)
    if not total:
        LOG.write(f"FAIL pdfinfo {book}\n"); return
    done_marker = os.path.join(PAGES, book, "DONE")
    if os.path.exists(done_marker):
        LOG.write(f"skip {book} (done)\n"); return
    LOG.write(f"START {book} pages={total}\n")
    t0 = time.time()
    with cf.ThreadPoolExecutor(max_workers=2) as ex:
        futs = [ex.submit(ocr_page, pdf, book, n) for n in range(1, total + 1)]
        for i, f in enumerate(cf.as_completed(futs), 1):
            try:
                f.result()
            except Exception as e:
                LOG.write(f"  page error {book}: {e}\n")
            if i % 25 == 0:
                LOG.write(f"  {book} {i}/{total} ({round(time.time()-t0)}s)\n")
    open(done_marker, "w").write(str(total))
    LOG.write(f"DONE {book} pages={total} took={round(time.time()-t0)}s\n")

def main():
    while True:
        queue = [l.rstrip("\n").split("\t") for l in open(os.path.join(BASE, "queue.txt")) if l.strip()]
        todo = [(pdf, book) for pdf, book in queue if os.path.exists(pdf)
                and not os.path.exists(os.path.join(PAGES, book, "DONE"))]
        if not todo:
            LOG.write("ALL DONE\n"); return
        pdf, book = todo[0]
        try:
            process(pdf, book)
        except Exception as e:
            LOG.write(f"FAIL {pdf}: {e}\n")

if __name__ == "__main__":
    main()
