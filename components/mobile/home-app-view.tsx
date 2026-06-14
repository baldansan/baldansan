"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import {
  catalogEntryMatchesLanguage,
  languageTrackLabel,
  resolveDefaultChipForLanguage,
} from "@/lib/language-track";
import {
  useActiveHskLevel,
  useRegisterLessonHskLevels,
} from "@/components/providers/active-hsk-level-provider";
import { HomeLessonList } from "@/components/temee/home-lesson-list";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { formatHomeCourseListHeading } from "@/lib/temee/home-course-display";
import { resolveContinueLearning } from "@/lib/learner-progress";
import type { BichlegContinueTarget } from "@/lib/bichleg/types";
import type { MobileCourseCatalogEntry } from "@/lib/mobile-course-options";
import { fetchBichlegContinueTargetClient } from "@/lib/supabase/video-progress-client";
import {
  getLessonProgressMapSmart,
  type LessonStatus,
} from "@/lib/progress";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import { getStreakUnified } from "@/lib/retention/retention-service";
import {
  filterLessonsByActiveHskLevel,
  lessonMatchesActiveHskLevel,
  resolveLessonHskLevel,
} from "@/lib/hsk/active-hsk-level";
import { HelzuiHomeCard } from "@/components/helzui/helzui-home-card";
import "@/components/helzui/helzui-course.css";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  catalog: MobileCourseCatalogEntry[];
  defaultChipId: string;
};

function resolveCatalogChipLevel(entry: MobileCourseCatalogEntry): number | null {
  const fromCourse = resolveLessonHskLevel({ courseId: entry.courseId });
  if (fromCourse != null) return fromCourse;
  const chip = entry.chipId.toLowerCase();
  const match = chip.match(/hsk(\d)/);
  return match ? Number(match[1]) : null;
}

