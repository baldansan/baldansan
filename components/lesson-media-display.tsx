import Link from "next/link";
import { isDirectAudioUrl, isDirectVideoUrl } from "@/lib/media-url";
import {
  hasAudioUrl,
  hasThumbnailUrl,
  hasVideoUrl,
} from "@/lib/lesson-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { ctaPrimaryClass } from "@/components/ui/cta-button-row";
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

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        {thumbReady ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lesson.thumbnailUrl}
            alt={`${lesson.title} thumbnail`}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-slate-100">
            <p className="px-4 text-center text-sm font-medium text-slate-500">
              {videoReady ? "Видео зураг" : LEARNER_LESSON.videoPlaceholder}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {videoReady ? (
          <div>
            <p className="text-sm font-semibold text-emerald-700">Видео бэлэн</p>
            <p className="mt-1 text-xs text-slate-500">
              Үзэх хуудсанд видео харагдана.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-slate-600">
              {LEARNER_LESSON.videoPlaceholder}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {LEARNER_LESSON.noVideoNote}
            </p>
          </div>
        )}

        <Link
          href={lessonPreviewPath(lesson.id, {
            adminPreview,
            subpath: "watch",
          })}
          className={ctaPrimaryClass}
        >
          {videoReady ? "Видео үзэх" : LEARNER_LESSON.watch}
        </Link>
      </div>
    </section>
  );
}

type WatchProps = {
  lesson: LessonContent;
};

export function LessonWatchMediaSection({ lesson }: WatchProps) {
  const videoUrl = lesson.videoUrl?.trim();
  const thumbnailUrl = lesson.thumbnailUrl?.trim();
  const audioUrl = lesson.audioUrl?.trim();
  const videoReady = Boolean(videoUrl);
  const audioReady = Boolean(audioUrl);

  return (
    <>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        {videoReady && isDirectVideoUrl(videoUrl!) ? (
          <video
            className="aspect-video w-full rounded-xl bg-black ring-1 ring-slate-200"
            controls
            playsInline
            poster={thumbnailUrl}
            src={videoUrl}
          >
            Your browser does not support video playback.
          </video>
        ) : videoReady ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl bg-slate-100 p-6 ring-1 ring-slate-200">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt={`${lesson.title} cover`}
                className="max-h-32 rounded-lg object-cover ring-1 ring-slate-200"
              />
            ) : null}
            <p className="text-center text-sm text-slate-600">
              Гадны видео холбоос — browser дээр нээнэ үү.
            </p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={ctaPrimaryClass}
            >
              Видео нээх
            </a>
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-slate-100 p-6 ring-1 ring-slate-200">
            <p className="text-center text-sm font-medium text-slate-600">
              {LEARNER_LESSON.videoPlaceholder}
            </p>
            <p className="text-center text-xs text-slate-500">
              {LEARNER_LESSON.noVideoNote}
            </p>
          </div>
        )}

        <p className="mt-3 text-center text-sm font-medium text-slate-600">
          00:00 / {lesson.watchTotalTime}
        </p>
      </section>

      {audioReady ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">Аудио</h2>
          {isDirectAudioUrl(audioUrl!) ? (
            <audio className="mt-4 w-full" controls src={audioUrl} />
          ) : (
            <a
              href={audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              Аудио нээх
            </a>
          )}
        </section>
      ) : null}
    </>
  );
}
