# Email Invitation Templates

Phase 7 Step 15–16 — Mongolian copy for manual paste and server email delivery.

Templates live in:
- `lib/invitations/invite-message-templates.ts` — client copy/paste
- `lib/server/email/invitation-email.ts` — server send (subject/text/html)

## Organization teacher invite

**Subject:** Бөөндөө Сурцгаая platform-д багшаар нэгдэх урилга

**Body:**

```
Сайн байна уу, {name}.

Таныг {organizationName} байгууллагын Бөөндөө Сурцгаая сургалтын platform-д {role} эрхээр урьж байна.
Доорх link-ээр орж account-аа холбож урилгаа баталгаажуулна уу:
{inviteUrl}

Энэ link тодорхой хугацаанд хүчинтэй.
```

## Classroom student invite

**Subject:** Бөөндөө Сурцгаая хичээлд нэгдэх урилга

**Body:**

```
Сайн байна уу, {name}.

Таныг {classroomName} classroom-д сурагчаар нэгдэхээр урьж байна.
Доорх link-ээр орж account-аа холбож хичээлээ эхлүүлнэ үү:
{inviteUrl}

Энэ link тодорхой хугацаанд хүчинтэй.
```

## Short SMS / DM

```
Бөөндөө Сурцгаая: {orgOrClass} урилга. {inviteUrl}
```

## Admin instructions

1. Create organization from inquiry (optional manager invite auto-generated if contact email exists)
2. Bulk import teachers/students via CSV
3. Open members or classroom page → Generate invite link
4. Click **Copy email message** and send via school email / Messenger / WhatsApp, or use **Send invitation email** when provider is configured (Step 16)
5. Invitee signs up or logs in → opens link → Accept

## Automatic send (Step 16)

When `EMAIL_PROVIDER` is set (see [EMAIL_DELIVERY_SETUP.md](./EMAIL_DELIVERY_SETUP.md)), managers can send from the invitation list. Delivery attempts are logged in `invitation_email_deliveries`.

Do not commit real recipient emails or tokens in docs or git.
