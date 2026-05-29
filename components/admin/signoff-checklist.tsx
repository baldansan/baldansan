"use client";

import {
  productionUrl,
  type SignoffCheckItem,
  type SignoffCheckStatus,
  type SignoffDecisionValue,
} from "@/lib/admin/launch-signoff-data";

type Props = {
  items: SignoffCheckItem[];
  onUpdate: (
    id: string,
    patch: Partial<Pick<SignoffCheckItem, "status" | "notes">>
  ) => void;
};

const STATUS_OPTIONS: { value: SignoffCheckStatus; label: string }[] = [
  { value: "not_checked", label: "Not checked" },
  { value: "pass", label: "Pass" },
  { value: "warning", label: "Warning" },
  { value: "fail", label: "Fail" },
];

function statusSelectClass(status: SignoffCheckStatus): string {
  if (status === "pass") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "fail") return "border-red-200 bg-red-50 text-red-900";
  return "border-slate-200 bg-white text-slate-700";
}

export function SignoffChecklist({ items, onUpdate }: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Final sign-off checklist
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              {item.productionPath ? (
                <a
                  href={productionUrl(item.productionPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-semibold text-emerald-800 hover:underline"
                >
                  Open on production
                </a>
              ) : null}
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={item.status}
                onChange={(e) =>
                  onUpdate(item.id, {
                    status: e.target.value as SignoffCheckStatus,
                  })
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${statusSelectClass(item.status)}`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <textarea
                value={item.notes}
                onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
                placeholder="Notes (optional)"
                rows={2}
                className="min-h-[2.5rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

type BlockersProps = {
  items: SignoffCheckItem[];
  decision: SignoffDecisionValue;
};

export function SignoffBlockersList({ items, decision }: BlockersProps) {
  const failed = items.filter((i) => i.status === "fail");
  const warnings = items.filter((i) => i.status === "warning");
  const blockedByDecision = decision === "blocked";

  if (
    failed.length === 0 &&
    !blockedByDecision &&
    decision === "go_live"
  ) {
    return (
      <section className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 sm:p-6">
        <h2 className="text-lg font-semibold text-emerald-900">Launch blockers</h2>
        <p className="mt-3 text-sm text-emerald-800">
          Launch sign-off complete. Production is ready for controlled launch.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Launch blockers</h2>
      {blockedByDecision ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100">
          Decision is <strong>blocked</strong> — resolve issues before go-live.
        </p>
      ) : null}
      {failed.length === 0 && !blockedByDecision ? (
        <p className="mt-3 text-sm text-emerald-800">
          No failed checklist items. Review decision and warnings before go-live.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {failed.map((item) => (
            <li
              key={item.id}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100"
            >
              {item.label}
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
                {item.label}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
