-- 067: «Бичих дэвтэр» (写字本) — сурагчийн өөрийн ханзны жагсаалт, бичих ахиц,
-- багшийн бичих даалгавар.
-- Ажиллуулах: Supabase SQL editor (дахин ажиллуулахад аюулгүй). Шаардлага: 011, 013, 065.
--
-- Хүснэгтүүд:
--   * writing_lists       — нэг дэвтэр (өөрийн / хичээлээс / HSK / ангийн даалгавар)
--   * writing_list_items  — дэвтрийн ханз бүр (дараалалтай)
--   * writing_progress    — хэрэглэгч × дэвтэр × ханз: дагаж/санаж бичсэн тоо, алдаа
-- RPC:
--   * writing_list_progress(p_list_id) — багш: ангийн сурагч бүрийн ахиц

-- =============================================================================
-- 1. Хүснэгтүүд
-- =============================================================================
create table if not exists public.writing_lists (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  kind text not null default 'own'
    check (kind in ('own', 'lesson', 'hsk', 'assignment')),
  classroom_id uuid null references public.classrooms (id) on delete cascade,
  assignment_id uuid null references public.assignments (id) on delete set null,
  reps_trace integer not null default 2,
  reps_memory integer not null default 3,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.writing_lists is
  'Бичих дэвтэр — хэрэглэгчийн (эсвэл багшийн ангид өгсөн) ханзны жагсаалт.';
comment on column public.writing_lists.kind is
  'own = өөрөө оруулсан, lesson = хичээлээс, hsk = HSK жагсаалтаас, assignment = ангийн даалгавар.';
comment on column public.writing_lists.reps_trace is 'Ханз бүрийг дагаж бичих тоо.';
comment on column public.writing_lists.reps_memory is 'Ханз бүрийг санаж бичих тоо.';

create index if not exists writing_lists_owner_idx
  on public.writing_lists (owner_user_id, created_at desc);
create index if not exists writing_lists_classroom_idx
  on public.writing_lists (classroom_id)
  where classroom_id is not null;

drop trigger if exists writing_lists_set_updated_at on public.writing_lists;
create trigger writing_lists_set_updated_at
  before update on public.writing_lists
  for each row execute function public.update_updated_at_column();

create table if not exists public.writing_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.writing_lists (id) on delete cascade,
  position integer not null,
  ch text not null,
  word text,
  pinyin text,
  meaning_mn text,
  unique (list_id, ch)
);

comment on table public.writing_list_items is 'Дэвтрийн ханз бүр (ch) — дараалал, үг, пиньинь, утга.';

create index if not exists writing_list_items_list_idx
  on public.writing_list_items (list_id, position);

create table if not exists public.writing_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  list_id uuid not null references public.writing_lists (id) on delete cascade,
  ch text not null,
  trace_done integer not null default 0,
  memory_done integer not null default 0,
  mistakes integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  primary key (user_id, list_id, ch)
);

comment on table public.writing_progress is
  'Хэрэглэгч × дэвтэр × ханз: дагаж/санаж бичсэн тоо, алдааны тоо.';

create index if not exists writing_progress_list_idx
  on public.writing_progress (list_id, user_id);

drop trigger if exists writing_progress_set_updated_at on public.writing_progress;
create trigger writing_progress_set_updated_at
  before update on public.writing_progress
  for each row execute function public.update_updated_at_column();

-- =============================================================================
-- 2. Туслах функц — RLS бодлого дотроос classroom_students-ийг шууд уншвал тэр
--    хүснэгтийн өөрийн RLS саад болох тул 066-ийн загвараар security definer.
-- =============================================================================
create or replace function public.is_classroom_member(p_classroom_id uuid)
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
      where cs.classroom_id = p_classroom_id
        and cs.student_user_id = auth.uid()
        and coalesce(cs.status, '') <> 'removed'
    );
$$;

comment on function public.is_classroom_member(uuid) is
  'Нэвтэрсэн хэрэглэгч энэ ангийн сурагч мөн эсэх (RLS-д зориулсан).';

