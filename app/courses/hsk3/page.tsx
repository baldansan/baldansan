import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK3 — Бөөндөө Сурцгаая",
  description: "HSK3 хичээлийн жагсаалт, ахиц.",
};

export default async function Hsk3CoursePage() {
  const [course, lessons] = await Promise.all([
    getCourseContentById("hsk3"),
    getPublicLessonsByCourseId("hsk3"),
  ]);

  return (
    <CourseDetailAppView
      courseId="hsk3"
      title={course?.title ?? "HSK 3"}
      subtitle={course?.subtitle ?? ""}
      lessons={lessons}
    />
  );
}
