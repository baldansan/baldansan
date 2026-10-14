# fazhan-zhongji1-l06 — 发展汉语（第二版）中级综合 I · 第6课《电梯里的1分27秒》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l06`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 36 үг (сурах бичгийн 词语学习 1–36 — ханз/пиньинь/үгийн төрөл/монгол + жишээ 课文-ээс), 15 гол үг `keyWord:true` (教案-ийн 重点词语: 令, 打交道, 尤其, 包围, 具体, 调查, 支支吾吾, 优先, 身影, 宁可, 遭遇, 以为, 机灵, 精彩, 鼓励); `properNouns` 4 (李总, 温布尔登网球公开赛, 人民文摘, 谭雪薇) |
| `texts.json` | `mainText` 21 догол мөр 44 өгүүлбэр (tokens үгээр, ~36% note+key_structures, paragraph_summaries, reflection 3, writingSample «难忘的第一次» ~230 ханз + writingPrompt); `wordExplanation` 7 (令, 打交道, 包围, 以为—认为, 机灵—聪明, 遭遇, 鼓励); `collocations` 4 бүлэг (幸, 影, 等候/等待, 打交道/遭遇/包围); `wordComparison` 4 (以为—认为, 机灵—聪明, 等候—等待, 难受—难熬); `textExercises` (PPT 填空 6 — 综合练习六, 课文理解 22 асуулт-хариулт — 综合练习三, 复述 3 загвар); `grammarNotes` (= grammar.json); `culture` (电梯社交); `applicationDiscussionOrWriting` |
| `grammar.json` | 综合注释 5 дүрэм: ……，尤其是……／幸亏／没有比……更/再……的（N）了／宁可/宁愿A，也不B（也要B）／V来V去 — structure / teacher_mn / teacher_notes / examples 4 / common_mistakes 2 / check / exercises 4 (choice/judge, тайлбартай) — 试一试 дасгалууд 参考答案-аар |
| `quiz.json` | 32: 选词填空 12 · 用法选择 10 · 课文理解 6 · 排序 4, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | 综合注释 试一试 1–5 бүгд (SHIYISHI, хариулттай) + 综合练习 一–十一: 一 (幸-fill 5), 二 (影-үгийн сүлжээ холбох 7), 三 (vocab-fill 8), 四 (сонгож унших 4), 五 (өгүүлбэр гүйцээх 8), 六 (PPT 填空 хүснэгт → text_ex), 七 (хүснэгт 3 багана + эргэцүүлэх 3 асуулт), 八 (○/× 7 + нээлттэй 3), 十一 (拓展学习 1 нээлттэй) — хариулт бүр 参考答案 + тайлбар |
| `subtitles.json` | 课文-ийн 44 өгүүлбэрийн start/end (faster-whisper + текст тулгалт) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 7 зураг (走廊 hero, 部门, 包围, 上升, 遭遇/气喘吁吁, 难熬, 鼓励) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-06-words.mp3` (生词), `fazhan-zhongji1-06-text.mp3` (课文); `audio/words/w01..w36.mp3` — үг бүрийн тусдаа клип (whisper цаг + текст тулгалтаар хайчилсан), `texts.json → vocabularyAudio` {ханз: зам} |

Эх: сурах бичгийн PDF (中级综合-01.pdf, х. 64–75, хуудсыг зургаар уншсан — OCR биш), `docs/fazhan/teacher/zhongji-zonghe-1/l06.md` (教案), `docs/fazhan/courseware/zhongji-zonghe-1/l06.md` (课件 39 слайд), `docs/fazhan/workbook/zhongji-zonghe-1-answers.md` + 参考答案 PDF (х. 9–10, өндөр DPI зургаар дахин шалгасан). Build: `content/fazhan-packages/fazhan-zhongji1-l06/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).

## v1 (2026-10-14)
- Эхний бүрэн хувилбар: vocab 36, sentences 44, grammar 5, quiz 32, wb parts 10, subtitles 44, word-clips 36, images 7.
- Үгийн аудио клипүүдийн дотроос «屏» (bǐng, амьсгаа даран барих) үгийн клипийг align.py-гийн автомат тулгалт буруу зүссэн (pypinyin-ийн polyphone-ийн анхдагч уншлага «píng» (屏幕) авсанаас болж ASR-ийн зөв «bǐng» токентой тулгараагүй) тул гараар ffmpeg-ээр зөв хугацаагаар (56.89–57.65s) дахин зүссэн. Дэлгэрэнгүй QA_REPORT.md-д.
