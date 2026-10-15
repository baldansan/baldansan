import { C } from "./tokens";

export type RankRow = {
  id: string;
  rank: number;
  name: string;
  sub?: string;
  value: number;
  /** Change vs previous period (positive = improved). */
  delta?: number | null;
  /** 0–100 where 100 = top of the whole group. */
  percentile?: number | null;
  badge?: string;
};

type Props = { rows: RankRow[]; valueLabel?: string; unit?: string; empty?: string };

const MEDAL = [C.gold, C.silver, C.bronze];

/** Ranked list: medal for top 3, delta vs last period, percentile. */
export function RankTable({ rows, valueLabel = "Оноо", unit = "", empty = "Одоогоор дараалал алга." }: Props) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="m-0 list-none divide-y divide-slate-100 p-0">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums"
            style={r.rank <= 3 ? { background: MEDAL[r.rank - 1], color: "#fff" } : { background: C.track, color: C.ink2 }}
            aria-label={`${r.rank}-р байр`}
          >
            {r.rank}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {r.name}
              {r.badge ? (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{r.badge}</span>
              ) : null}
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: C.track }}>
              <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: C.brand }} />
            </div>
            {r.sub ? <p className="mt-0.5 truncate text-xs text-slate-500">{r.sub}</p> : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums text-slate-900" title={valueLabel}>
              {Math.round(r.value).toLocaleString("en-US")}
              {unit}
            </p>
            <p className="text-xs tabular-nums" style={{ color: r.delta == null || r.delta === 0 ? C.muted : r.delta > 0 ? C.good : C.bad }}>
              {r.delta == null ? "" : r.delta > 0 ? `▲ ${Math.round(r.delta)}` : r.delta < 0 ? `▼ ${Math.abs(Math.round(r.delta))}` : "■ 0"}
              {r.percentile != null ? (
                <span className="text-slate-500"> · дээд {Math.max(1, 100 - Math.round(r.percentile))}%</span>
              ) : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
