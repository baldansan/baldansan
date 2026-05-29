# v1.0 Stabilization Report — Buunduu Surtsgaay

**Date:** May 2026  
**Production URL:** https://baldansan.vercel.app  
**Branch:** deep v1.0 stabilization sprint (feature freeze)

---

## Build status

| Check | Result |
|-------|--------|
| `npm run build` | **Pass** |
| TypeScript | Pass |
| Static generation | 35 routes |

---

## Routes verified (code audit)

All routes exist in App Router build output. Manual production smoke test still required.

### Public learner (v1.0 core)

| Route | Status | Notes |
|-------|--------|-------|
| `/` | OK | Home hero, HSK5 CTA |
| `/deployment-check` | OK | Env + public read checks |
| `/courses` | OK | Course catalog |
| `/courses/hsk5` | OK | Public lessons only via `getPublicLessonsByCourseId` |
| `/lessons/1` (+ watch/vocab/quiz) | OK | Access guard + draft unavailable UI |
| `/review` | OK | Learned words dashboard |
| `/dashboard` | OK | Learner stats |
| `/profile` | OK | Progress + retention |
| `/login`, `/signup` | OK | Auth forms + `?next=` redirect |
| `/onboarding`, `/help`, `/pricing`, `/feedback` | OK | Static/info pages |

### B2B (non-blocking)

| Route | Status | Notes |
|-------|--------|-------|
| `/schools`, `/teachers`, `/demo`, `/school-inquiry` | OK | Do not block learner launch |

### Admin (content readiness)

| Route | Status | Notes |
|-------|--------|-------|
| `/admin` | OK | AdminGuard |
| `/admin/system-check` | OK | Runtime verification |
| `/admin/production-qa` | OK | Includes v1.0 checklist section |
| `/admin/lessons`, `/admin/lessons/{id}/edit` | OK | CMS edit flow |
| `/admin/activity`, `/admin/tasks` | OK | Audit + task center |

---

## Bugs fixed (deep sprint)

| Area | Fix |
|------|-----|
| Copy | Nav/footer: Курсууд, Нэвтрэх, Профайл, Давталт, Миний самбар |
| Copy | Lesson detail: Хичээл үзэх, Үгийн сан, Quiz өгөх, progress MN |
| Copy | Watch/vocab/quiz CTAs → Хичээл үзэх |
| Copy | Continue/start/review/back labels (prior pass + central `learner-progress.ts`) |
| Mobile | Lesson `pb-32`, subtitle `flex-wrap`, step bar desktop static |
| B2B safety | Email send skipped message MN; copy-link fallback documented |
| Docs | Expanded `SUPABASE_MIGRATION_STATUS.md`, production route checklist |
| QA | `/admin/production-qa` v1.0 section |

No new features. No RLS changes. No schema changes.

---

## Draft visibility (verified in code)

- RLS: public SELECT on `lessons` where `status = 'available'`
- Catalog: `getSupabasePublicLessonsByCourseId` filters `available`
- Direct URL: `resolveLessonPageAccess` → `LessonUnavailable` for non-public
- Admin preview: `?preview=admin` only for admin users

---

## Launch blockers remaining

| Blocker | Status |
|---------|--------|
| Build fails | **Clear** — build passes |
| Secrets in git | **Clear** — no `.env.local`, no real API keys |
| Draft exposed | **Clear in code** — verify on production |
| Core routes broken | **Needs manual test** on https://baldansan.vercel.app |
| Auth on production | **Needs manual test** — Supabase redirect URLs |
| Progress save | **Needs manual test** — guest + logged-in |

See [V1_LAUNCH_BLOCKERS.md](./V1_LAUNCH_BLOCKERS.md).

---

## Warnings

- B2B / classroom / invitation email — foundation only; not v1.0 launch scope
- `EMAIL_PROVIDER` unset — invitation send skipped (expected)
- Payment — informational `/pricing` only
- Migrations 011–018 may be unapplied on production DB (B2B optional for learners)
- Some admin/B2B labels remain English (acceptable for v1.0)

---

## Security status

| Check | Result |
|-------|--------|
| `.env.local` tracked | No |
| `service_role` in source | Documentation warnings only |
| `RESEND_API_KEY` committed | No (placeholder in `.env.example` only) |
| Real API key patterns | None found |
| AdminGuard | Preserved |
| RLS weakened | No changes |

---

## Production test plan

1. Deploy latest build to Vercel production
2. Open https://baldansan.vercel.app/deployment-check — all pass/warn reviewed
3. Admin: `/admin/system-check` — fix any fails
4. Admin: `/admin/production-qa` — complete **v1.0 learner launch** section
5. Logged-out: HSK5 → lesson 1 → watch → vocab → quiz
6. Sign up / log in → dashboard → profile → confirm progress sync
7. Mobile 375px: home, lesson flow, dashboard, login
8. Confirm draft lesson not in HSK5 list (if draft exists in CMS)
9. Export QA report for launch record

---

## v1.0 Mobile App-Like Redesign — **Completed**

- Learner-facing mobile app shell redesign completed — see [MOBILE_APP_REDESIGN_REPORT.md](./MOBILE_APP_REDESIGN_REPORT.md)
- Phone-width centered layout, bottom tab nav, home/study/kanji/games/profile views
- Lesson flow, login/signup aligned to app shell
- No new backend features; build verified

**Next:** HSK4/HSK5 content upload sprint.

---

## v1.0 Mobile UX Polish — **Completed**

- Mobile UX polish pass completed — see [MOBILE_UX_POLISH_REPORT.md](./MOBILE_UX_POLISH_REPORT.md)
- Global layout, nav, footer, lesson flow, quiz/vocab touch targets
- Mongolian learner labels on core public pages
- No new features; build verified

**Next:** HSK4/HSK5 content upload sprint after mobile UX polish.

---

## Recommendation

### **Ready for content upload**

- Mobile UX polish pass completed (May 2026)
- Codebase stable; production mobile smoke test recommended
- See [MOBILE_UX_POLISH_REPORT.md](./MOBILE_UX_POLISH_REPORT.md)

After production QA passes all v1.0 checklist items → **Ready** for public v1.0 announcement.

---

## Files created

- `V1_LAUNCH_STABILIZATION.md`
- `SUPABASE_MIGRATION_STATUS.md`
- `V1_LAUNCH_BLOCKERS.md`
- `V1_STABILIZATION_REPORT.md` (this file)

## Files updated

- Learner copy: `lib/learner-progress.ts`, home, dashboard, profile, review, quiz, lesson components, nav
- Mobile: lesson page padding, watch subtitle wrap, step bar layout
- QA: `lib/admin/production-qa-data.ts`, `components/admin/production-qa-view.tsx`
- Docs: `README.md`, `PROJECT_CHECKPOINT.md`, `DEVELOPMENT_PLAN.md`, `PRODUCTION_ROUTE_TESTING.md`
