"use client";

import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type { LaunchDecisionState, LaunchDecisionValue } from "@/lib/admin/launch-candidate-data";

type Props = {
  decision: LaunchDecisionState;
  onSetDecision: (value: LaunchDecisionValue) => void;
  onReset: () => void;
};

function decisionLabel(value: LaunchDecisionValue): string {
  if (value === "launch_candidate") return "Launch candidate";
  if (value === "needs_review") return "Needs review";
  return "Not set";
}

function decisionClass(value: LaunchDecisionValue): string {
  if (value === "launch_candidate") {
    return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  }
  if (value === "needs_review") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function LaunchDecisionCard({ decision, onSetDecision, onReset }: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Go-live decision</h2>
      <p className="mt-2">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${decisionClass(decision.value)}`}
        >
          {decisionLabel(decision.value)}
        </span>
      </p>
      {decision.updatedAt && decision.value !== "not_set" ? (
        <p className="mt-2 text-xs text-slate-500">
          Updated: {formatMongoliaDateTimeWithLabel(decision.updatedAt)}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSetDecision("launch_candidate")}
          className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Mark as launch candidate
        </button>
        <button
          type="button"
          onClick={() => onSetDecision("needs_review")}
          className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
        >
          Mark as needs review
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-red-200"
        >
          Reset decision
        </button>
      </div>
    </section>
  );
}
