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
  { value: "all", label: "Бүгд" },
  { value: "content", label: "Контент" },
  { value: "qa", label: "Чанарын шалгалт" },
  { value: "media", label: "Медиа" },
  { value: "release", label: "Хувилбар" },
  { value: "analytics", label: "Тайлан" },
  { value: "backup", label: "Нөөц хуулбар" },
  { value: "system", label: "Систем" },
];

const severities: { value: TaskSeverityFilter; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "critical", label: "Ноцтой" },
  { value: "warning", label: "Анхааруулга" },
  { value: "info", label: "Мэдээлэл" },
  { value: "success", label: "Амжилттай" },
];

const statuses: { value: TaskStatusFilter; label: string }[] = [
  { value: "active", label: "Идэвхтэй" },
  { value: "open", label: "Нээлттэй" },
  { value: "in_progress", label: "Хийгдэж байна" },
  { value: "resolved", label: "Шийдэгдсэн" },
  { value: "dismissed", label: "Хаасан" },
  { value: "all", label: "Бүгд" },
];

const priorities: { value: TaskPriorityFilter; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "low", label: "Бага" },
  { value: "normal", label: "Энгийн" },
  { value: "high", label: "Өндөр" },
  { value: "urgent", label: "Яаралтай" },
];

const dueFilters: { value: TaskDueFilter; label: string }[] = [
  { value: "all", label: "Бүх огноо" },
  { value: "overdue", label: "Хугацаа хэтэрсэн" },
  { value: "due_this_week", label: "Энэ долоо хоногт дуусах" },
  { value: "no_due_date", label: "Огноогүй" },
];

const quickFilters: { value: TaskQuickFilter; label: string }[] = [
  { value: "all", label: "Бүх ажил" },
  { value: "needs_action", label: "Арга хэмжээ авах" },
  { value: "ready_to_publish", label: "Нийтлэхэд бэлэн" },
  { value: "content_missing", label: "Контент дутуу" },
  { value: "media_missing", label: "Медиа дутуу" },
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
            Хайх
          </label>
          <input
            id="task-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Хичээлийн нэр, ID, ажлын нэр…"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Түргэн шүүлт
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
              Төлөв
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
              Ач холбогдол
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
              Дуусах хугацаа
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
              Ангилал
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
              Хэр ноцтой
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
          Нийт {resultCount} ажил харагдаж байна
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
