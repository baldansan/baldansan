# Development Plan — Buunduu Surtsgaay

Phased roadmap from MVP demo to production product.

---

## Phase 1: MVP demo — **Completed**

**Goal:** Prove the learning flow and UI with mock data.

**Delivered:**
- Landing, courses, HSK5 course detail, Lesson 1 detail
- Watch (subtitle modes), vocabulary (search/filter/learned), quiz (interactive)
- Polished navigation across all routes
- TypeScript types and mock data in `data/` + `types/`

**Exit criteria:** ✅ User can complete Home → Course → Lesson → Watch → Vocabulary → Quiz without broken links.

---

## Phase 2: Real lesson data structure — **Completed**

**Goal:** Replace ad-hoc mocks with a maintainable content model.

**Delivered:**
- `LessonContent` type in `types/lesson-content.ts`
- Per-lesson files under `content/courses/hsk5/lessons/` (lesson-1, lesson-2, lesson-3)
- `lib/content.ts` helpers: `getLessonById`, `getLessonsByCourseId`, `getCourseById`, path helpers
- Dynamic routes: `/lessons/[lessonId]`, `/watch`, `/vocabulary`, `/quiz`
- `generateStaticParams` for lessons 1–3; `notFound` + Lesson not found UI
- Existing URLs unchanged (`/lessons/1`, etc.)
- Removed duplicated `app/lessons/1/` pages and `data/lessons.ts`

**Exit criteria:** ✅ Adding a lesson is a new content file + registry entry, not copying page folders.

**Phase 2 Step 2:** Lesson 2 content pipeline validated with available Lesson 2 data—no new routes or page components; update `content/courses/hsk5/lessons/lesson-2.ts` only.

**Phase 2 Step 3 — Completed:** Lesson import templates and content authoring guide.

- `templates/lesson-import-template.ts` — commented TypeScript starter
- `templates/lesson-import-template.json` — JSON draft structure
- `templates/lesson-content-prompt.md` — copy-paste AI prompt
- `CONTENT_AUTHORING_GUIDE.md` — workflow, test URLs, git steps

**Phase 2 Step 4 — Completed:** Lesson 3 added using the import template (`content/courses/hsk5/lessons/lesson-3.ts`, status `available`).

**Phase 2 Final Audit — Completed:** Data/route/template consistency verified; HSK3 vocabulary filter added; Lesson 1 metadata counts aligned with content arrays. **Phase 2 is closed** — proceed to Phase 3.

> Phase 2 Final Audit completed: dynamic lesson structure verified for Lessons 1–3, HSK3/4/5 vocabulary filtering supported, templates aligned with current data model.

---

## Phase 3: Supabase database — **Completed**

**Goal:** Persistent, queryable content and device-local learning UX (Supabase content; progress on device until Phase 4).

**Phase 3 Step 1 — Completed:** Supabase schema planning.

- `supabase/migrations/001_initial_schema.sql`, `DATABASE_SCHEMA.md`, `supabase/README.md`, `supabase/SEED_PLAN.md`
- RLS deferred to Phase 4 (commented in SQL)

**Phase 3 Step 3 — Completed:** Seed SQL for HSK5 Lessons 1–3 (`supabase/seed/001_seed_hsk5_lessons.sql`).

**Phase 3 Step 4 — Completed:** Read-only Supabase integration with local fallback (debug logs removed after connection test).

**Phase 3 Step 5 — Completed:** Supabase-first production mode with local fallback.

- All public content helpers try Supabase when env is configured; empty/failed queries fall back to local files
- `force-dynamic` on HSK5 and lesson routes so content updates without rebuild
- `getContentSource()` for internal verification; standardized fallback warning
- No auth or progress writes yet

**Phase 3 Step 6 — Completed:** Lesson 4 Supabase-first seed file prepared.

- `supabase/seed/002_seed_hsk5_lesson_4.sql` — DB-only lesson (no new routes or local content file)
- Validates adding lessons via database without copying page components

**Phase 3 improvements — Completed:** Next Improvement Batch (UX polish and Supabase lesson flow).

- HSK5 course detail renders full lesson list from `getLessonsByCourseId` with dynamic stats and improved lesson cards
- Vocabulary filters support HSK1–HSK5 when words exist in the lesson
- Quiz results link to the next lesson in course order when available
- Shared `AppHeader` for consistent navigation across pages

