-- =============================================================================
-- Buunduu Surtsgaay — Phase 5 Step 16: lesson-media Storage bucket + RLS
-- =============================================================================
--
-- Prerequisites:
--   1. supabase/policies/002_admin_content_policies.sql applied (public.is_admin)
--   2. At least one admin row in admin_profiles
--
-- Safe to re-run: ON CONFLICT + DROP POLICY IF EXISTS
--
-- If INSERT into storage.buckets fails, create bucket "lesson-media" (public)
-- in Supabase Dashboard → Storage, then run policies below only.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('lesson-media', 'lesson-media', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

-- -----------------------------------------------------------------------------
-- Public read — learners can fetch media URLs (bucket is public)
-- -----------------------------------------------------------------------------

drop policy if exists "lesson_media_public_select" on storage.objects;

create policy "lesson_media_public_select"
  on storage.objects
  for select
  to public
  using (bucket_id = 'lesson-media');

-- -----------------------------------------------------------------------------
-- Admin upload / manage
-- -----------------------------------------------------------------------------

drop policy if exists "lesson_media_admin_insert" on storage.objects;

create policy "lesson_media_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'lesson-media'
    and public.is_admin()
  );

drop policy if exists "lesson_media_admin_update" on storage.objects;

create policy "lesson_media_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'lesson-media'
    and public.is_admin()
  )
  with check (
    bucket_id = 'lesson-media'
    and public.is_admin()
  );

drop policy if exists "lesson_media_admin_delete" on storage.objects;

create policy "lesson_media_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'lesson-media'
    and public.is_admin()
  );

-- No anon insert/update/delete on lesson-media.
