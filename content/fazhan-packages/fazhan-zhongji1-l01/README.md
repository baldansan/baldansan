# fazhan-zhongji1-l01 — 发展汉语（第二版）中级综合 I · 第1课《北京的四季》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»). Supabase-д байгаа хуучин `fazhan-zhongji1-l01` нооргийг энэ багцаар ДАХИН импортолно (ижил lessonId).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l01`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 42 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文/PPT-ээс), 13 гол үг `keyWord:true` |
| `texts.json` | `mainText` 11 догол мөр 26 өгүүлбэр (tokens үгээр, 54% note+key_structures, paragraph_summaries, reflection, writingSample «家乡的四季» 110 ханз + writingPrompt); `wordExplanation` 7 (教案-ийн 重点词语: 度过/渡过, 熟悉, 纷纷, 争着, 看+疑问词, 多么…啊, 属于, 透, 来不及, 可-); `collocations` 5 бүлэг; `wordComparison` 4; `textExercises` (PPT 填空 9, 课文理解 23 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture`; `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: structure / teacher_mn / teacher_notes / examples 4–5 / common_mistakes / check / exercises 2–3 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 36: 选词填空 12 · 用法选择 10 · 课文理解 10 · 排序 4, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (21, хариулттай) + 综合练习 一–九: 一 (联合式构词 ангилал + 填空), 二 选词, 三 改写, 四 完成句子, 五 完成对话, 六 хүснэгт (PPT 22), 七 《故乡的味道》填空 + 回答, 八 表达, 九 写作 — хариулт бүр 参考答案 + тайлбар |
| `subtitles.json` | 课文-ийн 26 өгүүлбэрийн start/end (faster-whisper + текст тулгалт) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 9 зураг (西山 hero, 北海, 牡丹, 芍药, 蝉, 红墙绿瓦, 枣, 心儿里美, 林海音) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-01-words.mp3` (生词, 48kbps mono), `fazhan-zhongji1-01-text.mp3` (课文, 5:00) |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.md` (PDF х. 15–27, хуудсыг зургаар уншсан), `teacher/zhongji-zonghe-1/l01.md`, `courseware/zhongji-zonghe-1/l01.md`, `workbook/zhongji-zonghe-1-answers.md`. Build: `content/fazhan-packages/fazhan-zhongji1-l01/_build/` (vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).