grant execute on function public.is_classroom_member(uuid) to authenticated;

-- Дэвтрийн эзэн, эсвэл дэвтрийн ангийн багш/эрхлэгч (writing_list_items,
-- writing_progress бодлогод дэвтрээр дамжуулан хэрэглэнэ).
create or replace function public.can_edit_writing_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.writing_lists l
      where l.id = p_list_id
        and (
          l.owner_user_id = auth.uid()
          or (
            l.classroom_id is not null
            and public.can_manage_org_classroom(l.classroom_id)
          )
        )
    );
$$;

grant execute on function public.can_edit_writing_list(uuid) to authenticated;

create or replace function public.can_read_writing_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.writing_lists l
      where l.id = p_list_id
        and (
          l.owner_user_id = auth.uid()
          or (
            l.classroom_id is not null
            and (
              public.can_manage_org_classroom(l.classroom_id)
              or public.is_classroom_member(l.classroom_id)
            )
          )
        )
    );
$$;

grant execute on function public.can_read_writing_list(uuid) to authenticated;

-- =============================================================================
-- 3. RLS
-- =============================================================================
alter table public.writing_lists enable row level security;
alter table public.writing_list_items enable row level security;
alter table public.writing_progress enable row level security;

-- Supabase-ийн default privilege байдаг ч тодорхой бичье (RLS доор л ажиллана).
grant select, insert, update, delete on public.writing_lists to authenticated;
grant select, insert, update, delete on public.writing_list_items to authenticated;
grant select, insert, update, delete on public.writing_progress to authenticated;

-- writing_lists: эзэн бүрэн эрхтэй
drop policy if exists "writing_lists_owner_all" on public.writing_lists;
create policy "writing_lists_owner_all"
  on public.writing_lists for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- ангийн сурагч ангийнхаа дэвтрийг уншина
drop policy if exists "writing_lists_member_select" on public.writing_lists;
create policy "writing_lists_member_select"
  on public.writing_lists for select to authenticated
  using (
    classroom_id is not null
    and public.is_classroom_member(classroom_id)
  );

-- багш/эрхлэгч ангийнхаа дэвтрийг бүрэн удирдана
drop policy if exists "writing_lists_teacher_select" on public.writing_lists;
create policy "writing_lists_teacher_select"
  on public.writing_lists for select to authenticated
  using (classroom_id is not null and public.can_manage_org_classroom(classroom_id));

drop policy if exists "writing_lists_teacher_insert" on public.writing_lists;
create policy "writing_lists_teacher_insert"
  on public.writing_lists for insert to authenticated
  with check (classroom_id is not null and public.can_manage_org_classroom(classroom_id));

drop policy if exists "writing_lists_teacher_update" on public.writing_lists;
create policy "writing_lists_teacher_update"
  on public.writing_lists for update to authenticated
  using (classroom_id is not null and public.can_manage_org_classroom(classroom_id))
  with check (classroom_id is not null and public.can_manage_org_classroom(classroom_id));

drop policy if exists "writing_lists_teacher_delete" on public.writing_lists;
create policy "writing_lists_teacher_delete"
  on public.writing_lists for delete to authenticated
  using (classroom_id is not null and public.can_manage_org_classroom(classroom_id));

-- writing_list_items: дэвтрийн эрхээр
drop policy if exists "writing_list_items_select" on public.writing_list_items;
create policy "writing_list_items_select"
  on public.writing_list_items for select to authenticated
  using (public.can_read_writing_list(list_id));

drop policy if exists "writing_list_items_insert" on public.writing_list_items;
create policy "writing_list_items_insert"
  on public.writing_list_items for insert to authenticated
  with check (public.can_edit_writing_list(list_id));

drop policy if exists "writing_list_items_update" on public.writing_list_items;
create policy "writing_list_items_update"
  on public.writing_list_items for update to authenticated
  using (public.can_edit_writing_list(list_id))
  with check (public.can_edit_writing_list(list_id));

