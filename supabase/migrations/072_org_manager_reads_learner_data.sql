-- 072: Байгууллагын эзэмшигч / менежер өөрийн байгууллагын сурагчдын
-- суралцах өгөгдлийг УНШИХ эрх (захирлын самбарт хэрэгтэй).
--
-- Яагаад хэрэгтэй вэ:
-- 055 багшид, 056 админд унших эрх өгсөн. Харин байгууллагын захирал
-- (organization_members.role = owner | manager) өөрийн сургуулийн бүх ангийг
-- нэг дор харах ёстой ч эдгээр хүснэгтийг унших эрхгүй байсан тул самбар хоосон
-- гарах байв. Энэ засвар ЗӨВХӨН унших (select) эрх нэмнэ; өөр байгууллагын
-- сурагч хаалттай хэвээр.
--
-- Шаардлага: 013 (is_org_manager), 011 (classrooms, classroom_students).
-- Дахин ажиллуулахад аюулгүй: create or replace + drop policy if exists.

create or replace function public.org_manager_reads_learner(
  learner_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    learner_id is not null
    and check_user_id is not null
    and exists (
      select 1
      from public.classroom_students cs
      join public.classrooms c on c.id = cs.classroom_id
      where cs.student_user_id = learner_id
        and c.organization_id is not null
        and public.is_org_manager(c.organization_id, check_user_id)
    );
$$;

grant execute on function public.org_manager_reads_learner(uuid, uuid) to authenticated;

create or replace function public.org_manager_reads_classroom(
  classroom_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classrooms c
    where c.id = classroom_id
      and c.organization_id is not null
      and public.is_org_manager(c.organization_id, check_user_id)
  );
$$;

grant execute on function public.org_manager_reads_classroom(uuid, uuid) to authenticated;

do $$
declare
  t text;
  learner_tables text[] := array[
    'question_attempts',
    'user_quiz_attempts',
    'user_test_attempts',
    'user_activity_sessions',
    'user_daily_activity',
    'user_lesson_progress'
  ];
  class_tables text[] := array[
    'classroom_exams',
    'classroom_attendance'
  ];
begin
  foreach t in array learner_tables loop
    if not exists (
      select 1 from information_schema.tables
       where table_schema = 'public' and table_name = t
    ) then
      raise notice 'Алгаслаа — % хүснэгт алга', t;
      continue;
    end if;
    execute format('drop policy if exists %I on public.%I', t || '_org_manager_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.org_manager_reads_learner(user_id))',
      t || '_org_manager_select', t
    );
  end loop;

  foreach t in array class_tables loop
    if not exists (
      select 1 from information_schema.tables
       where table_schema = 'public' and table_name = t
    ) then
      raise notice 'Алгаслаа — % хүснэгт алга', t;
      continue;
    end if;
    execute format('drop policy if exists %I on public.%I', t || '_org_manager_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.org_manager_reads_classroom(classroom_id))',
      t || '_org_manager_select', t
    );
  end loop;
end $$;
