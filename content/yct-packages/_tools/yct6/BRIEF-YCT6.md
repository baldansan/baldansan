# YCT 6 хичээл бүтээх заавар (Sonnet subagent, нэг хичээл)

Та «Бөөндөө Сурцгаая» аппын YCT 6 (YCT 标准教程 6) хичээлийн багцыг бүтээнэ. Хэрэглэгч: **11–14 насны монгол хүүхэд (дунд ангийн)**, YCT 1–5-ыг дуусгасан (≈800 үг мэднэ; YCT6 нь 190 шинэ үгтэй, нийт ≈1000 үг, ≈HSK3+), англи мэдэхгүй. Зорилго: **номноос илүү ойлгомжтой, хөгжилтэй**. Эцсийн бүтээгдэхүүн = `pkg/` хавтас (JSON + audio + images) — YCT 3–4 багцтай яг ижил бүтэц.

Ажлын хавтас: `/home/claude/work/yct6/lNN/` (таны хичээл). Дотор нь `pages/` (p-*.png 100dpi, hi-*.png 150dpi — номын 8 хуудас), `pkg/audio/yct-6-NN-MM.mp3` (CD track-ууд аль хэдийн хуулагдсан).

## 0. Эхлээд унш
1. `/home/claude/work/yct6/TEMPLATE_build_yct5_l02.py` — YCT5 L2-ийн аудит хийгдсэн бүтээгч скрипт (бүх хэсэгтэй, тестийн crop кодтой, tok() зөв). Үүнийг `lNN/build_lNN.py` болгон ХУУЛЖ, `OUT`, `CID/LID/N`, `yct-5`→`yct-6`, `02`→`NN`, `hskLevel:3` болго, series «YCT 标准教程 6», seriesLabel_mn «YCT 6 — Хүүхдийн хятад хэл (≈HSK3)», `level: "YCT 6"`, vocab `hskLevel:"YCT 6"`, хуудасны зам (`/home/claude/work/yct6/lNN/pages/hi-NNN.png` (3 оронтой: hi-010.png …)) болгож, зөвхөн КОНТЕНТЫГ солино (бүтэц, dump, shuffle, image/audio зам бүгд хэвээр). Тестийн crop-ийн координатыг өөрийн хуудсаар шинээр тааруул.
2. `/home/claude/work/yct6/TEST-KEY.md` — тестийн сонсголын скрипт + албан хариу (бүх хичээл), аудио track-ийн тайлбар, бүх track байна.
3. Жишиг багц: `/home/claude/work/yct4/l02/` (pkg JSON, source.md, image_prompts.json — аудит хийгдсэн YCT4) — чанарын жишиг.
4. Доорх «Хүүхдийн зарчим» ба «Орчуулгын дүрэм». Skill tool-оор `anthropic-skills:hsk-lesson` skill-ийг ачаалж, орчуулгын сахилгыг дага.

