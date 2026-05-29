import Link from "next/link";
import {
  ActivityBadge,
  EntityTypeBadge,
  formatActivityTime,
} from "@/components/admin/activity-badge";
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
          <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <ActivityBadge action={row.action} />
              <EntityTypeBadge entityType={row.entityType} />
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

            {!compact && Object.keys(row.metadata).length > 0 ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-emerald-700">
                  Metadata
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                  {JSON.stringify(row.metadata, null, 2)}
                </pre>
              </details>
            ) : null}

            {row.lessonId ? (
              <div className="mt-3">
                <Link
                  href={`/admin/lessons/${row.lessonId}/edit`}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Open lesson edit →
                </Link>
              </div>
            ) : null}
          </article>
        </li>
      ))}
    </ul>
  );
}
