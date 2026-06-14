-- =============================================================================
-- Buunduu Surtsgaay — video-thumbnails Storage bucket + RLS
-- =============================================================================
--
-- Prerequisites:
--   1. supabase/policies/002_admin_content_policies.sql applied (public.is_admin)
--   2. At least one admin row in admin_profiles
--
-- Safe to re-run: ON CONFLICT + DROP POLICY IF EXISTS
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('video-thumbnails', 'video-thumbnails', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "video_thumbnails_public_select" on storage.objects;

create policy "video_thumbnails_public_select"
  on storage.objects
  for select
  to public
  using (bucket_id = 'video-thumbnails');

drop policy if exists "video_thumbnails_admin_insert" on storage.objects;

create policy "video_thumbnails_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'video-thumbnails'
    and public.is_admin()
  );

drop policy if exists "video_thumbnails_admin_update" on storage.objects;

create policy "video_thumbnails_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'video-thumbnails'
    and public.is_admin()
  )
  with check (
    bucket_id = 'video-thumbnails'
    and public.is_admin()
  );

drop policy if exists "video_thumbnails_admin_delete" on storage.objects;

create policy "video_thumbnails_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'video-thumbnails'
    and public.is_admin()
  );
