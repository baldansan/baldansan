"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { mongoliaDay } from "@/lib/analytics/activity-tracker";
import { fetchMyPoints, fetchMyRanks, type MyRank } from "@/lib/points/rank";
import {
  fetchStudentTimeline,
  formatDuration,
  type TimelineDay,
} from "@/lib/points/report";
import { countCompletedLessonsAll } from "@/lib/progress";
import { getStreakUnified } from "@/lib/retention/retention-service";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  getUserWordSrsStats,
  type UserWordSrsStats,
} from "@/lib/supabase/user-word-srs";

/**
 * «Миний ахиц» — ахицтай холбоотой бүхэн ганц дэлгэцэд:
 * энэ 7 хоног · үг/хичээл/оноо · одоогийн түвшний үг · зэрэглэл · сүүлийн үйлдлүүд.
 * (Хуучин /points, /weekly-report, урт /progress-ийг орлоно.)
 */

const DAY_LABELS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

/** Энэ долоо хоногийн Даваа–Ням (Улаанбаатарын өдрөөр). */
function currentWeekDays(): { day: string; label: string; isToday: boolean; isFuture: boolean }[] {
  const today = mongoliaDay();
  const [y, m, d] = today.split("-").map(Number);
  const base = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  const dow = (base.getUTCDay() + 6) % 7; // Даваа = 0
  return DAY_LABELS.map((label, i) => {
    const dt = new Date(base.getTime() + (i - dow) * 86_400_000);
    const day = dt.toISOString().slice(0, 10);
    return { day, label, isToday: i === dow, isFuture: i > dow };
  });
}

function formatDay(day: string): string {
  const [, m, d] = day.split("-");
  return m && d ? `${Number(m)}-р сарын ${Number(d)}` : day;
}

