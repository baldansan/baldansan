"use client";

import type { QaCheckItem } from "@/lib/admin/production-qa-data";
import { summarizeQaStatus } from "@/lib/admin/production-qa-report";

type Props = {
  items: QaCheckItem[];
};

function recommendationClass(
  recommendation: ReturnType<typeof summarizeQaStatus>["launchRecommendation"]
): string {
  if (recommendation === "ready") {
    return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  }
  if (recommendation === "blocked") {
    return "bg-red-50 text-red-900 ring-red-200";
  }
  return "bg-amber-50 text-amber-900 ring-amber-200";
}

export function ProductionQaSummary({ items }: Props) {
  const summary = summarizeQaStatus(items);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Checklist summary</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ["pass", summary.pass, "Pass"],
            ["warning", summary.warning, "Warning"],
            ["fail", summary.fail, "Fail"],
            ["not_checked", summary.not_checked, "Not checked"],
            ["total", summary.total, "Total"],
          ] as const
        ).map(([key, value, label]) => (
          <div
            key={key}
            className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ring-1 ${recommendationClass(summary.launchRecommendation)}`}
        >
          Launch: {summary.launchRecommendation}
        </span>
      </p>
    </section>
  );
}

export function ProductionQaBlockers({ items }: Props) {
  const summary = summarizeQaStatus(items);
  const failed = summary.failedItems;
  const warnings = summary.warningItems;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Launch blockers</h2>
      {failed.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-800">
          No launch blockers found from manual checklist.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {failed.map((item) => (
            <li
              key={item.id}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100"
            >
              <span className="font-semibold">{item.label}</span>
              {item.route ? (
                <span className="ml-2 font-mono text-xs">{item.route}</span>
              ) : null}
              {item.notes ? (
                <p className="mt-1 text-xs text-red-800">{item.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 ? (
        <>
          <h3 className="mt-6 text-sm font-semibold text-amber-900">Warnings</h3>
          <ul className="mt-2 space-y-2">
            {warnings.map((item) => (
              <li
                key={item.id}
                className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100"
              >
                <span className="font-semibold">{item.label}</span>
                {item.notes ? (
                  <p className="mt-1 text-xs text-amber-800">{item.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
