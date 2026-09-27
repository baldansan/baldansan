# Task: «Хүүхдийн 7 хоног» (儿童七天) — a first-week path for a 6-year-old beginner (Тогтуун, class 1A)

Repo /home/claude/repo (Next.js 16). Read first: `lib/kids/client.ts` (`getKidModeProfile`, kid mode key `buunduu-kid-mode-v1`), `components/kids/kid-mode-bar.tsx`, `components/mobile/home-app-view.tsx` (compact card list at top; the kid path card goes first when kid mode is on), `lib/pronunciation/pinyin-course.ts` (unit ids: `dan-egshig`, `b-p-m-f`, `d-t-n-l`, …; progress key `buunduu-pinyin-course-v1`), `lib/library/data.ts` (`getStory`, `getMengxue`), `components/library/story-reader.tsx` (progress key `buunduu-story-progress-v1`), `lib/writing/local-store.ts` + `lib/writing/store.ts` (create a list, progress), `lib/games/levels.ts` (level progress store), `lib/pronunciation/daily-tone.ts`, `components/tts/speaker-button.tsx`, `app/family/family-client.tsx` (parent dashboard: add the child's 7-day progress there). UI: `tr(locale, "...")` + ZH_UI block `// --- Хүүхдийн 7 хоног ---` (re-read translate.ts before editing); content in `translate="no"`. Mongolian plain, no Russian loanwords. Do NOT commit. `npx tsc --noEmit` + `NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build` must pass.

## Plan data — `lib/kids/path.ts` (static)
7 days × 4–5 tasks (10–15 min/day). Task = `{ id, kind: "pinyin"|"book"|"sanzijing"|"write"|"game"|"song"|"daily", emoji, title, titleZh, href, minutes, autoDone?: (ctx) => boolean }`.
- **Day 1** «Сайн уу!» — 🔤 pinyin `dan-egshig` step 1–2 (`/pronunciation/basics/dan-egshig`), 📖 book `gsb-zh-0008` 你在做什么？ (`/library/books/gsb-zh-0008`), ✍️ write 一 二 三 (writing list, see below), 🎮 `/games/match?level=1`.
- **Day 2** — 🔤 `dan-egshig` drill+test, 📖 `gsb-zh-0302` 火, 📜 三字经 lines 1–3, ✍️ 十 人 口.
- **Day 3** — 🔤 `b-p-m-f` 1–2, 📖 `gsb-zh-0156` 很饿的鳄鱼, 📜 lines 4–6, ✍️ 大 小.
- **Day 4** — 🔤 `b-p-m-f` drill+test, 📖 `gsb-zh-0087` 我喜欢看书, 📜 lines 7–9, 🎮 `/games/arrange?level=1`.
- **Day 5** — 🔤 `d-t-n-l` 1–2, 📖 `gsb-zh-0327` 数数动物, 📜 lines 10–12, ✍️ 上 下.
- **Day 6** — 🔤 `d-t-n-l` drill+test, 📖 re-read favourite (link `/library/books?level=1&audio=1`), 📜 lines 13–16, ✍️ 日 月.
- **Day 7** «Баяр!» — 🔥 `/pronunciation/daily`, 📜 lines 17–20 + «бүгдийг уншъя» (lines 1–20), ✍️ 山 水, 🎮 `/games/match?level=2`, 🏅 medal screen.
Writing: on first open of the path create ONE local writing list «Хүүхдийн 14 ханз» (一 二 三 十 人 口 大 小 上 下 日 月 山 水; pinyin+meaning via `/api/writing/lookup`; reps trace 1, memory 2) and store its id in `localStorage["buunduu-kid-path-v1"].writingListId`; day tasks link to `/writing/<id>/practice?start=<ch>`.
三字经 task page: `app/kids/path/sanzijing/[day]/page.tsx` — the day's 3–4 lines huge (text-3xl), pinyin under each, `SpeakerButton` per line (TTS), phrase chips (the `phrases` field: 人之初 · 性本善 …), «Дагаж хэл» → `PronunciationPractice mode="pitch"` for one line; «Дууслаа ✓» button marks the task. Data from `getMengxue()` (server) → pass lines to a client component. Line ids `sanzijing-001…020`.

## Progress — `localStorage["buunduu-kid-path-v1"]` keyed by kid id (`getKidModeChildId()` or `"guest"`): `{ [kidId]: { startedAt, days: { [day]: { tasks: { [taskId]: true }, stickerAt? } }, writingListId } }`. `autoDone` checks: pinyin task → unit progress has `listened.length ≥ N` (steps 1–2) or `testScore` (drill+test); book → story progress page ≥ page_count (or the reader's "finished" marker — check what it stores; if only page number, treat ≥ last page as done); write → writing progress for those chars complete; game → level 1 stars ≥ 1; daily → history has today. Also every task has a manual «✓ Дууслаа» on the day screen (kids tap it; parents can untick). Day complete = all tasks done → sticker (emoji per day: 🐼 🐯 🐰 🐘 🦁 🐬 🏅) + confetti-ish animation.

## Pages
- `app/kids/path/page.tsx` + `components/kids/kid-path-client.tsx`: header «🧒 <name>-ийн 7 хоног» (name from kid profile; guest → «Миний 7 хоног»), sticker board (7 slots), day cards 1–7 (locked after the current day? No — all open, but «Өнөөдөр» highlighted = first incomplete day), each card shows tasks with big emoji rows (min 56 px tall), done ✓ green; «▶ Эхлэх» opens the first undone task's href. Kid-friendly: huge text, few words, Chinese-first UI still applies but the Mongolian toggle exists.
- Day screen is the same page with the day expanded (`?day=3`).
- Entry: home (`home-app-view.tsx`) — when kid mode is on OR the path has started, show a top card «🧒 7 хоног · Өдөр 3 · 2/4 ✓» → `/kids/path`. Also a card on `/family` for each child: «7 хоног: өдөр 3, 9/30 даалгавар» reading the same localStorage (same device) — note it's device-local for now.
- «🏅 Медаль» screen on day 7 complete: «Тогтуун 7 хоногийг дууслаа!» + list of what was learned (6 эгшиг, 12 гийгүүлэгч, 5 ном, 三字经 20 мөр, 14 ханз) + «Дараагийн 7 хоног удахгүй».

## ZH_UI: «7 хоног»: "七天", «Өнөөдөр»: "今天", «Дууслаа»: "完成", «Эхлэх»: exists, «Наалт»: "贴纸", «Медаль»: "奖章", «Хүүхдийн 14 ханз»: "儿童 14 个字", «Дараагийн 7 хоног удахгүй»: "下一个七天即将推出", + task titles.

## Verify
tsc + build; local server (dummy env; kill stale by PID from `ps aux | grep next-server`, never `pkill -f`): `/kids/path`, `/kids/path?day=2`, `/kids/path/sanzijing/2` 200; Playwright (400×860) screenshots: path overview, day 2 expanded, sanzijing page, medal screen (simulate via localStorage) → `/tmp/shots/kidpath-*.png`. Report files changed and anything skipped.
