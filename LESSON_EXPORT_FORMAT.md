# Lesson export JSON format

Admins generate a full lesson backup on **`/admin/lessons/{lessonId}/edit`** → **Export lesson backup**.

Uses the same Supabase client + admin RLS as other editors (no `service_role`).

---

## Root object

```json
{
  "exportedAt": "2026-05-28T12:00:00.000Z",
  "lesson": { },
  "subtitles": [],
  "vocabulary": [],
  "quizQuestions": []
}
```

| Field | Purpose |
|-------|---------|
| `exportedAt` | ISO timestamp when export was generated |
| `lesson` | Metadata snapshot (camelCase) |
| `subtitles` | Timed subtitle lines (import-compatible) |
| `vocabulary` | Vocabulary words |
| `quizQuestions` | Quiz questions |

Rows are sorted by `order_index` in Supabase (export order matches playback/list order).

---

## Lesson metadata (`lesson`)

| Export field | Supabase column |
|--------------|-----------------|
| `id` | `lessons.id` |
| `courseId` | `course_id` |
| `title` | `title` |
| `chineseTitle` | `chinese_title` |
| `subtitle` | `subtitle` |
| `description` | `description` |
| `duration` | `duration` |
| `status` | `status` (`draft` / `available` / `archived`) |
| `orderIndex` | `order_index` |

`vocabulary_count` / `quiz_count` are not duplicated in export; use **Refresh counts** on the edit page after re-import.

---

## Subtitles

| Export field | Import field | DB column |
|--------------|--------------|-----------|
| `start` | `start` or `startTime` | `start_time` |
| `end` | `end` or `endTime` | `end_time` |
| `chinese` | `chinese` | `chinese` |
| `pinyin` | `pinyin` | `pinyin` |
| `mongolian` | `mongolian` | `mongolian` |

---

## Vocabulary

| Export field | Import field | DB column |
|--------------|--------------|-----------|
| `chinese` | `chinese` | `chinese` |
| `pinyin` | `pinyin` | `pinyin` |
| `mongolian` | `mongolian` | `mongolian` |
| `hskLevel` | `hskLevel` | `hsk_level` |
| `exampleChinese` | `exampleChinese` | `example_chinese` |
| `exampleMongolian` | `exampleMongolian` | `example_mongolian` |

---

## Quiz questions

| Export field | Import field | DB column |
|--------------|--------------|-----------|
| `type` | `type` | `type` |
| `question` | `question` | `question` |
| `options` | `options` | `options` (jsonb array) |
| `correctAnswer` | `correctAnswer` | `correct_answer` |
| `explanation` | `explanation` | `explanation` |

---

## Admin UI actions

1. **Generate export JSON** — loads lesson from Supabase and fills the textarea.
2. **Copy JSON** — copies to clipboard (textarea fallback if needed).
3. **Download JSON** — client-side download as `lesson-{lessonId}-backup.json`.
4. **Clear** — clears textarea and stats.

---

## Re-import content

Paste the same JSON (or a subset) into **Bulk import content** on the same or another lesson edit page.

| Block | Bulk import behavior |
|-------|----------------------|
| `lesson` | **Ignored** (warning only). Update metadata via **Save metadata** or create draft on `/admin/lessons/new`. |
| `exportedAt` | **Ignored** |
| `subtitles` | Imported |
| `vocabulary` | Imported |
| `quizQuestions` | Imported |

Choose **Append** or **Replace** before import. After import, run **Refresh counts** and **Content QA**.

See [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md) and [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md).

---

## Implementation

- [lib/supabase/admin-export.ts](./lib/supabase/admin-export.ts) — `getLessonExportPayload`, `buildLessonExportJson`
- [components/admin/lesson-export-card.tsx](./components/admin/lesson-export-card.tsx) — edit page UI
