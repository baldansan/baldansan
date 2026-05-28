# Buunduu Surtsgaay (Бөөндөө Сурцгаая)

A Mongolian–Chinese language learning web app. Users learn Chinese through short video lessons, subtitles, vocabulary, and quizzes.

**Current:** Supabase-first lesson content with local fallback, dynamic lessons 1–4, **Supabase Auth**, account progress, and **admin UI shell** at `/admin` (read-only; no content writes yet).

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
| `/login` | Sign in |
| `/signup` | Sign up |
| `/admin` | Admin dashboard (logged-in; read-only shell) |
| `/admin/lessons` | Lesson management list |

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

## Auth setup (Phase 4)

Requires Supabase project with **Auth** enabled and env vars in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Pages:** [/login](http://localhost:3000/login) · [/signup](http://localhost:3000/signup)

Helpers: [lib/supabase/auth.ts](./lib/supabase/auth.ts). Header shows **Нэвтрэх** or signed-in email + **Гарах**.

**Lesson progress**, **vocabulary learned**, and **quiz attempts** persist to Supabase when signed in, with localStorage always updated as backup. Run [RLS policies](./supabase/policies/001_auth_rls_policies.sql) in Supabase before production auth progress writes.

- [AUTH_PLAN.md](./AUTH_PLAN.md) — Phase 4 auth + RLS (completed)
- [supabase/policies/README.md](./supabase/policies/README.md) — apply RLS before production

**Guest fallback:** Progress works without login in `localStorage`. After login, use **Profile → Account руу хадгалах** to merge guest progress into the account.

## Admin content management roadmap

**`/admin`** requires login and a row in `admin_profiles` (see setup below). Lesson list is read-only; create/edit forms have **save disabled** — no content writes yet.

- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — admin CMS roadmap and security
- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — create → publish → verify workflow
- [supabase/admin/README.md](./supabase/admin/README.md) — run `001_admin_profiles_setup.sql`, bootstrap admin user

**Routes:** `/admin` · `/admin/lessons` · `/admin/lessons/new` · `/admin/lessons/1/edit` (example)

**Draft create:** `/admin/lessons/new` saves lesson metadata to Supabase (requires admin RLS on `lessons`).

**Next step:** Phase 5 Step 5 — Subtitle editor.

## Documentation

- [PROJECT_CHECKPOINT.md](./PROJECT_CHECKPOINT.md) — status & Phase 4 audit
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — roadmap (Phase 5 in progress)
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 admin planning
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — schema + Auth/RLS plan
- [AUTH_PLAN.md](./AUTH_PLAN.md) — Phase 4 auth details
- [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md) — content workflow
- [supabase/README.md](./supabase/README.md) — migrations & seeds
