"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileAchievementBadges } from "@/components/profile/profile-achievement-badges";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import {
  getRecentGameResults,
  getGameStats,
} from "@/lib/games/game-progress";
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
  completedLessons: number;
};

export function ProfileSrsStats({
  userId,
  streak,
  completedLessons,
}: Props) {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [stats, setStats] = useState<UserWordSrsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [gamePlayed, setGamePlayed] = useState(0);
  const [gameBest, setGameBest] = useState(0);
  const [gamesCompleted, setGamesCompleted] = useState(0);
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
    const perfectTypes = new Set(
      getRecentGameResults(200)
        .filter((r) => r.accuracy >= 100)
        .map((r) => r.gameType)
    );
    setGamesCompleted(perfectTypes.size);
  }, []);

  const studied = stats?.studiedCount ?? 0;
  const accuracy = stats?.accuracyPct ?? 0;

  if (loading) {
    return (
      <div className="mb-5 space-y-3 animate-pulse">
        <div className="h-16 rounded-[22px] bg-slate-100" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square rounded-[18px] bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bs-tm-stat-row">
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>📚</div>
          <div className="bs-tm-stat-n">{studied}</div>
          <div className="bs-tm-stat-l">Сурсан үг</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>🎯</div>
          <div className="bs-tm-stat-n">{accuracy}%</div>
          <div className="bs-tm-stat-l">Нарийвчлал</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>🎮</div>
          <div className="bs-tm-stat-n">{gamePlayed}</div>
          <div className="bs-tm-stat-l">Тоглосон</div>
        </div>
      </div>

      <ProfileAchievementBadges
        streak={streak}
        studiedCount={studied}
        completedLessons={completedLessons}
        accuracyPct={accuracy}
        activeLevel={activeLevel}
      />

      {stats?.hskProgress?.length ? (
        <>
          <p className="bs-tm-sec">📊 HSK түвшний явц</p>
          <div className="bs-tm-card bs-tm-lvl-card">
            {stats.hskProgress.map((row) => {
              const pct =
                row.total > 0
                  ? Math.min(100, Math.round((row.studied / row.total) * 100))
                  : 0;
              return (
                <div key={row.level} className="bs-tm-lvl">
                  <div className="bs-tm-lvl-head">
                    <b>HSK {row.level}</b>
                    <span>{row.studied}/{row.total}</span>
                  </div>
                  <div className="bs-tm-lvl-bar">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <p className="bs-tm-sec">🎮 Тоглоомын статистик</p>
      <div className="bs-tm-stat-row" style={{ marginBottom: 18 }}>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>🎮</div>
          <div className="bs-tm-stat-n">{gamePlayed}</div>
          <div className="bs-tm-stat-l">Тоглосон</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>🏆</div>
          <div className="bs-tm-stat-n">{gameBest}</div>
          <div className="bs-tm-stat-l">Дээд оноо</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>✅</div>
          <div className="bs-tm-stat-n">{gamesCompleted}</div>
          <div className="bs-tm-stat-l">Дуусгасан</div>
        </div>
      </div>

      <Link href="/settings" className="bs-tm-card">
        <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>
          ⚙️
        </span>
        <span className="flex-1">
          <span className="bs-tm-card-title">Тохиргоо</span>
        </span>
        <span className="bs-tm-card-chev" aria-hidden>›</span>
      </Link>

      {isChinese ? (
        <Link
          href="/games/meaning"
          className="bs-tm-card mt-2"
        >
          <span className="bs-tm-card-ic bs-tm-card-ic--purple" aria-hidden>
            🎯
          </span>
          <span className="flex-1">
            <span className="bs-tm-card-title">Утга сонгох тоглоом</span>
            <span className="bs-tm-card-sub">Тоглоомын хэсэг</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>
      ) : null}
    </>
  );
}
