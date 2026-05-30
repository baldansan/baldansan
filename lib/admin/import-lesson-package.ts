import { inferLanguageTagFromCourseId } from "@/lib/language-track";
import type {
  LessonZipMediaFile,
  LessonZipValidation,
} from "@/lib/import/lesson-zip-import";
import { normalizeZipPath } from "@/lib/import/zip-path";
import type { ImportDraftApiBody } from "@/lib/admin/build-import-draft-request";
import { upsertDraftLessonFromPackage } from "@/lib/admin/upsert-draft-lesson-from-package";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_ACTIVITY_ACTIONS,
  logAdminActivityFireAndForget,
} from "@/lib/supabase/admin-activity";
import { bulkImportLessonContent } from "@/lib/supabase/admin-import";
import { updateLessonMedia } from "@/lib/supabase/admin-content";
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
  /** Original package/manifest lessonId (may differ from lessonId when DB id is numeric). */
  packageLessonId?: string;
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
  created?: boolean;
  message?: string;
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

type DraftLessonShell = {
  courseId: string;
  lessonId: string;
  language: string;
  targetLanguage?: string | null;
  uiLanguage?: string | null;
  title: string;
  targetTitle: string;
  subtitle: string | null;
  description: string | null;
  duration: string | null;
  orderIndex: number;
  sourceNote: string;
  mediaStatus: "missing" | "pending" | "ready";
  packageVersion?: string;
};

function buildDraftLessonShell(validation: LessonZipValidation): DraftLessonShell | null {
  if (!validation.preview || !validation.lesson) {
    return null;
  }

  const lessonId = validation.preview.lessonId?.trim();
  const courseId = (
    validation.lesson.courseId || validation.preview.courseId
  )?.trim();

  if (!courseId || !lessonId) {
    return null;
  }

  const displayTitle =
    validation.lesson.mongolianTitle ||
    validation.preview.mongolianTitle ||
    validation.lesson.title ||
    validation.preview.title;
  const targetTitle =
    validation.lesson.targetTitle ||
    validation.lesson.chineseTitle ||
    validation.preview.targetTitle ||
    displayTitle ||
    lessonId;

  const sourceNote =
    validation.lesson.sourceNote ||
    validation.manifest?.source ||
    `ZIP package import (${validation.manifest?.packageVersion ?? "1.0"})`;

  return {
    courseId,
    lessonId,
    language:
      validation.preview.language ||
      inferLanguageTagFromCourseId(courseId),
    targetLanguage: validation.preview.targetLanguage ?? null,
    uiLanguage: validation.preview.uiLanguage ?? null,
    title: displayTitle,
    targetTitle,
    subtitle:
      validation.lesson.subtitle ??
      validation.lesson.mongolianTitle ??
      validation.preview.mongolianTitle ??
      null,
    description: validation.lesson.description ?? null,
    duration: validation.lesson.duration ?? null,
    orderIndex: validation.lesson.orderIndex ?? 1,
    sourceNote,
    mediaStatus:
      validation.lesson.mediaStatus === "ready" ||
      validation.lesson.mediaStatus === "pending"
        ? validation.lesson.mediaStatus
        : "missing",
    packageVersion: validation.manifest?.packageVersion,
  };
}

function buildImportDraftBodyFromValidation(
  validation: LessonZipValidation
): ImportDraftApiBody | null {
  const draft = buildDraftLessonShell(validation);
  if (!draft || !validation.importPayload) {
    return null;
  }

  return {
    courseId: draft.courseId,
    lessonId: draft.lessonId,
    language: draft.language,
    targetLanguage: draft.targetLanguage ?? null,
    uiLanguage: draft.uiLanguage ?? null,
    title: draft.title,
    targetTitle: draft.targetTitle,
    subtitle: draft.subtitle,
    description: draft.description,
    duration: draft.duration,
    orderIndex: draft.orderIndex,
    sourceNote: draft.sourceNote,
    mediaStatus: draft.mediaStatus,
    packageVersion: draft.packageVersion,
    lessonType: validation.lesson?.lessonType,
    importedFromZip: true,
    importPayload: validation.importPayload,
    warnings: validation.warnings,
  };
}

