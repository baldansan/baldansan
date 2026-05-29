# Deployment Plan — Buunduu Surtsgaay

Phase 6 Step 1: production readiness planning. **Do not deploy until checklists are complete.**

---

## A. Deployment target

| Layer | Recommendation |
|-------|----------------|
| **Web app** | [Vercel](https://vercel.com) — Next.js 16 App Router, zero-config |
| **Database / Auth / Storage** | [Supabase](https://supabase.com) — Postgres, Auth, Storage, RLS |
| **Custom domain** | Optional — add in Vercel after first deploy |

Local fallback for lessons 1–3 remains when Supabase env is unset (development only).

---

## B. Required environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (production) | Project URL from Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (production) | **Anon public** key only |

### Security rules

- **`service_role` key must NOT** be used in the browser, Next.js client bundles, or committed files.
- **`.env.local`** stays on your machine only — never commit (gitignored via `.env*`).
- **Vercel:** set env vars in Project → Settings → Environment Variables (Production + Preview as needed).
- Copy from [.env.example](./.env.example) for local dev.

---

## C. Supabase production checklist

Run in **Supabase SQL Editor** in order:

| # | Migration | Purpose |
|---|-----------|---------|
| 1 | [001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql) | Core tables |
| 2 | [002_lesson_media_fields.sql](./supabase/migrations/002_lesson_media_fields.sql) | Media URL columns |
| 3 | [003_lesson_route_status.sql](./supabase/migrations/003_lesson_route_status.sql) | Route status RPC |
| 4 | [004_admin_lesson_bundle.sql](./supabase/migrations/004_admin_lesson_bundle.sql) | Admin lesson fetch |
| 5 | [005_grant_is_admin_rpc.sql](./supabase/migrations/005_grant_is_admin_rpc.sql) | Grant `is_admin()` to authenticated |
| 6 | [005_lesson_release_workflow.sql](./supabase/migrations/005_lesson_release_workflow.sql) | Release/QA columns |
| 7 | [006_admin_tasks.sql](./supabase/migrations/006_admin_tasks.sql) | Persistent admin tasks |
| 8 | [007_admin_activity_log.sql](./supabase/migrations/007_admin_activity_log.sql) | Activity audit trail |
| 9 | [008_admin_activity_snapshots.sql](./supabase/migrations/008_admin_activity_snapshots.sql) | Before/after snapshots |

**Policy files (review before production):**

- [supabase/policies/001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql) — user progress RLS
- [supabase/policies/002_admin_content_policies.sql](./supabase/policies/002_admin_content_policies.sql) — admin content write RLS

**Manual setup:**

- [supabase/admin/001_admin_profiles_setup.sql](./supabase/admin/001_admin_profiles_setup.sql) — create admin user row

**Verify:**

- `user_lesson_progress`, `user_vocabulary_progress`, `user_quiz_attempts`
- `admin_tasks`
- `admin_activity_log`
- `admin_profiles` row for your admin email

See [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md).

---

## D. Supabase Storage checklist

| Item | Action |
|------|--------|
| Bucket name | `lesson-media` |
| Public read | Enabled for learner media URLs |
| Admin upload | Policies from [001_lesson_media_bucket_policies.sql](./supabase/storage/001_lesson_media_bucket_policies.sql) |
| Test | Upload thumbnail on `/admin/lessons/{id}/edit` |
| Test | Public lesson page shows thumbnail/video URL |

---

## E. Auth checklist

| Item | Recommendation |
|------|----------------|
| Email provider | Enabled in Supabase Auth |
| Email confirmation | **ON** for production; OFF only for local testing |
| Site URL | Set to production domain after Vercel deploy |
| Redirect URLs | Add `https://your-domain.com/**` and localhost for dev |
| Sign up / login | Test `/signup`, `/login`, `/profile` |

---

## F. Public route checklist

After deploy, smoke-test:

- `/` — home
- `/courses` — catalog
- `/courses/hsk5` — available lessons only
- `/lessons/1` — lesson detail
- `/lessons/1/watch`, `/vocabulary`, `/quiz`
- `/profile` — signed-in dashboard
- `/review` — learned words
- `/login`, `/signup`

Draft lessons must **not** appear on `/courses/hsk5` without admin preview.

---

## G. Admin route checklist

Requires admin login + `admin_profiles` row:

- `/admin` — dashboard
- `/admin/system-check` — runtime readiness
- `/admin/final-audit` — Phase 5 checklist
- `/admin/lesson-builder`
- `/admin/lessons`, `/admin/lessons/new`, `/admin/lessons/5/edit`
- `/admin/tasks`, `/admin/activity`, `/admin/analytics`, `/admin/prompts`

---

## H. Security checklist

- [ ] `.env.local` gitignored
- [ ] No `service_role` key in repo or client code
- [ ] No secrets logged to console
- [ ] Admin pages behind `AdminGuard`
- [ ] Draft lessons hidden from public catalog
- [ ] `?preview=admin` restricted to admins
- [ ] RLS policies applied and tested
- [ ] Storage policies applied

---

## I. Build checklist

```bash
npm run build
```

- [ ] No TypeScript errors
- [ ] All routes compile
- [ ] App starts without env (local fallback for lessons 1–3)
- [ ] App works with Supabase env configured

---

## J. Release checklist

- [ ] [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md) reviewed
- [ ] Production Supabase schema synced (migrations + policies)
- [ ] Admin account in `admin_profiles`
- [ ] One draft lesson tested (hidden from public)
- [ ] One published (`available`) lesson tested on `/courses/hsk5`
- [ ] Media upload + public display tested
- [ ] Auth signup/login tested
- [ ] Progress tracking tested (lesson, vocab, quiz)
- [ ] `/admin/system-check` mostly green

---

## K. Known limitations

- **No payment** — Phase 7 (future)
- **No native mobile app** — Phase 8 (future)
- **No video transcoding/CDN** — use external URLs or Supabase Storage as-is
- **No team admin roles** beyond `admin` / `owner` in `admin_profiles`
- **Analytics** depend on authenticated user activity + RLS
- **Guest progress** sync requires login via Profile merge card

---

## Related docs

- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — checkbox checklist
- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
- [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md)
- [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md)
