"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
} from "@/components/admin/admin-editor-ui";
import {
  lessonToFormValues,
  LessonFormFields,
  type LessonFormValues,
} from "@/components/admin/lesson-form-fields";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import {
  refreshLessonCounts,
  updateLessonMetadata,
  type UpdateLessonMetadataInput,
} from "@/lib/supabase/admin-content";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  orderIndex: number;
  vocabActual: number;
  quizActual: number;
  vocabMeta: number;
  quizMeta: number;
  contentReadyForPublish: boolean;
  onSaved?: () => void;
  onCountsRefreshed?: (vocabMeta: number, quizMeta: number) => void;
};

function formToUpdateInput(values: LessonFormValues): UpdateLessonMetadataInput {
  return {
    title: values.title,
    chineseTitle: values.chineseTitle,
    subtitle: values.subtitle,
    description: values.description,
    duration: values.duration,
    status: values.status,
    orderIndex: Number(values.orderIndex),
    vocabularyCount: Number(values.vocabularyCount),
    quizCount: Number(values.quizCount),
  };
}

export function LessonMetadataEditor({
  lesson,
  orderIndex,
  vocabActual,
  quizActual,
  vocabMeta,
  quizMeta,
  contentReadyForPublish,
  onSaved,
  onCountsRefreshed,
}: Props) {
  const router = useRouter();
  const publishStatus = getAdminPublishStatus(lesson);
  const [values, setValues] = useState(() =>
    lessonToFormValues(lesson, { orderIndex })
  );
  const [busy, setBusy] = useState<"save" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const vocabMismatch = vocabActual !== vocabMeta;
  const quizMismatch = quizActual !== quizMeta;
  const statusAvailableWarning =
    values.status === "available" && !contentReadyForPublish;

  const handleSave = useCallback(async () => {
    setBusy("save");
    setError(null);
    setSuccess(null);

    const result = await updateLessonMetadata(
      lesson.id,
      formToUpdateInput(values)
    );

    setBusy(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess("Ерөнхий мэдээлэл хадгалагдлаа.");
    onSaved?.();
    router.refresh();
  }, [lesson.id, values, onSaved, router]);

  const handleRefreshCounts = useCallback(async () => {
    setBusy("refresh");
    setError(null);
    setSuccess(null);

    const result = await refreshLessonCounts(lesson.id);

    setBusy(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setValues((prev) => ({
        ...prev,
        vocabularyCount: String(result.data!.vocabularyCount),
        quizCount: String(result.data!.quizCount),
      }));
      onCountsRefreshed?.(result.data.vocabularyCount, result.data.quizCount);
    }

    setSuccess("Тоо шинэчлэгдлээ.");
    router.refresh();
  }, [lesson.id, onCountsRefreshed, router]);

  return (
    <AdminEditorSection
      title="Хичээлийн ерөнхий мэдээлэл"
      description="Гарчиг, тайлбар, төлөв, дарааллын дугаар, тоонуудыг хадгална."
    >
      <LessonFormFields
        values={values}
        onChange={setValues}
        showOrderIndex
        lockIds
      />

      {vocabMismatch ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Үгсийн тоо бодит тоотой зөрж байна. (Бүртгэлд: {vocabMeta}{" "}
          · бодит: {vocabActual})
        </p>
      ) : null}

      {quizMismatch ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Дасгалын тоо бодит тоотой зөрж байна. (Бүртгэлд: {quizMeta} · бодит:{" "}
          {quizActual})
        </p>
      ) : null}

      {statusAvailableWarning ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Нийтлэхээс өмнө хадмал, үгсийн сан, дасгал бүрэн эсэхийг шалгана уу.
          Нийтлэх хэсэгт илүү нарийн шалгалт хийгдэнэ.
        </p>
      ) : null}

      <div className="mt-4">
        <AdminAlert error={error} success={success} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy !== null}
          onClick={handleSave}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {busy === "save" ? "Хадгалж байна…" : "Мэдээллийг хадгалах"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={handleRefreshCounts}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy === "refresh" ? "Шинэчилж байна…" : "Тоог шинэчлэх"}
        </button>
        <Link
          href={lessonPreviewPath(lesson.id, {
            adminPreview: publishStatus !== "available",
          })}
          className="inline-flex justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        >
          Хичээлийг урьдчилж харах
        </Link>
        <Link
          href="/admin/lessons"
          className="inline-flex justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        >
          ← Хичээлүүд рүү буцах
        </Link>
      </div>
    </AdminEditorSection>
  );
}
