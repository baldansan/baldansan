"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { lessonPath } from "@/lib/content";
import { getLessonStatus, type LessonStatus } from "@/lib/progress";
import type { LessonContent, LessonContentStatus } from "@/types/lesson-content";

function localStatusLabel(status: LessonStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "started":
      return "Started";
    default:
      return "Not started";
  }
}

function localStatusBadgeClass(status: LessonStatus): string {
  switch (status) {
    case "completed":
      return "rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white ring-1 ring-emerald-500";
    case "started":
      return "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200";
    default:
      return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200";
  }
}

function actionButtonLabel(
  contentStatus: LessonContentStatus,
  localStatus: LessonStatus
): string {
  if (contentStatus === "locked") return "Locked";
  if (localStatus === "completed") return "Review";
  if (localStatus === "started") return "Continue";
  return "Start";
}

function matchesSearch(lesson: LessonContent, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    lesson.title,
    lesson.chineseTitle,
    lesson.subtitle,
    lesson.description,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

type Props = {
  lessons: LessonContent[];
};

export function Hsk5LessonList({ lessons }: Props) {
  const [search, setSearch] = useState("");
  const [localStatusByLesson, setLocalStatusByLesson] = useState<
    Record<string, LessonStatus>
  >({});

  useEffect(() => {
    function refresh() {
      const next: Record<string, LessonStatus> = {};
      for (const lesson of lessons) {
        next[lesson.id] = getLessonStatus(lesson.id);
      }
      setLocalStatusByLesson(next);
    }

    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [lessons]);

  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => matchesSearch(lesson, search)),
    [lessons, search]
  );

  if (lessons.length === 0) {
    return (
      <EmptyState
        title="No lessons found"
        description="Энэ курс дээр хичээл одоогоор байхгүй байна. Дараа дахин шалгана уу."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="lesson-search" className="sr-only">
        Search lessons
      </label>
      <input
        id="lesson-search"
        type="search"
        placeholder="Хичээл хайх (гарчиг, тайлбар)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2"
      />

      {filteredLessons.length === 0 ? (
        <EmptyState
          title="No lessons found"
          description="Хайлтаар тохирох хичээл олдсонгүй. Өөр түлхүүр үгээр дахин оролдоно уу."
          action={
            <button
              type="button"
              onClick={() => setSearch("")}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Clear search
            </button>
          }
        />
      ) : (
        filteredLessons.map((lesson) => {
          const localStatus =
            localStatusByLesson[lesson.id] ?? ("not_started" as LessonStatus);
          const isLocked = lesson.status === "locked";

          return (
            <article
              key={lesson.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  {lesson.title} — {lesson.chineseTitle}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {isLocked ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                      Locked
                    </span>
                  ) : (
                    <span className={localStatusBadgeClass(localStatus)}>
                      {localStatusLabel(localStatus)}
                    </span>
                  )}
                </div>
              </div>

              {lesson.subtitle ? (
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {lesson.subtitle}
                </p>
              ) : null}

              {lesson.description && lesson.description !== lesson.subtitle ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {lesson.description}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                  {lesson.duration}
                </span>
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                  {lesson.vocabularyCount} vocabulary
                </span>
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                  {lesson.quizCount} quiz questions
                </span>
              </div>

              <div className="mt-4 flex justify-end">
                {isLocked ? (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-400"
                  >
                    Locked
                  </button>
                ) : (
                  <Link
                    href={lessonPath(lesson.id)}
                    className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    {actionButtonLabel(lesson.status, localStatus)}
                  </Link>
                )}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
