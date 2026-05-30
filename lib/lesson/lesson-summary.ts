import type { LessonContent } from "@/types/lesson-content";

/** Strip heavy lesson payload for list/catalog views (study hub, next-lesson nav). */
export function toLessonListSummary(lesson: LessonContent): LessonContent {
  if (
    lesson.vocabulary.length === 0 &&
    lesson.quizQuestions.length === 0 &&
    lesson.subtitlePreview.length === 0 &&
    lesson.timedSubtitles.length === 0 &&
    !lesson.vocabularyAudioMap &&
    !lesson.vocabularyPronunciationMap &&
    !lesson.teachingImages?.length
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
  };
}
