import Link from "next/link";
import { CenterReportSheet } from "@/components/admin/center-report-sheet";
import { ReportActions } from "@/components/reports/report-actions";
import { ReportPrintStyles } from "@/components/reports/report-print-styles";
import {
  buildCenterReport,
  buildCenterReportMarkdown,
} from "@/lib/reports/center-report";
import { getTrainingCenterOverview } from "@/lib/supabase/admin-training-center";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Төвийн тайлан — Удирдлагын хэсэг",
  description:
    "Сургалтын төвийн хэвлэхэд бэлэн тайлан: бүлгүүд, багш нар, үнэлгээний тархалт.",
};

type Props = {
  searchParams: Promise<{ org?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AdminCenterReportPage({ searchParams }: Props) {
  const organizationId = firstValue((await searchParams).org);
  const overview = await getTrainingCenterOverview({ organizationId });
  const report = buildCenterReport(overview);
  const markdown = buildCenterReportMarkdown(report);

  return (
    <div className="flex flex-col gap-4">
      <ReportPrintStyles orientation="portrait" />

      <div
        data-print-hide
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <Link
          href={
            overview.selectedOrganizationId
              ? `/admin/center?org=${overview.selectedOrganizationId}`
              : "/admin/center"
          }
          className="text-sm font-medium text-slate-600 hover:text-emerald-700"
        >
          ← Сургалтын төв
        </Link>
        <ReportActions
          markdown={markdown}
          filename={`tuviin-tailan-${report.generatedAt.slice(0, 10)}.md`}
        />
      </div>

      <CenterReportSheet report={report} />

      <p data-print-hide className="text-xs text-slate-500">
        Хэвлэхэд хажуугийн цэс, товчнууд хасагдаж, A4 цаасанд хар цагаанаар
        буулгана. Байгууллагаар шүүхийн тулд хаягт <code>?org=</code> нэмнэ.
      </p>
    </div>
  );
}
