# Production Route Testing — Buunduu Surtsgaay

Phase 6 Step 4: verify the live Vercel deployment after every production deploy.

**Production URL:** https://baldansan.vercel.app

---

## Why production route testing matters

Local development and automated builds cannot fully confirm:

- Vercel env vars are set correctly in production
- Supabase Auth redirect URLs match the live domain
- Public RLS policies allow learner reads on production
- Admin CMS workflows work with production Supabase + Storage
- Draft lessons stay hidden from public catalog on the live URL

Run route testing **after each production deploy** before announcing launch or merging release branches.

---

## Three verification layers

| Tool | Who | What it checks |
|------|-----|----------------|
| [`/deployment-check`](/deployment-check) | Public (no login) | App loads; Supabase env present; public courses/lessons readable |
| [`/admin/system-check`](/admin/system-check) | Admin | Env, auth session, admin role, content/admin tables, storage |
| [`/admin/production-qa`](/admin/production-qa) | Admin | Full manual checklist + exportable launch report |

Use all three together. Automated checks catch connectivity; manual QA catches UX and workflow issues.

---

## How to use `/deployment-check`

1. Open https://baldansan.vercel.app/deployment-check
2. Confirm **App rendered** = pass
3. Confirm **Supabase URL / anon key configured** = pass (not warn)
4. Confirm **public courses** and **HSK5 available lessons** = pass or warn (review if warn)
5. No env values or keys are shown — by design

---

## How to use `/admin/system-check`

1. Sign in as admin on production
2. Open https://baldansan.vercel.app/admin/system-check
3. Fix any **fail** rows before launch
4. Review **warn** rows (empty tables, missing lesson 5, etc.)
5. Run [supabase/verify/production_verification.sql](./supabase/verify/production_verification.sql) in Supabase SQL Editor and cross-check

---

## How to use `/admin/production-qa`

1. Sign in as admin (local or production)
2. Open `/admin/production-qa`
3. Use **Open on production** links for each route
4. Mark each item: **not checked** → **pass** / **warning** / **fail**
5. Add notes for failures or known issues
6. Click **Save checklist** (persists in browser localStorage)
7. Export **JSON** or **Markdown** report for your launch record

Checklist sections:

- **Public routes** — learner pages
- **v1.0 learner launch** — public route, auth, progress, mobile, draft visibility, blockers
- **Admin routes** — CMS and analytics
- **Auth** — login, logout, admin guard, Supabase redirects
- **Supabase** — reads, progress, tasks, activity, storage
- **CMS workflow** — create, edit, import, media, publish, activity, tasks, rollback

---

## Routes to check after each deploy

**Public (minimum):**

- `/`, `/deployment-check`, `/courses/hsk5`, `/lessons/1`, `/login`

**Admin (minimum):**

- `/admin`, `/admin/system-check`, `/admin/production-qa`, `/admin/lessons`

**Auth:**

- Signup/login on production URL after Supabase Redirect URLs updated

---

## Export QA report

From `/admin/production-qa`:

- **Copy QA report (JSON)** — machine-readable summary
- **Copy Markdown report** — paste into docs or PR
- **Download JSON / Markdown** — attach to launch record

See [LAUNCH_QA_REPORT_TEMPLATE.md](./LAUNCH_QA_REPORT_TEMPLATE.md) for a manual template.

---

## Launch blockers

A checklist item marked **fail** is a launch blocker until resolved.

**Warning** or **not checked** items mean **needs review** — acceptable for soft launch only if documented.

Launch recommendation in the report:

| Status | Meaning |
|--------|---------|
| **ready** | All items pass |
| **needs review** | Warnings or unchecked items remain |
| **blocked** | One or more fail items |

---

## Related docs

- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
- [supabase/verify/README.md](./supabase/verify/README.md)
