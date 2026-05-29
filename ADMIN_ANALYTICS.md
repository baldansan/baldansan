# Admin analytics — Buunduu Surtsgaay

Phase 5 Step 17: `/admin` analytics and content metrics dashboard.

---

## Dashboard route

**`/admin`** — server-rendered analytics for admins (protected by `AdminGuard`).

Sections:

| Section | Metrics |
|---------|---------|
| Overview | Total, available, draft, archived lessons |
| Content health | Subtitle/vocab/quiz totals; missing counts; ready to publish |
| Media readiness | Ready / pending / missing; thumbnail / video / audio counts |
| Learner progress | Users with progress, completed lessons, learned words, quiz attempts, avg score |
| Needs attention | Lessons with content or media gaps → edit links |
| Recent activity | Latest quiz attempts and lesson progress rows |
| Quick actions | Lesson Builder, Content QA, create lesson, review, home |

Helper: [lib/supabase/admin-analytics.ts](./lib/supabase/admin-analytics.ts)

**Per-lesson learning analytics (Step 18):** [ADMIN_LEARNING_ANALYTICS.md](./ADMIN_LEARNING_ANALYTICS.md) — `/admin/analytics` and `/admin/analytics/lessons/{id}`.

**Question & vocabulary insights (Step 19):**

| Route | Doc |
|-------|-----|
| `/admin/analytics/questions` | [ADMIN_QUESTION_ANALYTICS.md](./ADMIN_QUESTION_ANALYTICS.md) |
| `/admin/analytics/vocabulary` | [ADMIN_VOCABULARY_ANALYTICS.md](./ADMIN_VOCABULARY_ANALYTICS.md) |

New quiz attempts store detailed per-question answers in `user_quiz_attempts.answers` (JSON array). Older attempts without answer details are handled gracefully.

---

## How metrics are calculated

### Lesson status

From `lessons` via `getAdminLessonsByCourseId("hsk5")` and publish status:

- **draft** / **available** / **archived** counts
- **total** = sum

### Content totals

Primary: aggregate per-lesson QA reports (`getHsk5LessonsWithQa`).

Optional refinement: `count(*)` on `subtitle_lines`, `vocabulary_words`, `quiz_questions` when admin RLS allows (uses server Supabase client).

### Content QA

Per lesson from full lesson QA reports:

| Metric | Rule |
|--------|------|
| Missing subtitles | `subtitleCount === 0` |
| Missing vocabulary | `vocabularyActual === 0` |
| Missing quiz | `quizActual === 0` |
| Ready to publish | subtitles > 0, vocabulary ≥ 5, quiz ≥ 3 |
| Needs review | QA status `needs_review` |

### Media readiness

From lesson media fields:

| Metric | Rule |
|--------|------|
| Media ready | `media_status === ready` and video URL set |
| Media pending | `media_status === pending` |
| Media missing | otherwise |
| With thumbnail / video / audio | URL field non-empty |

### Learner progress

Reads (server client):

- `user_lesson_progress`
- `user_vocabulary_progress`
- `user_quiz_attempts`

Aggregates:

- Distinct users with lesson progress
- Rows with `status = completed`
- Vocabulary rows with `status = learned`
- Quiz attempt count and average `percentage`

### Needs attention

Lessons flagged when any issue applies (missing subtitles/vocab/quiz, low counts, media missing, or generic needs review). Links to `/admin/lessons/{id}/edit`.

### Recent activity

- `getRecentQuizAttempts(8)` — latest from `user_quiz_attempts`
- `getRecentLessonProgress(8)` — latest from `user_lesson_progress`

---

## Tables read

| Table | Used for |
|-------|----------|
| `lessons` | Status, media fields |
| `subtitle_lines` | Optional total count |
| `vocabulary_words` | Optional total count |
| `quiz_questions` | Optional total count |
| `user_lesson_progress` | Learner metrics + recent activity |
| `user_vocabulary_progress` | Learned word count |
| `user_quiz_attempts` | Attempt count, average score, recent rows |

Content child tables and lessons use **admin RLS** from [002_admin_content_policies.sql](./supabase/policies/002_admin_content_policies.sql).

---

## RLS limitations

Progress tables currently use **select own row only** policies ([001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql)):

- Admin dashboard may show **zeros** or **only the logged-in admin’s own** progress/quiz rows.
- Non-fatal warnings appear on the dashboard when queries fail or data appears empty.
- **No `service_role`** is used — by design.

**Future:** add admin read policies on progress tables, e.g.:

```sql
-- Example (not applied yet)
create policy "progress_admin_select_all"
  on public.user_quiz_attempts for select
  to authenticated using (public.is_admin());
```

Until then, treat learner metrics as indicative, not full-fleet analytics.

---

## `/admin/lessons` integration

Top summary row uses `getAdminLessonsPageSummary()`:

- Total lessons
- Needs review
- Ready to publish
- Media missing

---

## Future improvements

- Daily / weekly active learners
- Course completion rate and funnel
- Retention cohorts
- Per-lesson difficulty (quiz score distribution)
- Quiz question analytics (most missed items)
- Step 18: per-lesson progress breakdown
- Cached metrics / materialized views for large catalogs

---

## Related docs

- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
- [MEDIA_WORKFLOW.md](./MEDIA_WORKFLOW.md) — media readiness rules
- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — publish checklist
