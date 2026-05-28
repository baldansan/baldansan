-- =============================================================================
-- Buunduu Surtsgaay — Phase 5: Admin content management RLS (PLANNED)
-- =============================================================================
--
-- ⚠️  REVIEW BEFORE RUNNING IN SUPABASE
--
-- This file is a *planning* artifact for Phase 5 Step 1–2. Do NOT run until:
--   1. Phase 4 policies (001_auth_rls_policies.sql) are applied and tested.
--   2. At least one admin row is ready to bootstrap (see supabase/admin/README.md).
--   3. App admin UI and status filters (draft / available / archived) are designed.
--
-- Prerequisites assumed:
--   - Migration 001_initial_schema.sql applied.
--   - 001_auth_rls_policies.sql applied (content public read + progress private).
--
-- Policy model summary:
--   C) admin_profiles — admins know they are admin; admins manage admin list (after bootstrap)
--   D) Content tables — public SELECT published rows only; admins full CRUD on content
--   E) Progress tables — unchanged (still 001 policies)
--
-- Bootstrap note:
--   The FIRST admin must be inserted via SQL Editor (service role / dashboard), because
--   no admin exists yet to pass "admins manage admin_profiles" checks.
--
-- Status note (Step 2 migration may be required):
--   Today lessons.status is 'available' | 'locked'.
--   Phase 5 adds 'draft' | 'archived'. Until migrated, public SELECT may use
--   status in ('available', 'locked') or only 'available' — adjust after schema review.
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: is current JWT user an admin?
-- -----------------------------------------------------------------------------
-- Prefer a stable SQL function for policy readability. SECURITY DEFINER is NOT
-- required if the function only reads admin_profiles (RLS on that table still applies).
--
-- Review: enable stable search_path in production:
--   alter function public.is_admin() set search_path = public;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

comment on function public.is_admin() is
  'True when auth.uid() has a row in admin_profiles. Used by content admin RLS policies.';

-- -----------------------------------------------------------------------------
-- C) ADMIN PROFILES
-- -----------------------------------------------------------------------------

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

-- Authenticated users can see whether THEY are admin (for /admin gate UI)
create policy "admin_profiles_select_own"
  on public.admin_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Existing admins can list all admin profiles (optional; for admin user management UI)
create policy "admin_profiles_select_all_for_admins"
  on public.admin_profiles
  for select
  to authenticated
  using (public.is_admin());

-- Only admins can insert new admin rows (bootstrap: run first INSERT as superuser in SQL Editor)
create policy "admin_profiles_insert_admin_only"
  on public.admin_profiles
  for insert
  to authenticated
  with check (public.is_admin());

-- Only admins can update admin rows
create policy "admin_profiles_update_admin_only"
  on public.admin_profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Only admins can remove admin rows
create policy "admin_profiles_delete_admin_only"
  on public.admin_profiles
  for delete
  to authenticated
  using (public.is_admin());

-- No anon access to admin_profiles.

-- -----------------------------------------------------------------------------
-- D) CONTENT TABLES — public read published; admins write
-- -----------------------------------------------------------------------------
-- IMPORTANT: If 001 already created "using (true)" SELECT policies, you must
-- DROP or REPLACE them when applying this file so drafts are not world-readable.
-- Example (run manually after review):
--   drop policy if exists "lessons_public_select" on public.lessons;
--
-- Below assumes fresh policies or replacement. Adjust status filter after Step 2 migration.

-- ---------- courses ----------

-- Public: catalog courses that are available to learners
create policy "courses_public_select_available"
  on public.courses
  for select
  to anon, authenticated
  using (status = 'available');

-- Admins: read all courses (including coming_soon / draft catalog entries if added later)
create policy "courses_admin_select_all"
  on public.courses
  for select
  to authenticated
  using (public.is_admin());

create policy "courses_admin_insert"
  on public.courses
  for insert
  to authenticated
  with check (public.is_admin());

