# HSK3 · 第1课 《周末你有什么打算》 — «Бөөндөө Сурцгаая» апп-ын хичээлийн пакетыг ӨНДӨР ТҮВШИНД дахин бүтээх заавар (2026-11-03)

Чи HSK Standard Course 3-ын 1-р хичээлийг Монгол суралцагчид зориулсан апп-ын JSON пакет болгож бичнэ.
Энэ удаад **эх сурвалж нь OCR биш — бүрэн шалгагдсан JSON**: `/home/claude/baldansan/content/hsk-source/hsk3/hsk3-l01.json`
(textbook: warmup/texts/grammar/exercises/characters/application/saying; teacher: objectives/steps/notes/warmup_answers/text_questions/summary;
workbook: 12 section (transcript + answer бүгд байгаа); hsk30: нэмэлт 13 үг; audio нэрс; unclear). Эхлээд энэ файлыг Python-оор уншиж, хэрэгтэй хэсгээ хэвлэж үз.
Ханзаас таамаглахгүй: үгийн утга = номын англи gloss + 课文 дахь өгүүлбэр. Юу ч зохиохгүй; хариулт эх сурвалжид байхгүй бол (сурах бичгийн 练习 2–4, 练一练)
өөрөө зөв хариулт бичиж QA_REPORT-д «загвар хариулт» гэж тэмдэглэ.

## Загвар (бүтэц) — `/home/claude/baldansan/content/hsk3-packages/hsk3-l02/`
`texts.json`, `grammar.json`, `vocabulary.json`, `workbook.json`, `quiz.json`, `lesson.json`, `manifest.json`, `README.md`, `QA_REPORT.md` — түлхүүр нэрс, үүрлэлт, төрлүүд ЯГ ИЖИЛ.
Текстийг нь хуулахгүй, зөвхөн хэлбэр. Доорх НЭМЭЛТ талбаруудыг давхар нэмнэ (апп-д код нэмэгдэж байгаа).

## Орчуулгын сахилга (ЗААВАЛ) — доорхыг + `/home/claude/hsk3build/L01/mongolian_language.md`-г дага
1. 2 алхмаар орчуул: хятад өгүүлбэрийг БҮХЭЛД нь ойлго → хятад бүтцийг мартаад «монгол хүн юу гэж хэлэх вэ» гэдгийг бич.
2. Калька хориотой (утасны нөгөө үзүүрт ❌, ур чадвараа дамжуулах ❌, цаг хугацааг хэмнэх нөлөө үзүүлдэг ❌ → цаг хэмнэдэг).
3. Урт хятад өгүүлбэр → 2–3 богино монгол өгүүлбэр. 是…的/通过/使-ийг механикаар бүү давт.
4. Орос галиг 0: студент❌→оюутан, магазин❌→дэлгүүр, класс❌→анги, заправк❌, газет❌→сонин, телевизор❌→зурагт.
5. Тэмээ багш (🐫) хэсгүүд: дулаан, энгийн, «чи» гэж ханд, урт хана шиг биш (3–5 өгүүлбэр).
6. mn талбар бүрийг чангаар уншиж «монгол хүн ингэж хэлэх үү?» гэж шалга.
7. Пиньинь бүрт хөгийн тэмдэг. Токен (tokens) ҮГЭЭР бүлэглэсэн ({zh:"打算",py:"dǎsuàn"}), цэг таслал тусдаа token (py:""), токенуудын нийлбэр = zh (хоосон зай/цэг таслалаас бусад).

## Хичээлийн баримт (бүгд hsk3-l01.json-д)
- Гарчиг: 周末你有什么打算 · Zhōumò nǐ yǒu shénme dǎsuàn · «Амралтын өдөр чи юу хийх төлөвлөгөөтэй вэ?»
- Үгс: 4 ярианы `new_words` (текстээс дараалалаар), 专有名词 байвал ард нь. + `hsk30.new_words` 13 үг — vocabulary.json-д `"hskLevel": "HSK3"`, нэмэлт үгст `"tag": "3.0 нэмэлт"` талбар нэмж ард нь жагсаа.
- 4 яриа: audio/hsk3-textbook-0101…0104.mp3; 朗读 = 0105. Дасгалын ном сонсгол: audio/hsk3-workbook-01-part1…4.mp3.
- 热身 хариулт (багшийн ном): 1.①F ②E ③D ④B ⑤A ⑥C; 2.①C ②A ③D ④B.
- Зургууд (аль хэдийн бэлэн, `images/` хавтсанд): hsk3-l01-warmup1-A-map … F-north (热身1 A–F), hsk3-l01-warmup2-1-move/2-review/3-plan/4-worried (热身2 ①–④), hsk3-l01-describe-1-laundry/2-dog/3-car/4-ticket (练习3 描述图片 ①–④). Файл нэр: `images/hsk3-l01-<нэр>.webp`.
- 3 дүрэм: 结果补语“好” / “一……也/都＋不/没……” / 连词“那” — ГУРВУУЛАА.
- 汉字: 指事字 (一二三上下本末) + 旧字新词 (游客/外地/北门) + 汉字辨认 5 хос.
- 俗语: 不到长城非好汉.
- Багшийн номын `text_questions` (15) → яриа бүрийн дараах асуулт; `summary_zh` → дүгнэлт; `steps` → дүрмийн 导入/解析, teacher_notes.

