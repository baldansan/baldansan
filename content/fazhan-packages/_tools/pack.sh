#!/bin/bash
# Usage: pack.sh LESSON_DIR [BOOK_ID]  → LESSON_DIR/../{BOOK_ID}-lNN-FLAT.zip + repo copy (content/fazhan-packages/)
# BOOK_ID default: fazhan-zhongji1 (backward compatible). Pass e.g. fazhan-zhongji2 for the next book.
set -e
D=$(cd "$1" && pwd); N=$(basename "$D"); BOOK="${2:-fazhan-zhongji1}"; LID="$BOOK-$N"
R=/home/claude/baldansan/content/fazhan-packages
cd "$D/pkg" && rm -f "$D/$LID-FLAT.zip" && zip -qr "$D/$LID-FLAT.zip" . -x '__pycache__/*'
rm -rf "$R/$LID"; mkdir -p "$R/$LID/_build"; cp -r "$D/pkg/." "$R/$LID/"
cp "$D"/{meta,vocab,text,grammar,extra,workbook_quiz}.py "$D"/source.md "$R/$LID/_build/" 2>/dev/null || true
for f in media_images.json subtitles.json vocab_audio_map.json; do [ -f "$D/$f" ] && cp "$D/$f" "$R/$LID/_build/"; done
cp "$D/$LID-FLAT.zip" "$R/"
ls -la "$D/$LID-FLAT.zip"
