# Supabase workflow migrations — Buunduu Surtsgaay

## Release workflow (Phase 5 Step 21)

**Migration file:** [../migrations/005_lesson_release_workflow.sql](../migrations/005_lesson_release_workflow.sql)

> Also in this folder: `005_grant_is_admin_rpc.sql` (admin RPC). Run both `005_*` files if not applied yet — grant runs first alphabetically.

### Run in Supabase SQL Editor

1. Open SQL Editor in your Supabase project.
2. Paste and run `005_lesson_release_workflow.sql`.
3. Verify columns on `public.lessons`:
   - `release_status`
   - `qa_status`
   - `approved_at`
   - `approved_by`
   - `release_notes`
   - `last_reviewed_at`

### `status` vs `release_status`

| Column | Purpose |
|--------|---------|
| `status` | **Public visibility** — `draft`, `available`, `archived`. Controls learner-facing routes. |
| `release_status` | **Internal admin workflow** — `draft`, `in_review`, `approved`, `published`, `archived`. |

Publishing sets `status = available` and ideally `release_status = published`.

### `qa_status`

Release QA gate (not content-import QA):

| Value | Meaning |
|-------|---------|
| `needs_review` | Default; not signed off |
| `passed` | Admin marked release QA passed |
| `failed` | Blocked / needs rework |

### Approval workflow

1. Content complete → mark `in_review`
2. Checklist + preview → `qa_status = passed`
3. **Approve for publish** → `release_status = approved`, `approved_at`, `approved_by`
4. **Publish** → `status = available`, `release_status = published`

See [RELEASE_WORKFLOW.md](../../RELEASE_WORKFLOW.md) in the project root.

### Warning

Review migrations before production. Requires admin RLS policies on `lessons` update (existing admin content policies).

---

## Admin tasks (Phase 5 Step 23)

**Migration file:** [../migrations/006_admin_tasks.sql](../migrations/006_admin_tasks.sql)

### Run in Supabase SQL Editor

1. Paste and run `006_admin_tasks.sql` (after `005_*` and admin RLS).
2. Verify table `public.admin_tasks` and admin-only RLS policies.

See [ADMIN_TASK_MANAGEMENT.md](../../ADMIN_TASK_MANAGEMENT.md).
