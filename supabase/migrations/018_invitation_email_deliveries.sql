-- Buunduu Surtsgaay — Phase 7 Step 16: invitation email deliveries (provider-ready)
-- Safe to re-run. Requires 015 (+ 017 recommended).
-- Note: legacy table organization_invitation_deliveries may exist from earlier 016.

create table if not exists public.invitation_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.organization_invitations(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  body text not null,
  provider text not null default 'manual',
  status text not null default 'queued',
  error_message text,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitation_email_deliveries_invitation_idx
  on public.invitation_email_deliveries (invitation_id);
create index if not exists invitation_email_deliveries_recipient_idx
  on public.invitation_email_deliveries (recipient_email);
create index if not exists invitation_email_deliveries_status_idx
  on public.invitation_email_deliveries (status);
create index if not exists invitation_email_deliveries_created_idx
  on public.invitation_email_deliveries (created_at desc);

drop trigger if exists invitation_email_deliveries_updated_at on public.invitation_email_deliveries;
create trigger invitation_email_deliveries_updated_at
  before update on public.invitation_email_deliveries
  for each row
  execute function public.update_updated_at_column();

alter table public.invitation_email_deliveries enable row level security;

drop policy if exists invitation_email_deliveries_admin_all on public.invitation_email_deliveries;
create policy invitation_email_deliveries_admin_all
  on public.invitation_email_deliveries for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists invitation_email_deliveries_org_manager on public.invitation_email_deliveries;
create policy invitation_email_deliveries_org_manager
  on public.invitation_email_deliveries for all to authenticated
  using (
    exists (
      select 1
      from public.organization_invitations i
      where i.id = invitation_id
        and i.organization_id is not null
        and public.can_manage_org(i.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.organization_invitations i
      where i.id = invitation_id
        and i.organization_id is not null
        and public.can_manage_org(i.organization_id)
    )
  );

drop policy if exists invitation_email_deliveries_classroom_manager on public.invitation_email_deliveries;
create policy invitation_email_deliveries_classroom_manager
  on public.invitation_email_deliveries for all to authenticated
  using (
    exists (
      select 1
      from public.organization_invitations i
      where i.id = invitation_id
        and i.classroom_id is not null
        and public.can_manage_org_classroom(i.classroom_id)
    )
  )
  with check (
    exists (
      select 1
      from public.organization_invitations i
      where i.id = invitation_id
        and i.classroom_id is not null
        and public.can_manage_org_classroom(i.classroom_id)
    )
  );
