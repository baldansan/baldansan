import {
  parseHskMediaBundle,
  type HskMediaImage,
} from "@/lib/lesson/hsk-media";
import { normalizeZipPath } from "@/lib/import/zip-path";
import { parseLessonSourceNote } from "@/lib/lesson/source-note-json";
import type { TeachingImage } from "@/lib/lesson/teaching-media";
import type { LessonContent } from "@/types/lesson-content";

export type HskImageStorageStatus =
  | "uploaded"
  | "package-reference-only"
  | "missing";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

/** Normalize package-relative image paths to images/... form. */
export function normalizeHskPackageImagePath(file: string): string {
  const cleaned = file.trim().replace(/^\.?\//, "");
  if (!cleaned) return "";
  if (
    cleaned.startsWith("images/") ||
    cleaned.startsWith("http") ||
    cleaned.startsWith("/")
  ) {
    return cleaned;
  }
  return `images/${cleaned}`;
}

export function findHskHeroImage(media: unknown): HskMediaImage | null {
  const bundle = parseHskMediaBundle(media);
  if (!bundle?.images.length) return null;

  const byPriority = (predicate: (img: HskMediaImage) => boolean) =>
    bundle.images.find(predicate) ?? null;

  return (
    byPriority((img) => img.id === "lesson1-hero") ??
    byPriority((img) => img.section?.toLowerCase() === "teacher-intro") ??
    byPriority((img) => img.id.toLowerCase().includes("hero")) ??
    byPriority((img) => img.section?.toLowerCase().includes("hero") ?? false) ??
    byPriority((img) => img.file.toLowerCase().includes("hero")) ??
    bundle.images[0]
  );
}

export function resolveHskHeroThumbnailFile(media: unknown): string | null {
  const hero = findHskHeroImage(media);
  if (!hero?.file) return null;
  return normalizeHskPackageImagePath(hero.file);
}

export function countHskPackageImagesFromSourceNote(
  sourceNote?: string | null
): number {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json") return 0;

  const hskStudy = parsed.data.hskStudyContent;
  if (isRecord(hskStudy)) {
    const count = parseHskMediaBundle(hskStudy.media)?.images.length ?? 0;
    if (count > 0) return count;
  }

  const topMedia = parsed.data.media;
  if (isRecord(topMedia)) {
    return parseHskMediaBundle(topMedia)?.images.length ?? 0;
  }

  return 0;
}

export function hasHskPackageImages(
  lesson: Pick<LessonContent, "sourceNote" | "teachingImages">
): boolean {
  if ((lesson.teachingImages?.length ?? 0) > 0) return true;
  return countHskPackageImagesFromSourceNote(lesson.sourceNote) > 0;
}

export function hasHskPackageImagesNeedingStorage(
  lesson: Pick<LessonContent, "sourceNote" | "teachingImages" | "thumbnailUrl">
): boolean {
  if (lesson.thumbnailUrl?.trim()) return false;

  const parsed = parseLessonSourceNote(lesson.sourceNote);
  if (parsed.format !== "json") return false;

  const hskStudy = parsed.data.hskStudyContent;
  const mediaRaw =
    isRecord(hskStudy) && isRecord(hskStudy.media)
      ? hskStudy.media
      : isRecord(parsed.data.media)
        ? parsed.data.media
        : null;

  const bundle = parseHskMediaBundle(mediaRaw);
  if (!bundle?.images.length) return false;

  return bundle.images.some((image) => !image.url?.trim());
}

export type HskMediaUploadPatch = {
  zipPath: string;
  kind: "audio" | "image";
  publicUrl: string | null;
  storagePath: string | null;
  error: string | null;
};

function findUploadForPackageImage(
  uploads: HskMediaUploadPatch[],
  file: string,
  id: string
): HskMediaUploadPatch | undefined {
  const normalizedFile = normalizeHskPackageImagePath(file);
  return (
    uploads.find(
      (item) =>
        item.kind === "image" &&
        !item.error &&
        item.publicUrl &&
        normalizeZipPath(item.zipPath).toLowerCase() === normalizedFile.toLowerCase()
    ) ??
    uploads.find(
      (item) =>
        item.kind === "image" &&
        !item.error &&
        item.publicUrl &&
        (id
          ? item.zipPath.toLowerCase().includes(id.toLowerCase())
          : false)
    )
  );
}

export function patchHskStudyMediaFromUploads(
  data: Record<string, unknown>,
  uploads: HskMediaUploadPatch[]
): void {
  const hskStudy = data.hskStudyContent;
  if (!isRecord(hskStudy)) return;

  const mediaRaw = hskStudy.media;
  if (!isRecord(mediaRaw) || !Array.isArray(mediaRaw.images)) return;

  const patched = mediaRaw.images.map((raw) => {
    if (!isRecord(raw)) return raw;
    const file = normalizeHskPackageImagePath(
      trim(raw.file) || trim(raw.path) || trim(raw.src)
    );
    const id = trim(raw.id);
    const upload = findUploadForPackageImage(uploads, file, id);

    if (upload?.publicUrl) {
      return {
        ...raw,
        url: upload.publicUrl,
        file: file || raw.file,
        storagePath: upload.storagePath ?? undefined,
        storageStatus: "uploaded",
      };
    }

    if (file || id) {
      return {
        ...raw,
        storageStatus: "package-reference-only",
      };
    }

    return raw;
  });

  hskStudy.media = { ...mediaRaw, images: patched };
  data.hskStudyContent = hskStudy;
}

export function patchSourceNoteHskMediaUploads(
  sourceNote: string,
  uploads: HskMediaUploadPatch[]
): string {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json") return sourceNote;

  const data = { ...parsed.data };
  patchHskStudyMediaFromUploads(data, uploads);
  return JSON.stringify(data);
}

export function summarizeHskImageImportStatus(input: {
  mediaImageCount: number;
  zipImageFileCount: number;
  heroImageFound: boolean;
  uploadedThumbnail?: boolean;
  uploadedImageCount?: number;
}): {
  heroImageFound: boolean;
  imageStorageStatus: HskImageStorageStatus;
} {
  if (
    input.uploadedThumbnail ||
    (input.uploadedImageCount ?? 0) > 0
  ) {
    return { heroImageFound: input.heroImageFound, imageStorageStatus: "uploaded" };
  }

  if (input.mediaImageCount > 0 || input.zipImageFileCount > 0) {
    return {
      heroImageFound: input.heroImageFound,
      imageStorageStatus: "package-reference-only",
    };
  }

  return { heroImageFound: false, imageStorageStatus: "missing" };
}

const SECTION_ALIASES: Record<string, readonly string[]> = {
  teacher: ["teacher", "teacher-intro", "intro", "lessonintro"],
  hero: ["hero", "key-phrase", "keyphrase", "teacher-intro"],
  pinyin: ["pinyin", "pinyin-pronunciation", "pinyinpronunciation"],
  tone: ["tone", "tones"],
  dialogue: ["dialogue", "dialogues"],
  vocabulary: ["vocabulary", "vocab", "flashcard"],
  practice: ["practice", "practice-menu"],
};

function matchesSectionNeedle(image: HskMediaImage, needle: string): boolean {
  const n = needle.toLowerCase();
  const id = image.id.toLowerCase();
  const section = image.section?.toLowerCase() ?? "";
  const file = image.file.toLowerCase();

  if (section === n || id === n || id.includes(n) || section.includes(n)) {
    return true;
  }

  const aliases = SECTION_ALIASES[n] ?? [n];
  return aliases.some(
    (alias) =>
      section === alias ||
      section.includes(alias) ||
      id.includes(alias) ||
      file.includes(alias.replace(/-/g, ""))
  );
}

/** Find package media image by Gold Standard media.json id. */
export function findHskMediaById(
  media: { images: HskMediaImage[] } | null | undefined,
  imageId: string
): HskMediaImage | null {
  const needle = imageId.trim().toLowerCase();
  if (!media?.images.length || !needle) return null;

  return (
    media.images.find((img) => img.id.toLowerCase() === needle) ??
    media.images.find((img) => {
      const fileBase = img.file
        .replace(/^.*\//, "")
        .replace(/\.[^.]+$/, "")
        .toLowerCase();
      return fileBase === needle || img.file.toLowerCase().includes(needle);
    }) ??
    null
  );
}

export const HSK_PACKAGE_IMAGE_PLACEHOLDER_MN =
  "Зураг package-д байна, storage-д хараахан холбогдоогүй";

export type HskGuidedStepMediaRef = {
  imageId?: string;
  mediaSection?: string;
  id?: string;
};

/** Find package media image by guided-player section id. */
export function findHskPackageMediaBySection(
  media: { images: HskMediaImage[] } | null | undefined,
  section: string
): HskMediaImage | null {
  if (!media?.images.length) return null;
  const needle = section.toLowerCase();
  return (
    media.images.find((img) => matchesSectionNeedle(img, needle)) ?? null
  );
}

export function buildTeachingImageRefsFromMedia(media: unknown): Array<{
  type: string;
  title: string;
  file: string;
}> {
  const bundle = parseHskMediaBundle(media);
  if (!bundle?.images.length) return [];

  return bundle.images.map((image) => {
    const normalizedFile = normalizeHskPackageImagePath(image.file);
    return {
      type: image.id || image.section || "image",
      title: image.title || image.id || image.section || "Teaching image",
      file: normalizedFile || `images/${image.id || "image"}.png`,
    };
  });
}

export function applyTeachingUrlsToHskStudyMedia(
  data: Record<string, unknown>,
  teachingImages: TeachingImage[]
): void {
  if (!teachingImages.length) return;

  const hskStudy = data.hskStudyContent;
  if (!isRecord(hskStudy)) return;

  const mediaRaw = hskStudy.media;
  if (!isRecord(mediaRaw) || !Array.isArray(mediaRaw.images)) return;

  const patched = mediaRaw.images.map((raw) => {
    if (!isRecord(raw)) return raw;
    const file = normalizeHskPackageImagePath(
      trim(raw.file) || trim(raw.path) || trim(raw.src)
    );
    const id = trim(raw.id);
    const section = trim(raw.section).toLowerCase();

    const match =
      (id
        ? teachingImages.find((item) => item.type?.toLowerCase() === id.toLowerCase())
        : null) ??
      teachingImages.find(
        (item) =>
          normalizeHskPackageImagePath(item.file ?? "") === file ||
          item.file?.toLowerCase() === file.toLowerCase()
      ) ??
      teachingImages.find(
        (item) =>
          item.type?.toLowerCase() === section ||
          item.type?.toLowerCase() === id.toLowerCase() ||
          item.title?.toLowerCase() === id.toLowerCase()
      );

    if (match?.url) {
      return {
        ...raw,
        url: match.url,
        file: file || raw.file,
        storageStatus: "uploaded",
      };
    }
    return {
      ...raw,
      storageStatus: file || id ? "package-reference-only" : undefined,
    };
  });

  hskStudy.media = { ...mediaRaw, images: patched };
  data.hskStudyContent = hskStudy;
}
