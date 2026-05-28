import type { LessonContent, LessonPublishStatus } from "@/types/lesson-content";

export function getLessonPublishStatus(lesson: LessonContent): LessonPublishStatus {
  if (lesson.publishStatus) {
    return lesson.publishStatus;
  }
  return lesson.status === "available" ? "available" : "draft";
}

export function isPublicLesson(lesson: LessonContent): boolean {
  return getLessonPublishStatus(lesson) === "available";
}

export type LessonPreviewSubpath = "watch" | "vocabulary" | "quiz";

export function lessonPreviewPath(
  lessonId: string,
  options?: { adminPreview?: boolean; subpath?: LessonPreviewSubpath }
): string {
  let base = `/lessons/${lessonId}`;
  if (options?.subpath) {
    base += `/${options.subpath}`;
  }
  if (options?.adminPreview) {
    return `${base}?preview=admin`;
  }
  return base;
}
