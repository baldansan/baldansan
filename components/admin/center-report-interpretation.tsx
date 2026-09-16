import type { CenterReport } from "@/lib/reports/center-report";
import { centerInterpretationParagraph } from "@/lib/reports/center-report";

type Props = {
  report: CenterReport;
};

export function CenterReportInterpretation({ report }: Props) {
  return (
    <section className="print-keep">
      <h2 className="text-lg font-semibold text-slate-900">
        Эдгээр тоо юу хэлж байна вэ
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-800">
        {centerInterpretationParagraph(report)}
      </p>
    </section>
  );
}
