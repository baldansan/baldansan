import type {
  OrganizationAssignmentAnalyticsRow,
  OrganizationClassMetricRow,
  OrganizationOverviewMetrics,
  OrganizationReportsData,
  OrganizationStudentSummaryRow,
  OrganizationTeacherSummaryRow,
} from "@/lib/organization/analytics-types";

export function buildOrganizationReportMarkdown(
  data: OrganizationReportsData
): string {
  const m = data.metrics;
  const lines = [
    "# Organization Report — Buunduu Surtsgaay",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `## ${m.organizationName}`,
    "",
    "### Summary",
    "",
    `- Classrooms: ${m.classroomCount} (${m.activeClassroomCount} active)`,
    `- Students: ${m.studentCount} (${m.linkedStudentCount} linked accounts)`,
    `- Assignments: ${m.assignmentCount}`,
    `- Completed results: ${m.completedResultCount}`,
    `- Overall completion rate: ${m.overallCompletionRate}%`,
    `- Average quiz: ${m.averageQuizPercentage ?? "—"}%`,
    "",
  ];

  if (m.classesNeedingAttention.length > 0) {
    lines.push("### Classes needing attention", "");
    for (const c of m.classesNeedingAttention) {
      lines.push(`- ${c.name}: ${c.reason}`);
    }
    lines.push("");
  }

  if (data.teacherSummaries.length > 0) {
    lines.push("## Teacher performance", "");
    lines.push("| Teacher | Classes | Students | Assignments | Completion | Avg quiz |");
    lines.push("|---------|---------|----------|-------------|------------|----------|");
    for (const t of data.teacherSummaries) {
      lines.push(
        `| ${t.displayName} | ${t.classroomCount} | ${t.studentCount} | ${t.assignmentCount} | ${t.completionRate}% | ${t.averageQuizPercentage ?? "—"}% |`
      );
    }
    lines.push("");
  }

  if (data.classMetrics.length > 0) {
    lines.push("## Class metrics", "");
    lines.push("| Class | Teacher | Students | Assignments | Completion | Avg quiz |");
    lines.push("|-------|---------|----------|-------------|------------|----------|");
    for (const c of data.classMetrics) {
      lines.push(
        `| ${c.name} | ${c.teacherLabel} | ${c.studentCount} | ${c.assignmentCount} | ${c.completionRate}% | ${c.averageQuizPercentage ?? "—"}% |`
      );
    }
    lines.push("");
  }

  if (data.assignmentAnalytics.length > 0) {
    lines.push("## Assignment completion", "");
    for (const a of data.assignmentAnalytics) {
      lines.push(
        `- ${a.title} (${a.classroomName ?? "class"}): ${a.completedCount}/${a.totalCount} (${a.completionRate}%) · avg ${a.averageQuizPercentage ?? "—"}%`
      );
    }
    lines.push("");
  }

  if (data.studentSummaries.length > 0) {
    lines.push("## Student progress (top rows)", "");
    lines.push("| Student | Classes | Completed | Rate | Latest quiz |");
    lines.push("|---------|---------|-----------|------|-------------|");
    for (const s of data.studentSummaries.slice(0, 30)) {
      lines.push(
        `| ${s.displayName} | ${s.classroomCount} | ${s.assignmentsCompleted}/${s.assignmentsAssigned} | ${s.completionRate}% | ${s.latestQuizPercentage ?? "—"}% |`
      );
    }
    lines.push("");
  }

  lines.push("## Recommended actions", "");
  lines.push("- Review classes with 0 students or 0 assignments");
  lines.push("- Follow up on students with low completion rates");
  lines.push("- Link invited students to accounts (student_user_id)");
  lines.push("- Schedule classroom review for quiz averages below 70%");

  return lines.join("\n");
}

export function buildOrganizationOverviewMarkdown(
  metrics: OrganizationOverviewMetrics,
  classMetrics: OrganizationClassMetricRow[]
): string {
  return buildOrganizationReportMarkdown({
    metrics,
    classMetrics,
    teacherSummaries: [],
    studentSummaries: [],
    assignmentAnalytics: [],
  });
}
