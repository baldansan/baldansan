import type { LessonContent } from "@/types/lesson-content";

/**
 * Strip heavy lesson payload for list/catalog views (study hub, next-lesson
 * nav, Home page book pickers).
 *
 * `hskStudy` (dialogues, workbook sections, the raw `workbookPayload`) and
 * the raw `sourceNote` string it's parsed from are the two biggest fields on
 * a lesson row — for a 发展汉语 lesson, `sourceNote` alone can be 100-300KB
 * of JSON. `enrichLessonContentMeta` already derives every lightweight tag a
 * list view needs (`contentType`, `lessonType`, `mediaStatus`, …) from them
 * before this runs, so no list-view component reads `.hskStudy` or
 * `.sourceNote` — only single-lesson detail/player pages do, and those load
 * full lessons through a different path, not this summary. Dropping both
 * here is what keeps a catalog of 100+ lessons from shipping megabytes of
 * content nobody on that page will ever render.
 */
export function toLessonListSummary(lesson: LessonContent): LessonContent {
  if (
    lesson.vocabulary.length === 0 &&
    lesson.quizQuestions.length === 0 &&
    lesson.subtitlePreview.length === 0 &&
    lesson.timedSubtitles.length === 0 &&
    !lesson.vocabularyAudioMap &&
    !lesson.vocabularyPronunciationMap &&
    !lesson.teachingImages?.length &&
    !lesson.hskStudy &&
    !lesson.sourceNote
  ) {
    return lesson;
  }

  return {
    ...lesson,
    subtitlePreview: [],
    timedSubtitles: [],
    vocabulary: [],
    quizQuestions: [],
    vocabularyAudioMap: undefined,
    vocabularyPronunciationMap: undefined,
    teachingImages: undefined,
    hskStudy: undefined,
    sourceNote: undefined,
  };
}
