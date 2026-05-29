import { LessonBuilderWorkflow } from "@/components/admin/lesson-builder-workflow";
import { getHsk5LessonsWithQa } from "@/lib/admin/lesson-fetch";
import { getAdminActivityLog } from "@/lib/supabase/admin-activity-log";
import { getAdminTasks } from "@/lib/supabase/admin-tasks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lesson Builder — Admin",
};

export default async function LessonBuilderPage() {
  const [reports, tasks, activityLog] = await Promise.all([
    getHsk5LessonsWithQa(),
    getAdminTasks(),
    getAdminActivityLog({ limit: 500 }),
  ]);

  const activityCountByLesson = activityLog.rows.reduce<Record<string, number>>(
    (acc, row) => {
      if (!row.lessonId) return acc;
      acc[row.lessonId] = (acc[row.lessonId] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <LessonBuilderWorkflow
      reports={reports}
      tasks={tasks}
      activityCountByLesson={activityCountByLesson}
    />
  );
}
