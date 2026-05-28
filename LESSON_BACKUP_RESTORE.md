# Lesson backup, duplicate, and restore

Admin tools on **`/admin/lessons/{lessonId}/edit`** for safe content management. Uses anon key + admin JWT + RLS (no `service_role`).

---

## Safe workflow

1. **Create** draft (`/admin/lessons/new`) or **import** content (bulk import / editors)
2. **Content QA** — checks on edit page
3. **Export backup** — full JSON snapshot before risky changes
4. **Publish** when ready

Before **Replace** import or restore: always **export backup** first.

---

## Export backup

See [LESSON_EXPORT_FORMAT.md](./LESSON_EXPORT_FORMAT.md).

- **Generate export JSON** → copy or download `lesson-{id}-backup.json`
- Includes `lesson`, `subtitles`, `vocabulary`, `quizQuestions`, `exportedAt`

---

## Duplicate lesson

**Duplicate lesson** card copies the current lesson into a **new draft** lesson.

| Copied | Not copied |
|--------|------------|
| Metadata (title/description/subtitle/duration) | Source lesson row (unchanged) |
| All subtitle_lines | User progress |
| All vocabulary_words | Admin profiles |
| All quiz_questions | Auth data |
| order_index per row | |

| Field | Behavior |
|-------|----------|
| New ID | Required; must differ from source |
| Title / Chinese title | Editable; defaults to source + " Copy" |
| Status | Always `draft` on new lesson |
| Counts | Actual vocabulary/quiz row counts |

After success: open **`/admin/lessons/{newId}/edit`**.

Example: duplicate Lesson **5** → new ID **6** (draft).

---

## Restore from backup

**Restore from backup JSON** applies export backup to the **current** lesson.

| Option | Behavior |
|--------|----------|
| **Content only** | Imports arrays only; ignores `lesson` block |
| **Metadata + content** | Updates title/description/etc. from backup `lesson` (never changes lesson ID); then imports content. `available` in backup → saved as `draft` for safety. |
| **Append** | Keeps existing rows; new rows after current max `order_index` |
| **Replace** | Deletes current subtitles/vocabulary/quiz for this lesson, then imports backup |

**Replace** requires checkbox: *Би энэ үйлдлийг ойлгож байна.*

Lesson ID and user progress are never modified by restore.

---

## Bulk import replace safety

**Bulk import** → **Replace existing content**:

- Shows current row counts before import
- Warning + confirmation checkbox required
- Hint: export backup first

---

## Append vs replace

| Mode | Use when |
|------|----------|
| **Append** | Adding ChatGPT output to existing content |
| **Replace** | Full reset from backup JSON (destructive) |

Replace cannot be undone without a prior export backup.

---

## What is never copied or changed

- `user_progress` / learner progress tables
- `admin_profiles`
- Auth sessions
- Another lesson’s rows (duplicate creates new `lesson_id` only)

---

## Related docs

- [LESSON_EXPORT_FORMAT.md](./LESSON_EXPORT_FORMAT.md)
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md)
- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md)
- [lib/supabase/admin-duplicate.ts](./lib/supabase/admin-duplicate.ts)
- [lib/supabase/admin-restore.ts](./lib/supabase/admin-restore.ts)
