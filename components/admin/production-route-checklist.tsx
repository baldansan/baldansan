"use client";

import {
  QA_SECTION_LABELS,
  productionUrl,
  type QaCheckItem,
  type QaCheckSectionId,
  type QaCheckStatus,
} from "@/lib/admin/production-qa-data";
import { isValidQaStatus } from "@/lib/admin/production-qa-storage";

type Props = {
  section: QaCheckSectionId;
  items: QaCheckItem[];
  onUpdate: (
    id: string,
    patch: Partial<Pick<QaCheckItem, "status" | "notes">>
  ) => void;
};

const STATUS_OPTIONS: { value: QaCheckStatus; label: string }[] = [
  { value: "not_checked", label: "Not checked" },
  { value: "pass", label: "Pass" },
  { value: "warning", label: "Warning" },
  { value: "fail", label: "Fail" },
];

function statusSelectClass(status: QaCheckStatus): string {
  if (status === "pass") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "fail") return "border-red-200 bg-red-50 text-red-900";
  return "border-slate-200 bg-white text-slate-700";
}

export function ProductionRouteChecklist({ section, items, onUpdate }: Props) {
  const sectionItems = items.filter((item) => item.section === section);

  if (sectionItems.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        {QA_SECTION_LABELS[section]}
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        {sectionItems.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {item.label}
                  {item.route ? (
                    <span className="ml-2 font-mono text-xs font-normal text-slate-500">
                      {item.route}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-slate-600">{item.purpose}</p>
                <p className="mt-1 text-xs text-emerald-800">
                  Expected: {item.expected}
                </p>
              </div>
              {item.productionPath ? (
                <a
                  href={productionUrl(item.productionPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  Open on production
                </a>
              ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor={`qa-status-${item.id}`}>
                Status for {item.label}
              </label>
              <select
                id={`qa-status-${item.id}`}
                value={item.status}
                onChange={(event) => {
                  const value = event.target.value;
                  if (isValidQaStatus(value)) {
                    onUpdate(item.id, { status: value });
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${statusSelectClass(item.status)}`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <textarea
                value={item.notes}
                onChange={(event) =>
                  onUpdate(item.id, { notes: event.target.value })
                }
                placeholder="Notes (optional)"
                rows={2}
                className="min-h-[2.5rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
