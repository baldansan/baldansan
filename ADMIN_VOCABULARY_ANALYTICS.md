# Admin vocabulary analytics — Buunduu Surtsgaay

Phase 5 Step 19: vocabulary engagement — most learned, least learned, and never learned words.

---

## Route

| Route | Purpose |
|-------|---------|
| `/admin/analytics/vocabulary` | Fleet-wide vocabulary engagement insights |

Protected by **AdminGuard**.

Optional query: `?lesson={lessonId}` pre-filters by lesson.

---

## Metrics

Per vocabulary word (`vocabulary_words` joined with `user_vocabulary_progress`):

| Field | Meaning |
|-------|---------|
| Learned count | Rows with `status = learned` for this word |
| Unique learners | Distinct `user_id` on learned rows |
| Engagement | `high` / `medium` / `low` / `none` based on learned count |
| Never learned | Words with 0 learned rows |

Engagement bands (learned count):

| Level | Rule |
|-------|------|
| none | 0 |
| low | 1–2 |
| medium | 3–5 |
| high | 6+ |

Overview summary:

- Total vocabulary words
- Learned rows (all progress rows)
- Unique learned words
- Words never learned

---

## How admins can use this

1. **Find ignored words** — Filter engagement `none` or sort “least learned” to see vocabulary learners skip.
2. **Validate lesson focus** — Compare most vs least learned within a lesson (`?lesson=` filter).
3. **Improve content** — Add examples, subtitles, or quiz coverage for low-engagement words.
4. **Cross-link to edit** — Each row links to lesson analytics and `/admin/lessons/{id}/edit`.

---

## Data source

| Table | Usage |
|-------|--------|
| `vocabulary_words` | Word text, HSK level, lesson id |
| `user_vocabulary_progress` | Learned status per user |
| `lessons` | Lesson titles |

Helpers in [lib/supabase/admin-analytics.ts](./lib/supabase/admin-analytics.ts):

- `getVocabularyInsightsOverview()`
- `getVocabularyEngagementAnalytics()`
- `getVocabularyEngagementByLesson(lessonId, snapshot)`
- `getMostLearnedVocabulary(limit)`
- `getLeastLearnedVocabulary(limit)`

---

## Limitations

1. **RLS** — Vocabulary progress is user-scoped by default. Admin may see zeros or own activity only until admin read policies are added.

2. **Learned vs learning** — Only `status = learned` counts toward engagement (matches learner “marked learned” behavior).

3. **No anonymous vocabulary in Supabase** — Guest learned words stay in localStorage until sync after login.

---

## Generate better examples for weak vocabulary

On `/admin/analytics/vocabulary`:

1. Filter by **engagement: none** or **low**, or open **Least learned / never learned**.
2. Click **Generate vocabulary improvement prompt** on a word row.
3. Paste into ChatGPT/Cursor — response includes improved `vocabulary` entry and optional `quizQuestions`.
4. Import via bulk import (append) or update manually in the vocabulary editor.

Prompt includes Chinese, pinyin, Mongolian, HSK level, and learned count context.

See [AI_ASSISTED_CONTENT_WORKFLOW.md](./AI_ASSISTED_CONTENT_WORKFLOW.md).

---

## Related docs

- [ADMIN_QUESTION_ANALYTICS.md](./ADMIN_QUESTION_ANALYTICS.md) — question-level quiz analytics
- [ADMIN_LEARNING_ANALYTICS.md](./ADMIN_LEARNING_ANALYTICS.md) — per-lesson analytics
- [ADMIN_ANALYTICS.md](./ADMIN_ANALYTICS.md) — main admin dashboard
