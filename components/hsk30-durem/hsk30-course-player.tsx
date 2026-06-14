"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { hsk30LevelHref } from "@/lib/hsk30-durem/load-course";
import type { Hsk30DuremCourse } from "@/types/hsk30-durem";

type Props = {
  course: Hsk30DuremCourse;
};

export function Hsk30CoursePlayer({ course }: Props) {
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <Link
        href="/review"
        className="mb-3 inline-flex text-xs font-bold text-[#1FB85A]"
      >
        ← Давтах
      </Link>

      <div className="hz-course-hero">
        <span className="hz-course-badge">
          <span className="hz-course-dot" />
          {course.category}
        </span>
        <h1 className="hz-course-hero-title">{course.title}</h1>
        <p className="hz-course-hero-sub">{course.subtitle}</p>
      </div>

      {course.source ? (
        <p className="hz-meta">{course.source}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {course.levels.map((level) => (
          <Link key={level.levelId} href={hsk30LevelHref(level.levelId)}>
            <MobileCard className="hz-module-card active:bg-slate-50">
              <div className="hz-mod-eyebrow" style={{ marginBottom: 4 }}>
                <span className="hz-mod-num">{level.level}</span>
                {level.title}
              </div>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {level.pointCount ?? level.points.length} дүрмийн цэг
              </p>
            </MobileCard>
          </Link>
        ))}
      </div>
    </MobileAppShell>
  );
}
