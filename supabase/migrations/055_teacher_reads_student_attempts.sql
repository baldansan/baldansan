-- 055: Багш өөрийн ангийн сурагчийн алдааг унших эрх.
--
-- Яагаад хэрэгтэй вэ:
-- 051 засварын дараа question_attempts-ыг зөвхөн оролдлого хийсэн суралцагч
-- өөрөө уншдаг болсон. Ингэснээр багш сурагчаа хаана, ямар хичээл дээр алдаж
-- байгааг огт харж чадахгүй — «сул талаар нь онилж давтуулах» ажил боломжгүй.
-- Энэ засвар багшид ЗӨВХӨН өөрийнх нь ангид бүртгэлтэй сурагчдын мөрүүдийг
-- уншуулна. Өөр багшийн сурагч, аль ч ангид бүртгэлгүй хэрэглэгчийн мөр
-- хэвээрээ хаалттай. Одоо байгаа админы эрх (question_attempts_admin_select)
-- болон суралцагчийн өөрийн эрх (question_attempts_select_own) хөндөгдөхгүй.
--
-- Дахин ажиллуулахад аюулгүй: drop policy if exists → create policy.

-- ---------------------------------------------------------------------------
-- Тусламжийн функц
--
-- RLS политик дотроос classroom_students / classrooms руу шууд хандвал тэдгээр
-- хүснэгтийн өөрийнх нь политиктой дахин орооцолдоно. Тиймээс 013 засварын
-- (can_read_org_classroom гэх мэт) загварын дагуу security definer функц
-- ашиглана. Функц нь ЗӨВХӨН «энэ хэрэглэгч миний ангийн сурагч мөн үү?» гэсэн
-- true/false-ыг буцаана, өгөгдөл буцаадаггүй.
-- ---------------------------------------------------------------------------

create or replace function public.teacher_reads_learner(
  learner_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    learner_id is not null
    and check_user_id is not null
    and exists (
      select 1
      from public.classroom_students cs
      join public.classrooms c on c.id = cs.classroom_id
      where cs.student_user_id = learner_id
        and c.teacher_user_id = check_user_id
    );
$$;

comment on function public.teacher_reads_learner(uuid, uuid) is
  'Багш өөрийн ангийн сурагчийн мөрийг үзэх эрхтэй эсэх. Зөвхөн classrooms.teacher_user_id тааралдвал true.';

grant execute on function public.teacher_reads_learner(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- question_attempts — багшийн унших политик
-- ---------------------------------------------------------------------------

drop policy if exists "question_attempts_teacher_select" on public.question_attempts;
create policy "question_attempts_teacher_select"
  on public.question_attempts
  for select
  to authenticated
  using (public.teacher_reads_learner(user_id));

comment on policy "question_attempts_teacher_select" on public.question_attempts is
  'Багш өөрийн ангийн сурагчдын асуулт бүрийн оролдлогыг харж, сул талаар нь даалгавар өгөхөд шаардлагатай. Өөр ангийн мөр харагдахгүй.';

-- ---------------------------------------------------------------------------
-- user_quiz_attempts — багшийн унших политик
--
-- Энэ хүснэгтийн RLS нь supabase/policies/001_auth_rls_policies.sql дотор
-- тодорхойлогддог (зөвхөн user_quiz_attempts_select_own + _insert_own; админы
-- тусдаа эрх байхгүй). Энд байгаа зөвхөн НЭМЭЛТ политик — юуг ч өргөжүүлэхгүй,
-- одоо байгаа политикуудыг хөндөхгүй. RLS асаах/унтраах үйлдэл ч хийхгүй.
-- ---------------------------------------------------------------------------

drop policy if exists "user_quiz_attempts_teacher_select" on public.user_quiz_attempts;
create policy "user_quiz_attempts_teacher_select"
  on public.user_quiz_attempts
  for select
  to authenticated
  using (public.teacher_reads_learner(user_id));

comment on policy "user_quiz_attempts_teacher_select" on public.user_quiz_attempts is
  'Багш өөрийн ангийн сурагчдын дасгалын оноог харах эрх. Өөр ангийн мөр харагдахгүй.';
