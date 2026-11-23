-- Толь бичиг v2 — бүтэн лексикон (CC-CEDICT ~125k бичилт) + монгол орчуулга.
-- Эх сурвалж: CC-CEDICT (MDBG), лиценз CC BY-SA 4.0 — аппад заавал эх сурвалж зааж,
-- ижил лицензээр (CC BY-SA 4.0) түгээх. Орчуулсан монгол утга нь derivative тул мөн адил.
-- hsk_words-д ХҮРЭХГҮЙ (апп түүнд тулгуурласан). HSK үгийн баялаг бичилт нь dictionary_senses-д хэвээр.

create table if not exists public.dictionary_lexicon (
  id            bigserial primary key,
  simplified    text not null,
  traditional   text,
  pinyin        text not null,          -- ая тэмдэгтэй: kàn
  pinyin_plain  text not null,          -- ая-гүй, зайгүй: kan  (хайлтад)
  pinyin_num    text,                   -- kan4  (эх)
  english       text not null,          -- CC-CEDICT-ийн утгууд ' / '-ээр
  kind          text not null default 'word'
                check (kind in ('word', 'surname', 'variant', 'abbr', 'xref')),
  meaning_mn    text,                   -- машин/AI орчуулга (багш хянахаас өмнө draft)
  mn_status     text not null default 'none'
                check (mn_status in ('none', 'draft', 'reviewed', 'approved')),
  hsk_word_id   bigint references public.hsk_words (id) on delete set null,
  source        text not null default 'cc-cedict',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (simplified, pinyin_num, english)
);

create index if not exists idx_lexicon_simplified on public.dictionary_lexicon (simplified);
create index if not exists idx_lexicon_pinyin_plain on public.dictionary_lexicon (pinyin_plain);
create index if not exists idx_lexicon_mn_status on public.dictionary_lexicon (mn_status);
create index if not exists idx_lexicon_hsk on public.dictionary_lexicon (hsk_word_id) where hsk_word_id is not null;

drop trigger if exists trg_lexicon_touch on public.dictionary_lexicon;
create trigger trg_lexicon_touch before update on public.dictionary_lexicon
  for each row execute function public.dictionary_touch_updated_at();

alter table public.dictionary_lexicon enable row level security;

drop policy if exists dictionary_lexicon_public_read on public.dictionary_lexicon;
create policy dictionary_lexicon_public_read on public.dictionary_lexicon for select using (true);

drop policy if exists dictionary_lexicon_admin_write on public.dictionary_lexicon;
create policy dictionary_lexicon_admin_write on public.dictionary_lexicon
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Орчуулгын ахицын тоо (admin)
create or replace function public.dictionary_lexicon_counts()
returns table (total bigint, translated bigint, reviewed bigint, approved bigint)
language sql stable security definer set search_path = public as $$
  select count(*),
         count(*) filter (where mn_status in ('draft','reviewed','approved')),
         count(*) filter (where mn_status = 'reviewed'),
         count(*) filter (where mn_status = 'approved')
  from public.dictionary_lexicon;
$$;
grant execute on function public.dictionary_lexicon_counts() to authenticated;

comment on table public.dictionary_lexicon is
  'CC-CEDICT бүтэн лексикон (CC BY-SA 4.0) + монгол орчуулга. Хайлтын нөөц сан; HSK үгийн баялаг бичилт dictionary_senses-д.';

-- Орчуулга оруулах: зөвхөн none/draft мөрийг шинэчилнэ (хянасан/батлагдсан бүү дар).
-- p_rows: [{"simplified":"看","pinyin_num":"kan4","english":"…","meaning_mn":"…"}]
create or replace function public.dictionary_lexicon_apply_mn(p_rows jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.is_admin() and current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'admin only';
  end if;
  update public.dictionary_lexicon l
     set meaning_mn = r.meaning_mn, mn_status = 'draft'
    from jsonb_to_recordset(p_rows) as r(simplified text, pinyin_num text, english text, meaning_mn text)
   where l.simplified = r.simplified and l.pinyin_num is not distinct from r.pinyin_num
     and l.english = r.english and l.mn_status in ('none', 'draft')
     and nullif(trim(r.meaning_mn), '') is not null;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.dictionary_lexicon_apply_mn(jsonb) to authenticated, service_role;
