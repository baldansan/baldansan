# Supabase folder

Database schema, migrations, policies, seeds, and storage setup for Buunduu Surtsgaay.

## Migrations (run manually in Supabase SQL Editor)

Run in order on your project:

1. `migrations/001_initial_schema.sql`
2. `migrations/002_lesson_media_fields.sql`
3. `migrations/003_lesson_route_status.sql`
4. `migrations/004_admin_lesson_bundle.sql`
5. `migrations/005_grant_is_admin_rpc.sql`
6. `migrations/005_lesson_release_workflow.sql`
7. `migrations/006_admin_tasks.sql`
8. `migrations/007_admin_activity_log.sql`
9. `migrations/008_admin_activity_snapshots.sql`

Then apply policies and admin bootstrap — see [PHASE_5_FINAL_AUDIT.md](../PHASE_5_FINAL_AUDIT.md) and [workflows/README.md](./workflows/README.md).

## What is here

| Path | Purpose |
|------|---------|
| `migrations/001_initial_schema.sql` | Initial PostgreSQL tables, indexes, and `updated_at` triggers |
| `policies/001_auth_rls_policies.sql` | **Planned** RLS for Phase 4 — review before running |
| `policies/README.md` | When to apply auth policies |
| `SEED_PLAN.md` | How local TypeScript content maps to rows (for a future seed step) |

## App status

The Next.js app uses Supabase for content (Supabase-first + local fallback), auth, user progress, and admin CMS writes via anon key + admin JWT + RLS.

- Client: `@supabase/ssr` browser client + middleware session refresh
- Admin: `admin_profiles` + `AdminGuard` on `/admin/*`
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (never commit)

## Legacy note (Phase 3 Step 1)

## How to run this SQL later

When you create a Supabase project:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Open `migrations/001_initial_schema.sql` in this repo and paste the full file (or run it via Supabase CLI if you adopt it later).
3. Execute once on an empty database (or a fresh branch database).
4. Confirm tables appear under **Table Editor**: `courses`, `lessons`, `subtitle_lines`, `vocabulary_words`, `quiz_questions`, and the three `user_*` progress tables.

Optional: store the same file in Supabase **Migrations** if you use `supabase db push` in a later step.

## Documentation

- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — table purposes and relationships
- [AUTH_PLAN.md](../AUTH_PLAN.md) — Phase 4 auth and progress roadmap
- [SEED_PLAN.md](./SEED_PLAN.md) — seeding Lessons 1–3 from local content
- [DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) — full roadmap

## Next steps (after Step 1)

1. Create a Supabase project and run `001_initial_schema.sql` manually.
2. Seed HSK5 course + Lessons 1–3 per [SEED_PLAN.md](./SEED_PLAN.md).
3. Add Supabase client and swap `lib/content.ts` reads (later Phase 3 steps).
