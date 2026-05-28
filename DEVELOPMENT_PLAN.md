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

---

## Phase 3: Supabase database

**Goal:** Persistent, queryable content and progress.

**Tasks:**
- Design tables: `courses`, `lessons`, `subtitles`, `vocabulary`, `quiz_questions`, `user_progress`, `user_vocabulary`
- Seed DB from MVP mock data
- Replace `data/*.ts` reads with Supabase client (server or RSC)
- Store lesson completion %, quiz scores, learned vocabulary per user (anonymous or authenticated)

**Exit criteria:** Content edits happen in DB; progress survives page refresh for logged-in users.

---

## Phase 4: Authentication

**Goal:** Personal accounts and protected progress.

**Tasks:**
- Supabase Auth (email, OAuth, or phone as needed)
- Profile page (`/profile`) — settings, progress summary
- Middleware or layout guards for member-only lessons (if applicable)
- Link `user_progress` to `auth.users`

**Exit criteria:** Sign up, sign in, see own progress across devices.

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
