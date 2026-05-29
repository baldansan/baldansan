# Organization Accounts — Buunduu Surtsgaay

Phase 7 Step 10 foundation for B2B school/training-center accounts.

## Tables

### `organizations`

Represents a school, training center, company, or other B2B customer.

| Field | Notes |
|-------|--------|
| `name` | Required |
| `organization_type` | training_center, school, university, teacher, company, other |
| `status` | lead, contacted, demo_scheduled, pilot, active, paused, closed |
| Contact fields | website, phone, email, address, notes |

### `organization_members`

Links users (or invited emails) to an organization with a role.

| Field | Notes |
|-------|--------|
| `user_id` | Optional — link when account exists |
| `email` / `display_name` | For invited members |
| `role` | owner, manager, teacher, assistant, student |
| `status` | invited, active, inactive |

## Who can access what

| Actor | organizations | organization_members | classrooms (org) | assignments (org) |
|-------|---------------|---------------------|------------------|-------------------|
| Admin | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| Owner/manager | Select + update own | Manage members | Manage org classrooms | Manage org assignments |
| Teacher member | Select own org | Select own row | Create/read org classrooms | Create/manage in org |
| Assistant | Select own org | Select own row | Read org classrooms | Read |
| Student member | Select own org | Select own row | Via enrollment | Own assignments |

## Teacher integration (Step 11)

- `/organization` — list organizations with role badges
- `/organization/{id}` — organization dashboard
- `/teacher-dashboard` — personal vs organization classes, org switcher
- `/teacher/classes/new?organizationId=` — create org classroom
- `/teacher/assignments/new?organizationId=` — filter org classrooms

## Multi-teacher permissions (Step 11)

- Organization-owned classrooms via `classrooms.organization_id`
- Multiple teachers per organization via `organization_members`
- Role-based access: owner, manager, teacher, assistant, student
- RLS helpers: `is_org_member`, `is_org_teacher`, `is_org_manager`, `can_manage_org`
- See [ORGANIZATION_PERMISSIONS.md](./ORGANIZATION_PERMISSIONS.md)

## Current limitations

- No email invite automation (manual member rows)
- `permissions` jsonb reserved for future flags
- Member `user_id` often set manually until invite flow exists
- Single teacher profile `organization` text field separate from `organizations` table

## API

`lib/supabase/organizations.ts`:

- `getOrganizations()`, `getOrganizationById()`, `createOrganization()`, `updateOrganization()`
- `getOrganizationMembers()`, `addOrganizationMember()`, `updateOrganizationMember()`, `removeOrganizationMember()`
- `getMyOrganizations()`, `getMyOrganizationsWithRole()`, `createOrganizationFromInquiry()`
- `getOrganizationDashboardData()`, `getOrganizationClassrooms()`, `getOrganizationAssignments()`
- `inviteOrganizationMember()`, `updateOrganizationMemberRole()`

`lib/supabase/organization-permissions.ts` — role checks and Mongolian labels

## Migrations

- `supabase/migrations/012_school_organizations_b2b_crm.sql`
- `supabase/migrations/013_organization_classrooms_permissions.sql`

## Related

- [B2B_CRM_WORKFLOW.md](./B2B_CRM_WORKFLOW.md)
- [CLASSROOM_WORKFLOW.md](./CLASSROOM_WORKFLOW.md)
- [TEACHER_ONBOARDING.md](./TEACHER_ONBOARDING.md)
