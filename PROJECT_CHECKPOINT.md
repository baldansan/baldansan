# Project Checkpoint — Buunduu Surtsgaay

**Project:** Buunduu Surtsgaay (Бөөндөө Сурцгаая)  
**Checkpoint date:** May 2026  
**Status:** Phase 4 **completed** — Supabase Auth, account progress, localStorage fallback + merge

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

---

## Key documentation

- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — roadmap (Phase 5 next)
- [AUTH_PLAN.md](./AUTH_PLAN.md) — Phase 4 auth + RLS
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — schema
- [supabase/policies/README.md](./supabase/policies/README.md) — when to apply RLS
- [README.md](./README.md) — setup and features
