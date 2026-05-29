# Practice Games — Buunduu Surtsgaay v1.0

Mobile-first vocabulary mini-games using **existing lesson vocabulary** from Supabase/local content. No new database tables.

See also [GAME_DATA_REQUIREMENTS.md](./GAME_DATA_REQUIREMENTS.md).

---

## Routes

| Route | Game | Query |
|-------|------|-------|
| `/games` | Hub — stats, mission card, arcade grid | — |
| `/games/match` | Холбох — match Mongolian ↔ Chinese | `?lessonId=` |
| `/games/translate` | Орчуулах — MCQ Chinese → Mongolian | `?lessonId=` |
| `/games/missing-word` | Дутуу үг — fill blank in example sentence | `?lessonId=` |
| `/games/arrange` | Дараалал — reorder characters | `?lessonId=` |
| `/games/stroke` | Дутуу зураас — component demo placeholder | `?lessonId=` |
| `/kanji/[vocabId]` | Hanzi detail + practice links | `?lessonId=` optional |

---

## Game behavior

### Match (`/games/match`)
- Two columns: Mongolian left, Chinese + pinyin right
- Tap one from each side to pair
- Correct: green lock; wrong: red flash
- Score: +10 per correct pair
- Requires ≥4 vocabulary items with Chinese + Mongolian

### Translate (`/games/translate`)
- Shows Chinese word + pinyin
- 4 Mongolian options (Chinese → Mongolian only in v1.0)
- Correct/wrong feedback, then next question
- Score: +10 per correct answer

### Missing word (`/games/missing-word`)
- Uses `exampleChinese` with target word replaced by blank
- 4 Chinese word options
- Requires example sentences containing the vocabulary word

### Arrange (`/games/arrange`)
- Splits `exampleChinese` into character tiles
- User builds sentence, taps **Шалгах**
- Requires example sentences (≥4 characters)

### Stroke demo (`/games/stroke`)
- **Demo only** — not real stroke recognition
- Shows character + generic component options from a fixed list
- Labeled as first demo version; no fake stroke accuracy

---

## Shared UI

Components in `components/games/`:

- `GameShell` — phone shell, bottom nav hidden during play
- `GameHeader` — back, title, progress, score pill
- `GameCard`, `GameOptionButton`, `GameProgressPill`
- `GameResultCard` — score, accuracy, XP (local), action buttons
- `GameEmptyState` — polished CTA when data insufficient
- `GamePracticeLinks` — reusable links from lesson/review/kanji

---

## Local score storage

`lib/games/game-progress.ts` — localStorage key `buunduu-game-results-v1`

```ts
{
  gameType, lessonId, score, correct, total, accuracy, playedAt
}
```

API:
- `saveGameResult(result)`
- `getGameStats()` — played count, best score, average accuracy
- `getBestScore(gameType, lessonId)`
- `getRecentGameResults(limit?)`

Used on `/games` hub and `/dashboard` stats card.

**Future:** Supabase `game_results` table + RLS for cross-device sync (not in v1.0).

---

## Data source

`lib/games/game-data.ts` loads vocabulary via `getPublicLessonById(lessonId)`.

- `getGameFallbackItems()` — demo-only preview data; **not** used for real lesson games
- Empty state when lesson lacks required fields

---

## Integration points

- Lesson detail — **Тоглоомоор давтах** (match, translate, arrange)
- Vocabulary page — page CTA + per-word game links
- Review — **Үг давтах тоглоомууд**
- Dashboard — game stats + link to `/games`
- Kanji grid → `/kanji/[vocabId]`

---

## Security

- No new backend routes or tables
- No `service_role` exposure
- Uses public lesson content only (same as learner routes)
- RLS unchanged