**Phase 3 UX polish — Completed:** Learning UX polish batch.

- Lesson path card, watch practice tips, vocabulary learned UI, quiz result tiers, course summary card, mobile `BottomNav`

**Phase 3 UX polish — Completed:** Real app feel polish batch.

- Mongolian branding, empty/error states, HSK5 lesson search, vocabulary result feedback, quiz progress bar, lesson not found polish

**Phase 3 UX/progress prototype — Completed:** localStorage progress.

- `lib/progress.ts` for lesson status, vocabulary learned words, and quiz results on this device
- Phase 4 will migrate this to Supabase Auth + user progress tables

**Phase 3 local progress UX — Completed:** Learning dashboard profile page.

- `/profile` dashboard from localStorage (stats, continue learning, recent quiz results)
- Profile link in header and mobile bottom nav

**Phase 3 learning UX improvement — Completed:** Continue learning flow on Home, Courses, and HSK5 course detail.

- `getLessonStatus`, `getCompletedLessonIds`; client continue/progress sections from localStorage

**Phase 3 local review UX — Completed:** Daily review page.

- `/review` with `getAllLearnedWords()`, quiz summaries, vocabulary grouped by lesson from Supabase/local content

**Phase 3 Final Audit — Completed:** Routes, navigation, Supabase-first + fallback, localStorage progress, docs aligned. Ready to close Phase 3.

**Exit criteria (Phase 3):** ✅ Content loadable from Supabase with local fallback; Lessons 1–4 via dynamic routes; local progress on device; profile, continue flow, and review page working.

---

## Phase 4: Authentication + Supabase user progress — **Completed**

**Goal:** Personal accounts and real progress persisted in Supabase (`user_*` progress tables).

**Phase 4 Step 1 — Completed:** Auth planning + RLS policy design.

- [AUTH_PLAN.md](./AUTH_PLAN.md), [supabase/policies/001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql)
- Public content: `SELECT` only; progress: `auth.uid() = user_id`
- No auth UI, no progress writes, localStorage unchanged

**Phase 4 Step 2 — Completed:** Auth helpers + login/signup UI.

- [lib/supabase/auth.ts](./lib/supabase/auth.ts), `/login`, `/signup`, [components/auth-status.tsx](./components/auth-status.tsx)
- Profile auth section; no Supabase progress writes; RLS not applied yet

**Phase 4 Step 3 — Completed:** Authenticated lesson progress persistence.

- [lib/supabase/progress.ts](./lib/supabase/progress.ts), smart helpers in [lib/progress.ts](./lib/progress.ts)
- `user_lesson_progress` upsert on watch/quiz pass; localStorage always updated; guests unchanged
- Run [supabase/policies/001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql) before production auth writes

**Phase 4 Step 4 — Completed:** Authenticated vocabulary learned state persistence.

- [lib/supabase/vocabulary-progress.ts](./lib/supabase/vocabulary-progress.ts), `dbId` on Supabase vocabulary in [lib/supabase/content.ts](./lib/supabase/content.ts)
- Mark/unmark learned → `user_vocabulary_progress`; review/profile use smart helpers

**Phase 4 Step 5 — Completed:** Authenticated quiz attempts persistence.

- [lib/supabase/quiz-attempts.ts](./lib/supabase/quiz-attempts.ts), smart helpers in [lib/progress.ts](./lib/progress.ts)
- Each quiz finish → `insert` into `user_quiz_attempts` + localStorage mirror; latest/best aggregated per lesson

**Phase 4 Step 6 — Completed:** Merge localStorage progress after login.

- [lib/supabase/progress-sync.ts](./lib/supabase/progress-sync.ts), [components/progress-sync-card.tsx](./components/progress-sync-card.tsx) on `/profile`
- Guest device progress offered for one-way merge into account; local cleared after success

**Phase 4 Step 7 — Completed:** Final audit (routes, auth UI, progress paths, security, docs, build).

**Phase 4 roadmap:**

| Step | Focus |
|------|--------|
| 1 ✅ | Auth planning + RLS policy design |
| 2 ✅ | Auth helpers + login/signup UI |
| 3 ✅ | Persist lesson progress to Supabase |
| 4 ✅ | Persist vocabulary learned state to Supabase |
| 5 ✅ | Persist quiz attempts to Supabase |
| 6 ✅ | Migrate / merge localStorage progress after login |
| 7 ✅ | Phase 4 final audit |

