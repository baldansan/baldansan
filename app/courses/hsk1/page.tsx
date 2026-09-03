import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK1 — Бөөндөө Сурцгаая",
  description: "HSK1 хичээлийн жагсаалт, ахиц.",
};

export default async function Hsk1CoursePage() {
  const [course, lessons] = await Promise.all([
    getCourseContentById("hsk1"),
    getPublicLessonsByCourseId("hsk1"),
  ]);

  return (
    <CourseDetailAppView
      courseId="hsk1"
      title={course?.title ?? "HSK 1"}
      subtitle={course?.subtitle ?? ""}
      lessons={lessons}
    />
  );
}
