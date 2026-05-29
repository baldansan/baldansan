# Buunduu Surtsgaay (Бөөндөө Сурцгаая)

A Mongolian–Chinese language learning web app. Users learn Chinese through short video lessons, subtitles, vocabulary, and quizzes.

**Current:** Supabase-first lesson content with local fallback, **Supabase Auth** + account progress, and **Phase 5 Admin CMS** — full content management, analytics, tasks, activity log, rollback, and release workflow at `/admin`.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router)
- TypeScript
- Tailwind CSS 4
- React 19
- Supabase (content, auth, progress, admin RLS writes)

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
| `/admin` | Admin dashboard (admin role required) |
| `/admin/lessons` | Lesson QA + edit |
| `/admin/activity` | Admin activity log |
| `/admin/final-audit` | Phase 5 readiness checklist |

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

**`/admin`** requires login and a row in `admin_profiles` (see setup below). Admins manage draft lessons, **edit lesson metadata** (title, status, counts, order), edit subtitles/vocabulary/quiz, and publish when complete.

**Lesson statuses** (`lessons.status`): `draft` (hidden from public), `available` (published), `archived` (hidden).

- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — admin CMS roadmap and security
- [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md) — create → publish → verify workflow
- [LESSON_BUILDER_WORKFLOW.md](./LESSON_BUILDER_WORKFLOW.md) — guided Lesson Builder (draft → publish)
- [MEDIA_WORKFLOW.md](./MEDIA_WORKFLOW.md) — lesson media URL metadata (video, thumbnail, audio)
- [ADMIN_ANALYTICS.md](./ADMIN_ANALYTICS.md) — admin dashboard metrics and RLS notes
- [ADMIN_LEARNING_ANALYTICS.md](./ADMIN_LEARNING_ANALYTICS.md) — per-lesson learner progress and quiz analytics
- [ADMIN_QUESTION_ANALYTICS.md](./ADMIN_QUESTION_ANALYTICS.md) — question-level quiz performance insights
- [ADMIN_VOCABULARY_ANALYTICS.md](./ADMIN_VOCABULARY_ANALYTICS.md) — vocabulary engagement (most/least learned)
- [AI_ASSISTED_CONTENT_WORKFLOW.md](./AI_ASSISTED_CONTENT_WORKFLOW.md) — copy-ready improvement prompts (no AI API)
- [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md) — content approval and publish readiness checklist
- [ADMIN_TASK_CENTER.md](./ADMIN_TASK_CENTER.md) — admin content review queue (`/admin/tasks`)
- [ADMIN_TASK_MANAGEMENT.md](./ADMIN_TASK_MANAGEMENT.md) — persistent task status, priority, due dates
- [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md) — Supabase Storage upload for lesson media
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md) — bulk JSON import format (ChatGPT paste)
- [LESSON_EXPORT_FORMAT.md](./LESSON_EXPORT_FORMAT.md) — full lesson JSON backup export
- [LESSON_BACKUP_RESTORE.md](./LESSON_BACKUP_RESTORE.md) — duplicate, restore, replace safety
- [LESSON_PROMPT_TEMPLATE.md](./LESSON_PROMPT_TEMPLATE.md) — master ChatGPT prompt for lesson JSON
- [supabase/admin/README.md](./supabase/admin/README.md) — run `001_admin_profiles_setup.sql`, bootstrap admin user

**Routes:** `/admin` · `/admin/lesson-builder` · `/admin/lessons` · `/admin/lessons/new` · `/admin/lessons/1/edit` (example)

**Admin editors:** `/admin/lessons/new` (draft metadata) · `/admin/lessons/{id}/edit` (metadata save, subtitle, vocabulary, quiz CRUD).

**Metadata edit:** `/admin/lessons/{id}/edit` → edit fields → **Save metadata** / **Refresh counts** → preview at `/lessons/{id}?preview=admin`.

**Bulk import:** `/admin/lessons/{id}/edit` → generate ChatGPT prompt → paste JSON → validate → import → QA summary.

**Export backup:** `/admin/lessons/{id}/edit` → generate/copy/download JSON backup (metadata + content; re-import via bulk import).

**Duplicate & restore:** copy lesson to new draft ID; restore backup JSON with append/replace (confirmation required for replace).

**Lesson Builder:** `/admin/lesson-builder` — select lesson, workflow checklist, QA summary, quick links to edit/preview/export/publish.

**Media:** `/admin/lessons/{id}/edit` → upload thumbnail/audio/video to Supabase Storage, or paste URLs manually. See [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md) and [MEDIA_WORKFLOW.md](./MEDIA_WORKFLOW.md).

**Task center:** `/admin/tasks` — content review queue (missing content, QA, media, release blockers, analytics tasks). See [ADMIN_TASK_CENTER.md](./ADMIN_TASK_CENTER.md).

**Task management:** dismiss, resolve, priority, due dates, notes on `/admin/tasks` (requires migration `006_admin_tasks.sql`). See [ADMIN_TASK_MANAGEMENT.md](./ADMIN_TASK_MANAGEMENT.md).

**Activity log:** `/admin/activity` — audit trail with diff detail at `/admin/activity/{id}`, safe rollback for supported actions, CSV/JSON export (requires migrations `007` + `008`). See [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md), [ADMIN_ACTIVITY_DIFFS.md](./ADMIN_ACTIVITY_DIFFS.md), [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md), [ADMIN_AUDIT_EXPORT.md](./ADMIN_AUDIT_EXPORT.md).

**System check:** `/admin/system-check` — runtime env/Supabase readiness (no secrets shown).

**Next step:** Phase 6 Step 2 — Supabase production verification (do not deploy yet).

## Production readiness (Phase 6)

Planning only — **not deployed yet**.

| Doc | Purpose |
|-----|---------|
| [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) | Full deployment plan |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Go-live checkbox list |
| [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) | Vercel + env vars |
| [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md) | Migrations, policies, SQL checks |

**Stack:** Vercel (Next.js) + Supabase (DB, Auth, Storage). Anon key only in client — never `service_role`.

## Documentation

- [PROJECT_CHECKPOINT.md](./PROJECT_CHECKPOINT.md) — status & audits
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — roadmap (Phase 6 in progress)
- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) — production deployment plan
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — go-live checklist
- [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md) — Phase 5 audit summary
- [ADMIN_PLAN.md](./ADMIN_PLAN.md) — Phase 5 admin planning
- [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md) — admin audit trail
- [ADMIN_ACTIVITY_DIFFS.md](./ADMIN_ACTIVITY_DIFFS.md) — snapshots and diff preview
- [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md) — safe rollback execution
- [ADMIN_AUDIT_EXPORT.md](./ADMIN_AUDIT_EXPORT.md) — activity log CSV/JSON export
- [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md) — Phase 5 readiness summary
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — schema + Auth/RLS plan
- [AUTH_PLAN.md](./AUTH_PLAN.md) — Phase 4 auth details
- [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md) — content workflow
- [supabase/README.md](./supabase/README.md) — migrations & seeds
