"use client";

import Link from "next/link";
import { TaskCardWithActions } from "@/components/admin/task-card-with-actions";
import type { AdminTask } from "@/lib/admin/task-generator";

type Props = {
  lessonId: string;
  tasks: AdminTask[];
  bare?: boolean;
};

export function LessonTasksCard({ lessonId, tasks, bare = false }: Props) {
  const topTasks = tasks.slice(0, 3);

  const body = (
    <>
      {!bare ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Tasks for this lesson
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {tasks.length === 0
                ? "No active tasks for this lesson."
                : `${tasks.length} active task${tasks.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <Link
            href={`/admin/tasks?lessonId=${encodeURIComponent(lessonId)}`}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:text-sm"
          >
            Open task center →
          </Link>
        </div>
      ) : (
        <div className="flex justify-end">
          <Link
            href={`/admin/tasks?lessonId=${encodeURIComponent(lessonId)}`}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:text-sm"
          >
            Open task center →
          </Link>
        </div>
      )}

      {topTasks.length > 0 ? (
        <ul className={`flex flex-col gap-3 ${bare ? "" : "mt-4"}`}>
          {topTasks.map((task) => (
            <li key={task.taskKey}>
              <TaskCardWithActions task={task} compact />
            </li>
          ))}
        </ul>
      ) : (
        <p className={`text-sm text-emerald-800 ${bare ? "" : "mt-4"}`}>
          Бүх зүйл хэвийн — urgent task алга.
        </p>
      )}
    </>
  );

  if (bare) {
    return body;
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      {body}
    </section>
  );
}
