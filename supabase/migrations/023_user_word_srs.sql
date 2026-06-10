-- HSK word SRS (Leitner / SM-2-lite) tied to hsk_words reference table

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

create index if not exists user_word_srs_user_word_idx
  on public.user_word_srs (user_id, word_id);

drop trigger if exists user_word_srs_updated_at on public.user_word_srs;
create trigger user_word_srs_updated_at
  before update on public.user_word_srs
  for each row
  execute function public.update_updated_at_column();

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
