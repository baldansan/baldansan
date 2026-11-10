import { AdminLessonsList } from "@/components/admin/admin-lessons-list";
import { getAllAdminLessonsWithQa } from "@/lib/admin/lesson-fetch";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Хичээлүүд — Удирдлагын хэсэг",
};

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const reports = await getAllAdminLessonsWithQa();

  return <AdminLessonsList reports={reports} initialQuery={q ?? ""} />;
}
