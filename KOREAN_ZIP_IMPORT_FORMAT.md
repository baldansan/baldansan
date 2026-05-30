# Korean ZIP import format

Admin upload at **`/admin/import/korean`** only.

**Do not** upload Korean packages on `/admin/import/chinese` — the importer will detect the mismatch and redirect you.

Chinese/HSK packages use **`/admin/import/chinese`**. Start at **`/admin/import`** to choose the correct track.

---

## ZIP structure

```
korean-lesson.zip
├── manifest.json       (required)
├── lesson.json         (required)
├── vocabulary.json     (required)
├── quiz.json           (required)
├── subtitles.json      (optional)
├── practice.json         (optional — reference only)
├── grammar.json          (optional — reference only)
├── teaching-images.json  (optional — merged with lesson.json teachingImages)
├── audio/                (optional)
└── images/               (optional)
```

Template examples: `content/templates/korean-lesson-zip-package/`

---

## subtitles.json

Supports **timed** subtitles and **teaching lines** (no timestamps required).

Timed:
```json
{
  "startTime": "00:00",
  "endTime": "00:04",
  "korean": "안녕하세요",
  "romanization": "annyeonghaseyo",
  "mongolian": "Сайн байна уу"
}
```

Teaching line (timestamps optional):
```json
{
  "order": 1,
  "section": "한글 гэж юу вэ?",
  "mongolian": "Хангыль гэж юу вэ?",
  "example": "ㅎ + ㅏ + ㄴ = 한"
}
```

Teaching lines import with synthetic short timestamps for storage; missing subtitles is **info only**.

---

## teaching-images.json

Optional array (single object is normalized to array):

```json
[
  {
    "type": "diagram",
    "title": "한글 үеийн бүтэц",
    "file": "images/hangul-block.png",
    "caption": "ㅎ + ㅏ + ㄴ = 한",
    "order": 1
  }
]
```

Merged with `lesson.json` `teachingImages` on import.

---

## Validation: errors vs warnings vs info

**Critical errors (import blocked):**
- Missing manifest.json, lesson.json, vocabulary.json, or quiz.json
- Missing courseId or lesson title
- Vocabulary row missing `korean` or `mongolian`
- Quiz `correctAnswer` not in `options`
- Malformed required JSON

**Warnings (import allowed):**
- Romanization missing on some vocabulary rows
- skillTags / difficulty missing on quiz
- Example sentence missing
- Teaching subtitles without timestamps
- practice.json / grammar.json present (reference only)
- Media upload failures

**Info (non-blocking):**
- Audio байхгүй — төхөөрөмжийн TTS fallback ашиглана.
- Images байхгүй — заавал биш.
- subtitles.json байхгүй — Hangul/prelesson OK

---

## manifest.json

```json
{
  "packageVersion": "1.0",
  "language": "ko-KR",
  "courseId": "korean-1",
  "lessonId": "kr-0-1-vowels-basic",
  "lessonType": "hangul",
  "title": "KR-0-1 — Үндсэн эгшиг",
  "targetTitle": "기본 모음",
  "mongolianTitle": "Үндсэн эгшиг",
  "source": "Монгол хүнд зориулсан Солонгос хэлний цогц сурах бичиг 1"
}
```

---

## lesson.json

| Field | Required | Maps to |
|-------|----------|---------|
| `courseId` | Yes | `lessons.course_id` |
| `title` | Yes | `lessons.title` (Mongolian preferred) |
| `targetTitle` or `koreanTitle` | Yes | `lessons.chinese_title` |
| `mongolianTitle` | Recommended | subtitle / display |
| `description` | Optional | `lessons.description` |
| `lessonType` | Recommended | stored in `source_note` |
| `duration` | Optional | `lessons.duration` |
| `status` | Optional | forced to `draft` on import |
| `orderIndex` | Optional | `lessons.order_index` |
| `mediaStatus` | Optional | `lessons.media_status` |
| `audioFile` | Optional | `lessons.audio_url` (lesson-level audio in `audio/`) |
| `thumbnailFile` | Optional | `lessons.thumbnail_url` |
| `teachingImages` | Optional | Stored in `source_note` — array of `{ type, title, file, caption? }` |

