-- 066: Ангийн заавал хөтөлбөр («Заавал хөтөлбөр» / 必修课程).
-- Ажиллуулах: Supabase SQL editor (дахин ажиллуулахад аюулгүй). Шаардлага: 011, 013, 058, 065.
--
-- Шинэ хүснэгт үүсгэхгүй — байгаа assignments + assignment_results дээр суурилна:
--   * Багш ангийн түвшин (hsk1 …) болон заавал хийх хичээлүүдийн дарааллыг сонгоно →
--     assignments мөр болж бичигдэнэ (is_curriculum = true, order_index, course_id).
--   * Сурагч хичээлээ дуусгахад lib/classroom/assignment-completion.ts аль хэдийн
--     тохирох assignment_results мөрийг 'completed' болгодог тул ахиц автоматаар тоологдоно.
--   * Эцэг эх (kid_profiles.guardian_user_id) хүүхдийнхээ мөрүүдийг уншиж, ахицыг харна.

-- =============================================================================
-- 1. Баганууд
-- =============================================================================
alter table public.assignments
  add column if not exists is_curriculum boolean not null default false,
  add column if not exists order_index integer,
  add column if not exists course_id text;

comment on column public.assignments.is_curriculum is
  'true бол ангийн заавал хөтөлбөрийн хичээл (set_classroom_curriculum RPC удирдана).';
comment on column public.assignments.order_index is
  'Заавал хөтөлбөр доторх дараалал (0-ээс). Энгийн даалгаварт null.';
comment on column public.assignments.course_id is
  'Хөтөлбөрийн курс/түвшин (жишээ нь hsk1). Энгийн даалгаварт null.';

create index if not exists assignments_classroom_curriculum_idx
  on public.assignments (classroom_id, is_curriculum, order_index);

-- Нэг ангид нэг хичээл хөтөлбөрт ганц л удаа орно (upsert-ын conflict target).
-- Энгийн (is_curriculum = false) даалгаварт хамаарахгүй — ижил хичээлийг тусад нь
-- даалгавар болгож өгч болно.
create unique index if not exists assignments_classroom_curriculum_lesson_uidx
  on public.assignments (classroom_id, lesson_id)
  where is_curriculum;

alter table public.classrooms
  add column if not exists curriculum_course_id text;

comment on column public.classrooms.curriculum_course_id is
  'Багшийн сонгосон заавал хөтөлбөрийн түвшин (hsk1 …). null бол хөтөлбөр алга.';

-- =============================================================================
-- 2. Асран хамгаалагчийн унших эрх (НЭМЭЛТ бодлого — байгааг солихгүй)
-- =============================================================================
-- RLS бодлого дотроос classroom_students-ийг шууд уншвал тэр хүснэгтийн өөрийн RLS
-- (зөвхөн сурагч өөрөө / багш) эцэг эхэд юу ч буцаахгүй. Тиймээс 013/055-ын загвараар
-- security definer функц ашиглана — зөвхөн true/false буцаана.
create or replace function public.is_guardian_of_classroom_member(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.classroom_students cs
      join public.kid_profiles k on k.child_user_id = cs.student_user_id
      where cs.classroom_id = p_classroom_id
        and k.guardian_user_id = auth.uid()
    );
$$;

comment on function public.is_guardian_of_classroom_member(uuid) is
  'Нэвтэрсэн хэрэглэгч энэ ангийн аль нэг сурагчийн (kid_profiles) асран хамгаалагч мөн эсэх.';

grant execute on function public.is_guardian_of_classroom_member(uuid) to authenticated;

-- assignments: хүүхэд нь сурдаг ангийн ангид бүхэлд нь өгсөн, эсвэл хүүхдэд нь онилсон мөр.
-- Ангийн өөр сурагчид онилсон даалгавар (058) эцэг эхэд харагдахгүй.
drop policy if exists "assignments_guardian_select" on public.assignments;
create policy "assignments_guardian_select"
  on public.assignments for select to authenticated
  using (
    public.is_guardian_of_classroom_member(classroom_id)
    and (
      target_student_user_id is null
      or public.is_guardian_of(target_student_user_id)
    )
  );

-- assignment_results: зөвхөн өөрийн хүүхдийн мөр.
drop policy if exists "assignment_results_guardian_select" on public.assignment_results;
create policy "assignment_results_guardian_select"
  on public.assignment_results for select to authenticated
  using (
    student_user_id is not null
    and public.is_guardian_of(student_user_id)
  );

