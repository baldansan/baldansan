"use client";

import type {
  AdminTask,
  AdminTaskCategory,
  AdminTaskPriority,
  AdminTaskSeverity,
  AdminTaskStatus,
} from "@/lib/admin/task-generator";
import { isTaskDueThisWeek, isTaskOverdue } from "@/lib/admin/task-merge";

export type TaskCategoryFilter = "all" | AdminTaskCategory;
export type TaskSeverityFilter = "all" | AdminTaskSeverity;
export type TaskStatusFilter =
  | "active"
  | "open"
  | "in_progress"
  | "resolved"
  | "dismissed"
  | "all";
export type TaskPriorityFilter = "all" | AdminTaskPriority;
export type TaskDueFilter =
  | "all"
  | "overdue"
  | "due_this_week"
  | "no_due_date";
export type TaskQuickFilter =
  | "all"
  | "needs_action"
  | "ready_to_publish"
  | "content_missing"
  | "media_missing";

type Props = {
  category: TaskCategoryFilter;
  severity: TaskSeverityFilter;
  status: TaskStatusFilter;
  priority: TaskPriorityFilter;
  dueFilter: TaskDueFilter;
  quickFilter: TaskQuickFilter;
  search: string;
  onCategoryChange: (value: TaskCategoryFilter) => void;
  onSeverityChange: (value: TaskSeverityFilter) => void;
  onStatusChange: (value: TaskStatusFilter) => void;
  onPriorityChange: (value: TaskPriorityFilter) => void;
  onDueFilterChange: (value: TaskDueFilter) => void;
  onQuickFilterChange: (value: TaskQuickFilter) => void;
  onSearchChange: (value: string) => void;
  resultCount: number;
};

const categories: { value: TaskCategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "content", label: "Content" },
  { value: "qa", label: "QA" },
  { value: "media", label: "Media" },
  { value: "release", label: "Release" },
  { value: "analytics", label: "Analytics" },
  { value: "backup", label: "Backup" },
  { value: "system", label: "System" },
];

const severities: { value: TaskSeverityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
];

const statuses: { value: TaskStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

const priorities: { value: TaskPriorityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const dueFilters: { value: TaskDueFilter; label: string }[] = [
  { value: "all", label: "All due dates" },
  { value: "overdue", label: "Overdue" },
  { value: "due_this_week", label: "Due this week" },
  { value: "no_due_date", label: "No due date" },
];

const quickFilters: { value: TaskQuickFilter; label: string }[] = [
  { value: "all", label: "All tasks" },
  { value: "needs_action", label: "Needs action" },
  { value: "ready_to_publish", label: "Ready to publish" },
  { value: "content_missing", label: "Content missing" },
  { value: "media_missing", label: "Media missing" },
];

function selectClassName(active: boolean): string {
  return active
    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200";
}

export function TaskFilterBar({
  category,
  severity,
  status,
  priority,
  dueFilter,
  quickFilter,
  search,
  onCategoryChange,
  onSeverityChange,
  onStatusChange,
  onPriorityChange,
  onDueFilterChange,
  onQuickFilterChange,
  onSearchChange,
  resultCount,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="task-search"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Search
          </label>
          <input
            id="task-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Lesson title, id, task title…"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quick filter
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onQuickFilterChange(item.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${selectClassName(quickFilter === item.value)}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="task-status"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as TaskStatusFilter)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="task-priority"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Priority
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) =>
                onPriorityChange(e.target.value as TaskPriorityFilter)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {priorities.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="task-due"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Due
            </label>
            <select
              id="task-due"
              value={dueFilter}
              onChange={(e) =>
                onDueFilterChange(e.target.value as TaskDueFilter)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {dueFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="task-category"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Category
            </label>
            <select
              id="task-category"
              value={category}
              onChange={(e) =>
                onCategoryChange(e.target.value as TaskCategoryFilter)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="task-severity"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Severity
            </label>
            <select
              id="task-severity"
              value={severity}
              onChange={(e) =>
                onSeverityChange(e.target.value as TaskSeverityFilter)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {severities.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Showing {resultCount} task{resultCount === 1 ? "" : "s"}
        </p>
      </div>
    </section>
  );
}

export function filterAdminTasks(
  tasks: AdminTask[],
  options: {
    category: TaskCategoryFilter;
    severity: TaskSeverityFilter;
    status: TaskStatusFilter;
    priority: TaskPriorityFilter;
    dueFilter: TaskDueFilter;
    quickFilter: TaskQuickFilter;
    search: string;
    lessonId?: string;
  }
): AdminTask[] {
  const query = options.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (options.lessonId && task.lessonId !== options.lessonId) {
      return false;
    }

    if (options.status === "active") {
      if (task.status === "resolved" || task.status === "dismissed") {
        return false;
      }
      if (task.isGenerated === false) return false;
    } else if (options.status !== "all" && task.status !== options.status) {
      return false;
    }

    if (options.priority !== "all" && task.priority !== options.priority) {
      return false;
    }

    if (options.dueFilter === "overdue" && !isTaskOverdue(task)) {
      return false;
    }
    if (options.dueFilter === "due_this_week" && !isTaskDueThisWeek(task)) {
      return false;
    }
    if (options.dueFilter === "no_due_date" && task.dueDate) {
      return false;
    }

    if (options.category !== "all" && task.category !== options.category) {
      return false;
    }

    if (options.severity !== "all" && task.severity !== options.severity) {
      return false;
    }

    if (options.quickFilter === "needs_action") {
      if (task.status === "resolved" || task.status === "dismissed") {
        return false;
      }
      if (task.severity !== "critical" && task.severity !== "warning") {
        return false;
      }
    } else if (options.quickFilter === "ready_to_publish") {
      if (task.createdFrom !== "release.readyToPublish") return false;
    } else if (options.quickFilter === "content_missing") {
      if (task.category !== "content") return false;
    } else if (options.quickFilter === "media_missing") {
      if (task.category !== "media") return false;
    }

    if (!query) return true;

    const haystack = [
      task.title,
      task.description,
      task.lessonId ?? "",
      task.lessonTitle ?? "",
      task.adminNote ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}
