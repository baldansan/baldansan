# Admin Activity Log — Buunduu Surtsgaay

Phase 5 Step 24: in-app audit trail for important admin actions. No external logging services — records live in Supabase with admin-only RLS.

---

## Why an audit trail matters

Admins change lesson content, publish status, media, tasks, and release workflow from the browser. An activity log answers:

- **Who** changed something (actor email or user id)
- **What** changed (action + title/description)
- **When** it happened (`created_at`)
- **Context** (lesson id, entity id, optional JSON metadata)

This supports accountability, debugging (“why did lesson 5 go draft?”), and future rollback/diff tooling.

---

## What is logged

Best-effort logging on these actions (see `ADMIN_ACTIVITY_ACTIONS` in [lib/supabase/admin-activity.ts](./lib/supabase/admin-activity.ts)):

| Action | Typical trigger |
|--------|-----------------|
| `lesson_created` | New draft lesson |
| `lesson_metadata_updated` | Metadata save on edit page |
| `lesson_status_changed` | Generic status change |
| `lesson_published` | Status → `available` |
| `lesson_unpublished` | Status → `draft` |
| `lesson_archived` | Status → `archived` |
| `subtitle_created` / `subtitle_deleted` | Subtitle editor |
| `vocabulary_created` / `vocabulary_deleted` | Vocabulary editor |
| `quiz_created` / `quiz_deleted` | Quiz editor |
| `bulk_import_completed` | Bulk JSON import |
| `backup_exported` | Generate export JSON |
| `lesson_duplicated` | Duplicate lesson tool |
| `backup_restored` | Restore from backup |
| `media_uploaded` | Storage upload success |
| `media_updated` / `media_cleared` | Media URL editor |
| `task_started` / `task_resolved` / `task_dismissed` / `task_updated` | Task center |
| `release_status_updated` / `qa_status_updated` | Release workflow |
| `lesson_approved` | Approve for publish |
| `release_notes_updated` | Release notes save |
| `rollback_executed` | Safe rollback from activity detail |

Logging is **insert-only**. There are no update/delete policies for regular use.

---

## Table structure

Migration: [supabase/migrations/007_admin_activity_log.sql](./supabase/migrations/007_admin_activity_log.sql)

| Column | Purpose |
|--------|---------|
| `id` | UUID primary key |
| `actor_user_id` | Supabase auth user id (nullable if session missing) |
| `actor_email` | Email snapshot at log time |
| `action` | Machine-readable action key (e.g. `lesson_published`) |
| `entity_type` | `lesson`, `subtitle`, `vocabulary`, `quiz`, `media`, `task`, etc. |
| `entity_id` | Optional id of the affected row or key |
| `lesson_id` | Optional lesson scope for filtering |
| `title` | Short human-readable summary (required) |
| `description` | Optional longer text |
| `metadata` | JSON object — counts, status values, file paths, etc. |
| `created_at` | Timestamp |

Indexes exist on `action`, `entity_type`, `entity_id`, `lesson_id`, `actor_user_id`, and `created_at desc`.

---

## Actor / entity / metadata

- **Actor** — captured from the current authenticated admin session when `logAdminActivity()` runs. Stored as `actor_user_id` + `actor_email` so later profile changes do not rewrite history.
- **Entity** — `entity_type` + `entity_id` identify what was touched (e.g. subtitle line id, task key).
- **Metadata** — flexible JSON for structured extras without schema churn (import counts, old/new status, storage path).

---

## App integration

| Area | Location |
|------|----------|
| Write helper | [lib/supabase/admin-activity.ts](./lib/supabase/admin-activity.ts) — `logAdminActivity`, `logAdminActivityFireAndForget` |
| Read helpers (server) | [lib/supabase/admin-activity-log.ts](./lib/supabase/admin-activity-log.ts) |
| Activity page | `/admin/activity` |
| Dashboard preview | `/admin` — latest 5 actions |
| Lesson edit | `/admin/lessons/{id}/edit` — latest 10 for that lesson |
| Lesson builder | Selected lesson activity count + link |

Hooks are wired in `admin-content.ts`, `admin-import.ts`, `admin-release.ts`, `admin-duplicate.ts`, `admin-restore.ts`, `admin-task-persistence.ts`, `media-upload.ts`, and `lesson-export-card.tsx`.

---

## Best-effort logging

`logAdminActivity()` **never throws** and **must not block** the main admin action. Failures log a console warning only. If migration `007` is not applied, inserts fail silently from the user’s perspective — the admin workflow still completes.

---

## Snapshots and diff detail (Step 25)

Migration [008_admin_activity_snapshots.sql](./supabase/migrations/008_admin_activity_snapshots.sql) adds:

- `before_snapshot` / `after_snapshot` — shallow JSON state
- `diff_summary` — changed/added/removed field names

Detail page: `/admin/activity/{id}` — field diff table, rollback execution for supported actions. See [ADMIN_ACTIVITY_DIFFS.md](./ADMIN_ACTIVITY_DIFFS.md) and [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md).

**Phase 5 Mega Batch:** production CMS hardening, safe rollback, audit export, and final audit page.

---

## Export (Step 26)

Client-side export on `/admin/activity`:

- CSV — `admin-activity-log.csv`
- JSON — full metadata + snapshots
- Copy JSON to clipboard

Respects current filters on loaded rows. See [ADMIN_AUDIT_EXPORT.md](./ADMIN_AUDIT_EXPORT.md).

---

## RLS and security

- RLS enabled on `admin_activity_log`.
- **Select** and **Insert** allowed for authenticated users where `public.is_admin()` is true.
- No policies for regular learners — they cannot read or write audit rows.
- Uses the **anon key + admin JWT** in the browser (same as other admin writes). **Never** use `service_role` in the Next.js app.

---

## Run migration

1. Open Supabase SQL Editor.
2. Run [supabase/migrations/007_admin_activity_log.sql](./supabase/migrations/007_admin_activity_log.sql) after migrations `001`–`006`.
3. Run [supabase/migrations/008_admin_activity_snapshots.sql](./supabase/migrations/008_admin_activity_snapshots.sql) for before/after snapshots.
4. Confirm table `public.admin_activity_log` and admin select/insert policies exist.

See also [supabase/workflows/README.md](./supabase/workflows/README.md).

---

## How to test (Lesson 5)

1. Sign in as an admin user with `admin_profiles` row.
2. Open `/admin/lessons/5/edit` — change metadata, add/delete a subtitle, upload media, or publish.
3. Open `/admin/activity?lessonId=5` — new rows should appear with your email and timestamps.
4. Check `/admin` dashboard **Admin activity** card and lesson edit **Lesson activity** section.

---

## Future improvements

- Row-level content rollback from lesson export JSON
- External notifications (email/Slack) on critical actions
- Server-side paginated export for very large log tables

---

## Related docs

- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
- [ADMIN_TASK_MANAGEMENT.md](./ADMIN_TASK_MANAGEMENT.md) — task actions that generate log entries
- [ADMIN_ACTIVITY_DIFFS.md](./ADMIN_ACTIVITY_DIFFS.md) — snapshots and diff preview
- [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md) — safe rollback execution
- [ADMIN_AUDIT_EXPORT.md](./ADMIN_AUDIT_EXPORT.md) — CSV/JSON export
