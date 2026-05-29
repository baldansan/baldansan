import Link from "next/link";
import { TaskCard } from "@/components/admin/task-card";
import type { AdminTask } from "@/lib/admin/task-generator";

type Props = {
  lessonId: string;
  tasks: AdminTask[];
};

export function LessonTasksCard({ lessonId, tasks }: Props) {
  const topTasks = tasks.slice(0, 3);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Tasks for this lesson
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {tasks.length === 0
              ? "No open tasks for this lesson."
              : `${tasks.length} generated task${tasks.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Link
          href={`/admin/tasks?lessonId=${encodeURIComponent(lessonId)}`}
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:text-sm"
        >
          Open task center →
        </Link>
      </div>

      {topTasks.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {topTasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-emerald-800">
          Бүх зүйл хэвийн — urgent task алга.
        </p>
      )}
    </section>
  );
}
