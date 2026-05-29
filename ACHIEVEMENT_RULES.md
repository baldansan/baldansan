# Achievement Rules

## Definitions

| Key | Title | Condition |
|-----|-------|-----------|
| `first_lesson_started` | Эхний алхам | At least 1 lesson started |
| `first_quiz_completed` | Анхны quiz | At least 1 quiz attempt saved |
| `first_100_score` | 100 оноо | Quiz score 100% (best or latest) |
| `five_words_learned` | 5 үг сурлаа | 5+ vocabulary words marked learned |
| `seven_day_streak` | 7 өдрийн streak | Current streak ≥ 7 days |
| `lesson_completed` | Хичээл дуусгалаа | At least 1 lesson completed |
| `review_started` | Давталт эхэллээ | Review page opened (once per award) |

---

## When evaluated

After each retention activity via `recordActivity()`:

- Lesson started / completed
- Word learned
- Quiz attempt
- Review opened

Progress-based achievements re-check on every activity.

---

## Notification on unlock

Creates in-app notification:

`Achievement unlocked: {title}`

Saved locally and to Supabase when logged in.

---

## Duplicate prevention

- Unique `(user_id, achievement_key)` in Supabase
- Local dedupe by `achievementKey`

---

## Code

- Definitions: `lib/engagement/achievements.ts`
- Award logic: `lib/engagement/achievement-service.ts`
