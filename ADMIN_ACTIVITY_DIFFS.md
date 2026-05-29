# Admin Activity Diffs — Buunduu Surtsgaay

Phase 5 Step 25: before/after snapshots and field-level diff preview on the admin activity log. **Rollback execution is not implemented yet** — preview only.

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

## Rollback preview (disabled)

The **Rollback preview** section on the detail page explains which entity and fields *would* be restored if rollback existed. The **Rollback — coming soon** button is disabled.

**Why preview-only for now:**

- Rollback must not overwrite lesson data accidentally.
- Content rollback (subtitles/vocab/quiz rows) needs row-level history, not just counts.
- Step 26 will design safe, explicit rollback execution with confirmation.

---

## UI routes

| Route | Purpose |
|-------|---------|
| `/admin/activity` | List with “Diff available” badge and Has diff / No diff filter |
| `/admin/activity/{id}` | Full detail, snapshots, diff, rollback preview |
| `/admin/lessons/{id}/edit` | Lesson activity links to detail pages |

Components: `activity-diff-viewer`, `json-snapshot-viewer`, `rollback-preview-card`, `activity-detail-view`.

---

## Future rollback execution plan (Step 26+)

1. **Metadata / media / status** — apply `before_snapshot` fields via existing admin update helpers with explicit admin confirmation.
2. **Content import/restore** — require backup JSON or point-in-time export; never blind-restore from counts alone.
3. **Audit** — log `rollback_executed` as a new activity row with its own snapshots.
4. **Safety** — two-step confirm, dry-run preview (this step), optional “restore to draft only” guard.

---

## Related docs

- [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md) — base audit trail
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 roadmap
