"use client";

import Image from "next/image";
import Link from "next/link";
import { PrefetchLink } from "@/components/navigation/prefetch-link";
import { useLocalSnapshot, writeLocalSnapshot } from "@/lib/cache/local-snapshot";
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
import { TemeeMascot } from "@/components/temee/temee-mascot";
import { BookPickerGrid, type BookPickerEntry } from "@/components/mobile/book-picker-grid";
import {
  LibraryPreviewRow,
  type LibraryPreviewItem,
} from "@/components/mobile/library-preview-row";
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
import {
  fetchMyClassRank,
  fetchMyPoints,
  fetchMyPointsToday,
  type MyRank,
} from "@/lib/points/rank";
import { HomeTodaySection } from "@/components/home/home-today-section";
import { HomeQuickSearch } from "@/components/home/home-quick-search";
import { QuickStartCard } from "@/components/home/quick-start-card";
import type { BichlegSuggestion } from "@/lib/mobile-home-data";
import { getStreakUnified } from "@/lib/retention/retention-service";
import {
  filterLessonsByActiveHskLevel,
  resolveLessonHskLevel,
} from "@/lib/hsk/active-hsk-level";
import { HelzuiHomeCard } from "@/components/helzui/helzui-home-card";
import { DailyToneHomeCard } from "@/components/pronunciation/daily-tone-card";
import { KidPathHomeCard } from "@/components/kids/kid-path-home-card";
import "@/components/helzui/helzui-course.css";
import { tr } from "@/lib/i18n/translate";
import { getUiLocale, useUiLocale } from "@/lib/i18n/ui-locale";
import type { LessonContent } from "@/types/lesson-content";
import type { HelzuiHomeSummary } from "@/lib/helzui/home-summary";
import { OpenClassQuizBanner } from "@/components/student/open-class-quiz-banner";

type Props = {
  catalog: MobileCourseCatalogEntry[];
  defaultChipId: string;
  fazhanCatalog: MobileCourseCatalogEntry[];
  fazhanDefaultChipId: string;
  libraryPreview: LibraryPreviewItem[];
  helzuiSummary: HelzuiHomeSummary;
  bichlegSuggestion: BichlegSuggestion | null;
};

type BookSeries = "standard" | "fazhan";

/** Нүүрний сүүлийн харагдац — localStorage (stale-while-revalidate). */
type HomeSnapshot = {
  displayName: string;
  loggedIn: boolean;
  streak: number;
  points: number | null;
  continueHref: string;
  continueTitle: string;
  statusByLesson: Record<string, LessonStatus>;
  bichlegContinue: BichlegContinueTarget | null;
};

const HOME_SNAPSHOT_KEY = "home:v1";

function resolveCatalogChipLevel(entry: MobileCourseCatalogEntry): number | null {
  const fromCourse = resolveLessonHskLevel({ courseId: entry.courseId });
  if (fromCourse != null) return fromCourse;
  const chip = entry.chipId.toLowerCase();
  const match = chip.match(/hsk(\d)/);
  return match ? Number(match[1]) : null;
}

