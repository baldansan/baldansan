# Admin Audit Export — Buunduu Surtsgaay

Phase 5 Step 26: client-side export of admin activity logs for operations review and compliance-style audit prep. No server route or external logging service.

---

## Where to export

Route: **`/admin/activity`**

Export controls appear above the activity list:

- **Export CSV** — download `admin-activity-log.csv`
- **Export JSON** — download `admin-activity-log.json`
- **Copy JSON** — copy formatted JSON to clipboard

Component: [components/admin/activity-export-controls.tsx](./components/admin/activity-export-controls.tsx)  
Helpers: [lib/admin/activity-export.ts](./lib/admin/activity-export.ts)

---

## What gets exported

Exports use the **currently loaded / filtered** activity rows in the browser view. Apply filters first (action, entity type, lesson id, actor, date range, diff, rollback availability), then export.

If server-side pagination limits loaded rows in the future, export will reflect whatever is loaded in the current view.

---

## CSV columns

| Column | Description |
|--------|-------------|
| `created_at` | ISO timestamp |
| `actor_email` | Admin email at log time |
| `action` | Machine-readable action key |
| `entity_type` | e.g. `lesson`, `media`, `task` |
| `entity_id` | Affected entity id when set |
| `lesson_id` | Lesson scope when set |
| `title` | Short summary |
| `description` | Optional longer text |

CSV uses standard escaping for commas and quotes. Suitable for spreadsheets and simple log review.

---

## JSON export fields

Each activity is formatted with:

| Field | Included |
|-------|----------|
| Core row fields | id, timestamps, actor, action, entity, lesson, title, description |
| `metadata` | Full JSON metadata object |
| `before_snapshot` | Full before state when present |
| `after_snapshot` | Full after state when present |
| `diff_summary` | Changed / added / removed field names |

JSON export is better for deep investigation, rollback analysis, and archiving snapshot data.

---

## How to use logs for operations

**Daily ops**

- Filter **Today** on `/admin/activity` → export CSV for a quick who-did-what summary
- Check **rollback available** filter before investigating mistaken metadata edits

**Release review**

- Filter publish/release actions → confirm publish/unpublish/approve sequence before go-live
- Cross-check with `/admin/tasks` for unresolved critical items

**Incident / mistake recovery**

1. Find the activity row (by lesson id or actor)
2. Open detail page → review diff
3. Execute rollback if action is supported (see [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md))
4. Export JSON of related rows for record-keeping

**Audit prep**

- Export JSON for a date range (filter Last 7 / 30 days)
- Store exports outside the app; activity log remains source of truth in Supabase
- Use `/admin/final-audit` for Phase 5 readiness checklist

---

## Security notes

- Export runs in the **admin browser session** — same RLS as reading the activity log
- No `service_role` key; no new API routes
- Do not commit exported files if they contain sensitive operational notes in metadata
- `.env.local` is not involved in export

---

## Related docs

- [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md) — what is logged
- [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md) — safe rollback
- [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md) — final audit page
