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
        title: "Ноорог хичээл",
        description: "Хичээлийн ерөнхий мэдээллийг үүсгэх",
        status: "pending",
        statusLabel: "Хичээл сонгоогүй",
        href: "/admin/lessons/new",
        hrefLabel: "Ноорог үүсгэх →",
      },
      {
        number: 2,
        title: "Prompt",
        description: "ChatGPT-д өгөх JSON prompt бэлдэх",
        status: "blocked",
        statusLabel: "Эхлээд хичээл сонгоно уу",
      },
      {
        number: 3,
        title: "Контент оруулах",
        description: "Хадмал, үгсийн сан, дасгалыг оруулах",
        status: "blocked",
        statusLabel: "Эхлээд хичээл сонгоно уу",
      },
      {
        number: 4,
        title: "Чанарын шалгалт",
        description: "Ерөнхий мэдээлэл, хадмал, үгсийн сан, дасгалыг шалгах",
        status: "blocked",
        statusLabel: "Эхлээд хичээл сонгоно уу",
      },
      {
        number: 5,
        title: "Медиа",
        description: "Медиа байршуулах, холбох",
        status: "blocked",
        statusLabel: "Эхлээд хичээл сонгоно уу",
      },
      {
        number: 6,
        title: "Урьдчилж харах",
        description: "Хичээлийг админаар урьдчилж харах",
        status: "blocked",
        statusLabel: "Эхлээд хичээл сонгоно уу",
      },
      {
        number: 7,
        title: "Нөөц хуулбар",
        description: "Хичээлийн JSON-г гаргах",
        status: "blocked",
        statusLabel: "Эхлээд хичээл сонгоно уу",
      },
      {
        number: 8,
        title: "Нийтлэх",
        description: "Шалгалт давсны дараа нийтлэх",
        status: "blocked",
        statusLabel: "Эхлээд хичээл сонгоно уу",
      },
      {
        number: 9,
        title: "Ажлын шалгалт",
        description: "Үүссэн админы ажлуудыг шалгах",
        status: "blocked",
        statusLabel: "Эхлээд хичээл сонгоно уу",
        href: "/admin/tasks",
        hrefLabel: "Ажлын төв нээх →",
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
      label: "Тойм",
      href: lessonPreviewPath(lesson.id, { adminPreview: true }),
    },
    {
      label: "Бичлэг үзэх",
      href: lessonPreviewPath(lesson.id, {
        adminPreview: true,
        subpath: "watch",
      }),
    },
    {
      label: "Үгсийн сан",
      href: lessonPreviewPath(lesson.id, {
        adminPreview: true,
        subpath: "vocabulary",
      }),
    },
    {
      label: "Дасгал",
      href: lessonPreviewPath(lesson.id, {
        adminPreview: true,
        subpath: "quiz",
      }),
    },
  ];

  let step1Status: StepStatus = "warning";
  let step1Label = "Ерөнхий мэдээлэл дутуу";
  if (qaReport?.hasMetadata) {
    step1Status = "done";
    step1Label = "Ноорог үүссэн · мэдээлэл бүрэн";
  } else if (lesson) {
    step1Status = "warning";
    step1Label = "Ноорог байна · мэдээллээ бөглөнө үү";
  }

  let step3Status: StepStatus = "pending";
  let step3Label = "Контент хараахан ороогүй";
  if (
    qaReport &&
    qaReport.subtitleCount > 0 &&
    qaReport.vocabularyCount >= MIN_VOCABULARY_FOR_PUBLISH &&
    qaReport.quizCount >= MIN_QUIZ_FOR_PUBLISH
  ) {
    step3Status = "done";
    step3Label = "Контент орсон";
  } else if (hasContent) {
    step3Status = "warning";
    step3Label = "Контент дутуу — нэмж оруулна уу";
  }

  let step4Status: StepStatus = "pending";
  let step4Label = "Чанарын шалгалт хийх";
  if (qaStatus === "ready") {
    step4Status = "done";
    step4Label = "Чанарын шалгалт давсан";
  } else if (qaStatus === "needs_review") {
    step4Status = "warning";
    step4Label = "Шалгах шаардлагатай";
  } else if (qaStatus === "missing_content") {
    step4Status = "pending";
    step4Label = "Контент дутуу";
  }

  let step5Status: StepStatus = "pending";
  let step5Label = "Нүүр зураг, аудио эсвэл бичлэг байршуулах";
  if (isMediaReady(lesson)) {
    step5Status = "done";
    step5Label = "Медиа бэлэн (бичлэг холбогдсон)";
  } else if (
    hasVideoUrl(lesson) ||
    hasThumbnailUrl(lesson) ||
    hasAudioUrl(lesson)
  ) {
    step5Status = "warning";
    step5Label = "Медиа дутуу — бичлэг нэмвэл бэлэн болно";
  }

  let step7Status: StepStatus = "blocked";
  let step7Label = "Эхлээд чанарын шалгалт давах ёстой";
  if (publishStatus === "available") {
    step7Status = "done";
    step7Label = "Нийтлэгдсэн";
  } else if (qaReady) {
    step7Status = "warning";
    step7Label = "Нийтлэхэд бэлэн";
  }

  return [
    {
      number: 1,
      title: "Ноорог хичээл",
      description: "Хичээлийн ерөнхий мэдээллийг үүсгэх",
      status: step1Status,
      statusLabel: step1Label,
      href: "/admin/lessons/new",
      hrefLabel: "Шинэ ноорог →",
      extraLinks: [{ label: "Ерөнхий мэдээлэл засах", href: editHref }],
    },
    {
      number: 2,
      title: "Prompt",
      description: "ChatGPT-д өгөх JSON prompt бэлдэх",
      status: "pending",
      statusLabel: "Гараар — засах хуудаснаас prompt-оо хуулна",
      href: editHref,
      hrefLabel: "Prompt үүсгэгч нээх →",
      extraLinks: [
        { label: "Prompt-ийн сан", href: "/admin/prompts" },
        {
          label: "Prompt-оор сайжруулах",
          href: `${editHref}#content-improvement`,
        },
      ],
    },
    {
      number: 3,
      title: "Контент оруулах",
      description: "Хадмал, үгсийн сан, дасгалыг оруулах",
      status: step3Status,
      statusLabel: step3Label,
      href: editHref,
      hrefLabel: "Бөөнөөр оруулах →",
    },
    {
      number: 4,
      title: "Чанарын шалгалт",
      description: "Ерөнхий мэдээлэл, хадмал, үгсийн сан, дасгалыг шалгах",
      status: step4Status,
      statusLabel: step4Label,
      href: editHref,
      hrefLabel: "Засах хуудасны чанарын шалгалт →",
      extraLinks: [
        {
          label: "Нийтлэхийн өмнөх шалгах жагсаалт",
          href: `${editHref}#release-readiness`,
        },
      ],
    },
    {
      number: 5,
      title: "Медиа",
      description: "Медиа байршуулах, холбох",
      status: step5Status,
      statusLabel: step5Label,
      href: editHref,
      hrefLabel: "Медиа байршуулах →",
    },
    {
      number: 6,
      title: "Урьдчилж харах",
      description: "Хичээлийг админаар урьдчилж харах",
      status: hasContent || publishStatus === "available" ? "done" : "pending",
      statusLabel:
        hasContent || publishStatus === "available"
          ? "Урьдчилж харах боломжтой"
          : "Эхлээд контент нэмнэ үү",
      extraLinks: previewLinks,
    },
    {
      number: 7,
      title: "Нөөц хуулбар",
      description: "Хичээлийн JSON-г гаргах",
      status: hasContent ? "pending" : "warning",
      statusLabel: hasContent
        ? "Нийтлэх эсвэл солихын өмнө хуулбар гаргана уу"
        : "Эхлээд контент оруулна уу",
      href: editHref,
      hrefLabel: "Нөөц хуулбар гаргах →",
    },
      {
        number: 8,
        title: "Нийтлэх",
        description: "Шалгалт давсны дараа нийтлэх",
        status: step7Status,
        statusLabel: step7Label,
        href: qaReady || publishStatus === "available" ? editHref : undefined,
        hrefLabel:
          publishStatus === "available"
            ? "Нийтлэх төлөв удирдах →"
            : qaReady
              ? "Нийтлэх тохиргоо →"
              : undefined,
        extraLinks: [
          {
            label: "Нийтлэхийг батлах",
            href: `${editHref}#release-readiness`,
          },
        ],
      },
      {
        number: 9,
        title: "Ажлын шалгалт",
        description: "Нийтлэхийн өмнө үүссэн админы ажлуудыг шалгах",
        status:
          publishStatus === "available"
            ? "done"
            : hasContent
              ? "pending"
              : "blocked",
        statusLabel:
          publishStatus === "available"
            ? "Нийтлэгдсэн — тайлангийн ажлуудыг хянана"
            : hasContent
              ? "Саад болох ажил байгаа эсэхийг ажлын төвөөс шалгана"
              : "Эхлээд контент нэмнэ үү",
        href: "/admin/tasks",
        hrefLabel: "Ажлын төв нээх →",
        extraLinks: [
          {
            label: `${lesson.id} хичээлийн ажлууд`,
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
        Ажлын урсгалын шалгах жагсаалт
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Ноорог → Prompt → Сайжруулах → Оруулах → Чанарын шалгалт → Медиа →
        Урьдчилж харах → Нөөц хуулбар → Нийтлэх
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
                    {step.number}-р алхам — {step.title}
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
