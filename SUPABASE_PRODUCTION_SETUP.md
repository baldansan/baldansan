# Supabase Production Setup — Buunduu Surtsgaay

Manual setup guide for production Supabase. Run in the **SQL Editor** unless noted.

See also [supabase/README.md](./supabase/README.md) and [supabase/workflows/README.md](./supabase/workflows/README.md).

---

## 1. Run migrations (in order)

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_lesson_media_fields.sql`
3. `supabase/migrations/003_lesson_route_status.sql`
4. `supabase/migrations/004_admin_lesson_bundle.sql`
5. `supabase/migrations/005_grant_is_admin_rpc.sql`
6. `supabase/migrations/005_lesson_release_workflow.sql`
7. `supabase/migrations/006_admin_tasks.sql`
8. `supabase/migrations/007_admin_activity_log.sql`
9. `supabase/migrations/008_admin_activity_snapshots.sql`

Each file is idempotent where noted (`IF NOT EXISTS`).

---

## 2. Run RLS policies

Review first, then execute:

1. `supabase/policies/001_auth_rls_policies.sql` — user progress tables
2. `supabase/policies/002_admin_content_policies.sql` — admin content CRUD

---

## 3. Create admin user

1. Sign up via the app (`/signup`) or create user in Supabase Auth dashboard.
2. Copy the user's UUID from **Authentication → Users**.
3. Run [supabase/admin/001_admin_profiles_setup.sql](./supabase/admin/001_admin_profiles_setup.sql) if not already applied.
4. Insert admin row:

```sql
insert into public.admin_profiles (user_id, role)
values ('YOUR-AUTH-USER-UUID', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

---

## 4. Storage bucket

1. Run `supabase/storage/001_lesson_media_bucket_policies.sql`
2. Or create bucket **`lesson-media`** in Dashboard → Storage (public read if using public URLs).
3. Confirm policies allow admin upload and public read per [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md).

---

## 5. Auth settings

Dashboard → **Authentication → Providers → Email**:

- Enable Email provider
- **Confirm email:** ON for production (recommended)
- Set **Site URL** and **Redirect URLs** after Vercel deploy

---

## 6. Verification SQL snippets

### Check lessons

```sql
select id, title, status, media_status
from public.lessons
order by order_index;
```

### Check admin_profiles

```sql
select ap.user_id, ap.role, u.email
from public.admin_profiles ap
left join auth.users u on u.id = ap.user_id;
```

### Check storage bucket

```sql
select id, name, public
from storage.buckets
where id = 'lesson-media';
```

### Check admin_activity_log

```sql
select id, action, lesson_id, title, created_at
from public.admin_activity_log
order by created_at desc
limit 10;
```

### Check admin_tasks

```sql
select task_key, status, priority, lesson_id, updated_at
from public.admin_tasks
order by updated_at desc
limit 10;
```

### Check user progress tables exist

```sql
select count(*) as lesson_progress_rows from public.user_lesson_progress;
select count(*) as vocab_progress_rows from public.user_vocabulary_progress;
select count(*) as quiz_attempt_rows from public.user_quiz_attempts;
```

---

## 7. Run production verification SQL

After migrations, policies, admin row, and storage bucket are applied:

1. Open **SQL Editor** in Supabase Dashboard.
2. Paste and run [supabase/verify/production_verification.sql](./supabase/verify/production_verification.sql).
3. Review output columns: `check_group | check_name | status | details`.

### Status meanings

| Status | Meaning |
|--------|---------|
| **pass** | Requirement met |
| **warn** | Non-blocking — review (e.g. zero available lessons, empty activity log) |
| **fail** | Blocking — run the migration or policy file in `details` before deploy |

### Example results

| check_group | check_name | status | details |
|-------------|------------|--------|---------|
| core_tables | lessons | pass | Table exists. |
| lesson_media_columns | video_url | pass | Column exists. |
| admin_cms | admin_tasks | fail | Missing — run supabase/migrations/006_admin_tasks.sql |
| data_sanity | available_lessons | warn | Count: 0 — publish at least one lesson for smoke test |
| storage | lesson-media | pass | Bucket exists. |

Fix all **fail** rows before Vercel deploy. See [supabase/verify/README.md](./supabase/verify/README.md) for the full check list.

### Common fixes

| Failure | Fix |
|---------|-----|
| Missing media columns | Run [002_lesson_media_fields.sql](./supabase/migrations/002_lesson_media_fields.sql) |
| Missing admin_tasks | Run [006_admin_tasks.sql](./supabase/migrations/006_admin_tasks.sql) |
| Missing admin_activity_log | Run [007_admin_activity_log.sql](./supabase/migrations/007_admin_activity_log.sql) |
| Missing snapshot columns | Run [008_admin_activity_snapshots.sql](./supabase/migrations/008_admin_activity_snapshots.sql) |
| Storage bucket missing | Run [001_lesson_media_bucket_policies.sql](./supabase/storage/001_lesson_media_bucket_policies.sql) or create bucket manually |
| is_admin ambiguity in policies | Use `public.is_admin(auth.uid())` in RLS policies |
| No admin row | Insert into `admin_profiles` (see section 3 above) |

---

## 8. App-side verification

1. Sign in as admin.
2. Open `/admin/system-check` — env, auth, lessons (including Lesson 1 and Lesson 5 as admin), admin profile, tasks, activity log, progress tables, storage.
3. Use **Copy SQL verification instructions** on that page to run the SQL script above.
4. Edit a lesson → save metadata → confirm row in `admin_activity_log`.
5. Upload thumbnail → confirm file in `lesson-media` bucket.
6. Publish lesson → confirm visible on `/courses/hsk5`.

---

## Security reminders

- Use **anon key** in the Next.js app only.
- Never commit `.env.local` or `service_role` key.
- RLS must be enabled before production traffic.

---

## Related docs

- [supabase/verify/README.md](./supabase/verify/README.md) — production verification SQL
- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md)
