# Korean ZIP import format

Admin upload at **`/admin/import/korean`**.

Korean textbook packages use **Korean-native field names** (`korean`, `romanization`, `level`) that map to the shared database columns used by HSK lessons (`chinese`, `pinyin`, `hsk_level`).

---

## ZIP structure

```
korean-lesson.zip
├── manifest.json       (required)
├── lesson.json         (required)
├── vocabulary.json     (required)
├── quiz.json           (required)
├── subtitles.json      (optional)
├── practice.json       (optional — reference only in v1)
├── grammar.json        (optional — reference only in v1)
├── audio/              (optional)
└── images/             (optional)
```

Template examples: `content/templates/korean-lesson-zip-package/`

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

`audioFile` per row is noted but not stored in DB v1.

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
- Audio/images missing (TTS fallback available)
- Romanization missing on some rows
- `skillTags` / `difficulty` missing
- `practice.json` / `grammar.json` present (reference only)

---

## Import behavior

1. Validates with Korean-specific rules (no Chinese pinyin/HSK/icon warnings).
2. Auto-creates **draft lesson** if missing (numeric or text `lessons.id`).
3. Does **not** auto-create `korean-1` course — run `content/korean-book-1/create-korean-course.sql` first.
4. Imports vocabulary, quiz, optional subtitles as **draft**.

---

## Related docs

- [KOREAN_BOOK_ZIP_WORKFLOW.md](./KOREAN_BOOK_ZIP_WORKFLOW.md)
- [LESSON_ZIP_IMPORT_FORMAT.md](./LESSON_ZIP_IMPORT_FORMAT.md) — Chinese/HSK path
- [KOREAN_LESSON_PACKAGE_SPEC.md](./KOREAN_LESSON_PACKAGE_SPEC.md)
