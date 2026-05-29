# Security & RLS Audit — Buunduu Surtsgaay

Phase 6 Step 5: production security model and audit guide.

**Production URL:** https://baldansan.vercel.app  
**Audit route:** [`/admin/security-audit`](/admin/security-audit)

---

## RLS model overview

Buunduu Surtsgaay uses Supabase Row Level Security with the **anon key + user JWT** in the browser. There is **no service_role** in the Next.js client.

| Layer | Access model |
|-------|----------------|
| **Public content** | Read published (`available`) lessons and related content via RLS |
| **Admin CMS** | Read/write when `public.is_admin(auth.uid())` is true |
| **User progress** | Users read/write **own rows only** (`auth.uid() = user_id`) |
| **Storage** | Public read for learner media; admin upload via storage policies |

---

## Public read vs admin write

**Learners (authenticated or anonymous):**

- Can read courses and **available** lessons
- Cannot read draft/archived lessons (RLS + app filters)
- Cannot write lesson content

**Admins (`admin_profiles` row):**

- Full CMS read/write on lessons, subtitles, vocabulary, quiz
- Access admin_tasks, admin_activity_log
- Upload to `lesson-media` bucket

**Draft visibility:**

- Draft lessons excluded from `/courses/hsk5` public list
- Direct `/lessons/{draftId}` shows unavailable unless admin preview (`?preview=admin`)
- Never weaken RLS to expose drafts publicly

---

## User-owned progress rows

Tables:

- `user_lesson_progress`
- `user_vocabulary_progress`
- `user_quiz_attempts`

Policies (from `001_auth_rls_policies.sql`):

- `SELECT` / `INSERT` / `UPDATE` where `auth.uid() = user_id`
- Users cannot read or modify other users' progress

Smoke test: sign in as user A; confirm cannot update user B's rows via SQL or app.

---

## Admin-only CMS tables

| Table | Purpose |
|-------|---------|
| `admin_profiles` | Admin role lookup |
| `admin_tasks` | Persistent task queue |
| `admin_activity_log` | Audit trail |

Admin access requires:

1. Valid Supabase Auth session
2. Row in `admin_profiles` for `auth.uid()`
3. RLS policies using `public.is_admin(auth.uid())`

App layer: **AdminGuard** on all `/admin/*` routes.

---

## Storage bucket policy

Bucket: **`lesson-media`**

- **Public read** — learners load thumbnail/audio/video URLs
- **Admin upload** — authenticated admin JWT + storage RLS
- **No public write** — anonymous users must not upload files

Apply: [supabase/storage/001_lesson_media_bucket_policies.sql](./supabase/storage/001_lesson_media_bucket_policies.sql)

Verify in SQL: `production_verification.sql` → `storage` and `storage.objects` rows.

---

## service_role warning

**Never:**

- Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel for this app
- Import `service_role` in client or server components used by the browser
- Commit `.env.local` or real keys to git

**Always:**

- Use `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` only
- Copy from [.env.example](./.env.example) for local dev

The anon key is safe for the browser **because RLS enforces access**.

---

## Production Auth URL checklist

In Supabase Dashboard → **Authentication → URL Configuration**:

| Field | Value |
|-------|--------|
| **Site URL** | `https://baldansan.vercel.app` |
| **Redirect URLs** | `https://baldansan.vercel.app/**` |
| | `https://baldansan.vercel.app/login` |
| | `https://baldansan.vercel.app/profile` |
| | `http://localhost:3000/**` (local dev) |

Without these, login/signup redirect loops occur on production.

---

## Audit tools

| Tool | Purpose |
|------|---------|
| [`/admin/security-audit`](/admin/security-audit) | App-side pass/warn/fail + export |
| [`/admin/system-check`](/admin/system-check) | Supabase connectivity + admin session |
| [production_verification.sql](./supabase/verify/production_verification.sql) | SQL Editor RLS/policy/schema checks |
| [LAUNCH_CANDIDATE_CHECKLIST.md](./LAUNCH_CANDIDATE_CHECKLIST.md) | Final sign-off |

---

## is_admin in policies

Use the qualified function in all RLS expressions:

```sql
public.is_admin(auth.uid())
```

Not bare `is_admin()` — the SQL verification script warns if unqualified references are found.

---

## Related docs

- [AUTH_PLAN.md](./AUTH_PLAN.md)
- [supabase/policies/README.md](./supabase/policies/README.md)
- [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md)
- [supabase/verify/README.md](./supabase/verify/README.md)
