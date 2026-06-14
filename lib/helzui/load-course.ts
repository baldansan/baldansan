import courseData from "@/src/data/helzui-suuri.json";
import type { HelzuiCourse, HelzuiModule } from "@/types/helzui-course";

export const helzuiCourse = courseData as HelzuiCourse;

export function getHelzuiCourse(): HelzuiCourse {
  return helzuiCourse;
}

export function getHelzuiModule(moduleId: string): HelzuiModule | null {
  return helzuiCourse.modules.find((module) => module.id === moduleId) ?? null;
}

export const HELZUI_COURSE_ID = "helzui-suuri";
export const HELZUI_REVIEW_BASE = "/review/grammar/structure";
export const HELZUI_COURSES_BASE = "/courses/helzui-suuri";

export function helzuiModuleHref(
  moduleId: string,
  base = HELZUI_COURSES_BASE
): string {
  return `${base}/${moduleId}`;
}
