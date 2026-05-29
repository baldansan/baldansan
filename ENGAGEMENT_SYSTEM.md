# Engagement System — Buunduu Surtsgaay

**Phase 7 Step 5** — In-app reminders, notifications, achievements, weekly reports, study plan.

Production: https://baldansan.vercel.app

---

## Features

| Feature | Route | Storage |
|---------|-------|---------|
| Study reminders | `/reminders` | localStorage + Supabase |
| Notifications | `/notifications` | localStorage + Supabase |
| Achievements | Profile, auto-award | localStorage + Supabase |
| Weekly report | `/weekly-report` | Computed from progress + retention |
| Study plan | `/study-plan` | Static plan + daily goal summary |

---

## Reminders (in-app only)

- Create title, time, days of week
- Toggle enable/disable
- Due reminders create in-app notifications (no push/email)
- Guest: local only; logged-in: Supabase sync

---

## Notifications

Types: `achievement`, `reminder`, `progress`, `system`

- Unread count in header bell (logged-in)
- Mark read / mark all read

---

## Achievements

See [ACHIEVEMENT_RULES.md](./ACHIEVEMENT_RULES.md).

Awarded automatically on lesson/quiz/vocab/review/streak actions. Duplicate awards prevented.

---

## Weekly report

Summarizes current calendar week:

- Lessons completed, words, quizzes, avg score
- Active days, streak, achievements earned
- Recommendation for next week
- Copy / download markdown

---

## Local fallback

Key: `buunduu-surtsgaay-engagement`

Guests use localStorage for reminders, notifications, achievements. Logged-in users prefer Supabase with local mirror on writes.

---

## Future

- Browser push notifications (PWA)
- Email reminders
- Custom calendar sync for study plan
- Admin reminder management

See [REMINDER_SYSTEM_PLAN.md](./REMINDER_SYSTEM_PLAN.md).

---

## Migration

Run `supabase/migrations/010_user_reminders_achievements.sql`

---

## Related

- [RETENTION_SUPABASE_SYNC.md](./RETENTION_SUPABASE_SYNC.md)
- [RETENTION_PLAN.md](./RETENTION_PLAN.md)
