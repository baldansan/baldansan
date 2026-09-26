# Task: switch hanzi decomposition (game + breakdown panels) to the new verified dataset

Repo: /home/claude/repo (Next.js 16 — read node_modules/next/dist/docs if unsure; run `npx tsc --noEmit` at the end).

## New data (already generated — do not regenerate)
`public/data/char_breakdown_full.json` (3 437 chars; HSK chars + their components) — built from makemeahanzi by `scripts/hanzi/build-char-breakdown.py`. Entry example:
```
"谢": {"s":"зүүн–баруун","sz":"左右结构","ids":"⿰讠射","t":"形声",
  "c":[{"ch":"讠","mn":"үг","zh":"言字旁","k":"radical","role":"sem"},
       {"ch":"射","mn":"харвах","zh":"射（发射）","role":"pho","py":"shè"}],
  "r":"讠","rmn":"үг","rz":"言字旁",
  "e":"形声字 — 讠 утга заагч (үг) + 射 дуудлага заагч (shè).",
  "ez":"形声字：讠 表义（言字旁）＋射 表音（shè）",
  "sub":{"射":["身","寸"]}}
```
Fields: `s` structure (mn label), `sz` structure (zh), `ids` IDS string, `t` type: "形声" | "会意" | "象形" | absent; `c[]` first-level parts in order: `ch`, `mn` (Mongolian meaning, may be missing), `zh` (Chinese name/meaning, may be missing), `k` kind: "radical" | "stroke" | "other" | absent(=ordinary character), `role`: "sem" (утга заагч / 形旁) | "pho" (дуудлага заагч / 声旁) | absent, `py` pinyin of the phonetic part; `r`/`rmn`/`rz` radical (部首) + names; `e` explanation mn, `ez` explanation zh; `inc: true` when the decomposition is incomplete (unknown part); `sub` second-level decomposition of a part.
`public/data/component_meanings_mn.json` now `{glyph: {mn, zh?, k?}}` (1 308 glyphs).

## Required changes
1. **Types/loaders**: extend `FullBreakdownEntry`/`FullBreakdownComponent` in `lib/hanzi/char-breakdown-full.ts` and `lib/hanzi/char-breakdown-full-server.ts` with the new optional fields; `getFullComponentMn` unchanged; add `getFullComponentZh(glyph)`.
2. **Remove the hand-written catalogs that override the dataset**: in `lib/games/hanzi-component-data.ts` delete `COMPONENT_CATALOG` (17 AI-written entries, some wrong — e.g. 系 = 丿+小) so the dataset is the single source. Keep `STROKE_ORDER_CATALOG` only if it is used for single-stroke characters (一二三十…) — otherwise it can go too. `resolveHanziCharacterData` must prefer `extraCatalog` (dataset) over anything else. Same for `data/char_breakdown.json` (23 hand entries used by `lib/hanzi/char-breakdown-data.ts`): keep only their `etymology_mn` as an optional richer sentence if you like, but parts/structure must come from the dataset. Remove `hasHandWrittenEntry` precedence for parts.
3. **`HanziComponent`/`HanziCharacterData`** (lib/games/hanzi-component-data.ts): add `nameZh?`, `role?: "sem"|"pho"`, `phoneticPinyin?`, `kind?: "radical"|"stroke"|"other"|"char"`; add `type?: "形声"|"会意"|"象形"`, `explanationMn?`, `explanationZh?`, `radical?`, `structureLabelZh?`, `sub?: Record<string,string[]>`. Fill them in `lib/games/hanzi-breakdown-catalog-server.ts` from the dataset. `formula` stays `"讠 + 射 = 谢"`.
4. **Stroke/component game** (`lib/games/hanzi-stroke-game.ts`, `components/games/stroke-game-client.tsx`):
   - A character is eligible for the "missing component" question only if it has ≥2 first-level parts, is not `inc`, is not type 象形, and has ≥1 part that is not a stroke (`kind !== "stroke"`). The missing part must be a non-stroke part; the shown part may be a stroke.
   - Distractors: 3 other parts from the lesson's pool with the same `kind` where possible (radical→radicals, char→chars), never the correct one, never a part of the same character; fall back to any non-stroke part.
   - The explanation after answering: use the dataset `explanationMn` (mn UI) / `explanationZh` (zh UI, via `useUiLocale()`), then the formula line. Keep the structure label (mn/zh). Delete the old template "X нь A + B = X гэсэн бүтэцтэй…" (`buildComponentExplanation`) or make it a fallback only when no explanation exists.
   - Show the role tags under the two parts in the question card: "утга заагч / 形旁" and "дуудлага заагч / 声旁" (mn/zh by locale) when `role` is present, and the type badge (形声字 / 会意字 / 象形字) — these are UI labels: put the Mongolian in JSX and add ZH_UI entries in `lib/i18n/translate.ts` (`tr(locale, "...")`), e.g. "утга заагч": "形旁（表义）", "дуудлага заагч": "声旁（表音）", "Утга-дуудлагын ханз": "形声字", "Утга нийлсэн ханз": "会意字", "Зураг ханз": "象形字", "Бүтэц": "结构", "Задлах": "拆开", "Язгуур (部首)": "部首".
   - Component labels shown to the learner: mn label in mn UI, `zh` label in zh UI (fallback to the other). These are content → wrap in `translate="no"`.
5. **Breakdown panels** (`lib/hanzi/char-breakdown-data.ts` `buildViewFromFullEntry`, `components/review/word-char-breakdown-panel.tsx`, `components/hanzi/CharacterDecompositionHint.tsx`): render type badge, parts with role tags and mn/zh labels, radical line (部首 marked with a small tag), explanation `e`/`ez` by locale, and an "expand" affordance: tapping a part that has `sub` shows its second-level parts (e.g. 射 → 身 + 寸) inline. Keep existing icons (`resolveComponentIcon`).
6. Attribution: add makemeahanzi to the existing attribution/credits list (grep "krmanik" or "Shtooka" to find it) — "Character decomposition data: makemeahanzi (skishore), Unihan / CC-CEDICT / Wiktionary — CC BY-SA".
7. Verify: `npx tsc --noEmit` passes; `npm run build` passes. Write a small script or test that builds the stroke-game questions for lesson `hsk1-l01` vocabulary chars and prints them (character, shown, missing, options, explanation) — confirm 系 → 丿 + ? with answer 糸 (or the char is skipped if 糸 isn't in pool — then check 谢 → 讠 + ? = 射 etc.). Report the questions list and all files changed.

Rules: do not touch content translation files beyond adding ZH_UI keys; keep Mongolian text plain (no Russian loanwords); do not reintroduce hand-written decompositions.
