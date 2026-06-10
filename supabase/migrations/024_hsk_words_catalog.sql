-- HSK vocabulary catalog (public read) — reload via scripts/load_hsk_words.mjs
-- Replaces prior hsk_words shape; CASCADE drops dependent rows (e.g. user_word_srs).

drop table if exists public.hsk_words cascade;

create table public.hsk_words (
  id             bigserial primary key,
  simplified     text not null,
  traditional    text,
  pinyin         text,
  pos            text[],
  radical        text,
  frequency      int,
  hsk_level      text not null,
  hsk_old        int[],
  meaning_en     text,
  meaning_mn     text,
  example_zh     text,
  example_pinyin text,
  example_mn     text
);

create index if not exists idx_hsk_words_level on public.hsk_words (hsk_level);
create index if not exists idx_hsk_words_simplified on public.hsk_words (simplified);
create index if not exists idx_hsk_words_freq on public.hsk_words (frequency);

alter table public.hsk_words enable row level security;

drop policy if exists "hsk_words_public_read" on public.hsk_words;
create policy "hsk_words_public_read"
  on public.hsk_words
  for select
  using (true);

-- Restore SRS FK after catalog reload (word ids will change — users re-rate words)
create table if not exists public.user_word_srs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id bigint not null references public.hsk_words (id) on delete cascade,
  reps int not null default 0,
  ease double precision not null default 2.5,
  interval_days double precision not null default 0,
  due_at timestamptz not null default now(),
  last_rating text check (last_rating in ('forgot', 'hard', 'known')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word_id)
);

create index if not exists user_word_srs_user_due_idx
  on public.user_word_srs (user_id, due_at);

alter table public.user_word_srs enable row level security;

drop policy if exists "user_word_srs_select_own" on public.user_word_srs;
create policy "user_word_srs_select_own"
  on public.user_word_srs for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_word_srs_insert_own" on public.user_word_srs;
create policy "user_word_srs_insert_own"
  on public.user_word_srs for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_word_srs_update_own" on public.user_word_srs;
create policy "user_word_srs_update_own"
  on public.user_word_srs for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_word_srs_delete_own" on public.user_word_srs;
create policy "user_word_srs_delete_own"
  on public.user_word_srs for delete to authenticated
  using (auth.uid() = user_id);
