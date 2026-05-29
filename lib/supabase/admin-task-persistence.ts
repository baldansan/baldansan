import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { AdminTask, AdminTaskPriority, AdminTaskStatus } from "@/lib/admin/task-generator";

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
  if (status === "resolved") {
    return upsertGeneratedTask(task, {
      status,
      resolvedAt: now,
      dismissedAt: null,
    });
  }
  if (status === "dismissed") {
    return upsertGeneratedTask(task, {
      status,
      dismissedAt: now,
      resolvedAt: null,
    });
  }
  return upsertGeneratedTask(task, {
    status,
    resolvedAt: null,
    dismissedAt: null,
  });
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
  return upsertGeneratedTask(task, {
    priority: details.priority,
    dueDate: details.dueDate,
    adminNote: details.adminNote,
  });
}

/** Update by task_key when row already exists (rare direct patch). */
export async function patchAdminTaskByKey(
  taskKey: string,
  patch: Record<string, unknown>
): Promise<AdminTaskWriteResult<PersistedAdminTaskRow>> {
  return updateTaskByKey(taskKey, patch);
}
