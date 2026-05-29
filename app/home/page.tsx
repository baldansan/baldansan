import { HomeAppView } from "@/components/mobile/home-app-view";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Нүүр — Бөөндөө Сурцгаая",
  description: "Хятад хэл сурах апп — үргэлжлүүлэх, курс, хичээлийн зам.",
};

export default async function HomeAppPage() {
  const lessons = await getPublicLessonsByCourseId("hsk5");
  const course = await getCourseContentById("hsk5");

  return (
    <HomeAppView
      lessons={lessons}
      courseTitle={course?.title ?? "HSK5 Short Drama Chinese"}
      courseSubtitle={course?.subtitle ?? "Богино бичлэг, үгийн сан, quiz"}
    />
  );
}
