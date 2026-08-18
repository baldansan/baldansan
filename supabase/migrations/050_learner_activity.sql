-- 050: Learner activity measurement (Оюу оноо — 1-р үе шат)
-- Time-on-surface sessions, server copy of game results, handwriting chars.
-- Safe to re-run: IF NOT EXISTS + drop policy if exists.

-- ---------------------------------------------------------------------------
-- 1. user_activity_sessions — seconds spent per (day, surface, ref)
-- ---------------------------------------------------------------------------

create table if not exists public.user_activity_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  surface    text not null,            -- 'lesson' | 'video' | 'game' | 'writing' | 'review' | 'mock'
  ref_id     text,                     -- lessonId / videoId / gameType / level ...
  seconds    int  not null default 0,  -- accumulated seconds for this day+surface+ref
  day        date not null,            -- learner's local (Ulaanbaatar) day, sent by client
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_activity_sessions_surface_check
    check (surface in ('lesson', 'video', 'game', 'writing', 'review', 'mock')),
  constraint user_activity_sessions_seconds_check check (seconds >= 0)
);

comment on table public.user_activity_sessions is
  'Learner time-on-task: seconds per user/day/surface/ref (upserted from the client tracker).';

-- One row per user+day+surface+ref (ref_id null → '').
create unique index if not exists user_activity_sessions_unique_idx
  on public.user_activity_sessions (user_id, day, surface, coalesce(ref_id, ''));

create index if not exists user_activity_sessions_user_day_idx
  on public.user_activity_sessions (user_id, day desc);

create index if not exists user_activity_sessions_day_idx
  on public.user_activity_sessions (day desc);

drop trigger if exists user_activity_sessions_updated_at on public.user_activity_sessions;
create trigger user_activity_sessions_updated_at
  before update on public.user_activity_sessions
  for each row
  execute function public.update_updated_at_column();

alter table public.user_activity_sessions enable row level security;

drop policy if exists "uas_own_select" on public.user_activity_sessions;
create policy "uas_own_select"
  on public.user_activity_sessions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "uas_own_insert" on public.user_activity_sessions;
create policy "uas_own_insert"
  on public.user_activity_sessions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "uas_own_update" on public.user_activity_sessions;
create policy "uas_own_update"
  on public.user_activity_sessions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "uas_admin_select" on public.user_activity_sessions;
create policy "uas_admin_select"
  on public.user_activity_sessions for select to authenticated
  using (public.is_admin());

-- Atomic "add seconds" — avoids read-modify-write races between tabs.
-- Called by the client tracker (and via sendBeacon on page hide).
create or replace function public.add_activity_seconds(
  p_surface text,
  p_ref_id  text,
  p_seconds int,
  p_day     date
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ref  text := nullif(coalesce(p_ref_id, ''), '');
begin
  if v_user is null then
    return; -- guest: nothing to record
  end if;
  if p_seconds is null or p_seconds <= 0 or p_seconds > 3600 then
    return; -- ignore empty / implausible chunks (client flushes ≤ 60s)
  end if;

  insert into public.user_activity_sessions (user_id, surface, ref_id, seconds, day)
  values (v_user, p_surface, v_ref, p_seconds, coalesce(p_day, current_date))
  on conflict (user_id, day, surface, (coalesce(ref_id, '')))
  do update set
    seconds    = public.user_activity_sessions.seconds + excluded.seconds,
    updated_at = now();
end;
$$;

revoke all on function public.add_activity_seconds(text, text, int, date) from public;
grant execute on function public.add_activity_seconds(text, text, int, date) to authenticated;

comment on function public.add_activity_seconds(text, text, int, date) is
  'Adds seconds to the caller''s user_activity_sessions row for day+surface+ref (RLS via auth.uid()).';

-- ---------------------------------------------------------------------------
-- 2. user_game_results — server copy of localStorage game results
-- ---------------------------------------------------------------------------

create table if not exists public.user_game_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  game_type  text not null,
  lesson_id  text not null default '',
  score      int  not null default 0,
  correct    int  not null default 0,
  total      int  not null default 0,
  accuracy   int  not null default 0,   -- percent 0..100
  played_at  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.user_game_results is
  'Per-play game results (mirrors buunduu-game-results-v1 in localStorage).';

create index if not exists user_game_results_user_played_idx
  on public.user_game_results (user_id, played_at desc);

create index if not exists user_game_results_game_type_idx
  on public.user_game_results (game_type);

alter table public.user_game_results enable row level security;

drop policy if exists "ugr_own_select" on public.user_game_results;
create policy "ugr_own_select"
  on public.user_game_results for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ugr_own_insert" on public.user_game_results;
create policy "ugr_own_insert"
  on public.user_game_results for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "ugr_admin_select" on public.user_game_results;
create policy "ugr_admin_select"
  on public.user_game_results for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. user_writing_chars — first time each hanzi was written by hand
-- ---------------------------------------------------------------------------

create table if not exists public.user_writing_chars (
  user_id          uuid not null references auth.users (id) on delete cascade,
  char             text not null,
  first_written_at timestamptz not null default now(),
  primary key (user_id, char)
);

comment on table public.user_writing_chars is
  'Handwriting course: which characters a learner has written (first completion time).';

alter table public.user_writing_chars enable row level security;

drop policy if exists "uwc_own_select" on public.user_writing_chars;
create policy "uwc_own_select"
  on public.user_writing_chars for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "uwc_own_insert" on public.user_writing_chars;
create policy "uwc_own_insert"
  on public.user_writing_chars for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "uwc_admin_select" on public.user_writing_chars;
create policy "uwc_admin_select"
  on public.user_writing_chars for select to authenticated
  using (public.is_admin());
