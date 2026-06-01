import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type { AssignmentStudentResultRow } from "@/lib/teacher/analytics-types";

type Props = {
  rows: AssignmentStudentResultRow[];
};

export function AssignmentProgressTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">No students enrolled.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Student</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Quiz</th>
            <th className="px-4 py-3">Completed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((r, i) => (
            <tr key={`${r.displayName}-${i}`}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{r.displayName}</div>
                {r.email ? (
                  <div className="text-xs text-slate-500">{r.email}</div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-slate-600">{r.status}</td>
              <td className="px-4 py-3 text-slate-600">
                {r.quizPercentage != null
                  ? `${r.quizPercentage}% (${r.quizScore ?? "—"}/${r.quizTotal ?? "—"})`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {r.completedAt
                  ? formatMongoliaDateTimeWithLabel(r.completedAt)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
