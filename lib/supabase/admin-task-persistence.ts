import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { AdminTask, AdminTaskPriority, AdminTaskStatus } from "@/lib/admin/task-generator";
import {
  ADMIN_ACTIVITY_ACTIONS,
  logAdminActivity,
} from "@/lib/supabase/admin-activity";

export type AdminTaskWriteResult<T> = {
  data: T | null;
  error: string | null;
};

import type { PersistedAdminTaskRow } from "@/lib/admin/task-merge";

export type { PersistedAdminTaskRow };

const RLS_HINT =
  "Admin RLS policy шаардлагатай — run supabase/migrations/006_admin_tasks.sql";

function notConfigured<T>(): AdminTaskWriteResult<T> {
  return {
    data: null,
    error:
      "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
  };
}

function formatWriteError(error: { code?: string; message: string }): string {
  const message = error.message ?? "";
  if (
    error.code === "42501" ||
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("admin_tasks")
  ) {
    return `${RLS_HINT} (${message})`;
  }
  return message || "Хадгалахад алдаа гарлаа.";
}

async function requireAdmin(): Promise<AdminTaskWriteResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

async function getSessionUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

async function logTaskActivity(
  task: AdminTask,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAdminActivity({
    action,
    entityType: "task",
    entityId: task.taskKey,
    lessonId: task.lessonId,
    title: task.title,
    description: task.description,
    metadata: { taskKey: task.taskKey, ...metadata },
  });
}

function rowFromTask(
  task: AdminTask,
  overrides: Partial<{
    status: AdminTaskStatus;
    priority: AdminTaskPriority;
    dueDate: string | null;
    adminNote: string | null;
    assignedTo: string | null;
    resolvedAt: string | null;
    dismissedAt: string | null;
    createdBy: string | null;
  }> = {}
) {
  return {
    task_key: task.taskKey,
    category: task.category,
    severity: task.severity,
    title: task.title,
    description: task.description,
    lesson_id: task.lessonId ?? null,
    status: overrides.status ?? task.status,
    priority: overrides.priority ?? task.priority,
    due_date: overrides.dueDate !== undefined ? overrides.dueDate : task.dueDate ?? null,
    admin_note:
      overrides.adminNote !== undefined ? overrides.adminNote : task.adminNote ?? null,
    assigned_to:
      overrides.assignedTo !== undefined ? overrides.assignedTo : task.assignedTo ?? null,
    created_by: overrides.createdBy ?? null,
    resolved_at: overrides.resolvedAt ?? null,
    dismissed_at: overrides.dismissedAt ?? null,
  };
}

export async function getPersistedAdminTasks(): Promise<
  AdminTaskWriteResult<PersistedAdminTaskRow[]>
> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  try {
    const { data, error } = await supabase
      .from("admin_tasks")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) return { data: null, error: formatWriteError(error) };
    return { data: (data ?? []) as PersistedAdminTaskRow[], error: null };
  } catch {
    return { data: null, error: "Admin tasks уншихад алдаа гарлаа." };
  }
}

export async function upsertGeneratedTask(
  task: AdminTask,
  overrides: Partial<{
    status: AdminTaskStatus;
    priority: AdminTaskPriority;
    dueDate: string | null;
    adminNote: string | null;
    assignedTo: string | null;
    resolvedAt: string | null;
    dismissedAt: string | null;
  }> = {}
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  const userId = await getSessionUserId();
  const payload = rowFromTask(task, { ...overrides, createdBy: userId });

  try {
    const { data, error } = await supabase
      .from("admin_tasks")
      .upsert(payload, { onConflict: "task_key" })
      .select("*")
      .single();

    if (error) return { data: null, error: formatWriteError(error) };
    return { data: data as PersistedAdminTaskRow, error: null };
  } catch {
    return { data: null, error: "Task хадгалахад алдаа гарлаа." };
  }
}

async function updateTaskByKey(
  taskKey: string,
  patch: Record<string, unknown>
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  try {
    const { data, error } = await supabase
      .from("admin_tasks")
      .update(patch)
      .eq("task_key", taskKey)
      .select("*")
      .maybeSingle();

    if (error) return { data: null, error: formatWriteError(error) };
    if (!data) {
      return { data: null, error: "Task row not found — action a generated task first." };
    }
    return { data: data as PersistedAdminTaskRow, error: null };
  } catch {
    return { data: null, error: "Task шинэчлэхэд алдаа гарлаа." };
  }
}

export async function updateAdminTaskStatus(
  task: AdminTask,
  status: AdminTaskStatus
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  const now = new Date().toISOString();
  let result: AdminTaskWriteResult<PersistedAdminTaskRow>;
  if (status === "resolved") {
    result = await upsertGeneratedTask(task, {
      status,
      resolvedAt: now,
      dismissedAt: null,
    });
    if (!result.error) {
      await logTaskActivity(task, ADMIN_ACTIVITY_ACTIONS.taskResolved, { status });
    }
    return result;
  }
  if (status === "dismissed") {
    result = await upsertGeneratedTask(task, {
      status,
      dismissedAt: now,
      resolvedAt: null,
    });
    if (!result.error) {
      await logTaskActivity(task, ADMIN_ACTIVITY_ACTIONS.taskDismissed, { status });
    }
    return result;
  }
  if (status === "in_progress") {
    result = await upsertGeneratedTask(task, {
      status,
      resolvedAt: null,
      dismissedAt: null,
    });
    if (!result.error) {
      await logTaskActivity(task, ADMIN_ACTIVITY_ACTIONS.taskStarted, { status });
    }
    return result;
  }
  result = await upsertGeneratedTask(task, {
    status,
    resolvedAt: null,
    dismissedAt: null,
  });
  if (!result.error) {
    await logTaskActivity(task, ADMIN_ACTIVITY_ACTIONS.taskUpdated, { status });
  }
  return result;
}

export async function updateAdminTaskPriority(
  task: AdminTask,
  priority: AdminTaskPriority
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return upsertGeneratedTask(task, { priority });
}

export async function updateAdminTaskDueDate(
  task: AdminTask,
  dueDate: string | null
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return upsertGeneratedTask(task, { dueDate });
}

export async function updateAdminTaskNote(
  task: AdminTask,
  note: string | null
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return upsertGeneratedTask(task, { adminNote: note });
}

export async function assignAdminTask(
  task: AdminTask,
  userId: string | null
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return upsertGeneratedTask(task, { assignedTo: userId });
}

export async function dismissAdminTask(
  task: AdminTask
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return updateAdminTaskStatus(task, "dismissed");
}

export async function resolveAdminTask(
  task: AdminTask
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return updateAdminTaskStatus(task, "resolved");
}

export async function reopenAdminTask(
  task: AdminTask
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return updateAdminTaskStatus(task, "open");
}

export async function startAdminTask(
  task: AdminTask
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return updateAdminTaskStatus(task, "in_progress");
}

export async function saveAdminTaskDetails(
  task: AdminTask,
  details: {
    priority: AdminTaskPriority;
    dueDate: string | null;
    adminNote: string | null;
  }
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  const result = await upsertGeneratedTask(task, {
    priority: details.priority,
    dueDate: details.dueDate,
    adminNote: details.adminNote,
  });
  if (!result.error) {
    await logTaskActivity(task, ADMIN_ACTIVITY_ACTIONS.taskUpdated, details);
  }
  return result;
}

/** Update by task_key when row already exists (rare direct patch). */
export async function patchAdminTaskByKey(
  taskKey: string,
  patch: Record<string, unknown>
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return updateTaskByKey(taskKey, patch);
}
