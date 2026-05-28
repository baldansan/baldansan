# Auth plan — Buunduu Surtsgaay (Phase 4)

This document explains how **Supabase Auth** and **Row Level Security (RLS)** will move the app from device-only `localStorage` progress to real per-user progress in PostgreSQL.

**Phase 4 Step 6 (current):** local guest progress can be merged into Supabase account after login via Profile sync card.

**Before production auth progress writes:** run [supabase/policies/001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql) in the Supabase SQL Editor. The app does not execute SQL automatically.

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

Step 1 delivered planning only. **Step 2 delivers auth UI** (no progress writes yet).

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
| **1** | Auth planning + RLS policy design | ✅ Completed |
| **2** | Auth helpers + login/signup UI | ✅ Completed |
| **3** | Persist lesson progress to Supabase | ✅ Completed |
| **4** | Persist vocabulary learned state to Supabase | ✅ Completed |
| **5** | Persist quiz attempts to Supabase | ✅ Completed |
| **6** | Migrate / merge localStorage progress after login | ✅ Completed |
| **7** | Phase 4 final audit | **Next** |

### Step 2 — Auth helpers + login/signup UI ✅

- [lib/supabase/auth.ts](./lib/supabase/auth.ts) — `getCurrentUser`, `getSession`, `signInWithEmail`, `signUpWithEmail`, `signOut`, `onAuthStateChange`
- [types/auth.ts](./types/auth.ts) — `AuthUser`
- Pages: `/login`, `/signup`
- [components/auth-status.tsx](./components/auth-status.tsx) in header (Нэвтрэх / email / Гарах)
- Profile shows logged-in email or login CTA
- **No** Supabase progress writes; **no** RLS applied yet; localStorage unchanged

### Step 3 — Lesson progress in Supabase ✅

- [lib/supabase/progress.ts](./lib/supabase/progress.ts) — `getUserLessonProgress`, `upsertUserLessonProgress`, `markSupabaseLessonStarted` / `markSupabaseLessonCompleted`
- [lib/progress.ts](./lib/progress.ts) — `markLessonStartedSmart` / `markLessonCompletedSmart` (Supabase when logged in + always localStorage)
- Course (`/courses/hsk5`), lesson cards, quiz ≥70%, watch link/page write lesson rows to `user_lesson_progress`
- Profile shows **Аккаунттай холбогдсон ахиц** when signed in; device progress note kept
- Quiz attempts: Step 5 ✅
- Apply RLS manually: `supabase/policies/001_auth_rls_policies.sql`

### Step 4 — Vocabulary progress in Supabase ✅

- [lib/supabase/vocabulary-progress.ts](./lib/supabase/vocabulary-progress.ts) — CRUD on `user_vocabulary_progress` via `vocabulary_word_id` (`dbId` on [VocabularyWord](./types/lesson.ts))
- [lib/progress.ts](./lib/progress.ts) — `getLearnedWordsSmart`, `toggleLearnedWordSmart`, `getAllLearnedWordsSmart`
- Vocabulary + review pages read/write Supabase when logged in; localStorage always mirrored
### Step 5 — Quiz attempts in Supabase ✅

- [lib/supabase/quiz-attempts.ts](./lib/supabase/quiz-attempts.ts) — `getUserQuizAttempts`, `saveSupabaseQuizAttempt`, aggregate latest/best per lesson
- [lib/progress.ts](./lib/progress.ts) — `saveQuizResultSmart`, `getQuizResultSmart`, `getAllQuizResultsSmart`
- Quiz finish → `insert` into `user_quiz_attempts` + localStorage; profile/review read Supabase when logged in

### Step 6 — localStorage migration ✅

- [lib/supabase/progress-sync.ts](./lib/supabase/progress-sync.ts), [components/progress-sync-card.tsx](./components/progress-sync-card.tsx) on `/profile`
- Merge lessons (max status), vocabulary (`vocabulary_word_id`), quiz (insert if no remote or better best %)
- `clearLocalProgressAfterSync()` after successful merge; “Дараа” dismisses without deleting local

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
