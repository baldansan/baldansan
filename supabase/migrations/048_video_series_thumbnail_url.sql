-- 048: Admin-uploaded category thumbnail (Supabase Storage public URL).

alter table public.video_series
  add column if not exists thumbnail_url text;

comment on column public.video_series.thumbnail_url is
  'Public URL for series card thumbnail in video-thumbnails bucket.';
