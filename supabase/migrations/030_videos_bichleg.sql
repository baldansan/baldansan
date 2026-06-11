-- Бичлэг: short video feed + subtitles + saved words
-- Importer: scripts/load_videos.mjs

create table if not exists public.videos (
  id               text primary key,
  youtube_id       text not null,
  title_zh         text,
  title_mn         text,
  source           text,
  source_url       text,
  hsk_level        int,
  duration_sec     numeric,
  sync_offset_sec  numeric not null default 0,
  tags             text[] not null default '{}',
  created_at       timestamptz not null default now()
);

create table if not exists public.video_subtitles (
  id         uuid primary key default gen_random_uuid(),
  video_id   text not null references public.videos (id) on delete cascade,
  idx        int not null,
  start_sec  numeric not null,
  end_sec    numeric not null,
  zh         text,
  pinyin     text,
  mn         text,
  words      jsonb,
  constraint video_subtitles_video_idx_unique unique (video_id, idx)
);

create table if not exists public.user_saved_words (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  zh              text not null,
  pinyin          text,
  mn              text,
  source_video_id text references public.videos (id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint user_saved_words_user_zh_unique unique (user_id, zh)
);

create index if not exists idx_video_subtitles_video_idx
  on public.video_subtitles (video_id, idx);
create index if not exists idx_user_saved_words_user
  on public.user_saved_words (user_id);

alter table public.videos enable row level security;
alter table public.video_subtitles enable row level security;
alter table public.user_saved_words enable row level security;

drop policy if exists "videos_public_read" on public.videos;
create policy "videos_public_read"
  on public.videos for select using (true);

drop policy if exists "video_subtitles_public_read" on public.video_subtitles;
create policy "video_subtitles_public_read"
  on public.video_subtitles for select using (true);

drop policy if exists "usw_own_select" on public.user_saved_words;
create policy "usw_own_select"
  on public.user_saved_words for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "usw_own_insert" on public.user_saved_words;
create policy "usw_own_insert"
  on public.user_saved_words for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "usw_own_delete" on public.user_saved_words;
create policy "usw_own_delete"
  on public.user_saved_words for delete to authenticated
  using (auth.uid() = user_id);
