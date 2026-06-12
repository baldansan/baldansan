-- Optional youth slang explanation per subtitle line.
alter table public.video_subtitles
  add column if not exists slang_note jsonb;

comment on column public.video_subtitles.slang_note is
  'Optional slang note: term, meaning, usage, register (e.g. ярианы, наргиа).';
