# Buunduu Surtsgaay

A Mongolian–Chinese language learning web app. Users learn Chinese through short video lessons, subtitles, vocabulary, and quizzes.

**MVP v1** is a static demo with mock data—no database or authentication yet.

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
| `/lessons/1` | Lesson 1 detail |
| `/lessons/1/watch` | Watch lesson with subtitles |
| `/lessons/1/vocabulary` | Vocabulary list |
| `/lessons/1/quiz` | Interactive quiz |

## Project structure (MVP)

```
app/                    # Pages (App Router)
data/
  courses.ts            # Course mock data
  lessons.ts            # Lessons, watch, vocabulary, quiz mock data
types/
  course.ts             # Course types
  lesson.ts             # Lesson, vocabulary, quiz types
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

## Documentation

- [PROJECT_CHECKPOINT.md](./PROJECT_CHECKPOINT.md) — MVP v1 status, limitations, next tasks
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — Phased roadmap

## Next development steps

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the full roadmap. Immediate priorities:

1. Real lesson data structure (JSON or CMS-ready schema)
2. Supabase for courses, lessons, vocabulary, progress
3. Authentication and user progress persistence
4. Admin tools for content upload
5. Membership / payments
6. Mobile app (Expo)
