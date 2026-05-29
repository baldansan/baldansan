import Link from "next/link";
import { isDirectAudioUrl, isDirectVideoUrl } from "@/lib/media-url";
import {
  hasAudioUrl,
  hasThumbnailUrl,
  hasVideoUrl,
} from "@/lib/lesson-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
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
            <p className="text-sm font-medium text-slate-500">
              {videoReady ? "Video cover" : lesson.videoPlaceholder}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {videoReady ? (
          <div>
            <p className="text-sm font-semibold text-emerald-700">Video ready</p>
            <p className="mt-1 text-xs text-slate-500">
              Watch page дээр видео эсвэл холбоос харагдана.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-slate-600">
              Video coming soon
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Одоогоор placeholder — admin video URL нэмэхэд идэвхжинэ.
            </p>
          </div>
        )}

        <Link
          href={lessonPreviewPath(lesson.id, {
            adminPreview,
            subpath: "watch",
          })}
          className="inline-flex justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          {videoReady ? "Видео үзэх" : "Хичээл үзэх"}
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
              External video link — open in browser to watch.
            </p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Open video
            </a>
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              {lesson.videoPlaceholder}
            </p>
          </div>
        )}

        <p className="mt-3 text-center text-sm font-medium text-slate-600">
          00:00 / {lesson.watchTotalTime}
        </p>
      </section>

      {audioReady ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">Audio resource</h2>
          {isDirectAudioUrl(audioUrl!) ? (
            <audio className="mt-4 w-full" controls src={audioUrl} />
          ) : (
            <a
              href={audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              Open audio resource
            </a>
          )}
        </section>
      ) : null}
    </>
  );
}
