-- 057: Ирцийн бүртгэл (classroom_attendance).
--
-- Яагаад хэрэгтэй вэ:
-- Сургалтын төв танхимаар ч, онлайнаар ч хичээл заадаг. Захирал, багш хоёрын
-- аль алинд нь «өнөөдөр хэн ирсэн бэ?» гэдэг хамгийн түрүүнд хэрэгтэй тоо.
-- Одоогоор аппад үүнийг бүртгэх газар алга. Энэ засвар нэг хичээлийн өдрийн
-- ирцийг сурагч тус бүрээр хадгалах хүснэгт нэмнэ.
--
-- Загварын гол шийдвэр:
-- student_id нь public.classroom_students(id) — өөрөөр хэлбэл БҮРТГЭЛИЙН мөр,
-- хэрэглэгчийн ID биш. Ингэснээр урилга илгээсэн боловч хараахан бүртгэлээ
-- үүсгээгүй сурагчийн ирцийг мөн тэмдэглэж чадна. Сурагч дараа нь бүртгэлээ
-- холбоход (classroom_students.student_user_id бөглөгдөхөд) өмнөх ирц нь
-- шууд өөрт нь харагдана.
--
-- Дахин ажиллуулахад аюулгүй: create ... if not exists, drop policy if exists.

-- ---------------------------------------------------------------------------
-- Хүснэгт
-- ---------------------------------------------------------------------------

