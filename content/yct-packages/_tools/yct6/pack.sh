#!/bin/bash
# Usage: pack.sh l02 [l03 ...] → repo content/yct-packages/yct-6-lNN + FLAT.zip
set -e
R=/home/claude/baldansan/content/yct-packages
for L in "$@"; do
  NN=${L#l}; D=/home/claude/work/yct6/$L; LID=yct-6-l$NN
  (cd $D && python3 -I build_l$NN.py >/dev/null); python3 -I /home/claude/work/yct6/shrink.py $L
  for f in $D/pkg/audio/*text-song*.mp3; do ffmpeg -v error -y -i "$f" -codec:a libmp3lame -b:a 80k -ar 44100 "$f.tmp.mp3" && mv "$f.tmp.mp3" "$f"; done
  rm -rf $R/$LID; mkdir -p $R/$LID/_build
  cp -r $D/pkg/. $R/$LID/; cp $D/build_l$NN.py $D/image_prompts.json $R/$LID/_build/; cp $D/source.md $R/$LID/_build/ 2>/dev/null || true
  (cd $D/pkg && rm -f $R/$LID-FLAT.zip && zip -qr $R/$LID-FLAT.zip .)
  echo "$LID: $(du -sh $R/$LID-FLAT.zip | cut -f1) imgs=$(ls $D/pkg/images | wc -l)"
done
