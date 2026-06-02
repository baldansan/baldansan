import { canonicalLessonId, normalizeLessonRouteId } from "@/lib/lesson-id";
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

/** Public course list without vocabulary/quiz payload — for study hub and navigation. */
export async function getPublicLessonSummariesByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  const lessons = await fetchSupabaseListOnly(
    `getPublicLessonSummariesByCourseId(${courseId})`,
    () => getSupabasePublicLessonsByCourseId(courseId)
  );

  return lessons.map(toLessonListSummary);
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

export async function getCourseContentById(
  courseId: string
): Promise<CourseContent | undefined> {
  return fetchSupabaseOnly(`getCourseContentById(${courseId})`, () =>
    getSupabaseCourseContentById(courseId)
  );
}

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
