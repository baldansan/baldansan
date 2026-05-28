# Supabase seed — HSK5

SQL seed data for the Buunduu Surtsgaay database.

With `.env.local` configured, the app loads lessons **Supabase-first** via `lib/content.ts`. Lessons 1–3 also exist as local TypeScript fallbacks. **Lesson 4 is Supabase-only** (no `lesson-4.ts` file).

## Files

| File | Purpose |
|------|---------|
| `001_seed_hsk5_lessons.sql` | Course `hsk5` + Lessons 1–3 (subtitles, vocabulary, quiz) |
| `002_seed_hsk5_lesson_4.sql` | Lesson 4 only — Supabase-first pipeline test |
| `verify_hsk5_seed.sql` | `SELECT` queries to confirm row counts |
| `_generate-seed.mjs` | Optional: regenerate `001` from local lesson 1–3 data |

## Prerequisite

1. [supabase/migrations/001_initial_schema.sql](../migrations/001_initial_schema.sql)
2. `001_seed_hsk5_lessons.sql` (course + lessons 1–3)

## How to run seeds

1. Supabase Dashboard → **SQL Editor**
2. Run `001_seed_hsk5_lessons.sql` (if not already done)
3. Run `002_seed_hsk5_lesson_4.sql`
4. Run `verify_hsk5_seed.sql` to confirm counts

`002` is idempotent: upserts lesson `4`, deletes and re-inserts only lesson 4 child rows. Lessons 1–3 are untouched.

## Row counts after both seeds

| Table | Total |
|-------|-------|
| `courses` | 1 (`hsk5`) |
| `lessons` | 4 (`1`–`4`) |
| `subtitle_lines` | 21 (4+6+6+5) |
| `vocabulary_words` | 39 (5+12+12+10) |
| `quiz_questions` | 20 (5 per lesson) |

## Test Lesson 4 in the app

Requires `.env.local` and `npm run dev`:

- `/courses/hsk5` — Lesson 4 in list
- `/lessons/4`, `/lessons/4/watch`, `/lessons/4/vocabulary`, `/lessons/4/quiz`

Without Supabase env, `/lessons/4` shows **Lesson not found** (no local fallback for lesson 4).

## Related docs

- [../SEED_PLAN.md](../SEED_PLAN.md)
- [../../DATABASE_SCHEMA.md](../../DATABASE_SCHEMA.md)
