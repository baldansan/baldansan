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
| `/login`, `/signup` | Centered form cards in app shell |

**Marketing landing:** `/` kept as website layout with CTA → `/home`.

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
- `lib/mobile-app-vocab.ts` — kanji aggregation from lesson vocabulary

---

## Known limitations

| ID | Limitation |
|----|------------|
| L1 | Stroke game is demo-only; no real stroke engine yet |
| L2 | HSK1/HSK4 chips on home are placeholders (HSK5 only live) |
| L3 | `/dashboard` still uses legacy layout (linked from profile menu) |
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

**Ready for content upload** after deploy + quick visual QA on `/home` and lesson flow.
