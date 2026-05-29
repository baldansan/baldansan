# Project Checkpoint — Buunduu Surtsgaay

**Project:** Buunduu Surtsgaay (Бөөндөө Сурцгаая)  
**Checkpoint date:** May 2026  
**Status:** Phase 7 Step 5 Engagement system **completed**

---

## Phase 7 Step 5 — In-app reminders, notifications, achievements, weekly report, study plan — **Completed**

| Area | Deliverable |
|------|-------------|
| Migration | `010_user_reminders_achievements.sql` |
| Routes | `/reminders`, `/notifications`, `/weekly-report`, `/study-plan` |
| Engagement | Achievements, in-app notifications, weekly report |
| UI | Dashboard/profile/home/review integration, notification bell |
| Docs | ENGAGEMENT_SYSTEM.md, ACHIEVEMENT_RULES.md, REMINDER_SYSTEM_PLAN.md |

**Next:** Phase 7 Step 6 — School/B2B onboarding.

---

## Phase 7 Step 4 — Supabase sync for daily goals, streaks, and daily activity — **Completed**

Phase 7 Step 4: Supabase-backed retention for logged-in users with localStorage guest fallback.

| Area | Deliverable |
|------|-------------|
| Migration | `009_user_retention.sql` — activity, goals, streaks + RLS |
| Supabase | `lib/supabase/retention.ts` |
| Unified | `lib/retention/retention-service.ts`, `daily-activity.ts` |
| Sync | `RetentionSyncCard`, progress sync integration |
| UI | `components/retention/*`, daily goal settings on Profile |
| Docs | RETENTION_SUPABASE_SYNC.md, RETENTION_PLAN.md |

**Next:** Phase 7 Step 5 — Reminder system planning / in-app reminder center.

---

## Phase 7 Step 3 — Learner retention (streaks, daily goals) — **Completed**

Phase 7 Step 3: Daily learning goal, streak counter, today progress, daily review CTA, dashboard streak card, profile learning consistency.

| Area | Deliverable |
|------|-------------|
| Retention | `lib/learning-retention.ts` — localStorage log, streak/goal logic |
| Supabase | `lib/supabase/learning-retention.ts` — read merge + future sync types |
| Dashboard | `StreakCard` — streak, goal progress, daily review |
| Profile | `LearningConsistencyCard` — week view, longest streak |
| Hooks | Activity recorded on lesson/vocab/quiz in `lib/progress.ts` |
| Docs | LEARNING_RETENTION.md |

---

## Phase 7 Step 2 — PWA/mobile app-like experience and offline-friendly polish — **Completed**

Phase 7 Step 2: PWA manifest, install helper, mobile navigation, loading/offline states, learner mobile UX polish added.

| Area | Deliverable |
|------|-------------|
| PWA | `manifest.webmanifest`, icons, metadata, minimal service worker |
| Offline | `/offline`, `public/offline.html` |
| Install | `PwaInstallCard` on home, dashboard, onboarding |
| Mobile nav | Bottom nav active states, touch targets, auth-aware items |
| Loading | Route-level skeletons, global `not-found` |
| Learner UX | Continue learning bar, lesson step bar, quick review, review collapsible groups |
| Docs | PWA_MOBILE_APP_GUIDE.md, MOBILE_UX_CHECKLIST.md |

---

## Phase 7 Step 1 — User-facing product polish — **Completed**

Phase 7 Mega Batch: User-facing product polish, onboarding, dashboard, help, feedback, and pricing placeholder added.

| Area | Deliverable |
|------|-------------|
| Landing | Polished home page with hero, how-it-works, course highlights |
| Routes | `/dashboard`, `/onboarding`, `/help`, `/feedback`, `/pricing` |
| Nav | Auth-aware header, bottom nav, `AppFooter` |
| Courses | HSK5 continue learning, extended progress, lesson roadmap badges |
| Docs | USER_ONBOARDING.md, PRODUCT_POLISH_PHASE_7.md |

---

## Phase 6 Step 7 — Production launch sign-off — **Completed**

Phase 6 Step 7: Production launch sign-off workflow added.

