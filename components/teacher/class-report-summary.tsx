import { DistributionBars } from "@/components/reports/distribution-bars";
import { LEARNER_GRADE_LABELS } from "@/lib/learner-grade";
import type { ClassReport } from "@/lib/reports/class-report";
import { MISSING, percentText } from "@/lib/reports/format";

type Props = {
  report: ClassReport;
};

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="print-box rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-slate-600">{sub}</p> : null}
    </div>
  );
}

export function ClassReportSummary({ report }: Props) {
  return (
    <section className="print-keep">
      <h2 className="text-lg font-semibold text-slate-900">Ангийн хураангуй</h2>

      <div className="print-grid-stats mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Сурагч"
          value={String(report.studentCount)}
          sub={`Апп-д холбогдсон ${report.linkedStudentCount}`}
        />
        <Stat
          label="Дундаж үнэлгээ"
          value={
            report.averageScore == null
              ? MISSING
              : `${report.averageScore} оноо`
          }
          sub={
            report.averageScore == null
              ? "Үнэлэх өгөгдөл хүрэлцэхгүй"
              : LEARNER_GRADE_LABELS[report.averageGrade]
          }
        />
        <Stat
          label="Даалгаврын гүйцэтгэл"
          value={percentText(report.completionRate)}
          sub={`Оноосон даалгавар ${report.assignmentCount}`}
        />
        <Stat
          label="Дасгалын дундаж"
          value={percentText(report.averageQuizPercent)}
          sub="Дуусгасан даалгаврын дүнгээр"
        />
      </div>

      <h3 className="mt-5 text-sm font-semibold text-slate-900">
        Үнэлгээний тархалт
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Үнэлгээ нийт {report.studentCount} сурагчийн дундаас{" "}
        {report.ratedStudentCount} сурагчид тооцогдсон.
      </p>
      <div className="mt-2">
        <DistributionBars distribution={report.distribution} />
      </div>

      {report.missingNotes.length > 0 ? (
        <div className="print-box mt-4 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <p className="text-xs font-semibold text-amber-900">
            Хэмжигдээгүй зүйлс
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs leading-5 text-amber-900">
            {report.missingNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
