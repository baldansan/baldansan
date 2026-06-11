-- Link bichleg saved words to HSK catalog + SRS backfill

alter table public.user_saved_words
  add column if not exists hsk_word_id bigint references public.hsk_words (id) on delete set null;

create index if not exists idx_user_saved_words_hsk_word
  on public.user_saved_words (user_id, hsk_word_id)
  where hsk_word_id is not null;

-- Allow updating hsk_word_id on existing rows (duplicate save / backfill)
drop policy if exists "usw_own_update" on public.user_saved_words;
create policy "usw_own_update"
  on public.user_saved_words for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill catalog match by exact simplified = zh
update public.user_saved_words usw
set hsk_word_id = hw.id
from public.hsk_words hw
where usw.hsk_word_id is null
  and usw.zh = hw.simplified;

-- Create SRS rows for linked saves (skip existing)
insert into public.user_word_srs (user_id, word_id, reps, ease, interval_days, due_at)
select distinct usw.user_id, usw.hsk_word_id, 0, 2.5, 0, now()
from public.user_saved_words usw
where usw.hsk_word_id is not null
on conflict (user_id, word_id) do nothing;
