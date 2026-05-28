import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getHsk5LessonsWithQa, summarizeLessonQa } from "@/lib/admin/lesson-qa";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Buunduu Surtsgaay",
};

export default async function AdminPage() {
  const reports = await getHsk5LessonsWithQa();
  const summary = summarizeLessonQa(reports);

  return <AdminDashboard summary={summary} />;
}