**Exit criteria:** Met — sign up, sign in, progress persists to Supabase when RLS is applied; localStorage remains as backup and guest fallback.

**Production note:** Apply [supabase/policies/001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql) in Supabase before production auth progress writes.

---

## Phase 5: Admin content management / lesson upload — **In progress**

**Goal:** Non-developers can publish and manage lesson content (admin workflow) without SQL seeds or code deploys.

**Phase 5 Step 1 — Completed:** Admin foundation (docs + UI shell, no DB writes).

- [ADMIN_PLAN.md](./ADMIN_PLAN.md), [CONTENT_WORKFLOW.md](./CONTENT_WORKFLOW.md), [supabase/admin/README.md](./supabase/admin/README.md)
- [supabase/policies/002_admin_content_policies.sql](./supabase/policies/002_admin_content_policies.sql) — planned RLS (do not auto-run)
- Routes: `/admin`, `/admin/lessons`, `/admin/lessons/new`, `/admin/lessons/[id]/edit`
- `components/admin/*` — dashboard, lesson list (read), form skeletons (disabled save)
- Header **Admin** link (admins only); Profile role label + admin shortcut
- Learner routes unchanged; Supabase-first + local fallback unchanged

**Phase 5 Step 2 — Completed:** Admin role setup and protected admin access.

- [supabase/admin/001_admin_profiles_setup.sql](./supabase/admin/001_admin_profiles_setup.sql) — `admin_profiles` + RLS (run in SQL Editor)
- [lib/supabase/admin.ts](./lib/supabase/admin.ts) — `getCurrentAdminProfile`, `isCurrentUserAdmin`
- [components/admin/admin-guard.tsx](./components/admin/admin-guard.tsx) — wraps all `/admin` routes via layout
- No content CRUD writes yet

**Phase 5 Step 3 — Completed:** Admin lesson list + content QA dashboard.

**Phase 5 Step 4 — Completed:** Admin draft lesson creation.

**Phase 5 Steps 5–7 — Completed (big batch):** Subtitle, vocabulary, quiz editors.

- [lib/supabase/admin-content.ts](./lib/supabase/admin-content.ts) — child table CRUD + `refreshLessonCounts`
- [components/admin/subtitle-editor.tsx](./components/admin/subtitle-editor.tsx), [vocabulary-editor.tsx](./components/admin/vocabulary-editor.tsx), [quiz-editor.tsx](./components/admin/quiz-editor.tsx)
- `/admin/lessons/[id]/edit` — full content editing + publishing controls

**Phase 5 Step 8 — Completed:** Publish/unpublish workflow.

**Phase 5 Step 9 — Completed:** Bulk JSON import for subtitles, vocabulary, and quiz.

**Phase 5 Step 10 — Completed:** Lesson content prompt generator and import QA assistant.

**Phase 5 Step 11 — Completed:** Admin lesson metadata edit/save.

- [lib/supabase/admin-content.ts](./lib/supabase/admin-content.ts) — `updateLessonMetadata`, `validateUpdateLessonMetadataInput`, `getAdminLessonMetadataById`, `refreshLessonCounts`
- [components/admin/lesson-metadata-editor.tsx](./components/admin/lesson-metadata-editor.tsx) on `/admin/lessons/{id}/edit`

**Phase 5 Step 12 — Completed:** Lesson JSON export and backup tools.

- [lib/supabase/admin-export.ts](./lib/supabase/admin-export.ts) — `getLessonExportPayload`, `buildLessonExportJson`
- [components/admin/lesson-export-card.tsx](./components/admin/lesson-export-card.tsx) on lesson edit page
- [LESSON_EXPORT_FORMAT.md](./LESSON_EXPORT_FORMAT.md)

**Phase 5 Step 13 — Completed:** Lesson duplicate, restore, and destructive import safety.

- [lib/supabase/admin-duplicate.ts](./lib/supabase/admin-duplicate.ts), [admin-restore.ts](./lib/supabase/admin-restore.ts)
- [components/admin/lesson-duplicate-card.tsx](./components/admin/lesson-duplicate-card.tsx), [lesson-restore-card.tsx](./components/admin/lesson-restore-card.tsx)
- Bulk import replace confirmation + [LESSON_BACKUP_RESTORE.md](./LESSON_BACKUP_RESTORE.md)

