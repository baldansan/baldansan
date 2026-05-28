-- =============================================================================
-- Buunduu Surtsgaay — Phase 4: Auth + Row Level Security (PLANNED)
-- =============================================================================
--
-- ⚠️  REVIEW BEFORE RUNNING IN SUPABASE
--
-- This file is a *planning* artifact for Phase 4 Step 1. Do NOT run it until:
--   1. Supabase Auth is enabled on the project (email/OAuth/etc.).
--   2. Phase 4 Step 2+ auth helpers and login/signup UI are implemented.
--   3. App code is ready to write progress with the authenticated user's JWT.
--
-- Prerequisites assumed:
--   - Migration 001_initial_schema.sql has already been applied.
--   - Content tables are seeded (lessons 1–4, vocabulary, quiz, etc.).
--   - Anon key remains used for *read-only* lesson content in the app today.
--
-- Schema note (no change in Step 1):
--   user_id on progress tables is uuid but does NOT yet reference auth.users(id).
--   Phase 4 Step 2 may add:
--     alter table ... alter column user_id set not null;
--     alter table ... add constraint ... foreign key (user_id) references auth.users(id);
--   after testing sign-up and RLS together.
--
-- Policy model summary:
--   A) Content tables  → public SELECT only (anon + authenticated).
--   B) Progress tables → authenticated users CRUD *only their own* rows (auth.uid() = user_id).
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) PUBLIC CONTENT — enable RLS, allow read-only for everyone
-- -----------------------------------------------------------------------------

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.subtitle_lines enable row level security;
alter table public.vocabulary_words enable row level security;
alter table public.quiz_questions enable row level security;

-- courses: anyone can read published catalog rows (no writes via client anon key)
create policy "courses_public_select"
  on public.courses
  for select
  to anon, authenticated
  using (true);

-- lessons: public read for lesson list and detail
create policy "lessons_public_select"
  on public.lessons
  for select
  to anon, authenticated
  using (true);

-- subtitle_lines: public read for watch page
create policy "subtitle_lines_public_select"
  on public.subtitle_lines
  for select
  to anon, authenticated
  using (true);

-- vocabulary_words: public read for vocabulary page and review word resolution
create policy "vocabulary_words_public_select"
  on public.vocabulary_words
  for select
  to anon, authenticated
  using (true);

-- quiz_questions: public read for quiz page (answers still validated server-side in app)
create policy "quiz_questions_public_select"
  on public.quiz_questions
  for select
  to anon, authenticated
  using (true);

-- No INSERT / UPDATE / DELETE policies on content tables → denied by default under RLS.

-- -----------------------------------------------------------------------------
-- B) USER PROGRESS — private per auth.uid()
-- -----------------------------------------------------------------------------

alter table public.user_lesson_progress enable row level security;
alter table public.user_vocabulary_progress enable row level security;
alter table public.user_quiz_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- user_lesson_progress
-- Maps to app: lesson status (not_started / started / completed), progress %
-- ---------------------------------------------------------------------------

create policy "user_lesson_progress_select_own"
  on public.user_lesson_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_lesson_progress_insert_own"
  on public.user_lesson_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_lesson_progress_update_own"
  on public.user_lesson_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: allow user to reset/remove a lesson progress row (e.g. dev or “start over”)
create policy "user_lesson_progress_delete_own"
  on public.user_lesson_progress
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_vocabulary_progress
-- Maps to app: “Mark as learned” / Review saved words (vocabulary_word_id FK)
-- ---------------------------------------------------------------------------

create policy "user_vocabulary_progress_select_own"
  on public.user_vocabulary_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_vocabulary_progress_insert_own"
  on public.user_vocabulary_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_vocabulary_progress_update_own"
  on public.user_vocabulary_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: un-mark a word as learned
create policy "user_vocabulary_progress_delete_own"
  on public.user_vocabulary_progress
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_quiz_attempts
-- Maps to app: quiz result screen, profile/review quiz summary (append-only log)
-- No UPDATE/DELETE — attempts are immutable history
-- ---------------------------------------------------------------------------

create policy "user_quiz_attempts_select_own"
  on public.user_quiz_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_quiz_attempts_insert_own"
  on public.user_quiz_attempts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- =============================================================================
-- Post-apply verification (run manually after policies are applied)
-- =============================================================================
--
-- 1. As anon: SELECT from lessons → should succeed.
-- 2. As anon: INSERT into user_lesson_progress → should fail.
-- 3. As authenticated user A: INSERT progress with user_id = A → succeed.
-- 4. As authenticated user A: SELECT progress where user_id = B → empty / denied.
--
-- =============================================================================
