# Chinese HSK Import Profiles

Profiles are defined in `lib/import/chinese-hsk-profiles.ts`.

## Level profile table

| HSK | Profile ID | Badge | Focus |
|-----|------------|-------|-------|
| 1 | `hsk1-pronunciation-character-basic` | HSK1 Foundation | Pinyin, tones, characters, basic dialogues |
| 2 | `hsk2-basic-dialogue-sentence` | HSK2 Basic Dialogue | Dialogues + sentence patterns |
| 3 | `hsk3-dialogue-reading-writing-review` | HSK3 Transition | Texts, writing, review |
| 4 | `hsk4-dialogue-shorttext-exam-workbook` | HSK4 Dialogue + Text | 5 texts (3 dialogue + 2 short_text) + workbook exam |
| 5 | `hsk5-article-topic-vocab-nuance-writing` | HSK5 Article | Article reader + vocab nuance + writing |
| 6 | `hsk6-advanced-reading-output-summary` | HSK6 Advanced | Long text + discourse + summary writing |

## Required sections by profile

### HSK1 — `hsk1-pronunciation-character-basic`

Required: `lessonIntro`, `pinyinPronunciation`, `tones`, `basicWords`, `basicSentences`, `dialogues`, `characters`, `workbookPronunciation`, `workbookCharacters`, `miniQuiz`

Optional: `culture`, `modelTest`

### HSK2 — `hsk2-basic-dialogue-sentence`

Required: `lessonIntro`, `dialogues`, `vocabulary`, `grammarPatterns`, `sentencePractice`, `workbookListening`, `workbookReading`, `workbookPronunciation`, `workbookCharacters`, `quiz`

Optional: `modelTest`, `culture`

### HSK3 — `hsk3-dialogue-reading-writing-review`

Required: `lessonIntro`, `texts`, `vocabulary`, `grammarNotes`, `characters`, `commonSaying`, `culture`, `workbookListening`, `workbookReading`, `workbookWriting`, `workbookReview`, `quiz`

Optional: `dialogues`, `shortReadings`

### HSK4 — `hsk4-dialogue-shorttext-exam-workbook`

Required: `warmup`, `texts`, `vocabulary`, `notes`, `compare`, `textComprehensionQuestions`, `exercises`, `expansion`, `application`, `culture`, `workbookListening`, `workbookReading`, `workbookWriting`, `quiz`

Text rules: 5 texts recommended — types `dialogue`, `dialogue`, `dialogue`, `short_text`, `short_text`

### HSK5 — `hsk5-article-topic-vocab-nuance-writing`

Required: `unit`, `warmup`, `mainText`, `vocabulary`, `wordExplanation`, `collocations`, `wordComparison`, `textExercises`, `expansionVocabulary`, `applicationDiscussionOrWriting`, `workbookListening`, `workbookReading`, `workbookWriting`, `quiz`

Text rules: article mode, paragraph chunking, vocabulary nuance sections

### HSK6 — `hsk6-advanced-reading-output-summary`

Required: `unit`, `warmup`, `longText`, `vocabulary`, `comprehensiveNotes`, `wordComparison`, `discourseRhetoric`, `sentenceErrorAnalysis`, `textExercises`, `applicationSummaryWriting`, `expansionVocabulary`, `workbookListening`, `workbookReading`, `workbookSummaryWriting`, `quiz`

Text rules: advanced article, paragraph chunking, summary writing, wrong-sentence detection

## Validation levels

| Level | Blocks import? | Examples |
|-------|----------------|----------|
| **criticalErrors** | Yes | Invalid ZIP, missing manifest/lesson/vocabulary, unknown profile, missing required section |
| **warnings** | No | Missing audio/images, optional sections, answerStatus not verified, text count mismatch |
| **info** | No | Detected level/profile, counts, source inventory |

## Section file mapping

Sections may appear in any of:

- `lesson.json` — top-level keys (e.g. `lessonIntro`, `warmup`)
- `texts.json` — `dialogues`, `texts`, `mainText`, `longText`, `paragraphs`
- `vocabulary.json` — array or `basicWords` object
- `grammar.json` — `grammarPatterns`, `grammarNotes`
- `notes.json` — `notes`, `compare`, `wordComparison`, …
- `workbook.json` — `listening`, `reading`, `writing`, `pronunciation`, `characters`, `review`, `summaryWriting`
- `quiz.json` — array or `miniQuiz` object

## Legacy packages

Packages **without** `courseType: chinese-hsk` or `hskLevel` continue to use the legacy Chinese validator (unchanged behavior).
