import { CoursesListAppView } from "@/components/mobile/courses-list-app-view";
import { isKoreanCourse } from "@/lib/course-display";
import { courses } from "@/data/courses";
import { getHelzuiCourse } from "@/lib/helzui/load-course";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";
import type { Course } from "@/types/course";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Хичээлүүд — Бөөндөө Сурцгаая",
  description: "Сурах чиглэлээ сонго — HSK4, HSK5, Korean.",
};

async function appendKoreanCourses(
  catalog: Course[],
  lessonCounts: Record<string, number>
): Promise<Course[]> {
  const next = [...catalog];
  const koreanIds = ["korean-level-1", "korean-1", "korean-survival"] as const;

  for (const courseId of koreanIds) {
    const lessons = await getPublicLessonsByCourseId(courseId);
    const course = await getCourseContentById(courseId);
    lessonCounts[courseId] = lessons.length;

    if ((course || lessons.length > 0) && !next.some((c) => c.id === courseId)) {
      next.push({
        id: courseId,
        title:
          course?.title ??
          (courseId === "korean-survival"
            ? "Ажилд явах Korean"
            : "Солонгост ажиллахад хэрэгтэй Солонгос хэл"),
        description:
          course?.subtitle ??
          "Солонгос үсэг, үндсэн үг, ажил амьдралд хэрэгтэй хэллэг.",
        level: isKoreanCourse(courseId) ? "Korean · 한글" : "Beginner",
        lessons: lessons.length,
        vocabulary: lessons.reduce((sum, l) => sum + l.vocabularyCount, 0),
        status: lessons.length > 0 ? "available" : "coming_soon",
        href: lessons.length > 0 ? `/courses/${courseId}` : null,
        coverUrl: course?.coverUrl ?? null,
      });
    }
  }

  return next;
}

const HSK_CATALOG_LEVELS = ["hsk6", "hsk5", "hsk4", "hsk3", "hsk2", "hsk1"] as const;

async function appendHskCourse(
  catalog: Course[],
  lessonCounts: Record<string, number>,
  courseId: (typeof HSK_CATALOG_LEVELS)[number]
): Promise<Course[]> {
  const [lessons, course] = await Promise.all([
    getPublicLessonsByCourseId(courseId),
    getCourseContentById(courseId),
  ]);
  lessonCounts[courseId] = lessons.length;

  if (!course && lessons.length === 0) {
    return catalog;
  }

  const next = catalog.filter((entry) => entry.id !== courseId);
  const levelNumber = courseId.replace("hsk", "");
  const defaultTitle = `HSK ${levelNumber}`;
  next.unshift({
    id: courseId,
    title: course?.title ?? defaultTitle,
    level: courseId.toUpperCase(),
    description: course?.subtitle ?? "",
    lessons: lessons.length,
    vocabulary: lessons.reduce((sum, lesson) => sum + lesson.vocabularyCount, 0),
    status: lessons.length > 0 ? "available" : "coming_soon",
    href: course || lessons.length > 0 ? `/courses/${courseId}` : null,
    coverUrl: course?.coverUrl ?? null,
  });
  return next;
}

export default async function CoursesPage() {
  const lessonCounts: Record<string, number> = {};
  const helzui = getHelzuiCourse();
  let catalog = courses.map((course) =>
    course.id === "helzui-suuri"
      ? { ...course, lessons: helzui.modules.length }
      : course
  );
  for (const courseId of HSK_CATALOG_LEVELS) {
    catalog = await appendHskCourse(catalog, lessonCounts, courseId);
  }
  const catalogCourses = await appendKoreanCourses(catalog, lessonCounts);
  lessonCounts["helzui-suuri"] = helzui.modules.length;

  const courseCards = catalogCourses.map((course) => ({
    ...course,
    lessonCount: lessonCounts[course.id] ?? course.lessons,
    href:
      lessonCounts[course.id] != null && lessonCounts[course.id] > 0
        ? course.href ?? `/courses/${course.id}`
        : course.href,
  }));

  return <CoursesListAppView courses={courseCards} />;
}
