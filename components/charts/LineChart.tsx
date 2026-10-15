import { C, seriesColor } from "./tokens";

export type LineSeries = { name: string; values: (number | null)[] };

type Props = {
  labels: string[];
  series: LineSeries[];
  unit?: string;
  ariaLabel: string;
  height?: number;
};

/** Multi-series line chart (max 4 series). One axis only; legend shown for ≥2 series. */
export function LineChart({ labels, series, unit = "", ariaLabel, height = 190 }: Props) {
  const n = labels.length;
  const all = series.flatMap((s) => s.values).filter((v): v is number => v != null);
  if (n < 2 || all.length === 0) return <p className="text-sm text-slate-500">Өгөгдөл алга.</p>;
  const W = 600;
  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 26;
  const max = Math.max(1, ...all);
  const x = (i: number) => padL + (i * (W - padL - padR)) / (n - 1);
  const y = (v: number) => padT + (height - padT - padB) * (1 - v / max);
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  const every = Math.ceil(n / 6);
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={ariaLabel} className="block">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={C.grid} />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={C.muted}>
              {t}
              {unit}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % every === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill={C.muted}>
              {l}
            </text>
          ) : null
        )}
        {series.slice(0, 4).map((s, si) => {
          const color = seriesColor(si);
          const segs: string[] = [];
          let open = false;
          s.values.forEach((v, i) => {
            if (v == null) {
              open = false;
              return;
            }
            segs.push(`${open ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`);
            open = true;
          });
          const lastIdx = s.values.reduce((acc: number, v, i) => (v != null ? i : acc), -1);
          return (
            <g key={s.name}>
              <path d={segs.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) =>
                v == null ? null : (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(v)}
                    r={i === lastIdx ? 4 : 7}
                    fill={i === lastIdx ? color : "transparent"}
                    stroke={i === lastIdx ? C.surface : "none"}
                    strokeWidth={2}
                  >
                    <title>{`${s.name} · ${labels[i]}: ${Math.round(v * 10) / 10}${unit}`}</title>
                  </circle>
                )
              )}
            </g>
          );
        })}
      </svg>
      {series.length > 1 ? (
        <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {series.slice(0, 4).map((s, i) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: seriesColor(i) }} />
              {s.name}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}
