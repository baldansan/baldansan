"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import {
  isPrelessonLessonId,
  resolveGameLabels,
} from "@/lib/games/game-lesson-meta";
import { getGameStats } from "@/lib/games/game-progress";
import {
  LEVEL_GAMES,
  TOTAL_LEVELS,
  isLevelGame,
  levelMapHref,
  levelSummary,
  lowestCurrentLevelGame,
  totalStarsAllGames,
  type LevelGame,
} from "@/lib/games/levels";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";
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
    title: "Үгийн сорил",
    desc: "Утга · пиньинь · сонсгол · клоз",
    icon: "🎯",
    gradient: "linear-gradient(145deg, #14b8a6, #0d9488)",
    badge: "Quiz",
    global: true,
  },
  {
    id: "dictation",
    slug: "dictation",
    title: "Диктант",
    desc: "Сонсоод ханзаар бич",
    icon: "👂",
    gradient: "linear-gradient(145deg, #38bdf8, #0284c7)",
    badge: "Сонсгол",
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
  {
    id: "mock-tests",
    slug: "mock-tests",
    title: "Мок шалгалт",
    desc: "HSK шалгалтын бэлтгэл",
    icon: "🎓",
    gradient: "linear-gradient(145deg, #9b6bff, #6d28d9)",
    badge: "HSK",
    global: true,
  },
];

/** Secondary variants kept as small links — not primary tiles. */
const EXTRA_GAME_LINKS = [
  { slug: "speed", label: "⚡ Хурдны тэмцээн" },
  { slug: "radical", label: "🧱 Ханз задлах" },
  { slug: "srs-marathon", label: "🏃 SRS марафон" },
] as const;

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
      badge: "Хос",
    },
    {
      id: "arrange",
      slug: "arrange",
      title: labels.arrangeTitle,
      desc: labels.arrangeDesc,
      icon: "🔢",
      gradient: "linear-gradient(145deg, #1fb85a, #0e9c47)",
      badge: "Дараалал",
    },
    {
      id: "translate",
      slug: "translate",
      title: labels.translateTitle,
      desc: labels.translateDesc,
      icon: "🈯",
      gradient: "linear-gradient(145deg, #60a5fa, #2563eb)",
      badge: "Орчуулга",
    },
    {
      id: "missing-word",
      slug: "missing-word",
      title: labels.missingWordTitle,
      desc: labels.missingWordDesc,
      icon: "✏️",
      gradient: "linear-gradient(145deg, #fbbf24, #d97706)",
      badge: "Дутуу үг",
    },
    {
      id: "stroke",
      slug: "stroke",
      title: labels.strokeTitle,
      desc: labels.strokeDesc,
      icon: "🖊️",
      gradient: "linear-gradient(145deg, #ff6b9d, #db2777)",
      badge: "Бүрдэл",
    },
  ];
}

type LevelInfo = { current: number; stars: number };

function GameTile({
  game,
  href,
  level,
}: {
  game: GameCard;
  href: string;
  /** «Үе давах» мэдээлэл — 4 кампанит тоглоомд. */
  level?: LevelInfo;
}) {
  const locale = useUiLocale();
  const tile = (
    <Link href={href} className="bs-tm-game-tile">
      <span className="bs-tm-game-tile-badge">{tr(locale, game.badge)}</span>
      <span
        className="bs-tm-game-tile-ic"
        style={{ background: game.gradient }}
        aria-hidden
      >
        {game.icon}
      </span>
      <p className="bs-tm-game-tile-title">{tr(locale, game.title)}</p>
      <p className="bs-tm-game-tile-sub">{tr(locale, game.desc)}</p>
      {level ? (
        <p className="bs-tm-game-tile-sub !mt-1.5 !text-[11px] font-bold !text-[#6d28d9]">
          {tr(locale, "Үе")} {level.current} · ⭐ {level.stars}
        </p>
      ) : null}
    </Link>
  );
  if (!level || !isLevelGame(game.slug)) return tile;
  return (
    <div className="relative">
      {tile}
      <Link
        href={levelMapHref(game.slug)}
        className="absolute bottom-2 right-2 rounded-full bg-[#efe6ff] px-2.5 py-1 text-[10px] font-extrabold text-[#6d28d9] ring-1 ring-purple-200 active:scale-95"
        aria-label={`${tr(locale, game.title)} — ${tr(locale, "Үе давах")}`}
      >
        🗺 {tr(locale, "Үе давах")}
      </Link>
    </div>
  );
}

