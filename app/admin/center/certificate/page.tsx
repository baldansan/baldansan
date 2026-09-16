import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CertificatePicker } from "@/components/reports/certificate-picker";
import { CertificateRefusal } from "@/components/reports/certificate-refusal";
import { CertificateSheet } from "@/components/reports/certificate-sheet";
import { ReportPrintStyles } from "@/components/reports/report-print-styles";
import { getCertificateData } from "@/lib/reports/certificate-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Курс дүүргэлтийн бичиг — Удирдлагын хэсэг",
  description:
    "Курсаа дүүргэсэн сурагчид олгох, A4 хэвтээ хэвлэхэд бэлэн курс дүүргэлтийн бичиг.",
};

/** Rows shown before the picker asks the director to search instead. */
const CANDIDATE_DISPLAY_LIMIT = 60;

type Props = {
  searchParams: Promise<{
    user?: string | string[];
    course?: string | string[];
    q?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AdminCertificatePage({ searchParams }: Props) {
  const params = await searchParams;
  const userId = firstValue(params.user);
  const courseId = firstValue(params.course);
  const query = (firstValue(params.q) ?? "").trim();

  const data = await getCertificateData({ userId, courseId });
  const issuedAt = new Date().toISOString();

  if (data.subject) {
    const subject = data.subject;
    const studentLabel = subject.studentName ?? "Нэр бүртгэгдээгүй сурагч";

    return (
      <div className="flex flex-col gap-4">
        <ReportPrintStyles orientation="landscape" />

        <div
          data-print-hide
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <Link
            href="/admin/center/certificate"
            className="text-sm font-medium text-slate-600 hover:text-emerald-700"
          >
            ← Сурагч сонгох
          </Link>
          {subject.evaluation.eligible ? (
            <PrintHint />
          ) : (
            <span className="text-xs font-semibold text-red-700">
              Болзол хангаагүй тул хэвлэх боломжгүй
            </span>
          )}
        </div>

        {data.warnings.length > 0 ? (
          <div
            data-print-hide
            className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900"
          >
            {data.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}

        {subject.evaluation.eligible ? (
          <CertificateSheet subject={subject} issuedAt={issuedAt} />
        ) : (
          <CertificateRefusal
            studentLabel={studentLabel}
            courseTitle={subject.courseTitle}
            evaluation={subject.evaluation}
          />
        )}
      </div>
    );
  }

  const filtered = query
    ? data.candidates.filter((candidate) =>
        (candidate.name ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : data.candidates;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Курс дүүргэлтийн бичиг"
        description="Курсаа дүүргэсэн сурагчид олгох бичиг. Болзлыг өгөгдлийн сангийн бүртгэлээр шалгана — хангаагүй бол бичиг хэвлэгдэхгүй, юу дутуу байгааг шууд харуулна."
      />
      <CertificatePicker
        candidates={filtered.slice(0, CANDIDATE_DISPLAY_LIMIT)}
        totalCandidates={filtered.length}
        query={query}
        warnings={data.warnings}
        notFound={data.notFound}
      />
    </div>
  );
}

function PrintHint() {
  return (
    <span className="text-xs text-slate-500">
      Хэвлэхдээ A4, хэвтээ (landscape) сонгоно уу — Ctrl/Cmd + P.
    </span>
  );
}
