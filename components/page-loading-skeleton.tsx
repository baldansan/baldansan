export function PageLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4 animate-pulse" aria-hidden>
      <div className="h-10 w-2/3 rounded-xl bg-emerald-100" />
      <div className="h-4 w-full max-w-md rounded-lg bg-slate-100" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="h-5 w-1/2 rounded-lg bg-slate-100" />
          <div className="mt-4 h-3 w-full rounded bg-slate-50" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-50" />
        </div>
      ))}
    </div>
  );
}
