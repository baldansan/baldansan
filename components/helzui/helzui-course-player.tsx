"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { HelzuiLegend } from "@/components/helzui/helzui-legend";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { helzuiModuleHref } from "@/lib/helzui/load-course";
import type { HelzuiCourse } from "@/types/helzui-course";

type Props = {
  course: HelzuiCourse;
};

export function HelzuiCoursePlayer({ course }: Props) {
  const totalExams = course.modules.reduce(
    (sum, m) => sum + m.realExams.length + m.practice.length,
    0
  );

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <div className="hz-course-hero">
        <span className="hz-course-badge">
          <span className="hz-course-dot" />
          {course.category} · Үндэс
        </span>
        <h1 className="hz-course-hero-title">Гол гишүүд</h1>
        <p className="hz-course-hero-sub">{course.subtitle}</p>
      </div>

      <HelzuiLegend roleColors={course.roleColors} />

      <p className="hz-meta">
        📦 Энэ хичээлд: <b>{course.modules.length} модуль</b>, нийт{" "}
        <b>{totalExams} дасгал</b> — бүгд хариутай.
      </p>

      <MobilePageHeader title={course.title} subtitle={course.category} />

      <div className="flex flex-col gap-3">
        {course.modules.map((module) => (
          <Link key={module.id} href={helzuiModuleHref(module.id)}>
            <MobileCard className="hz-module-card active:bg-slate-50">
              <div className="hz-mod-eyebrow" style={{ marginBottom: 4 }}>
                <span className="hz-mod-num">{module.number}</span>
                {module.mnTitle}
                <span className="hz-mod-pin zh">
                  · {module.zh} {module.pinyin}
                </span>
              </div>
              <h2 className="hz-mod-heading" style={{ fontSize: 17 }}>
                {module.heading}
              </h2>
              <p className="mt-2 text-xs text-[var(--app-muted)]">
                {module.realExams.length} 真题 · {module.practice.length} 完成句子
              </p>
            </MobileCard>
          </Link>
        ))}
      </div>
    </MobileAppShell>
  );
}
