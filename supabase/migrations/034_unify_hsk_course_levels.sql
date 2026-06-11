-- 034: One HSK course per level (HSK 4, HSK 5, HSK 6) — no A/B split.
-- Lessons already use course_id hsk4 / hsk5; progress is keyed by lesson_id only.

UPDATE public.courses
SET
  title = 'HSK 4',
  level = 'HSK4',
  updated_at = now()
WHERE id = 'hsk4';

UPDATE public.courses
SET
  title = 'HSK 5',
  level = 'HSK5',
  updated_at = now()
WHERE id = 'hsk5';

INSERT INTO public.courses (id, title, description, level, status, order_index)
VALUES ('hsk6', 'HSK 6', NULL, 'HSK6', 'available', 6)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  level = EXCLUDED.level,
  updated_at = now();

-- Orphan row: hsk4a has 0 lessons; user_lesson_progress references lesson_id, not courses.
DELETE FROM public.courses WHERE id IN ('hsk4a');
