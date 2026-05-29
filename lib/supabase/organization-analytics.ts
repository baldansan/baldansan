import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type {
  OrganizationAssignmentAnalyticsRow,
  OrganizationClassMetricRow,
  OrganizationOverviewMetrics,
  OrganizationReportsData,
  OrganizationStudentSummaryRow,
  OrganizationTeacherSummaryRow,
  OrgAnalyticsResult,
} from "@/lib/organization/analytics-types";
import type { OrganizationMember } from "@/lib/b2b/types";
import type { StudentProgressRow } from "@/lib/teacher/analytics-types";
import { avg, completedStatus, rate } from "@/lib/teacher/report-builder";
import {
  getClassroomProgressAnalytics,
  getClassroomStudentProgress,
} from "@/lib/supabase/teacher-analytics";
import {
  getOrganizationById,
  getOrganizationAssignments,
  getOrganizationClassrooms,
  getOrganizationMembers,
} from "@/lib/supabase/organizations";

function emptyOrgResult<T>(error: string | null = null): OrgAnalyticsResult<T> {
  return { data: null, error, warnings: [] };
}

function withWarnings<T>(
  data: T,
  error: string | null,
  warnings: string[]
): OrgAnalyticsResult<T> {
  return { data, error, warnings };
}

function teacherLabelFor(
  teacherUserId: string,
  members: OrganizationMember[],
  profileNames: Map<string, string>
): string {
  const member = members.find((m) => m.userId === teacherUserId);
  if (member?.displayName) return member.displayName;
  if (member?.email) return member.email;
  const profileName = profileNames.get(teacherUserId);
  if (profileName) return profileName;
  return `Teacher ${teacherUserId.slice(0, 8)}`;
}

async function fetchTeacherProfileNames(
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!supabase || userIds.length === 0) return map;

  const { data } = await supabase
    .from("teacher_profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);

  for (const row of data ?? []) {
    if (row.display_name) {
      map.set(String(row.user_id), String(row.display_name));
    }
  }
  return map;
}

