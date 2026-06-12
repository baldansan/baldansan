-- HSK-scale scores and per-section breakdown for mock test attempts.
alter table public.user_test_attempts
  add column if not exists score_metadata jsonb not null default '{}'::jsonb;

comment on column public.user_test_attempts.score_metadata is
  'HSK section scores (0–100 each), pass flag, writing self-grade state.';
