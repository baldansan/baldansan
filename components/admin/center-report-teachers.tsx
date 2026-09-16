import { GradeChip } from "@/components/reports/grade-chip";
import type { CenterReport } from "@/lib/reports/center-report";
import { TEACHER_COMPARISON_CAVEAT } from "@/lib/reports/center-report";
import { MISSING, percentText } from "@/lib/reports/format";

type Props = {
  report: CenterReport;
};

export function CenterReportTeachers({ report }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">
        Багш нарын харьцуулалт
      </h2>

      {/* Printed with the table, not only shown in the app: a director reading
          this on paper has to see the caveat next to the numbers. */}
      <p className="print-box mt-2 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-700 ring-1 ring-slate-200">
        {TEACHER_COMPARISON_CAVEAT}
      </p>

      {report.teachers.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          Багш оноогдсон бүлэг алга тул харьцуулах зүйл алга.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-600">
                <th className="px-2 py-2 font-semibold">Багш</th>
                <th className="px-2 py-2 font-semibold">Бүлгүүд</th>
                <th className="px-2 py-2 text-right font-semibold">Сурагч</th>
                <th className="px-2 py-2 text-right font-semibold">
                  Үнэлэгдсэн
                </th>
                <th className="px-2 py-2 text-right font-semibold">Дундаж</th>
                <th className="px-2 py-2 font-semibold">Үнэлгээ</th>
                <th className="px-2 py-2 text-right font-semibold">
                  Гүйцэтгэл
                </th>
              </tr>
            </thead>
            <tbody>
              {report.teachers.map((row) => (
                <tr
                  key={row.teacherUserId}
                  className="border-b border-slate-200 align-top"
                >
                  <td className="px-2 py-2 font-medium text-slate-900">
                    {row.teacherLabel}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-600">
                    {row.classes.length === 0
                      ? MISSING
                      : row.classes
                          .map(
                            (klass) =>
                              `${klass.name}${
                                klass.levelLabel ? ` (${klass.levelLabel})` : ""
                              }`
                          )
                          .join(", ")}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {row.studentCount}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {row.ratedStudentCount}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {row.averageScore ?? MISSING}
                  </td>
                  <td className="px-2 py-2">
                    <GradeChip grade={row.averageGrade} variant="short" />
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {percentText(row.completionRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
