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
  return `${courseId}/${lessonId}/${kind}/${sanitizeFileName(fileName)}`;
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

  if (!heroImage?.file && !heroImage?.url) return undefined;
  if (heroImage.url) return heroImage.url;
  return resolveMediaUrl(uploads, heroImage.file, "image");
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
