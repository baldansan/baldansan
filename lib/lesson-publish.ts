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

export function lessonPreviewPath(
  lessonId: string,
  options?: { adminPreview?: boolean }
): string {
  const base = `/lessons/${lessonId}`;
  if (options?.adminPreview) {
    return `${base}?preview=admin`;
  }
  return base;
}
