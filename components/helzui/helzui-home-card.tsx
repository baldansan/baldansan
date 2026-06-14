"use client";

import Link from "next/link";
import { getHelzuiCourse } from "@/lib/helzui/load-course";

export const HELZUI_COURSE_ID = "helzui-suuri";
export const HELZUI_CATEGORY_LABEL = "Заавал сурах";

export function helzuiCourseSummary() {
  const course = getHelzuiCourse();
  return {
    id: course.courseId,
    title: course.title,
    subtitle: course.subtitle ?? "",
    category: course.category,
    moduleCount: course.modules.length,
    href: "/courses/helzui-suuri",
  };
}

export function HelzuiHomeCard() {
  const summary = helzuiCourseSummary();
  return (
    <section className="mb-4">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
        {HELZUI_CATEGORY_LABEL}
      </h2>
      <Link href={summary.href} className="hz-home-card">
        <div className="hz-home-card-inner">
          <span className="hz-home-card-icon" aria-hidden>
            📐
          </span>
          <div className="min-w-0 flex-1">
            <p className="hz-home-card-title">{summary.title}</p>
            <p className="hz-home-card-sub">
              {summary.moduleCount} модуль · {summary.subtitle}
            </p>
          </div>
          <span className="text-base text-[var(--app-muted)]">→</span>
        </div>
      </Link>
    </section>
  );
}
