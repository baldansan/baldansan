import type { LessonContent } from "@/types/lesson-content";

export type LessonPackageType = "prelesson" | "lesson";

const PRELESSON_ID_PATTERN = /PRELESSON|K-PRE-|KR-L1-PRE/i;

function sourceNoteIndicatesPrelesson(sourceNote?: string | null): boolean {
  const note = sourceNote?.toLowerCase() ?? "";
  return (
    note.includes("lessontype=prelesson") ||
    note.includes("type=prelesson") ||
    note.includes("lesson_type=prelesson")
  );
}

/** Infer ZIP package lesson type from id, course, or import source note. */
export function inferLessonPackageType(
  lesson: Pick<LessonContent, "id" | "courseId" | "sourceNote">
): LessonPackageType {
  if (sourceNoteIndicatesPrelesson(lesson.sourceNote)) {
    return "prelesson";
  }
  if (PRELESSON_ID_PATTERN.test(lesson.id)) {
    return "prelesson";
  }
  if (
    lesson.courseId.toLowerCase().startsWith("korean") &&
    /prelesson/i.test(lesson.id)
  ) {
    return "prelesson";
  }
  return "lesson";
}

export function isPrelessonPackage(
  lesson: Pick<LessonContent, "id" | "courseId" | "sourceNote">
): boolean {
  return inferLessonPackageType(lesson) === "prelesson";
}

export function isMediaOptionalForPublish(
  lesson: Pick<LessonContent, "id" | "courseId" | "sourceNote">
): boolean {
  return isPrelessonPackage(lesson);
}

export function hasPublishMetadata(
  lesson: Pick<
    LessonContent,
    "id" | "courseId" | "sourceNote" | "title" | "chineseTitle" | "subtitle" | "description"
  >
): boolean {
  const titleOk = Boolean(lesson.title?.trim());
  const targetOk = Boolean(lesson.chineseTitle?.trim());

  if (isPrelessonPackage(lesson)) {
    return titleOk && targetOk;
  }

  return Boolean(
    titleOk &&
      targetOk &&
      (lesson.subtitle?.trim() || lesson.description?.trim())
  );
}
