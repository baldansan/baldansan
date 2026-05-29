# Vercel Deployment Guide — Buunduu Surtsgaay

Step-by-step guide to deploy the Next.js app to Vercel. **Complete Supabase setup first** — see [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md).

---

## Prerequisites

- GitHub repository with the Buunduu Surtsgaay codebase
- Supabase project with migrations and policies applied
- Supabase **Project URL** and **anon public** key (not `service_role`)

---

## 1. Connect GitHub to Vercel

1. Sign in to [vercel.com](https://vercel.com).
2. **Add New Project** → Import your GitHub repository.
3. Select the branch to deploy (e.g. `main` or your feature branch after merge).

---

## 2. Configure project

| Setting | Value |
|---------|--------|
| Framework Preset | **Next.js** (auto-detected) |
| Root Directory | `.` (repo root) |
| Build Command | `npm run build` |
| Output Directory | (default — Next.js handles this) |
| Install Command | `npm install` |

---

## 3. Environment variables

In **Project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key | Production, Preview |

**Do not add** `SUPABASE_SERVICE_ROLE_KEY` or any service role key to Vercel for this app.

---

## 4. Deploy

1. Click **Deploy**.
2. Wait for build to complete.
3. Open the deployment URL (e.g. `https://buunduu-surtsgaay.vercel.app`).

---

## 5. Check deployment logs

- Build tab: confirm `npm run build` succeeded
- Functions/routes: no runtime errors on first load
- Visit `/`, `/courses/hsk5`, `/login`, `/admin` (as admin)

---

## 6. Configure Supabase Auth (after first deploy)

In Supabase Dashboard → **Authentication → URL Configuration**:

| Field | Example |
|-------|---------|
| **Site URL** | `https://your-app.vercel.app` |
| **Redirect URLs** | `https://your-app.vercel.app/**`, `http://localhost:3000/**` |

Save and test signup/login on the production URL.

---

## 7. Custom domain (optional, later)

1. Vercel → Project → **Domains** → Add domain.
2. Follow DNS instructions.
3. Update Supabase **Site URL** and **Redirect URLs** to the custom domain.

---

## 8. Post-deploy verification

- [ ] [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — public + admin routes
- [ ] `/admin/system-check` — env and Supabase checks pass
- [ ] Published lesson visible on `/courses/hsk5`
- [ ] Draft lesson hidden from public

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Run `npm run build` locally; fix TypeScript errors |
| Blank Supabase data | Verify env vars in Vercel; redeploy after adding |
| Auth redirect loop | Add production URL to Supabase Redirect URLs |
| Admin 403 / empty data | Apply RLS policies; add `admin_profiles` row |
| Activity log empty on server | Expected — activity reads use browser session; open `/admin/activity` while signed in |

---

## Related docs

- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
- [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md)