**Phase 5 Step 14 — Completed:** Guided Lesson Builder workflow.

- [app/admin/lesson-builder/page.tsx](./app/admin/lesson-builder/page.tsx) — guided admin workflow page
- [components/admin/lesson-builder-workflow.tsx](./components/admin/lesson-builder-workflow.tsx), [lesson-builder-checklist.tsx](./components/admin/lesson-builder-checklist.tsx), [lesson-package-summary.tsx](./components/admin/lesson-package-summary.tsx)
- [LESSON_BUILDER_WORKFLOW.md](./LESSON_BUILDER_WORKFLOW.md)

**Phase 5 Step 15 — Completed:** Lesson media/video metadata foundation.

- [supabase/migrations/002_lesson_media_fields.sql](./supabase/migrations/002_lesson_media_fields.sql) — video_url, thumbnail_url, audio_url, source_note, media_status
- [components/admin/lesson-media-editor.tsx](./components/admin/lesson-media-editor.tsx), [lib/supabase/admin-content.ts](./lib/supabase/admin-content.ts) — `updateLessonMedia`
- [components/lesson-media-display.tsx](./components/lesson-media-display.tsx) — public detail + watch media sections
- [MEDIA_WORKFLOW.md](./MEDIA_WORKFLOW.md)

**Phase 5 Step 16 — Completed:** Supabase Storage media upload foundation.

- [supabase/storage/001_lesson_media_bucket_policies.sql](./supabase/storage/001_lesson_media_bucket_policies.sql) — `lesson-media` bucket + Storage RLS
- [lib/supabase/media-upload.ts](./lib/supabase/media-upload.ts) — validate, path, upload helpers
- [components/admin/lesson-media-upload-card.tsx](./components/admin/lesson-media-upload-card.tsx) — admin upload UI on edit page
- [MEDIA_UPLOAD_WORKFLOW.md](./MEDIA_UPLOAD_WORKFLOW.md)

**Phase 5 Step 17 — Completed:** Admin analytics and content metrics dashboard.

- [lib/supabase/admin-analytics.ts](./lib/supabase/admin-analytics.ts) — dashboard metrics helpers
- [components/admin/admin-dashboard.tsx](./components/admin/admin-dashboard.tsx) — analytics UI on `/admin`
- [ADMIN_ANALYTICS.md](./ADMIN_ANALYTICS.md)

**Phase 5 Step 18 — Completed:** Per-lesson learning analytics dashboard.

- [app/admin/analytics/page.tsx](./app/admin/analytics/page.tsx), [app/admin/analytics/lessons/[lessonId]/page.tsx](./app/admin/analytics/lessons/[lessonId]/page.tsx)
- Extended [lib/supabase/admin-analytics.ts](./lib/supabase/admin-analytics.ts) — per-lesson metrics
- [ADMIN_LEARNING_ANALYTICS.md](./ADMIN_LEARNING_ANALYTICS.md)

**Phase 5 Step 19 — Completed:** Question-level quiz analytics and vocabulary engagement insights.

- Detailed quiz answers JSON on new attempts — [lib/quiz-answers.ts](./lib/quiz-answers.ts), [app/lessons/[lessonId]/quiz/quiz-client.tsx](./app/lessons/[lessonId]/quiz/quiz-client.tsx)
- Routes: `/admin/analytics/questions`, `/admin/analytics/vocabulary`
- Extended [lib/supabase/admin-analytics.ts](./lib/supabase/admin-analytics.ts) — question + vocabulary engagement helpers
- [ADMIN_QUESTION_ANALYTICS.md](./ADMIN_QUESTION_ANALYTICS.md), [ADMIN_VOCABULARY_ANALYTICS.md](./ADMIN_VOCABULARY_ANALYTICS.md)

**Phase 5 Step 20 — Completed:** AI-assisted content improvement prompt workflow.

- [lib/admin/improvement-prompts.ts](./lib/admin/improvement-prompts.ts) — copy-ready improvement prompt builders
- [components/admin/improvement-prompt-card.tsx](./components/admin/improvement-prompt-card.tsx), [app/admin/prompts/page.tsx](./app/admin/prompts/page.tsx)
- Integration on lesson edit, analytics, question/vocabulary insights, lesson builder
- [AI_ASSISTED_CONTENT_WORKFLOW.md](./AI_ASSISTED_CONTENT_WORKFLOW.md)

