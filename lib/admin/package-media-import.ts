import type {
  LessonZipMediaFile,
  LessonZipValidation,
} from "@/lib/import/lesson-zip-import";
import { normalizeZipPath } from "@/lib/import/zip-path";
import {
  findHskHeroImage,
  normalizeHskPackageImagePath,
  patchSourceNoteHskMediaUploads,
  type HskImageStorageStatus,
} from "@/lib/lesson/hsk-package-media";
import {
  mergeTeachingMediaIntoSourceNote,
  type TeachingImage,
  type TeachingImageRef,
} from "@/lib/lesson/teaching-media";
import { buildVocabPronunciationMapFromRows } from "@/lib/import/korean-lesson-normalize";
import { updateLessonMedia } from "@/lib/supabase/admin-content";
import type { LessonImportPayload } from "@/lib/supabase/admin-import";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { LESSON_MEDIA_BUCKET } from "@/lib/supabase/media-upload";

export type PackageMediaUploadResult = {
  zipPath: string;
  kind: "audio" | "image";
  publicUrl: string | null;
  storagePath: string | null;
  error: string | null;
};

export type PackageMediaImportResult = {
  mediaUploaded: number;
  uploadedImageCount: number;
  mediaFailures: PackageMediaUploadResult[];
  warnings: string[];
  audioUrl?: string;
  thumbnailUrl?: string;
  sourceNote?: string;
  teachingImages: TeachingImage[];
  imageStorageStatus: HskImageStorageStatus;
  heroImageFound: boolean;
  mediaImageCount: number;
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 120);
}

export function getPackageMediaStoragePath(
  courseId: string,
  lessonId: string,
  kind: "audio" | "image",
  fileName: string
): string {
  const safeName = sanitizeFileName(fileName);
  if (kind === "image") {
    return `${lessonId}/${safeName}`;
  }
  return `${courseId}/${lessonId}/audio/${safeName}`;
}

