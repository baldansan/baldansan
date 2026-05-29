# Солонгос хэлний lesson package — бүтэц, урсгал, ZIP стандарт

Энэ баримт бичиг нь **Солонгос номын хичээл** (PreLesson + textbook lesson) багц бэлтгэх албан ёсны дүрэм. Зорилго: багш зааж байгаа мэт тайлбар → жишээ → анхааруулга → удирдамжтай дасгал → quiz/game урсгал; quiz/game-ийг шууд эхлүүлэхгүй.

ZIP нь [`/admin/import`](./app/admin/import) дээр шууд upload хийхэд бэлэн байна. Техник формат: [LESSON_ZIP_IMPORT_FORMAT.md](./LESSON_ZIP_IMPORT_FORMAT.md).

---

## 1. Зарчим

| # | Дүрэм |
|---|--------|
| 1 | Номын хичээлийг **багш зааж байгаа мэт** тайлбарлана — монгол сурагчид ойлгомжтой, алхам алхмаар. |
| 2 | **Шууд quiz/game эхлүүлж болохгүй.** Эхлээд сургалтын хэсэг (section) дууссаны дараа л шалгалт/дасгал. |
| 3 | Section бүр дараах дараалалтай: **Teach → Example → Warning → Pronunciation → Check → Practice**. |
| 4 | Дасгал нь **зөвхөн тухайн section-ийг** бататгана (өмнөх бүх зүйлийг холихгүй). |
| 5 | Сонголтууд **адил ангиллын**, **андуурч болох** (confusable) хариултууд байна. |
| 6 | Эцсийн урсгал: **Teach → Example → Warning → Guided practice → Quiz/Game**. |

---

## 2. Section бүтэц (бүх хичээлд)

Section бүр доорх 6 алхмыг дагана. ZIP-д файлын mapping:

| Алхам | Зориулалт | ZIP файл / талбар |
|-------|-----------|-------------------|
| **Багшийн тайлбар** | Юу вэ, яагаад чухал вэ | `subtitles.json` (`role: "teach"`) эсвэл `index.html` |
| **Номын жишээ** | Textbook-ийн мөр, хүснэгт | `vocabulary.json` (`exampleChinese` / `exampleMongolian`) |
| **Монгол сурагчийн анхаарах зүйл** | Алдаа, ойролцоо авиа | `subtitles.json` (`role: "warning"`) |
| **Дуудлага / унших тусламж** | Romanization, TTS | `vocabulary.json` (`pinyin`), `audio/` (optional) |
| **Богино шалгах асуулт** | 1–2 асуулт, section дотор | `quiz.json` (`lessonSection`, `phase: "check"`) |
| **Дасгал** | Section бататгал | `quiz.json` (`phase: "practice"`) |

**Section-ийн дараалал:** `orderIndex` эсвэл `lessonSection` string-ээр quiz асуултыг эрэмбэлнэ. Сурагч quiz дэлгэц дээр section-ээр групплэгдэхийг зорьсон (app UI ирээдүйд section filter).

---

## 3. PreLesson 0 (Hangul overview bridge)

`lessonType: "prelesson"`, `contentType: "textbook"`, `orderIndex: 0`.

Section-ийн жагсаалт (нэг package эсвэл олон prelesson-д хувааж болно):

| Section ID | Гарчиг (MN) | Агуулга |
|------------|-------------|---------|
| `intro-hangul` | Хангыль гэж юу вэ? | Бичиг систем, үсэг vs үе |
| `intro-block` | Үеийн блок гэж юу вэ? | 초성 / 중성 / 종성 |
| `intro-zero` | ㅇ яагаад дуугүй байдаг вэ? | Zero consonant, 아 |
| `vowels-basic` | Үндсэн эгшиг | ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ |
| `consonants-basic` | Үндсэн гийгүүлэгч | ㄱ–ㅎ |
| `syllable-build` | Үе бүтээх | ㄱ+ㅏ=가 |
| `batchim` | Batchim (받침) | 받침 танилцуулга |
| `bridge-l1` | Lesson 1 bridge words | 한글, 한국, 몽골, 학생 |
| `readiness` | Final readiness | Hangul бэлэн эсэх |

**Lesson ID жишээ:** `KR-L1-PRELESSON-00` эсвэл `k-pre-00`.

