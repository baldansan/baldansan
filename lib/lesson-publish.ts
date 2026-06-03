import type { LessonContent, LessonPublishStatus } from "@/types/lesson-content";

/** Map DB / legacy status strings to admin publish status. */
export function normalizePublishStatus(raw: string): LessonPublishStatus {
  if (raw === "published") return "available";
  if (raw === "available" || raw === "archived" || raw === "draft") {
    return raw;
  }
  return "draft";
}

export function getLessonPublishStatus(lesson: LessonContent): LessonPublishStatus {
  if (lesson.publishStatus) {
    return normalizePublishStatus(lesson.publishStatus);
  }
  if (lesson.status === "available") {
    return "available";
  }
  return "draft";
}

export function isPublicLesson(lesson: LessonContent): boolean {
  return getLessonPublishStatus(lesson) === "available";
}

export type LessonPreviewSubpath = "watch" | "vocabulary" | "quiz" | "workbook";

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