-- =============================================================================
-- 3. Багш: хөтөлбөр хадгалах
-- =============================================================================
-- p_lessons = [{ "lesson_id": "...", "title": "...", "order_index": 0 }, ...]
-- Жагсаалтад байгаа хичээлийг upsert хийнэ, жагсаалтаас хасагдсан хөтөлбөрийн
-- даалгаврыг устгана (assignment_results нь cascade-аар устна). Энгийн даалгаварт
-- огт хүрэхгүй. Хадгалсан хичээлийн тоог буцаана.
create or replace function public.set_classroom_curriculum(
  p_classroom_id uuid,
  p_course_id text,
  p_lessons jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_course text := nullif(btrim(coalesce(p_course_id, '')), '');
  v_lessons jsonb := coalesce(p_lessons, '[]'::jsonb);
  v_count integer := 0;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  if not public.can_manage_org_classroom(p_classroom_id) then
    raise exception 'not allowed';
  end if;
  if jsonb_typeof(v_lessons) <> 'array' then
    raise exception 'p_lessons must be a json array';
  end if;

  select c.organization_id into v_org
  from public.classrooms c
  where c.id = p_classroom_id;

  -- Нэг statement (data-modifying CTE): оролтыг задлах → хасагдсаныг устгах → upsert.
  -- WITH доторх delete нь үндсэн query уншсан эсэхээс үл хамааран бүрэн ажиллана.
  -- Устгах ба оруулах мөрүүд огтлолцохгүй (устгах нь зөвхөн жагсаалтад БАЙХГҮЙ хичээл).
  -- Давхардсан lesson_id байвал хамгийн бага order_index-тэй нь үлдэнэ.
  with input as (
    select distinct on (x.lesson_id) x.lesson_id, x.title, x.order_index
    from (
      select
        nullif(btrim(e.value ->> 'lesson_id'), '') as lesson_id,
        coalesce(
          nullif(btrim(e.value ->> 'title'), ''),
          nullif(btrim(e.value ->> 'lesson_id'), '')
        ) as title,
        coalesce(
          (e.value ->> 'order_index')::integer,
          (e.ordinality - 1)::integer
        ) as order_index
      from jsonb_array_elements(v_lessons) with ordinality as e(value, ordinality)
    ) x
    where x.lesson_id is not null
    order by x.lesson_id, x.order_index
  ),
  removed as (
    delete from public.assignments a
    where a.classroom_id = p_classroom_id
      and a.is_curriculum
      and not exists (select 1 from input i where i.lesson_id = a.lesson_id)
    returning a.id
  )
  insert into public.assignments (
    classroom_id, lesson_id, assignment_type, title, status,
    organization_id, created_by, is_curriculum, order_index, course_id
  )
  select
    p_classroom_id, i.lesson_id, 'full_lesson', i.title, 'assigned',
    v_org, v_uid, true, i.order_index, v_course
  from input i
  order by i.order_index
  on conflict (classroom_id, lesson_id) where is_curriculum
  do update set
    title = excluded.title,
    order_index = excluded.order_index,
    course_id = excluded.course_id,
    assignment_type = 'full_lesson',
    target_student_user_id = null,
    updated_at = now();

  get diagnostics v_count = row_count;

  update public.classrooms
  set curriculum_course_id = case when v_count > 0 then v_course else null end
  where id = p_classroom_id;

  return v_count;
end;
$$;

comment on function public.set_classroom_curriculum(uuid, text, jsonb) is
  'Багш/эрхлэгч: ангийн заавал хөтөлбөрийг (түвшин + хичээлийн дараалал) бүхэлд нь солино.';

grant execute on function public.set_classroom_curriculum(uuid, text, jsonb) to authenticated;

-- =============================================================================
-- 4. Хөтөлбөрийн ахиц (сурагч бүрээр)
-- =============================================================================
-- Хэн дуудаж болох вэ:
--   * ангийн багш / байгууллагын эрхлэгч, багш, туслах, админ → ангийн бүх сурагч
--   * сурагч өөрөө                                         → зөвхөн өөрийн мөр
--   * асран хамгаалагч                                     → зөвхөн өөрийн хүүхдийн мөр
-- Эрхгүй бол хоосон буцаана (алдаа өгөхгүй, бусдын мэдээлэл задрахгүй).
drop function if exists public.classroom_curriculum_progress(uuid);
create function public.classroom_curriculum_progress(p_classroom_id uuid)
returns table (
  student_user_id uuid,
  display_name text,
  total integer,
  completed integer,
  percent integer,
  last_completed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with access as (
    select (
      public.can_manage_org_classroom(p_classroom_id)
      or coalesce((select public.is_admin()), false)
      or exists (
        select 1
        from public.classrooms c
        where c.id = p_classroom_id
          and c.organization_id is not null
          and (
            public.is_org_teacher(c.organization_id)
            or public.is_org_assistant(c.organization_id)
          )
      )
    ) as is_staff
  ),
  curriculum as (
    select a.id
    from public.assignments a
    where a.classroom_id = p_classroom_id
      and a.is_curriculum
  ),
  members as (
    select distinct on (cs.student_user_id)
      cs.student_user_id,
      coalesce(
        nullif(btrim(cs.display_name), ''),
        nullif(btrim(k.display_name), ''),
        nullif(split_part(coalesce(cs.email, ''), '@', 1), ''),
        'Сурагч'
      ) as display_name
    from public.classroom_students cs
    left join public.kid_profiles k on k.child_user_id = cs.student_user_id
    cross join access
    where cs.classroom_id = p_classroom_id
      and cs.student_user_id is not null
      and coalesce(cs.status, '') <> 'removed'
      and auth.uid() is not null
      and (
        access.is_staff
        or cs.student_user_id = auth.uid()
        or public.is_guardian_of(cs.student_user_id)
      )
    order by cs.student_user_id, cs.joined_at desc nulls last
  ),
  done as (
    select
      r.student_user_id,
      count(distinct r.assignment_id) as completed,
      max(r.completed_at) as last_completed_at
    from public.assignment_results r
    join curriculum cu on cu.id = r.assignment_id
    where r.status = 'completed'
      and r.student_user_id is not null
    group by r.student_user_id
  ),
  totals as (
    select count(*)::integer as total from curriculum
  )
  select
    m.student_user_id,
    m.display_name,
    t.total,
    coalesce(d.completed, 0)::integer,
    case
      when t.total > 0 then round(100.0 * coalesce(d.completed, 0) / t.total)::integer
      else 0
    end,
    d.last_completed_at
  from members m
  cross join totals t
  left join done d on d.student_user_id = m.student_user_id
  order by m.display_name;
$$;

comment on function public.classroom_curriculum_progress(uuid) is
  'Ангийн заавал хөтөлбөрийн ахиц сурагч бүрээр. Багш бүгдийг, сурагч өөрийгөө, эцэг эх хүүхдээ л харна.';

grant execute on function public.classroom_curriculum_progress(uuid) to authenticated;
