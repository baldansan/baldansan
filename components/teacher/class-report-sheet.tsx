import { ClassReportHeader } from "@/components/teacher/class-report-header";
import { ClassReportInterpretation } from "@/components/teacher/class-report-interpretation";
import { ClassReportStudentTable } from "@/components/teacher/class-report-student-table";
import { ClassReportSummary } from "@/components/teacher/class-report-summary";
import type { ClassReport } from "@/lib/reports/class-report";

type Props = {
  report: ClassReport;
};

/** The printable document itself — everything inside `.print-sheet` is paper. */
export function ClassReportSheet({ report }: Props) {
  return (
    <article className="print-sheet mx-auto flex w-full max-w-[900px] flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
      <ClassReportHeader report={report} />
      <ClassReportSummary report={report} />
      <ClassReportInterpretation report={report} />
      <ClassReportStudentTable report={report} />
      <footer className="print-keep border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500">
        Бөөндөө Сурцгаая — сургалтын бүртгэлээс автоматаар гаргасан ангийн
        тайлан. Бүх тоо өгөгдлийн сангаас уншигдсан; хэмжигдээгүй зүйлийг «—»
        гэж тэмдэглэв.
      </footer>
    </article>
  );
}
