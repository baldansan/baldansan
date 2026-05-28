"use client";

import { useState } from "react";
import {
  emptyLessonFormValues,
  LessonFormFields,
  type LessonFormValues,
} from "@/components/admin/lesson-form-fields";

export function LessonCreateForm() {
  const [values, setValues] = useState<LessonFormValues>(emptyLessonFormValues);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Шинэ хичээл</h1>
        <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          Энэ form одоогоор UI skeleton. Дараагийн алхамд Supabase write нэмнэ.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <LessonFormFields values={values} onChange={setValues} />
        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500 sm:w-auto"
        >
          Save draft — coming soon
        </button>
      </section>
    </div>
  );
}
