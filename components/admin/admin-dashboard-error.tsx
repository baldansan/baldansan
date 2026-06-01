import Link from "next/link";
import { LocalDebugPanel } from "@/components/dev/local-debug-panel";
import { shouldShowLocalDebugDetails } from "@/lib/dev/local-debug";

type Props = {
  errorMessage: string;
  warnings?: string[];
};

export function AdminDashboardError({ errorMessage, warnings = [] }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <section className="admin-panel p-5 sm:p-6">
        <h1 className="text-xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dashboard metrics could not be loaded. Other admin pages (import, lessons,
          analytics) should still work.
        </p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </p>
        {warnings.length > 0 ? (
          <ul className="mt-3 list-inside list-disc text-sm text-slate-600">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/import/chinese"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Chinese import →
          </Link>
          <Link
            href="/admin/lessons"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Lessons →
          </Link>
          <Link
            href="/debug/local-health"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Local health →
          </Link>
        </div>
        {shouldShowLocalDebugDetails() ? (
          <LocalDebugPanel route="/admin" errorMessage={errorMessage} />
        ) : null}
      </section>
    </div>
  );
}