## 1. Эх сурвалж — БҮГДИЙГ авна
- `pages/p-*.png` — хичээлийн 5 хуудас. **Хуудас бүрийг Read-ээр нэг нэгээр нь хар.** Уншигдахгүй бол `hi-*.png`.
- Хуудас бүрээс бүх зүйлийг `lNN/source.md`-д бич: Key sentences (пиньинь, ханз, утга), Let's learn бүх үг (ханз, пиньинь, англи тайлбар, жишээ), Let's read/talk/watch бүх яриа, Let's chant/sing мөрүүд (ханзыг яг хуулна), Mini story, Let's play / Make a survey / Let's draw / Let's match даалгаврын заавар, Test-ийн бүх асуулт (зураг юу харуулж байгааг тодорхойлж бич).
- YCT6 хичээлийн ердийн бүтэц (8 хуудас, ном х.5+8(N−1)…): х.1 Key sentences (2 өгүүлбэр) + Let's learn (📀 NN-01, ≈14 үг, * тэмдэгтэй үг = YCT6-ын жагсаалтаас гадуур, гэхдээ ОРУУЛНА); х.2 Let's read (📀 NN-02, яриа + Question); х.3 Short speech (📀 NN-03, богино өгүүлэмж + Question); х.4–5 Activities & exercises (Let's find / Let's listen 📀 NN-04 / Let's choose / Let's match / Let's compare / survey / тоглоом); х.6 Let's sing (📀 NN-05) эсвэл Mini story (📀 NN-05, 6 зурагт үлгэр); х.7 Model test: Listening 1–5/6 (📀 сүүлийн track — хэрэв 5 track байгаа бол тест нь 05 эсвэл дуу/үлгэртэй хуваалцсан байж болно, TEST-KEY-ийн track тайлбарыг үз); х.8 Reading (сонгох/match, 1–5) + Writing (хоосон зайд ханз бичих ЭСВЭЛ өгүүлбэр зохиох — TEST-KEY-д хариу бий). Хуудсан дээрх 📀 дугаарыг хэсэг бүртэй тааруулж `source.md`-д тэмдэглэ (track 5 ш: `pkg/audio/yct-6-NN-01..05.mp3`; ffprobe-оор уртыг нь үзэж аль хэсэг нь болохыг тааруул).
- Short speech болон Mini story-г `texts.json`-д тусдаа текст болгож (mainText = Let's read яриа; shortText/story = Short speech / Mini story — YCT4 L2-ийн story бүтцийг дага), мөр бүр ханз+пиньинь+монгол.
- Test Reading-ийн match (A–E ↔ 1–5) болон ✓✗ хэсэг, Writing (пиньинь → ханз, 5 хоосон) бүгд workbook.json-д part болно; Writing-д `answer` = ханз, `explanation_mn`-д пиньинь+утга.
- Ярианы/Short speech/Mini story-ийн англи орчуулга: `/home/claude/work/yct6/scripts/tr-130.png … tr-135.png` (ном х.125–130) — утга тодорхойгүй үед Read-ээр хар.
- Ханзыг зургаас шалгаж бич; таамаглахгүй. Пиньинь аялгууны тэмдэгтэй, номынхоор (不/一 сандхи номд хэрхэн бичсэн бол тэр).
- Үгийн жагсаалт (албан): `/home/claude/work/yct6/src/vocab56.txt` (YCT 5–6 Vocabulary list, текст) ба номын үгийн хүснэгт `/home/claude/work/yct6/scripts/vocab-125..129.png` (ном х.120–124) — пиньинь/утгыг тулгахад.
- Тест: TEST-KEY.md дахь скрипт + хариуг хэрэглэ; зурагтай таарч байгааг өөрөө шалга, зөрвөл source.md-д тэмдэглээд номын хариуг хэрэглэ.

## 2. Хүүхдийн зарчим (11–14 нас) — номноос ИЛҮҮ
- Тэмээ багшийн яриа: богино өгүүлбэр, «чи» гэж хандана, асуулт тавьж, хөдөлгөөн (гараа даллаарай, чанга хэлээрэй, үсрээрэй) санал болгоно. Дүрмийн нэр томьёо (төлөөний үг, өгүүлбэрийн гишүүн, аялгуу г.м.) ХЭРЭГЛЭХГҮЙ — «энэ үгийг … гэж хэлдэг» гэх мэт энгийнээр.
- Үг бүр: монгол утга нь хүүхдийн үг (аав, ээж, ах, эгч, багш, муур, нохой, ус, сүү, будаа…). Жишээ өгүүлбэр — номын яриа/дуунаас, эсвэл хүүхдийн амьдралаас (сургууль, гэр, тоглоом, амьтан).
- Яриа: номын зурагт яриаг яг тэр ханзаар; speaker-ийг **ханзаар** (小明：/ 小红：/ 老师：/ 妈妈：), латин «A/B» хэрэглэхгүй.
- Дуу/chant: мөр бүр ханз + пиньинь + монгол. Дууг «дуулж, хөдөлгөөн хийж» гэж тайлбарла.
- Let's play / survey / mini story-г аппын тоглоом болгож бодно: `textExercises.retell.prompts`-д тоглоомын ЗААВРЫГ хүүхдэд ойлгомжтой монголоор (гэрийнхэнтэйгээ / найзтайгаа яаж тоглох).
- grammar.json = Key sentences (2–3) + энэ хичээлийн гол бүтэц (жишээ нь 几/多大, 的, 有, 在, 不): `teacher_mn` 3–4 богино өгүүлбэр, `examples` ≥3 (номын яриа/дуунаас), `check` 1, `exercises` 3 (choice/judge), `common_mistakes` 1–2 — бүгд хүүхдийн хэллэгээр.
- quiz.json ≥25: үг (зураг/утга), яриа, тоо/бүтэц, пиньинь, хэрэглээ; сонголт зөвхөн СУРСАН үгсээс (энэ + өмнөх хичээл), тайлбар монголоор, зөв хариуг `shuffle`-ээр холино.
- workbook.json: номын Test БҮГД (listening part: `script_zh` = дээрх скрипт, `optionImages` = images/tNa..c.png эсвэл зураг нэг бол `image`; judge part: `image` + ✓/✗; match/choice part байвал тэр чигээр нь), + Let's match/Let's play-г part болгож; хариу бүрд `explanation_mn` (яагаад зөв, бусад нь яагаад буруу — зурагт юу байгааг хэлж).
- Тэмээ багшийн `lessonIntro.teacher_mn`: 5–7 өгүүлбэр (YCT6 = YCT1–5-ыг дуусгасан 11–14 настай хүүхэд; өнгө аяс арай «том хүүхдийн», гэхдээ хөгжилтэй; «өмнөх номд … сурсан, одоо …» гэж холбо), хичээлийн сэдвийг хүүхдийн амьдралтай холбож, «эхэлцгээе!» гэж дуусна. `warmup_mn` 2 асуулт. `culture`: энэ хичээлтэй холбоотой хятад хүүхдийн амьдралын нэг сонирхолтой зүйл (байхгүй бол монгол–хятад харьцуулсан нэг зүйл).

## 3. Орчуулгын дүрэм
- Орос галиг 0: студент, класс, магазин, урок, доктор, адрес, номер, минут(→минут болно), канцеляр… ХОРИО. «дэлгүүр, анги, хичээл, эмч, хаяг, дугаар».
- Калькагүй, монгол үгийн дараалал. 很 = «их/маш» гэж заавал орчуулахгүй (他很高兴 = «Тэр баяртай байна»).
- Нэр: 玛丽 Мари, 大卫 Дэвид, 月月 Юэ-юэ, 小明 Сяо Мин г.м. — пиньиньээр монгол галиглана.
- Ханзаас таамаглахгүй; утга тодорхойгүй бол номын англи тайлбарыг дага.

## 4. Зураг
Зургийг ТА ҮҮСГЭХГҮЙ (эцэг агент Higgsfield-ээр Тэмээ багш/ботгоны дүрээр хийнэ). Та `lNN/image_prompts.json` бичнэ:
```
[{"file":"images/hero.jpg","aspect":"4:3","title":"<ханз гарчиг — hero>","section":"teacher-intro","role":"hero",
  "prompt":"<англиар, 1–2 өгүүлбэр: дүрүүд юу хийж байгаа, орчин, speech bubble-д ямар ханз>","chars":["temee","huu","ohin","bor"]},
 {"file":"images/w-<pinyin>.jpg","aspect":"1:1","title":"<үгийн ханз ЯГ>","section":"vocabulary","prompt":"...","chars":[...]},
 {"file":"images/d1.jpg","aspect":"4:3","title":"<яриа 1-ийн эхний мөрийн ханз>","section":"dialogue","prompt":"...","chars":[...]},
 {"file":"images/song.jpg","aspect":"4:3","title":"<дууны нэр>","section":"song","prompt":"...","chars":[...]}]
```
- Үг бүрд 1 зураг (title = тэр үгийн ханз яг — апп үүгээр таардаг). Тоо, өнгө гэх мэт хийсвэр үгэнд ч хүүхдэд ойлгомжтой дүрслэл бод (五 → ботго 5 алим барьж; 大 → том заан, жижиг муур).
- Яриа бүрд 1, hero 1, дуу 1. Тестийн зургийг номоос хайчилна (доор).
- `chars`: temee = Тэмээ багш (нүдний шилтэй шар тэмээ, багш), huu = шар ботго хүү (цэнхэр жилет, улаан цүнх), ohin = ботго охин (шар даашинз, ягаан тууз), bor = бор ботго хүү (ногоон малгай, ногоон цамц). Гэр бүлийн гишүүд (爸爸 妈妈 哥哥 姐姐) = том тэмээнүүд (prompt-д «adult camel father/mother…» гэж бич), амьтад жирийн амьтан.
- Prompt-д англи текст зурагт гарахгүй гэж заа («No English text»), ханз speech bubble хэрэгтэй бол «speech bubble with the Chinese text X in large clear black font».

Тестийн зураг: номын Test хуудсыг (`hi-*.png`, 150dpi) PIL-ээр хайчилж `pkg/images/tNa.png` (сонголт A/B/C) эсвэл `pkg/images/tN.png` (нэг зураг) болгоно — L1-ийн build_TEMPLATE_yct1_l04.py-ийн crop кодыг үз (crop.py туслах) (хувь хэмжээгээр crop, дараа нь contact sheet гаргаж Read-ээр шалга, буруу бол дахин). Ханзын зураасны дасгал, Mini story зураг байвал мөн хайчилж `pkg/images/story.png` г.м.

## 4b. Нэмэлт (YCT6)
- Үгийн `mongolian` утга YCT1-ийн адил хүүхдийн үг. YCT1–5-д сурсан үг энэ хичээлийн Let's learn-д ДАХИН гарахгүй бол vocab-д оруулахгүй.
- Speaker-ийг ханзаар (номд нэр байхгүй бол 小明/小红/妈妈/老师 гэх мэт тохируул).
- image_prompts.json-д үг бүрд 1, яриа бүрд 1, hero 1, дуу/chant 1 (mini story-д ч 1 байж болно: `images/story.jpg`, section "story"). `chars` дүрүүд ижил (temee/huu/ohin/bor; гэр бүл = том тэмээ). Short speech-д ч 1 зураг (`images/speech.jpg`, section "speech"). Mini story-ийн 6 зурагт үлгэрийг номоос хайчилж `pkg/images/story.png` (нэг хуудас) болго + нэг Higgsfield зураг.

## 5. Гаралт
- `lNN/source.md`, `lNN/build_lNN.py`, `lNN/image_prompts.json`, `lNN/pkg/*` (JSON + audio + images (тестийн хайчилбар)).
- `python3 -I build_lNN.py` ажиллаж JSON гаргана. Дараа нь: `python3 -I /home/claude/baldansan/content/fazhan-packages/_tools/validate.py /home/claude/work/yct6/lNN --min-vocab=5` — ERR нь зөвхөн «subtitles/word clips/vocabularyAudio дутуу» байж болно, бусад ERR-ийг зас. Орос галиг шалгах: `grep -nE "студент|класс|магазин|урок|доктор|адрес|номер|пар|фото" pkg/*.json` хоосон.
- texts.json-ийн `tokens` дотор латин үсэгтэй `zh` байж болохгүй: `python3 -I -c "import json,re;[print(t) for s in json.load(open('pkg/texts.json'))['mainText']['sentences'] for t in s['tokens'] if re.search('[A-Za-z]',t['zh'])]"` хоосон байх.
- manifest `images` жагсаалтад image_prompts.json-ийн БҮХ файл + тестийн хайчилбар орсон байх (файл одоогоор байхгүй ч заавал бич; эцэг агент зургийг нэмнэ).
- lesson.json: `lessonId: yct-6-lNN`, `orderIndex: N`, `title: "YCT 6 · N-р хичээл — <монгол гарчиг>"`, `thumbnailFile: images/hero.jpg`, `audioFile` = яриа+дуу нийлүүлсэн файл (ffmpeg concat: Let's read track + Short speech track (+ chant/song байвал) → `audio/yct-6-NN-text-song.mp3`; дуу байхгүй бол яриа track).
- Quiz ≥25, сонголт зөвхөн СУРСАН үгсээс (YCT1–5 + энэ ном энэ хүртэл), нэг л зөв хариу, зөв хариуг `shuffle`-ээр холино (апп холидоггүй — бүгд 0-р индекс байж болохгүй).
- Git commit/push ХИЙХГҮЙ. Higgsfield дуудахгүй.
- Тайлан (≤200 үг): үг/яриа/дуу/дүрэм/quiz/workbook тоо, validate гаралт, тестийн зураг хэд, аль track юунд, тодорхойгүй/зөрсөн зүйл.
