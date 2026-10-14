#!/bin/bash
# Usage: pack.sh LESSON_DIR  → LESSON_DIR/../fazhan-zhongji1-lNN-FLAT.zip + repo copy (content/fazhan-packages/)
set -e
D=$(cd "$1" && pwd); N=$(basename "$D"); LID="fazhan-zhongji1-$N"
R=/home/claude/baldansan/content/fazhan-packages
cd "$D/pkg" && rm -f "$D/$LID-FLAT.zip" && zip -qr "$D/$LID-FLAT.zip" . -x '__pycache__/*'
rm -rf "$R/$LID"; mkdir -p "$R/$LID/_build"; cp -r "$D/pkg/." "$R/$LID/"
cp "$D"/{meta,vocab,text,grammar,extra,workbook_quiz}.py "$D"/source.md "$R/$LID/_build/" 2>/dev/null || true
for f in media_images.json subtitles.json vocab_audio_map.json; do [ -f "$D/$f" ] && cp "$D/$f" "$R/$LID/_build/"; done
cp "$D/$LID-FLAT.zip" "$R/"
ls -la "$D/$LID-FLAT.zip"