## Файл бүрийн шаардлага

### texts.json (L02 бүтэц + нэмэлт)
- `mainText` = 课文1, `shortTexts` = 课文2–4 (ижил бүтэц: id, title, mongolianTitle, title_mn, audioFile, sentences[zh,pinyin,mn,tokens,note,key_structures], paragraph_summaries, reflection). Өгүүлбэрийн 50–70%-д note + key_structures.
- **НЭМЭЛТ** яриа бүрт (mainText болон shortTexts[] тус бүрд) `"exercises"`: багшийн номын text_questions-оос 2–4 сонголттой асуулт:
  `{"type":"choice","question":"周末小刚打算做什么？","options":["请小丽吃饭、看电影、喝咖啡","在家写作业","去北方旅游"],"answer":"0","explanation_correct_mn":"…","explanation_wrong_mn":"…"}` (answer = зөв сонголтын индекс ТЕКСТ, зөв хариу янз бүрийн байрлалд).
- `warmup.mongolian`: 热身 2 даалгаврыг монголоор (үг↔зураг тааруулах, хариулттай) — L02 шиг.
- `lessonIntro`: teacher_mn (Тэмээ багшийн дулаан оршил 4–6 өгүүлбэр), warmup_mn (нэг асуулт), theme_zh, theme_mn.
- `wordExplanation` ≥ 8 (багшийн номын 讲解方式/扩展搭配-аас: 打算, 一直, 着急, 跟, 带, 复习, 搬, 北方/南方, 好 (结果补语)…), `collocations` (багшийн номын 扩展搭配 + 朗读 хэллэг), `wordComparison` ≥ 2 (ж: 带—拿, 北方—南方, 完—好).
- `textExercises`: selectWord (练习2, 10 асуулт, хариулт зохио + QA-д тэмдэглэ), retell, comprehension (练习4 → багшийн text_questions хариулттай), readAloud (练习1, 0105), **нэмэлт `describePictures`**: 练习3-ын 4 зураг: `[{"n":1,"image":"images/hsk3-l01-describe-1-laundry.webp","dialogue_zh":"A：衣服都________了吗？…","answer_zh":"洗好 / 件 / 没洗 / 打算","answer_mn":"…","hint_mn":"…"}]`.
- `expansionVocabulary`: 汉字 хэсэг (L02 шиг: 旧字新词 words + 辨认 practice) — characters.json-той давхцсан ч болно.
- `applicationDiscussionOrWriting`: 运用 (双人/小组) → ганцаараа хийх хувилбар + writing (загвар эссэ 80–100 ханз «我的周末打算», requiredWords, rubric).
- `commonSaying`: {zh, pinyin, en, meaning_mn, usage_mn, example{zh,pinyin,mn}} — 不到长城非好汉.
- `culture`: 俗语/Их цагаан хэрмийн тухай номын тайлбараас (зохиомол баримт хэрэггүй).
- `grammarNotes` (3), `workbookListening/Reading/Writing/Review` L02 бүтцээр бүтэн.

### grammar.json — 3 дүрэм, L02 бүтэц (point, mongolian, explanation, examples[chinese,pinyin,mongolian] = номын 例句 БҮГД, structure, teacher_notes (багшийн номын 导入/解析), common_mistakes ≥2, check, gloss_mn, teacher_mn 3–5 өгүүлбэр, exercises = 练一练 бүгд → `choice` сатаатуулагчтай + 1 `judge`, explanation_correct_mn/explanation_wrong_mn). Дүрэм 2-т 3 дэд бүтэц (一+MW+N / 一点儿 / 一点儿+Adj) бүгд.

### vocabulary.json — L02 бүтэц (chinese, pinyin, mongolian, hskLevel, exampleChinese, exampleMongolian) + `pos` (монголоор: нэр үг/үйл үг/…) + `collocations_zh` (багшийн 扩展搭配, "打算去唱歌 / 没有打算") + hsk30 үгст `tag`. Жишээ = 课文-оос. Монгол утга ≥4 тэмдэгт.

