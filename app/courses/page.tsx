import { CoursesListAppView } from "@/components/mobile/courses-list-app-view";
import { isKoreanCourse } from "@/lib/course-display";
import { courses } from "@/data/courses";
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
      });
    }
  }

  return next;
}

async function appendHskCourse(
  catalog: Course[],
  lessonCounts: Record<string, number>,
  courseId: "hsk4" | "hsk5"
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
  const defaultTitle = courseId === "hsk4" ? "HSK 4 上" : "HSK 5";
  const defaultLevel = courseId === "hsk4" ? "HSK4" : "HSK5";
  next.unshift({
    id: courseId,
    title: course?.title ?? defaultTitle,
    level: defaultLevel,
    description: course?.subtitle ?? "",
    lessons: lessons.length,
    vocabulary: lessons.reduce((sum, lesson) => sum + lesson.vocabularyCount, 0),
    status: lessons.length > 0 ? "available" : "coming_soon",
    href: course || lessons.length > 0 ? `/courses/${courseId}` : null,
  });
  return next;
}

async function appendHsk5Course(
  catalog: Course[],
  lessonCounts: Record<string, number>
): Promise<Course[]> {
  return appendHskCourse(catalog, lessonCounts, "hsk5");
}

async function appendHsk4Course(
  catalog: Course[],
  lessonCounts: Record<string, number>
): Promise<Course[]> {
  return appendHskCourse(catalog, lessonCounts, "hsk4");
}

export default async function CoursesPage() {
  const lessonCounts: Record<string, number> = {};
  const withHsk5 = await appendHsk5Course([...courses], lessonCounts);
  const withHsk4 = await appendHsk4Course(withHsk5, lessonCounts);
  const catalogCourses = await appendKoreanCourses(withHsk4, lessonCounts);

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
