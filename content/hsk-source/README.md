# Эх сурвалжийн сан — HSK номын хичээл бүрийн бүх агуулга

`hsk3/hsk3-lNN.json` — `types/hsk-source-lesson.ts` (`HskSourceLesson`) бүтэцтэй, ном дээр байгаа
хэлбэрээр (хятад/пиньинь/англи): сурах бичиг (热身, 课文 + 生词, 注释 + 练一练, 练习, 汉字, 运用, 俗语, 文化),
багшийн ном (教学目标, 教学步骤, 注意, асуулт-хариулт, 本课小结), дасгалын ном (听力/阅读/书写/复习 бүх асуулт,
сонсголын бичвэр, хариулт эх сурвалжтайгаа). Монгол орчуулга, заах тайлбар ОРООГҮЙ — зориудаар.
`unclear[]` — номын өөрийн зөрүү, уншигдахгүй зүйл (таагаагүй).

Supabase: `hsk_source_lessons` (migration 062) ← `supabase/content/006_hsk3_source_lessons.sql`.
Админ: `/admin/source`.

Дахин үүсгэх: `docs/hsk-source/lesson-build/prep.py N` → агент `SOURCE-TASK.md` → `validate_source.py N`.
