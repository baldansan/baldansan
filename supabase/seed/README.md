# Supabase seed — HSK5 Lessons 1–3

SQL seed data for the Buunduu Surtsgaay database. Mirrors local content in `content/courses/hsk5/lessons/lesson-{1,2,3}.ts`.

The Next.js app is **not** connected to Supabase yet. Running this seed only populates the remote database; the app still loads lessons from TypeScript files.

## Files

| File | Purpose |
|------|---------|
| `001_seed_hsk5_lessons.sql` | Inserts course, lessons, subtitles, vocabulary, quiz |
| `verify_hsk5_seed.sql` | `SELECT` queries to confirm row counts |
| `_generate-seed.mjs` | Optional: regenerate `001_seed_hsk5_lessons.sql` after content edits (`node supabase/seed/_generate-seed.mjs`) |

## Prerequisite

Run the schema migration first:

1. [supabase/migrations/001_initial_schema.sql](../migrations/001_initial_schema.sql) in Supabase **SQL Editor**

Tables must exist before seeding.

## How to run the seed

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Open `001_seed_hsk5_lessons.sql` from this repo.
3. Paste the full file and click **Run**.
4. Confirm success (no errors; transaction commits).

Safe to re-run: course and lessons use `ON CONFLICT` upserts; child rows for lessons `1`, `2`, `3` are deleted and re-inserted.

## What gets populated

| Table | Rows after seed |
|-------|-----------------|
| `courses` | 1 (`hsk5`) |
| `lessons` | 3 (`1`, `2`, `3`) |
| `subtitle_lines` | 16 (4 + 6 + 6) |
| `vocabulary_words` | 29 (5 + 12 + 12) |
| `quiz_questions` | 15 (5 per lesson) |

## Intentionally empty

These tables are **not** modified by the seed:

- `user_lesson_progress`
- `user_vocabulary_progress`
- `user_quiz_attempts`

They will be used after authentication (Phase 4).

## Verify

Run [verify_hsk5_seed.sql](./verify_hsk5_seed.sql) in the SQL Editor and check:

- `courses`: 1 row
- `lessons`: 3 rows, `status = available`
- Per-lesson counts: lesson `1` → 4 / 5 / 5; lesson `2` → 6 / 12 / 5; lesson `3` → 6 / 12 / 5 (subtitles / vocabulary / quiz)

## Related docs

- [../SEED_PLAN.md](../SEED_PLAN.md) — field mapping and checklist
- [../../DATABASE_SCHEMA.md](../../DATABASE_SCHEMA.md) — table reference
