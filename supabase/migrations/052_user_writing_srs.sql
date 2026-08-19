-- 052: Бичих SRS — үг/ханз бүрд «гараар бичиж чадах» тусдаа давталтын төлөв.
-- Уншиж таних user_word_srs-ээс тусдаа хуваарь. Түлхүүр = simplified текст
-- (хичээлийн ханзууд hsk_words id-гүй байж болно), word_id байвал давхар хадгална.
-- Safe to re-run: IF NOT EXISTS + drop policy if exists.

create table if not exists public.user_writing_srs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  word_key      text not null,            -- simplified үг/ханз
  word_id       int,                      -- hsk_words.id (байвал)
  pinyin        text,
  meaning_mn    text,
  reps          int  not null default 0,
  ease          real not null default 2.5,
  interval_days real not null default 0,
  due_at        timestamptz not null default now(),
  last_rating   text,                     -- 'forgot' | 'hard' | 'known'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint user_writing_srs_rating_check
    check (last_rating is null or last_rating in ('forgot', 'hard', 'known')),
  constraint user_writing_srs_user_word_unique unique (user_id, word_key)
);

comment on table public.user_writing_srs is
  'Writing-recall SRS: per-user schedule for writing each hanzi word from memory (separate from reading SRS).';

create index if not exists user_writing_srs_due_idx
  on public.user_writing_srs (user_id, due_at);

drop trigger if exists user_writing_srs_updated_at on public.user_writing_srs;
create trigger user_writing_srs_updated_at
  before update on public.user_writing_srs
  for each row
  execute function public.update_updated_at_column();

alter table public.user_writing_srs enable row level security;

drop policy if exists "uws_own_select" on public.user_writing_srs;
create policy "uws_own_select"
  on public.user_writing_srs
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "uws_own_insert" on public.user_writing_srs;
create policy "uws_own_insert"
  on public.user_writing_srs
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "uws_own_update" on public.user_writing_srs;
create policy "uws_own_update"
  on public.user_writing_srs
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
