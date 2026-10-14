# fazhan-zhongji1-l13 — 发展汉语（第二版）中级综合 I · 第13课《人生最重要的三件事》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l13`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 49 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文-ээс), 25 гол үг `keyWord:true` (номын цэнхэр тэмдэглэгээгээр) |
| `texts.json` | `mainText` 15 догол мөр 28 өгүүлбэр (tokens үгээр, 7 өгүүлбэрт note+key_structures, paragraph_summaries, reflection 3, writingSample «我的梦想» 150+ ханз + writingPrompt); `wordExplanation` 8 (教案-ийн 重点词语: 早晚, 曾, 用功, 当初, 投, 回想, 心灰意冷, 真情); `collocations` 4 бүлэг; `wordComparison` 4; `textExercises` (PPT 填空 9, 课文理解 26 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture`; `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 正因为……才……, 算（是）, A比得上/过/了B, 反而, V+起来 — structure / teacher_mn / teacher_notes / examples 4–5 / common_mistakes 2 / check / exercises 3 (choice/judge + тайлбар) |
| `quiz.json` | 31: 选词填空 11 · 用法选择 11 · 课文理解 6 · 排序 3, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–九: 一 (数字成语 холбох + 填空), 二 拼音写字+选词, 三 选词, 四 回忆课文内容 补词 (10), 五 完成句子/对话 (7), 六 根据语境回答 (4), 七 表格 (20年前/20年后 + 2 нээлттэй асуулт), 八 《佛在哪儿》判断对错(7)+问答(2), 九 个人问答 (8, нээлттэй) — хариулт бүр 参考答案/课件 PPT + тайлбар |
| `subtitles.json` | 课文-ийн 28 өгүүлбэрийн start/end (faster-whisper + текст тулгалт) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 3 зураг: 存折 (hadgalamjiin devter, thumbnail), 手术 (мэс засал), 攒钱 (зоос хуримтлуулах) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-13-words.mp3` (生词), `fazhan-zhongji1-13-text.mp3` (课文); `audio/words/w01..w49.mp3` — үг бүрийн тусдаа клип |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.md` (PDF х. 152–164, хуудсыг зургаар уншсан), `teacher/zhongji-zonghe-1/l13.md`, `courseware/zhongji-zonghe-1/l13.md`, `workbook/zhongji-zonghe-1-answers.md`. Build: `_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py, source.md → build.py).

## Онцлог
- Энэ хичээлд зөвхөн 5 дүрэм (综合注释) байдаг (L1-тэй адил тооны дасгал боловч илүү товч — ном өөрөө энэ хичээлд 5 дүрэм л өгсөн, нэмж зохиогоогүй).
- Өгүүллэг нь 18 ба 29/38 настайдаа өгсөн хоёр өөр хариултыг харьцуулсан бүтэцтэй тул `meta.para_mn`, `COMPREHENSION`, 综合练习 七-ийн хүснэгт бүгд энэ 2 цаг үеийн харьцуулалтыг тусгасан.
