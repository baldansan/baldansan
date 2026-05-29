type Props = {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "emerald" | "slate" | "amber";
};

const accentClasses = {
  emerald: "text-emerald-600",
  slate: "text-slate-900",
  amber: "text-amber-700",
};

export function AdminMetricCard({
  label,
  value,
  hint,
  accent = "emerald",
}: Props) {
  return (
    <div className="admin-metric">
      <p className="admin-metric-label">{label}</p>
      <p className={`admin-metric-value ${accentClasses[accent]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
