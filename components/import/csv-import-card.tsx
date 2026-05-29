"use client";

import { useMemo, useState } from "react";
import {
  buildImportPreview,
  type BulkImportResult,
  type ClassroomStudentImportRow,
  type CsvImportType,
  type CsvValidationResult,
  type OrganizationMemberImportRow,
  validateClassroomStudentRows,
  validateOrganizationMemberRows,
} from "@/lib/import/csv-import";
import {
  buildCsvImportJsonReport,
  buildCsvImportMarkdownReport,
} from "@/lib/import/import-report";

type Props<T extends OrganizationMemberImportRow | ClassroomStudentImportRow> = {
  title: string;
  subtitle: string;
  importType: CsvImportType;
  expectedHeaders: string[];
  exampleCsv: string;
  helpText?: string;
  canImport: boolean;
  onImport: (validRows: T[]) => Promise<BulkImportResult>;
};

export function CsvImportCard<
  T extends OrganizationMemberImportRow | ClassroomStudentImportRow,
>({
  title,
  subtitle,
  importType,
  expectedHeaders,
  exampleCsv,
  helpText,
  canImport,
  onImport,
}: Props<T>) {
  const [csvText, setCsvText] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [validation, setValidation] = useState<
    CsvValidationResult<OrganizationMemberImportRow | ClassroomStudentImportRow> | null
  >(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => {
    if (!validation || validation.validRows.length === 0) return null;
    if (importType === "organization_members") {
      return buildImportPreview(
        validation.validRows as OrganizationMemberImportRow[],
        importType
      );
    }
    return buildImportPreview(
      validation.validRows as ClassroomStudentImportRow[],
      importType
    );
  }, [validation, importType]);

  const reportMarkdown = useMemo(
    () => (importResult ? buildCsvImportMarkdownReport(importResult) : ""),
    [importResult]
  );
  const reportJson = useMemo(
    () => (importResult ? buildCsvImportJsonReport(importResult) : ""),
    [importResult]
  );

  function handleValidate() {
    setError(null);
    setImportResult(null);
    const result =
      importType === "organization_members"
        ? validateOrganizationMemberRows(csvText)
        : validateClassroomStudentRows(csvText);
    setValidation(result);
  }

  async function handleImport() {
    if (!validation || validation.errors.length > 0 || !canImport) return;
    setImporting(true);
    setError(null);
    try {
      const rows = validation.validRows as T[];
      const result = await onImport(rows);
      setImportResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function handleClear() {
    setCsvText("");
    setValidation(null);
    setImportResult(null);
    setError(null);
  }

  async function handleCopyReport() {
    if (!reportMarkdown) return;
    await navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasErrors = (validation?.errors.length ?? 0) > 0;

  if (!canImport) {
    return (
      <p className="text-sm text-slate-600">
        You do not have permission to import for this resource.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        {helpText ? <p className="mt-2 text-xs text-slate-500">{helpText}</p> : null}
        <p className="mt-2 text-xs text-slate-500">
          Expected headers: {expectedHeaders.join(", ")}
        </p>
      </div>

      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={8}
        placeholder="Paste CSV or spreadsheet rows here…"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          {showExample ? "Example CSV нуух" : "Example CSV харах"}
        </button>
        <button
          type="button"
          onClick={handleValidate}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Validate CSV
        </button>
        <button
          type="button"
          disabled={!validation || hasErrors || importing || validation.validRows.length === 0}
          onClick={() => void handleImport()}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Clear
        </button>
      </div>

      {showExample ? (
        <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          {exampleCsv}
        </pre>
      ) : null}

      {validation ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <p>
            {validation.summary.validCount} valid · {validation.summary.errorCount} errors ·{" "}
            {validation.summary.warningCount} warnings
          </p>
        </div>
      ) : null}

      {validation && validation.errors.length > 0 ? (
        <ul className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
          {validation.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      {validation && validation.warnings.length > 0 ? (
        <ul className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {validation.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {preview ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                {preview.headers.map((h) => (
                  <th key={h} className="px-2 py-1 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.cells.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  {row.map((cell, cidx) => (
                    <td key={cidx} className="px-2 py-1 text-slate-800">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {importResult ? (
        <div className="flex flex-col gap-3 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          <p className="font-semibold">
            Import complete — inserted {importResult.inserted}, skipped{" "}
            {importResult.skipped}
            {importResult.errors.length > 0
              ? `, ${importResult.errors.length} errors`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopyReport()}
              className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold"
            >
              {copied ? "Copied!" : "Copy import report"}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  reportJson,
                  `import-report-${importResult.importedAt.slice(0, 10)}.json`,
                  "application/json"
                )
              }
              className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold"
            >
              Download JSON report
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  reportMarkdown,
                  `import-report-${importResult.importedAt.slice(0, 10)}.md`,
                  "text/markdown"
                )
              }
              className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold"
            >
              Download Markdown report
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
