"use client";

import Link from "next/link";
import { useMemo } from "react";
import { calculateReleaseReadiness } from "@/lib/admin/release-readiness";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
};

type CheckRow = {
  label: string;
  ready: boolean;
  recommended?: boolean;
  hint: string;
  href?: string;
  hrefLabel?: string;
};

function CheckIcon({ ok, recommended }: { ok: boolean; recommended?: boolean }) {
  if (ok) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        ✓
      </span>
    );
  }
  if (recommended) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800">
        !
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      —
    </span>
  );
}

export function ReleaseReadinessCard({ lesson }: Props) {
  const readiness = useMemo(
    () => calculateReleaseReadiness(lesson),
    [lesson]
  );

  const prelesson = isPrelessonPackage(lesson);
  const adminPreview = lesson.publishStatus !== "available";
  const editHref = `/admin/lessons/${lesson.id}/edit`;

  const rows: CheckRow[] = [
    {
      label: "Metadata",
      ready: readiness.metadataReady,
      hint: readiness.metadataReady ? "OK" : "Title, Chinese title, summary",
      href: editHref,
      hrefLabel: "Edit metadata",
    },
    {
      label: prelesson ? "Subtitles (optional)" : "Subtitles",
      ready: readiness.subtitlesReady,
      recommended: prelesson && !readiness.subtitlesReady,
      hint: readiness.subtitlesReady
        ? `${lesson.timedSubtitles.length} lines`
        : prelesson
          ? "PreLesson: subtitles optional"
          : "Import or add subtitles",
      href: editHref,
      hrefLabel: "Bulk import",
    },
    {
      label: "Vocabulary",
      ready: readiness.vocabularyReady,
      hint: `${lesson.vocabulary.length} words (min 5)`,
      href: editHref,
      hrefLabel: "Edit vocabulary",
    },
    {
      label: "Quiz",
      ready: readiness.quizReady,
      hint: `${lesson.quizQuestions.length} questions (min 3)`,
      href: editHref,
      hrefLabel: "Edit quiz",
    },
    {
      label: "Media",
      ready: readiness.mediaReady,
      hint: readiness.mediaReady ? "Media ready" : "Upload video or set media_status",
      href: editHref,
      hrefLabel: "Media upload",
    },
    {
      label: "QA",
      ready: readiness.qaReady,
      hint: readiness.qaReady ? "Content QA passed" : "Fix import QA issues",
      href: editHref,
      hrefLabel: "Import QA",
    },
    {
      label: "Backup",
      ready: false,
      recommended: readiness.backupRecommended,
      hint: "Export JSON backup before publish",
      href: editHref,
      hrefLabel: "Export backup",
    },
    {
      label: "Preview",
      ready: false,
      recommended: readiness.previewRecommended,
      hint: "Admin preview all lesson routes",
      href: lessonPreviewPath(lesson.id, { adminPreview }),
      hrefLabel: "Preview lesson",
    },
    {
      label: "Approval",
      ready: readiness.approvalReady,
      hint: readiness.approvalReady
        ? `Approved${lesson.approvedAt ? "" : ""}`
        : "Mark QA passed → Approve for publish",
      href: editHref,
      hrefLabel: "Approval controls",
    },
  ];

  return (
    <section
      id="release-readiness"
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
    >
      <h2 className="text-base font-semibold text-slate-900">Release readiness</h2>
      <p className="mt-1 text-sm text-slate-600">
        Publish хийхээс өмнөх checklist.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {readiness.readyToPublish ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            Ready to publish
          </span>
        ) : readiness.readyToApprove ? (
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
            Ready to approve
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            Needs review
          </span>
        )}
      </div>

      <ul className="mt-4 divide-y divide-slate-100">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex flex-wrap items-start gap-3 py-3 first:pt-0"
          >
            <CheckIcon ok={row.ready} recommended={row.recommended} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{row.label}</p>
              <p className="text-xs text-slate-500">{row.hint}</p>
              {row.href && !row.ready ? (
                <Link
                  href={row.href}
                  className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:text-emerald-800"
                >
                  {row.hrefLabel} →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {readiness.issues.length > 0 ? (
        <ul className="mt-4 list-inside list-disc text-xs text-red-800">
          {readiness.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
      {readiness.warnings.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-amber-800">
          {readiness.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