| Area | Deliverable |
|------|-------------|
| Route | `/admin/launch-signoff` — checklist, go/no-go, version/owner, export |
| Report | `lib/admin/launch-signoff-report.ts` |
| Components | signoff-checklist, signoff-decision-card, signoff-report-export-card, signoff-summary-cards |
| Docs | LAUNCH_SIGNOFF.md; updates to GO_LIVE_NOTES, POST_LAUNCH_MONITORING, ROLLBACK_PLAN |
| Storage | localStorage `buunduu-launch-signoff` |

**Next:** Phase 7 — Product polish and user-facing onboarding.

---

## Phase 6 Step 6 — Launch candidate — **Completed**

Phase 6 Step 6: Launch candidate final smoke test and go-live notes added.

| Area | Deliverable |
|------|-------------|
| Route | `/admin/launch-candidate` — smoke test, status cards, decision, export |
| Report | `lib/admin/launch-candidate-report.ts` |
| Components | launch-status-card, launch-checklist, launch-decision-card, launch-report-export-card |
| Docs | GO_LIVE_NOTES.md, ROLLBACK_PLAN.md, POST_LAUNCH_MONITORING.md, PHASE_6_LAUNCH_SUMMARY.md |
| Storage | localStorage `buunduu-launch-candidate` |

**Next:** Production launch sign-off or Phase 7.

---

## Phase 6 Step 5 — Security/RLS final audit — **Completed**

Phase 6 Step 5: Security/RLS final audit and launch candidate tools added.

| Area | Deliverable |
|------|-------------|
| Route | `/admin/security-audit` — pass/warn/fail/manual checks + export |
| Report | `lib/admin/security-audit-report.ts` |
| SQL | Enhanced `production_verification.sql` — security checks |
| Docs | SECURITY_RLS_AUDIT.md, LAUNCH_CANDIDATE_CHECKLIST.md |
| Integration | Admin dashboard, final-audit, production-qa |

**Next:** Phase 6 Step 6 — Launch candidate final smoke test and go-live notes.

---

## Phase 6 Step 4 — Production route testing — **Completed**

Phase 6 Step 4: Production route testing and launch QA dashboard added.

| Area | Deliverable |
|------|-------------|
| Route | `/admin/production-qa` — manual launch checklist |
| Components | production-route-checklist, production-qa-summary, production-qa-export-card |
| Report | `lib/admin/production-qa-report.ts` — JSON/Markdown export |
| Storage | localStorage `buunduu-production-qa` |
| Docs | PRODUCTION_ROUTE_TESTING.md, LAUNCH_QA_REPORT_TEMPLATE.md |
| Integration | Admin dashboard card, final-audit Phase 6 section |

**Production URL:** https://baldansan.vercel.app

**Next:** Phase 6 Step 5 — Security/RLS final audit and launch candidate.

---

## Phase 6 Step 3 — Vercel deployment setup — **Completed**

Phase 6 Step 3: Vercel deployment setup prepared.

| Area | Deliverable |
|------|-------------|
| Config | `vercel.json` — minimal Next.js framework hint |
| Env | `.env.example` — safe public variable template |
| Smoke test | `/deployment-check` — public post-deploy route |
| Guide | `VERCEL_DEPLOYMENT_GUIDE.md` — full deploy + Auth URL steps |
| Admin | `/admin/system-check` — deployment check route link |
| Checklists | PRODUCTION_CHECKLIST, DEPLOYMENT_PLAN updated |

**Next:** Phase 6 Step 4 — Production route testing after first deploy.

---

## Phase 6 Step 2 — Supabase production verification — **Completed**

Phase 6 Step 2: Supabase production verification scripts and system checks added.

| Area | Deliverable |
|------|-------------|
| SQL | `supabase/verify/production_verification.sql` — read-only pass/warn/fail checks |
| Docs | `supabase/verify/README.md` — how to run, common fixes |
| System check | Enhanced `/admin/system-check` — env, auth, content, admin tables, storage, progress |
| UI | Pass/warn/fail badges, SQL copy card, grouped checks |
| Production docs | SUPABASE_PRODUCTION_SETUP, PRODUCTION_CHECKLIST, DEPLOYMENT_PLAN updated |

**Next:** Phase 6 Step 3 — Vercel deployment setup.

---

