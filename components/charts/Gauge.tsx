import { C } from "./tokens";

type Props = {
  value: number | null;
  label?: string;
  goodAt?: number;
  badBelow?: number;
};

/** Half-circle 0–100 % gauge. Colour is semantic: good ≥ goodAt, bad < badBelow, else brand. */
export function Gauge({ value, label, goodAt = 80, badBelow = 50 }: Props) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const r = 60;
  const arc = Math.PI * r;
  const color = value == null ? C.muted : v >= goodAt ? C.good : v < badBelow ? C.bad : C.brand;
  const d = `M ${70 - r} 70 A ${r} ${r} 0 0 1 ${70 + r} 70`;
  return (
    <svg
      viewBox="0 0 140 90"
      width="100%"
      style={{ maxWidth: 180 }}
      role="img"
      aria-label={`${label ?? "Хувь"}: ${value == null ? "—" : `${Math.round(v)}%`}`}
    >
      <path d={d} fill="none" stroke={C.track} strokeWidth={14} strokeLinecap="round" />
      {value == null ? null : (
        <path d={d} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${(v / 100) * arc} ${arc}`} />
      )}
      <text x={70} y={64} textAnchor="middle" fontSize={26} fontWeight={700} fill={C.ink}>
        {value == null ? "—" : `${Math.round(v)}%`}
      </text>
      {label ? (
        <text x={70} y={82} textAnchor="middle" fontSize={11} fill={C.ink2}>
          {label}
        </text>
      ) : null}
    </svg>
  );
}
