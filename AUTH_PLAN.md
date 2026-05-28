# Auth plan — Buunduu Surtsgaay (Phase 4)

This document explains how **Supabase Auth** and **Row Level Security (RLS)** will move the app from device-only `localStorage` progress to real per-user progress in PostgreSQL.

**Phase 4 Step 1 (current):** planning and SQL policy design only — no login UI, no database writes yet.

---

## What Supabase Auth will do

Supabase Auth provides:

- User accounts (`auth.users`) with a stable `id` (UUID)
- Sign up, sign in, sign out, password reset, optional OAuth
- JWT sessions used by `@supabase/supabase-js` on the client and server

The app will attach the user's session to Supabase client calls. Progress writes will set `user_id` to `auth.uid()` so each learner only sees and edits their own rows.

---

## Why RLS is needed

Today the app uses the **anon** public key to read lessons. That key is safe for **public lesson content** only if policies forbid writes.

Progress tables (`user_lesson_progress`, `user_vocabulary_progress`, `user_quiz_attempts`) must **never** be world-readable or world-writable.

**RLS** enforces rules in Postgres:

- Content: `SELECT` allowed for everyone (anon + authenticated).
- Progress: `SELECT` / `INSERT` / `UPDATE` only when `auth.uid() = user_id`.

Even if application code has a bug, other users' progress rows stay inaccessible.

Planned policies: [supabase/policies/001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql).

---

## Public lesson content vs private user progress

| Kind | Tables | Who can read | Who can write |
|------|--------|--------------|---------------|
| **Public content** | `courses`, `lessons`, `subtitle_lines`, `vocabulary_words`, `quiz_questions` | Everyone (anon + logged in) | Nobody via client (admin/seed only) |
| **Private progress** | `user_lesson_progress`, `user_vocabulary_progress`, `user_quiz_attempts` | Logged-in user, own rows only | Same user only |

Lesson URLs and watch/vocabulary/quiz **content** stay the same. Only **progress** moves from `localStorage` to Supabase for signed-in users.

---

## Login / signup flow (planned)

High-level UX (Step 2):

1. User opens **Profile** or a dedicated **Sign in** entry (exact placement TBD in Step 2).
2. **Sign up** with email + password (or OAuth if enabled in Supabase).
3. **Sign in** → Supabase returns session; app stores session in client.
4. Authenticated Supabase client used for progress reads/writes.
5. **Sign out** → session cleared; app may fall back to local-only progress or prompt sign-in.

No auth UI in Step 1.

---

## localStorage progress today

[lib/progress.ts](./lib/progress.ts) stores on this device:

- Lesson status (not started / started / completed)
- Learned vocabulary keys per lesson
- Quiz results and best scores
- Last active lesson id

Profile (`/profile`), Review (`/review`), continue learning, and course cards read this data.

**Step 1 does not remove or change localStorage.**

---

## Migrating localStorage after login (later)

Planned in **Phase 4 Step 6**:

1. On first login, read existing `localStorage` progress.
2. Upsert rows into Supabase progress tables with `user_id = auth.uid()`.
3. Resolve vocabulary keys to `vocabulary_words.id` (bigint FK) using lesson content from Supabase.
4. Avoid duplicates (use `unique (user_id, lesson_id)` and `unique (user_id, vocabulary_word_id)`).
5. Optionally keep localStorage as offline cache or clear after successful merge (product decision in Step 6).

Until migration runs, guests and logged-out users can keep using localStorage only.

---

## Schema note: `user_id` and `auth.users`

From [001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql):

- `user_id uuid` on all three progress tables
- **No foreign key** to `auth.users(id)` yet
- `unique (user_id, lesson_id)` on `user_lesson_progress`
- `unique (user_id, vocabulary_word_id)` on `user_vocabulary_progress`
- `lesson_id` / `vocabulary_word_id` reference content tables correctly

**Phase 4 Step 2 may add** `references auth.users(id) on delete cascade` and `not null` on `user_id` after testing sign-up and RLS together.

---

## Phase 4 roadmap

| Step | Focus | Status |
|------|--------|--------|
| **1** | Auth planning + RLS policy design | ✅ Planning (this doc + `supabase/policies/`) |
| **2** | Auth helpers + login/signup UI | Next |
| **3** | Persist lesson progress to Supabase | Planned |
| **4** | Persist vocabulary learned state to Supabase | Planned |
| **5** | Persist quiz attempts to Supabase | Planned |
| **6** | Migrate / merge localStorage progress after login | Planned |
| **7** | Phase 4 final audit | Planned |

### Step 2 — Auth helpers + login/signup UI

- `lib/supabase` auth client (browser session)
- Sign up / sign in / sign out components or pages
- Wire Profile link to real account state
- Still no progress writes until Step 3+

### Step 3 — Lesson progress in Supabase

- Replace or mirror `markLessonStarted` / `markLessonCompleted` with `user_lesson_progress`
- Course and lesson UI read from DB when logged in

### Step 4 — Vocabulary progress in Supabase

- “Mark as learned” → `user_vocabulary_progress`
- Review page loads learned words from DB when logged in

### Step 5 — Quiz attempts in Supabase

- Finish quiz → `insert` into `user_quiz_attempts`
- Profile/review quiz summaries from DB

### Step 6 — localStorage migration

- One-time merge on login
- Conflict rules (e.g. best quiz % = max of local vs remote)

### Step 7 — Phase 4 audit

- Routes, RLS verification, signed-in vs signed-out behavior
- Docs and build

---

## Environment variables (unchanged for Step 1)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Never commit `.env.local`. Service role key must **not** ship to the browser; admin seeds only.

---

## Related files

- [supabase/policies/README.md](./supabase/policies/README.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Phase 4 Auth and RLS plan
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — phase timeline
