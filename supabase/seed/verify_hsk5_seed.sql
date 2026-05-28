-- Verify HSK5 seed (run after 001_seed_hsk5_lessons.sql)
-- Expected: 1 course, 3 lessons, subtitle/vocab/quiz counts per lesson below

select * from public.courses;

select id, course_id, title, chinese_title, status, vocabulary_count, quiz_count, order_index
from public.lessons
order by order_index;

select lesson_id, count(*) as subtitle_count
from public.subtitle_lines
group by lesson_id
order by lesson_id;
-- Expected: 1 → 4, 2 → 6, 3 → 6

select lesson_id, count(*) as vocabulary_count
from public.vocabulary_words
group by lesson_id
order by lesson_id;
-- Expected: 1 → 5, 2 → 12, 3 → 12

select lesson_id, count(*) as quiz_count
from public.quiz_questions
group by lesson_id
order by lesson_id;
-- Expected: 1 → 5, 2 → 5, 3 → 5

-- Progress tables should remain empty until Phase 4
select count(*) as user_lesson_progress_rows from public.user_lesson_progress;
select count(*) as user_vocabulary_progress_rows from public.user_vocabulary_progress;
select count(*) as user_quiz_attempts_rows from public.user_quiz_attempts;
