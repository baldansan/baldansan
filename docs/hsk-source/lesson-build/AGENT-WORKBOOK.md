Чи «Бөөндөө Сурцгаая» апп-ын HSK3 N-р хичээлийн `workbook.json` файлыг бичнэ.

1. `/home/claude/hsk3build/INSTRUCTIONS-L0N.md`-г унш (дасгалын номын хэсэг, аудио нэрс, хариултууд).
2. Загвар: `/home/claude/hsk3build/ref/l01_workbook.json` + 2-р хичээлийн бэлэн `/home/claude/hsk3build/zip/workbook.json`. Бүтэц яг ижил: {listening:{audio_available, parts:[{part,type,instruction_mn,items:[{n,options,answer,question_zh,transcript_zh,audio}],audio}], audio_note_mn}, reading:{parts}, writing:{items}, review:{items}, answerSource}. Хэсэг бүрийн item хэлбэр L01/L02-той адил (对/错 → A/B, L02 шиг).
3. Агуулгын үндсэн эх: бэлэн болсон `/home/claude/hsk3build/L0N/zip/texts.json`-ийн `workbookListening/Reading/Writing/Review` хэсгүүд (байхгүй бол `L0N/src/workbook_L0N.txt` + `L0N/src/teacher_appendix_L0N.txt`-ээс өөрөө бич). Эх сурвалжтай дахин тулга: `L0N/img/workbook_p*.png`, `L0N/img/teacher_p1*.png`. Хариултууд INSTRUCTIONS-д; зөрүү олдвол зургаар шийд, тайланд бич.
4. Аудио: part бүрийн `audio` = "audio/hsk3-workbook-0N-partK.mp3" (харьцангуй зам, http БИШ), item бүрийн `audio` мөн адил; `audio_available: true`; `answerSource`: "HSK Standard Course 3 练习册 参考答案 + 听力文本 — 教师用书 第N课 хавсралт".

Гаралт: `/home/claude/hsk3build/L0N/zip/workbook.json`. Python скриптээр бич, json.load-оор баталгаажуул: listening 4×5=20, reading 15, writing 15 (эсвэл номд байгаа тоо), review 2; answer ∈ options; L02-той хэсэг бүрийн item түлхүүрүүд ижил. Тайлан: тоо, зөрүү, эргэлзсэн зүйлс.