export function GamesAppView({ lessonIds, lessonTitles }: Props) {
  const locale = useUiLocale();
  const [lang, setLang] = useState<SelectedLanguage | null>(null);
  const [played, setPlayed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState("1");
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);
  const [levelInfo, setLevelInfo] = useState<Partial<Record<LevelGame, LevelInfo>>>({});
  const [campaignStars, setCampaignStars] = useState(0);
  const [campaignGame, setCampaignGame] = useState<LevelGame>("arrange");

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

    const refreshLevels = () => {
      const info: Partial<Record<LevelGame, LevelInfo>> = {};
      for (const g of LEVEL_GAMES) info[g] = levelSummary(g);
      setLevelInfo(info);
      setCampaignStars(totalStarsAllGames());
      setCampaignGame(lowestCurrentLevelGame());
    };
    refreshLevels();

    const refresh = () => {
      const s = getGameStats();
      setPlayed(s.played);
      setBestScore(s.bestScore);
      setAvgAccuracy(s.avgAccuracy);
      refreshLevels();
    };
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [lessonIds, lessonTitles]);

  const marathonHref = "/games/srs-marathon";
  // «Үе давах» — хятад үгийн кампанит; солонгос хэл сонгосон бол харуулахгүй.
  const showCampaign = lang !== "ko";

  return (
    <MobileAppShell activeTab="games" mainClassName={SHELL_MAIN_NARROW} desktopWidth="wide">
      <h1 className="bs-tm-page-title">{tr(locale, "Тоглоом")} 🎮</h1>

      <div className="bs-tm-stat-row">
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>
            🎮
          </div>
          <div className="bs-tm-stat-n">{played}</div>
          <div className="bs-tm-stat-l">{tr(locale, "Тоглосон")}</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>
            🏆
          </div>
          <div className="bs-tm-stat-n">{bestScore}</div>
          <div className="bs-tm-stat-l">{tr(locale, "Дээд оноо")}</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>
            🎯
          </div>
          <div className="bs-tm-stat-n">{avgAccuracy}%</div>
          <div className="bs-tm-stat-l">{tr(locale, "Нарийвчлал")}</div>
        </div>
      </div>

      {showCampaign ? (
        <Link
          href={levelMapHref(campaignGame)}
          className="bs-tm-game-feat !bg-[linear-gradient(135deg,#f59e0b,#d97706)] !shadow-[0_8px_20px_rgba(217,119,6,0.35)]"
          data-testid="campaign-card"
        >
          <span className="bs-tm-game-feat-img grid place-items-center text-4xl" aria-hidden>
            🏆
          </span>
          <span className="flex-1 min-w-0">
            <p className="bs-tm-game-feat-kicker">
              {TOTAL_LEVELS} {tr(locale, "үе")} · HSK 1–9
            </p>
            <p className="bs-tm-game-feat-title">
              🏆 {tr(locale, "Үе давах")} — 4 {tr(locale, "тоглоом")} · ⭐ {campaignStars}
            </p>
            <p className="bs-tm-game-feat-sub">
              {tr(locale, "Үе")} {levelInfo[campaignGame]?.current ?? 1} · {tr(locale, "Үргэлжлүүлэх →")}
            </p>
          </span>
        </Link>
      ) : null}

      {lang === "zh" ? (
        <>
          <p className="bs-tm-sec">{tr(locale, "Тоглоомууд")}</p>
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
        <TemeeEmojiIcon
          variant="games"
          className="bs-tm-game-feat-img"
          width={64}
          height={64}
        />
        <span className="flex-1 min-w-0">
          <p className="bs-tm-game-feat-kicker">{tr(locale, "Тоглоомын чиглэл")}</p>
          <p className="bs-tm-game-feat-title">
            {lessonTitle ?? tr(locale, "Одоогийн хичээлийн үгээр")}
          </p>
          <p className="bs-tm-game-feat-sub">{tr(locale, "SRS марафон эхлүүлэх →")}</p>
        </span>
      </Link>

      <p className="bs-tm-sec">{tr(locale, "Хичээлийн дасгалууд")}</p>
      <div className="bs-tm-game-grid">
        {games.map((game) => {
          const href = game.global
            ? `/games/${game.slug}`
            : `/games/${game.slug}?lessonId=${currentLessonId}`;
          const level =
            showCampaign && isLevelGame(game.slug) ? levelInfo[game.slug] : undefined;
          return <GameTile key={game.id} game={game} href={href} level={level} />;
        })}
      </div>

      {lang === "zh" ? (
        <div className="mt-4 flex flex-wrap gap-2 pb-6">
          {EXTRA_GAME_LINKS.map((link) => (
            <Link
              key={link.slug}
              href={`/games/${link.slug}`}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
            >
              {tr(locale, link.label)}
            </Link>
          ))}
        </div>
      ) : null}
    </MobileAppShell>
  );
}
