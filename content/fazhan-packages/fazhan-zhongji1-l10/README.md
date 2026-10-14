# fazhan-zhongji1-l10 — 发展汉语（第二版）中级综合 I · 第10课《给咖啡加点儿盐》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l10`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 33 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文-ээс), 12 гол үг `keyWord:true` |
| `texts.json` | `mainText` 9 догол мөр 34 өгүүлбэр (tokens үгээр, 47% note+key_structures, paragraph_summaries, reflection, writingSample «有这样的爱情» 150+ ханз + writingPrompt); `wordExplanation` 8 (教案-ийн 重点词语: 距离, 集中, 引起, 征服, 错过, 勇敢, 频繁, 实话); `collocations` 5 бүлэг; `wordComparison` 4; `textExercises` (选词填空 6, 课文理解 21 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture`; `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 明明 / 出于……，…… / 之所以……，是因为…… / 被/让/叫……给VP / 至于 — structure / teacher_mn / teacher_notes / examples 4 / common_mistakes 2 / check / exercises 3 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 32: 选词填空 12 · 用法选择 10 · 课文理解 6 · 排序 4, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–九: 一 (语素者 填空), 二 多音字组词, 三 拼音写汉字+填空, 四 选词填空, 五 回忆课文填空, 六 造句, 七 完成对话, 八 理解课文问答 (нээлттэй), 九-1 阅读短文判断 (○/×), 九-2 阅读短文回答 (нээлттэй) — хариулт бүр 参考答案 + тайлбар; 十/十一/十二 (表达练习, 写一写, 拓展学习) — `speaking`, `writingSample`, `application` талбаруудад орсон |
| `subtitles.json` | 课文-ийн 34 өгүүлбэрийн start/end (faster-whisper + текст тулгалт, 100% тулгарсан) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 6 зураг (hero = хос/хайр дурлал, 目光, 勇敢/Braveheart, 童话/王子公主, 征服/уулчин, 谎言/Пиноккио) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-10-words.mp3` (生词), `fazhan-zhongji1-10-text.mp3` (课文); `audio/words/w01..w33.mp3` — үг бүрийн тусдаа дуу (whisper цагаар хайчилсан, interpolated 0) |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.md`-ийн хуудсыг (PDF 114–125) зургаар уншсан, `teacher/zhongji-zonghe-1/l10.md` (教案, 崔娜), `courseware/zhongji-zonghe-1/l10.md` (课件 PPT 40 слайд), `workbook/zhongji-zonghe-1-answers.md` (第10课 хэсэг, PDF х. 16–18). Build: `content/fazhan-packages/fazhan-zhongji1-l10/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py → align.py → images.py).
