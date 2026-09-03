import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK2 — Бөөндөө Сурцгаая",
  description: "HSK2 хичээлийн жагсаалт, ахиц.",
};

export default async function Hsk2CoursePage() {
  const [course, lessons] = await Promise.all([
    getCourseContentById("hsk2"),
    getPublicLessonsByCourseId("hsk2"),
  ]);

  return (
    <CourseDetailAppView
      courseId="hsk2"
      title={course?.title ?? "HSK 2"}
      subtitle={course?.subtitle ?? ""}
      lessons={lessons}
    />
  );
}
