import { lesson1 } from "./lesson-1";
import { lesson2 } from "./lesson-2";
import { lesson3 } from "./lesson-3";
import type { LessonContent } from "@/types/lesson-content";

export const hsk5Lessons: LessonContent[] = [lesson1, lesson2, lesson3];

export const lessonsByCourseId: Record<string, LessonContent[]> = {
  hsk5: hsk5Lessons,
};
