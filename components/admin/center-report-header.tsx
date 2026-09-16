import type { CenterReport } from "@/lib/reports/center-report";
import { dateTextLong } from "@/lib/reports/format";

type Props = {
  report: CenterReport;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export function CenterReportHeader({ report }: Props) {
  return (
    <header className="print-keep border-b border-slate-200 pb-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
        Бөөндөө Сурцгаая · Сургалтын төвийн тайлан
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {report.centerName}
      </h1>

      <dl className="print-grid mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <Field
          label="Хамрах хүрээ"
          value={
            report.wholeCenter
              ? `Бүх байгууллага (${report.organizationCount})`
              : report.centerName
          }
        />
        <Field label="Бүлэг" value={String(report.totals.classroomCount)} />
        <Field label="Багш" value={String(report.totals.teacherCount)} />
        <Field
          label="Идэвхийн хугацаа"
          value={`Сүүлийн ${report.activityWindowDays} хоног`}
        />
        <Field
          label="Тайлан гаргасан"
          value={dateTextLong(report.generatedAt)}
        />
      </dl>
    </header>
  );
}
