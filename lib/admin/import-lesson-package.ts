import { inferLanguageTagFromCourseId } from "@/lib/language-track";
import type {
  LessonZipMediaFile,
  LessonZipValidation,
} from "@/lib/import/lesson-zip-import";
import { normalizeZipPath } from "@/lib/import/zip-path";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_ACTIVITY_ACTIONS,
  logAdminActivityFireAndForget,
} from "@/lib/supabase/admin-activity";
import { bulkImportLessonContent } from "@/lib/supabase/admin-import";
import {
  createDraftLesson,
  getAdminLessonMetadataById,
  updateLessonMedia,
} from "@/lib/supabase/admin-content";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { LESSON_MEDIA_BUCKET } from "@/lib/supabase/media-upload";

export type PackageMediaUploadResult = {
  zipPath: string;
  kind: "audio" | "image";
  publicUrl: string | null;
  storagePath: string | null;
  error: string | null;
};

export type LessonPackageImportResult = {
  ok: boolean;
  lessonId: string;
  courseId: string;
  vocabularyInserted: number;
  quizInserted: number;
  subtitlesInserted: number;
  mediaUploaded: number;
  mediaFailures: PackageMediaUploadResult[];
  warnings: string[];
  errors: string[];
  audioUrl?: string;
  thumbnailUrl?: string;
};

function notConfigured(): LessonPackageImportResult {
  return {
    ok: false,
    lessonId: "",
    courseId: "",
    vocabularyInserted: 0,
    quizInserted: 0,
    subtitlesInserted: 0,
    mediaUploaded: 0,
    mediaFailures: [],
    warnings: [],
    errors: ["Supabase is not configured."],
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 120);
}

export function getPackageMediaStoragePath(
  courseId: string,
  lessonId: string,
  kind: "audio" | "image",
  fileName: string
): string {
  return `${courseId}/${lessonId}/${kind}/${sanitizeFileName(fileName)}`;
}

async function uploadPackageMediaFile(
  courseId: string,
  lessonId: string,
  media: LessonZipMediaFile
): Promise<PackageMediaUploadResult> {
  if (!supabase || !hasSupabaseConfig) {
    return {
      zipPath: media.zipPath,
      kind: media.kind,
      publicUrl: null,
      storagePath: null,
      error: "Supabase is not configured.",
    };
  }

  const storagePath = getPackageMediaStoragePath(
    courseId,
    lessonId,
    media.kind,
    media.fileName
  );

  try {
    const file = new File([media.blob], media.fileName, {
      type: media.mimeType,
    });

    const { error: uploadError } = await supabase.storage
      .from(LESSON_MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: media.mimeType,
      });

    if (uploadError) {
      return {
        zipPath: media.zipPath,
        kind: media.kind,
        publicUrl: null,
        storagePath,
        error: uploadError.message,
      };
    }

    const { data } = supabase.storage.from(LESSON_MEDIA_BUCKET).getPublicUrl(storagePath);

    return {
      zipPath: media.zipPath,
      kind: media.kind,
      publicUrl: data.publicUrl ?? null,
      storagePath,
      error: data.publicUrl ? null : "Public URL үүсгэж чадсангүй.",
    };
  } catch {
    return {
      zipPath: media.zipPath,
      kind: media.kind,
      publicUrl: null,
      storagePath,
      error: "Media upload failed.",
    };
  }
}

function resolveMediaUrl(
  uploads: PackageMediaUploadResult[],
  preferredPath: string | undefined,
  kind: "audio" | "image"
): string | undefined {
  if (preferredPath) {
    const normalized = normalizeZipPath(preferredPath);
    const match = uploads.find(
      (item) =>
        item.kind === kind &&
        !item.error &&
        item.publicUrl &&
        normalizeZipPath(item.zipPath).toLowerCase() === normalized.toLowerCase()
    );
    if (match?.publicUrl) return match.publicUrl;
  }

  const fallback = uploads.find(
    (item) => item.kind === kind && !item.error && item.publicUrl
  );
  return fallback?.publicUrl ?? undefined;
}

