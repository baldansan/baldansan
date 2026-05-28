"use client";

import { useEffect, useState } from "react";
import { LocalProgressNote } from "@/components/local-progress-note";
import {
  getLessonStatusSmart,
  lessonProgressPercent,
  lessonStatusLabel,
  type LessonStatus,
} from "@/lib/progress";

type Props = {
  lessonId: string;
};

export function LessonProgressCard({ lessonId }: Props) {
  const [status, setStatus] = useState<LessonStatus>("not_started");

  useEffect(() => {
    async function refresh() {
      setStatus(await getLessonStatusSmart(lessonId));
    }

    const onFocus = () => {
      void refresh();
    };

    void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [lessonId]);

  const progressPercent = lessonProgressPercent(status);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Таны ахиц</h2>
      <p className="mt-1 text-sm text-slate-600">
        Lesson status: {lessonStatusLabel(status)}
      </p>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-emerald-700">
        Progress: {progressPercent}%
      </p>
      <div className="mt-3">
        <LocalProgressNote />
      </div>
    </section>
  );
}
