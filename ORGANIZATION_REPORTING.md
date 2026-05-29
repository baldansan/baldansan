# Organization Reporting — Buunduu Surtsgaay

Phase 7 Step 12: school admin reporting and organization-level analytics.

## Overview

Organization owners, managers, and teachers can view rollup metrics for all organization classrooms. Admins can also open reports from B2B CRM.

Data comes from **`assignment_results`** (primary), classroom enrollments, and per-class analytics reused from teacher reporting — anon client + RLS only.

## Route

| Route | Purpose |
|-------|---------|
| `/organization/{organizationId}/reports` | School admin reports + export |

Linked from:

- Organization dashboard → **School admin reports**
- Admin B2B org detail → **Organization reports**

## Sections

1. **Overview metrics** — classrooms, students, completion rate, avg quiz
2. **Export** — copy/download markdown organization report
3. **Classes needing attention** — empty classes, no assignments, low quiz avg
4. **Teacher performance** — per-teacher class/student/assignment rollups
5. **Organization class metrics** — per-class completion and quiz
6. **Student progress summary** — deduplicated across org classes
7. **Assignment completion** — per-assignment stats with links

## Analytics helpers

`lib/supabase/organization-analytics.ts`:

| Function | Returns |
|----------|---------|
| `getOrganizationOverviewMetrics(orgId)` | Rollup metrics for dashboard |
| `getOrganizationReportsData(orgId)` | Full reports bundle |

Types: `lib/organization/analytics-types.ts`  
Markdown export: `lib/organization/report-builder.ts` → `buildOrganizationReportMarkdown()`

## Permissions

| Role | Reports access |
|------|----------------|
| owner | ✓ |
| manager | ✓ |
| teacher | ✓ |
| assistant | — |
| student | — |
| admin | ✓ (via RLS + admin profile) |

## Data sources

| Table | Access |
|-------|--------|
| `classrooms` | Org member / admin RLS |
| `classroom_students` | Org classroom scope |
| `assignments` | Org scope |
| `assignment_results` | Org managers/teachers read (migration 013) |
| `teacher_profiles` | Display names for teachers |

## Limitations

- Aggregates computed client-side by looping per-class analytics (fine for pilot scale)
- Vocabulary counts may be unavailable (student progress RLS)
- No scheduled email reports
- No PDF export (markdown only)

## Related

- [TEACHER_REPORTING.md](./TEACHER_REPORTING.md)
- [ORGANIZATION_PERMISSIONS.md](./ORGANIZATION_PERMISSIONS.md)
- [MULTI_TEACHER_WORKFLOW.md](./MULTI_TEACHER_WORKFLOW.md)
