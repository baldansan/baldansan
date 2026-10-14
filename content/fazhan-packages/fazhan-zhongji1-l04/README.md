# fazhan-zhongji1-l04 — 发展汉语（第二版）中级综合 I · 第4课《最认真的快递员》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l04`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 35 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ курс/课文-аас), 14 гол үг `keyWord:true` |
| `texts.json` | `mainText` 16 догол мөр 32 өгүүлбэр (tokens үгээр, ~50% note+key_structures, paragraph_summaries, reflection, writingSample «她/他的认真感动了我» 150+ ханз + writingPrompt); `wordExplanation` 7 (教案-ийн 重点词语: 打扮, 恭敬, 推算, 恐怕, 流利, 始终/老, 衣衫/衬衣/西装); `collocations` 4 бүлэг; `wordComparison` 4; `textExercises` (课文填空 7, 课文理解 18 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture`; `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 还没……就……, 非……不可/不行/不成, 没有……不……, 倒, 一……就是…… — structure / teacher_mn / teacher_notes / examples 4–5 / common_mistakes / check / exercises 4 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 32: 选词填空 13 · 用法选择 11 · 课文理解 6 · 排序 2, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–十二: 一 (件-язгуур таах), 二 (олон дуудлагатай ханз), 三 (选词填空), 四 (课文填空 7), 五 (选词填空 5), 六 (组句 5), 七 (对话 6), 八 (课文理解 open 4), 九 (《擦了五年玻璃》判断 6 + 回答 open 4), 十 (表达练习 open), 十一 (写一写 作文), 十二 (走出课堂 快递单 дадлага) — хариулт бүр 参考答案 + тайлбар |
| `subtitles.json` | 课文-ийн 32 өгүүлбэрийн start/end (faster-whisper + текст тулгалт) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 3 зураг (хослол хувцас/арьсан гутал hero, 仪式, 投诉) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-04-words.mp3` (生词), `fazhan-zhongji1-04-text.mp3` (课文) |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.md` (PDF х. 39–50, хуудсыг зургаар уншсан), `teacher/zhongji-zonghe-1/l04.md`, `courseware/zhongji-zonghe-1/l04.md`, `workbook/zhongji-zonghe-1-answers.md` (第4课 хэсэг). Build: `content/fazhan-packages/fazhan-zhongji1-l04/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).
