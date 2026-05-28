# Seed plan — local content → Supabase

This document describes how existing TypeScript content will be inserted into the database **in a later Phase 3 step**. No seed scripts or DB writes exist yet.

## Source files

| Local source | Database target |
|--------------|-----------------|
| `content/courses/hsk5/index.ts` (`hsk5Course`) + `data/courses.ts` (HSK5 row) | `courses` |
| `content/courses/hsk5/lessons/lesson-{1,2,3}.ts` (`LessonContent`) | `lessons` + child rows |
| `LessonContent.timedSubtitles[]` | `subtitle_lines` |
| `LessonContent.vocabulary[]` | `vocabulary_words` |
| `LessonContent.quizQuestions[]` | `quiz_questions` |

Progress tables (`user_lesson_progress`, `user_vocabulary_progress`, `user_quiz_attempts`) stay empty until users exist (Phase 4 auth).

## Field mapping

### Course `hsk5` → `courses`

| TypeScript / mock | SQL column | Notes |
|-------------------|------------|--------|
| `hsk5Course.id` | `id` | `'hsk5'` |
| `hsk5Course.title` or `courses[].title` | `title` | Prefer catalog title from `data/courses.ts` |
| `courses[].description` | `description` | Catalog description |
| `courses[].level` | `level` | `'HSK5'` |
| `courses[].status` | `status` | `'available'` |
| (manual) | `order_index` | e.g. `1` among future courses |

`hsk5Course.subtitle` and `stats` are UI-only for now; optional future columns or JSON if needed.

### Lesson metadata → `lessons`

| `LessonContent` field | SQL column |
|----------------------|------------|
| `id` | `id` | e.g. `'1'`, `'2'`, `'3'` |
| `courseId` | `course_id` | `'hsk5'` |
| `title` | `title` |
| `chineseTitle` | `chinese_title` |
| `subtitle` | `subtitle` |
| `description` | `description` |
| `duration` | `duration` |
| `vocabularyCount` | `vocabulary_count` | Should match row count in `vocabulary_words` |
| `quizCount` | `quiz_count` | Should match row count in `quiz_questions` |
| `status` | `status` | `'available'` or `'locked'` |
| `id` (numeric) | `order_index` | `1`, `2`, `3` |

**Not stored in this schema (app-only until extended):**

- `videoPlaceholder`, `watchTotalTime`, `quizTypes`
- `subtitlePreview` — lesson detail UI can use the first N rows from `subtitle_lines` or stay client-side until a column is added

### `timedSubtitles` → `subtitle_lines`

| `TimedSubtitle` | SQL column |
|-----------------|------------|
| — | `lesson_id` |
| `start` | `start_time` |
| `end` | `end_time` |
| `chinese` | `chinese` |
| `pinyin` | `pinyin` |
| `mongolian` | `mongolian` |
| array index | `order_index` | `0`, `1`, `2`, … |

### `vocabulary` → `vocabulary_words`

| `VocabularyWord` | SQL column |
|------------------|------------|
| — | `lesson_id` |
| `chinese` | `chinese` |
| `pinyin` | `pinyin` |
| `mongolian` | `mongolian` |
| `hskLevel` | `hsk_level` |
| `exampleChinese` | `example_chinese` |
| `exampleMongolian` | `example_mongolian` |
| array index | `order_index` |

Local `VocabularyWord.id` (e.g. `"xijie"`) is not a DB primary key; use `vocabulary_words.id` (bigint) after insert. Map client “learned” state to `user_vocabulary_progress.vocabulary_word_id` in Phase 4.

### `quizQuestions` → `quiz_questions`

| `QuizQuestion` | SQL column |
|----------------|------------|
| — | `lesson_id` |
| `type` | `type` | `'multiple_choice'` \| `'cloze'` |
| `question` | `question` |
| `options` | `options` | JSON array of strings |
| `correctAnswer` | `correct_answer` |
| `explanation` | `explanation` |
| array index | `order_index` |

Local `QuizQuestion.id` (e.g. `"q1"`) is not stored; order is `order_index`.

## Expected row counts (current content)

| Lesson | `subtitle_lines` | `vocabulary_words` | `quiz_questions` |
|--------|------------------|--------------------|------------------|
| 1 | 4 (`timedSubtitles`) | 5 | 5 |
| 2 | (per `lesson-2.ts`) | 12 | 5 |
| 3 | (per `lesson-3.ts`) | 12 | 5 |

Verify counts against files before seeding; update `vocabulary_count` / `quiz_count` on `lessons` to match.

## Seeding order (foreign keys)

1. `courses` — insert `hsk5`
2. `lessons` — insert `1`, `2`, `3`
3. `subtitle_lines` — per lesson, ordered
4. `vocabulary_words` — per lesson, ordered
5. `quiz_questions` — per lesson, ordered

Use a transaction so a failed lesson does not leave partial children.

## Checklist — Lessons 1, 2, 3

### Preparation

- [ ] Supabase project created
- [ ] `001_initial_schema.sql` executed successfully
- [ ] SQL Editor or seed script ready

### Course

- [ ] Insert `courses` row: `id = 'hsk5'`, title, description, level `HSK5`, status `available`

### Lesson 1 (`lesson-1.ts`)

- [ ] Insert `lessons` row: `id = '1'`, `course_id = 'hsk5'`, counts 5 / 5, status `available`, `order_index = 1`
- [ ] Insert all `timedSubtitles` → `subtitle_lines` (4 rows)
- [ ] Insert all `vocabulary` → `vocabulary_words` (5 rows)
- [ ] Insert all `quizQuestions` → `quiz_questions` (5 rows, `options` as JSON array)

### Lesson 2 (`lesson-2.ts`)

- [ ] Insert `lessons` row: `id = '2'`, counts 12 / 5, status `available`, `order_index = 2`
- [ ] Insert subtitle lines from `timedSubtitles`
- [ ] Insert 12 vocabulary rows
- [ ] Insert 5 quiz rows

### Lesson 3 (`lesson-3.ts`)

- [ ] Insert `lessons` row: `id = '3'`, counts 12 / 5, status `available`, `order_index = 3`
- [ ] Insert subtitle lines from `timedSubtitles`
- [ ] Insert 12 vocabulary rows
- [ ] Insert 5 quiz rows

### Verification

- [ ] `select count(*) from subtitle_lines where lesson_id = '1'` matches file
- [ ] Same for vocabulary and quiz per lesson
- [ ] App still works from local files until `lib/content.ts` is switched
- [ ] After app integration: `/lessons/1`, `/lessons/2`, `/lessons/3` match DB content

## Future seed scope

- Additional courses from `data/courses.ts` (`hsk4`, `taobao`) when content files exist
- Lesson 4+ via same pipeline as [CONTENT_AUTHORING_GUIDE.md](../CONTENT_AUTHORING_GUIDE.md)
