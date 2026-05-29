-- Korean Book 1 — optional course row
-- Run manually in Supabase SQL editor. Does not modify schema.
-- Adjust order_index if it conflicts with existing courses.

insert into public.courses (id, title, description, level, status, order_index)
values (
  'korean-1',
  'Солонгост ажиллахад хэрэгтэй Солонгос хэл',
  'Солонгос үсэг, үндсэн үг, өгүүлбэр, ажил амьдралд хэрэгтэй хэллэгийг өдөр бүр богино хичээлээр сурах course.',
  'Beginner',
  'draft',
  10
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  status = excluded.status;

-- Lesson shells are created via admin UI (recommended) with IDs:
-- k-pre-01 … k-pre-08 (order 0–7), k-01 (order 8), k-02 (order 9)
-- Content imported via bulk JSON on /admin/lessons/{id}/edit