create table if not exists public.classroom_attendance (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.classroom_students(id) on delete cascade,
  session_date date not null,
  status text not null default 'present',
  note text,
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.classroom_attendance is
  'Ирцийн бүртгэл: нэг анги, нэг сурагч, нэг өдрийн ирцийн төлөв.';
comment on column public.classroom_attendance.student_id is
  'public.classroom_students(id) — бүртгэлийн мөр. Данс үүсгээгүй сурагчийн ирц ч бүртгэгдэнэ.';
comment on column public.classroom_attendance.session_date is
  'Хичээл болсон өдөр (Улаанбаатарын цагаар тооцож бичнэ).';
comment on column public.classroom_attendance.status is
  'present | absent | late | excused — Ирсэн | Тасалсан | Хоцорсон | Чөлөөтэй.';
comment on column public.classroom_attendance.note is
  'Заавал биш тэмдэглэл, жишээ нь тасалсан шалтгаан.';
comment on column public.classroom_attendance.recorded_by is
  'Ирцийг бүртгэсэн багшийн auth.users.id.';

-- Төлөвийн хязгаарлалт. Хүснэгт өмнө нь үүссэн байж болох тул нөхцөлтэйгөөр нэмнэ.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'classroom_attendance_status_check'
  ) then
    alter table public.classroom_attendance
      add constraint classroom_attendance_status_check
      check (status in ('present', 'absent', 'late', 'excused'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Индексүүд
--
-- Давхардлаас хамгаалах индекс нь upsert-ийн түлхүүр: нэг өдрийн ирцийг дахин
-- бүртгэхэд шинэ мөр үүсгэхгүй, хуучныг нь шинэчилнэ.
-- ---------------------------------------------------------------------------

create unique index if not exists classroom_attendance_unique_idx
  on public.classroom_attendance (classroom_id, student_id, session_date);

create index if not exists classroom_attendance_classroom_date_idx
  on public.classroom_attendance (classroom_id, session_date);

create index if not exists classroom_attendance_student_idx
  on public.classroom_attendance (student_id);

-- ---------------------------------------------------------------------------
-- updated_at триггер (011 засварын загвар)
-- ---------------------------------------------------------------------------

drop trigger if exists classroom_attendance_updated_at on public.classroom_attendance;
create trigger classroom_attendance_updated_at
  before update on public.classroom_attendance
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Тусламжийн функцууд
--
-- RLS политик дотроос classrooms / classroom_students руу шууд хандвал тэдгээр
-- хүснэгтийн өөрийнх нь политиктой орооцолдоно. Тиймээс 013 болон 055
-- засваруудын загварын дагуу security definer функц ашиглана. Функцууд нь
-- зөвхөн true/false буцаана, өгөгдөл буцаадаггүй.
-- ---------------------------------------------------------------------------

create or replace function public.teacher_owns_classroom(
  target_classroom_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_classroom_id is not null
    and check_user_id is not null
    and exists (
      select 1
      from public.classrooms c
      where c.id = target_classroom_id
        and c.teacher_user_id = check_user_id
    );
$$;

comment on function public.teacher_owns_classroom(uuid, uuid) is
  'Энэ хэрэглэгч тухайн ангийн багш мөн үү. Зөвхөн classrooms.teacher_user_id тааралдвал true.';

create or replace function public.owns_classroom_student_row(
  target_student_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_student_id is not null
    and check_user_id is not null
    and exists (
      select 1
      from public.classroom_students cs
      where cs.id = target_student_id
        and cs.student_user_id = check_user_id
    );
$$;

comment on function public.owns_classroom_student_row(uuid, uuid) is
  'Энэ хэрэглэгч тухайн бүртгэлийн мөрийн эзэн сурагч мөн үү. Өөрийн ирцээ л харуулахад хэрэглэнэ.';

grant execute on function public.teacher_owns_classroom(uuid, uuid) to authenticated;
grant execute on function public.owns_classroom_student_row(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
--
-- Хэнд юу зөвшөөрөгдөх вэ:
--   • Ангийн багш      — өөрийн ангийн мөрийг унших, нэмэх, засах, устгах.
--   • Админ            — зөвхөн унших.
--   • Бүртгэлтэй сурагч — ЗӨВХӨН өөрийн ирцийг унших. Бичихгүй.
--   • Бусад бүх хүн    — юу ч харахгүй. Нэгдмэл (blanket) политик байхгүй.
-- ---------------------------------------------------------------------------

alter table public.classroom_attendance enable row level security;

drop policy if exists "classroom_attendance_teacher_select" on public.classroom_attendance;
create policy "classroom_attendance_teacher_select"
  on public.classroom_attendance
  for select
  to authenticated
  using (public.teacher_owns_classroom(classroom_id));

comment on policy "classroom_attendance_teacher_select" on public.classroom_attendance is
  'Багш өөрийн ангийн ирцийг харна. Өөр багшийн ангийн мөр харагдахгүй.';

drop policy if exists "classroom_attendance_teacher_insert" on public.classroom_attendance;
create policy "classroom_attendance_teacher_insert"
  on public.classroom_attendance
  for insert
  to authenticated
  with check (public.teacher_owns_classroom(classroom_id));

comment on policy "classroom_attendance_teacher_insert" on public.classroom_attendance is
  'Багш зөвхөн өөрийн ангид ирц бүртгэнэ.';

drop policy if exists "classroom_attendance_teacher_update" on public.classroom_attendance;
create policy "classroom_attendance_teacher_update"
  on public.classroom_attendance
  for update
  to authenticated
  using (public.teacher_owns_classroom(classroom_id))
  with check (public.teacher_owns_classroom(classroom_id));

comment on policy "classroom_attendance_teacher_update" on public.classroom_attendance is
  'Ирцийг дахин бүртгэхэд хуучин мөр шинэчлэгдэнэ. Зөвхөн өөрийн анги.';

drop policy if exists "classroom_attendance_teacher_delete" on public.classroom_attendance;
create policy "classroom_attendance_teacher_delete"
  on public.classroom_attendance
  for delete
  to authenticated
  using (public.teacher_owns_classroom(classroom_id));

comment on policy "classroom_attendance_teacher_delete" on public.classroom_attendance is
  'Алдаатай бүртгэлийг багш өөрийн ангиасаа устгана.';

drop policy if exists "classroom_attendance_admin_select" on public.classroom_attendance;
create policy "classroom_attendance_admin_select"
  on public.classroom_attendance
  for select
  to authenticated
  using ((select public.is_admin()));

comment on policy "classroom_attendance_admin_select" on public.classroom_attendance is
  'Админ бүх ирцийг харна. Бичих эрх өгөөгүй — ирцийг багш л хөтөлнө.';

drop policy if exists "classroom_attendance_student_select_own" on public.classroom_attendance;
create policy "classroom_attendance_student_select_own"
  on public.classroom_attendance
  for select
  to authenticated
  using (public.owns_classroom_student_row(student_id));

comment on policy "classroom_attendance_student_select_own" on public.classroom_attendance is
  'Сурагч зөвхөн ӨӨРИЙН ирцийг харна. Ангийнхаа бусад сурагчийн мөрийг харахгүй.';
