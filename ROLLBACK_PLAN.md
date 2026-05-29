# Rollback Plan — Buunduu Surtsgaay

Emergency and planned rollback procedures for production.

**Production URL:** https://baldansan.vercel.app

---

## Vercel rollback (fastest)

Use when the **app code or env** caused a bad deploy.

1. Open [Vercel Dashboard](https://vercel.com) → project → **Deployments**
2. Find the last **stable** production deployment
3. Click **⋯** → **Promote to Production** (or **Redeploy** that commit)
4. Verify `/deployment-check` and `/login` on production URL
5. Re-run `/admin/launch-candidate` smoke test

Typical recovery time: minutes.

---

## Git rollback

Use when a bad merge reached `main` and you need a code fix.

1. Identify the bad commit or PR merge
2. `git revert <commit>` on a hotfix branch (preferred over force-push)
3. Push and let Vercel deploy the revert
4. Or redeploy a known-good commit from Vercel Deployments

**Do not** force-push `main` unless explicitly approved.

---

## Supabase rollback warning

**Database schema migrations are not automatically reversible.**

- Migrations 001–008 add columns, tables, and functions
- Rolling back app code does **not** undo schema changes
- Before destructive CMS changes, export lesson JSON backups

If a migration caused issues:

1. Restore from Supabase **Point-in-Time Recovery** (if enabled on your plan)
2. Or manually run compensating SQL (review with care)
3. Never drop production tables without backup

---

## Content rollback

| Action | Tool |
|--------|------|
| Single lesson metadata/media/status | Activity log → safe rollback ([ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md)) |
| Full lesson content | Re-import from JSON export backup |
| Bulk mistake | Restore from export; use replace mode only with confirmation |

Before bulk replace or delete: **export JSON** from `/admin/lessons/{id}/edit`.

---

## Emergency checklist

- [ ] Identify scope: app only, content, or database
- [ ] Vercel: promote previous deployment if app regression
- [ ] Supabase: check Auth URL config if login broken (may not need rollback)
- [ ] Export current lesson state if content may be lost
- [ ] Notify team; document incident in launch report notes
- [ ] After recovery: re-run `/admin/security-audit` and `/admin/launch-candidate`

---

## Post-rollback verification

1. `/deployment-check` — pass
2. `/courses/hsk5` — available lessons only
3. `/admin/system-check` — no **fail**
4. Auth login/logout on production URL
5. Update launch decision to **needs review** until root cause documented

---

## Related

- [GO_LIVE_NOTES.md](./GO_LIVE_NOTES.md)
- [POST_LAUNCH_MONITORING.md](./POST_LAUNCH_MONITORING.md)
- [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md)
