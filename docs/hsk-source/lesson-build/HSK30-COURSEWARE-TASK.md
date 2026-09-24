# Даалгавар: HSK1–3 хичээлд HSK 3.0 нэмэлт (`hsk30`, source = "courseware") оруулах

Эх сурвалж: BLCUP албан ёсны 课件（补充HSK3.0内容）— pptx-ээс гаргасан markdown: `/home/claude/repo/docs/hsk-source/courseware/{level}/{level}-lNN.md`
(слайд бүр «## Слайд N» гарчигтай; текстийн блокууд байрлалын дарааллаар). Түвшний үгийн жагсаалт: `/home/claude/repo/docs/hsk-source/courseware/{level}/{level}-hsk30-vocab-index.txt`
(«补充 HSK3.0 生词：…» / «补充词语 课文N：…» — хичээл бүрийн нэмэлт үгс, ЭНЭ жагсаалттай тааруул).

Слайдууд дотроос **зөвхөн HSK 3.0-ийн НЭМЭЛТ** хэсгийг ав:
- HSK3/HSK2: «补充词汇» слайд — үг / пиньинь / pos. en гурвал. (Слайдын блокууд заримдаа холилддог — үгийн жагсаалттай тааруулж зөв хослуул.)
- HSK1: «补充生词Supplement New Words» слайд, мөн «补充练习Supplement Exercises» слайд (дасгал → `exercises`), «补充汉字» байвал `unclear`-д тэмдэглэ.
- Нэмэлт 语言点 (сурах бичигт байхгүй дүрэм) слайд байвал `grammar`-т; сурах бичгийн өөрийн 语言点-ийг ОРУУЛАХГҮЙ (тэр `textbook.grammar`-т байгаа).

Схем `/home/claude/repo/types/hsk-source-lesson.ts` → `SourceHsk30Supplement`. Гаралт: `/home/claude/hskbuild/{level}/LNN/source.json`-д `hsk30` талбар нэмэх (эхлээд `.bak2` хуулбар; өөр юу ч өөрчлөхгүй):
```
"hsk30": {"source":"courseware","ref":{"book":"hsk30_courseware","pages":[слайдын дугаарууд]},
  "new_words":[{"n":1,"zh":"工作日","pinyin":"gōngzuòrì","pos":"n.","en":"weekday","text":1}], (text = аль 课文-д хамаарах, vocab-index-ээс)
  "grammar":[], "exercises":[…байвал…], "unclear":["…"]}
```
Root `unclear`-д нэг мөр: «HSK 3.0 нэмэлт үгс (BLCUP 课件 补充HSK3.0, слайд …) `hsk30`-д». Монголоор зөвхөн unclear-д. Хэвлэгдсэн хэлбэрээр (pos, en номынхоороо). Слайдад байхгүй ч vocab-index-д байгаа үг бол zh-г index-ээс авч, pinyin/en байхгүйг `unclear`-д тэмдэглэ (таахгүй; pinyin талбар заавал тул хоосон "" биш — index-д байхгүй бол үгийг `unclear`-д л бич).
`python3 /home/claude/hsk3build/validate_source.py <файл>` алдаагүй. Тайлан: хичээл бүрийн үгийн тоо, index-тэй таарсан эсэх.
