-- 084: mock_tests.is_active — илүү HSK1/2 тестийг жагсаалтаас нуух (өгөгдөл хадгалагдана).
-- Supabase SQL Editor дээр ажиллуулна. Дахин ажиллуулахад аюулгүй.

alter table public.mock_tests
  add column if not exists is_active boolean not null default true;

comment on column public.mock_tests.is_active is
  'false бол суралцагчийн жагсаалт/өнөөдрийн сонсголд гарахгүй; админ /admin/mock-tests дээр асааж унтраана.';

create index if not exists mock_tests_level_active_idx
  on public.mock_tests (hsk_level, is_active);

-- HSK 1, 2: түвшин бүрт id дарааллаар эхний 10-ыг л идэвхтэй үлдээнэ
-- (2009–2011 оны тестүүд). Бусдыг нуух; хэрэгтэй бол админаас дахин асаана.
with ranked as (
  select id, row_number() over (partition by hsk_level order by id) as rn
  from public.mock_tests
  where hsk_level in (1, 2)
)
update public.mock_tests t
set is_active = (r.rn <= 10)
from ranked r
where r.id = t.id;

-- Аудиогүй H21440 (зөвхөн унших) бас нуух.
update public.mock_tests set is_active = false where id = 'H21440';
