"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { LessonPublishToggle } from "@/components/admin/lesson-publish-toggle";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import {
  lessonToFormValues,
  type LessonFormValues,
} from "@/components/admin/lesson-form-fields";
import { calculateReleaseReadiness } from "@/lib/admin/release-readiness";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import {
  hasAudioUrl,
  hasThumbnailUrl,
} from "@/lib/lesson-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import {
  updateLessonMetadata,
  type UpdateLessonMetadataInput,
} from "@/lib/supabase/admin-content";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  orderIndex: number;
  vocabularyCount: number;
  quizCount: number;
  onSaved?: () => void;
};

function formToUpdateInput(
  values: LessonFormValues,
  orderIndex: number
): UpdateLessonMetadataInput {
  return {
    title: values.title,
    chineseTitle: values.chineseTitle,
    subtitle: values.subtitle,
    description: values.description,
    duration: values.duration,
    status: values.status,
    orderIndex,
    vocabularyCount: Number(values.vocabularyCount),
    quizCount: Number(values.quizCount),
  };
}

export function LessonEditSimplePanel({
  lesson,
  orderIndex,
  vocabularyCount,
  quizCount,
  onSaved,
}: Props) {
  const router = useRouter();
  const publishStatus = getAdminPublishStatus(lesson);
  const readiness = useMemo(
    () => calculateReleaseReadiness(lesson),
    [lesson]
  );

  const [values, setValues] = useState(() =>
    lessonToFormValues(lesson, { orderIndex })
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const audioCount = hasAudioUrl(lesson) ? 1 : 0;
  const imageCount = hasThumbnailUrl(lesson) ? 1 : 0;

  const handleSave = useCallback(async () => {
    setBusy(true);
    setError(null);
    setSaved(false);

    const result = await updateLessonMetadata(
      lesson.id,
      formToUpdateInput(values, orderIndex)
    );

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSaved(true);
    onSaved?.();
    router.refresh();
  }, [lesson.id, values, orderIndex, onSaved, router]);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LessonStatusBadge status={publishStatus} />
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {lesson.courseId}
            </span>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">Lesson title</span>
            <input
              type="text"
              value={values.title}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, title: e.target.value }))
              }
              className="mt-1 w-full border-0 border-b border-slate-200 bg-transparent px-0 py-1 text-lg font-bold text-slate-900 outline-none focus:border-emerald-400"
            />
          </label>
          <label className="mt-2 block">
            <span className="text-xs font-medium text-slate-500">Target title</span>
            <input
              type="text"
              value={values.chineseTitle}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, chineseTitle: e.target.value }))
              }
              className="mt-1 w-full border-0 border-b border-slate-200 bg-transparent px-0 py-1 text-sm text-slate-700 outline-none focus:border-emerald-400"
            />
          </label>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Vocabulary", vocabularyCount],
              ["Quiz", quizCount],
              ["Audio", audioCount],
              ["Images", imageCount],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-base font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          {error ? (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mt-3 text-sm text-emerald-700" role="status">
              Хадгалагдлаа.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview: publishStatus !== "available",
            })}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Preview
          </Link>
          <LessonPublishToggle
            lessonId={lesson.id}
            published={publishStatus === "available"}
            canPublish={readiness.readyToPublish}
            variant="button"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <Link
            href="/admin/lessons"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Back
          </Link>
        </div>
      </div>
    </section>
  );
}
