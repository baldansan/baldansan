-- HSK mock test system (placement + checkpoint)
-- Replaces 028_mock_tests_schema shape. Importer: scripts/load_tests.mjs
-- Note: repo 025 is user_word_srs_fk; this is 029 (prompt asked 025_mock_tests).

drop table if exists public.user_question_responses cascade;
drop table if exists public.user_diagnostics cascade;
drop table if exists public.user_study_plan cascade;
drop table if exists public.user_test_attempts cascade;
drop table if exists public.user_mock_attempts cascade;
drop table if exists public.tag_lesson_map cascade;
drop table if exists public.skill_tags cascade;
drop table if exists public.mock_test_questions cascade;
drop table if exists public.mock_tests cascade;

create table public.mock_tests (
  id               text primary key,
  hsk_level        int not null check (hsk_level >= 1 and hsk_level <= 9),
  title            text not null,
  total_questions  int not null check (total_questions > 0),
  time_limit_min   int not null check (time_limit_min > 0),
  has_writing      boolean not null default false,
  sections         jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create table public.mock_test_questions (
  id               uuid primary key default gen_random_uuid(),
  test_id          text not null references public.mock_tests (id) on delete cascade,
  skill            text not null,
  part             int not null default 1,
  q_no             int not null,
  q_type           text not null,
  stem             text,
  options          jsonb,
  correct_answer   text,
  autograde        text not null default 'auto',
  points           numeric not null default 1,
  audio_url        text,
  image_url        text,
  needs_image      boolean not null default false,
  tags             text[] not null default '{}',
  target_lesson_id text,
  explanation_mn   text,
  constraint mock_test_questions_test_q_no_unique unique (test_id, q_no)
);

create table public.skill_tags (
  tag        text primary key,
  category   text not null,
  label_mn   text not null,
  hsk_level  int
);

create table public.tag_lesson_map (
  tag        text not null references public.skill_tags (tag) on delete cascade,
  lesson_id  text not null,
  priority   int not null default 1,
  primary key (tag, lesson_id)
);

create table public.user_test_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  test_id         text references public.mock_tests (id) on delete set null,
  mode            text not null,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  raw_score       numeric,
  max_score       numeric,
  assigned_level  int,
  confidence      numeric,
  status          text not null default 'in_progress'
);

create table public.user_question_responses (
  id           uuid primary key default gen_random_uuid(),
  attempt_id   uuid not null references public.user_test_attempts (id) on delete cascade,
  question_id  uuid not null references public.mock_test_questions (id) on delete cascade,
  user_answer  text,
  is_correct   boolean,
  time_ms      int,
  created_at   timestamptz not null default now()
);

create table public.user_diagnostics (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  attempt_id           uuid references public.user_test_attempts (id) on delete set null,
  per_skill            jsonb,
  weak_tags            jsonb,
  recommended_lessons  jsonb,
  assigned_level       int,
  created_at           timestamptz not null default now()
);

create table public.user_study_plan (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  lesson_id   text not null,
  reason_tag  text,
  status      text not null default 'todo',
  seq         int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_mtq_test on public.mock_test_questions (test_id);
create index if not exists idx_mtq_test_skill on public.mock_test_questions (test_id, skill);
create index if not exists idx_mtq_tags on public.mock_test_questions using gin (tags);
create index if not exists idx_uta_user on public.user_test_attempts (user_id);
create index if not exists idx_uqr_attempt on public.user_question_responses (attempt_id);

alter table public.mock_tests enable row level security;
alter table public.mock_test_questions enable row level security;
alter table public.skill_tags enable row level security;
alter table public.tag_lesson_map enable row level security;
alter table public.user_test_attempts enable row level security;
alter table public.user_question_responses enable row level security;
alter table public.user_diagnostics enable row level security;
alter table public.user_study_plan enable row level security;

drop policy if exists "mock_tests_public_read" on public.mock_tests;
create policy "mock_tests_public_read"
  on public.mock_tests for select using (true);

drop policy if exists "mock_test_questions_public_read" on public.mock_test_questions;
create policy "mock_test_questions_public_read"
  on public.mock_test_questions for select using (true);

drop policy if exists "skill_tags_public_read" on public.skill_tags;
create policy "skill_tags_public_read"
  on public.skill_tags for select using (true);

drop policy if exists "tag_lesson_map_public_read" on public.tag_lesson_map;
create policy "tag_lesson_map_public_read"
  on public.tag_lesson_map for select using (true);

drop policy if exists "uta_own_select" on public.user_test_attempts;
create policy "uta_own_select"
  on public.user_test_attempts for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "uta_own_insert" on public.user_test_attempts;
create policy "uta_own_insert"
  on public.user_test_attempts for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "uta_own_update" on public.user_test_attempts;
create policy "uta_own_update"
  on public.user_test_attempts for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "uqr_own_select" on public.user_question_responses;
create policy "uqr_own_select"
  on public.user_question_responses for select to authenticated
  using (
    exists (
      select 1 from public.user_test_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "uqr_own_insert" on public.user_question_responses;
create policy "uqr_own_insert"
  on public.user_question_responses for insert to authenticated
  with check (
    exists (
      select 1 from public.user_test_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "ud_own_select" on public.user_diagnostics;
create policy "ud_own_select"
  on public.user_diagnostics for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ud_own_insert" on public.user_diagnostics;
create policy "ud_own_insert"
  on public.user_diagnostics for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "usp_own_select" on public.user_study_plan;
create policy "usp_own_select"
  on public.user_study_plan for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "usp_own_insert" on public.user_study_plan;
create policy "usp_own_insert"
  on public.user_study_plan for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "usp_own_update" on public.user_study_plan;
create policy "usp_own_update"
  on public.user_study_plan for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: public test-assets bucket (also in supabase/storage/004_test_assets_bucket.sql)
insert into storage.buckets (id, name, public)
values ('test-assets', 'test-assets', true)
on conflict (id) do update
set name = excluded.name, public = excluded.public;

drop policy if exists "test_assets_public_select" on storage.objects;
create policy "test_assets_public_select"
  on storage.objects for select to public
  using (bucket_id = 'test-assets');
