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

### Exported lesson JSON

Exported lesson JSON can be reused for import; the **`lesson`** metadata block and **`exportedAt`** are ignored by content import. Only `subtitles`, `vocabulary`, and `quizQuestions` are read. See [LESSON_EXPORT_FORMAT.md](./LESSON_EXPORT_FORMAT.md).

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

## Prompt generator workflow (Step 10)

On **`/admin/lessons/{id}/edit`** → **Lesson content prompt generator**:

1. Set HSK level, tone, subtitle/vocabulary/quiz counts, pinyin option.
2. **Generate prompt** → edit if needed → **Copy prompt**.
3. Paste into ChatGPT/Cursor → receive JSON only.
4. Paste JSON into **Bulk import** → **Validate** → **Import**.
5. Review **Import QA summary** on the same page.

See [LESSON_PROMPT_TEMPLATE.md](./LESSON_PROMPT_TEMPLATE.md) for a reusable master prompt.

---

## ChatGPT workflow (recommended)

1. Create draft lesson metadata in admin.
2. **Generate prompt** on edit page (or use master template).
3. Ask ChatGPT for strict JSON only (no markdown).
4. **Validate JSON** in bulk import — fix **errors** before import.
5. **Import** (warnings allowed).
6. **Import QA summary** — aim for **Ready to publish**.
7. **Admin preview** `?preview=admin` → **Publish**.

---

## QA rules (edit page)

| Badge | Meaning |
|-------|---------|
| **Ready to publish** | Metadata OK, subtitles > 0, vocabulary ≥ 5, quiz ≥ 3, no quiz answer mismatch, no missing Mongolian in subtitles/vocabulary |
| **Needs review** | Missing sections, duplicates, mismatches, or below minimum counts |
| **Missing content** | No subtitles, vocabulary, or quiz |

---

## Validation: errors vs warnings

**Errors (import blocked):**

- Invalid JSON syntax
- Missing required fields
- Duplicate vocabulary `chinese` in same JSON
- Duplicate subtitle time range (`start` + `end`)
- `correctAnswer` not in `options`
- Fewer than 2 quiz options

**Warnings (import allowed):**

- Missing pinyin on a line
- Missing HSK level on vocabulary
- Very short Mongolian translation
- Missing example sentences

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Markdown or code fences around JSON | Ask for JSON only; strip fences before paste |
| `correctAnswer` not in `options` | Copy exact option string |
| Missing Mongolian on subtitles/vocabulary | Required for publish |
| Duplicate Chinese vocabulary words | Remove duplicates in ChatGPT output |
| HSK level mismatch | Set `hskLevel` to target level (e.g. HSK5) |
| Trailing commas in JSON | Use a JSON validator |

---

## Related

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — end-to-end admin workflow
- [LESSON_PROMPT_TEMPLATE.md](./LESSON_PROMPT_TEMPLATE.md) — master ChatGPT prompt
- [templates/lesson-import-template.json](./templates/lesson-import-template.json) — full lesson file template (local TS authoring)
- [lib/supabase/admin-import.ts](./lib/supabase/admin-import.ts) — parse, validate, bulk import
- [lib/admin/import-qa.ts](./lib/admin/import-qa.ts) — QA rules
- [lib/admin/lesson-prompt.ts](./lib/admin/lesson-prompt.ts) — prompt builder
