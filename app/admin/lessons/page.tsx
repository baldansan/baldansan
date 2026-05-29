import { AdminLessonsList } from "@/components/admin/admin-lessons-list";
import { getHsk5LessonsWithQa } from "@/lib/admin/lesson-fetch";
import { getAdminLessonsPageSummary } from "@/lib/supabase/admin-analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lesson Management — Admin",
};

export default async function AdminLessonsPage() {
  const [reports, pageSummary] = await Promise.all([
    getHsk5LessonsWithQa(),
    getAdminLessonsPageSummary(),
  ]);

  return (
    <AdminLessonsList reports={reports} pageSummary={pageSummary} />
  );
}