async function upsertLessonShell(
  validation: LessonZipValidation
): Promise<{ ok: boolean; error?: string }> {
  if (!validation.preview || !validation.lesson || !supabase) {
    return { ok: false, error: "Missing lesson preview data." };
  }

  const lessonId = validation.preview.lessonId;
  const courseId = validation.lesson.courseId || validation.preview.courseId;
  const existing = await getAdminLessonMetadataById(lessonId);

  const sourceNote =
    validation.lesson.sourceNote ||
    validation.manifest?.source ||
    `ZIP package import (${validation.manifest?.packageVersion ?? "1.0"})`;

  if (existing.error) {
    return { ok: false, error: existing.error };
  }

  if (!existing.data) {
    const created = await createDraftLesson({
      id: lessonId,
      courseId,
      title: validation.lesson.title,
      chineseTitle: validation.lesson.chineseTitle,
      subtitle: validation.lesson.subtitle,
      description: validation.lesson.description,
      duration: validation.lesson.duration,
      status: "draft",
      orderIndex: validation.lesson.orderIndex,
      language:
        validation.preview.language ||
        inferLanguageTagFromCourseId(courseId),
    });
    if (created.error || !created.data) {
      return { ok: false, error: created.error ?? "Lesson create failed." };
    }
  }

  const { error } = await supabase
    .from("lessons")
    .update({
      course_id: courseId,
      title: validation.lesson.title,
      chinese_title: validation.lesson.chineseTitle,
      subtitle: validation.lesson.subtitle ?? null,
      description: validation.lesson.description ?? null,
      duration: validation.lesson.duration ?? null,
      status: "draft",
      order_index: validation.lesson.orderIndex ?? existing.data?.order_index ?? 1,
      source_note: sourceNote,
      media_status: validation.lesson.mediaStatus ?? "missing",
      language:
        validation.preview.language ||
        inferLanguageTagFromCourseId(courseId),
    })
    .eq("id", lessonId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function importLessonPackage(
  validation: LessonZipValidation
): Promise<LessonPackageImportResult> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return {
      ...notConfigured(),
      errors: ["Admin эрх шаардлагатай."],
    };
  }

  if (!validation.ok || !validation.importPayload || !validation.preview || !validation.lesson) {
    return {
      ok: false,
      lessonId: validation.preview?.lessonId ?? "",
      courseId: validation.preview?.courseId ?? "",
      vocabularyInserted: 0,
      quizInserted: 0,
      subtitlesInserted: 0,
      mediaUploaded: 0,
      mediaFailures: [],
      warnings: validation.warnings,
      errors: validation.errors.length
        ? validation.errors
        : ["ZIP package validation failed."],
    };
  }

  const lessonId = validation.preview.lessonId;
  const courseId = validation.lesson.courseId || validation.preview.courseId;
  const warnings = [...validation.warnings];
  const errors: string[] = [];

  const shell = await upsertLessonShell(validation);
  if (!shell.ok) {
    return {
      ok: false,
      lessonId,
      courseId,
      vocabularyInserted: 0,
      quizInserted: 0,
      subtitlesInserted: 0,
      mediaUploaded: 0,
      mediaFailures: [],
      warnings,
      errors: [shell.error ?? "Lesson upsert failed."],
    };
  }

  const imported = await bulkImportLessonContent(lessonId, validation.importPayload, {
    mode: "replace",
  });

  if (imported.error || !imported.data) {
    return {
      ok: false,
      lessonId,
      courseId,
      vocabularyInserted: 0,
      quizInserted: 0,
      subtitlesInserted: 0,
      mediaUploaded: 0,
      mediaFailures: [],
      warnings,
      errors: [imported.error ?? "Bulk import failed."],
    };
  }

  const mediaFailures: PackageMediaUploadResult[] = [];
  let mediaUploaded = 0;

  for (const media of validation.mediaFiles) {
    const result = await uploadPackageMediaFile(courseId, lessonId, media);
    mediaFailures.push(result);
    if (result.publicUrl && !result.error) {
      mediaUploaded += 1;
    } else if (result.error) {
      warnings.push(`Media "${media.zipPath}" upload failed: ${result.error}`);
    }
  }

  const audioUrl = resolveMediaUrl(
    mediaFailures,
    validation.lesson.audioFile,
    "audio"
  );
  const thumbnailUrl = resolveMediaUrl(
    mediaFailures,
    validation.lesson.thumbnailFile,
    "image"
  );

  let mediaStatus: "missing" | "pending" | "ready" = "missing";
  if (audioUrl || thumbnailUrl) {
    mediaStatus = "pending";
  }
  if (validation.lesson.mediaStatus === "ready" && audioUrl) {
    mediaStatus = "ready";
  } else if (validation.lesson.mediaStatus === "pending") {
    mediaStatus = "pending";
  }

  if (audioUrl || thumbnailUrl || validation.lesson.sourceNote) {
    const mediaUpdate = await updateLessonMedia(lessonId, {
      audioUrl: audioUrl ?? "",
      thumbnailUrl: thumbnailUrl ?? "",
      sourceNote:
        validation.lesson.sourceNote ||
        validation.manifest?.source ||
        "ZIP package import",
      mediaStatus,
    });
    if (mediaUpdate.error) {
      warnings.push(`Lesson media URLs хадгалахад алдаа: ${mediaUpdate.error}`);
    }
    if (mediaUpdate.data?.warnings?.length) {
      warnings.push(...mediaUpdate.data.warnings);
    }
  } else if (validation.mediaFiles.length > 0 && mediaUploaded === 0) {
    warnings.push(
      "ZIP-д media файл байсан ч Storage upload амжилтгүй — текст контент импортлогдсон. media_status = missing."
    );
  }

  logAdminActivityFireAndForget({
    action: ADMIN_ACTIVITY_ACTIONS.bulkImportCompleted,
    entityType: "lesson",
    entityId: lessonId,
    lessonId,
    title: `ZIP package imported for lesson ${lessonId}`,
    metadata: {
      source: "zip_package",
      courseId,
      language: validation.preview.language,
      vocabularyInserted: imported.data.vocabularyInserted,
      quizInserted: imported.data.quizQuestionsInserted,
      subtitlesInserted: imported.data.subtitlesInserted,
      mediaUploaded,
    },
  });

  return {
    ok: true,
    lessonId,
    courseId,
    vocabularyInserted: imported.data.vocabularyInserted,
    quizInserted: imported.data.quizQuestionsInserted,
    subtitlesInserted: imported.data.subtitlesInserted,
    mediaUploaded,
    mediaFailures,
    warnings,
    errors,
    audioUrl,
    thumbnailUrl,
  };
}
