import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type { StudentProgressRow } from "@/lib/teacher/analytics-types";

type Props = {
  rows: StudentProgressRow[];
};

export function ClassProgressTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">No students in this class.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Student</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Completed</th>
            <th className="px-4 py-3">Rate</th>
            <th className="px-4 py-3">Latest quiz</th>
            <th className="px-4 py-3">Words</th>
            <th className="px-4 py-3">Last activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((s) => (
            <tr key={s.studentRowId}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{s.displayName}</div>
                {s.email ? (
                  <div className="text-xs text-slate-500">{s.email}</div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-slate-600">{s.status}</td>
              <td className="px-4 py-3 text-slate-600">
                {s.progressUnavailable
                  ? "—"
                  : `${s.assignmentsCompleted}/${s.assignmentsAssigned}`}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {s.progressUnavailable ? "—" : `${s.completionRate}%`}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {s.latestQuizPercentage != null ? `${s.latestQuizPercentage}%` : "—"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {s.learnedWordsCount != null ? s.learnedWordsCount : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {s.lastActivityAt
                  ? formatMongoliaDateTimeWithLabel(s.lastActivityAt, "date")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
