type Props = {
  title: string;
  data: Record<string, unknown> | null;
  emptyLabel?: string;
};

export function JsonSnapshotViewer({
  title,
  data,
  emptyLabel = "Snapshot not captured for this action.",
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {!data || Object.keys(data).length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <details className="mt-3" open>
          <summary className="cursor-pointer text-xs font-medium text-emerald-700">
            View JSON
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </section>
  );
}
