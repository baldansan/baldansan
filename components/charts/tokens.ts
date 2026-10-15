/**
 * Chart palette. One brand accent (emerald), neutral slates, and semantic
 * good/bad used ONLY to say good or bad. Categorical order is fixed and was
 * checked with the dataviz validator (the gray slot is "Бусад" / other).
 */
export const C = {
  brand: "#059669",
  brandDark: "#047857",
  brandSoft: "#d1fae5",
  ink: "#0f172a",
  ink2: "#475569",
  muted: "#94a3b8",
  grid: "#e2e8f0",
  track: "#f1f5f9",
  surface: "#ffffff",
  good: "#047857",
  bad: "#dc2626",
  warn: "#d97706",
  gold: "#d4a017",
  silver: "#94a3b8",
  bronze: "#b4713a",
} as const;

/** Fixed categorical order — never cycled. */
export const CATEGORICAL = ["#059669", "#0369a1", "#7c3aed", "#d97706"] as const;
export const OTHER = "#94a3b8";

export function seriesColor(index: number): string {
  return CATEGORICAL[index] ?? OTHER;
}

export function fmtNum(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function fmtPct(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : `${Math.round(value)}%`;
}

/** One-hue light→dark ramp for magnitude (t in 0..1). */
export function ramp(t: number): string {
  const a = [236, 253, 245];
  const b = [4, 120, 87];
  const k = Math.max(0, Math.min(1, t));
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export type Tone = "good" | "bad" | "neutral";

export function toneColor(tone: Tone): string {
  return tone === "good" ? C.good : tone === "bad" ? C.bad : C.ink2;
}
