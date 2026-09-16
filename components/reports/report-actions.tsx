"use client";

import { useState } from "react";

/**
 * Print / copy / download bar for a printable report.
 *
 * Same shape as `components/teacher/report-export-card.tsx` — clipboard write
 * with a blob download beside it — with the labels in Mongolian and a print
 * button, and marked `data-print-hide` so it never reaches the paper.
 */

type Props = {
  markdown: string;
  filename: string;
  copyLabel?: string;
};

export function ReportActions({
  markdown,
  filename,
  copyLabel = "Markdown хуулах",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-print-hide className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Хэвлэх (A4)
        </button>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          {copied ? "Хуулагдлаа" : copyLabel}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Markdown татаж авах
        </button>
      </div>
      {copyFailed ? (
        <p className="text-xs text-amber-800">
          Хуулж чадсангүй — хөтөч зөвшөөрөөгүй байна. «Markdown татаж авах»
          товчийг ашиглана уу.
        </p>
      ) : null}
    </div>
  );
}
