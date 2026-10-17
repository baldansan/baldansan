import { normalizeLessonRouteId } from "@/lib/lesson-id";
import { unstable_cache } from "next/cache";
import {
  CATALOG_REVALIDATE_SECONDS,
  CATALOG_TAG,
  lessonCacheTag,
} from "@/lib/cache/catalog-cache";
import { courses } from "@/data/courses";
import {
  getSupabaseCourseById,
  getSupabaseCourseContentById,
  getSupabaseLessonById,
  getSupabaseLessonIds,
  getSupabaseLessonsByCourseId,
  getSupabasePublicLessonsByCourseId,
} from "@/lib/supabase/content";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { isPublicLesson } from "@/lib/lesson-publish";
import { enrichLessonContentMeta } from "@/lib/lesson-content-type";
import { toLessonListSummary } from "@/lib/lesson/lesson-summary";
import { LEARNER_COURSE_PROBE_IDS } from "@/lib/language-track";
import type { Course } from "@/types/course";
import type { CourseContent, LessonContent } from "@/types/lesson-content";

/** Last resolved source for a content fetch (server-only; not shown in UI). */
export type ContentSource = "supabase" | "local";

let lastContentSource: ContentSource = "local";

const FALLBACK_WARNING =
  "Supabase content fetch failed; no local lesson fallback.";

function warnSupabaseFetchFailure(context: string, error?: unknown) {
  console.warn(`[content] ${FALLBACK_WARNING}`, { context, error });
}

export function getContentSource(): ContentSource {
  return lastContentSource;
}

/** Whether Supabase env is configured (intended primary source when true). */
export function getConfiguredContentMode(): ContentSource {
  return hasSupabaseConfig ? "supabase" : "local";
}

export function lessonPath(lessonId: string) {
  return `/lessons/${lessonId}`;
}

export function lessonWatchPath(lessonId: string) {
  return `/lessons/${lessonId}/watch`;
}

export function lessonVocabularyPath(lessonId: string) {
  return `/lessons/${lessonId}/vocabulary`;
}

export function lessonQuizPath(lessonId: string) {
  return `/lessons/${lessonId}/quiz`;
}

export function lessonWorkbookPath(lessonId: string) {
  return `/lessons/${lessonId}/workbook`;
}

export function lessonTrainingPath(
  lessonId: string,
  options?: { preview?: boolean }
) {
  const base = `/study/lesson-training/${lessonId}`;
  if (options?.preview) return `${base}?preview=admin`;
  return base;
}

export function coursePath(courseId: string) {
  return `/courses/${courseId}`;
}

/** Legacy hook for admin/dev without Supabase — local demo lessons removed. */
export function getLocalLessonById(_lessonId: string): LessonContent | undefined {
  return undefined;
}

export function getLocalLessonsByCourseId(_courseId: string): LessonContent[] {
  return [];
}

export function getLocalCourseContentById(
  _courseId: string
): CourseContent | undefined {
  return undefined;
}

export function getLocalCourseById(courseId: string): Course | undefined {
  return courses.find((course) => course.id === courseId);
}

export function getLocalAllLessonIds(): string[] {
  return [];
}

async function fetchSupabaseOnly<T>(
  context: string,
  fetcher: () => Promise<T | undefined>
): Promise<T | undefined> {
  if (!hasSupabaseConfig) {
    lastContentSource = "local";
    return undefined;
  }

  try {
    const result = await fetcher();
    lastContentSource = "supabase";
    return result;
  } catch (error) {
    warnSupabaseFetchFailure(context, error);
    return undefined;
  }
}

async function fetchSupabaseListOnly<T>(
  context: string,
  fetcher: () => Promise<T[]>
): Promise<T[]> {
  if (!hasSupabaseConfig) {
    lastContentSource = "local";
    return [];
  }

  try {
    const result = await fetcher();
    lastContentSource = "supabase";
    return result;
  } catch (error) {
    warnSupabaseFetchFailure(context, error);
    return [];
  }
}

export async function getLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  const normalizedId = normalizeLessonRouteId(lessonId);
  const lesson = await fetchSupabaseOnly(
    `getLessonById(${normalizedId})`,
    () => getSupabaseLessonById(normalizedId)
  );

  if (!lesson) {
    return undefined;
  }

  if (!hasSupabaseConfig) {
    return lesson;
  }

  const { enrichVocabularyWithDbIds } = await import(
    "@/lib/supabase/content"
  );
  const vocabulary = await enrichVocabularyWithDbIds(
    lesson.id,
    lesson.vocabulary
  );

  return enrichLessonContentMeta({ ...lesson, vocabulary });
}

