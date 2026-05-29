# Launch Candidate Checklist — Buunduu Surtsgaay

Final sign-off before go-live. **Production URL:** https://baldansan.vercel.app

Use with [`/admin/production-qa`](/admin/production-qa), [`/admin/security-audit`](/admin/security-audit), and [LAUNCH_QA_REPORT_TEMPLATE.md](./LAUNCH_QA_REPORT_TEMPLATE.md).

---

## Vercel deployment

- [ ] Production deploy succeeds (`npm run build` in Vercel logs)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel (Production)
- [ ] **No** `service_role` in Vercel env for this app
- [ ] `/deployment-check` — no **fail** rows

---

## Supabase database

- [ ] Migrations 001–008 applied
- [ ] RLS policies applied (`001_auth_rls`, `002_admin_content`)
- [ ] `supabase/verify/production_verification.sql` — no **fail** rows
- [ ] Admin row in `admin_profiles`

---

## Supabase Auth

- [ ] Site URL = `https://baldansan.vercel.app`
- [ ] Redirect URLs include production + `/login` + `/profile` + localhost
- [ ] Email confirmation policy decided (ON recommended for production)
- [ ] Login/signup tested on production URL

---

## Supabase Storage

- [ ] Bucket `lesson-media` exists
- [ ] Storage policies applied
- [ ] Admin upload tested
- [ ] Public media URL displays on lesson page

---

## Public routes

- [ ] `/`, `/courses/hsk5`, `/lessons/1` load
- [ ] Draft lessons **not** on `/courses/hsk5`
- [ ] Draft direct URL unavailable without admin preview
- [ ] `/login`, `/profile`, `/review` work

---

## Admin routes

- [ ] `/admin/system-check` — no **fail** (admin session)
- [ ] `/admin/security-audit` — no automatic **fail**
- [ ] `/admin/production-qa` — checklist exported
- [ ] `/admin/lessons`, `/admin/tasks`, `/admin/activity` load

---

## Security / RLS

- [ ] `/admin/security-audit` report exported
- [ ] Non-admin blocked from `/admin`
- [ ] Learner cannot write other users' progress (RLS smoke test)
- [ ] Non-admin cannot write lessons/content
- [ ] No secrets in git or client bundle

---

## Admin CMS workflows

- [ ] Create/edit/publish lesson tested on production
- [ ] Activity log records admin actions
- [ ] Task dismiss/resolve works
- [ ] Export backup JSON works
- [ ] Rollback preview available for supported actions

---

## Backup / export

- [ ] Lesson JSON export tested
- [ ] Production QA report exported (JSON or Markdown)
- [ ] Security audit report exported
- [ ] Supabase backup strategy documented

---

## Known limitations

- No payment (Phase 7)
- No native mobile app (Phase 8)
- Guest progress sync requires login
- Activity log reads use browser session

---

## Final decision

| Decision | Criteria |
|----------|----------|
| **Launch** | All critical checkboxes pass; no security audit **fail**; QA report `ready` or documented `needs review` |
| **Hold** | Any **fail** in security audit or production verification SQL |
| **Soft launch** | Warnings documented; team accepts known issues |

**Decision:** _______________  
**Date:** _______________  
**Signed off by:** _______________

---

## Related

- [SECURITY_RLS_AUDIT.md](./SECURITY_RLS_AUDIT.md)
- [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
