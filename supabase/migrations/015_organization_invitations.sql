-- Buunduu Surtsgaay — Phase 7 Step 14/15: organization invitations + invite links
-- Safe to re-run. Requires 012 + 013.

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  organization_member_id uuid references public.organization_members(id) on delete set null,
  classroom_id uuid references public.classrooms(id) on delete set null,
  invite_token text not null unique,
  email text,
  display_name text,
  role text not null default 'teacher',
  invite_kind text not null default 'organization_member',
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_invitations_org_idx
  on public.organization_invitations (organization_id);
create index if not exists organization_invitations_status_idx
  on public.organization_invitations (status);
create index if not exists organization_invitations_email_idx
  on public.organization_invitations (email);
create index if not exists organization_invitations_token_idx
  on public.organization_invitations (invite_token);

drop trigger if exists organization_invitations_updated_at on public.organization_invitations;
create trigger organization_invitations_updated_at
  before update on public.organization_invitations
  for each row
  execute function public.update_updated_at_column();

-- Safe public lookup by token (no list exposure)
create or replace function public.lookup_organization_invitation(p_token text)
returns table (
  invitation_id uuid,
  organization_id uuid,
  organization_name text,
  email text,
  display_name text,
  role text,
  invite_kind text,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id,
    i.organization_id,
    o.name,
    i.email,
    i.display_name,
    i.role,
    i.invite_kind,
    i.status,
    i.expires_at
  from public.organization_invitations i
  join public.organizations o on o.id = i.organization_id
  where i.invite_token = p_token
    and i.status = 'pending'
    and i.expires_at > now();
$$;

create or replace function public.accept_organization_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.organization_invitations%rowtype;
  v_member_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Not signed in.');
  end if;

  select * into v_inv
  from public.organization_invitations
  where invite_token = p_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invitation not found or expired.');
  end if;

  if v_inv.organization_member_id is not null then
    update public.organization_members
    set
      user_id = v_uid,
      status = 'active',
      joined_at = coalesce(joined_at, now()),
      updated_at = now()
    where id = v_inv.organization_member_id
    returning id into v_member_id;
  else
    insert into public.organization_members (
      organization_id, user_id, email, display_name, role, status, joined_at
    ) values (
      v_inv.organization_id,
      v_uid,
      v_inv.email,
      v_inv.display_name,
      v_inv.role,
      'active',
      now()
    )
    returning id into v_member_id;
  end if;

  update public.organization_invitations
  set
    status = 'accepted',
    accepted_at = now(),
    accepted_by = v_uid,
    organization_member_id = coalesce(organization_member_id, v_member_id),
    updated_at = now()
  where id = v_inv.id;

  return jsonb_build_object(
    'ok', true,
    'organization_id', v_inv.organization_id,
    'member_id', v_member_id,
    'role', v_inv.role
  );
end;
$$;

grant execute on function public.lookup_organization_invitation(text) to anon, authenticated;
grant execute on function public.accept_organization_invitation(text) to authenticated;

alter table public.organization_invitations enable row level security;

drop policy if exists organization_invitations_admin_all on public.organization_invitations;
create policy organization_invitations_admin_all
  on public.organization_invitations for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists organization_invitations_manager_select on public.organization_invitations;
create policy organization_invitations_manager_select
  on public.organization_invitations for select to authenticated
  using (
    public.can_manage_org(organization_id)
    or public.is_org_teacher(organization_id)
  );

drop policy if exists organization_invitations_manager_insert on public.organization_invitations;
create policy organization_invitations_manager_insert
  on public.organization_invitations for insert to authenticated
  with check (public.can_manage_org(organization_id));

drop policy if exists organization_invitations_manager_update on public.organization_invitations;
create policy organization_invitations_manager_update
  on public.organization_invitations for update to authenticated
  using (public.can_manage_org(organization_id))
  with check (public.can_manage_org(organization_id));

drop policy if exists organization_invitations_manager_delete on public.organization_invitations;
create policy organization_invitations_manager_delete
  on public.organization_invitations for delete to authenticated
  using (public.can_manage_org(organization_id));
