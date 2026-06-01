"use client";

import Link from "next/link";
import { MobileCard } from "@/components/mobile/mobile-card";
import { hasVideoUrl } from "@/lib/lesson-media";
import { isDirectVideoUrl } from "@/lib/media-url";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
  /** Inline player on watch page instead of link */
  inline?: boolean;
};

export function HskOptionalVideoCard({
  lesson,
  adminPreview = false,
  inline = false,
}: Props) {
  const videoReady =
    hasVideoUrl(lesson) &&
    lesson.videoUrl &&
    isDirectVideoUrl(lesson.videoUrl);

  if (!videoReady) {
    return null;
  }

  const watchHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "watch",
  });

  if (inline) {
    return (
      <MobileCard padding="lg" className="!border-slate-200 !bg-slate-50/50">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {LEARNER_LESSON.optionalVideo}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {LEARNER_LESSON.optionalVideoHint}
        </p>
        <video
          controls
          className="mt-3 aspect-video w-full rounded-2xl bg-black object-contain"
          src={lesson.videoUrl!}
          playsInline
        />
      </MobileCard>
    );
  }

  return (
    <MobileCard padding="lg" className="!border-slate-200 !bg-slate-50/50">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg ring-1 ring-slate-200">
          🎬
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[var(--app-text)]">
            {LEARNER_LESSON.optionalVideo}
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {LEARNER_LESSON.optionalVideoHint}
          </p>
          <Link
            href={`${watchHref}#optional-video`}
            className="app-btn-secondary mt-3 inline-flex w-full justify-center !min-h-[40px] !py-2 !text-sm"
          >
            ▶ {LEARNER_LESSON.watchVideo}
          </Link>
        </div>
      </div>
    </MobileCard>
  );
}
