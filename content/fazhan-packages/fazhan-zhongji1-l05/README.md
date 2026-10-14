# fazhan-zhongji1-l05 — 发展汉语（第二版）中级综合 I · 第5课《最好的教育》

FLAT багц (`/admin/import/chinese` → «Ноорог болгон оруулах»).

| Файл | Агуулга |
|---|---|
| `lesson.json`, `manifest.json` | courseId `fazhan-zhongji1`, lessonId `fazhan-zhongji1-l05`, profile `hsk4-dialogue-shorttext-exam-workbook` (≈HSK4) |
| `vocabulary.json` | 46 үг (сурах бичгийн 词语学习 — ханз/пиньинь/үгийн төрөл/монгол + жишээ, ихэнх нь шууд эх бичвэрээс), 20 гол үг `keyWord:true` |
| `texts.json` | `mainText` 13 догол мөр 34 өгүүлбэр (tokens үгээр, 13/34 ≈ 38% note+key_structures, paragraph_summaries, reflection, writingSample «爱的小事» 215+ ханз + writingPrompt); `wordExplanation` 7 (教案-ийн 重点词语: 毕竟, 人家, 碎, 老实, 剩下, 生怕, 特色); `collocations` 4 бүлэг; `wordComparison` 3 (特色/特点, 人家/别人, 剩下/剩余); `textExercises` (PPT 填空 9 — агентийн өөрийн зохиосон, эх 填空 slide байхгүй тул, нийтлэг хэрэглээн дээр үндэслэсэн; 课文理解 21 асуулт-хариулт; 复述 2 загвар) |
| `grammar.json` | 综合注释 4 дүрэм: ……，可毕竟……／怎么V也V不+C／V着V着，……／无论/不论……，都…… — structure/teacher_mn/teacher_notes/examples 4–6/common_mistakes 2/check/exercises 4–5 (试一试-гаас, 参考答案-аар баталгаажсан) |
| `quiz.json` | 32: 选词填空 12 · 用法选择 10 · 课文理解 6 · 排序 4, сонголт hash-аар холисон, бүгд тайлбартай |
| `workbook.json` | part0: 综合注释 试一试 бүгд (17, хариулттай) + 综合练习 一–九 (一: 心-язгуурт үг ангилах 11, 二: 粒/滴 тоо нэр 10, 三: 选词填空 9, 四: 选词填空 2×3, 五: 课文内容补全 8, 六: 完成句子 5, 七: 完成对话 5, 八: 课文理解问答 4 нээлттэй, 九: 阅读短文《最优秀的简历和证书》判断+问答 8) — хариулт бүр 参考答案/эх бичвэртэй тулгасан + тайлбар; `speaking` (综合练习 十 — 幼儿园面试 4 асуулт, нээлттэй) |
| `subtitles.json` | 课文-ийн 34 өгүүлбэрийн start/end (faster-whisper + текст тулгалт) — аудио тоглоход өгүүлбэр гэрэлтэж дагана |
| `images/` | PPT-ээс 6 зураг (握手 hero — гэрээ/握, 篷布, 缝补, 签约, 学历 (төгсөлтийн дээл), 碎 (心碎了)) — manifest.media.images |
| `audio/` | Албан mp3: `fazhan-zhongji1-05-words.mp3` (生词), `fazhan-zhongji1-05-text.mp3` (课文); `audio/words/w01..w46.mp3` — үг бүрийн тусдаа клип (w17 淋, w32 握-ийг align.py-ийн анхны автомат тааруулалт буруу (2.5–3.5 сек) байсныг ASR-ийн гаралттай гараар харьцуулж зөв цагийг олоод дахин хайчилсан) |

Эх: `docs/fazhan/textbooks/zhongji-zonghe-1.md` (PDF х. 51–62, хуудсыг зургаар уншсан), `teacher/zhongji-zonghe-1/l05.md`, `courseware/zhongji-zonghe-1/l05.md`, `workbook/zhongji-zonghe-1-answers.md` (第5课, PDF х. 8). Build: `content/fazhan-packages/fazhan-zhongji1-l05/_build/` (meta.py, vocab.py, text.py, grammar.py, extra.py, workbook_quiz.py → build.py).
