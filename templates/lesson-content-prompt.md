# Lesson content prompt (copy into ChatGPT or Cursor)

Use this prompt when you want AI to generate a new lesson as **TypeScript data only** for Buunduu Surtsgaay.

---

## Prompt (copy from here)

You are helping author lesson content for **Buunduu Surtsgaay**, a Mongolian–Chinese language learning web app (Next.js, TypeScript, local data files only).

**Rules:**
- Output **only** a single TypeScript lesson object matching `LessonContent` from this project.
- **Do not** suggest UI changes, new routes, new packages, database, or auth.
- **Do not** create React page files. Only lesson data for:
  `content/courses/hsk5/lessons/lesson-N.ts`
- Export name must be `lessonN` (e.g. `lesson3`, `lesson4`).
- `id` must match the URL number (e.g. id `"3"` → `/lessons/3`).
- `courseId` is `"hsk5"`.
- `status`: `"available"` if the lesson is ready to publish, else `"locked"`.
- `vocabularyCount` must equal `vocabulary.length`.
- `quizCount` must equal `quizQuestions.length`.
- Each vocabulary item needs a unique `id` (latin slug).
- Each quiz question needs unique `id` (`q1`, `q2`, …).
- `correctAnswer` must **exactly** match one string in `options`.
- Quiz `type` is `"multiple_choice"` or `"cloze"` only.
- Include `subtitlePreview` (1–2 lines, usually first subtitles from watch list).
- Include full `timedSubtitles` with `start`, `end`, `chinese`, `pinyin`, `mongolian`.
- Include `quizTypes`: `["Multiple choice", "Cloze blank", "Match Chinese to Mongolian"]` unless fewer types apply.

**Required TypeScript shape:**

```ts
import type { LessonContent } from "@/types/lesson-content";

export const lessonN: LessonContent = {
  id: string,
  courseId: "hsk5",
  title: string,
  chineseTitle: string,
  subtitle: string,
  description: string,
  duration: string,           // e.g. "7 min"
  vocabularyCount: number,
  quizCount: number,
  status: "available" | "locked",
  videoPlaceholder: "Video lesson placeholder",
  watchTotalTime: string,     // e.g. "07:00"
  subtitlePreview: [{ chinese, pinyin, mongolian }],
  timedSubtitles: [{ start, end, chinese, pinyin, mongolian }],
  vocabulary: [{
    id, chinese, pinyin, mongolian, hskLevel,
    exampleChinese, exampleMongolian
  }],
  quizQuestions: [{
    id, type, question, options, correctAnswer, explanation
  }],
  quizTypes: string[],
};
```

**Reference examples in the repo:** `content/courses/hsk5/lessons/lesson-1.ts`, `lesson-2.ts`.

---

### Lesson metadata I want

- Lesson number / id: `REPLACE` (e.g. 3)
- Chinese title: `REPLACE`
- Mongolian subtitle: `REPLACE`
- Mongolian description: `REPLACE`
- Duration: `REPLACE` (e.g. 9 min)
- Status: `available` or `locked`

---

### Raw subtitles / script (paste below)

```
PASTE YOUR SUBTITLE LINES OR VIDEO SCRIPT HERE
Include Chinese, pinyin, and Mongolian if you have them.
Example format per line:
00:00-00:03 | 你真的懂我吗？ | Nǐ zhēn de dǒng wǒ ma? | Чи намайг үнэхээр ойлгодог уу?
```

---

### Vocabulary notes (optional paste)

```
PASTE WORD LIST OR NOTES HERE
```

---

### Quiz ideas (optional paste)

```
PASTE QUIZ IDEAS OR EXISTING QUESTIONS HERE
```

---

### Output

1. Full `lesson-N.ts` file content ready to save.
2. Short checklist: counts match, ids unique, status set.
3. Test URLs to verify:
   - http://localhost:3000/lessons/N
   - http://localhost:3000/lessons/N/watch
   - http://localhost:3000/lessons/N/vocabulary
   - http://localhost:3000/lessons/N/quiz

---

## End of prompt