export async function uploadPackageMediaFile(
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

export function resolveMediaUrl(
  uploads: PackageMediaUploadResult[],
  preferredPath: string | undefined,
  kind: "audio" | "image"
): string | undefined {
  if (preferredPath) {
    const candidates = [
      normalizeZipPath(preferredPath),
      normalizeHskPackageImagePath(preferredPath),
    ].filter(Boolean);

    for (const normalized of candidates) {
      const match = uploads.find(
        (item) =>
          item.kind === kind &&
          !item.error &&
          item.publicUrl &&
          normalizeZipPath(item.zipPath).toLowerCase() === normalized.toLowerCase()
      );
      if (match?.publicUrl) return match.publicUrl;
    }
  }

  const fallback = uploads.find(
    (item) => item.kind === kind && !item.error && item.publicUrl
  );
  return fallback?.publicUrl ?? undefined;
}

/** Exact zip-path match only — no fallback to unrelated uploads. */
function resolveUploadUrlByPath(
  uploads: PackageMediaUploadResult[],
  zipPath: string,
  kind: "audio" | "image"
): string | undefined {
  const normalized = normalizeZipPath(zipPath).toLowerCase();
  const match = uploads.find(
    (item) =>
      item.kind === kind &&
      !item.error &&
      item.publicUrl &&
      normalizeZipPath(item.zipPath).toLowerCase() === normalized
  );
  return match?.publicUrl ?? undefined;
}

/**
 * Resolve listening-question audio ZIP paths to uploaded Storage URLs.
 * Runs after Storage upload, before bulk content import.
 */
export function applyQuizAudioUploads(
  payload: LessonImportPayload,
  uploads: PackageMediaUploadResult[],
  warnings: string[]
): LessonImportPayload {
  const hasAudioRefs = payload.quizQuestions.some((item) => item.audioFile);
  if (!hasAudioRefs) return payload;

  const quizQuestions = payload.quizQuestions.map((item) => {
    if (item.audioUrl || !item.audioFile) return item;
    const url = resolveUploadUrlByPath(uploads, item.audioFile, "audio");
    if (!url) {
      warnings.push(
        `Quiz audio "${item.audioFile}" Storage URL олдсонгүй — асуулт audio-гүй импортлогдлоо.`
      );
      return { ...item, audioFile: undefined };
    }
    return { ...item, audioUrl: url, audioFile: undefined };
  });

  return { ...payload, quizQuestions };
}

/**
 * API-route import flow inserts quiz rows BEFORE media upload, so listening
 * question audio_url is patched here after Storage upload (matched by
 * lesson_id + order_index).
 */
export async function applyQuizAudioUrlsAfterUpload(input: {
  lessonId: string;
  quizQuestions: LessonImportPayload["quizQuestions"];
  uploads: PackageMediaUploadResult[];
}): Promise<{ updated: number; warnings: string[] }> {
  const warnings: string[] = [];
  const pending = input.quizQuestions.filter(
    (item) => item.audioFile && !item.audioUrl
  );
  if (pending.length === 0) return { updated: 0, warnings };
  if (!supabase || !hasSupabaseConfig) {
    warnings.push("Supabase тохиргоогүй — quiz audio URL хадгалагдсангүй.");
    return { updated: 0, warnings };
  }

  let updated = 0;
  for (const item of pending) {
    const audioFile = item.audioFile as string;
    const url = resolveUploadUrlByPath(input.uploads, audioFile, "audio");
    if (!url) {
      warnings.push(
        `Quiz audio "${audioFile}" Storage URL олдсонгүй — асуулт audio-гүй үлдлээ.`
      );
      continue;
    }
    const { error } = await supabase
      .from("quiz_questions")
      .update({ audio_url: url })
      .eq("lesson_id", input.lessonId)
      .eq("order_index", item.orderIndex);
    if (error) {
      warnings.push(
        `Quiz audio URL хадгалахад алдаа ("${audioFile}"): ${error.message}`
      );
    } else {
      updated += 1;
    }
  }

  return { updated, warnings };
}

export function resolveTeachingImagesFromUploads(
  refs: TeachingImageRef[] | undefined,
  uploads: PackageMediaUploadResult[]
): TeachingImage[] {
  if (!refs?.length) return [];
  const resolved: TeachingImage[] = [];
  for (const ref of refs) {
    const url = resolveMediaUrl(uploads, ref.file, "image");
    if (!url) continue;
    resolved.push({
      type: ref.type,
      title: ref.title,
      url,
      caption: ref.caption,
      file: ref.file,
    });
  }
  return resolved;
}

function resolveHeroThumbnailUrl(
  teachingImages: TeachingImage[],
  uploads: PackageMediaUploadResult[],
  thumbnailFile: string | undefined,
  packageMedia: unknown
): string | undefined {
  const fromFile = resolveMediaUrl(uploads, thumbnailFile, "image");
  if (fromFile) return fromFile;

  const hero = findHskHeroImage(packageMedia);
  if (hero?.file) {
    const fromHeroFile = resolveMediaUrl(
      uploads,
      normalizeHskPackageImagePath(hero.file),
      "image"
    );
    if (fromHeroFile) return fromHeroFile;
    const fromHeroId = resolveMediaUrl(uploads, hero.id, "image");
    if (fromHeroId) return fromHeroId;
  }

  const heroImage =
    teachingImages.find(
      (img) =>
        img.type?.toLowerCase() === "lesson1-hero" ||
        img.file?.toLowerCase().includes("hero") ||
        img.type?.toLowerCase().includes("hero") ||
        img.type?.toLowerCase() === "teacher-intro"
    ) ?? teachingImages[0];

  if (heroImage?.url) return heroImage.url;
  if (heroImage?.file) {
    const fromTeachingFile = resolveMediaUrl(uploads, heroImage.file, "image");
    if (fromTeachingFile) return fromTeachingFile;
  }

  // Last resort: an uploaded image named cover/hero/thumbnail — or the only image.
  const imageUploads = uploads.filter(
    (item) => item.kind === "image" && !item.error && item.publicUrl
  );
  const byFileName = (pattern: RegExp) =>
    imageUploads.find((item) =>
      pattern.test(item.zipPath.split("/").pop() ?? "")
    );
  const coverUpload =
    byFileName(/^cover\./i) ??
    byFileName(/^hero\./i) ??
    byFileName(/^thumb(nail)?\./i) ??
    (imageUploads.length === 1 ? imageUploads[0] : undefined);
  return coverUpload?.publicUrl ?? undefined;
}

function buildVocabAudioMapFromUploads(
  vocabulary: Array<{ id?: string; chinese: string; audioFile?: string }>,
  uploads: PackageMediaUploadResult[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of vocabulary) {
    if (!row.audioFile) continue;
    const url = resolveMediaUrl(uploads, row.audioFile, "audio");
    if (!url) continue;
    if (row.id) map[row.id] = url;
    map[row.chinese] = url;
  }
  return map;
}

function buildVocabPronunciationMapFromValidation(
  vocabulary: Array<{
    id?: string;
    chinese: string;
    mongolianPronunciation?: string;
    pronunciationMn?: string;
    pronunciationHintMn?: string;
  }>
): Record<string, string> {
  return buildVocabPronunciationMapFromRows(
    vocabulary.map((row) => ({
      id: row.id,
      chinese: row.chinese,
      mongolianPronunciation: row.mongolianPronunciation,
      pronunciationMn: row.pronunciationMn,
      pronunciationHintMn: row.pronunciationHintMn,
    }))
  );
}

function countPackageMediaImages(validation: LessonZipValidation): number {
  const fromZip = validation.mediaFiles.filter((file) => file.kind === "image").length;
  if (fromZip > 0) return fromZip;
  return validation.preview?.imageFileCount ?? 0;
}

function resolveImageStorageStatus(input: {
  mediaImageCount: number;
  uploadedImageCount: number;
  heroImageFound: boolean;
  thumbnailUrl?: string;
}): HskImageStorageStatus {
  if (input.uploadedImageCount > 0 && input.thumbnailUrl) {
    return "uploaded";
  }
  if (input.uploadedImageCount > 0) {
    return "uploaded";
  }
  if (input.mediaImageCount > 0) {
    return "package-reference-only";
  }
  return input.heroImageFound ? "package-reference-only" : "missing";
}

function readPackageMediaFromSourceNote(sourceNote?: string | null): unknown {
  if (!sourceNote?.trim().startsWith("{")) return null;
  try {
    const parsed = JSON.parse(sourceNote) as Record<string, unknown>;
    const hskStudy = parsed.hskStudyContent;
    if (typeof hskStudy === "object" && hskStudy !== null && "media" in hskStudy) {
      return (hskStudy as Record<string, unknown>).media;
    }
    return parsed.media ?? null;
  } catch {
    return null;
  }
}

/** Upload ZIP media files to Supabase Storage and persist URLs on the lesson row. */
export async function finalizePackageMediaImport(input: {
  validation: LessonZipValidation;
  courseId: string;
  lessonId: string;
}): Promise<PackageMediaImportResult> {
  const { validation, courseId, lessonId } = input;
  const warnings: string[] = [];
  const mediaFailures: PackageMediaUploadResult[] = [];
  let mediaUploaded = 0;
  let uploadedImageCount = 0;

  const packageMedia =
    readPackageMediaFromSourceNote(validation.lesson?.sourceNote) ??
    readPackageMediaFromSourceNote(
      validation.lesson?.sourceNote ??
        (validation.manifest as { source?: string } | null)?.source
    );
  const heroImageFound = Boolean(findHskHeroImage(packageMedia));
  const mediaImageCount = countPackageMediaImages(validation);

  if (!validation.mediaFiles.length) {
    return {
      mediaUploaded: 0,
      uploadedImageCount: 0,
      mediaFailures,
      warnings,
      teachingImages: [],
      imageStorageStatus: resolveImageStorageStatus({
        mediaImageCount,
        uploadedImageCount: 0,
        heroImageFound,
      }),
      heroImageFound,
      mediaImageCount,
    };
  }

  for (const media of validation.mediaFiles) {
    const result = await uploadPackageMediaFile(courseId, lessonId, media);
    mediaFailures.push(result);
    if (result.publicUrl && !result.error) {
      mediaUploaded += 1;
      if (result.kind === "image") uploadedImageCount += 1;
    } else if (result.error) {
      warnings.push(`Media "${media.zipPath}" upload failed: ${result.error}`);
    }
  }

  const audioUrl = resolveMediaUrl(
    mediaFailures,
    validation.lesson?.audioFile,
    "audio"
  );
  const teachingImages = resolveTeachingImagesFromUploads(
    validation.lesson?.teachingImages,
    mediaFailures
  );
  const thumbnailUrl = resolveHeroThumbnailUrl(
    teachingImages,
    mediaFailures,
    validation.lesson?.thumbnailFile,
    packageMedia
  );
  const vocabAudioMap = buildVocabAudioMapFromUploads(
    validation.vocabulary,
    mediaFailures
  );
  const vocabPronunciationMap = buildVocabPronunciationMapFromValidation(
    validation.vocabulary
  );

  const baseSourceNote =
    validation.lesson?.sourceNote ||
    validation.manifest?.source ||
    "ZIP package import";

  let sourceNote = mergeTeachingMediaIntoSourceNote(
    baseSourceNote,
    teachingImages,
    vocabAudioMap,
    vocabPronunciationMap
  );
  sourceNote = patchSourceNoteHskMediaUploads(sourceNote, mediaFailures);

  let mediaStatus: "missing" | "pending" | "ready" = "missing";
  if (audioUrl || thumbnailUrl || teachingImages.length > 0) {
    mediaStatus = "pending";
  }
  if (validation.lesson?.mediaStatus === "ready" && audioUrl) {
    mediaStatus = "ready";
  } else if (
    validation.lesson?.mediaStatus === "pending" ||
    thumbnailUrl ||
    uploadedImageCount > 0
  ) {
    mediaStatus = "pending";
  }

  const imageStorageStatus = resolveImageStorageStatus({
    mediaImageCount,
    uploadedImageCount,
    heroImageFound,
    thumbnailUrl,
  });

  if (
    audioUrl ||
    thumbnailUrl ||
    sourceNote ||
    teachingImages.length > 0 ||
    Object.keys(vocabAudioMap).length > 0 ||
    uploadedImageCount > 0
  ) {
    const mediaUpdate = await updateLessonMedia(lessonId, {
      audioUrl: audioUrl ?? "",
      thumbnailUrl: thumbnailUrl ?? "",
      imageUrl: thumbnailUrl ?? "",
      sourceNote,
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
      "ZIP-д media файл байсан ч Storage upload амжилтгүй — текст контент импортлогдсон."
    );
  }

  return {
    mediaUploaded,
    uploadedImageCount,
    mediaFailures,
    warnings,
    audioUrl,
    thumbnailUrl,
    sourceNote,
    teachingImages,
    imageStorageStatus,
    heroImageFound,
    mediaImageCount,
  };
}
