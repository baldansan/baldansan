import Link from "next/link";
import {
  ActivityBadge,
  EntityTypeBadge,
  formatActivityTime,
} from "@/components/admin/activity-badge";
import { activityHasDiffPreview } from "@/lib/admin/admin-activity-diff";
import {
  formatActivityActor,
  type AdminActivityRow,
} from "@/lib/admin/admin-activity-shared";

type Props = {
  rows: AdminActivityRow[];
  compact?: boolean;
};

export function ActivityLogList({ rows, compact = false }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
        Одоогоор activity бүртгэл алга.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={`/admin/activity/${row.id}`}
            className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-emerald-200 sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <ActivityBadge action={row.action} />
              <EntityTypeBadge entityType={row.entityType} />
              {activityHasDiffPreview(row) ? (
                <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
                  Diff available
                </span>
              ) : null}
              {row.lessonId ? (
                <span className="font-mono text-xs text-slate-500">
                  Lesson {row.lessonId}
                </span>
              ) : null}
            </div>

            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              {row.title}
            </h3>
            {row.description ? (
              <p className="mt-1 text-sm text-slate-600">{row.description}</p>
            ) : null}

            <p className="mt-2 text-xs text-slate-500">
              {formatActivityActor(row)} · {formatActivityTime(row.createdAt)}
            </p>

            <p className="mt-3 text-xs font-semibold text-emerald-700">
              View activity detail →
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
