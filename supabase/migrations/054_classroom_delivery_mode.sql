-- 054: How a class is taught — in person, online, or both.
--
-- A training centre runs the same HSK level as a classroom group and as an
-- online group, and the director needs to compare them. Safe to re-run.

alter table public.classrooms
  add column if not exists delivery_mode text not null default 'in_person',
  add column if not exists schedule_note text,
  add column if not exists course_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'classrooms_delivery_mode_check'
  ) then
    alter table public.classrooms
      add constraint classrooms_delivery_mode_check
      check (delivery_mode in ('in_person', 'online', 'hybrid'));
  end if;
end $$;

comment on column public.classrooms.delivery_mode is
  'in_person | online | hybrid — how this class meets.';
comment on column public.classrooms.schedule_note is
  'Free text shown to the teacher and director, e.g. "Даваа, Лхагва 19:00".';
comment on column public.classrooms.course_id is
  'Which course catalog the class follows (hsk1 … hsk6, korean-1 …).';

create index if not exists classrooms_course_id_idx
  on public.classrooms (course_id);
