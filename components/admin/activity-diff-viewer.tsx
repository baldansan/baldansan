import {
  formatDiffValue,
  getActivityDiff,
  type ActivityDiffResult,
} from "@/lib/admin/admin-activity-diff";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

type Props = {
  activity: AdminActivityRow;
  diff?: ActivityDiffResult;
};

export function ActivityDiffViewer({ activity, diff }: Props) {
  const result = diff ?? getActivityDiff(activity);

  if (!result.hasDiff) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900">Field diff</h3>
        <p className="mt-2 text-sm text-slate-600">
          No field-level diff available.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">Field diff</h3>
      <p className="mt-1 text-xs text-slate-500">
        Shallow comparison of before and after snapshots.
      </p>

      {result.changed.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Changed
          </h4>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Field</th>
                  <th className="py-2 pr-4 font-semibold">Before</th>
                  <th className="py-2 font-semibold">After</th>
                </tr>
              </thead>
              <tbody>
                {result.changed.map((row) => (
                  <tr key={row.field} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono text-xs text-slate-700">
                      {row.field}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {formatDiffValue(row.before)}
                    </td>
                    <td className="py-2 text-emerald-800">
                      {formatDiffValue(row.after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {result.added.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Added fields
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {result.added.map((row) => (
              <li key={row.field}>
                <span className="font-mono text-xs">{row.field}</span>
                {" → "}
                {formatDiffValue(row.after)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.removed.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Removed fields
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {result.removed.map((row) => (
              <li key={row.field}>
                <span className="font-mono text-xs">{row.field}</span>
                {" was "}
                {formatDiffValue(row.before)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
