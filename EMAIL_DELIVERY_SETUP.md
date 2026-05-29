# Email Delivery Setup

Phase 7 Step 16 — configure optional invitation email delivery for B2B pilot onboarding.

## Overview

Invitation emails are sent from a **server route** using a pluggable provider. No secrets are exposed to the browser. If no provider is configured, delivery is logged as `skipped` and managers continue using copy-link / copy-message fallback.

## Environment variables

Add to `.env.local` (local) or Vercel **Environment Variables** (Production / Preview):

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_PROVIDER` | No | `mock` or `resend`. Unset = skip send. |
| `EMAIL_FROM` | When configured | Sender, e.g. `Buunduu Surtsgaay <noreply@yourdomain.com>` |
| `RESEND_API_KEY` | When `EMAIL_PROVIDER=resend` | Resend API key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Recommended | Base URL for invite links (fallback: `VERCEL_URL`) |

Copy from [.env.example](./.env.example). **Never commit** `.env.local`, `RESEND_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY`.

## Provider modes

### Unset (default)

- `POST /api/invitations/{id}/send-email` returns status `skipped`
- Mongolian message explains provider is not configured
- UI keeps **Copy invite link** and **Copy email message** buttons

### `mock`

- Logs email to server console
- Delivery row status: `sent`
- Use for local development without external API calls

### `resend`

- Sends via [Resend](https://resend.com) HTTP API
- Requires verified domain or Resend sandbox sender
- Delivery row status: `sent` or `failed` with `error_message`

## Send flow

1. Org manager or classroom teacher opens invitations list
2. Clicks **Send invitation email** on a pending invite with recipient email
3. Client calls `requestInvitationEmailSend(invitationId)` → `POST /api/invitations/{id}/send-email`
4. Server builds Mongolian subject/body/html, calls provider, inserts `invitation_email_deliveries` row
5. **Invitation delivery log** refreshes on the invitation card

## Admin monitoring

- `/admin/b2b/invitations` — recent delivery log across all invitations
- Admin B2B home — sent / failed / skipped counts + link to delivery page
- Admin org detail — email delivery summary alongside invitation counts

## Database

Migration: `supabase/migrations/018_invitation_email_deliveries.sql`

Table: `invitation_email_deliveries` (FK → `organization_invitations`)

Statuses: `queued`, `sent`, `failed`, `skipped`

Legacy table `organization_invitation_deliveries` (migration 016) is not used by the new send flow.

## Security

- Route uses `createServerSupabaseClient()` with user JWT — no `service_role`
- RLS: org managers, classroom managers, and admins can read/write delivery rows for their invitations
- Provider API keys are server-only environment variables

## Related docs

- [INVITATION_EMAIL_DELIVERY.md](./INVITATION_EMAIL_DELIVERY.md) — architecture and API reference
- [INVITATION_WORKFLOW.md](./INVITATION_WORKFLOW.md) — invite link + accept flow
- [EMAIL_INVITATION_TEMPLATES.md](./EMAIL_INVITATION_TEMPLATES.md) — Mongolian copy (manual + server templates)
