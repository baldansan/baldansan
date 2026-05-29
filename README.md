# Buunduu Surtsgaay (Бөөндөө Сурцгаая)

A Mongolian–Chinese language learning web app. Users learn Chinese through short video lessons, subtitles, vocabulary, and quizzes.

**Current:** Supabase-first lesson content with local fallback, **Supabase Auth** + account progress, and **Phase 5 Admin CMS** — full content management, analytics, tasks, activity log, rollback, and release workflow at `/admin`.

## v1.0 learner launch

**Production URL:** https://baldansan.vercel.app

**In scope:** Home, courses, HSK5 lesson flow (watch → vocabulary → quiz), review, dashboard, profile, login/signup, progress save, admin CMS for content fixes.

**Mobile app-like learner UI** — centered phone shell (430px), bottom tab nav, routes `/home`, `/study`, `/kanji`, `/games`, `/profile`. **v1.0 practice games** (match, translate, missing word, arrange, stroke demo) use lesson vocabulary with localStorage scores. **Device/browser TTS pronunciation support** added for Korean (`ko-KR`) and Chinese (`zh-CN`) — speaker buttons on vocabulary, subtitles, quiz, and games; settings on `/profile`. See [TTS_PRONUNCIATION_SYSTEM.md](./TTS_PRONUNCIATION_SYSTEM.md), [PRACTICE_GAMES.md](./PRACTICE_GAMES.md), [MOBILE_APP_REDESIGN_REPORT.md](./MOBILE_APP_REDESIGN_REPORT.md), [MOBILE_UX_POLISH_REPORT.md](./MOBILE_UX_POLISH_REPORT.md).

**Admin ZIP lesson import** at `/admin/import` — upload Korean/Chinese lesson packages (manifest + JSON + optional media). See [LESSON_ZIP_IMPORT_FORMAT.md](./LESSON_ZIP_IMPORT_FORMAT.md), [KOREAN_BOOK_ZIP_WORKFLOW.md](./KOREAN_BOOK_ZIP_WORKFLOW.md).

**Out of scope for v1.0:** Payment, email campaigns, full B2B SaaS, native app. B2B/classroom routes are **foundation only** — they must not block learner launch.

