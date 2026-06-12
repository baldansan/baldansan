-- Lesson path: per-stage completion stored as JSON array of stage ids.
alter table public.user_lesson_progress
  add column if not exists completed_stages jsonb not null default '[]'::jsonb;

comment on column public.user_lesson_progress.completed_stages is
  'Lesson path stage ids completed by the learner (e.g. goal_warmup, vocabulary, text).';
