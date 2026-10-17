import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonSummariesByCourseId } from "@/lib/content";
import { courseSeriesMeta } from "@/lib/lesson/course-series-label";

/**
 * 发展汉语 (Developing Chinese) цувралын курсын хуудас — HSK курсуудтай ижил
 * дэлгэц, гэхдээ courses хүснэгтэд мөр байхгүй байсан ч нэр/тайлбарыг
 * course-series-label-аас авч 404 гаргахгүй.
 */
export async function FazhanCoursePage({ courseId }: { courseId: string }) {
  const meta = courseSeriesMeta(courseId);
  const [course, lessons] = await Promise.all([
    getCourseContentById(courseId),
    getPublicLessonSummariesByCourseId(courseId),
  ]);

  return (
    <CourseDetailAppView
      courseId={courseId}
      title={course?.title ?? meta?.title ?? courseId}
      subtitle={course?.subtitle ?? meta?.subtitle ?? ""}
      lessons={lessons}
    />
  );
}

export function fazhanCourseMetadata(courseId: string) {
  const meta = courseSeriesMeta(courseId);
  return {
    title: `${meta?.title ?? courseId} — Бөөндөө Сурцгаая`,
    description: meta?.subtitle ?? "",
  };
}
