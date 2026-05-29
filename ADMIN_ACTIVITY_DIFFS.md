# Admin Activity Diffs — Buunduu Surtsgaay

Phase 5 Step 25–26: before/after snapshots, field-level diff preview, and **safe rollback execution** for supported actions on the admin activity log.

**Phase 5 Mega Batch:** production CMS hardening, safe rollback, audit export, and final audit page.

---

## What before/after snapshots are

When certain admin actions run, the app captures shallow JSON snapshots:

| Column | Purpose |
|--------|---------|
| `before_snapshot` | Entity state immediately before the change |
| `after_snapshot` | Entity state immediately after the change |
| `diff_summary` | Precomputed field names that changed, were added, or removed |

Snapshots are stored on the same `admin_activity_log` row as the action. They are **not** full database dumps — only the fields relevant to that action (metadata, media URLs, status, release fields, content counts, etc.).

Migration: [supabase/migrations/008_admin_activity_snapshots.sql](./supabase/migrations/008_admin_activity_snapshots.sql)

---

## Which actions capture snapshots

| Action area | Snapshot content |
|-------------|------------------|
| `lesson_metadata_updated` | Title, Chinese title, status, order, counts, etc. |
| `media_updated` / `media_cleared` | Video, thumbnail, audio URLs, media status |
| `lesson_published` / `lesson_unpublished` / `lesson_archived` / status changes | Public `status` + `releaseStatus` when available |
| `release_status_updated` / `qa_status_updated` / `lesson_approved` / `release_notes_updated` | Release workflow fields |
| `bulk_import_completed` | Subtitle/vocab/quiz counts before and after |
| `backup_restored` | Content counts before and after restore |
| `lesson_duplicated` | Source lesson counts → new target lesson summary |

If a snapshot fetch fails, the main admin action still completes and the activity row is logged **without** snapshots (best-effort).

---

## How diff preview works

1. Open `/admin/activity` and click an event (or open `/admin/activity/{id}` directly).
2. The detail page shows before/after JSON and a **Field diff** table.
3. Diff logic is **shallow** — top-level keys only, compared with JSON equality.
4. Changed fields show `before` and `after` columns; added/removed keys are listed separately.
5. If no snapshots or no differences: “No field-level diff available.”

Helpers: [lib/admin/admin-activity-diff.ts](./lib/admin/admin-activity-diff.ts) — `getActivityDiff`, `buildShallowDiffSummary`, `activityHasDiffPreview`.

---

## Rollback execution (Step 26)

The **Rollback** section on `/admin/activity/{id}`:

- Shows **Rollback available** when the action is supported and `before_snapshot` has restorable fields
- Lists fields that will be restored
- Requires confirmation checkbox (Mongolian text)
- **Execute rollback** applies `before_snapshot` via [lib/supabase/admin-rollback.ts](./lib/supabase/admin-rollback.ts)
- Logs `rollback_executed` as a new activity row

**Unsupported actions** show: “Rollback энэ action дээр одоогоор дэмжигдээгүй.”

Warning shown: subtitle/vocabulary/quiz bulk rollback is not active.

Full details: [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md).

---

## UI routes

| Route | Purpose |
|-------|---------|
| `/admin/activity` | List with diff/rollback badges, filters, CSV/JSON export |
| `/admin/activity/{id}` | Full detail, snapshots, diff, rollback execution |
| `/admin/lessons/{id}/edit` | Lesson activity links to detail pages |

Components: `activity-diff-viewer`, `json-snapshot-viewer`, `rollback-execution-card`, `activity-detail-view`.

---

## Related docs

- [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md) — base audit trail
- [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md) — rollback rules and safety
- [ADMIN_AUDIT_EXPORT.md](./ADMIN_AUDIT_EXPORT.md) — export tools
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
