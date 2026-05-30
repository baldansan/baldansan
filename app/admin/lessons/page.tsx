import { AdminLessonsList } from "@/components/admin/admin-lessons-list";
import { getAllAdminLessonsWithQa } from "@/lib/admin/lesson-fetch";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lessons — Admin",
};

export default async function AdminLessonsPage() {
  const reports = await getAllAdminLessonsWithQa();

  return <AdminLessonsList reports={reports} />;
}