async function upsertLessonShell(
  validation: LessonZipValidation
): Promise<{
  ok: boolean;
  resolvedLessonId?: string;
  packageLessonId?: string;
  error?: string;
  created?: boolean;
  warnings?: string[];
}> {
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const body = buildImportDraftBodyFromValidation(validation);
  if (!body) {
    if (!validation.preview?.courseId && !validation.lesson?.courseId) {
      return { ok: false, error: "courseId missing in manifest.json." };
    }
    if (!validation.preview?.lessonId) {
      return { ok: false, error: "lessonId missing in manifest.json." };
    }
    return { ok: false, error: "ZIP parse data missing. Please validate again." };
  }

  console.log("parsed import package", {
    courseId: body.courseId,
    lessonId: body.lessonId,
    language: body.language,
    targetLanguage: body.targetLanguage,
    title: body.title,
    targetTitle: body.targetTitle,
    vocabularyCount: validation.vocabulary.length,
    quizCount: validation.quizQuestions.length,
    packageVersion: body.packageVersion,
  });

  const result = await upsertDraftLessonFromPackage(supabase, body);
  return {
    ok: result.ok,
    resolvedLessonId: result.resolvedLessonId,
    packageLessonId: result.packageLessonId,
    created: result.created,
    error: result.error,
    warnings: result.warnings,
  };
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
    const missingParsed =
      !validation.preview || !validation.lesson || !validation.importPayload;
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
      errors: missingParsed
        ? ["ZIP parse data missing. Please validate again."]
        : validation.errors.length
          ? validation.errors
          : ["ZIP package validation failed."],
    };
  }

  const packageLessonId = validation.preview.lessonId;
  const courseId = validation.lesson.courseId || validation.preview.courseId;
  const warnings = [...validation.warnings];
  const errors: string[] = [];

  const shell = await upsertLessonShell(validation);
  if (!shell.ok || !shell.resolvedLessonId) {
    return {
      ok: false,
      lessonId: packageLessonId,
      packageLessonId,
      courseId,
      vocabularyInserted: 0,
      quizInserted: 0,
      subtitlesInserted: 0,
      mediaUploaded: 0,
      mediaFailures: [],
      warnings,
      errors: [shell.error ?? "Draft lesson upsert failed."],
    };
  }
  if (shell.warnings?.length) {
    warnings.push(...shell.warnings);
  }

  const resolvedLessonId = shell.resolvedLessonId;

  const imported = await bulkImportLessonContent(
    resolvedLessonId,
    validation.importPayload,
    {
      mode: "replace",
    }
  );

  if (imported.error || !imported.data) {
    return {
      ok: false,
      lessonId: resolvedLessonId,
      packageLessonId,
      courseId,
      vocabularyInserted: 0,
      quizInserted: 0,
      subtitlesInserted: 0,
      mediaUploaded: 0,
      mediaFailures: [],
      warnings,
      errors: [imported.error ?? "Bulk content import failed."],
      created: shell.created,
    };
  }

  const mediaFailures: PackageMediaUploadResult[] = [];
  let mediaUploaded = 0;

  for (const media of validation.mediaFiles) {
    const result = await uploadPackageMediaFile(courseId, resolvedLessonId, media);
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
    const mediaUpdate = await updateLessonMedia(resolvedLessonId, {
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
    entityId: resolvedLessonId,
    lessonId: resolvedLessonId,
    title: `ZIP package imported for lesson ${resolvedLessonId}`,
    metadata: {
      source: "zip_package",
      courseId,
      packageLessonId,
      language: validation.preview.language,
      vocabularyInserted: imported.data.vocabularyInserted,
      quizInserted: imported.data.quizQuestionsInserted,
      subtitlesInserted: imported.data.subtitlesInserted,
      mediaUploaded,
    },
  });

  const message = shell.created
    ? "Шинэ draft lesson үүсгээд import амжилттай хийлээ."
    : "Одоо байгаа draft lesson дээр import хийлээ.";

  const result: LessonPackageImportResult = {
    ok: true,
    lessonId: resolvedLessonId,
    packageLessonId,
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
    created: shell.created,
    message,
  };
  console.log("import result", result);
  return result;
}
