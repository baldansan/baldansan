-- Buunduu Surtsgaay — Phase 7 Step 13: B2B pilot onboarding workflow
-- Safe to re-run. Requires 012 + 013.

-- =============================================================================
-- organization_onboarding
-- =============================================================================
create table if not exists public.organization_onboarding (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  onboarding_status text not null default 'not_started',
  pilot_stage text not null default 'inquiry',
  target_start_date date,
  target_student_count integer,
  pilot_goal text,
  onboarding_note text,
  completed_steps jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_onboarding_status_idx
  on public.organization_onboarding (onboarding_status);
create index if not exists organization_onboarding_pilot_stage_idx
  on public.organization_onboarding (pilot_stage);

drop trigger if exists organization_onboarding_updated_at on public.organization_onboarding;
create trigger organization_onboarding_updated_at
  before update on public.organization_onboarding
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- organization_onboarding_tasks
-- =============================================================================
create table if not exists public.organization_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_key text not null,
  title text not null,
  description text,
  category text not null default 'setup',
  status text not null default 'open',
  due_date date,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, task_key)
);

create index if not exists organization_onboarding_tasks_org_idx
  on public.organization_onboarding_tasks (organization_id);
create index if not exists organization_onboarding_tasks_status_idx
  on public.organization_onboarding_tasks (status);
create index if not exists organization_onboarding_tasks_category_idx
  on public.organization_onboarding_tasks (category);

drop trigger if exists organization_onboarding_tasks_updated_at on public.organization_onboarding_tasks;
create trigger organization_onboarding_tasks_updated_at
  before update on public.organization_onboarding_tasks
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.organization_onboarding enable row level security;
alter table public.organization_onboarding_tasks enable row level security;

drop policy if exists organization_onboarding_admin_all on public.organization_onboarding;
create policy organization_onboarding_admin_all
  on public.organization_onboarding
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists organization_onboarding_manager_select on public.organization_onboarding;
create policy organization_onboarding_manager_select
  on public.organization_onboarding
  for select
  to authenticated
  using (
    public.can_manage_org(organization_id)
    or public.is_org_teacher(organization_id)
    or public.is_org_member(organization_id)
  );

drop policy if exists organization_onboarding_manager_update on public.organization_onboarding;
create policy organization_onboarding_manager_update
  on public.organization_onboarding
  for update
  to authenticated
  using (public.can_manage_org(organization_id))
  with check (public.can_manage_org(organization_id));

drop policy if exists organization_onboarding_manager_insert on public.organization_onboarding;
create policy organization_onboarding_manager_insert
  on public.organization_onboarding
  for insert
  to authenticated
  with check (public.can_manage_org(organization_id));

drop policy if exists organization_onboarding_tasks_admin_all on public.organization_onboarding_tasks;
create policy organization_onboarding_tasks_admin_all
  on public.organization_onboarding_tasks
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists organization_onboarding_tasks_member_select on public.organization_onboarding_tasks;
create policy organization_onboarding_tasks_member_select
  on public.organization_onboarding_tasks
  for select
  to authenticated
  using (
    public.is_org_member(organization_id)
    or public.is_org_teacher(organization_id)
    or public.can_manage_org(organization_id)
  );

drop policy if exists organization_onboarding_tasks_manager_write on public.organization_onboarding_tasks;
create policy organization_onboarding_tasks_manager_write
  on public.organization_onboarding_tasks
  for all
  to authenticated
  using (public.can_manage_org(organization_id))
  with check (public.can_manage_org(organization_id));

drop policy if exists organization_onboarding_tasks_teacher_update on public.organization_onboarding_tasks;
create policy organization_onboarding_tasks_teacher_update
  on public.organization_onboarding_tasks
  for update
  to authenticated
  using (public.is_org_teacher(organization_id))
  with check (public.is_org_teacher(organization_id));

drop policy if exists organization_onboarding_tasks_teacher_insert on public.organization_onboarding_tasks;
create policy organization_onboarding_tasks_teacher_insert
  on public.organization_onboarding_tasks
  for insert
  to authenticated
  with check (public.is_org_teacher(organization_id));
