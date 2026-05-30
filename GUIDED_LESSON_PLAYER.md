# Guided Lesson Player

Step-by-step guided lesson flow for Korean (especially Hangul Lesson 0) and other lessons.

## Route

```
/study/lesson-training/[lessonId]
```

**Alias:** `kr-0-hangul-foundation` resolves to `k-hangul`, then `k-pre-01` if needed.

**Path helper:** `lessonTrainingPath(lessonId)` in `lib/content.ts`.

## Step types

| Type | Purpose |
|------|---------|
| `summary` | Lesson intro (Mongolian title + overview) |
| `teacher_note` | Teacher-style speech bubble explanation |
| `concept` | Concept block with optional Hangul item grid |
| `visual` | Syllable-building visual lines (e.g. ㅎ+ㅏ+ㄴ=한) |
| `vocabulary_flashcard` | One card at a time with TTS + learned mark |
| `pronunciation` | Confusable pronunciation pairs (reserved) |
| `practice` | Inline multiple-choice drills before quiz |
| `quiz_intro` | Transition to assessment |
| `quiz_question` | One quiz question per step (existing `quizQuestions`) |
| `result` | Trophy, score, XP, retry / review / next lesson |
| `next_lesson` | Final CTA to continue course |

Built by `buildLessonSteps()` in `lib/lesson-player/build-lesson-steps.ts`.

## Korean Lesson 0 flow (Hangul foundation)

For `k-hangul`, `kr-0-hangul-foundation`, or `k-pre-01`:

1. Товч танилцуулга  
2. 한글 гэж юу вэ? (teacher note)  
3. Солонгос хэл хэдэн үсэгтэй вэ?  
4. Үеийн бүтэц (visual)  
5. Эгшиг  
6. Гийгүүлэгч  
7. Андуурагддаг дуудлага  
8. Vocabulary flashcards (imported vocab, one at a time)  
9. Дасгал (built-in practice questions)  
10. Quiz intro  
11. Quiz questions (from lesson `quizQuestions`)  
12. Result screen  
13. Next lesson  

Other Korean prelessons use a shorter flow: summary → teacher note → flashcards → quiz → result → next.

## Data mapping

| Step | Source |
|------|--------|
| Summary | `lesson.description`, `lesson.subtitle` |
| Teacher note | Fixed Hangul copy or `subtitlePreview[0]` / `subtitles[0]` |
| Flashcards | `lesson.vocabulary` (ordered via prelesson priority) |
| Quiz | `lesson.quizQuestions` + `enhanceLessonQuizQuestions()` |
| Practice | Built-in Hangul drills (v1); future: ZIP `practice.json` metadata |
| TTS | `resolveKoreanTtsLang()`, `vocabularyAudioMap` |

No database schema changes.

## Progress (localStorage)

Key: `lesson-progress:{lessonId}` (route id, not resolved alias)

Stores:

- `stepIndex` — current step  
- `flashcardIndex` — card within flashcard step  
- `practiceIndex` / `practiceCorrect`  
- `quizCorrectCount` / `quizAnswered`  

Menu **Дахин эхлэх** clears this key.

Lesson completion still uses existing `markLessonCompletedSmart()` when quiz ≥ 70% on the result step. Vocabulary learned state uses `toggleLearnedWordSmart()` (unchanged).

## UI

- `components/lesson-player/lesson-player-shell.tsx` — top bar, progress, menu, bottom CTA  
- Step components under `components/lesson-player/lesson-step-*.tsx`  
- Orchestrator: `components/lesson-player/guided-lesson-player.tsx`  
- Mobile shell: no bottom nav during player (`showBottomNav={false}`)  
- Korean badge: **KR-Beginner · Үсэг сурах** (no HSK label)

## Entry points

| Location | CTA | Link |
|----------|-----|------|
| Lesson detail (Korean) | Хичээл эхлэх | `/study/lesson-training/{id}` |
| Study list | Эхлэх | training path for Korean flashcard lessons |
| Quiz result | Дахин үзэх / Дараагийн хичээл | training path |

Chinese and HSK lesson pages are unchanged; generic player steps work if linked manually.

## Future

- Full Chinese guided flow with hanzi steps  
- Import `practice.json` into practice steps  
- Workbook route polish when `/lessons/{id}/workbook-practice` is added  
- Server-side step progress sync (optional Supabase field)
