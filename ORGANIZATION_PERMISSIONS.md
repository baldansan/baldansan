# Organization Permissions — Buunduu Surtsgaay

Phase 7 Step 11: multi-teacher organization roles and RLS.

## Roles

| Role | Mongolian label | Purpose |
|------|-----------------|---------|
| `owner` | Эзэмшигч | Full org control |
| `manager` | Менежер | Manage members, classrooms, assignments |
| `teacher` | Багш | Create/manage org classrooms and assignments |
| `assistant` | Туслах | Read org classrooms and assignments |
| `student` | Сурагч | See own assignments via classroom enrollment |

## Permissions matrix (app helpers)

| Action | owner | manager | teacher | assistant | student |
|--------|:-----:|:-------:|:-------:|:---------:|:-------:|
| Manage organization settings | ✓ | ✓ | — | — | — |
| Manage members | ✓ | ✓ | — | — | — |
| Bulk import organization members | ✓ | ✓ | — | — | — |
| Bulk import classroom students | ✓ | ✓ | ✓* | — | — |
| Create org classroom | ✓ | ✓ | ✓ | — | — |
| Manage org classroom | ✓ | ✓ | ✓* | — | — |
| Create org assignment | ✓ | ✓ | ✓ | — | — |
| View org classrooms | ✓ | ✓ | ✓ | ✓ | enrolled only |
| View org assignments | ✓ | ✓ | ✓ | ✓ | own only |
| View reports | ✓ | ✓ | ✓ | — | — |

Organization reports: `/organization/{id}/reports` — see [ORGANIZATION_REPORTING.md](./ORGANIZATION_REPORTING.md).

\* Teachers manage classrooms they own (`teacher_user_id`) or when RLS allows org teacher access.

## Organization classrooms

- `classrooms.organization_id` links a class to an organization
- `visibility`: `private`, `organization`, `archived`
- `created_by` records who created the classroom
- Personal classrooms: `organization_id` is null

## Organization assignments

- `assignments.organization_id` copied from classroom on create
- `assignments.created_by` set to `auth.uid()`

## RLS model

Migration: `supabase/migrations/013_organization_classrooms_permissions.sql`

Helper functions (security definer, `search_path = public`):

- `is_org_member(org_id)`
- `is_org_teacher(org_id)`
- `is_org_manager(org_id)` — owner or manager
- `can_manage_org(org_id)` — owner or manager
- `can_read_org_classroom(org_id)` — teachers/assistants/managers
- `can_manage_org_classroom(org_id)` — teachers/managers for org scope

Policies enforce:

- Admins: full access via `is_admin()`
- Org owner/manager: manage org, members, org classrooms, org assignments
- Org teachers: read org classrooms; create classrooms/assignments when member
- Org assistants: read org classrooms
- Students: classrooms via `classroom_students`; assignments for enrolled classes
- Personal classroom owner: unchanged `teacher_user_id` ownership

## Client helpers

- `lib/supabase/organization-permissions.ts` — role checks and labels
- `lib/supabase/organizations.ts` — dashboard data, members, org classrooms/assignments
- `lib/supabase/classrooms.ts` — org-aware create/list

## Limitations

- No email invite automation (member rows can be invited with email only)
- `permissions` jsonb reserved for future fine-grained flags
- Admin org updates still available in CRM; owner/manager self-service on `/organization`
- No payment or billing integration

## Related

- [MULTI_TEACHER_WORKFLOW.md](./MULTI_TEACHER_WORKFLOW.md)
- [ORGANIZATION_ACCOUNTS.md](./ORGANIZATION_ACCOUNTS.md)
- [CLASSROOM_SCHEMA.md](./CLASSROOM_SCHEMA.md)
