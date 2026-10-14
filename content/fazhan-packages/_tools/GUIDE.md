# 发展汉语 中级综合 I — хичээл бүтээх заавар (L2–L15)

Жишиг: `content/fazhan-packages/fazhan-zhongji1-l01/_build/*.py` (L1 《北京的四季》) — **ижил бүтэц, ижил чанар, ижил гүн**. Бүх монгол тайлбар багшийн ярианы өнгөтэй, орос галиггүй (магазин/студент/класс/урок г.м. ХОРИОТОЙ — монгол үг хэрэглэ), «гэх мэт», «буюу» хэтрүүлэхгүй. Монгол бичвэрт ы, э, ө, ү хэвийн; щ, ъ хэрэглэхгүй.

## Ажлын хавтас
`/home/claude/work/lNN/` (NN = 02..15). Бэлэн байгаа: `pkg/audio/fazhan-zhongji1-NN-{text,words}.mp3`, `asr_text.json`, `asr_words.json` (whisper).
Хэрэгсэл: `T=/home/claude/baldansan/content/fazhan-packages/_tools` — `build.py`, `align.py`, `images.py`, `validate.py`, `pack.sh`.

## Эх сурвалж (бүгд repo `docs/fazhan/`, хуудас/мөрийн дугаар = NN)
1. **Сурах бичиг — ЗУРГААР унш (OCR текстэд найдахгүй):**
   `PDF="/mnt/user-data/uploads/Surtsgaay app/Ebooks/Hyatad hel/fazhanhanyu/发展汉语教学PPT课件成人留学生长期对外汉语教学教案第二版资料/发展汉语34本/中级综合-01.pdf"`
   Хуудасны муж: `docs/fazhan/textbooks/zhongji-zonghe-1.index.json` (lesson N → start_page/end_page; **эхлэл 1–2 хуудсаар эрт байж болно → start_page-2-оос эхэл**).
   `pdftoppm -r 60 -f A -l B -jpeg "$PDF" /home/claude/work/lNN/pg` → `pg-NNN.jpg`-уудыг Read-ээр нэг нэгээр нь харж, `source.md`-д бүх зүйлийг бич: 课文 (догол мөрөөр, бүрэн), 生词 (дугаар, ханз, пиньинь, үгийн аймаг — номын дарааллаар, цэнхэр гол үгийг key=True), 专名, 综合注释 (дүрэм бүр: тайлбар + жишээ + 试一试 БҮГД), 课文理解 хажуугийн асуултууд, 综合练习 一…九 бүх даалгавар, 词语搭配/辨析 хэсгүүд. Хэрэв хуудас бага нягтралтай уншигдахгүй бол `-r 90`-ээр тухайн хуудсыг дахин гарга.
   OCR текст (`docs/fazhan/textbooks/zhongji-zonghe-1.md`, `<!-- p.NNN -->` тэмдэгтэй) — зөвхөн ханз хуулж бичихэд туслах, баталгаажуулалт зургаар.
2. **教案** `docs/fazhan/teacher/zhongji-zonghe-1/lNN.md` — хичээлийн зорилго, цагийн хуваарь, 重点词语 тайлбар, багшийн арга, нэмэлт дасгал → WORD_EXPL, INTRO, retell, 文化 хэсэгт.
3. **课件 PPT** `docs/fazhan/courseware/zhongji-zonghe-1/lNN.md` — үгийн хэрэглээ (~ хэлбэр), нөхөх дасгал (PPT_FILL), 复述 загвар, зураг.
4. **参考答案** `docs/fazhan/workbook/zhongji-zonghe-1-answers.md` → 第N课 хэсэг — 综合练习 + 试一试 бүх хариулт. Хариултыг ЭНДЭЭС, өөрөө зохиохгүй; хариулт байхгүй нээлттэй даалгаврыг «нээлттэй» гэж тэмдэглэ.
5. Зураг: `python3 $T/images.py N /home/claude/work/lNN` → `images_candidates/` (index.json: слайд, хэмжээ, слайдын текст). Read-ээр харж 6–10 ашигтай зураг сонго (хичээлийн сэдэв, шинэ үгсийн зураг; дэвсгэр/лого/жижиг хаях), `pkg/images/<latin-slug>.jpg` болгон хуул (хэт том бол PIL-ээр ≤1200px), `media_images.json` бич: `[{"id","file":"images/x.jpg","title":"<ханз — ҮГИЙН КАРТ зурагтай болох тул title = тухайн шинэ үг эсвэл сэдвийн нэр>","role":"hero"|"illustration","section":"teacher-intro"|"vocabulary"|"dialogue"}]` — hero 1 (хичээлийн сэдвийг илэрхийлэх сайхан зураг; META.thumbnail = тэр). Зураг муу бол hero-гүй байж болно.

