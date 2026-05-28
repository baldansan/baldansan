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

## Phase 4: Authentication + Supabase user progress — **Next**

**Goal:** Personal accounts and real progress persisted in Supabase (`user_progress` tables).

**Tasks:**
- Supabase Auth (email, OAuth, or phone as needed)
- Migrate `lib/progress.ts` localStorage data to `user_progress` (and related) tables
- Enable RLS policies; wire Profile (`/profile`) to authenticated user progress
- Middleware or layout guards for member-only lessons (if applicable)

**Exit criteria:** Sign up, sign in, progress survives across devices and page refresh in Supabase.

---

## Phase 5: Admin content upload

**Goal:** Non-developers can publish lessons.

**Tasks:**
- Admin role in Supabase (RLS policies)
- Admin UI: upload video, edit subtitles (timeline), vocabulary, quiz
- Optional: bulk import from spreadsheet or SRT/VTT subtitles
- Preview mode before publish

**Exit criteria:** New lesson published without deploying code.

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
