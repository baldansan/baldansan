-- 097: «Алдааны мэдээлэл» дэх туршилтын хогийг устгана.
-- Эдгээрийг Claude аппыг туршихдаа өөрөө үүсгэсэн («[test-shot] Claude шалгалт — устгаж болно»).
-- Зөвхөн тэмдэглэл нь яг '[test-shot]'-оор эхэлсэн мөрүүд устана; жинхэнэ хэрэглэгчийн мэдээлэлд хүрэхгүй.

-- 1) Эхлээд хэд байгааг харна (устгахгүй):
select count(*) as ustgah_mor from public.feedback where note like '[test-shot]%';

-- 2) Устгана:
delete from public.feedback where note like '[test-shot]%';
