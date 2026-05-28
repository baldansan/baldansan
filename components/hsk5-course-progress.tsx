"use client";

import { useEffect, useState } from "react";
import { LocalProgressNote } from "@/components/local-progress-note";
import { countCompletedLessons } from "@/lib/progress";

type Props = {
  lessonIds: string[];
};

export function Hsk5CourseProgress({ lessonIds }: Props) {
  const total = lessonIds.length;
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    function refresh() {
      setCompleted(countCompletedLessons(lessonIds));
    }

    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [lessonIds]);

  const progressPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Таны ахиц</h2>
      <p className="mt-1 text-sm text-slate-600">
        Completed {completed} / {total} lessons
      </p>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-emerald-700">
        {progressPercent}%
      </p>
      <div className="mt-3">
        <LocalProgressNote />
      </div>
    </section>
  );
}
