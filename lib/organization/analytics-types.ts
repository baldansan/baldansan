/** Organization analytics types — Phase 7 Step 12 */

import type { ClassNeedingAttention } from "@/lib/teacher/analytics-types";

export type OrgAnalyticsResult<T> = {
  data: T | null;
  error: string | null;
  warnings: string[];
};

export type OrganizationOverviewMetrics = {
  organizationId: string;
  organizationName: string;
  classroomCount: number;
  activeClassroomCount: number;
  studentCount: number;
  linkedStudentCount: number;
  assignmentCount: number;
  completedResultCount: number;
  overallCompletionRate: number;
  averageQuizPercentage: number | null;
  classesNeedingAttention: ClassNeedingAttention[];
};

export type OrganizationClassMetricRow = {
  classroomId: string;
  name: string;
  level: string | null;
  teacherUserId: string;
  teacherLabel: string;
  studentCount: number;
  activeStudentCount: number;
  assignmentCount: number;
  completionRate: number;
  averageQuizPercentage: number | null;
  visibility: string;
};

export type OrganizationTeacherSummaryRow = {
  teacherUserId: string;
  displayName: string;
  memberRole: string | null;
  classroomCount: number;
  studentCount: number;
  assignmentCount: number;
  completionRate: number;
  averageQuizPercentage: number | null;
};

export type OrganizationStudentSummaryRow = {
  key: string;
  studentUserId: string | null;
  displayName: string;
  email: string | null;
  classroomCount: number;
  classroomNames: string[];
  assignmentsCompleted: number;
  assignmentsAssigned: number;
  completionRate: number;
  latestQuizPercentage: number | null;
  progressUnavailable: boolean;
};

export type OrganizationAssignmentAnalyticsRow = {
  assignmentId: string;
  title: string;
  lessonId: string;
  classroomId: string;
  classroomName: string | null;
  dueDate: string | null;
  completedCount: number;
  totalCount: number;
  completionRate: number;
  averageQuizPercentage: number | null;
  createdBy: string | null;
};

export type OrganizationReportsData = {
  metrics: OrganizationOverviewMetrics;
  classMetrics: OrganizationClassMetricRow[];
  teacherSummaries: OrganizationTeacherSummaryRow[];
  studentSummaries: OrganizationStudentSummaryRow[];
  assignmentAnalytics: OrganizationAssignmentAnalyticsRow[];
};
