import type { ClassReport } from "@/lib/reports/class-report";
import { MISSING, dateTextLong } from "@/lib/reports/format";

type Props = {
  report: ClassReport;
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

export function ClassReportHeader({ report }: Props) {
  return (
    <header className="print-keep border-b border-slate-200 pb-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
        Бөөндөө Сурцгаая · Ангийн тайлан
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {report.classroomName}
      </h1>

      <dl className="print-grid mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <Field label="HSK түвшин" value={report.levelLabel ?? MISSING} />
        <Field label="Хичээллэх хэлбэр" value={report.deliveryLabel} />
        <Field label="Багш" value={report.teacherLabel ?? MISSING} />
        <Field label="Хуваарь" value={report.scheduleNote ?? MISSING} />
        <Field label="Хамрах хугацаа" value={report.periodLabel} />
        <Field
          label="Тайлан гаргасан"
          value={dateTextLong(report.generatedAt)}
        />
      </dl>

      {report.headerNotes.length > 0 ? (
        <ul className="mt-3 list-disc pl-5 text-xs leading-5 text-slate-600">
          {report.headerNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
