# v1.0 Stabilization Report — Buunduu Surtsgaay

**Date:** May 2026  
**Production URL:** https://baldansan.vercel.app  
**Branch:** stabilization pass (feature freeze)

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

## Bugs fixed (this pass)

| Area | Fix |
|------|-----|
| Copy | Mongolian labels: Суралцаж эхлэх, Үргэлжлүүлэх, Үг давтах, Курс руу буцах, Миний самбар |
| Copy | Central `lib/learner-progress.ts` labels propagate to continue CTAs |
| Mobile | Lesson pages `pb-32` for step bar + bottom nav clearance |
| Mobile | Watch subtitle mode buttons use `flex-wrap` |
| Mobile | Lesson step bar static on desktop (no sticky overlap) |
| QA | `/admin/production-qa` v1.0 learner launch checklist section |

No functional regressions introduced. No new features added.

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

## Recommendation

### **Needs review**

- Codebase and build are stable for v1.0 learner launch
- **Production manual QA** on https://baldansan.vercel.app is the remaining gate
- B2B features do not block learner launch

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
