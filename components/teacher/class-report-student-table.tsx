import { GradeChip } from "@/components/reports/grade-chip";
import type { ClassReport } from "@/lib/reports/class-report";
import { MISSING, dateText, percentText } from "@/lib/reports/format";

type Props = {
  report: ClassReport;
};

export function ClassReportStudentTable({ report }: Props) {
  if (report.students.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Сурагч бүрээр</h2>
        <p className="mt-2 text-sm text-slate-600">
          Ангид бүртгэлтэй сурагч алга.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">Сурагч бүрээр</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="px-2 py-2 font-semibold">Сурагч</th>
              <th className="px-2 py-2 font-semibold">Үнэлгээ</th>
              <th className="px-2 py-2 text-right font-semibold">Оноо</th>
              <th className="px-2 py-2 text-right font-semibold">Гүйцэтгэл</th>
              <th className="px-2 py-2 text-right font-semibold">
                Дасгалын дээд оноо
              </th>
              <th className="px-2 py-2 text-right font-semibold">Сурсан үг</th>
              <th className="px-2 py-2 text-right font-semibold">
                Сүүлийн бүртгэл
              </th>
            </tr>
          </thead>
          <tbody>
            {report.students.map((student) => (
              <tr
                key={student.rowId}
                className="border-b border-slate-200 align-top"
              >
                <td className="px-2 py-2">
                  <span className="font-medium text-slate-900">
                    {student.name}
                  </span>
                  {!student.linked ? (
                    <span className="block text-[11px] text-slate-500">
                      Апп-д холбогдоогүй — хэмжилт алга
                    </span>
                  ) : null}
                </td>
                <td className="px-2 py-2">
                  <GradeChip grade={student.grade} variant="short" />
                  {/* An unlinked row already says why it has no data — repeating
                      "no assignments, no quizzes" there would misdescribe it. */}
                  {student.linked && student.score.unratedReason ? (
                    <span className="block text-[11px] text-slate-500">
                      {student.score.unratedReason}
                    </span>
                  ) : null}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {student.score.total ?? MISSING}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {student.completionRate == null
                    ? MISSING
                    : `${student.assignmentsCompleted}/${student.assignmentsAssigned} · ${student.completionRate}%`}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {percentText(student.bestQuizPercent)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {student.learnedWords ?? MISSING}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {dateText(student.lastRecordAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-3 list-disc pl-5 text-xs leading-5 text-slate-600">
        <li>
          «—» гэдэг нь хэмжилт байхгүй гэсэн үг. Тэг гэсэн үг биш.
        </li>
        <li>
          «Дасгалын дээд оноо» нь тухайн сурагчийн даалгаврын дүнгээс хамгийн
          өндөр нь.
        </li>
        <li>
          «Сүүлийн бүртгэл» нь даалгаврын дүн хамгийн сүүлд бүртгэгдсэн огноо —
          апп ашигласан бүх үйлдлийг хамрахгүй.
        </li>
      </ul>
    </section>
  );
}
