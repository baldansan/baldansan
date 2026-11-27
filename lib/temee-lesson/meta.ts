import type { TemeeLesson, TemeeLessonMeta } from "@/types/temee-lesson";

/** Бүтэн агуулгаас жижиг мэдээллийг гаргана (тоглуулагч дотор). */
export function temeeMetaFromLesson(lesson: TemeeLesson): TemeeLessonMeta {
  return {
    vocabCount: lesson.vocabKeep?.length,
    quizCount: lesson.quiz?.length,
    hasSounds: lesson.sounds != null,
    hasPractice: (lesson.practice?.length ?? 0) > 0,
    replacesGrammar: lesson.replacesGrammar === true,
    teachLabel: lesson.teach.label,
    teachMinutes: lesson.teach.minutes,
    soundsLabel: lesson.sounds?.label,
    soundsMinutes: lesson.sounds?.minutes,
  };
}
