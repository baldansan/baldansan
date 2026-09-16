-- 059: Ангийн загвар шалгалт (classroom_exams) + багш сурагчийн шалгалтын
-- оролдлогыг унших эрх.
--
-- Яагаад хэрэгтэй вэ:
-- HSK загвар шалгалтыг (mock_tests) одоогоор суралцагч ганцаараа л өгдөг.
-- Ангиар өгөх — «багш ангидаа шалгалт товлоно, дараа нь хэн өгсөн, хэдэн
-- оноо авсан, ангийн дундаж хэд, тэнцсэн хувь хэд болохыг харна» — гэсэн
-- хэсэг байхгүй. Их сургуулийн тэнхимд хамгийн чухал тоо нь HSK-д тэнцсэн
-- хувь тул энэ хүснэгт нь B2B-ийн гол баримт болно.
--
-- Шаардлага: 011 (classrooms, classroom_students), 029 (mock_tests,
-- user_test_attempts), 055 (public.teacher_reads_learner).
--
-- Дахин ажиллуулахад аюулгүй: бүх үйлдэл if not exists / drop … if exists.

-- ---------------------------------------------------------------------------
-- Хүснэгт
--
-- test_id нь public.mock_tests.id-г заана. Тэр баганын төрөл нь TEXT
-- (жишээ нь 'HSK4-M1'), uuid БИШ — 029_mock_tests_system.sql-ыг үзнэ үү.
-- ---------------------------------------------------------------------------

create table if not exists public.classroom_exams (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  test_id text not null references public.mock_tests(id) on delete cascade,
  title text,
  scheduled_for date,
  due_date date,
  status text not null default 'scheduled',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.classroom_exams is
  'Багшийн ангидаа товлосон HSK загвар шалгалт. Нэг мөр = нэг анги + нэг шалгалт + нэг товлосон огноо.';
comment on column public.classroom_exams.test_id is
  'public.mock_tests.id (TEXT түлхүүр, жишээ нь HSK4-M1).';
comment on column public.classroom_exams.status is
  'scheduled = товлосон, open = өгч болно, closed = хаасан.';

-- Төлвийн шалгуур. Дахин ажиллуулахад мөргөлдөхгүй байхын тулд эхлээд хасна.
alter table public.classroom_exams
  drop constraint if exists classroom_exams_status_check;
alter table public.classroom_exams
  add constraint classroom_exams_status_check
  check (status in ('scheduled', 'open', 'closed'));

-- ---------------------------------------------------------------------------
-- Индекс
-- ---------------------------------------------------------------------------

create index if not exists classroom_exams_classroom_id_idx
  on public.classroom_exams (classroom_id);

-- Нэг ангид нэг шалгалтыг нэг өдөрт хоёр удаа товлохгүй.
-- Анхаар: scheduled_for хоосон (null) мөрүүдийг Postgres ялгаатайд тооцдог тул
-- огноогүй мөр давхардаж болно. Огноогоо бөглөж товлохыг зөвлөнө.
create unique index if not exists classroom_exams_classroom_test_date_uidx
  on public.classroom_exams (classroom_id, test_id, scheduled_for);

-- ---------------------------------------------------------------------------
-- updated_at trigger (репод байгаа public.update_updated_at_column())
-- ---------------------------------------------------------------------------

drop trigger if exists classroom_exams_updated_at on public.classroom_exams;
create trigger classroom_exams_updated_at
  before update on public.classroom_exams
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS
--
-- Хэн юу хийх вэ:
--   • Ангийн багш (classrooms.teacher_user_id) — өөрийн ангийн мөрийг
--     үзэх / нэмэх / засах / устгах.
--   • Тухайн ангийн сурагч (classroom_students.student_user_id) — зөвхөн ҮЗЭХ.
--   • public.is_admin() — зөвхөн ҮЗЭХ.
-- Өөр хэн ч биш. Байгууллагын өргөн эрх (is_org_member гэх мэт) энд ОРООГҮЙ —
-- энэ хүснэгт зориуд нарийн хүрээтэй.
-- ---------------------------------------------------------------------------

alter table public.classroom_exams enable row level security;

drop policy if exists "classroom_exams_select" on public.classroom_exams;
create policy "classroom_exams_select"
  on public.classroom_exams for select to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_exams.classroom_id
        and c.teacher_user_id = auth.uid()
    )
    or exists (
      select 1 from public.classroom_students cs
      where cs.classroom_id = classroom_exams.classroom_id
        and cs.student_user_id = auth.uid()
    )
    or (select public.is_admin())
  );

comment on policy "classroom_exams_select" on public.classroom_exams is
  'Ангийн багш, тухайн ангийн сурагч, админ уншина. Өөр ангийн мөр харагдахгүй.';

drop policy if exists "classroom_exams_teacher_insert" on public.classroom_exams;
create policy "classroom_exams_teacher_insert"
  on public.classroom_exams for insert to authenticated
  with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_exams.classroom_id
        and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "classroom_exams_teacher_update" on public.classroom_exams;
create policy "classroom_exams_teacher_update"
  on public.classroom_exams for update to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_exams.classroom_id
        and c.teacher_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_exams.classroom_id
        and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "classroom_exams_teacher_delete" on public.classroom_exams;
create policy "classroom_exams_teacher_delete"
  on public.classroom_exams for delete to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_exams.classroom_id
        and c.teacher_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- user_test_attempts — багшийн унших политик
--
-- 055 засвар question_attempts болон user_quiz_attempts дээр багшийн унших
-- эрхийг нэмсэн боловч user_test_attempts (загвар шалгалтын оролдлого) ОРХИГДСОН.
-- Тиймээс багш ангийнхаа шалгалтын дүнг огт харж чадахгүй — RLS алдаа өгөхгүй,
-- зүгээр л 0 мөр буцаадаг тул «хэн ч өгөөгүй» мэт хуурамч зураг гарна.
--
-- Энд нэмж байгаа нь 055-тай яг ижил хүрээтэй: зөвхөн SELECT, зөвхөн
-- public.teacher_reads_learner(user_id) үнэн байх тохиолдолд. Суралцагчийн
-- өөрийн эрх (uta_own_select) болон админы эрх (user_test_attempts_admin_select)
-- хөндөгдөхгүй.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'user_test_attempts'
  ) then
    raise notice 'Алгаслаа — user_test_attempts хүснэгт алга';
    return;
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'teacher_reads_learner'
  ) then
    raise notice 'Алгаслаа — public.teacher_reads_learner() алга (055 хэрэгтэй)';
    return;
  end if;

  execute 'drop policy if exists "user_test_attempts_teacher_select" on public.user_test_attempts';
  execute $pol$
    create policy "user_test_attempts_teacher_select"
      on public.user_test_attempts for select to authenticated
      using (public.teacher_reads_learner(user_id))
  $pol$;

  execute $cmt$
    comment on policy "user_test_attempts_teacher_select" on public.user_test_attempts is
      'Багш өөрийн ангийн сурагчдын загвар шалгалтын оролдлогыг харах эрх. Өөр ангийн мөр харагдахгүй.'
  $cmt$;

  raise notice 'Багшийн унших бодлого нэмэгдлээ: user_test_attempts';
end $$;
