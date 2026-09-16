-- Buunduu Surtsgaay — 058: даалгаврыг нэг сурагчид онилох
--
-- ЯАГААД ЭНЭ ЗАСВАР ХЭРЭГТЭЙ ВЭ:
-- Өмнө нь assignments хүснэгтэд сурагчийн багана байхгүй байсан тул «зөвхөн нэг
-- сурагчид өгсөн» даалгаврыг assignment_results.metadata дотор тэмдэглээд,
-- сурагчийн НЭРИЙГ assignments.instructions дотор бичдэг байв. Харин 013-ын
-- "assignments_select" бодлого нь ангийн БҮХ сурагчид бүх мөрийг уншуулдаг тул
-- ангийнхан нь «Б. Ариунаа — 3-р хичээл дахин давтах» гэсэн бичвэрийг уншиж
-- чаддаг байсан. Энэ бол хувийн мэдээлэл задарсан бодит алдаа.
--
-- Шийдэл: assignments дээр target_student_user_id багана нэмж, зорилтот
-- сурагчийг өгөгдлийн сангийн түвшинд тэмдэглээд, SELECT бодлогыг түүгээр
-- шүүнэ. Ингэснээр нэр нь бичвэрт байх шаардлагагүй болно.
--
-- Дахин ажиллуулахад аюулгүй (if not exists / drop policy if exists).
-- Шаардлага: 011, 013 засварууд ажилласан байх ёстой.

-- =============================================================================
-- 1. Зорилтот сурагчийн багана
-- =============================================================================
-- null = ангийн бүх сурагчид (хуучин зан төлөв хэвээр).
-- утгатай = зөвхөн тэр нэг сурагчид харагдана.
alter table public.assignments
  add column if not exists target_student_user_id uuid;

comment on column public.assignments.target_student_user_id is
  'Зорилтот сурагчийн auth хэрэглэгчийн ID. null бол ангид бүхэлд нь өгсөн даалгавар.';

-- Сурагчийн даалгаврын жагсаалт (classroom_id + target) хоёроор шүүгддэг.
create index if not exists assignments_target_student_user_id_idx
  on public.assignments (target_student_user_id);

-- =============================================================================
-- 2. lesson_id-г хоосон байхыг зөвшөөрөх
-- =============================================================================
-- Багш өөрөө бичсэн, хичээл хавсаргаагүй даалгавар («ангид хийх ажил») урьд нь
-- lesson_id = 'custom' гэсэн хиймэл утгатай бичигддэг байсан. Одооноос NULL
-- бичнэ.
--
-- АНХААР: хуучин мөрүүдийг ЗАСАХГҮЙ. 'custom' утгатай мөрүүд хэвээрээ үлдэнэ,
-- аппын түвшинд isCustomAssignment() нь NULL болон 'custom' хоёуланг нь ижил
-- гэж уншина.
alter table public.assignments
  alter column lesson_id drop not null;

comment on column public.assignments.lesson_id is
  'Хичээлийн ID. NULL бол хичээл хавсаргаагүй, багшийн өөрийн даалгавар. Хуучин мөрүүдэд NULL-ын оронд ''custom'' гэж бичигдсэн байж болно.';

-- =============================================================================
-- 3. Даалгаврын хавсралтын мэдээлэл
-- =============================================================================
-- Хавсралтыг ТУСДАА хүснэгт биш, assignments дээрх багануудаар хадгална.
-- Шалтгаан: хавсралтын харагдах эрх нь даалгаврынхаа харагдах эрхээс ЯГ
-- хамаарах ёстой. Нэг мөрөнд байвал дээрх SELECT бодлого хавсралтыг ч
-- автоматаар хамгаална — онилсон даалгаврын хавсралт ангийнханд харагдахгүй.
-- Тусдаа хүснэгт байсан бол мөн адил RLS-ийг хоёр дахин бичих шаардлагатай
-- болж, алдаа гарах эрсдэл нэмэгдэнэ.
alter table public.assignments
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size_bytes bigint,
  add column if not exists attachment_mime_type text;

comment on column public.assignments.attachment_path is
  'assignment-attachments bucket доторх файлын зам. NULL бол хавсралт алга.';

-- Storage бодлого нь энэ баганаар файлыг даалгавартай тааруулдаг тул хайлтыг
-- индексжүүлнэ.
create index if not exists assignments_attachment_path_idx
  on public.assignments (attachment_path)
  where attachment_path is not null;

-- =============================================================================
-- 4. SELECT бодлогыг солих
-- =============================================================================
-- СОЛИГДОЖ БУЙ БОДЛОГО: "assignments_select" (013_organization_classrooms_permissions.sql).
--
-- Хуучин бодлого юу зөвшөөрдөг байсан бэ:
--   1. public.is_admin()                                        → бүх мөр
--   2. ангийн эзэн багш (classrooms.teacher_user_id = auth.uid()) → бүх мөр
--   3. ангийн байгууллагын ДУРЫН гишүүн (is_org_member)          → бүх мөр
--      — organization_members.role нь 'student' ч байж болдог тул
--        байгууллагын сурагчид ч бүх мөрийг уншиж чаддаг байсан.
--   4. тухайн ангид бүртгэлтэй ДУРЫН сурагч                      → бүх мөр
--      — энэ нь ангийнхан бие биенийхээ онилсон даалгаврыг уншдаг байсан
--        гол шалтгаан.
--
-- Шинэ бодлого:
--   1. is_admin()                                → бүх мөр (хэвээр)
--   2. ангийн эзэн багш                          → бүх мөр (хэвээр)
--   3. байгууллагын АЖИЛТАН (багш/эрхлэгч/туслах) → бүх мөр
--      — is_org_member биш is_org_teacher / is_org_assistant болгож нарийсгав.
--        Байгууллагын 'student' гишүүн энэ замаар дамжиж чадахгүй.
--   4. ангид бүртгэлтэй сурагч                   → ЗӨВХӨН
--        target_student_user_id is null (ангид бүхэлд нь өгсөн)
--        ЭСВЭЛ target_student_user_id = auth.uid() (өөрт нь онилсон).
--
-- Өөр ямар ч эрхийг нэмээгүй.
drop policy if exists "assignments_select" on public.assignments;
-- 011-ийн анхны нэрийг ч цэвэрлэнэ (013 ажиллаагүй суулгац дээр үлдсэн байж болно).
drop policy if exists "assignments_teacher_select" on public.assignments;

create policy "assignments_select"
  on public.assignments for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.classrooms c
      where c.id = assignments.classroom_id
        and c.teacher_user_id = auth.uid()
    )
    or exists (
      select 1 from public.classrooms c
      where c.id = assignments.classroom_id
        and c.organization_id is not null
        and (
          public.is_org_teacher(c.organization_id)
          or public.is_org_assistant(c.organization_id)
        )
    )
    or (
      (
        assignments.target_student_user_id is null
        or assignments.target_student_user_id = auth.uid()
      )
      and exists (
        select 1 from public.classroom_students cs
        where cs.classroom_id = assignments.classroom_id
          and cs.student_user_id = auth.uid()
      )
    )
  );
