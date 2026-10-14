# fazhan-zhongji1-l03 — 发展汉语（第二版）中级综合 I · 第3课《我和父亲的"战争"》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»). lessonId `fazhan-zhongji1-l03`, courseId `fazhan-zhongji1` (L1-тэй ижил бүтэц).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l03`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4), level «发展汉语 中级 I», hook (багшийн оршил + халаалт), thumbnail `images/fuqin-nver.jpg` |
| `vocabulary.json` | 45 үг (сурах бичгийн 词语学习 бүгд, номын дарааллаар — ханз/пиньинь/үгийн аймаг/монгол + жишээ 课文/教案-аас), 30 гол үг `keyWord:true` |
| `texts.json` | `mainText` 10 догол мөр 49 өгүүлбэр 933 ханз (tokens үгээр, 36/49 note+key_structures, paragraph_summaries 10, reflection 3, writingSample «我的爸爸妈妈» 206 ханз + writingPrompt); `vocabularyAudio` 45; `properNouns` 4; `wordExplanation` 9 (教案 重点词语: 坚决/坚强, 居然, 摆脱/控制, 做主, 好不容易, 沉默/安静, 故意/特意, 重新, 适合/合适); `collocations` 5 бүлэг 15 мөр; `wordComparison` 6 (综合练习 四-ийн 4 хос + 理由/原因 + 然-үгс); `textExercises` (教案 造句/PPT 填空 14, 课文理解 22 асуулт-хариулт, 复述 3 загвар); `grammarNotes`; `culture` (高考, 填志愿, 职业中学, 父爱如山); `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 说V就V · 直到……为止 · ……，好…… · 再……，就…… · 只不过（是）……而已 — structure / teacher_mn / teacher_notes / examples 5 / common_mistakes 2 / check / exercises 3–4 (choice/judge + тайлбар), 试一试-гийн хариулт 参考答案-аар |
| `quiz.json` | 36: 选词填空 14 · 用法选择 12 · 课文理解 6 · 排序 4, сонголт hash-аар холисон, бүгд тайлбартай (буруу сонголт яагаад буруу) |
| `workbook.json` | part 0: 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–七: 一 然-үгс 6, 二 选词 8, 三 课文填空 8, 四 近义词 8, 五 完成句子 6, 六 回答 4 (нээлттэй, загвар хариулт), 七-1 判断 7, 七-2 回答 4 (нээлттэй); 八 表达 2 → speaking; 九 写作 → writing — хариулт бүр 参考答案 + тайлбар |
| `subtitles.json` | 课文-ийн 49 өгүүлбэрийн start/end (whisper ASR + пиньинь NW тулгалт, interpolated 0) |
| `images/` | PPT 课件-аас 10 зураг (hero: 父亲和女儿; 父爱, 职业中学, 宣布, 胜利, 心疼, 哭闹, 高考, 悄悄, 一帆风顺) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-03-words.mp3` (生词), `fazhan-zhongji1-03-text.mp3` (课文 6:25); `audio/words/w01..w45.mp3` — үг бүрийн клип (albан 生词 бичлэгээс хайчилсан, interpolated 0) |

Эх: сурах бичиг PDF х. 41–51 (номын х. 26–36; index.json-ийн 44–53 биш — 3 хуудсаар эрт эхэлдэг), хуудсыг зургаар уншсан; `docs/fazhan/teacher/zhongji-zonghe-1/l03.md` (教案 崔娜), `courseware/zhongji-zonghe-1/l03.md` (PPT 40 слайд), `workbook/zhongji-zonghe-1-answers.md` 第3课 (х. 5–6). Build: `_build/` (meta, vocab, text, grammar, extra, workbook_quiz .py → `_tools/build.py`).
