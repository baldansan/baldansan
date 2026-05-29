# B2B CRM Workflow — Buunduu Surtsgaay

Phase 7 Step 10: public inquiry submission and admin CRM pipeline.

## Public inquiry form

Route: **`/school-inquiry`**

- Anyone (anon or logged in) can submit an inquiry
- Data is inserted into `b2b_inquiries` via Supabase anon client + RLS
- Success message: **Inquiry амжилттай илгээгдлээ.**
- Copy-to-clipboard fallback remains if submission fails or user prefers email/messenger

Fields: organization name, contact, email/phone, type, student count, package, message.

## Admin inquiry review

Routes:

| Route | Purpose |
|-------|---------|
| `/admin/b2b` | CRM home — summary cards, recent inquiries |
| `/admin/b2b/inquiries` | Inquiry list with filters |
| `/admin/b2b/inquiries/{id}` | Detail, status, notes, activity |

Admin actions:

- Update status (`new` → `contacted` → `demo_scheduled` → … → `won` / `lost`)
- Save admin note
- Add activity notes (timeline)
- **Create organization from inquiry** — creates `organizations` row + contact member as manager; auto-generates manager invite link if contact email exists

## Inquiry → organization → members → classrooms

1. Public submits `/school-inquiry`
2. Admin reviews at `/admin/b2b/inquiries/{id}`
3. Admin creates organization + contact member stub
4. Admin or owner adds teachers at `/admin/b2b/organizations/{id}` or `/organization/{id}/members`
5. Teachers create org classrooms and assignments
6. Students enroll and use `/my-assignments`

See [MULTI_TEACHER_WORKFLOW.md](./MULTI_TEACHER_WORKFLOW.md).

## Status pipeline (inquiries)

`new` → `contacted` → `demo_scheduled` → `proposal_sent` → `pilot` → `won` | `lost` | `archived`

## Organizations

| Route | Purpose |
|-------|---------|
| `/admin/b2b/organizations` | Organization list |
| `/admin/b2b/organizations/new` | Create organization |
| `/admin/b2b/organizations/{id}` | Edit org, manage members, invitation + email delivery summary |
| `/admin/b2b/invitations` | Invitation email delivery log (sent / failed / skipped) |

Organization status pipeline: `lead` → `contacted` → `demo_scheduled` → `pilot` → `active` | `paused` | `closed`

## Organization members

Table: `organization_members`

Roles: `owner`, `manager`, `teacher`, `assistant`, `student`

- Admins manage all members via CRM
- Logged-in users can read their own membership rows and linked organization (select RLS)
- Multi-teacher team permissions — **Phase 7 Step 11** ([ORGANIZATION_PERMISSIONS.md](./ORGANIZATION_PERMISSIONS.md))

## Admin dashboard integration

- `/admin` shows B2B CRM card (new inquiries, active orgs)
- `/admin/tasks` generates B2B follow-up tasks when inquiries/orgs need attention

## Security

- No `service_role` in the app
- Public insert only on `b2b_inquiries` (validated organization name)
- All CRM read/update via `public.is_admin()` RLS
- Inquiry activity log is admin-only

## Future CRM improvements

- Email auto-reply on inquiry submit
- Assign inquiries to admin users (UI for `assigned_to`)
- Webhook / external CRM sync
- Organization-scoped classrooms (Step 11)
- **Bulk import teachers/students** → generate invite links → send or share `/invite/{token}` ([INVITATION_EMAIL_DELIVERY.md](./INVITATION_EMAIL_DELIVERY.md))

## Related

- [ORGANIZATION_ACCOUNTS.md](./ORGANIZATION_ACCOUNTS.md)
- [SCHOOL_INQUIRY_WORKFLOW.md](./SCHOOL_INQUIRY_WORKFLOW.md)
- [B2B_SCHOOL_PACKAGE.md](./B2B_SCHOOL_PACKAGE.md)