export function HomeAppView({ catalog, defaultChipId }: Props) {
  const { level: activeHskLevel, hydrated: hskHydrated } = useActiveHskLevel();
  const [selectedLang, setSelectedLang] = useState<ReturnType<typeof getSelectedLanguage>>(null);
  const [activeChip, setActiveChip] = useState(defaultChipId);
  const [displayName, setDisplayName] = useState("Суралцагч");
  const [loggedIn, setLoggedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [continueHref, setContinueHref] = useState("/lessons/1");
  const [continueTitle, setContinueTitle] = useState("Хичээл 1");
  const [statusByLesson, setStatusByLesson] = useState<
    Record<string, LessonStatus>
  >({});
  const [bichlegContinue, setBichlegContinue] =
    useState<BichlegContinueTarget | null>(null);

  const visibleCatalog = useMemo(() => {
    let entries = catalog;
    if (selectedLang) {
      entries = entries.filter((entry) => {
        if (!entry.available) {
          return selectedLang === "zh"
            ? entry.courseId.includes("hsk")
            : entry.courseId.startsWith("korean");
        }
        return catalogEntryMatchesLanguage(entry, selectedLang);
      });
    }
    if (selectedLang === "zh" && hskHydrated) {
      entries = entries.filter((entry) => {
        const chipLevel = resolveCatalogChipLevel(entry);
        if (chipLevel == null) return entry.courseId.includes("hsk");
        return lessonMatchesActiveHskLevel(activeHskLevel, {
          courseId: `hsk${chipLevel}`,
        });
      });
    }
    return entries;
  }, [catalog, selectedLang, activeHskLevel, hskHydrated]);

  useRegisterLessonHskLevels(catalog.flatMap((entry) => entry.lessons));

  useEffect(() => {
    const lang = getSelectedLanguage();
    setSelectedLang(lang);
    if (!lang) return;
    const chip = resolveDefaultChipForLanguage(lang, visibleCatalog);
    if (chip) setActiveChip(chip);
  }, [visibleCatalog]);

  useEffect(() => {
    if (visibleCatalog.some((entry) => entry.chipId === activeChip)) return;
    const fallback =
      visibleCatalog.find((entry) => entry.available)?.chipId ??
      visibleCatalog[0]?.chipId;
    if (fallback) setActiveChip(fallback);
  }, [visibleCatalog, activeChip]);

  const activeCourse = useMemo(
    () =>
      visibleCatalog.find((entry) => entry.chipId === activeChip) ??
      visibleCatalog[0],
    [visibleCatalog, activeChip]
  );

  const lessons = useMemo(() => {
    const base = activeCourse?.lessons ?? [];
    if (selectedLang !== "zh" || !hskHydrated) return base;
    return filterLessonsByActiveHskLevel(base, activeHskLevel);
  }, [activeCourse?.lessons, selectedLang, hskHydrated, activeHskLevel]);
  const lessonIds = useMemo(() => lessons.map((l) => l.id), [lessons]);

  useEffect(() => {
    async function load() {
      let isLoggedIn = false;
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        isLoggedIn = Boolean(data);
        setLoggedIn(isLoggedIn);
        setDisplayName(data?.email?.split("@")[0] ?? "Суралцагч");
      }
      const retention = await getStreakUnified();
      setStreak(retention?.currentStreak ?? 0);
      if (lessonIds.length > 0) {
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
      if (isLoggedIn) {
        const clip = await fetchBichlegContinueTargetClient();
        setBichlegContinue(clip);
      } else {
        setBichlegContinue(null);
      }
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

  const courseListHeading = activeCourse
    ? formatHomeCourseListHeading(activeCourse)
    : "";

  return (
    <MobileAppShell activeTab="home" mainClassName={SHELL_MAIN_NARROW}>
      <div className="bs-tm-topbar">
        <div className="bs-tm-hello">
          Сайн уу 👋
          <b>{displayName}</b>
        </div>
        <div className="bs-tm-streak-pill">
          <span aria-hidden>🔥</span>
          <div>
            <b>{streak}</b>
            <span>өдөр</span>
          </div>
        </div>
      </div>

      {!loggedIn ? (
        <Link
          href="/login"
          className="mb-3 block text-center text-xs font-bold text-[#1fb85a]"
        >
          Нэвтрэх →
        </Link>
      ) : null}

      {activeCourse?.available && lessonIds.length > 0 ? (
        <Link href={continueHref} className="bs-tm-continue">
          <span className="bs-tm-continue-ic" aria-hidden>
            ▶
          </span>
          <span className="min-w-0 flex-1">
            <p className="bs-tm-continue-kicker">Үргэлжлүүлэх</p>
            <p className="bs-tm-continue-title">{continueTitle}</p>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>
            ›
          </span>
        </Link>
      ) : null}

      {bichlegContinue ? (
        <Link href={bichlegContinue.href} className="bs-tm-continue">
          <span
            className="bs-tm-continue-ic"
            style={{
              background: "linear-gradient(135deg, #4d9fff, #2563eb)",
            }}
            aria-hidden
          >
            📺
          </span>
          <span className="min-w-0 flex-1">
            <p className="bs-tm-continue-kicker">Бичлэг үргэлжлүүлэх</p>
            <p className="bs-tm-continue-title">{bichlegContinue.title}</p>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>
            ›
          </span>
        </Link>
      ) : null}

      {visibleCatalog.length > 1 ? (
        <div className="bs-tm-chip-row">
          {visibleCatalog.map((chip) => (
            <button
              key={chip.chipId}
              type="button"
              disabled={!chip.available}
              onClick={() => chip.available && setActiveChip(chip.chipId)}
              className={`bs-tm-chip ${activeChip === chip.chipId ? "bs-tm-chip--on" : ""}`}
            >
              {chip.chipLabel}
            </button>
          ))}
        </div>
      ) : null}

      {selectedLang !== "ko" ? <HelzuiHomeCard /> : null}

      {activeCourse && !activeCourse.available ? (
        <p className="bs-tm-catalog-empty">Энэ курс удахгүй нээгдэнэ.</p>
      ) : activeCourse && lessons.length > 0 ? (
        <HomeLessonList
          heading={courseListHeading}
          lessons={lessons}
          statusByLesson={statusByLesson}
          completedCount={completedCount}
          totalCount={lessonIds.length}
          progressPercent={progressPercent}
          allLessonsHref={activeCourse.allLessonsHref}
        />
      ) : null}
    </MobileAppShell>
  );
}
