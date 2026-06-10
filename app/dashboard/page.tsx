import { LanguageFilteredDashboard } from "@/components/mobile/language-filtered-dashboard";
import { getAllPublicLessonSummariesProbe } from "@/lib/content";

export const revalidate = 120;

export const metadata = {
  title: "Миний самбар — Бөөндөө Сурцгаая",
  description: "Миний ахиц, continue learning, quiz болон vocabulary статистик.",
};

export default async function DashboardPage() {
  const allLessons = await getAllPublicLessonSummariesProbe();
  return <LanguageFilteredDashboard allLessons={allLessons} />;
}
