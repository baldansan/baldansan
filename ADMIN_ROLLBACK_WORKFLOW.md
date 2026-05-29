# Admin Rollback Workflow — Buunduu Surtsgaay

Phase 5 Step 26: safe, limited rollback execution from admin activity log snapshots. Uses the same Supabase client + admin JWT + RLS — **no `service_role`**.

---

## Overview

When an admin changes lesson metadata, media, publish status, or release fields, the activity log stores a `before_snapshot`. On `/admin/activity/{id}`, admins can **preview** and **execute** rollback for supported actions only.

Rollback:

- Restores **only** the fields captured in `before_snapshot` for that action type
- Requires a confirmation checkbox before execution
- Logs a new activity row: `rollback_executed`
- Does **not** touch user progress, auth, or admin profile tables
- Does **not** support bulk or multi-row content rollback

---

## Supported rollback actions

| Action | Restored fields |
|--------|-----------------|
| `lesson_metadata_updated` | Title, Chinese title, subtitle, description, duration, status, order, counts |
| `media_updated` / `media_cleared` | Video, thumbnail, audio URLs, source note, media status |
| `lesson_status_changed` | Public `status` |
| `lesson_published` / `lesson_unpublished` / `lesson_archived` | Public `status` |
| `release_status_updated` | Release status |
| `qa_status_updated` | QA status |
| `release_notes_updated` | Release notes |
| `lesson_approved` | Approval fields (release/QA/approved metadata) |

Helpers: [lib/admin/admin-rollback-eligibility.ts](./lib/admin/admin-rollback-eligibility.ts), [lib/supabase/admin-rollback.ts](./lib/supabase/admin-rollback.ts).

---

## Unsupported rollback actions

These actions are **not** rollbackable (preview shows “Rollback энэ action дээр одоогоор дэмжигдээгүй.”):

| Action | Why |
|--------|-----|
| `bulk_import_completed` | Row-level subtitle/vocab/quiz history not stored |
| `backup_restored` | Full content restore needs explicit backup JSON |
| `lesson_duplicated` | Creates new lesson; unsafe to auto-reverse |
| `subtitle_created` / `subtitle_deleted` | Per-line content CRUD |
| `vocabulary_created` / `vocabulary_deleted` | Per-row content CRUD |
| `quiz_created` / `quiz_deleted` | Per-row content CRUD |
| Task actions (`task_*`) | Task state managed separately |
| `backup_exported` | Read-only export |
| `lesson_created` | No safe delete-on-rollback |

**Future plan:** content rollback from lesson export JSON or point-in-time backup, with explicit confirmation — never blind restore from count-only snapshots.

---

## Before / after snapshots

Migration [008_admin_activity_snapshots.sql](./supabase/migrations/008_admin_activity_snapshots.sql) adds:

- `before_snapshot` — shallow JSON state before the change
- `after_snapshot` — state after the change
- `diff_summary` — changed / added / removed field names

Rollback reads **`before_snapshot` only** and applies fields that match the action’s allowed key set.

See [ADMIN_ACTIVITY_DIFFS.md](./ADMIN_ACTIVITY_DIFFS.md) for diff preview details.

---

## Safety validation

Rollback runs only when **all** checks pass:

1. Current user is admin (`admin_profiles` + `isCurrentUserAdmin()`)
2. Activity row exists and action is in the supported set
3. `before_snapshot` is present and includes expected fields for that action
4. Target lesson still exists in `lessons`
5. Supabase is configured

If validation fails, the UI shows a friendly error and **no data is changed**.

---

## Confirmation requirement

On `/admin/activity/{id}`:

1. **Rollback available** badge when supported
2. List of fields that will be restored
3. Warning: subtitle/vocabulary/quiz bulk rollback is not active
4. Checkbox: **“Би rollback хийх гэж буй өөрчлөлтийг ойлгож байна.”**
5. **Execute rollback** button stays disabled until checkbox is checked

After success:

- Success message
- Link to lesson edit page
- Link to new `rollback_executed` activity row (when available)
- Page refreshes diff/metadata

Component: [components/admin/rollback-execution-card.tsx](./components/admin/rollback-execution-card.tsx).

---

## Rollback logs a new activity

Each successful rollback inserts:

| Field | Value |
|-------|--------|
| `action` | `rollback_executed` |
| `entity_type` | `activity` |
| `entity_id` | Original activity id |
| `lesson_id` | Lesson scope when available |
| `metadata` | `rolledBackAction`, `restoredFields`, `originalActivityId` |

The original activity row is never deleted or modified.

---

## Does not affect user progress

Rollback updates **lesson/admin content fields only**. It never writes to:

- `user_lesson_progress`
- `user_vocabulary_progress`
- `user_quiz_attempts`
- `auth.users` or `admin_profiles`

Learner-facing progress and accounts remain unchanged.

---

## How to test (Lesson 5)

1. Apply migrations `007` and `008` in Supabase.
2. Sign in as admin; open `/admin/lessons/5/edit`.
3. Change metadata (e.g. title) and save → note new row on `/admin/activity?lessonId=5`.
4. Open activity detail → confirm rollback badge, checkbox, and field list.
5. Check confirmation → **Execute rollback** → verify title restored and new `rollback_executed` row.
6. Try an unsupported action (e.g. subtitle delete) → confirm “not supported” message.

---

## Related docs

- [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md) — audit trail
- [ADMIN_ACTIVITY_DIFFS.md](./ADMIN_ACTIVITY_DIFFS.md) — snapshots and diff UI
- [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md) — Phase 5 readiness checklist