## Бичих файлууд (L1 _build-тэй яг ижил бүтэц — эхлээд L1-ийн 6 файлыг бүгдийг нь уншиж бүтцийг үз)
- `meta.py` — `META` dict: n, title_zh, title_mn, unit_title_mn, icon, thumbnail, description, author_zh, intro_zh, intro_mn, para_mn{догол мөр: монгол хураангуй}, reflection_mn[3], fill_instruction_mn, fill_source, comprehension_instruction_mn, retell_instruction_mn, application{background, topic, discussion[]}, speaking[{prompt_mn, question_zh, answer, explanation_mn}], answer_source, proper_py{}, phrases{пиньинь засвар: 得/着/一 сандхи…}, extra_words[] (эх бичвэр/жишээн дэх 2+ ханзтай үгс — пиньинь зөв хуваахад).
- `vocab.py` — `VOCAB = [(chinese, pinyin, pos_mn, mongolian, key, example_zh, example_mn)]` номын 生词 БҮГД, дарааллаар (аудио тааруулалт энэ дарааллаар явна!). Жишээ өгүүлбэр — боломжтой бол эх бичвэрээс, эсвэл 课件/教案-аас. `PROPER = [(zh, pinyin, mn_тайлбар)]`.
- `text.py` — `TEXT = [(para_no, [(tokens "|"-ээр, mn, note|None, key_structures[])])]` 课文 бүрэн, өгүүлбэр бүр; token = үг (пиньинь үгээр хуваагдана); note — 30–40%-д нь дүрэм/үгийн тайлбар; `SOURCE_NOTE` = эх зохиолын тэмдэглэл (номын доод мөр).
- `grammar.py` — `GRAMMAR = [dict(point, gloss_mn, structure, teacher_mn, teacher_notes, examples[(zh,mn)] ≥4, common_mistakes[(wrong,right,why)] ≥2, check=(q, options, idx), exercises[dict(type="choice", question, options, answer=idx, ok, wrong) | dict(type="judge", question, answer=bool, ok, wrong)] ≥3)]` — 综合注释 бүр.
- `extra.py` — `WORD_EXPL` (教案 重点词语 ≥6: word, gloss, structure, explanation, teacher_notes, examples ≥3, mistakes ≥1, check, practice ≥2), `COLLOC` [dict(type, rows[(head, with, mn, usage_mn, ex_zh, ex_mn)])], `WORD_CMP` [dict(pair, common, differences[], practice[(n,q,a,note)])] (номын 词语辨析 байвал), `PPT_FILL` [(q,a)], `PPT_FILL_BANK`, `COMPREHENSION` [(q_zh,a_zh)] номын хажуугийн асуултууд, `RETELL` [(label, start_zh)], `CULTURE` dict(title, title_mn, text_mn, note_mn), `INTRO` dict(teacher_mn ≥400 тэмдэгт — багш шинэ хичээлийг танилцуулж байгаа мэт, warmup_mn — халаалтын 2–3 асуулт, theme_zh, theme_mn), `WRITING` dict(title_mn, zh — 150+ ханз загвар эссе, mn, prompt_zh, prompt_mn, min_chars, required_words[], rubric_mn).
- `workbook_quiz.py` — `WB_READING` [dict(part, instruction_mn, items[(n, q, a, expl_mn)], answer_type ∈ category|word|sentence|table|open, bank)] 综合练习 бүгд; `SHIYISHI = [((gnum, gpoint), [(n,q,a,e)])]` 试一试 бүгд; `QUIZ` [(type ∈ cloze|choice|judge|order|usage|reading, q, options[4], correct, explanation_mn, difficulty easy|medium|hard, tags[])] **≥30** (үг 40%, дүрэм 35%, эх бичвэр ойлголт 15%, хэрэглээ 10%); зөв хариулт options-д байх, давхардалгүй.

## Дараалал
1. Эх сурвалж → `source.md` (бүрэн). 2. 6 файл бич. 3. `python3 $T/build.py /home/claude/work/lNN` (алдаа засах). 4. `python3 $T/align.py /home/claude/work/lNN` → subtitles + үгийн клип; «interpolated» гэсэн үгийн клипийг `ffmpeg`-ээр сонсох боломжгүй тул asr_words.json-той гараар харьцуулж (хөрш үгсийн цаг) зөв эсэхийг шалга; буруу бол `vocab_audio_map.json`-оос тэр үгийг устга (клипгүй үг TTS-ээр унших). 5. Зураг (images.py → media_images.json). 6. Дахин `build.py`. 7. `python3 $T/validate.py …` ERR=0. 8. `pkg/README.md`, `pkg/QA_REPORT.md` (L1-ийнх шиг: юу орсон/орхигдсон, эх сурвалж, хариултын баталгаа, аудио/зураг, шалгалтын дүн — ИЛ ТОД). 9. `$T/pack.sh /home/claude/work/lNN` → zip + repo copy. Git commit ХИЙХГҮЙ (эцэг агент хийнэ).

## Чанарын шаардлага
- Эх бичвэрийн орчуулга утга зөв, уран, монгол хэлний хэм хэмжээнд; ханзыг зургаас шалгасан (OCR алдаа 的/得, 己/已 зэргийг засах).
- Дүрмийн тайлбар: «яагаад», «хэзээ хэрэглэх», «монголоор яаж хэлдэг», нийтлэг алдаа. Жишээ бүрт монгол орчуулга.
- Хариулт: 参考答案-тай тулгасан; шалгалтын асуултын тайлбар (explanation) буруу хариултыг яагаад буруу гэдгийг хэлнэ.
- Тоо: үг = номынх бүгд; quiz ≥30; grammar exercises ≥3/дүрэм; WORD_EXPL ≥6.
- Төгсгөлд эцэг агентад тайлагна: vocab/sentences/grammar/quiz/wb/subs/clips/images тоо, validate гаралт, interpolated үгс, орхигдсон зүйл.
