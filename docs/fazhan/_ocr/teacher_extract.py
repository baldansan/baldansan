"""教案 (багшийн төлөвлөгөө) PDF → teacher/<book>/lNN.md. Файл = хичээл.
pdftotext/pdftoppm эдгээр PDF-ийн хятад текстийг алддаг (poppler-д Adobe-GB1 cmap
алга, TT4 фонт) — PyMuPDF (pymupdf) өөрийн cmap-тай тул текстийг БҮРЭН гаргана, OCR хэрэггүй.
Хэрэглээ: python3 teacher_extract.py <book> <src_dir> <out_dir>"""
import os, re, sys, glob, pymupdf
book, src_dir, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out_dir, exist_ok=True)
files = sorted(glob.glob(os.path.join(src_dir, "*.pdf")), key=lambda f: int(re.search(r"第(\d+)课", f).group(1)))
for pdf in files:
    k = int(re.search(r"第(\d+)课", pdf).group(1)); d = pymupdf.open(pdf)
    md = [f"# {book} · 第{k}课 教案", "", f"_pymupdf текст давхарга (OCR биш), {len(d)} х. Эх: `{os.path.basename(pdf)}`_", ""]
    for i, p in enumerate(d, 1):
        t = re.sub(r"[ \t]+\n", "\n", p.get_text()); t = re.sub(r"\n{3,}", "\n\n", t).strip()
        md += [f"<!-- p.{i:03d} -->", t, ""]
    open(os.path.join(out_dir, f"l{k:02d}.md"), "w", encoding="utf-8").write("\n".join(md))
    print(f"L{k}: {len(d)} p, {sum(len(x) for x in md)} chars")
