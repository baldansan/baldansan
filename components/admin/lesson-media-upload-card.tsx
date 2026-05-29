"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { AdminAlert } from "@/components/admin/admin-editor-ui";
import { deriveMediaStatusFromUrls } from "@/lib/lesson-media";
import { isDirectAudioUrl, isDirectVideoUrl } from "@/lib/media-url";
import {
  mediaTypeAcceptAttribute,
  mediaTypeHint,
  uploadLessonMediaFile,
  type LessonMediaType,
} from "@/lib/supabase/media-upload";
import {
  updateLessonMedia,
  type UpdateLessonMediaInput,
} from "@/lib/supabase/admin-content";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  onUploaded?: () => void;
};

type UploadSlotProps = {
  lesson: LessonContent;
  mediaType: LessonMediaType;
  title: string;
  currentUrl?: string;
  onUploaded?: () => void;
};

function UploadSlot({
  lesson,
  mediaType,
  title,
  currentUrl,
  onUploaded,
}: UploadSlotProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = useCallback(async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Файл сонгоно уу.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    const upload = await uploadLessonMediaFile(lesson.id, file, mediaType);
    if (upload.error || !upload.publicUrl) {
      setBusy(false);
      setError(upload.error ?? "Upload амжилтгүй.");
      return;
    }

    const nextVideoUrl =
      mediaType === "video" ? upload.publicUrl : lesson.videoUrl ?? "";
    const nextThumbnailUrl =
      mediaType === "thumbnail" ? upload.publicUrl : lesson.thumbnailUrl ?? "";
    const nextAudioUrl =
      mediaType === "audio" ? upload.publicUrl : lesson.audioUrl ?? "";

    const input: UpdateLessonMediaInput = {
      videoUrl: nextVideoUrl,
      thumbnailUrl: nextThumbnailUrl,
      audioUrl: nextAudioUrl,
      sourceNote: lesson.sourceNote ?? "",
      mediaStatus: deriveMediaStatusFromUrls({
        videoUrl: nextVideoUrl,
        thumbnailUrl: nextThumbnailUrl,
        audioUrl: nextAudioUrl,
      }),
    };

    const result = await updateLessonMedia(lesson.id, input);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setSuccess(`${title} амжилттай upload хийгдлээ.`);
    onUploaded?.();
    router.refresh();
  }, [lesson, mediaType, onUploaded, router, title]);

  const trimmedUrl = currentUrl?.trim();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{mediaTypeHint(mediaType)}</p>

      {trimmedUrl ? (
        <div className="mt-3">
          {mediaType === "thumbnail" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trimmedUrl}
              alt={`${lesson.title} thumbnail`}
              className="max-h-40 rounded-lg border border-slate-200 object-cover"
            />
          ) : mediaType === "audio" ? (
            isDirectAudioUrl(trimmedUrl) ? (
              <audio controls src={trimmedUrl} className="w-full max-w-md" />
            ) : (
              <a
                href={trimmedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Open audio →
              </a>
            )
          ) : isDirectVideoUrl(trimmedUrl) ? (
            <video
              controls
              src={trimmedUrl}
              className="max-h-48 w-full max-w-lg rounded-lg bg-black"
            />
          ) : (
            <a
              href={trimmedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Open video →
            </a>
          )}
          <p className="mt-2 break-all text-xs text-slate-500">{trimmedUrl}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">No file uploaded yet.</p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept={mediaTypeAcceptAttribute(mediaType)}
          className="block w-full max-w-md text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={busy}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
        >
          {busy ? "Uploading…" : `Upload ${title.toLowerCase()}`}
        </button>
      </div>

      <AdminAlert error={error} success={success} />
    </div>
  );
}

export function LessonMediaUploadCard({ lesson, onUploaded }: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        Upload media files
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Supabase Storage bucket <code className="text-xs">lesson-media</code>.
        Public URLs are saved to lesson media fields automatically.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-1">
        <UploadSlot
          lesson={lesson}
          mediaType="thumbnail"
          title="Thumbnail"
          currentUrl={lesson.thumbnailUrl}
          onUploaded={onUploaded}
        />
        <UploadSlot
          lesson={lesson}
          mediaType="audio"
          title="Audio"
          currentUrl={lesson.audioUrl}
          onUploaded={onUploaded}
        />
        <UploadSlot
          lesson={lesson}
          mediaType="video"
          title="Video"
          currentUrl={lesson.videoUrl}
          onUploaded={onUploaded}
        />
      </div>
    </section>
  );
}
