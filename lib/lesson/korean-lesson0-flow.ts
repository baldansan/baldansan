import { resolveLessonTypeTag } from "@/lib/lesson-content-type";
import { isHangulFoundationLessonId } from "@/lib/lesson-player/resolve-training-lesson-id";
import type { LessonContent } from "@/types/lesson-content";

type LessonPick = Pick<
  LessonContent,
  "id" | "courseId" | "title" | "chineseTitle" | "sourceNote"
> & {
  orderIndex?: number;
};

export type KoreanLesson0LessonPick = LessonPick;

/** True for Korean Hangul Lesson 0 — simplified beginner-only learner flow. */
export function isKoreanLesson0BeginnerFlow(lesson: LessonPick): boolean {
  if (isHangulFoundationLessonId(lesson.id)) return true;

  const id = lesson.id.trim().toLowerCase();
  if (id.startsWith("kr-0-") || id.includes("hangul-foundation")) return true;

  const course = lesson.courseId?.trim().toLowerCase() ?? "";
  if (!course.startsWith("korean")) return false;

  const lessonType = resolveLessonTypeTag(lesson)?.toLowerCase();
  if (lessonType === "hangul") return true;

  const combined = `${lesson.title} ${lesson.chineseTitle} ${lesson.id}`;
  if (
    (combined.includes("한글") || /hangul/i.test(combined)) &&
    (lessonType === "prelesson" || id.includes("hangul") || id === "k-pre-01")
  ) {
    return true;
  }

  return false;
}

export const KOREAN_LESSON0_DISPLAY_TITLE =
  "Солонгос үсэг уншиж сурах суурь";
export const KOREAN_LESSON0_DISPLAY_SUBTITLE = "한글 읽기 기초";
export const KOREAN_LESSON0_INTRO =
  "Энэ хичээлээр солонгос үсэг, эгшиг, гийгүүлэгч, үе бүтээх, 받침-ийн суурийг багшийн тайлбартайгаар сурна.";

export const HANGUL_FOUNDATION_DISPLAY_TOTAL = 12;
