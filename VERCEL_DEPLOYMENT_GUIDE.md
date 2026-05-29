# Vercel Deployment Guide — Buunduu Surtsgaay

Step-by-step guide to deploy the Next.js app to Vercel. **Complete Supabase setup first** — see [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md) and run [supabase/verify/production_verification.sql](./supabase/verify/production_verification.sql).

**This guide prepares manual deployment.** The repo does not auto-deploy from code.

---

## Prerequisites

- GitHub repository with the Buunduu Surtsgaay codebase
- Supabase project with migrations and policies applied
- Supabase **Project URL** and **anon public** key (not `service_role`)
- Local `npm run build` passes

---

## A. Create Vercel project

1. Sign in to [vercel.com](https://vercel.com).
2. **Add New Project** → Import your GitHub repository.
3. Select the branch to deploy (e.g. `main` after merge, or your release branch).

### Configure project

| Setting | Value |
|---------|--------|
| Framework Preset | **Next.js** (auto-detected; also set in `vercel.json`) |
| Root Directory | `.` (repo root) |
| Build Command | `npm run build` |
| Output Directory | (default — Next.js handles this) |
| Install Command | `npm install` |

---

## B. Add environment variables

In **Project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key | Production, Preview |

Copy variable **names** from [.env.example](./.env.example). Paste real values from Supabase Dashboard → Settings → API.

**Do not add** `SUPABASE_SERVICE_ROLE_KEY` or any service role key to Vercel for this app.

---

## C. Deploy

1. Click **Deploy**.
2. Wait for build to complete (`npm run build` in Vercel logs).
3. Open the deployment URL (e.g. `https://buunduu-surtsgaay.vercel.app`).

Check deployment logs:

- Build tab: confirm TypeScript and route compilation succeeded
- No runtime errors on first load

---

## D. After deploy — Supabase Auth URL configuration

Copy your **Vercel production URL** (e.g. `https://your-app.vercel.app`).

In Supabase Dashboard → **Authentication → URL Configuration**:

| Field | Value |
|-------|--------|
| **Site URL** | `https://your-app.vercel.app` |
| **Redirect URLs** | Add each line below (adjust domain): |

Suggested Redirect URLs:

```
https://your-app.vercel.app
https://your-app.vercel.app/**
https://your-app.vercel.app/login
https://your-app.vercel.app/profile
http://localhost:3000/**
http://localhost:3000/login
http://localhost:3000/profile
```

Save. Auth signup/login will fail with redirect errors until these are set.

See also [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md) — section 5 (Auth settings).

---

## E. Post-deploy verification

Run these checks on the **production URL**:

| Route | Purpose |
|-------|---------|
| `/deployment-check` | Public smoke test — env configured, courses/lessons readable |
| `/login` | Auth page loads; sign-in works after Redirect URLs set |
| `/courses/hsk5` | Available lessons only (drafts hidden) |
| `/lessons/1` | Public lesson detail |
| `/admin/system-check` | Admin env + Supabase checks (sign in as admin first) |
| `/admin/production-qa` | Manual launch QA checklist + export (sign in as admin) |

After deployment, run **`/deployment-check`** and **`/admin/production-qa`**. See [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md).

Also verify:

- [ ] [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — Vercel + public + admin sections
- [ ] Published lesson visible on `/courses/hsk5`
- [ ] Draft lesson hidden from public catalog
- [ ] `/admin/system-check` — no **fail** rows (review **warn**)

---

## F. Custom domain (optional, later)

1. Vercel → Project → **Domains** → Add domain.
2. Follow DNS instructions until domain is verified.
3. Update Supabase **Site URL** to the custom domain.
4. Add custom domain Redirect URLs (same pattern as section D):
   - `https://your-domain.com`
   - `https://your-domain.com/**`
   - `https://your-domain.com/login`
   - `https://your-domain.com/profile`
5. Re-test `/deployment-check`, `/login`, `/admin/system-check`, and `/admin/production-qa`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Run `npm run build` locally; fix TypeScript errors |
| Blank Supabase data | Verify env vars in Vercel; redeploy after adding |
| `/deployment-check` shows warn for env | Add `NEXT_PUBLIC_*` vars in Vercel; redeploy |
| Auth redirect loop | Add production URL to Supabase Redirect URLs |
| Admin 403 / empty data | Apply RLS policies; add `admin_profiles` row |
| Activity log empty on server | Expected — activity reads use browser session; open `/admin/activity` while signed in |

---

## Repo deployment files

| File | Purpose |
|------|---------|
| [vercel.json](./vercel.json) | Minimal Next.js framework hint |
| [.env.example](./.env.example) | Safe env variable template (no real values) |
| `/deployment-check` | Public post-deploy smoke test route |

---

## Related docs

- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md)
- [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md)
- [LAUNCH_QA_REPORT_TEMPLATE.md](./LAUNCH_QA_REPORT_TEMPLATE.md)
