# Production Launch Sign-off — Buunduu Surtsgaay

**Purpose:** Record the final go/no-go decision before controlled production launch.

**Production URL:** https://baldansan.vercel.app  
**Sign-off dashboard:** [`/admin/launch-signoff`](/admin/launch-signoff)

---

## Who should complete it

| Role | Responsibility |
|------|----------------|
| **Project owner / admin** | Run checklist on production, record decision |
| **Technical reviewer** | Confirm Supabase, Vercel, and security checks |
| **Content owner** | Confirm published lessons and CMS readiness |

Complete sign-off **after** `/admin/launch-candidate` smoke test and **before** announcing go-live.

---

## Required checks

1. Complete `/admin/launch-candidate` — export launch candidate report
2. Open `/admin/launch-signoff` — mark all 18 checklist rows
3. Set summary cards (deployment, Supabase, auth, CMS, security, launch decision)
4. Review [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) and [POST_LAUNCH_MONITORING.md](./POST_LAUNCH_MONITORING.md)
5. Fill version label, owner, launch notes, known issues
6. Record go/no-go decision and export sign-off report

---

## Decision definitions

| Decision | Meaning |
|----------|---------|
| **not_decided** | Sign-off in progress — no launch yet |
| **go_live** | All blockers resolved; approved for controlled launch |
| **needs_review** | Warnings or open items — stakeholder review required |
| **blocked** | Fail items or critical issues — do not launch |

---

## Export report

On `/admin/launch-signoff`:

- **Save sign-off** — persists to localStorage (`buunduu-launch-signoff`)
- **Copy sign-off report** — Markdown for PR/issue/archive
- **Download JSON / Markdown** — attach to launch record

Reports include production URL, version, owner, decision, checklist status, notes, and recommended next action. **No secrets** are included.

---

## After go_live

1. Follow [GO_LIVE_NOTES.md](./GO_LIVE_NOTES.md) launch-day checklist
2. Begin [POST_LAUNCH_MONITORING.md](./POST_LAUNCH_MONITORING.md) Day 0 routine
3. Re-run `/deployment-check` after any hotfix deploy
4. Update sign-off if decision changes (e.g. blocked after incident)

---

## Rollback reference

If issues appear after launch, see [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md):

- **Vercel:** Promote previous stable deployment
- **Git:** Revert commit on hotfix branch
- **Supabase:** Schema not auto-reversible — use lesson export backups
- **Content:** Activity rollback for supported admin actions

Review rollback plan **before** marking **go_live**.

---

## Related

- [GO_LIVE_NOTES.md](./GO_LIVE_NOTES.md)
- [LAUNCH_CANDIDATE_CHECKLIST.md](./LAUNCH_CANDIDATE_CHECKLIST.md)
- [PHASE_6_LAUNCH_SUMMARY.md](./PHASE_6_LAUNCH_SUMMARY.md)
- `/admin/launch-candidate`
