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
      label: "Ерөнхий мэдээлэл",
      ready: readiness.metadataReady,
      hint: readiness.metadataReady
        ? "Бүрэн"
        : "Гарчиг, хятад гарчиг, тайлбар",
      href: editHref,
      hrefLabel: "Ерөнхий мэдээлэл засах",
    },
    {
      label: prelesson ? "Хадмал (заавал биш)" : "Хадмал",
      ready: readiness.subtitlesReady,
      recommended: prelesson && !readiness.subtitlesReady,
      hint: readiness.subtitlesReady
        ? `${lesson.timedSubtitles.length} мөр`
        : prelesson
          ? "Бэлтгэл хичээлд хадмал заавал биш"
          : "Хадмал оруулах эсвэл нэмэх",
      href: editHref,
      hrefLabel: "Бөөнөөр оруулах",
    },
    {
      label: "Үгсийн сан",
      ready: readiness.vocabularyReady,
      hint: `${lesson.vocabulary.length} үг (хамгийн багадаа 5)`,
      href: editHref,
      hrefLabel: "Үгсийн сан засах",
    },
    {
      label: "Дасгал",
      ready: readiness.quizReady,
      hint: `${lesson.quizQuestions.length} асуулт (хамгийн багадаа 3)`,
      href: editHref,
      hrefLabel: "Дасгал засах",
    },
    {
      label: "Медиа",
      ready: readiness.mediaReady,
      hint: readiness.mediaReady
        ? "Медиа бэлэн"
        : "Бичлэг байршуулах эсвэл медиагийн төлвийг тохируулах",
      href: editHref,
      hrefLabel: "Медиа байршуулах",
    },
    {
      label: "Чанарын шалгалт",
      ready: readiness.qaReady,
      hint: readiness.qaReady
        ? "Агуулгын чанарын шалгалт давсан"
        : "Чанарын шалгалтын алдааг засах",
      href: editHref,
      hrefLabel: "Чанарын шалгалт",
    },
    {
      label: "Нөөц хуулбар",
      ready: false,
      recommended: readiness.backupRecommended,
      hint: "Нийтлэхээс өмнө JSON нөөц хуулбар гаргаж авах",
      href: editHref,
      hrefLabel: "Нөөц хуулбар гаргах",
    },
    {
      label: "Урьдчилж харах",
      ready: false,
      recommended: readiness.previewRecommended,
      hint: "Хичээлийн бүх хэсгийг урьдчилж шалгах",
      href: lessonPreviewPath(lesson.id, { adminPreview }),
      hrefLabel: "Хичээл урьдчилж харах",
    },
    {
      label: "Баталгаа",
      ready: readiness.approvalReady,
      hint: readiness.approvalReady
        ? "Батлагдсан"
        : "Чанарын шалгалт давсан гэж тэмдэглээд → Нийтлэхийг батлах",
      href: editHref,
      hrefLabel: "Баталгааны хэсэг",
    },
  ];

  return (
    <section
      id="release-readiness"
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
    >
      <h2 className="text-base font-semibold text-slate-900">
        Нийтлэхэд бэлэн эсэх
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Нийтлэхээс өмнө шалгах жагсаалт.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {readiness.readyToPublish ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            Нийтлэхэд бэлэн
          </span>
        ) : readiness.readyToApprove ? (
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
            Батлахад бэлэн
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            Шалгах шаардлагатай
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
