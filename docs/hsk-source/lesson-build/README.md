# HSK хичээлийн импортын пакет бэлтгэх дамжлага (HSK3 L02 дээр туршсан)

HSK3 2-р хичээлийг эх сурвалжаас (OCR текст + аудио) `/admin/import/chinese`-д
шууд импортлогдох FLAT zip болгож бэлтгэсэн арга. HSK3 L03–L20, HSK5B, HSK6-д
мөн ингэж хийнэ.

## 1. Эх сурвалж

| Юу | Хаанаас |
|---|---|
| Сурах бичгийн хичээлийн текст | `docs/hsk-source/textbooks/HSK-N-Textbook.md` → `## 第N课` хэсэг (`.index.json` дотор PDF хуудсын муж) |
| Багшийн ном (заах алхам, дүрмийн задлан, нэмэлт жишээ, түгээмэл алдаа) | `docs/hsk-source/teacher/HSK-N-Teacher.md` → `## 第N课`; дасгалын номын сонсголын бичвэр + хариулт → `## Хавсралт · 第N课` (HSK1–4) |
| Дасгалын ном (50 асуулт) | `docs/hsk-source/workbook/…` (OCR дуусахаар) — эсвэл PDF-ээс хичээлийн 7 хуудсыг шууд OCR |
| Хуудсын зураг (OCR эвдэрсэн газрыг шалгах) | `pdftoppm -f P -l P -r 130 -png -singlefile book.pdf img/name_pP` → агентад Read-ээр харуулна |
| Аудио | Сурах бичиг: `hskNtextbookaudios/lesson-NN/hskN-textbook-NNMM.mp3` (яриа тус бүр + сүүлийнх нь 朗读). Дасгалын ном: `hskN-workbook-NN.mp3` — 4 хэсэгт хуваана |

OCR-ийн пиньинь хөгийн тэмдэггүй — агент дахин бичнэ; ханз найдвартай, гэхдээ
шинэ үгийн хүснэгт багана хольж уншигддаг тул зургаар шалгах ЗААВАЛ
(L02-т 8-р үг 秘书 байсныг OCR-оос 办 гэж андуурсан).

## 2. Дасгалын номын аудиог хэсэглэх

`ffmpeg -af silencedetect=noise=-35dB:d=4` — асуултын хоорондын завсрын урт
хэсгээрээ өөр (Part 1 ≈ 5.5 с, Part 2 ≈ 8.7 с, Part 3–4 ≈ 12.4 с). Part 1, 3, 4
= жишээ + 5 асуулт = 6 завсар; Part 2 = 2 жишээ (√/×) + 5 = 7 завсар. Хэсгийн
эхлэлийг faster-whisper (small)-аар 12 с сонсоод «第二部分…» гэж баталгаажуул.
Дараа нь `ffmpeg -ss A -to B -ac 1 -b:a 48k` → `audio/hskN-workbook-NN-part{1..4}.mp3`.
Сурах бичгийн клипүүдийг ч 48 kbps mono болго.

## 3. Пакетын файлууд (FLAT)

`manifest.json`, `lesson.json`, `vocabulary.json`, `texts.json`, `grammar.json`,
`workbook.json`, `quiz.json`, `README.md`, `QA_REPORT.md`, `audio/*.mp3`.
Бүтэц = production-д байгаа `hsk3-l01`-ийн `source_note.hskStudyContent`
(texts / grammar / workbook / vocabularyNotes) — REST-ээр татаж `ref/` болгож
агентад загвар болгон өгнө. Заавар: `HSK3-L02-INSTRUCTIONS.md` (баримт, дүрэм,
хориглосон зүйл). Ажлыг 3 агентад хуваасан: texts.json / grammar+vocabulary+quiz+lesson+manifest / workbook.json.

quiz.json мөр: `id`, `type` (cloze|multiple_choice), `question`, `options`,
`correct_answer` (сонголтын текст), `explanation` (монгол), `order_index`,
`skillTags`, `difficulty` — сүүлийн гурав байхгүй бол импорт warning өгнө.

## 4. Шалгах

```
cd zip && zip -qr ../hskN-lNN.zip . -x '.*'
npx tsx scripts/validate-lesson-zip.mts ../hskN-lNN.zip   # errors: [] байх ёстой
```
Нэмж: яриа бүрийн tokens нийлбэр = zh; сонсгол/уншлагын answer үсгүүд
хавсралтын хариулттай тэнцүү; пиньинь бүрт хөгийн тэмдэг байгаа; монгол
талбарт латин үсэг (OCR хог) байхгүй.

## 5. Импорт

`/admin/import/chinese` → zip → preview (20 үг, 24 сорил, 9 аудио) → импорт.
Хичээл `draft` төлөвтэй орно — хараад `available`/`published` болго.

## 6. Автоматжуулсан дамжлага (L03–L05-д ашигласан)

1. `prep.py N` — сурах бичиг/багшийн ном/хавсралтын текстийг корпусоос тасалж, дасгалын номын хуудсыг OCR хийж, зургуудыг гаргаж, аудиог хувааж (`L0N/prep.json`-д тайлан) бэлтгэнэ.
2. `FACTSHEET-TASK.md` → 1 агент (opus) зургуудыг харж `INSTRUCTIONS-L0N.md` баримтын хуудас бичнэ (үг, яриа, дүрэм, дасгалын хариулт).
3. `AGENT-TEXTS.md` + `AGENT-GRAMMAR.md` (зэрэг) → дараа `AGENT-WORKBOOK.md` (texts.json-оос хөрвүүлж, vocabulary орчуулгыг нийцүүлнэ).
4. `check.py N` (нийцлийн шалгалт) → zip → `npx tsx scripts/validate-lesson-zip.mts`.
Хичээл бүрт ~1 цаг, ~1.2M агентын токен.
