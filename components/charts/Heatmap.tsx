import { C, ramp } from "./tokens";

type Props = {
  rowLabels: string[];
  colLabels: string[];
  /** values[row][col]; null = no data (gray). */
  values: (number | null)[][];
  unit?: string;
  ariaLabel: string;
};

/** Rows × columns grid; one-hue light→dark ramp, scale legend underneath. */
export function Heatmap({ rowLabels, colLabels, values, unit = "", ariaLabel }: Props) {
  if (rowLabels.length === 0 || colLabels.length === 0) {
    return <p className="text-sm text-slate-500">Өгөгдөл алга.</p>;
  }
  const max = Math.max(1, ...values.flat().filter((v): v is number => v != null));
  const labelW = 130;
  const cell = 44;
  const gap = 3;
  const rowH = 26;
  const W = labelW + colLabels.length * (cell + gap);
  const H = 22 + rowLabels.length * (rowH + gap);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: Math.min(W, 420) }} role="img" aria-label={ariaLabel} className="block">
        {colLabels.map((c, j) => (
          <text key={`${c}-${j}`} x={labelW + j * (cell + gap) + cell / 2} y={12} textAnchor="middle" fontSize={11} fill={C.muted}>
            {c}
          </text>
        ))}
        {rowLabels.map((r, i) => (
          <g key={`${r}-${i}`}>
            <text x={labelW - 8} y={22 + i * (rowH + gap) + 17} textAnchor="end" fontSize={12} fill={C.ink2}>
              {r.length > 18 ? `${r.slice(0, 17)}…` : r}
            </text>
            {colLabels.map((c, j) => {
              const v = values[i]?.[j] ?? null;
              const t = v == null ? 0 : v / max;
              const cx = labelW + j * (cell + gap);
              const cy = 22 + i * (rowH + gap);
              return (
                <g key={`${c}-${j}`}>
                  <title>{`${r} · ${c}: ${v == null ? "өгөгдөл алга" : `${Math.round(v * 10) / 10}${unit}`}`}</title>
                  <rect x={cx} y={cy} width={cell} height={rowH} rx={5} fill={v == null ? C.track : ramp(0.08 + t * 0.92)} />
                  {v != null ? (
                    <text x={cx + cell / 2} y={cy + 17} textAnchor="middle" fontSize={11} fontWeight={600} fill={t > 0.55 ? "#fff" : C.ink}>
                      {Math.round(v)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <span>бага</span>
        <span className="inline-block h-2 w-24 rounded" style={{ background: `linear-gradient(90deg, ${ramp(0.08)}, ${ramp(1)})` }} />
        <span>их</span>
      </p>
    </div>
  );
}
