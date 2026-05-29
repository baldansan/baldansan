"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AdminTask,
  AdminTaskPriority,
  AdminTaskSeverity,
  AdminTaskStatus,
} from "@/lib/admin/task-generator";
import { isTaskOverdue } from "@/lib/admin/task-merge";
import {
  dismissAdminTask,
  reopenAdminTask,
  resolveAdminTask,
  saveAdminTaskDetails,
  startAdminTask,
} from "@/lib/supabase/admin-task-persistence";

const severityStyles: Record<
  AdminTaskSeverity,
  { badge: string; label: string }
> = {
  critical: { badge: "bg-red-50 text-red-800 ring-red-200", label: "Critical" },
  warning: {
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    label: "Warning",
  },
  info: { badge: "bg-sky-50 text-sky-800 ring-sky-200", label: "Info" },
  success: {
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    label: "Success",
  },
};

const statusStyles: Record<AdminTaskStatus, { badge: string; label: string }> =
  {
    open: { badge: "bg-slate-100 text-slate-700 ring-slate-200", label: "Open" },
    in_progress: {
      badge: "bg-sky-50 text-sky-800 ring-sky-200",
      label: "In progress",
    },
    resolved: {
      badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      label: "Resolved",
    },
    dismissed: {
      badge: "bg-slate-100 text-slate-500 ring-slate-200",
      label: "Dismissed",
    },
  };

const priorityStyles: Record<
  AdminTaskPriority,
  { badge: string; label: string }
> = {
  low: { badge: "bg-slate-50 text-slate-600 ring-slate-200", label: "Low" },
  normal: {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    label: "Normal",
  },
  high: { badge: "bg-amber-50 text-amber-900 ring-amber-200", label: "High" },
  urgent: { badge: "bg-red-50 text-red-800 ring-red-200", label: "Urgent" },
};

const categoryLabels: Record<AdminTask["category"], string> = {
  content: "Content",
  qa: "QA",
  media: "Media",
  release: "Release",
  analytics: "Analytics",
  backup: "Backup",
  system: "System",
};

type Props = {
  task: AdminTask;
  compact?: boolean;
};

export function TaskCardWithActions({ task, compact = false }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState<AdminTaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [adminNote, setAdminNote] = useState(task.adminNote ?? "");

  const overdue = isTaskOverdue(task);
  const severity = severityStyles[task.severity];
  const status = statusStyles[task.status];
  const priorityBadge = priorityStyles[task.priority];

  async function runAction(
    action: () => Promise<{ error: string | null }>
  ): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleSaveDetails(): Promise<void> {
    await runAction(async () => {
      const result = await saveAdminTaskDetails(task, {
        priority,
        dueDate: dueDate.trim() || null,
        adminNote: adminNote.trim() || null,
      });
      return { error: result.error };
    });
  }

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${severity.badge}`}
        >
          {severity.label}
        </span>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${status.badge}`}
        >
          {status.label}
        </span>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${priorityBadge.badge}`}
        >
          {priorityBadge.label}
        </span>
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          {categoryLabels[task.category]}
        </span>
        {task.dueDate ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
              overdue
                ? "bg-red-50 text-red-800 ring-red-200"
                : "bg-slate-50 text-slate-600 ring-slate-200"
            }`}
          >
            Due {task.dueDate}
            {overdue ? " · Overdue" : ""}
          </span>
        ) : null}
        {task.lessonId ? (
          <span className="font-mono text-xs text-slate-500">
            Lesson {task.lessonId}
            {task.lessonTitle ? ` · ${task.lessonTitle}` : ""}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-sm font-semibold text-slate-900">{task.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{task.description}</p>

      {task.adminNote && !expanded ? (
        <p className="mt-2 text-xs text-slate-500">
          Note: {task.adminNote.slice(0, 120)}
          {task.adminNote.length > 120 ? "…" : ""}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {task.actionHref && task.actionLabel ? (
          <Link
            href={task.actionHref}
            className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 sm:text-sm"
          >
            {task.actionLabel}
          </Link>
        ) : null}
        {task.secondaryActionHref && task.secondaryActionLabel ? (
          <Link
            href={task.secondaryActionHref}
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700 sm:text-sm"
          >
            {task.secondaryActionLabel}
          </Link>
        ) : null}

        {task.status === "open" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAction(async () => {
              const result = await startAdminTask(task);
              return { error: result.error };
            })}
            className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50 sm:text-sm"
          >
            Start
          </button>
        ) : null}

        {task.status !== "resolved" && task.status !== "dismissed" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(async () => {
                const result = await resolveAdminTask(task);
                return { error: result.error };
              })}
              className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 sm:text-sm"
            >
              Resolve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(async () => {
                const result = await dismissAdminTask(task);
                return { error: result.error };
              })}
              className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 disabled:opacity-50 sm:text-sm"
            >
              Dismiss
            </button>
          </>
        ) : null}

        {task.status === "resolved" || task.status === "dismissed" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAction(async () => {
              const result = await reopenAdminTask(task);
              return { error: result.error };
            })}
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50 sm:text-sm"
          >
            Reopen
          </button>
        ) : null}

        {!compact ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700 sm:text-sm"
          >
            {expanded ? "Hide details" : "Edit details"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-xs text-red-700">{error}</p>
      ) : null}

      {expanded && !compact ? (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`priority-${task.taskKey}`}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Priority
              </label>
              <select
                id={`priority-${task.taskKey}`}
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as AdminTaskPriority)
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label
                htmlFor={`due-${task.taskKey}`}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Due date
              </label>
              <input
                id={`due-${task.taskKey}`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <label
              htmlFor={`note-${task.taskKey}`}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Admin note
            </label>
            <textarea
              id={`note-${task.taskKey}`}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Internal note for this task…"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSaveDetails()}
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            Save task details
          </button>
        </div>
      ) : null}
    </article>
  );
}
