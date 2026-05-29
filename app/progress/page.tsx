import { LanguageFilteredProgressView } from "@/components/mobile/language-filtered-progress-view";
import { getAllPublicLessonsProbe } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Миний явц — Бөөндөө Сурцгаая",
  description: "Миний ахиц, quiz болон vocabulary статистик.",
};

/** Progress hub — filtered by selected language track. */
export default async function ProgressPage() {
  const allLessons = await getAllPublicLessonsProbe();
  return <LanguageFilteredProgressView allLessons={allLessons} />;
}
