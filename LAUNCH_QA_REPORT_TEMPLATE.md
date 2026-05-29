# Launch QA Report Template

Copy this template for manual launch records or use the auto-generated Markdown from `/admin/production-qa`.

---

## Production URL

https://baldansan.vercel.app

## Date / time

YYYY-MM-DD HH:MM (timezone)

## Build / deployment status

- [ ] Vercel production deploy succeeded
- [ ] Build logs reviewed (no TypeScript errors)
- [ ] Commit / branch: _______________
- [ ] `/deployment-check` — pass (no fail)

---

## Public routes

| Route | Status | Notes |
|-------|--------|-------|
| `/` | pass / warn / fail | |
| `/deployment-check` | | |
| `/courses/hsk5` | | |
| `/lessons/1` | | |
| `/login` | | |
| `/profile` (signed in) | | |

---

## Auth routes

| Check | Status | Notes |
|-------|--------|-------|
| Signup page opens | | |
| Login page opens | | |
| Admin login works | | |
| Logout works | | |
| Admin blocked when logged out | | |
| Supabase Redirect URLs configured | | |

---

## Admin routes

| Route | Status | Notes |
|-------|--------|-------|
| `/admin` | | |
| `/admin/system-check` | | |
| `/admin/production-qa` | | |
| `/admin/lessons` | | |
| `/admin/activity` | | |

---

## Supabase checks

| Check | Status | Notes |
|-------|--------|-------|
| Production verification SQL (no fail) | | |
| Public content read | | |
| Admin profile / RLS | | |
| Storage bucket lesson-media | | |
| Auth Site URL = production domain | | |

---

## CMS workflow checks

| Check | Status | Notes |
|-------|--------|-------|
| Create draft lesson | | |
| Edit metadata | | |
| Bulk import JSON | | |
| Media upload | | |
| Publish / unpublish | | |
| Activity log entry | | |
| Task dismiss / resolve | | |

---

## Known issues

_List any warnings, deferred items, or non-blocking issues._

1.
2.

---

## Launch decision

- [ ] **Ready** — all critical checks pass
- [ ] **Needs review** — warnings documented
- [ ] **Blocked** — fail items must be fixed

**Decision:** ready / needs review / blocked

**Signed off by:** _______________

**Next steps:** _______________

---

Auto-generate a filled report from [`/admin/production-qa`](/admin/production-qa) → Download Markdown report.

See [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md).
