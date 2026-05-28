# Content authoring guide — Buunduu Surtsgaay

How to add or update lessons using the **dynamic lesson data system** (Phase 2). No UI or route changes are required for new lessons.

---

## How the system works

1. **Pages** live under `app/lessons/[lessonId]/` (one set of pages for all lessons).
2. **Content** lives under `content/courses/hsk5/lessons/` — one file per lesson (`lesson-1.ts`, `lesson-2.ts`, …).
3. **Registry** — `content/courses/hsk5/lessons/index.ts` exports all lessons in `hsk5Lessons`.
4. **Helpers** — `lib/content.ts` provides `getLessonById`, `getLessonsByCourseId`, path helpers.
5. **Build** — `generateStaticParams` uses `getAllLessonIds()` so each lesson id is pre-rendered at build time.

Changing a lesson = edit its `.ts` file (and register if it is a **new** file).

---

## Where files live

| Purpose | Path |
|--------|------|
| Lesson data | `content/courses/hsk5/lessons/lesson-N.ts` |
| Lesson list | `content/courses/hsk5/lessons/index.ts` |
| Course meta | `content/courses/hsk5/index.ts` |
| Types | `types/lesson-content.ts`, `types/lesson.ts` |
| Templates | `templates/` |
| AI prompt | `templates/lesson-content-prompt.md` |

---

## How to add a new lesson (Lesson 4+)

### Step 1 — Create the lesson file

Copy `templates/lesson-import-template.ts` to:

```
content/courses/hsk5/lessons/lesson-4.ts
```

- Rename export: `lessonTemplate` → `lesson4`
- Replace all placeholders with real content
- Set `id: "4"` (must match URL `/lessons/4`)

### Step 2 — Register in the index

Edit `content/courses/hsk5/lessons/index.ts`:

```ts
import { lesson4 } from "./lesson-4";

export const hsk5Lessons: LessonContent[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4, // add here
];
```

New lesson ids are picked up automatically by `getAllLessonIds()`.

### Step 3 — Set status

In the lesson file:

- `"available"` — **Start** button active on `/courses/hsk5`
- `"locked"` — disabled button; pages still work if opened by URL (for testing)

### Step 4 — Test locally

```bash
npm run dev
```

| Check | URL |
|-------|-----|
| Course list shows lesson | http://localhost:3000/courses/hsk5 |
| Lesson detail | http://localhost:3000/lessons/N |
| Watch + subtitle modes | http://localhost:3000/lessons/N/watch |
| Vocabulary search/filter | http://localhost:3000/lessons/N/vocabulary |
| Quiz flow | http://localhost:3000/lessons/N/quiz |

Replace `N` with your lesson id (`1`, `2`, `3`, …).

Production check:

```bash
npm run build
```

### Step 5 — Commit and push

```bash
git add .
git commit -m "Add Lesson N content"
git push
```

---

## How to upgrade an existing lesson (e.g. Lesson 3)

Lesson 3 already exists as `lesson-3.ts` and is listed in `index.ts`.

1. Open `content/courses/hsk5/lessons/lesson-3.ts` (or copy from `templates/lesson-import-template.ts`).
2. Replace placeholder content with full subtitles, vocabulary, and quiz.
3. Update `vocabularyCount` and `quizCount` to match arrays.
4. Set `status: "available"` when ready.
5. Test URLs for **N = 3** (table above).
6. Commit: `git commit -m "Add Lesson 3 content"` (or similar).

**Do not** create `app/lessons/3/` — dynamic routes already handle it.

---

## How to unlock a lesson

In the lesson file, set:

```ts
status: "available",
```

Save and refresh `/courses/hsk5`. The **Start** button links to `/lessons/{id}` via `lessonPath()`.

To lock again:

```ts
status: "locked",
```

---

## Keeping Lesson 1 and Lesson 2 safe

- **Do not** edit `lesson-1.ts` or `lesson-2.ts` unless you intend to change that lesson.
- **Do not** remove them from `index.ts`.
- **Do not** change `id` values (`"1"`, `"2"`) — URLs and bookmarks depend on them.
- After any content change, quickly smoke-test:
  - http://localhost:3000/lessons/1
  - http://localhost:3000/lessons/2

---

## Field checklist

Before publishing, verify:

- [ ] `id` is unique and matches filename / URL
- [ ] `vocabularyCount === vocabulary.length`
- [ ] `quizCount === quizQuestions.length`
- [ ] Every vocabulary `id` is unique within the lesson
- [ ] Every quiz `correctAnswer` matches an `options` entry exactly
- [ ] `subtitlePreview` has 1–2 entries (typically from start of `timedSubtitles`)
- [ ] Mongolian strings are UTF-8 and display correctly
- [ ] `npm run build` passes

---

## Templates and AI help

| Resource | Use for |
|----------|---------|
| [templates/lesson-import-template.ts](./templates/lesson-import-template.ts) | TypeScript starter with comments |
| [templates/lesson-import-template.json](./templates/lesson-import-template.json) | JSON draft / ChatGPT output |
| [templates/lesson-content-prompt.md](./templates/lesson-content-prompt.md) | Copy-paste AI authoring prompt |

---

## What you should **not** do (for content-only work)

- Add files under `app/lessons/1/` (removed in Phase 2)
- Add npm packages
- Add Supabase or auth (Phase 3+)
- Change shared page UI without a separate design task

---

## Current lessons (HSK5)

| File | id | Status |
|------|-----|--------|
| `lesson-1.ts` | 1 | available |
| `lesson-2.ts` | 2 | available |
| `lesson-3.ts` | 3 | available |
