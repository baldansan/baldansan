# v1.0 Launch Sign-off — Buunduu Surtsgaay

**Project:** Buunduu Surtsgaay (Бөөндөө Сурцгаая)  
**Sign-off date:** May 2026  
**Production URL:** https://baldansan.vercel.app

---

## Launch decision

### **Ready for soft launch**

The v1.0 learner app is stable for a **soft public launch** with real users, content fixes via admin CMS, and feedback collection. Feature freeze remains in effect — no new major features until post-launch review.

**Soft launch means:** Monitor production, collect user feedback, fix bugs only, iterate on content via `/admin/lessons`.

---

## v1.0 scope (signed off)

A learner can:

1. Visit https://baldansan.vercel.app  
2. Open HSK5 course  
3. Complete lesson flow: detail → watch → vocabulary → quiz  
4. Log in / sign up and save progress  
5. Review learned words and continue from dashboard/profile  

**Out of scope:** Payment, email campaigns, full B2B SaaS, native app.

---

## Core learner routes — tested status

| Route | Build | Code audit | Production manual |
|-------|-------|------------|-------------------|
| `/` | Pass | Pass | Recommended |
| `/courses` | Pass | Pass | Recommended |
| `/courses/hsk5` | Pass | Pass | Recommended |
| `/lessons/1` | Pass | Pass | Recommended |
| `/lessons/1/watch` | Pass | Pass | Recommended |
| `/lessons/1/vocabulary` | Pass | Pass | Recommended |
| `/lessons/1/quiz` | Pass | Pass | Recommended |
| `/review` | Pass | Pass | Recommended |
| `/dashboard` | Pass | Pass | Recommended |
| `/profile` | Pass | Pass | Recommended |
| `/login` | Pass | Pass | Recommended |
| `/signup` | Pass | Pass | Recommended |
| `/onboarding` | Pass | Pass | Optional |
| `/help`, `/pricing`, `/feedback` | Pass | Pass | Optional |
| `/deployment-check` | Pass | Pass | Recommended |

**Draft visibility:** Draft lessons hidden from public catalog (RLS + app filters + route guard). Admin preview via `?preview=admin` only.

---

## Admin / system check status

| Tool | Purpose | Status |
|------|---------|--------|
| `/admin` | CMS home, AdminGuard | Pass (build) |
| `/admin/system-check` | Env, auth, tables, storage | Pass (build); verify on production |
| `/admin/production-qa` | v1.0 learner launch checklist | Available |
| `/admin/lessons` | Content edit + publish | Pass (build) |
| `/admin/activity` | Audit trail | Pass (build) |
| `/admin/tasks` | Content review tasks | Pass (build) |

**Security:** No `service_role` in client. `.env.local` not committed. AdminGuard preserved.

---

## Supabase migration status

See [SUPABASE_MIGRATION_STATUS.md](./SUPABASE_MIGRATION_STATUS.md).

| Tier | Migrations | v1.0 learner |
|------|------------|--------------|
| **Core required** | 001–005, admin bootstrap, content policies | Required |
| **Recommended** | 006–010 (tasks, activity, retention, engagement) | Recommended |
| **B2B optional** | 011–018 (classroom, org, invitations) | Optional — does not block learners |

**Admin helper:** Use `public.is_admin(auth.uid()::uuid)` only — not ambiguous `public.is_admin()`.

**Verification:** Run core SQL in `SUPABASE_MIGRATION_STATUS.md` on production project.

---

## Known warnings (non-blocking)

| Warning | Impact |
|---------|--------|
| B2B / classroom routes are foundation only | Schools use manual onboarding; learners unaffected |
| `EMAIL_PROVIDER` not configured | Invitation email skipped; copy-link fallback |
| `/pricing` is informational | No payment checkout |
| Some admin/B2B labels remain English | Does not block learner UX |
| Migrations 011–018 may be unapplied | B2B pages may show empty states |
| Production manual QA checklist not fully signed | Soft launch with monitoring recommended |

---

## Non-blocking future work

- Payment / subscriptions (Phase 7 later)
- Resend / email campaigns for invitations
- Full B2B SaaS automation
- Native Expo mobile app
- Push notifications
- Full i18n for admin UI
- Phase 7 Step 17+ (not started)

---

## Sign-off checklist

- [x] Feature freeze applied  
- [x] `npm run build` passes  
- [x] Core learner routes build and render (code audit)  
- [x] Mongolian copy on core learner pages  
- [x] Mobile lesson flow spacing improved  
- [x] Launch docs complete (stabilization, blockers, migration status)  
- [x] No secrets in git  
- [x] RLS not weakened; draft lessons not public  
- [ ] Production smoke test signed (recommended post-deploy)  
- [ ] `/admin/production-qa` v1.0 section completed on live URL  

---

## Post soft launch

1. Monitor https://baldansan.vercel.app and Vercel logs  
2. Collect user feedback (profile, `/feedback`)  
3. Fix bugs only — no new features  
4. Content updates via `/admin/lessons`  
5. Re-run `/deployment-check` and `/admin/system-check` after each deploy  

---

## Related docs

- [V1_LAUNCH_STABILIZATION.md](./V1_LAUNCH_STABILIZATION.md)
- [V1_LAUNCH_BLOCKERS.md](./V1_LAUNCH_BLOCKERS.md)
- [V1_STABILIZATION_REPORT.md](./V1_STABILIZATION_REPORT.md)
- [SUPABASE_MIGRATION_STATUS.md](./SUPABASE_MIGRATION_STATUS.md)
- [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md)

**Signed off for:** v1.0 soft launch — learner public release with monitoring and feedback collection.
