import {
  CERTIFICATE_DISCLAIMER,
  type CertificateEvaluation,
  type CertificateRequirementStatus,
} from "@/lib/reports/certificate";

type Props = {
  studentLabel: string;
  courseTitle: string;
  evaluation: CertificateEvaluation;
};

const STATUS_LABEL: Record<CertificateRequirementStatus, string> = {
  met: "Хангасан",
  unmet: "Хангаагүй",
  unknown: "Шалгах өгөгдөл алга",
};

const STATUS_TONE: Record<CertificateRequirementStatus, string> = {
  met: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  unmet: "bg-red-50 text-red-800 ring-red-200",
  unknown: "bg-slate-100 text-slate-700 ring-slate-200",
};

/**
 * Shown instead of the certificate when the student does not qualify.
 *
 * It names every rule, says which one failed and what the data shows, so the
 * refusal is checkable rather than a shrug. A rule that could not be evaluated
 * counts against issuing, never for it.
 */
export function CertificateRefusal({
  studentLabel,
  courseTitle,
  evaluation,
}: Props) {
  return (
    <section className="mx-auto w-full max-w-[820px] rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-700">
        Бичиг олгох боломжгүй
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {studentLabel} · {courseTitle}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Энэ сурагч тухайн курсын дүүргэлтийн болзлыг бүрэн хангаагүй тул курс
        дүүргэлтийн бичиг хэвлэгдэхгүй. Дутуу зүйлийг доор тодорхой бичив.
      </p>

      <ul className="mt-5 flex flex-col gap-3">
        {evaluation.requirements.map((requirement) => (
          <li
            key={requirement.key}
            className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">
                {requirement.label}
              </p>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STATUS_TONE[requirement.status]}`}
              >
                {STATUS_LABEL[requirement.status]}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">{requirement.detail}</p>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        {CERTIFICATE_DISCLAIMER}
      </p>
    </section>
  );
}
