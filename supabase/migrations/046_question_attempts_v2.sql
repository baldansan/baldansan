-- Extend question_attempts for per-learner beta analytics
-- Safe to re-run

alter table public.question_attempts
  add column if not exists attempt_number integer not null default 1;

alter table public.question_attempts
  add column if not exists time_spent_ms integer;

create index if not exists question_attempts_user_created_idx
  on public.question_attempts (user_id, created_at desc);
