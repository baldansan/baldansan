# Buunduu Surtsgaay

A Mongolian–Chinese language learning web app. Users learn Chinese through short video lessons, subtitles, vocabulary, and quizzes.

**MVP v1** is a static demo with mock data—no database or authentication yet. **Phase 2** (complete) adds dynamic lesson routes (`/lessons/[lessonId]`) backed by `content/` files. Lessons 1–3 are available on the HSK5 course.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router)
- TypeScript
- Tailwind CSS 4
- React 19

## Current MVP features

- **Landing page** — hero, feature cards, demo lesson card
- **Courses** — course list with availability status
- **HSK5 course detail** — stats, progress card, lesson list
- **Lesson 1 detail** — video preview, subtitle/vocabulary/quiz previews
- **Watch** — video placeholder, subtitle mode toggle (Chinese / Mongolian / Both)
- **Vocabulary** — search, HSK filter, mark-as-learned (client state)
- **Quiz** — 5 questions, feedback, explanations, result screen
- **Navigation** — end-to-end demo flow across all pages

## Current routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/courses` | Course list |
| `/courses/hsk5` | HSK5 course detail & lessons |
| `/lessons/[lessonId]` | Lesson detail (e.g. `/lessons/1`) |
| `/lessons/[lessonId]/watch` | Watch lesson with subtitles |
| `/lessons/[lessonId]/vocabulary` | Vocabulary list |
| `/lessons/[lessonId]/quiz` | Interactive quiz |

## Project structure (MVP)

```
app/                         # Pages (App Router)
  lessons/[lessonId]/        # Dynamic lesson routes
content/courses/hsk5/        # Course + per-lesson content
  lessons/lesson-1.ts …
templates/                   # Lesson import templates + AI prompt
data/courses.ts              # Course catalog mock data
lib/content.ts               # getLessonById, getLessonsByCourseId, …
types/                       # course.ts, lesson.ts, lesson-content.ts
```

## How to run locally

**Requirements:** Node.js 20+ and npm.

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Other commands:**

```bash
npm run build   # Production build
npm run start   # Run production server (after build)
npm run lint    # ESLint
```

## Suggested demo flow

1. Home → **Эхлэх** → Courses  
2. **HSK5 Short Drama Chinese** → Course detail  
3. Lesson 1 **Start** → Lesson detail  
4. **Watch lesson** → Subtitle modes  
5. **Vocabulary** → Search, filter, mark learned  
6. **Quiz** → Complete quiz → Review results  

Or from Home: **Demo lesson үзэх** or the demo card → `/lessons/1`.

## Adding new lessons

Lessons are **data files only** — no new routes or page components.

1. Copy [templates/lesson-import-template.ts](./templates/lesson-import-template.ts) to `content/courses/hsk5/lessons/lesson-N.ts`
2. Register in [content/courses/hsk5/lessons/index.ts](./content/courses/hsk5/lessons/index.ts)
3. Follow [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md) for testing and git workflow

Templates and AI prompt: [templates/](./templates/) (including [lesson-content-prompt.md](./templates/lesson-content-prompt.md)).

## Documentation

- [CONTENT_AUTHORING_GUIDE.md](./CONTENT_AUTHORING_GUIDE.md) — how to add or unlock lessons
- [PROJECT_CHECKPOINT.md](./PROJECT_CHECKPOINT.md) — MVP v1 status, limitations, next tasks
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — Phased roadmap

## Next development steps

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the full roadmap. Immediate priorities:

1. ~~Real lesson data structure~~ ✅ Phase 2 (closed)
2. **Supabase** for courses, lessons, vocabulary, progress ← Phase 3
3. Authentication and user progress persistence
4. Admin tools for content upload
5. Membership / payments
6. Mobile app (Expo)
