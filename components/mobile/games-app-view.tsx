"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import {
  isPrelessonLessonId,
  resolveGameLabels,
  type GameLinkSlug,
} from "@/lib/games/game-lesson-meta";
import { getGameStats } from "@/lib/games/game-progress";
import { resolveContinueLearning } from "@/lib/learner-progress";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import type { SelectedLanguage } from "@/lib/language-track";

type Props = {
  lessonIds: string[];
  lessonTitles: Record<string, string>;
};

type GameCard = {
  id: string;
  slug: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  badge: string;
  global?: boolean;
};

const CHINESE_HSK_GAMES: GameCard[] = [
  {
    id: "hsk-vocab-quiz",
    slug: "hsk-vocab-quiz",
    title: "Үгсийн дасгал",
    desc: "Утга, ханз, пиньинь, жишээ — 20–40 асуулт",
    icon: "🎯",
    color: "from-teal-500 to-emerald-600",
    badge: "Quiz",
    global: true,
  },
  {
    id: "srs-marathon",
    slug: "srs-marathon",
    title: "SRS марафон",
    desc: "Миний давталтын үгээр 5 төрлийн асуулт",
    icon: "🏃",
    color: "from-violet-400 to-violet-500",
    badge: "SRS",
    global: true,
  },
  {
    id: "radical",
    slug: "radical",
    title: "Ханз задлах",
    desc: "Бүрэлдэхүүн сонгоод ханз бүрдүүлэх",
    icon: "🧱",
    color: "from-orange-400 to-orange-500",
    badge: "Задлах",
    global: true,
  },
  {
    id: "speed",
    slug: "speed",
    title: "Хурдны тэмцээн",
    desc: "60 секундэд хэдэн зөв?",
    icon: "⚡",
    color: "from-rose-400 to-rose-500",
    badge: "Хурд",
    global: true,
  },
  {
    id: "daily-challenge",
    slug: "daily-challenge",
    title: "Өдрийн сорил",
    desc: "10 асуулт, өдөрт нэг удаа",
    icon: "📅",
    color: "from-amber-400 to-amber-500",
    badge: "Өдөр",
    global: true,
  },
];

function gamesForLanguage(
  lang: SelectedLanguage | null,
  isPrelesson: boolean
): GameCard[] {
  const isKorean = lang === "ko";
  const labels = resolveGameLabels(isKorean, isPrelesson);

  return [
    {
      id: "match",
      slug: "match",
      title: labels.matchTitle,
      desc: labels.matchDesc,
      icon: "🔗",
      color: "from-violet-400 to-violet-500",
      badge: "Шинэ",
    },
    {
      id: "translate",
      slug: "translate",
      title: labels.translateTitle,
      desc: labels.translateDesc,
      icon: "🌐",
      color: "from-blue-400 to-blue-500",
      badge: "Шинэ",
    },
    {
      id: "missing-word",
      slug: "missing-word",
      title: labels.missingWordTitle,
      desc: labels.missingWordDesc,
      icon: "✏️",
      color: "from-amber-400 to-amber-500",
      badge: "Шинэ",
    },
    {
      id: "arrange",
      slug: "arrange",
      title: labels.arrangeTitle,
      desc: labels.arrangeDesc,
      icon: "🔢",
      color: "from-emerald-400 to-emerald-500",
      badge: "Шинэ",
    },
    {
      id: "stroke",
      slug: "stroke",
      title: labels.strokeTitle,
      desc: labels.strokeDesc,
      icon: "🖊️",
      color: "from-rose-400 to-rose-500",
      badge: "Шинэ",
    },
  ];
}

export function GamesAppView({ lessonIds, lessonTitles }: Props) {
  const [lang, setLang] = useState<SelectedLanguage | null>(null);
  const [played, setPlayed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState("1");
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);

  const isPrelesson = isPrelessonLessonId(currentLessonId);
  const games = useMemo(
    () => gamesForLanguage(lang, isPrelesson),
    [lang, isPrelesson]
  );

  useEffect(() => {
    setLang(getSelectedLanguage());
  }, []);

  useEffect(() => {
    const stats = getGameStats();
    setPlayed(stats.played);
    setBestScore(stats.bestScore);
    setAvgAccuracy(stats.avgAccuracy);

    const fallbackId = lessonIds[0] ?? "1";
    setCurrentLessonId(fallbackId);
    setLessonTitle(lessonTitles[fallbackId] ?? null);

    let cancelled = false;
    void resolveContinueLearning(lessonIds).then((cont) => {
      if (cancelled) return;
      const lessonId = cont?.lessonId ?? fallbackId;
      setCurrentLessonId(lessonId);
      setLessonTitle(lessonTitles[lessonId] ?? null);
    });

    const refresh = () => {
      const s = getGameStats();
      setPlayed(s.played);
      setBestScore(s.bestScore);
      setAvgAccuracy(s.avgAccuracy);
    };
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [lessonIds, lessonTitles]);

  const marathonHref = "/games/srs-marathon";

  return (
    <MobileAppShell activeTab="games" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader title="Тоглоом" />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Тоглосон", value: played },
          { label: "Дээд оноо", value: bestScore },
          { label: "Нарийвчлал", value: `${avgAccuracy}%` },
        ].map((stat) => (
          <div key={stat.label} className="app-game-stat">
            <p className="app-game-stat-value">{stat.value}</p>
            <p className="text-[10px] leading-tight text-[var(--app-muted)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {lang === "zh" ? (
        <>
          <h2 className="mb-3 text-sm font-bold text-[var(--app-text)]">
            HSK тоглоомууд
          </h2>
          <div className="mb-5 grid grid-cols-2 gap-3">
            {CHINESE_HSK_GAMES.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="block"
              >
                <MobileCard
                  padding="sm"
                  className="relative h-full !p-3 active:scale-[0.98]"
                >
                  <span className="absolute right-2 top-2 rounded-full bg-[var(--app-purple-light)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--app-purple-dark)]">
                    {game.badge}
                  </span>
                  <div
                    className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${game.color} text-lg text-white`}
                  >
                    {game.icon}
                  </div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    {game.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-[var(--app-muted)]">
                    {game.desc}
                  </p>
                </MobileCard>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <div className="app-game-mission mb-5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-100">
          Тоглоомын чиглэл
        </p>
        {lessonTitle ? (
          <p className="mt-1 text-sm font-semibold text-white">{lessonTitle}</p>
        ) : (
          <p className="mt-1 text-sm text-purple-50">
            Одоогийн хичээлийн үгээр дасгал хий.
          </p>
        )}
        <Link
          href={marathonHref}
          className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-purple-700"
        >
          SRS марафон
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-bold text-[var(--app-text)]">
        Хичээлийн дасгалууд
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {games.map((game) => {
          const href = game.global
            ? `/games/${game.slug}`
            : `/games/${game.slug}?lessonId=${currentLessonId}`;
          return (
          <Link
            key={game.id}
            href={href}
            className="block"
          >
            <MobileCard padding="sm" className="relative h-full !p-3 active:scale-[0.98]">
              <span className="absolute right-2 top-2 rounded-full bg-[var(--app-purple-light)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--app-purple-dark)]">
                {game.badge}
              </span>
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${game.color} text-lg text-white`}
              >
                {game.icon}
              </div>
              <p className="text-sm font-semibold text-[var(--app-text)]">
                {game.title}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-[var(--app-muted)]">
                {game.desc}
              </p>
            </MobileCard>
          </Link>
        );
        })}
      </div>
    </MobileAppShell>
  );
}
