import Link from "next/link";
import { MobileCard } from "@/components/mobile/mobile-card";
import { isDirectAudioUrl, isDirectVideoUrl } from "@/lib/media-url";
import {
  hasAudioUrl,
  hasThumbnailUrl,
  hasVideoUrl,
} from "@/lib/lesson-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import type { LessonContent } from "@/types/lesson-content";

type DetailProps = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

export function LessonDetailMediaSection({
  lesson,
  adminPreview = false,
}: DetailProps) {
  const videoReady = hasVideoUrl(lesson);
  const thumbReady = hasThumbnailUrl(lesson);
  const watchHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "watch",
  });
  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });

  return (
    <MobileCard padding="sm" className="overflow-hidden !p-0">
      <div className="overflow-hidden">
        {thumbReady ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lesson.thumbnailUrl}
            alt={`${lesson.title} thumbnail`}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="app-lesson-media-placeholder">
            <span className="text-3xl" aria-hidden>
              🎬
            </span>
            <p className="max-w-[280px] px-4 text-center text-sm font-semibold text-slate-700">
              {videoReady
                ? "Видео бэлэн"
                : "Видео хараахан нэмэгдээгүй байна"}
            </p>
            {!videoReady ? (
              <p className="max-w-[280px] px-4 text-center text-xs leading-5 text-slate-500">
                Энэ хичээлийн үгийн сан болон quiz-г ашиглаж болно.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {videoReady ? (
          <>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Видео бэлэн</p>
              <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                Үзэх хуудсанд видео харагдана.
              </p>
            </div>
            <Link href={watchHref} className="app-btn-primary w-full">
              ▶ {LEARNER_LESSON.watch}
            </Link>
          </>
        ) : (
          <div className="app-lesson-cta-row">
            <Link href={vocabHref} className="app-btn-secondary w-full !min-h-[40px] !py-2 !text-xs">
              📚 {LEARNER_LESSON.vocabularyStudy}
            </Link>
            <Link href={quizHref} className="app-btn-primary w-full !min-h-[40px] !py-2 !text-xs">
              ✓ {LEARNER_LESSON.quiz}
            </Link>
          </div>
        )}
      </div>
    </MobileCard>
  );
}

type WatchProps = {
  lesson: LessonContent;
};

export function LessonWatchMediaSection({ lesson }: WatchProps) {
  const videoReady = hasVideoUrl(lesson);
  const audioReady = hasAudioUrl(lesson);
  const videoUrl = lesson.videoUrl;
  const audioUrl = lesson.audioUrl;

  if (videoReady && videoUrl && isDirectVideoUrl(videoUrl)) {
    return (
      <video
        controls
        className="aspect-video w-full rounded-[16px] bg-black object-contain"
        src={videoUrl}
        playsInline
      />
    );
  }

  if (audioReady && audioUrl && isDirectAudioUrl(audioUrl)) {
    return (
      <MobileCard>
        <p className="text-sm font-semibold text-[var(--app-text)]">Audio</p>
        <audio controls className="mt-2 w-full" src={audioUrl} />
      </MobileCard>
    );
  }

  return (
    <MobileCard className="text-center">
      <div className="app-lesson-media-placeholder !aspect-auto min-h-[160px] rounded-[16px]">
        <span className="text-3xl" aria-hidden>
          🎬
        </span>
        <p className="text-sm font-semibold text-slate-700">
          Видео хараахан нэмэгдээгүй байна
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Энэ хичээлийн үгийн сан болон quiz-г ашиглаж болно.
        </p>
      </div>
    </MobileCard>
  );
}
