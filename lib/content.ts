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

async function withSupabaseFallback<T>(
  label: string,
  fetcher: () => Promise<T | undefined>,
  fallback: () => T | undefined
): Promise<T | undefined> {
  if (!hasSupabaseConfig) {
    return fallback();
  }

  try {
    const result = await fetcher();
    if (result !== undefined) {
      return result;
    }
  } catch (error) {
    console.warn(`[content] Supabase ${label} failed, using local fallback.`, error);
  }

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
  if (!hasSupabaseConfig) {
    return getLocalLessonsByCourseId(courseId);
  }

  try {
    const lessons = await getSupabaseLessonsByCourseId(courseId);
    if (lessons.length > 0) {
      return lessons;
    }
  } catch (error) {
    console.warn(
      `[content] Supabase getLessonsByCourseId(${courseId}) failed, using local fallback.`,
      error
    );
  }

  return getLocalLessonsByCourseId(courseId);
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
  if (!hasSupabaseConfig) {
    return getLocalAllLessonIds();
  }

  try {
    const ids = await getSupabaseLessonIds();
    if (ids.length > 0) {
      return ids;
    }
  } catch (error) {
    console.warn("[content] Supabase getAllLessonIds failed, using local fallback.", error);
  }

  return getLocalAllLessonIds();
}

/** Sync lesson ids for static generation at build time (local content). */
export function getAllLessonIdsSync(): string[] {
  return getLocalAllLessonIds();
}
