# Supabase folder

This directory holds **database schema and migration SQL** for Buunduu Surtsgaay. It prepares the project for Supabase integration in later Phase 3 steps.

## What is here

| Path | Purpose |
|------|---------|
| `migrations/001_initial_schema.sql` | Initial PostgreSQL tables, indexes, and `updated_at` triggers |
| `policies/001_auth_rls_policies.sql` | **Planned** RLS for Phase 4 — review before running |
| `policies/README.md` | When to apply auth policies |
| `SEED_PLAN.md` | How local TypeScript content maps to rows (for a future seed step) |

## App status

The Next.js app is **not connected** to Supabase yet:

- No `@supabase/supabase-js` package
- No Supabase client or env vars in the app
- No authentication
- Lessons 1–3 still load from `content/courses/hsk5/lessons/*.ts` via `lib/content.ts`

UI and routes are unchanged. Phase 3 Step 1 is **schema planning only**.

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
