"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LessonQuickPublishButton } from "@/components/admin/lesson-quick-publish-button";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import { calculateReleaseReadiness } from "@/lib/admin/release-readiness";
import {
  adminStatusLabel,
  getAdminPublishStatus,
} from "@/lib/admin/lesson-status";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import {
  hasAudioUrl,
  hasThumbnailUrl,
  hasVideoUrl,
} from "@/lib/lesson-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  subtitleCount: number;
  vocabularyCount: number;
  quizCount: number;
};

function CountPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {label}: {value}
    </span>
  );
}

export function LessonEditSummaryHeader({
  lesson,
  subtitleCount,
  vocabularyCount,
  quizCount,
}: Props) {
  const publishStatus = getAdminPublishStatus(lesson);
  const readiness = useMemo(
    () => calculateReleaseReadiness(lesson),
    [lesson]
  );
  const prelesson = isPrelessonPackage(lesson);

  const audioCount = hasAudioUrl(lesson) ? 1 : 0;
  const imageCount = hasThumbnailUrl(lesson) ? 1 : 0;
  const videoCount = hasVideoUrl(lesson) ? 1 : 0;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{lesson.title}</h1>
            <LessonStatusBadge status={publishStatus} />
          </div>
          <p className="mt-1 text-sm text-slate-600">{lesson.chineseTitle}</p>
          <p className="mt-2 font-mono text-xs text-slate-500">
            {lesson.id} · {lesson.courseId}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CountPill label="Vocabulary" value={vocabularyCount} />
            <CountPill label="Quiz" value={quizCount} />
            <CountPill
              label="Subtitles"
              value={subtitleCount > 0 ? subtitleCount : prelesson ? "none" : 0}
            />
            <CountPill label="Audio" value={audioCount} />
            <CountPill label="Images" value={imageCount} />
            {videoCount > 0 ? <CountPill label="Video" value={videoCount} /> : null}
          </div>
          {publishStatus === "draft" && readiness.readyToPublish ? (
            <p className="mt-3 text-sm text-emerald-800">
              Publish-ready — {adminStatusLabel("available")} болгох боломжтой.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {publishStatus === "draft" && readiness.readyToPublish ? (
            <LessonQuickPublishButton lessonId={lesson.id} variant="button" />
          ) : null}
          <Link
            href={`/admin/lessons/${lesson.id}/teacher`}
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Багшийн давхарга
          </Link>
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview: publishStatus !== "available",
            })}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Preview
          </Link>
          <Link
            href="/admin/lessons"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            ← Lessons
          </Link>
        </div>
      </div>
    </section>
  );
}
