import { getHelzuiCourse, HELZUI_COURSES_BASE } from "@/lib/helzui/load-course";

/** /home-ийн хэлзүйн картад хэрэгтэй цөөн талбар — сервер дээр тооцоолж client-д дамжуулна. */
export type HelzuiHomeSummary = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  moduleCount: number;
  href: string;
};

export function helzuiHomeSummary(): HelzuiHomeSummary {
  const course = getHelzuiCourse();
  return {
    id: course.courseId,
    title: course.title,
    subtitle: course.subtitle ?? "",
    category: course.category,
    moduleCount: course.modules.length,
    href: HELZUI_COURSES_BASE,
  };
}
