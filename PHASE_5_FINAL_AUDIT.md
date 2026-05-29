# Phase 5 Final Audit — Buunduu Surtsgaay

Summary of Phase 5 admin CMS systems for production-style readiness review. Interactive checklist: **`/admin/final-audit`** (admin-only, read-only).

**Phase 5 Mega Batch:** production CMS hardening, safe rollback, audit export, and final audit page.

---

## A. Admin access

| Item | Status | Route / doc |
|------|--------|-------------|
| AdminGuard on `/admin/*` | Ready | [components/admin/admin-guard.tsx](./components/admin/admin-guard.tsx) |
| `admin_profiles` table + bootstrap | Needs check in Supabase | [supabase/admin/README.md](./supabase/admin/README.md) |
| Admin role in app | Ready | [lib/supabase/admin.ts](./lib/supabase/admin.ts) |

---

## B. Content management

| Item | Status | Route |
|------|--------|-------|
| Draft lesson creation | Ready | `/admin/lessons/new` |
| Metadata edit/save | Ready | `/admin/lessons/{id}/edit` |
| Subtitle editor | Ready | Edit page |
| Vocabulary editor | Ready | Edit page |
| Quiz editor | Ready | Edit page |
| Bulk JSON import | Ready | Edit page |
| Export backup | Ready | Edit page |
| Duplicate / restore | Ready | Edit page |

Docs: [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md), [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md), [LESSON_BACKUP_RESTORE.md](./LESSON_BACKUP_RESTORE.md)

---

## C. Release workflow

| Item | Status | Route |
|------|--------|-------|
| QA readiness checklist | Ready | Edit page |
| Approval controls | Ready | Edit page |
| Publish / unpublish / archive | Ready | Edit page |
| Public visibility (`available` only) | Ready | `/courses/hsk5`, `/lessons/{id}` |
| Admin preview (`?preview=admin`) | Ready | `/lessons/{id}?preview=admin` |

Doc: [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md)

---

## D. Media

| Item | Status | Notes |
|------|--------|-------|
| Media URL fields | Ready | Edit page media editor |
| Storage bucket `lesson-media` | Needs check in Supabase | [supabase/storage/README.md](./supabase/storage/README.md) |
| Upload + URL paste | Ready | [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md) |
| Public display | Ready | Lesson detail + watch |

---

## E. Analytics

| Item | Status | Route |
|------|--------|-------|
| Admin analytics dashboard | Ready | `/admin/analytics` |
| Per-lesson analytics | Ready | `/admin/analytics/lessons/{id}` |
| Question analytics | Ready | `/admin/analytics/questions` |
| Vocabulary analytics | Ready | `/admin/analytics/vocabulary` |

Docs: [ADMIN_ANALYTICS.md](./ADMIN_ANALYTICS.md), [ADMIN_LEARNING_ANALYTICS.md](./ADMIN_LEARNING_ANALYTICS.md)

---

## F. Operations

| Item | Status | Route |
|------|--------|-------|
| Task Center (generated tasks) | Ready | `/admin/tasks` |
| Persistent tasks (006 migration) | Needs check | `/admin/tasks` |
| Activity log (007 migration) | Needs check | `/admin/activity` |
| Snapshots + diff (008 migration) | Needs check | `/admin/activity/{id}` |
| Rollback preview + execution | Ready | `/admin/activity/{id}` |
| CSV / JSON export | Ready | `/admin/activity` |
| Guided Lesson Builder | Ready | `/admin/lesson-builder` |

Docs: [ADMIN_TASK_CENTER.md](./ADMIN_TASK_CENTER.md), [ADMIN_TASK_MANAGEMENT.md](./ADMIN_TASK_MANAGEMENT.md), [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md), [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md), [ADMIN_AUDIT_EXPORT.md](./ADMIN_AUDIT_EXPORT.md)

---

## G. Security

| Item | Status | Notes |
|------|--------|-------|
| `.env.local` gitignored | Ready | Never commit secrets |
| Anon key only in client | Ready | No `service_role` in app |
| RLS on content + progress | Needs check | [supabase/policies/](./supabase/policies/) |
| Admin content policies | Needs check | `002_admin_content_policies.sql` |
| No secret keys in repo | Ready | Review before deploy |

---

## Migrations checklist (Supabase SQL Editor)

Run in order when setting up or auditing:

1. `001_initial_schema.sql`
2. `002_lesson_media_fields.sql`
3. `005_lesson_release_workflow.sql`
4. `006_admin_tasks.sql`
5. `007_admin_activity_log.sql`
6. `008_admin_activity_snapshots.sql`
7. Auth RLS: `supabase/policies/001_auth_rls_policies.sql`
8. Admin policies: `supabase/policies/002_admin_content_policies.sql`
9. Storage: `supabase/storage/001_lesson_media_bucket_policies.sql`

---

## Recommended manual test (Lesson 5)

1. Edit metadata → verify activity log + diff
2. Execute rollback → verify restore + `rollback_executed` row
3. Export CSV/JSON from filtered activity view
4. Publish gate + `/lessons/5?preview=admin`
5. Task center + dashboard production safety section

---

## Remaining future improvements

- Row-level subtitle/vocabulary/quiz rollback from backup JSON
- Assign tasks to specific admins (`assigned_to`)
- External notifications (email/Slack) — out of scope for Phase 5
- Phase 6 — deployment / production readiness / payments (separate phase)

---

## Related docs

- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — roadmap
- [PROJECT_CHECKPOINT.md](./PROJECT_CHECKPOINT.md) — checkpoint history
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 plan
