# fazhan-zhongji1-l07 — 发展汉语（第二版）中级综合 I · 第7课《我在中国学"大方"》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l07`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 45 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文-аас), 24 гол үг `keyWord:true` |
| `texts.json` | `mainText` 7 догол мөр 24 өгүүлбэр (tokens үгээр, 45.8% note+key_structures, paragraph_summaries, reflection 3, writingSample «……国人的"大方"和"小气"» 150+ ханз + writingPrompt); `wordExplanation` 7 (教案-ийн 重点词语: 大方, 在乎/面子, 邀请, 说明, 捐, 强, 似乎); `collocations` 1 бүлэг (教案 PPT22 词语搭配 5 мөр); `wordComparison` 3 (因为而/为而, 就算也/即使也, 反正/既然); `textExercises` (综合练习五 填空 4, 课文理解 16 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture` (婚礼 红包, 面子 соёл, 莲子/栗子 早生贵子); `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 4 дүрэм: 反正 / 因为……而……·为……而…… / 就算……，也…… / 要不然 — structure / teacher_mn / teacher_notes / examples 4–5 / common_mistakes 2 / check / exercises 4 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 33: 选词填空 13 · 用法选择 13 · 课文理解 6 · 排序 2, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–4 бүгд (16, хариулттай) + 综合练习 一–十: 一 (加点字 ойлголт), 二 (多音字 11 үг), 三 (拼音→汉字 + 填空 8), 四 (选词填空 4), 五 (课文 填空 3), 六 (改写句子 5), 七 (完成对话 5), 八 (长对话 бүрэн), 九-1 (阅读 T/F 7), 九-2 (阅读 асуулт 4), 十 (нээлттэй 6) — хариулт бүр 参考答案 + тайлбар; 十一 (写作) workbook.writing; 十二 (拓展) META.application-д |
| `subtitles.json` | 课文-ийн 24 өгүүлбэрийн start/end (faster-whisper + текст тулгалт) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 6 зураг (婚礼人物 hero, 迎亲队伍, 花轿, 敬酒 ёслол, 敬烟 ёс, 早生贵子 坚果зураг) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-07-words.mp3` (生词), `fazhan-zhongji1-07-text.mp3` (课文); `audio/words/w01..w45.mp3` — үг бүрийн тусдаа дуу (цоолж авсан) |

Эх: `pdftoppm`-ээр PDF х. 76–86 (pdf pg 92–103)-ийг зургаар уншсан (`source.md`), `teacher/zhongji-zonghe-1/l07.md` (崔娜 教案), `courseware/zhongji-zonghe-1/l07.md` (PPT 48 слайд), `workbook/zhongji-zonghe-1-answers.md` → 第7课 хэсэг (答案本 х.11) + 答案本 PDF х.11 зургаар баталгаажуулсан (duōyīnzì фонтын алдааг засав). Build: `content/fazhan-packages/fazhan-zhongji1-l07/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py → align.py → images.py → validate.py).
