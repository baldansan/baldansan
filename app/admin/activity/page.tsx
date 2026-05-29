import { AdminActivityCenter } from "@/components/admin/admin-activity-center";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin activity — Buunduu Surtsgaay",
};

type Props = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function AdminActivityPage({ searchParams }: Props) {
  const { lessonId } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Activity Log"
        description="Admin хэрэглэгчдийн хийсэн lesson, content, publish, task өөрчлөлтийн түүх."
        actions={
          lessonId ? (
            <span className="admin-badge admin-badge-neutral">
              Lesson {lessonId}
            </span>
          ) : null
        }
      />
      <AdminActivityCenter initialLessonId={lessonId ?? ""} />
    </div>
  );
}
