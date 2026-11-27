import type { TemeeLesson, TemeeLessonMeta } from "@/types/temee-lesson";

/**
 * «Тэмээ багшийн хичээл»-тэй хичээлүүдийн жижиг мэдээлэл — клиентэд (хичээлийн нүүр, зам)
 * бүтэн агуулгыг татахгүйгээр хэрэглэнэ. `npm run temee:check` нь энэ хүснэгт
 * content/temee-lessons/*.json-той таарч буйг шалгана.
 */
export const TEMEE_LESSON_META: Record<string, TemeeLessonMeta> = {
  "fazhan-chuji1-l01": {
    vocabCount: 14,
    quizCount: 18,
    hasSounds: true,
    hasPractice: true,
    replacesGrammar: true,
    teachLabel: "Тэмээ багшийн хичээл",
    teachMinutes: 12,
    soundsLabel: "Авианы дасгал",
    soundsMinutes: 10,
  },
};

export function temeeLessonMeta(lessonId: string): TemeeLessonMeta | null {
  return TEMEE_LESSON_META[lessonId] ?? null;
}

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
