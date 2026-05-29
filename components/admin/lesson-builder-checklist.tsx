"use client";

import Link from "next/link";
import {
  MIN_QUIZ_FOR_PUBLISH,
  MIN_VOCABULARY_FOR_PUBLISH,
  type ImportQaStatus,
  type LessonContentQaReport,
} from "@/lib/admin/import-qa";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import {
  hasAudioUrl,
  hasThumbnailUrl,
  hasVideoUrl,
  isMediaReady,
} from "@/lib/lesson-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import type { LessonContent } from "@/types/lesson-content";

type StepStatus = "done" | "pending" | "warning" | "blocked";

type ChecklistStep = {
  number: number;
  title: string;
  description: string;
  status: StepStatus;
  statusLabel: string;
  href?: string;
  hrefLabel?: string;
  extraLinks?: { label: string; href: string }[];
};

type Props = {
  lesson: LessonContent | null;
  qaReport: LessonContentQaReport | null;
  loading?: boolean;
};

const statusStyles: Record<StepStatus, string> = {
  done: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  pending: "bg-slate-100 text-slate-600 ring-slate-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  blocked: "bg-red-50 text-red-800 ring-red-200",
};

function buildSteps(
  lesson: LessonContent | null,
  qaReport: LessonContentQaReport | null
): ChecklistStep[] {
  if (!lesson) {
    return [
      {
        number: 1,
        title: "Draft lesson",
        description: "Create lesson metadata",
        status: "pending",
        statusLabel: "No lesson selected",
        href: "/admin/lessons/new",
        hrefLabel: "Create draft →",
      },
      {
        number: 2,
        title: "Prompt",
        description: "Generate ChatGPT JSON prompt",
        status: "blocked",
        statusLabel: "Select a lesson first",
      },
      {
        number: 3,
        title: "Import content",
        description: "Paste/import subtitles, vocabulary, quiz",
        status: "blocked",
        statusLabel: "Select a lesson first",
      },
      {
        number: 4,
        title: "QA",
        description: "Check metadata, subtitles, vocabulary, quiz",
        status: "blocked",
        statusLabel: "Select a lesson first",
      },
      {
        number: 5,
        title: "Media",
        description: "Upload / attach media",
        status: "blocked",
        statusLabel: "Select a lesson first",
      },
      {
        number: 6,
        title: "Preview",
        description: "Admin preview lesson",
        status: "blocked",
        statusLabel: "Select a lesson first",
      },
      {
        number: 7,
        title: "Backup",
        description: "Export lesson JSON",
        status: "blocked",
        statusLabel: "Select a lesson first",
      },
      {
        number: 8,
        title: "Publish",
        description: "Publish when QA ready",
        status: "blocked",
        statusLabel: "Select a lesson first",
      },
      {
        number: 9,
        title: "Task review",
        description: "Review generated admin tasks",
        status: "blocked",
        statusLabel: "Select a lesson first",
        href: "/admin/tasks",
        hrefLabel: "Open task center →",
      },
    ];
  }

  const editHref = `/admin/lessons/${lesson.id}/edit`;
  const publishStatus = getAdminPublishStatus(lesson);
  const qaStatus: ImportQaStatus | null = qaReport?.status ?? null;
  const qaReady = qaStatus === "ready";
  const hasContent =
    (qaReport?.subtitleCount ?? 0) > 0 ||
    (qaReport?.vocabularyCount ?? 0) > 0 ||
    (qaReport?.quizCount ?? 0) > 0;

  const previewLinks = [
    {
      label: "Overview",
      href: lessonPreviewPath(lesson.id, { adminPreview: true }),
    },
    {
      label: "Watch",
      href: lessonPreviewPath(lesson.id, {
        adminPreview: true,
        subpath: "watch",
      }),
    },
    {
      label: "Vocabulary",
      href: lessonPreviewPath(lesson.id, {
        adminPreview: true,
        subpath: "vocabulary",
      }),
    },
    {
      label: "Quiz",
      href: lessonPreviewPath(lesson.id, {
        adminPreview: true,
        subpath: "quiz",
      }),
    },
  ];

  let step1Status: StepStatus = "warning";
  let step1Label = "Metadata incomplete";
  if (qaReport?.hasMetadata) {
    step1Status = "done";
    step1Label = "Draft created · metadata complete";
  } else if (lesson) {
    step1Status = "warning";
    step1Label = "Draft exists · fill metadata";
  }

  let step3Status: StepStatus = "pending";
  let step3Label = "No content imported yet";
  if (
    qaReport &&
    qaReport.subtitleCount > 0 &&
    qaReport.vocabularyCount >= MIN_VOCABULARY_FOR_PUBLISH &&
    qaReport.quizCount >= MIN_QUIZ_FOR_PUBLISH
  ) {
    step3Status = "done";
    step3Label = "Content imported";
  } else if (hasContent) {
    step3Status = "warning";
    step3Label = "Partial content — import or add more";
  }

  let step4Status: StepStatus = "pending";
  let step4Label = "Run QA check";
  if (qaStatus === "ready") {
    step4Status = "done";
    step4Label = "QA passed";
  } else if (qaStatus === "needs_review") {
    step4Status = "warning";
    step4Label = "Needs review";
  } else if (qaStatus === "missing_content") {
    step4Status = "pending";
    step4Label = "Missing content";
  }

  let step5Status: StepStatus = "pending";
  let step5Label = "Upload thumbnail, audio, or video";
  if (isMediaReady(lesson)) {
    step5Status = "done";
    step5Label = "Media ready (video attached)";
  } else if (
    hasVideoUrl(lesson) ||
    hasThumbnailUrl(lesson) ||
    hasAudioUrl(lesson)
  ) {
    step5Status = "warning";
    step5Label = "Partial media — add video for ready status";
  }

  let step7Status: StepStatus = "blocked";
  let step7Label = "QA must pass first";
  if (publishStatus === "available") {
    step7Status = "done";
    step7Label = "Published";
  } else if (qaReady) {
    step7Status = "warning";
    step7Label = "Ready to publish";
  }

  return [
    {
      number: 1,
      title: "Draft lesson",
      description: "Create lesson metadata",
      status: step1Status,
      statusLabel: step1Label,
      href: "/admin/lessons/new",
      hrefLabel: "New draft →",
      extraLinks: [{ label: "Edit metadata →", href: editHref }],
    },
    {
      number: 2,
      title: "Prompt",
      description: "Generate ChatGPT JSON prompt",
      status: "pending",
      statusLabel: "Manual — copy prompt in edit page",
      href: editHref,
      hrefLabel: "Open prompt generator →",
      extraLinks: [
        { label: "Prompt library →", href: "/admin/prompts" },
        {
          label: "Improve with prompts →",
          href: `${editHref}#content-improvement`,
        },
      ],
    },
    {
      number: 3,
      title: "Import content",
      description: "Paste/import subtitles, vocabulary, quiz",
      status: step3Status,
      statusLabel: step3Label,
      href: editHref,
      hrefLabel: "Bulk import →",
    },
    {
      number: 4,
      title: "QA",
      description: "Check metadata, subtitles, vocabulary, quiz",
      status: step4Status,
      statusLabel: step4Label,
      href: editHref,
      hrefLabel: "Import QA on edit page →",
      extraLinks: [
        {
          label: "Release checklist →",
          href: `${editHref}#release-readiness`,
        },
      ],
    },
    {
      number: 5,
      title: "Media",
      description: "Upload / attach media",
      status: step5Status,
      statusLabel: step5Label,
      href: editHref,
      hrefLabel: "Upload media →",
    },
    {
      number: 6,
      title: "Preview",
      description: "Admin preview lesson",
      status: hasContent || publishStatus === "available" ? "done" : "pending",
      statusLabel:
        hasContent || publishStatus === "available"
          ? "Preview available"
          : "Add content to preview",
      extraLinks: previewLinks,
    },
    {
      number: 7,
      title: "Backup",
      description: "Export lesson JSON",
      status: hasContent ? "pending" : "warning",
      statusLabel: hasContent
        ? "Export before publish or replace"
        : "Import content first",
      href: editHref,
      hrefLabel: "Export backup →",
    },
      {
        number: 8,
        title: "Publish",
        description: "Publish when QA ready",
        status: step7Status,
        statusLabel: step7Label,
        href: qaReady || publishStatus === "available" ? editHref : undefined,
        hrefLabel:
          publishStatus === "available"
            ? "Manage publish status →"
            : qaReady
              ? "Publishing controls →"
              : undefined,
        extraLinks: [
          {
            label: "Approve for publish →",
            href: `${editHref}#release-readiness`,
          },
        ],
      },
      {
        number: 9,
        title: "Task review",
        description: "Review generated admin tasks before publish",
        status:
          publishStatus === "available"
            ? "done"
            : hasContent
              ? "pending"
              : "blocked",
        statusLabel:
          publishStatus === "available"
            ? "Published — monitor analytics tasks"
            : hasContent
              ? "Check task center for blockers"
              : "Add content first",
        href: "/admin/tasks",
        hrefLabel: "Open task center →",
        extraLinks: [
          {
            label: `Tasks for lesson ${lesson.id} →`,
            href: `/admin/tasks?lessonId=${encodeURIComponent(lesson.id)}`,
          },
        ],
      },
    ];
}

export function LessonBuilderChecklist({
  lesson,
  qaReport,
  loading = false,
}: Props) {
  const steps = buildSteps(lesson, qaReport);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        Workflow checklist
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Draft → Prompt → Improve → Import → QA → Media → Preview → Backup →
        Publish
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Шалгаж байна…</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Step {step.number} — {step.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {step.description}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusStyles[step.status]}`}
                >
                  {step.statusLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
                {step.href && step.hrefLabel ? (
                  <Link
                    href={step.href}
                    className="text-emerald-700 hover:text-emerald-800"
                  >
                    {step.hrefLabel}
                  </Link>
                ) : null}
                {step.extraLinks?.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-slate-600 hover:text-emerald-700"
                  >
                    {link.label} →
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
