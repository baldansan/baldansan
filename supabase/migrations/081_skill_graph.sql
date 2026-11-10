-- 081: Чадварын сүлжээ (Skill Graph) — Үе 1 + 2
-- skills: нэг чадвар = нэг зангилаа (дүрмийн цэг, шалгалтын ур чадвар, түвшний үгийн сан)
-- skill_edges: хичээл/ном/дасгал ↔ чадварын холбоос
-- user_skill_mastery: хэрэглэгч бүрийн чадварын эзэмшил (нотолгооноос тооцно)
-- Дата: hsk30-durem.json (дүрэм), skill-tag-labels (sk.*), voc.hskN — scripts/skills/seed-skills.mts

create table if not exists public.skills (
  id text primary key,                       -- gr.hsk4-p1 | sk.listening.dialogue | voc.hsk4
  kind text not null check (kind in ('grammar', 'skill', 'vocab_level')),
  hsk_level int,                             -- 1..6 (7 = HSK7-9); sk.* нь null (бүх түвшин)
  name_mn text not null,
  name_zh text,
  desc_mn text,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists skills_level_idx on public.skills (hsk_level, kind, sort);

create table if not exists public.skill_edges (
  id bigserial primary key,
  skill_id text not null references public.skills (id) on delete cascade,
  rel text not null check (rel in ('teaches', 'explains', 'tests', 'requires')),
  ref_type text not null,                    -- lesson | hsk30_point | book_page | mock_question | skill
  ref_id text not null,
  locator text,                              -- href / хуудас / тайлбар
  unique (skill_id, rel, ref_type, ref_id)
);
create index if not exists skill_edges_ref_idx on public.skill_edges (ref_type, ref_id);

create table if not exists public.user_skill_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id text not null references public.skills (id) on delete cascade,
  mastery numeric(4,3) not null default 0,   -- 0..1
  evidence_n int not null default 0,
  correct_n int not null default 0,
  last_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

alter table public.skills enable row level security;
alter table public.skill_edges enable row level security;
alter table public.user_skill_mastery enable row level security;

drop policy if exists skills_read_all on public.skills;
create policy skills_read_all on public.skills for select to anon, authenticated using (true);
drop policy if exists skill_edges_read_all on public.skill_edges;
create policy skill_edges_read_all on public.skill_edges for select to anon, authenticated using (true);
drop policy if exists skills_admin_write on public.skills;
create policy skills_admin_write on public.skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists skill_edges_admin_write on public.skill_edges;
create policy skill_edges_admin_write on public.skill_edges for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists usm_own on public.user_skill_mastery;
create policy usm_own on public.user_skill_mastery for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists usm_admin_read on public.user_skill_mastery;
create policy usm_admin_read on public.user_skill_mastery for select to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Эзэмшил тооцох: нотолгоо бүр = нэг оролдлого. mastery = (зөв + 1) / (нийт + 2) (Лапласын prior 0.5),
-- сүүлийн 90 хоногийн оролдлого 2 дахин жинтэй.
--  • grammar  gr.<pointId>   ← question_attempts lesson_id='hsk30-durem', question_id like '<pointId>-%'
--  • skill    sk.*           ← question_attempts stage='mock_exam', question_id='mock:<uuid>' → mock_test_questions.tags
--  • vocab    voc.hskN       ← user_word_srs ↔ hsk_words.hsk_level: сурсан (reps>0) үгийн эзлэх хувь × сүүлийн үнэлгээ
-- -----------------------------------------------------------------------------
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
