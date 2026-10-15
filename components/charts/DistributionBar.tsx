import { C } from "./tokens";

export type DistSegment = { label: string; value: number; color: string };

type Props = { segments: DistSegment[]; height?: number; showLegend?: boolean; ariaLabel: string };

/** 100 % stacked bar with 2px gaps. Zero-sized segments are skipped. */
export function DistributionBar({ segments, height = 12, showLegend = false, ariaLabel }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <div className="rounded-full" style={{ height, background: C.track }} role="img" aria-label={`${ariaLabel}: өгөгдөл алга`} />
    );
  }
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div>
      <div
        className="flex w-full overflow-hidden rounded-full"
        style={{ height, gap: 2 }}
        role="img"
        aria-label={`${ariaLabel}: ${shown.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ")}`}
      >
        {shown.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
          />
        ))}
      </div>
      {showLegend ? (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-slate-600">
          {segments.map((s) => (
            <li key={s.label} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label} <b className="tabular-nums text-slate-900">{Math.round((s.value / total) * 100)}%</b>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