## Phase 6 Step 1 — Production readiness planning — **Completed**

Phase 6 Step 1: Production readiness planning and deployment checklist added.

| Area | Deliverable |
|------|-------------|
| Docs | DEPLOYMENT_PLAN.md, PRODUCTION_CHECKLIST.md, VERCEL_DEPLOYMENT_GUIDE.md, SUPABASE_PRODUCTION_SETUP.md |
| System check | `/admin/system-check`, `lib/system/system-checks.ts` |
| Final audit | Phase 6 readiness section on `/admin/final-audit` |
| Dashboard | System check quick action + admin card |

---

## Phase 5 Final Audit — **Completed**

Phase 5 Final Audit completed (May 2026).

| Area | Result |
|------|--------|
| Routes | All public + admin routes build; see [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md) |
| Security | No service_role; .env.local gitignored; AdminGuard verified in code |
| Activity log | Client-session fetch on `/admin/activity`, dashboard, lesson edit |
| Docs | PHASE_5_FINAL_AUDIT.md, final-audit page, DEVELOPMENT_PLAN Phase 5 closed |
| Build | `npm run build` passes |

**Next:** Phase 6 — Deployment / Production Readiness.

---

## Phase 5 Step 26 — CMS hardening and rollback/export tools — **Completed**

Phase 5 Mega Batch: production CMS hardening, safe rollback, audit export, and final audit page.

| Area | Deliverable |
|------|-------------|
| Rollback | `admin-rollback.ts`, `admin-rollback-eligibility.ts`, `rollback-execution-card` |
| Export | `activity-export.ts`, CSV/JSON/copy on `/admin/activity` |
| Filters | Rollback available/unsupported, summary cards |
| Dashboard | Production safety section, quick actions, final audit link |
| Final audit | `/admin/final-audit` read-only checklist |
| Docs | `ADMIN_ROLLBACK_WORKFLOW.md`, `ADMIN_AUDIT_EXPORT.md`, `PHASE_5_FINAL_AUDIT.md` |

**Next:** Phase 5 Final Audit (manual walkthrough) or Phase 6 — Deployment / Production Readiness.

---

## Phase 5 Step 25 — Activity diff / rollback preview — **Completed**

Phase 5 Step 25: Activity diff and rollback preview added.

| Area | Deliverable |
|------|-------------|
| Migration | `008_admin_activity_snapshots.sql` |
| Helpers | `admin-activity-diff.ts`, snapshot fields on `logAdminActivity` |
| Route | `/admin/activity/[activityId]` — diff + rollback preview (disabled) |
| Snapshots | Metadata, media, status, release, import, restore, duplicate |
| Docs | [ADMIN_ACTIVITY_DIFFS.md](./ADMIN_ACTIVITY_DIFFS.md) |

**Next:** Phase 5 Step 26 — Safe rollback execution. Or Phase 5 Final Audit.

---

## Phase 5 Step 24 — Admin activity log / audit trail — **Completed**

Phase 5 Step 24: Admin activity log / audit trail added.

| Area | Deliverable |
|------|-------------|
| Migration | `007_admin_activity_log.sql` |
| Helpers | `admin-activity.ts`, `admin-activity-log.ts` |
| Route | `/admin/activity` — filters, summary, activity list |
| Integration | Dashboard recent activity, lesson edit, lesson builder, admin nav |
| Docs | [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md) |

**Next:** Phase 5 Step 25 — Activity diff/rollback preview. Or Phase 5 Final Audit.

---

## Phase 5 Step 23 — Persistent admin task management — **Completed**

Phase 5 Step 23: Persistent admin task management added with status, priority, due dates, notes, and dismiss/resolve workflow.

| Area | Deliverable |
|------|-------------|
| Migration | `006_admin_tasks.sql` |
| Helpers | `admin-task-persistence.ts`, `task-merge.ts` |
| UI | Status/priority/due/note actions on task cards |
| Integration | Dashboard overdue/urgent, lesson edit actions |
| Docs | [ADMIN_TASK_MANAGEMENT.md](./ADMIN_TASK_MANAGEMENT.md) |

**Next:** Phase 5 Step 24 — Admin activity log and audit trail. Or Phase 5 Final Audit.

---

