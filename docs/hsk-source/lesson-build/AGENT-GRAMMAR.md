Чи «Бөөндөө Сурцгаая» апп-ын HSK3 N-р хичээлийн `grammar.json`, `vocabulary.json`, `quiz.json`, `lesson.json`, `manifest.json`, `README.md`, `QA_REPORT.md` файлуудыг бичнэ.

1. `/home/claude/hsk3build/INSTRUCTIONS-L0N.md`-г бүтнээр унш (баримт, файлын байршил `L0N/src/…`, `L0N/img/…`, бичих дүрэм).
2. Загварууд: `/home/claude/hsk3build/ref/l01_grammar.json` (бүтэц: point, mongolian, explanation, examples, structure, teacher_notes, common_mistakes, check, gloss_mn, teacher_mn, exercises — ижил түлхүүр, төрөл), `ref/l01_vocabulary.json`, `ref/l01_quiz.json`, `ref/l01_lesson_meta.json`. Мөн 2-р хичээлийн бэлэн файлууд `/home/claude/hsk3build/zip/{grammar,vocabulary,quiz,lesson,manifest}.json`, `README.md`, `QA_REPORT.md` — хэлбэрийн жишээ (текст хуулахгүй).
3. Эх сурвалж: `L0N/src/textbook_L0N.txt` (注释 + 练一练), `L0N/src/teacher_L0N.txt` (дүрмийн задлан, заах алхам, нэмэлт жишээ, харьцуулалт). OCR эвдэрсэн газрыг `L0N/img/*.png` зургуудаар шалга. Бэлэн болсон `L0N/zip/texts.json` байвал үг/орчуулгыг нийцүүл.

Шаардлага:
- `grammar.json`: INSTRUCTIONS-д байгаа дүрмүүд (бүгд) L01-ийн бүтцээр; жишээ бүрт zh/pinyin(хөгтэй)/mn; exercises = сурах бичгийн 练一练 + багшийн номын дасгал (хариулттай, монгол тайлбартай); зохиомол дасгал хэрэггүй бол нэмэхгүй.
- `vocabulary.json`: INSTRUCTIONS-ийн үгийн хүснэгтийн бүх мөр яг тэр дарааллаар (+ тусгай нэр байвал ард нь), hskLevel "HSK3", exampleChinese хичээлийн яриа/сурах бичгээс, exampleMongolian орчуулга. Монгол утга 4+ тэмдэгт.
- `quiz.json`: 24 асуулт (12 cloze + 12 multiple_choice), order_index 1–24, id "hsk3-l0N-qNN", skillTags (["vocabulary"] / ["grammar","<цэгийн товч англи нэр>"] / ["reading","text-comprehension"]), difficulty (easy/medium/hard). 8 үгийн сангийн cloze (5 сонголт), 4 дүрмийн cloze, 6 эх бичвэрийн ойлголтын multiple_choice (4 сонголт), 6 дүрмийн multiple_choice. correct_answer = сонголтын текст өөрөө, options давхардалгүй, зөв хариулт янз бүрийн байрлалд. explanation монголоор «яагаад» 1–2 өгүүлбэр. Хятад өгүүлбэр зөв дүрэмтэй, HSK1–3 үгээр.
- `lesson.json`: 2-р хичээлийнхтэй ижил хэлбэр — courseId "hsk3", lessonId "hsk3-l0N", title "HSK3 N-р хичээл — <монгол гарчиг>", chineseTitle/targetTitle, mongolianTitle, subtitle (дүрмүүд товч), description ("4 课文 (яриа) + K шинэ үг + M дүрэм (…) + дасгалын номын 50 дасгал"), duration "40 min", status "available", orderIndex N, icon, sourceNote "HSK Standard Course 3 — Lesson N 《…》".
- `manifest.json`: 2-р хичээлийнхтэй ижил, lessonId/lessonNumber/title/mongolianTitle/source-ийг энэ хичээлийнхээр.
- `README.md`, `QA_REPORT.md` монголоор (2-р хичээлийнхтэй ижил хэлбэр).

Дүрэм: монголоор, найрсаг багшийн хэлээр; пиньинь хөгийн тэмдэгтэй; юу ч зохиохгүй; L01/L02 текст хуулахгүй.

Гаралт: `/home/claude/hsk3build/L0N/zip/`. Python-оор бич, json.load-оор баталгаажуул; quiz: correct_answer ∈ options, давхардалгүй, order_index 1–24, id/skillTags/difficulty бүгдэд байгаа. Тайлан: тоо баримт, эргэлзсэн зүйлс.
