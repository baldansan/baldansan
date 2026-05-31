import type { LessonZipValidation } from "@/lib/import/lesson-zip-import";
import type { LessonImportPayload } from "@/lib/supabase/admin-import";

/** JSON-serializable body for POST /api/admin/import/lesson */
export type ImportDraftApiBody = {
  courseId: string;
  lessonId: string;
  language: string;
  targetLanguage?: string | null;
  uiLanguage?: string | null;
  title: string;
  targetTitle: string;
  subtitle?: string | null;
  description?: string | null;
  duration?: string | null;
  orderIndex?: number;
  sourceNote?: string | null;
  mediaStatus?: string;
  packageVersion?: string;
  lessonType?: string;
  importedFromZip: true;
  importPayload: LessonImportPayload;
  warnings: string[];
  /** chinese | korean — controls course auto-create policy on server. */
  importTrack?: "chinese" | "korean" | "legacy";
  allowAutoCreateCourse?: boolean;
};

export function buildImportDraftApiBody(
  validation: LessonZipValidation,
  options?: {
    importTrack?: ImportDraftApiBody["importTrack"];
    allowAutoCreateCourse?: boolean;
  }
): ImportDraftApiBody | null {
  if (
    !validation.ok ||
    !validation.importPayload ||
    !validation.preview ||
    !validation.lesson
  ) {
    return null;
  }

  const courseId = (
    validation.lesson.courseId || validation.preview.courseId
  ).trim();
  const lessonId = validation.preview.lessonId.trim();

  const title =
    validation.lesson.mongolianTitle ||
    validation.preview.mongolianTitle ||
    validation.lesson.title ||
    validation.preview.title;

  const targetTitle =
    validation.lesson.targetTitle ||
    validation.lesson.chineseTitle ||
    validation.preview.targetTitle ||
    title;

  const sourceNoteBase =
    validation.lesson.sourceNote ||
    validation.manifest?.source ||
    null;
  const lessonType =
    (validation.manifest as { lessonType?: string } | null)?.lessonType ??
    (validation.lesson as { lessonType?: string }).lessonType ??
    validation.hskProfile ??
    undefined;
  const sourceNote = lessonType
    ? `${sourceNoteBase ?? `ZIP package import (${validation.manifest?.packageVersion ?? "1.0"})`} · lessonType=${lessonType}`
    : sourceNoteBase;

  const track = options?.importTrack ?? "legacy";
  const allowAutoCreateCourse =
    options?.allowAutoCreateCourse ?? track !== "korean";

  return {
    courseId,
    lessonId,
    language: validation.preview.language,
    targetLanguage: validation.preview.targetLanguage ?? null,
    uiLanguage: validation.preview.uiLanguage ?? null,
    title,
    targetTitle,
    subtitle:
      validation.lesson.subtitle ??
      validation.lesson.mongolianTitle ??
      validation.preview.mongolianTitle ??
      null,
    description: validation.lesson.description ?? null,
    duration: validation.lesson.duration ?? null,
    orderIndex: validation.lesson.orderIndex ?? 1,
    sourceNote: validation.lesson.sourceNote ?? sourceNote,
    mediaStatus: validation.lesson.mediaStatus,
    packageVersion: validation.manifest?.packageVersion,
    lessonType,
    importedFromZip: true,
    importPayload: validation.importPayload,
    warnings: validation.warnings,
    importTrack: track,
    allowAutoCreateCourse,
  };
}