export function HomeAppView({
  catalog,
  defaultChipId,
  fazhanCatalog,
  libraryPreview,
  helzuiSummary,
  bichlegSuggestion,
}: Props) {
  const locale = useUiLocale();
  const {
    level: activeHskLevel,
    hydrated: hskHydrated,
    setLevel: setActiveHskLevel,
  } = useActiveHskLevel();
  const [selectedLang, setSelectedLang] = useState<ReturnType<typeof getSelectedLanguage>>(null);
  const [activeSeries, setActiveSeries] = useState<BookSeries>("standard");
  const [activeChip, setActiveChip] = useState(defaultChipId);
  const [freshName, setDisplayName] = useState("Суралцагч");
  const [freshLoggedIn, setLoggedIn] = useState(false);
  const [freshStreak, setStreak] = useState(0);
  const [freshPoints, setPoints] = useState<number | null>(null);
  const [pointsToday, setPointsToday] = useState<number | null>(null);
  const [classRank, setClassRank] = useState<MyRank | null>(null);
  const [freshContinueHref, setContinueHref] = useState("/lessons/1");
  const [freshContinueTitle, setContinueTitle] = useState("Хичээл 1");
  /** Үргэлжлүүлэх холбоос бодит утгаа авсны дараа л бүтэн prefetch (eager) хийнэ. */
  const [continueResolved, setContinueResolved] = useState(false);
  const [freshStatusByLesson, setStatusByLesson] = useState<
    Record<string, LessonStatus>
  >({});
  const [freshBichleg, setBichlegContinue] =
    useState<BichlegContinueTarget | null>(null);

  // Stale-while-revalidate: сүүлийн харагдацыг (явц, үргэлжлүүлэх, streak) эхний
  // render-д шууд харуулна; Supabase-аас шинэ утга ирмэгц солино.
  const snapshot = useLocalSnapshot<HomeSnapshot>(HOME_SNAPSHOT_KEY);
  const useSnap = !continueResolved && snapshot != null;
  const displayName = useSnap ? snapshot.displayName || "Суралцагч" : freshName;
  const loggedIn = useSnap ? Boolean(snapshot.loggedIn) : freshLoggedIn;
  const streak = useSnap ? snapshot.streak || 0 : freshStreak;
  const points = useSnap ? (snapshot.points ?? null) : freshPoints;
  const continueHref = useSnap ? snapshot.continueHref || "/lessons/1" : freshContinueHref;
  const continueTitle = useSnap ? snapshot.continueTitle || "Хичээл 1" : freshContinueTitle;
  const snapshotStatus = useSnap ? snapshot.statusByLesson : null;
  const statusByLesson = useMemo(
    () => snapshotStatus ?? freshStatusByLesson,
    [snapshotStatus, freshStatusByLesson]
  );
  const bichlegContinue = useSnap ? (snapshot.bichlegContinue ?? null) : freshBichleg;
  const [curriculumCard, setCurriculumCard] = useState<{
    completed: number;
    total: number;
    nextTitle: string | null;
    href: string;
  } | null>(null);

  // Every standard book of the chosen language. The global HSK-level
  // picker no longer hides books here: the whole point of Home is to see
  // all of them at once and pick one — picking a book sets the level.
  const standardCatalog = useMemo(() => {
    if (!selectedLang) return catalog;
    return catalog.filter((entry) => {
      if (!entry.available) {
        return selectedLang === "zh"
          ? entry.courseId.includes("hsk")
          : entry.courseId.startsWith("korean");
      }
      return catalogEntryMatchesLanguage(entry, selectedLang);
    });
  }, [catalog, selectedLang]);

  // The catalog the *selected* book lives in. 发展汉语 (Fazhan Hanyu) is
  // its own catalog — the zh/ko language-track filter above is tuned for
  // courseIds like "hsk4" and doesn't apply to "fazhan-*" courseIds.
  const visibleCatalog = useMemo(
    () => (activeSeries === "fazhan" ? fazhanCatalog : standardCatalog),
    [activeSeries, fazhanCatalog, standardCatalog]
  );

  useRegisterLessonHskLevels(catalog.flatMap((entry) => entry.lessons));

  useEffect(() => {
    const lang = getSelectedLanguage();
    setSelectedLang(lang);
    if (!lang) return;
    // Seed a language-appropriate book once on mount. This used to re-run
    // on every catalog change, which snapped the selection back to the
    // first book each time the learner picked a 发展汉语 volume.
    const chip = resolveDefaultChipForLanguage(lang, visibleCatalog);
    if (chip) setActiveChip(chip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore the last course the user picked (defaultChipId already points
  // first-time visitors at HSK 1 — the book grid itself is the start guide).
  useEffect(() => {
    try {
      const savedSeries = window.localStorage.getItem("bs:homeSeries");
      const series: BookSeries = savedSeries === "fazhan" ? "fazhan" : "standard";
      const savedCatalog = series === "fazhan" ? fazhanCatalog : catalog;
      setActiveSeries(series);

      const saved = window.localStorage.getItem("bs:homeChip");
      if (
        saved &&
        savedCatalog.some((entry) => entry.chipId === saved && entry.available)
      ) {
        setActiveChip(saved);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Unified "pick a book" from the Home grid — sets series + chip, and
   * moves the global HSK level to the book's level so the lesson list
   * underneath (which is filtered by that level) actually shows the book.
   */
  const pickBook = (entry: BookPickerEntry) => {
    setActiveSeries(entry.series);
    setActiveChip(entry.chipId);
    if (entry.reviewLevel != null) {
      setActiveHskLevel(entry.reviewLevel as 1 | 2 | 3 | 4 | 5 | 6);
    }
    try {
      window.localStorage.setItem("bs:homeSeries", entry.series);
      window.localStorage.setItem("bs:homeChip", entry.chipId);
    } catch {
      // ignore
    }
  };

  // The grid always shows both series, whichever one the selected book is in.
  const countCompleted = (entry: MobileCourseCatalogEntry) =>
    entry.lessons.filter(
      (lesson) => (statusByLesson[lesson.id] ?? "not_started") === "completed"
    ).length;

  const pickerEntries: BookPickerEntry[] = useMemo(() => {
    const standardEntries: BookPickerEntry[] = standardCatalog.map((entry) => ({
      key: `standard:${entry.chipId}`,
      chipId: entry.chipId,
      series: "standard",
      chipLabel: entry.chipLabel,
      title: entry.title,
      subtitle: entry.subtitle,
      coverUrl: entry.coverUrl,
      available: entry.available,
      lessonCount: entry.lessons.length,
      completedCount: countCompleted(entry),
      reviewLevel: resolveCatalogChipLevel(entry),
    }));
    if (selectedLang === "ko") return standardEntries;
    const fazhanEntries: BookPickerEntry[] = fazhanCatalog.map((entry) => ({
      key: `fazhan:${entry.chipId}`,
      chipId: entry.chipId,
      series: "fazhan",
      chipLabel: entry.chipLabel,
      title: entry.title,
      subtitle: entry.subtitle,
      coverUrl: entry.coverUrl,
      available: entry.available,
      lessonCount: entry.lessons.length,
      completedCount: countCompleted(entry),
      reviewLevel: resolveCatalogChipLevel(entry),
    }));
    return [...standardEntries, ...fazhanEntries];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standardCatalog, fazhanCatalog, selectedLang, statusByLesson]);

  const activePickerKey = `${activeSeries}:${activeChip}`;

  /** Every published lesson on the page — progress is loaded once for all books. */
  const allLessonIds = useMemo(
    () =>
      [...standardCatalog, ...fazhanCatalog].flatMap((entry) =>
        entry.lessons.map((lesson) => lesson.id)
      ),
    [standardCatalog, fazhanCatalog]
  );

  /** Hero numbers — "free" is only convincing with real counts behind it. */
  const totals = useMemo(() => {
    const open = pickerEntries.filter((e) => e.available);
    return {
      books: open.length,
      lessons: open.reduce((sum, e) => sum + e.lessonCount, 0),
      completed: open.reduce((sum, e) => sum + e.completedCount, 0),
    };
  }, [pickerEntries]);

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
    // A book that is itself one HSK level (hsk1…hsk6, 发展汉语 volumes)
    // shows all its lessons — otherwise a stored level of 4 with a stored
    // book of HSK 1 filtered the list down to nothing. The global level
    // only narrows mixed-level courses.
    if (activeSeries === "fazhan") return base;
    if (activeCourse && resolveCatalogChipLevel(activeCourse) != null) return base;
    return filterLessonsByActiveHskLevel(base, activeHskLevel);
  }, [activeCourse, activeSeries, selectedLang, hskHydrated, activeHskLevel]);
  const lessonIds = useMemo(() => lessons.map((l) => l.id), [lessons]);

  useEffect(() => {
    let alive = true;
    async function load() {
      let isLoggedIn = false;
      let name = "Суралцагч";
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        if (!alive) return;
        isLoggedIn = Boolean(data);
        name = data?.email?.split("@")[0] ?? "Суралцагч";
        setLoggedIn(isLoggedIn);
        setDisplayName(name);
      }
      // Урьд нь 4 дуудлага дараалж (streak → continue → progress → bichleg) явдаг байсан —
      // бие биенээсээ хамаарахгүй тул зэрэг явуулна (нэг roundtrip-ийн хугацаа).
      const [retention, cont, progress, clip, pts, ptsToday, rank] = await Promise.all([
        getStreakUnified().catch(() => null),
        lessonIds.length > 0
          ? resolveContinueLearning(lessonIds).catch(() => null)
          : Promise.resolve(null),
        allLessonIds.length > 0
          ? getLessonProgressMapSmart(allLessonIds).catch(() => null)
          : Promise.resolve(null),
        isLoggedIn ? fetchBichlegContinueTargetClient().catch(() => null) : Promise.resolve(null),
        isLoggedIn ? fetchMyPoints().catch(() => null) : Promise.resolve(null),
        isLoggedIn ? fetchMyPointsToday().catch(() => null) : Promise.resolve(null),
        // Ангийн байр — ангигүй / RPC байхгүй бол null → мөрөнд харуулахгүй.
        isLoggedIn ? fetchMyClassRank().catch(() => null) : Promise.resolve(null),
      ]);
      if (!alive) return;
      const nextStreak = retention?.currentStreak ?? 0;
      const nextPoints = pts ? pts.total : null;
      let nextHref = "/lessons/1";
      let nextTitle = "Хичээл 1";
      setStreak(nextStreak);
      setPoints(nextPoints);
      setPointsToday(ptsToday);
      setClassRank(rank);
      if (cont) {
        nextHref = cont.href;
        const lesson = lessons.find((l) => l.id === cont.lessonId);
        nextTitle = lesson
          ? getUiLocale() === "zh" && lesson.chineseTitle
            ? lesson.chineseTitle
            : `${lesson.chineseTitle} · ${lesson.title}`
          : `Хичээл ${cont.lessonId}`;
        setContinueHref(nextHref);
        setContinueTitle(nextTitle);
      }
      if (progress) setStatusByLesson(progress.byLesson);
      setBichlegContinue(isLoggedIn ? clip : null);
      setContinueResolved(true);
      writeLocalSnapshot<HomeSnapshot>(HOME_SNAPSHOT_KEY, {
        displayName: name,
        loggedIn: isLoggedIn,
        streak: nextStreak,
        points: nextPoints,
        continueHref: nextHref,
        continueTitle: nextTitle,
        statusByLesson: progress?.byLesson ?? {},
        bichlegContinue: isLoggedIn ? clip : null,
      });
    }
    void load();
    return () => {
      alive = false;
    };
  }, [lessonIds, lessons, allLessonIds]);

  // Ангийн заавал хөтөлбөр (066) — байвал нэг жижиг карт. Алдаа гарвал чимээгүй нууна.
  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    void (async () => {
      try {
        const [{ getMyCurriculum }, { lessonPath }] = await Promise.all([
          import("@/lib/supabase/curriculum"),
          import("@/lib/content"),
        ]);
        const { data } = await getMyCurriculum();
        if (!alive) return;
        if (!data || data.totalCount === 0) {
          setCurriculumCard(null);
          return;
        }
        setCurriculumCard({
          completed: data.completedCount,
          total: data.totalCount,
          nextTitle: data.nextLessonTitle,
          href: data.nextLessonId ? lessonPath(data.nextLessonId) : "/my-assignments",
        });
      } catch {
        if (alive) setCurriculumCard(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loggedIn]);

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

  /* PC (≥920px) баруун самбар — утсан дээр нуугдана (AppShell). */
  const rightRail = (
    <div className="bs-home-rail">
      {activeCourse?.available && lessonIds.length > 0 ? (
        <div className="bs-home-rail-card">
          <p className="bs-tm-sec">{tr(locale, "Миний явц")}</p>
          <p className="bs-home-rail-big">{progressPercent}%</p>
          <p className="bs-home-rail-sub">
            {completedCount}/{lessonIds.length} {tr(locale, "хичээл дууссан")}
            {activeCourse ? ` · ${activeCourse.chipLabel}` : ""}
          </p>
          <div className="bs-tm-lesson-catalog-bar">
            <i style={{ width: `${progressPercent}%` }} />
          </div>
          <PrefetchLink
            href={continueHref}
            eager={continueResolved}
            className="app-btn-primary mt-3 inline-flex w-full justify-center"
          >
            {tr(locale, "Үргэлжлүүлэх")} →
          </PrefetchLink>
        </div>
      ) : null}

      {bichlegContinue ? (
        <PrefetchLink href={bichlegContinue.href} className="bs-tm-continue">
          <span
            className="bs-tm-continue-ic"
            style={{ background: "linear-gradient(135deg, #4d9fff, #2563eb)" }}
            aria-hidden
          >
            📺
          </span>
          <span className="min-w-0 flex-1">
            <p className="bs-tm-continue-kicker">{tr(locale, "Бичлэг үргэлжлүүлэх")}</p>
            <p className="bs-tm-continue-title" translate="no">{bichlegContinue.title}</p>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
      ) : null}

    </div>
  );

  return (
    <MobileAppShell
      activeTab="home"
      mainClassName={SHELL_MAIN_NARROW}
      desktopWidth="wide"
      rightRail={rightRail}
    >
      <section className="bs-page-in relative mb-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1FB85A] via-emerald-500 to-emerald-700 p-5 text-white shadow-[0_10px_30px_rgba(31,184,90,0.28)]">
        <div
          aria-hidden
          className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-white/10"
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-emerald-50">
              {tr(locale, "Сайн уу")} 👋{" "}
              <span className="font-extrabold">
                {displayName === "Суралцагч" ? tr(locale, "Суралцагч") : displayName}
              </span>
            </p>
            <p className="mt-1.5 text-[22px] font-black leading-[1.15] sm:text-2xl">
              {tr(locale, "Бүх номын бүх дасгал — үнэгүй")}
            </p>
            <p className="mt-1.5 text-[13px] font-medium leading-5 text-emerald-50">
              {tr(locale, "Номоо сонгоод л эхэл.")}{" "}
              {totals.books > 0 ? (
                <span className="font-bold text-white">
                  {totals.books} {tr(locale, "ном")} · {totals.lessons}{" "}
                  {tr(locale, "хичээл нээлттэй")}
                  {totals.completed > 0
                    ? ` · ${totals.completed} ${tr(locale, "дууссан")}`
                    : ""}
                </span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 empty:hidden">
              {!loggedIn ? (
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-emerald-700 shadow-sm active:bg-emerald-50"
                >
                  {tr(locale, "Нэвтрэх")} →
                </Link>
              ) : null}
            </div>
          </div>
          <Image
            src="/temee/temee-hero.png"
            alt=""
            width={104}
            height={104}
            priority
            className="pointer-events-none -mb-8 -mr-1 h-[104px] w-[104px] shrink-0 select-none object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.18)]"
          />
        </div>
      </section>

      {/* Тэмээ багш — баяртай / ердийн / гунигтай / унтаж буй (components/temee/temee-mascot) */}
      <TemeeMascot streak={streak} size="sm" className="mb-3" />

      {/* Статус мөр: streak · өнөөдрийн оноо · ангийн байр */}
      <ul className="bs-home-status" aria-label={tr(locale, "Миний статус")}>
        <li>
          <span aria-hidden>🔥</span>
          {streak}
          <span className="bs-home-status-sub">{tr(locale, "өдөр дараалан")}</span>
        </li>
        {loggedIn ? (
          <Link href="/points">
            <span aria-hidden>⭐</span>
            {pointsToday ?? 0}
            <span className="bs-home-status-sub">
              {tr(locale, "өнөөдөр")}
              {points !== null ? ` · ${points}` : ""}
            </span>
          </Link>
        ) : (
          <Link href="/login">
            <span aria-hidden>⭐</span>
            {tr(locale, "Оноо цуглуулах")}
          </Link>
        )}
        {classRank ? (
          <Link href="/rank">
            <span aria-hidden>🏆</span>
            #{classRank.rank}
            <span className="bs-home-status-sub">
              /{classRank.participants} {tr(locale, "ангидаа")}
            </span>
          </Link>
        ) : null}
      </ul>

      {/* Өнөөдөр: даалгавар · давтах · бичлэг */}
      <HomeTodaySection
        loggedIn={loggedIn}
        bichlegContinue={bichlegContinue}
        bichlegSuggestion={bichlegSuggestion}
      />

      {/* Хурдан хайлт (Pleco маяг) */}
      <HomeQuickSearch />

      {/* 60 секундын онбординг — шинэ хэрэглэгчид */}
      <QuickStartCard loggedIn={loggedIn} hasProgress={totals.completed > 0 || streak > 0} />

      {/* Хүүхдийн горим эсвэл зам эхэлсэн бол — хамгийн эхний карт */}
      <KidPathHomeCard />

      {loggedIn && curriculumCard ? (
        <PrefetchLink href={curriculumCard.href} className="bs-tm-continue">
          <span
            className="bs-tm-continue-ic"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            aria-hidden
          >
            {curriculumCard.nextTitle ? "📌" : "🎉"}
          </span>
          <span className="min-w-0 flex-1">
            <p className="bs-tm-continue-kicker">
              {tr(locale, "Заавал хичээл")} {curriculumCard.completed}/{curriculumCard.total}
            </p>
            <p className="bs-tm-continue-title">
              {curriculumCard.nextTitle ? (
                <>
                  {tr(locale, "Дараагийн")}: <span translate="no">{curriculumCard.nextTitle}</span>
                </>
              ) : (
                tr(locale, "Заавал хичээлүүдээ бүгдийг дуусгасан!")
              )}
            </p>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>
            ›
          </span>
        </PrefetchLink>
      ) : null}

      <OpenClassQuizBanner />

      {activeCourse?.available && lessonIds.length > 0 ? (
        <PrefetchLink href={continueHref} eager={continueResolved} className="bs-tm-continue">
          <span className="bs-tm-continue-ic" aria-hidden>
            ▶
          </span>
          <span className="min-w-0 flex-1">
            <p className="bs-tm-continue-kicker">{tr(locale, "Үргэлжлүүлэх")}</p>
            <p className="bs-tm-continue-title">{continueTitle}</p>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>
            ›
          </span>
        </PrefetchLink>
      ) : null}

      {pickerEntries.length > 1 ? (
        <BookPickerGrid
          entries={pickerEntries}
          activeKey={activePickerKey}
          onSelect={pickBook}
        />
      ) : null}

      {activeCourse && !activeCourse.available ? (
        <div className="mt-2 flex flex-col items-center gap-3 rounded-[24px] bg-white px-6 py-8 text-center shadow-sm ring-1 ring-slate-100">
          <Image
            src="/temee/temee-think.png"
            alt=""
            width={112}
            height={112}
            className="h-28 w-28 rounded-[22px] object-cover"
          />
          <p className="text-sm font-bold text-[var(--app-text)]">
            {tr(locale, "Энэ курс удахгүй нээгдэнэ")}
          </p>
          <p className="text-xs leading-5 text-[var(--app-muted)]">
            {tr(
              locale,
              "Бид контентыг нь бэлдэж байна. Одоохондоо нээлттэй байгаа хичээлүүдээс үргэлжлүүлээрэй."
            )}
          </p>
        </div>
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

      {/* Нэмэлт — эвхээстэй: нүүр нь ном + хичээл л байг */}
      <details className="group mt-2 mb-3 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-card)] shadow-[var(--app-shadow)]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-extrabold text-[var(--app-text)] [&::-webkit-details-marker]:hidden">
          <span>📚 {tr(locale, "Нэмэлт: уншлага, дуудлага, хэлзүй")}</span>
          <span className="text-[var(--app-muted)] transition-transform group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="px-3 pb-3 pt-1">
          <LibraryPreviewRow items={libraryPreview} />
          <DailyToneHomeCard />
          {selectedLang !== "ko" ? <HelzuiHomeCard summary={helzuiSummary} /> : null}
        </div>
      </details>

      {/* Ярилцах — AI ролийн яриа (нэг жижиг блок) */}
      <Link href="/talk" className="bs-tm-continue mb-3">
        <span
          className="bs-tm-continue-ic"
          style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}
          aria-hidden
        >
          💬
        </span>
        <span className="min-w-0 flex-1">
          <p className="bs-tm-continue-kicker">{tr(locale, "Ярилцах")}</p>
          <p className="bs-tm-continue-title">{tr(locale, "Дэлгүүр, гуанз, такси — хятадаар ярьж үз")}</p>
        </span>
        <span className="bs-tm-card-chev" aria-hidden>
          ›
        </span>
      </Link>

      {bichlegContinue ? (
        <PrefetchLink href={bichlegContinue.href} className="bs-tm-continue bs-desk-hide">
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
            <p className="bs-tm-continue-kicker">
              {tr(locale, "Бичлэг үргэлжлүүлэх")}
            </p>
            <p className="bs-tm-continue-title" translate="no">{bichlegContinue.title}</p>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>
            ›
          </span>
        </PrefetchLink>
      ) : null}
    </MobileAppShell>
  );
}
