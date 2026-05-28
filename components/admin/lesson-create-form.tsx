"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  emptyLessonFormValues,
  LessonFormFields,
  type LessonFormValues,
} from "@/components/admin/lesson-form-fields";
import { createDraftLesson, getNextLessonOrderIndex } from "@/lib/supabase/admin-content";
import { hasSupabaseConfig } from "@/lib/supabase/client";

function validate(values: LessonFormValues): string | null {
  if (!values.id.trim()) return "Lesson ID заавал.";
  if (!values.courseId.trim()) return "Course ID заавал.";
  if (!values.title.trim()) return "Title заавал.";
  if (!values.chineseTitle.trim()) return "Chinese title заавал.";
  if (!values.status) return "Status заавал.";
  if (values.orderIndex.trim()) {
    const n = Number(values.orderIndex);
    if (!Number.isFinite(n) || n < 1) {
      return "Order index тоо байх ёстой.";
    }
  }
  return null;
}

export function LessonCreateForm() {
  const router = useRouter();
  const [values, setValues] = useState<LessonFormValues>(emptyLessonFormValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    getNextLessonOrderIndex("hsk5").then(({ data }) => {
      if (data == null) return;
      setValues((prev) =>
        prev.orderIndex.trim() ? prev : { ...prev, orderIndex: String(data) }
      );
    });
  }, []);

  async function handleSaveDraft() {
    setError(null);
    setSuccess(null);

    const validationError = validate(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const orderIndex = values.orderIndex.trim()
      ? Number(values.orderIndex)
      : undefined;

    const result = await createDraftLesson({
      id: values.id.trim(),
      courseId: values.courseId.trim(),
      title: values.title.trim(),
      chineseTitle: values.chineseTitle.trim(),
      subtitle: values.subtitle.trim(),
      description: values.description.trim(),
      duration: values.duration.trim(),
      status: values.status,
      orderIndex,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const lessonId = result.data?.id ?? values.id.trim();
    setSuccess("Ноорог хичээл амжилттай хадгалагдлаа.");
    router.push(`/admin/lessons/${lessonId}/edit`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Шинэ хичээл</h1>
        <p className="mt-2 text-sm text-slate-600">
          Metadata-г Supabase <code className="text-xs">lessons</code> хүснэгтэд
          ноорог болгон хадгална. Subtitle / vocabulary / quiz дараагийн алхам.
        </p>
      </div>

      {error ? (
        <div
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200"
          role="status"
        >
          {success}
        </div>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <LessonFormFields
          values={values}
          onChange={setValues}
          showOrderIndex
          hideCounts
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          <Link
            href="/admin/lessons"
            className="inline-flex justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            ← Content QA
          </Link>
        </div>
      </section>
    </div>
  );
}
