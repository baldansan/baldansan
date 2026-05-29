# Retention Plan — Buunduu Surtsgaay

## Phase 7 retention roadmap

| Step | Feature | Status |
|------|---------|--------|
| 3 | localStorage streak + daily goal UI | ✅ Completed |
| 4 | Supabase sync (goals, activity, streaks) | ✅ Completed |
| 5 | Engagement system (reminders, achievements, reports) | ✅ Completed |
| 6 | Push/email reminders | Pending |

## Supabase sync (Step 4) — implemented

- Migration `009_user_retention.sql`
- Unified `lib/retention/retention-service.ts`
- Profile sync cards
- Dashboard/Profile account source labels

See [RETENTION_SUPABASE_SYNC.md](./RETENTION_SUPABASE_SYNC.md).

## Engagement system (Step 5) — implemented

- Migration `010_user_reminders_achievements.sql`
- Routes: `/reminders`, `/notifications`, `/weekly-report`, `/study-plan`
- Achievements auto-award on learner actions
- In-app notifications (no push/email yet)

See [ENGAGEMENT_SYSTEM.md](./ENGAGEMENT_SYSTEM.md).

## Future (Step 6+)

- Browser push reminders (PWA)
- Email digest
- `user_retention_settings.reminder_time`
