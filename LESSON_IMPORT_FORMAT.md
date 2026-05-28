# Lesson bulk import JSON format

Admins paste JSON on **`/admin/lessons/{lessonId}/edit`** → **Bulk import content** to load subtitles, vocabulary, and quiz questions into Supabase in one action.

No file upload — paste only. Uses the same Supabase client + admin RLS as manual editors (no `service_role`).

---

## Root object

```json
{
  "subtitles": [],
  "vocabulary": [],
  "quizQuestions": []
}
```

All three keys are optional. Omit a key or use `[]` to skip that section.

### Key aliases

| Canonical | Aliases |
|-----------|---------|
| `subtitles` | `subtitleLines` |
| `vocabulary` | `words` |
| `quizQuestions` | `quiz` |

---

## Subtitles

Each item:

| Field | Required | Aliases |
|-------|----------|---------|
| `chinese` | Yes | — |
| `mongolian` | Yes | — |
| `start` | Yes | `startTime` |
| `end` | Yes | `endTime` |
| `pinyin` | No | — |

Example:

```json
{
  "start": "00:00",
  "end": "00:03",
  "chinese": "你为什么不说？",
  "pinyin": "Nǐ wèishénme bù shuō?",
  "mongolian": "Чи яагаад хэлээгүй юм бэ?"
}
```

Maps to `subtitle_lines`: `start_time`, `end_time`, `chinese`, `pinyin`, `mongolian`, `order_index`.

---

## Vocabulary

Each item:

| Field | Required | Aliases |
|-------|----------|---------|
| `chinese` | Yes | — |
| `mongolian` | Yes | — |
| `pinyin` | No | — |
| `hskLevel` | No | `hsk_level` |
| `exampleChinese` | No | `example_chinese` |
| `exampleMongolian` | No | `example_mongolian` |

Example:

```json
{
  "chinese": "为什么",
  "pinyin": "wèishénme",
  "mongolian": "яагаад",
  "hskLevel": "HSK2",
  "exampleChinese": "你为什么不说？",
  "exampleMongolian": "Чи яагаад хэлээгүй юм бэ?"
}
```

Maps to `vocabulary_words`. After import, `lessons.vocabulary_count` is refreshed.

---

## Quiz questions

Each item:

| Field | Required | Aliases |
|-------|----------|---------|
| `type` | Yes | `multiple_choice` or `cloze` |
| `question` | Yes | — |
| `options` | Yes (≥ 2 strings) | JSON array |
| `correctAnswer` | Yes | `correct_answer` |
| `explanation` | No | — |

For `multiple_choice`, `correctAnswer` must match one of `options`.

Example:

```json
{
  "type": "multiple_choice",
  "question": "“为什么” гэдэг үгийн зөв утга аль вэ?",
  "options": ["яагаад", "хаана", "хэзээ", "хэн"],
  "correctAnswer": "яагаад",
  "explanation": "“为什么” нь why буюу яагаад гэсэн утгатай."
}
```

Maps to `quiz_questions`. After import, `lessons.quiz_count` is refreshed.

---

## Import modes

| Mode | Behavior |
|------|----------|
| **Append** (default) | Keeps existing rows; new rows get `order_index` after current max |
| **Replace** | Deletes all `subtitle_lines`, `vocabulary_words`, and `quiz_questions` for this lesson only, then inserts |

Replace never touches other lessons or user progress tables.

---

## Full example

```json
{
  "subtitles": [
    {
      "start": "00:00",
      "end": "00:03",
      "chinese": "你为什么不说？",
      "pinyin": "Nǐ wèishénme bù shuō?",
      "mongolian": "Чи яагаад хэлээгүй юм бэ?"
    }
  ],
  "vocabulary": [
    {
      "chinese": "为什么",
      "pinyin": "wèishénme",
      "mongolian": "яагаад",
      "hskLevel": "HSK2",
      "exampleChinese": "你为什么不说？",
      "exampleMongolian": "Чи яагаад хэлээгүй юм бэ?"
    }
  ],
  "quizQuestions": [
    {
      "type": "multiple_choice",
      "question": "“为什么” гэдэг үгийн зөв утга аль вэ?",
      "options": ["яагаад", "хаана", "хэзээ", "хэн"],
      "correctAnswer": "яагаад",
      "explanation": "“为什么” нь why буюу яагаад гэсэн утгатай."
    }
  ]
}
```

---

## ChatGPT workflow (recommended)

1. Generate timed **subtitles** (Chinese, pinyin, Mongolian).
2. Generate **vocabulary** from the episode.
3. Generate **quiz** (multiple choice + cloze).
4. Combine into one JSON object (use aliases if needed).
5. Open `/admin/lessons/{id}/edit` → paste → **Validate JSON**.
6. Choose **Append** or **Replace** → **Import content**.
7. Check **Content QA** at `/admin/lessons`.
8. **Publish** when metadata + content are complete.

---

## Validation errors

The UI shows friendly messages for:

- Invalid JSON syntax
- Non-array sections
- Missing required fields per item
- Quiz with fewer than 2 options
- `correctAnswer` not in `options` (multiple choice)

---

## Related

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — end-to-end admin workflow
- [templates/lesson-import-template.json](./templates/lesson-import-template.json) — full lesson file template (local TS authoring)
- [lib/supabase/admin-import.ts](./lib/supabase/admin-import.ts) — parse, validate, bulk import
