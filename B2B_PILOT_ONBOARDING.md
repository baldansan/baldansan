# B2B Pilot Onboarding

Phase 7 Step 13 — organization pilot onboarding workflow.

## Overview

When an organization is created (from inquiry or admin), onboarding is initialized with default tasks and pilot readiness tracking.

## Database

Migration: `supabase/migrations/014_b2b_pilot_onboarding.sql`

- `organization_onboarding` — status, pilot stage, goals, completed steps
- `organization_onboarding_tasks` — checklist tasks per organization

## API

- `lib/supabase/organization-onboarding.ts` — CRUD, readiness score, status counts
- `lib/organization/pilot-plan-builder.ts` — markdown/JSON/checklist export

## Routes

| Route | Purpose |
|-------|---------|
| `/organization/{id}/setup` | Setup wizard + task checklist |
| `/organization/{id}/dashboard` | Pilot dashboard + readiness card |
| `/organization/{id}` | Org home with pilot summary |
| `/organization/{id}/members/import` | Bulk CSV import members |
| `/admin/b2b/organizations/{id}` | Admin pilot controls |

## Bulk teacher/student import (Step 14)

During pilot setup, owners/managers bulk import teachers via CSV at `/organization/{id}/members/import`. Classroom teachers/managers bulk import students at `/teacher/classes/{id}/students/import`. See [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md).

## Pilot stages

`inquiry` → `demo` → `setup` → `pilot` → `review` → `active`

## Readiness score

Calculated from completed onboarding tasks (profile, members, classroom, assignment, report).

## Testing

1. Run migration 014 after 012 + 013.
2. Create organization from admin B2B or inquiry conversion.
3. Open `/organization/{id}/setup` and complete tasks.
4. Verify readiness score updates on org dashboard and admin B2B detail.
