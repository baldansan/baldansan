import { LessonBuilderWorkflow } from "@/components/admin/lesson-builder-workflow";
import { getHsk5LessonsWithQa } from "@/lib/admin/lesson-fetch";
import { getAdminTasks } from "@/lib/supabase/admin-tasks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lesson Builder — Admin",
};

export default async function LessonBuilderPage() {
  const [reports, tasks] = await Promise.all([
    getHsk5LessonsWithQa(),
    getAdminTasks(),
  ]);

  return <LessonBuilderWorkflow reports={reports} tasks={tasks} />;
}