## Phase 5 Step 22 — Admin Task Center & content review queue — **Completed**

Phase 5 Step 22: Admin Task Center and Content Review Queue added.

| Area | Deliverable |
|------|-------------|
| Helpers | `lib/admin/task-generator.ts`, `lib/supabase/admin-tasks.ts` |
| Route | `/admin/tasks` |
| UI | Task cards, filters, summary cards |
| Integration | `/admin`, lesson edit, lesson builder, analytics |
| Docs | [ADMIN_TASK_CENTER.md](./ADMIN_TASK_CENTER.md) |

Tasks generated from live data — no task persistence table yet.

**Next:** Phase 5 Step 24 — Admin activity log and audit trail. Or Phase 5 Final Audit.

---

## Phase 5 Step 21 — Content approval & release readiness — **Completed**

Phase 5 Step 21: Content approval and release readiness workflow added.

| Area | Deliverable |
|------|-------------|
| Migration | `005_lesson_release_workflow.sql` |
| Helpers | `release-readiness.ts`, `admin-release.ts` |
| UI | Release checklist, approval controls, publish gate |
| Integration | `/admin/lessons`, dashboard metrics, lesson builder |
| Docs | [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md) |

**Next:** Phase 5 Step 24 — Admin activity log and audit trail. Or Phase 5 Final Audit.

---

## Phase 5 Step 20 — AI-assisted content improvement prompts — **Completed**

Phase 5 Step 20: AI-assisted content improvement prompt workflow added.

| Area | Deliverable |
|------|-------------|
| Helpers | `lib/admin/improvement-prompts.ts` |
| UI | `improvement-prompt-card`, `prompt-library-view` |
| Route | `/admin/prompts` |
| Integration | Lesson edit, lesson analytics, question/vocabulary insights, dashboard, lesson builder |
| Docs | [AI_ASSISTED_CONTENT_WORKFLOW.md](./AI_ASSISTED_CONTENT_WORKFLOW.md) |

No OpenAI API — copy-ready prompts only.

**Next:** Phase 5 Step 21 — Content approval checklist. Or Phase 5 Final Audit.

---

## Phase 5 Step 19 — Question-level quiz analytics & vocabulary engagement — **Completed**

Phase 5 Step 19: Question-level quiz analytics and vocabulary engagement insights added.

| Area | Deliverable |
|------|-------------|
| Quiz persistence | Detailed `answers` JSON array on new quiz attempts |
| Routes | `/admin/analytics/questions`, `/admin/analytics/vocabulary` |
| Analytics | Question + vocabulary helpers in `lib/supabase/admin-analytics.ts` |
| Integration | Per-lesson analytics, main analytics, lesson edit links |
| Docs | [ADMIN_QUESTION_ANALYTICS.md](./ADMIN_QUESTION_ANALYTICS.md), [ADMIN_VOCABULARY_ANALYTICS.md](./ADMIN_VOCABULARY_ANALYTICS.md) |

**Next:** Phase 5 Step 20 — Content quality recommendations. Or Phase 5 Final Audit.

---

## Phase 5 Step 18 — Per-lesson learning analytics — **Completed**

Phase 5 Step 18: Per-lesson learning analytics dashboard added.

| Area | Deliverable |
|------|-------------|
| Routes | `/admin/analytics`, `/admin/analytics/lessons/[lessonId]` |
| Analytics | Extended `lib/supabase/admin-analytics.ts` |
| UI | `lesson-analytics-table`, `lesson-analytics-detail-view`, performance badges |
| Integration | Links from `/admin` and `/admin/lessons` |
| Docs | [ADMIN_LEARNING_ANALYTICS.md](./ADMIN_LEARNING_ANALYTICS.md) |

---

## Phase 5 Step 17 — Admin analytics dashboard — **Completed**

Phase 5 Step 17: Admin analytics and content metrics dashboard added.

| Area | Deliverable |
|------|-------------|
| Analytics | `lib/supabase/admin-analytics.ts` |
| Dashboard | `/admin` — overview, content QA, media, learner progress |
| Components | `admin-metric-card`, `admin-dashboard-section`, `admin-attention-list`, `admin-recent-activity` |
| QA page | `/admin/lessons` top summary row |
| Docs | [ADMIN_ANALYTICS.md](./ADMIN_ANALYTICS.md) |

