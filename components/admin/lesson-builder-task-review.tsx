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
            9-р алхам — Ажлын шалгалт
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Контент, чанар, медиа, хувилбар, тайлангаас үүссэн ажлууд.
          </p>
        </div>
        <Link
          href="/admin/tasks"
          className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 sm:text-sm"
        >
          Ажлын төв →
        </Link>
      </div>

      {!lessonId ? (
        <p className="mt-4 text-sm text-slate-500">
          Ажлуудыг харахын тулд хичээл сонгоно уу.
        </p>
      ) : lessonTasks.length === 0 ? (
        <p className="mt-4 text-sm text-emerald-800">
          {lessonId} — яаралтай ажил алга.
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs font-medium text-slate-500">
            {lessonId} хичээлд {lessonTasks.length} ажил байна
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
              Бүх {lessonTasks.length} ажлыг харах →
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}
