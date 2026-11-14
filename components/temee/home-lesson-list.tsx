"use client";

import Link from "next/link";
import { useState } from "react";
import { PrefetchLink } from "@/components/navigation/prefetch-link";
import { lessonPath } from "@/lib/content";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { LessonStatus } from "@/lib/progress";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  heading: string;
  lessons: LessonContent[];
  statusByLesson: Record<string, LessonStatus>;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  allLessonsHref?: string | null;
  /** Нүүрт эхлээд хэдэн хичээл харуулах (дараагийн үзэх хичээлээс эхэлнэ). */
  previewCount?: number;
};

export function HomeLessonList({
  heading,
  lessons,
  statusByLesson,
  completedCount,
  totalCount,
  progressPercent,
  allLessonsHref,
  previewCount = 3,
}: Props) {
  const locale = useUiLocale();
  const [expanded, setExpanded] = useState(false);
  if (lessons.length === 0) {
    return (
      <p className="bs-tm-catalog-empty">
        {tr(locale, "Одоогоор хичээл алга.")}
      </p>
    );
  }

  // Дараагийн үзэх хичээлээс эхлээд цөөн хэдийг л харуулна — нүүр богино байна.
  const indexed = lessons.map((lesson, index) => ({ lesson, index }));
  const firstOpen = indexed.findIndex(
    ({ lesson }) => (statusByLesson[lesson.id] ?? "not_started") !== "completed"
  );
  const start =
    firstOpen < 0
      ? Math.max(0, lessons.length - previewCount)
      : Math.min(firstOpen, Math.max(0, lessons.length - previewCount));
  const visible = expanded ? indexed : indexed.slice(start, start + previewCount);
  const hiddenCount = lessons.length - visible.length;

  return (
    <section className="bs-tm-lesson-catalog">
      <header className="bs-tm-lesson-catalog-head">
        <h2 className="bs-tm-lesson-catalog-title">{heading}</h2>
        <p className="bs-tm-lesson-catalog-meta">
          {completedCount}/{totalCount} {tr(locale, "хичээл")} · {progressPercent}%
        </p>
        <div className="bs-tm-lesson-catalog-bar">
          <i style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <ol className="bs-tm-lesson-list bs-stagger">
        {visible.map(({ lesson, index }) => {
          const status = statusByLesson[lesson.id] ?? "not_started";
          const completed = status === "completed";
          const lessonNo = index + 1;
          const coverUrl = lesson.thumbnailUrl || lesson.imageUrl;

          return (
            <li key={lesson.id}>
              <PrefetchLink
                href={lessonPath(lesson.id)}
                className="bs-tm-lesson-row"
              >
                <span
                  className={`bs-tm-lesson-num ${
                    completed ? "bs-tm-lesson-num--done" : ""
                  }`}
                  aria-hidden
                >
                  {lessonNo}
                </span>
                {coverUrl ? (
                  <span className="bs-tm-lesson-thumb" aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverUrl} alt="" loading="lazy" decoding="async" />
                  </span>
                ) : null}
                <span className="bs-tm-lesson-body" translate="no">
                  <span className="bs-tm-lesson-zh hanzi">
                    {lesson.chineseTitle}
                  </span>
                  {locale === "zh" && lesson.chineseTitle ? null : (
                    <span className="bs-tm-lesson-mn">{lesson.title}</span>
                  )}
                </span>
                <span
                  className={`bs-tm-lesson-status ${
                    completed ? "bs-tm-lesson-status--done" : ""
                  }`}
                  aria-hidden
                >
                  {completed ? "✓" : "›"}
                </span>
              </PrefetchLink>
            </li>
          );
        })}
      </ol>

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="bs-tm-lesson-catalog-all w-full"
        >
          {tr(locale, "Бүх хичээлийг харах")} ({lessons.length}) ▾
        </button>
      ) : allLessonsHref ? (
        <Link href={allLessonsHref} className="bs-tm-lesson-catalog-all">
          {tr(locale, "Бүх хичээл харах")} →
        </Link>
      ) : null}
    </section>
  );
}
