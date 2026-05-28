-- =============================================================================
-- Buunduu Surtsgaay — Phase 5 Step 2: admin_profiles table + RLS
-- =============================================================================
--
-- Run in Supabase Dashboard → SQL Editor (review first).
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
--
-- After this script:
--   1. Find your user UUID: Dashboard → Authentication → Users
--   2. Bootstrap your admin row (SQL Editor; bypasses RLS as postgres):
--
--      insert into public.admin_profiles (user_id, role)
--      values ('USER_UUID_HERE', 'admin')
--      on conflict (user_id) do update set role = excluded.role;
--
-- Never expose service_role in the Next.js client.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table
-- -----------------------------------------------------------------------------

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

-- -----------------------------------------------------------------------------
-- Helper: is current JWT user in admin_profiles?
-- -----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and role in ('admin', 'owner')
  );
$$;

comment on function public.is_admin() is
  'True when auth.uid() has admin or owner role in admin_profiles.';

-- -----------------------------------------------------------------------------
-- RLS policies (idempotent)
-- -----------------------------------------------------------------------------

drop policy if exists "admin_profiles_select_own" on public.admin_profiles;
create policy "admin_profiles_select_own"
  on public.admin_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "admin_profiles_select_all_for_admins" on public.admin_profiles;
create policy "admin_profiles_select_all_for_admins"
  on public.admin_profiles
  for select
  to authenticated
  using (public.is_admin());

-- Conservative: manage admin list only when already admin.
-- First admin row must be inserted via SQL Editor (postgres / service role in dashboard only).

drop policy if exists "admin_profiles_insert_admin_only" on public.admin_profiles;
create policy "admin_profiles_insert_admin_only"
  on public.admin_profiles
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admin_profiles_update_admin_only" on public.admin_profiles;
create policy "admin_profiles_update_admin_only"
  on public.admin_profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin_profiles_delete_admin_only" on public.admin_profiles;
create policy "admin_profiles_delete_admin_only"
  on public.admin_profiles
  for delete
  to authenticated
  using (public.is_admin());

-- No anon access.

-- =============================================================================
-- Verification (manual)
-- =============================================================================
-- select * from public.admin_profiles where user_id = auth.uid();  -- as admin JWT
-- =============================================================================
