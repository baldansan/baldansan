import type { LessonZipValidation } from "@/lib/import/lesson-zip-import";
import type { LessonImportPayload } from "@/lib/supabase/admin-import";
import {
  isJsonSourceNote,
  mergeJsonSourceNoteFields,
} from "@/lib/lesson/source-note-json";

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
  /** Full JSON source_note for Chinese HSK imports (preferred over sourceNote). */
  hskSourceNoteJson?: string | null;
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

function resolveImportSourceNote(
  validation: LessonZipValidation,
  importTrack?: ImportDraftApiBody["importTrack"]
): string | null {
  const fromLesson = validation.lesson?.sourceNote?.trim();
  if (fromLesson && isJsonSourceNote(fromLesson)) {
    return fromLesson;
  }

  const lessonType =
    validation.hskProfile ??
    validation.lesson?.lessonType ??
    (validation.manifest as { lessonType?: string } | null)?.lessonType;

  if (lessonType && fromLesson && isJsonSourceNote(fromLesson)) {
    return mergeJsonSourceNoteFields(fromLesson, { lessonType });
  }

  if (fromLesson) {
    return fromLesson;
  }

  const manifestSource = validation.manifest?.source?.trim();
  if (manifestSource && isJsonSourceNote(manifestSource)) {
    return manifestSource;
  }

  if (importTrack === "chinese" || validation.hskProfile) {
    return null;
  }

  const fallbackBase =
    manifestSource || `ZIP package import (${validation.manifest?.packageVersion ?? "1.0"})`;
  if (lessonType) {
    return `${fallbackBase} · lessonType=${lessonType}`;
  }
  return fallbackBase;
}

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

  const track = options?.importTrack ?? "legacy";
  const allowAutoCreateCourse =
    options?.allowAutoCreateCourse ?? track !== "korean";

  const sourceNote = resolveImportSourceNote(validation, track);

  const lessonType =
    (validation.manifest as { lessonType?: string } | null)?.lessonType ??
    validation.lesson?.lessonType ??
    validation.hskProfile ??
    undefined;

  const hskSourceNoteJson =
    sourceNote && isJsonSourceNote(sourceNote) ? sourceNote : null;

  if (track === "chinese" && !hskSourceNoteJson) {
    return null;
  }

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
    sourceNote: hskSourceNoteJson ?? sourceNote,
    hskSourceNoteJson,
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
