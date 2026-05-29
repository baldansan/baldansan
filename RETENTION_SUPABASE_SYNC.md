# Retention Supabase Sync

**Phase 7 Step 4** — Account-backed daily goals, activity, and streaks.

**Production:** https://baldansan.vercel.app

---

## Overview

| User | Primary storage | Fallback |
|------|---------------|----------|
| Guest | localStorage (`buunduu-surtsgaay-retention`) | — |
| Logged-in | Supabase (`user_daily_*`, `user_streaks`) | localStorage mirror on write |

On Supabase error, local data is still saved and UI falls back to local summary.

---

## Supabase tables

### `user_daily_activity`

One row per user + date + activity type. `count` increments on each event.

Activity types:

- `lesson_started`
- `lesson_completed`
- `vocabulary_learned`
- `quiz_completed`
- `review_opened`

### `user_daily_goals`

Per-user targets (defaults: 1 lesson, 5 words, 1 quiz per day).

### `user_streaks`

Cached streak values recomputed from activity dates.

---

## Sync after login

1. **Progress sync** (`ProgressSyncCard`) — lesson/vocab/quiz progress + calls `syncRetentionAfterLogin`
2. **Retention sync** (`RetentionSyncCard`) — dedicated card when local retention exists

Profile shows both when local guest data exists.

---

## Code map

| File | Role |
|------|------|
| `supabase/migrations/009_user_retention.sql` | Schema + RLS |
| `lib/supabase/retention.ts` | Supabase CRUD |
| `lib/retention/daily-activity.ts` | localStorage |
| `lib/retention/retention-service.ts` | Unified API |
| `components/retention/*` | UI |

---

## Run migration

In Supabase SQL Editor (or CLI):

```bash
# Apply migration file
supabase/migrations/009_user_retention.sql
```

Or paste contents into SQL Editor and run.

---

## Test locally

1. Run migration on dev Supabase project
2. `npm run dev`
3. As guest: complete lesson/vocab/quiz → check Profile streak (local)
4. Sign up / login → Profile → **Retention sync** or **Progress sync**
5. Dashboard should show **Account дээр хадгалагдаж байна**
6. `/admin/system-check` — retention tables pass (signed in)

---

## Known limitations

- No push/email reminders yet
- Retention sync merges counts (max) — does not delete remote data
- `review_opened` counts once per day
- `lesson_started` deduped per lesson per day

---

## Related

- [LEARNING_RETENTION.md](./LEARNING_RETENTION.md)
- [RETENTION_PLAN.md](./RETENTION_PLAN.md)
