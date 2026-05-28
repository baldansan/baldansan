"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lessonPath } from "@/lib/content";
import {
  countCompletedFromStatusMap,
  getLastActiveLessonId,
  getLessonProgressMapSmart,
  hasAnyProgress,
} from "@/lib/progress";

type Props = {
  lessonIds: string[];
};

export function CoursesHsk5Progress({ lessonIds }: Props) {
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [lastActiveLessonId, setLastActiveLessonId] = useState<string | null>(
    null
  );

  const total = lessonIds.length;

  useEffect(() => {
    async function refresh() {
      const has = hasAnyProgress();
      setShow(has);
      const { byLesson } = await getLessonProgressMapSmart(lessonIds);
      setCompleted(countCompletedFromStatusMap(lessonIds, byLesson));
      setLastActiveLessonId(getLastActiveLessonId());
      setReady(true);
    }

    const onFocus = () => {
      void refresh();
    };

    void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [lessonIds]);

  if (!ready || !show || total === 0) {
    return null;
  }

  const progressPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mt-4 rounded-xl bg-emerald-50/80 p-4 ring-1 ring-emerald-200">
      <p className="text-sm font-medium text-slate-800">
        Completed {completed} / {total} lessons
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {lastActiveLessonId ? (
        <Link
          href={lessonPath(lastActiveLessonId)}
          className="mt-3 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Continue lesson {lastActiveLessonId} →
        </Link>
      ) : null}
    </div>
  );
}
