-- Buunduu Surtsgaay — Phase 5 Step 15: lesson media metadata fields
-- URL-based media only (no file upload / Storage yet)

alter table public.lessons
  add column if not exists video_url text;

alter table public.lessons
  add column if not exists thumbnail_url text;

alter table public.lessons
  add column if not exists audio_url text;

alter table public.lessons
  add column if not exists source_note text;

alter table public.lessons
  add column if not exists media_status text not null default 'missing';

update public.lessons
set media_status = 'missing'
where media_status is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lessons_media_status_check'
  ) then
    alter table public.lessons
      add constraint lessons_media_status_check
      check (media_status in ('missing', 'pending', 'ready'));
  end if;
end $$;

comment on column public.lessons.video_url is 'External video URL (mp4/webm or embed page). No upload yet.';
comment on column public.lessons.thumbnail_url is 'Cover/thumbnail image URL.';
comment on column public.lessons.audio_url is 'Optional audio resource URL.';
comment on column public.lessons.source_note is 'Admin note: source platform, rights, filename, etc.';
comment on column public.lessons.media_status is 'missing | pending | ready — admin workflow flag.';
