# Даалгавар: HSK4 хичээл N-д HSK 3.0 нэмэлт (`hsk30`) оруулах

Эх сурвалж: BLCUP «HSK标准教程4 3.0升级学练手册» (升级指南 PDF, албан ёсны). Хичээл бүрт: **补充生词 10** (хүснэгт: үг, пиньинь, үгийн ай, тайлбар + 练一练 单句填空/对话填空), **语法点 3** (3 дахь нь 固定格式; тус бүр тайлбар, жишээ, 练一练), **综合表达**: 说一说 (асуултууд), 写一写 (сэдэв, 80+ ханз). Төгсгөлд номын 参考答案 (хичээл бүрээр: 生词 练一练, 语法 练一练, 说一说 参考回答, 写一写 范文).

Хавтас `/home/claude/hskbuild/hsk4/LNN/`:
- `src/hsk30_LNN.txt` — хичээлийн 4 хуудсын OCR (алдаатай — зөвхөн чиглүүлэг), `img/hsk30_pNN.png` — **200dpi зураг, үүнийг унш** (Read; хэрэгтэй бол PIL-ээр crop/томруул).
- `src/hsk30_answers_LNN.txt` + `img/hsk30ans_pNN.png` — 参考答案 бүх хуудас; өөрийн хичээлийн (第N课 …) хэсгийг олж ав.
- `prep.json` → `hsk30_pdf`, `hsk30_pdf_pages`, `hsk30_answer_pages`.

Схем: `/home/claude/repo/types/hsk-source-lesson.ts` → `SourceHsk30Supplement` (`hsk30` талбар). Ерөнхий дүрэм `/home/claude/hsk3build/SOURCE-TASK.md` (ном юу хэлж байна тэр л; монголоор бичихгүй; таахгүй; зөрүүг `hsk30.unclear`-д).

## Бүтэц
```
"hsk30": {
  "source": "upgrade_handbook",
  "ref": {"book":"hsk30_handbook","pages":[…хичээлийн PDF хуудас…]},
  "new_words": [{"n":1,"zh":"…","pinyin":"…","pos":"…","en":"…" (англи байхгүй бол хятад тайлбарыг explanation_zh-д, en талбарт хятад тайлбарыг давт), "explanation_zh":"…", "examples":[{"zh":"…"}]}, …10],
  "grammar": [{"n":1,"title_zh":"…","explanation_zh":"…","examples":[…],"practice":[{"n":1,"zh":"…","options":{…},"answer":"…","answer_ref":{"book":"hsk30_handbook","pages":[…]}}],"practice_instruction_zh":"…"}, {n:2…}, {n:3, title_zh:"固定格式：…"}],
  "exercises": [{"n":"生词练一练","type_zh":"单句填空/对话填空","instruction_zh":"…","word_bank":[[…]],"items":[{n, zh, answer, answer_ref}]}],
  "speaking": {"instruction_zh":"…","questions":["…"],"model_answer_zh":"…(参考答案-аас)"},
  "writing": {"instruction_zh":"…","prompt_zh":"…","model_essay_zh":"…(范文)"},
  "unclear": ["…"]
}
```
`answer` — зөвхөн 参考答案-д хэвлэгдсэн бол. Хоосон зайг `________`. Бүх хятад цэг таслал бүтэн өргөнтэй.

## Гаралт
`/home/claude/hskbuild/hsk4/LNN/source.json`-д `hsk30` талбар НЭМ (эхлээд `.bak2` хуулбар; бусад зүйлийг өөрчлөхгүй). Мөн root `unclear`-д нэг мөр: «HSK 3.0 нэмэлт (升级学练手册 х.a–b, хариулт х.c–d) `hsk30`-д». `python3 /home/claude/hsk3build/validate_source.py <файл>` алдаагүй. Тайлан: үг/дүрэм/дасгалын тоо, хариулт орсон эсэх, зөрүү.
