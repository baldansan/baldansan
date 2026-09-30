"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDailyMissions, type DailyMission } from "@/lib/games/game-fx";
import { getRecentGameResults, type GameResult } from "@/lib/games/game-progress";
import { readRetentionStore } from "@/lib/retention/daily-activity";
import { getStreakUnified } from "@/lib/retention/retention-service";
import type { LearningRetentionSummary } from "@/lib/retention/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import "./profile-stats-rail.css";

const DAYS = 14;
const DAY_SHORT = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

const GAME_LABEL: Record<string, string> = {
  match: "Холбох",
  translate: "Орчуулах",
  "missing-word": "Дутуу үг",
  arrange: "Дараалал",
  stroke: "Ханз задлах",
  "bichleg-quiz": "Ангийн шалгалт",
  dictation: "Диктант",
  "daily-challenge": "Өдрийн сорил",
  "speed-challenge": "Хурдны тэмцээн",
  "srs-marathon": "SRS марафон",
  "hsk-vocab-quiz": "Үгийн сорил",
};

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Сүүлийн 14 өдрийн идэвх (энэ төхөөрөмжийн лог) — өдөр бүрийн үйлдлийн тоо. */
function readActivityBars(): { key: string; label: string; count: number; today: boolean }[] {
  const store = readRetentionStore();
  const byDate = new Map<string, number>();
  for (const entry of store.activityLog) byDate.set(entry.date, entry.activities.length);
  const out = [];
  const now = new Date();
  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = localDateKey(d);
    out.push({ key, label: DAY_SHORT[d.getDay()], count: byDate.get(key) ?? 0, today: i === 0 });
  }
  return out;
}

/** PC: Профайлын баруун самбар — 14 өдрийн идэвх, streak, сүүлийн тоглоом, өдрийн даалгавар. */
export function ProfileStatsRail() {
  const locale = useUiLocale();
  const [bars, setBars] = useState<ReturnType<typeof readActivityBars>>([]);
  const [summary, setSummary] = useState<LearningRetentionSummary | null>(null);
  const [games, setGames] = useState<GameResult[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>([]);

  useEffect(() => {
    setBars(readActivityBars());
    setGames(getRecentGameResults(6));
    setMissions(getDailyMissions());
    void getStreakUnified().then(setSummary).catch(() => null);
  }, []);

  const max = Math.max(1, ...bars.map((b) => b.count));
  const activeDays = bars.filter((b) => b.count > 0).length;

  return (
    <div className="bs-pr">
      <div className="bs-pr-card">
        <div className="bs-pr-head">
          <span>{tr(locale, "Сүүлийн 14 өдөр")}</span>
          <span className="bs-pr-muted">{activeDays}/{DAYS} {tr(locale, "өдөр идэвхтэй")}</span>
        </div>
        <div className="bs-pr-bars" role="img" aria-label={tr(locale, "14 өдрийн идэвхийн график")}>
          {bars.map((b) => (
            <div key={b.key} className="bs-pr-bar-col" title={`${b.key}: ${b.count}`}>
              <div className="bs-pr-bar-track">
                <div
                  className={`bs-pr-bar${b.count > 0 ? " bs-pr-bar--on" : ""}${b.today ? " bs-pr-bar--today" : ""}`}
                  style={{ height: `${Math.max(b.count > 0 ? 12 : 4, Math.round((b.count / max) * 100))}%` }}
                />
              </div>
              <span className="bs-pr-bar-label">{b.label}</span>
            </div>
          ))}
        </div>
        {summary ? (
          <div className="bs-pr-stats">
            <div>
              <b>🔥 {summary.currentStreak}</b>
              <span>{tr(locale, "өдөр дараалан")}</span>
            </div>
            <div>
              <b>🏅 {summary.longestStreak}</b>
              <span>{tr(locale, "дээд streak")}</span>
            </div>
            <div>
              <b>{summary.activeDaysThisWeek}/7</b>
              <span>{tr(locale, "энэ 7 хоног")}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bs-pr-card">
        <div className="bs-pr-head">
          <span>🎯 {tr(locale, "Өдрийн даалгавар")}</span>
          <span className="bs-pr-muted">{missions.filter((m) => m.done).length}/{missions.length}</span>
        </div>
        <ul className="bs-pr-list">
          {missions.map((m) => (
            <li key={m.id} className={m.done ? "bs-pr-done" : ""}>
              <span>{m.done ? "✅" : "⬜"} {tr(locale, m.label)}</span>
              <span className="bs-pr-muted">{m.current}/{m.target}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bs-pr-card">
        <div className="bs-pr-head">
          <span>🎮 {tr(locale, "Сүүлийн тоглоомууд")}</span>
          <Link href="/games" className="bs-pr-link">{tr(locale, "Бүгд")} →</Link>
        </div>
        {games.length === 0 ? (
          <p className="bs-pr-muted">{tr(locale, "Тоглоом тоглоогүй байна")}</p>
        ) : (
          <ul className="bs-pr-list">
            {games.map((g, i) => (
              <li key={`${g.playedAt}-${i}`}>
                <span>{tr(locale, GAME_LABEL[g.gameType] ?? g.gameType)}</span>
                <span className="bs-pr-muted">
                  <b className="bs-pr-score">{g.score}</b> · {g.accuracy}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
