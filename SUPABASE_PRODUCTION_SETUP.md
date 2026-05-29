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

## 7. App-side verification

1. Sign in as admin.
2. Open `/admin/system-check` — env, lessons, admin profile, tasks, activity log, storage.
3. Edit a lesson → save metadata → confirm row in `admin_activity_log`.
4. Upload thumbnail → confirm file in `lesson-media` bucket.
5. Publish lesson → confirm visible on `/courses/hsk5`.

---

## Security reminders

- Use **anon key** in the Next.js app only.
- Never commit `.env.local` or `service_role` key.
- RLS must be enabled before production traffic.

---

## Related docs

- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md)
