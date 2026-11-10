#!/bin/bash
# Usage: pack.sh l02 [l03 ...] → repo content/yct-packages/yct-3-lNN + FLAT.zip
set -e
R=/home/claude/baldansan/content/yct-packages
for L in "$@"; do
  NN=${L#l}; D=/home/claude/work/yct3/$L; LID=yct-3-l$NN
  (cd $D && python3 -I build_l$NN.py >/dev/null)
  rm -rf $R/$LID; mkdir -p $R/$LID/_build
  cp -r $D/pkg/. $R/$LID/; cp $D/build_l$NN.py $D/image_prompts.json $R/$LID/_build/; cp $D/source.md $R/$LID/_build/ 2>/dev/null || true
  (cd $D/pkg && rm -f $R/$LID-FLAT.zip && zip -qr $R/$LID-FLAT.zip .)
  echo "$LID: $(du -sh $R/$LID-FLAT.zip | cut -f1) imgs=$(ls $D/pkg/images | wc -l)"
done
