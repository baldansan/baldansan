#!/bin/bash
# render all PDFs: pages PNG 130dpi (vision), OCR text via tesseract at 300dpi
cd /home/claude/work/m30
for pdf in src/L*/*.pdf; do
  d=$(dirname $pdf); b=$(basename $pdf .pdf); out="$d/${b}_pages"; mkdir -p "$out"
  [ -f "$out/.done" ] && continue
  pdftoppm -r 110 -png "$pdf" "$out/p"
  pdftoppm -r 300 -gray -png "$pdf" "$out/hi"
  for hi in "$out"/hi-*.png; do n=$(basename $hi .png); tesseract "$hi" "$out/$n" -l chi_sim+eng --psm 6 >/dev/null 2>&1; rm "$hi"; done
  cat "$out"/hi-*.txt > "$d/${b}.ocr.txt" 2>/dev/null
  touch "$out/.done"; echo "done $pdf"
done
echo ALLDONE
