-- Mark grammatical / functional words so they are excluded from SRS and memorize batches.

alter table public.hsk_words
  add column if not exists is_function_word boolean not null default false;

comment on column public.hsk_words.is_function_word is
  'Grammatical particle or function word — excluded from SRS and memorize; still in catalog for lookup.';

-- Exact simplified match only (e.g. 个 not 一个).
update public.hsk_words
set is_function_word = true
where simplified in (
  '的', '地', '得', '了', '着', '过', '吗', '呢', '吧', '啊', '呀', '哇', '啦', '嘛',
  '哦', '喔', '噢', '呗', '咯', '哟', '嘞', '哎', '唉', '嗯', '哼', '嘿', '喂', '呵',
  '嗨', '哈', '呜', '咦', '哒', '个', '们'
);

create index if not exists idx_hsk_words_srs_eligible
  on public.hsk_words (hsk_level, frequency)
  where is_function_word = false;
