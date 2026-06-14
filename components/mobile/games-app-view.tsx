"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TemeeImage } from "@/components/temee/temee-image";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import {
  isPrelessonLessonId,
  resolveGameLabels,
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
  gradient: string;
  badge: string;
  global?: boolean;
};

const CHINESE_HSK_GAMES: GameCard[] = [
  {
    id: "hsk-vocab-quiz",
    slug: "hsk-vocab-quiz",
    title: "Үгсийн дасгал",
    desc: "Утга, ханз, пиньинь",
    icon: "🎯",
    gradient: "linear-gradient(145deg, #14b8a6, #0d9488)",
    badge: "Quiz",
    global: true,
  },
  {
    id: "srs-marathon",
    slug: "srs-marathon",
    title: "SRS марафон",
    desc: "Давталтын үгээр",
    icon: "🏃",
    gradient: "linear-gradient(145deg, #9b6bff, #6d28d9)",
    badge: "SRS",
    global: true,
  },
  {
    id: "radical",
    slug: "radical",
    title: "Ханз задлах",
    desc: "Бүрэлдэхүүн сонгох",
    icon: "🧱",
    gradient: "linear-gradient(145deg, #ff8a3d, #e65c2e)",
    badge: "Задлах",
    global: true,
  },
  {
    id: "speed",
    slug: "speed",
    title: "Хурдны тэмцээн",
    desc: "60 секундэд хэдэн зөв?",
    icon: "⚡",
    gradient: "linear-gradient(145deg, #ff6b9d, #db2777)",
    badge: "Хурд",
    global: true,
  },
  {
    id: "daily-challenge",
    slug: "daily-challenge",
    title: "Өдрийн сорил",
    desc: "Өдөрт нэг удаа",
    icon: "📅",
    gradient: "linear-gradient(145deg, #ffc94d, #f59e0b)",
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
      gradient: "linear-gradient(145deg, #9b6bff, #6d28d9)",
      badge: "Шинэ",
    },
    {
      id: "translate",
      slug: "translate",
      title: labels.translateTitle,
      desc: labels.translateDesc,
      icon: "🌐",
      gradient: "linear-gradient(145deg, #4d9fff, #2563eb)",
      badge: "Шинэ",
    },
    {
      id: "missing-word",
      slug: "missing-word",
      title: labels.missingWordTitle,
      desc: labels.missingWordDesc,
      icon: "✏️",
      gradient: "linear-gradient(145deg, #ff8a3d, #e65c2e)",
      badge: "Шинэ",
    },
    {
      id: "arrange",
      slug: "arrange",
      title: labels.arrangeTitle,
      desc: labels.arrangeDesc,
      icon: "🔢",
      gradient: "linear-gradient(145deg, #1fb85a, #0e9c47)",
      badge: "Шинэ",
    },
    {
      id: "stroke",
      slug: "stroke",
      title: labels.strokeTitle,
      desc: labels.strokeDesc,
      icon: "🖊️",
      gradient: "linear-gradient(145deg, #ff6b9d, #db2777)",
      badge: "Шинэ",
    },
  ];
}

function GameTile({ game, href }: { game: GameCard; href: string }) {
  return (
    <Link href={href} className="bs-tm-game-tile">
      <span className="bs-tm-game-tile-badge">{game.badge}</span>
      <span
        className="bs-tm-game-tile-ic"
        style={{ background: game.gradient }}
        aria-hidden
      >
        {game.icon}
      </span>
      <p className="bs-tm-game-tile-title">{game.title}</p>
      <p className="bs-tm-game-tile-sub">{game.desc}</p>
    </Link>
  );
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
      <h1 className="bs-tm-page-title">Тоглоом 🎮</h1>

      <div className="bs-tm-stat-row">
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>
            🎮
          </div>
          <div className="bs-tm-stat-n">{played}</div>
          <div className="bs-tm-stat-l">Тоглосон</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>
            🏆
          </div>
          <div className="bs-tm-stat-n">{bestScore}</div>
          <div className="bs-tm-stat-l">Дээд оноо</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>
            🎯
          </div>
          <div className="bs-tm-stat-n">{avgAccuracy}%</div>
          <div className="bs-tm-stat-l">Нарийвчлал</div>
        </div>
      </div>

      {lang === "zh" ? (
        <>
          <p className="bs-tm-sec">HSK тоглоомууд</p>
          <div className="bs-tm-game-grid">
            {CHINESE_HSK_GAMES.map((game) => (
              <GameTile
                key={game.id}
                game={game}
                href={`/games/${game.slug}`}
              />
            ))}
          </div>
        </>
      ) : null}

      <Link href={marathonHref} className="bs-tm-game-feat">
        <TemeeImage
          variant="thumbsup"
          className="bs-tm-game-feat-img"
          width={64}
          height={64}
        />
        <span className="flex-1 min-w-0">
          <p className="bs-tm-game-feat-kicker">Тоглоомын чиглэл</p>
          <p className="bs-tm-game-feat-title">
            {lessonTitle ?? "Одоогийн хичээлийн үгээр"}
          </p>
          <p className="bs-tm-game-feat-sub">SRS марафон эхлүүлэх →</p>
        </span>
      </Link>

      <p className="bs-tm-sec">Хичээлийн дасгалууд</p>
      <div className="bs-tm-game-grid">
        {games.map((game) => {
          const href = game.global
            ? `/games/${game.slug}`
            : `/games/${game.slug}?lessonId=${currentLessonId}`;
          return <GameTile key={game.id} game={game} href={href} />;
        })}
      </div>
    </MobileAppShell>
  );
}
