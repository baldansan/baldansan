-- Buunduu Surtsgaay — Phase 7 Step 10: organizations + B2B inquiry CRM
-- Safe to re-run

-- =============================================================================
-- organizations
-- =============================================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type text not null default 'training_center',
  website text,
  phone text,
  email text,
  address text,
  notes text,
  status text not null default 'lead',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_status_idx on public.organizations (status);
create index if not exists organizations_organization_type_idx
  on public.organizations (organization_type);

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
  before update on public.organizations
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- organization_members
-- =============================================================================
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  email text,
  display_name text,
  role text not null default 'teacher',
  status text not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_members_organization_id_idx
  on public.organization_members (organization_id);
create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);
create index if not exists organization_members_email_idx
  on public.organization_members (email);

drop trigger if exists organization_members_updated_at on public.organization_members;
create trigger organization_members_updated_at
  before update on public.organization_members
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- b2b_inquiries
-- =============================================================================
create table if not exists public.b2b_inquiries (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  contact_person text,
  email text,
  phone text,
  organization_type text,
  student_count text,
  interested_package text,
  message text,
  source text default 'school_inquiry_page',
  status text not null default 'new',
  assigned_to uuid,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists b2b_inquiries_status_idx on public.b2b_inquiries (status);
create index if not exists b2b_inquiries_email_idx on public.b2b_inquiries (email);
create index if not exists b2b_inquiries_organization_type_idx
  on public.b2b_inquiries (organization_type);
create index if not exists b2b_inquiries_created_at_idx
  on public.b2b_inquiries (created_at desc);

drop trigger if exists b2b_inquiries_updated_at on public.b2b_inquiries;
create trigger b2b_inquiries_updated_at
  before update on public.b2b_inquiries
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- b2b_inquiry_activity
-- =============================================================================
create table if not exists public.b2b_inquiry_activity (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.b2b_inquiries(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists b2b_inquiry_activity_inquiry_id_idx
  on public.b2b_inquiry_activity (inquiry_id);

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.b2b_inquiries enable row level security;
alter table public.b2b_inquiry_activity enable row level security;

-- organizations
drop policy if exists "organizations_admin_all" on public.organizations;
create policy "organizations_admin_all"
  on public.organizations for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "organizations_member_select" on public.organizations;
create policy "organizations_member_select"
  on public.organizations for select to authenticated
  using (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
    )
  );

-- organization_members
drop policy if exists "organization_members_admin_all" on public.organization_members;
create policy "organization_members_admin_all"
  on public.organization_members for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "organization_members_self_select" on public.organization_members;
create policy "organization_members_self_select"
  on public.organization_members for select to authenticated
  using (user_id = auth.uid());

-- b2b_inquiries — public insert, admin read/update/delete
drop policy if exists "b2b_inquiries_public_insert" on public.b2b_inquiries;
create policy "b2b_inquiries_public_insert"
  on public.b2b_inquiries for insert to anon, authenticated
  with check (
    organization_name is not null
    and length(trim(organization_name)) > 0
  );

drop policy if exists "b2b_inquiries_admin_select" on public.b2b_inquiries;
create policy "b2b_inquiries_admin_select"
  on public.b2b_inquiries for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "b2b_inquiries_admin_update" on public.b2b_inquiries;
create policy "b2b_inquiries_admin_update"
  on public.b2b_inquiries for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "b2b_inquiries_admin_delete" on public.b2b_inquiries;
create policy "b2b_inquiries_admin_delete"
  on public.b2b_inquiries for delete to authenticated
  using ((select public.is_admin()));

-- b2b_inquiry_activity — admin only
drop policy if exists "b2b_inquiry_activity_admin_select" on public.b2b_inquiry_activity;
create policy "b2b_inquiry_activity_admin_select"
  on public.b2b_inquiry_activity for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "b2b_inquiry_activity_admin_insert" on public.b2b_inquiry_activity;
create policy "b2b_inquiry_activity_admin_insert"
  on public.b2b_inquiry_activity for insert to authenticated
  with check ((select public.is_admin()));

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant insert on public.b2b_inquiries to anon, authenticated;
grant select, update, delete on public.b2b_inquiries to authenticated;
grant select, insert on public.b2b_inquiry_activity to authenticated;
