import { StudyAppView } from "@/components/mobile/study-app-view";
import { getAllPublicLessonsProbe } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дасгалжуулалтын төв — Бөөндөө Сурцгаая",
};

export default async function StudyPage() {
  const allLessons = await getAllPublicLessonsProbe();
  return <StudyAppView allLessons={allLessons} />;
}
