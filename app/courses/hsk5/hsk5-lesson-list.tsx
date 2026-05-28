"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { lessonPath } from "@/lib/content";
import type { LessonContent, LessonContentStatus } from "@/types/lesson-content";

function lessonButtonLabel(status: LessonContentStatus) {
  return status === "available" ? "Start" : "Locked";
}

function statusBadgeLabel(status: LessonContentStatus) {
  return status === "available" ? "Available" : "Locked";
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
        filteredLessons.map((lesson) => (
          <article
            key={lesson.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {lesson.title} — {lesson.chineseTitle}
              </h3>
              <span
                className={
                  lesson.status === "available"
                    ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                    : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200"
                }
              >
                {statusBadgeLabel(lesson.status)}
              </span>
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
              {lesson.status === "available" ? (
                <Link
                  href={lessonPath(lesson.id)}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  {lessonButtonLabel(lesson.status)}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-400"
                >
                  {lessonButtonLabel(lesson.status)}
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
