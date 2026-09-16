import type { ClassReport } from "@/lib/reports/class-report";
import { classInterpretationParagraph } from "@/lib/reports/class-report";

type Props = {
  report: ClassReport;
};

/**
 * The «what this means» paragraph.
 *
 * Built in `lib/reports/class-report.ts` from the figures in the tables above
 * it. There is no praise here, and no encouragement: when the numbers do not
 * support a conclusion the paragraph says exactly that.
 */
export function ClassReportInterpretation({ report }: Props) {
  return (
    <section className="print-keep">
      <h2 className="text-lg font-semibold text-slate-900">
        Эдгээр тоо юу хэлж байна вэ
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-800">
        {classInterpretationParagraph(report)}
      </p>
    </section>
  );
}
