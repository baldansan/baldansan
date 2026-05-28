import { hsk5Course } from "@/content/courses/hsk5";
import { lessonsByCourseId } from "@/content/courses/hsk5/lessons";
import { courses } from "@/data/courses";
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

export function getLessonById(lessonId: string): LessonContent | undefined {
  return allLessons.find((lesson) => lesson.id === lessonId);
}

export function getLessonsByCourseId(courseId: string): LessonContent[] {
  return lessonsByCourseId[courseId] ?? [];
}

export function getCourseContentById(
  courseId: string
): CourseContent | undefined {
  return coursesContentById[courseId];
}

export function getCourseById(courseId: string): Course | undefined {
  return courses.find((course) => course.id === courseId);
}

export function getAllLessonIds(): string[] {
  return allLessons.map((lesson) => lesson.id);
}
