import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK4 — Бөөндөө Сурцгаая",
  description: "HSK4 хичээлийн жагсаалт, ахиц.",
};

export default async function Hsk4CoursePage() {
  const [course, lessons] = await Promise.all([
    getCourseContentById("hsk4"),
    getPublicLessonsByCourseId("hsk4"),
  ]);

  return (
    <CourseDetailAppView
      courseId="hsk4"
      title={course?.title ?? "HSK 4 上"}
      subtitle={course?.subtitle ?? ""}
      lessons={lessons}
    />
  );
}
