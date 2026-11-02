import { parseHskMediaBundle, type HskMediaImage } from "@/lib/lesson/hsk-media";
import { parseLessonSourceNote } from "@/lib/lesson/source-note-json";
import type { LessonContent } from "@/types/lesson-content";

/** Хичээлийн замын (lesson path) дэлгэцэд зориулсан зураг — URL-тэй л зургууд. */
export type LessonPathImage = {
  id: string;
  url: string;
  title: string;
  role?: string;
  section?: string;
  /** media.json file (`images/foo.webp`) — асуултын image-тэй тааруулахад. */
  file?: string;
};

export type LessonPathImages = {
  hero: LessonPathImage | null;
  /** hero-оос бусад, title-тэй зургууд (сурах бичгийн зурагт тайлбар). */
  illustrations: LessonPathImage[];
  /** section === "exercise" | "exercises" — дасгалын асуултад харуулах зургууд. */
  exerciseImages: LessonPathImage[];
};

function isExerciseImage(img: LessonPathImage): boolean {
  const section = img.section?.trim().toLowerCase();
  return section === "exercise" || section === "exercises";
}

/** `images/foo.webp` → `foo.webp` (basename-ээр тааруулах). */
function basename(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? path;
  return (clean.split("/").pop() ?? clean).trim().toLowerCase();
}

/** Асуултын `image` (images/<file>.webp) → media-д upload хийсэн URL. Олдохгүй бол null. */
export function resolveExerciseImageUrl(
  path: string | undefined,
  images: LessonPathImage[] | undefined
): string | null {
  if (!path || !images?.length) return null;
  const key = basename(path);
  if (!key) return null;
  const hit = images.find((img) => {
    const fromFile = img.file ? basename(img.file) : "";
    const fromUrl = basename(img.url);
    return (
      fromFile === key ||
      fromUrl === key ||
      img.id.toLowerCase() === key ||
      img.id.toLowerCase() === key.replace(/\.[a-z0-9]+$/, "")
    );
  });
  return hit?.url ?? null;
}

function toPathImage(image: HskMediaImage): LessonPathImage | null {
  const url = image.url?.trim();
  if (!url) return null;
  return {
    id: image.id,
    url,
    title: image.title?.trim() || image.id,
    role: image.role,
    section: image.section,
    file: image.file?.trim() || undefined,
  };
}

function readMedia(lesson: Pick<LessonContent, "hskStudy" | "sourceNote">): unknown {
  if (lesson.hskStudy && (lesson.hskStudy as { media?: unknown }).media) {
    return (lesson.hskStudy as { media?: unknown }).media;
  }
  const parsed = parseLessonSourceNote(lesson.sourceNote);
  if (parsed.format !== "json") return null;
  const study = parsed.data.hskStudyContent;
  if (study && typeof study === "object" && !Array.isArray(study)) {
    return (study as Record<string, unknown>).media ?? null;
  }
  return null;
}

export function resolveLessonPathImages(
  lesson: Pick<LessonContent, "hskStudy" | "sourceNote">
): LessonPathImages {
  const bundle = parseHskMediaBundle(readMedia(lesson));
  const images = (bundle?.images ?? [])
    .map(toPathImage)
    .filter((img): img is LessonPathImage => img !== null);
  const hero =
    images.find((img) => img.role?.toLowerCase() === "hero") ??
    images.find((img) => img.section?.toLowerCase() === "teacher-intro") ??
    null;
  return {
    hero,
    illustrations: images.filter((img) => img !== hero && !isExerciseImage(img)),
    exerciseImages: images.filter((img) => img !== hero && isExerciseImage(img)),
  };
}

/** Үгийн картад зориулж: зургийн title дотор тухайн үг (ханз) орсон бол тэр зураг. */
export function findImageForWord(
  images: LessonPathImage[],
  zh: string
): LessonPathImage | null {
  const word = zh.replace(/[（(].*$/, "").trim();
  if (!word) return null;
  return (
    images.find((img) => img.title === word) ??
    images.find((img) => img.title.includes(word)) ??
    null
  );
}
