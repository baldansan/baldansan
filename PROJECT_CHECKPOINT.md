# Project Checkpoint — MVP v1 + Phase 2

**Project:** Buunduu Surtsgaay  
**Checkpoint date:** May 2026  
**Status:** MVP demo complete; Phase 2 closed; Phase 3 Step 4 (Supabase read-only) complete

---

## MVP v1 status

The web app demonstrates a complete learner journey for **Lesson 1 (爱的细节)** inside the **HSK5 Short Drama Chinese** course. All primary routes build successfully and link to each other. State is held in React client components only—nothing is persisted to a server or database.

---

## Phase 2 status — **Completed**

Lesson pages are **data-driven** via dynamic segments. Content lives under `content/courses/hsk5/lessons/` with helpers in `lib/content.ts`. Adding a lesson means a new content file (e.g. `lesson-4.ts`) and registering it in `content/courses/hsk5/lessons/index.ts`—no new page folders.

**Phase 2 Step 2:** Lesson 2 content pipeline validated with available Lesson 2 data.

**Phase 2 Step 3:** Lesson import templates and content authoring guide completed (`templates/`, `CONTENT_AUTHORING_GUIDE.md`).

**Phase 2 Step 4:** Lesson 3 added using the import template (6 subtitles, 12 vocabulary, 5 quiz; status available).

**Phase 2 Final Audit completed:** dynamic lesson structure verified for Lessons 1–3, HSK3/4/5 vocabulary filtering supported, templates aligned with current data model. Lesson 1 counts corrected to match arrays (5 vocabulary, 5 quiz).

| Lesson | vocabularyCount | quizCount | status |
|--------|-----------------|-----------|--------|
| 1 | 5 | 5 | available |
| 2 | 12 | 5 | available |
| 3 | 12 | 5 | available |

---

## Completed pages

| Route | File | Server / Client |
|-------|------|-----------------|
| `/` | `app/page.tsx` | Server |
| `/courses` | `app/courses/page.tsx` | Server |
| `/courses/hsk5` | `app/courses/hsk5/page.tsx` | Server |
| `/lessons/[lessonId]` | `app/lessons/[lessonId]/page.tsx` | Server |
| `/lessons/[lessonId]/watch` | `app/lessons/[lessonId]/watch/page.tsx` | Client |
| `/lessons/[lessonId]/vocabulary` | `app/lessons/[lessonId]/vocabulary/page.tsx` | Client |
| `/lessons/[lessonId]/quiz` | `app/lessons/[lessonId]/quiz/page.tsx` | Client |
| Invalid lesson | `app/lessons/[lessonId]/not-found.tsx` | Server |

**Static params:** lessons `1`, `2`, `3` pre-rendered at build time.

---

## Completed features

(Unchanged UX from MVP v1; data layer refactored.)

### Content & helpers
- `LessonContent` model: subtitles, vocabulary, quiz, metadata, status
- `getLessonById`, `getLessonsByCourseId`, `getCourseById`, `getCourseContentById`
- Path helpers: `lessonPath`, `lessonWatchPath`, etc.

### Lessons
- **Lesson 1** — full content (same as MVP)
- **Lesson 2** — full available content (你真的懂我吗？)
- **Lesson 3** — full available content (我只是想照顾你)

### Navigation
- All `/lessons/1/*` URLs still work via `[lessonId]`
- Course detail reads lesson list from shared content

---

## Mock data files

| File | Contents |
|------|----------|
| `data/courses.ts` | Course catalog (HSK4, HSK5, Taobao) |
| `content/courses/hsk5/index.ts` | HSK5 course detail (stats, progress) |
| `content/courses/hsk5/lessons/lesson-1.ts` | Full Lesson 1 content |
| `content/courses/hsk5/lessons/lesson-2.ts` | Placeholder Lesson 2 |
| `content/courses/hsk5/lessons/lesson-3.ts` | Placeholder Lesson 3 |
| `content/courses/hsk5/lessons/index.ts` | Lesson registry |
| `lib/content.ts` | Data access helpers |

## Type definitions

| File | Types |
|------|-------|
| `types/course.ts` | `Course`, `CourseStatus` |
| `types/lesson.ts` | Subtitle, vocabulary, quiz UI types |
| `types/lesson-content.ts` | `LessonContent`, `CourseContent` |

**Removed:** `data/lessons.ts`, `app/lessons/1/**` (replaced by dynamic routes).

---

## Known limitations

- **No real video** — placeholders only
- **No database** — TypeScript content files
- **No authentication** — Profile is `#`
- **No persistence** — progress resets on refresh
- **Course routes** — only `/courses/hsk5` is content-backed; catalog still in `data/courses.ts`
- **Locked lessons** — disabled on course page; direct URL still works for dev
- **Duplicated header** — per-page nav markup

---

## Phase 3 — Supabase

**Step 1:** Schema planning — `supabase/migrations/001_initial_schema.sql`, docs.

**Step 3:** Seed SQL — `supabase/seed/001_seed_hsk5_lessons.sql` (Lessons 1–3).

**Step 4 — Supabase read-only integration completed:**

- `@supabase/supabase-js`, `lib/supabase/client.ts`, `lib/supabase/content.ts`
- `lib/content.ts` async helpers: Supabase first, local fallback on missing env or errors
- Lesson pages fetch on server; watch/vocabulary/quiz use server + client split
- `.env.example` for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No auth, no progress writes, no UI/route changes

**Phase 3 Step 4 cleanup:** Temporary Supabase debug logs removed after successful read-only connection test. Minimal `[content]` warnings remain on query failure only.

---

## Next recommended tasks

1. Phase 4: Supabase Auth + persist progress
2. Dynamic `/courses/[courseId]` route (optional)
3. Shared `AppHeader` component
4. Real video provider

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md).

---

## Verification

```bash
npm run build
```

Expect static routes for `/lessons/1`, `/lessons/2`, `/lessons/3` and sub-pages.
