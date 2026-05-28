import { AdminLessonsList } from "@/components/admin/admin-lessons-list";
import { getHsk5LessonsWithQa } from "@/lib/admin/lesson-fetch";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lesson Management — Admin",
};

export default async function AdminLessonsPage() {
  const reports = await getHsk5LessonsWithQa();

  return <AdminLessonsList reports={reports} />;
}
