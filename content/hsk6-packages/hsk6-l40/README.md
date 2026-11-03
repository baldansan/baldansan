# HSK6 · 第40课 《人类超能力会改变世界纪录吗》 — «Хүний ер бусын чадвар дэлхийн рекордыг өөрчлөх үү?»

«Бөөндөө Сурцгаая» апп-ын HSK6 40-р хичээлийн пакет (`BUUNDUU_CHINESE_HSK_PACKAGE_V1`, lessonId `hsk6-l40`, profile `hsk6-advanced-reading-output-summary`).
Эх сурвалж: HSK Standard Course 6B — сурах бичиг, дасгалын ном (第40课); бүрэн шалгагдсан `hsk6-l40.json`. Багшийн ном байхгүй.

## Энэ ажлаар бичсэн 7 файл

| Файл | Юу байгаа вэ |
|---|---|
| `manifest.json` | Пакетын мета: courseId `hsk6`, lessonId `hsk6-l40`, hskLevel 6, lessonNumber 40, `hasAudio: false`, `hasImages: false`, баталгаажуулалтын төлөв |
| `lesson.json` | Хичээлийн карт (orderIndex 40, дүрс 👨‍👩‍👧, 60 min) + `hook` (Тэмээ багшийн оршил), `exercises_textbook` (8 хэсэг, 37 дасгал), `collocations` (16), `recap` |
| `vocabulary.json` | 课文-ийн 51 шинэ үг, дарааллаар; `pos`, `collocations_zh`, жишээ нь 课文-ийн өгүүлбэр; ✱ тэмдэгтэй 1 үг (猝死) `tag: "超纲"` |
| `grammar.json` | 4 цэг: （把）……放在眼里 · 不无 · 顽强——坚强 · 篇章（9）先总说，再分说; `register` талбартай; жишээ [5, 5, 8, 5], дасгал [4, 4, 5, 4], түгээмэл алдаа [3, 3, 3, 2] |
| `quiz.json` | 35 асуулт: 14 cloze (10 үг + 4 дүрэм, 5 сонголт) + 21 multiple_choice (9 ойлголт, 6 дүрэм/语体, 6 搭配/синоним) |
| `README.md`, `QA_REPORT.md` | Энэ тайлбар ба чанарын тайлан |

Бусад файлыг (`texts.json`, `workbook.json`, `media.json`) өөр ажлаар бичнэ. `characters.json` HSK6-д ХЭРЭГГҮЙ. Аудио, зураг байхгүй.

## Үйлдвэрлэл

- Скрипт: `/home/claude/hsk6build/L40/build_grammar.py` (`python3 -I build_grammar.py`).
- Агуулга ба туслах файлууд: `/home/claude/hsk6build/L40/gparts/` (`grammar_data.py`, `vocab_data.py`, `quiz_lesson_data.py`, `pyin.py`, `validate.py`, `lines_mn.json`).
- 课文-ийн 33 өгүүлбэрийн монгол орчуулга: `tparts/zh_mn_registry.json`-оос авсан (`gparts/lines_mn.json`). Үгийн жишээ, дүрмийн жишээ дэх 课文 өгүүлбэр бүр texts.json-той ИЖИЛ орчуулгатай.

## Импортлох

1. Энэ хавтасны JSON-уудыг (texts.json, workbook.json-тай хамт) нэг zip болгоно.
2. Админ самбарын **`/admin/import/chinese`** хуудсаар zip-ээ оруулна.
3. Импортын дараа HSK6 курсийн жагсаалтад 40-р хичээл гарч ирснийг, дүрмийн дасгал, шалгалт ажиллаж байгааг шалгана.

Юуг эх сурвалжтай шалгасан, юу нь загвар хариулт вэ гэдгийг `QA_REPORT.md`-с харна уу.
