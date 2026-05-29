-- Buunduu Surtsgaay — Phase 7 Step 11: organization classrooms + multi-teacher permissions
-- Safe to re-run. Requires 011 + 012.

-- =============================================================================
-- Schema extensions
-- =============================================================================
alter table public.classrooms
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists visibility text not null default 'private',
  add column if not exists created_by uuid;

alter table public.assignments
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists created_by uuid;

alter table public.teacher_profiles
  add column if not exists default_organization_id uuid references public.organizations(id) on delete set null;

alter table public.organization_members
  add column if not exists permissions jsonb not null default '{}'::jsonb,
  add column if not exists joined_at timestamptz;

create index if not exists classrooms_organization_id_idx
  on public.classrooms (organization_id);
create index if not exists assignments_organization_id_idx
  on public.assignments (organization_id);
create index if not exists teacher_profiles_default_organization_id_idx
  on public.teacher_profiles (default_organization_id);
create index if not exists organization_members_org_role_idx
  on public.organization_members (organization_id, role);
create index if not exists organization_members_user_role_idx
  on public.organization_members (user_id, role);

-- =============================================================================
-- Organization permission helpers (security definer, search_path locked)
-- =============================================================================
create or replace function public.is_org_member(
  org_id uuid,
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
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = check_user_id
      and om.status in ('active', 'invited')
  );
$$;

create or replace function public.is_org_teacher(
  org_id uuid,
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
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = check_user_id
      and om.role in ('owner', 'manager', 'teacher')
      and om.status in ('active', 'invited')
  );
$$;

create or replace function public.is_org_manager(
  org_id uuid,
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
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = check_user_id
      and om.role in ('owner', 'manager')
      and om.status in ('active', 'invited')
  );
$$;

create or replace function public.can_manage_org(
  org_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_org_manager(org_id, check_user_id);
$$;

create or replace function public.is_org_assistant(
  org_id uuid,
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
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = check_user_id
      and om.role = 'assistant'
      and om.status in ('active', 'invited')
  );
$$;

create or replace function public.can_read_org_classroom(
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
      and (
        c.teacher_user_id = check_user_id
        or (
          c.organization_id is not null
          and (
            public.is_org_member(c.organization_id, check_user_id)
            or public.is_org_assistant(c.organization_id, check_user_id)
          )
        )
        or exists (
          select 1
          from public.classroom_students cs
          where cs.classroom_id = c.id
            and cs.student_user_id = check_user_id
        )
      )
  );
$$;

create or replace function public.can_manage_org_classroom(
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
      and (
        c.teacher_user_id = check_user_id
        or (
          c.organization_id is not null
          and public.can_manage_org(c.organization_id, check_user_id)
        )
      )
  );
$$;

grant execute on function public.is_org_member(uuid, uuid) to authenticated;
grant execute on function public.is_org_teacher(uuid, uuid) to authenticated;
grant execute on function public.is_org_manager(uuid, uuid) to authenticated;
grant execute on function public.can_manage_org(uuid, uuid) to authenticated;
grant execute on function public.is_org_assistant(uuid, uuid) to authenticated;
grant execute on function public.can_read_org_classroom(uuid, uuid) to authenticated;
grant execute on function public.can_manage_org_classroom(uuid, uuid) to authenticated;

-- =============================================================================
-- organizations — member update + manager update
-- =============================================================================
drop policy if exists "organizations_manager_update" on public.organizations;
create policy "organizations_manager_update"
  on public.organizations for update to authenticated
  using (public.can_manage_org(id))
  with check (public.can_manage_org(id));

-- =============================================================================
-- organization_members — org manager + member read org peers
-- =============================================================================
drop policy if exists "organization_members_org_select" on public.organization_members;
create policy "organization_members_org_select"
  on public.organization_members for select to authenticated
  using (
    public.can_manage_org(organization_id)
    or public.is_org_teacher(organization_id)
    or public.is_org_assistant(organization_id)
  );

drop policy if exists "organization_members_manager_insert" on public.organization_members;
create policy "organization_members_manager_insert"
  on public.organization_members for insert to authenticated
  with check (public.can_manage_org(organization_id));

drop policy if exists "organization_members_manager_update" on public.organization_members;
create policy "organization_members_manager_update"
  on public.organization_members for update to authenticated
  using (public.can_manage_org(organization_id))
  with check (public.can_manage_org(organization_id));

drop policy if exists "organization_members_manager_delete" on public.organization_members;
create policy "organization_members_manager_delete"
  on public.organization_members for delete to authenticated
  using (public.can_manage_org(organization_id));

-- =============================================================================
-- classrooms — replace policies for org-aware access
-- =============================================================================
drop policy if exists "classrooms_select_own_or_admin" on public.classrooms;
drop policy if exists "classrooms_insert_own" on public.classrooms;
drop policy if exists "classrooms_update_own" on public.classrooms;
drop policy if exists "classrooms_delete_own" on public.classrooms;

create policy "classrooms_select"
  on public.classrooms for select to authenticated
  using (
    (select public.is_admin())
    or teacher_user_id = auth.uid()
    or (
      organization_id is not null
      and (
        public.is_org_member(organization_id)
        or public.is_org_assistant(organization_id)
      )
    )
    or exists (
      select 1
      from public.classroom_students cs
      where cs.classroom_id = classrooms.id
        and cs.student_user_id = auth.uid()
    )
  );

create policy "classrooms_insert"
  on public.classrooms for insert to authenticated
  with check (
    teacher_user_id = auth.uid()
    and (
      organization_id is null
      or public.is_org_teacher(organization_id)
    )
  );

create policy "classrooms_update"
  on public.classrooms for update to authenticated
  using (
    (select public.is_admin())
    or teacher_user_id = auth.uid()
    or (
      organization_id is not null
      and public.can_manage_org(organization_id)
    )
  )
  with check (
    (select public.is_admin())
    or teacher_user_id = auth.uid()
    or (
      organization_id is not null
      and public.can_manage_org(organization_id)
    )
  );

create policy "classrooms_delete"
  on public.classrooms for delete to authenticated
  using (
    (select public.is_admin())
    or teacher_user_id = auth.uid()
    or (
      organization_id is not null
      and public.can_manage_org(organization_id)
    )
  );

-- =============================================================================
-- classroom_students
-- =============================================================================
drop policy if exists "classroom_students_teacher_select" on public.classroom_students;
drop policy if exists "classroom_students_teacher_insert" on public.classroom_students;
drop policy if exists "classroom_students_teacher_update" on public.classroom_students;
drop policy if exists "classroom_students_teacher_delete" on public.classroom_students;

create policy "classroom_students_select"
  on public.classroom_students for select to authenticated
  using (
    (select public.is_admin())
    or student_user_id = auth.uid()
    or public.can_read_org_classroom(classroom_id)
  );

create policy "classroom_students_insert"
  on public.classroom_students for insert to authenticated
  with check (public.can_manage_org_classroom(classroom_id));

create policy "classroom_students_update"
  on public.classroom_students for update to authenticated
  using (public.can_manage_org_classroom(classroom_id))
  with check (public.can_manage_org_classroom(classroom_id));

create policy "classroom_students_delete"
  on public.classroom_students for delete to authenticated
  using (public.can_manage_org_classroom(classroom_id));

-- =============================================================================
-- assignments
-- =============================================================================
drop policy if exists "assignments_teacher_select" on public.assignments;
drop policy if exists "assignments_teacher_insert" on public.assignments;
drop policy if exists "assignments_teacher_update" on public.assignments;
drop policy if exists "assignments_teacher_delete" on public.assignments;

create policy "assignments_select"
  on public.assignments for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.classrooms c
      where c.id = classroom_id
        and c.teacher_user_id = auth.uid()
    )
    or exists (
      select 1 from public.classrooms c
      where c.id = classroom_id
        and c.organization_id is not null
        and public.is_org_member(c.organization_id)
    )
    or exists (
      select 1 from public.classroom_students cs
      where cs.classroom_id = assignments.classroom_id
        and cs.student_user_id = auth.uid()
    )
  );

