import { hsk5Course } from "@/content/courses/hsk5";
import { canonicalLessonId, normalizeLessonRouteId } from "@/lib/lesson-id";
import { lessonsByCourseId } from "@/content/courses/hsk5/lessons";
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
import { LEARNER_COURSE_PROBE_IDS } from "@/lib/language-track";
import type { Course } from "@/types/course";
import type { CourseContent, LessonContent } from "@/types/lesson-content";

const allLessons = Object.values(lessonsByCourseId).flat();

const coursesContentById: Record<string, CourseContent> = {
  hsk5: hsk5Course,
};

/** Last resolved source for a content fetch (server-only; not shown in UI). */
export type ContentSource = "supabase" | "local";

let lastContentSource: ContentSource = "local";

const FALLBACK_WARNING =
  "Supabase content fetch failed; using local fallback.";

function warnSupabaseFallback(context: string, error?: unknown) {
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

export function getLocalLessonById(lessonId: string): LessonContent | undefined {
  const normalized = normalizeLessonRouteId(lessonId);
  const lesson = allLessons.find(
    (lesson) => canonicalLessonId(lesson.id) === normalized
  );
  return lesson ? enrichLessonContentMeta(lesson) : undefined;
}

export function getLocalLessonsByCourseId(courseId: string): LessonContent[] {
  return lessonsByCourseId[courseId] ?? [];
}

export function getLocalCourseContentById(
  courseId: string
): CourseContent | undefined {
  return coursesContentById[courseId];
}

export function getLocalCourseById(courseId: string): Course | undefined {
  return courses.find((course) => course.id === courseId);
}

export function getLocalAllLessonIds(): string[] {
  return allLessons.map((lesson) => lesson.id);
}

/**
 * Supabase-first: returns fetcher result when defined; otherwise local fallback.
 */
async function withSupabaseFallback<T>(
  context: string,
  fetcher: () => Promise<T | undefined>,
  fallback: () => T | undefined
): Promise<T | undefined> {
  if (!hasSupabaseConfig) {
    lastContentSource = "local";
    return fallback();
  }

  try {
    const result = await fetcher();
    if (result !== undefined) {
      lastContentSource = "supabase";
      return result;
    }
  } catch (error) {
    warnSupabaseFallback(context, error);
  }

  lastContentSource = "local";
  return fallback();
}

/**
 * Supabase-first: returns non-empty Supabase list; otherwise local fallback.
 */
async function withSupabaseListFallback<T>(
  context: string,
  fetcher: () => Promise<T[]>,
  fallback: () => T[]
): Promise<T[]> {
  if (!hasSupabaseConfig) {
    lastContentSource = "local";
    return fallback();
  }

  try {
    const result = await fetcher();
    if (result.length > 0) {
      lastContentSource = "supabase";
      return result;
    }
  } catch (error) {
    warnSupabaseFallback(context, error);
  }

  lastContentSource = "local";
  return fallback();
}

export async function getLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  const normalizedId = normalizeLessonRouteId(lessonId);
  const lesson = await withSupabaseFallback(
    `getLessonById(${normalizedId})`,
    () => getSupabaseLessonById(normalizedId),
    () => getLocalLessonById(normalizedId)
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

/** Public lesson fetch; undefined if draft or archived. */
export async function getPublicLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  const lesson = await getLessonById(lessonId);
  if (!lesson || !isPublicLesson(lesson)) {
    return undefined;
  }
  return lesson;
}

/** Public course list: only lessons with publish status `available`. */
export async function getPublicLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  const lessons = await withSupabaseListFallback(
    `getPublicLessonsByCourseId(${courseId})`,
    () => getSupabasePublicLessonsByCourseId(courseId),
    () => getLocalLessonsByCourseId(courseId).filter(isPublicLesson)
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

/** Admin / internal: all lessons including draft and archived. */
export async function getLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  const lessons = await withSupabaseListFallback(
    `getLessonsByCourseId(${courseId})`,
    () => getSupabaseLessonsByCourseId(courseId),
    () => getLocalLessonsByCourseId(courseId)
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

export async function getCourseContentById(
  courseId: string
): Promise<CourseContent | undefined> {
  return withSupabaseFallback(
    `getCourseContentById(${courseId})`,
    () => getSupabaseCourseContentById(courseId),
    () => getLocalCourseContentById(courseId)
  );
}

export async function getCourseById(
  courseId: string
): Promise<Course | undefined> {
  return withSupabaseFallback(
    `getCourseById(${courseId})`,
    () => getSupabaseCourseById(courseId),
    () => getLocalCourseById(courseId)
  );
}

export async function getAllLessonIds(): Promise<string[]> {
  return withSupabaseListFallback(
    "getAllLessonIds",
    () => getSupabaseLessonIds(),
    () => getLocalAllLessonIds()
  );
}

/** Sync lesson ids for static generation at build time (local content). */
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
