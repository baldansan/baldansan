import Link from "next/link";
import type { AdminTask, AdminTaskSeverity } from "@/lib/admin/task-generator";

const severityStyles: Record<
  AdminTaskSeverity,
  { badge: string; label: string }
> = {
  critical: {
    badge: "bg-red-50 text-red-800 ring-red-200",
    label: "Critical",
  },
  warning: {
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    label: "Warning",
  },
  info: {
    badge: "bg-sky-50 text-sky-800 ring-sky-200",
    label: "Info",
  },
  success: {
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    label: "Success",
  },
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
};

export function TaskCard({ task }: Props) {
  const severity = severityStyles[task.severity];

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${severity.badge}`}
        >
          {severity.label}
        </span>
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          {categoryLabels[task.category]}
        </span>
        {task.lessonId ? (
          <span className="font-mono text-xs text-slate-500">
            Lesson {task.lessonId}
            {task.lessonTitle ? ` · ${task.lessonTitle}` : ""}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-sm font-semibold text-slate-900">{task.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{task.description}</p>

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
      </div>
    </article>
  );
}
