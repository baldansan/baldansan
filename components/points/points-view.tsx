"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import {
  SKILL_GROUPS,
  SOURCE_META,
  type PointsSource,
} from "@/lib/points/points-config";
import {
  fetchMyPoints,
  fetchMyRanks,
  topPercent,
  type MyRank,
  type PointsSummary,
} from "@/lib/points/rank";
import {
  fetchStudentTimeline,
  formatDuration,
  type TimelineDay,
} from "@/lib/points/report";

const SCOPE_LABEL: Record<MyRank["scope"], string> = {
  class: "Анги",
  organization: "Сургууль",
  global: "Нийт",
};

function formatDay(day: string): string {
  const [y, m, d] = day.split("-");
  return y && m && d ? `${Number(m)}-р сарын ${Number(d)}` : day;
}

function SkillBars({ summary }: { summary: PointsSummary }) {
  const rows = SKILL_GROUPS.map((g) => ({
    ...g,
    value: g.sources.reduce((n, s) => n + (summary.bySource[s] ?? 0), 0),
  }));
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <svg
      viewBox="0 0 360 190"
      className="w-full"
      role="img"
      aria-label="5 ур чадварын оноо"
    >
      {rows.map((r, i) => {
        const y = i * 38 + 4;
        const w = r.value > 0 ? Math.max(12, Math.round((r.value / max) * 190)) : 0;
        return (
          <g key={r.key}>
            <text x="0" y={y + 15} fontSize="13" fill="currentColor">
              {r.icon} {r.label}
            </text>
            <rect x="110" y={y} width="190" height="20" rx="10" fill="#e2e8f0" />
            {w > 0 ? <rect x="110" y={y} width={w} height="20" rx="10" fill="#10b981" /> : null}
            <text x="308" y={y + 15} fontSize="13" fontWeight="700" fill="#047857">
              {r.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function PointsView() {
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [ranks, setRanks] = useState<MyRank[]>([]);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [s, r, t] = await Promise.all([
        fetchMyPoints(),
        fetchMyRanks("all"),
        fetchStudentTimeline({ days: 14 }),
      ]);
      if (!alive) return;
      setSummary(s);
      setRanks(r);
      setTimeline(t);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <MobileAppShell activeTab="profile">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">Ачааллаж байна…</p>
      </MobileAppShell>
    );
  }

  if (!summary) {
    return (
      <MobileAppShell activeTab="profile">
        <MobilePageHeader title="Миний оноо" />
        <MobileCard className="text-center">
          <p className="text-sm text-[var(--app-muted)]">
            Оноо цуглуулахын тулд нэвтэрнэ үү.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white"
          >
            Нэвтрэх
          </Link>
        </MobileCard>
      </MobileAppShell>
    );
  }

  const delta = summary.last7d - summary.prev7d;
  const sources = (Object.keys(SOURCE_META) as PointsSource[])
    .map((s) => ({ s, v: summary.bySource[s] ?? 0 }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v);

  return (
    <MobileAppShell activeTab="profile">
      <MobilePageHeader
        title="Миний оноо"
        subtitle="Сурсан бүхэн оноо өгнө."
        action={
          <Link href="/rank" className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            🏆 Зэрэглэл
          </Link>
        }
      />

      <div className="mb-4 rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-md">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Нийт оноо</p>
        <p className="mt-1 text-5xl font-black leading-none">⭐ {summary.total}</p>
        <p className="mt-3 text-sm font-medium text-emerald-50">
          Энэ 7 хоногт <b>{summary.last7d}</b> · Өмнөх 7 хоногт <b>{summary.prev7d}</b>{" "}
          {delta !== 0 ? (
            <span className="font-bold">
              ({delta > 0 ? "+" : ""}
              {delta})
            </span>
          ) : null}
        </p>
      </div>

      {ranks.length > 0 ? (
        <MobileCard className="mb-4">
          <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">Миний байр</h2>
          <ul className="space-y-2">
            {ranks.map((r) => (
              <li key={`${r.scope}-${r.scopeId ?? "g"}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <b>{SCOPE_LABEL[r.scope]}</b>
                  {r.scope !== "global" ? ` · ${r.scopeName}` : ""}
                </span>
                <span className="shrink-0 text-right">
                  <b className="text-emerald-700">{r.rank}-р байр</b>
                  <span className="text-xs text-[var(--app-muted)]"> / {r.participants}</span>
                  <span className="block text-xs text-[var(--app-muted)]">
                    Та эхний {topPercent(r.rank, r.participants)}%-д
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </MobileCard>
      ) : null}

      <MobileCard className="mb-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">5 ур чадвар</h2>
        <SkillBars summary={summary} />
      </MobileCard>

      <MobileCard className="mb-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">Оноо хаанаас ирсэн бэ</h2>
        {sources.length === 0 ? (
          <p className="text-sm text-[var(--app-muted)]">
            Хичээл дуусгах, үг давтах, видео үзэх бүрт оноо орно.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sources.map(({ s, v }) => (
              <li key={s} className="flex items-center gap-3 py-2 text-sm">
                <span aria-hidden>{SOURCE_META[s].icon}</span>
                <span className="flex-1">
                  {SOURCE_META[s].label}
                  <span className="block text-xs text-[var(--app-muted)]">{SOURCE_META[s].hint}</span>
                </span>
                <b className="text-emerald-700">+{v}</b>
              </li>
            ))}
          </ul>
        )}
      </MobileCard>

      <MobileCard className="mb-4">
        <h2 className="mb-1 text-sm font-bold text-[var(--app-text)]">Миний тайлан</h2>
        <p className="mb-3 text-xs text-[var(--app-muted)]">
          Сүүлийн 14 хоног — хэдэн цагт юу хийж, хэдэн оноо авсан.
        </p>
        {timeline.length === 0 ? (
          <p className="text-sm text-[var(--app-muted)]">Одоогоор бүртгэл алга.</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((d) => (
              <section key={d.day}>
                <div className="mb-1 flex items-baseline justify-between">
                  <h3 className="text-sm font-bold">{formatDay(d.day)}</h3>
                  <span className="text-xs text-[var(--app-muted)]">
                    {d.totalSeconds > 0 ? `${formatDuration(d.totalSeconds)} · ` : ""}
                    <b className="text-emerald-700">+{d.totalPoints}</b>
                  </span>
                </div>
                <ul className="space-y-1.5 border-l-2 border-emerald-100 pl-3">
                  {d.entries.map((e, i) => (
                    <li key={`${e.at}-${i}`} className="flex items-start gap-2 text-sm">
                      <span className="w-11 shrink-0 text-xs tabular-nums text-[var(--app-muted)]">{e.time}</span>
                      <span aria-hidden>{e.icon}</span>
                      <span className="min-w-0 flex-1">
                        {e.title}
                        {e.detail ? (
                          <span className="block truncate text-xs text-[var(--app-muted)]">{e.detail}</span>
                        ) : null}
                      </span>
                      {e.points > 0 ? (
                        <b className="shrink-0 text-emerald-700">+{e.points}</b>
                      ) : (
                        <span className="shrink-0 text-xs text-[var(--app-muted)]">{formatDuration(e.seconds)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </MobileCard>
    </MobileAppShell>
  );
}
