"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { HSK30_REVIEW_BASE, hsk30PointHref } from "@/lib/hsk30-durem/load-course";
import type { Hsk30Level } from "@/types/hsk30-durem";

type Props = {
  level: Hsk30Level;
};

export function Hsk30LevelView({ level }: Props) {
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <Link
        href={HSK30_REVIEW_BASE}
        className="mb-3 inline-flex text-xs font-bold text-[#1FB85A]"
      >
        ← Түвшнүүд
      </Link>

      <div className="hz-course-hero" style={{ paddingBottom: 18 }}>
        <span className="hz-course-badge">
          <span className="hz-course-dot" />
          HSK 3.0 дүрэм
        </span>
        <h1 className="hz-course-hero-title">{level.title}</h1>
        <p className="hz-course-hero-sub">
          {level.points.length} дүрмийн цэг — дарж дэлгэрэнгүй үзнэ үү
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {level.points.map((point, index) => (
          <Link
            key={point.id}
            href={hsk30PointHref(level.levelId, point.id)}
          >
            <MobileCard className="hz-module-card active:bg-slate-50">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="zh text-lg font-bold text-[#13241b]">
                    {point.zh}
                  </p>
                  <p className="text-xs font-semibold text-[#1FB85A]">
                    {point.pin}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--app-muted)] line-clamp-2">
                    {point.gloss}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-[var(--app-muted)]">
                  {index + 1}
                </span>
              </div>
            </MobileCard>
          </Link>
        ))}
      </div>
    </MobileAppShell>
  );
}