---

## Media folders

```
audio/
  vowel-a.mp3
  vowel-eo.mp3
  syllable-ga.mp3
  word-hanguk.mp3
images/
  hangul-block.png
  vowels-chart.png
  consonants-chart.png
  batchim-chart.png
  similar-sounds.png
```

Files under `audio/` and `images/` upload to the `lesson-media` Storage bucket on import. Upload failures keep text content and show a warning.

---

## vocabulary.json

| Korean field | DB column |
|--------------|-----------|
| `korean` | `chinese` |
| `romanization` | `pinyin` |
| `mongolian` | `mongolian` |
| `level` | `hsk_level` (default `KR-Beginner`) |
| `exampleKorean` | `example_chinese` |
| `exampleMongolian` | `example_mongolian` |
| `audioFile` | Optional — mapped in `source_note` `vocabAudio` JSON (plays before TTS) |
| `mongolianPronunciation` | Optional — stored in `source_note` `vocabPronMn` JSON (UI hint) |
| `pronunciationMn` | Alias for `mongolianPronunciation` |
| `pronunciationHintMn` | Alias for `mongolianPronunciation` |

Example row:

```json
{
  "korean": "가",
  "romanization": "ga",
  "mongolianPronunciation": "га",
  "mongolian": "ㄱ + ㅏ нийлсэн үе"
}
```

## lesson.json teachingImages example

```json
{
  "teachingImages": [
    {
      "type": "diagram",
      "title": "한글 үеийн бүтэц",
      "file": "images/hangul-block.png",
      "caption": "ㅎ + ㅏ + ㄴ = 한"
    }
  ]
}
```

---

## quiz.json

Supported types: `multiple_choice`, `cloze`.

| Field | Required |
|-------|----------|
| `type` | Yes |
| `question` | Yes |
| `options` | Yes for multiple_choice |
| `correctAnswer` | Yes (must be in options) |
| `explanation` | Recommended |
| `skill` / `skillTags` | Optional (warning only) |
| `difficulty` | Optional (warning only) |
| `gameType` | Skipped — app games generate from vocabulary |

---

## Validation (Korean-specific)

**Critical errors (block import):**
- Missing manifest, lesson, vocabulary, or quiz
- Missing `courseId` or `lessonId`
- `correctAnswer` not in `options`
- Missing Korean text or Mongolian meaning on vocabulary rows

**Non-blocking warnings:**
- Audio байхгүй — TTS fallback ашиглана.
- Images байхгүй — заавал биш.
- Romanization missing on some rows
- `skillTags` / `difficulty` missing
- `practice.json` / `grammar.json` present (reference only)

---

## Import behavior

1. Validates with Korean-specific rules (no Chinese pinyin/HSK/icon warnings).
2. Auto-creates **draft lesson** if missing (numeric or text `lessons.id`).
3. Does **not** auto-create `korean-1` course — run `content/korean-book-1/create-korean-course.sql` first.
4. Imports vocabulary, quiz, optional subtitles as **draft**.
5. Uploads `audio/` and `images/` to Storage when present; teaching image URLs and per-word audio map saved in `source_note`.

---

## Related docs

- [KOREAN_BOOK_ZIP_WORKFLOW.md](./KOREAN_BOOK_ZIP_WORKFLOW.md)
- [LESSON_ZIP_IMPORT_FORMAT.md](./LESSON_ZIP_IMPORT_FORMAT.md) — Chinese/HSK path
- [KOREAN_LESSON_PACKAGE_SPEC.md](./KOREAN_LESSON_PACKAGE_SPEC.md)
