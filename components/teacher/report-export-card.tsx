"use client";

import { useState } from "react";

type Props = {
  markdown: string;
  filename: string;
  label?: string;
};

export function ReportExportCard({
  markdown,
  filename,
  label = "Copy report",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        {copied ? "Copied!" : label}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
      >
        Download markdown
      </button>
    </div>
  );
}
