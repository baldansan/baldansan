import { LanguageFilteredProgressView } from "@/components/mobile/language-filtered-progress-view";
import { getAllPublicLessonSummariesProbe } from "@/lib/content";

export const revalidate = 120;

export const metadata = {
  title: "Миний явц — Бөөндөө Сурцгаая",
  description: "Миний ахиц, quiz болон vocabulary статистик.",
};

/** Progress hub — filtered by selected language track. */
export default async function ProgressPage() {
  const allLessons = await getAllPublicLessonSummariesProbe();
  return <LanguageFilteredProgressView allLessons={allLessons} />;
}
