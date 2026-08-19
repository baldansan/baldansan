-- «Миний алдаанууд» (алдааны дэвтэр): хэрэглэгч ӨӨРИЙН question_attempts
-- мөрүүдийг унших эрх. Өмнө нь зөвхөн admin select политик байсан.
-- Safe to re-run.

drop policy if exists "question_attempts_select_own" on public.question_attempts;
create policy "question_attempts_select_own"
  on public.question_attempts
  for select
  to authenticated
  using (user_id = auth.uid());
