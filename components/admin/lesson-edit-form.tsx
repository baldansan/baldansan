"use client";

import Link from "next/link";
import { lessonPath } from "@/lib/content";
import {
  lessonToFormValues,
  LessonFormFields,
} from "@/components/admin/lesson-form-fields";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
};

export function LessonEditForm({ lesson }: Props) {
  const values = lessonToFormValues(lesson);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Хичээл засах · {lesson.id}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Унших горим — утгууд одоогийн контентоос. Хадгалах идэвхгүй.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <LessonFormFields values={values} readOnly />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500"
          >
            Update lesson — coming soon
          </button>
          <Link
            href={lessonPath(lesson.id)}
            className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Preview public lesson →
          </Link>
          <Link
            href="/admin/lessons"
            className="inline-flex justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            ← Хичээл удирдах
          </Link>
        </div>
      </section>
    </div>
  );
}
