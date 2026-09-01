# BUUNDUU Chinese HSK Package V1

Admin route: **`/admin/import/chinese`**

Package version: `BUUNDUU_CHINESE_HSK_PACKAGE_V1`

## ZIP structure

```
hsk-lesson.zip
├── manifest.json          (required)
├── lesson.json            (required)
├── vocabulary.json        (required)
├── quiz.json              (required for most profiles)
├── texts.json             (profile-dependent)
├── grammar.json           (optional)
├── notes.json             (optional)
├── workbook.json          (profile-dependent)
├── audio-manifest.json    (optional)
├── subtitles.json         (optional — 课文 highlight sync, see below)
├── listening_quiz_draft.json (optional — listening quiz, see below)
├── audio/                 (optional)
├── images/                (optional — cover.jpg → lesson thumbnail, see below)
├── README.md              (optional)
└── QA_REPORT.md           (optional — recommended)
```

Not every file is required for every HSK level. Validation uses **`lessonProfile`**.

## manifest.json example

```json
{
  "packageVersion": "BUUNDUU_CHINESE_HSK_PACKAGE_V1",
  "courseType": "chinese-hsk",
  "courseId": "hsk1",
  "lessonId": "hsk1-l01",
  "hskLevel": 1,
  "bookPart": null,
  "lessonNumber": 1,
  "lessonProfile": "hsk1-pronunciation-character-basic",
  "language": "zh-MN",
  "targetLanguage": "zh",
  "uiLanguage": "mn",
  "title": "HSK1 Lesson 1",
  "mongolianTitle": "HSK1 1-р хичээл",
  "source": {
    "textbook": "HSK Standard Course 1",
    "workbook": "HSK Standard Workbook 1",
    "teacherBook": "HSK Standard Teacher's Book 1",
    "textbookAudio": true,
    "workbookAudio": true
  },
  "verification": {
    "answerStatus": "official_verified",
    "answerSource": "Teacher's Book",
    "textStatus": "source_verified",
    "audioStatus": "mapped"
  }
}
```

## Profile inference

If `lessonProfile` is missing but `hskLevel` is set:

| HSK | Profile |
|-----|---------|
| 1 | `hsk1-pronunciation-character-basic` |
| 2 | `hsk2-basic-dialogue-sentence` |
| 3 | `hsk3-dialogue-reading-writing-review` |
| 4 | `hsk4-dialogue-shorttext-exam-workbook` |
| 5 | `hsk5-article-topic-vocab-nuance-writing` |
| 6 | `hsk6-advanced-reading-output-summary` |

## vocabulary.json example

```json
[
  {
    "chinese": "你好",
    "pinyin": "nǐ hǎo",
    "mongolian": "Сайн байна уу",
    "hskLevel": "HSK1",
    "exampleChinese": "你好！",
    "examplePinyin": "Nǐ hǎo!",
    "exampleMongolian": "Сайн байна уу!",
    "notes": "Амлалтын төрөл",
    "tags": ["greeting"],
    "sourceRef": "TB1-L01-V01"
  }
]
```

## HSK6 texts.json example (excerpt)

```json
{
  "unit": { "number": 1, "title": "..." },
  "warmup": { "mongolian": "..." },
  "longText": {
    "title": "...",
    "paragraphs": [
      { "chinese": "...", "pinyin": "...", "mongolian": "..." }
    ]
  },
  "summaryPrompt": {
    "mongolian": "Энэ бичвэрийг 100 үгээр товчлон бич."
  }
}
```

## subtitles.json — 课文 sentence sync

```json
[
  {
    "start": "00:03",
    "end": "00:07.5",
    "chinese": "尊敬的各位来宾，大家好。",
    "pinyin": "Zūnjìng de gèwèi láibīn, dàjiā hǎo.",
    "mongolian": "Эрхэм зочид оо, та бүхэнд энэ өдрийн мэнд хүргэе."
  }
]
```

- Aliases: `startTime`/`endTime` for `start`/`end`. Time format: `mm:ss`, `mm:ss.t`, `h:mm:ss` or plain seconds.
- Rows import into `subtitle_lines`. Required per row: `chinese`, `mongolian`, `start`, `end` (`pinyin` optional).
- **Player behavior:** while a 课文 audio plays in the lesson path (Богино эх), the sentence whose subtitle window contains the playback time is highlighted and scrolled into view. Matching is by **chinese text** (whitespace/punctuation-insensitive), so one flat list covers every 课文 in the lesson — copy each sentence's `zh` exactly from texts.json.
- One lesson typically has 2 texts with separate audio files; timestamps are per audio file (both texts can start at 00:00 — text matching keeps them apart).

## Listening quiz (quiz.json `audio` / listening_quiz_draft.json)

Two equivalent ways to ship listening questions:

**A. quiz.json items with `audio`:**

```json
{
  "id": "q31",
  "type": "choice",
  "question": "Сонсоод зөв хариуг сонго.",
  "audio": "audio/hsk5a-l12-wb-q01.mp3",
  "options": ["Нисэх буудалд", "Зочид буудалд", "Их сургуульд"],
  "answer": "Зочид буудалд",
  "explanation": "..."
}
```

**B. Separate `listening_quiz_draft.json`** (array or `{"questions": [...]}`) — items use `question`, `audio`, `options[]`, `answer` (option index `"0"`-based OR option text), `explanation_mn`. These rows are appended after quiz.json questions with `skillTags: ["listening"]`.

Import behavior:

- `audio` is a ZIP-relative path (`audio/...`) uploaded to Storage; the resulting public URL is written to `quiz_questions.audio_url` (migration 053). An absolute `https://` URL is also accepted and stored as-is.
- A missing audio file in the ZIP is a **warning** — the question imports without audio.
- Player: a question with `audio_url` shows a 🔊 Сонсох play/pause button above the options (both the lesson-path quiz stage and the standalone quiz page). TTS question read-out is suppressed for these questions.

## Lesson cover image (images/)

Thumbnail resolution order at import:

1. `lesson.json` `thumbnailFile` (ZIP path)
2. `media.json` image with `role: "hero"`
3. **Auto-detect:** `images/cover.*` → `hero.*` → `thumbnail.*` → the only image in the ZIP

The chosen image uploads to Storage and is written to `lessons.thumbnail_url` + `lessons.image_url`, clearing the admin "Image missing" flag. The cover renders on the lesson detail page and the course lesson list card (16:9, `images/cover.jpg` recommended, no text, app green-dark palette).

## Import behavior

- Lesson is always saved as **draft**
- Warnings do **not** block import
- Critical errors block import (missing manifest, lesson, vocabulary, unknown profile, required profile sections)
- Profile metadata stored in `lessons.source_note` (`hskLevel`, `lessonProfile`, `hskTexts`, `hskWorkbook`, …)
- Korean importer is unchanged (`/admin/import/korean`)

See also: [CHINESE_HSK_IMPORT_PROFILES.md](./CHINESE_HSK_IMPORT_PROFILES.md)
