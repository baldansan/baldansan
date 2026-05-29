import { notFound } from "next/navigation";
import { CourseDetailAppView } from "@/components/mobile/course-detail-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Korean Book 1 — Бөөндөө Сурцгаая",
  description: "Солонгос хэл 1 — хичээлийн жагсаалт.",
};

export default async function KoreanCoursePage() {
  const [course, lessons] = await Promise.all([
    getCourseContentById("korean-1"),
    getPublicLessonsByCourseId("korean-1"),
  ]);

  if (!course && lessons.length === 0) {
    notFound();
  }

  return (
    <CourseDetailAppView
      courseId="korean-1"
      title={
        course?.title ?? "Солонгост ажиллахад хэрэгтэй Солонгос хэл"
      }
      subtitle={
        course?.subtitle ??
        "Солонгос үсэг, үндсэн үг, ажил амьдралд хэрэгтэй хэллэг"
      }
      lessons={lessons}
    />
  );
}
