import type {
  AssignmentAnalytics,
  AnalyticsResult,
  ClassroomProgressAnalytics,
  RecentClassActivity,
  StudentProgressRow,
  TeacherAssignmentSummaryItem,
  TeacherOverviewMetrics,
} from "@/lib/teacher/analytics-types";
import type { Assignment, AssignmentResult, ClassroomStudent } from "@/lib/classroom/types";

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function rate(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

function emptyResult<T>(error: string | null = null): AnalyticsResult<T> {
  return { data: null, error, warnings: [] };
}

function completedStatus(status: string): boolean {
  return status === "completed";
}

function startedStatus(status: string): boolean {
  return status === "in_progress" || status === "completed";
}

export function buildClassReportMarkdown(
  analytics: ClassroomProgressAnalytics,
  students: StudentProgressRow[]
): string {
  const lines = [
    "# Class Report — Buunduu Surtsgaay",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `## ${analytics.classroom.name}`,
    "",
    `- Level: ${analytics.classroom.level ?? "—"}`,
    `- Students: ${analytics.totalStudents} (${analytics.activeStudents} active)`,
    `- Assignments: ${analytics.assignmentsCount}`,
    `- Completion rate: ${analytics.completionRate}%`,
    `- Average quiz: ${analytics.averageQuizPercentage ?? "—"}%`,
    "",
  ];

  if (analytics.needsAttention.length > 0) {
    lines.push("## Needs attention", "");
    for (const item of analytics.needsAttention) {
      lines.push(`- **${item.kind}:** ${item.label}${item.detail ? ` — ${item.detail}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Students", "");
  lines.push("| Student | Status | Completed | Rate | Latest quiz |");
  lines.push("|---------|--------|-----------|------|-------------|");
  for (const s of students) {
    lines.push(
      `| ${s.displayName} | ${s.status} | ${s.assignmentsCompleted}/${s.assignmentsAssigned} | ${s.completionRate}% | ${s.latestQuizPercentage ?? "—"}% |`
    );
  }
  lines.push("");

  lines.push("## Assignments", "");
  for (const a of analytics.assignmentSummaries) {
    lines.push(
      `- ${a.title} (Lesson ${a.lessonId}): ${a.completedCount}/${a.totalCount} (${a.completionRate}%)`
    );
  }
  lines.push("");

  lines.push("## Recommended actions", "");
  lines.push("- Review students with 0 completions");
  lines.push("- Classroom review for quiz scores below 70%");
  lines.push("- Link invited students to accounts (student_user_id)");

  return lines.join("\n");
}

export function buildAssignmentReportMarkdown(
  analytics: AssignmentAnalytics
): string {
  const a = analytics.assignment;
  const lines = [
    "# Assignment Report — Buunduu Surtsgaay",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `## ${a.title}`,
    "",
    `- Class: ${a.classroomName ?? "—"}`,
    `- Lesson: ${a.lessonId}`,
    `- Type: ${a.assignmentType}`,
    `- Due: ${a.dueDate ?? "—"}`,
    `- Completion: ${analytics.completedCount}/${analytics.totalStudents} (${analytics.completionRate}%)`,
    `- Average quiz: ${analytics.averageQuizPercentage ?? "—"}%`,
    "",
    "## Student results",
    "",
    "| Student | Status | Quiz | Completed |",
    "|---------|--------|------|-----------|",
  ];

  for (const r of analytics.studentResults) {
    lines.push(
      `| ${r.displayName} | ${r.status} | ${r.quizPercentage ?? "—"}% | ${r.completedAt ?? "—"} |`
    );
  }

  if (analytics.missingStudents.length > 0) {
    lines.push("", "## Not started / missing", "");
    for (const m of analytics.missingStudents) {
      lines.push(`- ${m.displayName}: ${m.reason}`);
    }
  }

  lines.push("", "## Recommended actions", "");
  lines.push("- Follow up with students who have not started");
  lines.push("- Review incorrect quiz items in class");

  return lines.join("\n");
}

export function buildTeacherOverviewReportMarkdown(
  metrics: TeacherOverviewMetrics,
  assignmentSummary: TeacherAssignmentSummaryItem[]
): string {
  const lines = [
    "# Teacher Overview Report — Buunduu Surtsgaay",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Classrooms: ${metrics.classroomCount} (${metrics.activeClassroomCount} active)`,
    `- Students: ${metrics.studentCount}`,
    `- Assignments: ${metrics.assignmentCount}`,
    `- Completed results: ${metrics.completedResultCount}`,
    `- Average quiz: ${metrics.averageQuizPercentage ?? "—"}%`,
    "",
  ];

  if (metrics.classesNeedingAttention.length > 0) {
    lines.push("## Classes needing attention", "");
    for (const c of metrics.classesNeedingAttention) {
      lines.push(`- ${c.name}: ${c.reason}`);
    }
    lines.push("");
  }

  if (assignmentSummary.length > 0) {
    lines.push("## Assignments", "");
    for (const a of assignmentSummary) {
      lines.push(
        `- ${a.title} (${a.classroomName}): ${a.completionRate}% avg quiz ${a.averageQuizPercentage ?? "—"}%`
      );
    }
  }

  return lines.join("\n");
}

export type { AssignmentResult, ClassroomStudent };

export { avg, rate, completedStatus, startedStatus, emptyResult };