Дэлгэрэнгүй 8 хэсэгт хуваасан track: `k-pre-01` … `k-pre-08` ([KOREAN_PRELESSON_IMPORT_PLAN.md](./KOREAN_PRELESSON_IMPORT_PLAN.md)).

---

## 4. Official textbook lesson

`lessonType: "lesson"`, `contentType: "textbook"`.

| Дараалал | Section ID | Агуулга |
|----------|------------|---------|
| 1 | `title` | Textbook-ийн lesson title |
| 2 | `vocab` | Textbook-ийн үгс |
| 3 | `grammar` | Textbook-ийн дүрэм |
| 4 | `dialogue` | Dialogue / example өгүүлбэр |
| 5 | `workbook` | Workbook дасгал |
| 6 | `audio` | Audio mapping (файлын жагсаалт) |
| 7 | `assessment` | Quiz + Game (app) |

---

## 5. ZIP root бүтэц (importer-compatible)

```
lesson-package.zip
├── manifest.json       (required)
├── lesson.json         (required)
├── vocabulary.json     (required)
├── quiz.json           (required — check + practice + final quiz)
├── index.html          (required for authoring; optional for import)
├── subtitles.json      (recommended — teach / example / warning)
├── audio/              (optional)
└── images/             (optional)
```

`index.html` нь багшийн бүрэн тайлбар (nom-оос хуулсан HTML). Import үед metadata болгон хадгалагдахгүй; QA preview-д ашиглана. JSON файлууд л app-д орно.

---

## 6. manifest.json

```json
{
  "packageVersion": "1.0",
  "courseId": "korean-1",
  "lessonId": "k-pre-01",
  "language": "ko-MN",
  "targetLanguage": "ko",
  "uiLanguage": "mn",
  "title": "PreLesson 01 — Үндсэн эгшиг",
  "mongolianTitle": "Хангыль — үндсэн эгшиг",
  "lessonType": "prelesson",
  "contentType": "textbook",
  "source": "Korean Book 1 — PreLesson 01",
  "hasAudio": false,
  "hasImages": false
}
```

---

## 7. lesson.json

```json
{
  "courseId": "korean-1",
  "title": "PreLesson 01 — Үндсэн эгшиг",
  "chineseTitle": "기본 모음",
  "subtitle": "Солонгосын 6 үндсэн эгшиг",
  "description": "Багшийн тайлбар: эхлээд эгшгийг таних, дараа нь унших, эцэст нь богино дасгал.",
  "lessonType": "prelesson",
  "contentType": "textbook",
  "orderIndex": 1,
  "duration": "15 min",
  "status": "draft",
  "mediaStatus": "missing",
  "sourceNote": "lessonType=prelesson · Korean Book 1"
}
```

---

## 8. vocabulary.json

Korean талбар mapping:

| Талбар | Утга |
|--------|------|
| `chinese` | Hangul (ㅏ, 가, 한글) |
| `pinyin` | Romanization (a, ga) |
| `mongolian` | Монгол тайлбар |
| `hskLevel` | `KR1`, `KR-PRE`, … |
| `exampleChinese` | Номын жишээ (아) |
| `exampleMongolian` | Жишээний MN тайлбар |
| `skillTags` | `["hangul_vowel"]`, `["country"]`, … (optional, distractor-д) |

Section-ийн vocab-ийг `skillTags` + `lessonSection` (optional metadata object) ашиглан ялгана.

---

## 9. subtitles.json (багшийн урсгал)

```json
[
  {
    "start": "00:00",
    "end": "00:30",
    "role": "teach",
    "lessonSection": "vowels-basic",
    "chinese": "오늘 기본 모음 여섯 개를 배웁니다.",
    "pinyin": "Oneul gibon moeum yeoseot gae-reul baeumnida.",
    "mongolian": "Өнөөдөр 6 үндсэн эгшиг сурна. Эхлээд сонсоод, дараа нь давтана."
  },
  {
    "start": "00:31",
    "end": "00:45",
    "role": "warning",
    "lessonSection": "vowels-basic",
    "chinese": "ㅓ와 ㅗ를 헷갈리지 마세요.",
    "pinyin": "Eo-wa o-reul hetgalliji maseyo.",
    "mongolian": "ㅓ (eo) ба ㅗ (o)-г бүү андуураарай — монгол «ө» vs «о»-той адил анхаарах."
  }
]
```

