import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { AdminLessonsList } from "@/components/admin/admin-lessons-list";
import { getLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin lessons — Buunduu Surtsgaay",
};

export default async function AdminLessonsPage() {
  const lessons = await getLessonsByCourseId("hsk5");

  return (
    <AdminAuthGate>
      <AdminLessonsList lessons={lessons} />
    </AdminAuthGate>
  );
}
