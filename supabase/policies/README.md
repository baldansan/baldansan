# Supabase RLS policies — Buunduu Surtsgaay

This folder holds **planned** Row Level Security (RLS) SQL for Phase 4. It is separate from `migrations/` so schema (Step 1) can stay stable while auth policies are reviewed.

## Files

| File | Purpose |
|------|---------|
| [001_auth_rls_policies.sql](./001_auth_rls_policies.sql) | Enable RLS + policies for content (public read) and progress (user-private) |
| [002_admin_content_policies.sql](./002_admin_content_policies.sql) | **Planned** — `admin_profiles`, status-filtered public read, admin content CRUD |

## What policies do

- **Content tables** (`courses`, `lessons`, `subtitle_lines`, `vocabulary_words`, `quiz_questions`): anyone with the anon key can **read** lesson data. No client writes.
- **Progress tables** (`user_lesson_progress`, `user_vocabulary_progress`, `user_quiz_attempts`): only **signed-in** users can read/write rows where `user_id = auth.uid()`.

Without RLS, a leaked anon key could let clients read or write any user's progress. RLS enforces privacy at the database layer.

## When to run

**Run `supabase/policies/001_auth_rls_policies.sql` before production use of authenticated progress writes** (lessons, vocabulary, quiz). The app does not execute this SQL automatically.

Prerequisites:

1. Supabase Auth is configured on the project.
2. Auth helpers + login/signup UI are in place (Step 2).
3. You understand that enabling RLS on content tables **without** the public `SELECT` policies will break the app's read-only Supabase content fetches.

### How to apply later

1. Open Supabase Dashboard → **SQL Editor**.
2. Paste and review [001_auth_rls_policies.sql](./001_auth_rls_policies.sql).
3. Run in a staging project first.
4. Verify with the checklist at the bottom of the SQL file.

## Current app behavior

- Lesson content: Supabase-first read via anon key + [lib/supabase/content.ts](../../lib/supabase/content.ts).
- Lesson progress (signed in): [lib/supabase/progress.ts](../../lib/supabase/progress.ts) + smart helpers in [lib/progress.ts](../../lib/progress.ts); always mirrored to localStorage.
- Vocabulary learned (signed in): [lib/supabase/vocabulary-progress.ts](../../lib/supabase/vocabulary-progress.ts) + localStorage mirror.
- Quiz attempts (signed in): [lib/supabase/quiz-attempts.ts](../../lib/supabase/quiz-attempts.ts) + localStorage mirror.

## Phase 5 admin policies

[002_admin_content_policies.sql](./002_admin_content_policies.sql) is **not** ready to run until Phase 5 Step 2 review. It may **replace** `001`’s `using (true)` content `SELECT` policies with status-filtered reads. Bootstrap admins: [supabase/admin/README.md](../admin/README.md).

## Related docs

- [AUTH_PLAN.md](../../AUTH_PLAN.md) — full Phase 4 roadmap
- [ADMIN_PLAN.md](../../ADMIN_PLAN.md) — Phase 5 admin roadmap
- [DATABASE_SCHEMA.md](../../DATABASE_SCHEMA.md) — tables and Auth/RLS section
- [supabase/README.md](../README.md) — migrations and seeds
