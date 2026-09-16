import {
  CERTIFICATE_CRITERION_TEXT,
  CERTIFICATE_DISCLAIMER,
  CERTIFICATE_SCORE_TEXT,
} from "@/lib/reports/certificate";
import type { CertificateSubject } from "@/lib/reports/certificate-data";
import { LEARNER_GRADE_LABELS } from "@/lib/learner-grade";
import { MISSING, dateTextLong } from "@/lib/reports/format";

type Props = {
  subject: CertificateSubject;
  /** When the document was produced. */
  issuedAt: string;
};

/**
 * The certificate itself, printed on A4 landscape.
 *
 * Deliberately plain. There is no seal, no registry number, no issuing body
 * and no signature block for anyone the app cannot name — a course-completion
 * record from a private learning app should look like one, and anything that
 * imitates an official document would be a forgery aid rather than a feature.
 * The criterion it was issued under is printed on the face of it, so a reader
 * can judge what the document is worth without asking.
 */
export function CertificateSheet({ subject, issuedAt }: Props) {
  const evaluation = subject.evaluation;
  const input = subject.input;

  return (
    <article className="print-sheet mx-auto w-full max-w-[1000px] rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-6">
      <div className="print-box print-keep flex flex-col gap-6 border-2 border-slate-900 px-8 py-8 sm:px-14 sm:py-12">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            Бөөндөө Сурцгаая
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Курс дүүргэлтийн бичиг
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Аппын сургалтын бүртгэлд үндэслэн гаргав
          </p>
        </header>

        <div className="text-center">
          <p className="text-sm text-slate-700">Энэхүү бичгийг</p>
          <p className="mt-2 border-b border-slate-400 pb-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {subject.studentName ?? MISSING}
          </p>
          <p className="mt-4 text-sm text-slate-700">
            нь дараах курсын шаардлагыг хангасан тул олгов:
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {subject.courseTitle}
          </p>
          {subject.classroomNames.length > 0 ? (
            <p className="mt-1 text-xs text-slate-600">
              Бүлэг: {subject.classroomNames.join(", ")}
            </p>
          ) : null}
        </div>

        <dl className="print-grid mx-auto grid w-full max-w-[720px] grid-cols-1 gap-4 text-center sm:grid-cols-3">
          <div className="print-box rounded-xl px-4 py-3 ring-1 ring-slate-200">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Дуусгасан хичээл
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">
              {input.completedLessonCount == null ||
              input.courseLessonCount == null
                ? MISSING
                : `${input.completedLessonCount} / ${input.courseLessonCount}`}
            </dd>
            <dd className="text-xs text-slate-600">
              {evaluation.lessonSharePercent == null
                ? "Хувь тооцогдоогүй"
                : `${evaluation.lessonSharePercent}%`}
            </dd>
          </div>
          <div className="print-box rounded-xl px-4 py-3 ring-1 ring-slate-200">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Дасгалын дундаж
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">
              {input.quizAveragePercent == null
                ? MISSING
                : `${input.quizAveragePercent}%`}
            </dd>
            <dd className="text-xs text-slate-600">
              {input.quizAttemptCount == null
                ? "Оролдлого уншигдаагүй"
                : `${input.quizAttemptCount} удаа`}
            </dd>
          </div>
          <div className="print-box rounded-xl px-4 py-3 ring-1 ring-slate-200">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Курсын дүн
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">
              {evaluation.courseScore == null
                ? MISSING
                : `${evaluation.courseScore} оноо`}
            </dd>
            <dd className="text-xs text-slate-600">
              {LEARNER_GRADE_LABELS[evaluation.grade]}
            </dd>
          </div>
        </dl>

        <div className="print-grid-pair mt-2 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-600">Олгосон огноо</p>
            <p className="mt-1 border-b border-slate-400 pb-1 text-sm font-semibold text-slate-900">
              {dateTextLong(issuedAt)}
            </p>
            {subject.lastCompletedAt ? (
              <p className="mt-1 text-[11px] text-slate-500">
                Сүүлийн хичээл дуусгасан: {dateTextLong(subject.lastCompletedAt)}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-slate-600">Багш / сургалтын менежер</p>
            <p className="mt-1 h-6 border-b border-slate-400" />
            <p className="mt-1 text-[11px] text-slate-500">
              Гарын үсэг, нэр — гараар бөглөнө
            </p>
          </div>
        </div>

        <footer className="border-t border-slate-300 pt-3 text-[10px] leading-4 text-slate-600">
          <p className="font-semibold text-slate-700">
            Энэ бичиг ямар болзлоор олгогдов:
          </p>
          <ol className="mt-1 list-decimal pl-4">
            {CERTIFICATE_CRITERION_TEXT.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
          <p className="mt-1">{CERTIFICATE_SCORE_TEXT}</p>
          <p className="mt-2">{CERTIFICATE_DISCLAIMER}</p>
        </footer>
      </div>
    </article>
  );
}
