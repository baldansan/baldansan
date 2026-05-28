import { hsk5Course } from "@/content/courses/hsk5";
import { lessonsByCourseId } from "@/content/courses/hsk5/lessons";
import { courses } from "@/data/courses";
import {
  getSupabaseCourseById,
  getSupabaseCourseContentById,
  getSupabaseLessonById,
  getSupabaseLessonIds,
  getSupabaseLessonsByCourseId,
} from "@/lib/supabase/content";
import { hasSupabaseConfig } from "@/lib/supabase/client";
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

export function coursePath(courseId: string) {
  return `/courses/${courseId}`;
}

export function getLocalLessonById(lessonId: string): LessonContent | undefined {
  return allLessons.find((lesson) => lesson.id === lessonId);
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
  return withSupabaseFallback(
    `getLessonById(${lessonId})`,
    () => getSupabaseLessonById(lessonId),
    () => getLocalLessonById(lessonId)
  );
}

export async function getLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  return withSupabaseListFallback(
    `getLessonsByCourseId(${courseId})`,
    () => getSupabaseLessonsByCourseId(courseId),
    () => getLocalLessonsByCourseId(courseId)
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
