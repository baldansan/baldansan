import Link from "next/link";
import {
  CERTIFICATE_CRITERION_TEXT,
  CERTIFICATE_DISCLAIMER,
  CERTIFICATE_SCORE_TEXT,
} from "@/lib/reports/certificate";
import type { CertificateCandidate } from "@/lib/reports/certificate-data";
import { MISSING } from "@/lib/reports/format";

type Props = {
  candidates: CertificateCandidate[];
  /** How many rows exist before the display cap. */
  totalCandidates: number;
  query: string;
  warnings: string[];
  notFound: string | null;
};

/**
 * Who can be issued a certificate, and for which course.
 *
 * The list is built from real progress rows — a student appears only when they
 * have at least one completed lesson in a course — so it is a starting point,
 * not a promise: whether the certificate is actually issued is decided by the
 * check on the next page.
 */
export function CertificatePicker({
  candidates,
  totalCandidates,
  query,
  warnings,
  notFound,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">
          Бичиг ямар болзлоор олгогддог вэ
        </h2>
        <ol className="mt-2 list-decimal pl-5 text-sm leading-6 text-slate-700">
          {CERTIFICATE_CRITERION_TEXT.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-slate-700">{CERTIFICATE_SCORE_TEXT}</p>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {CERTIFICATE_DISCLAIMER}
        </p>
      </section>

      {notFound ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {notFound}
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">
          Хичээл дуусгасан сурагчид
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Дор хаяж нэг хичээлээ дуусгасан сурагчид энд харагдана. Курс дээр
          дарвал болзол шалгагдаж, хангасан бол бичиг хэвлэгдэнэ.
        </p>

        <form method="get" className="mt-3 flex flex-wrap gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Сурагчийн нэрээр хайх…"
            aria-label="Сурагчийн нэрээр хайх"
            className="min-w-[220px] flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Хайх
          </button>
        </form>

        {candidates.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            {totalCandidates === 0
              ? "Нэг ч сурагч хичээл дуусгасан бүртгэлгүй байна — олгох бичиг алга."
              : "Энэ хайлтад тохирох сурагч олдсонгүй."}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {candidates.map((candidate) => (
              <li
                key={candidate.userId}
                className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {candidate.name ?? MISSING}
                  {candidate.name ? null : (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      нэр бүртгэгдээгүй — бичиг олгох боломжгүй
                    </span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.courses.map((course) => (
                    <Link
                      key={course.courseId}
                      href={`/admin/center/certificate?user=${encodeURIComponent(candidate.userId)}&course=${encodeURIComponent(course.courseId)}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                    >
                      {course.courseTitle} · {course.completedLessons}/
                      {course.publishedLessonCount ?? MISSING} хичээл
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}

        {candidates.length > 0 && candidates.length < totalCandidates ? (
          <p className="mt-3 text-xs text-slate-500">
            {totalCandidates} сурагчийн эхний {candidates.length} нь харагдаж
            байна. Нэрээр хайж нарийвчилна уу.
          </p>
        ) : null}
      </section>
    </div>
  );
}
