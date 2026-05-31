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
├── subtitles.json         (optional)
├── audio/                 (optional)
├── images/                (optional)
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

## Import behavior

- Lesson is always saved as **draft**
- Warnings do **not** block import
- Critical errors block import (missing manifest, lesson, vocabulary, unknown profile, required profile sections)
- Profile metadata stored in `lessons.source_note` (`hskLevel`, `lessonProfile`, `hskTexts`, `hskWorkbook`, …)
- Korean importer is unchanged (`/admin/import/korean`)

See also: [CHINESE_HSK_IMPORT_PROFILES.md](./CHINESE_HSK_IMPORT_PROFILES.md)
