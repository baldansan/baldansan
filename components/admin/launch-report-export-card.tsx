"use client";

import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import { useState } from "react";
import type {
  LaunchCardState,
  LaunchCheckItem,
  LaunchDecisionState,
} from "@/lib/admin/launch-candidate-data";
import {
  buildLaunchCandidateJson,
  buildLaunchCandidateMarkdown,
  downloadLaunchReportFile,
} from "@/lib/admin/launch-candidate-report";

type Props = {
  items: LaunchCheckItem[];
  cards: LaunchCardState[];
  decision: LaunchDecisionState;
  onSave: () => void;
  onResetAll: () => void;
  savedAt: string | null;
};

export function LaunchReportExportCard({
  items,
  cards,
  decision,
  onSave,
  onResetAll,
  savedAt,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(
        buildLaunchCandidateMarkdown(items, cards, decision)
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleResetAll() {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    onResetAll();
    setResetConfirm(false);
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Save &amp; export</h2>
      <p className="mt-2 text-sm text-slate-600">
        Stored in this browser (localStorage key: buunduu-launch-candidate).
      </p>
      {savedAt ? (
        <p className="mt-2 text-xs text-slate-500">
          Last saved: {formatMongoliaDateTimeWithLabel(savedAt)}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Save checklist
        </button>
        <button
          type="button"
          onClick={handleResetAll}
          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${
            resetConfirm
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {resetConfirm ? "Confirm reset all" : "Reset checklist"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => void copyMarkdown()}
          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          {copied ? "Copied!" : "Copy Markdown report"}
        </button>
        <button
          type="button"
          onClick={() =>
            downloadLaunchReportFile(
              buildLaunchCandidateJson(items, cards, decision),
              `launch-candidate-${dateStamp()}.json`,
              "application/json"
            )
          }
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Download JSON report
        </button>
        <button
          type="button"
          onClick={() =>
            downloadLaunchReportFile(
              buildLaunchCandidateMarkdown(items, cards, decision),
              `launch-candidate-${dateStamp()}.md`,
              "text/markdown"
            )
          }
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Download Markdown report
        </button>
      </div>
    </section>
  );
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
