# fazhan-zhongji1-l02 — 发展汉语（第二版）中级综合 I · 第2课《租房只要一个条件》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»). lessonId `fazhan-zhongji1-l02`, courseId `fazhan-zhongji1` (L1-тэй ижил бүтэц, ижил схем).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l02`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4), level «发展汉语 中级 I», hook (багшийн оршил + халаалт), thumbnail `images/xiaoqu.jpg` |
| `vocabulary.json` | 33 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文/教案/PPT-ээс), 11 гол үг `keyWord:true` (номонд цэнхэрээр тэмдэглэсэн) |
| `texts.json` | `mainText` 14 догол мөр 28 өгүүлбэр (916 ханз; tokens үгээр, 21/28 note+key_structures, paragraph_summaries 14, reflection 3, writingSample «一次愉快的租房经历» 213 ханз + writingPrompt); `vocabularyAudio` 33; `properNouns` 7; `wordExplanation` 10 (教案 重点词语: 推荐, 周边, 骄傲, 档次, 考虑, 况且, 困惑, 根本 + 注释 没/不怎么, 一一); `collocations` 5 бүлэг 15 мөр; `wordComparison` 4 (从……来看/在……看来, 困惑/困境/困难, 骄傲/自豪/虚心, 能够/能); `textExercises` (PPT 填空 7, 课文理解 16 асуулт-хариулт, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture` (孟母三迁 · 学区房); `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: 想……就……, 从……来看, 再……不过了, 况且, 在……看来 — structure / teacher_mn / teacher_notes / examples 5 / common_mistakes 2 / check / exercises 4 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 36: 选词填空 14 · 用法选择 13 · 课文理解 6 · 排序 3; сонголт hash-аар холисон (зөв хариулт байрлал 9/13/13/1), бүгд тайлбартай |
| `workbook.json` | part 0: 综合注释 试一试 1–5 бүгд (20, хариулттай) + 综合练习 一–十: 一 «特» үгс (5), 二 «房» холбох (7), 三 选词 (8), 四 эх бичвэр нөхөх (9), 五 完成句子 (8), 六 想……就…… яриа (7), 七 хүснэгт (6) + асуулт (3), 八 阅读《请别远离文字》判断 (5) + 回答 (4), 九 зургийн яриа (7, PPT загвар), 十 写作 — хариулт бүр 参考答案 + тайлбар; speaking 2 (练习九) |
| `subtitles.json` | 课文-ийн 28 өгүүлбэрийн start/end (faster-whisper + пиньинь тулгалт, interpolated 0) |
| `images/` | PPT 课件-аас 11 зураг (小区 hero, 农贸市场, 健身房, 美容院, 五星级, 中介, 家具, 推/拉, 逛, 加班, 困惑) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-02-words.mp3` (生词), `fazhan-zhongji1-02-text.mp3` (课文, 6:01); `audio/words/w01..w33.mp3` үг бүрийн клип (албан бичлэгээс хайчилсан, interpolated 0) |

Эх: сурах бичиг PDF х. 28–39 (номын х. 13–24, хуудсыг зургаар уншсан → `_build/source.md`), `docs/fazhan/teacher/zhongji-zonghe-1/l02.md` (教案, 崔娜), `docs/fazhan/courseware/zhongji-zonghe-1/l02.md` (PPT 46 слайд), `docs/fazhan/workbook/zhongji-zonghe-1-answers.md` 第2课 (х. 2–4). Build: `_build/` (meta, vocab, text, grammar, extra, workbook_quiz → `_tools/build.py`).
