-- Tone-insensitive pinyin sort key for HSK catalog (memorize batches, ORDER BY + range).

create or replace function public.hsk_pinyin_sort_key(p text)
returns text
language sql
immutable
as $$
  select lower(
    translate(
      coalesce(p, ''),
      'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ',
      'aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu'
    )
  );
$$;

alter table public.hsk_words
  add column if not exists pinyin_sort_key text
  generated always as (public.hsk_pinyin_sort_key(pinyin)) stored;

create index if not exists idx_hsk_words_level_pinyin_sort
  on public.hsk_words (hsk_level, pinyin_sort_key, simplified);
