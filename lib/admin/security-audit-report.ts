import {
  PRODUCTION_URL,
  type SecurityAuditCheck,
  type SecurityAuditReport,
  getSecurityBlockers,
  getSecurityWarnings,
} from "@/lib/admin/security-audit-checks";

export type SecurityAuditSummary = {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  manual: number;
  skip: number;
  blockers: SecurityAuditCheck[];
  warnings: SecurityAuditCheck[];
  launchRecommendation: "ready" | "needs review" | "blocked";
};

export type SecurityAuditExport = {
  productionUrl: string;
  generatedAt: string;
  summary: SecurityAuditSummary;
  checks: SecurityAuditCheck[];
  launchRecommendation: "ready" | "needs review" | "blocked";
  launchRecommendationReason: string;
};

function countResult(
  checks: SecurityAuditCheck[],
  result: SecurityAuditCheck["result"]
): number {
  return checks.filter((c) => c.result === result).length;
}

export function summarizeSecurityAudit(
  checks: SecurityAuditCheck[]
): SecurityAuditSummary {
  const blockers = getSecurityBlockers(checks);
  const warnings = getSecurityWarnings(checks);
  const manualCount = countResult(checks, "manual");

  let launchRecommendation: SecurityAuditSummary["launchRecommendation"] =
    "ready";
  if (blockers.length > 0) {
    launchRecommendation = "blocked";
  } else if (warnings.length > 0 || manualCount > 0) {
    launchRecommendation = "needs review";
  }

  return {
    total: checks.length,
    pass: countResult(checks, "pass"),
    warn: warnings.length,
    fail: blockers.length,
    manual: manualCount,
    skip: countResult(checks, "skip"),
    blockers,
    warnings,
    launchRecommendation,
  };
}

function recommendationReason(summary: SecurityAuditSummary): string {
  if (summary.launchRecommendation === "blocked") {
    return `${summary.fail} automatic fail(s) — resolve before launch.`;
  }
  if (summary.launchRecommendation === "needs review") {
    return `Review ${summary.warn} warning(s) and ${summary.manual} manual check(s).`;
  }
  return "No automatic security blockers — complete manual Auth/RLS checklist.";
}

export function buildSecurityAuditReport(
  report: SecurityAuditReport
): SecurityAuditExport {
  const summary = summarizeSecurityAudit(report.checks);
  return {
    productionUrl: report.productionUrl,
    generatedAt: report.ranAt,
    summary,
    checks: report.checks,
    launchRecommendation: summary.launchRecommendation,
    launchRecommendationReason: recommendationReason(summary),
  };
}

export function buildSecurityAuditMarkdown(
  report: SecurityAuditReport
): string {
  const exported = buildSecurityAuditReport(report);
  const lines: string[] = [
    "# Buunduu Surtsgaay — Security / RLS Audit Report",
    "",
    `- **Production URL:** ${exported.productionUrl}`,
    `- **Generated:** ${exported.generatedAt}`,
    `- **Launch recommendation:** ${exported.launchRecommendation}`,
    `- **Reason:** ${exported.launchRecommendationReason}`,
    "",
    "## Summary",
    "",
    "| Result | Count |",
    "|--------|-------|",
    `| Pass | ${exported.summary.pass} |`,
    `| Warn | ${exported.summary.warn} |`,
    `| Fail | ${exported.summary.fail} |`,
    `| Manual | ${exported.summary.manual} |`,
    `| Skip | ${exported.summary.skip} |`,
    "",
  ];

  if (exported.summary.blockers.length > 0) {
    lines.push("## Launch blockers (fail)", "");
    for (const item of exported.summary.blockers) {
      lines.push(`- **${item.label}** — ${item.detail ?? ""}`);
    }
    lines.push("");
  }

  if (exported.summary.warnings.length > 0) {
    lines.push("## Warnings", "");
    for (const item of exported.summary.warnings) {
      lines.push(`- **${item.label}** — ${item.detail ?? ""}`);
    }
    lines.push("");
  }

  const groups = [...new Set(report.checks.map((c) => c.group))];
  for (const group of groups) {
    lines.push(`## ${group.replace(/_/g, " ")}`, "");
    lines.push("| Check | Result | Details |");
    lines.push("|-------|--------|---------|");
    for (const item of report.checks.filter((c) => c.group === group)) {
      const detail = (item.detail ?? "—").replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(`| ${item.label} | ${item.result} | ${detail} |`);
    }
    lines.push("");
  }

  lines.push(
    "See [SECURITY_RLS_AUDIT.md](./SECURITY_RLS_AUDIT.md) and run `supabase/verify/production_verification.sql` in Supabase SQL Editor."
  );

  return lines.join("\n");
}

export function buildSecurityAuditJson(report: SecurityAuditReport): string {
  return JSON.stringify(buildSecurityAuditReport(report), null, 2);
}

export function downloadSecurityAuditFile(
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

export { PRODUCTION_URL };
