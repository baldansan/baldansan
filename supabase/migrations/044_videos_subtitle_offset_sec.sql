-- Global per-video subtitle timing offset (admin). User offset adds on top in the client.
alter table public.videos
  add column if not exists subtitle_offset_sec numeric not null default 0;

comment on column public.videos.subtitle_offset_sec is
  'Admin subtitle sync offset in seconds for all users.';

update public.videos
set subtitle_offset_sec = coalesce(sync_offset_sec, 0)
where subtitle_offset_sec = 0;
