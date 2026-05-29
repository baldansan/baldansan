import { AdminLessonsList } from "@/components/admin/admin-lessons-list";
import { getAllAdminLessonsWithQa } from "@/lib/admin/lesson-fetch";
import { getAdminLessonsPageSummary } from "@/lib/supabase/admin-analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lesson Management — Admin",
};

export default async function AdminLessonsPage() {
  const [reports, pageSummary] = await Promise.all([
    getAllAdminLessonsWithQa(),
    getAdminLessonsPageSummary(),
  ]);

  return (
    <AdminLessonsList reports={reports} pageSummary={pageSummary} />
  );
}
