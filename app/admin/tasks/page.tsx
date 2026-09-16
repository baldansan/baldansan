import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTaskCenter } from "@/components/admin/admin-task-center";
import { getAdminTaskCenterData } from "@/lib/supabase/admin-tasks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ажлын төв — Buunduu Surtsgaay",
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
        title="Ажлын төв"
        description="Контент, чанарын шалгалт, медиа, тайлан, хувилбар гаргах урсгалын хийх ажлуудыг нэг дор харна."
        actions={
          lessonId ? (
            <span className="admin-badge admin-badge-neutral">
              Хичээл {lessonId}
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