**Next:** Phase 5 Step 18 — Admin progress analytics by lesson. Or Phase 5 Final Audit.

---

## Phase 5 Step 16 — Supabase Storage media upload — **Completed**

Phase 5 Step 16: Supabase Storage media upload foundation added.

| Area | Deliverable |
|------|-------------|
| Storage | `supabase/storage/001_lesson_media_bucket_policies.sql`, bucket `lesson-media` |
| Upload | `lib/supabase/media-upload.ts`, `lesson-media-upload-card` |
| Admin | Integrated on edit page; QA dashboard Th/Vid/Aud indicators |
| Builder | Checklist Step 5 — Upload / attach media |
| Docs | [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md) |

**Next:** Phase 5 Step 18 — Admin progress analytics by lesson. Or Phase 5 Final Audit.

---

## Phase 5 Step 15 — Lesson media/video metadata — **Completed**

Phase 5 Step 15: Lesson media/video metadata management foundation added.

| Area | Deliverable |
|------|-------------|
| Migration | `002_lesson_media_fields.sql` |
| Admin | `lesson-media-editor`, `updateLessonMedia` |
| Public | `lesson-media-display` on detail + watch pages |
| Docs | [MEDIA_WORKFLOW.md](./MEDIA_WORKFLOW.md) |

**Next:** Phase 5 Step 17 — Content analytics / admin metrics dashboard. Or Phase 5 Final Audit.

---

## Phase 5 Step 14 — Guided Lesson Builder workflow — **Completed**

Phase 5 Step 14: Guided Lesson Builder workflow added.

| Area | Deliverable |
|------|-------------|
| Route | `/admin/lesson-builder` |
| UI | `lesson-builder-workflow`, `lesson-builder-checklist`, `lesson-package-summary` |
| Docs | [LESSON_BUILDER_WORKFLOW.md](./LESSON_BUILDER_WORKFLOW.md) |

---

## Phase 5 Step 13 — Duplicate, restore, import safety — **Completed**

Phase 5 Step 13: Lesson duplicate, restore, and destructive import safety tools added.

| Area | Deliverable |
|------|-------------|
| API | `duplicateLesson`, `restoreLessonFromBackup` |
| UI | `lesson-duplicate-card`, `lesson-restore-card`, bulk import replace confirmation |
| Docs | [LESSON_BACKUP_RESTORE.md](./LESSON_BACKUP_RESTORE.md) |

---

## Phase 5 Step 12 — Lesson JSON export and backup — **Completed**

Phase 5 Step 12: Lesson JSON export and backup tools added.

| Area | Deliverable |
|------|-------------|
| API | `getLessonExportPayload`, `buildLessonExportJson` in [lib/supabase/admin-export.ts](./lib/supabase/admin-export.ts) |
| UI | `lesson-export-card` on `/admin/lessons/{id}/edit` |
| Docs | [LESSON_EXPORT_FORMAT.md](./LESSON_EXPORT_FORMAT.md) |

---

## Phase 5 Step 11 — Admin lesson metadata edit/save — **Completed**

Phase 5 Step 11: Admin lesson metadata edit/save added.

| Area | Deliverable |
|------|-------------|
| API | `updateLessonMetadata`, `validateUpdateLessonMetadataInput`, `getAdminLessonMetadataById`, `refreshLessonCounts` |
| UI | `lesson-metadata-editor` on `/admin/lessons/{id}/edit` — save metadata, refresh counts, preview |

---

## Phase 5 Step 8 — Publish / unpublish workflow — **Completed**

Phase 5 Publish workflow added: draft/available/archived visibility, admin publish controls, and public unavailable state.

| Area | Deliverable |
|------|-------------|
| Public helpers | `getPublicLessonsByCourseId`, `getPublicLessonById`, `resolveLessonPageAccess` |
| UI | `lesson-unavailable.tsx`, `publishing-controls.tsx`, admin preview `?preview=admin` |
| API | `updateLessonStatus`, `getLessonCompleteness` |

---

## Phase 5 Step 10 — Prompt generator + QA assistant — **Completed**

Phase 5 Step 10: Lesson content prompt generator and import QA assistant added.

