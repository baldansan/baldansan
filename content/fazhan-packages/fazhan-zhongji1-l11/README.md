# fazhan-zhongji1-l11 — 发展汉语（第二版）中级综合 I · 第11课《"SOHO"一族的快乐与烦恼》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l11`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 49 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文-аас), 24 гол үг `keyWord:true` |
| `texts.json` | `mainText` 15 догол мөр 40 өгүүлбэр (tokens үгээр), note+key_structures (эхний болон дүрмийн холбоотой өгүүлбэрт), paragraph_summaries, reflection 3, writingSample «网购的快乐与烦恼» 150+ ханз + writingPrompt; `wordExplanation` 8 (教案-ийн 重点词语: 族, 超过, 分享, 如意, 辞, 感受, 难免, 渴望); `collocations` 4 бүлэг; `wordComparison` 4 (描绘—描述, 工资—薪水, 孤独—寂寞, 情景—情境); `textExercises` (PPT 填空 9, 课文理解 27 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture`; `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 与/和A相比，B……; 趁（着）; A跟/和/与B有关; 相反; 动不动 — structure / teacher_mn / teacher_notes / examples 4 / common_mistakes 2 / check / exercises 3 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 34: 选词填空 13 · 用法选择 11 · 课文理解 6 · 排序 4, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–十二: 一 语素"数", 二 语素"单", 三 拼音→汉字填空, 四 选词填空, 五 回忆课文补词, 六 改写句子, 七 完成对话, 八 表格 (SOHO女孩儿的一天), 九 阅读判断+问答 (十年内在家办公是否流行), 十/十一/十二 — нээлттэй (情境表演/写一写/拓展学习) |
| `subtitles.json` | 课文-ийн 40 өгүүлбэрийн start/end (faster-whisper + текст тулгалт, 40/40, interpolated 0) |
| `images/` | Сурах бичиг + PPT-ээс 5 зураг: `soho-home-office.jpg` (hero — сурах бичгийн «坐家» зураг), `keyboard.jpg`, `pao-rose-bath.jpg` (泡), `gudu-lonely.jpg` (孤独), `terracotta-army.jpg` (代名词 — 秦陵兵马俑) |
| `audio/` | Албан mp3: `fazhan-zhongji1-11-words.mp3` (生词), `fazhan-zhongji1-11-text.mp3` (课文) |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.pdf` (PDF х. 142–156, хуудсыг зургаар уншсан), `teacher/zhongji-zonghe-1/l11.md`, `courseware/zhongji-zonghe-1/l11.md`, `workbook/zhongji-zonghe-1-answers.md` (х.18–19). Build: `content/fazhan-packages/fazhan-zhongji1-l11/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).
