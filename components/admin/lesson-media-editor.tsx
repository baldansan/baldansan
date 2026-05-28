"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import { MediaStatusBadge } from "@/components/admin/media-status-badge";
import { MEDIA_STATUS_VALUES, normalizeMediaStatus } from "@/lib/lesson-media";
import {
  clearLessonMedia,
  updateLessonMedia,
  type UpdateLessonMediaInput,
} from "@/lib/supabase/admin-content";
import type { LessonContent, LessonMediaStatus } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  onSaved?: () => void;
};

type MediaFormValues = {
  videoUrl: string;
  thumbnailUrl: string;
  audioUrl: string;
  sourceNote: string;
  mediaStatus: LessonMediaStatus;
};

function lessonToMediaValues(lesson: LessonContent): MediaFormValues {
  return {
    videoUrl: lesson.videoUrl ?? "",
    thumbnailUrl: lesson.thumbnailUrl ?? "",
    audioUrl: lesson.audioUrl ?? "",
    sourceNote: lesson.sourceNote ?? "",
    mediaStatus: normalizeMediaStatus(lesson.mediaStatus),
  };
}

export function LessonMediaEditor({ lesson, onSaved }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(() => lessonToMediaValues(lesson));
  const [busy, setBusy] = useState<"save" | "clear" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleSave = useCallback(async () => {
    setBusy("save");
    setError(null);
    setSuccess(null);
    setWarnings([]);

    const input: UpdateLessonMediaInput = {
      videoUrl: values.videoUrl,
      thumbnailUrl: values.thumbnailUrl,
      audioUrl: values.audioUrl,
      sourceNote: values.sourceNote,
      mediaStatus: values.mediaStatus,
    };

    const result = await updateLessonMedia(lesson.id, input);
    setBusy(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data?.warnings?.length) {
      setWarnings(result.data.warnings);
    }

    setSuccess("Media metadata хадгалагдлаа.");
    onSaved?.();
    router.refresh();
  }, [lesson.id, onSaved, router, values]);

  const handleClear = useCallback(async () => {
    if (
      !window.confirm(
        "Video, thumbnail, audio URL болон source note-ийг цэвэрлэх үү?"
      )
    ) {
      return;
    }

    setBusy("clear");
    setError(null);
    setSuccess(null);
    setWarnings([]);

    const result = await clearLessonMedia(lesson.id);
    setBusy(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setValues({
      videoUrl: "",
      thumbnailUrl: "",
      audioUrl: "",
      sourceNote: "",
      mediaStatus: "missing",
    });
    setSuccess("Media metadata цэвэрлэгдлээ.");
    onSaved?.();
    router.refresh();
  }, [lesson.id, onSaved, router]);

  return (
    <AdminEditorSection
      title="Lesson media"
      description="URL-based video, thumbnail, audio metadata. File upload ирээдүйд Supabase Storage ашиглана."
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-slate-600">Current status:</span>
        <MediaStatusBadge status={values.mediaStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Video URL</span>
          <input
            type="url"
            value={values.videoUrl}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, videoUrl: e.target.value }))
            }
            placeholder="https://…/lesson.mp4"
            className={adminInputClass}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Thumbnail URL</span>
          <input
            type="url"
            value={values.thumbnailUrl}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
            }
            placeholder="https://…/cover.jpg"
            className={adminInputClass}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Audio URL</span>
          <input
            type="url"
            value={values.audioUrl}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, audioUrl: e.target.value }))
            }
            placeholder="https://…/audio.mp3"
            className={adminInputClass}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Source note</span>
          <textarea
            value={values.sourceNote}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, sourceNote: e.target.value }))
            }
            rows={3}
            placeholder="Platform, rights, original filename…"
            className={adminInputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Media status</span>
          <select
            value={values.mediaStatus}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                mediaStatus: e.target.value as LessonMediaStatus,
              }))
            }
            className={adminInputClass}
          >
            {MEDIA_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <AdminAlert error={error} success={success} />

      {warnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Warnings</p>
          <ul className="mt-2 list-inside list-disc">
            {warnings.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy !== null}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
        >
          {busy === "save" ? "Saving…" : "Save media"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={busy !== null}
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-red-200 hover:text-red-700 disabled:opacity-60"
        >
          {busy === "clear" ? "Clearing…" : "Clear media"}
        </button>
      </div>
    </AdminEditorSection>
  );
}
