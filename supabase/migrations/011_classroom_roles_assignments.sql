-- Buunduu Surtsgaay — Phase 7 Step 8: classroom roles, assignments, results
-- Safe to re-run

-- =============================================================================
-- teacher_profiles
-- =============================================================================
create table if not exists public.teacher_profiles (
  user_id uuid primary key,
  display_name text,
  organization text,
  bio text,
  role text not null default 'teacher',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists teacher_profiles_updated_at on public.teacher_profiles;
create trigger teacher_profiles_updated_at
  before update on public.teacher_profiles
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- student_profiles
-- =============================================================================
create table if not exists public.student_profiles (
  user_id uuid primary key,
  display_name text,
  school_name text,
  grade_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists student_profiles_updated_at on public.student_profiles;
create trigger student_profiles_updated_at
  before update on public.student_profiles
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- classrooms
-- =============================================================================
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null,
  name text not null,
  level text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classrooms_teacher_user_id_idx
  on public.classrooms (teacher_user_id);

drop trigger if exists classrooms_updated_at on public.classrooms;
create trigger classrooms_updated_at
  before update on public.classrooms
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- classroom_students
-- =============================================================================
create table if not exists public.classroom_students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_user_id uuid,
  display_name text,
  email text,
  status text not null default 'invited',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classroom_students_classroom_id_idx
  on public.classroom_students (classroom_id);

create index if not exists classroom_students_student_user_id_idx
  on public.classroom_students (student_user_id);

drop trigger if exists classroom_students_updated_at on public.classroom_students;
create trigger classroom_students_updated_at
  before update on public.classroom_students
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- assignments
-- =============================================================================
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  lesson_id text not null,
  assignment_type text not null default 'full_lesson',
  title text not null,
  instructions text,
  due_date date,
  status text not null default 'assigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assignments_classroom_id_idx
  on public.assignments (classroom_id);

create index if not exists assignments_lesson_id_idx
  on public.assignments (lesson_id);

drop trigger if exists assignments_updated_at on public.assignments;
create trigger assignments_updated_at
  before update on public.assignments
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- assignment_results
-- =============================================================================
create table if not exists public.assignment_results (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_user_id uuid,
  status text not null default 'not_started',
  completed_at timestamptz,
  quiz_score integer,
  quiz_total integer,
  quiz_percentage integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assignment_results_assignment_id_idx
  on public.assignment_results (assignment_id);

create index if not exists assignment_results_student_user_id_idx
  on public.assignment_results (student_user_id);

create unique index if not exists assignment_results_assignment_student_uidx
  on public.assignment_results (assignment_id, student_user_id)
  where student_user_id is not null;

drop trigger if exists assignment_results_updated_at on public.assignment_results;
create trigger assignment_results_updated_at
  before update on public.assignment_results
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.teacher_profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_students enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_results enable row level security;

-- teacher_profiles
drop policy if exists "teacher_profiles_select_own_or_admin" on public.teacher_profiles;
create policy "teacher_profiles_select_own_or_admin"
  on public.teacher_profiles for select to authenticated
  using (auth.uid() = user_id or (select public.is_admin()));

drop policy if exists "teacher_profiles_insert_own" on public.teacher_profiles;
create policy "teacher_profiles_insert_own"
  on public.teacher_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "teacher_profiles_update_own" on public.teacher_profiles;
create policy "teacher_profiles_update_own"
  on public.teacher_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- student_profiles
drop policy if exists "student_profiles_select_own_or_admin" on public.student_profiles;
create policy "student_profiles_select_own_or_admin"
  on public.student_profiles for select to authenticated
  using (auth.uid() = user_id or (select public.is_admin()));

drop policy if exists "student_profiles_insert_own" on public.student_profiles;
create policy "student_profiles_insert_own"
  on public.student_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "student_profiles_update_own" on public.student_profiles;
create policy "student_profiles_update_own"
  on public.student_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- classrooms
drop policy if exists "classrooms_select_own_or_admin" on public.classrooms;
create policy "classrooms_select_own_or_admin"
  on public.classrooms for select to authenticated
  using (teacher_user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "classrooms_insert_own" on public.classrooms;
create policy "classrooms_insert_own"
  on public.classrooms for insert to authenticated
  with check (teacher_user_id = auth.uid());

drop policy if exists "classrooms_update_own" on public.classrooms;
create policy "classrooms_update_own"
  on public.classrooms for update to authenticated
  using (teacher_user_id = auth.uid())
  with check (teacher_user_id = auth.uid());

drop policy if exists "classrooms_delete_own" on public.classrooms;
create policy "classrooms_delete_own"
  on public.classrooms for delete to authenticated
  using (teacher_user_id = auth.uid());

-- classroom_students (teacher owns classroom)
drop policy if exists "classroom_students_teacher_select" on public.classroom_students;
create policy "classroom_students_teacher_select"
  on public.classroom_students for select to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
    or student_user_id = auth.uid()
    or (select public.is_admin())
  );

drop policy if exists "classroom_students_teacher_insert" on public.classroom_students;
create policy "classroom_students_teacher_insert"
  on public.classroom_students for insert to authenticated
  with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "classroom_students_teacher_update" on public.classroom_students;
create policy "classroom_students_teacher_update"
  on public.classroom_students for update to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "classroom_students_teacher_delete" on public.classroom_students;
create policy "classroom_students_teacher_delete"
  on public.classroom_students for delete to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  );

-- assignments
drop policy if exists "assignments_teacher_select" on public.assignments;
create policy "assignments_teacher_select"
  on public.assignments for select to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
    or exists (
      select 1 from public.classroom_students cs
      where cs.classroom_id = assignments.classroom_id
        and cs.student_user_id = auth.uid()
    )
    or (select public.is_admin())
  );

drop policy if exists "assignments_teacher_insert" on public.assignments;
create policy "assignments_teacher_insert"
  on public.assignments for insert to authenticated
  with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "assignments_teacher_update" on public.assignments;
create policy "assignments_teacher_update"
  on public.assignments for update to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "assignments_teacher_delete" on public.assignments;
create policy "assignments_teacher_delete"
  on public.assignments for delete to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  );

-- assignment_results
drop policy if exists "assignment_results_select" on public.assignment_results;
create policy "assignment_results_select"
  on public.assignment_results for select to authenticated
  using (
    student_user_id = auth.uid()
    or exists (
      select 1
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id and c.teacher_user_id = auth.uid()
    )
    or (select public.is_admin())
  );

drop policy if exists "assignment_results_student_insert" on public.assignment_results;
create policy "assignment_results_student_insert"
  on public.assignment_results for insert to authenticated
  with check (student_user_id = auth.uid());

drop policy if exists "assignment_results_student_update" on public.assignment_results;
create policy "assignment_results_student_update"
  on public.assignment_results for update to authenticated
  using (student_user_id = auth.uid())
  with check (student_user_id = auth.uid());

drop policy if exists "assignment_results_teacher_insert" on public.assignment_results;
create policy "assignment_results_teacher_insert"
  on public.assignment_results for insert to authenticated
  with check (
    exists (
      select 1
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "assignment_results_teacher_update" on public.assignment_results;
create policy "assignment_results_teacher_update"
  on public.assignment_results for update to authenticated
  using (
    exists (
      select 1
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id and c.teacher_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id and c.teacher_user_id = auth.uid()
    )
  );
