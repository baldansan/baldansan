# Даалгавар: эх сурвалжийн JSON-д ХАРИУЛТ + СОНСГОЛЫН БИЧВЭР нэмэх (HSK5A / HSK6)

Одоо байгаа `/home/claude/hskbuild/{level}/LNN/source.json` бүрэн зөв, түүнийг ЗӨВХӨН НЭМЖ засна — байгаа зүйлийг устгахгүй,
өөрчлөхгүй (мөр, үг, дасгалын бичвэр бүгд хэвээр). Схем: `/home/claude/repo/types/hsk-source-lesson.ts`.
Зарчим: **номд хэвлэгдсэн хариултыг л, хэвлэгдсэн хэлбэрээр нь.** Таахгүй. Зөрүү/тодорхойгүй бол `unclear[]`-д нэм.

## Шинэ эх сурвалж (хавтас `/home/claude/hskbuild/{level}/LNN/`, `prep.json`-д хуудасны муж)

### HSK5A (L01–L18) — дасгалын номын 录音文本及答案 (BLCUP албан ёсны)
- `src/workbook_script_LNN.txt` — OCR (алдаатай, зөвхөн чиглүүлэг), `img/wbscript_pNN.jpg` — **зургаар унш, зургаар шалга**.
- Бүтэц: 一、听力 第一部分 (1–6: яриа + 问), 第二部分 (7–14: урт яриа/бичвэр + 问 …), дараа нь `参考答案:` 一、听力 1-6: DAB BAC / 7-14: … ; 二、阅读 15-18 …; 三、书写 29–32 бүтэн өгүүлбэр, 32 (略).
- Хийх: `workbook.sections[*].items[*]`-д
  - сонсголын item бүрт `transcript_zh` (яриа бүтнээр: «女：…\n男：…\n问：…»; 7–14-ийн олон асуулттай бичвэрт бичвэрийг item бүрт давтаж, тухайн 问-г төгсгөлд нь),
  - бүх item-д `answer` (үсэг: "D"; 书写-д өгүүлбэр; «（略）» бол answer оруулахгүй, unclear-д тэмдэглэ) + `answer_ref: {book:"workbook_answers", pages:[PDF хуудас]}`.
  - `workbook.answers_ref = {book:"workbook_answers", pages:[a…b]}` (script PDF-ийн хуудсууд).
  - `unclear[]`-д «5A дасгалын номд хариулт байхгүй» гэсэн хуучин тэмдэглэлийг «хариулт BLCUP-ийн 录音文本及答案 (HSK-5A-Workbook-Script-Answers.pdf х.a–b)-аас» болгож ЗАС.

### HSK6 (L01–L40)
1. `src/wbscript_LNN.txt` + `img/wbscript_pNN.png` — дасгалын номын 录音文本 + 参考答案 (PDF текст давхаргатай, найдвартай; зургаар нэг удаа тулга).
   6下-д 21–40 хичээлийн бичвэр `21 未来商店` гэх мэт гарчигтай. L40-ийн муж 模拟考试-г ч агуулж болно — оруулахгүй.
   Хийх: дээрхтэй адил — 听力 1–17 `transcript_zh` (第一部分 1–5 нэг догол бичвэр тус бүр; 第二部分 6–10 нэг 采访, item бүрт давт;
   第三部分 11–13, 14–17 бичвэр тус бүр), бүх item `answer` + `answer_ref {book:"workbook_answers", pages}`; 书写 37 (缩写) хариулт байвал оруул, «略» бол унclear.
2. `src/tbanswers_LNN.txt` + `img/tbanswers_pNN.png` — **сурах бичгийн** 课本参考答案: 综合注释 N 练一练, 词语辨析 做一做, 练习 1–5, 扩展.
   Хийх: `textbook.grammar[*].practice[*].answer` + `answer_ref {book:"textbook_answers", pages}`, `textbook.exercises[*].items[*].answer` + `answer_ref`.
   Хариултын дугаар (①②③ / (1)(2)(3)) item-ийн `n`-тэй тааруул; 练习 1 (模仿例子写词语) шиг олон үгтэй хариултыг «痛快、愉快、凉快、赶快» гэж нэг мөрөөр.
   Хариулт хэвлэгдээгүй дасгал (复述, 写一写 гэх мэт) — юу ч бүү нэм.
   `unclear[]`-ийн «хариулт хаана ч хэвлэгдээгүй» тэмдэглэлийг «дасгалын номын хариулт/бичвэр BLCUP 录音文本及答案 (HSK6 上/下 Recording Text.pdf х.a–b), сурах бичгийн хариулт 课本参考答案 (HSK6上/下 Answer Textbook.pdf х.a–b)-аас» болгож ЗАС.

`SourceRef.book` төрөл: "textbook" | "teacher" | "workbook" | "workbook_answers" | "textbook_answers" (сүүлийнхийг шинээр нэмсэн).

## Гаралт
Ижил файл `/home/claude/hskbuild/{level}/LNN/source.json` дээр бич (эхлээд `.bak` хуулбар хий).
`python3 /home/claude/hsk3build/validate_source.py <файл>` алдаагүй; сонсголын «transcript_zh байхгүй» WARN АЛГА болсон байх ёстой.
Тайлан: хэдэн item-д answer/transcript орсон, хэдэн зөрүү unclear-д нэмсэн.
