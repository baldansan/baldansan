import { CenterReportClasses } from "@/components/admin/center-report-classes";
import { CenterReportHeader } from "@/components/admin/center-report-header";
import { CenterReportInterpretation } from "@/components/admin/center-report-interpretation";
import { CenterReportSummary } from "@/components/admin/center-report-summary";
import { CenterReportTeachers } from "@/components/admin/center-report-teachers";
import type { CenterReport } from "@/lib/reports/center-report";

type Props = {
  report: CenterReport;
};

/** The printable document itself — everything inside `.print-sheet` is paper. */
export function CenterReportSheet({ report }: Props) {
  return (
    <article className="print-sheet mx-auto flex w-full max-w-[980px] flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
      <CenterReportHeader report={report} />
      <CenterReportSummary report={report} />
      <CenterReportInterpretation report={report} />
      <CenterReportClasses report={report} />
      <CenterReportTeachers report={report} />
      <footer className="print-keep border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500">
        Бөөндөө Сурцгаая — сургалтын бүртгэлээс автоматаар гаргасан төвийн
        тайлан. Бүх тоо өгөгдлийн сангаас уншигдсан; хэмжигдээгүй зүйлийг «—»
        гэж тэмдэглэв, тэг гэж бичээгүй.
      </footer>
    </article>
  );
}
