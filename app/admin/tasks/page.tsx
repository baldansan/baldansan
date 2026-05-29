import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTaskCenter } from "@/components/admin/admin-task-center";
import { getAdminTaskCenterData } from "@/lib/supabase/admin-tasks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin task center — Buunduu Surtsgaay",
};

type Props = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function AdminTasksPage({ searchParams }: Props) {
  const { lessonId } = await searchParams;
  const data = await getAdminTaskCenterData();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Task Center"
        description="Контент, QA, media, analytics, release workflow-ийн хийх ажлуудыг нэг дор харна."
        actions={
          lessonId ? (
            <span className="admin-badge admin-badge-neutral">
              Lesson {lessonId}
            </span>
          ) : null
        }
      />
      <AdminTaskCenter
        tasks={data.allTasks}
        summary={data.summary}
        warnings={data.warnings}
        initialLessonId={lessonId}
        persistenceAvailable={data.persistenceAvailable}
      />
    </div>
  );
}
