type PerformanceKind = "high" | "low" | "none" | "neutral";

type Props = {
  kind: PerformanceKind;
  label?: string;
};

const styles: Record<PerformanceKind, string> = {
  high: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  low: "bg-amber-50 text-amber-800 ring-amber-200",
  none: "bg-slate-100 text-slate-600 ring-slate-200",
  neutral: "bg-slate-50 text-slate-700 ring-slate-200",
};

export function PerformanceBadge({ kind, label }: Props) {
  const text =
    label ??
    (kind === "high"
      ? "High"
      : kind === "low"
        ? "Low"
        : kind === "none"
          ? "No activity"
          : "—");

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles[kind]}`}
    >
      {text}
    </span>
  );
}

export function completionPerformanceKind(
  rate: number | null,
  started: number
): PerformanceKind {
  if (started <= 0) return "none";
  if (rate == null) return "neutral";
  if (rate >= 50) return "high";
  if (rate < 30) return "low";
  return "neutral";
}

export function scorePerformanceKind(
  average: number | null,
  attempts: number
): PerformanceKind {
  if (attempts <= 0) return "none";
  if (average == null) return "neutral";
  if (average >= 70) return "high";
  if (average < 70) return "low";
  return "neutral";
}
