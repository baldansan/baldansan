import {
  inferLessonPackageType,
} from "@/lib/admin/lesson-package-type";
import { hasVideoUrl } from "@/lib/lesson-media";
import { enrichLessonTeachingMedia } from "@/lib/lesson/teaching-media";
import type { LessonContent } from "@/types/lesson-content";

export type LessonContentType = "textbook" | "video" | "exam";

const CONTENT_TYPES: LessonContentType[] = ["textbook", "video", "exam"];

export function isLessonContentType(value: string): value is LessonContentType {
  return CONTENT_TYPES.includes(value as LessonContentType);
}

export function parseTagFromSourceNote(
  sourceNote: string | undefined | null,
  tag: string
): string | null {
  const note = sourceNote ?? "";
  const pattern = new RegExp(`${tag}=([^·\\s,]+)`, "i");
  const match = note.match(pattern);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

export function parseContentTypeFromSourceNote(
  sourceNote?: string | null
): LessonContentType | null {
  const raw =
    parseTagFromSourceNote(sourceNote, "contentType") ??
    parseTagFromSourceNote(sourceNote, "content_type");
  if (raw && isLessonContentType(raw)) return raw;
  return null;
}

/** Resolve lessonType tag from field, source_note, or prelesson id heuristics. */
export function resolveLessonTypeTag(
  lesson: Pick<LessonContent, "lessonType" | "sourceNote" | "id" | "courseId">
): string | undefined {
  if (lesson.lessonType) return lesson.lessonType;
  const fromNote = parseTagFromSourceNote(lesson.sourceNote, "lessonType");
  if (fromNote) return fromNote;
  if (inferLessonPackageType(lesson) === "prelesson") return "prelesson";
  return undefined;
}

export function inferContentType(input: {
  contentType?: string | null;
  lessonType?: string | null;
  sourceNote?: string | null;
  videoUrl?: string | null;
  hasVideoFile?: boolean;
}): LessonContentType {
  const explicit = input.contentType?.trim().toLowerCase();
  if (explicit && isLessonContentType(explicit)) return explicit;

  const fromNote = parseContentTypeFromSourceNote(input.sourceNote);
  if (fromNote) return fromNote;

  const lessonType = (
    input.lessonType ??
    parseTagFromSourceNote(input.sourceNote ?? "", "lessonType")
  )?.toLowerCase();

  if (lessonType === "prelesson" || lessonType === "textbook") {
    return "textbook";
  }
  if (lessonType === "exam") {
    return "exam";
  }

  if (
    hasVideoUrl({ videoUrl: input.videoUrl ?? undefined }) ||
    input.hasVideoFile
  ) {
    return "video";
  }

  return "textbook";
}

export function resolveLessonContentType(lesson: LessonContent): LessonContentType {
  if (lesson.contentType && isLessonContentType(lesson.contentType)) {
    return lesson.contentType;
  }

  return inferContentType({
    contentType: lesson.contentType,
    sourceNote: lesson.sourceNote,
    lessonType: resolveLessonTypeTag(lesson),
    videoUrl: lesson.videoUrl,
  });
}

export function enrichLessonContentMeta(lesson: LessonContent): LessonContent {
  const contentType = resolveLessonContentType(lesson);
  const tag = resolveLessonTypeTag(lesson);
  const lessonType =
    lesson.lessonType ??
    (tag === "prelesson" || tag === "lesson" ? tag : undefined);

  const withMeta =
    lesson.contentType === contentType && lesson.lessonType === lessonType
      ? lesson
      : {
          ...lesson,
          contentType,
          ...(lessonType ? { lessonType } : {}),
        };

  return enrichLessonTeachingMedia(withMeta);
}

export function isTextbookContent(lesson: LessonContent): boolean {
  return resolveLessonContentType(lesson) === "textbook";
}

export function isVideoContent(lesson: LessonContent): boolean {
  return resolveLessonContentType(lesson) === "video";
}

export function isExamContent(lesson: LessonContent): boolean {
  return resolveLessonContentType(lesson) === "exam";
}

export function watchStepLabel(contentType: LessonContentType): string {
  if (contentType === "textbook") return "Сурах";
  if (contentType === "exam") return "Шалгалт";
  return "Үзэх";
}
