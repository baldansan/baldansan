"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { getAllQuizResultsSmart } from "@/lib/progress";
import { resolveContinueLearning } from "@/lib/learner-progress";

type Props = {
  lessonIds: string[];
};

const GAMES = [
  {
    id: "match",
    title: "Холбох",
    desc: "Хятад үг ↔ Орчуулга холбох тоглоом",
    icon: "🔗",
    color: "from-violet-400 to-violet-500",
    href: "/review",
    badge: "Шинэ",
  },
  {
    id: "translate",
    title: "Орчуулах",
    desc: "Зөв орчуулгыг сонгож сурах",
    icon: "🌐",
    color: "from-blue-400 to-blue-500",
    href: "/lessons/1/quiz",
    badge: "Шинэ",
  },
  {
    id: "cloze",
    title: "Дутуу үг",
    desc: "Дутуу үгийг бөглөх өгүүлбэр",
    icon: "✏️",
    color: "from-amber-400 to-amber-500",
    href: "/lessons/1/quiz",
    badge: "Шинэ",
  },
  {
    id: "order",
    title: "Дараалал",
    desc: "Ханзнуудыг зөв дараалалд оруулах",
    icon: "🔢",
    color: "from-emerald-400 to-emerald-500",
    href: "/kanji",
    badge: "Шинэ",
  },
  {
    id: "stroke",
    title: "Дутуу зураас",
    desc: "Ханзны дутуу зураасыг сонгох",
    icon: "🖊️",
    color: "from-rose-400 to-rose-500",
    href: "/kanji",
    badge: "Шинэ",
  },
] as const;

export function GamesAppView({ lessonIds }: Props) {
  const [played, setPlayed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [marathonHref, setMarathonHref] = useState("/lessons/1/quiz");

  useEffect(() => {
    async function load() {
      const results = await getAllQuizResultsSmart();
      setPlayed(results.length);
      if (results.length > 0) {
        const bests = results.map((r) => r.result.bestPercentage);
        setBestScore(Math.max(...bests));
        const avg = Math.round(
          bests.reduce((s, p) => s + p, 0) / bests.length
        );
        setAvgAccuracy(avg);
      }
      const cont = await resolveContinueLearning(lessonIds);
      if (cont) {
        setMarathonHref(cont.href.replace(/\/$/, "") + "/quiz");
      }
    }
    void load();
  }, [lessonIds]);

  return (
    <MobileAppShell activeTab="games">
      <MobilePageHeader title="Тоглоом" />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Тоглосон", value: played },
          { label: "Дээд оноо", value: `${bestScore}%` },
          { label: "Дундаж", value: `${avgAccuracy}%` },
        ].map((stat) => (
          <MobileCard key={stat.label} padding="sm" className="text-center !p-3">
            <p className="text-lg font-bold text-[var(--app-text)]">
              {stat.value}
            </p>
            <p className="text-[10px] text-[var(--app-muted)]">{stat.label}</p>
          </MobileCard>
        ))}
      </div>

      <MobileCard className="mb-5 !bg-gradient-to-br from-purple-500 to-violet-600 !border-purple-400 !text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-100">
          Тоглоомын чиглэл
        </p>
        <p className="mt-1 text-sm text-purple-50">
          Quiz марафон эсвэл үг давталтаар бататга.
        </p>
        <Link
          href={marathonHref}
          className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-purple-700"
        >
          Quiz марафон эхлэх
        </Link>
      </MobileCard>

      <h2 className="mb-3 text-sm font-bold text-[var(--app-text)]">
        Дасгал тоглоомууд
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((game) => (
          <Link key={game.id} href={game.href} className="block">
            <MobileCard padding="sm" className="relative h-full !p-3">
              <span className="absolute right-2 top-2 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
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

      <p className="mt-4 text-center text-xs text-[var(--app-muted)]">
        Бүрэн тоглоомууд удахгүй. Одоогоор quiz болон давталт ашиглана.
      </p>
    </MobileAppShell>
  );
}
