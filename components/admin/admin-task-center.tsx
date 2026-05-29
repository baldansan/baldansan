"use client";

import { useMemo, useState } from "react";
import { TaskCardWithActions } from "@/components/admin/task-card-with-actions";
import {
  filterAdminTasks,
  TaskFilterBar,
  type TaskCategoryFilter,
  type TaskDueFilter,
  type TaskPriorityFilter,
  type TaskQuickFilter,
  type TaskSeverityFilter,
  type TaskStatusFilter,
} from "@/components/admin/task-filter-bar";
import {
  TaskSummaryCards,
  TaskSummarySecondaryCards,
} from "@/components/admin/task-summary-cards";
import type { AdminTask, AdminTaskSummary } from "@/lib/admin/task-generator";

type Props = {
  tasks: AdminTask[];
  summary: AdminTaskSummary;
  warnings: string[];
  initialLessonId?: string;
  persistenceAvailable: boolean;
};

export function AdminTaskCenter({
  tasks,
  summary,
  warnings,
  initialLessonId,
  persistenceAvailable,
}: Props) {
  const [category, setCategory] = useState<TaskCategoryFilter>("all");
  const [severity, setSeverity] = useState<TaskSeverityFilter>("all");
  const [status, setStatus] = useState<TaskStatusFilter>("active");
  const [priority, setPriority] = useState<TaskPriorityFilter>("all");
  const [dueFilter, setDueFilter] = useState<TaskDueFilter>("all");
  const [quickFilter, setQuickFilter] = useState<TaskQuickFilter>("all");
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(
    () =>
      filterAdminTasks(tasks, {
        category,
        severity,
        status,
        priority,
        dueFilter,
        quickFilter,
        search,
        lessonId: initialLessonId,
      }),
    [
      tasks,
      category,
      severity,
      status,
      priority,
      dueFilter,
      quickFilter,
      search,
      initialLessonId,
    ]
  );

  const allWarnings = persistenceAvailable
    ? warnings
    : [
        ...warnings,
        "Persistent task actions require migration 006_admin_tasks.sql.",
      ];

  return (
    <div className="flex flex-col gap-6">
      {allWarnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Task center notes</p>
          <ul className="mt-2 list-inside list-disc">
            {[...new Set(allWarnings)].map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
        <div className="mt-3">
          <TaskSummaryCards summary={summary} />
          <TaskSummarySecondaryCards summary={summary} />
        </div>
      </section>

      <TaskFilterBar
        category={category}
        severity={severity}
        status={status}
        priority={priority}
        dueFilter={dueFilter}
        quickFilter={quickFilter}
        search={search}
        onCategoryChange={setCategory}
        onSeverityChange={setSeverity}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onDueFilterChange={setDueFilter}
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
            <li key={task.taskKey}>
              <TaskCardWithActions task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
