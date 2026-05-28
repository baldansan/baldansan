"use client";

import type { LessonContent } from "@/types/lesson-content";
import type { AdminContentStatus } from "@/lib/admin/lesson-status";

export type LessonFormValues = {
  id: string;
  courseId: string;
  title: string;
  chineseTitle: string;
  subtitle: string;
  description: string;
  duration: string;
  status: AdminContentStatus;
  vocabularyCount: string;
  quizCount: string;
};

export const emptyLessonFormValues: LessonFormValues = {
  id: "",
  courseId: "hsk5",
  title: "",
  chineseTitle: "",
  subtitle: "",
  description: "",
  duration: "",
  status: "draft",
  vocabularyCount: "0",
  quizCount: "0",
};

export function lessonToFormValues(lesson: LessonContent): LessonFormValues {
  const status: AdminContentStatus =
    lesson.status === "available" ? "available" : "draft";

  return {
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    chineseTitle: lesson.chineseTitle,
    subtitle: lesson.subtitle,
    description: lesson.description,
    duration: lesson.duration,
    status,
    vocabularyCount: String(lesson.vocabularyCount),
    quizCount: String(lesson.quizCount),
  };
}

type Props = {
  values: LessonFormValues;
  readOnly?: boolean;
  onChange?: (values: LessonFormValues) => void;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500";

export function LessonFormFields({ values, readOnly = false, onChange }: Props) {
  function update<K extends keyof LessonFormValues>(
    key: K,
    value: LessonFormValues[K]
  ) {
    if (readOnly || !onChange) return;
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700">
        Lesson ID
        <input
          className={inputClass}
          value={values.id}
          disabled={readOnly}
          onChange={(e) => update("id", e.target.value)}
          placeholder="5"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Course ID
        <input
          className={inputClass}
          value={values.courseId}
          disabled={readOnly}
          onChange={(e) => update("courseId", e.target.value)}
          placeholder="hsk5"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        Title
        <input
          className={inputClass}
          value={values.title}
          disabled={readOnly}
          onChange={(e) => update("title", e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        Chinese title
        <input
          className={inputClass}
          value={values.chineseTitle}
          disabled={readOnly}
          onChange={(e) => update("chineseTitle", e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        Subtitle
        <input
          className={inputClass}
          value={values.subtitle}
          disabled={readOnly}
          onChange={(e) => update("subtitle", e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        Description
        <textarea
          className={`${inputClass} min-h-[88px]`}
          value={values.description}
          disabled={readOnly}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Duration
        <input
          className={inputClass}
          value={values.duration}
          disabled={readOnly}
          onChange={(e) => update("duration", e.target.value)}
          placeholder="8 min"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Status
        <select
          className={inputClass}
          value={values.status}
          disabled={readOnly}
          onChange={(e) =>
            update("status", e.target.value as AdminContentStatus)
          }
        >
          <option value="draft">draft</option>
          <option value="available">available</option>
          <option value="archived">archived</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Vocabulary count
        <input
          className={inputClass}
          type="number"
          min={0}
          value={values.vocabularyCount}
          disabled={readOnly}
          onChange={(e) => update("vocabularyCount", e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Quiz count
        <input
          className={inputClass}
          type="number"
          min={0}
          value={values.quizCount}
          disabled={readOnly}
          onChange={(e) => update("quizCount", e.target.value)}
        />
      </label>
    </div>
  );
}
