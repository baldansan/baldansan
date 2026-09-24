# Даалгавар: HSK{LEVEL} хичээл N-ийн ЭХ СУРВАЛЖИЙН JSON

Үндсэн дүрэм, бүтэц: `/home/claude/hsk3build/SOURCE-TASK.md`-г бүтнээр унш (тэнд HSK3-ын замууд байгаа — энэ түвшинд
доорх замуудыг ашигла), дараа нь `/home/claude/repo/types/hsk-source-lesson.ts`. Бэлэн жишээ (HSK3): `/home/claude/hsk3build/L02/source.json`.

## Энэ түвшний эх сурвалж: `/home/claude/hskbuild/{level}/L0N/`
- `prep.json` — PDF хуудсын мужууд, PDF файлын замууд (`pdf.textbook/teacher/workbook`).
- `src/textbook_L0N.txt`, `src/teacher_L0N.txt`, `src/teacher_appendix_L0N.txt` (байвал — дасгалын номын сонсголын бичвэр/хариулт),
  `src/workbook_L0N.txt`, `src/workbook_answers_L0N.txt` (HSK1 — тусдаа хариултын ном), `src/workbook_appendix_L0N.txt` (HSK5B).
- `img/textbook_pNN.png`, `img/teacher_pNN.png`, `img/workbook_pNN.png`, `img/answers_pNN.png` — зураг бүрийг Read-ээр хар;
  жижиг бол `pdftoppm -f P -l P -r 220 -png -singlefile "<pdf>" out` гээд томруул (PDF зам prep.json-д).

## Түвшний онцлог
- **HSK1–2:** хичээлд 语音 (пиньинь, хөг, дуудлагын дасгал) хэсэг бий → `textbook.pronunciation[]` (rows номд байгаагаар: "b p m f", "bā bá bǎ bà"…).
  汉字 хэсэг өргөн (笔画, 笔顺, 独体字) → `textbook.characters` (`knowledge_zh`, `characters[]`, зурлагыг текстээр бичих боломжгүй бол `unclear`-д).
  Дасгалын номын хариулт HSK1-д тусдаа номд (`workbook_answers`), HSK2-т багшийн номын хавсралтад.
- **HSK4:** 课文 5 (яриа 3–4 + 短文), 注释 4–5, дасгал олон. 4B хичээл 11–20.
- **HSK5:** 课文 1 урт бичвэр + 生词 30–40, 注释 3–5, 扩展 (үгийн ялгаа), багшийн номд хавсралтгүй; 5B дасгалын номын хариулт `workbook_appendix`. 5B хичээл 19–36.
- **HSK6:** багшийн ном БАЙХГҮЙ → `teacher` талбар орхи. 6B хичээл 21–40.
- Аудио файлын нэр мэдэгдэхгүй бол `audio` талбар орхи.

## Схемийн нэмэлт талбарууд (HSK1–2-д хэрэгтэй)
- `texts[].english_version` — 课文-ийн English Version бүтнээр.
- `textbook.classroom_expressions[]` — 课堂用语 {zh, pinyin, en}.
- Дасгалын номын item-д `pinyin` талбар — ханзын дээрх пиньинь; `zh`-д зөвхөн ханз.
- 注释 байхгүй хичээлд (HSK1 L1–2) `grammar`-т 语音-ийн дүрмийг оруулж болно (validator шаарддаг).

## Гаралт
`/home/claude/hskbuild/{level}/L0N/source.json` → `python3 /home/claude/hsk3build/validate_source.py /home/claude/hskbuild/{level}/L0N/source.json` алдаагүй.
`level` талбар = "{level}", `book` = prep.json-ийн `book`, `lesson` = N.
