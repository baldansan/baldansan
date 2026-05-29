"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
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
  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full">
      <MobilePageHeader
        title="Хичээлүүд"
        subtitle="HSK болон практик Хятад, Солонгос хэлийн курсууд"
      />

      {courses.length === 0 ? (
        <MobileCard className="text-center">
          <p className="text-sm text-[var(--app-muted)]">
            Одоогоор курс байхгүй байна.
          </p>
          <Link href="/onboarding" className="app-btn-primary mt-4 inline-flex">
            App заавар үзэх
          </Link>
        </MobileCard>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => (
            <MobileCard key={course.id} padding="lg" className="!p-0 overflow-hidden">
              <div className="p-4">
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
                  <span className="app-stat-pill">{course.lessonCount} хичээл</span>
                  <span className="app-stat-pill">{course.vocabulary} үг</span>
                  <span
                    className={`app-stat-pill ${course.status === "available" ? "app-stat-pill-accent" : ""}`}
                  >
                    {statusLabel(course.status)}
                  </span>
                </div>
              </div>
              <div className="border-t border-[var(--app-border)] px-4 py-3">
                {course.status === "available" && course.href ? (
                  <Link href={course.href} className="app-btn-primary w-full">
                    Хичээлүүд үзэх
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-full bg-slate-100 py-2.5 text-sm font-semibold text-slate-400"
                  >
                    Удахгүй
                  </button>
                )}
              </div>
            </MobileCard>
          ))}
        </div>
      )}

      <MobileCard className="mt-4">
        <p className="font-semibold text-[var(--app-text)]">Анх удаа?</p>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          App хэрхэн ажилладагийг заавраас үзнэ үү.
        </p>
        <Link href="/onboarding" className="app-btn-secondary mt-3 inline-flex">
          Заавар үзэх →
        </Link>
      </MobileCard>
    </MobileAppShell>
  );
}
