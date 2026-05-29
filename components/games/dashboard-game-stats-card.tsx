"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getGameStats } from "@/lib/games/game-progress";

export function DashboardGameStatsCard() {
  const [stats, setStats] = useState({ played: 0, bestScore: 0, avgAccuracy: 0 });

  useEffect(() => {
    setStats(getGameStats());
    const refresh = () => setStats(getGameStats());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-purple-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Тоглоомын статистик</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xl font-bold text-purple-700">{stats.played}</p>
          <p className="text-[10px] text-slate-500">Тоглосон</p>
        </div>
        <div>
          <p className="text-xl font-bold text-purple-700">{stats.bestScore}</p>
          <p className="text-[10px] text-slate-500">Дээд оноо</p>
        </div>
        <div>
          <p className="text-xl font-bold text-purple-700">{stats.avgAccuracy}%</p>
          <p className="text-[10px] text-slate-500">Дундаж</p>
        </div>
      </div>
      <Link
        href="/games"
        className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-600"
      >
        Тоглоом тоглох
      </Link>
    </section>
  );
}
