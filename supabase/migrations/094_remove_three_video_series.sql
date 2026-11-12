-- 094: «Дуу-Бичлэг» хэсгээс 3 цувралыг устгана:
--   kxcc       — Хөгжилтэй Чүйчүй        (9 бичлэг)
--   chengyu    — Хэлц үгийн үлгэрүүд      (2 бичлэг)
--   live-talk  — Амьд яриа               (2 бичлэг)
-- Үлдэх нь: quanzhi-fashi — Бүх мэргэжлийн шидтэн.
--
-- Цувралыг устгахад бичлэгүүд, хадмал, үзсэн ахиц нь хамт устна (cascade).
-- Хэрэглэгчдийн эдгээр бичлэгээс хадгалсан ҮГС устахгүй — зөвхөн «аль бичлэгээс»
-- гэсэн тэмдэглэл нь арилна. БУЦААХ БОЛОМЖГҮЙ.

begin;

delete from public.video_series
where id in ('kxcc', 'chengyu', 'live-talk');

commit;

-- Шалгах: зөвхөн quanzhi-fashi үлдсэн байх ёстой.
select s.id, s.title_mn, count(v.id) as videos
from public.video_series s
left join public.videos v on v.series_id = s.id
group by s.id, s.title_mn;
