"use client";

import { useState } from "react";
import type { LaunchSignoffState } from "@/lib/admin/launch-signoff-data";
import {
  buildLaunchSignoffJson,
  buildLaunchSignoffMarkdown,
  downloadSignoffReportFile,
} from "@/lib/admin/launch-signoff-report";

type Props = {
  state: LaunchSignoffState;
  onSave: () => void;
  onReset: () => void;
  savedAt: string | null;
};

export function SignoffReportExportCard({
  state,
  onSave,
  onReset,
  savedAt,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(buildLaunchSignoffMarkdown(state));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleReset() {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    onReset();
    setResetConfirm(false);
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Save &amp; export</h2>
      <p className="mt-2 text-sm text-slate-600">
        Stored in this browser (localStorage key: buunduu-launch-signoff).
      </p>
      {savedAt ? (
        <p className="mt-2 text-xs text-slate-500">
          Last saved: {new Date(savedAt).toLocaleString()}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Save sign-off
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${
            resetConfirm
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {resetConfirm ? "Confirm reset sign-off" : "Reset sign-off"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => void copyMarkdown()}
          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          {copied ? "Copied!" : "Copy sign-off report"}
        </button>
        <button
          type="button"
          onClick={() =>
            downloadSignoffReportFile(
              buildLaunchSignoffJson(state),
              `launch-signoff-${dateStamp()}.json`,
              "application/json"
            )
          }
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={() =>
            downloadSignoffReportFile(
              buildLaunchSignoffMarkdown(state),
              `launch-signoff-${dateStamp()}.md`,
              "text/markdown"
            )
          }
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Download Markdown
        </button>
      </div>
    </section>
  );
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
