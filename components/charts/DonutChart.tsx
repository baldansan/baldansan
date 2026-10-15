import { C, OTHER, seriesColor } from "./tokens";

export type DonutSlice = { label: string; value: number };

type Props = { slices: DonutSlice[]; centerValue?: string; centerLabel?: string; ariaLabel: string };

/** Share-of-total donut with legend. First 4 slices get fixed hues, the rest fold into gray. */
export function DonutChart({ slices, centerValue, centerLabel, ariaLabel }: Props) {
  const clean = slices.filter((s) => s.value > 0);
  const total = clean.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <p className="text-sm text-slate-500">Өгөгдөл алга.</p>;
  const r = 52;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 140 140" width={140} height={140} role="img" aria-label={ariaLabel} className="shrink-0">
        <g transform="rotate(-90 70 70)">
          {clean.map((s, i) => {
            const len = (s.value / total) * circ;
            const dash = Math.max(0, len - 2);
            const el = (
              <circle
                key={s.label}
                cx={70}
                cy={70}
                r={r}
                fill="none"
                stroke={i < 4 ? seriesColor(i) : OTHER}
                strokeWidth={18}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-acc}
              >
                <title>{`${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`}</title>
              </circle>
            );
            acc += len;
            return el;
          })}
        </g>
        <text x={70} y={centerLabel ? 70 : 76} textAnchor="middle" fontSize={22} fontWeight={700} fill={C.ink}>
          {centerValue ?? total}
        </text>
        {centerLabel ? (
          <text x={70} y={88} textAnchor="middle" fontSize={11} fill={C.ink2}>
            {centerLabel}
          </text>
        ) : null}
      </svg>
      <ul className="m-0 flex min-w-40 flex-1 list-none flex-col gap-1.5 p-0 text-sm">
        {clean.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: i < 4 ? seriesColor(i) : OTHER }} />
            <span className="flex-1 text-slate-700">{s.label}</span>
            <span className="font-semibold tabular-nums text-slate-900">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
