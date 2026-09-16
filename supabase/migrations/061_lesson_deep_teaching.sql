-- =============================================================================
-- 061 — «Гүнзгий заах» нэмэлт агуулга (HSK1/HSK2 суурь түвшинд)
-- =============================================================================
--
-- ЯАГААД ТУСДАА ХҮСНЭГТ ВЭ:
-- Хичээлийн үндсэн багц нь `lessons.source_note` дотор том JSON хэлбэрээр
-- байдаг — номоос хөрвүүлсэн эх өгөгдөл. Түүнийг дахин бичвэл эх сурвалжтай
-- зөрөх, алдвал хичээл бүхэлдээ эвдрэх эрсдэлтэй. Тиймээс багшийн нэмэлт
-- тайлбарыг энд тусад нь хадгална. Мөр байхгүй бол хичээл урьдын адил
-- ажиллана — юу ч эвдрэхгүй.
--
-- Агуулгын бүтэц: types/lesson-deep-teaching.ts
--
-- Дахин ажиллуулахад аюулгүй.
-- =============================================================================

create table if not exists public.lesson_deep_teaching (
  lesson_id   text primary key
              references public.lessons (id) on delete cascade,
  version     integer not null default 1,
  -- { words: [...], grammar: [...], hanzi: [...], pronunciation: {...} }
  payload     jsonb   not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.lesson_deep_teaching is
  'Хичээлийн нэмэлт, гүнзгий заах агуулга. Эх багцыг (lessons.source_note) хөндөхгүй, дээрээс нь давхарлана.';
comment on column public.lesson_deep_teaching.payload is
  'types/lesson-deep-teaching.ts дэх LessonDeepTeaching бүтэц (lesson_id, version-гүйгээр).';

create index if not exists lesson_deep_teaching_updated_idx
  on public.lesson_deep_teaching (updated_at desc);

-- updated_at автоматаар шинэчлэгдэнэ.
create or replace function public.touch_lesson_deep_teaching()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lesson_deep_teaching_touch on public.lesson_deep_teaching;
create trigger lesson_deep_teaching_touch
  before update on public.lesson_deep_teaching
  for each row execute function public.touch_lesson_deep_teaching();

-- ---------------------------------------------------------------- RLS ------
-- Хичээлийн агуулга нь нийтийн уншигдах өгөгдөл — хичээлүүдтэй ижил.
-- Бичих эрхийг зөвхөн админд өгнө.
alter table public.lesson_deep_teaching enable row level security;

drop policy if exists lesson_deep_teaching_read on public.lesson_deep_teaching;
create policy lesson_deep_teaching_read
  on public.lesson_deep_teaching
  for select
  using (true);

drop policy if exists lesson_deep_teaching_admin_write on public.lesson_deep_teaching;
create policy lesson_deep_teaching_admin_write
  on public.lesson_deep_teaching
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Шалгах:
--   select lesson_id, jsonb_array_length(coalesce(payload->'words','[]'::jsonb)) as words,
--          jsonb_array_length(coalesce(payload->'grammar','[]'::jsonb)) as grammar,
--          jsonb_array_length(coalesce(payload->'hanzi','[]'::jsonb)) as hanzi
--     from public.lesson_deep_teaching order by lesson_id;
