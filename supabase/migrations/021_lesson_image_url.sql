-- Gold Standard lesson hero image URL (mirrors thumbnail_url for package imports)

alter table public.lessons
  add column if not exists image_url text;

comment on column public.lessons.image_url is 'Lesson hero/cover image URL from package media import.';
