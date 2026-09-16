"use client";

import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import { useState } from "react";
import type { QaCheckItem } from "@/lib/admin/production-qa-data";
import {
  buildProductionQaJson,
  buildProductionQaMarkdown,
  downloadTextFile,
} from "@/lib/admin/production-qa-report";

type Props = {
  items: QaCheckItem[];
  onSave: () => void;
  onReset: () => void;
  savedAt: string | null;
};

export function ProductionQaExportCard({
  items,
  onSave,
  onReset,
  savedAt,
}: Props) {
  const [copied, setCopied] = useState<"json" | "markdown" | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  async function copyReport(format: "json" | "markdown") {
    const text =
      format === "json"
        ? buildProductionQaJson(items)
        : buildProductionQaMarkdown(items);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(format);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  function downloadJson() {
    downloadTextFile(
      buildProductionQaJson(items),
      `production-qa-${dateStamp()}.json`,
      "application/json"
    );
  }

  function downloadMarkdown() {
    downloadTextFile(
      buildProductionQaMarkdown(items),
      `production-qa-${dateStamp()}.md`,
      "text/markdown"
    );
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
      <h2 className="text-lg font-semibold text-slate-900">
        Хадгалах ба гаргах
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Шалгалтын төлөв энэ хөтөч дээр хадгалагдана (localStorage). Байршуулалт
        бүрийн дараа тайлангаа гаргаж авна уу.
      </p>
      {savedAt ? (
        <p className="mt-2 text-xs text-slate-500">
          Сүүлд хадгалсан: {formatMongoliaDateTimeWithLabel(savedAt)}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Жагсаалтыг хадгалах
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${
            resetConfirm
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-slate-200 bg-white text-slate-700 hover:border-red-200"
          }`}
        >
          {resetConfirm ? "Цэвэрлэхийг баталгаажуулах" : "Жагсаалтыг цэвэрлэх"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => void copyReport("json")}
          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          {copied === "json" ? "Хуулагдлаа!" : "Тайланг хуулах (JSON)"}
        </button>
        <button
          type="button"
          onClick={() => void copyReport("markdown")}
          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          {copied === "markdown" ? "Хуулагдлаа!" : "Markdown тайланг хуулах"}
        </button>
        <button
          type="button"
          onClick={downloadJson}
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          JSON тайлан татах
        </button>
        <button
          type="button"
          onClick={downloadMarkdown}
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Markdown тайлан татах
        </button>
      </div>
    </section>
  );
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
