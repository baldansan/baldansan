"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
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

/** Хуучин гарчгийн «HSK5A 1-р хичээл — » угтварыг харуулахгүй (дугаар тусдаа бичигдэнэ). */
function cleanLessonTitle(title: string): string {
  return title.replace(/^(HSK|YCT)\s?\d[AB]?\s+\d+-р хичээл\s*[—–-]\s*/u, "").trim() || title;
}

/** Нэг хичээл = нэг жигд мөр: зураг/дугаар · монгол нэр · хятад нэр · үгийн тоо · төлөв. */
function LessonCard({
  lesson,
  localStatus,
  percent,
}: {
  lesson: LessonContent;
  localStatus: LessonStatus;
  percent: number;
}) {
  const isLocked = lesson.status === "locked";
  const lessonNumber = resolveLessonOrder(lesson);
  const coverUrl = lesson.thumbnailUrl || lesson.imageUrl;
  const done = localStatus === "completed";
  // Эхэлсэн боловч үе дуусгаагүй бол 0% биш, хамгийн багадаа 5% гэж харуулна.
  const pct = done ? 100 : localStatus === "started" ? Math.max(5, percent) : percent;

  const body = (
    <>
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" loading="lazy" className="bs-ll-thumb" />
      ) : (
        <span className={`bs-ll-num${done ? " bs-ll-num--done" : ""}`} aria-hidden>
          {done ? "✓" : lessonNumber > 0 ? lessonNumber : "•"}
        </span>
      )}
      <span className="bs-ll-body">
        <span className="bs-ll-k">
          {lessonNumber > 0 ? `${lessonNumber}-р хичээл` : "Хичээл"}
          {lesson.vocabularyCount > 0 ? ` · ${lesson.vocabularyCount} үг` : ""}
        </span>
        <span className="bs-ll-title">{cleanLessonTitle(lesson.title)}</span>
        {lesson.chineseTitle ? (
          <span className="bs-ll-zh" translate="no">{lesson.chineseTitle}</span>
        ) : null}
        {!isLocked ? (
          <span className="bs-ll-bar" aria-hidden>
            <i style={{ width: `${pct}%` }} />
          </span>
        ) : null}
      </span>
      {isLocked ? (
        <span className="bs-ll-st">{contentStatusLabel(lesson.status)}</span>
      ) : (
        <span className={`bs-ll-pct${done ? " bs-ll-pct--done" : pct > 0 ? " bs-ll-pct--on" : ""}`}>
          {pct}%
        </span>
      )}
    </>
  );

  if (isLocked) {
    return <div className="bs-ll-row bs-ll-row--locked">{body}</div>;
  }
  return (
    <Link href={lessonPath(lesson.id)} className="bs-ll-row" aria-label={`${cleanLessonTitle(lesson.title)} — ${localStatusLabel(localStatus)}, ${pct}%`}>
      {body}
    </Link>
  );
}

export function CourseLessonList({ lessons }: Props) {
  const [search, setSearch] = useState("");
  const [localStatusByLesson, setLocalStatusByLesson] = useState<
    Record<string, LessonStatus>
  >({});
  const [percentByLesson, setPercentByLesson] = useState<Record<string, number>>({});

  useEffect(() => {
    async function refresh() {
      const lessonIds = lessons.map((lesson) => lesson.id);
      const { byLesson, percentByLesson: pct } = await getLessonProgressMapSmart(lessonIds);
      setLocalStatusByLesson(byLesson);
      setPercentByLesson(pct);
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
    <div className="flex flex-col gap-2.5">
      <label htmlFor="lesson-search" className="sr-only">
        Хичээл хайх
      </label>
      <input
        id="lesson-search"
        type="search"
        placeholder="Хичээл хайх…"
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
          <div key={`${section.start}-${section.end}`} className="flex flex-col gap-2.5">
            <h2 className="mt-2 text-sm font-bold text-[var(--app-muted)]">
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
                  percent={percentByLesson[lesson.id] ?? 0}
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
              percent={percentByLesson[lesson.id] ?? 0}
            />
          );
        })
      )}
    </div>
  );
}

/** @deprecated Use CourseLessonList */
export const Hsk5LessonList = CourseLessonList;
