"use client";

import { useState } from "react";
import {
  buildActivityCsv,
  buildActivityJson,
  copyTextToClipboard,
  downloadTextFile,
} from "@/lib/admin/activity-export";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

type Props = {
  rows: AdminActivityRow[];
};

export function ActivityExportControls({ rows }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  function showMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  }

  function handleCsvDownload() {
    if (rows.length === 0) {
      showMessage("Export хийх activity байхгүй.");
      return;
    }
    downloadTextFile(
      buildActivityCsv(rows),
      "admin-activity-log.csv",
      "text/csv;charset=utf-8"
    );
    showMessage(`${rows.length} row CSV татагдлаа.`);
  }

  function handleJsonDownload() {
    if (rows.length === 0) {
      showMessage("Export хийх activity байхгүй.");
      return;
    }
    downloadTextFile(
      buildActivityJson(rows),
      "admin-activity-log.json",
      "application/json;charset=utf-8"
    );
    showMessage(`${rows.length} row JSON татагдлаа.`);
  }

  async function handleCopyJson() {
    if (rows.length === 0) {
      showMessage("Export хийх activity байхгүй.");
      return;
    }
    const copied = await copyTextToClipboard(buildActivityJson(rows));
    showMessage(
      copied
        ? `${rows.length} row JSON clipboard-д хууллаа.`
        : "Clipboard хуулалт амжилтгүй."
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900">Export activity log</h2>
      <p className="mt-1 text-xs text-slate-600">
        Current filtered view ({rows.length} row{rows.length === 1 ? "" : "s"}).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCsvDownload}
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={handleJsonDownload}
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={handleCopyJson}
          className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        >
          Copy JSON
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-xs font-medium text-emerald-800">{message}</p>
      ) : null}
    </section>
  );
}