create policy "assignments_insert"
  on public.assignments for insert to authenticated
  with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id
        and (
          c.teacher_user_id = auth.uid()
          or (
            c.organization_id is not null
            and public.is_org_teacher(c.organization_id)
          )
        )
    )
  );

create policy "assignments_update"
  on public.assignments for update to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.classrooms c
      where c.id = classroom_id
        and (
          c.teacher_user_id = auth.uid()
          or (
            c.organization_id is not null
            and (
              public.can_manage_org(c.organization_id)
              or public.is_org_teacher(c.organization_id)
            )
          )
        )
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1 from public.classrooms c
      where c.id = classroom_id
        and (
          c.teacher_user_id = auth.uid()
          or (
            c.organization_id is not null
            and (
              public.can_manage_org(c.organization_id)
              or public.is_org_teacher(c.organization_id)
            )
          )
        )
    )
  );

create policy "assignments_delete"
  on public.assignments for delete to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.classrooms c
      where c.id = classroom_id
        and (
          c.teacher_user_id = auth.uid()
          or (
            c.organization_id is not null
            and public.can_manage_org(c.organization_id)
          )
        )
    )
  );

-- =============================================================================
-- assignment_results
-- =============================================================================
drop policy if exists "assignment_results_select" on public.assignment_results;
drop policy if exists "assignment_results_teacher_insert" on public.assignment_results;
drop policy if exists "assignment_results_teacher_update" on public.assignment_results;

create policy "assignment_results_select"
  on public.assignment_results for select to authenticated
  using (
    (select public.is_admin())
    or student_user_id = auth.uid()
    or exists (
      select 1
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id
        and (
          c.teacher_user_id = auth.uid()
          or (
            c.organization_id is not null
            and (
              public.can_manage_org(c.organization_id)
              or public.is_org_teacher(c.organization_id)
            )
          )
        )
    )
  );

create policy "assignment_results_teacher_insert"
  on public.assignment_results for insert to authenticated
  with check (
    student_user_id = auth.uid()
    or exists (
      select 1
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id
        and public.can_manage_org_classroom(c.id)
    )
  );

create policy "assignment_results_teacher_update"
  on public.assignment_results for update to authenticated
  using (
    student_user_id = auth.uid()
    or exists (
      select 1
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id
        and public.can_manage_org_classroom(c.id)
    )
  )
  with check (
    student_user_id = auth.uid()
    or exists (
      select 1
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id
        and public.can_manage_org_classroom(c.id)
    )
  );
