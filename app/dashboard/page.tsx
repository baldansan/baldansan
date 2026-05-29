import { LearnerDashboard } from "@/components/learner-dashboard";
import { getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Бөөндөө Сурцгаая",
  description: "Миний ахиц, continue learning, quiz болон vocabulary статистик.",
};

export default async function DashboardPage() {
  const lessons = await getPublicLessonsByCourseId("hsk5");
  const lessonIds = lessons.map((l) => l.id);

  return <LearnerDashboard hsk5LessonIds={lessonIds} />;
}
