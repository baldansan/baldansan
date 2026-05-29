# Learning Retention — Streaks, Daily Goals, Reminders

**Phase 7 Step 3** — Buunduu Surtsgaay learner retention features.

**Production:** https://baldansan.vercel.app

---

## What shipped

| Feature | Location | Storage |
|---------|----------|---------|
| Daily learning goal (default 3 actions) | Dashboard streak card, Profile consistency | localStorage |
| Streak counter | Dashboard, Profile | localStorage + Supabase merge |
| Today's progress | Dashboard streak card | local + account activity |
| Daily review CTA | Streak card, Profile consistency | — |
| Activity recording | Lesson watch, vocab, quiz | hooks in `lib/progress.ts` |

---

## Daily goal

Default: **3 learning actions per day**.

Each counts as one action:

- Start or complete a lesson
- Mark a vocabulary word as learned
- Submit a quiz attempt

Goal met when `today.total >= dailyGoal`.

---

## Streak rules

- An **active day** = at least one learning action that day
- **Current streak** = consecutive active days ending today, or yesterday if today is not active yet
- **Longest streak** = best consecutive run in stored history
- **Week view** = last 7 calendar days on Profile

---

## localStorage

Key: `buunduu-surtsgaay-retention`

```typescript
{
  version: 1,
  dailyGoal: 3,
  activityLog: [{ date: "2026-05-29", activities: ["word_learned", ...] }],
  longestStreak: 5,
  remindersEnabled: false
}
```

Separate from lesson progress (`buunduu-surtsgaay-progress`).

On first read, empty retention log bootstraps from existing lesson/quiz timestamps.

---

## Supabase sync (Phase 7 Step 4)

Logged-in users persist retention to Supabase. See [RETENTION_SUPABASE_SYNC.md](./RETENTION_SUPABASE_SYNC.md).

**Future tables** — now migrated in `009_user_retention.sql`:

- `user_daily_activity`
- `user_daily_goals`
- `user_streaks`

---

## Future reminders (not implemented)

| Channel | Status | Notes |
|---------|--------|-------|
| Browser push (PWA) | Planned | Requires permission + service worker extension |
| Email | Planned | Supabase Auth / external provider |
| In-app nudge | Partial | Dashboard streak card when goal not met |

`remindersEnabled` field reserved in retention store.

Recommended order:

1. Ship `user_retention_settings` + RLS
2. Optional `user_daily_activity` for cross-device streak sync
3. PWA push for “daily goal reminder” (evening local time)
4. Email digest (weekly streak summary)

---

## Code map

| File | Role |
|------|------|
| `lib/learning-retention.ts` | Core streak/goal logic |
| `lib/supabase/learning-retention.ts` | Supabase read merge + future sync types |
| `lib/progress.ts` | Records activity on lesson/vocab/quiz writes |
| `components/streak-card.tsx` | Dashboard UI |
| `components/learning-consistency-card.tsx` | Profile UI |

---

## Related

- [USER_ONBOARDING.md](./USER_ONBOARDING.md)
- [PWA_MOBILE_APP_GUIDE.md](./PWA_MOBILE_APP_GUIDE.md)
- [PRODUCT_POLISH_PHASE_7.md](./PRODUCT_POLISH_PHASE_7.md)
