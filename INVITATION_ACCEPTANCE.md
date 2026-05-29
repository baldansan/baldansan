# Invitation Acceptance

Phase 7 Step 15 — invitation link generation and invite acceptance flow.

## Invite URL

`/invite/{token}`

Built by `lib/organization/invite-url.ts` → `buildInviteUrl(token)`.

## Flow

1. Manager creates invitation (single or bulk).
2. Recipient opens invite link.
3. RPC `lookup_organization_invitation(token)` returns org name, role, expiry (no list exposure).
4. If not signed in → redirect to `/login?next=/invite/{token}`.
5. If signed in → RPC `accept_organization_invitation(token)` links user to `organization_members` and marks invitation accepted.

## Components

- `app/invite/[token]/page.tsx`
- `components/organization/invite-accept-view.tsx`
- `components/organization/member-management.tsx` — single invite + copy link

## Security

- Token-only lookup via security definer RPC (anon + authenticated).
- Accept requires authenticated user matching session.
- Invitations expire after 14 days (default).

## Migration

`supabase/migrations/015_organization_invitations.sql`
