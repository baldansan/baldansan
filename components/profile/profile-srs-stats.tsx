"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { getGameStats } from "@/lib/games/game-progress";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import {
  getLocalWordSrsStats,
  readLocalStudiedWordIds,
} from "@/lib/srs/local-word-srs";
import {
  fetchHskLevelTotals,
  fetchHskWordsByIds,
} from "@/lib/supabase/hsk-words";
import {
  getUserWordSrsStats,
  type UserWordSrsStats,
} from "@/lib/supabase/user-word-srs";
import { hasSupabaseConfig } from "@/lib/supabase/auth";

type Props = {
  userId: string | null;
  streak: number;
  dayNumber: number;
};

export function ProfileSrsStats({ userId, streak, dayNumber }: Props) {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [stats, setStats] = useState<UserWordSrsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [gamePlayed, setGamePlayed] = useState(0);
  const [gameBest, setGameBest] = useState(0);
  const [isChinese, setIsChinese] = useState(false);

  useEffect(() => {
    setIsChinese(getSelectedLanguage() === "zh");
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    async function load() {
      setLoading(true);
      try {
        if (userId && hasSupabaseConfig) {
          const { data } = await getUserWordSrsStats(userId);
          if (data) {
            setStats(data);
            return;
          }
        }
        const [{ totals }, { data: studiedWords }] = await Promise.all([
          fetchHskLevelTotals(),
          fetchHskWordsByIds(readLocalStudiedWordIds()),
        ]);

        const studiedWordLevels = new Map<number, number>();
        for (const word of studiedWords ?? []) {
          if (word.id == null) continue;
          const raw = word.hsk_level;
          if (raw == null || raw === "7-9") continue;
          const level = Number(raw);
          if (Number.isInteger(level) && level >= 1 && level <= 6) {
            studiedWordLevels.set(word.id, level);
          }
        }

        setStats(getLocalWordSrsStats(totals, studiedWordLevels));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [userId, activeLevel, hydrated]);

  useEffect(() => {
    const g = getGameStats();
    setGamePlayed(g.played);
    setGameBest(g.bestScore);
  }, []);

  const studied = stats?.studiedCount ?? 0;
  const dailyDone = stats?.dailyDone ?? 0;
  const dailyGoal = stats?.dailyGoal ?? 20;
  const dueToday = stats?.dueToday ?? 0;
  const accuracy = stats?.accuracyPct ?? 0;
  const dailyPct =
    dailyGoal > 0 ? Math.min(100, Math.round((dailyDone / dailyGoal) * 100)) : 0;

  if (loading) {
    return (
      <div className="mb-5 space-y-3 animate-pulse">
        <div className="h-16 rounded-[22px] bg-slate-100" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-[18px] bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="mb-4 text-center">
        <p className="text-sm text-[var(--app-muted)]">
          HSK{activeLevel} түвшин · {dayNumber}-р өдөр
        </p>
      </section>

      <div className="bs-profile-streak mb-4">
        <span className="text-2xl" aria-hidden>
          🔥
        </span>
        <div>
          <p className="text-2xl font-black text-[#b45309]">{streak}</p>
          <p className="text-xs font-bold text-[#92400e]">Дараалсан өдөр</p>
        </div>
      </div>

      <div className="mb-4 rounded-[18px] bg-white p-3 shadow-[var(--bs-shadow)]">
        <div className="mb-1.5 flex justify-between text-[11px] font-bold">
          <span>Өдрийн зорилт</span>
          <span className="text-[var(--app-muted)]">
            {dailyDone}/{dailyGoal}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e8eeea]">
          <div
            className="h-full rounded-full bg-[#1FB85A] transition-all"
            style={{ width: `${dailyPct}%` }}
          />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <div className="bs-profile-stat-card">
          <p className="bs-profile-stat-value">{studied}</p>
          <p className="bs-profile-stat-label">Сурсан үг</p>
        </div>
        <div className="bs-profile-stat-card">
          <p className="bs-profile-stat-value">
            {dailyDone}/{dailyGoal}
          </p>
          <p className="bs-profile-stat-label">Өдрийн зорилт</p>
        </div>
        <div className="bs-profile-stat-card">
          <p className="bs-profile-stat-value">{dueToday}</p>
          <p className="bs-profile-stat-label">Давтах хуримтлал</p>
        </div>
        <div className="bs-profile-stat-card">
          <p className="bs-profile-stat-value">{accuracy}%</p>
          <p className="bs-profile-stat-label">Зөв хариулалт</p>
        </div>
      </div>

      {stats?.hskProgress?.length ? (
        <section className="mb-5 rounded-[22px] bg-white p-4 shadow-[var(--bs-shadow)]">
          <h2 className="mb-3 text-sm font-extrabold text-[var(--app-text)]">
            HSK түвшний явц
          </h2>
          <div className="flex flex-col gap-2.5">
            {stats.hskProgress.map((row) => {
              const pct =
                row.total > 0
                  ? Math.min(100, Math.round((row.studied / row.total) * 100))
                  : 0;
              const done = pct >= 100;
              return (
                <div key={row.level}>
                  <div className="mb-1 flex justify-between text-[11px] font-bold">
                    <span>HSK{row.level}</span>
                    <span className="text-[var(--app-muted)]">
                      {row.studied}/{row.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e8eeea]">
                    <div
                      className={`h-full rounded-full transition-all ${done ? "bg-[#1FB85A]" : "bg-[var(--app-primary)]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mb-5 grid grid-cols-2 gap-2">
        <Link href="/review" className="bs-profile-action">
          <span aria-hidden>📖</span>
          <span className="bs-profile-action-label">Давтах</span>
          {dueToday > 0 ? (
            <span className="bs-profile-action-badge">{dueToday}</span>
          ) : null}
        </Link>
        <Link
          href={isChinese ? "/games/meaning" : "/games"}
          className="bs-profile-action"
        >
          <span aria-hidden>🎯</span>
          <span className="bs-profile-action-label">
            {isChinese ? "Утга сонгох" : "Тоглоом"}
          </span>
        </Link>
      </section>

      {gamePlayed > 0 ? (
        <section className="mb-5 rounded-[22px] bg-white p-4 shadow-[var(--bs-shadow)]">
          <h2 className="mb-3 text-sm font-extrabold text-[var(--app-text)]">
            Тоглоомын статистик
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="bs-profile-stat-card !shadow-none !bg-[#f4faf6]">
              <p className="bs-profile-stat-value">{gamePlayed}</p>
              <p className="bs-profile-stat-label">Тоглосон</p>
            </div>
            <div className="bs-profile-stat-card !shadow-none !bg-[#f4faf6]">
              <p className="bs-profile-stat-value">{gameBest}</p>
              <p className="bs-profile-stat-label">Дээд оноо</p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
