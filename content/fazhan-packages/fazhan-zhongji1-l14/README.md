# fazhan-zhongji1-l14 — 发展汉语（第二版）中级综合 I · 第14课《梦里有你》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»). Ижил `lessonId` (`fazhan-zhongji1-l14`)-ээр ноорог импортлоно.

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l14`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 36 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ, ихэнхдээ 课文-аас), 20 гол үг `keyWord:true` |
| `texts.json` | `mainText` 32 自然段 (教案-ийн хичээлийн хуваарьтай 1:1 тохирсон), tokens үгээр, 13/32 (≈40%) өгүүлбэрт note+key_structures, paragraph_summaries, reflection, writingSample «我的好兄弟/姐妹» (~230 ханз) + writingPrompt; `wordExplanation` 7 (房奴, 白领, 有出息, 没什么两样, 白(副词), 没准儿, 起码); `collocations` 4 бүлэг; `wordComparison` 2 (偏偏⇄可是/却, 没准儿⇄可能); `textExercises` (语素'发'填空 6, 课文理解 25 асуулт-хариулт, 复习 2 загвар PPT-ээс); `grammarNotes` (= grammar.json); `culture`; `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 还……呢能……就不错了, 疑问词давталт(谁谁谁), 偏偏, （没/不）……才怪呢, 尽管 — structure/teacher_mn/teacher_notes/examples 4/common_mistakes 2/check/exercises 4 (choice/judge, 参考答案-аар) |
| `quiz.json` | 32: 选词填空 12 · 用法选择 11 · 课文理解 6 · 排序 3, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 бүгд 20 (хариулттай) + 综合练习 一–十一 (12 хэсэг): 一(发+үг填空) 二(下/上 харьцуулалт) 三(拼音写汉字) 四(选词) 五(课文复述填空) 六(完成句子) 七(完成对话) 八(课文理解, нээлттэй) 九(阅读理解 对错 7 + 问答 3) 十(хосоор ярилцах, нээлттэй) — хариулт бүр 参考答案 эсвэл эх бичвэрт тулгуурлан нэмсэн |
| `subtitles.json` | 课文-ийн 32 өгүүлбэрийн start/end (faster-whisper + текст тулгалт, 100% тулгарсан, interpolate 0) |
| `images/` | PPT-ээс 6 зураг (兄弟 hero, 升职, 戒烟, 气派, 摆地摊儿/买卖, 干儿儿(鱼干儿)) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-14-words.mp3` (生词), `fazhan-zhongji1-14-text.mp3` (课文); `audio/words/w01..w36.mp3` — үг бүрийн тусдаа клип (whisper цагаар хайчилсан, interpolate 0) |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.md` (PDF х.182–194 = ном х.165–177, хуудсыг зургаар уншсан), `teacher/zhongji-zonghe-1/l14.md`, `courseware/zhongji-zonghe-1/l14.md` (39 слайд), `workbook/zhongji-zonghe-1-answers.md` (第14课, PDF х.23). Build: `content/fazhan-packages/fazhan-zhongji1-l14/_build/` (meta/vocab/text/grammar/extra/workbook_quiz.py → build.py).
