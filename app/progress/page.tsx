import { LearnerDashboard } from "@/components/learner-dashboard";
import { getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Миний явц — Бөөндөө Сурцгаая",
  description: "Миний ахиц, quiz болон vocabulary статистик.",
};

/** Progress hub — same data as /dashboard, profile menu alias. */
export default async function ProgressPage() {
  const lessons = await getPublicLessonsByCourseId("hsk5");
  const lessonIds = lessons.map((l) => l.id);

  return <LearnerDashboard hsk5LessonIds={lessonIds} />;
}
