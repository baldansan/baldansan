-- Бүртгэл устгах (Play / App Store шаардлага) — service role key Vercel дээр
-- тохируулаагүй үед ч ажиллах fallback. Нэвтэрсэн хэрэглэгч ЗӨВХӨН өөрийн
-- бүртгэлийг устгана (auth.uid()). /api/account/delete энэ функцийг
-- SUPABASE_SERVICE_ROLE_KEY байхгүй үед дуудна.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  t text;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- user_id багантай хүснэгтүүд (байхгүй бол алгасна)
  foreach t in array array[
    'user_lesson_progress','user_vocabulary_progress','user_quiz_attempts',
    'user_daily_activity','user_daily_goals','user_streaks','user_achievements',
    'user_notifications','user_study_reminders','user_saved_words','user_word_srs',
    'user_video_progress','user_mock_attempts','user_test_attempts','question_attempts',
    'reviews','feedback','student_profiles','teacher_profiles','organization_members',
    'push_subscriptions'
  ] loop
    if to_regclass('public.' || t) is not null
       and exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = t and column_name = 'user_id') then
      execute format('delete from public.%I where user_id = $1', t) using uid;
    end if;
  end loop;

  -- student_user_id багантай хүснэгтүүд
  foreach t in array array['classroom_students','assignment_results'] loop
    if to_regclass('public.' || t) is not null
       and exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = t and column_name = 'student_user_id') then
      execute format('delete from public.%I where student_user_id = $1', t) using uid;
    end if;
  end loop;

  -- Үлдсэн FK-тэй мөрүүд cascade-аар устна.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
