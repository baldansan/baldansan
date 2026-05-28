# Project Checkpoint — Buunduu Surtsgaay

**Project:** Buunduu Surtsgaay (Бөөндөө Сурцгаая)  
**Checkpoint date:** May 2026  
**Status:** Phase 3 **completed** — Supabase-first content, local fallback, device-local progress UX

---

## Phase 3 Final Audit — **Completed**

Audited routes, navigation, Supabase-first helpers, localStorage progress, UI empty states, and documentation. Build passes; `.env.local` gitignored.

| Area | Result |
|------|--------|
| Routes | `/` through `/review`, lessons 1–4 + sub-routes; `/lessons/999` → not found |
| Navigation | `AppHeader` + `BottomNav`; Profile/Review links; lesson path, next lesson, continue flow |
| Supabase | `lib/content.ts` Supabase-first + fallback; no debug logs; keys only via env |
| Progress | `lib/progress.ts` SSR-safe; vocabulary/quiz/lesson state on device |
| UI | Green/white cards; empty states; lesson not found polished |

**Recommended next:** Phase 4 Step 5 — Persist quiz attempts to Supabase.

**Phase 4 Step 1: Auth and RLS policy planning completed.**

**Phase 4 Step 2: Auth helpers and login/signup UI added.**

**Phase 4 Step 3: Authenticated lesson progress persistence added using `user_lesson_progress`, with localStorage fallback for guests.**

- `lib/supabase/progress.ts`, `markLessonStartedSmart` / `markLessonCompletedSmart`
- Signed-in: lesson started/completed → Supabase + localStorage; course/profile read Supabase when available
- Vocabulary and quiz attempts still localStorage-only
- Run `supabase/policies/001_auth_rls_policies.sql` before production auth progress writes

**Phase 4 Step 4: Authenticated vocabulary learned state persistence added using `user_vocabulary_progress`, with localStorage fallback for guests.**

- `lib/supabase/vocabulary-progress.ts`, vocabulary `dbId` from Supabase content
- Quiz attempts still localStorage-only

- [AUTH_PLAN.md](./AUTH_PLAN.md) — Auth + migration roadmap (Steps 1–7)
- [supabase/policies/001_auth_rls_policies.sql](./supabase/policies/001_auth_rls_policies.sql) — planned RLS (review before run)
- [supabase/policies/README.md](./supabase/policies/README.md) — when/how to apply policies
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Phase 4 Auth and RLS section

---

## Current routes

| Route | Description |
|-------|-------------|
| `/` | Landing + continue learning |
| `/courses` | Course catalog |
| `/courses/hsk5` | HSK5 course (dynamic lesson list, local progress) |
| `/lessons/[lessonId]` | Lesson detail |
| `/lessons/[lessonId]/watch` | Watch + subtitles |
| `/lessons/[lessonId]/vocabulary` | Vocabulary (HSK1–HSK5 filters) |
| `/lessons/[lessonId]/quiz` | Quiz + results |
| `/profile` | Learning dashboard (localStorage) |
| `/review` | Daily review (learned words + quiz summary) |
| `/login` | Email/password sign in |
| `/signup` | Email/password sign up |
| `/lessons/999` (invalid) | Lesson not found UI |

Lessons **1–3** have local content files; **Lesson 4** is Supabase-seeded when env is configured (`002_seed_hsk5_lesson_4.sql`). All use the same dynamic routes.

---

## Phase 3 delivered (summary)

### Database & content
- Schema: `supabase/migrations/001_initial_schema.sql`
- Seeds: Lessons 1–3 (`001`), Lesson 4 (`002`)
- Supabase-first read in `lib/content.ts` with local fallback
- `force-dynamic` on course/lesson pages when using Supabase

### Learning UX
- Lesson path, HSK5 search, quiz next-lesson, tiered result messages
- Mongolian branding; shared `AppHeader` / `BottomNav`
- `lib/progress.ts`: lesson status, learned vocabulary, quiz results (localStorage)
- Continue flow on Home, Courses, HSK5 detail
- `/profile` dashboard; `/review` learned-words page

### Lessons (content availability)

| Lesson | Local file | Supabase seed | status |
|--------|------------|---------------|--------|
| 1 | yes | yes | available |
| 2 | yes | yes | available |
| 3 | yes | yes | available |
| 4 | no | yes (when seeded) | available |

---

## Architecture (quick reference)

```
app/                    # App Router pages
content/courses/hsk5/   # Local lesson 1–3
lib/content.ts          # Supabase-first + fallback
lib/progress.ts         # Device-local progress (Phase 4 → Supabase)
lib/supabase/           # Client + read-only content
components/             # AppHeader, BottomNav, empty states, progress UI
```

---

## Known limitations (post–Phase 3)

- **No real video** — placeholders only
- **No Supabase progress writes** — progress is localStorage on this device only
- **No authentication** — Phase 4
- **Lesson 4** — requires Supabase seed (no `lesson-4.ts` local file)
- **Course catalog** — `data/courses.ts` metadata; HSK5 detail from `getLessonsByCourseId`
- **Fallback warning** — server console only when Supabase fetch fails (`[content]` warn)

---

## Documentation index

- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — phased roadmap (Phase 4 next)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — tables
- [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md) — add lessons
- [supabase/README.md](./supabase/README.md) — migrations & seed

---

## Verification

```bash
npm run build
```

Expect routes: `/`, `/courses`, `/courses/hsk5`, `/lessons/[lessonId]/*`, `/profile`, `/review`.
