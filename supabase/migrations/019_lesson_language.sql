-- Lesson content language tag (ko-MN, zh-MN) for multi-track filtering.
alter table public.lessons
  add column if not exists language text;

comment on column public.lessons.language is
  'BCP-47 style content language tag, e.g. ko-MN or zh-MN';

create index if not exists lessons_language_idx on public.lessons (language);
