# fazhan-zhongji1-l15 — 发展汉语（第二版）中级综合 I · 第15课《绿色屋顶》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»). Энэ бол номын СҮҮЛИЙН (15 дахь) хичээл.

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l15`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 52 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文/教案-ээс), 16 гол үг `keyWord:true` |
| `texts.json` | `mainText` 13 догол мөр 33 өгүүлбэр (tokens үгээр, 19/33 ≈ 58% note+key_structures, paragraph_summaries, reflection, writingSample «绿色的梦想» 150+ ханз + writingPrompt); `wordExplanation` 6 (教案-ийн 重点词语: 体验/实现/乐趣/显得/周到/以至于-以致); `collocations` 4 бүлэг; `wordComparison` 4; `textExercises` (填空 4, 课文理解 22 асуулт-хариулт, 复述 3 загвар) |
| `grammar.json` | 综合注释 5 дүрэм: A是A/B是B, ……不说还……, 连……带……, 以至于, 一方面……（另）一方面…… — structure / teacher_mn / teacher_notes / examples 4 / common_mistakes 2 / check / exercises 3 (choice/judge + тайлбар) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 34: 选词填空 12 · 用法选择 12 · 课文理解 6 · 排序 4, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (19, хариулттай) + 综合练习 一–十一: 一 填空(化), 二 连线(药), 三 多音字组词, 四 拼音写字填空, 五 选词填空, 六 补词(课文复述), 七 完成句子, 八 完成对话, 九 清新采访对话, 十 阅读《办公桌上结出了草莓》填判断+回答, 十一 写作«绿色的梦想» — хариулт бүр 参考答案 + тайлбар |
| `subtitles.json` | 课文-ийн 33 өгүүлбэрийн start/end (faster-whisper + текст тулгалт, 0% interpolated) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 9 зураг (屋顶农场 hero, 田野, 乡下, 水泥, 肥料, 苗, 化肥, 农药, 农场) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-15-words.mp3` (生词), `fazhan-zhongji1-15-text.mp3` (课文); `audio/words/w01..w52.mp3` — үг бүрийн тусдаа дуу (0% interpolated) |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.md` (PDF х. 179–192, хуудсыг зургаар уншсан), `teacher/zhongji-zonghe-1/l15.md`, `courseware/zhongji-zonghe-1/l15.md`, `workbook/zhongji-zonghe-1-answers.md` (х. 24–26). Build: `content/fazhan-packages/fazhan-zhongji1-l15/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).

## Тэмдэглэл
- Энэ хичээлээр 《发展汉语（第二版）中级综合 I》ном бүрэн дуусав (15/15 хичээл).
- Эх бичвэрийн зохиогч 王新同, эх сурвалж 《新青年》 сэтгүүл.
