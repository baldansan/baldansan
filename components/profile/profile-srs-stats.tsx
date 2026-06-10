"use client";

import { useEffect, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { getLocalWordSrsStats } from "@/lib/srs/local-word-srs";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";
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

  useEffect(() => {
    if (!hydrated) return;

    async function load() {
      if (userId && hasSupabaseConfig) {
        const { data } = await getUserWordSrsStats(userId);
        if (data) {
          setStats(data);
          return;
        }
      }
      const { data: words } = await fetchHskWordsByLevel(activeLevel);
      setStats(getLocalWordSrsStats(words));
    }

    void load();
  }, [userId, activeLevel, hydrated]);

  const studied = stats?.studiedCount ?? 0;
  const dailyDone = stats?.dailyDone ?? 0;
  const dailyGoal = stats?.dailyGoal ?? 20;
  const dueToday = stats?.dueToday ?? 0;
  const accuracy = stats?.accuracyPct ?? 0;

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
    </>
  );
}
