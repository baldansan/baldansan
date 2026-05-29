# v1.0 Launch Blockers — Buunduu Surtsgaay

**Production URL:** https://baldansan.vercel.app  
**Last updated:** May 2026 (deep stabilization sprint)

---

## Production manual test checklist

**URL:** https://baldansan.vercel.app

| Route | Expected | Pass? |
|-------|----------|-------|
| `/` | Home loads, CTA to HSK5 | |
| `/deployment-check` | App + Supabase env pass, no secrets shown | |
| `/courses/hsk5` | Lesson list, no draft lessons | |
| `/lessons/1` | Detail loads | |
| `/lessons/1/watch` | Watch loads | |
| `/lessons/1/vocabulary` | Vocabulary loads | |
| `/lessons/1/quiz` | Quiz loads + saves | |
| `/login` | Form works | |
| `/dashboard` | Loads when signed in | |
| `/profile` | Loads, progress visible | |
| `/review` | Learned words or empty state | |
| `/admin/system-check` | Admin only, checks pass | |

**Must not happen:** 404 on core routes, crash, secret displayed, draft lesson in public list, non-admin sees draft content.

---

## Critical blockers

Must be **pass** before public v1.0 learner launch.

| ID | Blocker | Status | Notes |
|----|---------|--------|-------|
| B1 | Production build passes | Pass | `npm run build` — verify after each release |
| B2 | `/courses/hsk5` loads with ≥1 lesson | Needs manual test | Run on production after deploy |
| B3 | `/lessons/1` detail/watch/vocab/quiz load | Needs manual test | Use first available lesson id |
| B4 | Login / signup work on production | Needs manual test | Supabase redirect URLs must include baldansan.vercel.app |
| B5 | Quiz progress saves (guest + account) | Needs manual test | |
| B6 | Vocabulary learned state saves | Needs manual test | |
| B7 | Draft lessons hidden from public catalog | Pass (code) | RLS + `getPublicLessonsByCourseId` + route guard — verify on prod |
| B8 | No secrets in git / client env | Pass | `.env.local` untracked; no `service_role` in repo |
| B9 | AdminGuard intact on `/admin/*` | Pass (code) | Manual verify on production |

---

## Warnings (non-blocking for v1.0)

| ID | Warning | Impact |
|----|---------|--------|
| W1 | B2B / classroom routes incomplete for SaaS | Schools use manual onboarding; does not block learners |
| W2 | `EMAIL_PROVIDER` not configured | Invitation email skipped; copy-link fallback only |
| W3 | Payment not configured | `/pricing` is informational |
| W4 | Some teacher routes demo-only | Not in v1.0 learner scope |
| W5 | Migrations 011–018 may be unapplied on prod | B2B pages empty; learner app OK if 001–010 applied |
| W6 | Some admin/B2B labels remain English | Core learner pages polished MN (mobile UX sprint) |

---

## Mobile route test status (May 2026)

| Area | Code/build | Production manual |
|------|------------|-------------------|
| Home, courses, HSK5 | Pass | Recommended |
| Lesson watch/vocab/quiz | Pass | Recommended |
| Dashboard, profile, review | Pass | Recommended |
| Login/signup | Pass | Recommended |
| Bottom nav labels | Pass (code) | Verify 375px |
| Horizontal overflow | Pass (code) | Verify on device |

See [MOBILE_UX_POLISH_REPORT.md](./MOBILE_UX_POLISH_REPORT.md) for full mobile checklist.

---

## Non-blocking future work

- Payment integration (Phase 7 later)
- Resend / email campaigns
- Full B2B automation
- Native Expo app
- Push notifications
- i18n system for all admin labels

---

## Manual test results (template)

Fill during `/admin/production-qa` v1.0 section or production smoke test.

| Test | Date | Tester | Result | Notes |
|------|------|--------|--------|-------|
| Public route pass | | | | |
| Auth pass | | | | |
| Progress pass | | | | |
| Mobile pass (375px) | | | | |
| Draft hidden | | | | |
| `/deployment-check` | | | | |
| `/admin/system-check` | | | | |

---

## Decision

| Status | Meaning |
|--------|---------|
| **Ready** | All critical blockers pass on production |
| **Needs review** | Build passes; production manual QA incomplete |
| **Blocked** | Any critical blocker fails |

**Current recommendation:** **Needs review** — run production QA checklist after next deploy.

See [V1_STABILIZATION_REPORT.md](./V1_STABILIZATION_REPORT.md) for full stabilization summary.
