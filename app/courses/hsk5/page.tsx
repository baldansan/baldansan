import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK5 — Бөөндөө Сурцгаая",
  description: "HSK5 хичээлийн жагсаалт, ахиц.",
};

export default async function Hsk5CoursePage() {
  const [course, lessons] = await Promise.all([
    getCourseContentById("hsk5"),
    getPublicLessonsByCourseId("hsk5"),
  ]);

  return (
    <CourseDetailAppView
      courseId="hsk5"
      title={course?.title ?? "HSK 5"}
      subtitle={course?.subtitle ?? ""}
      lessons={lessons}
    />
  );
}
