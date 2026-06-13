import courseData from "@/src/data/helzui-suuri.json";
import type { HelzuiCourse, HelzuiModule } from "@/types/helzui-course";

export const helzuiCourse = courseData as HelzuiCourse;

export function getHelzuiCourse(): HelzuiCourse {
  return helzuiCourse;
}

export function getHelzuiModule(moduleId: string): HelzuiModule | null {
  return helzuiCourse.modules.find((module) => module.id === moduleId) ?? null;
}

export function helzuiModuleHref(moduleId: string): string {
  return `/courses/helzui-suuri/${moduleId}`;
}
