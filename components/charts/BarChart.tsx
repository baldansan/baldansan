import { C } from "./tokens";

export type BarDatum = { label: string; value: number | null; sub?: string };

type Props = {
  data: BarDatum[];
  orientation?: "horizontal" | "vertical";
  /** Upper bound of the scale; defaults to 100 for "%" else the data max. */
  max?: number;
  unit?: string;
  /** Colour best dark green and worst red; the rest stay soft brand. */
  highlight?: boolean;
  /** true = larger is better (default). */
  higherIsBetter?: boolean;
  ariaLabel: string;
};

function fills(data: BarDatum[], highlight: boolean, higher: boolean): string[] {
  const vals = data.map((d) => d.value).filter((v): v is number => v != null);
  const best = vals.length > 1 ? (higher ? Math.max(...vals) : Math.min(...vals)) : null;
  const worst = vals.length > 1 ? (higher ? Math.min(...vals) : Math.max(...vals)) : null;
  return data.map((d) =>
    !highlight || d.value == null || best === worst
      ? C.brand
      : d.value === best
        ? C.good
        : d.value === worst
          ? C.bad
          : "#6ee7b7"
  );
}

/** Horizontal (ranked list) or vertical bars with value labels. */
export function BarChart({
  data,
  orientation = "horizontal",
  max,
  unit = "",
  highlight = false,
  higherIsBetter = true,
  ariaLabel,
}: Props) {
  if (data.length === 0) return <p className="text-sm text-slate-500">Өгөгдөл алга.</p>;
  const top = max ?? Math.max(unit === "%" ? 100 : 1, ...data.map((d) => d.value ?? 0));
  const fill = fills(data, highlight, higherIsBetter);
  const fmt = (v: number | null) => (v == null ? "—" : `${Math.round(v * 10) / 10}${unit}`);

  if (orientation === "horizontal") {
    const row = 30;
    const labelW = 150;
    const W = 560;
    const H = data.length * row + 4;
    const plot = W - labelW - 64;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel} className="block">
        {data.map((d, i) => {
          const y = i * row + 4;
          const w = d.value == null ? 0 : Math.max(3, (d.value / top) * plot);
          return (
            <g key={`${d.label}-${i}`}>
              <title>{`${d.label}: ${fmt(d.value)}${d.sub ? ` · ${d.sub}` : ""}`}</title>
              <text x={labelW - 8} y={y + 14} textAnchor="end" fontSize={12} fill={C.ink2}>
                {d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label}
              </text>
              <rect x={labelW} y={y + 3} width={plot} height={14} rx={4} fill={C.track} />
              {d.value != null ? <rect x={labelW} y={y + 3} width={w} height={14} rx={4} fill={fill[i]} /> : null}
              <text x={labelW + plot + 8} y={y + 15} fontSize={12} fontWeight={600} fill={C.ink}>
                {fmt(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const W = Math.max(320, data.length * 56);
  const H = 200;
  const base = H - 34;
  const slot = W / data.length;
  const bw = Math.min(28, slot * 0.55);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel} className="block">
      <line x1={0} x2={W} y1={base} y2={base} stroke={C.grid} />
      {data.map((d, i) => {
        const h = d.value == null ? 0 : Math.max(3, (d.value / top) * (base - 24));
        const x = i * slot + (slot - bw) / 2;
        return (
          <g key={`${d.label}-${i}`}>
            <title>{`${d.label}: ${fmt(d.value)}`}</title>
            <rect x={x} y={base - h} width={bw} height={h} rx={4} fill={fill[i]} />
            <text x={x + bw / 2} y={base - h - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={C.ink}>
              {fmt(d.value)}
            </text>
            <text x={x + bw / 2} y={base + 16} textAnchor="middle" fontSize={11} fill={C.ink2}>
              {d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
