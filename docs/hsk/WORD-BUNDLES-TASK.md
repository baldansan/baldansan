# Task: character families («Ханзны гэр бүл» 字族) + word-formation line («Утга задаргаа» 构词) in the memorize flow

Repo /home/claude/repo (Next.js 16 app router — read node_modules/next/dist/docs when unsure). UI text: Mongolian literals via `tr(locale, "...")` + Chinese in `ZH_UI` (`lib/i18n/translate.ts`, add near the top); content in `translate="no"`. Do NOT git commit. `npx tsc --noEmit` + `npm run build` (with `NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`) must pass.

## Data (already built, do not regenerate)
- `public/data/hsk_char_gloss.json` — `{ "<char>": { p: "pinyin", mn: "short Mongolian morpheme meaning" } }` for all 3,088 characters of the HSK 3.0 word list (141 KB).
- `public/data/hsk_char_families.json` — `{ "<level>": [ { char, p, mn, words: string[] (words of that level containing the char, ≥3, short words first), known: string[] (≤4 words from lower levels with the same char) } ] }`, levels "1".."6","7-9", families sorted by size desc. Some families are big (不 at 7-9 has 114 words) → chunk into parts of ≤12 words.
- `public/data/hsk_word_themes.json` — existing themed groups (already used by `lib/hsk/word-themes.ts` → `lib/hsk/memorize.ts` → `app/api/review/memorize-batches|memorize-batch` → `components/review/hanzi-memorize-client.tsx`).

## 1. Families as selectable groups (server side)
- `lib/hsk/word-themes.ts`: add `getCharFamilyGroups(level)` that reads `hsk_char_families.json` (cache like themes) and returns `WordThemeGroup[]` with `id: "fam-<char>-<part>"` (part from 1), `icon: "🧬"`, `title: "<char> <p> · <mn>"` (+ ` ${part}` when the family has >1 part), `words: chunk` (≤12, keep order), plus optional new fields `kind: "family"`, `char`, `charPinyin`, `charMn`, `known` (only on part 1). Extend `WordThemeGroup` with optional `kind?: "theme" | "family"` and these fields. `getWordThemeGroup(level, id)` must find family groups too (ids starting with `fam-`).
- `lib/hsk/memorize.ts`: `fetchMemorizeThemeSummaries` — also include family groups after the theme groups, with `kind` on `MemorizeThemeGroupSummary` (`kind?: "theme" | "family"`, `char?`, `charMn?`). `fetchMemorizeThemeGroup` works unchanged if `getWordThemeGroup` handles `fam-` ids — verify; pass through `char/charPinyin/charMn/known` in its return so the session header can show them.
- The `memorize-batch` route already accepts `?group=` — nothing to change unless typing requires it.

## 2. Client: tab «Сэдэв» / «🧬 Ханзны гэр бүл» in `components/review/hanzi-memorize-client.tsx`
- The batch chooser (the `bs-mem-wizard` map screen) gets two pill tabs above the map: `tr(locale,"Сэдвээр")` (default) and `🧬 ${tr(locale,"Ханзны гэр бүл")}`; store the choice in `localStorage["buunduu-memorize-tab-v1"]` (try/catch). Filter `batches` by `kind` (missing kind = theme). Keep the pass-card totals computed over theme groups only (families overlap, would double count).
- Family nodes: circle shows the character itself (big, `translate="no"`) instead of the icon; title `"<char> · <mn>"`; count as now. Subtitle under the tab when families are shown: `tr(locale,"Нэг ханз мэдвэл 5–12 үг бэлэн — ханзаар нь бүлэглэсэн")`.
- When a family group is opened (`handleSelectBatch` → session), show above the session (or in the session subtitle) a compact family header: the char big + pinyin + mn, and if `known` non-empty: `tr(locale,"Мэдэх үгс:")` followed by the known words as chips (`translate="no"`). Find where `activeBatch`/subtitle is rendered (`subtitle={`${hskLabel} · ${batchLabel(activeBatch, locale)}`}`) and add a small block there; the group payload from `/api/review/memorize-batch?group=` carries `char/charPinyin/charMn/known` — extend the client's fetch typing.

## 3. Word-formation line («Утга задаргаа») on the study card
- New client component `components/review/word-parts-line.tsx`: props `{ text: string }`. Loads `/data/hsk_char_gloss.json` once (module-level promise cache, fetch on client) and renders, for words of 2–4 Han characters only, a row of chips: each chip = `<b>{char}</b> <span>{mn}</span>` (`translate="no"`), joined by a small "+" separator, e.g. `电 цахилгаан + 话 яриа`. Show nothing for single-char words, non-Han text, or when any char lacks a gloss. Muted style, `text-xs`, wraps.
- Place it in `components/review/word-srs-study-session.tsx` on the flipped card right under the meaning (find the `bs-srs-example-mn` / meaning block; put it just before the example block, inside the card content, so it's visible without opening «Ханзны задаргаа»). Also add it in `components/lesson/word-tap-sheet.tsx` under the meaning if that sheet shows a word's meaning (check the file; skip if it doesn't fit).
- Chinese UI: the line has no label; for zh locale the chips show the char + Mongolian gloss still (glosses are Mongolian only — fine; but hide the whole line when `locale === "zh"`? No — keep it; Chinese learners' UI hides nothing content-wise).

## 4. Strings
Add to `ZH_UI`: "Сэдвээр": "按主题", "Ханзны гэр бүл": "汉字家族", "Нэг ханз мэдвэл 5–12 үг бэлэн — ханзаар нь бүлэглэсэн": "认识一个汉字，就能带出 5–12 个词 — 按汉字分组", "Мэдэх үгс:": "已学过的词：".

## 5. Verify
`npx tsc --noEmit`, `npm run build`. If a local server is easy (`npx next start -p 3111` after build; Supabase is dummy so the batch list will be empty — the map screen falls back), at least confirm `/review` renders. Report files changed and anything skipped.
