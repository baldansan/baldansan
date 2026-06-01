import { findHskPackageMediaBySection, normalizeHskPackageImagePath } from "@/lib/lesson/hsk-package-media";
import { parseLessonSourceNote } from "@/lib/lesson/source-note-json";
import type { TeachingImage } from "@/lib/lesson/teaching-media";
import type { LessonContent } from "@/types/lesson-content";

export type HskMediaImage = {
  id: string;
  file: string;
  section?: string;
  title?: string;
  url?: string;
};

export type HskMediaBundle = {
  lessonId?: string;
  images: HskMediaImage[];
  videos: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeImage(raw: unknown): HskMediaImage | null {
  if (!isRecord(raw)) return null;
  const id = trim(raw.id) || trim(raw.imageId);
  const file = trim(raw.file) || trim(raw.path) || trim(raw.src);
  if (!id && !file) return null;
  return {
    id: id || file.replace(/^.*\//, "").replace(/\.[^.]+$/, ""),
    file,
    section: trim(raw.section) || undefined,
    title: trim(raw.title) || undefined,
    url: trim(raw.url) || undefined,
  };
}

export function parseHskMediaBundle(value: unknown): HskMediaBundle | null {
  if (!value) return null;

  if (isRecord(value)) {
    const imagesRaw = Array.isArray(value.images) ? value.images : [];
    const images = imagesRaw
      .map(normalizeImage)
      .filter((item): item is HskMediaImage => item !== null);
    const videos = Array.isArray(value.videos) ? value.videos : [];
    if (images.length === 0 && videos.length === 0) return null;
    return {
      lessonId: trim(value.lessonId) || undefined,
      images,
      videos,
    };
  }

  return null;
}

export function parseHskMediaFromLesson(
  lesson: Pick<LessonContent, "sourceNote" | "teachingImages">
): HskMediaBundle | null {
  const parsed = parseLessonSourceNote(lesson.sourceNote);
  let bundle: HskMediaBundle | null = null;

  if (parsed.format === "json") {
    const hskStudy = parsed.data.hskStudyContent;
    if (isRecord(hskStudy)) {
      bundle = parseHskMediaBundle(hskStudy.media);
    }
    if (!bundle && isRecord(parsed.data.media)) {
      bundle = parseHskMediaBundle(parsed.data.media);
    }
  }

  const teachingImages = (lesson.teachingImages ?? []) as TeachingImage[];
  if (teachingImages.length > 0) {
    const merged: HskMediaImage[] = [...(bundle?.images ?? [])];
    const seen = new Set(merged.map((img) => img.id));

    for (const img of teachingImages) {
      const id = trim(img.type) || trim(img.title);
      const url = trim(img.url);
      if (!id && !url) continue;
      const key = id || url;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        id: id || key,
        file: trim(img.file) || url,
        section: trim(img.type) || undefined,
        title: trim(img.title) || trim(img.caption) || undefined,
        url,
      });
    }

    return {
      lessonId: bundle?.lessonId,
      images: merged,
      videos: bundle?.videos ?? [],
    };
  }

  return bundle;
}

export function findHskMediaBySection(
  media: HskMediaBundle | null | undefined,
  section: string
): HskMediaImage | null {
  return findHskPackageMediaBySection(media, section);
}

/** Resolve a display URL — storage URL, absolute path, or null for placeholder. */
export function resolveHskMediaUrl(
  image: HskMediaImage | null | undefined,
  teachingImages?: TeachingImage[] | null
): string | null {
  if (!image) return null;
  const direct = image.url?.trim();
  if (direct && (direct.startsWith("http") || direct.startsWith("/"))) {
    return direct;
  }
  const file = image.file?.trim();
  if (file && (file.startsWith("http") || file.startsWith("/"))) {
    return file;
  }

  if (teachingImages?.length) {
    const normalizedFile = file ? normalizeHskPackageImagePath(file) : "";
    const needle = (image.section || image.id || normalizedFile).toLowerCase();
    const match =
      teachingImages.find(
        (item) =>
          item.type?.toLowerCase() === needle ||
          (item.file &&
            normalizeHskPackageImagePath(item.file).toLowerCase() ===
              normalizedFile.toLowerCase()) ||
          item.file?.toLowerCase() === file.toLowerCase() ||
          item.title?.toLowerCase() === needle
      ) ??
      teachingImages.find((item) =>
        item.file?.toLowerCase().includes(needle.replace(/^images\//, ""))
      );
    const url = match?.url?.trim();
    if (url && (url.startsWith("http") || url.startsWith("/"))) {
      return url;
    }
  }

  return null;
}
