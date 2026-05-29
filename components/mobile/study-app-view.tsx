"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLearnerLanguageLessons } from "@/hooks/use-learner-language-lessons";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { lessonPath } from "@/lib/content";
import { languageTrackShortLabel } from "@/lib/language-track";
import {
  getLessonProgressMapSmart,
  type LessonStatus,
} from "@/lib/progress";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  allLessons: LessonContent[];
};

export function StudyAppView({ allLessons }: Props) {
  const { lessons, trackLabel, ready, lang } = useLearnerLanguageLessons(allLessons);
  const [statusByLesson, setStatusByLesson] = useState<
    Record<string, LessonStatus>
  >({});

  useEffect(() => {
    async function load() {
      const ids = lessons.map((l) => l.id);
      if (ids.length === 0) return;
      const { byLesson } = await getLessonProgressMapSmart(ids);
      setStatusByLesson(byLesson);
    }
    void load();
  }, [lessons]);

  const completedCount = useMemo(
    () =>
      lessons.filter(
        (l) => (statusByLesson[l.id] ?? "not_started") === "completed"
      ).length,
    [lessons, statusByLesson]
  );
  const progressPercent =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

  const progressLabel = lang ? languageTrackShortLabel(lang) : trackLabel;

  if (!ready) {
    return (
      <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна…
        </p>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full">
      <MobilePageHeader
        title={trackLabel || "Дасгалжуулалтын төв"}
        subtitle="Чадвараа сонгон бататгаж, түвшин ахиарай"
      />

      <div className="app-course-card mb-5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-100">
          {progressLabel} явц
        </p>
        <p className="mt-1 text-2xl font-bold">{progressPercent}%</p>
        <p className="text-sm text-orange-50">
          {completedCount}/{lessons.length} хичээл дууссан
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <Link href="/review" className="mb-5 block">
        <MobileCard className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-[var(--app-text)]">
              Миний үгийн сан
            </p>
            <p className="mt-0.5 text-xs text-[var(--app-muted)]">
              Сонгосон хэлний сурсан болон давтах үгс
            </p>
          </div>
          <span className="text-lg text-[var(--app-muted)]">›</span>
        </MobileCard>
      </Link>

      <section>
        <h2 className="mb-3 text-sm font-bold text-[var(--app-text)]">
          Хичээлийн бүлгүүд
        </h2>

        {lessons.length === 0 ? (
          <MobileCard className="text-center">
            <p className="text-sm text-[var(--app-muted)]">
              Энэ хэлний хичээл одоогоор байхгүй байна.
            </p>
            <Link href="/onboarding" className="app-btn-primary mt-3 inline-flex">
              Хэл сонгох
            </Link>
          </MobileCard>
        ) : (
          <MobileCard padding="sm" className="overflow-hidden !p-0">
            <div className="border-b border-[var(--app-border)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--app-text)]">
                Хичээл сонгох
              </p>
              <p className="text-xs text-[var(--app-muted)]">{trackLabel}</p>
            </div>
            <ul>
              {lessons.map((lesson) => {
                const status = statusByLesson[lesson.id] ?? "not_started";
                const progressStatusLabel =
                  status === "completed"
                    ? "Дууссан"
                    : status === "started"
                      ? "Яваж байна"
                      : `0/${lesson.quizCount || 10}`;
                return (
                  <li key={lesson.id}>
                    <Link href={lessonPath(lesson.id)} className="app-menu-row">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                        {lesson.id}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-[var(--app-text)]">
                          {lesson.chineseTitle}
                        </span>
                        <span className="block truncate text-xs text-[var(--app-muted)]">
                          {lesson.title}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {progressStatusLabel}
                      </span>
                      <span className="text-[var(--app-muted)]">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </MobileCard>
        )}
      </section>
    </MobileAppShell>
  );
}
