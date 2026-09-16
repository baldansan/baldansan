import { DistributionBars } from "@/components/reports/distribution-bars";
import { LEARNER_GRADE_LABELS } from "@/lib/learner-grade";
import type { CenterReport } from "@/lib/reports/center-report";
import { MISSING, percentText } from "@/lib/reports/format";

type Props = {
  report: CenterReport;
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

export function CenterReportSummary({ report }: Props) {
  const totals = report.totals;

  return (
    <section className="print-keep">
      <h2 className="text-lg font-semibold text-slate-900">Төвийн хураангуй</h2>

      <div className="print-grid-stats mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Сурагч"
          value={String(totals.studentCount)}
          sub={`Апп-д холбогдсон ${totals.linkedStudentCount}`}
        />
        <Stat
          label="Дундаж үнэлгээ"
          value={
            totals.averageScore == null ? MISSING : `${totals.averageScore} оноо`
          }
          sub={
            totals.averageScore == null
              ? "Үнэлэх өгөгдөл хүрэлцэхгүй"
              : LEARNER_GRADE_LABELS[totals.averageGrade]
          }
        />
        <Stat
          label="Даалгаврын гүйцэтгэл"
          value={percentText(totals.completionRate)}
          sub={`Үнэлэгдсэн сурагч ${totals.ratedStudentCount}`}
        />
        <Stat
          label="Идэвхтэй сурагч"
          value={percentText(totals.activeShare)}
          sub={
            totals.activeStudentCount == null
              ? `Сүүлийн ${report.activityWindowDays} хоног — бүртгэл алга`
              : `${totals.activeStudentCount} сурагч, сүүлийн ${report.activityWindowDays} хоногт`
          }
        />
      </div>

      <h3 className="mt-5 text-sm font-semibold text-slate-900">
        Төвийн үнэлгээний тархалт
      </h3>
      <div className="mt-2">
        <DistributionBars
          distribution={report.distribution}
          note={report.distributionNote}
        />
      </div>

      {report.missingNotes.length > 0 || report.warnings.length > 0 ? (
        <div className="print-box mt-4 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <p className="text-xs font-semibold text-amber-900">
            Хэмжигдээгүй зүйлс
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs leading-5 text-amber-900">
            {[...report.missingNotes, ...report.warnings].map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
