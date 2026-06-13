"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { HelzuiLegend } from "@/components/helzui/helzui-legend";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import {
  HELZUI_REVIEW_BASE,
  helzuiModuleHref,
} from "@/lib/helzui/load-course";
import type { HelzuiCourse } from "@/types/helzui-course";

type Props = {
  course: HelzuiCourse;
  /** Module list base path (default: courses catalog). */
  modulesBase?: string;
  backHref?: string;
  heroTitle?: string;
  heroBadge?: string;
};

export function HelzuiCoursePlayer({
  course,
  modulesBase = "/courses/helzui-suuri",
  backHref,
  heroTitle = "Гол гишүүд",
  heroBadge,
}: Props) {
  const totalExams = course.modules.reduce(
    (sum, m) => sum + m.realExams.length + m.practice.length,
    0
  );
  const badge = heroBadge ?? `${course.category} · Үндэс`;
  const isReview = modulesBase === HELZUI_REVIEW_BASE;

  return (
    <MobileAppShell
      activeTab={isReview ? "study" : "study"}
      mainClassName={SHELL_MAIN_NARROW}
    >
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-flex text-xs font-bold text-[#1FB85A]"
        >
          ← Давтах
        </Link>
      ) : null}

      <div className="hz-course-hero">
        <span className="hz-course-badge">
          <span className="hz-course-dot" />
          {badge}
        </span>
        <h1 className="hz-course-hero-title">{heroTitle}</h1>
        <p className="hz-course-hero-sub">{course.subtitle}</p>
      </div>

      <HelzuiLegend roleColors={course.roleColors} />

      <p className="hz-meta">
        📦 <b>{course.modules.length} модуль</b>, нийт{" "}
        <b>{totalExams} дасгал</b> — бүгд хариутай.
      </p>

      <div className="flex flex-col gap-3">
        {course.modules.map((module) => (
          <Link
            key={module.id}
            href={helzuiModuleHref(module.id, modulesBase)}
          >
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
