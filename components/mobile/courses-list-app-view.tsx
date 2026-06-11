"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import { courseMatchesLanguage, languageTrackLabel } from "@/lib/language-track";
import { CourseCover } from "@/components/courses/course-cover";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import type { Course } from "@/types/course";

type CourseCard = Course & {
  lessonCount: number;
};

type Props = {
  courses: CourseCard[];
};

function statusLabel(status: Course["status"]) {
  return status === "available" ? "Бэлэн" : "Удахгүй";
}

export function CoursesListAppView({ courses }: Props) {
  const [trackLabel, setTrackLabel] = useState("");

  useEffect(() => {
    const lang = getSelectedLanguage();
    if (lang) setTrackLabel(languageTrackLabel(lang));
  }, []);

  const visibleCourses = useMemo(() => {
    const lang = getSelectedLanguage();
    if (!lang) return courses;
    return courses.filter((course) => courseMatchesLanguage(course.id, lang));
  }, [courses]);

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title="Хичээлүүд"
        subtitle={
          trackLabel
            ? `${trackLabel} — зөвхөн сонгосон хэлний курсууд`
            : "Сурах хэлээ onboarding эсвэл Settings-оос сонгоно уу"
        }
      />

      {visibleCourses.length === 0 ? (
        <MobileCard className="text-center">
          <p className="text-sm text-[var(--app-muted)]">
            Энэ хэлний курс одоогоор байхгүй байна.
          </p>
          <Link href="/onboarding" className="app-btn-primary mt-4 inline-flex">
            Хэл сонгох
          </Link>
        </MobileCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visibleCourses.map((course) => (
            <MobileCard key={course.id} padding="lg" className="!p-0 overflow-hidden">
              <div className="p-4">
                <div
                  className={
                    course.coverUrl ? "flex items-start gap-3" : undefined
                  }
                >
                  {course.coverUrl ? (
                    <CourseCover src={course.coverUrl} alt={course.title} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-bold text-[var(--app-text)]">
                        {course.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                        {course.level}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                      {course.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="app-stat-pill">
                        {course.lessonCount} хичээл
                      </span>
                      <span className="app-stat-pill">{course.vocabulary} үг</span>
                      <span
                        className={`app-stat-pill ${course.status === "available" ? "app-stat-pill-accent" : ""}`}
                      >
                        {statusLabel(course.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {course.href && course.status === "available" ? (
                <Link
                  href={course.href}
                  className="block border-t border-[var(--app-border)] bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700"
                >
                  Курс нээх →
                </Link>
              ) : null}
            </MobileCard>
          ))}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-[var(--app-muted)]">
        <Link href="/settings" className="font-semibold text-emerald-600">
          Settings → Сурах хэл солих
        </Link>
      </p>
    </MobileAppShell>
  );
}
