# Lesson ZIP import format

Admin upload at **`/admin/import`**. Parses a ZIP package and imports lesson metadata, vocabulary, quiz, optional subtitles, and optional media into Supabase as **draft**.

Existing **JSON bulk import** on `/admin/lessons/{id}/edit` is unchanged.

---

## ZIP structure

```
lesson-package.zip
├── manifest.json          (required)
├── lesson.json            (required)
├── vocabulary.json        (required)
├── quiz.json              (required)
├── index.html             (optional — teacher HTML reference; not imported)
├── subtitles.json         (optional)
├── audio/                 (optional)
│   └── dialogue.mp3
└── images/                (optional)
    └── cover.png
```

**Korean packages:** see [KOREAN_LESSON_PACKAGE_SPEC.md](./KOREAN_LESSON_PACKAGE_SPEC.md) for Teach → Example → Warning → Practice flow, section tags, and `gameType` vs `type` rules.

Alias folder name `image/` is also accepted for images.

---

## manifest.json (required)

```json
{
  "packageVersion": "1.0",
  "courseId": "korean-1",
  "lessonId": "k-pre-01",
  "language": "ko-KR",
  "title": "PreLesson 01 — Үндсэн эгшиг",
  "mongolianTitle": "Хангыль унших суурь",
  "source": "Korean Book 1 packaging pipeline",
  "hasAudio": false,
  "hasImages": false
}
```

| Field | Required | Notes |
|-------|----------|-------|
| packageVersion | Yes | e.g. `1.0` |
| courseId | Yes | Must exist in CMS (e.g. `korean-1`, `hsk5`) |
| lessonId | Yes | Lesson primary key (e.g. `k-pre-01`, `k-hangul`) |
| language | Yes | `ko-KR`, `zh-CN`, etc. (metadata only in v1) |
| title | No | Fallback if lesson.json title missing |
| mongolianTitle | No | Preview label |
| source | No | Stored in `lessons.source_note` |
| hasAudio / hasImages | No | Informational flags |

---

## lesson.json (required)

```json
{
  "courseId": "korean-1",
  "title": "PreLesson 01 — Үндсэн эгшиг",
  "chineseTitle": "기본 모음",
  "subtitle": "Солонгосын 6 үндсэн эгшиг",
  "description": "ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ эgшгийг сурна.",
  "duration": "10 min",
  "status": "draft",
  "orderIndex": 0,
  "mediaStatus": "missing",
  "audioFile": "audio/sample.mp3",
  "thumbnailFile": "images/cover.png",
  "sourceNote": "ZIP import — draft"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| courseId | Yes | |
| title | Yes | |
| chineseTitle | Yes | Korean/Chinese display title |
| subtitle, description, duration | No | |
| status | No | Forced to **`draft`** on import |
| orderIndex | No | Integer ≥ 1 if set |
| mediaStatus | No | `missing`, `pending`, `ready` |
| audioFile | No | Path inside ZIP → `lessons.audio_url` after upload |
| thumbnailFile | No | Path inside ZIP → `lessons.thumbnail_url` |
| videoFile | No | Not auto-uploaded in v1 — set manually |

---

## vocabulary.json (required)

Array of rows (same fields as bulk JSON import):

```json
[
  {
    "chinese": "ㅏ",
    "pinyin": "a",
    "mongolian": "эгшиг «а»",
    "hskLevel": "KR1",
    "exampleChinese": "아",
    "exampleMongolian": "а",
    "audioFile": "audio/vowel-a.mp3"
  }
]
```

**Korean convention:** `chinese` = Hangul, `pinyin` = romanization, `mongolian` = Mongolian meaning.

Per-word `audioFile` is validated but **not stored in DB** in v1 (schema has no per-vocab audio column). Listed in import warnings.

At least **one** vocabulary row required.

---

## quiz.json (required)

Array (may be empty with warning).

Supported types: **`multiple_choice`**, **`cloze`** only (same as bulk import).

**Do not** use app game modes as `type`. Rows with **`gameType`** are author notes only — import skips them (games generate from vocabulary in the app).

`correctAnswer` must match one of `options` (for `multiple_choice`).

Optional fields: `lessonSection`, `phase` (`check` | `practice`), `orderIndex`, `skillTags`, `difficulty`, `id`.

```json
[
  {
    "id": "Q001",
    "type": "multiple_choice",
    "phase": "check",
    "lessonSection": "vowels-basic",
    "question": "「ㅏ」-ийн romanization аль вэ?",
    "options": ["a", "o", "u", "i"],
    "correctAnswer": "a",
    "explanation": "ㅏ → a",
    "skillTags": ["hangul_vowel_romanization"],
    "difficulty": "easy"
  }
]
```

See [KOREAN_LESSON_PACKAGE_SPEC.md](./KOREAN_LESSON_PACKAGE_SPEC.md) for full Teach → Practice flow.

---

## subtitles.json (optional)

```json
[
  {
    "startTime": "00:00",
    "endTime": "00:06",
    "chinese": "기본 모음을 배웁시다.",
    "pinyin": "Gibon moeum-eul baeupsida.",
    "mongolian": "Үндсэн эgшгийг суръя."
  }
]
```

Aliases: `start`/`end` instead of `startTime`/`endTime`.

---

## Media folders

| Path | Storage target |
|------|----------------|
| `audio/*` | Supabase `lesson-media` bucket |
| `images/*` or `image/*` | Same bucket |

Storage path convention:

```
lesson-media/{courseId}/{lessonId}/audio/{filename}
lesson-media/{courseId}/{lessonId}/images/{filename}
```

If Storage upload fails (bucket missing, RLS, network):

- Text content still imports
- Warning shown in admin UI
- `media_status` stays `missing` or `pending`

---

## Import behavior

1. Parse + validate ZIP in browser (JSZip)
2. Create lesson row if missing, else update metadata
3. **Replace** existing subtitle/vocabulary/quiz content (same as bulk replace)
4. Upload media files (best effort)
5. Set `audio_url` / `thumbnail_url` from `lesson.json` references or first uploaded file
6. Log admin activity (`bulk_import_completed` with `source: zip_package`)

---

## Related

- [KOREAN_BOOK_ZIP_WORKFLOW.md](./KOREAN_BOOK_ZIP_WORKFLOW.md)
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md) — JSON bulk paste format
- [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md)
- `content/templates/lesson-zip-package/` — field examples
- `content/templates/korean-hangul-zip-example/` — minimal Korean Hangul sample
