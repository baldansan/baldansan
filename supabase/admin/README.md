# Supabase admin setup — Buunduu Surtsgaay

How to grant **admin** access for Phase 5 content management. The app does not promote users to admin automatically.

**App status (Step 1):** `/admin` UI exists for logged-in users. **Admin role is not enforced yet** — Step 2 will add `admin_profiles` and gate write access. **No content writes** from the client until RLS and server-safe actions are in place.

---

## How `admin_profiles` works

Planned table (see [002_admin_content_policies.sql](../policies/002_admin_content_policies.sql)):

| Column | Purpose |
|--------|---------|
| `user_id` | Primary key — must match `auth.users.id` (UUID) |
| `role` | Default `'admin'` (room for `'editor'` later) |
| `created_at` | Audit |

A user is an admin when a row exists:

```sql
exists (
  select 1 from public.admin_profiles
  where user_id = auth.uid()
)
```

The learner app checks this before showing `/admin` (Step 3+). **RLS** on content tables uses the same rule for `INSERT` / `UPDATE` / `DELETE`.

---

## Make a user admin manually

### 1. Get the user UUID

In Supabase Dashboard → **Authentication** → **Users**, copy the user’s **UUID** for the account that should be admin.

Or after the user signs up once:

```sql
select id, email from auth.users order by created_at desc limit 10;
```

### 2. Insert admin profile (SQL Editor)

Run in **SQL Editor** (review [002_admin_content_policies.sql](../policies/002_admin_content_policies.sql) first; table must exist):

```sql
insert into public.admin_profiles (user_id, role)
values ('USER_UUID_HERE', 'admin');
```

Replace `USER_UUID_HERE` with the real UUID, for example:

```sql
insert into public.admin_profiles (user_id, role)
values ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin');
```

### 3. Verify

```sql
select * from public.admin_profiles where user_id = 'USER_UUID_HERE';
```

Sign in as that user in the app; after admin UI ships, `/admin` should be accessible.

---

## Warnings

- **Only use real authenticated user IDs** from `auth.users`. Random UUIDs will not match any login.
- **Do not expose the service role key** in the Next.js client, `.env.local` committed to git, or public repos. Use the **anon** key in the app; admin writes rely on the user’s JWT + RLS.
- **Bootstrap:** The first admin row is usually inserted via SQL Editor (superuser / service role context). After that, optional policies let existing admins add more admins.
- **Do not run** `002_admin_content_policies.sql` in production until Phase 5 Step 2 is reviewed and admin UI is ready to test.

---

## Remove admin access

```sql
delete from public.admin_profiles
where user_id = 'USER_UUID_HERE';
```

---

## Related docs

- [ADMIN_PLAN.md](../../ADMIN_PLAN.md) — Phase 5 admin roadmap
- [CONTENT_WORKFLOW.md](../../CONTENT_WORKFLOW.md) — publish workflow
- [supabase/policies/002_admin_content_policies.sql](../policies/002_admin_content_policies.sql) — planned RLS
- [AUTH_PLAN.md](../../AUTH_PLAN.md) — learner auth (separate from admin)