/**
 * Кэшлэгдэх функц дотроос throw хийх "мэдэгдэж буй" шалтгаанууд. unstable_cache throw-ыг
 * кэшлэдэггүй тул draft/archived/олдохгүй/түр алдаа 120с-ийн турш хадгалагдахгүй.
 */
class LessonNotPublicError extends Error {
  constructor(lessonId: string) {
    super(`Lesson not public: ${lessonId}`);
    this.name = "LessonNotPublicError";
  }
}

/**
 * Мөр олдсон ч хүүхэд мөрүүд (үг/асуулт) metadata тооноос дутуу ирсэн — түр алдаа байж
 * болзошгүй тул кэшлэхгүй; татсан агуулгыг нь алдаатай хамт буцааж, тухайн render-д л ашиглана.
 */
class LessonIncompleteError extends Error {
  constructor(
    lessonId: string,
    readonly lesson: LessonContent
  ) {
    super(`Lesson children incomplete: ${lessonId}`);
    this.name = "LessonIncompleteError";
  }
}

async function fetchPublicLessonForCache(
  normalizedId: string
): Promise<LessonContent> {
  // getSupabaseLessonById: Supabase алдаа → throw (кэшлэгдэхгүй); олдохгүй → undefined.
  const lesson = await getSupabaseLessonById(normalizedId);
  if (!lesson || !isPublicLesson(lesson)) {
    throw new LessonNotPublicError(normalizedId);
  }

  // fetchChildRowsForLesson алдааг дотроо [] болгодог тул metadata тоо > 0 байхад
  // хоосон ирвэл түр алдаа гэж үзэж кэшлэхгүй.
  const { enrichVocabularyWithDbIds } = await import("@/lib/supabase/content");
  const vocabulary = await enrichVocabularyWithDbIds(lesson.id, lesson.vocabulary);
  const enriched = enrichLessonContentMeta({ ...lesson, vocabulary });

  if (
    (lesson.vocabularyCount > 0 && lesson.vocabulary.length === 0) ||
    (lesson.quizCount > 0 && lesson.quizQuestions.length === 0)
  ) {
    throw new LessonIncompleteError(normalizedId, enriched);
  }

  return enriched;
}

/**
 * Public lesson fetch; undefined if draft or archived.
 *
 * Нийтийн (status=available) хичээлийн бүтэн агуулга → Data Cache 120с
 * (tags: catalog:lessons, lesson:<id>). Өмнө нь зочин бүрт 4 Supabase query
 * (мөр + 3 хүүхэд хүснэгт) кэшгүй явдаг байсан. Admin/preview зам `getLessonById`
 * (кэшгүй) хэвээр. Draft/олдохгүй/алдаа → тухайн render-д л undefined (кэшлэгдэхгүй).
 */
export async function getPublicLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  const normalizedId = normalizeLessonRouteId(lessonId);
  if (!hasSupabaseConfig) {
    lastContentSource = "local";
    return undefined;
  }

  // Tag нь id-аас хамаарах тул unstable_cache-ийг дуудлага бүрт үүсгэнэ (Next docs-ийн жишээтэй ижил).
  const cached = unstable_cache(fetchPublicLessonForCache, ["public-lesson"], {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_TAG.lessons, lessonCacheTag(normalizedId)],
  });

  try {
    const lesson = await cached(normalizedId);
    lastContentSource = "supabase";
    return lesson;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (error instanceof LessonNotPublicError || name === "LessonNotPublicError") {
      return undefined;
    }
    if (error instanceof LessonIncompleteError) {
      lastContentSource = "supabase";
      return error.lesson;
    }
    if (name === "LessonIncompleteError") {
      // Алдааны объект дамжиж ирээгүй — хуучин кэшгүй зам.
      const lesson = await getLessonById(normalizedId);
      return lesson && isPublicLesson(lesson) ? lesson : undefined;
    }
    warnSupabaseFetchFailure(`getPublicLessonById(${normalizedId})`, error);
    return undefined;
  }
}

/** Public course list: only lessons with publish status `available`. */
export async function getPublicLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  const lessons = await fetchSupabaseListOnly(
    `getPublicLessonsByCourseId(${courseId})`,
    () => getSupabasePublicLessonsByCourseId(courseId)
  );

  if (!hasSupabaseConfig) {
    return lessons;
  }

  const { enrichVocabularyWithDbIds } = await import(
    "@/lib/supabase/content"
  );

  return Promise.all(
    lessons.map(async (lesson) => ({
      ...lesson,
      vocabulary: await enrichVocabularyWithDbIds(
        lesson.id,
        lesson.vocabulary
      ),
    }))
  );
}

