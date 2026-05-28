# Supabase admin setup — Buunduu Surtsgaay

How to enable **admin** access for Phase 5 content management. The app checks `admin_profiles` via the anon key + user JWT ([lib/supabase/admin.ts](../../lib/supabase/admin.ts)).

**App status:** `/admin` requires login **and** `admin_profiles`. **Draft lesson create** at `/admin/lessons/new` inserts into `lessons` when admin INSERT policies are enabled ([002](../policies/002_admin_content_policies.sql)). Subtitle/vocabulary/quiz not yet.

---

## 1. Run admin table + RLS SQL

1. Open Supabase Dashboard → **SQL Editor**.
2. Paste and run [001_admin_profiles_setup.sql](./001_admin_profiles_setup.sql).
3. Confirm the table exists: **Table Editor** → `admin_profiles`.

This script is idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).

---

## 2. Find your user id

**Supabase Dashboard → Authentication → Users** → copy the **UUID** of the account you use to sign in.

Or in SQL Editor (postgres role):

```sql
select id, email from auth.users order by created_at desc limit 10;
```

---

## 3. Make yourself admin

Run in **SQL Editor** (first row bypasses RLS as dashboard postgres user):

```sql
insert into public.admin_profiles (user_id, role)
values ('USER_UUID_HERE', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

Replace `USER_UUID_HERE` with your real `auth.users.id`.

### Verify

```sql
select * from public.admin_profiles where user_id = 'USER_UUID_HERE';
```

Then sign in on the app → open `/admin` → dashboard should load. Header shows **Admin** only for admin users.

---

## How `admin_profiles` works

| Column | Purpose |
|--------|---------|
| `user_id` | PK — must match `auth.users.id` |
| `role` | `admin` or `owner` (app treats both as admin) |
| `created_at` | Audit |

RLS (from `001_admin_profiles_setup.sql`):

- Authenticated users can **select** their own row (app `isCurrentUserAdmin()`).
- Admins can **select** all rows; **insert/update/delete** only when already admin.
- **First admin** must be inserted via SQL Editor (bootstrap).

Future content writes: [002_admin_content_policies.sql](../policies/002_admin_content_policies.sql) (review before production).

---

## Warnings

- **Never expose `service_role`** in the Next.js client, committed `.env.local`, or git. Browser uses **anon** key only.
- **Only real `auth.users` UUIDs** — random ids will not match login.
- **Do not run** `002_admin_content_policies.sql` until content write UI is ready and tested in staging.

---

## Remove admin access

```sql
delete from public.admin_profiles
where user_id = 'USER_UUID_HERE';
```

---

## Related docs

- [ADMIN_PLAN.md](../../ADMIN_PLAN.md) — Phase 5 roadmap
- [CONTENT_WORKFLOW.md](../../CONTENT_WORKFLOW.md) — publish workflow
- [components/admin/admin-guard.tsx](../../components/admin/admin-guard.tsx) — route protection
