import { C } from "./tokens";

type Props = { values: (number | null)[]; width?: number; height?: number; color?: string };

/** Tiny trend line; decorative (aria-hidden) — the number beside it carries meaning. */
export function Sparkline({ values, width = 84, height = 28, color = C.brand }: Props) {
  const pts = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null);
  if (pts.length < 2) return null;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const span = max - min || 1;
  const step = (width - 6) / Math.max(1, values.length - 1);
  const xy = pts.map(
    (p) => [3 + p.i * step, 3 + (height - 6) * (1 - (p.v - min) / span)] as const
  );
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = xy[xy.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={3} fill={color} stroke={C.surface} strokeWidth={2} />
    </svg>
  );
}
