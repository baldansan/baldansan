import {
  PRODUCTION_URL,
  QA_SECTION_LABELS,
  type QaCheckItem,
  type QaCheckSectionId,
  type QaCheckStatus,
} from "@/lib/admin/production-qa-data";

export type LaunchRecommendation = "ready" | "needs review" | "blocked";

export type QaStatusSummary = {
  total: number;
  pass: number;
  warning: number;
  fail: number;
  not_checked: number;
  failedItems: QaCheckItem[];
  warningItems: QaCheckItem[];
  launchRecommendation: LaunchRecommendation;
};

export type ProductionQaReport = {
  productionUrl: string;
  generatedAt: string;
  summary: QaStatusSummary;
  items: Array<{
    id: string;
    section: QaCheckSectionId;
    sectionLabel: string;
    label: string;
    route?: string;
    status: QaCheckStatus;
    notes: string;
    updatedAt: string;
  }>;
  launchRecommendation: LaunchRecommendation;
  launchRecommendationReason: string;
};

function countByStatus(items: QaCheckItem[], status: QaCheckStatus): number {
  return items.filter((item) => item.status === status).length;
}

export function summarizeQaStatus(items: QaCheckItem[]): QaStatusSummary {
  const failedItems = items.filter((item) => item.status === "fail");
  const warningItems = items.filter(
    (item) => item.status === "warning" || item.status === "not_checked"
  );

  let launchRecommendation: LaunchRecommendation = "ready";
  if (failedItems.length > 0) {
    launchRecommendation = "blocked";
  } else if (
    warningItems.some((item) => item.status === "warning") ||
    items.some((item) => item.status === "not_checked")
  ) {
    launchRecommendation = "needs review";
  }

  return {
    total: items.length,
    pass: countByStatus(items, "pass"),
    warning: countByStatus(items, "warning"),
    fail: countByStatus(items, "fail"),
    not_checked: countByStatus(items, "not_checked"),
    failedItems,
    warningItems: items.filter((item) => item.status === "warning"),
    launchRecommendation,
  };
}

function recommendationReason(summary: QaStatusSummary): string {
  if (summary.launchRecommendation === "blocked") {
    return `${summary.fail} failed check(s) must be resolved before launch.`;
  }
  if (summary.launchRecommendation === "needs review") {
    const parts: string[] = [];
    if (summary.warning > 0) {
      parts.push(`${summary.warning} warning(s)`);
    }
    if (summary.not_checked > 0) {
      parts.push(`${summary.not_checked} not checked`);
    }
    return `Review remaining items: ${parts.join(", ")}.`;
  }
  return "All checklist items passed.";
}

export function buildProductionQaReport(items: QaCheckItem[]): ProductionQaReport {
  const summary = summarizeQaStatus(items);
  const generatedAt = new Date().toISOString();

  return {
    productionUrl: PRODUCTION_URL,
    generatedAt,
    summary,
    items: items.map((item) => ({
      id: item.id,
      section: item.section,
      sectionLabel: QA_SECTION_LABELS[item.section],
      label: item.label,
      route: item.route,
      status: item.status,
      notes: item.notes,
      updatedAt: item.updatedAt,
    })),
    launchRecommendation: summary.launchRecommendation,
    launchRecommendationReason: recommendationReason(summary),
  };
}

export function buildProductionQaMarkdown(items: QaCheckItem[]): string {
  const report = buildProductionQaReport(items);
  const lines: string[] = [
    "# Buunduu Surtsgaay — Production QA Report",
    "",
    `- **Production URL:** ${report.productionUrl}`,
    `- **Generated:** ${report.generatedAt}`,
    `- **Launch recommendation:** ${report.launchRecommendation}`,
    `- **Reason:** ${report.launchRecommendationReason}`,
    "",
    "## Summary",
    "",
    `| Status | Count |`,
    `|--------|-------|`,
    `| Pass | ${report.summary.pass} |`,
    `| Warning | ${report.summary.warning} |`,
    `| Fail | ${report.summary.fail} |`,
    `| Not checked | ${report.summary.not_checked} |`,
    `| **Total** | **${report.summary.total}** |`,
    "",
  ];

  if (report.summary.failedItems.length > 0) {
    lines.push("## Launch blockers (fail)", "");
    for (const item of report.summary.failedItems) {
      lines.push(
        `- **${item.label}** (${item.route ?? item.section})${
          item.notes ? ` — ${item.notes}` : ""
        }`
      );
    }
    lines.push("");
  }

  const warnings = items.filter(
    (item) => item.status === "warning" || item.status === "not_checked"
  );
  if (warnings.length > 0) {
    lines.push("## Warnings / not checked", "");
    for (const item of warnings) {
      lines.push(
        `- **${item.label}** [${item.status}]${
          item.notes ? ` — ${item.notes}` : ""
        }`
      );
    }
    lines.push("");
  }

  const sections = [...new Set(items.map((item) => item.section))];
  for (const section of sections) {
    lines.push(`## ${QA_SECTION_LABELS[section]}`, "");
    lines.push("| Item | Route | Status | Notes |");
    lines.push("|------|-------|--------|-------|");
    for (const item of items.filter((i) => i.section === section)) {
      const route = item.route ?? "—";
      const notes = item.notes.replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(
        `| ${item.label} | ${route} | ${item.status} | ${notes || "—"} |`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildProductionQaJson(items: QaCheckItem[]): string {
  return JSON.stringify(buildProductionQaReport(items), null, 2);
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
