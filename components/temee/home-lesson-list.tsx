"use client";

import Link from "next/link";
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
};

export function HomeLessonList({
  heading,
  lessons,
  statusByLesson,
  completedCount,
  totalCount,
  progressPercent,
  allLessonsHref,
}: Props) {
  const locale = useUiLocale();
  if (lessons.length === 0) {
    return (
      <p className="bs-tm-catalog-empty">
        {tr(locale, "Одоогоор хичээл алга.")}
      </p>
    );
  }

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

      <ol className="bs-tm-lesson-list">
        {lessons.map((lesson, index) => {
          const status = statusByLesson[lesson.id] ?? "not_started";
          const completed = status === "completed";
          const lessonNo = index + 1;
          const coverUrl = lesson.thumbnailUrl || lesson.imageUrl;

          return (
            <li key={lesson.id}>
              <Link
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
                    <img src={coverUrl} alt="" loading="lazy" />
                  </span>
                ) : null}
                <span className="bs-tm-lesson-body">
                  <span className="bs-tm-lesson-zh hanzi">
                    {lesson.chineseTitle}
                  </span>
                  <span className="bs-tm-lesson-mn">{lesson.title}</span>
                </span>
                <span
                  className={`bs-tm-lesson-status ${
                    completed ? "bs-tm-lesson-status--done" : ""
                  }`}
                  aria-hidden
                >
                  {completed ? "✓" : "›"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {allLessonsHref ? (
        <Link href={allLessonsHref} className="bs-tm-lesson-catalog-all">
          {tr(locale, "Бүх хичээл харах")} →
        </Link>
      ) : null}
    </section>
  );
}
