"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { lessonPath } from "@/lib/content";
import { resolveContinueLearning } from "@/lib/learner-progress";
import {
  getLessonProgressMapSmart,
  type LessonStatus,
} from "@/lib/progress";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import { getStreakUnified } from "@/lib/retention/retention-service";
import type { LessonContent } from "@/types/lesson-content";

type CourseChip = {
  id: string;
  label: string;
  courseId: string | null;
  available: boolean;
};

const COURSE_CHIPS: CourseChip[] = [
  { id: "hsk1", label: "HSK 1", courseId: null, available: false },
  { id: "hsk4a", label: "HSK 4 上", courseId: "hsk4", available: false },
  { id: "hsk4b", label: "HSK 4 下", courseId: "hsk4", available: false },
  { id: "hsk5a", label: "HSK 5 上", courseId: "hsk5", available: true },
];

type Props = {
  lessons: LessonContent[];
  courseTitle: string;
  courseSubtitle: string;
};

export function HomeAppView({ lessons, courseTitle, courseSubtitle }: Props) {
  const lessonIds = lessons.map((l) => l.id);
  const [displayName, setDisplayName] = useState("Зочин");
  const [loggedIn, setLoggedIn] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [continueHref, setContinueHref] = useState("/lessons/1");
  const [continueTitle, setContinueTitle] = useState("HSK5 Lesson 1");
  const [activeChip, setActiveChip] = useState("hsk5a");
  const [statusByLesson, setStatusByLesson] = useState<
    Record<string, LessonStatus>
  >({});

  useEffect(() => {
    async function load() {
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        setLoggedIn(Boolean(data));
        setDisplayName(data?.email?.split("@")[0] ?? data?.email ?? "Зочин");
      }
      const retention = await getStreakUnified();
      setStreak(retention?.currentStreak ?? null);
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
    <MobileAppShell activeTab="home">
      <section className="mb-4">
        <p className="text-sm text-[var(--app-muted)]">Сайн байна уу</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h1 className="truncate text-xl font-bold text-[var(--app-text)]">
            {displayName}
          </h1>
          {!loggedIn ? (
            <Link
              href="/login"
              className="shrink-0 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Нэвтрэх
            </Link>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {streak != null && streak > 0 ? (
            <span className="app-stat-pill">🔥 {streak} өдөр</span>
          ) : null}
          <span className="app-stat-pill">{completedCount} хичээл</span>
          <span className="app-stat-pill">{progressPercent}%</span>
        </div>
      </section>

      <Link href={continueHref} className="mb-5 block">
        <MobileCard className="flex items-center gap-3 !p-4 !shadow-[var(--app-shadow)]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-xl text-white shadow-sm">
            ▶
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Үргэлжлүүлэх
            </p>
            <p className="truncate text-sm font-semibold text-[var(--app-text)]">
              {continueTitle}
            </p>
          </div>
          <span className="text-lg text-[var(--app-muted)]">→</span>
        </MobileCard>
      </Link>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">Сурах</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {COURSE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              disabled={!chip.available}
              onClick={() => chip.available && setActiveChip(chip.id)}
              className={`app-chip ${activeChip === chip.id ? "app-chip-active" : ""} ${!chip.available ? "opacity-50" : ""}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      <div className="app-course-card mb-5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-100">
          Идэвхтэй курс
        </p>
        <h3 className="mt-1 text-lg font-bold">{courseTitle}</h3>
        <p className="mt-1 text-sm text-orange-50">{courseSubtitle}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold">
            {progressPercent}%
          </span>
          <span className="text-xs text-orange-100">
            {completedCount}/{lessonIds.length} хичээл
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold text-[var(--app-text)]">
          Хичээлийн зам
        </h2>
        <div className="relative flex flex-col gap-0">
          {timelineLessons.map((lesson, index) => {
            const state = lessonNodeState(lesson, index);
            const isLast = index === timelineLessons.length - 1;
            return (
              <div key={lesson.id} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  {state === "locked" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm text-slate-500">
                      🔒
                    </div>
                  ) : state === "active" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-primary)] text-sm font-bold text-white ring-4 ring-[var(--app-primary-light)]">
                      {lesson.id}
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-orange)] text-sm font-bold text-white shadow-sm">
                      {lesson.id}
                    </div>
                  )}
                  {!isLast ? (
                    <div className="my-1 w-0.5 flex-1 min-h-[24px] bg-slate-200" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pb-5">
                  {state === "locked" ? (
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3 opacity-70">
                      <p className="truncate text-sm font-semibold text-slate-500">
                        {lesson.chineseTitle}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {lesson.title}
                      </p>
                    </div>
                  ) : (
                    <Link
                      href={lessonPath(lesson.id)}
                      className="app-card block p-3 transition-colors active:bg-slate-50"
                    >
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
        {lessons.length > 5 ? (
          <Link
            href="/courses/hsk5"
            className="mt-1 block text-center text-sm font-semibold text-emerald-600"
          >
            Бүх хичээл харах →
          </Link>
        ) : null}
      </section>
    </MobileAppShell>
  );
}
