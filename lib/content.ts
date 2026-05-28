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

function contentDebugId(label: string): string | undefined {
  const match = label.match(/\(([^)]+)\)/);
  return match?.[1];
}

async function withSupabaseFallback<T>(
  label: string,
  fetcher: () => Promise<T | undefined>,
  fallback: () => T | undefined
): Promise<T | undefined> {
  const debugId = contentDebugId(label);

  if (!hasSupabaseConfig) {
    console.log("[supabase-debug] content fallback (no Supabase config)", {
      label,
      id: debugId,
      hasSupabaseConfig: false,
      source: "local",
    });
    return fallback();
  }

  try {
    const result = await fetcher();
    if (result !== undefined) {
      const lessonResult = result as LessonContent;
      console.log("[supabase-debug] content using Supabase data", {
        label,
        id: debugId,
        hasSupabaseConfig: true,
        source: "supabase",
        ...(label.startsWith("getLessonById(")
          ? { subtitle: lessonResult.subtitle ?? "(empty)" }
          : {}),
      });
      return result;
    }

    console.log("[supabase-debug] content fallback (Supabase returned no data)", {
      label,
      id: debugId,
      hasSupabaseConfig: true,
      source: "local",
    });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : String(error);
    console.log("[supabase-debug] content fallback (Supabase query failed)", {
      label,
      id: debugId,
      hasSupabaseConfig: true,
      source: "local",
      error: message,
    });
    console.warn(`[content] Supabase ${label} failed, using local fallback.`, {
      message,
    });
  }

  const localResult = fallback();
  if (label.startsWith("getLessonById(")) {
    const localLesson = localResult as LessonContent | undefined;
    console.log("[supabase-debug] content local fallback payload", {
      label,
      id: debugId,
      subtitle: localLesson?.subtitle ?? "(empty)",
    });
  }
  return localResult;
}

export async function getLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  console.log("[supabase-debug] getLessonById called", {
    lessonId,
    hasSupabaseConfig,
  });

  const lesson = await withSupabaseFallback(
    `getLessonById(${lessonId})`,
    () => getSupabaseLessonById(lessonId),
    () => getLocalLessonById(lessonId)
  );

  console.log("[supabase-debug] getLessonById resolved", {
    lessonId,
    hasSupabaseConfig,
    subtitle: lesson?.subtitle ?? "(empty)",
    found: Boolean(lesson),
  });

  return lesson;
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
