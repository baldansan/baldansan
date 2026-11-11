-- =============================================================================
-- 088 — HSK4 11–19-р хичээлийг (шинэчилсэн, зузаан хувилбар) ДАХИН НИЙТЛЭХ
-- =============================================================================
-- Хичээлүүдийг дахин оруулахад түр НООРОГ болдог. Энэ скрипт буцааж нийтэлнэ.
-- Supabase → SQL Editor → бүхэлд нь Run (1 удаа). Дахин ажиллуулахад аюулгүй.

update public.lessons
set status = 'available', release_status = 'published'
where course_id = 'hsk4' and order_index between 11 and 19;

-- ШАЛГАХ — hsk4_published 20, drafts_left 0 байх ёстой
select
  (select count(*) from public.lessons where course_id = 'hsk4' and release_status = 'published') as hsk4_published,
  (select count(*) from public.lessons where course_id = 'hsk4' and status = 'draft') as drafts_left;
