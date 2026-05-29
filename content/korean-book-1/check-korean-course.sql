-- Korean Book 1 — verification queries (read-only)
-- Run after course + lessons + bulk import

-- Course exists
select id, title, level, status, order_index
from public.courses
where id = 'korean-1';

-- Lessons in course
select id, title, chinese_title, order_index, status, media_status,
       vocabulary_count, quiz_count
from public.lessons
where course_id = 'korean-1'
order by order_index;

-- Vocabulary count per lesson
select l.id as lesson_id, l.title, count(v.*) as vocab_rows
from public.lessons l
left join public.vocabulary_words v on v.lesson_id = l.id
where l.course_id = 'korean-1'
group by l.id, l.title
order by l.order_index;

-- Quiz count per lesson
select l.id as lesson_id, l.title, count(q.*) as quiz_rows
from public.lessons l
left join public.quiz_questions q on q.lesson_id = l.id
where l.course_id = 'korean-1'
group by l.id, l.title
order by l.order_index;

-- Subtitle count per lesson
select l.id as lesson_id, l.title, count(s.*) as subtitle_rows
from public.lessons l
left join public.subtitle_lines s on s.lesson_id = l.id
where l.course_id = 'korean-1'
group by l.id, l.title
order by l.order_index;

-- Sample vocabulary (Korean in chinese column)
select lesson_id, chinese, pinyin, mongolian, order_index
from public.vocabulary_words
where lesson_id in ('k-hangul', 'k-01', 'k-02')
order by lesson_id, order_index
limit 20;

-- Quiz answer integrity spot-check
select lesson_id, type, question, correct_answer, options
from public.quiz_questions
where lesson_id in ('k-hangul', 'k-01', 'k-02')
order by lesson_id, order_index
limit 20;
