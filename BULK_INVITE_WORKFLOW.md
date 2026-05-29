# Bulk Invite Workflow

Phase 7 Step 14 — how schools upload teacher/student lists via CSV import.

## Workflow

1. **Organization setup** — admin or owner creates organization from inquiry or admin B2B.
2. **Bulk import teachers/managers** — paste CSV at `/organization/{id}/members/import`.
3. **Create classroom** — teacher or manager creates org classroom.
4. **Bulk import students** — paste CSV at `/teacher/classes/{id}/students/import`.
5. **Setup wizard** — links to both import flows; completing imports can mark onboarding tasks done.

## How invited rows work

- Rows insert with `status: invited` (unless `user_id` / `student_user_id` provided).
- No email is sent in Step 14.
- Managers can share login/signup instructions manually, or send invitation email when provider is configured (Step 16).

## user_id linking (later)

- Optional `user_id` on organization member rows links existing Supabase Auth user.
- Optional `student_user_id` on classroom rows links student account immediately (`active` status).
- Without user IDs, rows stay invited until user signs up and accepts `/invite/{token}`.

## Invitation link generation (Step 15)

After CSV import:
1. Open `/organization/{id}/members` or classroom page
2. Generate invite link or use invitations list
3. Copy link or email message (Mongolian templates), or send via **Send invitation email** (Step 16)
4. Invitee logs in → `/invite/{token}` → Accept

## Duplicate handling

- App-level dedup by normalized email per org/classroom.
- Duplicate CSV rows → warning at validation.
- Existing member/student → skipped with message in import report.

## Privacy notes

- Only owner/manager/admin can bulk import organization members.
- Classroom teacher or org manager can bulk import students (RLS enforced).
- No service_role key — anon authenticated client + RLS only.
- Import reports may contain emails — handle exports carefully.

## Related docs

- [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md)
- [ORGANIZATION_SETUP_WIZARD.md](./ORGANIZATION_SETUP_WIZARD.md)
- [INVITATION_WORKFLOW.md](./INVITATION_WORKFLOW.md)
- [INVITATION_EMAIL_DELIVERY.md](./INVITATION_EMAIL_DELIVERY.md)
- [EMAIL_DELIVERY_SETUP.md](./EMAIL_DELIVERY_SETUP.md)
