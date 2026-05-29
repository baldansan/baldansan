import { downloadLaunchReportFile } from "@/lib/admin/launch-candidate-report";
import {
  PRODUCTION_URL,
  SIGNOFF_SUMMARY_CARDS,
  type LaunchSignoffState,
  type SignoffCheckStatus,
  type SignoffDecisionValue,
} from "@/lib/admin/launch-signoff-data";

export type LaunchSignoffSummary = {
  total: number;
  pass: number;
  warning: number;
  fail: number;
  not_checked: number;
  failedItems: LaunchSignoffState["items"];
  warningItems: LaunchSignoffState["items"];
  cardFailCount: number;
  recommendedNextAction: string;
};

export type LaunchSignoffReport = {
  productionUrl: string;
  generatedAt: string;
  versionLabel: string;
  owner: string;
  decision: SignoffDecisionValue;
  decisionUpdatedAt: string;
  launchNotes: string;
  knownIssues: string;
  finalDecisionNote: string;
  summary: LaunchSignoffSummary;
  statusCards: Array<{ id: string; label: string; status: SignoffCheckStatus }>;
  checklist: Array<{
    id: string;
    label: string;
    status: SignoffCheckStatus;
    notes: string;
  }>;
  recommendedNextAction: string;
};

function countStatus(
  items: { status: SignoffCheckStatus }[],
  status: SignoffCheckStatus
) {
  return items.filter((i) => i.status === status).length;
}

export function summarizeLaunchSignoff(
  state: LaunchSignoffState
): LaunchSignoffSummary {
  const { items, cards, decision } = state;
  const failedItems = items.filter((i) => i.status === "fail");
  const warningItems = items.filter((i) => i.status === "warning");
  const cardFailCount = cards.filter((c) => c.status === "fail").length;

  let recommendedNextAction =
    "Complete final sign-off checklist and record go/no-go decision.";
  if (decision.value === "blocked" || failedItems.length > 0 || cardFailCount > 0) {
    recommendedNextAction =
      "Resolve blockers before go-live. Review ROLLBACK_PLAN.md if needed.";
  } else if (decision.value === "go_live") {
    recommendedNextAction =
      "Go-live approved — follow GO_LIVE_NOTES.md and POST_LAUNCH_MONITORING.md.";
  } else if (decision.value === "needs_review") {
    recommendedNextAction =
      "Document open warnings and obtain stakeholder sign-off.";
  } else if (
    warningItems.length > 0 ||
    countStatus(items, "not_checked") > 0
  ) {
    recommendedNextAction =
      "Finish unchecked items and review warnings before go_live.";
  }

  return {
    total: items.length,
    pass: countStatus(items, "pass"),
    warning: warningItems.length,
    fail: failedItems.length,
    not_checked: countStatus(items, "not_checked"),
    failedItems,
    warningItems,
    cardFailCount,
    recommendedNextAction,
  };
}

export function buildLaunchSignoffReport(
  state: LaunchSignoffState
): LaunchSignoffReport {
  const summary = summarizeLaunchSignoff(state);
  return {
    productionUrl: PRODUCTION_URL,
    generatedAt: new Date().toISOString(),
    versionLabel: state.meta.versionLabel,
    owner: state.meta.owner,
    decision: state.decision.value,
    decisionUpdatedAt: state.decision.updatedAt,
    launchNotes: state.meta.launchNotes,
    knownIssues: state.meta.knownIssues,
    finalDecisionNote: state.meta.finalDecisionNote,
    summary,
    statusCards: state.cards.map((card) => {
      const def = SIGNOFF_SUMMARY_CARDS.find((c) => c.id === card.id);
      return {
        id: card.id,
        label: def?.label ?? card.id,
        status: card.status,
      };
    }),
    checklist: state.items.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      notes: item.notes,
    })),
    recommendedNextAction: summary.recommendedNextAction,
  };
}

export function buildLaunchSignoffMarkdown(state: LaunchSignoffState): string {
  const report = buildLaunchSignoffReport(state);
  const lines: string[] = [
    "# Buunduu Surtsgaay — Production Launch Sign-off Report",
    "",
    `- **Production URL:** ${report.productionUrl}`,
    `- **Generated:** ${report.generatedAt}`,
    `- **Version:** ${report.versionLabel}`,
    `- **Owner:** ${report.owner || "—"}`,
    `- **Decision:** ${report.decision}`,
    `- **Decision updated:** ${report.decisionUpdatedAt}`,
    `- **Recommended next action:** ${report.recommendedNextAction}`,
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "|--------|-------|",
    `| Pass | ${report.summary.pass} |`,
    `| Warning | ${report.summary.warning} |`,
    `| Fail | ${report.summary.fail} |`,
    `| Not checked | ${report.summary.not_checked} |`,
    `| Status card fails | ${report.summary.cardFailCount} |`,
    "",
  ];

  if (report.launchNotes.trim()) {
    lines.push("## Launch notes", "", report.launchNotes.trim(), "");
  }
  if (report.knownIssues.trim()) {
    lines.push("## Known issues", "", report.knownIssues.trim(), "");
  }
  if (report.finalDecisionNote.trim()) {
    lines.push("## Final decision note", "", report.finalDecisionNote.trim(), "");
  }

  if (report.summary.failedItems.length > 0) {
    lines.push("## Launch blockers (fail)", "");
    for (const item of report.summary.failedItems) {
      lines.push(`- **${item.label}**${item.notes ? ` — ${item.notes}` : ""}`);
    }
    lines.push("");
  }

  if (report.summary.warningItems.length > 0) {
    lines.push("## Warnings", "");
    for (const item of report.summary.warningItems) {
      lines.push(`- **${item.label}**${item.notes ? ` — ${item.notes}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Sign-off summary cards", "", "| Card | Status |", "|------|--------|");
  for (const card of report.statusCards) {
    lines.push(`| ${card.label} | ${card.status} |`);
  }
  lines.push("");

  lines.push("## Final sign-off checklist", "", "| Check | Status | Notes |");
  lines.push("|-------|--------|-------|");
  for (const item of report.checklist) {
    const notes = item.notes.replace(/\|/g, "\\|").replace(/\n/g, " ") || "—";
    lines.push(`| ${item.label} | ${item.status} | ${notes} |`);
  }
  lines.push("");

  return lines.join("\n");
}

export function buildLaunchSignoffJson(state: LaunchSignoffState): string {
  return JSON.stringify(buildLaunchSignoffReport(state), null, 2);
}

export function downloadSignoffReportFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  downloadLaunchReportFile(content, filename, mimeType);
}
