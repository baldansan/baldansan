# Mobile UX Polish Report — Buunduu Surtsgaay

**Date:** May 2026  
**Production URL:** https://baldansan.vercel.app  
**Sprint:** v1.0 Mobile UX Polish (no new features)

---

## Goal

Polish the entire learner-facing app for professional, clean, mobile-first UX on 360–430px phones before HSK content upload.

---

## Pages reviewed

| Page | Status |
|------|--------|
| `/` | Polished — hero, CTAs, Mongolian sections |
| `/courses` | Polished — cards, badges, MN labels |
| `/courses/hsk5` | Polished — lesson list, status badges |
| `/lessons/[id]` | Polished — title layout, step CTAs |
| `/lessons/[id]/watch` | Polished — subtitle modes, placeholders |
| `/lessons/[id]/vocabulary` | Polished — search, filters, touch buttons |
| `/lessons/[id]/quiz` | Polished — 48px options, result card |
| `/dashboard` | Polished — stats labels, continue card |
| `/profile` | Existing layout retained (functional) |
| `/review` | Existing layout retained (functional) |
| `/login`, `/signup` | Polished — bottom padding, full-width inputs |
| `/onboarding`, `/help`, `/pricing`, `/feedback` | Polished — MN copy, card spacing |
| Global nav/footer | Polished — bottom nav labels, sticky header |

---

## Fixes made

### Global layout
- Max content width `960px`; mobile padding `16px`
- `overflow-x: hidden` on html/body
- Force light green/white theme (ignore OS dark mode on public pages)
- Shared UI: `SectionCard`, `CtaButtonRow`, `LearnerPageShell`
- Central labels: `lib/learner-labels.ts`

### Navigation
- Bottom nav: Нүүр / Хичээлүүд / Миний самбар / Давтах / Профайл (logged in)
- Bottom nav logged out: Нүүр / Хичээлүүд / Заавар / Нэвтрэх
- Header: desktop nav only (`md+`); mobile relies on bottom nav
- Footer: grouped learner vs B2B links; Mongolian labels
- Email hidden on mobile header; logout touch-friendly

### Learner flow
- Lesson step bar: Mongolian labels (Тойм, Үзэх, Үг, Quiz)
- Watch/vocab/quiz: stacked full-width CTAs, min 44–48px touch targets
- Video placeholder: «Видео хараахан ороогүй байна»
- Vocabulary: «Сурсан гэж тэмдэглэх», «Давталтад нэмэгдсэн»
- Quiz: «Дахин өгөх», «Дараагийн хичээл», larger option buttons

### Copy
- Reduced mixed English on core learner pages
- Home hero subtitle per launch spec
- Courses/HSK5 status badges: Бэлэн / Удахгүй / Дууссан

---

## Known remaining issues

| ID | Issue | Severity |
|----|-------|----------|
| M1 | Profile/review pages less polished than lesson flow | Low |
| M2 | Admin/B2B pages still English-heavy | Low (out of scope) |
| M3 | Login/signup pages have no bottom nav (intentional) | Info |
| M4 | Production manual mobile QA not yet recorded | Medium |
| M5 | Some engagement cards retain English microcopy | Low |

---

## Mobile test checklist

Test on **375px width** (iPhone SE / Android small):

| # | URL | Check |
|---|-----|-------|
| 1 | https://baldansan.vercel.app/ | Hero readable; CTAs stack; no horizontal scroll |
| 2 | /courses | Cards stack; badges wrap |
| 3 | /courses/hsk5 | Lesson cards readable; CTA clear |
| 4 | /lessons/1 | Step path visible; CTAs tappable |
| 5 | /lessons/1/watch | Video/placeholder; subtitle modes wrap |
| 6 | /lessons/1/vocabulary | Search full width; mark learned works |
| 7 | /lessons/1/quiz | Options large; result page clear |
| 8 | /dashboard | Cards stack; continue CTA visible |
| 9 | /review | Empty state or word list clean |
| 10 | /login | Form centered; full-width button |
| 11 | /onboarding | Steps readable |
| 12 | Bottom nav | 5 items fit; labels match spec |

---

## Production test URLs

- Home: https://baldansan.vercel.app/
- Courses: https://baldansan.vercel.app/courses
- HSK5: https://baldansan.vercel.app/courses/hsk5
- Lesson 1: https://baldansan.vercel.app/lessons/1
- Dashboard: https://baldansan.vercel.app/dashboard
- Deployment check: https://baldansan.vercel.app/deployment-check

---

## Security (unchanged)

- No `.env.local` committed
- No `service_role` / `RESEND_API_KEY` in repo
- RLS and AdminGuard unchanged

---

## Recommendation

**Ready for content upload sprint** after deploy + quick mobile smoke test on production.

No new features added. Build must pass before deploy.
