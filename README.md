# Buunduu Surtsgaay (Бөөндөө Сурцгаая)

A Mongolian–Chinese language learning web app. Users learn Chinese through short video lessons, subtitles, vocabulary, and quizzes.

**Phase 3 (current):** Supabase-first lesson content with local fallback, dynamic lessons 1–4, and **device-local** progress (localStorage). No authentication or database progress writes yet — that is **Phase 4**.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router)
- TypeScript
- Tailwind CSS 4
- React 19
- Supabase (read-only content when configured)

## Current features

- **Landing** — branding, continue learning from last lesson
- **Courses** — catalog; HSK5 shows local progress when available
- **HSK5 course** — dynamic lesson list (1–4 from Supabase or 1–3 local), search, progress bar
- **Lesson flow** — detail, watch (subtitle modes), vocabulary (HSK1–HSK5 filters), quiz (progress bar, next lesson)
- **Progress (this device)** — lesson started/completed, learned words, quiz scores via `lib/progress.ts`
- **Profile** (`/profile`) — dashboard: stats, quiz history, continue learning
- **Review** (`/review`) — learned words grouped by lesson, quiz summary
- **Navigation** — header (Courses, Demo, Review, Profile); mobile bottom nav on learning pages

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/courses` | Course list |
| `/courses/hsk5` | HSK5 course detail |
| `/lessons/[lessonId]` | Lesson detail |
| `/lessons/[lessonId]/watch` | Watch |
| `/lessons/[lessonId]/vocabulary` | Vocabulary |
| `/lessons/[lessonId]/quiz` | Quiz |
| `/profile` | Learning dashboard |
| `/review` | Daily review |

Examples: `/lessons/1`, `/lessons/4/quiz`. Invalid IDs (e.g. `/lessons/999`) show lesson not found.

## Project structure

```
app/                         # Pages (App Router)
  lessons/[lessonId]/        # Dynamic lesson routes
  profile/                   # Local progress dashboard
  review/                    # Learned words review
content/courses/hsk5/        # Local lessons 1–3
lib/content.ts               # Supabase-first + local fallback
lib/progress.ts              # localStorage progress (Phase 4 → Supabase)
lib/supabase/                # Client + read-only content
supabase/migrations/         # Schema
supabase/seed/               # HSK5 lessons 1–4 SQL
components/                  # AppHeader, BottomNav, shared UI
```

## How to run locally

**Requirements:** Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # Production build
npm run start   # After build
npm run lint    # ESLint
```

## Supabase setup (optional, recommended)

1. Copy [.env.example](./.env.example) to `.env.local`
2. Add **Project URL** and **anon public** key from Supabase → Settings → API
3. Run migrations and seed SQL from [supabase/README.md](./supabase/README.md)
4. Restart dev server

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Never commit `.env.local`** — gitignored via `.env*`.

Without Supabase, lessons **1–3** load from `content/` files. Lesson **4** needs the database seed.

## Suggested demo flow

1. Home → continue or **HSK5** → `/courses/hsk5`
2. Start/Continue a lesson → Watch → Vocabulary (mark learned) → Quiz (≥70% completes lesson)
3. **Profile** — see stats; **Review** — see saved words
4. Header **Demo** → `/lessons/1` for quick access

## Adding new lessons

1. Add seed SQL or local file under `content/courses/hsk5/lessons/`
2. Register local lessons in `content/courses/hsk5/lessons/index.ts`
3. See [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md)

## Documentation

- [PROJECT_CHECKPOINT.md](./PROJECT_CHECKPOINT.md) — status & Phase 3 audit
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — roadmap (Phase 4: Auth + Supabase progress)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — schema
- [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md) — content workflow
- [supabase/README.md](./supabase/README.md) — migrations & seeds

## Next phase

**Phase 4:** Supabase Auth and migrate localStorage progress to `user_progress` tables so progress syncs across devices for signed-in users.