**Phase 5 Step 21 — Completed:** Content approval and release readiness workflow.

- [supabase/migrations/005_lesson_release_workflow.sql](./supabase/migrations/005_lesson_release_workflow.sql)
- [lib/admin/release-readiness.ts](./lib/admin/release-readiness.ts), [lib/supabase/admin-release.ts](./lib/supabase/admin-release.ts)
- Release checklist, approval controls, publish gate on edit page
- [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md)
- [ADMIN_TASK_CENTER.md](./ADMIN_TASK_CENTER.md)

**Phase 5 Step 22 — Completed:** Admin Task Center and content review queue.

- [lib/admin/task-generator.ts](./lib/admin/task-generator.ts), [lib/supabase/admin-tasks.ts](./lib/supabase/admin-tasks.ts)
- Route `/admin/tasks` — filters, severity, category, lesson search
- Dashboard, lesson edit, lesson builder, analytics integration
- [ADMIN_TASK_CENTER.md](./ADMIN_TASK_CENTER.md) — no task DB persistence yet

**Phase 5 Step 23 — Completed:** Persistent admin task management.

- [supabase/migrations/006_admin_tasks.sql](./supabase/migrations/006_admin_tasks.sql)
- [lib/supabase/admin-task-persistence.ts](./lib/supabase/admin-task-persistence.ts), [lib/admin/task-merge.ts](./lib/admin/task-merge.ts)
- Dismiss, resolve, start, reopen, priority, due date, admin notes
- [ADMIN_TASK_MANAGEMENT.md](./ADMIN_TASK_MANAGEMENT.md)

**Phase 5 Step 24 — Completed:** Admin activity log / audit trail.

- [supabase/migrations/007_admin_activity_log.sql](./supabase/migrations/007_admin_activity_log.sql)
- [lib/supabase/admin-activity.ts](./lib/supabase/admin-activity.ts), [lib/supabase/admin-activity-log.ts](./lib/supabase/admin-activity-log.ts)
- Route `/admin/activity` — filters, summary cards, expandable metadata
- Best-effort logging on lesson, content, publish, media, task, release, import, export actions
- [ADMIN_ACTIVITY_LOG.md](./ADMIN_ACTIVITY_LOG.md)

**Phase 5 Step 25 — Completed:** Activity diff and rollback preview.

- [supabase/migrations/008_admin_activity_snapshots.sql](./supabase/migrations/008_admin_activity_snapshots.sql)
- Before/after snapshots on metadata, media, status, release, import, restore, duplicate
- `/admin/activity/{id}` detail page with shallow field diff
- [ADMIN_ACTIVITY_DIFFS.md](./ADMIN_ACTIVITY_DIFFS.md)

**Phase 5 Step 26 — Completed:** CMS hardening and rollback/export tools.

- [lib/supabase/admin-rollback.ts](./lib/supabase/admin-rollback.ts), [lib/admin/admin-rollback-eligibility.ts](./lib/admin/admin-rollback-eligibility.ts)
- Safe rollback execution on `/admin/activity/{id}` with confirmation + `rollback_executed` logging
- CSV/JSON export on `/admin/activity` — [lib/admin/activity-export.ts](./lib/admin/activity-export.ts)
- Activity filters: rollback available/unsupported, summary cards
- Production safety section on `/admin`, `/admin/final-audit` checklist
- [ADMIN_ROLLBACK_WORKFLOW.md](./ADMIN_ROLLBACK_WORKFLOW.md), [ADMIN_AUDIT_EXPORT.md](./ADMIN_AUDIT_EXPORT.md), [PHASE_5_FINAL_AUDIT.md](./PHASE_5_FINAL_AUDIT.md)

**Phase 5 Mega Batch:** production CMS hardening, safe rollback, audit export, and final audit page.

**Next:** Phase 5 Final Audit (manual walkthrough) or Phase 6 — Deployment / Production Readiness.
- [components/admin/bulk-import-editor.tsx](./components/admin/bulk-import-editor.tsx) on lesson edit page
- [LESSON_IMPORT_FORMAT.md](./LESSON_IMPORT_FORMAT.md)

