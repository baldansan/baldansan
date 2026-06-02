/**
 * Validate HSK1 source audit acceptance gate.
 * Run: npx tsx scripts/hsk1-validate-source-audit.ts
 */
import fs from "node:fs";
import path from "node:path";
import type { Hsk1CoverageMatrix, Hsk1MasterSourceIndex } from "../lib/hsk1-audit/types";
import {
  formatBlockedReport,
  validateHsk1SourceAudit,
} from "../lib/hsk1-audit/validate-audit";

const ROOT = path.resolve(__dirname, "..");
const AUDIT_DIR = path.join(ROOT, "content/hsk1/source-audit");

function main() {
  const masterPath = path.join(AUDIT_DIR, "hsk1-master-source-index.json");
  if (!fs.existsSync(masterPath)) {
    console.error("Missing hsk1-master-source-index.json — run hsk1:audit:generate first.");
    process.exit(1);
  }

  const masterIndex = JSON.parse(
    fs.readFileSync(masterPath, "utf8")
  ) as Hsk1MasterSourceIndex;

  const matrices: Hsk1CoverageMatrix[] = [];
  for (const lesson of masterIndex.lessons) {
    const matrixPath = path.join(ROOT, lesson.coverageMatrixPath);
    matrices.push(JSON.parse(fs.readFileSync(matrixPath, "utf8")) as Hsk1CoverageMatrix);
  }

  const result = validateHsk1SourceAudit({ masterIndex, matrices });
  const report = formatBlockedReport(result);

  fs.writeFileSync(
    path.join(AUDIT_DIR, "missing-blocked-items-report.md"),
    report,
    "utf8"
  );

  console.log(report);
  process.exit(result.packagingBlocked ? 1 : 0);
}

main();
