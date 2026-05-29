"use client";

import Link from "next/link";
import {
  LAUNCH_STATUS_CARDS,
  productionUrl,
  type LaunchCardState,
  type LaunchCheckStatus,
} from "@/lib/admin/launch-candidate-data";

type Props = {
  cards: LaunchCardState[];
  onUpdate: (id: string, status: LaunchCheckStatus) => void;
  blockerCount: number;
};

const STATUS_OPTIONS: { value: LaunchCheckStatus; label: string }[] = [
  { value: "not_checked", label: "Not checked" },
  { value: "pass", label: "Pass" },
  { value: "warning", label: "Warning" },
  { value: "fail", label: "Fail" },
];

function statusClass(status: LaunchCheckStatus): string {
  if (status === "pass") return "border-emerald-200 bg-emerald-50";
  if (status === "warning") return "border-amber-200 bg-amber-50";
  if (status === "fail") return "border-red-200 bg-red-50";
  return "border-slate-200 bg-white";
}

export function LaunchStatusCard({ cards, onUpdate, blockerCount }: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Launch status</h2>
        <span className="text-sm text-slate-600">
          Smoke test fails: <strong>{blockerCount}</strong>
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {LAUNCH_STATUS_CARDS.map((def) => {
          const card = cards.find((c) => c.id === def.id) ?? {
            id: def.id,
            status: "not_checked" as const,
            updatedAt: "",
          };
          return (
            <article
              key={def.id}
              className={`rounded-xl border p-4 ${statusClass(card.status)}`}
            >
              <p className="text-sm font-semibold text-slate-900">{def.label}</p>
              <p className="mt-1 text-xs text-slate-600">{def.description}</p>
              {def.id === "card-launch-blockers" ? (
                <p className="mt-2 text-xs font-medium text-slate-700">
                  Computed fails: {blockerCount}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={card.status}
                  onChange={(e) =>
                    onUpdate(def.id, e.target.value as LaunchCheckStatus)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium"
                  aria-label={`Status for ${def.label}`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {def.href ? (
                  <Link
                    href={def.href}
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    Open local
                  </Link>
                ) : null}
                {def.productionPath ? (
                  <a
                    href={productionUrl(def.productionPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    Production
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
