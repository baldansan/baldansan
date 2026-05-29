import Link from "next/link";
import { TaskCardWithActions } from "@/components/admin/task-card-with-actions";
import type { AdminTask } from "@/lib/admin/task-generator";
import { isActiveTask } from "@/lib/admin/task-merge";

type Props = {
  lessonId: string | null;
  tasks: AdminTask[];
};

export function LessonBuilderTaskReview({ lessonId, tasks }: Props) {
  const lessonTasks = lessonId
    ? tasks.filter(
        (task) => task.lessonId === lessonId && isActiveTask(task) && task.isGenerated !== false
      )
    : [];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Step 9 — Task review
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Generated tasks from content, QA, media, release, and analytics.
          </p>
        </div>
        <Link
          href="/admin/tasks"
          className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 sm:text-sm"
        >
          Task center →
        </Link>
      </div>

      {!lessonId ? (
        <p className="mt-4 text-sm text-slate-500">
          Select a lesson to see its tasks.
        </p>
      ) : lessonTasks.length === 0 ? (
        <p className="mt-4 text-sm text-emerald-800">
          Lesson {lessonId} — urgent task алга.
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs font-medium text-slate-500">
            {lessonTasks.length} task(s) for lesson {lessonId}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {lessonTasks.slice(0, 5).map((task) => (
              <li key={task.taskKey}>
                <TaskCardWithActions task={task} compact />
              </li>
            ))}
          </ul>
          {lessonTasks.length > 5 ? (
            <Link
              href={`/admin/tasks?lessonId=${encodeURIComponent(lessonId)}`}
              className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              View all {lessonTasks.length} tasks →
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}
