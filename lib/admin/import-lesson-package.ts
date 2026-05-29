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

function courseTitleFromId(courseId: string): string {
  if (courseId === "korean-level-1") {
    return "Солонгос хэл";
  }
  if (courseId.startsWith("korean")) {
    return "Солонгос хэл";
  }
  if (courseId.includes("hsk")) {
    return courseId.toUpperCase();
  }
  return courseId;
}

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

function isMissingColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

async function lessonRowExists(lessonId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) {
    console.warn("[import] lesson existence check failed", { lessonId, error });
    return false;
  }
  return Boolean(data);
}

async function resolveOrderIndex(
  courseId: string,
  preferred?: number
): Promise<number> {
  if (preferred != null && Number.isFinite(preferred) && preferred >= 1) {
    return Math.floor(preferred);
  }
  if (!supabase) return 1;
  const { data } = await supabase
    .from("lessons")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.order_index ?? 0) + 1;
}

async function ensureDraftCourseExists(
  courseId: string
): Promise<{ ok: boolean; error?: string; created?: boolean }> {
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: `Course lookup failed: ${error.message}` };
  }
  if (data) {
    return { ok: true };
  }

  const isKorean = courseId.toLowerCase().startsWith("korean");
  const { error: insertError } = await supabase.from("courses").insert({
    id: courseId,
    title: courseTitleFromId(courseId),
    description: isKorean
      ? "Korean Level 1 — auto-created from ZIP import."
      : `Auto-created from ZIP import (${courseId}).`,
    level: isKorean ? "Korean" : "HSK",
    status: "available",
    order_index: 10,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: true };
    }
    return {
      ok: false,
      error: `Course not found: ${courseId}. ${insertError.message}`,
    };
  }

  return { ok: true, created: true };
}

async function upsertLessonShell(
  validation: LessonZipValidation
): Promise<{ ok: boolean; error?: string; created?: boolean; warnings?: string[] }> {
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const draftLesson = buildDraftLessonShell(validation);
  if (!draftLesson) {
    if (!validation.preview?.courseId && !validation.lesson?.courseId) {
      return { ok: false, error: "courseId missing in manifest.json." };
    }
    if (!validation.preview?.lessonId) {
      return { ok: false, error: "lessonId missing in manifest.json." };
    }
    return { ok: false, error: "ZIP parse data missing. Please validate again." };
  }

  console.log("parsed import package", {
    courseId: draftLesson.courseId,
    lessonId: draftLesson.lessonId,
    language: draftLesson.language,
    targetLanguage: draftLesson.targetLanguage,
    title: draftLesson.title,
    targetTitle: draftLesson.targetTitle,
    vocabularyCount: validation.vocabulary.length,
    quizCount: validation.quizQuestions.length,
    packageVersion: draftLesson.packageVersion,
  });
  console.log("creating draft lesson", draftLesson);

  const shellWarnings: string[] = [];
  const { courseId, lessonId } = draftLesson;

  const courseReady = await ensureDraftCourseExists(courseId);
  if (!courseReady.ok) {
    return { ok: false, error: courseReady.error };
  }
  if (courseReady.created) {
    shellWarnings.push(
      `Course "${courseId}" was auto-created (${courseTitleFromId(courseId)}).`
    );
  }

  const lessonExists = await lessonRowExists(lessonId);
  const orderIndex = lessonExists
    ? draftLesson.orderIndex
    : await resolveOrderIndex(courseId, draftLesson.orderIndex);

  const rowPayload = {
    course_id: courseId,
    title: draftLesson.title,
    chinese_title: draftLesson.targetTitle,
    subtitle: draftLesson.subtitle,
    description: draftLesson.description,
    duration: draftLesson.duration,
    status: "draft" as const,
    order_index: orderIndex,
    source_note: draftLesson.sourceNote,
    media_status: draftLesson.mediaStatus,
    language: draftLesson.language,
    target_language: draftLesson.targetLanguage,
    ui_language: draftLesson.uiLanguage,
    vocabulary_count: 0,
    quiz_count: 0,
  };

  if (!lessonExists) {
    const { error: insertError } = await supabase.from("lessons").insert({
      id: lessonId,
      ...rowPayload,
    });

    if (insertError) {
      const message = insertError.message ?? "Insert failed.";
      if (insertError.code === "23505") {
        // Race: another request created the row — fall through to update.
      } else if (isMissingColumnError(message)) {
        const {
          target_language: _t,
          ui_language: _u,
          language: _l,
          ...basePayload
        } = rowPayload;
        const { error: fallbackError } = await supabase.from("lessons").insert({
          id: lessonId,
          ...basePayload,
        });
        if (fallbackError && fallbackError.code !== "23505") {
          return {
            ok: false,
            error: `Draft lesson create failed: ${fallbackError.message}`,
          };
        }
      } else {
        return {
          ok: false,
          error: `Draft lesson create failed: ${message}`,
        };
      }
    }
  } else {
    const { error: updateError } = await supabase
      .from("lessons")
      .update(rowPayload)
      .eq("id", lessonId);

    if (updateError) {
      const message = updateError.message ?? "Update failed.";
      if (isMissingColumnError(message)) {
        const {
          target_language: _t,
          ui_language: _u,
          language: _l,
          ...basePayload
        } = rowPayload;
        const { error: fallbackError } = await supabase
          .from("lessons")
          .update(basePayload)
          .eq("id", lessonId);
        if (fallbackError) {
          return {
            ok: false,
            error: `Failed to update draft lesson: ${fallbackError.message}`,
          };
        }
      } else {
        return {
          ok: false,
          error: `Failed to update draft lesson: ${message}`,
        };
      }
    }
  }

  const persisted = await lessonRowExists(lessonId);
  if (!persisted) {
    return {
      ok: false,
      error: `Draft lesson was not saved to the database (${lessonId}). Check admin permissions and RLS policies.`,
    };
  }

  return { ok: true, created: !lessonExists, warnings: shellWarnings };
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
      errors: [shell.error ?? "Draft lesson upsert failed."],
    };
  }
  if (shell.warnings?.length) {
    warnings.push(...shell.warnings);
  }
  if (shell.created) {
    warnings.push(`Created new draft lesson "${lessonId}".`);
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
      errors: [imported.error ?? "Bulk content import failed."],
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

  const result: LessonPackageImportResult = {
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
  console.log("import result", result);
  return result;
}
