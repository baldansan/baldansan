import type { BulkImportResult } from "@/lib/import/csv-import";

export function buildCsvImportMarkdownReport(result: BulkImportResult): string {
  const lines = [
    `# CSV import report`,
    ``,
    `- Type: ${result.type}`,
    `- Imported at: ${result.importedAt}`,
    `- Inserted: ${result.inserted}`,
    `- Skipped: ${result.skipped}`,
    `- Errors: ${result.errors.length}`,
    `- Warnings: ${result.warnings.length}`,
    `- Duplicate rows: ${result.duplicates.length}`,
    ``,
  ];

  if (result.warnings.length > 0) {
    lines.push(`## Warnings`, ...result.warnings.map((w) => `- ${w}`), ``);
  }
  if (result.errors.length > 0) {
    lines.push(`## Errors`, ...result.errors.map((e) => `- ${e}`), ``);
  }
  if (result.duplicates.length > 0) {
    lines.push(`## Duplicates`, ...result.duplicates.map((d) => `- ${d}`), ``);
  }
  if (result.rows.length > 0) {
    lines.push(`## Row results`, `| Row | Status | Detail |`, `| --- | --- | --- |`);
    for (const row of result.rows) {
      const detail = row.message ?? row.email ?? row.displayName ?? "—";
      lines.push(`| ${row.rowIndex} | ${row.status} | ${detail} |`);
    }
  }

  return lines.join("\n");
}

export function buildCsvImportJsonReport(result: BulkImportResult): string {
  return JSON.stringify(result, null, 2);
}
