"use client";

import { useMemo, useState } from "react";
import { TaskCard } from "@/components/admin/task-card";
import {
  filterAdminTasks,
  TaskFilterBar,
  type TaskCategoryFilter,
  type TaskQuickFilter,
  type TaskSeverityFilter,
} from "@/components/admin/task-filter-bar";
import { TaskSummaryCards } from "@/components/admin/task-summary-cards";
import type { AdminTask, AdminTaskSummary } from "@/lib/admin/task-generator";

type Props = {
  tasks: AdminTask[];
  summary: AdminTaskSummary;
  warnings: string[];
  initialLessonId?: string;
};

export function AdminTaskCenter({
  tasks,
  summary,
  warnings,
  initialLessonId,
}: Props) {
  const [category, setCategory] = useState<TaskCategoryFilter>("all");
  const [severity, setSeverity] = useState<TaskSeverityFilter>("all");
  const [quickFilter, setQuickFilter] = useState<TaskQuickFilter>("all");
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(
    () =>
      filterAdminTasks(tasks, {
        category,
        severity,
        quickFilter,
        search,
        lessonId: initialLessonId,
      }),
    [tasks, category, severity, quickFilter, search, initialLessonId]
  );

  return (
    <div className="flex flex-col gap-6">
      {warnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Task center notes</p>
          <ul className="mt-2 list-inside list-disc">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
        <div className="mt-3">
          <TaskSummaryCards summary={summary} />
        </div>
      </section>

      <TaskFilterBar
        category={category}
        severity={severity}
        quickFilter={quickFilter}
        search={search}
        onCategoryChange={setCategory}
        onSeverityChange={setSeverity}
        onQuickFilterChange={setQuickFilter}
        onSearchChange={setSearch}
        resultCount={filteredTasks.length}
      />

      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl bg-emerald-50 px-6 py-10 text-center ring-1 ring-emerald-200">
          <p className="text-sm font-medium text-emerald-900">
            Бүх зүйл хэвийн байна. Одоогоор хийх urgent task алга.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredTasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
