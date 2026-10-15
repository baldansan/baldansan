"use client";

import { C } from "@/components/charts";
import {
  WEAK_SPOT_AREA_ICONS,
  WEAK_SPOT_AREA_LABELS,
  type WeakSpotArea,
} from "@/lib/analytics/weak-spots";
import {
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_TONES,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";

export function GradeChip({ grade }: { grade: LearnerGradeBucket }) {
  return (
    <span
      title={LEARNER_GRADE_LABELS[grade]}
      className={`inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${LEARNER_GRADE_TONES[grade]}`}
    >
      {grade === "unrated" ? "—" : grade}
    </span>
  );
}

export function WeakAreaChip({ area }: { area: WeakSpotArea | null }) {
  if (!area) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      <span aria-hidden="true">{WEAK_SPOT_AREA_ICONS[area]}</span>
      {WEAK_SPOT_AREA_LABELS[area]}
    </span>
  );
}

/** ▲ ногоон (өссөн), ▼ улаан (буурсан). */
export function TrendBadge({ delta, unit = "" }: { delta: number | null; unit?: string }) {
  if (delta == null) return <span className="text-slate-400">—</span>;
  if (delta === 0) return <span className="text-slate-400">■ 0</span>;
  const up = delta > 0;
  return (
    <span className="font-semibold tabular-nums" style={{ color: up ? C.good : C.bad }}>
      <span aria-hidden="true">{up ? "▲" : "▼"} </span>
      {up ? "+" : "−"}
      {Math.abs(Math.round(delta))}
      {unit}
    </span>
  );
}

export function formatLastActive(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const days = Math.floor((now - t) / 86_400_000);
  if (days <= 0) return "Өнөөдөр";
  if (days === 1) return "Өчигдөр";
  if (days < 60) return `${days} өдрийн өмнө`;
  return `${Math.floor(days / 30)} сарын өмнө`;
}

export function pctColor(v: number | null): string {
  return v == null ? C.muted : v >= 75 ? C.good : v < 50 ? C.bad : C.ink;
}

export function Pct({ value }: { value: number | null }) {
  return (
    <span className="tabular-nums" style={{ color: pctColor(value) }}>
      {value == null ? "—" : `${Math.round(value)}%`}
    </span>
  );
}
