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
};

export type LessonPathImages = {
  hero: LessonPathImage | null;
  /** hero-оос бусад, title-тэй зургууд (сурах бичгийн зурагт тайлбар). */
  illustrations: LessonPathImage[];
};

function toPathImage(image: HskMediaImage): LessonPathImage | null {
  const url = image.url?.trim();
  if (!url) return null;
  return {
    id: image.id,
    url,
    title: image.title?.trim() || image.id,
    role: image.role,
    section: image.section,
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
    illustrations: images.filter((img) => img !== hero),
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
