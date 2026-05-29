# Production Checklist — Buunduu Surtsgaay

Concise go-live checklist. See [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) for details.

---

## Local readiness

- [ ] `npm install` succeeds
- [ ] `npm run build` passes with no TypeScript errors
- [ ] `.env.local` created from `.env.example` (not committed)
- [ ] Local dev (`npm run dev`) works with and without Supabase env
- [ ] Phase 5 Final Audit reviewed ([PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md))

---

## Supabase readiness

- [ ] Supabase project created (production or staging)
- [ ] Migration `001_initial_schema.sql` applied
- [ ] Migration `002_lesson_media_fields.sql` applied
- [ ] Migration `003_lesson_route_status.sql` applied
- [ ] Migration `004_admin_lesson_bundle.sql` applied
- [ ] Migration `005_grant_is_admin_rpc.sql` applied
- [ ] Migration `005_lesson_release_workflow.sql` applied
- [ ] Migration `006_admin_tasks.sql` applied
- [ ] Migration `007_admin_activity_log.sql` applied
- [ ] Migration `008_admin_activity_snapshots.sql` applied
- [ ] `001_auth_rls_policies.sql` applied
- [ ] `002_admin_content_policies.sql` applied
- [ ] Seed or admin-created lessons exist
- [ ] Run [supabase/verify/production_verification.sql](./supabase/verify/production_verification.sql) — no **fail** rows
- [ ] Verification queries pass (see [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md))

---

## Auth readiness

- [ ] Email auth provider enabled
- [ ] Email confirmation policy decided (ON for production)
- [ ] Site URL set (after deploy)
- [ ] Redirect URLs configured
- [ ] Signup tested
- [ ] Login/logout tested
- [ ] Progress persists after login

---

## Storage readiness

- [ ] `lesson-media` bucket exists
- [ ] Storage policies applied ([001_lesson_media_bucket_policies.sql](./supabase/storage/001_lesson_media_bucket_policies.sql))
- [ ] Admin thumbnail upload works
- [ ] Public lesson page shows media URL

---

## Vercel readiness

- [ ] GitHub repo connected to Vercel
- [ ] Framework preset: Next.js (`vercel.json` present)
- [ ] Build command: `npm run build`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel env
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel env
- [ ] **No** `service_role` key in Vercel env for this app
- [ ] Production deployment created (first deploy succeeds)
- [ ] Deployment logs reviewed
- [ ] `/deployment-check` passes (no **fail**; review **warn**)
- [ ] Supabase Auth **Site URL** updated to production URL
- [ ] Supabase Auth **Redirect URLs** updated (production + `/login` + `/profile` + localhost)
- [ ] Admin login tested on production URL
- [ ] Public route smoke test passed (`/`, `/courses/hsk5`, `/lessons/1`, `/login`)
- [ ] Admin route smoke test passed (`/admin/system-check`, `/admin/final-audit`)
- [ ] `/admin/production-qa` completed — export QA report
- [ ] Launch blockers resolved (no **fail** in Production QA)
- [ ] Custom domain added (optional)

---

## Admin readiness

- [ ] `admin_profiles` row created for admin user
- [ ] Admin link visible when signed in as admin
- [ ] Non-admin cannot access `/admin`
- [ ] `/admin/system-check` passes key checks (no **fail**; review **warn**)
- [ ] SQL verification + system-check results agree (tables, storage, admin)
- [ ] Lesson create/edit/publish tested
- [ ] Activity log records actions
- [ ] Task center works

---

## Public route readiness

- [ ] `/` loads
- [ ] `/courses/hsk5` shows only `available` lessons
- [ ] `/lessons/1` watch/vocabulary/quiz flow works
- [ ] Draft lesson hidden without `?preview=admin`
- [ ] `/profile` and `/review` work when signed in
- [ ] `/login` and `/signup` work

---

## Final go-live checks

- [ ] Run `/admin/security-audit` — no automatic **fail**
- [ ] Export security report (JSON or Markdown)
- [ ] Run `supabase/verify/production_verification.sql` — confirm no **fail** rows
- [ ] Confirm no `service_role` key in client or Vercel env
- [ ] Production URL added to Supabase Auth Site URL + Redirect URLs
- [ ] RLS smoke test: learner cannot write other users' progress
- [ ] RLS smoke test: non-admin cannot write lessons
- [ ] No secrets in git history or client bundle
- [ ] `/admin/final-audit` reviewed
- [ ] Rollback plan documented (Supabase backups / lesson export JSON)
- [ ] `/admin/launch-candidate` completed — export launch report
- [ ] Go-live decision marked (launch candidate or needs review)
- [ ] [GO_LIVE_NOTES.md](./GO_LIVE_NOTES.md) reviewed
- [ ] [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) reviewed
- [ ] Launch candidate approved

---

## Quick links

- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
- [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md)
- [supabase/verify/README.md](./supabase/verify/README.md)
- `/admin/system-check` (local or after deploy)
- [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md)
- [SECURITY_RLS_AUDIT.md](./SECURITY_RLS_AUDIT.md)
- [LAUNCH_CANDIDATE_CHECKLIST.md](./LAUNCH_CANDIDATE_CHECKLIST.md)
- [GO_LIVE_NOTES.md](./GO_LIVE_NOTES.md)
- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md)
- `/admin/production-qa` (after deploy)
- `/admin/security-audit` (before launch)
- `/admin/launch-candidate` (final smoke test before go-live)