create policy "courses_admin_update"
  on public.courses
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "courses_admin_delete"
  on public.courses
  for delete
  to authenticated
  using (public.is_admin());

-- ---------- lessons ----------

-- Public: only published lessons (Phase 5: status = 'available')
-- Until 'draft' exists, existing seeds already use 'available'.
create policy "lessons_public_select_available"
  on public.lessons
  for select
  to anon, authenticated
  using (status = 'available');

-- Admins: read draft, locked, archived for editing and preview
create policy "lessons_admin_select_all"
  on public.lessons
  for select
  to authenticated
  using (public.is_admin());

create policy "lessons_admin_insert"
  on public.lessons
  for insert
  to authenticated
  with check (public.is_admin());

create policy "lessons_admin_update"
  on public.lessons
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "lessons_admin_delete"
  on public.lessons
  for delete
  to authenticated
  using (public.is_admin());

-- ---------- subtitle_lines ----------

-- Public: lines belonging to an available lesson only
create policy "subtitle_lines_public_select_available_lesson"
  on public.subtitle_lines
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.lessons l
      where l.id = subtitle_lines.lesson_id
        and l.status = 'available'
    )
  );

create policy "subtitle_lines_admin_select_all"
  on public.subtitle_lines
  for select
  to authenticated
  using (public.is_admin());

create policy "subtitle_lines_admin_insert"
  on public.subtitle_lines
  for insert
  to authenticated
  with check (public.is_admin());

create policy "subtitle_lines_admin_update"
  on public.subtitle_lines
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "subtitle_lines_admin_delete"
  on public.subtitle_lines
  for delete
  to authenticated
  using (public.is_admin());

-- ---------- vocabulary_words ----------

create policy "vocabulary_words_public_select_available_lesson"
  on public.vocabulary_words
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.lessons l
      where l.id = vocabulary_words.lesson_id
        and l.status = 'available'
    )
  );

create policy "vocabulary_words_admin_select_all"
  on public.vocabulary_words
  for select
  to authenticated
  using (public.is_admin());

create policy "vocabulary_words_admin_insert"
  on public.vocabulary_words
  for insert
  to authenticated
  with check (public.is_admin());

create policy "vocabulary_words_admin_update"
  on public.vocabulary_words
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "vocabulary_words_admin_delete"
  on public.vocabulary_words
  for delete
  to authenticated
  using (public.is_admin());

-- ---------- quiz_questions ----------

create policy "quiz_questions_public_select_available_lesson"
  on public.quiz_questions
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.lessons l
      where l.id = quiz_questions.lesson_id
        and l.status = 'available'
    )
  );

create policy "quiz_questions_admin_select_all"
  on public.quiz_questions
  for select
  to authenticated
  using (public.is_admin());

create policy "quiz_questions_admin_insert"
  on public.quiz_questions
  for insert
  to authenticated
  with check (public.is_admin());

create policy "quiz_questions_admin_update"
  on public.quiz_questions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "quiz_questions_admin_delete"
  on public.quiz_questions
  for delete
  to authenticated
  using (public.is_admin());

-- Regular authenticated learners: NO insert/update/delete on content (denied by default).
-- Progress tables: keep 001 policies only — do not duplicate here.

-- =============================================================================
-- Post-apply verification (manual)
-- =============================================================================
--
-- 1. Bootstrap admin (SQL Editor, not via client):
--      insert into public.admin_profiles (user_id, role) values ('<uuid>', 'admin');
-- 2. As anon: SELECT lessons where status = 'available' → succeed.
-- 3. As anon: SELECT lessons where status = 'draft' → empty (after draft rows exist).
-- 4. As non-admin authenticated: INSERT into lessons → fail.
-- 5. As admin authenticated: INSERT lesson draft → succeed; publish to available → public read works.
-- 6. As learner: progress INSERT still works (001 policies).
--
-- =============================================================================