| Area | Deliverable |
|------|-------------|
| UI | `lesson-prompt-generator`, `import-qa-summary` on lesson edit |
| Logic | [lib/admin/lesson-prompt.ts](./lib/admin/lesson-prompt.ts), [lib/admin/import-qa.ts](./lib/admin/import-qa.ts) |
| Docs | [LESSON_PROMPT_TEMPLATE.md](./LESSON_PROMPT_TEMPLATE.md) |

---

## Phase 5 Step 9 — Bulk JSON import — **Completed**

Phase 5 Step 9: Bulk JSON import for subtitles, vocabulary, and quiz content added.

| Area | Deliverable |
|------|-------------|
| API | `lib/supabase/admin-import.ts` — append/replace import |
| UI | `components/admin/bulk-import-editor.tsx` on lesson edit |
| Docs | [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md) |

---

## Phase 5 Big Batch — Subtitle / vocabulary / quiz editors — **Completed**

Admins add child content on `/admin/lessons/[lessonId]/edit` via Supabase (admin RLS). `refreshLessonCounts` syncs vocab/quiz metadata.

| Area | Deliverable |
|------|-------------|
| API | [lib/supabase/admin-content.ts](./lib/supabase/admin-content.ts) — CRUD + count refresh |
| UI | `subtitle-editor`, `vocabulary-editor`, `quiz-editor` |

---

## Phase 5 Step 4 — Draft lesson create — **Completed**

Admins save lesson metadata from `/admin/lessons/new` to Supabase `lessons` (draft, counts 0).

| Area | Deliverable |
|------|-------------|
| Writes | [lib/supabase/admin-content.ts](./lib/supabase/admin-content.ts) — `createDraftLesson` (anon + admin RLS) |
| UI | [components/admin/lesson-create-form.tsx](./components/admin/lesson-create-form.tsx) |

**Next:** Phase 5 Step 5 — Subtitle editor.

---

## Phase 5 Step 3 — Admin lesson list + QA — **Completed**

Lesson Management QA at `/admin/lessons`; edit page content previews. No writes.

| Area | Deliverable |
|------|-------------|
| QA logic | [lib/admin/lesson-qa.ts](./lib/admin/lesson-qa.ts) |
| UI | [components/admin/admin-lessons-list.tsx](./components/admin/admin-lessons-list.tsx), summary cards, QA badges |
| Edit preview | Subtitle / vocabulary / quiz read-only sections |

**Next:** Phase 5 Step 4 — Lesson create draft write.

---

## Phase 5 Step 2 — Admin role setup — **Completed**

Admin routes protected with `AdminGuard` + `admin_profiles` lookup. No content writes.

| Area | Deliverable |
|------|-------------|
| SQL | [supabase/admin/001_admin_profiles_setup.sql](./supabase/admin/001_admin_profiles_setup.sql) |
| Helpers | [lib/supabase/admin.ts](./lib/supabase/admin.ts) |
| UI gate | [components/admin/admin-guard.tsx](./components/admin/admin-guard.tsx) |
| Nav | Admin header link + profile status (admins only) |

**Next:** Phase 5 Step 3 — Admin lesson list with safe Supabase read.

---

## Phase 5 Admin Foundation — **Completed**

Admin planning docs, dashboard shell, lesson management UI, and lesson editor skeleton. No Supabase content writes.

| Area | Deliverable |
|------|-------------|
| Docs | [ADMIN_PLAN.md](./ADMIN_PLAN.md), [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md), [supabase/admin/README.md](./supabase/admin/README.md), `002_admin_content_policies.sql` |
| Routes | `/admin`, `/admin/lessons`, `/admin/lessons/new`, `/admin/lessons/[lessonId]/edit` |
| UI | `components/admin/*` — header, cards, lesson list (read), forms (save disabled) |
| Nav | Header Admin link (logged-in); Profile content admin card |
| Safety | No DB writes; no service_role in client |

**Next:** Phase 5 Step 2 — Admin role setup and protected admin access.

---

## Phase 4 Final Audit — **Completed**

Audited authentication routes, header auth UI, Supabase progress writes, guest localStorage fallback, Profile sync-after-login, security, documentation, and production build. Build passes; `.env.local` gitignored.

