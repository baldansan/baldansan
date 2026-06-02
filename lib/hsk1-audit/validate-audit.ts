import type {
  Hsk1CoverageMatrix,
  Hsk1MasterSourceIndex,
} from "@/lib/hsk1-audit/types";

export type Hsk1AuditValidationResult = {
  ok: boolean;
  packagingBlocked: boolean;
  blockReason: string | null;
  missingRows: Array<{
    lessonId: string;
    rowId: string;
    sourceSection: string;
    status: string;
  }>;
  lessonsBlocked: string[];
  summary: {
    lessonsTotal: number;
    lessonsPackagingAllowed: number;
    totalRequiredRows: number;
    requiredPass: number;
    requiredNeedsReview: number;
    requiredFail: number;
  };
};

export function validateCoverageMatrix(matrix: Hsk1CoverageMatrix): {
  packagingAllowed: boolean;
  missingRequired: Hsk1AuditValidationResult["missingRows"];
} {
  const missingRequired = matrix.rows
    .filter((r) => r.requiredInPackage && r.status !== "PASS")
    .map((r) => ({
      lessonId: matrix.lessonId,
      rowId: r.id,
      sourceSection: r.sourceSection,
      status: r.status,
    }));

  return {
    packagingAllowed:
      missingRequired.length === 0 &&
      matrix.rows.every((r) => !r.requiredInPackage || r.status === "PASS"),
    missingRequired,
  };
}

export function validateHsk1SourceAudit(input: {
  masterIndex: Hsk1MasterSourceIndex;
  matrices: Hsk1CoverageMatrix[];
}): Hsk1AuditValidationResult {
  const missingRows: Hsk1AuditValidationResult["missingRows"] = [];
  const lessonsBlocked: string[] = [];

  let requiredPass = 0;
  let requiredNeedsReview = 0;
  let requiredFail = 0;
  let totalRequiredRows = 0;
  let lessonsPackagingAllowed = 0;

  for (const matrix of input.matrices) {
    const { packagingAllowed, missingRequired } = validateCoverageMatrix(matrix);
    if (!packagingAllowed) {
      lessonsBlocked.push(matrix.lessonId);
    } else {
      lessonsPackagingAllowed += 1;
    }
    missingRows.push(...missingRequired);

    for (const row of matrix.rows) {
      if (!row.requiredInPackage) continue;
      totalRequiredRows += 1;
      if (row.status === "PASS") requiredPass += 1;
      else if (row.status === "NEEDS_REVIEW") requiredNeedsReview += 1;
      else requiredFail += 1;
    }
  }

  const gate = input.masterIndex.acceptanceGate;
  const coverageBlocked =
    gate.textbookCoveragePercent < 100 ||
    gate.teacherBookCoveragePercent < 100 ||
    gate.workbookCoveragePercent < 100 ||
    gate.workbookAnswerCoveragePercent < 100 ||
    gate.audioCoveragePercent < 100 ||
    gate.vocabularyCoveragePercent < 100 ||
    gate.characterCoveragePercent < 100 ||
    !gate.learnerFlowReviewed ||
    !gate.gameLogicReviewed ||
    !gate.buildPasses;

  const packagingBlocked =
    coverageBlocked ||
    lessonsPackagingAllowed < input.matrices.length ||
    missingRows.length > 0;

  const blockReason = packagingBlocked
    ? gate.blockReason ??
      `BLOCKED: missing source coverage — ${missingRows.length} required rows not PASS across ${lessonsBlocked.length} lessons.`
    : null;

  return {
    ok: !packagingBlocked,
    packagingBlocked,
    blockReason,
    missingRows,
    lessonsBlocked,
    summary: {
      lessonsTotal: input.matrices.length,
      lessonsPackagingAllowed,
      totalRequiredRows,
      requiredPass,
      requiredNeedsReview,
      requiredFail,
    },
  };
}

export function formatBlockedReport(result: Hsk1AuditValidationResult): string {
  const lines: string[] = [
    "# HSK1 Source Audit — Packaging Gate",
    "",
    result.packagingBlocked ? "## BLOCKED" : "## READY",
    "",
    result.blockReason ?? "All acceptance criteria met.",
    "",
    "## Summary",
    `- Lessons: ${result.summary.lessonsPackagingAllowed}/${result.summary.lessonsTotal} packaging allowed`,
    `- Required rows PASS: ${result.summary.requiredPass}/${result.summary.totalRequiredRows}`,
    `- NEEDS_REVIEW: ${result.summary.requiredNeedsReview}`,
    `- FAIL: ${result.summary.requiredFail}`,
    "",
  ];

  if (result.missingRows.length > 0) {
    lines.push("## Missing / pending required rows (first 50)");
    for (const row of result.missingRows.slice(0, 50)) {
      lines.push(
        `- ${row.lessonId} · ${row.rowId} · ${row.sourceSection} · ${row.status}`
      );
    }
    if (result.missingRows.length > 50) {
      lines.push(`- … and ${result.missingRows.length - 50} more`);
    }
  }

  return lines.join("\n");
}
