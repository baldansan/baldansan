-- =============================================================================
-- 062 — ЭХ СУРВАЛЖИЙН САН: HSK Standard Course номын хичээл бүрийн бүх агуулга
-- =============================================================================
--
-- ЯАГААД: Хичээл үйлдвэрлэхийн өмнө номын агуулгыг БҮТНЭЭР, ном дээр
-- байгаа хэлбэрээр нь (хятад/пиньинь/англи) нэг газар хадгална. Дараа нь
-- заах арга барилаа энэ дээр тулгуурлаж тогтоож, хичээлүүдийг үүнээс
-- үйлдвэрлэнэ. Монгол орчуулга, заах тайлбар энд ОРОХГҮЙ.
--
-- Бүтэц: types/hsk-source-lesson.ts (HskSourceLesson).
-- Нэг мөр = нэг ном + нэг хичээл. Дахин ажиллуулахад аюулгүй.
-- =============================================================================

create table if not exists public.hsk_source_lessons (
  id          text primary key,              -- "hsk3-l02"
  level       text not null,                 -- "hsk3"
  book        text not null,                 -- "HSK3", "HSK4B" …
  lesson      integer not null,              -- номын дугаар (4B: 11–20 …)
  title_zh    text not null,
  title_pinyin text,
  title_en    text,
  payload     jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  -- Шалгалтын байдал: ocr (зөвхөн OCR) / image_verified (зургаар тулгасан) / reviewed (хүн хянасан)
  status      text not null default 'image_verified'
              check (status in ('ocr','image_verified','reviewed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (level, lesson)
);

comment on table public.hsk_source_lessons is
  'HSK Standard Course номын хичээл бүрийн бүх агуулга номд байгаа хэлбэрээр (сурах бичиг + багшийн ном + дасгалын ном). Хичээл үйлдвэрлэхийн эх сурвалж.';
comment on column public.hsk_source_lessons.payload is
  'types/hsk-source-lesson.ts дэх HskSourceLesson бүтэц.';

create index if not exists hsk_source_lessons_level_idx
  on public.hsk_source_lessons (level, lesson);

create or replace function public.touch_hsk_source_lessons()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists hsk_source_lessons_touch on public.hsk_source_lessons;
create trigger hsk_source_lessons_touch
  before update on public.hsk_source_lessons
  for each row execute function public.touch_hsk_source_lessons();

alter table public.hsk_source_lessons enable row level security;

-- Зөвхөн админ уншиж, бичнэ (номын агуулга — суралцагчид шууд харуулахгүй).
drop policy if exists hsk_source_lessons_admin_read on public.hsk_source_lessons;
create policy hsk_source_lessons_admin_read
  on public.hsk_source_lessons for select
  using (public.is_admin());

drop policy if exists hsk_source_lessons_admin_write on public.hsk_source_lessons;
create policy hsk_source_lessons_admin_write
  on public.hsk_source_lessons for all
  using (public.is_admin())
  with check (public.is_admin());
