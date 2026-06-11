import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK6 — Бөөндөө Сурцгаая",
  description: "HSK6 хичээлийн жагсаалт, ахиц.",
};

export default async function Hsk6CoursePage() {
  const [course, lessons] = await Promise.all([
    getCourseContentById("hsk6"),
    getPublicLessonsByCourseId("hsk6"),
  ]);

  return (
    <CourseDetailAppView
      courseId="hsk6"
      title={course?.title ?? "HSK 6"}
      subtitle={course?.subtitle ?? ""}
      lessons={lessons}
    />
  );
}
