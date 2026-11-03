# HSK6 · 第36课 《中国古代书院》 — «Эртний Хятадын шуюань»

«Бөөндөө Сурцгаая» апп-ын HSK6 36-р хичээлийн пакет (`BUUNDUU_CHINESE_HSK_PACKAGE_V1`, lessonId `hsk6-l36`, profile `hsk6-advanced-reading-output-summary`).
Эх сурвалж: HSK Standard Course 6B — сурах бичиг, дасгалын ном (第36课); бүрэн шалгагдсан `hsk6-l36.json`. Багшийн ном байхгүй.

## Энэ хавтсанд байгаа файлууд (энэ ажлаар бичсэн 7)

| Файл | Юу байгаа вэ |
|---|---|
| `manifest.json` | Пакетын мета: courseId `hsk6`, lessonId `hsk6-l36`, hskLevel 6, lessonNumber 36, `hasAudio: false`, `hasImages: false`, баталгаажуулалтын төлөв |
| `lesson.json` | Хичээлийн карт (orderIndex 36, дүрс 👨‍👩‍👧, 60 min) + `hook` (Тэмээ багшийн оршил), `exercises_textbook` (9 хэсэг, 49 дасгал), `collocations` (17), `recap` |
| `vocabulary.json` | 课文-ийн 50 шинэ үг, дарааллаар; `pos`, `collocations_zh`, жишээ нь 课文-ийн өгүүлбэр; ✱ тэмдэгтэй үг байхгүй тул `tag: "超纲"` үг 0 |
| `grammar.json` | 4 дүрэм: 一经 · 本着＋名词 · 截止——终止 · 篇章（7）论点＋例证; `register` талбартай; жишээ [5, 5, 7, 5], дасгал [5, 5, 6, 5], түгээмэл алдаа [2, 2, 2, 2] |
| `quiz.json` | 35 асуулт: 14 cloze (10 үг + 4 дүрэм, 5 сонголт) + 21 multiple_choice (9 ойлголт, 6 дүрэм, 6 搭配/语素) |
| `README.md`, `QA_REPORT.md` | Энэ тайлбар ба чанарын тайлан |

Бусад файлыг (`texts.json`, `workbook.json`, `media.json`) өөр ажлаар бичнэ. `characters.json` HSK6-д ХЭРЭГГҮЙ. Аудио, зураг байхгүй.

## Импортлох

1. Энэ хавтасны JSON-уудыг (texts.json, workbook.json-тай хамт) нэг zip болгоно.
2. Админ самбарын **`/admin/import/chinese`** хуудсаар zip-ээ оруулна.
3. Импортын дараа HSK6 курсийн жагсаалтад 36-р хичээл «Эртний Хятадын шуюань» гарч ирснийг, дүрмийн дасгал, шалгалт ажиллаж байгааг шалгана.

## Дахин бүтээх

`python3 -I /home/claude/hsk6build/L36/build_grammar.py` — 课文-ийн өгүүлбэрийн монгол орчуулгыг `tparts/zh_mn_registry.json`-оос уншина, тиймээс registry өөрчлөгдвөл энэ скриптийг дахин ажиллуулахад бүх файл шинэчлэгдэнэ. Туслах файлууд `gparts/` дотор.

Юуг эх сурвалжтай шалгасан, юу нь загвар хариулт вэ гэдгийг `QA_REPORT.md`-с харна уу.
