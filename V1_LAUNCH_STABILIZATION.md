# v1.0 Launch Stabilization — Buunduu Surtsgaay

**Production URL:** https://baldansan.vercel.app  
**Status:** Feature freeze active — learner launch focus only  
**Started:** May 2026

---

## Feature freeze statement

From this point until v1.0 public learner launch, **no new major product features** are added. Work is limited to:

- Bug fixes for core learner routes
- Mobile and copy polish on learner pages
- Production verification and launch documentation
- Admin CMS fixes required to ship content

B2B, classroom, payment, and email provider work **does not block** v1.0 unless it breaks the build or core learner routes.

---

## v1.0 launch scope (in)

| Area | Routes / capability |
|------|---------------------|
| Home | `/` |
| Courses | `/courses`, `/courses/hsk5` |
| Lesson flow | `/lessons/{id}`, `/watch`, `/vocabulary`, `/quiz` |
| Review | `/review` |
| Dashboard | `/dashboard` |
| Profile | `/profile` |
| Auth | `/login`, `/signup`, `/onboarding` |
| Help / info | `/help`, `/pricing`, `/feedback` |
| Progress | Guest local + account sync when logged in |
| Admin CMS | `/admin`, `/admin/lessons`, edit, publish, activity, tasks |
| Deployment | `/deployment-check`, Vercel production |

**Learner definition of done:** A visitor can open HSK5, complete lesson 1 (watch → vocabulary → quiz), log in, save progress, review learned words, and return via dashboard — without broken core routes.

---

## Out of scope for v1.0

- Real payment / subscriptions
- Real email campaigns / Resend production setup
- Full B2B SaaS onboarding automation
- Classroom billing
- Native mobile app (Expo)
- Advanced organization automation
- New database features unless fixing a launch blocker

---

## Launch blockers

See [V1_LAUNCH_BLOCKERS.md](./V1_LAUNCH_BLOCKERS.md) for live status.

**Critical examples:**

- Production build fails
- `/courses/hsk5` or `/lessons/1` errors
- Login/signup broken on production
- Quiz or vocabulary progress cannot save
- Draft lesson visible in public catalog
- Secrets exposed in client or git

---

## Test checklist

### Logged-out

- [ ] Home, courses, HSK5 load
- [ ] Lesson 1 detail, watch, vocabulary, quiz load
- [ ] Guest progress does not crash (local fallback)
- [ ] Login CTA visible and works

### Logged-in

- [ ] Login → dashboard → profile
- [ ] Vocabulary learned state persists
- [ ] Quiz attempt saves
- [ ] Lesson progress saves
- [ ] Review shows learned words when available
- [ ] Streak / daily goal does not crash

### Draft visibility

- [ ] Draft lessons hidden from `/courses/hsk5`
- [ ] Direct draft URL shows unavailable (not full content)
- [ ] Admin preview works only for admin (`?preview=admin`)

### Mobile (375px)

- [ ] Home, courses, HSK5, lesson flow, dashboard, profile, review
- [ ] Login/signup forms usable
- [ ] Bottom nav + lesson step bar do not hide primary actions

### Production

- [ ] `npm run build` passes
- [ ] `/deployment-check` pass on production
- [ ] `/admin/system-check` pass (admin)
- [ ] `/admin/production-qa` v1.0 section completed

---

## Required Supabase migrations (v1.0 core)

Minimum for learner launch: **001–010** + admin bootstrap (`supabase/admin/001_admin_profiles_setup.sql`).

For full deployed feature set including retention/engagement: **001–010**.

B2B/classroom (optional for v1.0 learner-only): **011–018** — must not break build if absent; routes may show empty states.

See [SUPABASE_MIGRATION_STATUS.md](./SUPABASE_MIGRATION_STATUS.md).

**Admin helper:** Use canonical `public.is_admin(auth.uid()::uuid)` in policies after standardization.

---

## Known limitations

- Payment page is informational only (no checkout)
- Email invitation send skipped without `EMAIL_PROVIDER` (copy-link fallback)
- B2B/school routes exist but are not v1.0 launch requirements
- Push notifications not implemented (in-app only)
- HSK4 / Taobao courses marked coming soon

---

## Related docs

- [V1_LAUNCH_BLOCKERS.md](./V1_LAUNCH_BLOCKERS.md)
- [V1_STABILIZATION_REPORT.md](./V1_STABILIZATION_REPORT.md)
- [SUPABASE_MIGRATION_STATUS.md](./SUPABASE_MIGRATION_STATUS.md)
- [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md)
- [MOBILE_UX_CHECKLIST.md](./MOBILE_UX_CHECKLIST.md)
