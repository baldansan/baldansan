# Admin Task Center — Buunduu Surtsgaay

Phase 5 Step 22: in-app content review queue — no external email or push notifications.

---

## What it does

**`/admin/tasks`** aggregates actionable work from live Supabase data:

- Missing or incomplete lesson content
- QA and release workflow blockers
- Media gaps
- Analytics-driven improvement opportunities (low quiz scores, difficult questions, low vocabulary engagement)
- Backup reminders before publish
- System notes (RLS limits, migrations)

Tasks are **generated on each page load**. **Step 23** adds optional persistence when admins act on tasks — see [ADMIN_TASK_MANAGEMENT.md](./ADMIN_TASK_MANAGEMENT.md).

---

## Route

| Route | Purpose |
|-------|---------|
| `/admin/tasks` | Full task center with filters |
| `/admin/tasks?lessonId=5` | Filter tasks for one lesson |

Also integrated on:

- `/admin` — summary + top 5 urgent tasks
- `/admin/lessons/{id}/edit` — top 3 tasks for the lesson
- `/admin/lesson-builder` — Step 9 task review for selected lesson
- `/admin/analytics` — link to generated tasks

---

## Task shape

```ts
{
  id: string
  category: "content" | "qa" | "media" | "release" | "analytics" | "backup" | "system"
  severity: "critical" | "warning" | "info" | "success"
  title: string
  description: string
  lessonId?: string
  actionLabel?: string
  actionHref?: string
  secondaryActionLabel?: string
  secondaryActionHref?: string
  createdFrom: string
}
```

---

## Categories

| Category | Examples |
|----------|----------|
| **content** | No subtitles, vocabulary, or quiz; below minimum counts |
| **qa** | QA failed, needs review, in review |
| **media** | Media missing/pending, no video on published lesson, no thumbnail |
| **release** | Ready to approve/publish, status mismatches |
| **analytics** | Low quiz score, no attempts, low completion, difficult questions, low vocab engagement |
| **backup** | Export JSON recommended before publish |
| **system** | RLS progress limits, Supabase not configured, migration notes |

---

## Severity rules (summary)

| Severity | Typical triggers |
|----------|------------------|
| **critical** | Zero subtitles/vocabulary/quiz; QA failed; publish vs release status mismatch |
| **warning** | Below min vocab/quiz; media missing; ready to approve; low analytics scores |
| **info** | Media pending; no quiz attempts; backup reminder; in review |
| **success** | Ready to publish |

Content minimums match publish gates: **≥5 vocabulary**, **≥3 quiz questions** ([import-qa.ts](./lib/admin/import-qa.ts)).

Analytics thresholds: average quiz score **< 70%**, difficult question accuracy **< 70%**, completion **< 40%** (when enough data).

---

## Data sources

| Source | Used for |
|--------|----------|
| `getHsk5LessonsWithQa()` | Content, media, release per lesson |
| `getLessonAnalyticsOverview()` | Per-lesson quiz/completion metrics |
| `getQuestionLevelAnalytics()` | Difficult questions |
| `getVocabularyEngagementAnalytics()` | Low engagement words |
| `calculateReleaseReadiness()` | Approve/publish gates |

Helpers: [lib/admin/task-generator.ts](./lib/admin/task-generator.ts), [lib/supabase/admin-tasks.ts](./lib/supabase/admin-tasks.ts).

If RLS blocks progress tables, content/media/release tasks still appear plus a **system** warning task.

---

## Example tasks

| Task | Primary action |
|------|----------------|
| Lesson 5 has no quiz questions | Edit lesson → `/admin/lessons/5/edit` |
| Lesson 5 ready to publish | Release controls → edit `#release-readiness` |
| Lesson 1 low average quiz score | Analytics → `/admin/analytics/lessons/1` |
| Media missing | Upload media → edit page |
| Export backup recommended | Edit & export → edit page |

---

## Persistent task workflow (Step 23)

When an admin **Start**, **Resolve**, **Dismiss**, or **Save details**, the task is upserted into `public.admin_tasks` by stable `task_key`.

- **Active** filter (default): open + in_progress generated tasks
- **Dismissed** / **Resolved**: history; hidden from Active
- Priority, due date, admin note stored on the row

Full guide: [ADMIN_TASK_MANAGEMENT.md](./ADMIN_TASK_MANAGEMENT.md)  
Migration: [supabase/migrations/006_admin_tasks.sql](./supabase/migrations/006_admin_tasks.sql)

**Future (Step 24+):** activity log, assignee UI, external notifications.

---

## Daily workflow

1. Open **`/admin/tasks`** (or dashboard task preview).
2. Filter **Needs action** (critical + warning).
3. Fix content/media on edit pages.
4. Approve and publish when **Ready to publish** tasks appear.
5. Review analytics tasks after learners use published lessons.

See also [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) and [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md).

---

## Testing with Lesson 5

1. Sign in as admin → `/admin/tasks`.
2. Search `5` or open `/admin/tasks?lessonId=5`.
3. Confirm tasks match lesson state (content gaps, media, release, analytics).
4. Use action buttons → edit, analytics, or release checklist.
5. Check `/admin/lessons/5/edit` — **Tasks for this lesson** card at top.
6. Check `/admin/lesson-builder` — select Lesson 5 → Step 9 task review.

---

## Security

- Admin routes protected by `AdminGuard`
- Anon key + admin JWT + RLS only — no `service_role` in the app
