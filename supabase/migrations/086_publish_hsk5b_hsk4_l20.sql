-- =============================================================================
-- 086 — HSK5 下 (19–36-р хичээл) болон HSK4 20-р хичээлийг НИЙТЛЭХ
-- =============================================================================
-- Хичээлүүд /admin/import/chinese-ээр НООРОГ болж орсон. Энэ скрипт тэдгээрийг
-- сурагчдад харагддаг болгоно. Supabase → SQL Editor → бүхэлд нь Run (1 удаа).
-- Дахин ажиллуулахад аюулгүй.

update public.lessons
set status = 'available', release_status = 'published'
where id = 'hsk4-l20'
   or (course_id = 'hsk5' and order_index between 19 and 36);

-- ШАЛГАХ — hsk5_published 36, hsk4_published 20, drafts_left 0 байх ёстой
select
  (select count(*) from public.lessons where course_id = 'hsk5' and release_status = 'published') as hsk5_published,
  (select count(*) from public.lessons where course_id = 'hsk4' and release_status = 'published') as hsk4_published,
  (select count(*) from public.lessons where course_id in ('hsk4','hsk5') and status = 'draft') as drafts_left;
