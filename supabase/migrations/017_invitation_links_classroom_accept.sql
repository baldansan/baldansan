-- Buunduu Surtsgaay — Phase 7 Step 15: classroom student invites + unified accept
-- Safe to re-run. Requires 015.
-- Note: `organization_invitations` is the canonical invitations store (alias view below).

-- Personal classroom invites may not have an organization
alter table public.organization_invitations
  alter column organization_id drop not null;

create index if not exists organization_invitations_classroom_idx
  on public.organization_invitations (classroom_id);
create index if not exists organization_invitations_kind_idx
  on public.organization_invitations (invite_kind);

-- Unified read-only view (spec alias: invitations)
drop view if exists public.invitations;
create view public.invitations as
select
  id,
  invite_token as token,
  invite_kind as invitation_type,
  email,
  display_name,
  organization_id,
  classroom_id,
  role,
  status,
  created_by as invited_by,
  accepted_by,
  accepted_at,
  expires_at,
  metadata,
  created_at,
  updated_at
from public.organization_invitations;

-- Lookup includes classroom context
create or replace function public.lookup_organization_invitation(p_token text)
returns table (
  invitation_id uuid,
  organization_id uuid,
  organization_name text,
  classroom_id uuid,
  classroom_name text,
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
    i.classroom_id,
    c.name,
    i.email,
    i.display_name,
    i.role,
    i.invite_kind,
    i.status,
    i.expires_at
  from public.organization_invitations i
  left join public.organizations o on o.id = i.organization_id
  left join public.classrooms c on c.id = i.classroom_id
  where i.invite_token = p_token
    and i.status = 'pending'
    and i.expires_at > now();
$$;

-- Accept org member or classroom student invitation
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
  v_student_id uuid;
  v_user_email text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Not signed in.');
  end if;

  select email into v_user_email from auth.users where id = v_uid;

  select * into v_inv
  from public.organization_invitations
  where invite_token = p_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invitation not found or expired.');
  end if;

  if v_inv.email is not null and v_user_email is not null
     and lower(trim(v_inv.email)) <> lower(trim(v_user_email)) then
    return jsonb_build_object(
      'ok', false,
      'error', 'Signed-in email does not match invitation email.'
    );
  end if;

  if v_inv.invite_kind = 'classroom_student' then
    if v_inv.classroom_id is null then
      return jsonb_build_object('ok', false, 'error', 'Invalid classroom invitation.');
    end if;

    select cs.id into v_student_id
    from public.classroom_students cs
    where cs.classroom_id = v_inv.classroom_id
      and (
        cs.student_user_id = v_uid
        or (
          v_inv.email is not null
          and cs.email is not null
          and lower(cs.email) = lower(v_inv.email)
        )
      )
    limit 1;

    if v_student_id is not null then
      update public.classroom_students
      set
        student_user_id = v_uid,
        email = coalesce(v_user_email, email),
        display_name = coalesce(v_inv.display_name, display_name),
        status = 'active',
        joined_at = coalesce(joined_at, now()),
        updated_at = now()
      where id = v_student_id;
    else
      insert into public.classroom_students (
        classroom_id, student_user_id, email, display_name, status, joined_at
      ) values (
        v_inv.classroom_id,
        v_uid,
        coalesce(v_user_email, v_inv.email),
        coalesce(v_inv.display_name, v_user_email),
        'active',
        now()
      )
      returning id into v_student_id;
    end if;

    insert into public.student_profiles (user_id, display_name)
    values (v_uid, coalesce(v_inv.display_name, v_user_email))
    on conflict (user_id) do update
    set display_name = coalesce(excluded.display_name, student_profiles.display_name),
        updated_at = now();

    update public.organization_invitations
    set
      status = 'accepted',
      accepted_at = now(),
      accepted_by = v_uid,
      updated_at = now()
    where id = v_inv.id;

    return jsonb_build_object(
      'ok', true,
      'invite_kind', 'classroom_student',
      'classroom_id', v_inv.classroom_id,
      'student_id', v_student_id
    );
  end if;

  -- organization_member (default)
  if v_inv.organization_id is null then
    return jsonb_build_object('ok', false, 'error', 'Invalid organization invitation.');
  end if;

  if v_inv.organization_member_id is not null then
    update public.organization_members
    set
      user_id = v_uid,
      email = coalesce(v_user_email, email),
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
      coalesce(v_user_email, v_inv.email),
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
    'invite_kind', 'organization_member',
    'organization_id', v_inv.organization_id,
    'member_id', v_member_id,
    'role', v_inv.role
  );
end;
$$;

-- Classroom teachers / org managers can create classroom student invitations
drop policy if exists organization_invitations_classroom_insert on public.organization_invitations;
create policy organization_invitations_classroom_insert
  on public.organization_invitations for insert to authenticated
  with check (
    classroom_id is not null
    and invite_kind = 'classroom_student'
    and public.can_manage_org_classroom(classroom_id)
  );

drop policy if exists organization_invitations_classroom_select on public.organization_invitations;
create policy organization_invitations_classroom_select
  on public.organization_invitations for select to authenticated
  using (
    classroom_id is not null
    and public.can_manage_org_classroom(classroom_id)
  );

drop policy if exists organization_invitations_classroom_update on public.organization_invitations;
create policy organization_invitations_classroom_update
  on public.organization_invitations for update to authenticated
  using (
    classroom_id is not null
    and public.can_manage_org_classroom(classroom_id)
  )
  with check (
    classroom_id is not null
    and public.can_manage_org_classroom(classroom_id)
  );

grant select on public.invitations to authenticated;
