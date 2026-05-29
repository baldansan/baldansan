# Phase 5 Final Audit — Buunduu Surtsgaay

**Audit date:** May 2026  
**Status:** Phase 5 **completed** — ready to proceed to Phase 6 Deployment / Production Readiness  
**Interactive checklist:** [`/admin/final-audit`](http://localhost:3000/admin/final-audit) (admin-only, read-only)

---

## Executive summary

Phase 5 delivered a full admin CMS: content editors, import/export, media, analytics, tasks, activity log with rollback/export, and release workflow. Code audit passed; build passes. Remaining **needs check** items are Supabase-side (migrations, RLS, storage bucket) and must be verified per deployment environment.

---

## Completed Phase 5 features

| Area | Features |
|------|----------|
| Access | AdminGuard, `admin_profiles`, admin header link (admins only) |
| Content | Draft create, metadata, subtitle/vocab/quiz editors, bulk import, prompt generator, import QA |
| Backup | JSON export, duplicate, restore with replace confirmation |
| Workflow | Lesson Builder, publish/unpublish/archive, release readiness, approval |
| Media | URL metadata, Supabase Storage upload |
| Analytics | Dashboard, per-lesson, question, vocabulary insights |
| AI assist | Copy-ready improvement prompts (no API) |
| Operations | Task Center, persistent tasks, activity log, diff, rollback, CSV/JSON export |
| Audit | `/admin/final-audit` checklist page |

---

## Routes confirmed (build)

### Public routes

| Route | Status |
|-------|--------|
| `/` | ✅ Built |
| `/courses` | ✅ Built |
| `/courses/hsk5` | ✅ Built — `available` lessons only via `getPublicLessonsByCourseId` |
| `/lessons/1` | ✅ Built |
| `/lessons/1/watch` | ✅ Built |
| `/lessons/1/vocabulary` | ✅ Built |
| `/lessons/1/quiz` | ✅ Built |
| `/lessons/5` | ✅ Built — unavailable UI if draft |
| `/lessons/5?preview=admin` | ✅ Built — admin-only full preview |
| `/lessons/5/watch?preview=admin` | ✅ Built |
| `/lessons/5/vocabulary?preview=admin` | ✅ Built |
| `/lessons/5/quiz?preview=admin` | ✅ Built |
| `/profile` | ✅ Built |
| `/review` | ✅ Built |
| `/login` | ✅ Built |
| `/signup` | ✅ Built |

### Admin routes

| Route | Status |
|-------|--------|
| `/admin` | ✅ Built |
| `/admin/final-audit` | ✅ Built |
| `/admin/lesson-builder` | ✅ Built |
| `/admin/lessons` | ✅ Built |
| `/admin/lessons/new` | ✅ Built |
| `/admin/lessons/5/edit` | ✅ Built |
| `/admin/tasks` | ✅ Built |
| `/admin/activity` | ✅ Built — client session fetch |
| `/admin/activity/[id]` | ✅ Built — detail + diff + rollback |
| `/admin/analytics` | ✅ Built |
| `/admin/analytics/questions` | ✅ Built |
| `/admin/analytics/vocabulary` | ✅ Built |
| `/admin/analytics/lessons/1` | ✅ Built |
| `/admin/analytics/lessons/5` | ✅ Built |
| `/admin/prompts` | ✅ Built |

**Not implemented (Phase 6+):** payments, external notifications, row-level content rollback from backup JSON.

---

## Security audit

| Check | Result |
|-------|--------|
| `service_role` in app code | ✅ Not present (docs only mention avoiding it) |
| Secret keys in repo | ✅ None found |
| `.env.local` tracked | ✅ Gitignored (`.env*`) |
| Env values in console logs | ✅ Removed verbose lesson-access debug logs |
| AdminGuard | ✅ Login required; non-admin denied |
| Admin link | ✅ `AuthStatus` shows only when `isCurrentUserAdmin()` |
| Client auth | ✅ Anon key + JWT only; RLS enforced |

---

## Supabase migrations (run manually in SQL Editor)

Run in order on your Supabase project:

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/migrations/001_initial_schema.sql` | Core tables |
| 2 | `supabase/migrations/002_lesson_media_fields.sql` | Media URL columns |
| 3 | `supabase/migrations/003_lesson_route_status.sql` | Route status RPC |
| 4 | `supabase/migrations/004_admin_lesson_bundle.sql` | Admin lesson fetch RPC |
| 5 | `supabase/migrations/005_grant_is_admin_rpc.sql` | Grant `is_admin()` to authenticated |
| 6 | `supabase/migrations/005_lesson_release_workflow.sql` | Release/QA columns |
| 7 | `supabase/migrations/006_admin_tasks.sql` | Persistent tasks |
| 8 | `supabase/migrations/007_admin_activity_log.sql` | Activity audit trail |
| 9 | `supabase/migrations/008_admin_activity_snapshots.sql` | Before/after snapshots |

**Policies (separate files — review before production):**

- `supabase/policies/001_auth_rls_policies.sql` — user progress RLS
- `supabase/policies/002_admin_content_policies.sql` — admin content write RLS
- `supabase/admin/001_admin_profiles_setup.sql` — admin role table
- `supabase/storage/001_lesson_media_bucket_policies.sql` — `lesson-media` bucket

See [supabase/README.md](./supabase/README.md) and [supabase/workflows/README.md](./supabase/workflows/README.md).

---

## CMS workflow (code inspection)

| Workflow | Implementation | Logging |
|----------|----------------|---------|
| Create draft | `createDraftLesson` | ✅ |
| Edit metadata | `updateLessonMetadata` | ✅ activity log |
| Subtitle CRUD | `admin-content.ts` | ✅ |
| Vocabulary CRUD | `admin-content.ts` | ✅ |
| Quiz CRUD | `admin-content.ts` | ✅ |
| Bulk import append/replace | `bulkImportLessonContent` | ✅ |
| Export JSON | `lesson-export-card` | ✅ |
| Duplicate | `admin-duplicate.ts` | ✅ |
| Restore backup | `admin-restore.ts` | ✅ |
| Publish/unpublish/archive | `updateLessonStatus` | ✅ |
| Release readiness | `release-readiness.ts` + edit UI | ✅ |
| Media URL save | `updateLessonMedia` | ✅ |
| Media upload | `media-upload.ts` | ✅ |
| Task start/resolve/dismiss | `admin-task-persistence.ts` | ✅ |
| Rollback (metadata/media/status/release) | `admin-rollback.ts` + confirmation | ✅ |

---

## Public visibility

- **`/courses/hsk5`** — uses public lesson query; draft/archived hidden
- **`/lessons/{id}`** without preview — unavailable for non-`available` status
- **`?preview=admin`** — requires admin RLS/RPC; non-admin gets access denied
- **Learner progress** — unchanged; rollback does not touch `user_*` tables

---

## Activity log note

Activity **writes** and **reads** on `/admin/activity`, dashboard preview, and lesson edit card use the **browser Supabase session** (`createBrowserClient`). Server-side activity fetch may return empty without cookie session — UI uses client fetch by design.

---

## Known limitations

1. **Supabase manual setup** — migrations and RLS must be applied per environment; not automated in CI yet
2. **Server-side activity on SSR pages** — dashboard server props may be empty; client loader fills data after mount
3. **Row-level content rollback** — subtitle/vocab/quiz not rollbackable; use lesson export JSON manually
4. **Analytics learner metrics** — depend on RLS; show warnings when policies not applied
5. **No payment / external notifications** — out of Phase 5 scope

---

## Fixes applied during this audit

1. Activity log client-side fetch on `/admin/activity`, dashboard, lesson edit card
2. Browser Supabase client upgraded to `@supabase/ssr` `createBrowserClient`
3. Removed verbose `console.warn` debug logging from `lesson-public-access.ts`
4. Updated `/admin/final-audit` checklist with accurate statuses and migration list
5. Documentation updated for Phase 5 completion

---

## Recommended Phase 6 first step

**Deployment / Production Readiness:**

1. Create production Supabase project (or promote staging)
2. Run migrations 001–008 + policies + admin bootstrap + storage in order
3. Deploy Next.js app with `NEXT_PUBLIC_SUPABASE_URL` and anon key only
4. Smoke-test: public `/courses/hsk5`, admin Lesson 5 edit → activity → rollback
5. Verify RLS blocks non-admin writes and non-owner progress reads

---

## Related docs

- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — Phase 5 closed, Phase 6 next
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
- [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md)
- [ADMIN_AUDIT_EXPORT.md](./ADMIN_AUDIT_EXPORT.md)
- [PROJECT_CHECKPOINT.md](./PROJECT_CHECKPOINT.md)