### characters.json (ШИНЭ)
```json
{"intro":{"title_zh":"指事字","title_mn":"Заах ханз (指事字)","teacher_mn":"🐫 Тэмээ багшийн 3–5 өгүүлбэр: хийсвэр зүйлийг тэмдгээр заасан ханз…"},
 "characters":[{"hanzi":"本","pinyin":["běn"],"strokeCount":5,"radical":"木","practice":"write","meaningMn":"үндэс; дэвтэр (тоолох үг)","etymology_mn":"木-ийн доод талд нэг цэг — модны үндэс","exampleWords":["本子","日本","一本书"]}, … 7 ханз: 一 二 三 上 下 本 末],
 "wordGame":[{"parts":["旅游","客人"],"result":"游客","pinyin":"yóukè","mn":"жуулчин","hint_mn":"аялал + зочин"}, …3],
 "confusables":[{"a":"很","b":"跟","word_a":"很好","word_b":"跟我","mn":"很 — маш; 跟 — …-тай хамт","tip_mn":"…"}, …5 хос]}
```

### workbook.json — L02 бүтэц ЯГ: listening (4 part × 5, type "mc"/"tf"… L02-той адил; items: n, options, answer, question_zh, transcript_zh, audio; part-ийн `audio` + **`shared_audio`** (ижил утга) = "audio/hsk3-workbook-01-partK.mp3"), reading (3 part, 15), writing (15: 连词成句 / 看拼音写汉字 / 辨认汉字 — hsk3-l01.json-ийн section-уудаар), review, answerSource. Хариулт = hsk3-l01.json дахь `answer`. Сонсголын 1-р хэсгийн сонголт зураг тул options = монгол тайлбар (L02 шиг, эх JSON-ийн [picture] тайлбараас).

### quiz.json — 30 асуулт: 12 cloze (8 үг + 4 дүрэм, 5 сонголт) + 18 multiple_choice (8 эх бичвэрийн ойлголт, 6 дүрэм, 4 ханз/俗语), order_index 1–30, id "hsk3-l01-qNN", skillTags, difficulty, explanation (зөв хариу + сатаатуулагч бүрийн утга). correct_answer = сонголтын текст, зөв хариу янз бүрийн байрлалд.

### lesson.json — L02 хэлбэр (lessonId "hsk3-l01", orderIndex 1, icon 🗓️, description "4 课文 + N шинэ үг (+13 HSK3.0) + 3 дүрэм (…) + 汉字 + дасгалын номын 50 дасгал") + **НЭМЭЛТ**:
- `"hook": {"teacher_mn": "<lessonIntro.teacher_mn-тэй ижил>", "warmup_mn": "<lessonIntro.warmup_mn>"}`
- `"exercises_textbook": {"sections":[{"title_mn":"选词填空 — Зөв үгийг сонгож нөх","word_bank":["周末","带","游戏","跟","作业"],"items":[{"n":1,"q":"你写完________了吗？","answer":"作业","explanation_mn":"…"}]}, {…2-р сан}, {"title_mn":"描述图片 — Зургийг тайлбарла","items":[{"n":1,"q":"A：衣服都________了吗？ B：我一________也________。…","image":"images/hsk3-l01-describe-1-laundry.webp","options":["洗好 / 件 / 没洗 / 打算","洗完 / 个 / 没买 / 想"],"answer":"洗好 / 件 / 没洗 / 打算","explanation_mn":"…"}]}, {"title_mn":"根据课文回答问题","items":[{"n":1,"q":"周末小刚打算做什么？","options":["…3"],"answer":"…","explanation_mn":"…"}]}]}`
- `"collocations": [{"zh":"打算去唱歌","mn":"дуулахаар төлөвлөх","usage_mn":"打算 + үйл үг","example":{"zh":"周末你有什么打算？","pinyin":"…","mn":"…"}}, … ≥10]`
- `"recap": {"teacher_mn": "<багшийн 小结-оос Тэмээ багшийн дүгнэлт 4–6 өгүүлбэр>"}`

### manifest.json — L02 ижил; lessonId hsk3-l01, lessonNumber 1, hasImages true, verification.answerStatus "official_verified" (дасгалын ном), textStatus "source_verified (hsk3-l01.json, verified_pages)".
### media.json (би өөрөө бичнэ — чи хөндөхгүй).
### README.md, QA_REPORT.md — монголоор, L02 хэлбэр; QA-д: юуг эх сурвалжтай тулгасан, загвар хариултууд, «орчуулга чангаар уншиж шалгасан».

## Гаралт
`/home/claude/hsk3build/L01/zip/` (аудио, зураг аль хэдийн тэнд). Python скриптээр бич (ensure_ascii=False, indent 1), json.load-оор баталгаажуул. Тайлан: тоо баримт, эргэлзсэн зүйлс, загвар хариултууд. Товч.
