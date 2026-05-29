# Release workflow — Buunduu Surtsgaay

Phase 5 Step 21: content approval and release readiness before publishing.

---

## Two status systems

| Field | Column | Purpose |
|-------|--------|---------|
| Public visibility | `lessons.status` | `draft`, `available`, `archived` — controls learner routes |
| Release workflow | `lessons.release_status` | `draft`, `in_review`, `approved`, `published`, `archived` |
| Release QA gate | `lessons.qa_status` | `needs_review`, `passed`, `failed` |

Publishing sets **`status = available`** (public). **`release_status = published`** tracks internal release history.

---

## Migration

Run in Supabase SQL Editor:

**[supabase/migrations/005_lesson_release_workflow.sql](./supabase/migrations/005_lesson_release_workflow.sql)**

Adds: `release_status`, `qa_status`, `approved_at`, `approved_by`, `release_notes`, `last_reviewed_at`.

See [supabase/workflows/README.md](./supabase/workflows/README.md).

---

## Release checklist

On **`/admin/lessons/{id}/edit`** → **Release readiness**:

| Check | Rule |
|-------|------|
| Metadata | Title, Chinese title, summary |
| Subtitles | ≥1 line |
| Vocabulary | ≥5 words |
| Quiz | ≥3 questions |
| Media | `media_status = ready` or video URL |
| QA | Import QA passes (no critical errors) |
| Backup | Recommended — export JSON before publish |
| Preview | Recommended — admin preview routes |
| Approval | `release_status = approved` or QA passed |

**Ready to approve** = metadata + subtitles + vocabulary + quiz + QA.

**Ready to publish** = ready to approve + (`release_status = approved` OR `qa_status = passed`).

Helper: [lib/admin/release-readiness.ts](./lib/admin/release-readiness.ts)

---

## Recommended workflow

1. **Draft** — create lesson metadata
2. **Import content** — bulk JSON or editors
3. **QA** — Import QA summary on edit page
4. **Media** — upload or attach URLs
5. **Export backup** — JSON backup on edit page
6. **Preview** — `/lessons/{id}?preview=admin`
7. **Mark QA passed** — release approval controls
8. **Approve for publish** — sets `approved_at`, `approved_by`
9. **Publish** — Publishing controls → `status = available`, syncs `release_status = published`

---

## Admin UI

| Location | Feature |
|----------|---------|
| `/admin/lessons/{id}/edit` | Release readiness card, approval controls, publishing |
| `/admin/lessons` | Release / QA badges and filters |
| `/admin` | Release workflow metrics |
| `/admin/lesson-builder` | Links to release checklist and approve |
| `/admin/tasks` | Generated release blockers and ready-to-publish tasks |

**Task Center** ([ADMIN_TASK_CENTER.md](./ADMIN_TASK_CENTER.md)) helps identify release blockers across all lessons before you publish.

API: [lib/supabase/admin-release.ts](./lib/supabase/admin-release.ts) (client + admin JWT, no service_role).

---

## Related

- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md)
- [AI_ASSISTED_CONTENT_WORKFLOW.md](./AI_ASSISTED_CONTENT_WORKFLOW.md)
- [LESSON_BUILDER_WORKFLOW.md](./LESSON_BUILDER_WORKFLOW.md)
