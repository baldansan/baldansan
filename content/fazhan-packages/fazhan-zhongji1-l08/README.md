# fazhan-zhongji1-l08 — 发展汉语（第二版）中级综合 I · 第8课《天使之笔》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l08`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 49 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文/PPT-ээс), 24 гол үг `keyWord:true` |
| `texts.json` | `mainText` 6 догол мөр 34 өгүүлбэр (tokens үгээр, 16/34 ≈47% note+key_structures, paragraph_summaries, reflection, writingSample «我和汉语的故事» 220+ ханз + writingPrompt); `wordExplanation` 7 (教案-ийн 重点词语: 吸引, 关注, 忍不住, 掌握, 比喻, 随便, 反复); `collocations` 3 бүлэг (表, 失, 研究/开设); `wordComparison` 3 (以为—认为, 忍不住—受不了, 立即—马上); `textExercises` (综合练习五 填空 7, 课文理解 24 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture` (兴趣是最好的老师); `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 要么……，要么……; 何必……（呢）; 简直; 怪不得……，（原来）……; 差（一）点儿 — structure / teacher_mn / teacher_notes / examples 4 / common_mistakes 2 / check / exercises 4 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 34: 选词填空 12 · 用法选择 12 · 课文理解 6 · 排序 4, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–十二: 一 表选词, 二 失语素холболт, 三 拼音写汉字+填空 (8), 四 选词, 五 回忆课文填空 (7), 六 改写句子 (要么/何必/一面/怪不得), 七 组词成句, 八 语境完成句子, 九 课文理解选择 (多选含), 十 阅读短文《兴趣是最好的老师》填空(9)+问答(5), 十一 作文 (нээлттэй), 十二 采访拓展学习 (нээлттэй) — хариулт бүр 参考答案 + тайлбар |
| `subtitles.json` | 课文-ийн 34 өгүүлбэрийн start/end (whisper + Needleman-Wunsch текст тулгалт) — **0 interpolated**, бүгд ASR-тэй шууд тулгарсан |
| `images/` | PPT-ээс 4 зураг (庞德 hero — жинхэнэ гэрэл зураг, 传说/魔鬼 — Чанъэ, 迷宫, 比喻 «孩子们是明天的太阳» зурагт тайлбар) — зарим слайдын зураг чанар муу тул зөвхөн 4 ашигласан |
| `audio/` | Албан mp3: `fazhan-zhongji1-08-words.mp3` (生词), `fazhan-zhongji1-08-text.mp3` (课文); `audio/words/w01..w49.mp3` — үг бүрийн тусдаа дуу (**49/49, 0 interpolated** — ASR-тэй бүгд шууд тохирсон) |

Эх: `docs/fazhan/textbooks` (PDF х. 87–99, pdftoppm-ээр зураг болгож нэг нэгээр нь уншсан — OCR биш), `docs/fazhan/teacher/zhongji-zonghe-1/l08.md`, `docs/fazhan/courseware/zhongji-zonghe-1/l08.md`, `docs/fazhan/workbook/zhongji-zonghe-1-answers.md` (第8课 хэсэг). Build: `content/fazhan-packages/fazhan-zhongji1-l08/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).
