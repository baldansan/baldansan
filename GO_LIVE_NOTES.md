# Go-Live Notes — Buunduu Surtsgaay

**Production URL:** https://baldansan.vercel.app  
**Launch dashboard:** [`/admin/launch-candidate`](/admin/launch-candidate)  
**Sign-off dashboard:** [`/admin/launch-signoff`](/admin/launch-signoff)

---

## Launch steps (summary)

1. Run [supabase/verify/production_verification.sql](./supabase/verify/production_verification.sql) — no **fail**
2. Open `/deployment-check` on production
3. Sign in as admin → `/admin/system-check`, `/admin/security-audit`
4. Complete `/admin/production-qa` and `/admin/launch-candidate` — export reports
5. Complete `/admin/launch-signoff` — record go/no-go decision and export sign-off report
6. Review [LAUNCH_CANDIDATE_CHECKLIST.md](./LAUNCH_CANDIDATE_CHECKLIST.md) and [LAUNCH_SIGNOFF.md](./LAUNCH_SIGNOFF.md)
7. Mark **go_live** decision on `/admin/launch-signoff`
8. Announce go-live; begin [POST_LAUNCH_MONITORING.md](./POST_LAUNCH_MONITORING.md)

---

## Pre-launch checklist

- [ ] Vercel production deploy green
- [ ] Supabase Auth Site URL + Redirect URLs set
- [ ] At least one `available` lesson on `/courses/hsk5`
- [ ] Admin `admin_profiles` row exists
- [ ] No **fail** in security audit or launch candidate smoke test
- [ ] Rollback plan reviewed ([ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md))
- [ ] Lesson export backup of critical content

---

## Launch-day checklist

- [ ] Re-run `/deployment-check` after final deploy
- [ ] Test `/login` and `/profile` on production URL
- [ ] Test one full lesson flow (watch → vocab → quiz)
- [ ] Admin smoke test: edit metadata, confirm activity log row
- [ ] Export launch candidate Markdown report
- [ ] Complete `/admin/launch-signoff` — export sign-off report
- [ ] Mark **go_live** decision in launch sign-off dashboard

---

## Post-launch checklist (first 24 hours)

- [ ] Monitor Vercel deployment logs
- [ ] Check Supabase Auth logs for redirect errors
- [ ] Verify quiz attempts and progress rows (if test users active)
- [ ] Confirm no draft lessons on public catalog
- [ ] Review user feedback / support channel

---

## Who should test

| Role | Focus |
|------|--------|
| **Admin / content owner** | CMS, publish, activity log, storage upload |
| **Developer** | `/deployment-check`, system check, security audit, Vercel/Supabase logs |
| **Learner test account** | Signup, login, lesson flow, progress, review |

---

## If login fails

1. Supabase Dashboard → Authentication → URL Configuration
2. Confirm **Site URL** = `https://baldansan.vercel.app`
3. Add Redirect URLs: production URL, `/login`, `/profile`, `localhost/**`
4. Clear browser cookies; retry in incognito
5. Check Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## If Supabase fails

1. Run `production_verification.sql` — fix **fail** rows
2. Check `/admin/system-check` for specific table/RLS errors
3. Verify migrations 001–008 and policy files applied
4. Check Supabase project status page / logs
5. Do **not** add `service_role` to the client — fix RLS instead

---

## If Vercel deploy fails

1. Run `npm run build` locally — fix TypeScript errors
2. Check Vercel build logs for missing env vars
3. Roll back to previous deployment ([ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md))
4. Redeploy after fix

---

## If admin route fails

1. Confirm signed in as admin with `admin_profiles` row
2. Check `/admin/system-check` — admin profile pass
3. Verify AdminGuard (login prompt vs denied message)
4. Test in browser with admin session (activity log uses client session)

---

## Known limitations

- No payment (Phase 7)
- No native mobile app (Phase 8)
- Guest progress requires login to sync to Supabase
- Activity log reads require browser admin session
- Schema migrations are not automatically reversible

---

## Related

- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md)
- [POST_LAUNCH_MONITORING.md](./POST_LAUNCH_MONITORING.md)
- [PHASE_6_LAUNCH_SUMMARY.md](./PHASE_6_LAUNCH_SUMMARY.md)
- [LAUNCH_CANDIDATE_CHECKLIST.md](./LAUNCH_CANDIDATE_CHECKLIST.md)
