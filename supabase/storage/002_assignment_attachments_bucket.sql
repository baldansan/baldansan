-- =============================================================================
-- Buunduu Surtsgaay — assignment-attachments Storage bucket + RLS
-- =============================================================================
--
-- Багш даалгаврынхаа хамт файл (PDF, зураг, аудио) хавсаргах боломж.
--
-- Prerequisites:
--   1. supabase/policies/002_admin_content_policies.sql applied (public.is_admin)
--   2. supabase/migrations/011_classroom_roles_assignments.sql applied
--   3. supabase/migrations/013_organization_classrooms_permissions.sql applied
--   4. supabase/migrations/058_assignment_targets.sql applied
--      (assignments.attachment_path, assignments.target_student_user_id)
--
-- Safe to re-run: ON CONFLICT + DROP POLICY IF EXISTS
--
-- ЭНЭ BUCKET НЬ PRIVATE. Ил нийтийн URL байхгүй — апп нь createSignedUrl-ээр
-- хугацаатай холбоос гаргана. Ингэснээр файлын зам таамаглаж олсон ч эрхгүй
-- хүн татаж чадахгүй.
--
-- If INSERT into storage.buckets fails, create bucket "assignment-attachments"
-- (private) in Supabase Dashboard → Storage, then run policies below only.
--
-- Хавтасны бүтэц:
--   classrooms/{classroomId}/assignments/{assignmentId}/{timestamp}-{filename}
--   foldername(name) → [1]='classrooms' [2]=classroomId [3]='assignments' [4]=assignmentId
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('assignment-attachments', 'assignment-attachments', false)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

-- -----------------------------------------------------------------------------
-- Ангийн эзэн багш — өөрийн ангийн хавтас дотор байршуулах
-- -----------------------------------------------------------------------------
-- Зөвхөн classrooms/{өөрийн ангийн id}/... гэсэн зам руу бичиж чадна.
-- Өөр багшийн ангийн хавтас руу бичих оролдлого RLS дээр таслагдана.

drop policy if exists "assignment_attachments_teacher_insert" on storage.objects;

create policy "assignment_attachments_teacher_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'assignment-attachments'
    and (storage.foldername(name))[1] = 'classrooms'
    and exists (
      select 1
      from public.classrooms c
      where c.id::text = (storage.foldername(name))[2]
        and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "assignment_attachments_teacher_select" on storage.objects;

create policy "assignment_attachments_teacher_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assignment-attachments'
    and (storage.foldername(name))[1] = 'classrooms'
    and exists (
      select 1
      from public.classrooms c
      where c.id::text = (storage.foldername(name))[2]
        and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "assignment_attachments_teacher_update" on storage.objects;

create policy "assignment_attachments_teacher_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'assignment-attachments'
    and (storage.foldername(name))[1] = 'classrooms'
    and exists (
      select 1
      from public.classrooms c
      where c.id::text = (storage.foldername(name))[2]
        and c.teacher_user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'assignment-attachments'
    and (storage.foldername(name))[1] = 'classrooms'
    and exists (
      select 1
      from public.classrooms c
      where c.id::text = (storage.foldername(name))[2]
        and c.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "assignment_attachments_teacher_delete" on storage.objects;

create policy "assignment_attachments_teacher_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'assignment-attachments'
    and (storage.foldername(name))[1] = 'classrooms'
    and exists (
      select 1
      from public.classrooms c
      where c.id::text = (storage.foldername(name))[2]
        and c.teacher_user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Сурагч — зөвхөн ӨӨРТ нь харагдах даалгаврын хавсралтыг УНШИНА
-- -----------------------------------------------------------------------------
-- Гурван нөхцөл зэрэг биелнэ:
--   1. файлын зам нь ямар нэг даалгаврын attachment_path-тай ЯГ тэнцүү,
--   2. сурагч тухайн даалгаврын ангид бүртгэлтэй,
--   3. даалгавар нь ангид бүхэлд нь өгсөн (target null) ЭСВЭЛ түүнд онилогдсон.
--
-- Энэ нь 058-ын assignments_select бодлоготой яг ижил логик — онилсон
-- даалгаврын хавсралтыг ангийнхан нь татаж чадахгүй.
-- Бичих/устгах эрх сурагчид АЛГА.

drop policy if exists "assignment_attachments_student_select" on storage.objects;

create policy "assignment_attachments_student_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assignment-attachments'
    and exists (
      select 1
      from public.assignments a
      join public.classroom_students cs
        on cs.classroom_id = a.classroom_id
      where a.attachment_path = storage.objects.name
        and cs.student_user_id = auth.uid()
        and (
          a.target_student_user_id is null
          or a.target_student_user_id = auth.uid()
        )
    )
  );

-- Өөр хэнд ч эрх алга: anon уншихгүй, admin-д тусгай бодлого нэмээгүй,
-- байгууллагын гишүүнд шууд storage эрх өгөөгүй.
