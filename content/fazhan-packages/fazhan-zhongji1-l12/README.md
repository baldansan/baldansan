# fazhan-zhongji1-l12 — 发展汉语（第二版）中级综合 I · 第12课《让拇指说话》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l12`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 44 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文-ээс), 15 гол үг (цэнхэр) `keyWord:true` |
| `texts.json` | `mainText` 8 догол мөр 25 өгүүлбэр (tokens үгээр, 11/25=44% note+key_structures), paragraph_summaries, reflection, writingSample «如果没有手机» 230+ ханз + writingPrompt; `wordExplanation` 8 (教案-ийн 重点词语: 一个劲儿, 热衷于, 简称, 乐此不疲, 之类, 从事, 缺乏, 通病); `collocations` 4 бүлэг; `textExercises` (PPT/综合练习三 填空 8, 课文理解 17 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture` (短信拜年 ба 5 уламжлалт баяр); `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 把A称为/称做/叫做B, 原来……现在……, 除了……还是……, （V）什么（N）都V不+C, 说什么都/也…… — structure/teacher_mn/teacher_notes/examples 4–5/common_mistakes 2/check/exercises 3 (choice/judge + тайлбар), 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 32: 选词填空 12 · 用法选择 10 · 课文理解 6 · 排序 4, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–十: 一/二 语素填空 (力/热), 三 拼音写汉字+填空, 四 回忆课文填空, 五 完成句子, 六 完成对话, 七 传统节日习俗配对, 八 回答问题 (开放), 九-1 阅读《手机依赖症》判断正误, 九-2 阅读理解问答, 十 口语/写作准备问题 (开放) — хариулт бүр 参考答案 + тайлбар |
| `subtitles.json` | 课文-ийн 25 өгүүлбэрийн start/end (faster-whisper + текст тулгалт, 25/25 таарсан) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 6 зураг (元宵节 hero, 春节-жилийн бин/бууз, 端午节-луу завин, 中秋节-сарны боов, 清明节-мод тарих) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-12-words.mp3` (生词), `fazhan-zhongji1-12-text.mp3` (课文); `audio/words/w01..w44.mp3` — үг бүрийн тусдаа дуу (44/44, interpolated 0) |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.md` (PDF х. 158–169, хуудсыг зургаар уншсан), `teacher/zhongji-zonghe-1/l12.md`, `courseware/zhongji-zonghe-1/l12.md`, `workbook/zhongji-zonghe-1-answers.md` (第12课, PDF х. 20–21). Build: `content/fazhan-packages/fazhan-zhongji1-l12/_build/` (vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).
