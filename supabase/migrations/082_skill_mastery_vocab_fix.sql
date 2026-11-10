-- 082: үгийн сангийн эзэмшил — сураагүй үг 0.3 гэж тоологдож байсан алдааг засав
create or replace function public.compute_user_skill_mastery(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null or p_user <> auth.uid() and not public.is_admin() then
    raise exception 'not allowed';
  end if;

  -- 1) Дүрмийн цэгүүд
  insert into public.user_skill_mastery (user_id, skill_id, mastery, evidence_n, correct_n, last_at, updated_at)
  select p_user, s.id,
         least(1, (sum(case when qa.is_correct then w else 0 end) + 1.0) / (sum(w) + 2.0)),
         count(*), count(*) filter (where qa.is_correct), max(qa.created_at), now()
  from public.skills s
  join lateral (
    select qa.*, case when qa.created_at > now() - interval '90 days' then 2.0 else 1.0 end as w
    from public.question_attempts qa
    where qa.user_id = p_user
      and qa.lesson_id = 'hsk30-durem'
      and qa.question_id like substr(s.id, 4) || '-%'
  ) qa on true
  where s.kind = 'grammar'
  group by s.id
  on conflict (user_id, skill_id) do update
    set mastery = excluded.mastery, evidence_n = excluded.evidence_n, correct_n = excluded.correct_n,
        last_at = excluded.last_at, updated_at = now();

  -- 2) Шалгалтын ур чадвар (真题 tags)
  insert into public.user_skill_mastery (user_id, skill_id, mastery, evidence_n, correct_n, last_at, updated_at)
  select p_user, s.id,
         least(1, (sum(case when qa.is_correct then w else 0 end) + 1.0) / (sum(w) + 2.0)),
         count(*), count(*) filter (where qa.is_correct), max(qa.created_at), now()
  from public.skills s
  join lateral (
    select qa.is_correct, qa.created_at,
           case when qa.created_at > now() - interval '90 days' then 2.0 else 1.0 end as w
    from public.question_attempts qa
    join public.mock_test_questions mq on 'mock:' || mq.id::text = qa.question_id
    where qa.user_id = p_user and qa.stage = 'mock_exam'
      and mq.tags @> array[s.id]::text[]
  ) qa on true
  where s.kind = 'skill'
  group by s.id
  on conflict (user_id, skill_id) do update
    set mastery = excluded.mastery, evidence_n = excluded.evidence_n, correct_n = excluded.correct_n,
        last_at = excluded.last_at, updated_at = now();

  -- 3) Түвшний үгийн сан: сурсан үг / түвшний нийт үг (сүүлийн үнэлгээ known → 1, hard → 0.6, forgot → 0.2)
  insert into public.user_skill_mastery (user_id, skill_id, mastery, evidence_n, correct_n, last_at, updated_at)
  select p_user, s.id,
         least(1, coalesce(sum(case when u.word_id is null then 0 when u.last_rating = 'known' then 1.0 when u.last_rating = 'hard' then 0.6 when u.last_rating = 'forgot' then 0.2 else 0.3 end), 0)
                  / greatest(1, (select count(*) from public.hsk_words hw where hw.hsk_level = s.hsk_level::text and hw.is_function_word = false))),
         count(u.word_id), count(u.word_id) filter (where u.last_rating = 'known'), max(u.updated_at), now()
  from public.skills s
  left join public.hsk_words hw on hw.hsk_level = s.hsk_level::text
  left join public.user_word_srs u on u.word_id = hw.id and u.user_id = p_user and u.reps > 0
  where s.kind = 'vocab_level'
  group by s.id, s.hsk_level
  on conflict (user_id, skill_id) do update
    set mastery = excluded.mastery, evidence_n = excluded.evidence_n, correct_n = excluded.correct_n,
        last_at = excluded.last_at, updated_at = now();
end;
$$;

grant execute on function public.compute_user_skill_mastery(uuid) to authenticated;
