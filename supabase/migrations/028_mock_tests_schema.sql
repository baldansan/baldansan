-- HSK загвар шалгалт (mock test) — толгой, асуулт, хэрэглэгчийн оролдлого
-- Ачаалах: scripts/load_mocktest.mjs
-- Storage: mocktest-audio bucket (003_mocktest_audio_bucket.sql)

create table if not exists public.mock_tests (
  id            bigserial primary key,
  test_code     text not null unique,
  hsk_level     int not null check (hsk_level >= 1 and hsk_level <= 9),
  title         text not null,
  sections      text[] not null default '{}',
  duration_min  int not null check (duration_min > 0),
  total_q       int not null check (total_q > 0),
  audio_url     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.mock_test_questions (
  id            bigserial primary key,
  test_id       bigint not null references public.mock_tests (id) on delete cascade,
  section       text not null,
  part          int not null default 1,
  order_index   int not null,
  q_type        text not null,
  question_text text,
  passage       text,
  options       jsonb,
  correct       text,
  image_url     text,
  explanation   text,
  constraint mock_test_questions_test_order_unique unique (test_id, order_index)
);

create table if not exists public.user_mock_attempts (
  id             bigserial primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  test_id        bigint not null references public.mock_tests (id) on delete cascade,
  answers        jsonb not null default '{}',
  score_total    int,
  score_sections jsonb,
  completed_at   timestamptz not null default now()
);

create index if not exists idx_mock_tests_level on public.mock_tests (hsk_level);
create index if not exists idx_mtq_test on public.mock_test_questions (test_id, order_index);
create index if not exists idx_uma_user_test on public.user_mock_attempts (user_id, test_id);

alter table public.mock_tests enable row level security;
alter table public.mock_test_questions enable row level security;
alter table public.user_mock_attempts enable row level security;

drop policy if exists "mt_public_read" on public.mock_tests;
create policy "mt_public_read"
  on public.mock_tests
  for select
  using (true);

drop policy if exists "mtq_public_read" on public.mock_test_questions;
create policy "mtq_public_read"
  on public.mock_test_questions
  for select
  using (true);

drop policy if exists "uma_own_select" on public.user_mock_attempts;
create policy "uma_own_select"
  on public.user_mock_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "uma_own_insert" on public.user_mock_attempts;
create policy "uma_own_insert"
  on public.user_mock_attempts
  for insert
  to authenticated
  with check (auth.uid() = user_id);
