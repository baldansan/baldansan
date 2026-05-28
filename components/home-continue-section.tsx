"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lessonPath } from "@/lib/content";
import {
  countCompletedLessonsAll,
  getLastActiveLessonId,
  hasAnyProgress,
} from "@/lib/progress";

export function HomeContinueSection() {
  const [ready, setReady] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [lastActiveLessonId, setLastActiveLessonId] = useState<string | null>(
    null
  );
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setHasProgress(hasAnyProgress());
      setLastActiveLessonId(getLastActiveLessonId());
      setCompletedCount(countCompletedLessonsAll());
      setReady(true);
    }

    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
      {hasProgress ? (
        <>
          <h2 className="text-lg font-semibold text-slate-900">
            Сүүлд үзсэн хичээлээ үргэлжлүүлэх
          </h2>
          {completedCount > 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              Дууссан хичээл: {completedCount}
            </p>
          ) : null}
          {lastActiveLessonId ? (
            <Link
              href={lessonPath(lastActiveLessonId)}
              className="mt-4 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Хичээл {lastActiveLessonId} үргэлжлүүлэх →
            </Link>
          ) : (
            <Link
              href="/courses/hsk5"
              className="mt-4 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              HSK5 курс үргэлжлүүлэх →
            </Link>
          )}
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-slate-900">
            Эхний хичээлээ эхлүүлээрэй
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            HSK5 курсаас өнөөдөр эхлээрэй.
          </p>
          <Link
            href="/courses/hsk5"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            HSK5 курс эхлэх →
          </Link>
        </>
      )}
    </section>
  );
}
