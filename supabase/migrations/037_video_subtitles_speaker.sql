-- 037: video_subtitles.speaker — who is speaking (e.g. "Туслах", "孙月")

alter table public.video_subtitles
  add column if not exists speaker text;

comment on column public.video_subtitles.speaker is
  'Optional speaker label for dialogue subtitles; NULL when unknown.';
