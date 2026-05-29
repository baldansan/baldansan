type Props = {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "emerald" | "slate" | "amber";
};

const accentClasses = {
  emerald: "text-emerald-700",
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
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accentClasses[accent]}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
