# Admin learning analytics — Buunduu Surtsgaay

Phase 5 Step 18: per-lesson learner progress, quiz performance, and vocabulary engagement.

---

## Routes

| Route | Purpose |
|-------|---------|
| `/admin/analytics` | All-lessons learning analytics table + filters |
| `/admin/analytics/lessons/{lessonId}` | Single-lesson analytics detail |

Both routes are under `/admin` and protected by **AdminGuard**.

---

## Metrics tracked

### Per lesson

| Metric | Source |
|--------|--------|
| Started users | Distinct `user_id` in `user_lesson_progress` for lesson |
| Completed | Progress rows with `status = completed` |
| Completion rate | completed / started × 100 |
| Learned vocabulary rows | `user_vocabulary_progress` joined via `vocabulary_words.lesson_id` |
| Unique learned words | Distinct `vocabulary_word_id` learned for lesson |
| Quiz attempts | Rows in `user_quiz_attempts` for lesson |
| Average / best quiz % | From attempt `percentage` |
| Latest quiz attempt | Max `created_at` |
| Content counts | Subtitles, vocabulary, quiz from QA reports |
| QA / media status | From lesson QA + media fields |

### Overview (`/admin/analytics`)

- Total lessons
- Total started (sum of per-lesson started — may double-count users across lessons)
- Total completed rows
- Total quiz attempts
- Average quiz score (mean of per-lesson averages)

---

## Tables read

| Table | Usage |
|-------|--------|
| `lessons` | Metadata via admin lesson fetch |
| `subtitle_lines`, `vocabulary_words`, `quiz_questions` | Content counts (via QA reports) |
| `vocabulary_words` | Map word id → lesson id for vocab progress |
| `user_lesson_progress` | Started / completed / recent activity |
| `user_vocabulary_progress` | Learned word counts |
| `user_quiz_attempts` | Scores, attempts, recent activity |

Helper: [lib/supabase/admin-analytics.ts](./lib/supabase/admin-analytics.ts)

---

## Filters (overview page)

- **Status:** all / draft / available / archived
- **Performance:** all / high completion (≥50%) / low completion (&lt;30%) / no activity
- **Search:** lesson id, title, Chinese title

### Needs attention

Flags lessons with:

- No quiz attempts
- Average score below 70% (when attempts exist)
- Low completion (&lt;30% with activity)
- Missing quiz or vocabulary content
- Media missing

---

## Limitations

1. **RLS on progress tables** — Current policies allow users to read **only their own** rows. Admins may see zeros or only their own activity until admin read policies are added. Non-fatal warnings appear on the dashboard.

2. **No anonymous cross-device analytics** — Guest progress in localStorage syncs only after login.

3. **Small catalog aggregation** — Metrics are computed in JS after fetching progress tables (fine for HSK5 scale).

4. **No service_role** — All reads use anon key + admin/user JWT.

---

## Future improvements (Step 19+)

- Question-level quiz analytics (hardest questions)
- Word difficulty / hardest vocabulary insights
- Daily active learners
- Retention and completion funnels
- Admin RLS policies for fleet-wide progress reads
- Cached / materialized metrics

---

## Related docs

- [ADMIN_ANALYTICS.md](./ADMIN_ANALYTICS.md) — main admin dashboard metrics
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