See [V1_LAUNCH_STABILIZATION.md](./V1_LAUNCH_STABILIZATION.md), [V1_LAUNCH_BLOCKERS.md](./V1_LAUNCH_BLOCKERS.md), [V1_STABILIZATION_REPORT.md](./V1_STABILIZATION_REPORT.md), [MOBILE_APP_REDESIGN_REPORT.md](./MOBILE_APP_REDESIGN_REPORT.md), [MOBILE_UX_POLISH_REPORT.md](./MOBILE_UX_POLISH_REPORT.md), [SUPABASE_MIGRATION_STATUS.md](./SUPABASE_MIGRATION_STATUS.md).

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
- **Profile** (`/profile`) — dashboard: stats, quiz history, continue learning, **TTS pronunciation settings**
- **Review** (`/review`) — learned words grouped by lesson, quiz summary
- **Navigation** — header (Courses, Demo, Review, Profile); mobile bottom nav on learning pages
- **PWA / mobile** — installable web app (manifest + icons); see [PWA_MOBILE_APP_GUIDE.md](./PWA_MOBILE_APP_GUIDE.md) and [MOBILE_UX_CHECKLIST.md](./MOBILE_UX_CHECKLIST.md)
- **Retention** — daily goal, streak; [LEARNING_RETENTION.md](./LEARNING_RETENTION.md), [RETENTION_SUPABASE_SYNC.md](./RETENTION_SUPABASE_SYNC.md)
- **Engagement** — reminders, achievements, weekly report; [ENGAGEMENT_SYSTEM.md](./ENGAGEMENT_SYSTEM.md), [ACHIEVEMENT_RULES.md](./ACHIEVEMENT_RULES.md), [REMINDER_SYSTEM_PLAN.md](./REMINDER_SYSTEM_PLAN.md)
- **B2B / schools** — school landing, teacher package, demo, inquiry CRM, pilot onboarding, bulk CSV import, invitation links, optional email delivery; [B2B_SCHOOL_PACKAGE.md](./B2B_SCHOOL_PACKAGE.md), [B2B_CRM_WORKFLOW.md](./B2B_CRM_WORKFLOW.md), [ORGANIZATION_ACCOUNTS.md](./ORGANIZATION_ACCOUNTS.md), [TEACHER_ONBOARDING.md](./TEACHER_ONBOARDING.md), [SCHOOL_INQUIRY_WORKFLOW.md](./SCHOOL_INQUIRY_WORKFLOW.md), [B2B_PILOT_ONBOARDING.md](./B2B_PILOT_ONBOARDING.md), [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md), [BULK_INVITE_WORKFLOW.md](./BULK_INVITE_WORKFLOW.md), [INVITATION_WORKFLOW.md](./INVITATION_WORKFLOW.md), [EMAIL_INVITATION_TEMPLATES.md](./EMAIL_INVITATION_TEMPLATES.md), [INVITATION_EMAIL_DELIVERY.md](./INVITATION_EMAIL_DELIVERY.md), [EMAIL_DELIVERY_SETUP.md](./EMAIL_DELIVERY_SETUP.md)
- **Classroom** — teacher dashboard, classes, assignments, analytics, reports; [CLASSROOM_WORKFLOW.md](./CLASSROOM_WORKFLOW.md), [CLASSROOM_SCHEMA.md](./CLASSROOM_SCHEMA.md), [TEACHER_ASSIGNMENTS_PLAN.md](./TEACHER_ASSIGNMENTS_PLAN.md), [TEACHER_REPORTING.md](./TEACHER_REPORTING.md)

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
| `/games` | Practice games hub (local stats) |
| `/games/match` | Match game — Mongolian ↔ Chinese |
| `/games/translate` | Translate MCQ — Chinese → Mongolian |
| `/games/missing-word` | Cloze — fill missing word in sentence |
| `/games/arrange` | Arrange characters into sentence |
| `/games/stroke` | Stroke/component demo placeholder |
| `/kanji` | Character grid |
| `/kanji/[vocabId]` | Hanzi detail + practice links |
| `/dashboard` | Learner dashboard |
| `/onboarding` | New learner guide |
| `/help` | FAQ |
| `/feedback` | Feedback template |
| `/pricing` | Pricing + B2B packages (no payment) |
| `/schools` | B2B school landing |
| `/teachers` | Teacher package page |
| `/demo` | Demo learning flow |
| `/school-inquiry` | B2B inquiry form (submits to admin CRM) |
| `/admin/b2b` | Admin B2B CRM |
| `/admin/b2b/inquiries` | Inquiry pipeline |
| `/admin/b2b/organizations` | Organization accounts |
| `/teacher-dashboard` | Teacher overview + analytics |
| `/teacher/reports` | Class reports + export |
| `/teacher/classes/{id}` | Classroom detail + analytics |
| `/teacher/assignments/{id}` | Assignment detail + analytics |
| `/teacher/classes` | Class list |
| `/teacher/assignments` | Assignment list |
| `/teacher/assignments/new` | Create assignment |
| `/organization` | Organization hub — list memberships |
| `/organization/{organizationId}` | Organization dashboard |
| `/organization/{organizationId}/members` | Member management + create invite link |
| `/organization/{organizationId}/members/import` | Bulk CSV import members |
| `/organization/{organizationId}/invitations` | Organization invitation list |
| `/teacher/classes/{classroomId}/students/import` | Bulk CSV import students |
| `/teacher/classes/{classroomId}/invitations` | Classroom student invitation list |
| `/organization/{organizationId}/setup` | Pilot setup wizard |
| `/organization/{organizationId}/dashboard` | Pilot dashboard |
| `/invite/{token}` | Accept organization or classroom invitation |
| `/organization/{organizationId}/classrooms` | Organization classrooms |
| `/organization/{organizationId}/assignments` | Organization assignments |
| `/organization/{organizationId}/reports` | School admin reports + export |
| `/my-assignments` | Student assignment inbox |
| `/profile` | Learning dashboard |
| `/review` | Daily review |
| `/login` | Sign in |
| `/signup` | Sign up |
| `/deployment-check` | Public deployment smoke test (post-deploy) |
| `/admin` | Admin dashboard (admin role required) |
| `/admin/lessons` | Lesson QA + edit |
| `/admin/import` | ZIP lesson package import (draft) |
| `/admin/activity` | Admin activity log |
| `/admin/final-audit` | Phase 5 readiness checklist |
| `/admin/production-qa` | Production launch QA checklist |
| `/admin/security-audit` | Security / RLS audit |

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

