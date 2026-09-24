# HSK3 хичээлийн импортын пакетууд (L02–L20)

`/admin/import/chinese`-д импортлосон FLAT zip-үүдийн JSON/MD хэсэг (аудиогүй — аудио нь
`Ebooks/Hyatad hel/hsk3/hsk3textbookaudios`, `hsk3workbookaudios`-оос `docs/hsk-source/lesson-build/prep.py`-аар
дахин гарна). Zip-ийг дахин угсрах: хавтас дотор `audio/` нэмээд `zip -r ../hsk3-lNN.zip .`, дараа нь
`npx tsx scripts/validate-lesson-zip.mts hsk3-lNN.zip`.

Эх сурвалж: HSK Standard Course 3 сурах бичиг, багшийн ном, дасгалын ном (OCR: `docs/hsk-source/`).
Хичээл бүрийн QA_REPORT.md-д зохиомол/шалгаагүй хэсгүүд (练一练-ийн загвар хариулт, буруу сонголтууд, бичлэгийн жишээ) тэмдэглэгдсэн.
