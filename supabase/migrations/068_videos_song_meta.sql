-- 068: Дуу (karaoke) — videos / video_series дээр дууны мета (artist, year, kind).
-- Дуу = videos мөр (kind = 'song', tags {'song'}) — video_series id 'songs-*' дотор.
-- Дахин ажиллуулахад аюулгүй.

alter table public.videos
  add column if not exists artist text,
  add column if not exists year int,
  add column if not exists kind text not null default 'video';

create index if not exists idx_videos_kind on public.videos (kind);

alter table public.video_series
  add column if not exists kind text not null default 'video';

create index if not exists idx_video_series_kind on public.video_series (kind);

comment on column public.videos.artist is 'Дуучин / хамтлаг (дуу бол).';
comment on column public.videos.year is 'Дуу гарсан он.';
comment on column public.videos.kind is '''video'' | ''song'' — /bichleg/song/[id] karaoke хуудсанд ашиглана.';
comment on column public.video_series.kind is '''video'' | ''song'' — songs-* цуврал.';

-- Өмнө tags-аар тэмдэглэсэн дуунуудыг kind руу шилжүүлнэ.
update public.videos
set kind = 'song'
where kind = 'video' and 'song' = any (tags);

update public.video_series
set kind = 'song'
where kind = 'video' and id like 'songs-%';
