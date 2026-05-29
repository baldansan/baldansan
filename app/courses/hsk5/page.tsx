import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK5 — Бөөндөө Сурцгаая",
  description: "HSK5 Short Drama Chinese — хичээлийн жагсаалт, ахиц.",
};

export default async function Hsk5CoursePage() {
  const course = await getCourseContentById("hsk5");
  const lessons = await getPublicLessonsByCourseId("hsk5");

  if (!course) {
    return null;
  }

  return (
    <CourseDetailAppView
      courseId="hsk5"
      title={course.title}
      subtitle={course.subtitle}
      lessons={lessons}
    />
  );
}
