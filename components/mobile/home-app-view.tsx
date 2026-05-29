"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { lessonPath } from "@/lib/content";
import { resolveContinueLearning } from "@/lib/learner-progress";
import type { MobileCourseCatalogEntry } from "@/lib/mobile-course-options";
import { courseCardAccentClass, courseChipBadge } from "@/lib/course-display";
import {
  getLessonProgressMapSmart,
  type LessonStatus,
} from "@/lib/progress";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import { getStreakUnified } from "@/lib/retention/retention-service";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  catalog: MobileCourseCatalogEntry[];
  defaultChipId: string;
};

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function HomeAppView({ catalog, defaultChipId }: Props) {
  const [activeChip, setActiveChip] = useState(defaultChipId);
  const [displayName, setDisplayName] = useState("Зочин");
  const [loggedIn, setLoggedIn] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [continueHref, setContinueHref] = useState("/lessons/1");
  const [continueTitle, setContinueTitle] = useState("HSK5 Lesson 1");
  const [statusByLesson, setStatusByLesson] = useState<
    Record<string, LessonStatus>
  >({});

  const activeCourse = useMemo(
    () => catalog.find((entry) => entry.chipId === activeChip) ?? catalog[0],
    [catalog, activeChip]
  );

  const lessons = activeCourse?.lessons ?? [];
  const lessonIds = useMemo(() => lessons.map((l) => l.id), [lessons]);

  useEffect(() => {
    async function load() {
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        setLoggedIn(Boolean(data));
        setDisplayName(data?.email?.split("@")[0] ?? data?.email ?? "Зочин");
      }
      const retention = await getStreakUnified();
      setStreak(retention?.currentStreak ?? null);
      if (lessonIds.length === 0) return;
      const cont = await resolveContinueLearning(lessonIds);
      if (cont) {
        setContinueHref(cont.href);
        const lesson = lessons.find((l) => l.id === cont.lessonId);
        setContinueTitle(
          lesson
            ? `${lesson.chineseTitle} · ${lesson.title}`
            : `Хичээл ${cont.lessonId}`
        );
      }
      const { byLesson } = await getLessonProgressMapSmart(lessonIds);
      setStatusByLesson(byLesson);
    }
    void load();
  }, [lessonIds, lessons]);

  const completedCount = useMemo(
    () =>
      lessonIds.filter((id) => (statusByLesson[id] ?? "not_started") === "completed")
        .length,
    [lessonIds, statusByLesson]
  );

  const progressPercent =
    lessonIds.length > 0
      ? Math.round((completedCount / lessonIds.length) * 100)
      : 0;

  const timelineLessons = lessons.slice(0, 5);

  function lessonNodeState(
    lesson: LessonContent,
    index: number
  ): "active" | "available" | "locked" {
    if (lesson.status === "locked") return "locked";
    const status = statusByLesson[lesson.id] ?? "not_started";
    if (status === "completed" || status === "started") return "active";
    const prev = timelineLessons[index - 1];
    if (!prev) return "available";
    const prevStatus = statusByLesson[prev.id] ?? "not_started";
    if (prevStatus === "completed" || prevStatus === "started") return "available";
    if (index === 0) return "available";
    return "locked";
  }

  return (
    <MobileAppShell activeTab="home" mainClassName="max-w-[390px] mx-auto w-full">
      <section className="mb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-base font-bold text-white shadow-sm ring-2 ring-white"
            aria-hidden
          >
            {avatarInitial(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--app-muted)]">
              Сайн байна уу
            </p>
            <h1 className="truncate text-lg font-bold text-[var(--app-text)]">
              {displayName}
            </h1>
          </div>
          {!loggedIn ? (
            <Link href="/login" className="app-btn-primary shrink-0 !min-h-0 !px-3 !py-1.5 !text-xs">
              Нэвтрэх
            </Link>
          ) : (
            <Link
              href="/profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-[var(--app-border)]"
              aria-label="Профайл"
            >
              👤
            </Link>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {streak != null && streak > 0 ? (
            <span className="app-stat-pill app-stat-pill-accent">🔥 {streak} өдөр</span>
          ) : null}
          <span className="app-stat-pill">✓ {completedCount} хичээл</span>
          <span className="app-stat-pill">{progressPercent}% явц</span>
        </div>
      </section>

      {activeCourse?.available && lessonIds.length > 0 ? (
        <Link href={continueHref} className="mb-4 block min-h-[44px]">
          <MobileCard className="flex items-center gap-3 !p-3.5 active:bg-slate-50">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-emerald-500 text-lg text-white shadow-sm">
              ▶
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                Үргэлжлүүлэх
              </p>
              <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                {continueTitle}
              </p>
            </div>
            <span className="text-base text-[var(--app-muted)]">→</span>
          </MobileCard>
        </Link>
      ) : null}

      <section className="mb-3">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
          Сурах
        </h2>
        <div className="app-chip-scroll -mx-1 px-1">
          {catalog.map((chip) => (
            <button
              key={chip.chipId}
              type="button"
              disabled={!chip.available}
              onClick={() => chip.available && setActiveChip(chip.chipId)}
              className={`app-chip ${activeChip === chip.chipId ? "app-chip-active" : ""} ${!chip.available ? "app-chip-disabled" : ""}`}
            >
              <span>{chip.chipLabel}</span>
              {chip.chipHint ? (
                <span className="ml-1 text-[10px] font-normal opacity-80">
                  {chip.chipHint}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <div
        className={`app-course-card app-course-card-premium mb-4 p-4 ${activeCourse ? courseCardAccentClass(activeCourse.courseId) : ""}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">
          {activeCourse ? courseChipBadge(activeCourse.courseId) : "Курс"}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-base font-bold leading-snug">
          {activeCourse?.title ?? "—"}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/90">
          {activeCourse?.subtitle ?? ""}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
            {progressPercent}%
          </span>
          <span className="text-[11px] text-white/85">
            {completedCount}/{lessonIds.length || 0} хичээл
          </span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <section>
        <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
          Хичээлийн зам
        </h2>
        {timelineLessons.length === 0 ? (
          <MobileCard className="text-center !py-6">
            <p className="text-sm text-[var(--app-muted)]">
              {activeCourse?.available
                ? "Энэ курс дээр хичээл байхгүй байна."
                : "Энэ курс удахгүй нээгдэнэ."}
            </p>
          </MobileCard>
        ) : (
          <div className="relative flex flex-col">
            {timelineLessons.map((lesson, index) => {
              const state = lessonNodeState(lesson, index);
              const isLast = index === timelineLessons.length - 1;
              return (
                <div key={lesson.id} className="relative flex gap-2.5">
                  <div className="flex w-9 shrink-0 flex-col items-center">
                    {state === "locked" ? (
                      <div className="app-timeline-node app-timeline-node-locked">
                        🔒
                      </div>
                    ) : state === "active" ? (
                      <div className="app-timeline-node app-timeline-node-active">
                        {index + 1}
                      </div>
                    ) : (
                      <div className="app-timeline-node app-timeline-node-next">
                        {index + 1}
                      </div>
                    )}
                    {!isLast ? (
                      <div className="my-0.5 w-0.5 flex-1 min-h-[20px] bg-[var(--app-border)]" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-3.5">
                    {state === "locked" ? (
                      <div className="app-timeline-card-locked">
                        <p className="truncate text-sm font-medium text-slate-600">
                          {lesson.chineseTitle}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {lesson.title}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                          Түгжээтэй
                        </p>
                      </div>
                    ) : (
                      <Link href={lessonPath(lesson.id)} className="app-timeline-card">
                        <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                          {lesson.chineseTitle}
                        </p>
                        <p className="truncate text-xs text-[var(--app-muted)]">
                          {lesson.title}
                        </p>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {activeCourse?.allLessonsHref && lessons.length > 5 ? (
          <Link
            href={activeCourse.allLessonsHref}
            className="mt-1 block text-center text-sm font-semibold text-emerald-600"
          >
            Бүх хичээл харах →
          </Link>
        ) : null}
      </section>
    </MobileAppShell>
  );
}
