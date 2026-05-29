"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { getGameStats } from "@/lib/games/game-progress";
import { resolveContinueLearning } from "@/lib/learner-progress";

type Props = {
  lessonIds: string[];
  lessonTitles: Record<string, string>;
};

const GAMES = [
  {
    id: "match",
    slug: "match",
    title: "Холбох",
    desc: "Хятад үг ↔ Орчуулга холбох тоглоом",
    icon: "🔗",
    color: "from-violet-400 to-violet-500",
    badge: "Шинэ",
  },
  {
    id: "translate",
    slug: "translate",
    title: "Орчуулах",
    desc: "Зөв орчуулгыг сонгож сурах",
    icon: "🌐",
    color: "from-blue-400 to-blue-500",
    badge: "Шинэ",
  },
  {
    id: "missing-word",
    slug: "missing-word",
    title: "Дутуу үг",
    desc: "Дутуу үгийг бөглөж өгүүлбэр гүйцээ",
    icon: "✏️",
    color: "from-amber-400 to-amber-500",
    badge: "Шинэ",
  },
  {
    id: "arrange",
    slug: "arrange",
    title: "Дараалал",
    desc: "Ханзнуудыг зөв дараалалд оруулах",
    icon: "🔢",
    color: "from-emerald-400 to-emerald-500",
    badge: "Шинэ",
  },
  {
    id: "stroke",
    slug: "stroke",
    title: "Дутуу зураас",
    desc: "Ханзны дутуу зураасыг сонго",
    icon: "🖊️",
    color: "from-rose-400 to-rose-500",
    badge: "Шинэ",
  },
] as const;

export function GamesAppView({ lessonIds, lessonTitles }: Props) {
  const [played, setPlayed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState("1");
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const stats = getGameStats();
      setPlayed(stats.played);
      setBestScore(stats.bestScore);
      setAvgAccuracy(stats.avgAccuracy);

      const cont = await resolveContinueLearning(lessonIds);
      const lessonId = cont?.lessonId ?? lessonIds[0] ?? "1";
      setCurrentLessonId(lessonId);
      setLessonTitle(lessonTitles[lessonId] ?? null);
    }
    void load();
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [lessonIds, lessonTitles]);

  const marathonHref = `/games/match?lessonId=${currentLessonId}`;

  return (
    <MobileAppShell activeTab="games" mainClassName="max-w-[390px] mx-auto w-full">
      <MobilePageHeader title="Тоглоом" />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Тоглосон", value: played },
          { label: "Дээд оноо", value: bestScore },
          { label: "Дундаж нарийвчлал", value: `${avgAccuracy}%` },
        ].map((stat) => (
          <div key={stat.label} className="app-game-stat">
            <p className="app-game-stat-value">{stat.value}</p>
            <p className="text-[10px] leading-tight text-[var(--app-muted)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

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
          Холимог марафон тоглох
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-bold text-[var(--app-text)]">
        Дасгал тоглоомууд
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.slug}?lessonId=${currentLessonId}`}
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
        ))}
      </div>
    </MobileAppShell>
  );
}
