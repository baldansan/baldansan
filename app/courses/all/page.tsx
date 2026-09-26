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

/**
 * One course's lessons + metadata. Loading these per course in a `for … await`
 * loop meant nine courses × two queries ran end to end, which is what made this
 * page take ~11s; every caller below fans them out instead.
 */
async function loadCourseSource(courseId: string) {
  const [lessons, course] = await Promise.all([
    getPublicLessonsByCourseId(courseId),
    getCourseContentById(courseId),
  ]);
  return { courseId, lessons, course };
}

type CourseSource = Awaited<ReturnType<typeof loadCourseSource>>;

function appendKoreanCourses(
  catalog: Course[],
  lessonCounts: Record<string, number>,
  sources: CourseSource[]
): Course[] {
  const next = [...catalog];

  for (const { courseId, lessons, course } of sources) {
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
const KOREAN_CATALOG_IDS = [
  "korean-level-1",
  "korean-1",
  "korean-survival",
] as const;

function appendHskCourse(
  catalog: Course[],
  lessonCounts: Record<string, number>,
  { courseId, lessons, course }: CourseSource
): Course[] {
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
  const [hskSources, koreanSources] = await Promise.all([
    Promise.all(HSK_CATALOG_LEVELS.map(loadCourseSource)),
    Promise.all(KOREAN_CATALOG_IDS.map(loadCourseSource)),
  ]);

  for (const source of hskSources) {
    catalog = appendHskCourse(catalog, lessonCounts, source);
  }
  const catalogCourses = appendKoreanCourses(
    catalog,
    lessonCounts,
    koreanSources
  );
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
