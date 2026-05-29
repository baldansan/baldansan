# Invitation Email Delivery

Phase 7 Step 16 — server-safe invitation email delivery foundation (provider-ready).

## Overview

Managers can send invitation emails from the UI when a provider is configured. The server builds Mongolian email content, dispatches via Resend or mock, and logs every attempt. Without a provider, send is safely skipped and copy-link fallback remains.

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/invitations/{invitationId}/send-email` | Primary send endpoint |
| `POST /api/invitations/{invitationId}/send` | Deprecated alias to same handler |

Both use `createServerSupabaseClient()` with the authenticated user session (no `service_role`).

## Server modules

| Module | Role |
|--------|------|
| `lib/server/email/email-provider.ts` | `sendEmail`, `isEmailProviderConfigured`, `getEmailProviderStatus` |
| `lib/server/email/invitation-email.ts` | Build subject/text/html for org + classroom invites |
| `lib/server/email/send-invitation-email.ts` | `sendInvitationEmailForId()` — shared send + delivery log insert |
| `lib/server/invitation-email.ts` | Re-exports for backward compatibility |

## Client modules

| Module | Role |
|--------|------|
| `lib/supabase/invitation-email-deliveries.ts` | Delivery queries, counts, `requestInvitationEmailSend()` |
| `components/invitations/send-invite-email-button.tsx` | Send / retry UI |
| `components/invitations/invitation-delivery-log.tsx` | Per-invitation delivery history |
| `components/invitations/invite-link-actions.tsx` | Copy link/message + send button + log |

## Delivery table

`invitation_email_deliveries` (migration `018_invitation_email_deliveries.sql`)

| Column | Notes |
|--------|-------|
| `invitation_id` | FK → `organization_invitations` |
| `recipient_email`, `subject`, `body` | Snapshot at send time |
| `provider` | `manual`, `mock`, `resend`, etc. |
| `status` | `queued`, `sent`, `failed`, `skipped` |
| `error_message`, `sent_at` | Failure reason or success timestamp |

## Environment

See [EMAIL_DELIVERY_SETUP.md](./EMAIL_DELIVERY_SETUP.md) for full setup.

| Variable | Purpose |
|----------|---------|
| `EMAIL_PROVIDER` | `mock` \| `resend` \| unset |
| `EMAIL_FROM` | Sender address |
| `RESEND_API_KEY` | Resend API key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Invite link base URL |

## UI surfaces

- Organization invitations: `/organization/{id}/invitations`
- Classroom invitations: `/teacher/classes/{id}/invitations`
- Admin delivery log: `/admin/b2b/invitations`
- Admin B2B home + org detail: delivery count summaries

## Accept page

`/invite/{token}` shows email context when opened from an invitation link and warns if logged-in email does not match invite email.

## Security notes

- No service role key in client or routes
- Provider credentials are server-only
- Delivery log visible to invitation managers and admins via RLS
- Skipped sends never throw — manual fallback always available
