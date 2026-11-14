"use client";

import Link from "next/link";
import { PrefetchLink } from "@/components/navigation/prefetch-link";
import { useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import {
  isPrelessonLessonId,
  resolveGameLabels,
} from "@/lib/games/game-lesson-meta";
import { getGameStats } from "@/lib/games/game-progress";
import { getDailyMissions, type DailyMission } from "@/lib/games/game-fx";
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
    desc: "Давтах үгээ 6 төрлөөр шалгана · SRS-тэй",
    icon: "🎯",
    gradient: "linear-gradient(145deg, #14b8a6, #0d9488)",
    badge: "Quiz",
    global: true,
  },
  {
    id: "dictation",
    slug: "dictation",
    title: "Диктант",
    desc: "Сонсоод ханзаар нь угсарч бич",
    icon: "👂",
    gradient: "linear-gradient(145deg, #38bdf8, #0284c7)",
    badge: "Сонсгол",
    global: true,
  },
  {
    id: "daily-challenge",
    slug: "daily-challenge",
    title: "Өдрийн сорил",
    desc: "Өдөрт нэг удаа 10 асуулт, 3 амь",
    icon: "📅",
    gradient: "linear-gradient(145deg, #ffc94d, #f59e0b)",
    badge: "Өдөр",
    global: true,
  },
  {
    id: "mock-tests",
    slug: "mock-tests",
    title: "HSK загвар шалгалт",
    desc: "Жинхэнэ шалгалт шиг, тайлбартай",
    icon: "🎓",
    gradient: "linear-gradient(145deg, #9b6bff, #6d28d9)",
    badge: "HSK",
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
    <PrefetchLink href={href} className="bs-tm-game-tile">
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
    </PrefetchLink>
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
  const [missions, setMissions] = useState<DailyMission[]>([]);
  useEffect(() => {
    setMissions(getDailyMissions());
  }, []);

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

  // «Үе давах» — хятад үгийн кампанит; солонгос хэл сонгосон бол харуулахгүй.
  const showCampaign = lang !== "ko";

  return (
    <MobileAppShell activeTab="games" mainClassName={SHELL_MAIN_NARROW} desktopWidth="wide">
      <h1 className="bs-tm-page-title bs-page-in">{tr(locale, "Тоглоом")} 🎮</h1>

      <div className="bs-tm-stat-row bs-page-in">
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

      {missions.length > 0 ? (
        <div className="bs-tm-missions">
          <div className="bs-tm-missions-head">
            <span>🎯 {tr(locale, "Өдрийн даалгавар")}</span>
            <span className="bs-tm-missions-count">
              {missions.every((m) => m.done)
                ? tr(locale, "Бүгд биелэв!")
                : `${missions.filter((m) => m.done).length}/${missions.length}`}
            </span>
          </div>
          <ul className="bs-tm-missions-list">
            {missions.map((m) => (
              <li key={m.id} className={m.done ? "bs-tm-mission bs-tm-mission--done" : "bs-tm-mission"}>
                <span className="bs-tm-mission-check" aria-hidden>{m.done ? "✓" : ""}</span>
                <span className="bs-tm-mission-label">{tr(locale, m.label)}</span>
                <span className="bs-tm-mission-bar"><i style={{ width: `${Math.round((m.current / m.target) * 100)}%` }} /></span>
                <span className="bs-tm-mission-num">{m.current}/{m.target}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lang === "zh" ? (
        <>
          {/* Гол тоглоом: нэг тоглоом — олон төрөл. Бусад нь үүний горим. */}
          <section className="bs-page-in overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#059669,#10b981_55%,#34d399)] p-5 text-white shadow-[0_10px_28px_rgba(5,150,105,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/temee/v2/play.webp"
              alt=""
              width={112}
              height={112}
              className="pointer-events-none float-right -mr-2 -mt-3 ml-2 h-28 w-28 select-none object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.2)]"
            />
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-100">
              {tr(locale, "Нэг тоглоом · 8 төрөл")}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight">
              {tr(locale, "Тоглож сурах")}
            </h2>
            <p className="mt-1 text-sm leading-5 text-emerald-50">
              {tr(
                locale,
                "Өөрийн үгс эсвэл HSK үгсээр тоглоно. Утга, ханз, пиньинь, сонсох, диктант, холбох — аль алийг нь холихоо ⚙ дээрээс сонгоно."
              )}
            </p>
            <PrefetchLink
              href="/games/learn"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-base font-extrabold text-emerald-700 shadow-md transition active:scale-[0.98] sm:w-auto"
              data-testid="learn-game-start"
            >
              ▶ {tr(locale, "Эхлэх")}
            </PrefetchLink>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-emerald-100">
              {tr(locale, "Бэлэн горимууд")}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { preset: "marathon", icon: "🏃", label: "Марафон", hint: "Давтах бүх үгээ" },
                { preset: "speed", icon: "⚡", label: "Хурдны горим", hint: "6 секундэд хариул" },
                { preset: "dictation", icon: "👂", label: "Диктант", hint: "Сонсоод угсар" },
                { preset: "hanzi", icon: "🧩", label: "Ханз задлах", hint: "Язгуур, бичлэг" },
              ].map((p) => (
                <PrefetchLink
                  key={p.preset}
                  href={`/games/learn?preset=${p.preset}`}
                  className="rounded-2xl bg-white/15 px-3 py-2.5 ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25 active:scale-[0.98]"
                >
                  <p className="text-sm font-extrabold">
                    {p.icon} {tr(locale, p.label)}
                  </p>
                  <p className="text-[11px] text-emerald-50">{tr(locale, p.hint)}</p>
                </PrefetchLink>
              ))}
            </div>
          </section>

          <p className="bs-tm-sec">{tr(locale, "Шалгалт")}</p>
          <div className="bs-tm-game-grid bs-stagger">
            {CHINESE_HSK_GAMES.filter(
              (g) => g.slug !== "hsk-vocab-quiz" && g.slug !== "dictation"
            ).map((game) => (
              <GameTile key={game.id} game={game} href={`/games/${game.slug}`} />
            ))}
          </div>

          <details className="mt-5 rounded-3xl bg-white/70 p-3 ring-1 ring-slate-200">
            <summary className="cursor-pointer list-none px-2 py-1 text-sm font-bold text-slate-800 [&::-webkit-details-marker]:hidden">
              📘 {tr(locale, "Хичээлээр дасгал хийх")}{" "}
              <span className="font-medium text-slate-500">
                — {lessonTitle ?? tr(locale, "одоогийн хичээл")} ▾
              </span>
            </summary>
            <div className="mt-3 flex flex-col gap-3">
      {showCampaign ? (
        <PrefetchLink
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
        </PrefetchLink>
      ) : null}

      <div className="bs-tm-game-grid bs-stagger">
        {games.map((game) => {
          const href = game.global
            ? `/games/${game.slug}`
            : `/games/${game.slug}?lessonId=${currentLessonId}`;
          const level =
            showCampaign && isLevelGame(game.slug) ? levelInfo[game.slug] : undefined;
          return <GameTile key={game.id} game={game} href={href} level={level} />;
        })}
      </div>

            </div>
          </details>
          <div className="pb-6" />
        </>
      ) : (
        <>
      <p className="bs-tm-sec">{tr(locale, "Хичээлийн дасгалууд")}</p>
      <div className="bs-tm-game-grid bs-stagger">
        {games.map((game) => {
          const href = game.global
            ? `/games/${game.slug}`
            : `/games/${game.slug}?lessonId=${currentLessonId}`;
          const level =
            showCampaign && isLevelGame(game.slug) ? levelInfo[game.slug] : undefined;
          return <GameTile key={game.id} game={game} href={href} level={level} />;
        })}
      </div>

          <div className="pb-6" />
        </>
      )}
    </MobileAppShell>
  );
}
