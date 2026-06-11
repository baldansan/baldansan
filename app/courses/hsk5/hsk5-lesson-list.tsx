"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ctaPrimaryClass } from "@/components/ui/cta-button-row";
import { lessonPath } from "@/lib/content";
import {
  getLessonProgressMapSmart,
  type LessonStatus,
} from "@/lib/progress";
import {
  groupLessonsBySections,
  resolveLessonOrder,
} from "@/lib/course-lesson-sections";
import type { LessonContent, LessonContentStatus } from "@/types/lesson-content";

function localStatusLabel(status: LessonStatus): string {
  switch (status) {
    case "completed":
      return "Дууссан";
    case "started":
      return "Яваж байна";
    default:
      return "Эхлээгүй";
  }
}

function contentStatusLabel(status: LessonContentStatus): string {
  if (status === "locked") return "Удахгүй";
  return "Бэлэн";
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
  if (contentStatus === "locked") return "Түгжээтэй";
  if (localStatus === "completed") return "Давтах";
  if (localStatus === "started") return "Үргэлжлүүлэх";
  return "Эхлэх";
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

function LessonCard({
  lesson,
  localStatus,
}: {
  lesson: LessonContent;
  localStatus: LessonStatus;
}) {
  const isLocked = lesson.status === "locked";
  const lessonNumber = resolveLessonOrder(lesson);

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-emerald-600">
            {lessonNumber > 0 ? `${lessonNumber}-р хичээл` : lesson.id}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold leading-snug text-slate-900">
            {lesson.title}
          </h3>
          <p className="text-base text-slate-700">{lesson.chineseTitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isLocked ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              {contentStatusLabel(lesson.status)}
            </span>
          ) : (
            <span className={localStatusBadgeClass(localStatus)}>
              {localStatusLabel(localStatus)}
            </span>
          )}
        </div>
      </div>

      {lesson.subtitle ? (
        <p className="mt-2 text-sm font-medium text-slate-700">{lesson.subtitle}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
          {lesson.duration}
        </span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
          {lesson.vocabularyCount} үг
        </span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
          {lesson.quizCount} quiz
        </span>
      </div>

      <div className="mt-4 flex justify-end">
        {isLocked ? (
          <button
            type="button"
            disabled
            className="min-h-[44px] cursor-not-allowed rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-400"
          >
            Түгжээтэй
          </button>
        ) : (
          <Link href={lessonPath(lesson.id)} className={ctaPrimaryClass}>
            {actionButtonLabel(lesson.status, localStatus)}
          </Link>
        )}
      </div>
    </article>
  );
}

export function CourseLessonList({ lessons }: Props) {
  const [search, setSearch] = useState("");
  const [localStatusByLesson, setLocalStatusByLesson] = useState<
    Record<string, LessonStatus>
  >({});

  useEffect(() => {
    async function refresh() {
      const lessonIds = lessons.map((lesson) => lesson.id);
      const { byLesson } = await getLessonProgressMapSmart(lessonIds);
      setLocalStatusByLesson(byLesson);
    }

    const onFocus = () => {
      void refresh();
    };

    void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [lessons]);

  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => matchesSearch(lesson, search)),
    [lessons, search]
  );

  const sectionGroups = useMemo(
    () => groupLessonsBySections(filteredLessons),
    [filteredLessons]
  );

  const showSections = !search.trim() && sectionGroups.length > 1;

  if (lessons.length === 0) {
    return (
      <EmptyState
        title="Хичээл байхгүй"
        description="Энэ курс дээр хичээл одоогоор байхгүй байна. Дараа дахин шалгана уу."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="lesson-search" className="sr-only">
        Хичээл хайх
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
          title="Хичээл олдсонгүй"
          description="Хайлтаар тохирох хичээл олдсонгүй. Өөр түлхүүр үгээр дахин оролдоно уу."
          action={
            <button
              type="button"
              onClick={() => setSearch("")}
              className="min-h-[44px] rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Хайлт цэвэрлэх
            </button>
          }
        />
      ) : showSections ? (
        sectionGroups.map((section) => (
          <div key={`${section.start}-${section.end}`} className="flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {section.label}
            </h2>
            {section.lessons.map((lesson) => {
              const localStatus =
                localStatusByLesson[lesson.id] ?? ("not_started" as LessonStatus);
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  localStatus={localStatus}
                />
              );
            })}
          </div>
        ))
      ) : (
        filteredLessons.map((lesson) => {
          const localStatus =
            localStatusByLesson[lesson.id] ?? ("not_started" as LessonStatus);
          return (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              localStatus={localStatus}
            />
          );
        })
      )}
    </div>
  );
}

/** @deprecated Use CourseLessonList */
export const Hsk5LessonList = CourseLessonList;
