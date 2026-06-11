-- 038: Per-user bichleg watch progress (furthest watched second + completed flag)

create table if not exists public.user_video_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  video_id        text not null references public.videos (id) on delete cascade,
  watched_sec     numeric not null default 0,
  completed       boolean not null default false,
  last_watched_at timestamptz not null default now(),
  constraint user_video_progress_user_video_unique unique (user_id, video_id)
);

create index if not exists idx_user_video_progress_user_video
  on public.user_video_progress (user_id, video_id);

create index if not exists idx_user_video_progress_continue
  on public.user_video_progress (user_id, last_watched_at desc)
  where completed = false and watched_sec > 0;

comment on table public.user_video_progress is
  'Learner watch progress for /bichleg videos; watched_sec is monotonic max position.';

alter table public.user_video_progress enable row level security;

drop policy if exists "uvp_own_select" on public.user_video_progress;
create policy "uvp_own_select"
  on public.user_video_progress for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "uvp_own_insert" on public.user_video_progress;
create policy "uvp_own_insert"
  on public.user_video_progress for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "uvp_own_update" on public.user_video_progress;
create policy "uvp_own_update"
  on public.user_video_progress for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
