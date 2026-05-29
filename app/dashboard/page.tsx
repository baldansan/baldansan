import { LanguageFilteredDashboard } from "@/components/mobile/language-filtered-dashboard";
import { getAllPublicLessonsProbe } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Миний самбар — Бөөндөө Сурцгаая",
  description: "Миний ахиц, continue learning, quiz болон vocabulary статистик.",
};

export default async function DashboardPage() {
  const allLessons = await getAllPublicLessonsProbe();
  return <LanguageFilteredDashboard allLessons={allLessons} />;
}
