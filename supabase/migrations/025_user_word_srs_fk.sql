-- Ensure PostgREST can resolve user_word_srs → hsk_words relationship

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_word_srs'
  ) then
    create table public.user_word_srs (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      word_id bigint not null,
      reps int not null default 0,
      ease double precision not null default 2.5,
      interval_days double precision not null default 0,
      due_at timestamptz not null default now(),
      last_rating text check (last_rating in ('forgot', 'hard', 'known')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id, word_id)
    );
  end if;
end $$;

alter table public.user_word_srs
  drop constraint if exists user_word_srs_word_id_fkey;

alter table public.user_word_srs
  add constraint user_word_srs_word_id_fkey
  foreign key (word_id) references public.hsk_words (id) on delete cascade;

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
