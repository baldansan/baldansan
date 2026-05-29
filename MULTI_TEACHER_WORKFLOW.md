# Multi-Teacher Workflow — Buunduu Surtsgaay

Phase 7 Step 11 end-to-end flow for training centers and schools.

## 1. Organization created

**Paths:**

- Admin creates org from B2B inquiry (`/admin/b2b/inquiries/{id}` → Create organization)
- Admin creates org manually (`/admin/b2b/organizations/new`)
- Contact person added as `manager` or `owner` with status `invited`

## 2. Owner/manager adds teachers

- Admin: `/admin/b2b/organizations/{id}` — add member (email, display name, role, optional user_id)
- Owner/manager: `/organization/{id}/members` — invite and manage roles

Roles: owner, manager, teacher, assistant, student

## 3. Teachers create organization classrooms

- `/organization/{id}` → Create classroom
- Or `/teacher/classes/new?organizationId={id}`
- Classroom gets `organization_id`, `visibility = organization`, `created_by`

Personal classrooms remain available without `organization_id`.

## 4. Teachers assign lessons

- `/teacher/assignments/new?organizationId={id}` filters org classrooms
- Assignment inherits `organization_id` from classroom
- Students see assignments at `/my-assignments` when enrolled

## 5. Managers use org dashboard + `/organization/{id}/reports` for school-wide metrics
6. Export markdown report for pilot review

- `/organization/{id}` — overview cards (teachers, classrooms, students, assignments)
- `/teacher/reports` — class progress and export (owner/manager/teacher)

## 6. Students access assignments

- Teacher adds student to classroom (`student_user_id` or invite fields)
- Student opens `/my-assignments`
- Shows classroom name, organization name, teacher info when available

## Routes summary

| Route | Who |
|-------|-----|
| `/organization` | Any logged-in member |
| `/organization/{id}` | Org members |
| `/organization/{id}/members` | Owner/manager (view for others if RLS allows) |
| `/organization/{id}/classrooms` | Org teachers+ |
| `/organization/{id}/assignments` | Org teachers+ |
| `/teacher-dashboard` | Personal + org class split |
| `/admin/b2b/organizations/{id}` | Admin CRM + link to org dashboard |

## Related

- [ORGANIZATION_PERMISSIONS.md](./ORGANIZATION_PERMISSIONS.md)
- [B2B_CRM_WORKFLOW.md](./B2B_CRM_WORKFLOW.md)
- [TEACHER_ONBOARDING.md](./TEACHER_ONBOARDING.md)
