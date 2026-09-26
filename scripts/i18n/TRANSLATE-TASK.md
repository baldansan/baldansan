# Task: translate app UI strings Mongolian → Simplified Chinese

Input: `/home/claude/repo/scripts/i18n/out/batches/{BATCH}.json` — array of `{mn, ctx}`; `mn` = exact UI string in the code (Mongolian Cyrillic, may contain numbers, emoji, arrows, Latin words, `{0}` placeholders), `ctx` = source file path (tells you the screen: admin dashboard, lesson player, games, review/SRS, mock test, teacher dashboard, settings…).

Output: `/home/claude/repo/scripts/i18n/out/batches/{BATCH}.zh.json` — array of `{mn, zh}` with EXACTLY the same `mn` strings (byte-identical, same order, none dropped).

The app: 《一起学中文》"Бөөндөө Сурцгаая" — a Chinese-learning app for Mongolians; the Chinese UI is for Chinese teachers and Chinese-reading students. Translate as a native Chinese product UI (简体中文), the way 多邻国 / HSK apps word things.

Rules:
1. Concise UI Chinese. Buttons ≤ 4–6 chars where natural (Хадгалах → 保存; Буцах → 返回; Үргэлжлүүлэх → 继续). Titles/sentences natural, no literal word-by-word.
2. Keep unchanged: `{0}`,`{1}` placeholders (same count, sensible position), emoji, arrows (→ ←), `·`, `—`, numbers, units, brand names (Бөөндөө Сурцгаая → keep as «Бөөндөө Сурцгаая»; "Buunduu Surtsgaay" keep), product words HSK, SRS, PWA, Supabase, Vercel, ID, URL, JSON, CSV, zip, Chrome, YouTube, Latin code identifiers, Chinese/Korean characters already present.
3. Terminology (use consistently): хичээл=课程/课 (context: a lesson = 课, the course = 课程), үг/шинэ үг=生词, ханз=汉字, пиньинь=拼音, дуудлага=发音, хөг/аялга=声调, дүрэм=语法, текст/курсын текст=课文, дасгал=练习, сорил/тест=测验, загвар шалгалт=模拟考试, давтах/давталт=复习, цээжлэх=记忆/背, бичлэг=视频, тоглоом=游戏, суралцагч=学习者/学生, багш=老师, сургалтын төв=培训中心, анги=班级, даалгавар=作业, ахиц=进度, оноо=分数, амжилт=成就, шагнал=奖励, тэмдэглэл=笔记, тохиргоо=设置, профайл=我的/个人资料, нэвтрэх=登录, бүртгүүлэх=注册, гарах=退出登录, хадгалах=保存, устгах=删除, засах=编辑, нийтлэх=发布, ноорог=草稿, импорт=导入, экспорт=导出, удирдлагын хэсэг/админ=管理后台, тайлан=报告, үйлдлийн бүртгэл=操作日志, Солонгос=韩语, хангыль=韩文字母, эх сурвалж=原书内容/教材原文, багшийн ном=教师用书, дасгалын ном=练习册, сурах бичиг=课本.
4. Error/status messages: natural Chinese ("Хичээл олдсонгүй." → "未找到课程。"; "Ачаалж байна…" → "加载中…"). Keep trailing punctuation type (。！？…) consistent with source.
5. If a string is not really Mongolian UI (e.g., pure Korean/Chinese/Latin with a stray Cyrillic letter), copy it unchanged into `zh`.
6. Do not add pinyin, notes, or explanations. Output valid JSON only.

Work through the whole batch (500+ items is fine — write the output file in 2–3 chunks with Write then Edit/append if needed, and verify at the end with `python3 -c` that the output length equals the input length and every `mn` matches). Report: count translated, any strings you left unchanged and why.
