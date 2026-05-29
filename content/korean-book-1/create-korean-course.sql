-- Korean Book 1 — create or update course row
-- Run manually in Supabase SQL editor. Does NOT modify schema.
-- Do NOT run from CI/automation.

insert into public.courses (id, title, description, level, status, order_index)
values (
  'korean-1',
  'Солонгост ажиллахад хэрэгтэй Солонгос хэл',
  'Солонгос үсэг, үндсэн үг, өгүүлбэр, ажил амьдралд хэрэгтэй хэллэгийг өдөр бүр богино хичээлээр сурах course.',
  'Beginner',
  'available',
  10
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  status = excluded.status,
  order_index = excluded.order_index;

-- Admin reference (not stored in courses table unless your CMS has extra columns):
--   Internal title:     Korean Book 1
--   mongolianTitle:     Монгол хүнд зориулсан Солонгос хэл 1
--   publicTitle:        Солонгост ажиллахад хэрэгтэй Солонгос хэл
--
-- After course exists, create lesson shells k-pre-01 … k-pre-08 in admin,
-- then bulk-import JSON from content/korean-book-1/.

select id, title, level, status, order_index
from public.courses
where id = 'korean-1';
