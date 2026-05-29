# Organization Setup Wizard

Phase 7 Step 13 — guided setup for B2B pilot organizations.

## Route

`/organization/{organizationId}/setup`

## Components

- `components/organization/organization-setup-wizard-view.tsx`
- `components/organization/onboarding-task-list.tsx`
- `components/organization/pilot-readiness-card.tsx`

## Workflow

1. **Organization profile** — confirm name, type, contact
2. **Members** — invite teachers/managers (`/organization/{id}/members`) or **bulk CSV import** (`/organization/{id}/members/import`)
3. **Classrooms & students** — create org classroom; **bulk import students** (`/teacher/classes/{id}/students/import`)
4. **Assignments** — first assignment (`/organization/{id}/assignments`)
5. **Reports** — review pilot metrics (`/organization/{id}/reports`)
6. **Invite acceptance** — share `/invite/{token}` links; invitee logs in and accepts

Tasks are stored in `organization_onboarding_tasks` and marked complete as each step is done.

## Access

Organization owners and managers can access the wizard. Teachers see read-only pilot status on the teacher dashboard.

## Admin

Admin B2B org detail shows onboarding status, pilot stage, and links to setup wizard.