- `getPublicLessonsByCourseId` / `getPublicLessonById` — public catalog filters `available` only
- `/lessons/{id}?preview=admin` — admin preview for draft/archived
- `components/lesson-unavailable.tsx` — public unavailable state
- `updateLessonStatus` / `getLessonCompleteness` in [lib/supabase/admin-content.ts](./lib/supabase/admin-content.ts)

**Phase 5 roadmap:**

| Step | Focus | Status |
|------|--------|--------|
| 1 | Admin foundation and dashboard shell | ✅ Completed |
| 2 | Admin role table + manual admin setup + protected admin access | ✅ Completed |
| 3 | Admin lesson list + content QA dashboard | ✅ Completed |
| 4 | Lesson create draft write | ✅ Completed |
| 5 | Subtitle editor | ✅ Completed |
| 6 | Vocabulary editor | ✅ Completed |
| 7 | Quiz editor | ✅ Completed |
| 8 | Publish/unpublish workflow | ✅ Completed |
| 9 | Bulk import lesson content from JSON/ChatGPT output | ✅ Completed |
| 10 | Prompt generator + import QA assistant | ✅ Completed |
| 11 | Admin lesson metadata edit/save | ✅ Completed |
| 12 | Lesson JSON export and backup tools | ✅ Completed |
| 13 | Lesson duplicate, restore, destructive import safety | ✅ Completed |
| 14 | Lesson package generator / full lesson builder | ✅ Completed |
| 15 | Media/video metadata foundation | ✅ Completed |
| 16 | Supabase Storage media upload | ✅ Completed |
| 17 | Admin analytics / content metrics dashboard | ✅ Completed |
| 18 | Per-lesson learning analytics | ✅ Completed |
| 19 | Question-level quiz analytics + vocabulary engagement | ✅ Completed |
| 20 | AI-assisted content improvement prompts | ✅ Completed |
| 21 | Content approval / release readiness | ✅ Completed |
| 22 | Admin Task Center / content review queue | ✅ Completed |
| 23 | Persistent admin task management | ✅ Completed |
| 24 | Admin activity log / audit trail | ✅ Completed |
| 25 | Activity diff / rollback preview | ✅ Completed |
| 26 | CMS hardening — rollback, export, final audit | ✅ Completed |

**Next (Phase 5):** Phase 5 Final Audit (manual walkthrough) or Phase 6 — Deployment / Production Readiness.

**Exit criteria:** New lesson published through admin UI without deploying code.

---

## Phase 6: Payment / membership

**Goal:** Monetize courses and gate premium content.

**Tasks:**
- Define free vs paid courses/lessons
- Integrate payment provider (Stripe, QPay, etc.)
- Subscription or one-time purchase model
- Entitlement checks on lesson routes
- Receipt and membership status on profile

**Exit criteria:** Paying user unlocks HSK5+ content; free tier remains usable.

---

## Phase 7: Mobile app with Expo

**Goal:** Native iOS/Android experience sharing the same backend.

**Tasks:**
- Expo (React Native) app scaffold
- Reuse Supabase client and auth
- Screens: courses, lesson player, vocabulary, quiz (parity with web)
- Offline-friendly vocabulary review (optional)
- App Store / Play Store release pipeline

**Exit criteria:** Core lesson flow works on mobile against production Supabase.

---

## Cross-cutting concerns (all phases)

| Area | Notes |
|------|--------|
| **Design system** | Shared header, buttons, cards; consider shadcn/ui later |
| **i18n** | Mongolian UI strings; structured keys when content grows |
| **Analytics** | Lesson completion, quiz scores, drop-off |
| **SEO** | Metadata per course/lesson page |
| **Performance** | Video CDN, image optimization |
| **Testing** | E2E for critical flows (Playwright) |

---

## Suggested order after MVP

```
Phase 2 (data structure) ✅
    → Phase 3 (Supabase)
    → Phase 4 (Auth)
    → Phase 5 (Admin)
    → Phase 6 (Payments)
    → Phase 7 (Expo)
```

Phases 5 and 6 can be reordered depending on business priority (content velocity vs revenue).

---

## Reference: MVP routes

```
/
/courses
/courses/hsk5
/lessons/[lessonId]          # e.g. /lessons/1
/lessons/[lessonId]/watch
/lessons/[lessonId]/vocabulary
/lessons/[lessonId]/quiz
```

Lesson 1–3 URLs remain valid. Do not remove without redirects.
