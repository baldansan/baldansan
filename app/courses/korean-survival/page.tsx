import { notFound } from "next/navigation";
import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Korean Survival — Бөөндөө Сурцгаая",
  description: "Солонгос хэл — ажил амьдралд хэрэгтэй хичээлүүд.",
};

export default async function KoreanSurvivalCoursePage() {
  const [course, lessons] = await Promise.all([
    getCourseContentById("korean-survival"),
    getPublicLessonsByCourseId("korean-survival"),
  ]);

  if (!course && lessons.length === 0) {
    notFound();
  }

  return (
    <CourseDetailAppView
      courseId="korean-survival"
      title={course?.title ?? "Ажилд явах Korean"}
      subtitle={
        course?.subtitle ??
        "Ажил амьдралд хэрэгтэй Солонгос хэллэг, үг, өгүүлбэр"
      }
      lessons={lessons}
    />
  );
}
