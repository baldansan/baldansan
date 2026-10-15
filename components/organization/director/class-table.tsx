"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { C, DistributionBar, fmtPct, type DistSegment } from "@/components/charts";
import { DEMO_BADGE_LABEL } from "@/lib/demo-data";
import { LEARNER_GRADE_LABELS, type LearnerGradeBucket } from "@/lib/learner-grade";
import type { DashClass } from "@/lib/organization/dashboard-types";

export const GRADE_COLORS: Record<LearnerGradeBucket, string> = {
  A: "#047857",
  B: "#34d399",
  C: "#fbbf24",
  D: "#f97316",
  F: "#dc2626",
  unrated: "#cbd5e1",
};

export function gradeSegments(c: DashClass): DistSegment[] {
  return c.distribution.map((d) => ({ label: LEARNER_GRADE_LABELS[d.bucket], value: d.count, color: GRADE_COLORS[d.bucket] }));
}

/** Semantic colour for a percentage: good ≥ 75, bad < 50, otherwise neutral ink. */
export function pctColor(v: number | null): string {
  return v == null ? C.muted : v >= 75 ? C.good : v < 50 ? C.bad : C.ink;
}

type Key = "rank" | "name" | "teacher" | "students" | "active" | "att" | "exam" | "quiz" | "hours" | "points" | "trend";

const COLS: { key: Key; label: string; get: (c: DashClass) => number | string | null; num?: boolean }[] = [
  { key: "rank", label: "Байр", get: (c) => c.pointsRank, num: true },
  { key: "name", label: "Анги", get: (c) => c.name },
  { key: "teacher", label: "Багш", get: (c) => c.teacherName },
  { key: "students", label: "Сурагч", get: (c) => c.students, num: true },
  { key: "active", label: "Идэвхтэй", get: (c) => c.activePct, num: true },
  { key: "att", label: "Ирц", get: (c) => c.attendancePct, num: true },
  { key: "exam", label: "Шалгалт", get: (c) => c.examAvgPct, num: true },
  { key: "quiz", label: "Дасгалын зөв", get: (c) => c.quizAccuracyPct, num: true },
  { key: "hours", label: "Цаг/сурагч", get: (c) => c.hoursPerStudent, num: true },
  { key: "points", label: "Дундаж оноо", get: (c) => c.avgPoints, num: true },
  { key: "trend", label: "Хандлага", get: (c) => c.trend, num: true },
];

/** Sortable per-class table; best/worst by the sort-independent score get a coloured edge. */
export function ClassTable({ classes }: { classes: DashClass[] }) {
  const [key, setKey] = useState<Key>(classes.some((c) => c.pointsRank != null) ? "rank" : "active");
  const [dir, setDir] = useState<1 | -1>(key === "rank" ? 1 : -1);

  const score = (c: DashClass) => c.avgPoints ?? c.activePct ?? null;
  const scored = classes.filter((c) => score(c) != null);
  const best = scored.length > 1 ? scored.reduce((a, b) => (score(b)! > score(a)! ? b : a)) : null;
  const worst = scored.length > 1 ? scored.reduce((a, b) => (score(b)! < score(a)! ? b : a)) : null;

  const rows = useMemo(() => {
    const col = COLS.find((c) => c.key === key)!;
    return [...classes].sort((a, b) => {
      const x = col.get(a);
      const y = col.get(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (typeof x === "string" ? x.localeCompare(String(y), "mn") : (x as number) - (y as number)) * dir;
    });
  }, [classes, key, dir]);

  function sortBy(k: Key) {
    if (k === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setKey(k);
      setDir(k === "rank" || k === "name" || k === "teacher" ? 1 : -1);
    }
  }

  if (classes.length === 0) return <p className="text-sm text-slate-500">Анги бүртгэгдээгүй байна.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            {COLS.map((c) => (
              <th key={c.key} className={`px-2 py-2 font-semibold ${c.num ? "text-right" : ""}`} aria-sort={c.key === key ? (dir === 1 ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => sortBy(c.key)} className="inline-flex items-center gap-1 hover:text-emerald-700">
                  {c.label}
                  {c.key === key ? <span aria-hidden="true">{dir === 1 ? "▲" : "▼"}</span> : null}
                </button>
              </th>
            ))}
            <th className="w-36 px-2 py-2 font-semibold">Үнэлгээ A–F</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const edge = c === best ? C.good : c === worst ? C.bad : "transparent";
            return (
              <tr key={c.classroomId} className="print-box border-b border-slate-100 hover:bg-emerald-50/40" style={{ boxShadow: `inset 3px 0 0 ${edge}` }}>
                <td className="px-2 py-2 text-right tabular-nums font-semibold">{c.pointsRank ?? "—"}</td>
                <td className="px-2 py-2">
                  <Link href={`/teacher/classes/${c.classroomId}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                    {c.name}
                  </Link>
                  {c.isDemo ? <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">{DEMO_BADGE_LABEL}</span> : null}
                  {c === best ? <span className="ml-1.5 text-[11px] font-semibold" style={{ color: C.good }}>▲ тэргүүлэгч</span> : null}
                  {c === worst ? <span className="ml-1.5 text-[11px] font-semibold" style={{ color: C.bad }}>▼ анхаарах</span> : null}
                </td>
                <td className="px-2 py-2 text-slate-600">{c.teacherName}</td>
                <td className="px-2 py-2 text-right tabular-nums">{c.students}</td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color: pctColor(c.activePct) }}>{fmtPct(c.activePct)}</td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color: pctColor(c.attendancePct) }}>{fmtPct(c.attendancePct)}</td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color: pctColor(c.examAvgPct) }}>{fmtPct(c.examAvgPct)}</td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color: pctColor(c.quizAccuracyPct) }}>{fmtPct(c.quizAccuracyPct)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{c.hoursPerStudent ?? "—"}</td>
                <td className="px-2 py-2 text-right tabular-nums font-semibold">{c.avgPoints ?? "—"}</td>
                <td className="px-2 py-2 text-right tabular-nums" style={{ color: c.trend == null || c.trend === 0 ? C.muted : c.trend > 0 ? C.good : C.bad }}>
                  {c.trend == null ? "—" : c.trend > 0 ? `▲ ${c.trend}` : c.trend < 0 ? `▼ ${Math.abs(c.trend)}` : "■ 0"}
                </td>
                <td className="px-2 py-2"><DistributionBar segments={gradeSegments(c)} height={10} ariaLabel={`${c.name} үнэлгээний хуваарилалт`} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
