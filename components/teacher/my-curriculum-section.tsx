"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { lessonPath } from "@/lib/content";
import { curriculumCourseLabel, type MyCurriculumClass } from "@/lib/classroom/types";

/** /my-assignments: «Ангийн заавал хичээл» — анги бүрийн хөтөлбөр дарааллаар, ✓ / ▶ / ○. */
export function MyCurriculumSection({ classes }: { classes: MyCurriculumClass[] }) {
  const locale = useUiLocale();
  if (classes.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-900">
        {tr(locale, "Ангийн заавал хичээл")}
      </h2>
      {classes.map((c) => (
        <div
          key={c.classroomId}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">
              <span translate="no">{c.classroomName}</span>
              {c.courseId ? (
                <span className="text-emerald-700"> · {curriculumCourseLabel(c.courseId)}</span>
              ) : null}
            </p>
            <p className="text-sm font-bold text-emerald-700">
              {c.completedCount}/{c.totalCount}
            </p>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={c.totalCount}
            aria-valuenow={c.completedCount}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${c.percent}%` }}
            />
          </div>
          {c.nextLessonId == null ? (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              🎉 {tr(locale, "Заавал хичээлүүдээ бүгдийг дуусгасан!")}
            </p>
          ) : null}

          <ol className="mt-3 flex flex-col gap-1">
            {c.lessons.map((lesson, i) => {
              const isNext = lesson.lessonId === c.nextLessonId;
              return (
                <li key={lesson.assignmentId}>
                  <Link
                    href={lessonPath(lesson.lessonId)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                      isNext
                        ? "bg-emerald-50 font-semibold text-emerald-900 ring-1 ring-emerald-200"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                        lesson.completed
                          ? "bg-emerald-500 text-white"
                          : isNext
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-400"
                      }`}
                      aria-hidden
                    >
                      {lesson.completed ? "✓" : isNext ? "▶" : "○"}
                    </span>
                    <span className="w-5 shrink-0 text-right text-xs text-slate-400">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate" translate="no">
                      {lesson.title}
                    </span>
                    {isNext ? (
                      <span className="shrink-0 text-xs font-bold text-emerald-700">
                        {tr(locale, "Дараагийн")} →
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