## PWA / mobile install

The app can be installed on phone or desktop as a standalone web app (PWA).

- **Manifest:** `public/manifest.webmanifest`
- **Icons:** `public/icons/` (192, 512, maskable)
- **Offline:** `/offline` and minimal service worker (navigation fallback only)

Install instructions and offline limitations: [PWA_MOBILE_APP_GUIDE.md](./PWA_MOBILE_APP_GUIDE.md)  
Mobile QA checklist: [MOBILE_UX_CHECKLIST.md](./MOBILE_UX_CHECKLIST.md)

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

**Routes:** `/admin` · `/admin/import` · `/admin/lesson-builder` · `/admin/lessons` · `/admin/lessons/new` · `/admin/lessons/1/edit` (example)

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

**System check:** [`/admin/system-check`](/admin/system-check) — runtime env/Supabase readiness (pass/warn/fail badges; no secrets shown). Run alongside [supabase/verify/production_verification.sql](./supabase/verify/production_verification.sql) in Supabase SQL Editor.

**Deployment check:** [`/deployment-check`](/deployment-check) — public post-deploy smoke test (no login; no secrets).

**Production QA:** [`/admin/production-qa`](/admin/production-qa) — manual launch checklist after each deploy (admin; localStorage + export).

**Security audit:** [`/admin/security-audit`](/admin/security-audit) — RLS, auth, storage, visibility checks before launch (export JSON/Markdown).

**Launch candidate:** [`/admin/launch-candidate`](/admin/launch-candidate) — final smoke test, go-live decision, launch report export (run before go-live and after every production deploy).

**Launch sign-off:** [`/admin/launch-signoff`](/admin/launch-signoff) — final go/no-go decision, version, owner, and sign-off report export.

**Phase 6 complete.** Phase 7 Step 1 learner polish live. **Production URL:** https://baldansan.vercel.app

## User-facing routes (Phase 7)

| Route | Purpose |
|-------|---------|
| [`/`](./) | Landing page |
| [`/dashboard`](/dashboard) | Learner dashboard (login recommended) |
| [`/onboarding`](/onboarding) | New user guide |
| [`/courses`](/courses) | Course catalog |
| [`/courses/hsk5`](/courses/hsk5) | HSK5 roadmap + continue learning |
| [`/help`](/help) | FAQ |
| [`/feedback`](/feedback) | Feedback template (copy only) |
| [`/pricing`](/pricing) | Plans + B2B packages (no payment) |
| [`/schools`](/schools) | B2B school landing |
| [`/teachers`](/teachers) | Teacher package |
| [`/demo`](/demo) | Demo learning flow |
| [`/school-inquiry`](/school-inquiry) | B2B inquiry (submits to admin CRM) |
| [`/teacher-dashboard`](/teacher-dashboard) | Teacher dashboard preview |
| [`/review`](/review) | Vocabulary review |
| [`/profile`](/profile) | Account and progress |

