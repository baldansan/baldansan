# Mobile App-Like Redesign Report — Buunduu Surtsgaay

**Date:** May 2026  
**Production URL:** https://baldansan.vercel.app  
**Sprint:** v1.0 Mobile App-Like Redesign

---

## Design direction

Learner-facing UI redesigned as a **phone-width mobile app** inside a centered shell on desktop:

- Outer background: `#eef2f7` (soft gray)
- App container: max **430px**, centered, subtle border/shadow
- Inner background: `#f3f6fb`
- Cards: white, 20px radius, light border
- Primary accent: green (`#52c900`)
- Course cards: orange gradient (HSK5 active)
- Games hub: purple accents
- Bottom tab bar: fixed, 64px, Mongolian labels with emoji icons

Admin routes (`/admin/*`) **unchanged** — standard admin layout, no phone shell.

---

## Pages redesigned

| Route | Description |
|-------|-------------|
| `/home` | App home — greeting, continue card, course chips, lesson timeline |
| `/study` | Study/review center — lesson groups, vocabulary link |
| `/kanji` | Character grid from existing vocabulary |
| `/games` | Practice hub — stats + 5 mini-games |
| `/games/match`, `/games/translate`, `/games/missing-word`, `/games/arrange`, `/games/stroke` | Lesson vocabulary games (`?lessonId=`) |
| `/kanji/[vocabId]` | Hanzi detail + practice CTAs |
| `/profile` | Avatar, stats grid, menu list, logout |
| `/lessons/*` | Lesson detail, watch, vocab, quiz in app shell |
| `/review` | Wrapped in app shell (Давтах tab) |
| `/courses`, `/courses/hsk5`, `/courses/korean-1` | Course catalog in app shell |
| `/login`, `/signup` | Centered form cards in app shell |

**Marketing landing:** `/` redirects to `/home` (app home). Legacy marketing content remains available at `/demo` if needed.

**Polish sprint (May 2026 — final):**
- `/` redirects to `/home` — production root opens app UI
- Bottom nav on `/home`, `/study`, `/kanji`, `/games`, `/profile`, `/dashboard`, `/courses`, `/courses/hsk5`, `/lessons/*` (hidden on full-screen game play routes)
- Home: avatar, stat pills, orange/green continue card, premium course card, timeline polish
- Lesson detail: media placeholder with vocab/quiz CTAs, step cards, Mongolian CTAs
- Korean visual readiness: `lib/course-display.ts` — Hangul in `chinese` fields, romanization label, sky gradient for `korean-*` courses
- Routes: `/courses/korean-1`, `/courses/korean-survival` when content exists (404-safe if empty)

---

## Mobile nav structure

| Tab | Label | Route | Active on |
|-----|-------|-------|-----------|
| Home | Нүүр | `/home` | `/`, `/home` |
| Study | Давтах | `/study` | `/study`, `/review`, `/courses`, `/lessons/*` |
| Kanji | Ханз | `/kanji` | `/kanji` |
| Games | Тоглоом | `/games` | `/games`, `/games/*`, `/lessons/*/quiz` |
| Profile | Профайл | `/profile` | `/profile`, `/dashboard`, `/login`, `/signup` |

Components: `components/mobile/mobile-app-shell.tsx`, `mobile-bottom-nav.tsx`

---

## Shared components

- `MobileAppShell` — centered phone container + bottom padding
- `MobileBottomNav` — 5-tab navigation
- `MobilePageHeader` — title/subtitle/badge
- `MobileCard` — white rounded card
- `lib/mobile-nav.ts` — tab config
- `lib/course-display.ts` — HSK vs Korean labels (no schema change)
- `lib/mobile-course-options.ts` — home course chips (HSK + optional Korean)
- `lib/mobile-home-data.ts` — shared home catalog loader
- `lib/mobile-app-vocab.ts` — kanji aggregation from lesson vocabulary

---

## Known limitations

| ID | Limitation |
|----|------------|
| L1 | Stroke game is demo-only; no real stroke engine yet |
| L2 | HSK1/HSK4 chips are placeholders; Korean chip when `korean-1` or `korean-survival` published |
| L3 | `/dashboard` uses mobile shell (Profile tab); inner cards still legacy styling |
| L4 | Marketing/B2B pages use original website shell |
| L5 | XP stat on profile is derived placeholder (lessons × 100) |
| L6 | Kanji page uses vocabulary words, not dedicated hanzi table |

---

## Manual test URLs

- App home: https://baldansan.vercel.app/home
- Study: https://baldansan.vercel.app/study
- Kanji: https://baldansan.vercel.app/kanji
- Games: https://baldansan.vercel.app/games
- Profile: https://baldansan.vercel.app/profile
- Lesson flow: https://baldansan.vercel.app/lessons/1

Test at **375px width** and **desktop** (centered phone shell).

---

## Security (unchanged)

- No `.env.local` committed
- No `service_role` / API secrets in repo
- RLS and AdminGuard unchanged
- Draft lessons remain non-public

---

## Recommendation

**Ready for Korean Book 1 content upload** after deploy + quick visual QA on `/`, `/home`, and `/lessons/1` at 375px width.
