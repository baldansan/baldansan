-- Buunduu Surtsgaay — per-answer learning analytics (question_attempts)
-- Safe to re-run: IF NOT EXISTS + drop policy if exists

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  lesson_id text not null,
  stage text not null,
  question_id text not null,
  question_type text not null,
  is_correct boolean not null,
  selected_answer text,
  correct_answer text,
  created_at timestamptz not null default now()
);

comment on table public.question_attempts is
  'Per-answer learner analytics: grammar, quiz, mock exam, word practice.';

create index if not exists question_attempts_lesson_question_idx
  on public.question_attempts (lesson_id, question_id);

create index if not exists question_attempts_created_at_idx
  on public.question_attempts (created_at desc);

create index if not exists question_attempts_stage_idx
  on public.question_attempts (stage);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.question_attempts enable row level security;

drop policy if exists "question_attempts_insert_all" on public.question_attempts;
create policy "question_attempts_insert_all"
  on public.question_attempts
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "question_attempts_admin_select" on public.question_attempts;
create policy "question_attempts_admin_select"
  on public.question_attempts
  for select
  to authenticated
  using (public.is_admin());
