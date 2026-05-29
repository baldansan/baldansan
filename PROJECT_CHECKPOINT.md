# Project Checkpoint — Buunduu Surtsgaay

**Project:** Buunduu Surtsgaay (Бөөндөө Сурцгаая)  
**Checkpoint date:** May 2026  
**Status:** Phase 4 **completed**; Phase 5 Step 16 Supabase Storage media upload **completed**

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

**Next:** Phase 5 Step 17 — Content analytics / admin metrics dashboard. Or Phase 5 Final Audit.

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
