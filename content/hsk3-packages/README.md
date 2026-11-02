# HSK3 хичээлийн импортын пакетууд (L01–L20)

**L01 (2026-11-03, шинэ стандарт):** `hsk3-l01/` — `content/hsk-source/hsk3/hsk3-l01.json`-оос бүтээсэн; characters.json (指事字 intro + 辨认 quiz), media.json (14 зураг: 热身 tap-to-reveal + 描述图片), яриа бүрийн асуулт (`exercises`), lesson.json-д hook/exercises_textbook/collocations/recap, 俗语 карт. Заавар: `docs/hsk-source/lesson-build/HSK3-L01-INSTRUCTIONS.md`. L02–L20-г мөн энэ стандартаар дахин бүтээнэ (`claude/HSK3-REDO-HSK6-PLAN-2026-11-03.md`).


`/admin/import/chinese`-д импортлосон FLAT zip-үүдийн JSON/MD хэсэг (аудиогүй — аудио нь
`Ebooks/Hyatad hel/hsk3/hsk3textbookaudios`, `hsk3workbookaudios`-оос `docs/hsk-source/lesson-build/prep.py`-аар
дахин гарна). Zip-ийг дахин угсрах: хавтас дотор `audio/` нэмээд `zip -r ../hsk3-lNN.zip .`, дараа нь
`npx tsx scripts/validate-lesson-zip.mts hsk3-lNN.zip`.

Эх сурвалж: HSK Standard Course 3 сурах бичиг, багшийн ном, дасгалын ном (OCR: `docs/hsk-source/`).
Хичээл бүрийн QA_REPORT.md-д зохиомол/шалгаагүй хэсгүүд (练一练-ийн загвар хариулт, буруу сонголтууд, бичлэгийн жишээ) тэмдэглэгдсэн.