drop policy if exists "writing_list_items_delete" on public.writing_list_items;
create policy "writing_list_items_delete"
  on public.writing_list_items for delete to authenticated
  using (public.can_edit_writing_list(list_id));

-- writing_progress: өөрийн мөр бүрэн; багш ангийнхаа дэвтрийн мөрийг, эцэг эх
-- хүүхдийнхээ мөрийг уншина.
drop policy if exists "writing_progress_own_all" on public.writing_progress;
create policy "writing_progress_own_all"
  on public.writing_progress for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_read_writing_list(list_id));

drop policy if exists "writing_progress_teacher_select" on public.writing_progress;
create policy "writing_progress_teacher_select"
  on public.writing_progress for select to authenticated
  using (
    exists (
      select 1
      from public.writing_lists l
      where l.id = writing_progress.list_id
        and l.classroom_id is not null
        and public.can_manage_org_classroom(l.classroom_id)
    )
  );

drop policy if exists "writing_progress_guardian_select" on public.writing_progress;
create policy "writing_progress_guardian_select"
  on public.writing_progress for select to authenticated
  using (public.is_guardian_of(user_id));

-- =============================================================================
-- 4. RPC: дэвтрийн ахиц сурагч бүрээр (багш / эзэн)
-- =============================================================================
-- Ангийн сурагч бүрээр: ханз хэд/хэд дууссан, нүд (дагаж + санаж) хэд/хэд,
-- хувь, сүүлийн үйлдэл. Эрхгүй бол хоосон буцаана.
drop function if exists public.writing_list_progress(uuid);
create function public.writing_list_progress(p_list_id uuid)
returns table (
  student_user_id uuid,
  display_name text,
  chars_total integer,
  chars_done integer,
  cells_total integer,
  cells_done integer,
  percent integer,
  last_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with lst as (
    select l.id, l.classroom_id, l.reps_trace, l.reps_memory
    from public.writing_lists l
    where l.id = p_list_id
      and auth.uid() is not null
      and (
        l.owner_user_id = auth.uid()
        or (
          l.classroom_id is not null
          and public.can_manage_org_classroom(l.classroom_id)
        )
      )
  ),
  items as (
    select i.ch
    from public.writing_list_items i
    join lst on lst.id = i.list_id
  ),
  totals as (
    select
      (select count(*) from items)::integer as chars_total,
      ((select count(*) from items) * (lst.reps_trace + lst.reps_memory))::integer as cells_total,
      lst.reps_trace,
      lst.reps_memory
    from lst
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
    from lst
    join public.classroom_students cs on cs.classroom_id = lst.classroom_id
    left join public.kid_profiles k on k.child_user_id = cs.student_user_id
    where cs.student_user_id is not null
      and coalesce(cs.status, '') <> 'removed'
    order by cs.student_user_id, cs.joined_at desc nulls last
  ),
  prog as (
    select
      p.user_id,
      count(*) filter (
        where p.trace_done >= t.reps_trace and p.memory_done >= t.reps_memory
      )::integer as chars_done,
      sum(least(p.trace_done, t.reps_trace) + least(p.memory_done, t.reps_memory))::integer as cells_done,
      max(p.updated_at) as last_at
    from public.writing_progress p
    join items i on i.ch = p.ch
    cross join totals t
    where p.list_id = p_list_id
    group by p.user_id
  )
  select
    m.student_user_id,
    m.display_name,
    t.chars_total,
    coalesce(pr.chars_done, 0)::integer,
    t.cells_total,
    coalesce(pr.cells_done, 0)::integer,
    case
      when t.cells_total > 0
        then round(100.0 * coalesce(pr.cells_done, 0) / t.cells_total)::integer
      else 0
    end,
    pr.last_at
  from members m
  cross join totals t
  left join prog pr on pr.user_id = m.student_user_id
  order by m.display_name;
$$;

comment on function public.writing_list_progress(uuid) is
  'Бичих дэвтрийн ахиц ангийн сурагч бүрээр. Дэвтрийн эзэн эсвэл ангийн багш л дуудна.';

grant execute on function public.writing_list_progress(uuid) to authenticated;
