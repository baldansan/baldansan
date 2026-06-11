-- 036: video_series.cover_url (already on production via 031; safe for fresh installs).

alter table public.video_series
  add column if not exists cover_url text;

comment on column public.video_series.cover_url is
  'Public path to series cover, e.g. /covers/series-hsk4.png';
