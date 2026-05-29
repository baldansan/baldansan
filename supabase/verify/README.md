# Supabase production verification

Phase 6 Step 2: read-only SQL checks before Vercel deployment.

## What it checks

Script: [production_verification.sql](./production_verification.sql)

| Group | Checks |
|-------|--------|
| **core_tables** | courses, lessons, subtitle_lines, vocabulary_words, quiz_questions |
| **user_progress** | user_lesson_progress, user_vocabulary_progress, user_quiz_attempts |
| **admin_cms** | admin_profiles, admin_tasks, admin_activity_log |
| **lesson_media_columns** | video_url, thumbnail_url, audio_url, source_note, media_status |
| **release_workflow_columns** | release_status, qa_status, approved_at, approved_by, release_notes, last_reviewed_at |
| **activity_snapshots** | before_snapshot, after_snapshot, diff_summary |
| **functions** | is_admin, get_lesson_route_status, get_admin_lesson_bundle, update_updated_at_column |
| **storage** | lesson-media bucket |
| **rls_enabled** | RLS on admin, progress, and content tables |
| **policies** | Policy count on key tables + storage.objects for lesson-media |
| **data_sanity** | Row counts (lessons, content, admins, activity, tasks, quiz attempts) |

Output columns:

```
check_group | check_name | status | details
```

Status values:

| Status | Meaning |
|--------|---------|
| **pass** | Requirement met |
| **warn** | Non-blocking — review before go-live (e.g. zero admin profiles, zero available lessons) |
| **fail** | Blocking — run the migration or policy file noted in `details` |

## How to run

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Open `supabase/verify/production_verification.sql` in this repo.
3. Paste the full script and click **Run**.
4. Review all rows — fix any **fail** before deploying.
5. Cross-check with app-side **`/admin/system-check`** (signed in as admin).

## Common failures and fixes

| Failure | Fix |
|---------|-----|
| Missing media columns | Run [002_lesson_media_fields.sql](../migrations/002_lesson_media_fields.sql) |
| Missing release columns | Run [005_lesson_release_workflow.sql](../migrations/005_lesson_release_workflow.sql) |
| Missing admin_tasks | Run [006_admin_tasks.sql](../migrations/006_admin_tasks.sql) |
| Missing admin_activity_log | Run [007_admin_activity_log.sql](../migrations/007_admin_activity_log.sql) |
| Missing snapshot columns | Run [008_admin_activity_snapshots.sql](../migrations/008_admin_activity_snapshots.sql) |
| Missing is_admin | Run [001_admin_profiles_setup.sql](../admin/001_admin_profiles_setup.sql) + [005_grant_is_admin_rpc.sql](../migrations/005_grant_is_admin_rpc.sql) |
| Missing RPCs | Run [003](../migrations/003_lesson_route_status.sql) / [004](../migrations/004_admin_lesson_bundle.sql) |
| Storage bucket missing | Run [001_lesson_media_bucket_policies.sql](../storage/001_lesson_media_bucket_policies.sql) or create bucket in Dashboard |
| No policies | Run [001_auth_rls_policies.sql](../policies/001_auth_rls_policies.sql), [002_admin_content_policies.sql](../policies/002_admin_content_policies.sql) |
| is_admin policy errors | Use `public.is_admin()` in policies (not bare `is_admin()`) |
| warn: 0 admin_profiles | Insert admin row — see [SUPABASE_PRODUCTION_SETUP.md](../../SUPABASE_PRODUCTION_SETUP.md) |
| warn: 0 available lessons | Publish at least one lesson for public smoke test |

## Safety

- **Read-only** — no INSERT/UPDATE/DELETE.
- Safe to run on production/staging.
- Does not use or expose `service_role`.

## Related

- [SUPABASE_PRODUCTION_SETUP.md](../../SUPABASE_PRODUCTION_SETUP.md)
- [PRODUCTION_CHECKLIST.md](../../PRODUCTION_CHECKLIST.md)
- `/admin/system-check` — browser-side verification
