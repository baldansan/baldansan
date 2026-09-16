import { GradeChip } from "@/components/reports/grade-chip";
import type { CenterReport } from "@/lib/reports/center-report";
import { MISSING, deliveryModeText, percentText } from "@/lib/reports/format";

type Props = {
  report: CenterReport;
};

export function CenterReportClasses({ report }: Props) {
  if (report.rankedClasses.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Бүлгүүдийн харьцуулалт
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Энэ шүүлтэд бүлэг алга тул харьцуулах зүйл алга.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">
        Бүлгүүдийн харьцуулалт
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Дундаж үнэлгээгээр эрэмбэлэв. Үнэлгээгүй бүлэг доор байрлана.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="px-2 py-2 font-semibold">Бүлэг</th>
              <th className="px-2 py-2 font-semibold">Түвшин</th>
              <th className="px-2 py-2 font-semibold">Хэлбэр</th>
              <th className="px-2 py-2 font-semibold">Багш</th>
              <th className="px-2 py-2 text-right font-semibold">Сурагч</th>
              <th className="px-2 py-2 text-right font-semibold">Даалгавар</th>
              <th className="px-2 py-2 text-right font-semibold">Гүйцэтгэл</th>
              <th className="px-2 py-2 text-right font-semibold">Дундаж</th>
              <th className="px-2 py-2 font-semibold">Үнэлгээ</th>
            </tr>
          </thead>
          <tbody>
            {report.rankedClasses.map((row) => (
              <tr
                key={row.classroomId}
                className="border-b border-slate-200 align-top"
              >
                <td className="px-2 py-2">
                  <span className="font-medium text-slate-900">{row.name}</span>
                  {row.organizationName ? (
                    <span className="block text-[11px] text-slate-500">
                      {row.organizationName}
                    </span>
                  ) : null}
                </td>
                <td className="px-2 py-2">{row.levelLabel ?? MISSING}</td>
                <td className="px-2 py-2">
                  {deliveryModeText(row.deliveryMode)}
                </td>
                <td className="px-2 py-2">{row.teacherLabel}</td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {row.studentCount}
                  <span className="block text-[11px] text-slate-500">
                    холбогдсон {row.linkedStudentCount}
                  </span>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {row.assignmentCount}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {percentText(row.completionRate)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {row.averageScore ?? MISSING}
                  <span className="block text-[11px] text-slate-500">
                    {row.ratedStudentCount}/{row.linkedStudentCount} үнэлэгдсэн
                  </span>
                </td>
                <td className="px-2 py-2">
                  <GradeChip grade={row.averageGrade} variant="short" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report.rankedClasses.some((row) => row.notes.length > 0) ? (
        <div className="print-keep mt-3">
          <p className="text-xs font-semibold text-slate-700">
            Бүлгүүдийн тайлбар
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs leading-5 text-slate-600">
            {report.rankedClasses.flatMap((row) =>
              row.notes.map((note) => (
                <li key={`${row.classroomId}:${note}`}>
                  <span className="font-medium">{row.name}:</span> {note}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
