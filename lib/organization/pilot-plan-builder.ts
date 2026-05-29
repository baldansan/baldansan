import type {
  OrganizationOnboarding,
  OrganizationOnboardingTask,
  OrganizationPilotSummary,
  PilotReadiness,
} from "@/lib/b2b/types";
import type { Assignment, Classroom } from "@/lib/classroom/types";
import type { OrganizationMember } from "@/lib/b2b/types";

export type PilotPlanData = {
  organization: {
    id: string;
    name: string;
    type: string;
    status: string;
    email: string | null;
    phone: string | null;
  };
  onboarding: OrganizationOnboarding | null;
  readiness: PilotReadiness;
  tasks: OrganizationOnboardingTask[];
  members: OrganizationMember[];
  classrooms: Classroom[];
  assignments: Assignment[];
};

export function buildPilotPlanMarkdown(data: PilotPlanData): string {
  const lines = [
    "# Pilot Plan — Buunduu Surtsgaay",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Organization",
    "",
    `- **Name:** ${data.organization.name}`,
    `- **Type:** ${data.organization.type}`,
    `- **Status:** ${data.organization.status}`,
    `- **Email:** ${data.organization.email ?? "—"}`,
    `- **Phone:** ${data.organization.phone ?? "—"}`,
    "",
  ];

  if (data.onboarding) {
    lines.push(
      "## Pilot targets",
      "",
      `- **Target start:** ${data.onboarding.targetStartDate ?? "—"}`,
      `- **Target students:** ${data.onboarding.targetStudentCount ?? "—"}`,
      `- **Pilot goal:** ${data.onboarding.pilotGoal ?? "—"}`,
      `- **Onboarding status:** ${data.onboarding.onboardingStatus}`,
      `- **Pilot stage:** ${data.onboarding.pilotStage}`,
      ""
    );
    if (data.onboarding.onboardingNote) {
      lines.push("### Notes", "", data.onboarding.onboardingNote, "");
    }
  }

  lines.push(
    "## Readiness",
    "",
    `- **Score:** ${data.readiness.score}/100`,
    `- **Ready:** ${data.readiness.ready ? "Yes" : "No"}`,
    `- **Tasks completed:** ${data.readiness.completedCount}/${data.readiness.totalCount}`,
    ""
  );

  if (data.readiness.blockers.length > 0) {
    lines.push("### Blockers", "");
    for (const b of data.readiness.blockers) lines.push(`- ${b}`);
    lines.push("");
  }

  if (data.readiness.warnings.length > 0) {
    lines.push("### Warnings", "");
    for (const w of data.readiness.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  lines.push("## Team", "");
  for (const m of data.members) {
    lines.push(
      `- ${m.displayName ?? m.email ?? "Member"} · ${m.role} · ${m.status}`
    );
  }
  lines.push("");

  lines.push("## Classrooms", "");
  if (data.classrooms.length === 0) {
    lines.push("- (none yet)");
  } else {
    for (const c of data.classrooms) {
      lines.push(
        `- ${c.name} · ${c.level ?? "—"} · ${c.studentCount ?? 0} students · ${c.assignmentCount ?? 0} assignments`
      );
    }
  }
  lines.push("");

  lines.push("## Assignments", "");
  if (data.assignments.length === 0) {
    lines.push("- (none yet)");
  } else {
    for (const a of data.assignments) {
      lines.push(
        `- ${a.title} · ${a.classroomName ?? "class"} · Lesson ${a.lessonId}`
      );
    }
  }
  lines.push("");

  lines.push("## Onboarding tasks", "");
  for (const t of data.tasks) {
    lines.push(`- [${t.status === "completed" ? "x" : " "}] ${t.title}`);
  }
  lines.push("");

  lines.push(
    "## Success criteria",
    "",
    "- Owner/manager and teacher onboarded",
    "- At least one organization classroom with demo students",
    "- First assignment completed by a linked student",
    "- Teacher or manager reviews organization report",
    "",
    "## Risks",
    "",
    "- Students not linked via student_user_id",
    "- Incomplete organization contact info",
    "- Pending member invites",
    "",
    "## Next actions",
    ""
  );

  for (const t of data.tasks.filter((x) => x.status !== "completed").slice(0, 5)) {
    lines.push(`- ${t.title}`);
  }

  return lines.join("\n");
}

export function buildPilotPlanJson(data: PilotPlanData): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      organization: data.organization,
      onboarding: data.onboarding,
      readiness: data.readiness,
      tasks: data.tasks.map((t) => ({
        taskKey: t.taskKey,
        title: t.title,
        status: t.status,
        category: t.category,
      })),
      teamCount: data.members.length,
      classroomCount: data.classrooms.length,
      assignmentCount: data.assignments.length,
    },
    null,
    2
  );
}

export function buildPilotChecklistMarkdown(data: PilotPlanData): string {
  const lines = [
    "# Pilot Checklist — Buunduu Surtsgaay",
    "",
    `Organization: ${data.organization.name}`,
    "",
  ];
  for (const t of data.tasks) {
    const mark = t.status === "completed" ? "[x]" : "[ ]";
    lines.push(`${mark} ${t.title}`);
  }
  lines.push("", `Readiness: ${data.readiness.score}% — ${data.readiness.ready ? "READY" : "NEEDS WORK"}`);
  return lines.join("\n");
}
