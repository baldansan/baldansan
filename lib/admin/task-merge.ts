import type {
  AdminTask,
  AdminTaskPriority,
  AdminTaskStatus,
  AdminTaskSummary,
} from "@/lib/admin/task-generator";

export type PersistedAdminTaskRow = {
  id: string;
  task_key: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  lesson_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  admin_note: string | null;
  assigned_to: string | null;
  created_by: string | null;
  resolved_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeStatus(value: string | null | undefined): AdminTaskStatus {
  if (
    value === "in_progress" ||
    value === "resolved" ||
    value === "dismissed"
  ) {
    return value;
  }
  return "open";
}

function normalizePriority(value: string | null | undefined): AdminTaskPriority {
  if (value === "low" || value === "high" || value === "urgent") {
    return value;
  }
  return "normal";
}

function applyPersistedFields(
  task: AdminTask,
  row: PersistedAdminTaskRow
): AdminTask {
  return {
    ...task,
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
    dueDate: row.due_date,
    adminNote: row.admin_note,
    assignedTo: row.assigned_to,
    resolvedAt: row.resolved_at,
    dismissedAt: row.dismissed_at,
    isPersisted: true,
  };
}

function rowToHistoryTask(row: PersistedAdminTaskRow): AdminTask {
  return {
    id: row.task_key,
    taskKey: row.task_key,
    category: row.category as AdminTask["category"],
    severity: row.severity as AdminTask["severity"],
    title: row.title,
    description: row.description ?? "",
    lessonId: row.lesson_id ?? undefined,
    createdFrom: "persisted.history",
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
    dueDate: row.due_date,
    adminNote: row.admin_note,
    assignedTo: row.assigned_to,
    resolvedAt: row.resolved_at,
    dismissedAt: row.dismissed_at,
    isGenerated: false,
    isPersisted: true,
    actionHref: row.lesson_id
      ? `/admin/lessons/${row.lesson_id}/edit`
      : undefined,
    actionLabel: row.lesson_id ? "Edit lesson" : undefined,
  };
}

export function mergeGeneratedWithPersisted(
  generated: AdminTask[],
  persisted: PersistedAdminTaskRow[]
): AdminTask[] {
  const persistedByKey = new Map(
    persisted.map((row) => [row.task_key, row])
  );
  const generatedKeys = new Set<string>();
  const merged: AdminTask[] = [];

  for (const task of generated) {
    generatedKeys.add(task.taskKey);
    const row = persistedByKey.get(task.taskKey);
    if (row) {
      merged.push(applyPersistedFields(task, row));
    } else {
      merged.push(task);
    }
  }

  for (const row of persisted) {
    if (generatedKeys.has(row.task_key)) continue;
    const status = normalizeStatus(row.status);
    if (status === "resolved" || status === "dismissed") {
      merged.push(rowToHistoryTask(row));
    }
  }

  return merged;
}

export function isTaskOverdue(task: AdminTask, today = new Date()): boolean {
  if (!task.dueDate) return false;
  if (task.status === "resolved" || task.status === "dismissed") {
    return false;
  }
  const due = new Date(`${task.dueDate}T23:59:59`);
  return due.getTime() < today.getTime();
}

export function isTaskDueThisWeek(task: AdminTask, today = new Date()): boolean {
  if (!task.dueDate) return false;
  const due = new Date(`${task.dueDate}T12:00:00`);
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return due >= start && due <= end;
}

export function isActiveTask(task: AdminTask): boolean {
  return task.status !== "resolved" && task.status !== "dismissed";
}

export function summarizeMergedAdminTasks(tasks: AdminTask[]): AdminTaskSummary {
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let successCount = 0;
  let readyToPublishCount = 0;
  let needsContentCount = 0;
  let mediaIssuesCount = 0;
  let openCount = 0;
  let inProgressCount = 0;
  let overdueCount = 0;
  let urgentCount = 0;
  let resolvedCount = 0;
  let dismissedCount = 0;
  let activeCount = 0;

  for (const task of tasks) {
    if (task.severity === "critical") criticalCount += 1;
    if (task.severity === "warning") warningCount += 1;
    if (task.severity === "info") infoCount += 1;
    if (task.severity === "success") successCount += 1;

    if (task.createdFrom === "release.readyToPublish") {
      readyToPublishCount += 1;
    }
    if (task.category === "content") needsContentCount += 1;
    if (
      task.category === "media" &&
      (task.severity === "critical" || task.severity === "warning")
    ) {
      mediaIssuesCount += 1;
    }

    if (task.status === "open") openCount += 1;
    if (task.status === "in_progress") inProgressCount += 1;
    if (task.status === "resolved") resolvedCount += 1;
    if (task.status === "dismissed") dismissedCount += 1;
    if (task.priority === "urgent") urgentCount += 1;
    if (isTaskOverdue(task)) overdueCount += 1;
    if (isActiveTask(task)) activeCount += 1;
  }

  return {
    totalTasks: tasks.length,
    criticalCount,
    warningCount,
    infoCount,
    successCount,
    readyToPublishCount,
    needsContentCount,
    mediaIssuesCount,
    openCount,
    inProgressCount,
    overdueCount,
    urgentCount,
    resolvedCount,
    dismissedCount,
    activeCount,
  };
}

export function filterActiveTasks(tasks: AdminTask[]): AdminTask[] {
  return tasks.filter((task) => {
    if (!isActiveTask(task)) return false;
    if (task.isGenerated === false) return false;
    return true;
  });
}

export function filterTasksForLessonActive(
  tasks: AdminTask[],
  lessonId: string
): AdminTask[] {
  return filterActiveTasks(
    tasks.filter((task) => task.lessonId === lessonId)
  );
}