See [USER_ONBOARDING.md](./USER_ONBOARDING.md) and [PRODUCT_POLISH_PHASE_7.md](./PRODUCT_POLISH_PHASE_7.md).

## Deployment (Phase 6)

Repo is prepared for **manual Vercel deployment** — not auto-deployed from code.

| Resource | Purpose |
|----------|---------|
| [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) | Connect GitHub, env vars, deploy, Supabase Auth URLs |
| [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md) | Migrations, policies, verification SQL |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Go-live checkbox list |
| [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) | Full Phase 6 deployment plan |
| [`/deployment-check`](/deployment-check) | Public smoke test after deploy |
| [`/admin/system-check`](/admin/system-check) | Admin verification after deploy |
| [`/admin/production-qa`](/admin/production-qa) | Launch QA checklist + export |
| [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md) | Live route testing guide |

Copy [.env.example](./.env.example) to `.env.local` locally. On Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only — never `service_role`.

**Production URL:** https://baldansan.vercel.app — run `/deployment-check` and `/admin/production-qa` after each deploy.

## Production readiness (Phase 6)

Phase 6 complete. Run checklists on production before launch sign-off.

| Doc | Purpose |
|-----|---------|
| [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) | Full deployment plan |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Go-live checkbox list |
| [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) | Vercel + env vars |
| [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md) | Migrations, policies, SQL checks |
| [supabase/verify/README.md](./supabase/verify/README.md) | Production verification SQL (Phase 6 Step 2) |
| [`/admin/system-check`](/admin/system-check) | App-side verification (admin, read-only) |
| [`/deployment-check`](/deployment-check) | Public smoke test (post-deploy) |
| [`/admin/production-qa`](/admin/production-qa) | Launch QA checklist (post-deploy) |
| [`/admin/security-audit`](/admin/security-audit) | Security/RLS audit (pre-launch) |
| [`/admin/launch-candidate`](/admin/launch-candidate) | Final smoke test + launch candidate decision |
| [`/admin/launch-signoff`](/admin/launch-signoff) | Production launch sign-off (go/no-go) |
| [LAUNCH_SIGNOFF.md](./LAUNCH_SIGNOFF.md) | Sign-off workflow and decision definitions |
| [GO_LIVE_NOTES.md](./GO_LIVE_NOTES.md) | Launch steps and day-of checklist |
| [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) | Vercel/Git/Supabase rollback |
| [POST_LAUNCH_MONITORING.md](./POST_LAUNCH_MONITORING.md) | First-week monitoring routine |
| [PHASE_6_LAUNCH_SUMMARY.md](./PHASE_6_LAUNCH_SUMMARY.md) | Phase 6 launch summary |
| [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md) | Live testing guide |
| [SECURITY_RLS_AUDIT.md](./SECURITY_RLS_AUDIT.md) | RLS model and audit guide |
| [LAUNCH_CANDIDATE_CHECKLIST.md](./LAUNCH_CANDIDATE_CHECKLIST.md) | Final launch sign-off |

**Stack:** Vercel (Next.js) + Supabase (DB, Auth, Storage). Anon key only in client — never `service_role`.

## Documentation

- [PROJECT_CHECKPOINT.md](./PROJECT_CHECKPOINT.md) — status & audits
- [PRODUCT_POLISH_PHASE_7.md](./PRODUCT_POLISH_PHASE_7.md) — Phase 7 polish summary
- [USER_ONBOARDING.md](./USER_ONBOARDING.md) — learner journey
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — roadmap (Phase 7 Step 1 complete)
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
- [SECURITY_RLS_AUDIT.md](./SECURITY_RLS_AUDIT.md) — RLS and security audit
- [LAUNCH_CANDIDATE_CHECKLIST.md](./LAUNCH_CANDIDATE_CHECKLIST.md) — launch sign-off
- [PRODUCTION_ROUTE_TESTING.md](./PRODUCTION_ROUTE_TESTING.md) — live route testing
