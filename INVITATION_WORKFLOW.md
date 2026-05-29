# Invitation Workflow

Phase 7 Step 15 — invitation links and invite acceptance (no automatic email).

## Invitation types

| Type | `invite_kind` | Use case |
|------|---------------|----------|
| Organization member | `organization_member` | Teachers, managers, assistants |
| Classroom student | `classroom_student` | Students joining a class |

Stored in `organization_invitations` (SQL view alias: `invitations`).

## Generate invite link

**Organization members** — owner/manager/admin:
- `/organization/{id}/members` → Create invite link
- `/organization/{id}/invitations` → list + revoke

**Classroom students** — classroom teacher / org manager:
- `/teacher/classes/{id}` → Generate student invite link
- `/teacher/classes/{id}/invitations` → list + revoke

## Accept flow

1. Recipient opens `/invite/{token}`
2. Preview shows org/classroom context (Mongolian copy)
3. Not logged in → `/login?next=/invite/{token}` or signup with same `next`
4. Logged in → Accept → RPC links user to `organization_members` or `classroom_students`
5. Redirect: org → `/organization/{id}`; student → `/my-assignments`

## Token behavior

- Unique token per invitation (`invite_token`)
- Default expiry: 14 days
- Status: `pending`, `accepted`, `expired`, `revoked`
- Lookup RPC returns pending + unexpired only

## Email delivery (Step 16)

Optional server send when `EMAIL_PROVIDER` is configured. See [EMAIL_DELIVERY_SETUP.md](./EMAIL_DELIVERY_SETUP.md) and [INVITATION_EMAIL_DELIVERY.md](./INVITATION_EMAIL_DELIVERY.md).

- UI: **Send invitation email** on pending invites (org + classroom invitation lists)
- API: `POST /api/invitations/{id}/send-email`
- Without provider: status `skipped`, use copy link / copy message manually

## CSV import connection

1. Bulk CSV import creates `invited` member/student rows (Step 14)
2. Generate invite links from members/classroom page (Step 15)
3. Share link or copied message with invitee

## Security

- Token-only public lookup (security definer RPC)
- Accept requires authenticated session
- Optional email match on accept
- RLS: managers for org invites; classroom teachers/managers for student invites
