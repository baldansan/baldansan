# Post-Launch Monitoring — Buunduu Surtsgaay

Routine checks after go-live. **Production URL:** https://baldansan.vercel.app

---

## Daily (first 7 days)

| Check | How |
|-------|-----|
| Deployment health | https://baldansan.vercel.app/deployment-check |
| Admin runtime | `/admin/system-check` (signed in as admin) |
| Auth login | Test `/login` on production |
| Public catalog | `/courses/hsk5` — drafts hidden |
| Vercel logs | Vercel → Deployments → latest → Logs |
| Supabase logs | Supabase Dashboard → Logs (Auth, Postgres errors) |

---

## Weekly (after first week)

| Check | How |
|-------|-----|
| Production QA | `/admin/production-qa` — spot-check key routes |
| Security audit | `/admin/security-audit` — after any deploy |
| Activity log | `/admin/activity` — admin actions recording |
| Storage upload | Upload test thumbnail on lesson edit |
| Quiz attempts | Supabase `user_quiz_attempts` row growth (if users active) |
| User feedback | Support channel / email |

---

## After every production deploy

1. `/deployment-check` — no **fail**
2. `/admin/system-check` — no **fail**
3. Update `/admin/launch-candidate` status cards
4. Export launch report if checklist changed

---

## What to watch

| Signal | Action |
|--------|--------|
| Auth redirect errors | Fix Supabase Redirect URLs |
| Blank lesson list | Check Vercel env vars; redeploy |
| Admin 403 | Verify `admin_profiles` row |
| Activity log empty | Open `/admin/activity` while signed in (client session) |
| Storage upload fail | Re-check storage policies + bucket |
| Build failure | Fix locally; revert deploy if urgent |

---

## First 7 days routine

| Day | Focus |
|-----|--------|
| **Day 0** (launch) | Full launch candidate checklist + export report |
| **Day 1** | Auth + lesson flow + Vercel/Supabase logs |
| **Day 2** | Progress/quiz saves; guest fallback |
| **Day 3** | Admin CMS edit + activity log |
| **Day 4** | Re-run security audit if any deploy |
| **Day 5** | Production QA sample (public + admin routes) |
| **Day 6** | Review monitoring notes; fix warnings |
| **Day 7** | Launch retrospective; mark Phase 6 complete |

---

## Related

- [GO_LIVE_NOTES.md](./GO_LIVE_NOTES.md)
- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md)
- [PHASE_6_LAUNCH_SUMMARY.md](./PHASE_6_LAUNCH_SUMMARY.md)
- `/admin/launch-candidate`
