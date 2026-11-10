-- 080: Admin write access for mock tests (真题 import via /admin/import/mock-test)
-- Requires public.is_admin() (supabase/policies/002_admin_content_policies.sql).

-- mock_tests
drop policy if exists "mock_tests_admin_write" on public.mock_tests;
create policy "mock_tests_admin_write"
  on public.mock_tests
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- mock_test_questions
drop policy if exists "mock_test_questions_admin_write" on public.mock_test_questions;
create policy "mock_test_questions_admin_write"
  on public.mock_test_questions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- skill_tags
drop policy if exists "skill_tags_admin_write" on public.skill_tags;
create policy "skill_tags_admin_write"
  on public.skill_tags
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Storage: test-assets admin upload/overwrite
drop policy if exists "test_assets_admin_insert" on storage.objects;
create policy "test_assets_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'test-assets' and public.is_admin());

drop policy if exists "test_assets_admin_update" on storage.objects;
create policy "test_assets_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'test-assets' and public.is_admin())
  with check (bucket_id = 'test-assets' and public.is_admin());

drop policy if exists "test_assets_admin_delete" on storage.objects;
create policy "test_assets_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'test-assets' and public.is_admin());
