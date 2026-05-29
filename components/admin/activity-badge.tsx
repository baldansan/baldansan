import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

const actionStyles: Record<string, string> = {
  lesson_created: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  lesson_published: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  lesson_approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  task_resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  lesson_unpublished: "bg-amber-50 text-amber-900 ring-amber-200",
  lesson_archived: "bg-slate-100 text-slate-700 ring-slate-200",
  task_dismissed: "bg-slate-100 text-slate-600 ring-slate-200",
  bulk_import_completed: "bg-sky-50 text-sky-800 ring-sky-200",
  backup_restored: "bg-sky-50 text-sky-800 ring-sky-200",
  media_uploaded: "bg-violet-50 text-violet-800 ring-violet-200",
  task_started: "bg-sky-50 text-sky-800 ring-sky-200",
};

function labelForAction(action: string): string {
  return action.replaceAll("_", " ");
}

type Props = {
  action: string;
};

export function ActivityBadge({ action }: Props) {
  const style =
    actionStyles[action] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${style}`}
    >
      {labelForAction(action)}
    </span>
  );
}

export function EntityTypeBadge({ entityType }: { entityType: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {entityType}
    </span>
  );
}

export function formatActivityTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export type { AdminActivityRow };
