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
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Admin task center
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Контент, QA, media, analytics, release workflow-ийн хийх ажлуудыг нэг
          дор харна.
        </p>
        {lessonId ? (
          <p className="mt-2 text-xs font-medium text-emerald-800">
            Filtered for lesson {lessonId}
          </p>
        ) : null}
      </section>

      <AdminTaskCenter
        tasks={data.tasks}
        summary={data.summary}
        warnings={data.warnings}
        initialLessonId={lessonId}
      />
    </div>
  );
}
