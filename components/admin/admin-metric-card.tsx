type Trend = {
  /** Percent change against the previous window; null when it can't be computed. */
  percent: number | null;
  label: string;
};

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  icon?: string;
  accent?: "emerald" | "slate" | "amber";
  trend?: Trend;
};

const accentClasses = {
  emerald: "text-emerald-600",
  slate: "text-slate-900",
  amber: "text-amber-700",
};

function TrendPill({ percent, label }: Trend) {
  if (percent === null) {
    return <p className="mt-2 text-xs text-slate-500">{label}</p>;
  }

  const rounded = Math.round(percent * 10) / 10;
  const direction = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const tone =
    direction === "up"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : direction === "down"
        ? "bg-red-50 text-red-700 ring-red-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "—";

  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ${tone}`}
      >
        <span aria-hidden>{arrow}</span>
        {Math.abs(rounded)}%
      </span>
      {label}
    </p>
  );
}

export function AdminMetricCard({
  label,
  value,
  hint,
  icon,
  accent = "emerald",
  trend,
}: Props) {
  return (
    <div className="admin-metric">
      <div className="flex items-start justify-between gap-2">
        <p className="admin-metric-label">{label}</p>
        {icon ? (
          <span aria-hidden className="text-base text-slate-400">
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`admin-metric-value ${accentClasses[accent]}`}>{value}</p>
      {trend ? <TrendPill {...trend} /> : null}
      {hint && !trend ? (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
