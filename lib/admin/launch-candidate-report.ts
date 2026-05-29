import {
  KNOWN_LAUNCH_LIMITATIONS,
  PRODUCTION_URL,
  LAUNCH_SECTION_LABELS,
  LAUNCH_STATUS_CARDS,
  type LaunchCardState,
  type LaunchCheckItem,
  type LaunchCheckStatus,
  type LaunchDecisionState,
  type LaunchDecisionValue,
} from "@/lib/admin/launch-candidate-data";

export type LaunchCandidateSummary = {
  total: number;
  pass: number;
  warning: number;
  fail: number;
  not_checked: number;
  failedItems: LaunchCheckItem[];
  warningItems: LaunchCheckItem[];
  cardFailCount: number;
  recommendedNextAction: string;
};

export type LaunchCandidateReport = {
  productionUrl: string;
  generatedAt: string;
  decision: LaunchDecisionValue;
  decisionUpdatedAt: string;
  summary: LaunchCandidateSummary;
  statusCards: Array<{
    id: string;
    label: string;
    status: LaunchCheckStatus;
  }>;
  smokeTests: Array<{
    id: string;
    section: string;
    sectionLabel: string;
    label: string;
    status: LaunchCheckStatus;
    notes: string;
  }>;
  knownLimitations: string[];
  recommendedNextAction: string;
};

function countStatus(items: { status: LaunchCheckStatus }[], status: LaunchCheckStatus) {
  return items.filter((i) => i.status === status).length;
}

export function summarizeLaunchCandidate(
  items: LaunchCheckItem[],
  cards: LaunchCardState[],
  decision: LaunchDecisionState
): LaunchCandidateSummary {
  const failedItems = items.filter((i) => i.status === "fail");
  const warningItems = items.filter((i) => i.status === "warning");
  const cardFailCount = cards.filter((c) => c.status === "fail").length;

  let recommendedNextAction =
    "Complete smoke test checklist and mark launch decision.";
  if (failedItems.length > 0 || cardFailCount > 0) {
    recommendedNextAction =
      "Resolve fail items and status cards before go-live.";
  } else if (decision.value === "launch_candidate") {
    recommendedNextAction =
      "Launch candidate approved — follow GO_LIVE_NOTES.md for release.";
  } else if (decision.value === "needs_review") {
    recommendedNextAction =
      "Document open warnings and obtain sign-off before release.";
  } else if (
    warningItems.length > 0 ||
    countStatus(items, "not_checked") > 0
  ) {
    recommendedNextAction =
      "Finish unchecked items and review warnings.";
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

export function buildLaunchCandidateReport(
  items: LaunchCheckItem[],
  cards: LaunchCardState[],
  decision: LaunchDecisionState
): LaunchCandidateReport {
  const summary = summarizeLaunchCandidate(items, cards, decision);
  return {
    productionUrl: PRODUCTION_URL,
    generatedAt: new Date().toISOString(),
    decision: decision.value,
    decisionUpdatedAt: decision.updatedAt,
    summary,
    statusCards: cards.map((card) => {
      const def = LAUNCH_STATUS_CARDS.find((c) => c.id === card.id);
      return {
        id: card.id,
        label: def?.label ?? card.id,
        status: card.status,
      };
    }),
    smokeTests: items.map((item) => ({
      id: item.id,
      section: item.section,
      sectionLabel: LAUNCH_SECTION_LABELS[item.section],
      label: item.label,
      status: item.status,
      notes: item.notes,
    })),
    knownLimitations: KNOWN_LAUNCH_LIMITATIONS,
    recommendedNextAction: summary.recommendedNextAction,
  };
}

export function buildLaunchCandidateMarkdown(
  items: LaunchCheckItem[],
  cards: LaunchCardState[],
  decision: LaunchDecisionState
): string {
  const report = buildLaunchCandidateReport(items, cards, decision);
  const lines: string[] = [
    "# Buunduu Surtsgaay — Launch Candidate Report",
    "",
    `- **Production URL:** ${report.productionUrl}`,
    `- **Generated:** ${report.generatedAt}`,
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

  lines.push("## Launch status cards", "", "| Card | Status |", "|------|--------|");
  for (const card of report.statusCards) {
    lines.push(`| ${card.label} | ${card.status} |`);
  }
  lines.push("");

  const sections = [...new Set(items.map((i) => i.section))];
  for (const section of sections) {
    lines.push(`## ${LAUNCH_SECTION_LABELS[section]}`, "");
    lines.push("| Test | Status | Notes |");
    lines.push("|------|--------|-------|");
    for (const item of items.filter((i) => i.section === section)) {
      const notes = item.notes.replace(/\|/g, "\\|").replace(/\n/g, " ") || "—";
      lines.push(`| ${item.label} | ${item.status} | ${notes} |`);
    }
    lines.push("");
  }

  lines.push("## Known limitations", "");
  for (const limit of report.knownLimitations) {
    lines.push(`- ${limit}`);
  }
  lines.push("");

  return lines.join("\n");
}

export function buildLaunchCandidateJson(
  items: LaunchCheckItem[],
  cards: LaunchCardState[],
  decision: LaunchDecisionState
): string {
  return JSON.stringify(
    buildLaunchCandidateReport(items, cards, decision),
    null,
    2
  );
}

export function downloadLaunchReportFile(
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
