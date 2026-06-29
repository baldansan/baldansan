-- Per-option quiz feedback (quiz.json optionFeedback → option_feedback jsonb).

alter table public.quiz_questions
  add column if not exists option_feedback jsonb;

comment on column public.quiz_questions.option_feedback is
  'Map of option text → learner feedback shown after checking an answer.';