/**
 * Кэшлэгдэх дотоод хувилбар: Supabase алдаа гарвал [] БУЦААХГҮЙ, throw хийнэ —
 * unstable_cache нь throw-ыг кэшлэдэггүй тул түр зуурын алдаа (timeout, egress
 * хязгаар) 120с-ийн турш "хичээлгүй курс" болж хадгалагдахгүй.
 */
const getPublicLessonSummariesByCourseIdCached = unstable_cache(
  async (courseId: string): Promise<LessonContent[]> => {
    if (!hasSupabaseConfig) return [];
    const lessons = await getSupabasePublicLessonsByCourseId(courseId);
    lastContentSource = "supabase";
    return lessons.map(toLessonListSummary);
  },
  ["public-lesson-summaries"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG.lessons] }
);

/**
 * Public course list without vocabulary/quiz payload — for study hub and navigation.
 * Нийтийн дата (status=available, anon клиент) → Data Cache 120с (tag: catalog:lessons).
 * Алдаа гарвал тухайн render-д л [] (кэшлэгдэхгүй).
 */
export async function getPublicLessonSummariesByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  try {
    return await getPublicLessonSummariesByCourseIdCached(courseId);
  } catch (error) {
    warnSupabaseFetchFailure(`getPublicLessonSummariesByCourseId(${courseId})`, error);
    return [];
  }
}

/** Admin / internal: all lessons including draft and archived. */
export async function getLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  const lessons = await fetchSupabaseListOnly(
    `getLessonsByCourseId(${courseId})`,
    () => getSupabaseLessonsByCourseId(courseId)
  );

  if (!hasSupabaseConfig) {
    return lessons;
  }

  const { enrichVocabularyWithDbIds } = await import(
    "@/lib/supabase/content"
  );

  return Promise.all(
    lessons.map(async (lesson) => ({
      ...lesson,
      vocabulary: await enrichVocabularyWithDbIds(
        lesson.id,
        lesson.vocabulary
      ),
    }))
  );
}

async function getCourseContentByIdUncached(
  courseId: string
): Promise<CourseContent | undefined> {
  return fetchSupabaseOnly(`getCourseContentById(${courseId})`, () =>
    getSupabaseCourseContentById(courseId)
  );
}

/** Курсын мэдээлэл (нийтийн) → Data Cache 120с (tag: catalog:courses). */
export const getCourseContentById = unstable_cache(
  getCourseContentByIdUncached,
  ["course-content"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG.courses] }
);

export async function getCourseById(
  courseId: string
): Promise<Course | undefined> {
  if (hasSupabaseConfig) {
    return fetchSupabaseOnly(`getCourseById(${courseId})`, () =>
      getSupabaseCourseById(courseId)
    );
  }
  return getLocalCourseById(courseId);
}

export async function getAllLessonIds(): Promise<string[]> {
  return fetchSupabaseListOnly("getAllLessonIds", () => getSupabaseLessonIds());
}

/** Sync lesson ids for static generation at build time. */
export function getAllLessonIdsSync(): string[] {
  return getLocalAllLessonIds();
}

/** Next lesson in course order, or null when this is the last lesson. */
export function findNextLessonId(
  lessonId: string,
  lessons: LessonContent[]
): string | null {
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0 || index >= lessons.length - 1) {
    return null;
  }
  return lessons[index + 1].id;
}

/** Load public lessons across known course ids (deduped by lesson id). */
export async function getAllPublicLessonsProbe(): Promise<LessonContent[]> {
  const batches = await Promise.all(
    LEARNER_COURSE_PROBE_IDS.map((courseId) =>
      getPublicLessonsByCourseId(courseId)
    )
  );

  const seen = new Set<string>();
  const merged: LessonContent[] = [];

  for (const batch of batches) {
    for (const lesson of batch) {
      if (seen.has(lesson.id)) continue;
      seen.add(lesson.id);
      merged.push(lesson);
    }
  }

  return merged;
}

/** Lightweight public lesson list for study/review hubs (no vocab/quiz fetch). */
export async function getAllPublicLessonSummariesProbe(): Promise<LessonContent[]> {
  const batches = await Promise.all(
    LEARNER_COURSE_PROBE_IDS.map((courseId) =>
      getPublicLessonSummariesByCourseId(courseId)
    )
  );

  const seen = new Set<string>();
  const merged: LessonContent[] = [];

  for (const batch of batches) {
    for (const lesson of batch) {
      if (seen.has(lesson.id)) continue;
      seen.add(lesson.id);
      merged.push(lesson);
    }
  }

  return merged;
}
