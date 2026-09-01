-- Listening quiz support: per-question audio clip URL.
-- quiz.json items may carry `audio` (ZIP path, uploaded to Storage on import)
-- or `audioUrl` (absolute URL). listening_quiz_draft.json items merge in with audio.

alter table public.quiz_questions
  add column if not exists audio_url text;

comment on column public.quiz_questions.audio_url is
  'Optional listening-question audio clip URL (Storage public URL or absolute URL).';
