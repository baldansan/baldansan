"use client";

import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import {
  MIN_QUIZ_FOR_PUBLISH,
  MIN_VOCABULARY_FOR_PUBLISH,
  type ImportQaStatus,
  type LessonContentQaReport,
} from "@/lib/admin/import-qa";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  qaReport: LessonContentQaReport | null;
  loading?: boolean;
  loadError?: string | null;
};

function ReadinessBadge({ status }: { status: ImportQaStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
        —
      </span>
    );
  }

  const styles: Record<ImportQaStatus, string> = {
    ready: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    needs_review: "bg-amber-50 text-amber-800 ring-amber-200",
    missing_content: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  const labels: Record<ImportQaStatus, string> = {
    ready: "Ready",
    needs_review: "Needs review",
    missing_content: "Missing content",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function LessonPackageSummary({
  lesson,
  qaReport,
  loading = false,
  loadError = null,
}: Props) {
  const publishStatus = getAdminPublishStatus(lesson);
  const missingTranslationCount = qaReport
    ? qaReport.missingMongolianSubtitleCount +
      qaReport.missingMongolianVocabCount
    : null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Lesson package summary
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {lesson.title} · {lesson.chineseTitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LessonStatusBadge status={publishStatus} />
          <ReadinessBadge status={qaReport?.status ?? null} />
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">QA шалгаж байна…</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-800">{loadError}</p>
      ) : qaReport ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AdminSummaryCard
              label="Subtitles"
              value={qaReport.subtitleCount}
            />
            <AdminSummaryCard
              label="Vocabulary"
              value={qaReport.vocabularyCount}
              hint={`min ${MIN_VOCABULARY_FOR_PUBLISH} to publish`}
            />
            <AdminSummaryCard
              label="Quiz"
              value={qaReport.quizCount}
              hint={`min ${MIN_QUIZ_FOR_PUBLISH} to publish`}
            />
            <AdminSummaryCard
              label="Metadata"
              value={qaReport.hasMetadata ? "Complete" : "Incomplete"}
            />
          </div>

          <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <li>
              Missing Mongolian translations:{" "}
              {missingTranslationCount === 0 ? "none" : missingTranslationCount}
            </li>
            <li>
              Duplicate vocabulary:{" "}
              {qaReport.duplicateVocabularyChinese.length > 0
                ? qaReport.duplicateVocabularyChinese.join(", ")
                : "none"}
            </li>
            <li>
              Quiz answer mismatches: {qaReport.quizAnswerMismatchCount}
            </li>
            <li>
              Publish readiness:{" "}
              {qaReport.status === "ready" ? (
                <span className="font-medium text-emerald-700">Ready</span>
              ) : (
                <span className="font-medium text-amber-800">Needs review</span>
              )}
            </li>
          </ul>

          {Object.keys(qaReport.hskDistribution).length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                HSK distribution
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(qaReport.hskDistribution).map(([level, count]) => (
                  <span
                    key={level}
                    className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200"
                  >
                    {level}: {count}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {qaReport.errors.length > 0 ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
              <p className="font-semibold">Errors</p>
              <ul className="mt-2 list-inside list-disc">
                {qaReport.errors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {qaReport.warnings.length > 0 ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
              <p className="font-semibold">Warnings</p>
              <ul className="mt-2 max-h-32 list-inside list-disc overflow-auto">
                {qaReport.warnings.slice(0, 8).map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
                {qaReport.warnings.length > 8 ? (
                  <li>…and {qaReport.warnings.length - 8} more</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Select a lesson to view package summary.
        </p>
      )}
    </section>
  );
}
