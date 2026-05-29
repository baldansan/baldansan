type Props = {
  label: string;
  value: number | string;
  hint?: string;
};

export function AnalyticsMetricCard({ label, value, hint }: Props) {
  return (
    <div className="admin-metric">
      <p className="admin-metric-label">{label}</p>
      <p className="admin-metric-value">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
