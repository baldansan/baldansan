import { StudyAppView } from "@/components/mobile/study-app-view";
import { getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дасгалжуулалтын төв — Бөөндөө Сурцгаая",
};

export default async function StudyPage() {
  const lessons = await getPublicLessonsByCourseId("hsk5");
  return <StudyAppView lessons={lessons} />;
}
