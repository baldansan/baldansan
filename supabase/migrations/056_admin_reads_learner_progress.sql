-- 056: Админ суралцагчдын ахицын мөрүүдийг унших эрх.
--
-- Яагаад хэрэгтэй вэ:
-- Админы тайлангууд (/admin, /admin/learners, /admin/center, /admin/analytics)
-- суралцагчдын дасгал, үг, шалгалтын мөрүүд дээр тооцоо хийдэг. Гэвч эдгээр
-- хүснэгтэд «зөвхөн өөрийн мөр» гэсэн бодлого л байсан тул админ ямар ч
-- суралцагчийн дүнг харж чадахгүй — хуудсууд алдаа заахгүйгээр ХООСОН
-- харагддаг (RLS нь алдаа өгөхгүй, зүгээр л 0 мөр буцаана). Тиймээс
-- «дасгал ажиллаагүй» мэт төөрөгдүүлсэн зураг гарч байсан.
--
-- ЮУГ НЭЭЖ БАЙГАА ВЭ: зөвхөн УНШИХ (select), зөвхөн public.is_admin() үнэн
-- буюу контент удирдах эрхтэй хэрэглэгчид. Бичих, засах, устгах эрх
-- нэмэгдэхгүй. Суралцагчийн өөрийн эрх (…_select_own) хэвээрээ.
--
-- ⚠️ Энэ нь админ бүх суралцагчийн дүнг харна гэсэн үг. Хэрэв танай
-- байгууллагад энэ хүлээн зөвшөөрөгдөхгүй бол энэ засварыг бүү ажиллуул —
-- оронд нь админы хуудсууд хоосон хэвээр үлдэнэ.
--
-- Дахин ажиллуулахад аюулгүй.

do $$
declare
  t text;
  learner_tables text[] := array[
    'user_lesson_progress',
    'user_vocabulary_progress',
    'user_quiz_attempts',
    'user_test_attempts',
    'user_activity_sessions'
  ];
begin
  foreach t in array learner_tables loop
    -- Хүснэгт байхгүй бол алгасна (миграц дутуу орчинд ч ажиллана).
    if not exists (
      select 1 from information_schema.tables
       where table_schema = 'public' and table_name = t
    ) then
      raise notice 'Алгаслаа — % хүснэгт алга', t;
      continue;
    end if;

    execute format(
      'drop policy if exists %I on public.%I',
      t || '_admin_select', t
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_admin())',
      t || '_admin_select', t
    );

    raise notice 'Админы унших бодлого нэмэгдлээ: %', t;
  end loop;
end $$;
