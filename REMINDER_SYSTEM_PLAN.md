# Reminder System Plan

## Current (Phase 7 Step 5)

**In-app reminders only**

- User sets time + days on `/reminders`
- On dashboard load, due reminders create notifications
- `last_shown_at` prevents duplicate same-day prompts
- No browser push, no email

---

## Storage

| User | Reminders | Notifications |
|------|-----------|---------------|
| Guest | localStorage | localStorage |
| Logged-in | `user_study_reminders` | `user_notifications` |

---

## Future: Push notifications

1. Request notification permission (PWA)
2. Extend service worker with scheduled checks (limited on iOS)
3. Respect user opt-in stored in future `user_retention_settings`

---

## Future: Email

1. Supabase Auth hooks or external provider
2. Weekly digest from `weekly-report` data
3. Opt-in only; no marketing without consent

---

## Privacy

- Reminder data is user-owned (RLS)
- No admin read of individual reminders in this phase
- Do not log reminder content in client console

---

## Related

- [ENGAGEMENT_SYSTEM.md](./ENGAGEMENT_SYSTEM.md)
