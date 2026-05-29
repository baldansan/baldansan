-- Buunduu Surtsgaay — Phase 7 Step 4: user retention (daily activity, goals, streaks)
-- Safe to re-run: IF NOT EXISTS + drop policy if exists

-- ---------------------------------------------------------------------------
-- user_daily_activity
-- ---------------------------------------------------------------------------

create table if not exists public.user_daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  activity_date date not null,
  activity_type text not null,
  count integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_date, activity_type)
);

create index if not exists user_daily_activity_user_id_idx
  on public.user_daily_activity (user_id);

create index if not exists user_daily_activity_activity_date_idx
  on public.user_daily_activity (activity_date);

create index if not exists user_daily_activity_activity_type_idx
  on public.user_daily_activity (activity_type);

drop trigger if exists user_daily_activity_updated_at on public.user_daily_activity;
create trigger user_daily_activity_updated_at
  before update on public.user_daily_activity
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- user_daily_goals
-- ---------------------------------------------------------------------------

create table if not exists public.user_daily_goals (
  user_id uuid primary key,
  lessons_per_day integer not null default 1,
  words_per_day integer not null default 5,
  quizzes_per_day integer not null default 1,
  updated_at timestamptz not null default now()
);

drop trigger if exists user_daily_goals_updated_at on public.user_daily_goals;
create trigger user_daily_goals_updated_at
  before update on public.user_daily_goals
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- user_streaks
-- ---------------------------------------------------------------------------

create table if not exists public.user_streaks (
  user_id uuid primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

drop trigger if exists user_streaks_updated_at on public.user_streaks;
create trigger user_streaks_updated_at
  before update on public.user_streaks
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.user_daily_activity enable row level security;
alter table public.user_daily_goals enable row level security;
alter table public.user_streaks enable row level security;

-- user_daily_activity
drop policy if exists "user_daily_activity_select_own" on public.user_daily_activity;
create policy "user_daily_activity_select_own"
  on public.user_daily_activity for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_daily_activity_insert_own" on public.user_daily_activity;
create policy "user_daily_activity_insert_own"
  on public.user_daily_activity for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_daily_activity_update_own" on public.user_daily_activity;
create policy "user_daily_activity_update_own"
  on public.user_daily_activity for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_daily_goals
drop policy if exists "user_daily_goals_select_own" on public.user_daily_goals;
create policy "user_daily_goals_select_own"
  on public.user_daily_goals for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_daily_goals_insert_own" on public.user_daily_goals;
create policy "user_daily_goals_insert_own"
  on public.user_daily_goals for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_daily_goals_update_own" on public.user_daily_goals;
create policy "user_daily_goals_update_own"
  on public.user_daily_goals for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_streaks
drop policy if exists "user_streaks_select_own" on public.user_streaks;
create policy "user_streaks_select_own"
  on public.user_streaks for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_streaks_insert_own" on public.user_streaks;
create policy "user_streaks_insert_own"
  on public.user_streaks for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_streaks_update_own" on public.user_streaks;
create policy "user_streaks_update_own"
  on public.user_streaks for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