export function MyProgressView() {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [points, setPoints] = useState(0);
  const [stats, setStats] = useState<UserWordSrsStats | null>(null);
  const [lessons, setLessons] = useState(0);
  const [streak, setStreak] = useState(0);
  const [rank, setRank] = useState<MyRank | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLessons(countCompletedLessonsAll());
      const userId = hasSupabaseConfig ? (await getAuthenticatedUserId()).userId : null;
      const [t, p, s, r, st] = await Promise.all([
        userId ? fetchStudentTimeline({ days: 14 }).catch(() => []) : Promise.resolve([]),
        userId ? fetchMyPoints().catch(() => null) : Promise.resolve(null),
        userId ? getUserWordSrsStats(userId).then((x) => x.data).catch(() => null) : Promise.resolve(null),
        userId ? fetchMyRanks("all").catch(() => []) : Promise.resolve([]),
        getStreakUnified().catch(() => null),
      ]);
      if (!alive) return;
      setLoggedIn(Boolean(userId));
      setTimeline(t);
      setPoints(p?.total ?? 0);
      setStats(s);
      // Хамгийн ойр хүрээ (анги → сургууль → нийт)-ний байрыг харуулна.
      setRank(
        r.find((x) => x.scope === "class") ??
          r.find((x) => x.scope === "organization") ??
          r.find((x) => x.scope === "global") ??
          null
      );
      setStreak(st?.currentStreak ?? 0);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!ready || !hydrated) {
    return (
      <MobileAppShell activeTab="profile">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">Ачааллаж байна…</p>
      </MobileAppShell>
    );
  }

  const byDay = new Map(timeline.map((d) => [d.day, d]));
  const week = currentWeekDays().map((w) => {
    const d = byDay.get(w.day);
    return { ...w, seconds: d?.totalSeconds ?? 0, pts: d?.totalPoints ?? 0 };
  });
  // Баганын өндөр: зарцуулсан хугацаа; хугацаа бүртгэгдээгүй бол оноогоор.
  const weight = (w: { seconds: number; pts: number }) => (w.seconds > 0 ? w.seconds : w.pts * 20);
  const max = Math.max(1, ...week.map(weight));
  const activeDays = week.filter((w) => weight(w) > 0).length;
  const weekSeconds = week.reduce((n, w) => n + w.seconds, 0);
  const weekPoints = week.reduce((n, w) => n + w.pts, 0);

  const lvl = typeof activeLevel === "number" ? activeLevel : null;
  const lvlRow = lvl ? stats?.hskProgress?.find((r) => Number(r.level) === lvl) : null;
  const lvlPct = lvlRow && lvlRow.total > 0 ? Math.min(100, Math.round((lvlRow.studied / lvlRow.total) * 100)) : 0;

  return (
    <MobileAppShell activeTab="profile">
      <MobilePageHeader title="Миний ахиц" />

      <section className="bs-mp-card">
        <p className="bs-mp-k">Энэ 7 хоног</p>
        <div className="bs-mp-bars" aria-hidden>
          {week.map((w) => {
            const v = weight(w);
            return (
              <div key={w.day} className="bs-mp-bar-col">
                <div className="bs-mp-bar-track">
                  <i
                    className={v > 0 ? "bs-mp-bar bs-mp-bar--on" : "bs-mp-bar"}
                    style={{ height: v > 0 ? `${Math.max(14, Math.round((v / max) * 100))}%` : "8%" }}
                  />
                </div>
                <span className={w.isToday ? "bs-mp-bar-l bs-mp-bar-l--today" : "bs-mp-bar-l"}>{w.label}</span>
              </div>
            );
          })}
        </div>
        <p className="bs-mp-sum">
          {activeDays > 0 ? (
            <>
              <b>{activeDays} өдөр</b> суралцсан
              {weekSeconds > 0 ? <> · нийт <b>{formatDuration(weekSeconds)}</b></> : null}
              {weekPoints > 0 ? <> · <b>+{weekPoints}</b> оноо</> : null}
            </>
          ) : loggedIn ? (
            "Энэ долоо хоногт хараахан суралцаагүй байна. Өнөөдөр эхэлцгээе!"
          ) : (
            "Нэвтэрвэл өдөр өдрийн ахиц чинь энд харагдана."
          )}
        </p>
      </section>

      <section className="bs-mp-stats">
        <div>
          <b>{stats?.studiedCount ?? 0}</b>
          <span>сурсан үг</span>
        </div>
        <div>
          <b>{lessons}</b>
          <span>хичээл</span>
        </div>
        <div>
          <b>{points}</b>
          <span>оноо</span>
        </div>
        <div>
          <b>🔥 {streak}</b>
          <span>өдөр</span>
        </div>
      </section>

      {lvlRow ? (
        <section className="bs-mp-card">
          <div className="bs-mp-row">
            <b>HSK {lvl}-ийн үг</b>
            <span>
              {lvlRow.studied} / {lvlRow.total}
            </span>
          </div>
          <div className="bs-mp-prog">
            <i style={{ width: `${Math.max(lvlPct, lvlRow.studied > 0 ? 3 : 0)}%` }} />
          </div>
          <p className="bs-mp-hint">
            {lvlRow.studied >= lvlRow.total
              ? "Энэ түвшний бүх үгийг үзсэн байна 🎉"
              : `Үлдсэн ${lvlRow.total - lvlRow.studied} үг`}
          </p>
        </section>
      ) : null}

      {!loggedIn ? (
        <Link href="/login" className="bs-mp-login">
          Ахицаа хадгалахын тулд нэвтрэх
        </Link>
      ) : null}

      <section className="bs-mp-card bs-mp-list">
        <Link href="/rank" className="bs-mp-li">
          <span className="bs-mp-ic" aria-hidden>🏅</span>
          <span className="bs-mp-li-body">
            <b>Зэрэглэл</b>
            <span>
              {rank
                ? `${rank.scope === "global" ? "Нийт" : rank.scopeName} дунд ${rank.rank}-р байр`
                : "Бусадтай оноогоо харьцуулах"}
            </span>
          </span>
          <span className="bs-mp-chev" aria-hidden>›</span>
        </Link>

        {loggedIn ? (
          <details className="bs-mp-hist">
            <summary className="bs-mp-li">
              <span className="bs-mp-ic" aria-hidden>🕘</span>
              <span className="bs-mp-li-body">
                <b>Сүүлийн үйлдлүүд</b>
                <span>Сүүлийн 14 хоног, өдөр өдрөөр</span>
              </span>
              <span className="bs-mp-chev bs-mp-chev--down" aria-hidden>▾</span>
            </summary>
            {timeline.length === 0 ? (
              <p className="bs-mp-hint bs-mp-hist-empty">Одоогоор бүртгэл алга.</p>
            ) : (
              <div className="bs-mp-days">
                {timeline.map((d) => (
                  <details key={d.day} className="bs-mp-day">
                    <summary>
                      <b>{formatDay(d.day)}</b>
                      <span>
                        {d.totalSeconds > 0 ? formatDuration(d.totalSeconds) : ""}
                        {d.totalSeconds > 0 && d.totalPoints > 0 ? " · " : ""}
                        {d.totalPoints > 0 ? <em>+{d.totalPoints}</em> : null}
                      </span>
                    </summary>
                    <ul>
                      {d.entries.map((e, i) => (
                        <li key={`${e.at}-${i}`}>
                          <span className="bs-mp-time">{e.time}</span>
                          <span aria-hidden>{e.icon}</span>
                          <span className="bs-mp-entry">
                            {e.title}
                            {e.detail ? <small>{e.detail}</small> : null}
                          </span>
                          {e.points > 0 ? <em>+{e.points}</em> : <small>{formatDuration(e.seconds)}</small>}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            )}
          </details>
        ) : null}
      </section>
    </MobileAppShell>
  );
}
