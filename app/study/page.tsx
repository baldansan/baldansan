import { StudyAppView } from "@/components/mobile/study-app-view";
import { getAllPublicLessonSummariesProbe } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дасгалжуулалтын төв — Бөөндөө Сурцгаая",
};

export default async function StudyPage() {
  const allLessons = await getAllPublicLessonSummariesProbe();
  return <StudyAppView allLessons={allLessons} />;
}
