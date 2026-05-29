-- Buunduu Surtsgaay — Phase 7 Step 16: server-safe invitation email delivery log
-- Safe to re-run. Requires 015.

create table if not exists public.organization_invitation_deliveries (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.organization_invitations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel text not null default 'email',
  delivery_status text not null default 'queued',
  recipient_email text not null,
  subject text not null,
  body_text text not null,
  provider text not null default 'server_route',
  error_message text,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_invitation_deliveries_invitation_idx
  on public.organization_invitation_deliveries (invitation_id);
create index if not exists organization_invitation_deliveries_org_idx
  on public.organization_invitation_deliveries (organization_id);
create index if not exists organization_invitation_deliveries_status_idx
  on public.organization_invitation_deliveries (delivery_status);

drop trigger if exists organization_invitation_deliveries_updated_at on public.organization_invitation_deliveries;
create trigger organization_invitation_deliveries_updated_at
  before update on public.organization_invitation_deliveries
  for each row
  execute function public.update_updated_at_column();

alter table public.organization_invitation_deliveries enable row level security;

drop policy if exists organization_invitation_deliveries_admin_all on public.organization_invitation_deliveries;
create policy organization_invitation_deliveries_admin_all
  on public.organization_invitation_deliveries for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists organization_invitation_deliveries_manager_select on public.organization_invitation_deliveries;
create policy organization_invitation_deliveries_manager_select
  on public.organization_invitation_deliveries for select to authenticated
  using (public.can_manage_org(organization_id));

drop policy if exists organization_invitation_deliveries_manager_insert on public.organization_invitation_deliveries;
create policy organization_invitation_deliveries_manager_insert
  on public.organization_invitation_deliveries for insert to authenticated
  with check (public.can_manage_org(organization_id));

drop policy if exists organization_invitation_deliveries_manager_update on public.organization_invitation_deliveries;
create policy organization_invitation_deliveries_manager_update
  on public.organization_invitation_deliveries for update to authenticated
  using (public.can_manage_org(organization_id))
  with check (public.can_manage_org(organization_id));