`role`: `teach` | `example` | `warning` | `pronunciation`

---

## 10. quiz.json — type vs gameType

### Зөвшөөрөгдсөн `type` (quiz import)

Зөвхөн:

- `multiple_choice`
- `cloze`

### Game тусдаа

App game (`match`, `translate`, `arrange`, …) нь **quiz.json-д `type` биш**. Хэрэв author тэмдэглэл хэрэгтэй бол:

```json
{
  "id": "G001",
  "gameType": "translate",
  "lessonSection": "vowels-basic",
  "note": "App generates from vocabulary — do not import as quiz row"
}
```

**Import дүрэм:** `gameType` талбартай мөр **quiz болгон import хийгдэхгүй** (warning). Game нь vocabulary + lesson context-оор app дээр автоматаар үүснэ.

### Quiz мөрний жишээ (section дасгал)

```json
{
  "id": "Q001",
  "type": "multiple_choice",
  "phase": "check",
  "lessonSection": "vowels-basic",
  "orderIndex": 1,
  "question": "「ㅓ」-ийн romanization аль вэ?",
  "options": ["eo", "o", "u", "eu"],
  "correctAnswer": "eo",
  "explanation": "ㅓ → eo. ㅗ (o)-той бүү андуураарай.",
  "skillTags": ["hangul_vowel_romanization"],
  "difficulty": "easy"
}
```

### Distractor ангилал (`skillTags`)

| Ангилал | skillTags | Wrong options |
|---------|-----------|---------------|
| Эгшиг | `hangul_vowel`, `hangul_vowel_romanization` | Бусад эgшиг (eo/o/u/eu) |
| Гийгүүлэгч | `hangul_consonant` | ㄱ/ㅋ/ㄲ гэх мэт |
| Үе | `hangul_syllable` | 가/카/까 |
| Улс | `country` | Бусад улс |
| Мэргэжил | `profession` | Бусад мэргэжил |
| Дүрэм | `grammar` | Ижил төстэй дүрэм |

---

## 11. Сурагчийн app урсгал (одоогийн)

| Алхам | App зам |
|-------|---------|
| Textbook сурах | `/lessons/{id}/watch` → textbook UI |
| Үгийн сан | `/lessons/{id}/vocabulary` |
| Section quiz | `/lessons/{id}/quiz` (skillTags-ээр сайжирсан сонголт) |
| Game | `/games/*?lessonId={id}` (PreLesson: Үсэг таних, Авиа сонгох, …) |

Video/shadowing/stroke game зөвхөн media asset байвал харуулна.

---

## 12. Багц бэлтгэх checklist

- [ ] `manifest.json` + `lesson.json` + `vocabulary.json` + `quiz.json` root дээр байна
- [ ] `index.html` багшийн бүрэн тайлбартай (QA)
- [ ] Quiz эхний асуулт нь teach/warning-ийн **дараа** (`phase: check`)
- [ ] Practice асуултууд section-тэй таарсан `skillTags`-тай
- [ ] `gameType` мөр quiz import-д ороогүй
- [ ] Wrong options адил ангиллын confusable pairs
- [ ] `lessonType` / `contentType` зөв (`prelesson` + `textbook`)
- [ ] ZIP-ийг `/admin/import` дээр parse → import as draft → preview

---

## 13. Жишээ package

- PreLesson minimal: [`content/templates/korean-hangul-zip-example/`](./content/templates/korean-hangul-zip-example/)
- Field reference: [`content/templates/lesson-zip-package/`](./content/templates/lesson-zip-package/)

---

## Related

- [LESSON_ZIP_IMPORT_FORMAT.md](./LESSON_ZIP_IMPORT_FORMAT.md)
- [KOREAN_BOOK_ZIP_WORKFLOW.md](./KOREAN_BOOK_ZIP_WORKFLOW.md)
- [KOREAN_PRELESSON_IMPORT_PLAN.md](./KOREAN_PRELESSON_IMPORT_PLAN.md)
- [PRACTICE_GAMES.md](./PRACTICE_GAMES.md)