function buildStudentSummaries(
  classMetrics: OrganizationClassMetricRow[],
  studentRowsByClass: Map<string, StudentProgressRow[]>
): OrganizationStudentSummaryRow[] {
  const byKey = new Map<string, OrganizationStudentSummaryRow>();

  for (const classMetric of classMetrics) {
    const rows = studentRowsByClass.get(classMetric.classroomId) ?? [];
    for (const s of rows) {
      const key = s.studentUserId ?? `invite:${s.studentRowId}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.classroomCount += 1;
        if (!existing.classroomNames.includes(classMetric.name)) {
          existing.classroomNames.push(classMetric.name);
        }
        existing.assignmentsCompleted += s.assignmentsCompleted;
        existing.assignmentsAssigned += s.assignmentsAssigned;
        existing.completionRate = rate(
          existing.assignmentsCompleted,
          existing.assignmentsAssigned
        );
        if (
          s.latestQuizPercentage != null &&
          (existing.latestQuizPercentage == null ||
            s.latestQuizPercentage > existing.latestQuizPercentage)
        ) {
          existing.latestQuizPercentage = s.latestQuizPercentage;
        }
        existing.progressUnavailable =
          existing.progressUnavailable && s.progressUnavailable;
      } else {
        byKey.set(key, {
          key,
          studentUserId: s.studentUserId,
          displayName: s.displayName,
          email: s.email,
          classroomCount: 1,
          classroomNames: [classMetric.name],
          assignmentsCompleted: s.assignmentsCompleted,
          assignmentsAssigned: s.assignmentsAssigned,
          completionRate: s.completionRate,
          latestQuizPercentage: s.latestQuizPercentage,
          progressUnavailable: s.progressUnavailable,
        });
      }
    }
  }

  return [...byKey.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

function buildTeacherSummaries(
  classMetrics: OrganizationClassMetricRow[],
  members: OrganizationMember[]
): OrganizationTeacherSummaryRow[] {
  const byTeacher = new Map<string, OrganizationTeacherSummaryRow>();

  for (const c of classMetrics) {
    const existing = byTeacher.get(c.teacherUserId);
    const member = members.find((m) => m.userId === c.teacherUserId);

    if (existing) {
      existing.classroomCount += 1;
      existing.studentCount += c.studentCount;
      existing.assignmentCount += c.assignmentCount;
    } else {
      byTeacher.set(c.teacherUserId, {
        teacherUserId: c.teacherUserId,
        displayName: c.teacherLabel,
        memberRole: member?.role ?? null,
        classroomCount: 1,
        studentCount: c.studentCount,
        assignmentCount: c.assignmentCount,
        completionRate: 0,
        averageQuizPercentage: null,
      });
    }
  }

  for (const row of byTeacher.values()) {
    const teacherClasses = classMetrics.filter(
      (c) => c.teacherUserId === row.teacherUserId
    );
    const completionRates = teacherClasses.map((c) => c.completionRate);
    const quizAvgs = teacherClasses
      .map((c) => c.averageQuizPercentage)
      .filter((p): p is number => p != null);
    row.completionRate = avg(completionRates) ?? 0;
    row.averageQuizPercentage = avg(quizAvgs);
  }

  return [...byTeacher.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

function buildAssignmentAnalytics(
  classMetrics: OrganizationClassMetricRow[],
  analyticsByClass: Map<
    string,
    Awaited<ReturnType<typeof getClassroomProgressAnalytics>>["data"]
  >
): OrganizationAssignmentAnalyticsRow[] {
  const rows: OrganizationAssignmentAnalyticsRow[] = [];

  for (const c of classMetrics) {
    const analytics = analyticsByClass.get(c.classroomId);
    if (!analytics) continue;
    for (const a of analytics.assignmentSummaries) {
      rows.push({
        assignmentId: a.assignmentId,
        title: a.title,
        lessonId: a.lessonId,
        classroomId: c.classroomId,
        classroomName: c.name,
        dueDate: a.dueDate,
        completedCount: a.completedCount,
        totalCount: a.totalCount,
        completionRate: a.completionRate,
        averageQuizPercentage: a.averageQuizPercentage,
        createdBy: null,
      });
    }
  }

  return rows.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getOrganizationOverviewMetrics(
  organizationId: string
): Promise<OrgAnalyticsResult<OrganizationOverviewMetrics>> {
  const full = await getOrganizationReportsData(organizationId);
  if (full.error || !full.data) {
    return emptyOrgResult(full.error);
  }
  return withWarnings(full.data.metrics, null, full.warnings);
}

export async function getOrganizationReportsData(
  organizationId: string
): Promise<OrgAnalyticsResult<OrganizationReportsData>> {
  if (!hasSupabaseConfig || !supabase) {
    return emptyOrgResult("Supabase is not configured.");
  }

  const warnings: string[] = [];

  const [orgRes, classroomsRes, assignmentsRes, membersRes] = await Promise.all([
    getOrganizationById(organizationId),
    getOrganizationClassrooms(organizationId),
    getOrganizationAssignments(organizationId),
    getOrganizationMembers(organizationId),
  ]);

  if (orgRes.error || !orgRes.data) {
    return emptyOrgResult(orgRes.error ?? "Organization not found.");
  }

  const org = orgRes.data;
  const classrooms = classroomsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];
  const members = membersRes.data ?? [];

  if (classroomsRes.error) warnings.push(classroomsRes.error);
  if (assignmentsRes.error) warnings.push(assignmentsRes.error);
  if (membersRes.error) warnings.push(membersRes.error);

  const teacherIds = [...new Set(classrooms.map((c) => c.teacherUserId))];
  const profileNames = await fetchTeacherProfileNames(teacherIds);

  const classMetrics: OrganizationClassMetricRow[] = [];
  const studentRowsByClass = new Map<string, StudentProgressRow[]>();
  const analyticsByClass = new Map<
    string,
    NonNullable<
      Awaited<ReturnType<typeof getClassroomProgressAnalytics>>["data"]
    >
  >();

  let completedResultCount = 0;
  let linkedStudentCount = 0;
  let studentCount = 0;
  const allQuizPercents: number[] = [];
  let totalPossible = 0;
  let totalCompleted = 0;

  const classResults = await Promise.all(
    classrooms.map(async (classroom) => {
      const [analyticsRes, studentsRes] = await Promise.all([
        getClassroomProgressAnalytics(classroom.id),
        getClassroomStudentProgress(classroom.id),
      ]);
      return { classroom, analyticsRes, studentsRes };
    })
  );

  for (const { classroom, analyticsRes, studentsRes } of classResults) {
    warnings.push(...analyticsRes.warnings, ...studentsRes.warnings);
    if (!analyticsRes.data) continue;

    analyticsByClass.set(classroom.id, analyticsRes.data);
    studentRowsByClass.set(classroom.id, studentsRes.data ?? []);

    const analytics = analyticsRes.data;
    studentCount += analytics.totalStudents;
    linkedStudentCount += (studentsRes.data ?? []).filter(
      (s) => s.studentUserId
    ).length;
    completedResultCount += analytics.completedAssignmentsCount;

    const linked = (studentsRes.data ?? []).filter((s) => s.studentUserId)
      .length;
    totalPossible += linked * analytics.assignmentsCount;
    totalCompleted += analytics.completedAssignmentsCount;

    for (const a of analytics.assignmentSummaries) {
      if (a.averageQuizPercentage != null) {
        allQuizPercents.push(a.averageQuizPercentage);
      }
    }

    classMetrics.push({
      classroomId: classroom.id,
      name: classroom.name,
      level: classroom.level,
      teacherUserId: classroom.teacherUserId,
      teacherLabel: teacherLabelFor(
        classroom.teacherUserId,
        members,
        profileNames
      ),
      studentCount: analytics.totalStudents,
      activeStudentCount: analytics.activeStudents,
      assignmentCount: analytics.assignmentsCount,
      completionRate: analytics.completionRate,
      averageQuizPercentage: analytics.averageQuizPercentage,
      visibility: classroom.visibility,
    });
  }

  const classesNeedingAttention = classMetrics
    .filter(
      (c) =>
        c.studentCount === 0 ||
        c.assignmentCount === 0 ||
        (c.averageQuizPercentage != null && c.averageQuizPercentage < 70)
    )
    .map((c) => ({
      classroomId: c.classroomId,
      name: c.name,
      reason:
        c.studentCount === 0
          ? "No students enrolled"
          : c.assignmentCount === 0
            ? "No assignments yet"
            : "Average quiz below 70%",
    }));

  const metrics: OrganizationOverviewMetrics = {
    organizationId,
    organizationName: org.name,
    classroomCount: classrooms.length,
    activeClassroomCount: classrooms.filter((c) => c.status === "active").length,
    studentCount,
    linkedStudentCount,
    assignmentCount: assignments.length,
    completedResultCount,
    overallCompletionRate: rate(totalCompleted, totalPossible),
    averageQuizPercentage: avg(allQuizPercents),
    classesNeedingAttention,
  };

  const teacherSummaries = buildTeacherSummaries(classMetrics, members);
  const studentSummaries = buildStudentSummaries(classMetrics, studentRowsByClass);
  let assignmentAnalytics = buildAssignmentAnalytics(classMetrics, analyticsByClass);

  const createdByMap = new Map(assignments.map((a) => [a.id, a.createdBy]));
  assignmentAnalytics = assignmentAnalytics.map((row) => ({
    ...row,
    createdBy: createdByMap.get(row.assignmentId) ?? null,
  }));

  return withWarnings(
    {
      metrics,
      classMetrics,
      teacherSummaries,
      studentSummaries,
      assignmentAnalytics,
    },
    null,
    warnings
  );
}

export { completedStatus };
