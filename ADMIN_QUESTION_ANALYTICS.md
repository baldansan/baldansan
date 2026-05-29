# Admin question analytics — Buunduu Surtsgaay

Phase 5 Step 19: question-level quiz performance and difficult-question insights.

---

## Route

| Route | Purpose |
|-------|---------|
| `/admin/analytics/questions` | Fleet-wide question insights, filters, difficult questions |

Protected by **AdminGuard** (via `/admin` layout).

Optional query: `?lesson={lessonId}` pre-filters by lesson (used from lesson edit and per-lesson analytics).

---

## Why detailed quiz answers are saved

Previously `user_quiz_attempts.answers` stored `{}` or sync metadata only. Step 19 saves a **JSON array** on each new quiz completion:

```json
[
  {
    "questionId": 42,
    "dbId": 42,
    "orderIndex": 0,
    "type": "multiple_choice",
    "question": "…",
    "selectedAnswer": "…",
    "correctAnswer": "…",
    "isCorrect": true
  }
]
```

Saved from `/lessons/[lessonId]/quiz` via `saveQuizResultSmart()` → `saveSupabaseQuizAttempt()`.

Helper: [lib/quiz-answers.ts](./lib/quiz-answers.ts)

Questions from Supabase include `dbId` (`quiz_questions.id`) and `orderIndex` for stable aggregation.

---

## Metrics

| Metric | Meaning |
|--------|---------|
| Attempts count | Times this question was answered across all attempts |
| Correct / wrong count | From `isCorrect` per answer row |
| Accuracy % | correct / attempts × 100 |
| Most common wrong answers | Top wrong `selectedAnswer` values |
| Needs review | Accuracy &lt; 70% with at least 1 attempt |
| Difficult questions | Subset where `needsReview === true` |

Overview cards on the page:

- Total quiz attempts
- Total answered questions (sum of per-question attempts)
- Average question accuracy
- Difficult questions count

---

## Data source

| Table / field | Usage |
|---------------|--------|
| `user_quiz_attempts.answers` | JSON array of per-question answers |
| `lessons` | Lesson titles |
| `quiz_questions` | Optional content reference (aggregation uses saved answer text) |

Analytics helpers: [lib/supabase/admin-analytics.ts](./lib/supabase/admin-analytics.ts)

- `getQuestionInsightsOverview()`
- `getQuestionLevelAnalytics()`
- `getQuestionLevelAnalyticsByLesson(lessonId, snapshot)`
- `getDifficultQuestions(limit)`

---

## Limitations

1. **Older attempts** — Rows saved before Step 19 may have empty `{}` answers or `{ source: "local_sync" }`. UI shows a note and empty state; analytics does not crash.

2. **No automatic backfill** — Old attempts are not retrofitted.

3. **RLS** — Progress reads use anon + admin JWT. Fleet-wide metrics need admin read policies on `user_quiz_attempts`; otherwise counts may reflect only the logged-in admin’s attempts.

4. **Guest quizzes** — Detailed answers are saved to Supabase only when signed in. localStorage keeps latest attempt answers on device.

---

## Related docs

- [ADMIN_VOCABULARY_ANALYTICS.md](./ADMIN_VOCABULARY_ANALYTICS.md) — vocabulary engagement
- [ADMIN_LEARNING_ANALYTICS.md](./ADMIN_LEARNING_ANALYTICS.md) — per-lesson analytics
- [ADMIN_ANALYTICS.md](./ADMIN_ANALYTICS.md) — main admin dashboard
