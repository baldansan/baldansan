# fazhan-zhongji1-l09 — 发展汉语（第二版）中级综合 I · 第9课《生物钟》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l09`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 54 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ, бүгд эх бичвэрээс), 21 гол үг `keyWord:true` |
| `texts.json` | `mainText` 9 догол мөр 23 өгүүлбэр (tokens үгээр, 48% note+key_structures, paragraph_summaries, reflection, writingSample «我们的夜生活» 200+ ханз + writingPrompt); `wordExplanation` 6 (教案-ийн 重点词语: 人类/人们/人民, 心理/心里, 证明/表明, 倒 олон дуудлага, 规律/规则, 熬夜/开夜车); `collocations` 3 бүлэг; `wordComparison` 5 (心理-心里, 规律-规则, 证明-证据, 消息-信息, 睡觉-睡眠, бүгд 综合练习 五-ийн сонголтот даалгавраас); `textExercises` (综合练习 六 填空 7, 课文理解 19 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture`; `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 每……就/都…… · 拿A当B · ……为的是…… · 甚至 · 凡是……都…… — structure/teacher_mn/teacher_notes/examples 4/common_mistakes 2/check/exercises 4 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 32: 选词填空 12 · 用法选择 10 · 课文理解 6 · 排序 4, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–十: 一 (性 ангилал), 二 (觉 мэдрэхүй), 三 (олон дуудлагатай ханз), 四 (拼音→汉字), 五 (选词), 六 (эх бичвэр санах填空), 七 (яриа гүйцээх), 八 (хүснэгт), 九 (阅读短文 填空+判断+问答), 十 (ярилцлага) — хариулт бүр 参考答案 + тайлбар |
| `subtitles.json` | 课文-ийн 23 өгүүлбэрийн start/end (faster-whisper + текст тулгалт) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT болон сурах бичгийн зургаас 5: hero (сэрэх дохио), 微生物, 岛, 衰老 (харьцуулалт), 证据 (шүүх) |
| `audio/` | Албан mp3: `fazhan-zhongji1-09-words.mp3` (生词), `fazhan-zhongji1-09-text.mp3` (课文); `audio/words/w01..w54.mp3` — үг бүрийн тусдаа клип |

Эх: PDF «发展汉语 中级综合-01» х. 100–113 (хэвлэмэл), хуудсыг зургаар уншсан (`source.md`); `docs/fazhan/teacher/zhongji-zonghe-1/l09.md` (教案), `docs/fazhan/courseware/zhongji-zonghe-1/l09.md` (课件 PPT, 51 слайд), `docs/fazhan/workbook/zhongji-zonghe-1-answers.md` (第9课 хариулт). Build: `content/fazhan-packages/fazhan-zhongji1-l09/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).

Энэ хичээл нь уран зохиолын өгүүллэг (L1 шиг) биш, харин «环球时报» сонины шинжлэх ухааны мэдлэг түгээх нийтлэл (科普文) бөгөөд 课文理解 нь хажуугийн 19 асуулттай, бүтэц өмнөх хичээлүүдтэй ижил.
