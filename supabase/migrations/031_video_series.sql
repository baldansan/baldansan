-- Бичлэг цуврал (series) — 500+ ангитай цувралууд
-- Importer: scripts/load_videos.mjs, /admin/import/bichleg

create table if not exists public.video_series (
  id              text primary key,
  title_zh        text,
  title_mn        text,
  description_mn  text,
  cover_url       text,
  hsk_level       int,
  created_at      timestamptz not null default now()
);

alter table public.videos
  add column if not exists series_id text references public.video_series (id) on delete cascade,
  add column if not exists episode_no int;

create unique index if not exists idx_videos_series_episode
  on public.videos (series_id, episode_no)
  where series_id is not null;

create index if not exists idx_videos_series_id
  on public.videos (series_id);

alter table public.video_series enable row level security;

drop policy if exists "video_series_public_read" on public.video_series;
create policy "video_series_public_read"
  on public.video_series for select using (true);
