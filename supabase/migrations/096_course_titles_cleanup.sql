-- 096: Курсын нэр, тайлбарыг цэгцлэх (өмнө нь нэр нь код хэвээр байсан: «fazhan-chuji1», «yct-1»).
-- Зөвхөн нэр/тайлбар өөрчилнө, хичээлд нөлөөгүй. Дахин ажиллуулахад аюулгүй.
update public.courses c set title = v.title, description = v.description, updated_at = now()
from (values
  ('hsk1', 'HSK 1', 'HSK 标准教程 1 — 15 хичээл, анхан шат'),
  ('hsk2', 'HSK 2', 'HSK 标准教程 2 — 15 хичээл'),
  ('hsk3', 'HSK 3', 'HSK 标准教程 3 — 20 хичээл'),
  ('hsk4', 'HSK 4', 'HSK 标准教程 4 (上, 下) — 20 хичээл'),
  ('hsk5', 'HSK 5', 'HSK 标准教程 5 (上, 下) — 36 хичээл'),
  ('hsk6', 'HSK 6', 'HSK 标准教程 6 (上, 下) — 40 хичээл'),
  ('yct-1', 'YCT 1', 'Бага сургуулийн хятад хэл · YCT 1-р түвшин'),
  ('yct-2', 'YCT 2', 'Бага сургуулийн хятад хэл · YCT 2-р түвшин (≈HSK1)'),
  ('yct-3', 'YCT 3', 'Бага сургуулийн хятад хэл · YCT 3-р түвшин (≈HSK2)'),
  ('yct-4', 'YCT 4', 'Бага сургуулийн хятад хэл · YCT 4-р түвшин (≈HSK2)'),
  ('yct-5', 'YCT 5', 'Бага сургуулийн хятад хэл · YCT 5-р түвшин (≈HSK3)'),
  ('yct-6', 'YCT 6', 'Бага сургуулийн хятад хэл · YCT 6-р түвшин (≈HSK3)'),
  ('fazhan-chuji1', '发展汉语 · Анхан шат 1', '初级综合 I — ≈ HSK 1–2, 30 хичээл'),
  ('fazhan-chuji2', '发展汉语 · Анхан шат 2', '初级综合 II — ≈ HSK 3, 25 хичээл'),
  ('fazhan-zhongji1', '发展汉语 · Дунд шат 1', '中级综合 I — ≈ HSK 4, 15 хичээл'),
  ('fazhan-zhongji2', '发展汉语 · Дунд шат 2', '中级综合 II — ≈ HSK 5, 15 хичээл'),
  ('fazhan-gaoji1', '发展汉语 · Ахисан шат 1', '高级综合 I — ≈ HSK 6, 15 хичээл'),
  ('fazhan-gaoji2', '发展汉语 · Ахисан шат 2', '高级综合 II — ≈ HSK 6, 15 хичээл')
) as v(id, title, description)
where c.id = v.id;

-- Хоосон давхар курс (хичээлгүй) байвал устгана.
delete from public.courses c
where c.id = 'fazhan-zhongji-1'
  and not exists (select 1 from public.lessons l where l.course_id = c.id);
