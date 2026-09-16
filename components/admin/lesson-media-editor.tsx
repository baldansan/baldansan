"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import { LessonMediaUploadCard } from "@/components/admin/lesson-media-upload-card";
import { LessonMediaTeachingPanel } from "@/components/admin/lesson-media-teaching-panel";
import { MediaStatusBadge } from "@/components/admin/media-status-badge";
import { isDirectAudioUrl, isDirectVideoUrl } from "@/lib/media-url";
import {
  deriveMediaStatusFromUrls,
  MEDIA_STATUS_VALUES,
  normalizeMediaStatus,
} from "@/lib/lesson-media";
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

  const syncFromLesson = useCallback(() => {
    setValues(lessonToMediaValues(lesson));
  }, [lesson]);

  useEffect(() => {
    syncFromLesson();
  }, [syncFromLesson]);

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

    setSuccess("Медиа мэдээлэл хадгалагдлаа.");
    onSaved?.();
    router.refresh();
  }, [lesson.id, onSaved, router, values]);

  const handleClear = useCallback(async () => {
    if (
      !window.confirm(
        "Бичлэг, нүүр зураг, аудионы холбоос болон эх сурвалжийн тэмдэглэлийг цэвэрлэх үү?"
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
    setSuccess("Медиа мэдээлэл цэвэрлэгдлээ.");
    onSaved?.();
    router.refresh();
  }, [lesson.id, onSaved, router]);

  const handleSuggestStatus = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      mediaStatus: deriveMediaStatusFromUrls(prev),
    }));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <AdminEditorSection
        title="Медиа ба заах материал"
        description="Нүүр зураг, хичээлийн аудио, бичлэг, солонгос хэлний заах зургууд."
      >
        <LessonMediaTeachingPanel lesson={lesson} />
      </AdminEditorSection>

      <LessonMediaUploadCard
        lesson={lesson}
        onUploaded={() => {
          syncFromLesson();
          onSaved?.();
        }}
      />

      <AdminEditorSection
        title="Медиа холбоос (гараар)"
        description="Гадаад холбоос буулгах эсвэл байршуулсан холбоосыг солино."
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Одоогийн төлөв:</span>
          <MediaStatusBadge status={values.mediaStatus} />
          <button
            type="button"
            onClick={handleSuggestStatus}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          >
            Холбоосоос төлөвийг автоматаар тогтоох
          </button>
        </div>

        {(values.thumbnailUrl || values.audioUrl || values.videoUrl) && (
          <div className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-3">
            {values.thumbnailUrl ? (
              <div>
                <p className="text-xs font-medium text-slate-500">Нүүр зураг</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={values.thumbnailUrl}
                  alt="Нүүр зургийн урьдчилсан харагдац"
                  className="mt-1 max-h-24 rounded-lg border border-slate-200 object-cover"
                />
              </div>
            ) : null}
            {values.audioUrl ? (
              <div>
                <p className="text-xs font-medium text-slate-500">Аудио</p>
                {isDirectAudioUrl(values.audioUrl) ? (
                  <audio
                    controls
                    src={values.audioUrl}
                    className="mt-1 w-full"
                  />
                ) : (
                  <a
                    href={values.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-emerald-700"
                  >
                    Аудио нээх
                  </a>
                )}
              </div>
            ) : null}
            {values.videoUrl ? (
              <div className="sm:col-span-1">
                <p className="text-xs font-medium text-slate-500">Бичлэг</p>
                {isDirectVideoUrl(values.videoUrl) ? (
                  <video
                    controls
                    src={values.videoUrl}
                    className="mt-1 max-h-24 w-full rounded-lg bg-black"
                  />
                ) : (
                  <a
                    href={values.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-emerald-700"
                  >
                    Бичлэг нээх
                  </a>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Бичлэгийн холбоос</span>
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
            <span className="font-medium text-slate-700">Нүүр зургийн холбоос</span>
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
            <span className="font-medium text-slate-700">Аудионы холбоос</span>
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
            <span className="font-medium text-slate-700">Эх сурвалжийн тэмдэглэл</span>
            <textarea
              value={values.sourceNote}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, sourceNote: e.target.value }))
              }
              rows={3}
              placeholder="Эх сурвалж, зохиогчийн эрх, файлын анхны нэр…"
              className={adminInputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Медиагийн төлөв</span>
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
            <p className="font-semibold">Анхааруулга</p>
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
            {busy === "save" ? "Хадгалж байна…" : "Холбоосыг хадгалах"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={busy !== null}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-red-200 hover:text-red-700 disabled:opacity-60"
          >
            {busy === "clear" ? "Цэвэрлэж байна…" : "Медиаг цэвэрлэх"}
          </button>
        </div>
      </AdminEditorSection>
    </div>
  );
}
