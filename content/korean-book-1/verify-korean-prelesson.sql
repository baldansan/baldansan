-- Korean Book 1 PreLesson — post-import verification (read-only)
-- Run in Supabase SQL editor after bulk import.

-- Course
select id, title, level, status, order_index
from public.courses
where id = 'korean-1';

-- Lessons
select id, course_id, title, chinese_title, status, order_index, media_status,
       vocabulary_count, quiz_count
from public.lessons
where course_id = 'korean-1'
order by order_index;

-- Vocabulary counts per lesson
select lesson_id, count(*) as vocab_count
from public.vocabulary_words
where lesson_id in (
  select id from public.lessons where course_id = 'korean-1'
)
group by lesson_id
order by lesson_id;

-- Quiz counts per lesson
select lesson_id, count(*) as quiz_count
from public.quiz_questions
where lesson_id in (
  select id from public.lessons where course_id = 'korean-1'
)
group by lesson_id
order by lesson_id;

-- Subtitle counts (teacher lines / textbook flow)
select lesson_id, count(*) as subtitle_count
from public.subtitle_lines
where lesson_id in (
  select id from public.lessons where course_id = 'korean-1'
)
group by lesson_id
order by lesson_id;

-- Spot-check: PreLesson 01 vocabulary (Hangul in chinese column)
select lesson_id, chinese, pinyin, mongolian, order_index
from public.vocabulary_words
where lesson_id = 'k-pre-01'
order by order_index
limit 12;

-- Spot-check: quiz answer integrity
select lesson_id, type, question, correct_answer, options
from public.quiz_questions
where lesson_id in ('k-pre-01', 'k-pre-03', 'k-pre-05')
order by lesson_id, order_index
limit 15;