| Area | Result |
|------|--------|
| Auth routes | `/login`, `/signup`, `/profile`, `/review` — client pages with Supabase auth helpers |
| Auth UI | Header: **Нэвтрэх** when logged out; email + **Гарах** when logged in; logout clears session |
| Lesson progress | `user_lesson_progress` via `markLessonStartedSmart` / `markLessonCompletedSmart` + localStorage |
| Vocabulary | `user_vocabulary_progress` via `toggleLearnedWordSmart` + `dbId` mapping + localStorage |
| Quiz attempts | `user_quiz_attempts` via `saveQuizResultSmart` + localStorage |
| Guest fallback | All progress types work without login via `lib/progress.ts` localStorage |
| Post-login merge | `ProgressSyncCard` on `/profile` — `syncLocalProgressToSupabase`; dismiss reset on login |
| RLS docs | [AUTH_PLAN.md](./AUTH_PLAN.md), [supabase/policies/README.md](./supabase/policies/README.md) — run `001_auth_rls_policies.sql` before production |
| Security | `.env*` in `.gitignore`; client uses anon key only; no service_role in repo; warns do not log secrets |
| Routes / build | `/` through `/lessons/4/*`, `/profile`, `/review`, `/login`, `/signup`; `npm run build` OK |

**Recommended next:** Phase 5 — Admin content management / lesson upload workflow.

---

## Phase 4 summary (Steps 1–7)

| Step | Deliverable |
|------|-------------|
| 1 | [AUTH_PLAN.md](./AUTH_PLAN.md), [supabase/policies/001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql) |
| 2 | [lib/supabase/auth.ts](./lib/supabase/auth.ts), `/login`, `/signup`, [components/auth-status.tsx](./components/auth-status.tsx) |
| 3 | [lib/supabase/progress.ts](./lib/supabase/progress.ts), lesson smart helpers |
| 4 | [lib/supabase/vocabulary-progress.ts](./lib/supabase/vocabulary-progress.ts), vocabulary `dbId` |
| 5 | [lib/supabase/quiz-attempts.ts](./lib/supabase/quiz-attempts.ts), quiz smart helpers |
| 6 | [lib/supabase/progress-sync.ts](./lib/supabase/progress-sync.ts), [components/progress-sync-card.tsx](./components/progress-sync-card.tsx) |
| 7 | Final audit (this section) |

---

## Phase 3 Final Audit — **Completed**

Audited routes, navigation, Supabase-first helpers, localStorage progress, UI empty states, and documentation.

| Area | Result |
|------|--------|
| Routes | `/` through `/review`, lessons 1–4 + sub-routes; `/lessons/999` → not found |
| Navigation | `AppHeader` + `BottomNav`; Profile/Review links; lesson path, next lesson, continue flow |
| Supabase | `lib/content.ts` Supabase-first + fallback |
| Progress | `lib/progress.ts` SSR-safe; device-local UX (extended in Phase 4) |
| UI | Green/white cards; empty states; lesson not found polished |

---

## Current routes

| Route | Purpose |
|-------|---------|
| `/` | Home |
| `/courses` | Course list |
| `/courses/hsk5` | HSK5 course + lesson list |
| `/lessons/[lessonId]` | Lesson detail |
| `/lessons/[lessonId]/watch` | Watch + subtitles |
| `/lessons/[lessonId]/vocabulary` | Vocabulary |
| `/lessons/[lessonId]/quiz` | Quiz |
| `/profile` | Progress dashboard + auth + sync |
| `/review` | Review learned words + quiz summary |
| `/login` | Sign in |
| `/signup` | Sign up |
| `/admin` | Admin dashboard shell |
| `/admin/lessons` | Lesson list (read-only) |
| `/admin/lessons/new` | New lesson form skeleton |
| `/admin/lessons/[lessonId]/edit` | Edit lesson form skeleton |

---

## Key documentation

- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — roadmap (Phase 5 next)
- [AUTH_PLAN.md](./AUTH_PLAN.md) — Phase 4 auth + RLS
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — schema
- [supabase/policies/README.md](./supabase/policies/README.md) — when to apply RLS
- [README.md](./README.md) — setup and features
