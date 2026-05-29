# Admin Task Management — Buunduu Surtsgaay

Phase 5 Step 23: persistent in-app task management on top of the generated Task Center.

---

## Generated vs persisted

| Layer | Source | When |
|-------|--------|------|
| **Generated tasks** | Live lesson/content/analytics data | Every page load via `generateAdminTasks()` |
| **Persisted state** | `public.admin_tasks` table | When an admin takes action (Start, Resolve, Dismiss, Save details) |

Generated tasks are **not bulk-inserted** on page load. The database only gets a row when you interact with a task — this keeps the table small and meaningful.

---

## Migration

Run in Supabase SQL Editor:

**[supabase/migrations/006_admin_tasks.sql](./supabase/migrations/006_admin_tasks.sql)**

Requires `public.is_admin()` and `update_updated_at_column()` from earlier migrations.

---

## Task statuses

| Status | Meaning |
|--------|---------|
| `open` | Default — needs attention |
| `in_progress` | Admin is working on it |
| `resolved` | Done (hidden from Active filter) |
| `dismissed` | Ignored / not actionable (hidden from Active filter) |

**Dismiss vs resolve**

- **Resolve** — you fixed or accepted the issue; use when work is complete.
- **Dismiss** — suppress the task without claiming the underlying issue is fixed (e.g. known false positive, defer intentionally).

Both hide from the default **Active** list. Use **Reopen** to restore `open`.

---

## Priorities

`low` · `normal` (default) · `high` · `urgent`

Set via **Edit details** on a task card. Urgent tasks appear in dashboard metrics.

---

## Due dates

Optional `due_date` on each persisted task. Overdue tasks (due before today, not resolved/dismissed) show an **Overdue** badge and dashboard count.

Filters: **Overdue**, **Due this week**, **No due date**.

---

## Stable task keys

Each generated task has a stable `task_key` used for upserts:

```
content:no-subtitles:5
release:ready-to-publish:5
analytics:low-quiz-score:1
system:rls-progress:global
```

Format: `{category}:{slug}:{lessonId|global}`

---

## Admin actions (client)

Helpers in [lib/supabase/admin-task-persistence.ts](./lib/supabase/admin-task-persistence.ts):

- `upsertGeneratedTask` — first write on any action
- `startAdminTask` / `resolveAdminTask` / `dismissAdminTask` / `reopenAdminTask`
- `saveAdminTaskDetails` — priority, due date, note
- `updateAdminTaskPriority`, `updateAdminTaskDueDate`, `updateAdminTaskNote`

Uses anon key + admin JWT + RLS — **no service_role**.

---

## Merge behavior

[lib/admin/task-merge.ts](./lib/admin/task-merge.ts):

1. Generate tasks from current data
2. Load persisted rows
3. Overlay status, priority, due date, note on matching `task_key`
4. If issue is fixed (no longer generated) but row is **resolved/dismissed**, keep in history views
5. **Active** filter: not resolved/dismissed and still generated

---

## Routes & integration

| Location | Feature |
|----------|---------|
| `/admin/tasks` | Full queue + filters + actions |
| `/admin` | Open, overdue, urgent counts + top 5 active tasks |
| `/admin/lessons/{id}/edit` | Active lesson tasks with Resolve/Dismiss |
| `/admin/lesson-builder` | Step 9 task review |

---

## Future improvements (Step 24+)

- Admin activity log / audit trail
- Assign to specific admin users (column exists: `assigned_to`)
- Task comments thread
- External email/push notifications

---

## Testing with Lesson 5

1. Run migration `006_admin_tasks.sql`
2. Open `/admin/tasks?lessonId=5`
3. **Start** a task → row created with `in_progress`
4. **Edit details** → set priority `urgent`, due date, note → **Save**
5. **Dismiss** or **Resolve** → task leaves Active list
6. Status filter **Dismissed** / **Resolved** → see history
7. **Reopen** → back to Active
8. Edit page `/admin/lessons/5/edit` — same actions on compact cards

---

## Security

- RLS: admins only (`public.is_admin()`)
- Regular users cannot read or write `admin_tasks`
