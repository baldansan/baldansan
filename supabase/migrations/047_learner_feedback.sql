-- Learner feedback: question thumbs, lesson difficulty, issue reports
-- Safe to re-run

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  lesson_id text,
  stage text not null,
  question_id text,
  rating text,
  note text,
  page_path text,
  created_at timestamptz not null default now()
);

comment on table public.feedback is
  'Learner feedback: question up/down, lesson difficulty, issue reports.';

create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

create index if not exists feedback_stage_created_idx
  on public.feedback (stage, created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_all" on public.feedback;
create policy "feedback_insert_all"
  on public.feedback
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "feedback_admin_select" on public.feedback;
create policy "feedback_admin_select"
  on public.feedback
  for select
  to authenticated
  using (public.is_admin());

-- Admin read learner progress for /admin/learner
drop policy if exists "user_lesson_progress_admin_select" on public.user_lesson_progress;
create policy "user_lesson_progress_admin_select"
  on public.user_lesson_progress
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "user_word_srs_admin_select" on public.user_word_srs;
create policy "user_word_srs_admin_select"
  on public.user_word_srs
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "user_test_attempts_admin_select" on public.user_test_attempts;
create policy "user_test_attempts_admin_select"
  on public.user_test_attempts
  for select
  to authenticated
  using (public.is_admin());
