# Admin plan — Buunduu Surtsgaay (Phase 5)

Admin content management: plan, UI foundation, and future Supabase writes with RLS.

**Phase 5 Step 1 — Completed:** Admin foundation (UI shell, read-only forms).  
**Phase 5 Step 2 — Completed:** `admin_profiles` + `AdminGuard`.  
**Phase 5 Step 3 — Completed:** Lesson Management QA dashboard + edit previews.  
**Phase 5 Step 4 — Completed:** Draft lesson metadata create (`/admin/lessons/new` → Supabase `lessons`). Subtitle/vocab/quiz writes not yet.

---

## Why admin content management is needed

Lesson content is **seeded by SQL** and **read from Supabase** (with local fallback). Editors cannot safely add or fix subtitles, vocabulary, or quiz rows without developer access and deploy coordination.

**Goal:** Create, edit, and publish lessons from an admin UI — no code deploy for DB-backed lessons.

---

## Current state

| Area | Today |
|------|--------|
| Content source | `supabase/seed/*.sql` + optional `content/courses/hsk5/lessons/*.ts` |
| Learner app | Supabase-first read via [lib/content.ts](./lib/content.ts) |
| Progress | Phase 4 — auth + `user_*` tables + localStorage |
| Admin UI | `/admin` shell, lesson list (read), form skeletons (no write) |
| Admin role | `admin_profiles` + `AdminGuard`; header Admin link for admins only |

---

## Admin role concept

**Option A (chosen):** `admin_profiles` table — `user_id` → `auth.users`, `role` default `'admin'`.

- Manual bootstrap: [supabase/admin/README.md](./supabase/admin/README.md)
- RLS plan: [supabase/policies/002_admin_content_policies.sql](./supabase/policies/002_admin_content_policies.sql)
- App gate: Step 2 — check `admin_profiles` before showing write actions

**Never** use `service_role` in the Next.js client.

---

## Admin dashboard sections

| Section | Route | Status |
|---------|-------|--------|
| Dashboard | `/admin` | Shell + cards |
| Lesson list | `/admin/lessons` | Read from `getLessonsByCourseId("hsk5")` |
| New lesson | `/admin/lessons/new` | Form skeleton, save disabled |
| Edit lesson | `/admin/lessons/[id]/edit` | Load lesson, save disabled |
| Subtitles | TBD | Step 5 |
| Vocabulary | TBD | Step 6 |
| Quiz | TBD | Step 7 |

Logged-out users see login prompt. Logged-in non-admins see access denied. Admins see full admin UI.

---

## Lesson content workflow

See [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md):

1. Create lesson metadata (draft)
2. Add subtitle lines
3. Add vocabulary words
4. Add quiz questions
5. Preview lesson
6. Publish (`available`)
7. Verify `/courses/hsk5` and `/lessons/{id}`
8. Archive when retiring

**Statuses:** `draft`, `available`, `archived` (DB migration in Step 2; today `locked` maps to draft in admin UI).

---

## Security warnings

- No content `INSERT`/`UPDATE`/`DELETE` from client until RLS + admin role verified
- Anon key only in browser; admin writes use authenticated JWT + policies
- Do not commit `.env.local` or `service_role`
- Public learner routes must keep working unchanged
- Apply `002` policies only after review; may replace `001` public `SELECT (true)` with status-filtered reads

---

## Phase 5 roadmap

| Step | Focus | Status |
|------|--------|--------|
| 1 | Admin foundation and dashboard shell | ✅ Completed |
| 2 | Admin role table + manual admin setup + protected `/admin` | ✅ Completed |
| 3 | Admin lesson list + content QA dashboard | ✅ Completed |
| 4 | Lesson create draft write | ✅ Completed |
| 5 | Subtitle editor | Next |
| 6 | Vocabulary editor | Planned |
| 7 | Quiz editor | Planned |
| 8 | Publish/unpublish workflow | Planned |
| 9 | Phase 5 final audit | Planned |

Step 3: [lib/admin/lesson-qa.ts](./lib/admin/lesson-qa.ts), `/admin/lessons` QA dashboard.

**Exit criteria:** New lesson published via admin without SQL seeds or app deploy.

---

## Related files

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md)
- [supabase/admin/README.md](./supabase/admin/README.md)
- [supabase/policies/002_admin_content_policies.sql](./supabase/policies/002_admin_content_policies.sql)
- `app/admin/` — routes
- `components/admin/admin-guard.tsx` — login + admin gate
- `lib/supabase/admin.ts` — `isCurrentUserAdmin()`, profile fetch
- `supabase/admin/001_admin_profiles_setup.sql` — run in Supabase SQL Editor
