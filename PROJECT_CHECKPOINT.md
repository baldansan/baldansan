# Project Checkpoint — MVP v1

**Project:** Buunduu Surtsgaay  
**Checkpoint date:** May 2026  
**Status:** MVP demo complete — static mock data, full navigation flow

---

## MVP v1 status

The web app demonstrates a complete learner journey for **Lesson 1 (爱的细节)** inside the **HSK5 Short Drama Chinese** course. All primary routes build successfully and link to each other. State is held in React client components only (subtitle mode, vocabulary learned, quiz progress)—nothing is persisted to a server or database.

---

## Completed pages

| Route | File | Server / Client |
|-------|------|-----------------|
| `/` | `app/page.tsx` | Server |
| `/courses` | `app/courses/page.tsx` | Server |
| `/courses/hsk5` | `app/courses/hsk5/page.tsx` | Server |
| `/lessons/1` | `app/lessons/1/page.tsx` | Server |
| `/lessons/1/watch` | `app/lessons/1/watch/page.tsx` | Client |
| `/lessons/1/vocabulary` | `app/lessons/1/vocabulary/page.tsx` | Client |
| `/lessons/1/quiz` | `app/lessons/1/quiz/page.tsx` | Client |

---

## Completed features

### Landing (`/`)
- Mongolian hero copy and CTAs
- Feature cards (video, vocabulary, quiz)
- Clickable demo lesson card
- Header: brand, Courses, Demo, Profile (placeholder)

### Courses (`/courses`)
- Three courses (HSK4, HSK5, Taobao)
- HSK4/HSK5 link to `/courses/hsk5`
- Taobao “Coming soon” disabled

### HSK5 course (`/courses/hsk5`)
- Course hero, stats, progress (0/20)
- Lesson list (3 lessons; only Lesson 1 unlocked)
- Lesson 1 → `/lessons/1`

### Lesson 1 (`/lessons/1`)
- Video placeholder and section previews
- Links to watch, vocabulary, quiz
- Back to `/courses/hsk5`

### Watch (`/lessons/1/watch`)
- Video placeholder with duration `00:00 / 08:00`
- Subtitle mode: Chinese, Mongolian, Both
- 4 timed subtitle lines
- Links to vocabulary and quiz

### Vocabulary (`/lessons/1/vocabulary`)
- 5 words with examples and HSK badges
- Search (Chinese, pinyin, Mongolian)
- Filter: All, HSK4, HSK5
- Mark as learned (in-memory)
- Learned count display

### Quiz (`/lessons/1/quiz`)
- 5 questions (multiple choice + cloze)
- One question at a time, progress indicator
- Correct/incorrect feedback + explanation
- Result screen with score bands and messages
- Restart quiz; links to vocabulary, watch, course

### Navigation (polished)
- Home CTAs and demo card wired
- Header brand → `/`, Demo → `/lessons/1`
- Consistent back links and cross-links between lesson sub-pages

---

## Mock data files

| File | Contents |
|------|----------|
| `data/courses.ts` | `courses` — HSK4, HSK5, Taobao course list |
| `data/lessons.ts` | `hsk5CourseDetail`, `hsk5Lessons`, `lesson1Detail`, `lesson1Watch`, `lesson1Vocabulary`, `lesson1Quiz` |

## Type definitions

| File | Types |
|------|-------|
| `types/course.ts` | `Course`, `CourseStatus` |
| `types/lesson.ts` | `Lesson`, `LessonDetail`, `LessonWatch`, `LessonVocabulary`, `LessonQuiz`, `VocabularyWord`, `QuizQuestion`, subtitle/vocabulary helpers |

---

## Known limitations

- **No real video** — placeholders only; no player integration
- **No database** — all content is hard-coded in `data/`
- **No authentication** — Profile nav is `#`; no user accounts
- **No persistence** — quiz scores, learned words, and progress reset on refresh
- **Single lesson path** — only Lesson 1 is fully implemented; Lessons 2–3 are locked UI only
- **HSK4 / Taobao** — HSK4 routes to HSK5 course; Taobao is disabled
- **No admin** — content cannot be edited without code changes
- **No payments** — no membership or paywall
- **No i18n system** — Mongolian/Chinese copy is inline in components and data
- **Duplicated header** — same nav markup on each page (no shared layout component yet)

---

## Next recommended tasks

### Short term
1. Extract shared `AppHeader` component to reduce duplication
2. Define a single lesson JSON schema and migrate mock data
3. Add Lessons 2–3 pages or dynamic `[lessonId]` route stub
4. Integrate a real video provider (e.g. Mux, Vimeo, or self-hosted)

### Medium term
5. Supabase tables: courses, lessons, subtitles, vocabulary, quiz_questions
6. Load lesson pages from API or server components + DB
7. Auth (Supabase Auth or similar) and save progress per user

### Long term
8. Admin dashboard for uploading videos and editing subtitles/vocabulary
9. Stripe or local payment for subscriptions
10. Expo mobile app sharing API with the web backend

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for phased milestones.

---

## Verification

Last verified with:

```bash
npm run build
```

All MVP routes should appear as static pages in the build output.
